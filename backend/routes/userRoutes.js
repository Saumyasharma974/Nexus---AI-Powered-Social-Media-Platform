import express from 'express';
import { getUserProfile, followUser, blockUser, unblockUser, searchUsers, getConnections, updateOnboarding, getSuggestedUsers, updateProfile, toggleSaveItem, getSavedItems, updatePassword, getBlockedUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/connections', protect, getConnections);
router.get('/search', protect, searchUsers);
router.get('/suggestions', protect, getSuggestedUsers);
router.get('/saved', protect, getSavedItems);
router.get('/blocked', protect, getBlockedUsers);
router.get('/profile/:id', protect, getUserProfile);
router.put('/onboarding', protect, updateOnboarding);
router.post('/follow', protect, followUser);
router.post('/block/:userId', protect, blockUser);
router.post('/unblock/:userId', protect, unblockUser);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, updatePassword);
router.put('/save/:itemId', protect, toggleSaveItem);

export default router;

