import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: [true, 'Vehicle is required'],
        },
        trip: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
        },
        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Driver',
        },
        type: {
            type: String,
            enum: {
                values: ['Fuel', 'Toll', 'Repair', 'Parking', 'Other'],
                message: 'Expense type must be Fuel, Toll, Repair, Parking, or Other',
            },
            required: [true, 'Expense type is required'],
        },
        liters: {
            type: Number,
            min: [0, 'Liters cannot be negative'],
        },
        costPerLiter: {
            type: Number,
            min: [0, 'Cost per liter cannot be negative'],
        },
        totalCost: {
            type: Number,
            required: [true, 'Total cost is required'],
            min: [0, 'Total cost cannot be negative'],
        },
        date: {
            type: Date,
            required: [true, 'Date is required'],
            default: Date.now,
        },
        distanceCovered: {
            type: Number,
            min: [0, 'Distance covered cannot be negative'],
        },
        fuelEfficiency: {
            type: Number,
            min: [0, 'Fuel efficiency cannot be negative'],
        },
        receiptUrl: {
            type: String,
            trim: true,
            default: '',
        },
        notes: {
            type: String,
            trim: true,
            default: '',
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
expenseSchema.index({ vehicle: 1 });
expenseSchema.index({ type: 1 });
expenseSchema.index({ date: -1 });

// ─── Pre-save Hook: calculate fuelEfficiency and totalCost for Fuel entries ───
expenseSchema.pre('save', function (next) {
    if (this.type === 'Fuel') {
        // Calculate fuel efficiency: km per liter
        if (
            this.liters != null &&
            this.liters > 0 &&
            this.distanceCovered != null &&
            this.distanceCovered > 0
        ) {
            this.fuelEfficiency = parseFloat(
                (this.distanceCovered / this.liters).toFixed(2)
            );
        }

        // Auto-calculate totalCost if not explicitly set
        if (
            !this.totalCost &&
            this.liters != null &&
            this.liters > 0 &&
            this.costPerLiter != null &&
            this.costPerLiter > 0
        ) {
            this.totalCost = parseFloat((this.liters * this.costPerLiter).toFixed(2));
        }
    }

    next();
});

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
