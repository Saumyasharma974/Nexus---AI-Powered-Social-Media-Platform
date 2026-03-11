import mongoose from 'mongoose';

/**
 * Comment Schema - Represents a comment on a post.
 */
const commentSchema = new mongoose.Schema(
    {
        postId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
            required: [true, 'Comment text is required'],
            maxlength: [500, 'Comment cannot exceed 500 characters'],
        },
    },
    { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
