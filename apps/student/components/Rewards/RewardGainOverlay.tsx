import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Coins, Zap } from 'lucide-react';
import type { RewardGrantResult } from '../../types/reward';

export const RewardGainOverlay: React.FC<{
  result: RewardGrantResult | null;
  onClose: () => void;
  onViewAccount?: (asset: 'coins' | 'xp') => void;
}> = ({ result, onClose }) => {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (!result) return;
    setVisible(true);
    const fadeTimer = setTimeout(() => setVisible(false), 3200);
    const timer = setTimeout(() => closeRef.current(), 3500);
    return () => { clearTimeout(fadeTimer); clearTimeout(timer); };
  }, [result]);
  if (!result) return null;
  const target = document.getElementById('app-viewport') || document.body;
  const celebrate = result.coins > 0 || result.xp > 0;
  return createPortal(
    <div className="pointer-events-none absolute inset-x-0 top-16 z-[990] flex justify-center px-5">
      <motion.div key={result.receiptId ?? result.title}
        initial={reducedMotion ? false : { opacity: 0, y: -28, scale: 0.75 }}
        animate={{ opacity: visible ? 1 : 0, y: reducedMotion || visible ? 0 : -12, scale: reducedMotion || visible ? 1 : 0.94 }}
        transition={reducedMotion ? { duration: 0 } : visible ? { type: 'spring', stiffness: 380, damping: 19, mass: 0.65 } : { duration: 0.25, ease: 'easeIn' }}
        role="status" aria-live="polite" aria-atomic="true" aria-label="本次奖励提示"
        className="relative isolate max-w-md rounded-3xl border border-white bg-white shadow-[0_8px_32px_rgba(99,102,241,0.22)]">
        {!reducedMotion && celebrate && <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <motion.div className="absolute -inset-2 rounded-[32px] blur-md" style={{ background: 'linear-gradient(90deg, #fde68a, #fbcfe8, #bfdbfe)' }} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: [0, 0.7, 0], scale: [0.8, 1.15, 1.3] }} transition={{ duration: 1.2, delay: 0.15 }} />
          {Array.from({ length: 16 }, (_, index) => {
            const angle = index * Math.PI / 8;
            const x = Math.cos(angle) * (145 + index % 3 * 15);
            const y = Math.sin(angle) * 65;
            return <motion.span key={index} className="absolute left-1/2 top-1/2 block" style={{ width: index % 3 === 0 ? 7 : 5, height: index % 3 === 0 ? 7 : 10, borderRadius: index % 3 === 0 ? '50%' : 2, backgroundColor: ['#fbbf24', '#a78bfa', '#38bdf8', '#fb7185'][index % 4] }} initial={{ opacity: 0, x: 0, y: 0, scale: 0 }} animate={{ opacity: [0, 1, 1, 0], x: [0, x * 0.85, x, x * 1.05], y: [0, y - 15, y, y + 30], scale: [0, 1.2, 1, 0.5], rotate: [0, index % 2 ? 170 : -170] }} transition={{ duration: 1.3, delay: 0.12 + index % 4 * 0.035, times: [0, 0.25, 0.65, 1], ease: 'easeOut' }} />;
          })}
        </div>}
        <div className="relative overflow-hidden rounded-3xl px-5 py-3" style={{ background: 'linear-gradient(90deg, #fffbeb, #ffffff 50%, #eff6ff)' }}>
          {!reducedMotion && celebrate && <motion.div aria-hidden="true" className="absolute inset-y-0 w-12 -skew-x-12" style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }} initial={{ left: '-25%', opacity: 0 }} animate={{ left: '125%', opacity: [0, 0.9, 0] }} transition={{ duration: 0.75, delay: 0.4 }} />}
          <div className="relative flex items-center justify-center gap-5 text-sm font-bold">
            <span className="inline-flex items-center gap-2 text-amber-600"><motion.span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100" animate={reducedMotion || !celebrate ? {} : { rotate: [0, -18, 15, -8, 0], scale: [1, 1.25, 1.1, 1] }} transition={{ duration: 0.65, delay: 0.25 }}><Coins size={20} /></motion.span><span>金币 <motion.b className="inline-block tabular-nums" animate={reducedMotion || !celebrate ? {} : { scale: [1, 1.2, 1] }} transition={{ duration: 0.45, delay: 0.35 }}>+{result.coins}</motion.b></span></span>
            <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
            <span className="inline-flex items-center gap-2 text-blue-600"><motion.span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100" animate={reducedMotion || !celebrate ? {} : { y: [0, -5, 0, -2, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.65, delay: 0.35 }}><Zap size={20} /></motion.span><span>经验 <motion.b className="inline-block tabular-nums" animate={reducedMotion || !celebrate ? {} : { scale: [1, 1.2, 1] }} transition={{ duration: 0.45, delay: 0.45 }}>+{result.xp}</motion.b> XP</span></span>
          </div>
        </div>
      </motion.div>
    </div>, target,
  );
};
