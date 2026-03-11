# Nexus - AI-Powered Social Media Platform

Nexus is a full-stack, feature-rich social media application that integrates Artificial Intelligence to enhance the user experience. Built with the MERN stack (MongoDB, Express, React, Node.js) and powered by the Groq LLM API, Nexus allows users to connect, share content, and seamlessly generate AI-assisted bios, usernames, captions, and hashtags.

## ✨ Features

### 🤖 AI Capabilities (Powered by Groq LLM)
- **AI Bio Generator**: Instantly generate catchy profile bios based on a topic.
- **AI Username Generator**: Suggests unique and available usernames.
- **AI Caption Generator**: Automatically brainstorms engaging captions for your posts.
- **AI Hashtag Generator**: Analyzes your post/caption and suggests trending and relevant hashtags.
- **AI Reels Assistant**: Upload a video and provide a topic; the AI handles the caption and tags.

### 📱 Core Social Features
- **Advanced Authentication**: Secure JWT local login, Google OAuth integration, secure OTP-based password resets via NodeMailer, and in-app strong password generation.
- **User Profiles**: View and edit user profiles, see their posts, reels, stories, followers, and following count.
- **Stories**: Post 24-hour expiring updates (images, videos, or stylized text overlays) visible to your followers.
- **Posts**: Create, edit, and explore posts with image uploads and captions.
- **Interactions**: Like, comment, and save posts to your personal collection.
- **Social Graph**: Follow and unfollow other users. View detailed interactive modals for Followers/Following lists natively on profiles. Discover new connections via the Suggested Users list.
- **Reels**: A swipeable, TikTok-style short-form video feed.
- **Explore Page**: Discover new, trending, and random posts and reels from across the platform.
- **Saved Items**: Bookmark your favorite posts and reels into a dedicated, private "Saved" tab on your profile.

### 💬 Real-Time Features (Socket.io & WebRTC)
- **Direct Messaging**: Chat in real-time with your connections.
- **Voice & Video Calling**: Seamless peer-to-peer (P2P) in-app audio and video calls built using WebRTC and authenticated signaling via Socket.io. Includes camera toggles, microphone muting, and full-screen support.
- **Live Notifications**: Get instant in-app alerts when someone likes your post, comments, follows you, or sends you a direct message. Unread badges update automatically across the Navigation Bar.

### ⚙️ User Settings
- **Password Management**: Securely update your password.
- **Block Management**: Block abusive users to hide their content and prevent communication, and unblock them at any time from the settings page.

## 🛠️ Tech Stack

**Frontend:**
- React 18 (Vite)
- Tailwind CSS (Styling)
- Framer Motion (Animations)
- Lucide React (Icons)
- React Router DOM (Navigation)
- Socket.io-client (Real-time events)
- WebRTC (Voice/Video APIs)
- @react-oauth/google (Google Sign-In)
- Axios (API Client)

**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose (Database & ODM)
- Socket.io (WebSockets)
- JSON Web Tokens (JWT) (Authentication)
- Bcrypt.js (Password Hashing)
- Nodemailer (OTP Emails)
- Google Auth Library (OAuth Verification)
- Groq SDK (AI Integration)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local instance or MongoDB Atlas cluster)
- Groq API Key (For AI features)

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/nexus-social.git
cd nexus-social
\`\`\`

### 2. Backend Setup
Navigate to the backend folder and install dependencies:
\`\`\`bash
cd backend
npm install
\`\`\`

Create a `.env` file in the `/backend` directory and add the following:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL_ID=llama-3.3-70b-versatile
GOOGLE_CLIENT_ID=your_google_client_id
EMAIL_SERVICE=Gmail
EMAIL_USERNAME=your_email
EMAIL_PASSWORD=your_app_password
NODE_ENV=development
```

Start the backend server:
```bash
npm start
# or for development with nodemon:
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend folder, and install dependencies:
```bash
cd frontend
npm install
```

Create a `.env` file in the `/frontend` directory and add the following:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend development server:
```bash
npm run dev
```

### 4. Open the App
Visit \`http://localhost:5173\` in your browser to start using Nexus!

## 📂 Folder Structure

\`\`\`
nexus/
├── backend/
│   ├── config/        # Database & Environment configs
│   ├── controllers/   # Route logic (users, posts, reels, messages, etc.)
│   ├── middleware/    # Auth and error handling middlewares
│   ├── models/        # Mongoose Database Schemas
│   ├── routes/        # Express API Routes
│   ├── services/      # External integrations (e.g., aiService.js)
│   ├── socket.js      # Socket.io configuration and events
│   └── server.js      # Express Server Entry Point
│
└── frontend/
    ├── src/
    │   ├── components/  # Reusable UI components (Navbar, PostCard, AiGenerators)
    │   ├── context/     # React Contexts (AuthContext)
    │   ├── pages/       # Next.js style route pages (Feed, Profile, Reels, etc.)
    │   ├── services/    # Axios API service instances
    │   ├── App.jsx      # React Router config
    │   └── main.jsx     # React DOM render entry
    ├── index.html
    └── tailwind.config.js
\`\`\`

## 🎨 UI/UX Design
Nexus features a sleek, dark-mode-first "glassmorphism" aesthetic with vibrant purple and indigo gradients. Micro-interactions and smooth page transitions are powered by Framer Motion, providing a modern, premium feel standard in 2024 social applications.

---
*Built as a comprehensive AI-Powered Social platform experiment.*

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
