import asyncHandler from '../utils/asyncHandler.js';
import Trip from '../models/Trip.model.js';
import Driver from '../models/Driver.model.js';
import Vehicle from '../models/Vehicle.model.js';
import {
    getDashboardKPIs,
    getFuelEfficiency,
    getVehicleROI,
    getMonthlySummary,
    getDriverPerformanceStats,
} from '../services/analytics.service.js';

/**
 * @desc    Dashboard — KPIs + recent trips + expiring licenses
 * @route   GET /api/analytics/dashboard
 * @access  Private (all roles)
 */
export const getDashboard = asyncHandler(async (req, res) => {
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [kpis, recentTrips, expiringDrivers] = await Promise.all([
        getDashboardKPIs(),
        Trip.find()
            .populate('vehicle', 'name licensePlate type')
            .populate('driver', 'name')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        Driver.find({ licenseExpiry: { $lte: thirtyDaysFromNow } })
            .select('name licenseNumber licenseExpiry status')
            .sort({ licenseExpiry: 1 })
            .lean(),
    ]);

    res.status(200).json({
        success: true,
        data: {
            kpis,
            recentTrips,
            expiringDrivers,
        },
        message: 'Dashboard data fetched successfully',
    });
});

/**
 * @desc    Fuel efficiency per vehicle
 * @route   GET /api/analytics/fuel-efficiency
 * @access  Private (fleet_manager, financial, safety_officer)
 */
export const getFuelEfficiencyData = asyncHandler(async (req, res) => {
    const data = await getFuelEfficiency();

    res.status(200).json({
        success: true,
        data,
        message: 'Fuel efficiency data fetched successfully',
    });
});

/**
 * @desc    Vehicle ROI analysis
 * @route   GET /api/analytics/vehicle-roi
 * @access  Private (fleet_manager, financial)
 */
export const getVehicleROIData = asyncHandler(async (req, res) => {
    const data = await getVehicleROI();

    res.status(200).json({
        success: true,
        data,
        message: 'Vehicle ROI data fetched successfully',
    });
});

/**
 * @desc    Monthly financial summary (last 6 months)
 * @route   GET /api/analytics/monthly-summary
 * @access  Private (fleet_manager, financial)
 */
export const getMonthlySummaryData = asyncHandler(async (req, res) => {
    const data = await getMonthlySummary();

    res.status(200).json({
        success: true,
        data,
        message: 'Monthly summary fetched successfully',
    });
});

/**
 * @desc    Driver performance stats
 * @route   GET /api/analytics/driver-stats
 * @access  Private (fleet_manager, safety_officer)
 */
export const getDriverStats = asyncHandler(async (req, res) => {
    const data = await getDriverPerformanceStats();

    res.status(200).json({
        success: true,
        data,
        message: 'Driver stats fetched successfully',
    });
});

/**
 * @desc    Fleet overview — combined analytics for the overview tab
 * @route   GET /api/analytics/fleet-overview
 * @access  Private (all roles)
 */
export const getFleetOverview = asyncHandler(async (req, res) => {
    const [kpis, monthlySummary, fuelEfficiency] = await Promise.all([
        getDashboardKPIs(),
        getMonthlySummary(),
        getFuelEfficiency(),
    ]);

    // Vehicle status breakdown
    const vehicleStatusBreakdown = await Vehicle.aggregate([
        { $match: { isRetired: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Driver status breakdown
    const driverStatusBreakdown = await Driver.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Trip status breakdown
    const tripStatusBreakdown = await Trip.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.status(200).json({
        success: true,
        data: {
            kpis,
            monthlySummary,
            fuelEfficiency: fuelEfficiency.slice(0, 10), // top 10
            vehicleStatusBreakdown,
            driverStatusBreakdown,
            tripStatusBreakdown,
        },
        message: 'Fleet overview fetched successfully',
    });
});
