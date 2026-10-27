const express = require('express');
const router = express.Router();
const teamsController = require('./teams.controller');
const teamsValidator = require('./teams.validator');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { requireTeamRole } = require('../../middleware/rbac');
const { ROLES } = require('@workflowx/shared');

router.use(requireAuth);

router.get('/', teamsController.getTeams);

router.post(
  '/',
  validate({ body: teamsValidator.createTeamSchema }),
  teamsController.createTeam
);

router.post(
  '/invitations/accept',
  validate({ body: teamsValidator.acceptInvitationSchema }),
  teamsController.acceptInvitation
);

router.get('/:teamId', requireTeamRole(ROLES.MEMBER), teamsController.getTeamById);

router.put(
  '/:teamId',
  requireTeamRole(ROLES.ADMIN),
  validate({ body: teamsValidator.updateTeamSchema }),
  teamsController.updateTeam
);

router.delete('/:teamId', requireTeamRole(ROLES.OWNER), teamsController.deleteTeam);

router.post(
  '/:teamId/members',
  requireTeamRole(ROLES.ADMIN),
  validate({ body: teamsValidator.inviteMemberSchema }),
  teamsController.inviteMember
);

router.put(
  '/:teamId/members/:userId',
  requireTeamRole(ROLES.OWNER),
  validate({ body: teamsValidator.updateMemberRoleSchema }),
  teamsController.updateMemberRole
);

router.delete(
  '/:teamId/members/:userId',
  requireTeamRole(ROLES.ADMIN),
  teamsController.removeMember
);

module.exports = router;
