import { useState, useContext, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Camera, User } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const ProfileSetup = ({ formData, updateFormData, nextStep, prevStep }) => {
    const { user } = useContext(AuthContext);
    const [preview, setPreview] = useState(formData.profileImage || '');
    const fileRef = useRef();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            updateFormData({ profileImage: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleContinue = () => {
        nextStep();
    };

    return (
        <div className="py-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Set Up Your Profile</h2>
                <p className="text-zinc-400">Add a photo to complete your profile.</p>
            </motion.div>

            {/* Profile preview card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8 flex flex-col items-center"
            >
                {/* Avatar */}
                <div className="relative mb-4 group">
                    <div className="w-28 h-28 rounded-full overflow-hidden bg-indigo-500/20 border-4 border-white/10">
                        {preview ? (
                            <img src={preview} alt="profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-indigo-300 uppercase">
                                {user?.name?.charAt(0) || '?'}
                            </div>
                        )}
                    </div>

                    {/* Camera overlay */}
                    <button
                        onClick={() => fileRef.current.click()}
                        className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Camera size={24} className="text-white" />
                    </button>

                    {/* Camera badge */}
                    <button
                        onClick={() => fileRef.current.click()}
                        className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-400 transition-colors"
                    >
                        <Camera size={16} className="text-white" />
                    </button>
                </div>

                <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleImageChange} />

                {/* User info preview */}
                <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                <p className="text-zinc-500 text-sm mb-3">@{user?.username}</p>

                {formData.bio && (
                    <p className="text-zinc-400 text-sm text-center max-w-xs italic">"{formData.bio}"</p>
                )}

                {formData.interests?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        {formData.interests.slice(0, 5).map((interest) => (
                            <span key={interest} className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 rounded-full text-xs">
                                {interest}
                            </span>
                        ))}
                        {formData.interests.length > 5 && (
                            <span className="px-3 py-1 bg-white/5 text-zinc-500 rounded-full text-xs">
                                +{formData.interests.length - 5} more
                            </span>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Upload button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileRef.current.click()}
                className="w-full flex items-center justify-center gap-2 py-3 mb-6 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:border-white/30 hover:text-white transition-all text-sm font-medium"
            >
                <Camera size={18} />
                {preview ? 'Change Profile Photo' : 'Upload Profile Photo'}
            </motion.button>

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
                    onClick={handleContinue}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold transition-all"
                >
                    {preview ? 'Continue' : 'Skip for now'}
                    <ArrowRight size={18} />
                </motion.button>
            </div>
        </div>
    );
};

export default ProfileSetup;
