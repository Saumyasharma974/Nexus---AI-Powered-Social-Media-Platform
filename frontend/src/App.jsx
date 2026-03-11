import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import CreatePost from './pages/CreatePost';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Reels from './pages/Reels';
import CreateReel from './pages/CreateReel';
import Explore from './pages/Explore';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';
import OnboardingLayout from './pages/onboarding/OnboardingLayout';
import ForgotPassword from './pages/ForgotPassword';

// Redirect new users to onboarding, existing users to feed
const ProtectedRoute = ({ children }) => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    if (!user.onboardingCompleted) return <Navigate to="/onboarding" replace />;
    return (
        <>
            <Navbar />
            {children}
        </>
    );
};

// Onboarding route: only accessible when logged in but not yet onboarded
const OnboardingRoute = () => {
    const { user } = useContext(AuthContext);
    if (!user) return <Navigate to="/login" replace />;
    if (user.onboardingCompleted) return <Navigate to="/" replace />;
    return <OnboardingLayout />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="min-h-screen">
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/onboarding" element={<OnboardingRoute />} />

                        {/* Protected Routes (require login + completed onboarding) */}
                        <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                        <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        <Route path="/reels" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
                        <Route path="/create-reel" element={<ProtectedRoute><CreateReel /></ProtectedRoute>} />
                        <Route path="/profile/:id?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                        <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
                        <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;
