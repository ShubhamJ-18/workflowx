const { prisma } = require('../config/prisma');
const { ROLES } = require('@workflowx/shared');
const { sendError } = require('../utils/response');

const ROLE_HIERARCHY = {
  [ROLES.MEMBER]: 1,
  [ROLES.ADMIN]: 2,
  [ROLES.OWNER]: 3,
};

/**
 * Resolves the team ID from route parameters, body, or queries.
 * If projectId or taskId is passed, resolves the associated teamId from DB.
 *
 * @param {import('express').Request} req
 * @returns {Promise<string|null>}
 */
async function resolveTeamId(req) {
  if (req.params.teamId) return req.params.teamId;
  if (req.body && req.body.teamId) return req.body.teamId;
  if (req.query && req.query.teamId) return req.query.teamId;

  const projectId = req.params.projectId || (req.body && req.body.projectId) || (req.query && req.query.projectId);
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { teamId: true },
    });
    return project ? project.teamId : null;
  }

  const taskId = req.params.taskId || (req.body && req.body.taskId) || (req.query && req.query.taskId);
  if (taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        project: {
          select: { teamId: true },
        },
      },
    });
    return task && task.project ? task.project.teamId : null;
  }

  return null;
}

/**
 * Middleware factory requiring membership in the relevant team with at least `minimumRole`.
 * @param {'MEMBER' | 'ADMIN' | 'OWNER'} [minimumRole='MEMBER']
 */
function requireTeamRole(minimumRole = ROLES.MEMBER) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return sendError(res, 'Authentication required.', 401);
      }

      const teamId = await resolveTeamId(req);
      if (!teamId) {
        return sendError(res, 'Target team could not be identified for this operation.', 400);
      }

      // Check team membership
      const membership = await prisma.teamMember.findUnique({
        where: {
          teamId_userId: {
            teamId,
            userId: req.user.id,
          },
        },
        include: {
          team: {
            select: { id: true, name: true, createdBy: true },
          },
        },
      });

      if (!membership) {
        return sendError(
          res,
          'Access denied: You are not an authorized member of this team.',
          403
        );
      }

      const userRoleWeight = ROLE_HIERARCHY[membership.role] || 0;
      const requiredRoleWeight = ROLE_HIERARCHY[minimumRole] || 1;

      if (userRoleWeight < requiredRoleWeight) {
        return sendError(
          res,
          `Access denied: Insufficient privileges. Required role: ${minimumRole}, your role: ${membership.role}.`,
          403
        );
      }

      req.teamId = teamId;
      req.teamMember = membership;
      req.teamRole = membership.role;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = {
  requireTeamRole,
  resolveTeamId,
  ROLE_HIERARCHY,
};
