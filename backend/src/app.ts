import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { routes } from './routes/index.js';
import healthRoutes from './routes/health.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { helmetMiddleware, requestIdMiddleware, apiRateLimiter } from './middleware/security.middleware.js';

const app = express();

app.use(helmetMiddleware);
app.use(requestIdMiddleware);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || env.CORS_ORIGINS.includes(origin) || env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Origin not permitted by CORS allowlist'));
    }
  },
  credentials: true,
}));

app.use(cookieParser(process.env.COOKIE_SECRET || 'dev-cookie-secret'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(apiRateLimiter);

app.use('/', healthRoutes);
app.use('/api', routes);

app.use(errorHandler);

export default app;

