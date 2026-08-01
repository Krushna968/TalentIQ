import type { Response } from 'express';
import { AuthError } from '../services/auth.service.js';
import { logger } from './logger.js';

/** Error carrying the HTTP status a controller should return. */
export class HttpError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Express 5 types route and query values as `string | string[]`. Everything in
 * this API expects a single value, so repeated parameters collapse to the first.
 */
export const param = (value: unknown): string => {
  if (Array.isArray(value)) return String(value[0] ?? '');
  return value === undefined || value === null ? '' : String(value);
};

/** Same as `param`, but yields undefined instead of an empty string. */
export const optionalParam = (value: unknown): string | undefined => param(value) || undefined;

export const notFound = (message: string) => new HttpError(message, 404);
export const badRequest = (message: string) => new HttpError(message, 400);
export const forbidden = (message: string) => new HttpError(message, 403);
export const conflict = (message: string) => new HttpError(message, 409);
export const unavailable = (message: string) => new HttpError(message, 503);

const PRISMA_NOT_FOUND = /No .* found|Record to update not found|Record to delete does not exist/i;

/** Maps a thrown value onto a single, predictable JSON error response. */
export function fail(res: Response, error: unknown, context?: string) {
  if (error instanceof HttpError || error instanceof AuthError) {
    res.status(error.status).json({ error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : 'Request failed';

  if (PRISMA_NOT_FOUND.test(message) || /not found/i.test(message)) {
    res.status(404).json({ error: /not found/i.test(message) ? message : 'Resource not found' });
    return;
  }

  // Prisma unique-constraint violation.
  if ((error as { code?: string })?.code === 'P2002') {
    res.status(409).json({ error: 'That record already exists' });
    return;
  }

  // A validation-style Error thrown by a service is safe to surface verbatim.
  if (error instanceof Error && error.name === 'Error' && message && message.length < 300) {
    res.status(400).json({ error: message });
    return;
  }

  logger.error(context ? `Unhandled error in ${context}` : 'Unhandled error', error);
  res.status(500).json({ error: 'Internal server error' });
}

/** Wraps an async controller so rejected promises become JSON error responses. */
export const handle =
  <Req, Res extends Response>(context: string, fn: (req: Req, res: Res) => Promise<unknown>) =>
  async (req: Req, res: Res) => {
    try {
      await fn(req, res);
    } catch (error) {
      fail(res, error, context);
    }
  };
