import mongoose from 'mongoose';

/**
 * Post Schema - Represents a social media post.
 */
const postSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        image: {
            type: String,
            required: [true, 'Post image is required'],
        },
        caption: {
            type: String,
            default: '',
            maxlength: [2200, 'Caption cannot exceed 2200 characters'],
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        comments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Comment',
            },
        ],
        hashtags: {
            type: [String],
            default: [],
        },
    },
    { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);
export default Post;
