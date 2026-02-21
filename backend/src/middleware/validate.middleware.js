import { body, validationResult } from 'express-validator';
import { ApiError } from '../utils/apiResponse.js';

/**
 * validate — generic validator executor that checks for express-validator errors.
 */
export const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
    }
    next();
};

// ─── Registration Validation ────────────────────────────────────────────────
export const registerValidation = [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .isIn(['fleet_manager', 'dispatcher', 'safety_officer', 'financial'])
        .withMessage('Invalid user role'),
];

// ─── Login Validation ────────────────────────────────────────────────────────
export const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
];

// ─── Vehicle Validation ──────────────────────────────────────────────────────
export const vehicleValidation = [
    body('name').notEmpty().withMessage('Vehicle name is required'),
    body('licensePlate').notEmpty().withMessage('License plate is required'),
    body('type').isIn(['Truck', 'Van', 'Bike']).withMessage('Invalid vehicle type'),
    body('maxLoadCapacity')
        .isNumeric()
        .withMessage('Max load capacity must be a number'),
];

// ─── Driver Validation ───────────────────────────────────────────────────────
export const driverValidation = [
    body('name').notEmpty().withMessage('Driver name is required'),
    body('licenseNumber').notEmpty().withMessage('License number is required'),
    body('licenseExpiry').isISO8601().withMessage('Valid license expiry date is required'),
    body('licenseCategory').isIn(['Van', 'Truck', 'Bike']).withMessage('Invalid license category'),
];

// ─── Trip Validation ─────────────────────────────────────────────────────────
export const tripValidation = [
    body('vehicle').isMongoId().withMessage('Valid vehicle ID is required'),
    body('driver').isMongoId().withMessage('Valid driver ID is required'),
    body('cargoWeight').isNumeric().withMessage('Cargo weight must be a number'),
    body('origin').notEmpty().withMessage('Origin is required'),
    body('destination').notEmpty().withMessage('Destination is required'),
];

// ─── Expense Validation ──────────────────────────────────────────────────────
export const expenseValidation = [
    body('vehicle').isMongoId().withMessage('Valid vehicle ID is required'),
    body('type').isIn(['Fuel', 'Toll', 'Repair', 'Parking', 'Other']).withMessage('Invalid expense type'),
    body('totalCost').isNumeric().withMessage('Total cost must be a number'),
];

// ─── Maintenance Validation ──────────────────────────────────────────────────
export const maintenanceValidation = [
    body('vehicle').isMongoId().withMessage('Valid vehicle ID is required'),
    body('serviceType')
        .isIn(['Oil Change', 'Tire Replacement', 'Engine Repair', 'Brake Service', 'Electrical', 'Body Work', 'Other'])
        .withMessage('Invalid service type'),
    body('date').isISO8601().withMessage('Valid service date is required'),
];
