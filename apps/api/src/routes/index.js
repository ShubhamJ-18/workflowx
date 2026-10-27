const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/auth.routes');
const teamsRoutes = require('../modules/teams/teams.routes');
const projectsRoutes = require('../modules/projects/projects.routes');
const tasksRoutes = require('../modules/tasks/tasks.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const notificationsRoutes = require('../modules/notifications/notifications.routes');
const activityRoutes = require('../modules/activity/activity.routes');

// Health endpoint under /api/v1
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'WorkFlowX API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/teams', teamsRoutes);
router.use('/projects', projectsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/activity', activityRoutes);

module.exports = router;
