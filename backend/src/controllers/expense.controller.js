import Expense from '../models/Expense.model.js';
import Vehicle from '../models/Vehicle.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createAuditLog } from '../services/auditLog.service.js';

/**
 * @desc    Get all expenses with filtering, date range, and pagination
 * @route   GET /api/expenses
 * @access  Private (fleet_manager, dispatcher, financial)
 */
export const getExpenses = asyncHandler(async (req, res) => {
    const {
        vehicle,
        type,
        driver,
        trip,
        startDate,
        endDate,
        page = 1,
        limit = 50,
    } = req.query;

    const query = {};
    if (vehicle) query.vehicle = vehicle;
    if (type) query.type = type;
    if (driver) query.driver = driver;
    if (trip) query.trip = trip;

    // Date range filter
    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [expenses, total] = await Promise.all([
        Expense.find(query)
            .populate('vehicle', 'name licensePlate')
            .populate('driver', 'name')
            .populate('trip', 'tripId status')
            .sort({ date: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Expense.countDocuments(query),
    ]);

    // Calculate summary from ALL matching records (not just current page)
    const summaryPipeline = [
        { $match: query },
        {
            $group: {
                _id: null,
                totalFuel: {
                    $sum: { $cond: [{ $eq: ['$type', 'Fuel'] }, '$totalCost', 0] },
                },
                totalOther: {
                    $sum: { $cond: [{ $ne: ['$type', 'Fuel'] }, '$totalCost', 0] },
                },
                avgFuelEfficiency: {
                    $avg: {
                        $cond: [
                            { $and: [{ $eq: ['$type', 'Fuel'] }, { $gt: ['$fuelEfficiency', 0] }] },
                            '$fuelEfficiency',
                            null,
                        ],
                    },
                },
            },
        },
    ];

    const summaryResult = await Expense.aggregate(summaryPipeline);
    const summary = summaryResult[0] || { totalFuel: 0, totalOther: 0, avgFuelEfficiency: 0 };

    const pages = Math.ceil(total / limitNum);

    res.status(200).json({
        success: true,
        data: {
            expenses,
            total,
            page: pageNum,
            pages,
            hasNextPage: pageNum < pages,
            hasPrevPage: pageNum > 1,
            summary: {
                totalFuel: Math.round(summary.totalFuel * 100) / 100,
                totalOther: Math.round(summary.totalOther * 100) / 100,
                avgFuelEfficiency: Math.round((summary.avgFuelEfficiency || 0) * 100) / 100,
            },
        },
        message: 'Expenses fetched successfully',
    });
});

/**
 * @desc    Get single expense by ID
 * @route   GET /api/expenses/:id
 * @access  Private (all roles)
 */
export const getExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id)
        .populate('vehicle', 'name licensePlate')
        .populate('driver', 'name')
        .populate('trip', 'tripId status');

    if (!expense) {
        throw new ApiError(404, 'Expense not found');
    }

    res.status(200).json({
        success: true,
        data: expense,
        message: 'Expense fetched successfully',
    });
});

/**
 * @desc    Create an expense
 * @route   POST /api/expenses
 * @access  Private (fleet_manager, dispatcher, financial)
 */
export const createExpense = asyncHandler(async (req, res) => {
    // Validate vehicle exists
    const vehicle = await Vehicle.findById(req.body.vehicle);
    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    req.body.createdBy = req.user._id;

    // Create expense (pre-save hook handles fuelEfficiency calc)
    const expense = await Expense.create(req.body);

    // Audit log
    await createAuditLog({
        req,
        action: 'EXPENSE_CREATED',
        entity: 'Expense',
        entityId: expense._id,
        entityName: `${expense.type} — ₹${expense.totalCost} for ${vehicle.name}`,
        newValue: expense.toObject(),
    });

    // Return populated expense
    const populatedExpense = await Expense.findById(expense._id)
        .populate('vehicle', 'name licensePlate')
        .populate('driver', 'name')
        .populate('trip', 'tripId status');

    res.status(201).json({
        success: true,
        data: populatedExpense,
        message: 'Expense created successfully',
    });
});

/**
 * @desc    Get all expenses for a specific vehicle with summary
 * @route   GET /api/expenses/vehicle/:id
 * @access  Private (all roles)
 */
export const getExpensesByVehicle = asyncHandler(async (req, res) => {
    const vehicleId = req.params.id;

    const vehicle = await Vehicle.findById(vehicleId).select('name licensePlate').lean();
    if (!vehicle) {
        throw new ApiError(404, 'Vehicle not found');
    }

    const expenses = await Expense.find({ vehicle: vehicleId })
        .populate('driver', 'name')
        .populate('trip', 'tripId status')
        .sort({ date: -1 })
        .lean();

    // Calculate summary
    let totalFuelCost = 0;
    let totalOtherCost = 0;
    let totalLiters = 0;
    let totalDistance = 0;
    let fuelEntryCount = 0;
    let fuelEfficiencySum = 0;

    for (const exp of expenses) {
        if (exp.type === 'Fuel') {
            totalFuelCost += exp.totalCost || 0;
            totalLiters += exp.liters || 0;
            totalDistance += exp.distanceCovered || 0;
            if (exp.fuelEfficiency > 0) {
                fuelEfficiencySum += exp.fuelEfficiency;
                fuelEntryCount += 1;
            }
        } else {
            totalOtherCost += exp.totalCost || 0;
        }
    }

    const avgFuelEfficiency = fuelEntryCount > 0
        ? Math.round((fuelEfficiencySum / fuelEntryCount) * 100) / 100
        : 0;

    res.status(200).json({
        success: true,
        data: {
            vehicle,
            expenses,
            summary: {
                totalFuelCost: Math.round(totalFuelCost * 100) / 100,
                totalOtherCost: Math.round(totalOtherCost * 100) / 100,
                totalCost: Math.round((totalFuelCost + totalOtherCost) * 100) / 100,
                avgFuelEfficiency,
                totalLiters: Math.round(totalLiters * 100) / 100,
                totalDistance: Math.round(totalDistance * 100) / 100,
            },
        },
        message: 'Vehicle expenses fetched successfully',
    });
});

/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Private (fleet_manager, financial)
 */
export const updateExpense = asyncHandler(async (req, res) => {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
        throw new ApiError(404, 'Expense not found');
    }

    const previousValue = expense.toObject();

    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    // Audit log
    await createAuditLog({
        req,
        action: 'EXPENSE_UPDATED',
        entity: 'Expense',
        entityId: expense._id,
        entityName: `${expense.type} — ₹${expense.totalCost}`,
        previousValue,
        newValue: expense.toObject(),
    });

    res.status(200).json({
        success: true,
        data: expense,
        message: 'Expense updated successfully',
    });
});

/**
 * @desc    Delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Private (fleet_manager)
 */
export const deleteExpense = asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        throw new ApiError(404, 'Expense not found');
    }

    const expenseData = expense.toObject();
    await Expense.findByIdAndDelete(req.params.id);

    // Audit log
    await createAuditLog({
        req,
        action: 'EXPENSE_DELETED',
        entity: 'Expense',
        entityId: expenseData._id,
        entityName: `${expenseData.type} — ₹${expenseData.totalCost}`,
        previousValue: expenseData,
    });

    res.status(200).json({
        success: true,
        data: null,
        message: 'Expense deleted successfully',
    });
});

/**
 * @desc    Get monthly expense summary for last 6 months, grouped by vehicle
 * @route   GET /api/expenses/monthly-summary
 * @access  Private (fleet_manager, financial)
 */
export const getMonthlyCostSummary = asyncHandler(async (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const pipeline = [
        {
            $match: {
                date: { $gte: sixMonthsAgo },
            },
        },
        {
            $group: {
                _id: {
                    year: { $year: '$date' },
                    month: { $month: '$date' },
                    vehicle: '$vehicle',
                },
                totalCost: { $sum: '$totalCost' },
                totalFuelCost: {
                    $sum: { $cond: [{ $eq: ['$type', 'Fuel'] }, '$totalCost', 0] },
                },
                totalOtherCost: {
                    $sum: { $cond: [{ $ne: ['$type', 'Fuel'] }, '$totalCost', 0] },
                },
                count: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: 'vehicles',
                localField: '_id.vehicle',
                foreignField: '_id',
                as: 'vehicleInfo',
            },
        },
        {
            $unwind: {
                path: '$vehicleInfo',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                vehicleId: '$_id.vehicle',
                vehicleName: { $ifNull: ['$vehicleInfo.name', 'Unknown'] },
                licensePlate: { $ifNull: ['$vehicleInfo.licensePlate', 'N/A'] },
                totalCost: { $round: ['$totalCost', 2] },
                totalFuelCost: { $round: ['$totalFuelCost', 2] },
                totalOtherCost: { $round: ['$totalOtherCost', 2] },
                count: 1,
            },
        },
        {
            $sort: { year: -1, month: -1, totalCost: -1 },
        },
    ];

    const monthlySummary = await Expense.aggregate(pipeline);

    res.status(200).json({
        success: true,
        data: monthlySummary,
        message: 'Monthly cost summary fetched successfully',
    });
});
