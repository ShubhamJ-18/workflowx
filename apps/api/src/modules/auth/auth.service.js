const { prisma } = require('../../config/prisma');
const { env, isProduction } = require('../../config/env');
const { hashPassword, comparePassword, generateRandomToken, hashToken } = require('../../utils/crypto');
const { logger } = require('../../utils/logger');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction || env.SESSION_SECURE_COOKIE,
  sameSite: env.SESSION_SAME_SITE,
  path: '/',
  maxAge: env.SESSION_MAX_AGE_HOURS * 60 * 60 * 1000,
};

/**
 * Creates a server-side session stored in PostgreSQL.
 * @param {string} userId
 * @param {import('express').Request} [req]
 * @returns {Promise<{ rawToken: string, session: Object }>}
 */
async function createSession(userId, req) {
  const rawToken = generateRandomToken(32);
  const sessionTokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + env.SESSION_MAX_AGE_HOURS * 60 * 60 * 1000);

  const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || null;
  const userAgent = req?.headers['user-agent'] || null;

  const session = await prisma.session.create({
    data: {
      userId,
      sessionTokenHash,
      expiresAt,
      ipAddress: typeof ipAddress === 'string' ? ipAddress.slice(0, 100) : null,
      userAgent: typeof userAgent === 'string' ? userAgent.slice(0, 255) : null,
    },
  });

  return { rawToken, session };
}

/**
 * Sets session cookie on Express response.
 */
function setSessionCookie(res, rawToken) {
  res.cookie(env.SESSION_COOKIE_NAME, rawToken, COOKIE_OPTIONS);
}

/**
 * Clears session cookie on Express response.
 */
function clearSessionCookie(res) {
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction || env.SESSION_SECURE_COOKIE,
    sameSite: env.SESSION_SAME_SITE,
    path: '/',
  });
}

/**
 * Register a new user.
 */
async function registerUser({ name, email, password }, req) {
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
    },
  });

  const { rawToken } = await createSession(user.id, req);
  return { user, rawToken };
}

/**
 * Authenticate user with credentials.
 */
async function loginUser({ email, password }, req) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Avoid user enumeration
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Session rotation: generate fresh session token
  const { rawToken } = await createSession(user.id, req);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    rawToken,
  };
}

/**
 * Invalidate an active session.
 */
async function logoutSession(sessionId) {
  if (sessionId) {
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }
}

/**
 * Request password recovery.
 */
async function requestPasswordReset(email) {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success even if user not found to prevent email enumeration
  if (!user) {
    return { success: true };
  }

  const rawResetToken = generateRandomToken(32);
  const tokenHash = hashToken(rawResetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  if (env.ENABLE_DEV_PASSWORD_RECOVERY && !isProduction) {
    logger.info(`[DEV PASSWORD RECOVERY] Reset link for ${email}: ${env.API_URL.replace('4000', '3000')}/reset-password?token=${rawResetToken}`);
  }

  return { success: true };
}

/**
 * Complete password reset with token.
 */
async function resetPassword({ token, newPassword }) {
  const tokenHash = hashToken(token);
  const now = new Date();

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt <= now) {
    const error = new Error('Password reset link is invalid, expired, or has already been used.');
    error.statusCode = 400;
    throw error;
  }

  const newHash = await hashPassword(newPassword);

  // In a transaction: update user password, mark token as used, and revoke all active sessions
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { usedAt: now },
    }),
    prisma.session.deleteMany({
      where: { userId: resetRecord.userId },
    }),
  ]);

  return { success: true };
}

module.exports = {
  createSession,
  setSessionCookie,
  clearSessionCookie,
  registerUser,
  loginUser,
  logoutSession,
  requestPasswordReset,
  resetPassword,
  COOKIE_OPTIONS,
};
