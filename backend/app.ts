import express, { type Express } from 'express';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes';
import { corsMiddleware, helmetMiddleware } from './middleware/security';
import { errorHandler, notFoundApiHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmetMiddleware);
  app.use(corsMiddleware);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use('/api', apiRoutes);
  app.use('/api', notFoundApiHandler);

  app.use(errorHandler);
  return app;
}
