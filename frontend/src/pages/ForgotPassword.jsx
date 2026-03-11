import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, CheckCircle2, ArrowRight, ArrowLeft, Wand2, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const navigate = useNavigate();

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let pass = "";
        for (let i = 0; i < 16; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(pass);
        setConfirmPassword(pass);
        setShowPassword(true);
    };

    // Step 1: Send Email
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const { data } = await api.post('/auth/forgot-password', { email });
            setSuccessMessage(data.message);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/verify-otp', { email, otp });
            setSuccessMessage('');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or Expired OTP.');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            return setError('Passwords do not match');
        }

        if (newPassword.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            setSuccessMessage('Password reset successfully! Redirecting...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px]" />

            <div className="w-full max-w-md z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass w-full p-8 rounded-2xl shadow-xl border border-white/10"
                >
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4">
                            <KeyRound className="w-6 h-6 text-accent" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
                            Password Reset
                        </h2>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-xl mb-4 text-center text-sm">
                            {error}
                        </div>
                    )}
                    
                    {successMessage && step !== 3 && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl mb-4 text-center text-sm flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> {successMessage}
                        </div>
                    )}

                    {successMessage && step === 3 && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-xl mb-4 text-center text-sm flex flex-col items-center justify-center gap-2">
                             <CheckCircle2 className="w-8 h-8 mb-2" />
                             <span className="font-semibold text-lg">{successMessage}</span>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleSendOTP}
                                className="space-y-4"
                            >
                                <p className="text-sm text-zinc-400 text-center mb-6">
                                    Enter your registered email address and we'll send you a 6-digit OTP code to reset your password.
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="you@example.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors"
                                            required
                                        />
                                    </div>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-accent to-purple-600 text-white font-bold py-3 rounded-xl transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Sending...' : 'Send OTP Code'}
                                </motion.button>
                                
                                <div className="mt-4 text-center">
                                    <Link to="/login" className="text-zinc-500 text-sm hover:text-white transition-colors flex items-center justify-center gap-1">
                                        <ArrowLeft className="w-4 h-4" /> Back to Login
                                    </Link>
                                </div>
                            </motion.form>
                        )}

                        {step === 2 && (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleVerifyOTP}
                                className="space-y-4"
                            >
                                <p className="text-sm text-zinc-400 text-center mb-6">
                                    Enter the 6-digit code we sent to <strong className="text-white">{email}</strong>
                                </p>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">6-Digit OTP</label>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="000000"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 text-center text-2xl tracking-widest focus:outline-none focus:border-accent transition-colors"
                                        required
                                    />
                                </div>
                                <div className="flex gap-3 mt-4">
                                     <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="w-14 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        disabled={loading || otp.length < 6}
                                        className="flex-1 bg-gradient-to-r from-accent to-purple-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Verifying...' : 'Verify Code'}
                                    </motion.button>
                                </div>
                            </motion.form>
                        )}

                        {step === 3 && (
                            <motion.form
                                key="step3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleResetPassword}
                                className="space-y-4"
                            >
                                <p className="text-sm text-zinc-400 text-center mb-6">
                                    Create a new password for your account. Make sure it's secure.
                                </p>
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-sm font-medium text-zinc-400">New Password</label>
                                        <button 
                                            type="button" 
                                            onClick={generatePassword} 
                                            className="text-xs text-accent hover:text-purple-400 transition-colors flex items-center gap-1"
                                        >
                                            <Wand2 className="w-3 h-3" /> Auto-generate strong
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors"
                                            required
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirm New Password</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Min. 6 characters"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors"
                                        required
                                    />
                                </div>
                                
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading || successMessage}
                                    className="w-full bg-gradient-to-r from-accent to-purple-600 text-white font-bold py-3 rounded-xl transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Saving...' : 'Reset Password'}
                                </motion.button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default ForgotPassword;
