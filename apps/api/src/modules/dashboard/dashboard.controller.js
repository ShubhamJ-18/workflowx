const dashboardService = require('./dashboard.service');
const { sendSuccess } = require('../../utils/response');

async function getMetrics(req, res, next) {
  try {
    const metrics = await dashboardService.getDashboardMetrics(req.user.id, req.query.teamId);
    return sendSuccess(res, { metrics });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getMetrics,
};
