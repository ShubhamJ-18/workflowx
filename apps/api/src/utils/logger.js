/**
 * Structured, Privacy-Conscious Logger
 * Filters sensitive credentials, tokens, and cookies from log output.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'tokenHash',
  'sessionToken',
  'sessionTokenHash',
  'authorization',
  'cookie',
  'set-cookie',
  'secret',
]);

function sanitize(obj, depth = 0) {
  if (depth > 4 || obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

const logger = {
  info(message, meta = {}) {
    console.log(
      JSON.stringify({
        level: 'info',
        timestamp: new Date().toISOString(),
        message,
        ...sanitize(meta),
      })
    );
  },

  warn(message, meta = {}) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        timestamp: new Date().toISOString(),
        message,
        ...sanitize(meta),
      })
    );
  },

  error(message, error = {}) {
    const errorMeta = {
      message: error.message || error,
      name: error.name,
      code: error.code,
    };
    if (process.env.NODE_ENV !== 'production' && error.stack) {
      errorMeta.stack = error.stack;
    }

    console.error(
      JSON.stringify({
        level: 'error',
        timestamp: new Date().toISOString(),
        message,
        error: errorMeta,
      })
    );
  },

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        JSON.stringify({
          level: 'debug',
          timestamp: new Date().toISOString(),
          message,
          ...sanitize(meta),
        })
      );
    }
  },
};

module.exports = { logger };
