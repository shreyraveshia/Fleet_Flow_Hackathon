import rateLimit from 'express-rate-limit';

/**
 * authLimiter — rate limit for authentication routes (login/register)
 * 20 requests per 15 minutes
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes',
        errors: [],
    },
    skip: () => process.env.NODE_ENV === 'development',
});

/**
 * apiLimiter — generic rate limit for all API routes
 * 500 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests, please try again after 15 minutes',
        errors: [],
    },
    skip: () => process.env.NODE_ENV === 'development',
});
