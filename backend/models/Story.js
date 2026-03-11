import mongoose from 'mongoose';

const storySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        type: { type: String, enum: ['image', 'video', 'text'], required: true },
        media: { type: String, default: '' },       // base64 image or video
        text: { type: String, default: '' },         // overlay text
        textColor: { type: String, default: '#ffffff' },
        bg: { type: String, default: '#6366f1' },    // used for text-only stories
        viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
    },
    { timestamps: true }
);

// TTL index — MongoDB auto-deletes documents when expiresAt is reached
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Story = mongoose.model('Story', storySchema);
export default Story;
