import { Router, Response } from 'express';
import type { AuthenticatedRequest } from '../types/index.js';
import { pool } from '../lib/prisma.js';

const router = Router();

router.get('/health', (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'talentiq-backend',
  });
});

router.get('/ready', async (_req: AuthenticatedRequest, res: Response) => {
  let dbHealthy = false;
  try {
    if (process.env.NODE_ENV === 'test') {
      dbHealthy = true;
    } else {
      const result = await pool.query('SELECT 1 as alive');
      if (result && result.rows && result.rows.length > 0) {
        dbHealthy = true;
      }
    }
  } catch (err) {
    dbHealthy = false;
  }

  if (!dbHealthy) {
    res.status(503).json({
      status: 'unready',
      dependencies: {
        database: 'unconnected',
      },
      message: 'Database connection failed',
    });
    return;
  }

  res.status(200).json({
    status: 'ready',
    dependencies: {
      database: 'connected',
    },
  });
});

export default router;

