import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import * as auth from '../services/auth.service.js';
import { handle } from '../utils/http.js';
import { logger } from '../utils/logger.js';

export const register = handle<AuthenticatedRequest, Response>('auth.register', async (req, res) => {
  const result = await auth.register(req.body);
  logger.info('User registered', { userId: result.user.id, role: result.user.role });
  res.status(201).json(result);
});

export const login = handle<AuthenticatedRequest, Response>('auth.login', async (req, res) => {
  res.json(await auth.login(req.body.email, req.body.password));
});

export const logout = handle<AuthenticatedRequest, Response>('auth.logout', async (req, res) => {
  await auth.logout(req.body?.refreshToken, req.user?.id);
  res.json({ message: 'Logged out' });
});

export const refresh = handle<AuthenticatedRequest, Response>('auth.refresh', async (req, res) => {
  res.json(await auth.refresh(req.body.refreshToken));
});

export const getMe = handle<AuthenticatedRequest, Response>('auth.getMe', async (req, res) => {
  res.json(await auth.getProfile(req.user!.id));
});

export const updateMe = handle<AuthenticatedRequest, Response>('auth.updateMe', async (req, res) => {
  res.json(await auth.updateProfile(req.user!.id, req.body));
});
