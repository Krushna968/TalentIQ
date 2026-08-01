import { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { authService } from '../services/auth.service.js';
import { auditService } from '../services/audit.service.js';
import { AppError } from '../middleware/error.middleware.js';
import { env } from '../config/env.js';

function setRefreshCookie(res: Response, token: string): void {
  const isProd = env.NODE_ENV === 'production' || env.APP_ENV === 'production';
  res.cookie('talentiq_refresh', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path: '/', // Allow access across /api/auth/refresh and /api/auth/logout
    maxAge: env.REFRESH_TOKEN_TTL * 1000,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie('talentiq_refresh', { path: '/' });
}

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password, name, role, organizationName } = req.body;
  const user = await authService.createUser(email, password, name, role || 'CANDIDATE', organizationName);

  const accessToken = authService.generateAccessToken(user);
  const refreshToken = await authService.createRefreshToken(user.id, req.ip, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);
  await auditService.record({ userId: user.id, action: 'LOGIN_SUCCESS', ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { reason: 'registration' } });

  const { passwordHash: _hash, ...safeUser } = user;
  res.status(201).json({
    success: true,
    data: { user: safeUser, token: accessToken, accessToken },
    requestId: req.requestId,
  });
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const user = await authService.findUserByEmail(email);

  if (!user || !(await authService.comparePassword(password, user.passwordHash))) {
    if (user) {
      await auditService.record({ userId: user.id, action: 'LOGIN_FAILURE', ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    } else {
      await auditService.record({ action: 'LOGIN_FAILURE', ipAddress: req.ip, userAgent: req.headers['user-agent'], metadata: { attemptedEmail: email } });
    }
    throw new AppError(401, 'Invalid email or password', 'UNAUTHENTICATED');
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(403, `Account status is ${user.status}`, 'UNAUTHORIZED');
  }

  // Update lastLoginAt
  await authService.updateUser(user.id, { lastLoginAt: new Date() });

  const accessToken = authService.generateAccessToken(user);
  const refreshToken = await authService.createRefreshToken(user.id, req.ip, req.headers['user-agent']);
  setRefreshCookie(res, refreshToken);
  await auditService.record({ userId: user.id, action: 'LOGIN_SUCCESS', ipAddress: req.ip, userAgent: req.headers['user-agent'] });

  const { passwordHash: _hash, ...safeUser } = user;
  res.status(200).json({
    success: true,
    data: { user: safeUser, token: accessToken, accessToken },
    requestId: req.requestId,
  });
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.['talentiq_refresh'] as string | undefined;
  await authService.revokeRefreshToken(refreshToken);
  clearRefreshCookie(res);

  if (req.user) {
    await auditService.record({ userId: req.user.id, action: 'LOGOUT', ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  }

  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
    requestId: req.requestId,
  });
};

export const refresh = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.['talentiq_refresh'] as string || req.body?.refreshToken as string | undefined;
  if (!refreshToken) {
    throw new AppError(401, 'No refresh token provided in secure cookies or request', 'UNAUTHENTICATED');
  }

  const { accessToken, refreshToken: newRefreshToken, user } = await authService.rotateRefreshToken(refreshToken, req.ip, req.headers['user-agent']);
  setRefreshCookie(res, newRefreshToken);

  const { passwordHash: _hash, ...safeUser } = user;
  res.status(200).json({
    success: true,
    data: { user: safeUser, token: accessToken, accessToken },
    requestId: req.requestId,
  });
};

export const verifyEmail = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const token = (req.body?.token || req.query?.token) as string;
  if (!token) {
    throw new AppError(400, 'Verification token missing', 'VALIDATION_ERROR');
  }

  await authService.verifyEmailToken(token);
  res.status(200).json({
    success: true,
    data: { message: 'Email address successfully verified' },
    requestId: req.requestId,
  });
};

export const resendVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await authService.findUserByEmail(email);
  if (user && !user.emailVerified && user.status === 'ACTIVE') {
    await authService.generateAndSendVerificationToken(user);
  }
  res.status(200).json({
    success: true,
    data: { message: 'If an active unverified account exists for this email, a verification link has been sent' },
    requestId: req.requestId,
  });
};

export const forgotPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email } = req.body;
  await authService.requestPasswordReset(email, req.ip, req.headers['user-agent']);

  res.status(200).json({
    success: true,
    data: { message: 'If an account exists for this email, password recovery instructions have been sent' },
    requestId: req.requestId,
  });
};

export const resetPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password, req.ip, req.headers['user-agent']);

  res.status(200).json({
    success: true,
    data: { message: 'Password has been successfully reset. Please log in with your new credentials' },
    requestId: req.requestId,
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  }
  const user = await authService.findUserById(req.user.id);
  if (!user) {
    throw new AppError(404, 'User account no longer exists', 'NOT_FOUND');
  }
  const { passwordHash: _hash, ...safeUser } = user;
  res.status(200).json({
    success: true,
    data: safeUser,
    requestId: req.requestId,
  });
};

export const updateMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    throw new AppError(401, 'Not authenticated', 'UNAUTHENTICATED');
  }
  const updated = await authService.updateUser(req.user.id, req.body);
  const { passwordHash: _hash, ...safeUser } = updated;
  res.status(200).json({
    success: true,
    data: safeUser,
    requestId: req.requestId,
  });
};

