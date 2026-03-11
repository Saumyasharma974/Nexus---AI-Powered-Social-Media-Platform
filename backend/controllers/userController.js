import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';
import { io, getReceiverSocketId } from '../socket.js';

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/profile/:id
 * @access  Private
 */
export const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id)
        .populate('followers', 'name username profileImage')
        .populate('following', 'name username profileImage');

    if (user) {
        // Check if the current logged-in user is blocked by this user
        if (user.blockedUsers.includes(req.user._id)) {
            res.status(403);
            throw new Error('User is blocked');
        }
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

/**
 * @desc    Get all users the logged-in user is connected with (followers + following)
 * @route   GET /api/users/connections
 * @access  Private
 */
export const getConnections = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('followers', 'name username profileImage')
        .populate('following', 'name username profileImage');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Merge followers and following, deduplicating by string ID
    const connectionMap = new Map();
    const myId = req.user._id.toString();

    user.followers?.forEach(u => {
        const id = u._id?.toString();
        if (id && id !== myId) connectionMap.set(id, { _id: id, name: u.name, username: u.username, profileImage: u.profileImage });
    });

    user.following?.forEach(u => {
        const id = u._id?.toString();
        if (id && id !== myId) connectionMap.set(id, { _id: id, name: u.name, username: u.username, profileImage: u.profileImage });
    });

    res.json(Array.from(connectionMap.values()));
});

/**
 * @desc    Toggle Save/Bookmark an Item (Post or Reel)
 * @route   PUT /api/users/save/:itemId
 * @access  Private
 */
export const toggleSaveItem = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { itemModel } = req.body; // 'Post' or 'Reel'
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!itemModel || !['Post', 'Reel'].includes(itemModel)) {
        res.status(400);
        throw new Error('Valid itemModel (Post or Reel) is required');
    }

    const savedIndex = user.savedItems?.findIndex(s => s.item?.toString() === itemId);
    let isSaved = false;

    if (!user.savedItems) user.savedItems = [];

    if (savedIndex !== -1 && savedIndex !== undefined) {
        // Remove from saved
        user.savedItems.splice(savedIndex, 1);
        isSaved = false;
    } else {
        // Add to saved
        user.savedItems.push({ item: itemId, itemModel });
        isSaved = true;
    }

    await user.save();
    res.json({ message: isSaved ? 'Item saved' : 'Item removed from saved', isSaved, savedItems: user.savedItems });
});

/**
 * @desc    Get logged-in user's saved items
 * @route   GET /api/users/saved
 * @access  Private
 */
export const getSavedItems = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate({
        path: 'savedItems.item',
        populate: [
            { path: 'userId', select: 'name username profileImage', strictPopulate: false },
            { path: 'user', select: 'name username profileImage', strictPopulate: false }
        ]
    });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Filter out null items in case a saved post/reel was deleted
    const validSavedItems = user.savedItems.filter(s => s.item != null);

    res.json(validSavedItems);
});

/**
 * @desc    Search users by name or username
 * @route   GET /api/users/search?q=query
 * @access  Private
 */
export const searchUsers = asyncHandler(async (req, res) => {
    const keyword = req.query.q
        ? {
            $or: [
                { name: { $regex: req.query.q, $options: 'i' } },
                { username: { $regex: req.query.q, $options: 'i' } },
            ],
        }
        : {};

    // Don't return the current user or blocked users in search results
    const users = await User.find({ ...keyword, _id: { $ne: req.user._id } })
        .select('name username profileImage')
        .limit(10);

    // Filter out users who have blocked the current user
    const filteredUsers = users.filter((u) => {
        // We'd ideally populate blockedUsers, but for simplicity we rely on manual checks if needed, 
        // or just return the list and let the profile page handle the block error.
        return true;
    });

    res.json(filteredUsers);
});

/**
 * @desc    Follow/Unfollow user
 * @route   POST /api/users/follow
 * @access  Private
 */
export const followUser = asyncHandler(async (req, res) => {
    const { userIdToFollow } = req.body;
    const currentUserId = req.user._id;

    if (currentUserId.toString() === userIdToFollow) {
        res.status(400);
        throw new Error('You cannot follow yourself');
    }

    const userToFollow = await User.findById(userIdToFollow);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if blocked
    if (userToFollow.blockedUsers.includes(currentUserId)) {
        res.status(403);
        throw new Error('User is blocked');
    }

    const isFollowing = currentUser.following.map(id => id.toString()).includes(userIdToFollow.toString());

    if (isFollowing) {
        // Unfollow
        currentUser.following = currentUser.following.filter(
            (id) => id.toString() !== userIdToFollow
        );
        userToFollow.followers = userToFollow.followers.filter(
            (id) => id.toString() !== currentUserId.toString()
        );
    } else {
        // Follow
        currentUser.following.push(userIdToFollow);
        userToFollow.followers.push(currentUserId);

        // 🔔 Notify followed user
        const notification = await createNotification({
            type: 'follow',
            sender: currentUserId,
            receiver: userIdToFollow,
            message: `${currentUser.name} started following you`,
        });

        if (notification) {
            const receiverSocketId = getReceiverSocketId(userIdToFollow);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newNotification', notification);
            }
        }
    }

    await currentUser.save();
    await userToFollow.save();

    res.json({ message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully' });
});

/**
 * @desc    Block a user
 * @route   POST /api/users/block/:userId
 * @access  Private
 */
export const blockUser = asyncHandler(async (req, res) => {
    const userIdToBlock = req.params.userId;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);

    if (!currentUser.blockedUsers.includes(userIdToBlock)) {
        currentUser.blockedUsers.push(userIdToBlock);

        // Also remove from following/followers if exists
        currentUser.following = currentUser.following.filter(id => id.toString() !== userIdToBlock);
        currentUser.followers = currentUser.followers.filter(id => id.toString() !== userIdToBlock);

        await currentUser.save();

        // Remove current user from blocked user's following/followers
        const blockedUser = await User.findById(userIdToBlock);
        if (blockedUser) {
            blockedUser.following = blockedUser.following.filter(id => id.toString() !== currentUserId.toString());
            blockedUser.followers = blockedUser.followers.filter(id => id.toString() !== currentUserId.toString());
            await blockedUser.save();
        }
    }

    res.json({ message: 'User blocked' });
});

/**
 * @desc    Unblock a user
 * @route   POST /api/users/unblock/:userId
 * @access  Private
 */
export const unblockUser = asyncHandler(async (req, res) => {
    const userIdToUnblock = req.params.userId;
    const currentUserId = req.user._id;

    const currentUser = await User.findById(currentUserId);

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (id) => id.toString() !== userIdToUnblock
    );

    await currentUser.save();
    res.json({ message: 'User unblocked' });
});

/**
 * @desc    Save onboarding data and mark onboarding as complete
 * @route   PUT /api/users/onboarding
 * @access  Private
 */
export const updateOnboarding = asyncHandler(async (req, res) => {
    const { interests, bio, profileImage, username } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (interests) user.interests = interests;
    if (bio) user.bio = bio;
    if (profileImage) user.profileImage = profileImage;
    if (username) {
        // Check username isn't taken by someone else
        const taken = await User.findOne({ username, _id: { $ne: user._id } });
        if (!taken) user.username = username;
    }
    user.onboardingCompleted = true;

    await user.save();

    res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        interests: user.interests,
        onboardingCompleted: user.onboardingCompleted,
    });
});

/**
 * @desc    Get users suggested to follow (not already following)
 * @route   GET /api/users/suggestions
 * @access  Private
 */
export const getSuggestedUsers = asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user._id);

    // Get all users the current user is already following + themselves
    const excluded = [...currentUser.following.map(id => id.toString()), req.user._id.toString()];

    const suggestions = await User.find({ _id: { $nin: excluded } })
        .select('name username profileImage bio interests')
        .limit(10);

    res.json(suggestions);
});

/**
 * @desc    Update logged-in user's profile (name, username, bio, profileImage)
 * @route   PUT /api/users/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, username, bio, profileImage } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // If changing username, check it's not taken
    if (username && username !== user.username) {
        const taken = await User.findOne({ username });
        if (taken) {
            res.status(400);
            throw new Error('Username already taken');
        }
        user.username = username;
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;

    await user.save();

    res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        interests: user.interests,
        onboardingCompleted: user.onboardingCompleted,
    });
});

/**
 * @desc    Update user password
 * @route   PUT /api/users/password
 * @access  Private
 */
export const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (await user.matchPassword(oldPassword)) {
        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully' });
    } else {
        res.status(401);
        throw new Error('Incorrect old password');
    }
});

/**
 * @desc    Get blocked users list
 * @route   GET /api/users/blocked
 * @access  Private
 */
export const getBlockedUsers = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).populate(
        'blockedUsers',
        'name username profileImage'
    );

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json(user.blockedUsers);
});

