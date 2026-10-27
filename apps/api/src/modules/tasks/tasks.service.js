const { prisma } = require('../../config/prisma');
const {
  TASK_STATUS,
  ACTIVITY_ACTIONS,
  NOTIFICATION_TYPES,
  wouldCreateCycle,
  getDownstreamTasks,
  calculateTaskRisk,
} = require('@workflowx/shared');
const { logActivity } = require('../teams/teams.service');

/**
 * Creates an in-app notification.
 */
async function createNotification({ recipientId, type, title, message, entityType, entityId }) {
  if (!recipientId) return;
  try {
    await prisma.notification.create({
      data: {
        recipientId,
        type,
        title,
        message,
        entityType,
        entityId,
      },
    });
  } catch (err) {
    // Non-fatal if notification fails
  }
}

/**
 * Gets tasks for a project or team, with filtering, sorting, pagination, and enriched risk.
 */
async function getTasks(userId, {
  projectId,
  teamId,
  status,
  priority,
  assigneeId,
  search,
  sortBy = 'position',
  sortOrder = 'asc',
  page = 1,
  limit = 50,
}) {
  // Verify team membership
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const authorizedTeamIds = memberships.map((m) => m.teamId);

  if (authorizedTeamIds.length === 0) {
    return { tasks: [], total: 0 };
  }

  const where = {
    project: {
      teamId: teamId ? { in: authorizedTeamIds.filter((id) => id === teamId) } : { in: authorizedTeamIds },
      ...(projectId && { id: projectId }),
    },
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assigneeId && { assigneeId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const skip = (page - 1) * limit;

  // Safe orderBy fields
  const allowedSortFields = ['position', 'dueDate', 'createdAt', 'priority', 'title'];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'position';
  const safeSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, teamId: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        predecessors: {
          include: {
            predecessor: {
              select: { id: true, title: true, status: true, dueDate: true },
            },
          },
        },
        successors: {
          include: {
            successor: {
              select: { id: true, title: true, status: true, dueDate: true },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: { [safeSortBy]: safeSortOrder },
      skip,
      take: limit,
    }),
    prisma.task.count({ where }),
  ]);

  // Batch calculate dependencies & assignee workloads for risk analysis
  const projectTasks = projectId
    ? await prisma.task.findMany({
        where: { projectId },
        select: { id: true, assigneeId: true, status: true },
      })
    : tasks;

  const allDependencies = projectId
    ? await prisma.taskDependency.findMany({
        where: {
          predecessor: { projectId },
        },
        select: { predecessorTaskId: true, successorTaskId: true },
      })
    : [];

  // Workload counts per assignee
  const assigneeWorkloadMap = new Map();
  for (const t of projectTasks) {
    if (t.assigneeId && (t.status === TASK_STATUS.TODO || t.status === TASK_STATUS.IN_PROGRESS)) {
      assigneeWorkloadMap.set(
        t.assigneeId,
        (assigneeWorkloadMap.get(t.assigneeId) || 0) + 1
      );
    }
  }

  // Enrich each task with deterministic risk evaluation
  const enrichedTasks = tasks.map((task) => {
    const directPredecessors = task.predecessors.map((p) => p.predecessor);
    const downstreamIds = getDownstreamTasks(allDependencies, task.id);
    const assigneeActiveCount = task.assigneeId ? (assigneeWorkloadMap.get(task.assigneeId) || 0) : 0;

    const risk = calculateTaskRisk(task, {
      predecessors: directPredecessors,
      affectedDownstreamCount: downstreamIds.length,
      assigneeActiveTaskCount: assigneeActiveCount,
      referenceDate: new Date(),
    });

    return {
      ...task,
      predecessorCount: task.predecessors.length,
      successorCount: task.successors.length,
      commentCount: task._count.comments,
      risk,
    };
  });

  return { tasks: enrichedTasks, total };
}

/**
 * Gets a single task with complete dependency chain, comments, and risk report.
 */
async function getTaskById(taskId, userId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
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
        },
      },
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      predecessors: {
        include: {
          predecessor: {
            select: { id: true, title: true, status: true, priority: true, dueDate: true, assignee: true },
          },
        },
      },
      successors: {
        include: {
          successor: {
            select: { id: true, title: true, status: true, priority: true, dueDate: true, assignee: true },
          },
        },
      },
      comments: {
        include: {
          author: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check
  const isMember = task.project.team.members.some((m) => m.userId === userId);
  if (!isMember) {
    const error = new Error('Access denied: You are not authorized to view this task.');
    error.statusCode = 403;
    throw error;
  }

  // Load all dependencies of the project for full downstream calculations
  const allProjectDependencies = await prisma.taskDependency.findMany({
    where: { predecessor: { projectId: task.projectId } },
    select: { predecessorTaskId: true, successorTaskId: true },
  });

  const directPredecessors = task.predecessors.map((p) => p.predecessor);
  const downstreamTaskIds = getDownstreamTasks(allProjectDependencies, task.id);

  // Assignee active task count
  let assigneeActiveCount = 0;
  if (task.assigneeId) {
    assigneeActiveCount = await prisma.task.count({
      where: {
        assigneeId: task.assigneeId,
        status: { in: [TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS] },
      },
    });
  }

  const risk = calculateTaskRisk(task, {
    predecessors: directPredecessors,
    affectedDownstreamCount: downstreamTaskIds.length,
    assigneeActiveTaskCount: assigneeActiveCount,
    referenceDate: new Date(),
  });

  return {
    ...task,
    downstreamTaskIds,
    risk,
  };
}

/**
 * Creates a new task.
 */
async function createTask(userId, data) {
  const { projectId, title, description, status, priority, assigneeId, dueDate, estimatedHours, position } = data;

  // Validate project and membership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      team: {
        include: { members: true },
      },
    },
  });

  if (!project) {
    const error = new Error('Project not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMember = project.team.members.some((m) => m.userId === userId);
  if (!isMember) {
    const error = new Error('Access denied: You are not a member of this project team.');
    error.statusCode = 403;
    throw error;
  }

  // Validate assignee if provided
  if (assigneeId) {
    const isAssigneeInTeam = project.team.members.some((m) => m.userId === assigneeId);
    if (!isAssigneeInTeam) {
      const error = new Error('Assignee must be an authorized member of the team.');
      error.statusCode = 400;
      throw error;
    }
  }

  const task = await prisma.task.create({
    data: {
      projectId,
      title,
      description,
      status: status || TASK_STATUS.TODO,
      priority: priority || 'MEDIUM',
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      estimatedHours: estimatedHours || 0,
      position: position || 0,
      createdBy: userId,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  await logActivity({
    teamId: project.teamId,
    actorId: userId,
    entityType: 'TASK',
    entityId: task.id,
    action: ACTIVITY_ACTIONS.CREATED,
    metadata: { title: task.title, projectId: project.id },
  });

  if (assigneeId && assigneeId !== userId) {
    await createNotification({
      recipientId: assigneeId,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New Task Assigned',
      message: `You were assigned to task: "${task.title}"`,
      entityType: 'TASK',
      entityId: task.id,
    });
  }

  return task;
}

/**
 * Updates a task.
 */
async function updateTask(taskId, userId, updateData) {
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        include: {
          team: {
            include: { members: true },
          },
        },
      },
      predecessors: {
        include: { predecessor: true },
      },
    },
  });

  if (!existingTask) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  const isMember = existingTask.project.team.members.some((m) => m.userId === userId);
  if (!isMember) {
    const error = new Error('Access denied: You are not authorized to edit this task.');
    error.statusCode = 403;
    throw error;
  }

  // Validate assignee if changed
  if (updateData.assigneeId && updateData.assigneeId !== existingTask.assigneeId) {
    const isAssigneeInTeam = existingTask.project.team.members.some(
      (m) => m.userId === updateData.assigneeId
    );
    if (!isAssigneeInTeam) {
      const error = new Error('Assignee must be an authorized member of the team.');
      error.statusCode = 400;
      throw error;
    }
  }

  // Workflow validation: moving to DONE or IN_PROGRESS while prerequisites are incomplete
  if (
    updateData.status &&
    (updateData.status === TASK_STATUS.IN_PROGRESS || updateData.status === TASK_STATUS.DONE)
  ) {
    const incompletePredecessors = existingTask.predecessors.filter(
      (p) => p.predecessor.status !== TASK_STATUS.DONE
    );

    // If attempting to start or complete while predecessors are incomplete, warn or mark as blocked
    if (incompletePredecessors.length > 0 && updateData.status === TASK_STATUS.DONE) {
      const titles = incompletePredecessors.map((p) => `"${p.predecessor.title}"`).join(', ');
      const error = new Error(
        `Cannot mark task as DONE: Prerequisite task(s) ${titles} must be completed first.`
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const data = { ...updateData };
  if (data.dueDate !== undefined) {
    data.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  // Log status or general update
  const action = updateData.status && updateData.status !== existingTask.status
    ? ACTIVITY_ACTIONS.STATUS_CHANGED
    : ACTIVITY_ACTIONS.UPDATED;

  await logActivity({
    teamId: existingTask.project.teamId,
    actorId: userId,
    entityType: 'TASK',
    entityId: taskId,
    action,
    metadata: {
      title: updated.title,
      fromStatus: existingTask.status,
      toStatus: updated.status,
    },
  });

  // Notify on assignee change
  if (updateData.assigneeId && updateData.assigneeId !== existingTask.assigneeId && updateData.assigneeId !== userId) {
    await createNotification({
      recipientId: updateData.assigneeId,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'Task Assigned To You',
      message: `You were assigned to task: "${updated.title}"`,
      entityType: 'TASK',
      entityId: updated.id,
    });
  }

  // If task was completed, check if downstream tasks are now unblocked!
  if (updated.status === TASK_STATUS.DONE && existingTask.status !== TASK_STATUS.DONE) {
    const directSuccessors = await prisma.taskDependency.findMany({
      where: { predecessorTaskId: taskId },
      include: {
        successor: {
          include: {
            predecessors: {
              include: { predecessor: true },
            },
          },
        },
      },
    });

    for (const dep of directSuccessors) {
      const succ = dep.successor;
      const allPredecessorsDone = succ.predecessors.every(
        (p) => p.predecessorId === taskId || p.predecessor.status === TASK_STATUS.DONE
      );

      if (allPredecessorsDone && succ.status === TASK_STATUS.BLOCKED) {
        // Automatically unblock downstream task to TODO
        await prisma.task.update({
          where: { id: succ.id },
          data: { status: TASK_STATUS.TODO },
        });

        if (succ.assigneeId) {
          await createNotification({
            recipientId: succ.assigneeId,
            type: NOTIFICATION_TYPES.TASK_UNBLOCKED,
            title: 'Task Unblocked!',
            message: `Prerequisites for "${succ.title}" have been completed. Task is now ready to start.`,
            entityType: 'TASK',
            entityId: succ.id,
          });
        }
      }
    }
  }

  return updated;
}

/**
 * Deletes a task.
 */
async function deleteTask(taskId, userId) {
  const existing = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: { select: { teamId: true, name: true } },
    },
  });

  if (!existing) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.task.delete({ where: { id: taskId } });

  await logActivity({
    teamId: existing.project.teamId,
    actorId: userId,
    entityType: 'TASK',
    entityId: taskId,
    action: ACTIVITY_ACTIONS.DELETED,
    metadata: { title: existing.title },
  });

  return { success: true };
}

/**
 * Adds a dependency between two tasks.
 * predecessorTaskId -> successorTaskId (successor waits on predecessor).
 */
async function addDependency(successorTaskId, predecessorTaskId, userId) {
  if (successorTaskId === predecessorTaskId) {
    const error = new Error('A task cannot depend on itself (self-dependency).');
    error.statusCode = 400;
    throw error;
  }

  const [successor, predecessor] = await Promise.all([
    prisma.task.findUnique({
      where: { id: successorTaskId },
      include: { project: true },
    }),
    prisma.task.findUnique({
      where: { id: predecessorTaskId },
      include: { project: true },
    }),
  ]);

  if (!successor || !predecessor) {
    const error = new Error('One or both specified tasks were not found.');
    error.statusCode = 404;
    throw error;
  }

  // Prevent cross-project or cross-team dependency
  if (successor.project.teamId !== predecessor.project.teamId) {
    const error = new Error('Cross-team dependencies are strictly disallowed.');
    error.statusCode = 400;
    throw error;
  }

  // Check if dependency already exists
  const existingDep = await prisma.taskDependency.findUnique({
    where: {
      predecessorTaskId_successorTaskId: {
        predecessorTaskId,
        successorTaskId,
      },
    },
  });

  if (existingDep) {
    const error = new Error('This dependency relationship already exists.');
    error.statusCode = 409;
    throw error;
  }

  // Fetch all existing dependencies in this project for cycle detection
  const projectDependencies = await prisma.taskDependency.findMany({
    where: { predecessor: { projectId: successor.projectId } },
    select: { predecessorTaskId: true, successorTaskId: true },
  });

  const cycleCheck = wouldCreateCycle(
    projectDependencies,
    predecessorTaskId,
    successorTaskId
  );

  if (cycleCheck.wouldCreateCycle) {
    const error = new Error(
      `Circular dependency rejected: Adding this relationship creates a loop (${cycleCheck.cyclePath ? cycleCheck.cyclePath.join(' -> ') : 'cycle'}).`
    );
    error.statusCode = 400;
    throw error;
  }

  const newDep = await prisma.taskDependency.create({
    data: {
      predecessorTaskId,
      successorTaskId,
    },
    include: {
      predecessor: { select: { id: true, title: true, status: true } },
      successor: { select: { id: true, title: true, status: true } },
    },
  });

  // If predecessor is not DONE, update successor status to BLOCKED if it was TODO
  if (predecessor.status !== TASK_STATUS.DONE && successor.status === TASK_STATUS.TODO) {
    await prisma.task.update({
      where: { id: successorTaskId },
      data: { status: TASK_STATUS.BLOCKED },
    });
  }

  await logActivity({
    teamId: successor.project.teamId,
    actorId: userId,
    entityType: 'DEPENDENCY',
    entityId: newDep.id,
    action: ACTIVITY_ACTIONS.DEPENDENCY_ADDED,
    metadata: {
      predecessorTitle: predecessor.title,
      successorTitle: successor.title,
    },
  });

  return newDep;
}

/**
 * Removes a dependency.
 */
async function removeDependency(successorTaskId, predecessorTaskId, userId) {
  const dep = await prisma.taskDependency.findUnique({
    where: {
      predecessorTaskId_successorTaskId: {
        predecessorTaskId,
        successorTaskId,
      },
    },
    include: {
      successor: {
        include: {
          project: true,
          predecessors: {
            include: { predecessor: true },
          },
        },
      },
    },
  });

  if (!dep) {
    const error = new Error('Dependency relationship not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.taskDependency.delete({
    where: { id: dep.id },
  });

  // Check if successor should be unblocked
  const remainingPredecessors = dep.successor.predecessors.filter(
    (p) => p.predecessorTaskId !== predecessorTaskId && p.predecessor.status !== TASK_STATUS.DONE
  );

  if (remainingPredecessors.length === 0 && dep.successor.status === TASK_STATUS.BLOCKED) {
    await prisma.task.update({
      where: { id: successorTaskId },
      data: { status: TASK_STATUS.TODO },
    });
  }

  await logActivity({
    teamId: dep.successor.project.teamId,
    actorId: userId,
    entityType: 'DEPENDENCY',
    entityId: dep.id,
    action: ACTIVITY_ACTIONS.DEPENDENCY_REMOVED,
    metadata: { successorTaskId, predecessorTaskId },
  });

  return { success: true };
}

/**
 * Comments on a task.
 */
async function addComment(taskId, authorId, content) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true },
  });

  if (!task) {
    const error = new Error('Task not found.');
    error.statusCode = 404;
    throw error;
  }

  const comment = await prisma.comment.create({
    data: {
      taskId,
      authorId,
      content,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  await logActivity({
    teamId: task.project.teamId,
    actorId: authorId,
    entityType: 'TASK',
    entityId: taskId,
    action: ACTIVITY_ACTIONS.COMMENT_ADDED,
    metadata: { taskTitle: task.title },
  });

  // Notify assignee if someone else commented
  if (task.assigneeId && task.assigneeId !== authorId) {
    await createNotification({
      recipientId: task.assigneeId,
      type: NOTIFICATION_TYPES.COMMENT_ADDED,
      title: 'New Comment on Your Task',
      message: `${comment.author.name} commented on "${task.title}"`,
      entityType: 'TASK',
      entityId: task.id,
    });
  }

  return comment;
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addDependency,
  removeDependency,
  addComment,
  createNotification,
};
