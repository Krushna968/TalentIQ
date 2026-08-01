import { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_SERVER_ERROR',
    public details: { field?: string; message: string }[] = []
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Redact sensitive keys from log output
function redactSensitive(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitive);
  
  const redacted: Record<string, unknown> = {};
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'accessToken', 'refreshToken', 'resetToken', 'authorization', 'secret', 'cookie'];
  
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitive(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export const errorHandler = (err: Error & { statusCode?: number; code?: string; type?: string }, req: AuthenticatedRequest, res: Response, _next: NextFunction): void => {
  const requestId = req.requestId || 'unknown';

  // Handle malformed JSON or body parsing errors from express
  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON syntax in request body',
      },
      requestId,
    });
    return;
  }

  // Handle known AppErrors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      console.error(`[Error ${requestId}] ${err.statusCode} - ${err.message}`, redactSensitive({ body: req.body, query: req.query }));
    }
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'APP_ERROR',
        message: err.message,
        ...(err.details.length > 0 ? { details: err.details } : {}),
      },
      requestId,
    });
    return;
  }

  // Handle standard HTTP / Prisma unexpected errors
  const statusCode = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
  const message = isProd && statusCode === 500 ? 'Internal server error' : (err.message || 'Internal server error');
  const code = statusCode === 404 ? 'NOT_FOUND' : (err.code || 'INTERNAL_SERVER_ERROR');

  if (statusCode >= 500 || !isProd) {
    console.error(`[Unhandled Error ${requestId}] ${err.stack || err.message}`, redactSensitive({
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      query: req.query,
    }));
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
    requestId,
  });
};

