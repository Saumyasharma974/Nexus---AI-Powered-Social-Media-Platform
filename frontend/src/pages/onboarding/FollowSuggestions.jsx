import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UserPlus, Check, Loader2, Sparkles } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

const FollowSuggestions = ({ formData }) => {
    const { updateUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [followed, setFollowed] = useState(new Set());
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                const { data } = await api.get('/users/suggestions');
                setSuggestions(data);
            } catch (err) {
                console.error('Failed to load suggestions', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    }, []);

    const handleFollow = async (userId) => {
        try {
            await api.post('/users/follow', { userIdToFollow: userId });
            setFollowed((prev) => new Set([...prev, userId]));
        } catch (err) {
            console.error('Failed to follow user', err);
        }
    };

    const handleComplete = async () => {
        setCompleting(true);
        try {
            const { data } = await api.put('/users/onboarding', {
                interests: formData.interests,
                bio: formData.bio,
                profileImage: formData.profileImage,
                ...(formData.newUsername && { username: formData.newUsername }),
            });
            // Update context so the app knows onboarding is done
            updateUser({ ...data, onboardingCompleted: true });
            navigate('/');
        } catch (err) {
            console.error('Failed to complete onboarding', err);
            setCompleting(false);
        }
    };

    return (
        <div className="py-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Follow People</h2>
                <p className="text-zinc-400">Start your feed by following some interesting people.</p>
            </motion.div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={36} className="animate-spin text-indigo-400" />
                </div>
            ) : suggestions.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                    <p>No suggestions available right now.</p>
                </div>
            ) : (
                <div className="space-y-3 mb-8">
                    {suggestions.map((sugUser, i) => (
                        <motion.div
                            key={sugUser._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                        >
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-500/20 shrink-0">
                                {sugUser.profileImage ? (
                                    <img src={sugUser.profileImage} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center font-bold text-lg text-indigo-300 uppercase">
                                        {sugUser.name?.charAt(0) || '?'}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 overflow-hidden">
                                <h4 className="font-semibold text-white truncate">{sugUser.name}</h4>
                                <p className="text-xs text-zinc-500 truncate">@{sugUser.username}</p>
                                {sugUser.bio && (
                                    <p className="text-xs text-zinc-400 mt-0.5 truncate">{sugUser.bio}</p>
                                )}
                            </div>

                            {/* Follow button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleFollow(sugUser._id)}
                                disabled={followed.has(sugUser._id)}
                                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${followed.has(sugUser._id)
                                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                                    : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                                    }`}
                            >
                                {followed.has(sugUser._id) ? (
                                    <><Check size={14} /> Following</>
                                ) : (
                                    <><UserPlus size={14} /> Follow</>
                                )}
                            </motion.button>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Complete button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleComplete}
                disabled={completing}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/30 disabled:opacity-70 transition-all"
            >
                {completing ? (
                    <><Loader2 size={20} className="animate-spin" /> Setting up your feed...</>
                ) : (
                    <><Sparkles size={20} /> Complete Setup & Go to Feed</>
                )}
            </motion.button>

            {!completing && (
                <button
                    onClick={handleComplete}
                    className="w-full text-center text-xs text-zinc-600 hover:text-zinc-400 mt-3 transition-colors"
                >
                    Skip and go to feed
                </button>
            )}
        </div>
    );
};

export default FollowSuggestions;
