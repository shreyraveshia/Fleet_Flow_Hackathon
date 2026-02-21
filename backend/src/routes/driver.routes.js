import { Router } from 'express';
import {
    getDrivers,
    getAvailableDrivers,
    getDriver,
    createDriver,
    updateDriver,
    updateDriverStatus,
    deleteDriver,
    getLicenseExpiryAlerts,
} from '../controllers/driver.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { driverValidation, validate } from '../middleware/validate.middleware.js';

const router = Router();

// All driver routes require authentication
router.use(protect);

// Routes accessible by all authenticated roles
router.get('/', getDrivers);
router.get('/available', getAvailableDrivers);

// License expiry alerts (safety_officer, fleet_manager only)
router.get('/expiry-alerts', authorize('safety_officer', 'fleet_manager'), getLicenseExpiryAlerts);

// Create driver (fleet_manager, safety_officer)
router.post('/', authorize('fleet_manager', 'safety_officer'), driverValidation, validate, createDriver);

// Single driver (all roles)
router.get('/:id', getDriver);

// Update driver (fleet_manager, safety_officer)
router.put('/:id', authorize('fleet_manager', 'safety_officer'), updateDriver);

// Status change (fleet_manager, safety_officer)
router.patch('/:id/status', authorize('fleet_manager', 'safety_officer'), updateDriverStatus);

// Delete driver (fleet_manager only)
router.delete('/:id', authorize('fleet_manager'), deleteDriver);

export default router;
