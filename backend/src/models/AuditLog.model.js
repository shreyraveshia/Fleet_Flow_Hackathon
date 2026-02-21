import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Performer is required'],
        },
        performedByName: {
            type: String,
            trim: true,
            default: '',
        },
        performedByRole: {
            type: String,
            trim: true,
            default: '',
        },
        action: {
            type: String,
            required: [true, 'Action is required'],
            trim: true,
            // e.g. 'create', 'update', 'delete', 'login', 'logout', 'status_change'
        },
        entity: {
            type: String,
            required: [true, 'Entity name is required'],
            trim: true,
            // e.g. 'User', 'Vehicle', 'Trip', 'Driver', 'Maintenance', 'Expense'
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        entityName: {
            type: String,
            trim: true,
            default: '',
        },
        previousValue: {
            type: mongoose.Schema.Types.Mixed,
        },
        newValue: {
            type: mongoose.Schema.Types.Mixed,
        },
        ipAddress: {
            type: String,
            trim: true,
            default: '',
        },
        userAgent: {
            type: String,
            trim: true,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ entity: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
