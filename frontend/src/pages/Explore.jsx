import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Heart, MessageCircle, Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Explore = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExplore = async () => {
            try {
                const { data } = await api.get('/posts/explore');
                setPosts(data);
            } catch (error) {
                console.error('Error fetching explore feed:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExplore();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20 pb-32">
                <Loader2 className="animate-spin text-accent" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pt-8 pb-32 px-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Compass className="text-accent" size={28} />
                Explore
            </h2>

            {posts.length === 0 ? (
                <div className="text-center text-textSecondary mt-20">
                    <Compass size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No new posts to discover right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-1 md:gap-4">
                    {posts.map((post, idx) => (
                        <motion.div
                            key={post._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="relative aspect-square group overflow-hidden bg-bgCard cursor-pointer"
                        >
                            {/* In a real app we might open a modal, but here we can link to the post creator's profile or single post view. We'll link to profile for now */}
                            <Link to={`/profile/${post.userId?._id}`}>
                                <img 
                                    src={post.image} 
                                    alt="Explore" 
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                                    <div className="flex items-center gap-1 font-semibold">
                                        <Heart size={18} className="fill-white" />
                                        <span>{post.likes?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1 font-semibold">
                                        <MessageCircle size={18} className="fill-white" />
                                        <span>{post.comments?.length || 0}</span>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Explore;
