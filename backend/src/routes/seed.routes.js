import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.model.js';
import Vehicle from '../models/Vehicle.model.js';
import Driver from '../models/Driver.model.js';
import Trip from '../models/Trip.model.js';
import Maintenance from '../models/Maintenance.model.js';
import Expense from '../models/Expense.model.js';
import Notification from '../models/Notification.model.js';
import AuditLog from '../models/AuditLog.model.js';

const router = Router();

// ─── Helper: date offsets ─────────────────────────────────────────────────────
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d) => new Date(Date.now() + d * 24 * 60 * 60 * 1000);

/**
 * @desc    Seed the database with demo data (API endpoint for hackathon)
 * @route   POST /api/seed
 * @access  Public (blocked in production)
 */
router.post('/', async (req, res) => {
    try {
        // Block in production
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Seed is disabled in production',
            });
        }

        // ── Drop all collections ──
        const collections = await mongoose.connection.db.listCollections().toArray();
        for (const col of collections) {
            await mongoose.connection.db.dropCollection(col.name);
        }

        // ── 1. Users ──
        const users = await User.create([
            { name: 'Raj Sharma', email: 'manager@fleet.com', password: 'password123', role: 'fleet_manager', isActive: true },
            { name: 'Priya Singh', email: 'dispatcher@fleet.com', password: 'password123', role: 'dispatcher', isActive: true },
            { name: 'Amit Verma', email: 'safety@fleet.com', password: 'password123', role: 'safety_officer', isActive: true },
            { name: 'Neha Gupta', email: 'finance@fleet.com', password: 'password123', role: 'financial', isActive: true },
        ]);
        const [manager, dispatcher, safetyOfficer, finance] = users;

        // ── 2. Vehicles ──
        const vehicles = await Vehicle.create([
            { name: 'Truck Alpha', make: 'Tata', model: '407', licensePlate: 'MH-12-AB-1234', type: 'Truck', fuelType: 'Diesel', maxLoadCapacity: 5000, odometer: 45000, status: 'Available', region: 'West', year: 2022, acquisitionCost: 850000, totalRevenue: 320000, nextServiceDue: 50000 },
            { name: 'Van Beta', make: 'Force', model: 'Traveller', licensePlate: 'MH-12-CD-5678', type: 'Van', fuelType: 'Diesel', maxLoadCapacity: 1500, odometer: 28000, status: 'On Trip', region: 'Central', year: 2023, acquisitionCost: 450000, totalRevenue: 180000, nextServiceDue: 30000 },
            { name: 'Bike Gamma', make: 'TVS', model: 'Apache', licensePlate: 'MH-12-EF-9012', type: 'Bike', fuelType: 'Petrol', maxLoadCapacity: 50, odometer: 12000, status: 'Available', region: 'East', year: 2024, acquisitionCost: 120000, totalRevenue: 45000, nextServiceDue: 15000 },
            { name: 'Truck Delta', make: 'Ashok Leyland', model: 'DOST', licensePlate: 'MH-12-GH-3456', type: 'Truck', fuelType: 'Diesel', maxLoadCapacity: 8000, odometer: 67000, status: 'In Shop', region: 'North', year: 2021, acquisitionCost: 1200000, totalRevenue: 520000, nextServiceDue: 70000 },
            { name: 'Van Epsilon', make: 'Mahindra', model: 'Bolero', licensePlate: 'MH-12-IJ-7890', type: 'Van', fuelType: 'Diesel', maxLoadCapacity: 1200, odometer: 18000, status: 'Available', region: 'South', year: 2023, acquisitionCost: 380000, totalRevenue: 95000, nextServiceDue: 20000 },
            { name: 'Truck Zeta', make: 'EICHER', model: 'Pro 2049', licensePlate: 'MH-12-KL-2345', type: 'Truck', fuelType: 'Diesel', maxLoadCapacity: 6000, odometer: 32000, status: 'Available', region: 'West', year: 2022, acquisitionCost: 950000, totalRevenue: 240000, nextServiceDue: 35000 },
            { name: 'Van Eta', make: 'Maruti', model: 'Eeco', licensePlate: 'MH-12-MN-6789', type: 'Van', fuelType: 'Petrol', maxLoadCapacity: 700, odometer: 8000, status: 'Available', region: 'Central', year: 2024, acquisitionCost: 280000, totalRevenue: 60000, nextServiceDue: 10000 },
            { name: 'Bike Theta', make: 'Hero', model: 'Splendor', licensePlate: 'MH-12-OP-0123', type: 'Bike', fuelType: 'Petrol', maxLoadCapacity: 30, odometer: 5000, status: 'Available', region: 'East', year: 2020, acquisitionCost: 85000, totalRevenue: 30000, isRetired: true },
        ]);
        const [truckAlpha, vanBeta, bikeGamma, truckDelta, vanEpsilon, truckZeta, vanEta, bikeTheta] = vehicles;

        // ── 3. Drivers ──
        const drivers = await Driver.create([
            { name: 'Ravi Kumar', phone: '9876543210', licenseNumber: 'MH0120230001', licenseExpiry: new Date('2026-08-15'), licenseCategory: 'Truck', status: 'Available', safetyScore: 92, totalTrips: 45, completedTrips: 43 },
            { name: 'Suresh Patel', phone: '9876543211', licenseNumber: 'MH0120230002', licenseExpiry: new Date('2024-12-01'), licenseCategory: 'Van', status: 'Off Duty', safetyScore: 78, totalTrips: 32, completedTrips: 28 },
            { name: 'Mahesh Singh', phone: '9876543212', licenseNumber: 'MH0120230003', licenseExpiry: daysFromNow(25), licenseCategory: 'Bike', status: 'Available', safetyScore: 95, totalTrips: 120, completedTrips: 118 },
            { name: 'Rajesh Yadav', phone: '9876543213', licenseNumber: 'MH0120230004', licenseExpiry: new Date('2027-06-10'), licenseCategory: 'Truck', status: 'On Trip', safetyScore: 65, totalTrips: 20, completedTrips: 15 },
            { name: 'Anil Verma', phone: '9876543214', licenseNumber: 'MH0120230005', licenseExpiry: new Date('2027-01-01'), licenseCategory: 'Van', status: 'Available', safetyScore: 88, totalTrips: 55, completedTrips: 53 },
            { name: 'Deepak Sharma', phone: '9876543215', licenseNumber: 'MH0120230006', licenseExpiry: new Date('2026-11-20'), licenseCategory: 'Van', status: 'Available', safetyScore: 97, totalTrips: 80, completedTrips: 78 },
            { name: 'Sanjay Kumar', phone: '9876543216', licenseNumber: 'MH0120230007', licenseExpiry: daysFromNow(6), licenseCategory: 'Truck', status: 'Available', safetyScore: 71, totalTrips: 15, completedTrips: 10 },
            { name: 'Vinod Tiwari', phone: '9876543217', licenseNumber: 'MH0120230008', licenseExpiry: new Date('2026-05-15'), licenseCategory: 'Bike', status: 'Suspended', safetyScore: 45, totalTrips: 10, completedTrips: 6 },
        ]);
        const [raviKumar, sureshPatel, maheshSingh, rajeshYadav, anilVerma, deepakSharma, sanjayKumar, vinodTiwari] = drivers;

        // ── 4. Trips ──
        const trips = await Trip.create([
            { vehicle: vanBeta._id, driver: rajeshYadav._id, createdBy: dispatcher._id, origin: 'Mumbai', destination: 'Pune', cargoWeight: 800, cargoDescription: 'Electronics', startOdometer: 27700, estimatedDistance: 150, revenue: 8000, status: 'In Transit', statusHistory: [{ status: 'Draft', changedBy: dispatcher._id, note: 'Trip created', changedAt: daysAgo(1) }, { status: 'Dispatched', changedBy: dispatcher._id, note: 'Vehicle dispatched', changedAt: daysAgo(1) }, { status: 'In Transit', changedBy: dispatcher._id, note: 'Driver en route', changedAt: daysAgo(0.5) }] },
            { vehicle: truckAlpha._id, driver: raviKumar._id, createdBy: manager._id, origin: 'Nagpur', destination: 'Nashik', cargoWeight: 3200, cargoDescription: 'Steel', startOdometer: 44720, endOdometer: 45000, estimatedDistance: 280, revenue: 15000, actualFuelCost: 4200, status: 'Completed', completedAt: daysAgo(2), statusHistory: [{ status: 'Draft', changedBy: manager._id, note: 'Trip created', changedAt: daysAgo(4) }, { status: 'Dispatched', changedBy: manager._id, note: 'Route confirmed', changedAt: daysAgo(3) }, { status: 'In Transit', changedBy: dispatcher._id, note: 'Left Nagpur', changedAt: daysAgo(3) }, { status: 'Completed', changedBy: dispatcher._id, note: 'Delivered successfully', changedAt: daysAgo(2) }] },
            { vehicle: truckZeta._id, driver: raviKumar._id, createdBy: manager._id, origin: 'Pune', destination: 'Mumbai', cargoWeight: 4500, cargoDescription: 'Cement', startOdometer: 31850, endOdometer: 32000, estimatedDistance: 150, revenue: 12000, actualFuelCost: 2800, status: 'Completed', completedAt: daysAgo(5), statusHistory: [{ status: 'Draft', changedBy: manager._id, note: 'Trip created', changedAt: daysAgo(7) }, { status: 'Dispatched', changedBy: dispatcher._id, note: 'Dispatched', changedAt: daysAgo(6) }, { status: 'In Transit', changedBy: dispatcher._id, note: 'On highway', changedAt: daysAgo(6) }, { status: 'Completed', changedBy: manager._id, note: 'Cement delivered', changedAt: daysAgo(5) }] },
            { vehicle: vanEpsilon._id, driver: anilVerma._id, createdBy: dispatcher._id, origin: 'Chennai', destination: 'Bangalore', cargoWeight: 600, cargoDescription: 'FMCG', startOdometer: 18000, estimatedDistance: 350, revenue: 6500, status: 'Dispatched', statusHistory: [{ status: 'Draft', changedBy: dispatcher._id, note: 'Trip created', changedAt: daysAgo(1) }, { status: 'Dispatched', changedBy: dispatcher._id, note: 'Driver assigned', changedAt: daysAgo(0.5) }] },
            { vehicle: vanEta._id, driver: deepakSharma._id, createdBy: manager._id, origin: 'Delhi', destination: 'Gurgaon', cargoWeight: 400, cargoDescription: 'Pharmaceuticals', startOdometer: 8000, estimatedDistance: 30, revenue: 3500, status: 'Draft', statusHistory: [{ status: 'Draft', changedBy: manager._id, note: 'Scheduled for today', changedAt: new Date() }] },
            { vehicle: bikeGamma._id, driver: maheshSingh._id, createdBy: dispatcher._id, origin: 'Mumbai', destination: 'Thane', cargoWeight: 25, cargoDescription: 'Documents', startOdometer: 11965, endOdometer: 12000, estimatedDistance: 35, revenue: 800, actualFuelCost: 150, status: 'Completed', completedAt: daysAgo(1), statusHistory: [{ status: 'Draft', changedBy: dispatcher._id, note: 'Quick delivery', changedAt: daysAgo(1) }, { status: 'Dispatched', changedBy: dispatcher._id, note: 'Dispatched', changedAt: daysAgo(1) }, { status: 'In Transit', changedBy: dispatcher._id, note: 'Picked up', changedAt: daysAgo(1) }, { status: 'Completed', changedBy: dispatcher._id, note: 'Delivered to office', changedAt: daysAgo(1) }] },
        ]);

        // ── 5. Maintenance ──
        await Maintenance.create([
            { vehicle: truckDelta._id, serviceType: 'Engine Repair', description: 'Major engine overhaul — cylinder head gasket replacement.', cost: 45000, date: new Date(), status: 'In Progress', technicianName: 'Ganesh Auto Works', createdBy: manager._id },
            { vehicle: truckAlpha._id, serviceType: 'Oil Change', description: 'Scheduled oil change with synthetic engine oil.', cost: 3500, date: daysAgo(10), status: 'Completed', technicianName: 'QuickLube Service Center', resolvedAt: daysAgo(9), createdBy: manager._id },
            { vehicle: vanBeta._id, serviceType: 'Tire Replacement', description: 'All four tires replaced with new MRF radials.', cost: 8000, date: daysAgo(20), status: 'Completed', technicianName: 'MRF Tire Hub', resolvedAt: daysAgo(19), createdBy: manager._id },
        ]);

        // ── 6. Expenses ──
        await Expense.create([
            { vehicle: truckAlpha._id, driver: raviKumar._id, trip: trips[1]._id, type: 'Fuel', totalCost: 4200, liters: 44.68, distanceCovered: 280, date: daysAgo(3), notes: 'Diesel refill at Indian Oil, Nagpur', createdBy: manager._id },
            { vehicle: truckZeta._id, driver: raviKumar._id, trip: trips[2]._id, type: 'Fuel', totalCost: 2800, liters: 29.79, distanceCovered: 150, date: daysAgo(6), notes: 'Diesel refill at HP Pump, Pune', createdBy: manager._id },
            { vehicle: bikeGamma._id, driver: maheshSingh._id, trip: trips[5]._id, type: 'Fuel', totalCost: 150, liters: 1.43, distanceCovered: 35, date: daysAgo(1), notes: 'Petrol refill at BPCL, Mumbai', createdBy: dispatcher._id },
            { vehicle: vanBeta._id, type: 'Fuel', totalCost: 1880, liters: 20, distanceCovered: 120, date: daysAgo(2), notes: 'Diesel top-up for ongoing trip', createdBy: dispatcher._id },
            { vehicle: vanEpsilon._id, driver: anilVerma._id, type: 'Fuel', totalCost: 2350, liters: 25, distanceCovered: 180, date: daysAgo(8), notes: 'Diesel refill at Shell, Chennai', createdBy: dispatcher._id },
            { vehicle: vanEta._id, type: 'Fuel', totalCost: 1050, liters: 10, distanceCovered: 85, date: daysAgo(4), notes: 'Petrol at Indian Oil, Delhi', createdBy: manager._id },
            { vehicle: truckAlpha._id, driver: raviKumar._id, trip: trips[1]._id, type: 'Toll', totalCost: 650, date: daysAgo(3), notes: 'NH4 toll booth — Nagpur exit + Nashik entry', createdBy: manager._id },
            { vehicle: vanBeta._id, driver: rajeshYadav._id, trip: trips[0]._id, type: 'Toll', totalCost: 350, date: daysAgo(1), notes: 'Mumbai-Pune Expressway toll', createdBy: dispatcher._id },
            { vehicle: truckZeta._id, driver: raviKumar._id, trip: trips[2]._id, type: 'Toll', totalCost: 480, date: daysAgo(6), notes: 'Pune-Mumbai Expressway return toll', createdBy: manager._id },
            { vehicle: truckDelta._id, type: 'Repair', totalCost: 45000, date: new Date(), notes: 'Engine overhaul parts + labor — Ganesh Auto Works', createdBy: manager._id },
        ]);

        res.status(200).json({
            success: true,
            message: 'Database seeded successfully',
            data: {
                users: users.length,
                vehicles: vehicles.length,
                drivers: drivers.length,
                trips: trips.length,
                maintenance: 3,
                expenses: 10,
                credentials: [
                    { role: 'fleet_manager', email: 'manager@fleet.com', password: 'password123' },
                    { role: 'dispatcher', email: 'dispatcher@fleet.com', password: 'password123' },
                    { role: 'safety_officer', email: 'safety@fleet.com', password: 'password123' },
                    { role: 'financial', email: 'finance@fleet.com', password: 'password123' },
                ],
            },
        });
    } catch (error) {
        console.error('❌ Seed failed:', error);
        res.status(500).json({
            success: false,
            message: 'Seed failed',
            error: error.message,
        });
    }
});

export default router;
