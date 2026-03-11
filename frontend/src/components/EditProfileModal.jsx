import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Loader2, Check, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const EditProfileModal = ({ profileData, onClose, onSaved }) => {
    const { updateUser } = useContext(AuthContext);

    const [name, setName] = useState(profileData.name || '');
    const [username, setUsername] = useState(profileData.username || '');
    const [bio, setBio] = useState(profileData.bio || '');
    const [profileImage, setProfileImage] = useState(profileData.profileImage || '');
    const [imagePreview, setImagePreview] = useState(profileData.profileImage || '');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileImage(reader.result);
            setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setError('');
        setSaving(true);
        try {
            const { data } = await api.put('/users/profile', { name, username, bio, profileImage });

            // Update local auth context so Navbar and other components reflect the change
            updateUser(data);
            setSuccess(true);

            setTimeout(() => {
                onSaved(data);
                onClose();
            }, 800);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-md bg-[#131320] border border-white/10 rounded-2xl shadow-2xl mt-10 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <h2 className="text-lg font-bold text-white">Edit Profile</h2>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">
                        {/* Profile Picture */}
                        <div className="flex justify-center">
                            <label className="relative cursor-pointer group">
                                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-indigo-500/40 shadow-lg shadow-indigo-500/20">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-indigo-500/20 flex items-center justify-center text-3xl font-bold text-indigo-300 uppercase">
                                            {name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                {/* Camera overlay */}
                                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Camera size={22} className="text-white" />
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>
                        </div>
                        <p className="text-center text-xs text-zinc-500">Click photo to change</p>

                        {/* Name */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                placeholder="Your name"
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Username</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="username"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1.5 font-medium">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={200}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                                placeholder="Tell people about yourself..."
                            />
                            <p className="text-right text-xs text-zinc-600 mt-1">{bio.length}/200</p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-6 pb-6">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 transition-all text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            disabled={saving || success}
                            className={`flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all ${success
                                    ? 'bg-green-500'
                                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 disabled:opacity-60'
                                }`}
                        >
                            {saving && <Loader2 size={16} className="animate-spin" />}
                            {success && <Check size={16} />}
                            {success ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default EditProfileModal;
