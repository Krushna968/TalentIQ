import { Request, Response } from 'express';

export const register = async (req: Request, res: Response) => {
  res.json({ user: { id: 'demo-user', email: req.body.email, role: 'candidate' }, token: 'demo-jwt-token' });
};

export const login = async (req: Request, res: Response) => {
  res.json({ user: { id: 'demo-user', email: req.body.email || 'demo@talentiq.ai', role: 'recruiter' }, token: 'demo-jwt-token' });
};

export const logout = async (_req: Request, res: Response) => {
  res.json({ message: 'Logged out' });
};

export const refresh = async (_req: Request, res: Response) => {
  res.json({ token: 'demo-jwt-token' });
};

export const getMe = async (_req: Request, res: Response) => {
  res.json({ id: 'demo-user', email: 'demo@talentiq.ai', name: 'Demo User', role: 'recruiter' });
};

export const updateMe = async (req: Request, res: Response) => {
  res.json({ id: 'demo-user', ...req.body });
};
