import { Router } from 'express';
import mongoose from 'mongoose';
import usersRoutes from './users.routes';
import dashboardRoutes from './dashboard.routes';
import { getDatabaseMode } from '../config/db';
import { apiRateLimiter } from '../middleware/security';

const router = Router();

router.use(apiRateLimiter);

router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    database: {
      connected: mongoose.connection.readyState === 1,
      mode: getDatabaseMode(),
    },
    timestamp: new Date().toISOString(),
  });
});

router.use('/users', usersRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
