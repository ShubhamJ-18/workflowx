const notificationsService = require('./notifications.service');
const { sendSuccess, sendPaginated } = require('../../utils/response');

async function getNotifications(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const { notifications, total, unreadCount } = await notificationsService.getUserNotifications(
      req.user.id,
      { unreadOnly, page, limit }
    );

    return res.status(200).json({
      success: true,
      message: 'Success',
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (err) {
    return next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await notificationsService.markNotificationAsRead(
      req.params.notificationId,
      req.user.id
    );
    return sendSuccess(res, { notification }, 'Marked as read.');
  } catch (err) {
    return next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await notificationsService.markAllAsRead(req.user.id);
    return sendSuccess(res, null, 'All notifications marked as read.');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
