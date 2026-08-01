import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { authService } from '../services/auth.service.js';
import { AppError } from './error.middleware.js';

/**
 * Verify JWT access token from Authorization header or cookie
 */
export const requireAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies['talentiq_access']) {
    token = req.cookies['talentiq_access'] as string;
  }

  if (!token) {
    throw new AppError(401, 'Authentication credentials missing or invalid', 'UNAUTHENTICATED');
  }

  try {
    const decoded = authService.verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    throw new AppError(401, 'Invalid or expired access token', 'UNAUTHENTICATED');
  }
};

// Backwards compatibility alias for existing route definitions
export const authenticate = requireAuth;

/**
 * Require specific Role(s) (CANDIDATE, RECRUITER, ADMIN)
 */
export const requireRole = (...allowedRoles: string[]) => {
  const normalizedRoles = allowedRoles.map(r => r.toUpperCase());
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !normalizedRoles.includes(req.user.role.toUpperCase())) {
      res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: `Forbidden: requires one of the following roles [${normalizedRoles.join(', ')}]`,
        },
        requestId: req.requestId || 'unknown',
      });
      return;
    }
    next();
  };
};

export const authorize = requireRole;

/**
 * Require ownership of a resource (matching ID in params against authenticated user ID)
 * Admins bypass ownership restrictions.
 */
export const requireOwnership = (idParam: string = 'id') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Unauthenticated' }, requestId: req.requestId });
      return;
    }

    const targetId = req.params[idParam] || req.query[idParam] || req.body[idParam];
    if (req.user.role === 'ADMIN' || (targetId && targetId === req.user.id)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Forbidden: You do not have ownership access to this resource',
      },
      requestId: req.requestId || 'unknown',
    });
  };
};

/**
 * Require Organization tenant access for Recruiters
 */
export const requireOrganizationAccess = () => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Unauthenticated' }, requestId: req.requestId });
      return;
    }

    if (req.user.role === 'ADMIN') {
      next();
      return;
    }

    if (req.user.role !== 'RECRUITER' || !req.user.organizationId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Forbidden: requires active Recruiter organization membership',
        },
        requestId: req.requestId || 'unknown',
      });
      return;
    }

    next();
  };
};

