import AuditLog from '../models/AuditLog.model.js';

/**
 * createAuditLog — records an audit log entry for any entity action.
 * Wrapped in try-catch so that audit log failures never break the main flow.
 *
 * @param {Object} params
 * @param {Object} params.req - Express request object (for user info, IP, UA)
 * @param {string} params.action - e.g. 'VEHICLE_CREATED', 'TRIP_COMPLETED'
 * @param {string} params.entity - e.g. 'Vehicle', 'Trip', 'Driver'
 * @param {import('mongoose').Types.ObjectId} params.entityId
 * @param {string} params.entityName - human-readable identifier
 * @param {*} params.previousValue - state before the change
 * @param {*} params.newValue - state after the change
 */
export const createAuditLog = async ({
    req,
    action,
    entity,
    entityId,
    entityName = '',
    previousValue = null,
    newValue = null,
}) => {
    try {
        const log = await AuditLog.create({
            performedBy: req.user._id,
            performedByName: req.user.name,
            performedByRole: req.user.role,
            action,
            entity,
            entityId,
            entityName,
            previousValue,
            newValue,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent') || '',
        });
        return log;
    } catch (error) {
        console.error('⚠️  Audit log creation failed:', error.message);
        return null;
    }
};
