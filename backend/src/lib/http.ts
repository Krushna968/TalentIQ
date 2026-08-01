import type { RequestHandler, Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

// Wraps an async controller so any thrown AppError is forwarded to the shared
// errorHandler, keeping controllers to a single expressive line.
export const asyncHandler =
  (fn: (req: AuthenticatedRequest, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req as AuthenticatedRequest, res)).catch(next);
  };
