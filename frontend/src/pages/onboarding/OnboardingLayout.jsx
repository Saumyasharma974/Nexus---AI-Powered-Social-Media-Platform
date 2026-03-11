import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import Welcome from './Welcome';
import Interests from './Interests';
import BioGenerator from './BioGenerator';
import ProfileSetup from './ProfileSetup';
import FollowSuggestions from './FollowSuggestions';

const TOTAL_STEPS = 5;

const stepComponents = [Welcome, Interests, BioGenerator, ProfileSetup, FollowSuggestions];

const OnboardingLayout = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        interests: [],
        bio: '',
        profileImage: '',
        city: '',
        profession: '',
        hobbies: '',
    });

    const updateFormData = (fields) => setFormData((prev) => ({ ...prev, ...fields }));
    const nextStep = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const CurrentStep = stepComponents[step - 1];

    const progressPercent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-start px-4 py-8">
            {/* Progress Bar - hidden on welcome step */}
            {step > 1 && (
                <div className="w-full max-w-xl mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500 font-medium">Step {step} / {TOTAL_STEPS}</span>
                        <span className="text-xs text-zinc-500">{Math.round(progressPercent)}% complete</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                    </div>

                    {/* Step dots */}
                    <div className="flex justify-between mt-3">
                        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                            <div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${i + 1 <= step ? 'bg-indigo-500' : 'bg-white/10'}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Step Content */}
            <div className="w-full max-w-xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                        <CurrentStep
                            formData={formData}
                            updateFormData={updateFormData}
                            nextStep={nextStep}
                            prevStep={prevStep}
                            step={step}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default OnboardingLayout;
