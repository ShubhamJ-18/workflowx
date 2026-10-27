const { prisma } = require('../../config/prisma');

async function getUserNotifications(userId, { unreadOnly = false, page = 1, limit = 20 }) {
  const where = {
    recipientId: userId,
    ...(unreadOnly ? { readAt: null } : {}),
  };

  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: {
        recipientId: userId,
        readAt: null,
      },
    }),
  ]);

  return { notifications, total, unreadCount };
}

async function markNotificationAsRead(notificationId, userId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification || notification.recipientId !== userId) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

async function markAllAsRead(userId) {
  await prisma.notification.updateMany({
    where: {
      recipientId: userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return { success: true };
}

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
};
