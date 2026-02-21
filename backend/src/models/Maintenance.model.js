import mongoose from 'mongoose';

const maintenanceSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: [true, 'Vehicle is required'],
        },
        serviceType: {
            type: String,
            enum: {
                values: [
                    'Oil Change',
                    'Tire Replacement',
                    'Engine Repair',
                    'Brake Service',
                    'Electrical',
                    'Body Work',
                    'Other',
                ],
                message: 'Invalid service type',
            },
            required: [true, 'Service type is required'],
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        cost: {
            type: Number,
            default: 0,
            min: [0, 'Cost cannot be negative'],
        },
        date: {
            type: Date,
            required: [true, 'Service date is required'],
            default: Date.now,
        },
        odometerAtService: {
            type: Number,
            min: [0, 'Odometer reading cannot be negative'],
        },
        technicianName: {
            type: String,
            trim: true,
            default: '',
        },
        status: {
            type: String,
            enum: {
                values: ['Scheduled', 'In Progress', 'Completed'],
                message: 'Status must be Scheduled, In Progress, or Completed',
            },
            default: 'In Progress',
        },
        resolvedAt: {
            type: Date,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
maintenanceSchema.index({ vehicle: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ date: -1 });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

export default Maintenance;
