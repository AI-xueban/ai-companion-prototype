import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StartupAnimationProps {
  onComplete: () => void;
}

export const StartupAnimation: React.FC<StartupAnimationProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Start, 1: Mentor, 2: Guide, 3: Partner
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    // Timeline
    // 0s: Start (Light appears)
    // 0.8s: "是导师"
    // 1.6s: "是向导" (Logo expands/paths appear)
    // 2.5s: "更是伙伴" (Logo warms up)
    // 3.5s: Exit

    const t1 = setTimeout(() => setStep(1), 100);
    const t2 = setTimeout(() => setStep(2), 1200);
    const t3 = setTimeout(() => setStep(3), 2200);
    const t4 = setTimeout(() => handleFinish(), 3500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const handleFinish = () => {
    if (!isSkipped) {
      onComplete();
    }
  };

  const handleSkip = () => {
    setIsSkipped(true);
    onComplete();
  };

  return (
    <div 
      onClick={handleSkip}
      className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            background: step >= 3 
              ? 'radial-gradient(circle at center, rgba(255, 149, 0, 0.15) 0%, transparent 70%)' // Warm
              : 'radial-gradient(circle at center, rgba(0, 122, 255, 0.1) 0%, transparent 70%)'  // Cool
          }}
          transition={{ duration: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px]" 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* LOGO AREA */}
        <div className="relative w-32 h-32 mb-12 flex items-center justify-center">
            
            {/* 1. The Core Light (Brain/Book abstract) */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                    scale: step >= 1 ? 1 : 0, 
                    opacity: step >= 1 ? 1 : 0,
                    backgroundColor: step >= 3 ? '#FF9500' : '#007AFF', // Blue -> Orange
                    boxShadow: step >= 3 ? '0 0 40px rgba(255, 149, 0, 0.4)' : '0 0 40px rgba(0, 122, 255, 0.4)'
                }}
                transition={{ duration: 0.8, ease: "backOut" }}
                className="w-16 h-16 rounded-full relative z-20 flex items-center justify-center"
            >
                {/* Face details appearing at step 3 */}
                <AnimatePresence>
                    {step >= 3 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex gap-3 mt-1"
                        >
                             <motion.div 
                                 animate={{ scaleY: [1, 0.1, 1] }}
                                 transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1] }}
                                 className="w-2 h-3 bg-white/90 rounded-full" 
                             />
                             <motion.div 
                                 animate={{ scaleY: [1, 0.1, 1] }}
                                 transition={{ duration: 3, repeat: Infinity, times: [0, 0.05, 0.1] }}
                                 className="w-2 h-3 bg-white/90 rounded-full" 
                             />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* 2. Path Lines (Guide Phase) */}
            <AnimatePresence>
                {step >= 2 && step < 3 && (
                    <motion.div
                        initial={{ opacity: 0, rotate: 0 }}
                        animate={{ opacity: 1, rotate: 180 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className="absolute inset-0 z-10"
                    >
                         {/* Satellite orbits */}
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-blue-400/30 rounded-full border-dashed" />
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-blue-400/20 rounded-full" />
                         
                         {/* Compass ticks */}
                         <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-blue-400/50 -translate-x-1/2" />
                         <div className="absolute bottom-0 left-1/2 w-0.5 h-2 bg-blue-400/50 -translate-x-1/2" />
                         <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-blue-400/50 -translate-y-1/2" />
                         <div className="absolute right-0 top-1/2 w-2 h-0.5 bg-blue-400/50 -translate-y-1/2" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. Warm Halo (Partner Phase) */}
            <AnimatePresence>
                {step >= 3 && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [1, 1.2, 1], opacity: 0.5 }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-orange-400/20 rounded-full blur-xl z-0"
                    />
                )}
            </AnimatePresence>

        </div>

        {/* SLOGAN AREA */}
        <div className="flex flex-col items-center gap-4">
            {/* Line 1: Mentor */}
            <div className="h-8 overflow-hidden">
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: step >= 1 ? 0 : 20, opacity: step >= 1 ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    className="text-xl font-medium text-gray-400"
                >
                    是导师
                </motion.p>
            </div>

            {/* Line 2: Guide */}
            <div className="h-8 overflow-hidden">
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: step >= 2 ? 0 : 20, opacity: step >= 2 ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    className="text-xl font-semibold text-gray-600"
                >
                    是向导
                </motion.p>
            </div>

            {/* Line 3: Partner */}
            <div className="h-10 overflow-hidden">
                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: step >= 3 ? 0 : 20, opacity: step >= 3 ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
                    className="text-2xl font-black bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent"
                >
                    更是伙伴
                </motion.p>
            </div>
        </div>
      </div>
      
      <div className="absolute bottom-10 text-xs text-gray-300 animate-pulse">
          点击跳过
      </div>
    </div>
  );
};
