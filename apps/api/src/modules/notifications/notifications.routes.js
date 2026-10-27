const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', notificationsController.getNotifications);
router.patch('/:notificationId/read', notificationsController.markAsRead);
router.post('/read-all', notificationsController.markAllAsRead);

module.exports = router;
