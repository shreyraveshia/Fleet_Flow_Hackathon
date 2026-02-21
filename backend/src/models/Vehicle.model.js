import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Vehicle name is required'],
            trim: true,
        },
        model: {
            type: String,
            trim: true,
        },
        licensePlate: {
            type: String,
            required: [true, 'License plate is required'],
            unique: true,
            uppercase: true,
            trim: true,
            match: [
                /^[A-Z0-9\s\-]{2,15}$/i,
                'License plate must be 2-15 alphanumeric characters',
            ],
        },
        type: {
            type: String,
            enum: {
                values: ['Truck', 'Van', 'Bike'],
                message: 'Vehicle type must be Truck, Van, or Bike',
            },
            required: [true, 'Vehicle type is required'],
        },
        maxLoadCapacity: {
            type: Number,
            required: [true, 'Max load capacity is required'],
            min: [0, 'Max load capacity cannot be negative'],
        },
        odometer: {
            type: Number,
            default: 0,
            min: [0, 'Odometer reading cannot be negative'],
        },
        acquisitionCost: {
            type: Number,
            default: 0,
            min: [0, 'Acquisition cost cannot be negative'],
        },
        status: {
            type: String,
            enum: {
                values: ['Available', 'On Trip', 'In Shop', 'Retired'],
                message: 'Status must be Available, On Trip, In Shop, or Retired',
            },
            default: 'Available',
        },
        fuelType: {
            type: String,
            enum: {
                values: ['Diesel', 'Petrol', 'Electric'],
                message: 'Fuel type must be Diesel, Petrol, or Electric',
            },
            default: 'Diesel',
        },
        region: {
            type: String,
            trim: true,
            default: 'Central',
        },
        nextServiceDue: {
            type: Number,
            min: [0, 'Next service due odometer cannot be negative'],
        },
        totalRevenue: {
            type: Number,
            default: 0,
            min: [0, 'Total revenue cannot be negative'],
        },
        isRetired: {
            type: Boolean,
            default: false,
        },
        year: {
            type: Number,
            min: [1900, 'Year must be 1900 or later'],
            max: [new Date().getFullYear() + 1, 'Year cannot be in the far future'],
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// licensePlate unique index is already created by { unique: true } on the field
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ region: 1 });

// ─── Virtual: isServiceDue ────────────────────────────────────────────────────
vehicleSchema.virtual('isServiceDue').get(function () {
    if (this.nextServiceDue == null) return false;
    return this.odometer >= this.nextServiceDue;
});

// ─── Virtual: utilizationStatus ──────────────────────────────────────────────
vehicleSchema.virtual('utilizationStatus').get(function () {
    if (this.isRetired || this.status === 'Retired') return 'retired';
    if (this.status === 'In Shop') return 'maintenance';
    if (this.status === 'On Trip') return 'active';
    return 'idle';
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
