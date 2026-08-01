import { Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import type { AuthenticatedRequest } from '../types/index.js';

// Request ID Middleware
export const requestIdMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  req.requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
};

// Helmet configuration for standard production security headers
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Leave CSP off for decoupled React frontend or configure explicitly in production deployment
  crossOriginEmbedderPolicy: false,
});

// Stricter Rate Limiting for Authentication / Security operations
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: (req, _res) => {
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] === 'trigger-auth') {
      return 2; // Allow only 2 attempts during rate limit test
    }
    if (process.env.NODE_ENV === 'test') return 1000;
    return 20; // 20 requests per 15 mins per IP in production
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: AuthenticatedRequest, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP for security endpoints, please try again after 15 minutes',
      },
      requestId: req.requestId || 'unknown',
    });
  },
});

// General API Rate Limiting
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: (req, _res) => {
    if (process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] === 'trigger-api') {
      return 2;
    }
    if (process.env.NODE_ENV === 'test') return 5000;
    return 300; // 300 requests per 15 minutes in production
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: AuthenticatedRequest, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
      },
      requestId: req.requestId || 'unknown',
    });
  },
});
