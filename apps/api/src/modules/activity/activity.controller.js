const activityService = require('./activity.service');
const { sendPaginated } = require('../../utils/response');

async function getActivity(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;

    const { activities, total } = await activityService.getActivityHistory(req.user.id, {
      teamId: req.query.teamId,
      entityType: req.query.entityType,
      page,
      limit,
    });

    return sendPaginated(res, activities, { page, limit, totalItems: total });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getActivity,
};
