const authService = require('./auth.service');
const { prisma } = require('../../config/prisma');
const { sendSuccess, sendError } = require('../../utils/response');
const { hashPassword, comparePassword } = require('../../utils/crypto');

async function register(req, res, next) {
  try {
    const { user, rawToken } = await authService.registerUser(req.body, req);
    authService.setSessionCookie(res, rawToken);

    return sendSuccess(
      res,
      { user, token: rawToken },
      'Registration successful. Welcome to WorkFlowX!',
      201
    );
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { user, rawToken } = await authService.loginUser(req.body, req);
    authService.setSessionCookie(res, rawToken);

    return sendSuccess(
      res,
      { user, token: rawToken },
      'Login successful. Welcome back!'
    );
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    if (req.session) {
      await authService.logoutSession(req.session.id);
    }
    authService.clearSessionCookie(res);

    return sendSuccess(res, null, 'Logged out successfully.');
  } catch (err) {
    return next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        memberships: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return sendError(res, 'User not found.', 404);
    }

    return sendSuccess(res, { user });
  } catch (err) {
    return next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    await authService.requestPasswordReset(req.body.email);
    return sendSuccess(
      res,
      null,
      'If an account exists with this email, password reset instructions have been generated.'
    );
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword(req.body);
    authService.clearSessionCookie(res);
    return sendSuccess(
      res,
      null,
      'Password has been reset successfully. Please log in with your new credentials.'
    );
  } catch (err) {
    return next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { name, avatarUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return sendSuccess(res, { user: updated }, 'Profile updated successfully.');
  } catch (err) {
    return next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return sendError(res, 'Current password is incorrect.', 400);
    }

    const newHash = await hashPassword(newPassword);

    // Update password and keep only current session
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
      prisma.session.deleteMany({
        where: {
          userId: user.id,
          id: { not: req.session.id },
        },
      }),
    ]);

    return sendSuccess(res, null, 'Password changed successfully.');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};
