import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, GitBranch, ScanText, Sparkles, type LucideIcon } from 'lucide-react';
import { flattenQuestionsFromShots, getShotById, needsQuestionPicker } from '../../data/aiSolveMockData';

const SINGLE_STEPS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'read', label: '正在读题', Icon: ScanText },
  { id: 'locate', label: '定位相关知识点', Icon: Crosshair },
  { id: 'logic', label: '梳理讲解逻辑', Icon: GitBranch },
  { id: 'generate', label: '正在生成解题方案', Icon: Sparkles },
];

const MULTI_STEPS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'scan', label: '正在处理题目信息', Icon: ScanText },
  { id: 'detect', label: '识别每道题的切题位置', Icon: Crosshair },
  { id: 'group', label: '关联同页题目与知识点', Icon: GitBranch },
  { id: 'ready', label: '即将进入题目切换查看', Icon: Sparkles },
];

const STEP_MS = 1300;

export interface AISolveProcessingOverlayProps {
  open: boolean;
  shotIds: string[];
  onComplete: () => void;
}

export const AISolveProcessingOverlay: React.FC<AISolveProcessingOverlayProps> = ({
  open,
  shotIds,
  onComplete,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback((handler: () => void) => {
    handler();
  }, []);

  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  const previewQuestion = useMemo(
    () => flattenQuestionsFromShots(shotIds)[0] ?? null,
    [shotIds],
  );
  const isMultiQuestionFlow = useMemo(() => needsQuestionPicker(shotIds), [shotIds]);
  const steps = isMultiQuestionFlow ? MULTI_STEPS : SINGLE_STEPS;
  const previewShots = useMemo(
    () => shotIds.map((id) => getShotById(id)).filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [shotIds],
  );
  const totalQuestions = useMemo(() => flattenQuestionsFromShots(shotIds).length, [shotIds]);

  useEffect(() => {
    if (!open) {
      setActiveIndex(0);
      return;
    }

    setActiveIndex(0);
    let step = 0;
    const timers: number[] = [];

    const schedule = () => {
      if (step >= steps.length - 1) {
        timers.push(window.setTimeout(() => finish(() => onCompleteRef.current()), STEP_MS));
        return;
      }
      timers.push(
        window.setTimeout(() => {
          step += 1;
          setActiveIndex(step);
          schedule();
        }, STEP_MS),
      );
    };

    schedule();
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [open, shotIds, finish, steps]);

  if (!open) return null;

  const StepIcon = steps[activeIndex].Icon;

  const statusText = (
    <AnimatePresence mode="wait">
      <motion.div
        key={steps[activeIndex].id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center gap-2"
      >
        <StepIcon size={14} strokeWidth={2.5} className="text-brand shrink-0" />
        <span className="text-[13px] font-semibold text-slate-600 tracking-tight">
          {steps[activeIndex].label}
        </span>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
      className="absolute inset-0 z-[280] overflow-hidden flex flex-col isolate pointer-events-auto"
    >
      {/* 不透明底 — 完全遮住主界面 */}
      <div className="absolute inset-0 bg-white" />

      {/* 装饰光晕（在实色底之上，不透出下层） */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-brand/[0.07] blur-3xl" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-indigo-100 blur-3xl translate-x-1/4 translate-y-1/4" />
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.18) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center px-5 md:px-8 py-8 md:py-10">
        {isMultiQuestionFlow ? (
          <div className="relative w-full max-w-[980px] flex flex-col items-center gap-3">
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">
                检测到 {previewShots.length} 张照片，约 {totalQuestions} 道题
              </p>
              <p className="text-xs text-slate-500 mt-1">可左右滑动预览切题位置</p>
            </div>

            <div className="w-full overflow-x-auto snap-x snap-mandatory custom-scrollbar pb-2">
              <div className="w-max min-w-full flex justify-center gap-4 px-1">
                {previewShots.map((shot, index) => (
                  <div
                    key={shot.id}
                    className="relative snap-center shrink-0 w-[min(86vw,360px)] md:w-[280px] rounded-2xl overflow-hidden border border-slate-200/80 bg-white shadow-sm"
                  >
                    <div className="absolute top-2 left-2 z-20 text-[10px] font-bold text-white bg-black/55 px-2 py-1 rounded-full">
                      {index + 1}/{previewShots.length}
                    </div>
                    <div className="relative aspect-[3/4] bg-slate-100">
                      {shot.imageSrc ? (
                        <img src={shot.imageSrc} alt="" className="w-full h-full object-cover object-top" draggable={false} />
                      ) : (
                        <div className="w-full h-full animate-pulse bg-slate-200" />
                      )}
                      {shot.questions.map((q, qIndex) =>
                        q.region ? (
                          <div
                            key={q.id}
                            className="absolute border-2 border-brand/80 bg-brand/10 rounded-md"
                            style={{
                              top: `${q.region.top}%`,
                              left: `${q.region.left}%`,
                              width: `${q.region.width}%`,
                              height: `${q.region.height}%`,
                            }}
                          >
                            <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-black flex items-center justify-center shadow">
                              {q.number || qIndex + 1}
                            </span>
                          </div>
                        ) : null,
                      )}
                    </div>
                    <div className="px-2.5 py-2 border-t border-slate-100">
                      <p className="text-[11px] text-slate-700 font-semibold truncate">{shot.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mt-1 min-h-[22px] w-full flex justify-center">
              {statusText}
            </div>
          </div>
        ) : (
          <div className="relative w-full max-w-[440px] flex flex-col items-center">
            <div className="absolute -inset-4 rounded-[32px] bg-brand/[0.06] blur-2xl pointer-events-none" />
            <div className="relative w-full rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-[0_20px_50px_rgba(15,23,42,0.10),0_0_0_1px_rgba(255,255,255,0.8)_inset]">
              <div className="relative overflow-hidden bg-slate-50">
                <motion.div
                  className="absolute left-0 right-0 z-20 h-[2px] bg-brand pointer-events-none"
                  style={{
                    boxShadow: '0 0 14px rgba(108,93,211,0.65)',
                  }}
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                />
                <motion.div
                  className="absolute left-0 right-0 z-10 h-14 bg-gradient-to-b from-brand/10 to-transparent pointer-events-none"
                  animate={{ top: ['0%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: 'linear' }}
                />

                <motion.div layoutId="captured-problem" className="relative z-0">
                  {previewQuestion?.imageSrc ? (
                    <img
                      src={previewQuestion.imageSrc}
                      alt=""
                      className="w-full h-auto block"
                      draggable={false}
                    />
                  ) : (
                    <div className="aspect-[4/3] bg-slate-100 animate-pulse" />
                  )}
                </motion.div>
              </div>
            </div>

            <div className="relative mt-4 min-h-[22px] w-full flex justify-center">
              {statusText}
            </div>
          </div>
        )}
      </div>
    </motion.div>,
    portalTarget,
  );
};
