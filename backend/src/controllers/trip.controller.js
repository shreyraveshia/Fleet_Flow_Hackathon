import Trip from '../models/Trip.model.js';
import Vehicle from '../models/Vehicle.model.js';
import Driver from '../models/Driver.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createAuditLog } from '../services/auditLog.service.js';
import { createNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';

// ─── Valid State Transitions ──────────────────────────────────────────────────
const VALID_TRANSITIONS = {
    Draft: ['Dispatched', 'Cancelled'],
    Dispatched: ['In Transit', 'Cancelled'],
    'In Transit': ['Completed', 'Cancelled'],
    Completed: [],
    Cancelled: [],
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Get all trips with filtering, search, pagination
 * @route   GET /api/trips
 * @access  Private (all roles)
 */
export const getTrips = asyncHandler(async (req, res) => {
    const {
        status,
        vehicle,
        driver,
        search,
        page = 1,
        limit = 50,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (vehicle) query.vehicle = vehicle;
    if (driver) query.driver = driver;

    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { tripId: searchRegex },
            { origin: searchRegex },
            { destination: searchRegex },
        ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [trips, total] = await Promise.all([
        Trip.find(query)
            .populate('vehicle', 'name licensePlate type')
            .populate('driver', 'name licenseNumber')
            .populate('createdBy', 'name role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Trip.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
        success: true,
        data: {
            trips,
            total,
            page: pageNum,
            pages,
            hasNextPage: pageNum < pages,
            hasPrevPage: pageNum > 1,
        },
        message: 'Trips fetched successfully',
    });
});

/**
 * @desc    Get single trip by ID with full population
 * @route   GET /api/trips/:id
 * @access  Private (all roles)
 */
export const getTrip = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id)
        .populate('vehicle')
        .populate('driver')
        .populate('createdBy', 'name role')
        .populate('statusHistory.changedBy', 'name role');

    if (!trip) {
        throw new ApiError(404, 'Trip not found');
    }

    res.status(200).json({
        success: true,
        data: trip,
        message: 'Trip fetched successfully',
    });
});

/**
 * @desc    Create a new trip with full validation sequence
 * @route   POST /api/trips
 * @access  Private (fleet_manager, dispatcher)
 */
export const createTrip = asyncHandler(async (req, res) => {
    const { vehicle: vehicleId, driver: driverId, cargoWeight, origin, destination } = req.body;

    // ── 1. Find vehicle ──
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    // ── 2. Vehicle availability ──
    if (vehicle.status !== 'Available') {
        throw new ApiError(400, `Vehicle is ${vehicle.status}, not available for dispatch`);
    }

    // ── 3. Vehicle retired check ──
    if (vehicle.isRetired) {
        throw new ApiError(400, 'Vehicle is retired');
    }

    // ── 4. OVERWEIGHT CHECK ──
    if (cargoWeight > vehicle.maxLoadCapacity) {
        await createNotification({
            recipientRole: 'dispatcher',
            type: 'trip_update',
            title: 'Overweight Trip Blocked',
            message: `Cargo ${cargoWeight}kg exceeds ${vehicle.name} max capacity of ${vehicle.maxLoadCapacity}kg. Trip creation blocked.`,
            severity: 'error',
            relatedEntity: { entityType: 'Vehicle', entityId: vehicle._id },
        });

        await createNotification({
            recipientRole: 'fleet_manager',
            type: 'trip_update',
            title: 'Overweight Trip Blocked',
            message: `Cargo ${cargoWeight}kg exceeds ${vehicle.name} max capacity of ${vehicle.maxLoadCapacity}kg. Trip creation blocked.`,
            severity: 'error',
            relatedEntity: { entityType: 'Vehicle', entityId: vehicle._id },
        });

        throw new ApiError(
            400,
            `OVERWEIGHT BLOCKED: Cargo ${cargoWeight}kg exceeds ${vehicle.name} max capacity of ${vehicle.maxLoadCapacity}kg`
        );
    }

    // ── 5. Find driver ──
    const driver = await Driver.findById(driverId);
    if (!driver) {
        throw new ApiError(404, 'Driver not found');
    }

    // ── 6. Driver availability ──
    if (driver.status !== 'Available') {
        throw new ApiError(400, `Driver is ${driver.status}`);
    }

    // ── 7. Suspended check ──
    if (driver.status === 'Suspended') {
        throw new ApiError(400, 'Driver is suspended');
    }

    // ── 8. LICENSE EXPIRY CHECK ──
    const now = new Date();
    const licenseExpiry = new Date(driver.licenseExpiry);
    if (now > licenseExpiry) {
        throw new ApiError(
            400,
            `BLOCKED: Driver ${driver.name}'s license expired on ${licenseExpiry.toDateString()}`
        );
    }

    // ── 9. LICENSE CATEGORY CHECK ──
    if (driver.licenseCategory !== vehicle.type) {
        throw new ApiError(
            400,
            `Driver license category (${driver.licenseCategory}) doesn't match vehicle type (${vehicle.type})`
        );
    }

    // ── All checks passed — create trip ──
    const tripData = {
        ...req.body,
        vehicle: vehicleId,
        driver: driverId,
        status: 'Draft',
        startOdometer: vehicle.odometer,
        createdBy: req.user._id,
        statusHistory: [
            {
                status: 'Draft',
                changedBy: req.user._id,
                note: 'Trip created',
            },
        ],
    };

    const trip = await Trip.create(tripData);

    // Update vehicle status
    vehicle.status = 'On Trip';
    await vehicle.save();

    // Update driver status and trip count
    driver.status = 'On Trip';
    driver.totalTrips += 1;
    await driver.save();

    // Notify fleet_managers
    await createNotification({
        recipientRole: 'fleet_manager',
        type: 'trip_update',
        title: 'New Trip Created',
        message: `New trip created: ${origin} → ${destination} | Vehicle: ${vehicle.name} | Driver: ${driver.name}`,
        severity: 'info',
        relatedEntity: { entityType: 'Trip', entityId: trip._id },
    });

    // Audit log
    await createAuditLog({
        req,
        action: 'TRIP_CREATED',
        entity: 'Trip',
        entityId: trip._id,
        entityName: `${trip.tripId}: ${origin} → ${destination}`,
        newValue: trip.toObject(),
    });

    // Socket emit
    try {
        const io = getIO();
        io.to('role:fleet_manager')
            .to('role:dispatcher')
            .emit('fleet_update', {
                type: 'trip_created',
                tripId: trip._id,
                vehicleId: vehicle._id,
                driverId: driver._id,
            });
    } catch (socketErr) {
        console.error('⚠️  Socket emit failed:', socketErr.message);
    }

    // Return populated trip
    const populatedTrip = await Trip.findById(trip._id)
        .populate('vehicle', 'name licensePlate type')
        .populate('driver', 'name licenseNumber')
        .populate('createdBy', 'name role');

    res.status(201).json({
        success: true,
        data: populatedTrip,
        message: 'Trip created successfully',
    });
});

/**
 * @desc    Advance trip through the state machine
 * @route   PATCH /api/trips/:id/status
 * @access  Private (fleet_manager, dispatcher)
 */
export const advanceTripStatus = asyncHandler(async (req, res) => {
    const { status, note, endOdometer, actualFuelCost, revenue, cancelReason } = req.body;

    if (!status) {
        throw new ApiError(400, 'Status is required');
    }

    const trip = await Trip.findById(req.params.id)
        .populate('vehicle')
        .populate('driver');

    if (!trip) {
        throw new ApiError(404, 'Trip not found');
    }

    // Validate state transition
    const allowedTransitions = VALID_TRANSITIONS[trip.status];
    if (!allowedTransitions || !allowedTransitions.includes(status)) {
        throw new ApiError(400, `Invalid status transition: ${trip.status} → ${status}`);
    }

    const previousStatus = trip.status;

    // Add to status history
    trip.statusHistory.push({
        status,
        changedBy: req.user._id,
        note: note || '',
    });

    trip.status = status;

    // Get references to vehicle and driver documents for updating
    const vehicle = await Vehicle.findById(trip.vehicle._id);
    const driver = await Driver.findById(trip.driver._id);

    // ── Handle COMPLETED ──
    if (status === 'Completed') {
        trip.completedAt = new Date();

        if (endOdometer !== undefined && endOdometer !== null) {
            trip.endOdometer = endOdometer;
            vehicle.odometer = endOdometer;
        }

        if (actualFuelCost !== undefined) {
            trip.actualFuelCost = actualFuelCost;
        }

        if (revenue !== undefined) {
            trip.revenue = revenue;
        }

        // Release vehicle and driver
        vehicle.status = 'Available';
        driver.status = 'Available';
        driver.completedTrips += 1;

        if (trip.revenue > 0) {
            vehicle.totalRevenue += trip.revenue;
        }

        await vehicle.save();
        await driver.save();

        // Notify fleet_managers
        await createNotification({
            recipientRole: 'fleet_manager',
            type: 'trip_update',
            title: 'Trip Completed',
            message: `Trip ${trip.tripId} (${trip.origin} → ${trip.destination}) completed successfully.`,
            severity: 'success',
            relatedEntity: { entityType: 'Trip', entityId: trip._id },
        });

        // Socket emit
        try {
            const io = getIO();
            io.to('role:fleet_manager')
                .to('role:dispatcher')
                .emit('fleet_update', {
                    type: 'trip_completed',
                    tripId: trip._id,
                    vehicleId: vehicle._id,
                    driverId: driver._id,
                });
        } catch (socketErr) {
            console.error('⚠️  Socket emit failed:', socketErr.message);
        }
    }

    // ── Handle CANCELLED ──
    if (status === 'Cancelled') {
        trip.cancelledAt = new Date();
        trip.cancelReason = note || cancelReason || '';

        // Release vehicle and driver
        vehicle.status = 'Available';
        driver.status = 'Available';
        driver.totalTrips = Math.max(0, driver.totalTrips - 1); // Undo increment

        await vehicle.save();
        await driver.save();

        // Notify fleet_managers
        await createNotification({
            recipientRole: 'fleet_manager',
            type: 'trip_update',
            title: 'Trip Cancelled',
            message: `Trip ${trip.tripId} (${trip.origin} → ${trip.destination}) was cancelled.${trip.cancelReason ? ' Reason: ' + trip.cancelReason : ''}`,
            severity: 'warning',
            relatedEntity: { entityType: 'Trip', entityId: trip._id },
        });

        // Socket emit
        try {
            const io = getIO();
            io.to('role:fleet_manager')
                .to('role:dispatcher')
                .emit('fleet_update', {
                    type: 'trip_cancelled',
                    tripId: trip._id,
                });
        } catch (socketErr) {
            console.error('⚠️  Socket emit failed:', socketErr.message);
        }
    }

    // ── Handle DISPATCHED ──
    if (status === 'Dispatched') {
        // No additional state changes needed — status already set above
    }

    // ── Handle IN TRANSIT ──
    if (status === 'In Transit') {
        // No additional state changes needed — status already set above
    }

    await trip.save();

    // Audit log
    await createAuditLog({
        req,
        action: 'TRIP_STATUS_ADVANCED',
        entity: 'Trip',
        entityId: trip._id,
        entityName: `${trip.tripId}: ${trip.origin} → ${trip.destination}`,
        previousValue: { status: previousStatus },
        newValue: { status, note: note || '' },
    });

    // Return populated trip
    const updatedTrip = await Trip.findById(trip._id)
        .populate('vehicle', 'name licensePlate type')
        .populate('driver', 'name licenseNumber')
        .populate('createdBy', 'name role')
        .populate('statusHistory.changedBy', 'name role');

    res.status(200).json({
        success: true,
        data: updatedTrip,
        message: `Trip status advanced to ${status}`,
    });
});

/**
 * @desc    Get trip timeline (statusHistory)
 * @route   GET /api/trips/:id/timeline
 * @access  Private (all roles)
 */
export const getTripTimeline = asyncHandler(async (req, res) => {
    const trip = await Trip.findById(req.params.id)
        .select('tripId origin destination status statusHistory vehicle driver createdAt')
        .populate('statusHistory.changedBy', 'name role')
        .populate('vehicle', 'name licensePlate')
        .populate('driver', 'name licenseNumber');

    if (!trip) {
        throw new ApiError(404, 'Trip not found');
    }

    res.status(200).json({
        success: true,
        data: {
            tripId: trip.tripId,
            origin: trip.origin,
            destination: trip.destination,
            currentStatus: trip.status,
            vehicle: trip.vehicle,
            driver: trip.driver,
            timeline: trip.statusHistory,
            createdAt: trip.createdAt,
        },
        message: 'Trip timeline fetched successfully',
    });
});
