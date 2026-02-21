import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

/**
 * protect — verifies JWT from cookie or Authorization header.
 * Attaches req.user (lean document) on success.
 */
export const protect = asyncHandler(async (req, res, next) => {
    let token;

    // 1. Try httpOnly cookie
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    // 2. Fall back to Authorization: Bearer <token> header
    if (
        !token &&
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        throw new ApiError(401, 'Not authenticated. Please log in.');
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new ApiError(401, 'Invalid or expired token. Please log in again.');
    }

    const user = await User.findById(decoded.id).select('-password').lean();

    if (!user) {
        throw new ApiError(401, 'User belonging to this token no longer exists.');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Your account has been deactivated. Contact admin.');
    }

    req.user = user;
    next();
});

/**
 * authorize — restricts access to specific roles.
 * Must be used after protect middleware.
 *
 * Usage: router.delete('/:id', protect, authorize('admin', 'manager'), handler)
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, 'Not authenticated.'));
        }
        if (!roles.includes(req.user.role)) {
            return next(
                new ApiError(
                    403,
                    `Role '${req.user.role}' is not allowed to perform this action.`
                )
            );
        }
        next();
    };
};
