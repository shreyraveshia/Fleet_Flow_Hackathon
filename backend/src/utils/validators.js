import { validationResult } from 'express-validator';
import { ApiError } from './apiResponse.js';

/**
 * Reads express-validator results from the request and throws ApiError if any.
 * Call this at the start of every controller that has validation chains.
 */
export const validateRequest = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map((e) => e.msg);
        throw new ApiError(422, messages[0], errors.array());
    }
};

/**
 * Validates a MongoDB ObjectId string format
 */
export const isValidObjectId = (id) => {
    return /^[a-fA-F0-9]{24}$/.test(id);
};

/**
 * Validates an email address format
 */
export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

/**
 * Validates that a phone number contains only digits, spaces, + and -.
 */
export const isValidPhone = (phone) => {
    const re = /^[\d\s\+\-\(\)]{7,20}$/;
    return re.test(phone);
};

/**
 * Validates a vehicle license plate (letters, numbers, spaces, hyphens).
 */
export const isValidPlate = (plate) => {
    const re = /^[A-Z0-9\s\-]{2,15}$/i;
    return re.test(plate);
};

/**
 * Validates that a value is a positive number.
 */
export const isPositiveNumber = (value) => {
    return typeof value === 'number' && !isNaN(value) && value >= 0;
};

/**
 * Validates that a date string is a valid ISO date.
 */
export const isValidDate = (dateStr) => {
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
};

/**
 * Validates coordinate pair (latitude -90 to 90, longitude -180 to 180)
 */
export const isValidCoordinates = (lat, lng) => {
    return (
        typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
};

/**
 * Sanitizes a string by trimming whitespace and removing HTML tags.
 */
export const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/<[^>]*>/g, '');
};

/**
 * Builds a pagination object from query params.
 */
export const getPagination = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

/**
 * Builds a sort object from query params.
 * Example: ?sort=createdAt&order=desc  →  { createdAt: -1 }
 */
export const getSort = (query, allowedFields = []) => {
    const field = query.sort || 'createdAt';
    const order = query.order === 'asc' ? 1 : -1;

    if (allowedFields.length > 0 && !allowedFields.includes(field)) {
        return { createdAt: -1 };
    }

    return { [field]: order };
};
