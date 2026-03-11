import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2, Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import UsernameGenerator from '../../components/UsernameGenerator';
import api from '../../services/api';

const INTERESTS = [
    { label: 'Technology', emoji: '💻' },
    { label: 'Artificial Intelligence', emoji: '🤖' },
    { label: 'Travel', emoji: '✈️' },
    { label: 'Photography', emoji: '📸' },
    { label: 'Fitness', emoji: '💪' },
    { label: 'Gaming', emoji: '🎮' },
    { label: 'Music', emoji: '🎵' },
    { label: 'Startups', emoji: '🚀' },
    { label: 'Food', emoji: '🍜' },
    { label: 'Art & Design', emoji: '🎨' },
    { label: 'Books', emoji: '📚' },
    { label: 'Finance', emoji: '💹' },
    { label: 'Crypto', emoji: '₿' },
    { label: 'Health', emoji: '🌿' },
    { label: 'Fashion', emoji: '👗' },
    { label: 'Sports', emoji: '⚽' },
];

const Interests = ({ formData, updateFormData, nextStep, prevStep }) => {
    const { user, updateUser } = useContext(AuthContext);
    const { interests } = formData;

    const [showUsernameGenerator, setShowUsernameGenerator] = useState(false);
    const [appliedUsername, setAppliedUsername] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);

    const toggle = (label) => {
        if (interests.includes(label)) {
            updateFormData({ interests: interests.filter((i) => i !== label) });
        } else {
            updateFormData({ interests: [...interests, label] });
        }
    };

    // When user clicks a username suggestion, save it to their profile
    const handleUsernameSelect = async (newUsername) => {
        try {
            setSavingUsername(true);
            // We'll pass this along with onboarding data.
            // For now, just show it as applied (will be saved at Step 5).
            setAppliedUsername(newUsername);
            updateFormData({ newUsername }); // carry it forward in formData
        } catch (err) {
            console.error('Error applying username', err);
        } finally {
            setSavingUsername(false);
        }
    };

    return (
        <div className="py-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">What interests you?</h2>
                <p className="text-zinc-400">Pick topics you care about. We'll personalize your feed and follow suggestions.</p>
            </motion.div>

            {interests.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-4 text-sm text-indigo-400">
                    <CheckCircle2 size={16} />
                    <span>{interests.length} selected</span>
                </motion.div>
            )}

            {/* Interest chips grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
                {INTERESTS.map((item, i) => {
                    const selected = interests.includes(item.label);
                    return (
                        <motion.button
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggle(item.label)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all duration-200 ${selected
                                    ? 'bg-indigo-500/20 border-indigo-500 text-white'
                                    : 'bg-white/5 border-white/10 text-zinc-300 hover:border-white/30'
                                }`}
                        >
                            <span className="text-2xl">{item.emoji}</span>
                            <span className="text-sm font-medium flex-1">{item.label}</span>
                            {selected && <CheckCircle2 size={16} className="text-indigo-400 shrink-0" />}
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Refine Username Section ── */}
            {interests.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 border border-indigo-500/20 bg-indigo-500/5 rounded-2xl overflow-hidden"
                >
                    <button
                        onClick={() => setShowUsernameGenerator((p) => !p)}
                        className="w-full flex items-center justify-between p-4 text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Wand2 size={18} className="text-indigo-400" />
                            <span className="font-medium text-white text-sm">
                                Refine your username with AI
                            </span>
                            <span className="text-xs text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded-full">
                                powered by your interests
                            </span>
                        </div>
                        {showUsernameGenerator
                            ? <ChevronUp size={16} className="text-zinc-400" />
                            : <ChevronDown size={16} className="text-zinc-400" />
                        }
                    </button>

                    <AnimatePresence>
                        {showUsernameGenerator && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-4 pb-4"
                            >
                                {appliedUsername && (
                                    <div className="mb-3 flex items-center gap-2 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                                        <CheckCircle2 size={14} />
                                        <span>Username <strong>@{appliedUsername}</strong> will be applied after onboarding</span>
                                    </div>
                                )}
                                <UsernameGenerator
                                    currentName={user?.name}
                                    prefillInterests={interests.join(', ')}
                                    onSelect={handleUsernameSelect}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
                <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={nextStep}
                    disabled={interests.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    Continue
                    <ArrowRight size={18} />
                </motion.button>
            </div>
        </div>
    );
};

export default Interests;
