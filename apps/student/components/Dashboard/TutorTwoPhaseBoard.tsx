import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { BoardLineStyle } from '../../data/tutorTeachingScript';
import { StepBoardView, TutorQuestionMeta } from '../../data/tutorTwoPhaseScript';
import { TutorCharacterTheme } from '../../data/tutorCharacterThemes';
import { normalizeTutorDisplayText } from '../../utils/tutorDisplayText';
import { renderWritingText, WritingCursor } from './TutorWritingEffects';
import { getStepNumber, StepOrderBadge, type StepVisualState } from './TutorStepOrderBadge';
import { TutorBoardEmblem } from './TutorBoardEmblem';

const BOARD_NUMERIC = 'font-sans tabular-nums lining-nums';

const STYLE_MAP: Record<string, string> = {
  title: 'text-slate-800/90 font-black text-base tracking-wide',
  normal: `text-slate-700/90 ${BOARD_NUMERIC} text-[14px] leading-relaxed pl-4`,
  formula: 'text-slate-800 font-mono tabular-nums text-[13px] leading-loose pl-4',
  emphasis: `text-indigo-900/90 ${BOARD_NUMERIC} font-bold text-[14px] leading-relaxed pl-4`,
  answer: `text-emerald-800 font-black text-base pl-4 ${BOARD_NUMERIC}`,
};

export interface TutorTwoPhaseBoardProps {
  steps: StepBoardView[];
  isWriting: boolean;
  theme: TutorCharacterTheme;
  /** @deprecated 已改为图标角标，保留兼容 */
  phaseLabel?: string;
  questionMeta?: TutorQuestionMeta;
  /** skeleton=快速骨架书写；guide=1对1引导填数（不重复骨架） */
  variant?: 'skeleton' | 'guide';
  /** guide 模式下仅展示该步的填数内容 */
  activeStepIndex?: number;
  scrollable?: boolean;
  className?: string;
}

export const TutorTwoPhaseBoard: React.FC<TutorTwoPhaseBoardProps> = ({
  steps,
  isWriting,
  theme,
  questionMeta,
  variant = 'skeleton',
  activeStepIndex = -1,
  scrollable = true,
  className = '',
}) => {
  const isGuide = variant === 'guide';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [metaOpen, setMetaOpen] = useState(true);

  const boardPaperExtra: Record<string, string> = {
    change: 'opacity-[0.04] bg-[radial-gradient(#8B6914_0.5px,transparent_0.5px)] [background-size:14px_14px]',
    holmes: 'opacity-[0.05] bg-[repeating-linear-gradient(0deg,transparent,transparent_11px,rgba(60,70,100,0.08)_11px,rgba(60,70,100,0.08)_12px)]',
    nezha: 'opacity-[0.06] bg-[radial-gradient(rgba(220,80,60,0.15)_1px,transparent_1px)] [background-size:12px_12px]',
    einstein: 'opacity-[0.05] bg-[linear-gradient(rgba(80,140,200,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(80,140,200,0.06)_1px,transparent_1px)] [background-size:16px_16px]',
  };

  useEffect(() => {
    if (!scrollable) return;
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [steps, scrollable]);

  const writingTarget = (() => {
    for (const step of [...steps].reverse()) {
      for (const fill of [...step.fills].reverse()) {
        if (!fill.complete && fill.revealed > 0) return `fill-${step.id}-${fill.id}`;
      }
      if (!step.skeletonComplete) {
        // 标题阶段（书写中或写完后等待正文）
        if ((step.titleRevealed > 0 || step.titleComplete) && step.skeletonRevealed === 0) {
          return `title-${step.id}`;
        }
        if (step.skeletonRevealed > 0) return `sk-${step.id}`;
      }
    }
    return null;
  })();

  const visibleSteps = isGuide
    ? steps.filter(
        (s, i) =>
          i === activeStepIndex &&
          (s.fills.some((f) => f.revealed > 0) || s.status === 'active'),
      )
    : steps;

  const hasGuideContent = isGuide && visibleSteps.some((s) => s.fills.some((f) => f.revealed > 0));
  const activeStep = isGuide && activeStepIndex >= 0 ? steps[activeStepIndex] : null;
  const showGuidePlaceholder = isGuide && activeStep && !hasGuideContent;

  const renderPlainLine = (
    visible: string,
    lineActive: boolean,
    penClassName: string,
    prominentPen = false,
  ) => (
    <>
      {visible}
      <WritingCursor
        characterId={theme.id}
        penClassName={penClassName}
        strokeKey={visible.length}
        active={lineActive && isWriting}
        prominent={prominentPen}
      />
    </>
  );

  const renderLine = (
    visible: string,
    keyPrefix: string,
    lineActive: boolean,
    penClassName: string,
    prominentPen = false,
  ) => (
    <>
      {renderWritingText(visible, keyPrefix, { isActiveLine: lineActive, isWriting })}
      <WritingCursor
        characterId={theme.id}
        penClassName={penClassName}
        strokeKey={visible.length}
        active={lineActive && isWriting}
        prominent={prominentPen}
      />
    </>
  );

  return (
    <div className={`relative rounded-2xl overflow-hidden border ${theme.boardOuter} ${className}`}>
      <div className="absolute inset-0" style={{ backgroundColor: theme.boardBg }} />
      <div
        className={`absolute inset-0 pointer-events-none ${boardPaperExtra[theme.id] ?? ''}`}
      />
      <div
        className="absolute inset-0 opacity-[0.35] pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(transparent, transparent 27px, ${theme.boardLineColor} 27px, ${theme.boardLineColor} 28px)`,
        }}
      />
      <div className="absolute top-3 left-4 z-10 pointer-events-none flex items-center gap-2">
        <TutorBoardEmblem theme={theme} variant={variant} />
      </div>

      <div
        ref={scrollRef}
        className={`relative z-10 px-5 py-5 ${isGuide ? 'pt-5' : 'pt-9'} ${
          scrollable ? 'h-full overflow-y-auto custom-scrollbar' : ''
        }`}
      >
        {!isGuide && steps.every((s) => s.titleRevealed === 0 && s.skeletonRevealed === 0) ? (
          <p className={`font-serif text-sm text-center py-12 ${theme.boardEmpty}`}>
            {theme.name}正在梳理思路…
          </p>
        ) : isGuide && showGuidePlaceholder ? (
          <div className="py-6 px-2 text-center space-y-2">
            <div className="flex justify-center">
              <StepOrderBadge number={activeStepIndex + 1} state="active" size="md" />
            </div>
            <p className={`text-sm font-bold text-slate-700 ${BOARD_NUMERIC}`}>
              {normalizeTutorDisplayText(activeStep!.title)}
            </p>
            <p className={`text-xs ${theme.boardEmpty} leading-relaxed max-w-xs mx-auto`}>
              这一步的算式会随你的回答写在这里
            </p>
          </div>
        ) : isGuide && !hasGuideContent ? null : (
          <div className={isGuide ? 'space-y-3' : 'space-y-4'}>
            {questionMeta && !isGuide ? (
              <div className={`rounded-lg border ${theme.boardPhaseBadge} overflow-hidden`}>
                <button
                  type="button"
                  onClick={() => setMetaOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                    <span className={`text-[11px] font-black shrink-0 ${theme.accentText}`}>考察题型</span>
                    <span className="text-[11px] font-black text-slate-700 truncate">{questionMeta.typeLabel}</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform ${metaOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            ) : null}
            {visibleSteps.map((step) => {
              if (!isGuide && step.titleRevealed === 0 && step.skeletonRevealed === 0 && step.status === 'pending') {
                return null;
              }
              const stepNumber = getStepNumber(step.id, steps);
              const stepBadgeState: StepVisualState =
                step.status === 'active' ? 'active' : step.status === 'done' ? 'done' : 'pending';
              const skVisible = normalizeTutorDisplayText(step.skeleton.slice(0, step.skeletonRevealed));
              if (isGuide) {
                return (
                  <div key={step.id} className="space-y-1.5">
                    {step.fills.map((fill) => {
                      if (fill.revealed === 0) return null;
                      const visible = normalizeTutorDisplayText(fill.text.slice(0, fill.revealed));
                      const styleClass = STYLE_MAP[fill.style ?? 'normal'];
                      const lineActive = writingTarget === `fill-${step.id}-${fill.id}`;
                      return (
                        <p
                          key={fill.id}
                          className={`${styleClass} whitespace-pre-wrap leading-relaxed transition-colors duration-500 ${
                            fill.justFilled ? 'bg-emerald-50/80 rounded px-1 -mx-1' : ''
                          }`}
                        >
                          {renderLine(visible, fill.id, lineActive, theme.accentBrush)}
                        </p>
                      );
                    })}
                  </div>
                );
              }

              const titleActive = writingTarget === `title-${step.id}`;
              const titleDisplay = normalizeTutorDisplayText(
                step.titleComplete ? step.title : step.title.slice(0, step.titleRevealed),
              );
              const skComplete = step.skeletonComplete;
              const skActive = writingTarget === `sk-${step.id}`;
              const isActiveStep = step.status === 'active';
              const isDone = step.status === 'done';

              return (
                <div
                  key={step.id}
                  className={`py-2 pl-3 border-l-2 transition-all duration-300 ${
                    isActiveStep
                      ? 'border-amber-400/80 bg-amber-50/30 -ml-1 pl-4 rounded-r-lg shadow-sm'
                      : isDone
                        ? 'border-emerald-400/50 opacity-90'
                        : 'border-transparent opacity-45'
                  }`}
                >
                  {(step.titleComplete || step.titleRevealed > 0 || isActiveStep) ? (
                    <div className="flex items-center gap-2 mb-1.5 min-w-0">
                      <StepOrderBadge number={stepNumber} state={stepBadgeState} />
                      {(step.titleComplete || step.titleRevealed > 0) ? (
                        <p className="flex-1 min-w-0 text-slate-900 font-black text-[15px] leading-snug">
                          <span>{titleDisplay}</span>
                          {titleActive && isWriting ? (
                            <WritingCursor
                              characterId={theme.id}
                              penClassName={theme.accentBrush}
                              strokeKey={titleDisplay.length}
                              active
                              prominent
                            />
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {(step.skeletonRevealed > 0 || skComplete) && (
                    <p className={`text-slate-700/90 ${BOARD_NUMERIC} text-[13px] leading-relaxed whitespace-pre-wrap`}>
                      {skActive && isWriting
                        ? renderPlainLine(skVisible, skActive, theme.accentBrush)
                        : normalizeTutorDisplayText(
                            skComplete ? step.skeleton : step.skeleton.slice(0, step.skeletonRevealed),
                          )}
                    </p>
                  )}

                  {step.fills.map((fill) => {
                    if (fill.revealed === 0) return null;
                    const visible = normalizeTutorDisplayText(fill.text.slice(0, fill.revealed));
                    const styleClass = STYLE_MAP[fill.style ?? 'normal'];
                    const lineActive = writingTarget === `fill-${step.id}-${fill.id}`;
                    return (
                      <p
                        key={fill.id}
                        className={`${styleClass} mt-1.5 whitespace-pre-wrap leading-relaxed transition-colors duration-500 ${
                          fill.justFilled ? 'bg-emerald-50/80 rounded px-1 -mx-1' : ''
                        }`}
                      >
                        {renderLine(visible, fill.id, lineActive, theme.accentBrush)}
                      </p>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
