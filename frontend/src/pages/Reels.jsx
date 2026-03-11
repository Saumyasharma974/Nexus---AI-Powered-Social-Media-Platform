import { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music, Loader2, Camera, Sparkles, Bookmark } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const ReelVideo = ({ reel, isActive, onLike }) => {
    const videoRef = useRef(null);
    const { user } = useContext(AuthContext);
    const [isLiked, setIsLiked] = useState(reel.likes.includes(user?._id));
    const [likeCount, setLikeCount] = useState(reel.likes.length);
    const [isSaved, setIsSaved] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [comments, setComments] = useState(reel.comments);
    const [generatingAiComment, setGeneratingAiComment] = useState(false);
    const [aiComments, setAiComments] = useState([]);

    useEffect(() => {
        if (isActive) {
            videoRef.current?.play().catch(err => console.error("Autoplay prevented:", err));
        } else {
            videoRef.current?.pause();
        }
    }, [isActive]);

    useEffect(() => {
        setIsLiked(reel.likes.includes(user?._id));
        setLikeCount(reel.likes.length);
        setComments(reel.comments);
    }, [reel, user?._id]);

    const handleLike = async () => {
        try {
            setIsLiked(!isLiked);
            setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
            await api.put(`/reels/${reel._id}/like`);
        } catch (error) {
            console.error(error);
            setIsLiked(!isLiked);
            setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
        }
    };

    const handleSave = async () => {
        setIsSaved(!isSaved);
        try {
            await api.put(`/users/save/${reel._id}`, { itemModel: 'Reel' });
        } catch (err) {
            setIsSaved(!isSaved);
            console.error('Failed to save reel', err);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            const { data } = await api.post(`/reels/${reel._id}/comments`, { text: commentText });
            setComments(data);
            setCommentText('');
        } catch (error) {
            console.error(error);
        }
    };

    const generateAiComments = async () => {
        const textToAnalyze = reel.caption || reel.topic || 'A short vertical video';
        try {
            setGeneratingAiComment(true);
            const { data } = await api.post('/ai/comment', { caption: textToAnalyze });
            setAiComments(data.comments);
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingAiComment(false);
        }
    };

    const insertAiComment = async (text) => {
        try {
            const { data } = await api.post(`/reels/${reel._id}/comments`, { text });
            setComments(data);
            setAiComments([]);
        } catch (err) {
            console.error(err);
        }
    };

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
    };

    return (
        <div className="relative w-full h-full bg-black snap-start snap-always shrink-0 flex items-center justify-center">
            {/* Video Element */}
            <video
                ref={videoRef}
                src={reel.videoUrl}
                className="w-full h-full object-cover cursor-pointer"
                loop
                playsInline
                onClick={togglePlay}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-28 flex flex-col items-center gap-6">
                <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-full group-hover:bg-white/20 transition">
                        <Heart size={28} className={isLiked ? "fill-red-500 text-red-500" : "text-white"} />
                    </div>
                    <span className="text-white text-xs font-medium shadow-sm">{likeCount}</span>
                </button>

                <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 group">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-full group-hover:bg-white/20 transition">
                        <MessageCircle size={28} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-medium shadow-sm">{comments.length}</span>
                </button>

                <button onClick={handleSave} className="flex flex-col items-center gap-1 group">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-full group-hover:bg-white/20 transition">
                        <Bookmark size={28} className={isSaved ? "fill-white text-white" : "text-white"} />
                    </div>
                    <span className="text-white text-xs font-medium shadow-sm">Save</span>
                </button>

                <button className="flex flex-col items-center gap-1 group">
                    <div className="p-3 bg-white/10 backdrop-blur-md rounded-full group-hover:bg-white/20 transition">
                        <Share2 size={28} className="text-white" />
                    </div>
                    <span className="text-white text-xs font-medium shadow-sm">Share</span>
                </button>
            </div>

            {/* Bottom Left Specs */}
            <div className="absolute bottom-24 left-4 right-20 text-white">
                <Link to={`/profile/${reel.user._id}`} className="flex items-center gap-2 mb-3">
                    <img
                        src={reel.user.profileImage || "/default-avatar.png"}
                        className="w-10 h-10 rounded-full border border-white/50 object-cover"
                        alt={reel.user.username}
                        onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + reel.user.name; }}
                    />
                    <span className="font-bold text-[15px] drop-shadow-md">@{reel.user.username}</span>
                </Link>
                
                <p className="text-sm font-light drop-shadow-md mb-2">{reel.caption}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                    {reel.hashtags?.map(tag => (
                        <span key={tag} className="text-sm font-semibold text-white drop-shadow-md">{tag}</span>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-3 py-1.5 w-max">
                    <Music size={14} className="animate-spin-slow" />
                    <span className="text-xs marquee flex-1 shrink w-32 truncate">Origin Audio - @{reel.user.username}</span>
                </div>
            </div>

            {/* Comments Modal Overlay */}
            <AnimatePresence>
                {showComments && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 z-10" 
                            onClick={() => setShowComments(false)}
                        />
                        <motion.div 
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute bottom-0 left-0 right-0 h-[70%] bg-[#1a1a2e] rounded-t-3xl z-20 flex flex-col"
                        >
                            <div className="flex justify-center pt-3 pb-2">
                                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                            </div>
                            <h3 className="text-center font-bold text-lg mb-4">Comments</h3>
                            
                            {/* AI Magic Button inside Comments */}
                            <div className="px-4 mb-4">
                                <button
                                    onClick={generateAiComments}
                                    disabled={generatingAiComment}
                                    className="w-full flex items-center justify-center gap-2 bg-accent/20 text-accent py-2 rounded-xl text-sm font-semibold hover:bg-accent/30 transition shadow-inner disabled:opacity-50"
                                >
                                    {generatingAiComment ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    Generate AI Comment Suggestions
                                </button>
                                
                                <AnimatePresence>
                                    {aiComments.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 bg-white/5 p-3 rounded-lg border border-accent/20"
                                        >
                                            <div className="space-y-2 text-sm text-textSecondary">
                                                {aiComments.map((aiComment, i) => (
                                                    <button key={i} onClick={() => insertAiComment(aiComment)}
                                                        className="block w-full text-left p-2 rounded hover:bg-white/10 transition-colors text-white">
                                                        {aiComment}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
                                {comments.length === 0 ? (
                                    <p className="text-center text-textSecondary mt-4">No comments yet. Be the first!</p>
                                ) : (
                                    comments.map(c => (
                                        <div key={c._id} className="flex gap-3">
                                            <img src={c.user.profileImage || `https://ui-avatars.com/api/?name=${c.user.name}`} className="w-8 h-8 rounded-full" />
                                            <div>
                                                <span className="font-bold text-sm text-white">@{c.user.username}</span>
                                                <p className="text-sm text-zinc-300">{c.text}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleComment} className="p-4 border-t border-white/10 bg-[#161625] rounded-t-2xl flex gap-2">
                                <input 
                                    type="text" 
                                    value={commentText} 
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="flex-1 bg-white/5 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent"
                                />
                                <button type="submit" disabled={!commentText.trim()} className="text-accent font-bold px-3 disabled:opacity-50">Post</button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const Reels = () => {
    const [reels, setReels] = useState([]);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [activeReelIndex, setActiveReelIndex] = useState(0);
    const observerRef = useRef();

    const fetchReels = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/reels?pageNumber=${pageNumber}`);
            setReels(prev => [...prev, ...data.reels]);
            setHasMore(data.page < data.pages);
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch reels", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReels();
    }, [pageNumber]);

    return (
        <div className="fixed inset-0 bg-black z-30 pt-[60px] pb-[80px] md:bg-[#0f0f18] overflow-hidden flex justify-center">
            <div 
                className="w-full md:w-[400px] h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide flex flex-col items-center bg-black relative"
                onScroll={(e) => {
                    const scrollPosition = e.target.scrollTop;
                    const windowHeight = e.target.clientHeight;
                    const currentIndex = Math.round(scrollPosition / windowHeight);
                    if (currentIndex !== activeReelIndex) {
                        setActiveReelIndex(currentIndex);
                    }
                    
                    // Trigger infinite scroll near the bottom
                    if (e.target.scrollHeight - scrollPosition - windowHeight < 100 && hasMore && !loading) {
                        setPageNumber(prev => prev + 1);
                    }
                }}
            >
                {/* Top Right Create Button inside the reel container */}
                <Link to="/create-reel" className="absolute top-4 right-4 z-50 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all border border-white/10 shadow-lg">
                    <Camera size={20} />
                </Link>
                {reels.length === 0 && !loading && (
                    <div className="h-full flex items-center justify-center text-textSecondary">
                        No reels found
                    </div>
                )}
                
                {reels.map((reel, idx) => (
                    <ReelVideo 
                        key={reel._id + idx} 
                        reel={reel} 
                        isActive={idx === activeReelIndex}
                    />
                ))}

                {loading && (
                    <div className="h-full w-full flex items-center justify-center shrink-0 snap-center">
                        <Loader2 className="animate-spin text-accent" size={32} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reels;
