import { Router } from 'express';
import {
    register,
    login,
    logout,
    getMe,
    changePassword,
    updateProfile,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';
import {
    registerValidation,
    loginValidation,
    validate,
} from '../middleware/validate.middleware.js';

const router = Router();

// Public routes
router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/logout', logout);

// Private routes (require auth)
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

export default router;
