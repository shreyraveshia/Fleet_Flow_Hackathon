import Driver from '../models/Driver.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createAuditLog } from '../services/auditLog.service.js';
import { createNotification } from '../services/notification.service.js';
import { getIO } from '../config/socket.js';

// ─── Helper: check license expiry and notify ─────────────────────────────────
const checkLicenseExpiryAndNotify = async (driver) => {
    const now = new Date();
    const expiryDate = new Date(driver.licenseExpiry);
    const diffMs = expiryDate - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
        // Already expired
        await createNotification({
            recipientRole: 'safety_officer',
            type: 'license_expiry',
            title: 'Driver License Expired',
            message: `${driver.name}'s license (${driver.licenseNumber}) has expired on ${expiryDate.toISOString().split('T')[0]}.`,
            severity: 'error',
            relatedEntity: { entityType: 'Driver', entityId: driver._id },
        });
    } else if (diffDays <= 7) {
        // Expires within 7 days
        await createNotification({
            recipientRole: 'safety_officer',
            type: 'license_expiry',
            title: 'Driver License Expiring Soon',
            message: `${driver.name}'s license (${driver.licenseNumber}) expires in ${diffDays} day(s).`,
            severity: 'error',
            relatedEntity: { entityType: 'Driver', entityId: driver._id },
        });
    } else if (diffDays <= 30) {
        // Expires within 30 days
        await createNotification({
            recipientRole: 'safety_officer',
            type: 'license_expiry',
            title: 'Driver License Expiry Warning',
            message: `${driver.name}'s license (${driver.licenseNumber}) expires in ${diffDays} day(s).`,
            severity: 'warning',
            relatedEntity: { entityType: 'Driver', entityId: driver._id },
        });
    }
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Get all drivers with filtering, search, pagination
 * @route   GET /api/drivers
 * @access  Private (all roles)
 */
export const getDrivers = asyncHandler(async (req, res) => {
    const {
        status,
        licenseCategory,
        search,
        page = 1,
        limit = 50,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (licenseCategory) query.licenseCategory = licenseCategory;

    if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
            { name: searchRegex },
            { licenseNumber: searchRegex },
            { phone: searchRegex },
            { licenseCategory: searchRegex },
        ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [drivers, total] = await Promise.all([
        Driver.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum),
        Driver.countDocuments(query),
    ]);

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
        success: true,
        data: {
            drivers,
            total,
            page: pageNum,
            pages,
            hasNextPage: pageNum < pages,
            hasPrevPage: pageNum > 1,
        },
        message: 'Drivers fetched successfully',
    });
});

/**
 * @desc    Get available drivers (not expired license)
 * @route   GET /api/drivers/available
 * @access  Private (all roles)
 */
export const getAvailableDrivers = asyncHandler(async (req, res) => {
    const query = {
        status: 'Available',
        licenseExpiry: { $gt: new Date() },
    };

    if (req.query.licenseCategory) {
        query.licenseCategory = req.query.licenseCategory;
    }

    const drivers = await Driver.find(query)
        .select('name licenseNumber licenseCategory licenseExpiry safetyScore completedTrips totalTrips')
        .sort({ safetyScore: -1 });

    res.status(200).json({
        success: true,
        data: drivers,
        message: 'Available drivers fetched successfully',
    });
});

/**
 * @desc    Get single driver by ID
 * @route   GET /api/drivers/:id
 * @access  Private (all roles)
 */
export const getDriver = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        throw new ApiError(404, 'Driver not found');
    }

    res.status(200).json({
        success: true,
        data: driver,
        message: 'Driver fetched successfully',
    });
});

/**
 * @desc    Create a new driver
 * @route   POST /api/drivers
 * @access  Private (fleet_manager, safety_officer)
 */
export const createDriver = asyncHandler(async (req, res) => {
    const driver = await Driver.create(req.body);

    // Check license expiry and notify if needed
    await checkLicenseExpiryAndNotify(driver);

    // Audit log
    await createAuditLog({
        req,
        action: 'DRIVER_CREATED',
        entity: 'Driver',
        entityId: driver._id,
        entityName: `${driver.name} (${driver.licenseNumber})`,
        newValue: driver.toObject(),
    });

    res.status(201).json({
        success: true,
        data: driver,
        message: 'Driver created successfully',
    });
});

/**
 * @desc    Update a driver
 * @route   PUT /api/drivers/:id
 * @access  Private (fleet_manager, safety_officer)
 */
export const updateDriver = asyncHandler(async (req, res) => {
    let driver = await Driver.findById(req.params.id);

    if (!driver) {
        throw new ApiError(404, 'Driver not found');
    }

    const previousValue = driver.toObject();
    const licenseExpiryChanged =
        req.body.licenseExpiry &&
        new Date(req.body.licenseExpiry).getTime() !== new Date(driver.licenseExpiry).getTime();

    driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    // Re-check license expiry if it was changed
    if (licenseExpiryChanged) {
        await checkLicenseExpiryAndNotify(driver);
    }

    // Audit log
    await createAuditLog({
        req,
        action: 'DRIVER_UPDATED',
        entity: 'Driver',
        entityId: driver._id,
        entityName: `${driver.name} (${driver.licenseNumber})`,
        previousValue,
        newValue: driver.toObject(),
    });

    res.status(200).json({
        success: true,
        data: driver,
        message: 'Driver updated successfully',
    });
});

/**
 * @desc    Update driver status
 * @route   PATCH /api/drivers/:id/status
 * @access  Private (fleet_manager, safety_officer)
 */
export const updateDriverStatus = asyncHandler(async (req, res) => {
    const { status, reason } = req.body;

    if (!status) {
        throw new ApiError(400, 'Status is required');
    }

    const validStatuses = ['Available', 'Off Duty', 'Suspended'];
    if (!validStatuses.includes(status)) {
        throw new ApiError(400, `Status must be one of: ${validStatuses.join(', ')}`);
    }

    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        throw new ApiError(404, 'Driver not found');
    }

    if (driver.status === 'On Trip') {
        throw new ApiError(400, 'Cannot change status of a driver currently on a trip');
    }

    const previousStatus = driver.status;
    driver.status = status;
    await driver.save();

    // If suspended, notify fleet_manager and dispatchers
    if (status === 'Suspended') {
        await createNotification({
            recipientRole: 'fleet_manager',
            type: 'driver_suspended',
            title: 'Driver Suspended',
            message: `${driver.name} (${driver.licenseNumber}) has been suspended.${reason ? ' Reason: ' + reason : ''}`,
            severity: 'warning',
            relatedEntity: { entityType: 'Driver', entityId: driver._id },
        });

        await createNotification({
            recipientRole: 'dispatcher',
            type: 'driver_suspended',
            title: 'Driver Suspended',
            message: `${driver.name} (${driver.licenseNumber}) has been suspended and is no longer available for trips.${reason ? ' Reason: ' + reason : ''}`,
            severity: 'warning',
            relatedEntity: { entityType: 'Driver', entityId: driver._id },
        });
    }

    // Audit log
    await createAuditLog({
        req,
        action: 'DRIVER_STATUS_CHANGED',
        entity: 'Driver',
        entityId: driver._id,
        entityName: `${driver.name} (${driver.licenseNumber})`,
        previousValue: { status: previousStatus },
        newValue: { status, reason: reason || '' },
    });

    // Socket emit
    try {
        const io = getIO();
        io.to('role:fleet_manager')
            .to('role:dispatcher')
            .emit('driver_update', {
                type: 'driver_status_changed',
                driver: {
                    _id: driver._id,
                    name: driver.name,
                    licenseNumber: driver.licenseNumber,
                    status: driver.status,
                },
            });
    } catch (socketErr) {
        console.error('⚠️  Socket emit failed:', socketErr.message);
    }

    res.status(200).json({
        success: true,
        data: driver,
        message: `Driver status changed to ${status}`,
    });
});

/**
 * @desc    Delete a driver (hard delete)
 * @route   DELETE /api/drivers/:id
 * @access  Private (fleet_manager)
 */
export const deleteDriver = asyncHandler(async (req, res) => {
    const driver = await Driver.findById(req.params.id);

    if (!driver) {
        throw new ApiError(404, 'Driver not found');
    }

    if (driver.status === 'On Trip') {
        throw new ApiError(400, 'Cannot delete a driver currently on a trip');
    }

    const driverData = driver.toObject();
    await Driver.findByIdAndDelete(req.params.id);

    // Audit log
    await createAuditLog({
        req,
        action: 'DRIVER_DELETED',
        entity: 'Driver',
        entityId: driverData._id,
        entityName: `${driverData.name} (${driverData.licenseNumber})`,
        previousValue: driverData,
    });

    res.status(200).json({
        success: true,
        data: null,
        message: 'Driver deleted successfully',
    });
});

/**
 * @desc    Get drivers with licenses expiring within 30 days
 * @route   GET /api/drivers/expiry-alerts
 * @access  Private (safety_officer, fleet_manager)
 */
export const getLicenseExpiryAlerts = asyncHandler(async (req, res) => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const drivers = await Driver.find({
        licenseExpiry: { $lte: thirtyDaysFromNow },
    })
        .select('name licenseNumber licenseCategory licenseExpiry status phone')
        .sort({ licenseExpiry: 1 })
        .lean();

    // Calculate days remaining for each driver
    const driversWithExpiry = drivers.map((driver) => {
        const diffMs = new Date(driver.licenseExpiry) - now;
        const expiryDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return {
            ...driver,
            expiryDays,
            isExpired: expiryDays <= 0,
        };
    });

    res.status(200).json({
        success: true,
        data: driversWithExpiry,
        message: 'License expiry alerts fetched successfully',
    });
});
