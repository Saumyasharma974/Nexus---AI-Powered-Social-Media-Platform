import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const reelSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        videoUrl: {
            type: String,
            required: true, // Will store the base64 string or file URL
        },
        topic: {
            type: String,
            required: true, // The short 3-word topic to fuel AI
        },
        caption: {
            type: String, // The AI generated caption
            default: '',
        },
        hashtags: [{
            type: String
        }],
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        comments: [commentSchema],
    },
    {
        timestamps: true,
    }
);

const Reel = mongoose.model('Reel', reelSchema);

export default Reel;
