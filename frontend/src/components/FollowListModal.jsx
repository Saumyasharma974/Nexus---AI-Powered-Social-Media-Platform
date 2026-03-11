import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const FollowListModal = ({ title, usersList, onClose, onFollowToggle }) => {
    const { user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();
    
    // Store localized following/unfollowing state for immediate UI feedback
    const [loadingIds, setLoadingIds] = useState({});
    const [isInitializing, setIsInitializing] = useState(true);
    
    // Create a local set of IDs that the current user is following
    const [followingSet, setFollowingSet] = useState(new Set());

    // Fetch the current user's following list to accurately display true/false
    useEffect(() => {
        const fetchMyFollowing = async () => {
            if (!currentUser?._id) return;
            try {
                const { data } = await api.get(`/users/profile/${currentUser._id}`);
                const myFollowingIds = data.following.map(f => typeof f === 'object' ? f._id.toString() : f.toString());
                setFollowingSet(new Set(myFollowingIds));
            } catch (error) {
                console.error("Failed to load follow status", error);
            } finally {
                setIsInitializing(false);
            }
        };
        fetchMyFollowing();
    }, [currentUser]);

    const handleFollowClick = async (e, userId) => {
        e.stopPropagation(); // Prevent navigating to profile
        try {
            setLoadingIds(prev => ({ ...prev, [userId]: true }));
            
            await api.post('/users/follow', { userIdToFollow: userId });
            
            // Toggle local state
            setFollowingSet(prev => {
                const newSet = new Set(prev);
                if (newSet.has(userId.toString())) {
                    newSet.delete(userId.toString());
                } else {
                    newSet.add(userId.toString());
                }
                return newSet;
            });
            
            // Notify parent if needed
            if (onFollowToggle) onFollowToggle(userId);
            
        } catch (error) {
            console.error('Failed to toggle follow status', error);
        } finally {
            setLoadingIds(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleUserClick = (userId) => {
        onClose();
        navigate(`/profile/${userId}`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-bgCard w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-bgSecondary/30">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button 
                        onClick={onClose}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="overflow-y-auto flex-1 p-2">
                    {usersList?.length === 0 ? (
                        <div className="text-center p-8 text-textSecondary text-sm">
                            No users found.
                        </div>
                    ) : (
                        usersList.map((u) => {
                            const isMe = currentUser?._id === u._id;
                            const isFollowing = followingSet.has(u._id?.toString());
                            const isLoading = loadingIds[u._id];

                            return (
                                <div 
                                    key={u._id}
                                    onClick={() => handleUserClick(u._id)}
                                    className="flex items-center justify-between p-3 hover:bg-bgSecondary/50 rounded-xl cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full overflow-hidden bg-bgSecondary shrink-0 border border-white/10">
                                            {u.profileImage ? (
                                                <img src={u.profileImage} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-accent uppercase">
                                                    {u.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="font-semibold text-sm truncate">{u.name}</p>
                                            <p className="text-xs text-textSecondary truncate">@{u.username}</p>
                                        </div>
                                    </div>

                                    {/* Follow Button */}
                                    {!isMe && (
                                        <button
                                            onClick={(e) => handleFollowClick(e, u._id)}
                                            disabled={isLoading || isInitializing}
                                            className={`min-w-[90px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                                                isFollowing 
                                                ? 'bg-bgSecondary hover:bg-white/10 text-white' 
                                                : 'bg-accent hover:bg-indigo-400 text-white'
                                            }`}
                                        >
                                            {isLoading || isInitializing ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : isFollowing ? (
                                                <>Following</>
                                            ) : (
                                                <>Follow</>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default FollowListModal;
