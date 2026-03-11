import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Loader2, CheckCircle2, Edit3 } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

const BioGenerator = ({ formData, updateFormData, nextStep, prevStep }) => {
    const { user } = useContext(AuthContext);

    // Only need city and profession — interests come from Step 2!
    const [city, setCity] = useState(formData.city || '');
    const [profession, setProfession] = useState(formData.profession || '');
    const [bioOptions, setBioOptions] = useState([]);
    const [selectedBio, setSelectedBio] = useState(formData.bio || '');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedBio, setEditedBio] = useState('');

    const selectedInterests = formData.interests || [];

    const handleGenerate = async () => {
        if (!city || !profession) return;
        setIsGenerating(true);
        try {
            const { data } = await api.post('/ai/bio', {
                name: user?.name,
                city,
                profession,
                interests: selectedInterests.join(', '), // 🎯 auto-use from Step 2
            });
            setBioOptions(data.bios || data);
            setSelectedBio('');
        } catch (err) {
            console.error('Failed to generate bio', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSelectBio = (bio) => {
        setSelectedBio(bio);
        setIsEditing(false);
        setEditedBio(bio);
    };

    const handleContinue = () => {
        const finalBio = isEditing ? editedBio : selectedBio;
        updateFormData({ bio: finalBio, city, profession });
        nextStep();
    };

    return (
        <div className="py-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">AI Bio Generator ✨</h2>
                <p className="text-zinc-400">Just add your city and profession — we'll use your interests automatically.</p>
            </motion.div>

            {/* Show selected interests as read-only chips */}
            {selectedInterests.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2 font-medium">Using your interests from Step 2:</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedInterests.map((interest) => (
                            <span
                                key={interest}
                                className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs font-medium"
                            >
                                {interest}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Only city + profession needed */}
            <div className="space-y-4 mb-6">
                {[
                    { label: 'City', value: city, setter: setCity, placeholder: 'e.g. Mumbai, New York...' },
                    { label: 'Profession', value: profession, setter: setProfession, placeholder: 'e.g. Software Engineer, Designer...' },
                ].map((field) => (
                    <div key={field.label}>
                        <label className="block text-sm text-zinc-400 mb-1.5">{field.label}</label>
                        <input
                            type="text"
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                        />
                    </div>
                ))}
            </div>

            {/* Generate Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={!city || !profession || isGenerating}
                className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-xl bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
            >
                {isGenerating ? (
                    <><Loader2 size={18} className="animate-spin" /> Generating with AI...</>
                ) : (
                    <><Sparkles size={18} /> Generate Bio with AI</>
                )}
            </motion.button>

            {/* Bio options */}
            <AnimatePresence>
                {bioOptions.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 mb-6">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Choose a bio:</p>
                        {bioOptions.map((bio, i) => (
                            <motion.button
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => handleSelectBio(bio)}
                                className={`w-full text-left p-4 rounded-xl border transition-all text-sm ${selectedBio === bio
                                        ? 'bg-indigo-500/20 border-indigo-500 text-white'
                                        : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <span className="flex-1">{bio}</span>
                                    {selectedBio === bio && <CheckCircle2 size={16} className="text-indigo-400 shrink-0 mt-0.5" />}
                                </div>
                            </motion.button>
                        ))}

                        {selectedBio && (
                            <button
                                onClick={() => { setIsEditing(true); setEditedBio(selectedBio); }}
                                className="flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors ml-1"
                            >
                                <Edit3 size={12} /> Edit this bio
                            </button>
                        )}

                        {isEditing && (
                            <textarea
                                value={editedBio}
                                onChange={(e) => setEditedBio(e.target.value)}
                                maxLength={300}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                            />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex gap-3">
                <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all"
                >
                    <ArrowLeft size={18} /> Back
                </button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleContinue}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold transition-all"
                >
                    {selectedBio || (isEditing && editedBio) ? 'Continue' : 'Skip for now'}
                    <ArrowRight size={18} />
                </motion.button>
            </div>
        </div>
    );
};

export default BioGenerator;
