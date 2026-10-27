const teamsService = require('./teams.service');
const { sendSuccess } = require('../../utils/response');

async function getTeams(req, res, next) {
  try {
    const teams = await teamsService.getUserTeams(req.user.id);
    return sendSuccess(res, { teams });
  } catch (err) {
    return next(err);
  }
}

async function createTeam(req, res, next) {
  try {
    const team = await teamsService.createTeam(req.user.id, req.body);
    return sendSuccess(res, { team }, 'Team created successfully.', 201);
  } catch (err) {
    return next(err);
  }
}

async function getTeamById(req, res, next) {
  try {
    const team = await teamsService.getTeamDetails(req.params.teamId, req.user.id);
    return sendSuccess(res, { team });
  } catch (err) {
    return next(err);
  }
}

async function updateTeam(req, res, next) {
  try {
    const updated = await teamsService.updateTeam(req.params.teamId, req.user.id, req.body);
    return sendSuccess(res, { team: updated }, 'Team updated successfully.');
  } catch (err) {
    return next(err);
  }
}

async function deleteTeam(req, res, next) {
  try {
    await teamsService.deleteTeam(req.params.teamId);
    return sendSuccess(res, null, 'Team deleted successfully.');
  } catch (err) {
    return next(err);
  }
}

async function inviteMember(req, res, next) {
  try {
    const result = await teamsService.inviteMember(req.params.teamId, req.user.id, req.body);
    return sendSuccess(res, result, 'Invitation generated successfully.', 201);
  } catch (err) {
    return next(err);
  }
}

async function acceptInvitation(req, res, next) {
  try {
    const result = await teamsService.acceptInvitation(req.body.token, req.user.id);
    return sendSuccess(res, result, 'Successfully joined the team!');
  } catch (err) {
    return next(err);
  }
}

async function updateMemberRole(req, res, next) {
  try {
    const updated = await teamsService.updateMemberRole(
      req.params.teamId,
      req.user.id,
      req.params.userId,
      req.body.role
    );
    return sendSuccess(res, { member: updated }, 'Member role updated successfully.');
  } catch (err) {
    return next(err);
  }
}

async function removeMember(req, res, next) {
  try {
    await teamsService.removeMember(req.params.teamId, req.user.id, req.params.userId);
    return sendSuccess(res, null, 'Member removed from team.');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getTeams,
  createTeam,
  getTeamById,
  updateTeam,
  deleteTeam,
  inviteMember,
  acceptInvitation,
  updateMemberRole,
  removeMember,
};
