import Notification from '../models/Notification.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get notifications for the current user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    res.status(200).json({
        success: true,
        data: notifications,
        message: 'Notifications fetched successfully',
    });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        recipient: req.user._id,
        isRead: false,
    });

    res.status(200).json({
        success: true,
        data: { count },
        message: 'Unread count fetched successfully',
    });
});

/**
 * @desc    Mark a single notification as read
 * @route   PATCH /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to update this notification');
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
        success: true,
        data: notification,
        message: 'Notification marked as read',
    });
});

/**
 * @desc    Mark all notifications as read for current user
 * @route   PATCH /api/notifications/read-all
 * @access  Private
 */
export const markAllRead = asyncHandler(async (req, res) => {
    const result = await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { isRead: true }
    );

    res.status(200).json({
        success: true,
        data: { modifiedCount: result.modifiedCount },
        message: `${result.modifiedCount} notification(s) marked as read`,
    });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        throw new ApiError(404, 'Notification not found');
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to delete this notification');
    }

    await Notification.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        data: null,
        message: 'Notification deleted successfully',
    });
});
