import express from 'express';
import { captionGenerator, bioGenerator, usernameGenerator, commentGenerator, hashtagGenerator } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/caption', protect, captionGenerator);
router.post('/bio', protect, bioGenerator);
router.post('/username', protect, usernameGenerator);
router.post('/comment', protect, commentGenerator);
router.post('/hashtags', protect, hashtagGenerator);

export default router;
