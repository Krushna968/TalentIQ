import { Response, NextFunction } from 'express';
import { verifyAccessToken, AuthError } from '../services/auth.service.js';
import { param } from '../utils/http.js';
import type { AuthenticatedRequest, Role } from '../types/index.js';

const bearer = (req: AuthenticatedRequest) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7).trim() || null;
};

/** Rejects the request unless it carries a valid access token. */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = bearer(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (error) {
    res.status(error instanceof AuthError ? error.status : 401).json({
      error: error instanceof Error ? error.message : 'Authentication failed',
    });
  }
};

/** Attaches the principal when a token is present, but never blocks the request. */
export const optionalAuthenticate = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const token = bearer(req);
  if (token) {
    try {
      req.user = verifyAccessToken(token);
    } catch {
      // An unusable token is treated the same as no token on public routes.
    }
  }
  next();
};

export const authorize = (...roles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have access to this resource' });
      return;
    }
    next();
  };
};

export const isStaff = (role: Role) => role === 'admin' || role === 'reviewer';

/**
 * Resolves which candidate a request may act on.
 *
 * Candidates are locked to their own profile. Recruiters, reviewers and admins
 * may target any candidate. A candidate id supplied in the URL is only honoured
 * when the caller is permitted to use it.
 */
export function resolveCandidateId(req: AuthenticatedRequest, requested?: unknown): string {
  const user = req.user;
  if (!user) throw new AuthError('Authentication required', 401);

  const target = param(requested).trim() || user.candidateId;
  if (!target) throw new AuthError('No candidate profile is linked to this account', 404);

  if (user.role === 'candidate') {
    if (!user.candidateId) throw new AuthError('No candidate profile is linked to this account', 404);
    if (target !== user.candidateId) throw new AuthError('You can only access your own candidate profile', 403);
    return user.candidateId;
  }

  return target;
}

/** Same as resolveCandidateId, but additionally requires write permission. */
export function resolveWritableCandidateId(req: AuthenticatedRequest, requested?: unknown): string {
  const user = req.user;
  if (!user) throw new AuthError('Authentication required', 401);
  const target = resolveCandidateId(req, requested);
  if (user.role === 'recruiter' && target !== user.candidateId) {
    throw new AuthError('Recruiters cannot modify a candidate profile', 403);
  }
  return target;
}
