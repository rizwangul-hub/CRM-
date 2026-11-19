import { Router } from 'express';
import {
  handleGetAuditLogs,
  handleGetDashboardOverview,
} from '../controllers/dashboard.controller';
import { authorize, resolveDemoRole } from '../middleware/auth';

const router = Router();

router.use(resolveDemoRole);

router.get('/overview', handleGetDashboardOverview);
router.get('/audit-logs', authorize('ADMIN', 'MANAGER'), handleGetAuditLogs);

export default router;
