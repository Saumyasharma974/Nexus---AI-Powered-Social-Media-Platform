import { useState, useEffect } from 'react';
import api from '../services/api';
import PostCard from '../components/PostCard';
import StoryRing from '../components/StoryRing';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Feed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Fetch posts initially and when page changes
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/posts/feed?page=${page}&limit=5`);
                if (data.length === 0) {
                    setHasMore(false);
                } else {
                    setPosts((prev) => (page === 1 ? data : [...prev, ...data]));
                }
            } catch (err) {
                console.error('Error fetching feed', err);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, [page]);

    const loadMore = () => {
        if (!loading && hasMore) setPage(page + 1);
    };

    const handleDeletePost = (postId) => {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
    };

    const handleUpdatePost = (updatedPost) => {
        setPosts((prev) => prev.map((p) => p._id === updatedPost._id ? updatedPost : p));
    };

    return (
        <div className="max-w-2xl mx-auto pt-8 pb-28 px-4">
            {/* Stories Row */}
            <StoryRing />

            {/* Divider */}
            <div className="border-t border-white/5 mb-6" />

            {/* Posts */}
            {posts.length === 0 && !loading ? (
                <div className="text-center text-textSecondary mt-20">
                    <p className="text-xl mb-4">No posts yet!</p>
                    <p>Follow more users or create a post to see them here.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    <AnimatePresence>
                        {posts.map((post) => (
                            <PostCard
                                key={post._id}
                                post={post}
                                onDeletePost={handleDeletePost}
                                onUpdatePost={handleUpdatePost}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {loading && (
                <div className="flex justify-center mt-8 mb-8">
                    <Loader2 className="animate-spin text-accent" size={32} />
                </div>
            )}

            {!loading && hasMore && posts.length > 0 && (
                <div className="flex justify-center mt-8 mb-8">
                    <button
                        onClick={loadMore}
                        className="bg-bgSecondary hover:bg-bgCard text-white px-6 py-2 rounded-full transition-colors border border-white/10"
                    >
                        Load More
                    </button>
                </div>
            )}

            {!hasMore && posts.length > 0 && (
                <div className="text-center text-textSecondary mt-8 mb-8 text-sm">
                    You've caught up on all posts.
                </div>
            )}
        </div>
    );
};

export default Feed;
