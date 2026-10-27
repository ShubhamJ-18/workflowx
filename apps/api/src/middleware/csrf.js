const { env, isDev, isTest } = require('../config/env');
const { sendError } = require('../utils/response');

/**
 * Origin and Referer validation middleware for state-changing requests.
 * Protects cookie-based sessions against Cross-Site Request Forgery.
 */
function csrfProtection(req, res, next) {
  // Safe HTTP methods do not change state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Bypass in automated tests
  if (isTest) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  // In development, also accept localhost/127.0.0.1
  if (isDev) {
    allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
  }

  if (origin) {
    const isAllowed = allowedOrigins.some((allowed) => origin === allowed || origin.startsWith(allowed));
    if (!isAllowed) {
      return sendError(res, 'CSRF verification failed: Forbidden request origin.', 403);
    }
    return next();
  }

  if (referer) {
    const isAllowed = allowedOrigins.some((allowed) => referer.startsWith(allowed));
    if (!isAllowed) {
      return sendError(res, 'CSRF verification failed: Forbidden request referer.', 403);
    }
    return next();
  }

  // If both origin and referer are missing in production on a state-changing cookie request
  if (!isDev && req.cookies && req.cookies[env.SESSION_COOKIE_NAME]) {
    return sendError(res, 'CSRF verification failed: Missing origin/referer header.', 403);
  }

  return next();
}

module.exports = { csrfProtection };
