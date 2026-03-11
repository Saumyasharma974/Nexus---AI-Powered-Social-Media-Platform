import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createReel, getReels, likeReel, addReelComment } from '../controllers/reelController.js';

const router = express.Router();

router.route('/').get(protect, getReels).post(protect, createReel);
router.route('/:id/like').put(protect, likeReel);
router.route('/:id/comments').post(protect, addReelComment);

export default router;
