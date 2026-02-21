import Maintenance from '../models/Maintenance.model.js';
import Vehicle from '../models/Vehicle.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createAuditLog } from '../services/auditLog.service.js';
import { createNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';

/**
 * @desc    Get all maintenance logs with filtering and pagination
 * @route   GET /api/maintenance
 * @access  Private (all roles)
 */
export const getMaintenance = asyncHandler(async (req, res) => {
    const { status, vehicle, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (vehicle) query.vehicle = vehicle;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
        Maintenance.find(query)
            .populate('vehicle', 'name licensePlate type status')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Maintenance.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
        success: true,
        data: {
            logs,
            total,
            page: pageNum,
            pages,
            hasNextPage: pageNum < pages,
            hasPrevPage: pageNum > 1,
        },
        message: 'Maintenance logs fetched successfully',
    });
});

/**
 * @desc    Get single maintenance log by ID
 * @route   GET /api/maintenance/:id
 * @access  Private (all roles)
 */
export const getMaintenanceById = asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id)
        .populate('vehicle')
        .populate('createdBy', 'name');

    if (!maintenance) {
        throw new ApiError(404, 'Maintenance log not found');
    }

    res.status(200).json({
        success: true,
        data: maintenance,
        message: 'Maintenance log fetched successfully',
    });
});

/**
 * @desc    Create a maintenance log — auto-cascades vehicle to In Shop
 * @route   POST /api/maintenance
 * @access  Private (fleet_manager)
 */
export const createMaintenance = asyncHandler(async (req, res) => {
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    if (vehicle.status === 'On Trip') {
        throw new ApiError(400, 'Cannot log maintenance for a vehicle currently On Trip');
    }

    req.body.createdBy = req.user._id;
    req.body.status = 'In Progress';

    const maintenance = await Maintenance.create(req.body);

    // AUTO-CASCADE: vehicle → In Shop
    const previousVehicleStatus = vehicle.status;
    vehicle.status = 'In Shop';
    await vehicle.save();

    // Notify dispatchers
    await createNotification({
        recipientRole: 'dispatcher',
        type: 'maintenance',
        title: '🔧 Vehicle Removed from Pool',
        message: `${vehicle.name} (${vehicle.licensePlate}) moved to In Shop for ${req.body.serviceType}. Not available for dispatch.`,
        severity: 'warning',
        relatedEntity: { entityType: 'Vehicle', entityId: vehicle._id },
    });

    // Notify fleet_managers
    await createNotification({
        recipientRole: 'fleet_manager',
        type: 'maintenance',
        title: '🔧 Vehicle Removed from Pool',
        message: `${vehicle.name} (${vehicle.licensePlate}) moved to In Shop for ${req.body.serviceType}. Not available for dispatch.`,
        severity: 'warning',
        relatedEntity: { entityType: 'Vehicle', entityId: vehicle._id },
    });

    // Audit log
    await createAuditLog({
        req,
        action: 'MAINTENANCE_CREATED',
        entity: 'Maintenance',
        entityId: maintenance._id,
        entityName: `${req.body.serviceType} for ${vehicle.name}`,
        newValue: {
            maintenance: maintenance.toObject(),
            vehicleStatusChange: { from: previousVehicleStatus, to: 'In Shop' },
        },
    });

    // Socket emit
    try {
        const io = getIO();
        io.to('role:fleet_manager')
            .to('role:dispatcher')
            .emit('fleet_update', {
                type: 'vehicle_in_shop',
                vehicleId: vehicle._id,
                maintenanceId: maintenance._id,
            });
    } catch (socketErr) {
        console.error('⚠️  Socket emit failed:', socketErr.message);
    }

    res.status(201).json({
        success: true,
        data: maintenance,
        message: 'Maintenance log created. Vehicle moved to In Shop.',
    });
});

/**
 * @desc    Update a maintenance log
 * @route   PUT /api/maintenance/:id
 * @access  Private (fleet_manager)
 */
export const updateMaintenance = asyncHandler(async (req, res) => {
    let maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
        throw new ApiError(404, 'Maintenance log not found');
    }

    if (maintenance.status === 'Completed') {
        throw new ApiError(400, 'Cannot update a completed maintenance log');
    }

    const previousValue = maintenance.toObject();

    maintenance = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    // Audit log
    await createAuditLog({
        req,
        action: 'MAINTENANCE_UPDATED',
        entity: 'Maintenance',
        entityId: maintenance._id,
        entityName: `${maintenance.serviceType} for vehicle ${maintenance.vehicle}`,
        previousValue,
        newValue: maintenance.toObject(),
    });

    res.status(200).json({
        success: true,
        data: maintenance,
        message: 'Maintenance log updated successfully',
    });
});

/**
 * @desc    Resolve (complete) a maintenance log — returns vehicle to Available
 * @route   PATCH /api/maintenance/:id/resolve
 * @access  Private (fleet_manager)
 */
export const resolveMaintenance = asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id).populate('vehicle');

    if (!maintenance) {
        throw new ApiError(404, 'Maintenance log not found');
    }

    if (maintenance.status === 'Completed') {
        throw new ApiError(400, 'This maintenance log is already resolved');
    }

    // Resolve maintenance
    maintenance.status = 'Completed';
    maintenance.resolvedAt = new Date();
    await maintenance.save();

    // Return vehicle to Available
    const vehicle = await Vehicle.findById(maintenance.vehicle._id);
    vehicle.status = 'Available';
    await vehicle.save();

    // Notify dispatchers
    await createNotification({
        recipientRole: 'dispatcher',
        type: 'maintenance',
        title: '✅ Vehicle Back Available',
        message: `${vehicle.name} (${vehicle.licensePlate}) maintenance complete. Available for dispatch.`,
        severity: 'success',
        relatedEntity: { entityType: 'Vehicle', entityId: vehicle._id },
    });

    // Notify fleet_managers
    await createNotification({
        recipientRole: 'fleet_manager',
        type: 'maintenance',
        title: '✅ Vehicle Back Available',
        message: `${vehicle.name} (${vehicle.licensePlate}) maintenance complete. Available for dispatch.`,
        severity: 'success',
        relatedEntity: { entityType: 'Vehicle', entityId: vehicle._id },
    });

    // Audit log
    await createAuditLog({
        req,
        action: 'MAINTENANCE_RESOLVED',
        entity: 'Maintenance',
        entityId: maintenance._id,
        entityName: `${maintenance.serviceType} for ${vehicle.name}`,
        previousValue: { status: 'In Progress' },
        newValue: { status: 'Completed', resolvedAt: maintenance.resolvedAt },
    });

    // Socket emit
    try {
        const io = getIO();
        io.to('role:fleet_manager')
            .to('role:dispatcher')
            .emit('fleet_update', {
                type: 'vehicle_available',
                vehicleId: vehicle._id,
            });
    } catch (socketErr) {
        console.error('⚠️  Socket emit failed:', socketErr.message);
    }

    res.status(200).json({
        success: true,
        data: maintenance,
        message: 'Maintenance resolved. Vehicle is now Available.',
    });
});

/**
 * @desc    Delete a maintenance log
 * @route   DELETE /api/maintenance/:id
 * @access  Private (fleet_manager)
 */
export const deleteMaintenance = asyncHandler(async (req, res) => {
    const maintenance = await Maintenance.findById(req.params.id);

    if (!maintenance) {
        throw new ApiError(404, 'Maintenance log not found');
    }

    // If still In Progress, return vehicle to Available
    if (maintenance.status === 'In Progress') {
        const vehicle = await Vehicle.findById(maintenance.vehicle);
        if (vehicle && vehicle.status === 'In Shop') {
            vehicle.status = 'Available';
            await vehicle.save();
        }
    }

    const maintenanceData = maintenance.toObject();
    await Maintenance.findByIdAndDelete(req.params.id);

    // Audit log
    await createAuditLog({
        req,
        action: 'MAINTENANCE_DELETED',
        entity: 'Maintenance',
        entityId: maintenanceData._id,
        entityName: `${maintenanceData.serviceType}`,
        previousValue: maintenanceData,
    });

    res.status(200).json({
        success: true,
        data: null,
        message: 'Maintenance log deleted successfully',
    });
});
