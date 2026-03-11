import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import api from '../services/api';
import CaptionGenerator from '../components/CaptionGenerator';
import HashtagGenerator from '../components/HashtagGenerator';
import { motion } from 'framer-motion';

const CreatePost = () => {
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        // Basic mock handling for image preview since we don't have multer/S3 implemented fully. 
        // In a real app we would upload the file to S3/Cloudinary and get a URL back.
        // We'll use a placeholder or read file as completely base64 (not recommended for production).

        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCreatePrompt = async (e) => {
        e.preventDefault();
        if (!image) {
            setError('Please select an image');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await api.post('/posts/create', {
                image, // This is base64 for now, should ideally be a URL
                caption,
                hashtags,
            });
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Failed to create post');
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
                <h2 className="text-2xl font-bold mb-6">Create New Post</h2>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleCreatePrompt} className="space-y-6">
                    {/* Image Upload Area */}
                    <div className="relative group">
                        {image ? (
                            <div className="relative w-full aspect-video md:aspect-[4/3] rounded-lg overflow-hidden bg-black/50 border border-white/10 flex justify-center">
                                <img src={image} alt="Preview" className="h-full object-contain" />
                                <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                                    <ImageIcon size={32} className="mb-2" />
                                    <span>Change Image</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                </label>
                            </div>
                        ) : (
                            <label className="w-full aspect-video md:aspect-[4/3] rounded-lg border-2 border-dashed border-white/20 hover:border-accent flex flex-col items-center justify-center cursor-pointer transition-colors bg-bgSecondary/30">
                                <ImageIcon size={48} className="text-textSecondary mb-4 group-hover:text-accent transition-colors" />
                                <span className="text-textSecondary group-hover:text-accent transition-colors">Click to upload an image</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                            </label>
                        )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            {/* Image Description (For AI) */}
                            <div>
                                <label className="block font-medium mb-2 text-sm text-textSecondary">
                                    Describe your image (For AI Assistant)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g. A beautiful sunset over the mountains with orange sky"
                                    className="w-full bg-bgSecondary border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-accent transition-colors resize-none h-24"
                                />
                            </div>

                            {/* Final Caption */}
                            <div>
                                <label className="block font-medium mb-2 text-sm text-white">
                                    Post Caption
                                </label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    placeholder="What's on your mind?"
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
                            <CaptionGenerator imageDescription={description} onSelect={setCaption} />
                            <HashtagGenerator caption={caption} onAddHashtags={handleAddHashtags} />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end pt-4 border-t border-white/10">
                        <button
                            type="submit"
                            disabled={loading || !image}
                            className="bg-accent hover:bg-indigo-400 text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading && <Loader2 size={18} className="animate-spin" />}
                            Publish Post
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default CreatePost;
