import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema - Core user model for the social media platform.
 * Includes followers/following arrays, blocked users, and AI-related fields.
 */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            lowercase: true,
            maxlength: [30, 'Username cannot exceed 30 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
        },
        bio: {
            type: String,
            default: '',
            maxlength: [300, 'Bio cannot exceed 300 characters'],
        },
        profileImage: {
            type: String,
            default: '',
        },
        interests: {
            type: [String],
            default: [],
        },
        location: {
            type: String,
            default: '',
        },
        profession: {
            type: String,
            default: '',
        },
        followers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        following: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        blockedUsers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        savedItems: [
            {
                item: {
                    type: mongoose.Schema.Types.ObjectId,
                    refPath: 'savedItems.itemModel',
                },
                itemModel: {
                    type: String,
                    required: true,
                    enum: ['Post', 'Reel'],
                },
            },
        ],
        resetPasswordOtp: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        onboardingCompleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
