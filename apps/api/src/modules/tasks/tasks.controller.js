const tasksService = require('./tasks.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');

async function getTasks(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    const { tasks, total } = await tasksService.getTasks(req.user.id, {
      projectId: req.query.projectId,
      teamId: req.query.teamId,
      status: req.query.status,
      priority: req.query.priority,
      assigneeId: req.query.assigneeId,
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      page,
      limit,
    });

    return sendPaginated(res, tasks, { page, limit, totalItems: total });
  } catch (err) {
    return next(err);
  }
}

async function getTaskById(req, res, next) {
  try {
    const task = await tasksService.getTaskById(req.params.taskId, req.user.id);
    return sendSuccess(res, { task });
  } catch (err) {
    return next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const task = await tasksService.createTask(req.user.id, req.body);
    return sendSuccess(res, { task }, 'Task created successfully.', 201);
  } catch (err) {
    return next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const task = await tasksService.updateTask(req.params.taskId, req.user.id, req.body);
    return sendSuccess(res, { task }, 'Task updated successfully.');
  } catch (err) {
    return next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    await tasksService.deleteTask(req.params.taskId, req.user.id);
    return sendSuccess(res, null, 'Task deleted successfully.');
  } catch (err) {
    return next(err);
  }
}

async function addDependency(req, res, next) {
  try {
    const dependency = await tasksService.addDependency(
      req.params.taskId,
      req.body.predecessorTaskId,
      req.user.id
    );
    return sendSuccess(res, { dependency }, 'Dependency added successfully.', 201);
  } catch (err) {
    return next(err);
  }
}

async function removeDependency(req, res, next) {
  try {
    await tasksService.removeDependency(
      req.params.taskId,
      req.params.predecessorTaskId,
      req.user.id
    );
    return sendSuccess(res, null, 'Dependency removed successfully.');
  } catch (err) {
    return next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const comment = await tasksService.addComment(
      req.params.taskId,
      req.user.id,
      req.body.content
    );
    return sendSuccess(res, { comment }, 'Comment posted successfully.', 201);
  } catch (err) {
    return next(err);
  }
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
};
