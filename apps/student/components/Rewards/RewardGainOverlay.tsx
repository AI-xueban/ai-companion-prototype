import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Zap, Sparkles, X } from 'lucide-react';
import { RewardGrantResult } from '../../types/reward';

interface RewardGainOverlayProps {
  result: RewardGrantResult | null;
  onClose: () => void;
}

const FloatingParticle: React.FC<{ delay: number; x: number; type: 'coin' | 'xp' }> = ({ delay, x, type }) => (
  <motion.div
    initial={{ opacity: 0, y: 0, x, scale: 0.3 }}
    animate={{
      opacity: [0, 1, 1, 0],
      y: [-20, -120, -200],
      x: [x, x + (type === 'coin' ? 40 : -30), x + (type === 'coin' ? 80 : -60)],
      scale: [0.3, 1, 0.6],
      rotate: type === 'coin' ? [0, 180, 360] : [0, -15, 0],
    }}
    transition={{ duration: 1.8, delay, ease: 'easeOut' }}
    className="absolute top-1/2 left-1/2 pointer-events-none"
  >
    {type === 'coin' ? (
      <Coins size={22} className="text-yellow-400 fill-yellow-400/30 drop-shadow-lg" />
    ) : (
      <Zap size={20} className="text-blue-400 fill-blue-400/30 drop-shadow-lg" />
    )}
  </motion.div>
);

export const RewardGainOverlay: React.FC<RewardGainOverlayProps> = ({ result, onClose }) => {
  const [displayXp, setDisplayXp] = useState(0);
  const [displayCoins, setDisplayCoins] = useState(0);

  useEffect(() => {
    if (!result) {
      setDisplayXp(0);
      setDisplayCoins(0);
      return;
    }

    const xpTarget = result.xp;
    const coinTarget = result.coins;
    const steps = 24;
    let step = 0;

    const timer = setInterval(() => {
      step += 1;
      const t = step / steps;
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayXp(Math.round(xpTarget * ease));
      setDisplayCoins(Math.round(coinTarget * ease));
      if (step >= steps) clearInterval(timer);
    }, 40);

    const autoClose = setTimeout(onClose, 3200);
    return () => {
      clearInterval(timer);
      clearTimeout(autoClose);
    };
  }, [result, onClose]);

  const hasXp = (result?.xp ?? 0) > 0;
  const hasCoins = (result?.coins ?? 0) > 0;

  return (
    <AnimatePresence>
      {result && (hasXp || hasCoins) && (
        <motion.div
          key="reward-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/75 backdrop-blur-md"
          />

          {/* Radial burst */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute w-48 h-48 rounded-full bg-gradient-to-r from-amber-400/40 via-indigo-400/30 to-blue-400/40"
          />

          {/* Particles */}
          {Array.from({ length: 8 }).map((_, i) => (
            <FloatingParticle
              key={i}
              delay={0.15 + i * 0.08}
              x={(i - 4) * 18}
              type={i % 2 === 0 ? 'coin' : 'xp'}
            />
          ))}

          <motion.div
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.85, y: -20, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260 }}
            className="relative z-10 flex flex-col items-center gap-6 px-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>

            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40 border border-white/20"
            >
              <Sparkles size={36} className="text-white" />
            </motion.div>

            <div className="text-center">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-black text-white mb-1"
              >
                获得奖励！
              </motion.h2>
              <p className="text-sm text-white/60 font-medium">继续学习，积累更多成长</p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              {hasXp && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-500/20 border border-blue-400/30 backdrop-blur-sm min-w-[140px]"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-500/30 flex items-center justify-center">
                    <Zap size={22} className="text-blue-300 fill-blue-300/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-200/80 uppercase tracking-wider">经验</p>
                    <p className="text-2xl font-black text-white tabular-nums">+{displayXp}</p>
                  </div>
                </motion.div>
              )}

              {hasCoins && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-500/20 border border-amber-400/30 backdrop-blur-sm min-w-[140px]"
                >
                  <div className="w-11 h-11 rounded-xl bg-amber-500/30 flex items-center justify-center">
                    <Coins size={22} className="text-yellow-300 fill-yellow-300/40" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-200/80 uppercase tracking-wider">金币</p>
                    <p className="text-2xl font-black text-white tabular-nums">+{displayCoins}</p>
                  </div>
                </motion.div>
              )}
            </div>

            {result.coins > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-white/50 font-medium"
              >
                今日金币 {result.coinsToday}/{result.coinsDailyCap}
              </motion.p>
            )}

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="mt-2 px-8 py-3 rounded-full bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-slate-100 active:scale-95 transition-all"
            >
              太棒了
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
