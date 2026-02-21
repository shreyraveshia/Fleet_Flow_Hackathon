import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format as dfFormat, formatDistanceToNow as dfFormatDistanceToNow, isValid } from 'date-fns';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Safely format a date, returning a fallback if invalid
 */
export function formatDate(date, formatStr = 'MMM dd, yyyy', fallback = 'N/A') {
    if (!date) return fallback;
    const d = new Date(date);
    if (!isValid(d)) return fallback;
    return dfFormat(d, formatStr);
}

/**
 * Safely format distance to now
 */
export function formatDistanceToNow(date, fallback = 'N/A') {
    if (!date) return fallback;
    const d = new Date(date);
    if (!isValid(d)) return fallback;
    try {
        return dfFormatDistanceToNow(d, { addSuffix: true });
    } catch (e) {
        return fallback;
    }
}
