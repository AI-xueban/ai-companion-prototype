import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import type { Achievement } from '../../types';

type AchievementVisual = {
  accent: string;
  surface: string;
  glow: string;
  label: string;
  particles: string[];
};

const ACHIEVEMENT_VISUALS: Record<string, AchievementVisual> = {
  a1: {
    accent: 'from-orange-400 via-amber-300 to-yellow-100',
    surface: 'from-orange-500 to-amber-400',
    glow: 'rgba(251, 146, 60, 0.46)',
    label: '晨光绽放',
    particles: ['☀️', '✦', '✧', '☁️', '✦'],
  },
  a2: {
    accent: 'from-indigo-500 via-violet-400 to-sky-300',
    surface: 'from-indigo-600 to-violet-500',
    glow: 'rgba(99, 102, 241, 0.48)',
    label: '公式星轨',
    particles: ['△', 'π', '✦', '＋', '◇'],
  },
  a3: {
    accent: 'from-teal-500 via-emerald-400 to-lime-300',
    surface: 'from-teal-600 to-emerald-500',
    glow: 'rgba(16, 185, 129, 0.46)',
    label: '心流共振',
    particles: ['◌', '✦', '☘', '✧', '◌'],
  },
};

const DEFAULT_VISUAL: AchievementVisual = {
  accent: 'from-violet-500 via-fuchsia-400 to-pink-300',
  surface: 'from-violet-600 to-fuchsia-500',
  glow: 'rgba(139, 92, 246, 0.46)',
  label: '星光点亮',
  particles: ['✦', '✧', '✦', '✧', '✦'],
};

interface AchievementUnlockOverlayProps {
  achievement: Achievement | null;
  onClaim: (achievement: Achievement) => void;
}

export const AchievementUnlockOverlay: React.FC<AchievementUnlockOverlayProps> = ({ achievement, onClaim }) => {
  const visual = achievement ? (ACHIEVEMENT_VISUALS[achievement.id] ?? DEFAULT_VISUAL) : DEFAULT_VISUAL;

  return (
    <AnimatePresence>
      {achievement ? (
        <motion.div
          className="fixed inset-0 z-[310] flex items-center justify-center overflow-hidden bg-slate-950/72 px-5 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={`获得勋章：${achievement.title}`}
        >
          <motion.div
            aria-hidden="true"
            className={`absolute h-[520px] w-[520px] rounded-full bg-gradient-to-br ${visual.accent} opacity-30 blur-3xl`}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.55, 1.06, 0.88], opacity: [0, 0.42, 0.24] }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
          {visual.particles.map((particle, index) => (
            <motion.span
              key={`${achievement.id}-${particle}-${index}`}
              aria-hidden="true"
              className="absolute text-2xl font-black text-white/90"
              initial={{ opacity: 0, x: 0, y: 14, scale: 0.4, rotate: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: [-96 + index * 46, -150 + index * 74],
                y: [48, -138 - (index % 2) * 46],
                scale: [0.4, 1.15, 0.65],
                rotate: [0, index % 2 ? -30 : 30, index % 2 ? -48 : 48],
              }}
              transition={{ duration: 1.45, delay: 0.12 + index * 0.07, ease: 'easeOut' }}
            >
              {particle}
            </motion.span>
          ))}
          <motion.div
            className="relative w-full max-w-[372px] overflow-hidden rounded-[34px] border border-white/70 bg-white p-6 text-center shadow-[0_28px_90px_rgba(15,23,42,0.44)]"
            initial={{ opacity: 0, y: 28, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.95 }}
            transition={{ type: 'spring', damping: 16, stiffness: 220, delay: 0.08 }}
          >
            <div className={`absolute inset-x-0 top-0 h-36 bg-gradient-to-br ${visual.accent} opacity-80`} />
            <div className="relative">
              <motion.div
                className="mx-auto flex h-[116px] w-[116px] items-center justify-center rounded-[38px] border-4 border-white bg-white text-[56px] shadow-2xl"
                style={{ boxShadow: `0 16px 42px ${visual.glow}` }}
                initial={{ rotate: -18, scale: 0.35 }}
                animate={{ rotate: [0, -4, 4, 0], scale: [0.35, 1.13, 1] }}
                transition={{ duration: 0.82, delay: 0.18, ease: 'backOut' }}
              >
                {achievement.icon}
              </motion.div>
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] font-black tracking-[0.22em] text-slate-400">
                <Sparkles size={14} className="text-amber-400" /> {visual.label}
              </div>
              <h2 className="mt-2 text-[28px] font-black tracking-tight text-slate-900">获得勋章</h2>
              <p className="mt-2 text-lg font-black text-slate-800">{achievement.title}</p>
              <p className="mx-auto mt-2 max-w-[270px] text-[13px] font-medium leading-6 text-slate-500">{achievement.description}</p>
              <p className="mt-4 text-[11px] font-bold text-slate-400">收下后，将点亮「我的星迹」成就墙</p>
              <motion.button
                type="button"
                className={`mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${visual.surface} text-[15px] font-black text-white shadow-lg active:scale-[0.98]`}
                whileTap={{ scale: 0.96 }}
                onClick={() => onClaim(achievement)}
              >
                <Check size={18} strokeWidth={3} /> 收下勋章
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};
