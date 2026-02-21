import { ApiError } from '../utils/apiResponse.js';

/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // 1. Mongoose invalid ObjectId (CastError)
    if (err.name === 'CastError') {
        error = new ApiError(400, 'Invalid ID format');
    }

    // 2. Mongoose duplicate key (11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        error = new ApiError(400, `${field} already exists`);
    }

    // 3. Mongoose ValidationError
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((val) => val.message);
        error = new ApiError(400, messages.join('. '), messages);
    }

    // 4. JWT Errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, 'Invalid authentication token');
    }

    if (err.name === 'TokenExpiredError') {
        error = new ApiError(401, 'Authentication token has expired');
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    const errors = error.errors || [];

    res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default errorHandler;
