import Notification from '../models/Notification.model.js';
import User from '../models/User.model.js';
import { getIO } from '../config/socket.js';

/**
 * createNotification — creates notification(s) and emits socket event.
 *
 * If recipientId is provided: creates one notification for that specific user.
 * If recipientRole is provided: finds all active users with that role and
 *   creates a notification for each of them.
 *
 * @param {Object} params
 * @param {string} [params.recipientId] - specific user ObjectId
 * @param {string} [params.recipientRole] - role string to fan-out to all matching users
 * @param {string} params.type - notification type enum
 * @param {string} params.title
 * @param {string} params.message
 * @param {string} [params.severity] - info | warning | error | success
 * @param {Object} [params.relatedEntity] - { entityType, entityId }
 * @returns {Promise<Object|Object[]>} created notification(s)
 */
export const createNotification = async ({
    recipientId,
    recipientRole,
    type,
    title,
    message,
    severity = 'info',
    relatedEntity = null,
}) => {
    try {
        let notifications = [];

        if (recipientId) {
            // Single user notification
            const notification = await Notification.create({
                recipient: recipientId,
                recipientRole: recipientRole || '',
                type,
                title,
                message,
                severity,
                relatedEntity,
            });
            notifications.push(notification);

            // Emit to specific user via socket
            try {
                const io = getIO();
                io.to(`user:${recipientId}`).emit('new_notification', {
                    notification: notification.toObject(),
                });
            } catch (socketErr) {
                console.error('⚠️  Socket emit (user) failed:', socketErr.message);
            }
        } else if (recipientRole) {
            // Role-based fan-out
            const users = await User.find({ role: recipientRole, isActive: true })
                .select('_id')
                .lean();

            const docs = users.map((u) => ({
                recipient: u._id,
                recipientRole,
                type,
                title,
                message,
                severity,
                relatedEntity,
            }));

            if (docs.length > 0) {
                notifications = await Notification.insertMany(docs);
            }

            // Emit to the role room via socket
            try {
                const io = getIO();
                io.to(`role:${recipientRole}`).emit('new_notification', {
                    title,
                    message,
                    type,
                    severity,
                });
            } catch (socketErr) {
                console.error('⚠️  Socket emit (role) failed:', socketErr.message);
            }
        }

        return notifications.length === 1 ? notifications[0] : notifications;
    } catch (error) {
        console.error('⚠️  Notification creation failed:', error.message);
        return null;
    }
};
