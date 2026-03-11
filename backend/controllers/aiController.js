import asyncHandler from 'express-async-handler';
import { generateCaptions, generateBio, generateUsernames, generateComments, generateHashtags } from '../services/aiService.js';

export const captionGenerator = asyncHandler(async (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ message: 'Description is required' });
    const captions = await generateCaptions(description);
    res.json({ captions });
});

export const bioGenerator = asyncHandler(async (req, res) => {
    const { name, city, interests, profession } = req.body;
    const bios = await generateBio({ name, city, interests, profession });
    res.json({ bios });
});

export const usernameGenerator = asyncHandler(async (req, res) => {
    const { name, interests, location } = req.body;
    const usernames = await generateUsernames({ name, interests, location });
    res.json({ usernames });
});

export const commentGenerator = asyncHandler(async (req, res) => {
    const { caption } = req.body;
    if (!caption) return res.status(400).json({ message: 'Caption is required' });
    const comments = await generateComments(caption);
    res.json({ comments });
});

export const hashtagGenerator = asyncHandler(async (req, res) => {
    const { caption } = req.body;
    if (!caption) return res.status(400).json({ message: 'Caption is required' });
    const hashtags = await generateHashtags(caption);
    res.json({ hashtags });
});
