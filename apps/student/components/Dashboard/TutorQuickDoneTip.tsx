import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Users } from 'lucide-react';
import { TutorCharacterMascot } from './TutorCharacterMascot';
import { TutorCharacterTheme, TutorCharacterId } from '../../data/tutorCharacterThemes';
import type { QuickDoneHintLine } from '../../data/tutorQuickDoneHints';

const CTA_PANEL: Record<
  TutorCharacterId,
  { panel: string; panelHover: string; divider: string }
> = {
  change: {
    panel: 'bg-gradient-to-br from-amber-400 to-amber-500',
    panelHover: 'hover:from-amber-500 hover:to-amber-600',
    divider: 'border-amber-200/60',
  },
  nezha: {
    panel: 'bg-gradient-to-br from-rose-400 to-rose-500',
    panelHover: 'hover:from-rose-500 hover:to-rose-600',
    divider: 'border-rose-200/60',
  },
  holmes: {
    panel: 'bg-gradient-to-br from-indigo-400 to-indigo-500',
    panelHover: 'hover:from-indigo-500 hover:to-indigo-600',
    divider: 'border-indigo-200/60',
  },
  einstein: {
    panel: 'bg-gradient-to-br from-sky-400 to-sky-500',
    panelHover: 'hover:from-sky-500 hover:to-sky-600',
    divider: 'border-sky-200/60',
  },
};

export interface TutorQuickDoneTipProps {
  theme: TutorCharacterTheme;
  hint: QuickDoneHintLine;
  onStartGuide: () => void;
  onCharacterSelect: (id: TutorCharacterId) => void;
  isSpeaking?: boolean;
  isWriting?: boolean;
}

export const TutorQuickDoneTip: React.FC<TutorQuickDoneTipProps> = ({
  theme,
  hint,
  onStartGuide,
  onCharacterSelect,
  isSpeaking = false,
  isWriting = false,
}) => {
  const cta = CTA_PANEL[theme.id];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 340 }}
      className={`flex w-full min-w-0 rounded-2xl border overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] ring-1 ${theme.cardBorder} ${theme.cardRing}`}
      role="note"
      aria-label={`${theme.name}提示：${hint.lead}${hint.emphasis}`}
    >
      <div className="flex flex-1 min-w-0 items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3 bg-white">
        <TutorCharacterMascot
          character={theme}
          onSelect={onCharacterSelect}
          isSpeaking={isSpeaking}
          isWriting={isWriting}
          compact
          embedded
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            <span className={`text-[11px] font-bold ${theme.accentText}`}>{theme.name}</span>
            <span className="text-[11px] leading-none">{theme.badge}</span>
          </div>
          <p className="text-sm text-slate-600 leading-snug line-clamp-2">
            {hint.lead}
            <span className="font-bold text-slate-800">{hint.emphasis}</span>
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onStartGuide}
        className={`interactive-control group shrink-0 flex flex-col items-center justify-center gap-1 px-4 sm:px-6 py-2.5 sm:py-3 min-w-[88px] sm:min-w-[104px] border-l text-white transition-all active:scale-[0.98] ${cta.divider} ${cta.panel} ${cta.panelHover}`}
      >
        <Users size={18} strokeWidth={2} className="opacity-90" />
        <span className="text-xs font-bold leading-tight tracking-wide">1对1讲题</span>
        <ArrowRight
          size={14}
          strokeWidth={2.5}
          className="opacity-80 transition-transform group-hover:translate-x-0.5"
        />
      </button>
    </motion.div>
  );
};
