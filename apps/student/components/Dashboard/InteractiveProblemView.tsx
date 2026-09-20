import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AISolveQuestion } from '../../data/aiSolveMockData';
import { MockProblemView } from './ProblemPaperView';

const PAINT_WALL_HOTZONES = [
  { id: 'wall', label: '墙面 8×6', style: { top: '18%', left: '8%', width: '55%', height: '62%' } },
  { id: 'window', label: '窗户 2×1.2', style: { top: '42%', left: '52%', width: '28%', height: '28%' } },
] as const;

export interface InteractiveProblemViewProps {
  question?: AISolveQuestion;
  className?: string;
  onAnnotate?: (label: string) => void;
}

export const InteractiveProblemView: React.FC<InteractiveProblemViewProps> = ({
  question,
  className = '',
  onAnnotate,
}) => {
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const isPaintWall = question?.id === 'q27';

  return (
    <div className={`relative ${className}`}>
      <MockProblemView className="w-full" question={question} adaptive imageOnly />
      {isPaintWall && onAnnotate ? (
        <>
          {PAINT_WALL_HOTZONES.map((z) => (
            <button
              key={z.id}
              type="button"
              onClick={() => {
                setActiveZone(z.id);
                onAnnotate(z.label);
                window.setTimeout(() => setActiveZone(null), 1600);
              }}
              className={`absolute rounded-lg border-2 transition-all ${
                activeZone === z.id
                  ? 'border-brand bg-brand/20 shadow-[0_0_16px_rgba(108,93,211,0.35)]'
                  : 'border-transparent hover:border-brand/40 hover:bg-brand/10'
              }`}
              style={z.style}
              aria-label={z.label}
            />
          ))}
          <AnimatePresence>
            {activeZone ? (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-brand text-white text-[10px] font-bold shadow-md whitespace-nowrap"
              >
                已标注：{PAINT_WALL_HOTZONES.find((z) => z.id === activeZone)?.label}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </>
      ) : null}
    </div>
  );
};
