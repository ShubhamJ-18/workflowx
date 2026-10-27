const { ZodError } = require('zod');
const { sendError } = require('../utils/response');

/**
 * Validates request schema using Zod.
 * @param {Object} schemas
 * @param {import('zod').ZodSchema} [schemas.body]
 * @param {import('zod').ZodSchema} [schemas.query]
 * @param {import('zod').ZodSchema} [schemas.params]
 */
function validate({ body, query, params }) {
  return async (req, res, next) => {
    try {
      if (body) {
        req.body = await body.parseAsync(req.body);
      }
      if (query) {
        req.query = await query.parseAsync(req.query);
      }
      if (params) {
        req.params = await params.parseAsync(req.params);
      }
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        return sendError(res, 'Validation failed: Invalid input provided.', 400, formattedErrors);
      }
      return next(err);
    }
  };
}

module.exports = { validate };
