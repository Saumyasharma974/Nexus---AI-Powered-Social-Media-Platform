import express from 'express';
import { createStory, getStories, viewStory, deleteStory } from '../controllers/storyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createStory);
router.get('/', protect, getStories);
router.post('/:id/view', protect, viewStory);
router.delete('/:id', protect, deleteStory);

export default router;
