import { Router } from 'express';
import {
    getTrips,
    getTrip,
    createTrip,
    advanceTripStatus,
    getTripTimeline,
} from '../controllers/trip.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { tripValidation, validate } from '../middleware/validate.middleware.js';

const router = Router();

// All trip routes require authentication
router.use(protect);

// Routes accessible by all authenticated roles
router.get('/', getTrips);
router.get('/:id', getTrip);
router.get('/:id/timeline', getTripTimeline);

// Routes restricted to fleet_manager and dispatcher
router.post('/', authorize('fleet_manager', 'dispatcher'), tripValidation, validate, createTrip);
router.patch('/:id/status', authorize('fleet_manager', 'dispatcher'), advanceTripStatus);

export default router;
