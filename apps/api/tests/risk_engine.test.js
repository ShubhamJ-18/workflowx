const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateTaskRisk,
  TASK_STATUS,
  RISK_LEVEL,
} = require('@workflowx/shared');

describe('Risk Engine — Deterministic Rules Evaluation', () => {
  const referenceDate = new Date('2026-10-28T12:00:00Z');

  it('evaluates completed tasks as LOW risk with 0 score', () => {
    const task = {
      id: 'task-1',
      title: 'Setup Database',
      status: TASK_STATUS.DONE,
      dueDate: new Date('2026-10-20T12:00:00Z'),
    };

    const risk = calculateTaskRisk(task, { referenceDate });

    assert.equal(risk.riskLevel, RISK_LEVEL.LOW);
    assert.equal(risk.riskScore, 0);
    assert.equal(risk.isBlocked, false);
    assert.match(risk.reasons[0], /completed/i);
  });

  it('flags overdue tasks with HIGH risk and escalation action', () => {
    const task = {
      id: 'task-2',
      title: 'Security Audit',
      status: TASK_STATUS.IN_PROGRESS,
      dueDate: new Date('2026-10-25T12:00:00Z'), // 3 days overdue
      estimatedHours: 10,
    };

    const risk = calculateTaskRisk(task, { referenceDate });

    assert.equal(risk.riskLevel, RISK_LEVEL.HIGH);
    assert.ok(risk.riskScore >= 50);
    assert.ok(risk.reasons.some((r) => r.includes('overdue')));
    assert.match(risk.recommendedAction, /escalation/i);
  });

  it('flags incomplete prerequisites and identifies blocking tasks', () => {
    const task = {
      id: 'task-3',
      title: 'Frontend UI',
      status: TASK_STATUS.TODO,
      dueDate: new Date('2026-11-05T12:00:00Z'),
    };

    const predecessors = [
      {
        id: 'pred-1',
        title: 'Backend API',
        status: TASK_STATUS.IN_PROGRESS,
        dueDate: new Date('2026-11-02T12:00:00Z'),
      },
    ];

    const risk = calculateTaskRisk(task, { predecessors, referenceDate });

    assert.equal(risk.isBlocked, true);
    assert.equal(risk.blockingTasks.length, 1);
    assert.equal(risk.blockingTasks[0].id, 'pred-1');
    assert.ok(risk.reasons.some((r) => r.includes('incomplete prerequisite')));
  });

  it('escalates to HIGH risk when prerequisite task is overdue', () => {
    const task = {
      id: 'task-4',
      title: 'End to End Testing',
      status: TASK_STATUS.TODO,
      dueDate: new Date('2026-11-05T12:00:00Z'),
    };

    const predecessors = [
      {
        id: 'pred-overdue',
        title: 'Core Engine',
        status: TASK_STATUS.IN_PROGRESS,
        dueDate: new Date('2026-10-26T12:00:00Z'), // Prerequisite is overdue!
      },
    ];

    const risk = calculateTaskRisk(task, { predecessors, referenceDate });

    assert.equal(risk.isBlocked, true);
    assert.ok(risk.riskScore >= 40);
    assert.ok(risk.reasons.some((r) => r.includes('cascading delay')));
    assert.match(risk.recommendedAction, /prerequisite/i);
  });

  it('detects assignee workload overload and high downstream impact', () => {
    const task = {
      id: 'task-5',
      title: 'Critical Database Migration',
      status: TASK_STATUS.IN_PROGRESS,
      dueDate: new Date('2026-10-29T06:00:00Z'), // ~18 hours away
      estimatedHours: 20, // Estimated hours (20h) > hours left (18h)
    };

    const risk = calculateTaskRisk(task, {
      predecessors: [],
      affectedDownstreamCount: 4, // Critical bottleneck
      assigneeActiveTaskCount: 6, // Overloaded assignee
      referenceDate,
    });

    assert.equal(risk.riskLevel, RISK_LEVEL.HIGH);
    assert.ok(risk.reasons.some((r) => r.includes('exceeds remaining time')));
    assert.ok(risk.reasons.some((r) => r.includes('workload')));
    assert.ok(risk.reasons.some((r) => r.includes('bottleneck')));
  });
});
