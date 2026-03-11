import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, Check, Copy } from 'lucide-react';
import api from '../services/api';

/**
 * UsernameGenerator
 * Props:
 *   currentName    — pre-fills the name field from the register form
 *   prefillInterests — (optional) comma-separated string from onboarding
 *   onSelect       — (optional) callback(username) when user clicks a suggestion
 */
const UsernameGenerator = ({ currentName, prefillInterests = '', onSelect }) => {
    const [usernames, setUsernames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copiedIdx, setCopiedIdx] = useState(null);
    const [name, setName] = useState(currentName || '');

    const generateUsernames = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/ai/username', {
                name,
                interests: prefillInterests,   // uses selected interests if provided
                location: '',                   // optional — not required at register
            });
            setUsernames(data.usernames);
            setCopiedIdx(null);
        } catch (err) {
            console.error(err);
            setError('Failed to generate usernames.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (username, idx) => {
        navigator.clipboard.writeText(username);
        setCopiedIdx(idx);
        if (onSelect) onSelect(username.replace('@', ''));
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    return (
        <div className="bg-bgCard border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-accent">
                <Sparkles size={20} /> AI Username Ideas
            </h3>

            <form onSubmit={generateUsernames} className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-textSecondary mb-1">Your Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-bgSecondary border border-white/10 rounded-lg p-2 text-white text-sm"
                        required
                    />
                </div>

                {prefillInterests && (
                    <p className="text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                        ✨ Will use your selected interests to generate better usernames
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || !name}
                    className="w-full bg-accent hover:bg-indigo-400 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <><Sparkles size={14} /> Generate Usernames</>}
                </button>
            </form>

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <AnimatePresence>
                {usernames.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="grid grid-cols-2 gap-2"
                    >
                        {usernames.map((username, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ scale: 1.02 }}
                                onClick={() => handleCopy(username, idx)}
                                className="p-2 bg-bgSecondary/50 border border-white/5 hover:border-accent/50 rounded-lg cursor-pointer transition-colors flex justify-between items-center group"
                            >
                                <span className="text-sm font-medium truncate pr-2">@{username.replace('@', '')}</span>
                                {copiedIdx === idx ? (
                                    <Check size={14} className="text-green-400 shrink-0" />
                                ) : (
                                    <Copy size={14} className="text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {onSelect && usernames.length > 0 && (
                <p className="text-xs text-zinc-600 mt-3 text-center">Click any username to apply it</p>
            )}
        </div>
    );
};

export default UsernameGenerator;
