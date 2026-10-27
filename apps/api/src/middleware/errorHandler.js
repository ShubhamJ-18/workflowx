const { ZodError } = require('zod');
const { isProduction } = require('../config/env');
const { logger } = require('../utils/logger');
const { sendError } = require('../utils/response');

/**
 * Centralized express error handler middleware.
 */
function errorHandler(err, req, res, next) {
  logger.error(`Error processing ${req.method} ${req.url}: ${err.message}`, err);

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formatted = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 'Validation failed.', 400, formatted);
  }

  // 2. Prisma Known Request Errors
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    return sendError(res, `A record with this ${target} already exists.`, 409);
  }

  if (err.code === 'P2025') {
    return sendError(res, 'The requested record was not found.', 404);
  }

  if (err.code === 'P2003') {
    return sendError(res, 'Foreign key constraint violated: referenced entity does not exist.', 400);
  }

  // 3. Custom status codes
  const status = err.statusCode || err.status || 500;
  const message = isProduction && status === 500 ? 'Internal server error occurred.' : err.message;

  return sendError(res, message, status);
}

module.exports = { errorHandler };
