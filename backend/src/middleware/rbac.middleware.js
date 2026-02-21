import { ApiError } from '../utils/apiResponse.js';

/**
 * authorize — restricts access to specific roles.
 * Must be used after protect middleware.
 *
 * @param {...string} roles - allowed roles (fleet_manager, dispatcher, etc.)
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, 'Not authorized, user not found');
        }

        if (!roles.includes(req.user.role)) {
            throw new ApiError(
                403,
                'You do not have permission to perform this action'
            );
        }

        next();
    };
};
