import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';

const Welcome = ({ nextStep }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 min-h-[70vh]">
            {/* Glowing icon */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                className="relative mb-8"
            >
                <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/40">
                    <img src="/logo.png" alt="Nexus" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 rounded-3xl bg-indigo-500/20 blur-2xl -z-10 scale-150 animate-pulse" />
            </motion.div>

            {/* Title */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-4xl font-bold text-white mb-4"
            >
                Welcome to{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Nexus
                </span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-zinc-400 text-lg max-w-md mb-4"
            >
                The AI-powered social media that helps you craft better posts, discover great people, and grow your presence effortlessly.
            </motion.p>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-zinc-600 text-sm mb-12"
            >
                Let's personalize your experience in just 2 minutes.
            </motion.p>

            {/* Features preview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="grid grid-cols-3 gap-4 mb-12 w-full max-w-sm"
            >
                {[
                    { emoji: '🤖', label: 'AI Bio Generator' },
                    { emoji: '✨', label: 'Smart Captions' },
                    { emoji: '👥', label: 'Discover People' },
                ].map((feature) => (
                    <div key={feature.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2">
                        <span className="text-2xl">{feature.emoji}</span>
                        <span className="text-xs text-zinc-400 text-center">{feature.label}</span>
                    </div>
                ))}
            </motion.div>

            {/* CTA Button */}
            <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold text-lg rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all"
            >
                Get Started
                <ArrowRight size={22} />
            </motion.button>
        </div>
    );
};

export default Welcome;
