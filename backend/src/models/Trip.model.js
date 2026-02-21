import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

const statusHistorySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            required: true,
        },
        changedAt: {
            type: Date,
            default: Date.now,
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        note: {
            type: String,
            trim: true,
            default: '',
        },
    },
    { _id: false }
);

const tripSchema = new mongoose.Schema(
    {
        tripId: {
            type: String,
            unique: true,
            trim: true,
        },
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: [true, 'Vehicle is required'],
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Driver',
            required: [true, 'Driver is required'],
        },
        cargoWeight: {
            type: Number,
            required: [true, 'Cargo weight is required'],
            min: [0, 'Cargo weight cannot be negative'],
        },
        cargoDescription: {
            type: String,
            trim: true,
            default: '',
        },
        origin: {
            type: String,
            required: [true, 'Origin is required'],
            trim: true,
        },
        destination: {
            type: String,
            required: [true, 'Destination is required'],
            trim: true,
        },
        estimatedFuelCost: {
            type: Number,
            default: 0,
            min: [0, 'Estimated fuel cost cannot be negative'],
        },
        actualFuelCost: {
            type: Number,
            default: 0,
            min: [0, 'Actual fuel cost cannot be negative'],
        },
        distance: {
            type: Number,
            default: 0,
            min: [0, 'Distance cannot be negative'],
        },
        startOdometer: {
            type: Number,
            min: [0, 'Start odometer cannot be negative'],
        },
        endOdometer: {
            type: Number,
            min: [0, 'End odometer cannot be negative'],
        },
        status: {
            type: String,
            enum: {
                values: ['Draft', 'Dispatched', 'In Transit', 'Completed', 'Cancelled'],
                message:
                    'Status must be Draft, Dispatched, In Transit, Completed, or Cancelled',
            },
            default: 'Draft',
        },
        revenue: {
            type: Number,
            default: 0,
            min: [0, 'Revenue cannot be negative'],
        },
        statusHistory: {
            type: [statusHistorySchema],
            default: [],
        },
        completedAt: {
            type: Date,
        },
        cancelledAt: {
            type: Date,
        },
        cancelReason: {
            type: String,
            trim: true,
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
tripSchema.index({ status: 1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ driver: 1 });
tripSchema.index({ createdAt: -1 });

// ─── Pre-save: auto-generate tripId if not present ───────────────────────────
tripSchema.pre('save', function (next) {
    if (!this.tripId) {
        this.tripId = `FF-${nanoid(6).toUpperCase()}`;
    }
    next();
});

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
