import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  AISolveQuestion,
  flattenQuestionsFromShots,
  getShotById,
} from '../../data/aiSolveMockData';
import { MultiQuestionPaper, SingleQuestionPaper } from './ProblemPaperView';

export interface QuestionPickerOverlayProps {
  open: boolean;
  shotIds: string[];
  onClose: () => void;
  onSelect: (question: AISolveQuestion) => void;
}

export const QuestionPickerOverlay: React.FC<QuestionPickerOverlayProps> = ({
  open,
  shotIds,
  onClose,
  onSelect,
}) => {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(true);

  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  React.useEffect(() => {
    if (!open) {
      setAnalyzing(true);
      setHoverId(null);
      return;
    }
    const timer = window.setTimeout(() => setAnalyzing(false), 1200);
    return () => window.clearTimeout(timer);
  }, [open, shotIds]);

  const allQuestions = flattenQuestionsFromShots(shotIds);
  const multiShots = shotIds
    .map((id) => getShotById(id))
    .filter((s) => s && s.multiQuestion);

  const handleSelect = (q: AISolveQuestion) => {
    onSelect(q);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[210] bg-slate-900/95 text-white overflow-hidden flex flex-col backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-4 md:px-6 pt-4 pb-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
              aria-label="返回"
            >
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-sm font-black tracking-wide">选择要讲解的题目</h2>
            <div className="w-10" aria-hidden />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 pb-8">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="w-12 h-12 rounded-full border-2 border-brand/30 border-t-brand"
                />
                <p className="text-white/70 text-sm font-bold">正在识别题目…</p>
                <p className="text-white/40 text-xs">共 {allQuestions.length} 道题待确认</p>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6 pt-4">
                <p className="text-center text-white/60 text-sm">
                  检测到 {allQuestions.length} 道题目，请点击需要讲解的题目
                </p>

                {multiShots.map((shot) =>
                  shot ? (
                    <div key={shot.id} className="space-y-3">
                      <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                        多题同页 · 点击框选区域
                      </p>
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl ring-2 ring-brand/20">
                        <MultiQuestionPaper shot={shot} className="w-full h-full" />
                        {shot.questions.map((q) => (
                          <div
                            key={q.id}
                            onMouseEnter={() => setHoverId(q.id)}
                            onMouseLeave={() => setHoverId(null)}
                            className={`
                              absolute rounded-lg border-[3px] transition-all group/box
                              ${hoverId === q.id
                                ? 'border-brand bg-brand/20 ring-2 ring-brand/45 shadow-[0_0_26px_rgba(108,93,211,0.58)]'
                                : 'border-brand/80 bg-brand/10 ring-1 ring-brand/35 hover:border-brand hover:bg-brand/16 animate-pulse-subtle'}
                            `}
                            style={
                              q.region
                                ? {
                                    top: `${q.region.top}%`,
                                    left: `${q.region.left}%`,
                                    width: `${q.region.width}%`,
                                    height: `${q.region.height}%`,
                                  }
                                : undefined
                            }
                            aria-label={`第 ${q.number} 题区域`}
                          >
                            <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center shadow-lg z-10">
                              {q.number}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSelect(q)}
                              className={`
                                absolute right-2 top-1/2 -translate-y-1/2 z-20
                                w-9 h-9 rounded-full border flex items-center justify-center
                                transition-all active:scale-95
                                ${hoverId === q.id
                                  ? 'bg-brand text-white border-brand shadow-[0_6px_18px_rgba(108,93,211,0.55)]'
                                  : 'bg-white/95 text-brand border-brand/60 hover:bg-brand hover:text-white'}
                              `}
                              aria-label={`点击箭头讲解第 ${q.number} 题`}
                              title={`讲解第 ${q.number} 题`}
                            >
                              <ChevronRight size={18} strokeWidth={2.8} />
                            </button>
                          </div>
                        ))}
                        {/* 首次引导浮层 */}
                        {!hoverId && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
                          >
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand/90 text-white text-xs font-bold shadow-[0_4px_20px_rgba(108,93,211,0.5)] whitespace-nowrap">
                              <motion.span
                                animate={{ scale: [1, 1.15, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                👆
                              </motion.span>
                              点击紫色框选区域，选择要讲解的题目
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ) : null,
                )}

                <div className="space-y-3">
                  <p className="text-xs font-bold text-white/50 uppercase tracking-wider">
                    全部识别结果
                  </p>
                  {allQuestions.map((q) => {
                    const isRecommended = q.id === 'q27';
                    return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleSelect(q)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.99] group ${
                        isRecommended
                          ? 'border-brand/50 bg-brand/10 hover:bg-brand/15 ring-1 ring-brand/30'
                          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-brand/40'
                      }`}
                    >
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white">
                          <SingleQuestionPaper question={q} className="w-full h-full" compact />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-black text-brand bg-brand/20 px-2 py-0.5 rounded-full">
                              第 {q.number} 题
                            </span>
                            {isRecommended ? (
                              <span className="text-[10px] font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full">
                                推荐讲解
                              </span>
                            ) : null}
                            <span className="text-[10px] text-white/40">{q.subject}</span>
                          </div>
                          <p className="text-sm text-white/90 font-medium leading-relaxed line-clamp-2">
                            {q.text}
                          </p>
                        </div>
                        <div className="shrink-0 w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Sparkles size={16} className="text-brand-light" />
                        </div>
                      </div>
                    </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      <style>{`
        @keyframes pulse-subtle {
          0%, 100% { box-shadow: 0 0 0 0 rgba(108, 93, 211, 0.35); }
          50% { box-shadow: 0 0 16px 2px rgba(108, 93, 211, 0.45); }
        }
        .animate-pulse-subtle { animation: pulse-subtle 2s ease-in-out infinite; }
      `}</style>
    </AnimatePresence>,
    portalTarget,
  );
};
