const { prisma } = require('../config/prisma');
const { env } = require('../config/env');
const { hashToken } = require('../utils/crypto');
const { sendError } = require('../utils/response');

/**
 * Extracts raw session token from cookies or Bearer Authorization header.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  if (req.cookies && req.cookies[env.SESSION_COOKIE_NAME]) {
    return req.cookies[env.SESSION_COOKIE_NAME];
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Middleware requiring an authenticated, valid server-side session.
 */
async function requireAuth(req, res, next) {
  try {
    const rawToken = extractToken(req);

    if (!rawToken) {
      return sendError(res, 'Authentication required: No session provided.', 401);
    }

    const tokenHash = hashToken(rawToken);
    const now = new Date();

    const session = await prisma.session.findUnique({
      where: { sessionTokenHash: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) {
      return sendError(res, 'Invalid or expired session. Please log in again.', 401);
    }

    if (session.expiresAt <= now) {
      // Invalidate expired session from database
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return sendError(res, 'Session has expired. Please log in again.', 401);
    }

    req.user = session.user;
    req.session = session;
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Optional authentication middleware: populates req.user if present, proceeds otherwise.
 */
async function optionalAuth(req, res, next) {
  try {
    const rawToken = extractToken(req);
    if (!rawToken) {
      req.user = null;
      req.session = null;
      return next();
    }

    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { sessionTokenHash: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
    });

    if (session && session.expiresAt > new Date()) {
      req.user = session.user;
      req.session = session;
    } else {
      req.user = null;
      req.session = null;
    }

    return next();
  } catch {
    req.user = null;
    req.session = null;
    return next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  extractToken,
};
