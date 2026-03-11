import mongoose from 'mongoose';

/**
 * Notification Schema
 * type: 'like' | 'comment' | 'follow'
 * sender: who triggered the notification
 * receiver: who receives it
 * post: which post (for like/comment types)
 */
const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['like', 'comment', 'follow'],
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            default: null,
        },
        message: {
            type: String,
            default: '',
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
