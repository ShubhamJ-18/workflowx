const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/metrics', dashboardController.getMetrics);

module.exports = router;
