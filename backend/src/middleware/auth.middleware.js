import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.js';
import User from '../models/User.model.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * protect — verifies JWT from Authorization header OR cookie 'token'.
 * Attaches lean user object to req.user.
 */
export const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Check Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check cookie named 'token'
    else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        throw new ApiError(401, 'Not authorized, no token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select('-password').lean();

        if (!user) {
            throw new ApiError(401, 'User no longer exists');
        }

        if (!user.isActive) {
            throw new ApiError(401, 'Your account has been deactivated');
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, 'Invalid authentication token');
        }
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Authentication token has expired');
        }
        throw error;
    }
});
