import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import Vehicle from '../models/Vehicle.model.js';
import Trip from '../models/Trip.model.js';
import Expense from '../models/Expense.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import {
    getVehicleROI,
    getMonthlySummary,
    getFuelEfficiency,
    getDashboardKPIs,
} from '../services/analytics.service.js';

/**
 * @desc    Export vehicles data as CSV
 * @route   GET /api/export/vehicles-csv
 * @access  Private (fleet_manager, financial)
 */
export const exportVehiclesCSV = asyncHandler(async (req, res) => {
    const vehicles = await Vehicle.find({ isRetired: false }).lean();

    const flatData = vehicles.map((v) => ({
        Name: v.name || '',
        LicensePlate: v.licensePlate || '',
        Type: v.type || '',
        Status: v.status || '',
        FuelType: v.fuelType || '',
        MaxLoadCapacity: v.maxLoadCapacity || 0,
        Odometer: v.odometer || 0,
        Region: v.region || '',
        Year: v.year || '',
        AcquisitionCost: v.acquisitionCost || 0,
        TotalRevenue: v.totalRevenue || 0,
        CreatedAt: v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : '',
    }));

    const fields = ['Name', 'LicensePlate', 'Type', 'Status', 'FuelType', 'MaxLoadCapacity', 'Odometer', 'Region', 'Year', 'AcquisitionCost', 'TotalRevenue', 'CreatedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(flatData);

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=vehicles-${dateStr}.csv`);
    res.send(csv);
});

/**
 * @desc    Export trips data as CSV
 * @route   GET /api/export/trips-csv
 * @access  Private (fleet_manager, financial)
 */
export const exportTripsCSV = asyncHandler(async (req, res) => {
    const trips = await Trip.find()
        .populate('vehicle', 'name licensePlate')
        .populate('driver', 'name licenseNumber')
        .lean();

    const flatData = trips.map((t) => ({
        TripId: t.tripId || '',
        Status: t.status || '',
        Origin: t.origin || '',
        Destination: t.destination || '',
        Vehicle: t.vehicle?.name || '',
        VehiclePlate: t.vehicle?.licensePlate || '',
        Driver: t.driver?.name || '',
        DriverLicense: t.driver?.licenseNumber || '',
        CargoWeight: t.cargoWeight || 0,
        CargoDescription: t.cargoDescription || '',
        StartOdometer: t.startOdometer || 0,
        EndOdometer: t.endOdometer || 0,
        EstimatedFuelCost: t.estimatedFuelCost || 0,
        ActualFuelCost: t.actualFuelCost || 0,
        Revenue: t.revenue || 0,
        CreatedAt: t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : '',
        CompletedAt: t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : '',
    }));

    const fields = ['TripId', 'Status', 'Origin', 'Destination', 'Vehicle', 'VehiclePlate', 'Driver', 'DriverLicense', 'CargoWeight', 'CargoDescription', 'StartOdometer', 'EndOdometer', 'EstimatedFuelCost', 'ActualFuelCost', 'Revenue', 'CreatedAt', 'CompletedAt'];
    const parser = new Parser({ fields });
    const csv = parser.parse(flatData);

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=trips-${dateStr}.csv`);
    res.send(csv);
});

/**
 * @desc    Export expenses data as CSV
 * @route   GET /api/export/expenses-csv
 * @access  Private (fleet_manager, financial)
 */
export const exportExpensesCSV = asyncHandler(async (req, res) => {
    const expenses = await Expense.find()
        .populate('vehicle', 'name licensePlate')
        .populate('driver', 'name')
        .populate('trip', 'tripId')
        .lean();

    const flatData = expenses.map((e) => ({
        Type: e.type || '',
        Vehicle: e.vehicle?.name || '',
        VehiclePlate: e.vehicle?.licensePlate || '',
        Driver: e.driver?.name || '',
        TripId: e.trip?.tripId || '',
        TotalCost: e.totalCost || 0,
        Liters: e.liters || 0,
        DistanceCovered: e.distanceCovered || 0,
        FuelEfficiency: e.fuelEfficiency || 0,
        Date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
        Notes: e.notes || '',
    }));

    const fields = ['Type', 'Vehicle', 'VehiclePlate', 'Driver', 'TripId', 'TotalCost', 'Liters', 'DistanceCovered', 'FuelEfficiency', 'Date', 'Notes'];
    const parser = new Parser({ fields });
    const csv = parser.parse(flatData);

    const dateStr = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${dateStr}.csv`);
    res.send(csv);
});

/**
 * @desc    Export full analytics report as PDF
 * @route   GET /api/export/analytics-pdf
 * @access  Private (fleet_manager, financial)
 */
export const exportAnalyticsPDF = asyncHandler(async (req, res) => {
    const [kpis, roiData, monthlySummary, fuelData] = await Promise.all([
        getDashboardKPIs(),
        getVehicleROI(),
        getMonthlySummary(),
        getFuelEfficiency(),
    ]);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fleetflow-analytics-${dateStr}.pdf`);
    doc.pipe(res);

    // ── Page 1: Header ──
    doc.fontSize(24).font('Helvetica-Bold').text('FleetFlow Analytics Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1.5);

    // ── Section 1: Fleet Overview KPIs ──
    doc.fontSize(16).font('Helvetica-Bold').text('1. Fleet Overview');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Vehicles: ${kpis.totalVehicles}`);
    doc.text(`Active Fleet (On Trip): ${kpis.activeFleet}`);
    doc.text(`Available Vehicles: ${kpis.availableVehicles}`);
    doc.text(`In Maintenance: ${kpis.maintenanceAlerts}`);
    doc.text(`Utilization Rate: ${kpis.utilizationRate}%`);
    doc.text(`Total Drivers: ${kpis.totalDrivers}`);
    doc.text(`Available Drivers: ${kpis.availableDrivers}`);
    doc.text(`Pending Trips: ${kpis.pendingCargo}`);
    doc.text(`Trips Completed Today: ${kpis.tripsCompletedToday}`);
    doc.text(`Expiring Licenses (≤30 days): ${kpis.expiringLicenses}`);
    doc.moveDown(1.5);

    // ── Section 2: Monthly Financial Summary ──
    doc.fontSize(16).font('Helvetica-Bold').text('2. Monthly Financial Summary (Last 6 Months)');
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica');

    const colWidths = [60, 80, 80, 100, 60, 80];
    const headers = ['Month', 'Revenue', 'Fuel Cost', 'Maintenance', 'Trips', 'Net Profit'];
    let x = 50;

    // Header row
    headers.forEach((h, i) => {
        doc.font('Helvetica-Bold').text(h, x, doc.y, { width: colWidths[i], continued: i < headers.length - 1 });
        x += colWidths[i];
    });
    doc.moveDown(0.3);

    // Data rows
    for (const m of monthlySummary) {
        x = 50;
        const row = [
            `${m.monthName} ${m.year}`,
            `₹${m.revenue.toLocaleString()}`,
            `₹${m.fuelCost.toLocaleString()}`,
            `₹${m.maintenanceCost.toLocaleString()}`,
            `${m.tripsCompleted}`,
            `₹${m.netProfit.toLocaleString()}`,
        ];
        doc.font('Helvetica');
        row.forEach((val, i) => {
            doc.text(val, x, doc.y, { width: colWidths[i], continued: i < row.length - 1 });
            x += colWidths[i];
        });
        doc.moveDown(0.2);
    }
    doc.moveDown(1.5);

    // ── Section 3: Vehicle ROI ──
    doc.fontSize(16).font('Helvetica-Bold').text('3. Vehicle ROI Analysis');
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica');

    for (const v of roiData) {
        const profitLabel = v.isProfitable ? '✅ Profitable' : '❌ Loss';
        doc.text(`${v.name} (${v.licensePlate}): Revenue ₹${v.revenue.toLocaleString()} | Costs ₹${v.totalOperationalCost.toLocaleString()} | Net ₹${v.netProfit.toLocaleString()} | ROI ${v.roi}% | ${profitLabel}`);
        doc.moveDown(0.2);
    }
    doc.moveDown(1);

    // ── Section 4: Fuel Efficiency Rankings ──
    if (fuelData.length > 0) {
        doc.fontSize(16).font('Helvetica-Bold').text('4. Fuel Efficiency Rankings');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');

        for (const f of fuelData) {
            doc.text(`${f.name} (${f.licensePlate}): ${f.fuelEfficiency} km/L | ₹${f.costPerKm}/km | ${f.totalDistance}km total`);
            doc.moveDown(0.2);
        }
        doc.moveDown(1);
    }

    // ── Section 5: Top / Bottom Performers ──
    if (roiData.length >= 2) {
        doc.fontSize(16).font('Helvetica-Bold').text('5. Top / Bottom Performers');
        doc.moveDown(0.5);
        doc.fontSize(10).font('Helvetica');

        const top = roiData[0];
        const bottom = roiData[roiData.length - 1];
        doc.text(`🏆 Best ROI: ${top.name} (${top.licensePlate}) — ${top.roi}%`);
        doc.text(`📉 Worst ROI: ${bottom.name} (${bottom.licensePlate}) — ${bottom.roi}%`);

        if (fuelData.length >= 2) {
            doc.text(`⛽ Most Efficient: ${fuelData[0].name} — ${fuelData[0].fuelEfficiency} km/L`);
            doc.text(`⛽ Least Efficient: ${fuelData[fuelData.length - 1].name} — ${fuelData[fuelData.length - 1].fuelEfficiency} km/L`);
        }
    }

    doc.end();
});

/**
 * @desc    Export monthly report as PDF
 * @route   GET /api/export/monthly-report-pdf
 * @access  Private (fleet_manager, financial)
 */
export const exportMonthlyReportPDF = asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const [trips, expenses, kpis] = await Promise.all([
        Trip.find({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } })
            .populate('vehicle', 'name licensePlate')
            .populate('driver', 'name')
            .lean(),
        Expense.find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
            .populate('vehicle', 'name licensePlate')
            .lean(),
        getDashboardKPIs(),
    ]);

    const totalTripRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
    const totalExpenseCost = expenses.reduce((sum, e) => sum + (e.totalCost || 0), 0);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${dateStr}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text(`FleetFlow Monthly Report`, { align: 'center' });
    doc.fontSize(14).font('Helvetica').text(monthName, { align: 'center' });
    doc.moveDown(1);

    // Summary
    doc.fontSize(16).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Trips: ${trips.length}`);
    doc.text(`Completed: ${trips.filter((t) => t.status === 'Completed').length}`);
    doc.text(`Cancelled: ${trips.filter((t) => t.status === 'Cancelled').length}`);
    doc.text(`Total Revenue: ₹${totalTripRevenue.toLocaleString()}`);
    doc.text(`Total Expenses: ₹${totalExpenseCost.toLocaleString()}`);
    doc.text(`Net: ₹${(totalTripRevenue - totalExpenseCost).toLocaleString()}`);
    doc.moveDown(1);

    // Trips Table
    doc.fontSize(16).font('Helvetica-Bold').text('Trips This Month');
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica');

    for (const t of trips) {
        doc.text(`${t.tripId} | ${t.origin} → ${t.destination} | ${t.vehicle?.name || 'N/A'} | ${t.driver?.name || 'N/A'} | ${t.status} | ₹${(t.revenue || 0).toLocaleString()}`);
        doc.moveDown(0.15);
    }

    if (trips.length === 0) {
        doc.text('No trips this month.');
    }

    doc.moveDown(1);

    // Expenses Table
    doc.fontSize(16).font('Helvetica-Bold').text('Expenses This Month');
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica');

    for (const e of expenses) {
        doc.text(`${e.type} | ${e.vehicle?.name || 'N/A'} | ₹${(e.totalCost || 0).toLocaleString()} | ${new Date(e.date).toISOString().split('T')[0]}`);
        doc.moveDown(0.15);
    }

    if (expenses.length === 0) {
        doc.text('No expenses this month.');
    }

    doc.moveDown(1);

    // Fleet KPIs
    doc.fontSize(16).font('Helvetica-Bold').text('Current Fleet Status');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Active Fleet: ${kpis.activeFleet} | In Maintenance: ${kpis.maintenanceAlerts} | Available: ${kpis.availableVehicles} | Utilization: ${kpis.utilizationRate}%`);

    doc.end();
});
