import { useState, useContext, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Sparkles, MoreVertical, Pencil, Trash2, X, Check, Loader2, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import CommentBox from './CommentBox';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const PostCard = ({ post, onUpdatePost, onDeletePost }) => {
    const { user } = useContext(AuthContext);
    const [showComments, setShowComments] = useState(false);
    const [isLiked, setIsLiked] = useState(post.likes.includes(user?._id));
    const [likesCount, setLikesCount] = useState(post.likes.length);
    const [isSaved, setIsSaved] = useState(false); // Defaulting to false unless populated
    const [localComments, setLocalComments] = useState(post.comments || []);
    const [generatingAiComment, setGeneratingAiComment] = useState(false);
    const [aiComments, setAiComments] = useState([]);

    // 3-dot menu
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Delete
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Edit
    const [isEditing, setIsEditing] = useState(false);
    const [editCaption, setEditCaption] = useState(post.caption || '');
    const [saving, setSaving] = useState(false);

    const isOwner = user?._id === post.userId._id || user?._id === post.userId;

    // Close menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLike = async () => {
        setIsLiked(!isLiked);
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
        try {
            await api.post('/posts/like', { postId: post._id });
        } catch (err) {
            setIsLiked(!isLiked);
            setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
        }
    };

    const handleSave = async () => {
        setIsSaved(!isSaved);
        try {
            await api.put(`/users/save/${post._id}`, { itemModel: 'Post' });
        } catch (err) {
            setIsSaved(!isSaved);
            console.error('Failed to save post', err);
        }
    };

    const handleCommentAdded = (newComment) => {
        setLocalComments([newComment, ...localComments]);
    };

    const generateAiComments = async () => {
        if (!post.caption) return;
        try {
            setGeneratingAiComment(true);
            const { data } = await api.post('/ai/comment', { caption: post.caption });
            setAiComments(data.comments);
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingAiComment(false);
        }
    };

    const insertAiComment = async (commentText) => {
        try {
            const { data } = await api.post('/posts/comment', { postId: post._id, text: commentText });
            handleCommentAdded(data);
            setAiComments([]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/posts/${post._id}`);
            if (onDeletePost) onDeletePost(post._id);
        } catch (err) {
            console.error('Failed to delete post', err);
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            const { data } = await api.put(`/posts/${post._id}`, { caption: editCaption });
            if (onUpdatePost) onUpdatePost(data);
            setIsEditing(false);
        } catch (err) {
            console.error('Failed to edit post', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass rounded-xl overflow-hidden shadow-lg border border-white/5 mb-8"
        >
            {/* Post Header */}
            <div className="p-4 flex items-center gap-3">
                <Link to={`/profile/${post.userId._id}`}>
                    {post.userId.profileImage ? (
                        <img src={post.userId.profileImage} alt="User" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-bgSecondary flex items-center justify-center text-textSecondary uppercase font-bold">
                            {post.userId.name?.charAt(0)}
                        </div>
                    )}
                </Link>
                <div className="flex-1">
                    <Link to={`/profile/${post.userId._id}`} className="font-semibold hover:underline">
                        {post.userId.username}
                    </Link>
                </div>

                {/* 3-dot menu — only for post owner */}
                {isOwner && (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu((p) => !p)}
                            className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                        >
                            <MoreVertical size={20} />
                        </button>

                        <AnimatePresence>
                            {showMenu && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: -6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -6 }}
                                    className="absolute right-0 top-9 w-36 bg-[#1c1c28] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                >
                                    <button
                                        onClick={() => { setIsEditing(true); setShowMenu(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
                                    >
                                        <Pencil size={14} /> Edit Caption
                                    </button>
                                    <button
                                        onClick={() => { setShowDeleteConfirm(true); setShowMenu(false); }}
                                        className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 size={14} /> Delete Post
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Post Image */}
            <div className="w-full bg-black/50 aspect-square md:aspect-auto md:max-h-[600px] flex items-center justify-center">
                <img src={post.image} alt="Post" className="w-full h-full object-contain" />
            </div>

            {/* Post Actions */}
            <div className="p-4 pb-2">
                <div className="flex items-center gap-4 mb-3">
                    <motion.button whileTap={{ scale: 0.8 }} onClick={handleLike}
                        className={`${isLiked ? 'text-red-500' : 'text-textPrimary hover:text-gray-300'} transition-colors`}
                    >
                        <Heart size={26} className={isLiked ? 'fill-current' : ''} />
                    </motion.button>
                    <button onClick={() => setShowComments(!showComments)} className="text-textPrimary hover:text-gray-300 transition-colors">
                        <MessageCircle size={26} />
                    </button>
                    <button className="text-textPrimary hover:text-gray-300 transition-colors">
                        <Share2 size={24} />
                    </button>
                    <button onClick={handleSave} className={`${isSaved ? 'text-accent' : 'text-textPrimary hover:text-gray-300'} transition-colors ml-2`}>
                        <Bookmark size={24} className={isSaved ? 'fill-current' : ''} />
                    </button>
                    <button
                        onClick={generateAiComments}
                        disabled={generatingAiComment || !post.caption}
                        title="Generate AI Comment"
                        className="ml-auto text-accent hover:text-indigo-400 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm font-medium bg-accent/10 px-3 py-1.5 rounded-full"
                    >
                        <Sparkles size={16} />
                        <span className="hidden sm:inline">AI Comment</span>
                    </button>
                </div>

                <p className="font-semibold text-sm mb-2">{likesCount} likes</p>

                {/* Caption — inline edit or display */}
                {isEditing ? (
                    <div className="mb-3">
                        <textarea
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            rows={3}
                            autoFocus
                            className="w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none mb-2 transition-colors"
                        />
                        <div className="flex gap-2">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                Save
                            </motion.button>
                            <button
                                onClick={() => { setIsEditing(false); setEditCaption(post.caption || ''); }}
                                className="flex items-center gap-1.5 px-4 py-1.5 text-zinc-400 hover:text-white border border-white/10 rounded-lg text-sm transition-colors"
                            >
                                <X size={14} /> Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="mb-2">
                        <span className="font-semibold mr-2">{post.userId.username}</span>
                        <span>{editCaption || post.caption}</span>
                    </div>
                )}

                {/* Hashtags */}
                {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {post.hashtags.map((tag, i) => (
                            <span key={i} className="text-accent text-xs cursor-pointer hover:underline">{tag}</span>
                        ))}
                    </div>
                )}

                {/* AI Comment Suggestions */}
                <AnimatePresence>
                    {aiComments.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-4 bg-accent/5 p-3 rounded-lg border border-accent/20"
                        >
                            <h4 className="text-xs font-semibold text-accent mb-2 flex items-center gap-1">
                                <Sparkles size={12} /> AI Suggestions (Click to post)
                            </h4>
                            <div className="space-y-2 text-sm text-textSecondary">
                                {aiComments.map((comment, i) => (
                                    <button key={i} onClick={() => insertAiComment(comment)}
                                        className="block w-full text-left p-2 rounded hover:bg-white/5 transition-colors">
                                        {comment}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Comments */}
                {localComments.length > 0 && (
                    <button onClick={() => setShowComments(!showComments)} className="text-textSecondary text-sm mb-2 hover:underline">
                        View all {localComments.length} comments
                    </button>
                )}

                {showComments && (
                    <div className="mt-2 space-y-2 mb-4">
                        {localComments.map((c, i) => (
                            <div key={c._id || i} className="text-sm border-l-2 border-white/5 pl-2 mb-2">
                                <span className="font-semibold mr-2">{c.userId?.username}</span>
                                <span className="text-gray-300">{c.text}</span>
                            </div>
                        ))}
                    </div>
                )}

                <CommentBox postId={post._id} onCommentAdded={handleCommentAdded} />
            </div>

            {/* ── Delete Confirmation Modal ── */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => !deleting && setShowDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#1c1c28] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <Trash2 size={22} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Delete Post?</h3>
                            <p className="text-zinc-400 text-sm mb-6">This will permanently delete the post and all its comments. This action cannot be undone.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-70 transition-colors"
                                >
                                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                    Delete
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default PostCard;
