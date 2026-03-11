import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import BioGenerator from '../components/BioGenerator';
import EditProfileModal from '../components/EditProfileModal';
import FollowListModal from '../components/FollowListModal';
import { Loader2, UserPlus, UserMinus, ShieldAlert, Grid, Bookmark, Settings as SettingsIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const Profile = () => {
    const { id } = useParams();
    const { user: currentUser } = useContext(AuthContext);
    const profileId = id || currentUser?._id;
    const isOwnProfile = currentUser?._id === profileId;

    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [savedItems, setSavedItems] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFollowing, setIsFollowing] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [followModalType, setFollowModalType] = useState(null); // 'followers' | 'following' | null

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                setLoading(true);
                setError('');

                const { data: userData } = await api.get(`/users/profile/${profileId}`);
                setProfileData(userData);
                setIsFollowing(userData.followers.some(f => f._id === currentUser._id));

                if (!isOwnProfile && currentUser?.blockedUsers?.includes(profileId)) {
                    setIsBlocked(true);
                }

                const { data: postsData } = await api.get(`/posts/feed?limit=50`);
                const filteredPosts = postsData.filter(p => p.userId._id === profileId);
                setPosts(filteredPosts);

                if (isOwnProfile) {
                    const { data: savedData } = await api.get(`/users/saved`);
                    setSavedItems(savedData);
                }

            } catch (err) {
                console.error(err);
                if (err.response?.status === 403) {
                    setError("You cannot view this profile (Blocked).");
                } else {
                    setError('Failed to load profile');
                }
            } finally {
                setLoading(false);
            }
        };

        if (profileId) fetchProfileData();
    }, [profileId, currentUser]);

    const handleFollowToggle = async () => {
        try {
            await api.post('/users/follow', { userIdToFollow: profileId });
            setIsFollowing(!isFollowing);
            if (profileData) {
                setProfileData({
                    ...profileData,
                    followers: isFollowing
                        ? profileData.followers.filter(f => f._id !== currentUser._id)
                        : [...profileData.followers, { _id: currentUser._id }],
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleListFollowToggle = (toggledUserId) => {
        // This is called when the user follows/unfollows someone from *inside* the modal
        // We only need to update the counts if they are looking at their OWN profile,
        // or if they just toggled the person whose profile they are viewing.
        if (isOwnProfile) {
            setProfileData(prev => {
                if (!prev) return prev;
                const isCurrentlyFollowing = prev.following.some(f => f._id === toggledUserId);
                
                return {
                    ...prev,
                    following: isCurrentlyFollowing 
                        ? prev.following.filter(f => f._id !== toggledUserId)
                        : [...prev.following, { _id: toggledUserId }] // Rough mock for count accuracy
                };
            });
        } else if (toggledUserId === profileId) {
            // If they toggled the person whose profile they are viewing
            setIsFollowing(prev => !prev);
            setProfileData(prev => {
                if (!prev) return prev;
                const isCurrentlyFollowingUser = prev.followers.some(f => f._id === currentUser._id);
                return {
                    ...prev,
                    followers: isCurrentlyFollowingUser
                        ? prev.followers.filter(f => f._id !== currentUser._id)
                        : [...prev.followers, { _id: currentUser._id }]
                };
            });
        }
    };

    const handleBlockToggle = async () => {
        try {
            if (isBlocked) {
                await api.post(`/users/unblock/${profileId}`);
                setIsBlocked(false);
            } else {
                await api.post(`/users/block/${profileId}`);
                setIsBlocked(true);
                setIsFollowing(false);
            }
        } catch (err) {
            console.error("Failed to block/unblock", err);
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin text-accent" size={40} /></div>;
    if (error) return <div className="text-center mt-20 text-red-400 text-xl font-bold">{error}</div>;
    if (!profileData) return <div className="text-center mt-20">Profile not found</div>;

    return (
        <>
            <div className="max-w-4xl mx-auto pt-8 pb-28 px-4">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-8 border border-white/10 mb-10"
                >
                    <div className="shrink-0 relative">
                        {profileData.profileImage ? (
                            <img src={profileData.profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-bgSecondary" />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center text-4xl text-white font-bold p-[4px]">
                                <div className="bg-bgMain w-full h-full rounded-full flex items-center justify-center">
                                    {profileData.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                            <h1 className="text-3xl font-bold">{profileData.username}</h1>

                            {!isOwnProfile && (
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={handleFollowToggle}
                                        disabled={isBlocked}
                                        className={`px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${isFollowing
                                                ? 'bg-bgSecondary text-white hover:bg-bgCard'
                                                : 'bg-accent text-white hover:bg-indigo-400 disabled:opacity-50'
                                            }`}
                                    >
                                        {isFollowing ? <><UserMinus size={18} /> Unfollow</> : <><UserPlus size={18} /> Follow</>}
                                    </button>
                                    <button
                                        onClick={handleBlockToggle}
                                        className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${isBlocked ? 'bg-red-500 hover:bg-red-600' : 'bg-bgSecondary hover:bg-bgCard text-red-400'
                                            }`}
                                        title={isBlocked ? "Unblock user" : "Block user"}
                                    >
                                        {isBlocked ? "Unblock" : <ShieldAlert size={18} />}
                                    </button>
                                </div>
                            )}

                            {isOwnProfile && (
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="px-6 py-2 bg-bgSecondary hover:bg-bgCard rounded-lg font-semibold transition-colors border border-white/10"
                                    >
                                        Edit Profile
                                    </button>
                                    <Link
                                        to="/settings"
                                        className="p-2 bg-bgSecondary hover:bg-bgCard rounded-lg font-semibold transition-colors border border-white/10 flex items-center justify-center"
                                        title="Settings"
                                    >
                                        <SettingsIcon size={20} />
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center md:justify-start gap-6 mb-4 text-sm md:text-base">
                            <div><span className="font-bold">{posts.length}</span> posts</div>
                            <div 
                                onClick={() => profileData.followers.length > 0 && setFollowModalType('followers')}
                                className={`hover:underline text-accent ${profileData.followers.length > 0 ? 'cursor-pointer' : ''}`}
                            >
                                <span className="font-bold text-white">{profileData.followers.length}</span> followers
                            </div>
                            <div 
                                onClick={() => profileData.following.length > 0 && setFollowModalType('following')}
                                className={`hover:underline text-accent ${profileData.following.length > 0 ? 'cursor-pointer' : ''}`}
                            >
                                <span className="font-bold text-white">{profileData.following.length}</span> following
                            </div>
                        </div>

                        <div className="mt-4">
                            <h2 className="font-semibold text-lg">{profileData.name}</h2>
                            {profileData.profession && (
                                <p className="text-sm text-textSecondary uppercase tracking-wide mb-1 opacity-80">{profileData.profession}</p>
                            )}
                            <p className="whitespace-pre-line text-sm mt-2">{profileData.bio}</p>
                        </div>

                        {isOwnProfile && (
                            <div className="mt-6 border-t border-white/10 pt-4">
                                <BioGenerator
                                    currentData={profileData}
                                    onSelect={(newBio) => setProfileData({ ...profileData, bio: newBio })}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Tabs */}
                {isOwnProfile && !isBlocked && (
                    <div className="flex justify-center border-t border-white/10 mt-6 pt-4 gap-8">
                        <button 
                            onClick={() => setActiveTab('posts')}
                            className={`flex justify-center gap-2 items-center font-semibold text-sm transition-colors uppercase tracking-widest ${activeTab === 'posts' ? 'text-white border-t border-white -mt-4 pt-4' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Grid size={16} /> Posts
                        </button>
                        <button 
                            onClick={() => setActiveTab('saved')}
                            className={`flex justify-center gap-2 items-center font-semibold text-sm transition-colors uppercase tracking-widest ${activeTab === 'saved' ? 'text-white border-t border-white -mt-4 pt-4' : 'text-zinc-500 hover:text-white'}`}
                        >
                            <Bookmark size={16} /> Saved
                        </button>
                    </div>
                )}

                {/* Posts Grid */}
                {isBlocked ? (
                    <div className="text-center py-20 text-textSecondary bg-bgSecondary/20 rounded-xl border border-white/5 mt-8">
                        <ShieldAlert size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-xl font-semibold">User Blocked</p>
                        <p className="mt-2">Unblock to see their posts.</p>
                    </div>
                ) : (
                    <div className="pt-8 mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeTab === 'posts' && (
                            posts.length === 0 ? (
                                <div className="col-span-full text-center text-textSecondary py-10">
                                    No posts to show.
                                </div>
                            ) : (
                                posts.map(post => (
                                    <motion.div
                                        key={post._id}
                                        whileHover={{ scale: 1.02 }}
                                        className="aspect-square bg-bgSecondary rounded-lg overflow-hidden group relative cursor-pointer"
                                    >
                                        <img src={post.image} alt="post" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                                            <div className="flex items-center gap-2 font-bold"><span className="text-white">♥</span> {post.likes?.length}</div>
                                            <div className="flex items-center gap-2 font-bold"><span className="text-white">💬</span> {post.comments?.length}</div>
                                        </div>
                                    </motion.div>
                                ))
                            )
                        )}

                        {activeTab === 'saved' && (
                            savedItems.length === 0 ? (
                                <div className="col-span-full text-center text-textSecondary py-10">
                                    No saved items.
                                </div>
                            ) : (
                                savedItems.map(saved => (
                                    <motion.div
                                        key={saved._id}
                                        whileHover={{ scale: 1.02 }}
                                        className="aspect-square bg-bgSecondary rounded-lg overflow-hidden group relative cursor-pointer"
                                    >
                                        {saved.itemModel === 'Post' ? (
                                            <img src={saved.item.image} alt="saved post" className="w-full h-full object-cover" />
                                        ) : (
                                            <video src={saved.item.videoUrl} className="w-full h-full object-cover" muted />
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full z-10">
                                            <Bookmark size={14} className="fill-white text-white" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                                            <div className="flex items-center gap-2 font-bold"><span className="text-white">♥</span> {saved.item.likes?.length || 0}</div>
                                            <div className="flex items-center gap-2 font-bold"><span className="text-white">💬</span> {saved.item.comments?.length || 0}</div>
                                        </div>
                                    </motion.div>
                                ))
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <EditProfileModal
                        profileData={profileData}
                        onClose={() => setShowEditModal(false)}
                        onSaved={(updatedData) => {
                            setProfileData((prev) => ({ ...prev, ...updatedData }));
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Followers / Following Modal */}
            <AnimatePresence>
                {followModalType && (
                    <FollowListModal
                        title={followModalType === 'followers' ? 'Followers' : 'Following'}
                        usersList={followModalType === 'followers' ? profileData.followers : profileData.following}
                        onClose={() => setFollowModalType(null)}
                        onFollowToggle={handleListFollowToggle}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Profile;
