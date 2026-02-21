import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(protect);

router.get('/', authorize('fleet_manager'), getAuditLogs);

export default router;
