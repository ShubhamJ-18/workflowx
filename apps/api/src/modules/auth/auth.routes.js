const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authValidator = require('./auth.validator');
const { validate } = require('../../middleware/validate');
const { requireAuth } = require('../../middleware/auth');
const { authLimiter } = require('../../middleware/rateLimiter');

router.post(
  '/register',
  authLimiter,
  validate({ body: authValidator.registerSchema }),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate({ body: authValidator.loginSchema }),
  authController.login
);

router.post('/logout', requireAuth, authController.logout);

router.get('/me', requireAuth, authController.getMe);

router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: authValidator.forgotPasswordSchema }),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validate({ body: authValidator.resetPasswordSchema }),
  authController.resetPassword
);

router.put(
  '/profile',
  requireAuth,
  validate({ body: authValidator.updateProfileSchema }),
  authController.updateProfile
);

router.put(
  '/change-password',
  requireAuth,
  validate({ body: authValidator.changePasswordSchema }),
  authController.changePassword
);

module.exports = router;
