const projectsService = require('./projects.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');

async function getProjects(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const { projects, total } = await projectsService.getProjects(req.user.id, {
      teamId: req.query.teamId,
      status: req.query.status,
      search: req.query.search,
      page,
      limit,
    });

    return sendPaginated(res, projects, { page, limit, totalItems: total });
  } catch (err) {
    return next(err);
  }
}

async function getProjectById(req, res, next) {
  try {
    const project = await projectsService.getProjectById(req.params.projectId, req.user.id);
    return sendSuccess(res, { project });
  } catch (err) {
    return next(err);
  }
}

async function createProject(req, res, next) {
  try {
    const project = await projectsService.createProject(req.user.id, req.body);
    return sendSuccess(res, { project }, 'Project created successfully.', 201);
  } catch (err) {
    return next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await projectsService.updateProject(req.params.projectId, req.user.id, req.body);
    return sendSuccess(res, { project }, 'Project updated successfully.');
  } catch (err) {
    return next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    await projectsService.deleteProject(req.params.projectId, req.user.id);
    return sendSuccess(res, null, 'Project deleted successfully.');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
