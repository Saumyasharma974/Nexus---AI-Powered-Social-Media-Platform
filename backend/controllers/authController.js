import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            bio: user.bio,
            interests: user.interests,
            onboardingCompleted: user.onboardingCompleted,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

export const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Auto-generate a unique temp username from name + random digits
    const base = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 14);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const autoUsername = `${base}${randomSuffix}`;

    const user = await User.create({ name, username: autoUsername, email, password });
    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            bio: user.bio,
            interests: user.interests,
            onboardingCompleted: user.onboardingCompleted,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

export const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('followers', 'name username profileImage')
        .populate('following', 'name username profileImage');
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            bio: user.bio,
            profileImage: user.profileImage,
            interests: user.interests,
            onboardingCompleted: user.onboardingCompleted,
            followers: user.followers,
            following: user.following,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

export const googleAuth = asyncHandler(async (req, res) => {
    const { credential } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const { email, name, picture } = payload;
        
        let user = await User.findOne({ email });
        
        if (!user) {
            // Auto-generate a unique temp username from name + random digits
            const base = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 14);
            const randomSuffix = Math.floor(1000 + Math.random() * 9000);
            const autoUsername = `${base}${randomSuffix}`;
            
            // Note: generate random password for google users as it's required by our schema
            const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
            
            user = await User.create({ 
                name, 
                username: autoUsername, 
                email, 
                password: randomPassword,
                profileImage: picture
            });
        }
        
        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            bio: user.bio,
            interests: user.interests,
            onboardingCompleted: user.onboardingCompleted,
            token: generateToken(user._id),
        });
        
    } catch (error) {
        console.error("Error verifying Google token:", error);
        res.status(401);
        throw new Error("Invalid Google credential");
    }
});

// @desc    Forgot Password - Send OTP to email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error("There is no user with that email address");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP and expiration (10 minutes)
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Send Email
    const message = `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto;">
                <h2 style="color: #6366f1; text-align: center;">Password Reset Request</h2>
                <p style="color: #333; font-size: 16px;">You are receiving this email because you (or someone else) have requested the reset of a password. Please make a POST request to: \n\n</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; background-color: #f3f4f6; padding: 15px 30px; border-radius: 8px;">${otp}</span>
                </div>
                <p style="color: #666; font-size: 14px; text-align: center;">This code will expire in 10 minutes.</p>
                <p style="color: #666; font-size: 14px; text-align: center;">If you did not request this, please ignore this email and your password will remain unchanged.</p>
            </div>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Nexus Password Reset OTP',
            message,
        });

        res.status(200).json({ success: true, message: 'OTP sent to email' });
    } catch (error) {
        console.error("Email Error:", error);
        user.resetPasswordOtp = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(500);
        throw new Error("Email could not be sent");
    }
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({
        email,
        resetPasswordOtp: otp,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error("Invalid or Expired OTP");
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({
        email,
        resetPasswordOtp: otp,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error("Invalid or Expired OTP");
    }

    // Hash is handled by the model's pre-save middleware
    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ success: true, message: 'Password reset successful!' });
});

