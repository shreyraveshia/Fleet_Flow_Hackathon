import { Router } from 'express';
import {
    getExpenses,
    getExpense,
    createExpense,
    getExpensesByVehicle,
    updateExpense,
    deleteExpense,
    getMonthlyCostSummary,
} from '../controllers/expense.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authorize } from '../middleware/rbac.middleware.js';
import { expenseValidation, validate } from '../middleware/validate.middleware.js';

const router = Router();

// All expense routes require authentication
router.use(protect);

// List expenses (fleet_manager, dispatcher, financial)
router.get('/', authorize('fleet_manager', 'dispatcher', 'financial'), getExpenses);

// Monthly summary (fleet_manager, financial)
router.get('/monthly-summary', authorize('fleet_manager', 'financial'), getMonthlyCostSummary);

// Expenses by vehicle (all authenticated)
router.get('/vehicle/:id', getExpensesByVehicle);

// Create expense (fleet_manager, dispatcher, financial)
router.post('/', authorize('fleet_manager', 'dispatcher', 'financial'), expenseValidation, validate, createExpense);

// Single expense
router.get('/:id', getExpense);

// Update expense (fleet_manager, financial)
router.put('/:id', authorize('fleet_manager', 'financial'), updateExpense);

// Delete expense (fleet_manager, financial)
router.delete('/:id', authorize('fleet_manager', 'financial'), deleteExpense);

export default router;
