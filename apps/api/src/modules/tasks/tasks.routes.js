const express = require('express');
const router = express.Router();
const tasksController = require('./tasks.controller');
const tasksValidator = require('./tasks.validator');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { requireTeamRole } = require('../../middleware/rbac');
const { ROLES } = require('@workflowx/shared');

router.use(requireAuth);

router.get('/', tasksController.getTasks);

router.post(
  '/',
  validate({ body: tasksValidator.createTaskSchema }),
  requireTeamRole(ROLES.MEMBER),
  tasksController.createTask
);

router.get('/:taskId', requireTeamRole(ROLES.MEMBER), tasksController.getTaskById);

router.put(
  '/:taskId',
  requireTeamRole(ROLES.MEMBER),
  validate({ body: tasksValidator.updateTaskSchema }),
  tasksController.updateTask
);

router.patch(
  '/:taskId/status',
  requireTeamRole(ROLES.MEMBER),
  validate({ body: tasksValidator.updateTaskStatusSchema }),
  tasksController.updateTask
);

router.delete('/:taskId', requireTeamRole(ROLES.ADMIN), tasksController.deleteTask);

// Dependencies
router.post(
  '/:taskId/dependencies',
  requireTeamRole(ROLES.MEMBER),
  validate({ body: tasksValidator.addDependencySchema }),
  tasksController.addDependency
);

router.delete(
  '/:taskId/dependencies/:predecessorTaskId',
  requireTeamRole(ROLES.MEMBER),
  tasksController.removeDependency
);

// Comments
router.post(
  '/:taskId/comments',
  requireTeamRole(ROLES.MEMBER),
  validate({ body: tasksValidator.createCommentSchema }),
  tasksController.addComment
);

module.exports = router;
