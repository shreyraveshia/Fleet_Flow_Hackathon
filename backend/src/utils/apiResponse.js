/**
 * ApiResponse — standardized success response wrapper
 */
export class ApiResponse {
    constructor(statusCode, data, message = 'Success') {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * ApiError — standardized error class extending native Error
 */
export class ApiError extends Error {
    constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.message = message;
        this.errors = errors;
        this.data = null;
        this.timestamp = new Date().toISOString();

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
