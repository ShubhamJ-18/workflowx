/**
 * Dependency Graph Analysis Engine
 * Handles cycle detection, upstream/downstream traversals, and blocking state analysis.
 */

const { TASK_STATUS } = require('./constants');

/**
 * Validates basic dependency rules.
 * @param {string} predecessorTaskId
 * @param {string} successorTaskId
 * @returns {{ valid: boolean, error?: string }}
 */
function validateBasicDependency(predecessorTaskId, successorTaskId) {
  if (!predecessorTaskId || !successorTaskId) {
    return { valid: false, error: 'Both predecessor and successor task IDs are required.' };
  }

  if (predecessorTaskId === successorTaskId) {
    return { valid: false, error: 'A task cannot depend on itself (self-dependency).' };
  }

  return { valid: true };
}

/**
 * Builds an adjacency list from dependency records.
 * Edge direction: predecessor -> successor (meaning successor waits on predecessor).
 *
 * @param {Array<{ predecessorTaskId: string, successorTaskId: string }>} dependencies
 * @returns {Map<string, Set<string>>}
 */
function buildAdjacencyList(dependencies) {
  const adj = new Map();

  for (const dep of dependencies) {
    if (!adj.has(dep.predecessorTaskId)) {
      adj.set(dep.predecessorTaskId, new Set());
    }
    adj.get(dep.predecessorTaskId).add(dep.successorTaskId);
  }

  return adj;
}

/**
 * Detects if adding an edge (predecessorId -> successorId) will create a directed cycle.
 * Adding P -> S creates a cycle if and only if there is already a path from S to P.
 *
 * @param {Array<{ predecessorTaskId: string, successorTaskId: string }>} existingDependencies
 * @param {string} proposedPredecessorId
 * @param {string} proposedSuccessorId
 * @returns {{ wouldCreateCycle: boolean, cyclePath?: string[] }}
 */
function wouldCreateCycle(existingDependencies, proposedPredecessorId, proposedSuccessorId) {
  if (proposedPredecessorId === proposedSuccessorId) {
    return {
      wouldCreateCycle: true,
      cyclePath: [proposedPredecessorId, proposedSuccessorId],
    };
  }

  // Build adjacency list of existing edges
  const adj = buildAdjacencyList(existingDependencies);

  // Check if a path exists from proposedSuccessorId to proposedPredecessorId
  const visited = new Set();
  const path = [];

  function dfs(current, target) {
    visited.add(current);
    path.push(current);

    if (current === target) {
      return true;
    }

    const neighbors = adj.get(current);
    if (neighbors) {
      for (const next of neighbors) {
        if (!visited.has(next)) {
          if (dfs(next, target)) {
            return true;
          }
        }
      }
    }

    path.pop();
    return false;
  }

  const pathFound = dfs(proposedSuccessorId, proposedPredecessorId);

  if (pathFound) {
    // A path exists from Successor to Predecessor, so adding Predecessor -> Successor creates a loop:
    // [Predecessor, ...path, Predecessor]
    return {
      wouldCreateCycle: true,
      cyclePath: [proposedPredecessorId, ...path],
    };
  }

  return { wouldCreateCycle: false };
}

/**
 * Returns all downstream tasks (direct and transitive successors) that depend on this task.
 *
 * @param {Array<{ predecessorTaskId: string, successorTaskId: string }>} dependencies
 * @param {string} taskId
 * @returns {string[]} Array of downstream task IDs
 */
function getDownstreamTasks(dependencies, taskId) {
  const adj = buildAdjacencyList(dependencies);
  const visited = new Set();
  const queue = [taskId];

  while (queue.length > 0) {
    const current = queue.shift();
    const successors = adj.get(current);
    if (successors) {
      for (const s of successors) {
        if (!visited.has(s) && s !== taskId) {
          visited.add(s);
          queue.push(s);
        }
      }
    }
  }

  return Array.from(visited);
}

/**
 * Returns all upstream tasks (direct and transitive predecessors) that this task waits upon.
 *
 * @param {Array<{ predecessorTaskId: string, successorTaskId: string }>} dependencies
 * @param {string} taskId
 * @returns {string[]} Array of upstream task IDs
 */
function getUpstreamTasks(dependencies, taskId) {
  // Reverse adjacency list: successor -> predecessor
  const revAdj = new Map();
  for (const dep of dependencies) {
    if (!revAdj.has(dep.successorTaskId)) {
      revAdj.set(dep.successorTaskId, new Set());
    }
    revAdj.get(dep.successorTaskId).add(dep.predecessorTaskId);
  }

  const visited = new Set();
  const queue = [taskId];

  while (queue.length > 0) {
    const current = queue.shift();
    const predecessors = revAdj.get(current);
    if (predecessors) {
      for (const p of predecessors) {
        if (!visited.has(p) && p !== taskId) {
          visited.add(p);
          queue.push(p);
        }
      }
    }
  }

  return Array.from(visited);
}

/**
 * Evaluates whether a task is blocked by incomplete prerequisites.
 *
 * @param {Object} task
 * @param {Array<{ id: string, title: string, status: string, dueDate: string|Date }>} directPredecessors
 * @returns {{ isBlocked: boolean, blockingTasks: Array<{ id: string, title: string, status: string, dueDate: any }> }}
 */
function evaluateTaskBlocking(task, directPredecessors = []) {
  if (task.status === TASK_STATUS.DONE) {
    return { isBlocked: false, blockingTasks: [] };
  }

  const incompletePredecessors = directPredecessors.filter(
    (p) => p.status !== TASK_STATUS.DONE
  );

  return {
    isBlocked: incompletePredecessors.length > 0,
    blockingTasks: incompletePredecessors.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      dueDate: p.dueDate,
    })),
  };
}

module.exports = {
  validateBasicDependency,
  buildAdjacencyList,
  wouldCreateCycle,
  getDownstreamTasks,
  getUpstreamTasks,
  evaluateTaskBlocking,
};
