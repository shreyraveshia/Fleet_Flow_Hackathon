import Vehicle from '../models/Vehicle.model.js';
import Driver from '../models/Driver.model.js';
import Trip from '../models/Trip.model.js';
import Expense from '../models/Expense.model.js';
import Maintenance from '../models/Maintenance.model.js';

/**
 * getDashboardKPIs — core metrics for the dashboard header
 */
export const getDashboardKPIs = async () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
        activeFleet,
        maintenanceAlerts,
        totalVehicles,
        pendingCargo,
        availableVehicles,
        availableDrivers,
        totalDrivers,
        tripsCompletedToday,
        expiringLicenses,
    ] = await Promise.all([
        Vehicle.countDocuments({ status: 'On Trip' }),
        Vehicle.countDocuments({ status: 'In Shop' }),
        Vehicle.countDocuments({ isRetired: false }),
        Trip.countDocuments({ status: { $in: ['Draft', 'Dispatched'] } }),
        Vehicle.countDocuments({ status: 'Available', isRetired: false }),
        Driver.countDocuments({ status: 'Available' }),
        Driver.countDocuments(),
        Trip.countDocuments({ status: 'Completed', completedAt: { $gte: startOfToday } }),
        Driver.countDocuments({ licenseExpiry: { $lte: thirtyDaysFromNow } }),
    ]);

    const utilizationRate = totalVehicles > 0
        ? Math.round((activeFleet / totalVehicles) * 1000) / 10
        : 0;

    return {
        activeFleet,
        maintenanceAlerts,
        totalVehicles,
        pendingCargo,
        availableVehicles,
        availableDrivers,
        totalDrivers,
        tripsCompletedToday,
        expiringLicenses,
        utilizationRate,
    };
};

/**
 * getFuelEfficiency — per-vehicle fuel stats
 */
export const getFuelEfficiency = async () => {
    const vehicles = await Vehicle.find({ isRetired: false })
        .select('_id name licensePlate type')
        .lean();

    const results = [];

    for (const v of vehicles) {
        const fuelExpenses = await Expense.find({ vehicle: v._id, type: 'Fuel' })
            .select('liters distanceCovered totalCost')
            .lean();

        if (fuelExpenses.length === 0) continue;

        let totalLiters = 0;
        let totalDistance = 0;
        let totalFuelCost = 0;

        for (const exp of fuelExpenses) {
            totalLiters += exp.liters || 0;
            totalDistance += exp.distanceCovered || 0;
            totalFuelCost += exp.totalCost || 0;
        }

        const fuelEfficiency = totalLiters > 0
            ? Math.round((totalDistance / totalLiters) * 100) / 100
            : 0;

        const costPerKm = totalDistance > 0
            ? Math.round((totalFuelCost / totalDistance) * 100) / 100
            : 0;

        results.push({
            vehicleId: v._id,
            name: v.name,
            licensePlate: v.licensePlate,
            type: v.type,
            totalDistance,
            totalLiters,
            totalFuelCost,
            fuelEfficiency,
            costPerKm,
        });
    }

    return results.sort((a, b) => b.fuelEfficiency - a.fuelEfficiency);
};

/**
 * getVehicleROI — return on investment per vehicle
 */
export const getVehicleROI = async () => {
    const vehicles = await Vehicle.find({ isRetired: false })
        .select('_id name licensePlate acquisitionCost totalRevenue')
        .lean();

    const results = [];

    for (const v of vehicles) {
        const [expenseAgg, maintenanceAgg] = await Promise.all([
            Expense.aggregate([
                { $match: { vehicle: v._id } },
                {
                    $group: {
                        _id: null,
                        totalFuelCost: { $sum: { $cond: [{ $eq: ['$type', 'Fuel'] }, '$totalCost', 0] } },
                        totalOtherCost: { $sum: { $cond: [{ $ne: ['$type', 'Fuel'] }, '$totalCost', 0] } },
                    },
                },
            ]),
            Maintenance.aggregate([
                { $match: { vehicle: v._id, status: 'Completed' } },
                { $group: { _id: null, totalCost: { $sum: '$cost' } } },
            ]),
        ]);

        const totalFuelCost = expenseAgg[0]?.totalFuelCost || 0;
        const totalOtherCost = expenseAgg[0]?.totalOtherCost || 0;
        const totalMaintenanceCost = maintenanceAgg[0]?.totalCost || 0;
        const totalOperationalCost = totalFuelCost + totalOtherCost + totalMaintenanceCost;
        const revenue = v.totalRevenue || 0;
        const acquisitionCost = v.acquisitionCost || 1; // avoid division by zero
        const netProfit = revenue - totalOperationalCost;
        const roi = Math.round((netProfit / acquisitionCost) * 10000) / 100;

        results.push({
            vehicleId: v._id,
            name: v.name,
            licensePlate: v.licensePlate,
            acquisitionCost: v.acquisitionCost || 0,
            revenue,
            totalFuelCost,
            totalMaintenanceCost,
            totalOperationalCost,
            netProfit,
            roi,
            isProfitable: netProfit > 0,
        });
    }

    return results.sort((a, b) => b.roi - a.roi);
};

/**
 * getMonthlySummary — last 6 months financial overview
 */
export const getMonthlySummary = async () => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);

        const [revenueAgg, fuelAgg, maintenanceAgg, tripsCompleted] = await Promise.all([
            Trip.aggregate([
                { $match: { status: 'Completed', completedAt: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: '$revenue' } } },
            ]),
            Expense.aggregate([
                { $match: { type: 'Fuel', date: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: '$totalCost' } } },
            ]),
            Maintenance.aggregate([
                { $match: { status: 'Completed', date: { $gte: start, $lte: end } } },
                { $group: { _id: null, total: { $sum: '$cost' } } },
            ]),
            Trip.countDocuments({ status: 'Completed', completedAt: { $gte: start, $lte: end } }),
        ]);

        const revenue = revenueAgg[0]?.total || 0;
        const fuelCost = fuelAgg[0]?.total || 0;
        const maintenanceCost = maintenanceAgg[0]?.total || 0;

        months.push({
            year: start.getFullYear(),
            month: start.getMonth() + 1,
            monthName: start.toLocaleString('default', { month: 'short' }),
            revenue: Math.round(revenue * 100) / 100,
            fuelCost: Math.round(fuelCost * 100) / 100,
            maintenanceCost: Math.round(maintenanceCost * 100) / 100,
            tripsCompleted,
            netProfit: Math.round((revenue - fuelCost - maintenanceCost) * 100) / 100,
        });
    }

    return months;
};

/**
 * getDriverPerformanceStats — per-driver stats sorted by safetyScore
 */
export const getDriverPerformanceStats = async () => {
    const drivers = await Driver.find()
        .select('name licenseNumber licenseCategory licenseExpiry status safetyScore totalTrips completedTrips avatar')
        .lean();

    const results = drivers.map((d) => {
        const completionRate = d.totalTrips > 0
            ? Math.round((d.completedTrips / d.totalTrips) * 10000) / 100
            : 0;

        const now = new Date();
        const expiryDate = new Date(d.licenseExpiry);
        const licenseExpiryDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

        return {
            driverId: d._id,
            name: d.name,
            licenseNumber: d.licenseNumber,
            licenseCategory: d.licenseCategory,
            status: d.status,
            safetyScore: d.safetyScore,
            totalTrips: d.totalTrips,
            completedTrips: d.completedTrips,
            completionRate,
            licenseExpiryDays,
            isLicenseExpired: licenseExpiryDays <= 0,
            avatar: d.avatar || '',
        };
    });

    return results.sort((a, b) => b.safetyScore - a.safetyScore);
};
