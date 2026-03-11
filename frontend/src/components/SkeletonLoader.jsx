import { motion } from 'framer-motion';

const SkeletonLoader = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-xl overflow-hidden shadow-lg border border-white/5 mb-8 animate-pulse"
        >
            {/* Header */}
            <div className="p-4 flex items-center gap-3 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-bgSecondary/60"></div>
                <div className="w-32 h-4 rounded bg-bgSecondary/60"></div>
            </div>

            {/* Image body */}
            <div className="w-full aspect-square md:aspect-[4/3] bg-black/20"></div>

            {/* Footer */}
            <div className="p-4 space-y-4">
                <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-bgSecondary/60"></div>
                    <div className="w-8 h-8 rounded-full bg-bgSecondary/60"></div>
                    <div className="w-8 h-8 rounded-full bg-bgSecondary/60"></div>
                </div>

                <div className="w-16 h-4 rounded bg-bgSecondary/60"></div>
                <div className="w-full h-4 rounded bg-bgSecondary/60"></div>
                <div className="w-2/3 h-4 rounded bg-bgSecondary/60"></div>
            </div>
        </motion.div>
    );
};

export default SkeletonLoader;
