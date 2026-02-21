import mongoose from 'mongoose';

const scoreHistorySchema = new mongoose.Schema(
    {
        score: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        tripId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
        },
    },
    { _id: false }
);

const driverSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Driver name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            unique: true,
            sparse: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                'Please provide a valid email address',
            ],
        },
        phone: {
            type: String,
            trim: true,
            match: [/^[\d\s\+\-\(\)]{7,20}$/, 'Please provide a valid phone number'],
        },
        licenseNumber: {
            type: String,
            required: [true, 'License number is required'],
            unique: true,
            uppercase: true,
            trim: true,
        },
        licenseExpiry: {
            type: Date,
            required: [true, 'License expiry date is required'],
        },
        licenseCategory: {
            type: String,
            enum: {
                values: ['Van', 'Truck', 'Bike'],
                message: 'License category must be Van, Truck, or Bike',
            },
            required: [true, 'License category is required'],
        },
        status: {
            type: String,
            enum: {
                values: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
                message: 'Status must be Available, On Trip, Off Duty, or Suspended',
            },
            default: 'Available',
        },
        safetyScore: {
            type: Number,
            default: 100,
            min: [0, 'Safety score cannot be below 0'],
            max: [100, 'Safety score cannot exceed 100'],
        },
        totalTrips: {
            type: Number,
            default: 0,
            min: [0, 'Total trips cannot be negative'],
        },
        completedTrips: {
            type: Number,
            default: 0,
            min: [0, 'Completed trips cannot be negative'],
        },
        avatar: {
            type: String,
            default: '',
        },
        joiningDate: {
            type: Date,
            default: Date.now,
        },
        scoreHistory: {
            type: [scoreHistorySchema],
            default: [],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
driverSchema.index({ status: 1 });
driverSchema.index({ licenseExpiry: 1 });
driverSchema.index({ licenseCategory: 1 });

// ─── Virtual: isLicenseExpired ────────────────────────────────────────────────
driverSchema.virtual('isLicenseExpired').get(function () {
    if (!this.licenseExpiry) return false;
    return new Date() > this.licenseExpiry;
});

// ─── Virtual: licenseExpiryDays ──────────────────────────────────────────────
// Returns days until expiry; negative means already expired
driverSchema.virtual('licenseExpiryDays').get(function () {
    if (!this.licenseExpiry) return null;
    const now = new Date();
    const diffMs = this.licenseExpiry.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
});

// ─── Virtual: completionRate ──────────────────────────────────────────────────
driverSchema.virtual('completionRate').get(function () {
    if (!this.totalTrips || this.totalTrips === 0) return 0;
    return parseFloat(((this.completedTrips / this.totalTrips) * 100).toFixed(2));
});

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;
