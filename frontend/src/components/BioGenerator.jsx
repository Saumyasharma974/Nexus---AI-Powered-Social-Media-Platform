import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, User, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const BioGenerator = ({ currentData, onSelect }) => {
    const [bios, setBios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: currentData?.name || '',
        city: currentData?.location || '',
        interests: currentData?.interests?.join(', ') || '',
        profession: currentData?.profession || ''
    });

    const generateBios = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/ai/bio', formData);
            setBios(data.bios);
        } catch (err) {
            console.error(err);
            setError('Failed to generate bios.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (bio) => {
        onSelect(bio);
        setShowModal(false);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="bg-accent/20 text-accent hover:bg-accent hover:text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
            >
                <Sparkles size={16} /> Generate AI Bio
            </button>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass max-w-lg w-full rounded-2xl p-6 border border-white/10 shadow-2xl relative max-h-[90vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setShowModal(false)}
                                className="absolute top-4 right-4 text-textSecondary hover:text-white"
                            >
                                &times;
                            </button>

                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent">
                                <Sparkles size={24} /> AI Bio Generator
                            </h2>

                            <form onSubmit={generateBios} className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-bgSecondary border border-white/10 rounded-lg p-2 text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">City/Location</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-bgSecondary border border-white/10 rounded-lg p-2 text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">Profession</label>
                                    <input type="text" name="profession" value={formData.profession} onChange={handleChange} className="w-full bg-bgSecondary border border-white/10 rounded-lg p-2 text-white" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">Interests (comma separated)</label>
                                    <input type="text" name="interests" value={formData.interests} onChange={handleChange} className="w-full bg-bgSecondary border border-white/10 rounded-lg p-2 text-white" required />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-accent hover:bg-indigo-400 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin" /> : 'Generate Magic Bio'}
                                    </button>
                                </div>
                            </form>

                            {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

                            {bios.length > 0 && (
                                <div className="space-y-3 mt-6 border-t border-white/10 pt-4">
                                    <p className="text-sm text-textSecondary font-medium">Click to select a bio:</p>
                                    {bios.map((bio, idx) => (
                                        <motion.div
                                            key={idx}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelect(bio)}
                                            className="p-3 bg-bgSecondary border border-white/10 hover:border-accent rounded-lg cursor-pointer transition-colors"
                                        >
                                            <p className="text-sm">{bio}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default BioGenerator;
