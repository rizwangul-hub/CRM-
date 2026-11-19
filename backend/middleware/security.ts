import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const helmetMiddleware = helmet({
  // Allow Google Fonts and Vite dev assets while keeping strong security headers
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  // Allow AI Studio preview iframe to embed the application cleanly
  frameguard: false,
});

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (!env.corsOrigin) {
      callback(null, true);
      return;
    }
    const allowed = env.corsOrigin
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowed.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isTest ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait a few minutes and try again.',
  },
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isTest ? 5000 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded. Please slow down and try again shortly.',
  },
});
