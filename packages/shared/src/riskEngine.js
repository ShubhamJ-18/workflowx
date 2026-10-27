/**
 * Transparent, Rule-Based Task Risk Analysis Engine
 * Deterministically evaluates task risk factors and produces actionable guidance.
 */

const { TASK_STATUS, RISK_LEVEL, RISK_THRESHOLDS } = require('./constants');

/**
 * Calculates a comprehensive risk assessment for a given task.
 *
 * @param {Object} task
 * @param {Object} context
 * @param {Array<Object>} [context.predecessors=[]] - Direct prerequisite tasks with status and dueDate
 * @param {number} [context.affectedDownstreamCount=0] - Number of downstream tasks waiting on this task
 * @param {number} [context.assigneeActiveTaskCount=0] - Number of active tasks assigned to the task's assignee
 * @param {Date} [context.referenceDate=new Date()] - Evaluation timestamp (defaults to current time)
 * @returns {Object} Risk assessment outcome
 */
function calculateTaskRisk(task, context = {}) {
  const {
    predecessors = [],
    affectedDownstreamCount = 0,
    assigneeActiveTaskCount = 0,
    referenceDate = new Date(),
  } = context;

  // Completed tasks are zero risk
  if (task.status === TASK_STATUS.DONE) {
    return {
      taskId: task.id,
      riskLevel: RISK_LEVEL.LOW,
      riskScore: 0,
      reasons: ['Task is completed.'],
      affectedDownstreamCount: 0,
      isBlocked: false,
      blockingTasks: [],
      recommendedAction: 'No action required — task is complete.',
      evaluatedAt: referenceDate.toISOString(),
    };
  }

  let riskScore = 0;
  const reasons = [];
  const blockingTasks = [];
  const nowMs = referenceDate.getTime();

  // 1. Dependency Analysis & Blocking
  let hasIncompletePrerequisites = false;
  let hasOverduePrerequisites = false;

  for (const pred of predecessors) {
    if (pred.status !== TASK_STATUS.DONE) {
      hasIncompletePrerequisites = true;
      blockingTasks.push({
        id: pred.id,
        title: pred.title,
        status: pred.status,
        dueDate: pred.dueDate,
      });

      // Check if prerequisite is overdue
      if (pred.dueDate) {
        const predDueMs = new Date(pred.dueDate).getTime();
        if (predDueMs < nowMs) {
          hasOverduePrerequisites = true;
          reasons.push(
            `Prerequisite "${pred.title}" is overdue, causing a cascading delay.`
          );
        }
      }
    }
  }

  if (hasOverduePrerequisites) {
    riskScore += 40;
  } else if (hasIncompletePrerequisites) {
    riskScore += 25;
    reasons.push(
      `Waiting on ${blockingTasks.length} incomplete prerequisite task(s).`
    );
  }

  // 2. Explicit BLOCKED status
  if (task.status === TASK_STATUS.BLOCKED) {
    riskScore += 20;
    reasons.push('Task is currently flagged with BLOCKED status.');
  }

  // 3. Deadline and Overdue Evaluation
  let hoursRemaining = null;
  let isOverdue = false;

  if (task.dueDate) {
    const dueMs = new Date(task.dueDate).getTime();
    const diffMs = dueMs - nowMs;
    hoursRemaining = diffMs / (1000 * 60 * 60);

    if (diffMs < 0) {
      isOverdue = true;
      const daysOverdue = Math.max(1, Math.round(Math.abs(diffMs) / (1000 * 60 * 60 * 24)));
      riskScore += 50;
      reasons.push(`Task is overdue by ${daysOverdue} day(s).`);
    } else if (hoursRemaining <= RISK_THRESHOLDS.DEADLINE_URGENT_HOURS) {
      riskScore += 35;
      const hours = Math.max(1, Math.round(hoursRemaining));
      reasons.push(`Urgent deadline in less than ${hours} hour(s).`);
    } else if (hoursRemaining <= RISK_THRESHOLDS.DEADLINE_WARNING_HOURS) {
      riskScore += 20;
      const days = Math.round(hoursRemaining / 24);
      reasons.push(`Deadline approaching in approximately ${days} day(s).`);
    }

    // 4. Effort vs Time Remaining
    if (
      !isOverdue &&
      task.estimatedHours &&
      task.estimatedHours > 0 &&
      hoursRemaining > 0 &&
      task.estimatedHours > hoursRemaining
    ) {
      riskScore += 25;
      reasons.push(
        `Estimated effort (${task.estimatedHours}h) exceeds remaining time (${Math.round(
          hoursRemaining
        )}h).`
      );
    }
  }

  // 5. Workload Concentration
  if (assigneeActiveTaskCount > RISK_THRESHOLDS.MAX_REASONABLE_WORKLOAD_TASKS) {
    riskScore += 15;
    reasons.push(
      `Assignee has a heavy workload with ${assigneeActiveTaskCount} active tasks.`
    );
  }

  // 6. Blast Radius (Downstream Dependency Impact)
  if (affectedDownstreamCount >= 3) {
    riskScore += 15;
    reasons.push(
      `Critical path bottleneck: delays will impact ${affectedDownstreamCount} downstream task(s).`
    );
  } else if (affectedDownstreamCount > 0) {
    riskScore += 5;
    reasons.push(`Impacts ${affectedDownstreamCount} downstream task(s).`);
  }

  // Normalize risk level based on calibrated thresholds
  let riskLevel = RISK_LEVEL.LOW;
  if (riskScore >= RISK_THRESHOLDS.HIGH_RISK_SCORE_CUTOFF || isOverdue) {
    riskLevel = RISK_LEVEL.HIGH;
  } else if (riskScore >= RISK_THRESHOLDS.MEDIUM_RISK_SCORE_CUTOFF) {
    riskLevel = RISK_LEVEL.MEDIUM;
  }

  if (reasons.length === 0) {
    reasons.push('Task parameters and schedule are currently within healthy limits.');
  }

  // Generate deterministic recommended action based on primary risk factor
  let recommendedAction = 'On track. Proceed with scheduled execution.';
  if (isOverdue) {
    recommendedAction =
      'Immediate escalation required: Reassign or negotiate deadline with stakeholders.';
  } else if (hasOverduePrerequisites) {
    recommendedAction =
      'Expedite overdue prerequisite tasks immediately to unblock downstream execution.';
  } else if (hasIncompletePrerequisites) {
    recommendedAction =
      'Coordinate with prerequisite owners before starting active development.';
  } else if (task.status === TASK_STATUS.BLOCKED) {
    recommendedAction =
      'Review impediment notes and address blocker with team lead.';
  } else if (hoursRemaining !== null && hoursRemaining <= 24) {
    recommendedAction =
      'Prioritize completion today to avoid impending deadline overrun.';
  } else if (
    task.estimatedHours &&
    hoursRemaining !== null &&
    task.estimatedHours > hoursRemaining
  ) {
    recommendedAction =
      'Scope reduction or pair assignment recommended to meet target milestone.';
  } else if (assigneeActiveTaskCount > RISK_THRESHOLDS.MAX_REASONABLE_WORKLOAD_TASKS) {
    recommendedAction =
      'Consider rebalancing assignee workload to mitigate delivery risk.';
  }

  return {
    taskId: task.id,
    riskLevel,
    riskScore,
    reasons,
    affectedDownstreamCount,
    isBlocked: hasIncompletePrerequisites || task.status === TASK_STATUS.BLOCKED,
    blockingTasks,
    recommendedAction,
    evaluatedAt: referenceDate.toISOString(),
  };
}

module.exports = {
  calculateTaskRisk,
};
