import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import StoryViewer from './StoryViewer';
import CreateStory from './CreateStory';

const StoryRing = () => {
    const { user } = useContext(AuthContext);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [startGroup, setStartGroup] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        try {
            const { data } = await api.get('/stories');
            setGroups(data);
        } catch (err) {
            console.error('Failed to fetch stories', err);
        } finally {
            setLoading(false);
        }
    };

    const openViewer = (index) => {
        setStartGroup(index);
        setViewerOpen(true);
    };

    const handleStoryCreated = (newStory) => {
        // Insert into own group or create one
        setGroups((prev) => {
            const ownIdx = prev.findIndex(g => g.user._id === user._id);
            if (ownIdx >= 0) {
                const updated = [...prev];
                updated[ownIdx] = { ...updated[ownIdx], stories: [newStory, ...updated[ownIdx].stories], hasUnseen: false };
                return updated;
            }
            return [{ user: { _id: user._id, name: user.name, username: user.username, profileImage: user.profileImage }, stories: [newStory], hasUnseen: false }, ...prev];
        });
    };

    const handleStoryDeleted = (storyId) => {
        setGroups((prev) =>
            prev
                .map(g => ({ ...g, stories: g.stories.filter(s => s._id !== storyId) }))
                .filter(g => g.stories.length > 0)
        );
    };

    const ownGroup = groups.find(g => g.user._id === user?._id);
    const others = groups.filter(g => g.user._id !== user?._id);
    const orderedGroups = ownGroup ? [ownGroup, ...others] : groups;
    const displayGroups = ownGroup ? orderedGroups : orderedGroups; // always show "add" first

    if (loading) return <div className="h-24" />;

    return (
        <>
            <div className="overflow-x-auto pb-2 mb-4 -mx-4 px-4">
                <div className="flex gap-3 w-max">
                    {/* Add Your Story button */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setCreateOpen(true)}
                            className="w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-2 border-dashed border-indigo-400/50 hover:border-indigo-400 transition-all relative"
                        >
                            {user?.profileImage ? (
                                <img src={user.profileImage} alt="" className="w-full h-full rounded-full object-cover opacity-60" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-lg uppercase">
                                    {user?.name?.charAt(0)}
                                </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-indigo-500 rounded-full border-2 border-[#0f0f18] flex items-center justify-center">
                                <Plus size={12} className="text-white" />
                            </div>
                        </button>
                        <span className="text-[10px] text-zinc-500 w-16 text-center truncate">Your story</span>
                    </div>

                    {/* Story rings */}
                    {orderedGroups.map((group, i) => {
                        const isOwnStory = group.user._id === user?._id;
                        const realIndex = orderedGroups.indexOf(group);
                        return (
                            <div key={group.user._id} className="flex flex-col items-center gap-1">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => openViewer(realIndex)}
                                    className={`w-16 h-16 rounded-full p-0.5 ${group.hasUnseen
                                            ? 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'
                                            : 'bg-zinc-700'
                                        }`}
                                >
                                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-[#0f0f18]">
                                        {group.user.profileImage ? (
                                            <img src={group.user.profileImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-500/30 flex items-center justify-center text-indigo-300 font-bold text-lg uppercase">
                                                {group.user.name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </motion.button>
                                <span className="text-[10px] text-zinc-500 w-16 text-center truncate">
                                    {isOwnStory ? 'You' : group.user.username}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Story Viewer */}
            <AnimatePresence>
                {viewerOpen && (
                    <StoryViewer
                        groups={orderedGroups}
                        startGroupIndex={startGroup}
                        onClose={() => setViewerOpen(false)}
                        onDelete={handleStoryDeleted}
                    />
                )}
            </AnimatePresence>

            {/* Create Story */}
            <AnimatePresence>
                {createOpen && (
                    <CreateStory
                        onClose={() => setCreateOpen(false)}
                        onCreated={handleStoryCreated}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default StoryRing;
