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
 * @desc    Monthly financial summary + ROI + KPIs
 * @route   GET /api/analytics/monthly-summary
 * @access  Private (fleet_manager, financial)
 */
export const getMonthlySummaryData = asyncHandler(async (req, res) => {
    const [monthlySummary, roiData] = await Promise.all([
        getMonthlySummary(),
        getVehicleROI(),
    ]);

    // Derived KPIs from the latest month in summary
    const latestMonth = monthlySummary[monthlySummary.length - 1] || {};
    const kpis = {
        fuelCost: latestMonth.fuelCost || 0,
        maintCost: latestMonth.maintenanceCost || 0,
        revenue: latestMonth.revenue || 0,
        profit: latestMonth.netProfit || 0,
        trend: 0, // In production, calculate against previous month
    };

    // Calculate trend if possible
    if (monthlySummary.length >= 2) {
        const prevMonth = monthlySummary[monthlySummary.length - 2];
        if (prevMonth.netProfit !== 0) {
            kpis.trend = Math.round(((latestMonth.netProfit - prevMonth.netProfit) / Math.abs(prevMonth.netProfit)) * 1000) / 10;
        }
    }

    res.status(200).json({
        success: true,
        data: {
            kpis,
            trendData: monthlySummary,
            roiData: roiData.slice(0, 5), // top 5 for chart
            expensiveVehicles: [...roiData].sort((a, b) => b.totalOperationalCost - a.totalOperationalCost).slice(0, 5),
        },
        message: 'Financial analytics summary fetched successfully',
    });
});

/**
 * @desc    Driver performance stats + Safety Metrics
 * @route   GET /api/analytics/driver-stats
 * @access  Private (fleet_manager, safety_officer)
 */
export const getDriverStats = asyncHandler(async (req, res) => {
    const drivers = await getDriverPerformanceStats();

    const kpis = {
        expiring: drivers.filter(d => d.licenseExpiryDays > 0 && d.licenseExpiryDays <= 30).length,
        expired: drivers.filter(d => d.licenseExpiryDays <= 0).length,
        suspended: drivers.filter(d => d.status === 'Suspended' || d.status === 'Inactive').length,
        avgScore: drivers.length > 0
            ? Math.round((drivers.reduce((acc, d) => acc + d.safetyScore, 0) / drivers.length) * 10) / 10
            : 0,
    };

    const criticalAlerts = drivers
        .filter(d => d.licenseExpiryDays <= 30)
        .map(d => ({
            id: d.driverId,
            driverName: d.name,
            licenseNumber: d.licenseNumber,
            type: 'License Renewal',
            expiryDate: d.expiryDate, // Note: ensure this exists in service if needed, or derived
            severity: d.licenseExpiryDays <= 0 ? 'expired' : 'expiring',
        }));

    res.status(200).json({
        success: true,
        data: {
            kpis,
            leaderboard: drivers,
            criticalAlerts,
            suspendedDrivers: drivers.filter(d => d.status === 'Suspended'),
        },
        message: 'Safety analytics summary fetched successfully',
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
