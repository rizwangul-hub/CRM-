import 'dotenv/config';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.APP_PORT || 3000),
  mongodbUri: (process.env.MONGODB_URI || '').trim(),
  jwtSecret:
    (process.env.JWT_SECRET || '').trim() ||
    'celltrack-pro-dev-secret-replace-in-production-64-byte-entropy',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'celltrack_session',
  corsOrigin: (process.env.CORS_ORIGIN || '').trim(),
  appUrl: (process.env.APP_URL || 'http://localhost:3000').trim(),
} as const;
