import { Router } from 'express';
import {
    exportVehiclesCSV,
    exportTripsCSV,
    exportExpensesCSV,
    exportAnalyticsPDF,
    exportMonthlyReportPDF,
} from '../controllers/export.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(protect);

// CSV Exports
router.get('/vehicles-csv', authorize('fleet_manager', 'financial'), exportVehiclesCSV);
router.get('/trips-csv', authorize('fleet_manager', 'financial'), exportTripsCSV);
router.get('/expenses-csv', authorize('fleet_manager', 'financial'), exportExpensesCSV);

// PDF Exports
router.get('/analytics-pdf', authorize('fleet_manager', 'financial'), exportAnalyticsPDF);
router.get('/monthly-report-pdf', authorize('fleet_manager', 'financial'), exportMonthlyReportPDF);

export default router;
