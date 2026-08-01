import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { prisma } from './lib/prisma.js';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    console.error('Database readiness check failed', error);
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use('/api', routes);

app.use(errorHandler);

export default app;
