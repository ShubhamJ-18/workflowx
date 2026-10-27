const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  validateBasicDependency,
  wouldCreateCycle,
  getDownstreamTasks,
  getUpstreamTasks,
} = require('@workflowx/shared');

describe('Dependency Engine — Graph Traversal & Cycle Detection', () => {
  it('rejects self-dependencies', () => {
    const result = validateBasicDependency('task-A', 'task-A');
    assert.equal(result.valid, false);
    assert.match(result.error, /self-dependency/i);
  });

  it('accepts valid linear dependencies', () => {
    const existing = [
      { predecessorTaskId: 'task-A', successorTaskId: 'task-B' },
      { predecessorTaskId: 'task-B', successorTaskId: 'task-C' },
    ];

    // Propose C -> D
    const cycleCheck = wouldCreateCycle(existing, 'task-C', 'task-D');
    assert.equal(cycleCheck.wouldCreateCycle, false);
  });

  it('detects simple direct 2-node circular dependency (A -> B, then B -> A)', () => {
    const existing = [
      { predecessorTaskId: 'task-A', successorTaskId: 'task-B' },
    ];

    // Propose B -> A
    const cycleCheck = wouldCreateCycle(existing, 'task-B', 'task-A');
    assert.equal(cycleCheck.wouldCreateCycle, true);
    assert.deepEqual(cycleCheck.cyclePath, ['task-B', 'task-A', 'task-B']);
  });

  it('detects complex multi-hop circular dependency (A -> B -> C -> D, then D -> A)', () => {
    const existing = [
      { predecessorTaskId: 'task-A', successorTaskId: 'task-B' },
      { predecessorTaskId: 'task-B', successorTaskId: 'task-C' },
      { predecessorTaskId: 'task-C', successorTaskId: 'task-D' },
    ];

    // Propose D -> A
    const cycleCheck = wouldCreateCycle(existing, 'task-D', 'task-A');
    assert.equal(cycleCheck.wouldCreateCycle, true);
    assert.deepEqual(cycleCheck.cyclePath, ['task-D', 'task-A', 'task-B', 'task-C', 'task-D']);
  });

  it('correctly computes all transitive downstream tasks', () => {
    const dependencies = [
      { predecessorTaskId: 'task-A', successorTaskId: 'task-B' },
      { predecessorTaskId: 'task-B', successorTaskId: 'task-C' },
      { predecessorTaskId: 'task-B', successorTaskId: 'task-D' },
      { predecessorTaskId: 'task-D', successorTaskId: 'task-E' },
    ];

    const downstreamFromA = getDownstreamTasks(dependencies, 'task-A');
    assert.equal(downstreamFromA.length, 4);
    assert.ok(downstreamFromA.includes('task-B'));
    assert.ok(downstreamFromA.includes('task-C'));
    assert.ok(downstreamFromA.includes('task-D'));
    assert.ok(downstreamFromA.includes('task-E'));

    const downstreamFromD = getDownstreamTasks(dependencies, 'task-D');
    assert.deepEqual(downstreamFromD, ['task-E']);
  });

  it('correctly computes all upstream prerequisite tasks', () => {
    const dependencies = [
      { predecessorTaskId: 'task-A', successorTaskId: 'task-B' },
      { predecessorTaskId: 'task-B', successorTaskId: 'task-C' },
      { predecessorTaskId: 'task-Z', successorTaskId: 'task-C' },
    ];

    const upstreamToC = getUpstreamTasks(dependencies, 'task-C');
    assert.equal(upstreamToC.length, 3);
    assert.ok(upstreamToC.includes('task-A'));
    assert.ok(upstreamToC.includes('task-B'));
    assert.ok(upstreamToC.includes('task-Z'));
  });
});
