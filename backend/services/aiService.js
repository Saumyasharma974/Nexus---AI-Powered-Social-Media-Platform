import Groq from 'groq-sdk';

// Initialize Groq AI client
let groq;

const getGroqClient = () => {
    if (!groq) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not defined in environment variables");
        }
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groq;
};

const parseList = (text) => {
    return text
        .split('\n')
        .map((line) => line.replace(/^\d+[\.\)]\s*/, '').replace(/^\*\*|\*\*$/g, '').trim())
        .filter((line) => line.length > 3);
};

export const generateCaptions = async (description) => {
    const groqClient = getGroqClient();
    const prompt = `Generate exactly 5 engaging, creative Instagram captions for the following image description. 
Number each caption 1-5. Make them catchy, emotional, and include emojis.

Image description: ${description}`;

    const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile',
    });
    const text = chatCompletion.choices[0]?.message?.content || "";
    return parseList(text).slice(0, 5);
};

export const generateBio = async ({ name, city, interests, profession }) => {
    const groqClient = getGroqClient();
    const prompt = `Generate 3 different short professional social media bios based on:
Name: ${name}
City: ${city}
Interests: ${interests}
Profession: ${profession}

Each bio should be 1-2 sentences, engaging, and include relevant emojis. Number them 1-3.`;

    const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile',
    });
    const text = chatCompletion.choices[0]?.message?.content || "";
    return parseList(text).slice(0, 3);
};

export const generateUsernames = async ({ name, interests, location }) => {
    const groqClient = getGroqClient();
    const prompt = `Generate exactly 10 unique, creative, and modern social media usernames using:
Name: ${name}
Interests: ${interests}
Location: ${location}

Rules: lowercase, no spaces, can use underscores or numbers, max 20 chars each. Number them 1-10.`;

    const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile',
    });
    const text = chatCompletion.choices[0]?.message?.content || "";
    return parseList(text).slice(0, 10);
};

export const generateComments = async (caption) => {
    const groqClient = getGroqClient();
    const prompt = `Generate exactly 5 engaging, authentic, and positive social media comments for this post caption. 
Include emojis. Make them feel natural, not generic. Number them 1-5.

Caption: ${caption}`;

    const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile',
    });
    const text = chatCompletion.choices[0]?.message?.content || "";
    return parseList(text).slice(0, 5);
};

export const generateHashtags = async (caption) => {
    const groqClient = getGroqClient();
    const prompt = `Generate exactly 10 trending and relevant Instagram hashtags for this caption.
Return ONLY the hashtags starting with #, one per line, numbered 1-10.

Caption: ${caption}`;

    const chatCompletion = await groqClient.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: process.env.GROQ_MODEL_ID || 'llama-3.3-70b-versatile',
    });
    const text = chatCompletion.choices[0]?.message?.content || "";
    const lines = text.split('\n')
        .map((line) => {
            const match = line.match(/#\w+/);
            return match ? match[0] : null;
        })
        .filter(Boolean);
    return lines.slice(0, 10);
};
