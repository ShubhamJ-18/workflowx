const { prisma } = require('../../config/prisma');
const { ROLES, ACTIVITY_ACTIONS } = require('@workflowx/shared');
const { generateRandomToken, hashToken } = require('../../utils/crypto');
const { env, isProduction } = require('../../config/env');
const { logger } = require('../../utils/logger');

/**
 * Creates an activity log entry.
 */
async function logActivity({ teamId, actorId, entityType, entityId, action, metadata = null }) {
  try {
    await prisma.activityLog.create({
      data: {
        teamId,
        actorId,
        entityType,
        entityId,
        action,
        metadata: metadata || undefined,
      },
    });
  } catch (err) {
    logger.warn('Failed to record activity log', { error: err.message });
  }
}

/**
 * List teams for a specific user.
 */
async function getUserTeams(userId) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          _count: {
            select: {
              members: true,
              projects: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    description: m.team.description,
    role: m.role,
    createdAt: m.team.createdAt,
    memberCount: m.team._count.members,
    projectCount: m.team._count.projects,
  }));
}

/**
 * Create a new team.
 */
async function createTeam(userId, { name, description }) {
  return prisma.$transaction(async (tx) => {
    const team = await tx.team.create({
      data: {
        name,
        description,
        createdBy: userId,
      },
    });

    const membership = await tx.teamMember.create({
      data: {
        teamId: team.id,
        userId,
        role: ROLES.OWNER,
      },
    });

    await tx.activityLog.create({
      data: {
        teamId: team.id,
        actorId: userId,
        entityType: 'TEAM',
        entityId: team.id,
        action: ACTIVITY_ACTIONS.CREATED,
        metadata: { teamName: team.name },
      },
    });

    return {
      ...team,
      role: membership.role,
      memberCount: 1,
      projectCount: 0,
    };
  });
}

/**
 * Get details for a team.
 */
async function getTeamDetails(teamId, userId) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
      projects: {
        include: {
          _count: { select: { tasks: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!team) {
    const error = new Error('Team not found.');
    error.statusCode = 404;
    throw error;
  }

  const userMembership = team.members.find((m) => m.userId === userId);

  return {
    ...team,
    userRole: userMembership ? userMembership.role : null,
  };
}

/**
 * Update team info.
 */
async function updateTeam(teamId, actorId, { name, description }) {
  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
    },
  });

  await logActivity({
    teamId,
    actorId,
    entityType: 'TEAM',
    entityId: teamId,
    action: ACTIVITY_ACTIONS.UPDATED,
    metadata: { name: updated.name },
  });

  return updated;
}

/**
 * Delete a team (OWNER only).
 */
async function deleteTeam(teamId) {
  await prisma.team.delete({
    where: { id: teamId },
  });
  return { success: true };
}

/**
 * Invite a member to a team.
 */
async function inviteMember(teamId, actorId, { email, role }) {
  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: existingUser.id,
        },
      },
    });

    if (existingMember) {
      const error = new Error('This user is already a member of the team.');
      error.statusCode = 409;
      throw error;
    }
  }

  const rawToken = generateRandomToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invitation = await prisma.invitation.create({
    data: {
      teamId,
      invitedEmail: email,
      tokenHash,
      role: role || ROLES.MEMBER,
      expiresAt,
      createdBy: actorId,
    },
    include: {
      team: { select: { name: true } },
    },
  });

  await logActivity({
    teamId,
    actorId,
    entityType: 'MEMBER',
    entityId: invitation.id,
    action: ACTIVITY_ACTIONS.MEMBER_INVITED,
    metadata: { invitedEmail: email, role },
  });

  if (!isProduction) {
    logger.info(`[DEV INVITATION] Link for ${email}: ${env.API_URL.replace('4000', '3000')}/invitations/${rawToken}`);
  }

  return {
    invitation: {
      id: invitation.id,
      invitedEmail: invitation.invitedEmail,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      teamName: invitation.team.name,
    },
    token: !isProduction ? rawToken : undefined,
  };
}

/**
 * Accept a team invitation.
 */
async function acceptInvitation(rawToken, userId) {
  const tokenHash = hashToken(rawToken);
  const now = new Date();

  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    include: { team: true },
  });

  if (!invitation || invitation.acceptedAt !== null || invitation.expiresAt <= now) {
    const error = new Error('Invitation is invalid, expired, or has already been accepted.');
    error.statusCode = 400;
    throw error;
  }

  // Ensure user is not already in team
  const existingMember = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId: invitation.teamId,
        userId,
      },
    },
  });

  if (existingMember) {
    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: now },
    });
    return { team: invitation.team, alreadyMember: true };
  }

  return prisma.$transaction(async (tx) => {
    const member = await tx.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId,
        role: invitation.role,
      },
    });

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: now },
    });

    await tx.activityLog.create({
      data: {
        teamId: invitation.teamId,
        actorId: userId,
        entityType: 'MEMBER',
        entityId: member.id,
        action: ACTIVITY_ACTIONS.MEMBER_JOINED,
        metadata: { role: invitation.role },
      },
    });

    return { team: invitation.team, member };
  });
}

/**
 * Update a member's role.
 */
async function updateMemberRole(teamId, actorId, targetUserId, newRole) {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
  });

  if (!member) {
    const error = new Error('Team member not found.');
    error.statusCode = 404;
    throw error;
  }

  // Prevent demoting the last owner
  if (member.role === ROLES.OWNER && newRole !== ROLES.OWNER) {
    const ownerCount = await prisma.teamMember.count({
      where: { teamId, role: ROLES.OWNER },
    });
    if (ownerCount <= 1) {
      const error = new Error('Cannot demote the sole owner of the team. Transfer ownership first.');
      error.statusCode = 400;
      throw error;
    }
  }

  const updated = await prisma.teamMember.update({
    where: { id: member.id },
    data: { role: newRole },
  });

  await logActivity({
    teamId,
    actorId,
    entityType: 'MEMBER',
    entityId: member.id,
    action: ACTIVITY_ACTIONS.ROLE_CHANGED,
    metadata: { targetUserId, newRole, previousRole: member.role },
  });

  return updated;
}

/**
 * Remove a member from a team.
 */
async function removeMember(teamId, actorId, targetUserId) {
  const member = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: {
        teamId,
        userId: targetUserId,
      },
    },
  });

  if (!member) {
    const error = new Error('Team member not found.');
    error.statusCode = 404;
    throw error;
  }

  // If removing an owner, make sure they aren't the only owner
  if (member.role === ROLES.OWNER) {
    const ownerCount = await prisma.teamMember.count({
      where: { teamId, role: ROLES.OWNER },
    });
    if (ownerCount <= 1) {
      const error = new Error('Cannot remove the sole owner of the team.');
      error.statusCode = 400;
      throw error;
    }
  }

  await prisma.teamMember.delete({
    where: { id: member.id },
  });

  await logActivity({
    teamId,
    actorId,
    entityType: 'MEMBER',
    entityId: member.id,
    action: ACTIVITY_ACTIONS.MEMBER_REMOVED,
    metadata: { removedUserId: targetUserId },
  });

  return { success: true };
}

module.exports = {
  getUserTeams,
  createTeam,
  getTeamDetails,
  updateTeam,
  deleteTeam,
  inviteMember,
  acceptInvitation,
  updateMemberRole,
  removeMember,
  logActivity,
};
