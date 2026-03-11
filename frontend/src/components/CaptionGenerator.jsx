import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const CaptionGenerator = ({ imageDescription, onSelect }) => {
    const [captions, setCaptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedIdx, setSelectedIdx] = useState(null);

    const generateCaptions = async () => {
        if (!imageDescription) {
            setError('Please provide a brief description of your image first');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/ai/caption', { description: imageDescription });
            setCaptions(data.captions);
            setSelectedIdx(null);
        } catch (err) {
            console.error(err);
            setError('Failed to generate captions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (caption, idx) => {
        setSelectedIdx(idx);
        onSelect(caption);
    };

    return (
        <div className="mt-4 bg-bgSecondary/50 rounded-xl p-4 border border-white/5">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-accent flex items-center gap-2">
                    <Sparkles size={18} /> AI Caption Assistant
                </h3>
                <button
                    type="button"
                    onClick={generateCaptions}
                    disabled={loading || !imageDescription}
                    className="bg-accent/20 text-accent hover:bg-accent hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:hover:bg-accent/20 disabled:hover:text-accent flex items-center gap-2"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Generate New'}
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <AnimatePresence>
                {captions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-3"
                    >
                        <p className="text-xs text-textSecondary mb-2">Select a caption below to use it:</p>
                        {captions.map((caption, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => handleSelect(caption, idx)}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors relative pr-10 ${selectedIdx === idx
                                    ? 'bg-accent/20 border-accent'
                                    : 'bg-bgCard border-white/10 hover:border-accent/50'
                                    }`}
                            >
                                <p className="text-sm">{caption}</p>
                                {selectedIdx === idx && (
                                    <CheckCircle2 size={20} className="text-accent absolute right-3 top-1/2 -translate-y-1/2" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CaptionGenerator;
