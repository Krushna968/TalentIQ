const requireInProduction = (name: string, value: string) => {
  if (process.env.NODE_ENV === 'production' && !value) {
    throw new Error(`${name} must be configured in production`);
  }
  return value;
};

const databaseUrl = requireInProduction('DATABASE_URL', process.env.DATABASE_URL || '');
const jwtSecret = requireInProduction('JWT_SECRET', process.env.JWT_SECRET || '');
const tokenEncryptionKey = requireInProduction('TOKEN_ENCRYPTION_KEY', process.env.TOKEN_ENCRYPTION_KEY || '');
const redisUrl = requireInProduction('REDIS_URL', process.env.REDIS_URL || '');

if (process.env.NODE_ENV === 'production' && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters in production');
}

if (process.env.NODE_ENV === 'production' && tokenEncryptionKey.length < 32) {
  throw new Error('TOKEN_ENCRYPTION_KEY must be at least 32 characters in production');
}

export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: databaseUrl,
  JWT_SECRET: jwtSecret || 'dev-jwt-secret',
  TOKEN_ENCRYPTION_KEY: tokenEncryptionKey,
  REDIS_URL: redisUrl || 'redis://127.0.0.1:6379',
  QUEUE_PREFIX: process.env.QUEUE_PREFIX || 'talentiq',
  WORKER_CONCURRENCY: Math.max(1, parseInt(process.env.WORKER_CONCURRENCY || '4', 10)),
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback',
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID || '',
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET || '',
  LINKEDIN_CALLBACK_URL: process.env.LINKEDIN_CALLBACK_URL || 'http://localhost:4000/api/auth/linkedin/callback',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
