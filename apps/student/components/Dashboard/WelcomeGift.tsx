
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Coins, Zap, Trophy, Check, Sparkles, ChevronDown } from 'lucide-react';

interface WelcomeGiftProps {
  onClose: () => void;
  onClaim: () => void;
}

type GiftStep = 'closed' | 'opening' | 'revealed';

export const WelcomeGift: React.FC<WelcomeGiftProps> = ({ onClose, onClaim }) => {
  const [step, setStep] = useState<GiftStep>('closed');
  const [showParticles, setShowParticles] = useState(false);

  // Auto-advance logic
  useEffect(() => {
      if (step === 'opening') {
          setShowParticles(true);
          const timer = setTimeout(() => {
              setStep('revealed');
          }, 1200); // Duration of explosion animation
          return () => clearTimeout(timer);
      }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/95 backdrop-blur-xl"
      />

      {/* Particles Layer */}
      {showParticles && <Particles />}

      <AnimatePresence mode="wait">
        
        {/* PHASE 1: CLOSED BOX */}
        {step === 'closed' && (
            <motion.div 
                key="closed"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0, filter: "blur(20px)" }}
                className="relative z-10 flex flex-col items-center"
            >
                <motion.div 
                    className="relative cursor-pointer group" 
                    onClick={() => setStep('opening')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    {/* Glow behind box */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand/30 rounded-full blur-[80px] group-hover:bg-brand/50 transition-colors animate-pulse"></div>
                    
                    {/* The Box */}
                    <motion.div 
                        animate={{ 
                            y: [0, -15, 0], 
                            rotate: [0, 2, -2, 0]
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-64 h-64 bg-gradient-to-br from-[#6C5DD3] to-[#4c35a6] rounded-[48px] flex items-center justify-center shadow-[0_20px_50px_rgba(108,93,211,0.5)] border-4 border-white/10 relative z-10 overflow-hidden"
                    >
                        {/* Shine Effect */}
                        <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform skew-x-[-20deg] animate-[shine_3s_infinite]"></div>
                        
                        <Gift size={100} className="text-white drop-shadow-2xl" />
                        
                        {/* Ribbon/Sparkle */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-accent rounded-bl-[48px] rounded-tr-[44px] flex items-center justify-center shadow-lg border-b border-l border-white/10">
                            <Sparkles size={28} className="text-brand-dark animate-pulse" />
                        </div>
                    </motion.div>

                    {/* Tap hint */}
                    <div className="absolute -bottom-16 left-0 right-0 text-center flex flex-col items-center gap-2">
                        <span className="text-white/60 text-sm font-bold animate-pulse">点击开启</span>
                        <ChevronDown className="text-white/40 animate-bounce" size={20} />
                    </div>
                </motion.div>

                <div className="mt-20 text-center">
                    <h2 className="text-4xl font-black text-white mb-2 tracking-tight">Lumi 的见面礼</h2>
                    <p className="text-white/60 font-medium text-lg">开启你的 AI 学习之旅</p>
                </div>
            </motion.div>
        )}

        {/* PHASE 2: OPENING FLASH */}
        {step === 'opening' && (
             <motion.div 
                key="opening"
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
             >
                 <motion.div 
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 40, opacity: 0 }}
                    transition={{ duration: 1.2, ease: "circIn" }}
                    className="w-20 h-20 bg-white rounded-full"
                 />
             </motion.div>
        )}

        {/* PHASE 3: REVEALED REWARDS */}
        {step === 'revealed' && (
            <motion.div 
                key="revealed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 w-full max-w-md mx-6"
            >
                <div className="bg-gray-800/90 backdrop-blur-xl border border-white/10 rounded-[48px] p-8 md:p-10 text-center shadow-2xl relative overflow-hidden">
                    
                    {/* Background Rays */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_deg,rgba(255,255,255,0.03)_20deg,transparent_40deg)] animate-[spin_20s_linear_infinite] pointer-events-none"></div>

                    <h2 className="text-3xl font-black text-white mb-8 relative z-10 flex items-center justify-center gap-2">
                        <Sparkles className="text-accent" /> 获得奖励
                    </h2>

                    <div className="grid grid-cols-1 gap-4 mb-10 relative z-10">
                        {/* Item 1: Coins */}
                        <RewardItem 
                            icon={<Coins size={32} className="text-yellow-400 fill-yellow-400" />} 
                            label="学习金币" 
                            value={500} 
                            delay={0.2}
                            color="bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        />
                        
                        {/* Item 2: XP */}
                        <RewardItem 
                            icon={<Zap size={32} className="text-blue-400 fill-blue-400" />} 
                            label="经验值" 
                            value={200} 
                            suffix="XP"
                            delay={0.4}
                            color="bg-blue-500/10 text-blue-400 border-blue-500/20"
                        />

                        {/* Item 3: Badge */}
                        <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="flex items-center gap-4 bg-purple-500/10 border border-purple-500/20 p-4 rounded-3xl relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-50"></div>
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0 relative z-10">
                                <Trophy size={32} className="text-white" fill="currentColor" />
                            </div>
                            <div className="text-left flex-1 relative z-10">
                                <div className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">限定徽章</div>
                                <div className="text-white text-xl font-black">初露锋芒</div>
                            </div>
                            <div className="bg-purple-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg relative z-10">
                                NEW
                            </div>
                        </motion.div>
                    </div>

                    <motion.button 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1 }}
                        onClick={onClaim}
                        className="w-full bg-white text-gray-900 font-black text-xl py-5 rounded-3xl shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all relative z-10 flex items-center justify-center gap-3 group"
                    >
                        <Check size={24} strokeWidth={4} className="text-brand" />
                        <span>收入囊中</span>
                    </motion.button>
                </div>
            </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

const RewardItem = ({ icon, label, value, suffix = '', delay, color }: any) => {
    return (
        <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay }}
            className={`flex items-center gap-4 p-4 rounded-3xl border ${color} relative overflow-hidden`}
        >
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center backdrop-blur-sm shrink-0">
                {icon}
            </div>
            <div className="text-left">
                <div className="opacity-60 text-xs font-bold uppercase tracking-wider mb-1">{label}</div>
                <div className="text-3xl font-black">
                    +{value} <span className="text-lg opacity-80">{suffix}</span>
                </div>
            </div>
        </motion.div>
    );
}

const Particles = () => {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible z-50">
            {[...Array(30)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{ 
                        x: (Math.random() - 0.5) * 1000, 
                        y: (Math.random() - 0.5) * 1000, 
                        scale: Math.random() * 1,
                        opacity: 0 
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className={`absolute w-3 h-3 rounded-full ${['bg-yellow-400', 'bg-purple-400', 'bg-blue-400', 'bg-white'][i % 4]}`}
                />
            ))}
        </div>
    );
};
