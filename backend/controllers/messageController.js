import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { io, getReceiverSocketId } from '../socket.js';

/**
 * @desc    Get messages between logged in user and target user
 * @route   GET /api/messages/:userId
 * @access  Private
 */
export const getMessages = asyncHandler(async (req, res) => {
    const { userId: userToChatId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
        $or: [
            { senderId: senderId, receiverId: userToChatId },
            { senderId: userToChatId, receiverId: senderId },
        ],
    }).sort({ createdAt: 1 }); // Oldest first for chat view

    // Mark all unread messages from this user as read
    await Message.updateMany(
        { senderId: userToChatId, receiverId: senderId, isRead: false },
        { $set: { isRead: true } }
    );

    res.json(messages);
});

/**
 * @desc    Send a message to a user
 * @route   POST /api/messages/send
 * @access  Private
 */
export const sendMessage = asyncHandler(async (req, res) => {
    const { message, receiverId } = req.body;
    const senderId = req.user._id;

    // Check if blocked
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);

    if (receiver.blockedUsers.includes(senderId) || sender.blockedUsers.includes(receiverId)) {
        res.status(403);
        throw new Error('You cannot message this user. They or you are blocked.');
    }

    const newMessage = await Message.create({
        senderId,
        receiverId,
        message,
    });

    // Socket functionality will go here
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
        // Emit message to specific receiver
        io.to(receiverSocketId).emit('receiveMessage', newMessage);
    }

    res.status(201).json(newMessage);
});

/**
 * @desc    Get total unread message count
 * @route   GET /api/messages/unread-count
 * @access  Private
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
    const receiverId = req.user._id;

    const count = await Message.countDocuments({
        receiverId,
        isRead: false
    });

    res.json({ count });
});
