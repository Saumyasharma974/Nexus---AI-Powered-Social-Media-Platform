import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification.js';

/**
 * @desc    Get all notifications for the logged-in user
 * @route   GET /api/notifications
 * @access  Private
 */
export const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ receiver: req.user._id })
        .populate('sender', 'name username profileImage')
        .populate('post', 'image caption')
        .sort({ createdAt: -1 })
        .limit(50);

    res.json(notifications);
});

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
export const markAsRead = asyncHandler(async (req, res) => {
    await Notification.findOneAndUpdate(
        { _id: req.params.id, receiver: req.user._id },
        { read: true }
    );
    res.json({ success: true });
});

/**
 * @desc    Mark ALL notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ receiver: req.user._id, read: false }, { read: true });
    res.json({ success: true });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
    const count = await Notification.countDocuments({
        receiver: req.user._id,
        read: false,
    });
    res.json({ count });
});

/**
 * Helper to create a notification and return it (used in other controllers)
 */
export const createNotification = async ({ type, sender, receiver, post, message }) => {
    // Don't notify yourself
    if (sender.toString() === receiver.toString()) return null;

    const notification = await Notification.create({ type, sender, receiver, post, message });
    const populated = await Notification.findById(notification._id)
        .populate('sender', 'name username profileImage')
        .populate('post', 'image caption');

    return populated;
};
