export const env = {
  PORT: parseInt(process.env.PORT || '4000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  APP_ENV: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/talentiq',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-do-not-use-in-prod',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-access-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  ACCESS_TOKEN_TTL: parseInt(process.env.ACCESS_TOKEN_TTL || '900', 10), // 15 minutes in seconds
  REFRESH_TOKEN_TTL: parseInt(process.env.REFRESH_TOKEN_TTL || '604800', 10), // 7 days in seconds
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_CALLBACK_URL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:4000/api/auth/github/callback',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  CORS_ORIGINS: (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim()),
  EMAIL_PROVIDER_TYPE: process.env.EMAIL_PROVIDER_TYPE || 'console', // 'console' | 'smtp' | 'sendgrid'
  EMAIL_PROVIDER_HOST: process.env.EMAIL_PROVIDER_HOST || '',
  EMAIL_PROVIDER_PORT: parseInt(process.env.EMAIL_PROVIDER_PORT || '587', 10),
  EMAIL_PROVIDER_USER: process.env.EMAIL_PROVIDER_USER || '',
  EMAIL_PROVIDER_PASS: process.env.EMAIL_PROVIDER_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'no-reply@talentiq.ai',
};

export function validateEnv(): void {
  if (env.NODE_ENV === 'production') {
    const missing: string[] = [];
    if (!process.env.DATABASE_URL) missing.push('DATABASE_URL');
    if (!process.env.JWT_SECRET && !process.env.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET');
    if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
    
    if (missing.length > 0) {
      throw new Error(`FATAL: Missing required production environment variables: ${missing.join(', ')}`);
    }
  }
}

