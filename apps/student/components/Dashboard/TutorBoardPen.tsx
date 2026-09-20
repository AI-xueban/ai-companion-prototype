import React from 'react';
import { motion } from 'framer-motion';
import { TutorCharacterId } from '../../data/tutorCharacterThemes';

export type TutorBoardPenKind = 'quill' | 'fountain' | 'brush' | 'chalk';

const PEN_BY_CHARACTER: Record<TutorCharacterId, TutorBoardPenKind> = {
  change: 'quill',
  holmes: 'fountain',
  nezha: 'brush',
  einstein: 'chalk',
};

const PEN_META: Record<
  TutorBoardPenKind,
  { label: string; rotate: string; tipOffset: string; pressY: number; pressRotate: number }
> = {
  quill: { label: '羽毛笔', rotate: '-42deg', tipOffset: 'translate(2px, 3px)', pressY: 3, pressRotate: 3 },
  fountain: { label: '钢笔', rotate: '-48deg', tipOffset: 'translate(1px, 4px)', pressY: 2, pressRotate: 2 },
  brush: { label: '朱笔', rotate: '-32deg', tipOffset: 'translate(0px, 2px)', pressY: 4, pressRotate: 6 },
  chalk: { label: '粉笔', rotate: '-58deg', tipOffset: 'translate(2px, 5px)', pressY: 5, pressRotate: 1 },
};

function QuillPen() {
  return (
    <svg width="44" height="44" viewBox="0 0 36 36" fill="none" aria-hidden className="overflow-visible">
      <path
        d="M8 30 L11 27 L24 8 C25.2 6.2 27.8 5.8 29.5 7.2 C31.2 8.6 31.4 11.2 29.8 12.8 L12 28.5 L8 30 Z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M14.5 25.5 L17 22.5 L28.5 10.5 C29.1 9.8 30.1 9.7 30.7 10.3 C31.3 10.9 31.3 11.9 30.7 12.5 L17.5 24.5 L14.5 25.8 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path d="M8.5 29.5 L12.5 28.2 L14.8 25.5 L10.2 29.8 Z" fill="currentColor" />
      <path d="M9 30.5 L11.5 29.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function FountainPen() {
  return (
    <svg width="44" height="44" viewBox="0 0 36 36" fill="none" aria-hidden className="overflow-visible">
      <rect x="14" y="4" width="8" height="14" rx="2.5" fill="currentColor" opacity="0.85" />
      <path d="M16 18 L20 18 L18.5 24.5 Z" fill="currentColor" />
      <path d="M18 24.5 L18 29.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18.5" cy="30.5" r="1.2" fill="currentColor" opacity="0.65" />
    </svg>
  );
}

function InkBrush() {
  return (
    <svg width="44" height="44" viewBox="0 0 36 36" fill="none" aria-hidden className="overflow-visible">
      <rect x="15" y="3" width="6" height="16" rx="1.5" fill="currentColor" opacity="0.55" />
      <path
        d="M12 19 C12 19 14 21 18 21 C22 21 24 19 24 19 L23 24 C22.2 27.5 19.5 29.5 18 29.5 C16.5 29.5 13.8 27.5 13 24 Z"
        fill="currentColor"
        opacity="0.92"
      />
    </svg>
  );
}

function ChalkStick() {
  return (
    <svg width="44" height="44" viewBox="0 0 36 36" fill="none" aria-hidden className="overflow-visible">
      <rect x="13" y="6" width="10" height="20" rx="3" fill="currentColor" opacity="0.82" />
      <path d="M14 26 L22 26 L20.5 29.5 L15.5 29.5 Z" fill="currentColor" />
    </svg>
  );
}

const PEN_ICONS: Record<TutorBoardPenKind, React.FC> = {
  quill: QuillPen,
  fountain: FountainPen,
  brush: InkBrush,
  chalk: ChalkStick,
};

export function getBoardPenKind(characterId: TutorCharacterId): TutorBoardPenKind {
  return PEN_BY_CHARACTER[characterId];
}

export interface TutorBoardPenProps {
  characterId: TutorCharacterId;
  writing?: boolean;
  className?: string;
  strokeKey?: number;
}

export const TutorBoardPen: React.FC<TutorBoardPenProps> = ({
  characterId,
  writing = true,
  className = '',
  strokeKey = 0,
}) => {
  const kind = getBoardPenKind(characterId);
  const meta = PEN_META[kind];
  const Icon = PEN_ICONS[kind];

  return (
    <span
      className={`inline-flex items-end align-baseline shrink-0 ${className}`}
      style={{ transform: `rotate(${meta.rotate})`, transformOrigin: 'bottom left' }}
      title={meta.label}
      aria-hidden
    >
      <motion.span
        key={strokeKey}
        className="inline-flex drop-shadow-[0_1px_2px_rgba(15,23,42,0.18)]"
        style={{ transform: meta.tipOffset }}
        initial={{ y: -meta.pressY - 2, rotate: -meta.pressRotate }}
        animate={
          writing
            ? {
                y: [0, meta.pressY, 0],
                rotate: [0, meta.pressRotate, 0],
              }
            : { y: 0, rotate: 0 }
        }
        transition={
          writing
            ? { duration: 0.14, ease: [0.34, 1.2, 0.64, 1] }
            : { duration: 0.2 }
        }
      >
        <Icon />
      </motion.span>
    </span>
  );
};
