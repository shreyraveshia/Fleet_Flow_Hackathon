import { Router } from 'express';
import {
    getDashboard,
    getFuelEfficiencyData,
    getVehicleROIData,
    getMonthlySummaryData,
    getDriverStats,
    getFleetOverview,
} from '../controllers/analytics.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/fleet-overview', getFleetOverview);
router.get('/fuel-efficiency', authorize('fleet_manager', 'financial', 'safety_officer'), getFuelEfficiencyData);
router.get('/vehicle-roi', authorize('fleet_manager', 'financial'), getVehicleROIData);
router.get('/monthly-summary', authorize('fleet_manager', 'financial'), getMonthlySummaryData);
router.get('/driver-stats', authorize('fleet_manager', 'safety_officer'), getDriverStats);

export default router;
