const rateLimit = require('express-rate-limit');
const { env, isTest } = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * General API rate limiter for standard endpoints.
 */
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: isTest ? 10000 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many requests from this IP address. Please try again later.',
      429
    );
  },
});

/**
 * Stricter rate limiter for sensitive authentication endpoints.
 */
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: isTest ? 10000 : env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      429
    );
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
};
