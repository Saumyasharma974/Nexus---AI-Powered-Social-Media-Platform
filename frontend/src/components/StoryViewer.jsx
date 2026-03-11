import { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const STORY_DURATION = 5000; // 5 seconds per story

const StoryViewer = ({ groups, startGroupIndex = 0, onClose, onDelete }) => {
    const { user } = useContext(AuthContext);
    const [groupIndex, setGroupIndex] = useState(startGroupIndex);
    const [storyIndex, setStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [paused, setPaused] = useState(false);

    const timerRef = useRef(null);
    const progressRef = useRef(null);

    const currentGroup = groups[groupIndex];
    const currentStory = currentGroup?.stories[storyIndex];
    const isOwn = currentStory?.userId._id === user?._id || currentGroup?.user._id === user?._id;

    // Mark as viewed
    useEffect(() => {
        if (currentStory) {
            api.post(`/stories/${currentStory._id}/view`).catch(() => { });
        }
    }, [currentStory?._id]);

    // Auto-advance timer
    useEffect(() => {
        if (paused) return;
        setProgress(0);
        const start = Date.now();

        progressRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            setProgress(Math.min((elapsed / STORY_DURATION) * 100, 100));
        }, 50);

        timerRef.current = setTimeout(() => goNext(), STORY_DURATION);

        return () => {
            clearInterval(progressRef.current);
            clearTimeout(timerRef.current);
        };
    }, [storyIndex, groupIndex, paused]);

    const goNext = () => {
        if (storyIndex < currentGroup.stories.length - 1) {
            setStoryIndex((i) => i + 1);
        } else if (groupIndex < groups.length - 1) {
            setGroupIndex((g) => g + 1);
            setStoryIndex(0);
        } else {
            onClose();
        }
    };

    const goPrev = () => {
        if (storyIndex > 0) {
            setStoryIndex((i) => i - 1);
        } else if (groupIndex > 0) {
            setGroupIndex((g) => g - 1);
            setStoryIndex(0);
        }
    };

    const handleDelete = async () => {
        try {
            await api.delete(`/stories/${currentStory._id}`);
            if (onDelete) onDelete(currentStory._id);
            // Move to next or close
            goNext();
        } catch (err) {
            console.error(err);
        }
    };

    if (!currentStory) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            >
                {/* Story card */}
                <div className="relative w-full max-w-sm h-full max-h-[calc(100dvh-64px)] md:max-h-[90vh] md:rounded-3xl overflow-hidden">
                    {/* ── Background / Content ── */}
                    {currentStory.type === 'text' ? (
                        <div
                            className="w-full h-full flex items-center justify-center p-8 text-center font-bold text-3xl leading-tight"
                            style={{ background: currentStory.bg, color: currentStory.textColor || '#fff' }}
                        >
                            {currentStory.text}
                        </div>
                    ) : currentStory.type === 'video' ? (
                        <video
                            src={currentStory.media}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            playsInline
                            onPlay={() => setPaused(false)}
                            onPause={() => setPaused(true)}
                        />
                    ) : (
                        <img src={currentStory.media} alt="story" className="w-full h-full object-cover" />
                    )}

                    {/* Text overlay on image/video */}
                    {currentStory.text && currentStory.type !== 'text' && (
                        <div
                            className="absolute bottom-28 left-0 right-0 px-6 text-center font-bold text-2xl leading-snug"
                            style={{ color: currentStory.textColor || '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}
                        >
                            {currentStory.text}
                        </div>
                    )}

                    {/* Dark overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />

                    {/* ── Progress bars ── */}
                    <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
                        {currentGroup.stories.map((_, i) => (
                            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white rounded-full"
                                    style={{
                                        width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── Header ── */}
                    <div className="absolute top-7 left-3 right-3 flex items-center gap-2 z-10">
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/50">
                            {currentGroup.user.profileImage ? (
                                <img src={currentGroup.user.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm uppercase">
                                    {currentGroup.user.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-white text-sm font-semibold">{currentGroup.user.username}</p>
                            <p className="text-white/60 text-xs">
                                {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {/* Viewer count (own story only) */}
                        {isOwn && (
                            <div className="flex items-center gap-1 text-white/70 text-xs">
                                <Eye size={14} />
                                <span>{currentStory.viewers?.length || 0}</span>
                            </div>
                        )}
                        {/* Delete (own story only) */}
                        {isOwn && (
                            <button onClick={handleDelete} className="text-red-400 hover:text-red-300 p-1">
                                <Trash2 size={18} />
                            </button>
                        )}

                        {/* Close */}
                        <button onClick={onClose} className="text-white/70 hover:text-white p-1">
                            <X size={22} />
                        </button>
                    </div>

                    {/* ── Click zones for prev/next ── */}
                    <div className="absolute inset-0 flex z-20 pointer-events-none">
                        <div
                            className="w-1/3 h-full pointer-events-auto cursor-pointer"
                            onClick={goPrev}
                        />
                        <div className="w-1/3 h-full" />
                        <div
                            className="w-1/3 h-full pointer-events-auto cursor-pointer"
                            onClick={goNext}
                        />
                    </div>
                </div>

                {/* External prev/next arrows (desktop) */}
                {groupIndex > 0 && (
                    <button
                        onClick={() => { setGroupIndex((g) => g - 1); setStoryIndex(0); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors hidden md:flex"
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}
                {groupIndex < groups.length - 1 && (
                    <button
                        onClick={() => { setGroupIndex((g) => g + 1); setStoryIndex(0); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors hidden md:flex"
                    >
                        <ChevronRight size={24} />
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default StoryViewer;
