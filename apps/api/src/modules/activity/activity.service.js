const { prisma } = require('../../config/prisma');

async function getActivityHistory(userId, { teamId, entityType, page = 1, limit = 30 }) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const authorizedTeamIds = memberships.map((m) => m.teamId);
  if (authorizedTeamIds.length === 0) {
    return { activities: [], total: 0 };
  }

  const where = {
    teamId: teamId ? { in: authorizedTeamIds.filter((id) => id === teamId) } : { in: authorizedTeamIds },
    ...(entityType && { entityType }),
  };

  const skip = (page - 1) * limit;

  const [activities, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      include: {
        actor: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        team: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return { activities, total };
}

module.exports = {
  getActivityHistory,
};
