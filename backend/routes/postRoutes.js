import express from 'express';
import { createPost, getFeed, getExploreFeed, likePost, commentPost, deletePost, editPost } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/explore', protect, getExploreFeed);
router.post('/create', protect, createPost);
router.get('/feed', protect, getFeed);
router.post('/like', protect, likePost);
router.post('/comment', protect, commentPost);
router.delete('/:id', protect, deletePost);
router.put('/:id', protect, editPost);

export default router;

