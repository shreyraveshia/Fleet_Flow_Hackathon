import mongoose from 'mongoose';

const relatedEntitySchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            trim: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
        },
    },
    { _id: false }
);

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient is required'],
        },
        recipientRole: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: {
                values: [
                    'license_expiry',
                    'maintenance',
                    'trip_update',
                    'overweight_blocked',
                    'system',
                    'driver_suspended',
                ],
                message: 'Invalid notification type',
            },
            required: [true, 'Notification type is required'],
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        relatedEntity: {
            type: relatedEntitySchema,
        },
        severity: {
            type: String,
            enum: {
                values: ['info', 'warning', 'error', 'success'],
                message: 'Severity must be info, warning, error, or success',
            },
            default: 'info',
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
