import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.user = { id: 'demo-user', email: 'demo@talentiq.ai', role: 'admin' };
  next();
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
};
