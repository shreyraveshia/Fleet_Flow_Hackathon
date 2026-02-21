import Vehicle from '../models/Vehicle.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createAuditLog } from '../services/auditLog.service.js';
import { getIO } from '../config/socket.js';

/**
 * @desc    Get all vehicles with filtering, search, pagination
 * @route   GET /api/vehicles
 * @access  Private (all roles)
 */
export const getVehicles = asyncHandler(async (req, res) => {
    const {
        status,
        type,
        region,
        search,
        page = 1,
        limit = 50,
    } = req.query;

    const query = {};

    if (status) {
        query.status = status;
        // If user specifically filters for 'Retired', we don't automatically exclude them
    }

    if (type) query.type = type;
    if (region) query.region = region;

    // By default, exclude retired vehicles unless specifically requested or if it's an admin/manager view
    // Here we check if status is specifically 'Retired', if not, we apply the exclusion
    if (status !== 'Retired') {
        query.isRetired = false;
    }

    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { name: searchRegex },
            { licensePlate: searchRegex },
            { model: searchRegex },
            { make: searchRegex },
            { type: searchRegex }
        ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [vehicles, total] = await Promise.all([
        Vehicle.find(query)
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Vehicle.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
        success: true,
        data: {
            vehicles,
            total,
            page: pageNum,
            pages,
            hasNextPage: pageNum < pages,
            hasPrevPage: pageNum > 1,
        },
        message: 'Vehicles fetched successfully',
    });
});

/**
 * @desc    Get available (non-retired) vehicles, minimal fields
 * @route   GET /api/vehicles/available
 * @access  Private (all roles)
 */
export const getAvailableVehicles = asyncHandler(async (req, res) => {
    const query = { status: 'Available', isRetired: false };

    if (req.query.type) {
        query.type = req.query.type;
    }

    const vehicles = await Vehicle.find(query)
        .select('_id name licensePlate type maxLoadCapacity odometer region')
        .sort({ name: 1 })
        .lean();

    res.status(200).json({
        success: true,
        data: vehicles,
        message: 'Available vehicles fetched successfully',
    });
});

/**
 * @desc    Get single vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Private (all roles)
 */
export const getVehicle = asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id)
        .populate('createdBy', 'name')
        .lean();

    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    res.status(200).json({
        success: true,
        data: vehicle,
        message: 'Vehicle fetched successfully',
    });
});

/**
 * @desc    Create a new vehicle
 * @route   POST /api/vehicles
 * @access  Private (fleet_manager)
 */
export const createVehicle = asyncHandler(async (req, res) => {
    req.body.createdBy = req.user._id;

    const vehicle = await Vehicle.create(req.body);

    // Audit log
    await createAuditLog({
        req,
        action: 'VEHICLE_CREATED',
        entity: 'Vehicle',
        entityId: vehicle._id,
        entityName: `${vehicle.name} (${vehicle.licensePlate})`,
        newValue: vehicle.toObject(),
    });

    // Socket emit
    try {
        const io = getIO();
        io.to('role:fleet_manager')
            .to('role:dispatcher')
            .emit('fleet_update', {
                type: 'vehicle_added',
                vehicle: { _id: vehicle._id, name: vehicle.name, licensePlate: vehicle.licensePlate, status: vehicle.status },
            });
    } catch (socketErr) {
        console.error('⚠️  Socket emit failed:', socketErr.message);
    }

    res.status(201).json({
        success: true,
        data: vehicle,
        message: 'Vehicle created successfully',
    });
});

/**
 * @desc    Update a vehicle
 * @route   PUT /api/vehicles/:id
 * @access  Private (fleet_manager)
 */
export const updateVehicle = asyncHandler(async (req, res) => {
    let vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    const previousValue = vehicle.toObject();

    vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    // Audit log
    await createAuditLog({
        req,
        action: 'VEHICLE_UPDATED',
        entity: 'Vehicle',
        entityId: vehicle._id,
        entityName: `${vehicle.name} (${vehicle.licensePlate})`,
        previousValue,
        newValue: vehicle.toObject(),
    });

    // Socket emit
    try {
        const io = getIO();
        io.to('role:fleet_manager')
            .to('role:dispatcher')
            .emit('fleet_update', {
                type: 'vehicle_updated',
                vehicle: { _id: vehicle._id, name: vehicle.name, licensePlate: vehicle.licensePlate, status: vehicle.status },
            });
    } catch (socketErr) {
        console.error('⚠️  Socket emit failed:', socketErr.message);
    }

    res.status(200).json({
        success: true,
        data: vehicle,
        message: 'Vehicle updated successfully',
    });
});

/**
 * @desc    Delete (soft-retire) a vehicle
 * @route   DELETE /api/vehicles/:id
 * @access  Private (fleet_manager)
 */
export const deleteVehicle = asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    if (vehicle.status === 'On Trip') {
        throw new ApiError(400, 'Cannot delete a vehicle that is currently on a trip');
    }

    vehicle.isRetired = true;
    vehicle.status = 'Retired';
    await vehicle.save();

    // Audit log
    await createAuditLog({
        req,
        action: 'VEHICLE_RETIRED',
        entity: 'Vehicle',
        entityId: vehicle._id,
        entityName: `${vehicle.name} (${vehicle.licensePlate})`,
        previousValue: { isRetired: false },
        newValue: { isRetired: true, status: 'Retired' },
    });

    res.status(200).json({
        success: true,
        data: null,
        message: 'Vehicle retired successfully',
    });
});

/**
 * @desc    Toggle vehicle status (Available / In Shop / Retired)
 * @route   PATCH /api/vehicles/:id/status
 * @access  Private (fleet_manager)
 */
export const toggleVehicleStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;

    if (!status) {
        throw new ApiError(400, 'Status is required');
    }

    const validStatuses = ['Available', 'In Shop', 'Retired'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    if (vehicle.status === 'On Trip') {
        throw new ApiError(400, 'Cannot change status of a vehicle that is currently on a trip');
    }

    const previousStatus = vehicle.status;
    vehicle.status = status;

    if (status === 'Retired') {
        vehicle.isRetired = true;
    } else {
        vehicle.isRetired = false;
    }

    await vehicle.save();

    // Audit log
    await createAuditLog({
        req,
        action: 'VEHICLE_STATUS_CHANGED',
        entity: 'Vehicle',
        entityId: vehicle._id,
        entityName: `${vehicle.name} (${vehicle.licensePlate})`,
        previousValue: { status: previousStatus },
        newValue: { status },
    });

    // Socket emit based on new status
    try {
        const io = getIO();
        let eventType = 'vehicle_status_changed';
        if (status === 'In Shop') eventType = 'vehicle_in_shop';
        if (status === 'Available') eventType = 'vehicle_available';

        io.to('role:fleet_manager')
            .to('role:dispatcher')
            .emit('fleet_update', {
                type: eventType,
                vehicle: { _id: vehicle._id, name: vehicle.name, licensePlate: vehicle.licensePlate, status: vehicle.status },
            });
    } catch (socketErr) {
        console.error('⚠️  Socket emit failed:', socketErr.message);
    }

    res.status(200).json({
        success: true,
        data: vehicle,
        message: `Vehicle status changed to ${status}`,
    });
});
