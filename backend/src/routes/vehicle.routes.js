import { Router } from 'express';
import {
    getVehicles,
    getAvailableVehicles,
    getVehicle,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    toggleVehicleStatus,
} from '../controllers/vehicle.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { vehicleValidation, validate } from '../middleware/validate.middleware.js';

const router = Router();

// All vehicle routes require authentication
router.use(protect);

// Routes accessible by all authenticated roles
router.get('/', getVehicles);
router.get('/available', getAvailableVehicles);
router.get('/:id', getVehicle);

// Routes restricted to fleet_manager
router.post('/', authorize('fleet_manager'), vehicleValidation, validate, createVehicle);
router.put('/:id', authorize('fleet_manager'), updateVehicle);
router.delete('/:id', authorize('fleet_manager'), deleteVehicle);
router.patch('/:id/status', authorize('fleet_manager'), toggleVehicleStatus);

export default router;
