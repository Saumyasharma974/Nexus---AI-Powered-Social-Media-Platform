import { useState, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, Type, Video, Upload, Loader2, Check } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const BG_GRADIENTS = [
    { label: 'Indigo', value: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
    { label: 'Rose', value: 'linear-gradient(135deg,#f43f5e,#ec4899)' },
    { label: 'Amber', value: 'linear-gradient(135deg,#f59e0b,#f97316)' },
    { label: 'Teal', value: 'linear-gradient(135deg,#14b8a6,#06b6d4)' },
    { label: 'Green', value: 'linear-gradient(135deg,#22c55e,#10b981)' },
    { label: 'Slate', value: 'linear-gradient(135deg,#334155,#1e293b)' },
];

const TEXT_COLORS = ['#ffffff', '#000000', '#fbbf24', '#34d399', '#f87171', '#818cf8'];

const CreateStory = ({ onClose, onCreated }) => {
    const { user } = useContext(AuthContext);
    const [step, setStep] = useState('pick'); // 'pick' | 'compose'
    const [type, setType] = useState(null);   // 'image' | 'video' | 'text'

    // Media
    const [mediaPreview, setMediaPreview] = useState('');
    const [mediaBase64, setMediaBase64] = useState('');
    const fileRef = useRef();

    // Text overlay / Text-only
    const [text, setText] = useState('');
    const [textColor, setTextColor] = useState('#ffffff');
    const [bg, setBg] = useState(BG_GRADIENTS[0].value);

    const [saving, setSaving] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const handlePickType = (t) => {
        setType(t);
        setStep('compose');
        if (t === 'image' || t === 'video') {
            setTimeout(() => fileRef.current?.click(), 100);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setMediaBase64(reader.result);
            setMediaPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handlePost = async () => {
        setError('');
        if (type !== 'text' && !mediaBase64) {
            setError('Please select a file first');
            return;
        }
        setSaving(true);
        try {
            const { data } = await api.post('/stories/create', {
                type,
                media: mediaBase64,
                text,
                textColor,
                bg,
            });
            setDone(true);
            setTimeout(() => {
                onCreated(data);
                onClose();
            }, 700);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post story');
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-[#131320] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                    <h2 className="font-bold text-white text-lg">
                        {step === 'pick' ? 'Create Story' : `${type?.charAt(0).toUpperCase() + type?.slice(1)} Story`}
                    </h2>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Step 1 — Pick type */}
                {step === 'pick' && (
                    <div className="p-5 grid grid-cols-3 gap-3">
                        {[
                            { t: 'image', icon: ImageIcon, label: 'Image', color: 'from-indigo-500 to-purple-600' },
                            { t: 'video', icon: Video, label: 'Video', color: 'from-rose-500 to-pink-600' },
                            { t: 'text', icon: Type, label: 'Text', color: 'from-amber-500 to-orange-500' },
                        ].map(({ t, icon: Icon, label, color }) => (
                            <motion.button
                                key={t}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => handlePickType(t)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}
                            >
                                <Icon size={28} />
                                <span className="text-xs font-semibold">{label}</span>
                            </motion.button>
                        ))}
                    </div>
                )}

                {/* Step 2 — Compose */}
                {step === 'compose' && (
                    <div className="p-5 space-y-4">
                        {/* Hidden file input */}
                        <input
                            ref={fileRef}
                            type="file"
                            accept={type === 'video' ? 'video/*' : 'image/*'}
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Preview area */}
                        <div
                            className="w-full aspect-[9/16] max-h-72 rounded-2xl overflow-hidden flex items-center justify-center relative cursor-pointer border border-white/10"
                            style={type === 'text' ? { background: bg } : { background: '#0f0f18' }}
                            onClick={() => (type !== 'text') && fileRef.current?.click()}
                        >
                            {/* Media preview */}
                            {mediaPreview && type === 'image' && (
                                <img src={mediaPreview} alt="" className="w-full h-full object-cover" />
                            )}
                            {mediaPreview && type === 'video' && (
                                <video src={mediaPreview} className="w-full h-full object-cover" controls autoPlay muted />
                            )}

                            {/* Text overlay */}
                            {text && (
                                <div
                                    className="absolute inset-0 flex items-center justify-center p-4 text-center font-bold text-2xl leading-tight"
                                    style={{ color: textColor, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
                                >
                                    {text}
                                </div>
                            )}

                            {/* Placeholder */}
                            {!mediaPreview && type !== 'text' && (
                                <div className="flex flex-col items-center gap-2 text-zinc-600">
                                    <Upload size={32} />
                                    <span className="text-sm">Click to pick {type}</span>
                                </div>
                            )}

                            {!text && type === 'text' && (
                                <span className="text-white/30 text-sm pointer-events-none">Your text will appear here</span>
                            )}
                        </div>

                        {/* Text input (always available for overlay) */}
                        <div>
                            <label className="text-xs text-zinc-500 mb-1 block">
                                {type === 'text' ? 'Your text' : 'Text overlay (optional)'}
                            </label>
                            <input
                                type="text"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                maxLength={100}
                                placeholder={type === 'text' ? 'Write something...' : 'Add text on top...'}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                        </div>

                        {/* Text color picker */}
                        {(type === 'text' || text) && (
                            <div>
                                <label className="text-xs text-zinc-500 mb-2 block">Text color</label>
                                <div className="flex gap-2">
                                    {TEXT_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setTextColor(c)}
                                            className={`w-7 h-7 rounded-full border-2 transition-all ${textColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                                            style={{ background: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Background picker (text-only) */}
                        {type === 'text' && (
                            <div>
                                <label className="text-xs text-zinc-500 mb-2 block">Background</label>
                                <div className="flex gap-2 flex-wrap">
                                    {BG_GRADIENTS.map((g) => (
                                        <button
                                            key={g.value}
                                            onClick={() => setBg(g.value)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${bg === g.value ? 'border-white scale-125' : 'border-transparent'}`}
                                            style={{ background: g.value }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && <p className="text-red-400 text-xs">{error}</p>}

                        {/* Post button */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handlePost}
                            disabled={saving || done}
                            className={`w-full py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all ${done ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 disabled:opacity-60'
                                }`}
                        >
                            {saving && <Loader2 size={18} className="animate-spin" />}
                            {done && <Check size={18} />}
                            {done ? 'Posted!' : saving ? 'Posting...' : 'Post Story'}
                        </motion.button>

                        <button
                            onClick={() => { setStep('pick'); setMediaPreview(''); setMediaBase64(''); setText(''); }}
                            className="w-full text-sm text-zinc-500 hover:text-white transition-colors py-1"
                        >
                            ← Change type
                        </button>
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
};

export default CreateStory;
