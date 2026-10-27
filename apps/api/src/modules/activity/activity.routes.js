const express = require('express');
const router = express.Router();
const activityController = require('./activity.controller');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', activityController.getActivity);

module.exports = router;
