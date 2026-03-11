import asyncHandler from 'express-async-handler';
import Post from '../models/Post.js';
import User from '../models/User.js';
import Comment from '../models/Comment.js';
import { createNotification } from './notificationController.js';
import { io, getReceiverSocketId } from '../socket.js';

/**
 * @desc    Create a new post
 * @route   POST /api/posts/create
 * @access  Private
 */
export const createPost = asyncHandler(async (req, res) => {
    const { image, caption, hashtags } = req.body;

    if (!image) {
        res.status(400);
        throw new Error('Image is required');
    }

    const post = await Post.create({
        userId: req.user._id,
        image,
        caption,
        hashtags,
    });

    res.status(201).json(post);
});

/**
 * @desc    Get paginated feed of posts from all users (except blocked)
 * @route   GET /api/posts/feed?page=1&limit=10
 * @access  Private
 */
export const getFeed = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id);
    const blockedIds = currentUser.blockedUsers;

    const posts = await Post.find({ userId: { $nin: blockedIds } })
        .populate('userId', 'name username profileImage')
        .populate({
            path: 'comments',
            populate: {
                path: 'userId',
                select: 'name username profileImage',
            },
            options: { sort: { createdAt: -1 }, limit: 3 },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json(posts);
});

/**
 * @desc    Get random/explore posts
 * @route   GET /api/posts/explore
 * @access  Private
 */
export const getExploreFeed = asyncHandler(async (req, res) => {
    const currentUser = await User.findById(req.user._id);
    const blockedIds = currentUser.blockedUsers || [];
    const followingIds = currentUser.following || [];

    // Combine blocked and following to exclude from explore
    const excludeIds = [...blockedIds, ...followingIds, req.user._id];

    // Fetch popular or random posts from users we don't follow
    const posts = await Post.find({ userId: { $nin: excludeIds } })
        .populate('userId', 'name username profileImage')
        .sort({ likes: -1, createdAt: -1 }) // simple popularity sort
        .limit(30);

    res.json(posts);
});

/**
 * @desc    Like or unlike a post
 * @route   POST /api/posts/like
 * @access  Private
 */
export const likePost = asyncHandler(async (req, res) => {
    const { postId } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
        post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString());
    } else {
        post.likes.push(req.user._id);

        // 🔔 Create notification for post owner (only when liking, not unliking)
        if (post.userId.toString() !== req.user._id.toString()) {
            const sender = await User.findById(req.user._id).select('name username');
            const notification = await createNotification({
                type: 'like',
                sender: req.user._id,
                receiver: post.userId,
                post: post._id,
                message: `${sender.name} liked your post`,
            });

            // Emit real-time notification via socket
            if (notification) {
                const receiverSocketId = getReceiverSocketId(post.userId.toString());
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('newNotification', notification);
                }
            }
        }
    }

    await post.save();
    res.json({ message: isLiked ? 'Post unliked' : 'Post liked', likes: post.likes.length });
});

/**
 * @desc    Add comment to a post
 * @route   POST /api/posts/comment
 * @access  Private
 */
export const commentPost = asyncHandler(async (req, res) => {
    const { postId, text } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const comment = await Comment.create({
        postId,
        userId: req.user._id,
        text,
    });

    post.comments.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate('userId', 'name username profileImage');

    // 🔔 Notify post owner about new comment
    if (post.userId.toString() !== req.user._id.toString()) {
        const sender = await User.findById(req.user._id).select('name username');
        const notification = await createNotification({
            type: 'comment',
            sender: req.user._id,
            receiver: post.userId,
            post: post._id,
            message: `${sender.name} commented on your post: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`,
        });

        if (notification) {
            const receiverSocketId = getReceiverSocketId(post.userId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('newNotification', notification);
            }
        }
    }

    res.status(201).json(populatedComment);
});

/**
 * @desc    Delete a post (only owner)
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
export const deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    if (post.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this post');
    }
    // Delete associated comments
    await Comment.deleteMany({ postId: post._id });
    await post.deleteOne();
    res.json({ message: 'Post deleted', postId: req.params.id });
});

/**
 * @desc    Edit post caption/hashtags (only owner)
 * @route   PUT /api/posts/:id
 * @access  Private
 */
export const editPost = asyncHandler(async (req, res) => {
    const { caption, hashtags } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }
    if (post.userId.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to edit this post');
    }
    if (caption !== undefined) post.caption = caption;
    if (hashtags !== undefined) post.hashtags = hashtags;
    await post.save();
    const updated = await Post.findById(post._id)
        .populate('userId', 'name username profileImage');
    res.json(updated);
});
