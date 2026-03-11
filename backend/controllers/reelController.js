import asyncHandler from 'express-async-handler';
import Reel from '../models/Reel.js';
import User from '../models/User.js';
import fs from 'fs';
import path from 'path';

// @desc    Create a new reel
// @route   POST /api/reels
// @access  Private
const createReel = asyncHandler(async (req, res) => {
    const { videoUrl, topic, caption, hashtags } = req.body;

    if (!videoUrl || !topic) {
        res.status(400);
        throw new Error('Please provide video and a topic');
    }

    let savedVideoPath = videoUrl;

    if (videoUrl && videoUrl.startsWith('data:video')) {
        const matches = videoUrl.match(/^data:video\/([a-zA-Z0-9+-]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
            let ext = matches[1];
            if (ext === 'x-m4v') ext = 'm4v';
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            const filename = `reel-${Date.now()}.${ext}`;
            const uploadDir = path.join(path.resolve(), 'uploads');
            
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            
            const filepath = path.join(uploadDir, filename);
            fs.writeFileSync(filepath, buffer);
            savedVideoPath = `http://localhost:5000/uploads/${filename}`; 
        }
    }

    const reel = await Reel.create({
        user: req.user._id,
        videoUrl: savedVideoPath,
        topic,
        caption: caption || '',
        hashtags: hashtags || []
    });

    const createdReel = await Reel.findById(reel._id).populate('user', 'name username profilePicture');

    res.status(201).json(createdReel);
});

// @desc    Get reels feed (paginated)
// @route   GET /api/reels
// @access  Private
const getReels = asyncHandler(async (req, res) => {
    const pageSize = 3; // Load 3 reels at a time
    const page = Number(req.query.pageNumber) || 1;

    // Optional: Filter out logic to not see a specific user's reels if blocked
    const currentUser = await User.findById(req.user._id);
    const blockedUserIds = currentUser.blockedUsers || [];

    const query = { user: { $nin: blockedUserIds } };

    const count = await Reel.countDocuments(query);
    
    // Sort by newest first
    const reels = await Reel.find(query)
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1))
        .populate('user', 'name username profilePicture')
        .populate('comments.user', 'name username profilePicture');

    res.json({ reels, page, pages: Math.ceil(count / pageSize) });
});

// @desc    Like or Unlike a reel
// @route   PUT /api/reels/:id/like
// @access  Private
const likeReel = asyncHandler(async (req, res) => {
    const reel = await Reel.findById(req.params.id);

    if (reel) {
        const isLiked = reel.likes.includes(req.user._id);

        if (isLiked) {
            // Unlike
            reel.likes = reel.likes.filter(
                (id) => id.toString() !== req.user._id.toString()
            );
        } else {
            // Like
            reel.likes.push(req.user._id);
        }

        await reel.save();
        res.json(reel.likes);
    } else {
        res.status(404);
        throw new Error('Reel not found');
    }
});

// @desc    Add comment to a reel
// @route   POST /api/reels/:id/comments
// @access  Private
const addReelComment = asyncHandler(async (req, res) => {
    const { text } = req.body;

    if (!text) {
        res.status(400);
        throw new Error('Comment text is required');
    }

    const reel = await Reel.findById(req.params.id);

    if (reel) {
        const comment = {
            user: req.user._id,
            text,
        };

        reel.comments.push(comment);
        await reel.save();

        const updatedReel = await Reel.findById(req.params.id)
            .populate('user', 'name username profilePicture')
            .populate('comments.user', 'name username profilePicture');

        res.status(201).json(updatedReel.comments);
    } else {
        res.status(404);
        throw new Error('Reel not found');
    }
});

export { createReel, getReels, likeReel, addReelComment };
