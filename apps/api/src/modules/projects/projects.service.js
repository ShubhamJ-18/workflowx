const { prisma } = require('../../config/prisma');
const { ACTIVITY_ACTIONS, TASK_STATUS } = require('@workflowx/shared');
const { logActivity } = require('../teams/teams.service');

async function getProjects(userId, { teamId, status, search, page = 1, limit = 20 }) {
  // Find teams the user is member of
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const authorizedTeamIds = memberships.map((m) => m.teamId);

  if (authorizedTeamIds.length === 0) {
    return { projects: [], total: 0 };
  }

  const where = {
    teamId: teamId ? { in: authorizedTeamIds.filter((id) => id === teamId) } : { in: authorizedTeamIds },
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.project.count({ where }),
  ]);

  // Augment with task counts & completion rates
  const projectIds = projects.map((p) => p.id);
  const completedTaskCounts = await prisma.task.groupBy({
    by: ['projectId'],
    where: {
      projectId: { in: projectIds },
      status: TASK_STATUS.DONE,
    },
    _count: { _all: true },
  });

  const completedMap = new Map(completedTaskCounts.map((c) => [c.projectId, c._count._all]));

  const enrichedProjects = projects.map((p) => {
    const totalTasks = p._count.tasks;
    const completedTasks = completedMap.get(p.id) || 0;
    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      ...p,
      taskCount: totalTasks,
      completedTaskCount: completedTasks,
      completionPercentage,
    };
  });

  return { projects: enrichedProjects, total };
}

async function getProjectById(projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatarUrl: true },
              },
            },
          },
        },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { tasks: true },
      },
    },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  // Verify user is authorized member of the project's team
  const isMember = project.team.members.some((m) => m.userId === userId);
  if (!isMember) {
    const error = new Error('Access denied: You do not have permission to view this project.');
    error.statusCode = 403;
    throw error;
  }

  // Calculate task statistics
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId },
    _count: { _all: true },
  });

  const stats = {
    total: project._count.tasks,
    todo: 0,
    inProgress: 0,
    blocked: 0,
    done: 0,
  };

  for (const s of taskStats) {
    if (s.status === TASK_STATUS.TODO) stats.todo = s._count._all;
    if (s.status === TASK_STATUS.IN_PROGRESS) stats.inProgress = s._count._all;
    if (s.status === TASK_STATUS.BLOCKED) stats.blocked = s._count._all;
    if (s.status === TASK_STATUS.DONE) stats.done = s._count._all;
  }

  const completionPercentage = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return {
    ...project,
    stats: {
      ...stats,
      completionPercentage,
    },
  };
}

async function createProject(userId, { teamId, name, description, status, startDate, dueDate }) {
  const project = await prisma.project.create({
    data: {
      teamId,
      name,
      description,
      status,
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: userId,
    },
    include: {
      team: { select: { id: true, name: true } },
    },
  });

  await logActivity({
    teamId,
    actorId: userId,
    entityType: 'PROJECT',
    entityId: project.id,
    action: ACTIVITY_ACTIONS.CREATED,
    metadata: { projectName: project.name },
  });

  return project;
}

async function updateProject(projectId, userId, updateData) {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  const data = { ...updateData };
  if (data.startDate !== undefined) data.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.dueDate !== undefined) data.dueDate = data.dueDate ? new Date(data.dueDate) : null;

  const updated = await prisma.project.update({
    where: { id: projectId },
    data,
  });

  await logActivity({
    teamId: existing.teamId,
    actorId: userId,
    entityType: 'PROJECT',
    entityId: projectId,
    action: ACTIVITY_ACTIONS.UPDATED,
    metadata: { projectName: updated.name },
  });

  return updated;
}

async function deleteProject(projectId, userId) {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existing) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.project.delete({
    where: { id: projectId },
  });

  await logActivity({
    teamId: existing.teamId,
    actorId: userId,
    entityType: 'PROJECT',
    entityId: projectId,
    action: ACTIVITY_ACTIONS.DELETED,
    metadata: { projectName: existing.name },
  });

  return { success: true };
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
