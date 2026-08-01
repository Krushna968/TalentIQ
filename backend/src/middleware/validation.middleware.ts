import { Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { schemaRegistry } from '../schemas/index.js';
import type { AuthenticatedRequest } from '../types/index.js';

export const validate = (schemaOrName: string | ZodSchema) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      let schema: ZodSchema | undefined;
      if (typeof schemaOrName === 'string') {
        schema = schemaRegistry[schemaOrName];
        if (!schema) {
          console.warn(`[Validation] Schema '${schemaOrName}' not found in registry. Skipping.`);
          return next();
        }
      } else {
        schema = schemaOrName;
      }

      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body?: unknown; query?: unknown; params?: unknown };

      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) {
        Object.keys(parsed.query as Record<string, unknown>).forEach((k) => {
          req.query[k] = (parsed.query as Record<string, unknown>)[k] as string;
        });
      }
      if (parsed.params !== undefined) {
        Object.keys(parsed.params as Record<string, unknown>).forEach((k) => {
          req.params[k] = (parsed.params as Record<string, unknown>)[k] as string;
        });
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const details = (err as unknown as { issues: Array<{ path: PropertyKey[]; message: string }> }).issues.map(e => ({
          field: e.path.map(String).join('.').replace(/^(body|query|params)\./, ''),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details,
          },
          requestId: req.requestId,
        });
        return;
      }
      next(err);
    }
  };
};

