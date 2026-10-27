const { prisma } = require('../../config/prisma');
const { TASK_STATUS, RISK_LEVEL, calculateTaskRisk, getDownstreamTasks } = require('@workflowx/shared');

/**
 * Calculates aggregated dashboard metrics strictly scoped to teams the user belongs to.
 */
async function getDashboardMetrics(userId, teamId = null) {
  // 1. Get authorized teams
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });

  const authorizedTeamIds = memberships.map((m) => m.teamId);
  if (authorizedTeamIds.length === 0) {
    return {
      activeProjectsCount: 0,
      totalTasksCount: 0,
      completedTasksCount: 0,
      overdueTasksCount: 0,
      blockedTasksCount: 0,
      highRiskTasksCount: 0,
      statusBreakdown: { TODO: 0, IN_PROGRESS: 0, BLOCKED: 0, DONE: 0 },
      upcomingDeadlines: [],
      recentActivity: [],
      projectSummaries: [],
      workloadSummaries: [],
    };
  }

  const effectiveTeamIds = teamId
    ? authorizedTeamIds.filter((id) => id === teamId)
    : authorizedTeamIds;

  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 2. Query Project count & summaries
  const [projects, tasks, activities] = await Promise.all([
    prisma.project.findMany({
      where: {
        teamId: { in: effectiveTeamIds },
      },
      include: {
        team: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
    }),

    // Query tasks with assignees and dependencies
    prisma.task.findMany({
      where: {
        project: { teamId: { in: effectiveTeamIds } },
      },
      include: {
        project: { select: { id: true, name: true, teamId: true } },
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        predecessors: {
          include: {
            predecessor: { select: { id: true, title: true, status: true, dueDate: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    }),

    // Recent activity in authorized teams
    prisma.activityLog.findMany({
      where: {
        teamId: { in: effectiveTeamIds },
      },
      include: {
        actor: { select: { id: true, name: true, avatarUrl: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  // Load project dependencies for downstream impact
  const projectIds = projects.map((p) => p.id);
  const dependencies = await prisma.taskDependency.findMany({
    where: { predecessor: { projectId: { in: projectIds } } },
    select: { predecessorTaskId: true, successorTaskId: true },
  });

  // Calculate assignee active task counts
  const assigneeWorkloadMap = new Map();
  for (const t of tasks) {
    if (t.assigneeId && (t.status === TASK_STATUS.TODO || t.status === TASK_STATUS.IN_PROGRESS)) {
      assigneeWorkloadMap.set(
        t.assigneeId,
        (assigneeWorkloadMap.get(t.assigneeId) || 0) + 1
      );
    }
  }

  // 3. Status breakdown & risk analysis
  const statusBreakdown = {
    [TASK_STATUS.TODO]: 0,
    [TASK_STATUS.IN_PROGRESS]: 0,
    [TASK_STATUS.BLOCKED]: 0,
    [TASK_STATUS.DONE]: 0,
  };

  let overdueTasksCount = 0;
  let highRiskTasksCount = 0;
  const highRiskTasks = [];
  const upcomingDeadlines = [];

  for (const t of tasks) {
    if (statusBreakdown[t.status] !== undefined) {
      statusBreakdown[t.status]++;
    }

    const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== TASK_STATUS.DONE;
    if (isOverdue) {
      overdueTasksCount++;
    }

    // Evaluate risk
    const directPredecessors = t.predecessors.map((p) => p.predecessor);
    const downstreamIds = getDownstreamTasks(dependencies, t.id);
    const assigneeCount = t.assigneeId ? (assigneeWorkloadMap.get(t.assigneeId) || 0) : 0;

    const risk = calculateTaskRisk(t, {
      predecessors: directPredecessors,
      affectedDownstreamCount: downstreamIds.length,
      assigneeActiveTaskCount: assigneeCount,
      referenceDate: now,
    });

    if (risk.riskLevel === RISK_LEVEL.HIGH && t.status !== TASK_STATUS.DONE) {
      highRiskTasksCount++;
      highRiskTasks.push({
        ...t,
        risk,
      });
    }

    // Upcoming deadlines (within next 7 days and not completed)
    if (t.dueDate && t.status !== TASK_STATUS.DONE) {
      const due = new Date(t.dueDate);
      if (due >= now && due <= next7Days) {
        upcomingDeadlines.push({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
          project: t.project,
          assignee: t.assignee,
          riskLevel: risk.riskLevel,
        });
      }
    }
  }

  // 4. Project completion summaries
  const projectSummaries = projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.project.id === p.id);
    const total = projectTasks.length;
    const done = projectTasks.filter((t) => t.status === TASK_STATUS.DONE).length;
    const blocked = projectTasks.filter((t) => t.status === TASK_STATUS.BLOCKED).length;
    const overdue = projectTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== TASK_STATUS.DONE
    ).length;

    return {
      id: p.id,
      name: p.name,
      status: p.status,
      teamName: p.team.name,
      totalTasks: total,
      completedTasks: done,
      blockedTasks: blocked,
      overdueTasks: overdue,
      completionPercentage: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  // 5. Team workload summaries
  // Query all team members in authorized teams
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: { in: effectiveTeamIds } },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  const memberWorkloadMap = new Map();
  for (const tm of teamMembers) {
    if (!memberWorkloadMap.has(tm.userId)) {
      memberWorkloadMap.set(tm.userId, {
        user: tm.user,
        role: tm.role,
        activeTasks: 0,
        completedTasks: 0,
        overdueTasks: 0,
      });
    }
  }

  for (const t of tasks) {
    if (t.assigneeId && memberWorkloadMap.has(t.assigneeId)) {
      const stats = memberWorkloadMap.get(t.assigneeId);
      if (t.status === TASK_STATUS.DONE) {
        stats.completedTasks++;
      } else {
        stats.activeTasks++;
        if (t.dueDate && new Date(t.dueDate) < now) {
          stats.overdueTasks++;
        }
      }
    }
  }

  const workloadSummaries = Array.from(memberWorkloadMap.values()).sort(
    (a, b) => b.activeTasks - a.activeTasks
  );

  return {
    activeProjectsCount: projects.filter((p) => p.status === 'ACTIVE').length,
    totalProjectsCount: projects.length,
    totalTasksCount: tasks.length,
    completedTasksCount: statusBreakdown[TASK_STATUS.DONE],
    overdueTasksCount,
    blockedTasksCount: statusBreakdown[TASK_STATUS.BLOCKED],
    highRiskTasksCount,
    statusBreakdown,
    highRiskTasks: highRiskTasks.slice(0, 5),
    upcomingDeadlines: upcomingDeadlines.slice(0, 8),
    recentActivity: activities,
    projectSummaries,
    workloadSummaries,
  };
}

module.exports = {
  getDashboardMetrics,
};
