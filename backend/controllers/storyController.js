import asyncHandler from 'express-async-handler';
import Story from '../models/Story.js';
import User from '../models/User.js';

/**
 * @desc    Create a new story
 * @route   POST /api/stories/create
 * @access  Private
 */
export const createStory = asyncHandler(async (req, res) => {
    const { type, media, text, textColor, bg } = req.body;

    if (!type) {
        res.status(400);
        throw new Error('Story type is required');
    }
    if (type !== 'text' && !media) {
        res.status(400);
        throw new Error('Media is required for image/video stories');
    }

    const story = await Story.create({
        userId: req.user._id,
        type,
        media: media || '',
        text: text || '',
        textColor: textColor || '#ffffff',
        bg: bg || '#6366f1',
    });

    const populated = await Story.findById(story._id).populate('userId', 'name username profileImage');
    res.status(201).json(populated);
});

/**
 * @desc    Get stories from followed users + own stories
 * @route   GET /api/stories
 * @access  Private
 */
export const getStories = asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user._id);
    const allowedIds = [...currentUser.following, req.user._id];

    const stories = await Story.find({ userId: { $in: allowedIds } })
        .populate('userId', 'name username profileImage')
        .sort({ createdAt: -1 });

    // Group by userId
    const grouped = {};
    for (const story of stories) {
        const uid = story.userId._id.toString();
        if (!grouped[uid]) {
            grouped[uid] = {
                user: story.userId,
                stories: [],
                hasUnseen: false,
            };
        }
        grouped[uid].stories.push(story);
        // Check if current user has NOT viewed this story
        if (!story.viewers.map(v => v.toString()).includes(req.user._id.toString())) {
            grouped[uid].hasUnseen = true;
        }
    }

    res.json(Object.values(grouped));
});

/**
 * @desc    Mark a story as viewed by current user
 * @route   POST /api/stories/:id/view
 * @access  Private
 */
export const viewStory = asyncHandler(async (req, res) => {
    const story = await Story.findById(req.params.id);
    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }

    if (!story.viewers.map(v => v.toString()).includes(req.user._id.toString())) {
        story.viewers.push(req.user._id);
        await story.save();
    }

    res.json({ success: true, viewers: story.viewers.length });
});

/**
 * @desc    Delete your own story
 * @route   DELETE /api/stories/:id
 * @access  Private
 */
export const deleteStory = asyncHandler(async (req, res) => {
    const story = await Story.findById(req.params.id);
    if (!story) {
        res.status(404);
        throw new Error('Story not found');
    }
    if (story.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized');
    }
    await story.deleteOne();
    res.json({ message: 'Story deleted', storyId: req.params.id });
});
