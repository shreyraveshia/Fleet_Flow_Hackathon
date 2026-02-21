import { Router } from 'express';
import {
    getMaintenance,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    resolveMaintenance,
    deleteMaintenance,
} from '../controllers/maintenance.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { maintenanceValidation, validate } from '../middleware/validate.middleware.js';

const router = Router();

// All maintenance routes require authentication
router.use(protect);

// Accessible by all roles
router.get('/', getMaintenance);
router.get('/:id', getMaintenanceById);

// Restricted to fleet_manager
router.post('/', authorize('fleet_manager'), maintenanceValidation, validate, createMaintenance);
router.put('/:id', authorize('fleet_manager'), updateMaintenance);
router.patch('/:id/resolve', authorize('fleet_manager'), resolveMaintenance);
router.delete('/:id', authorize('fleet_manager'), deleteMaintenance);

export default router;
