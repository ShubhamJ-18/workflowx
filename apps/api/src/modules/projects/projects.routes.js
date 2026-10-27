const express = require('express');
const router = express.Router();
const projectsController = require('./projects.controller');
const projectsValidator = require('./projects.validator');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { requireTeamRole } = require('../../middleware/rbac');
const { ROLES } = require('@workflowx/shared');

router.use(requireAuth);

router.get('/', projectsController.getProjects);

router.post(
  '/',
  validate({ body: projectsValidator.createProjectSchema }),
  requireTeamRole(ROLES.MEMBER),
  projectsController.createProject
);

router.get('/:projectId', requireTeamRole(ROLES.MEMBER), projectsController.getProjectById);

router.put(
  '/:projectId',
  requireTeamRole(ROLES.ADMIN),
  validate({ body: projectsValidator.updateProjectSchema }),
  projectsController.updateProject
);

router.delete('/:projectId', requireTeamRole(ROLES.ADMIN), projectsController.deleteProject);

module.exports = router;
