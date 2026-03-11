import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Loader2 } from 'lucide-react';
import api from '../services/api';
import CaptionGenerator from '../components/CaptionGenerator';
import HashtagGenerator from '../components/HashtagGenerator';
import { motion } from 'framer-motion';

const CreateReel = () => {
    const [videoUrl, setVideoUrl] = useState('');
    const [topic, setTopic] = useState('');
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    const videoRef = useRef(null);

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                setError('Video size must be less than 50MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setVideoUrl(reader.result);
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreateReel = async (e) => {
        e.preventDefault();
        if (!videoUrl) {
            setError('Please select a video');
            return;
        }
        if (!topic) {
            setError('Please provide a short topic for the AI');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/reels', {
                videoUrl,
                topic,
                caption,
                hashtags,
            });
            navigate('/reels');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to publish reel');
        } finally {
            setLoading(false);
        }
    };

    const handleAddHashtags = (newTags) => {
        setHashtags([...hashtags, ...newTags.filter(t => !hashtags.includes(t))]);
    };

    const removeHashtag = (tagToRemove) => {
        setHashtags(hashtags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="max-w-3xl mx-auto pt-8 pb-28 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 shadow-xl border border-white/10"
            >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Video className="text-accent" />
                    Create New Reel
                </h2>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleCreateReel} className="space-y-6">
                    {/* Video Upload Area */}
                    <div className="relative group flex justify-center">
                        {videoUrl ? (
                            <div className="relative w-64 aspect-[9/16] rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex justify-center">
                                <video ref={videoRef} src={videoUrl} className="h-full w-full object-cover" controls playsInline />
                                <label className="absolute top-2 right-2 bg-black/70 p-2 rounded-full cursor-pointer hover:bg-black/90 transition">
                                    <Video size={16} className="text-white" />
                                    <input type="file" className="hidden" accept="video/mp4,video/x-m4v,video/*" onChange={handleVideoChange} />
                                </label>
                            </div>
                        ) : (
                            <label className="w-64 aspect-[9/16] rounded-2xl border-2 border-dashed border-white/20 hover:border-accent flex flex-col items-center justify-center cursor-pointer transition-colors bg-bgSecondary/30">
                                <Video size={48} className="text-textSecondary mb-4 group-hover:text-accent transition-colors" />
                                <span className="text-textSecondary group-hover:text-accent transition-colors text-center px-4">Click to upload a vertical video</span>
                                <input type="file" className="hidden" accept="video/mp4,video/x-m4v,video/*" onChange={handleVideoChange} />
                            </label>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {/* Video Topic (For AI) */}
                            <div>
                                <label className="block font-medium mb-2 text-sm text-textSecondary">
                                    Video Topic (For AI Assistant)
                                </label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g. Cooking a steak, Funny dog jump"
                                    className="w-full bg-bgSecondary border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent transition-colors"
                                />
                                <p className="text-xs text-textSecondary mt-1">Since the AI can't watch the video, tell it what it's about so it can write your caption!</p>
                            </div>

                            {/* Final Caption */}
                            <div>
                                <label className="block font-medium mb-2 text-sm text-white">
                                    Reel Caption
                                </label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="Write a caption or use AI..."
                                    className="w-full bg-bgSecondary border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent transition-colors resize-none h-32"
                                />
                            </div>

                            {/* Selected Hashtags */}
                            {hashtags.length > 0 && (
                                <div>
                                    <label className="block font-medium mb-2 text-sm text-white">Selected Hashtags</label>
                                    <div className="flex flex-wrap gap-2">
                                        {hashtags.map((tag, i) => (
                                            <span key={i} className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs flex items-center gap-1">
                                                {tag}
                                                <button type="button" onClick={() => removeHashtag(tag)} className="hover:text-white" title="Remove">&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* AI Magic Sidebar */}
                        <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/10 md:pl-6 pt-4 md:pt-0">
                            <h3 className="font-semibold text-lg border-b border-white/5 pb-2">AI Assistants</h3>
                            
                            {/* We re-use CaptionGenerator and HashtagGenerator but pass the topic instead of image description */}
                            <CaptionGenerator imageDescription={topic} onSelect={setCaption} />
                            <HashtagGenerator caption={caption} onAddHashtags={handleAddHashtags} />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-4 border-t border-white/10">
                        <button
                            type="submit"
                            disabled={loading || !videoUrl || !topic}
                            className="bg-accent hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Publish Reel
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreateReel;
