import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Hash, Plus } from 'lucide-react';
import api from '../services/api';

const HashtagGenerator = ({ caption, onAddHashtags }) => {
    const [hashtags, setHashtags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generateHashtags = async () => {
        if (!caption) {
            setError('Requires a caption to generate relevant hashtags');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/ai/hashtags', { caption });
            setHashtags(data.hashtags);
        } catch (err) {
            console.error(err);
            setError('Failed to generate hashtags.');
        } finally {
            setLoading(false);
        }
    };

    const addAll = () => {
        onAddHashtags(hashtags);
    };

    const addTag = (tag) => {
        onAddHashtags([tag]);
        setHashtags(hashtags.filter(t => t !== tag));
    };

    return (
        <div className="mt-4 bg-bgSecondary/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-purple-400 flex items-center gap-2">
                    <Hash size={18} /> AI Hashtags
                </h3>
                <button
                    type="button"
                    onClick={generateHashtags}
                    disabled={loading || !caption}
                    className="bg-purple-500/20 text-purple-400 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Generate Tags'}
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <AnimatePresence>
                {hashtags.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-xs text-textSecondary">Click to add specific tags:</p>
                            <button
                                type="button"
                                onClick={addAll}
                                className="text-xs text-purple-400 hover:underline"
                            >
                                Add All
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {hashtags.map((tag, idx) => (
                                <motion.button
                                    key={idx}
                                    type="button"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => addTag(tag)}
                                    className="bg-bgCard border border-white/10 hover:border-purple-400 px-3 py-1 rounded-full text-sm flex items-center gap-1 transition-colors"
                                >
                                    {tag} <Plus size={12} className="text-textSecondary" />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default HashtagGenerator;
