import AuditLog from '../models/AuditLog.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get audit logs with filtering and pagination
 * @route   GET /api/audit
 * @access  Private (fleet_manager only)
 */
export const getAuditLogs = asyncHandler(async (req, res) => {
    const {
        entity,
        performedBy,
        action,
        startDate,
        endDate,
        page = 1,
        limit = 50,
    } = req.query;

    const query = {};

    if (entity) query.entity = entity;
    if (performedBy) query.performedBy = performedBy;
    if (action) query.action = action;

    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
        AuditLog.find(query)
            .populate('performedBy', 'name role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        AuditLog.countDocuments(query),
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
        message: 'Audit logs fetched successfully',
    });
});
