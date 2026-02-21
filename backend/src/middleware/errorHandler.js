import { ApiError } from '../utils/apiResponse.js';

/**
 * Global error handler middleware — must be registered as the last middleware in app.js.
 * Handles ApiError instances, Mongoose validation/cast errors, JWT errors, and generic errors.
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    // Mongoose bad ObjectId (CastError)
    if (err.name === 'CastError') {
        error = new ApiError(404, `Resource not found with id: ${err.value}`);
    }

    // Mongoose duplicate key (code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue).join(', ');
        error = new ApiError(409, `Duplicate value for field: ${field}`);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        error = new ApiError(422, messages[0], messages);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new ApiError(401, 'Invalid token. Please log in again.');
    }
    if (err.name === 'TokenExpiredError') {
        error = new ApiError(401, 'Token expired. Please log in again.');
    }

    const response = {
        success: false,
        message: error.message || 'Internal Server Error',
        data: null,
        errors: error.errors || [],
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };

    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err.message);
        console.error(err.stack);
    }

    res.status(error.statusCode || 500).json(response);
};

export default errorHandler;
