import React, { useState, useEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { TutorInputBar } from './TutorInputBar';
import { TutorQuickDoneTip } from './TutorQuickDoneTip';
import { ChangETutorStage } from './ChangETutorStage';
import { SkeletonOutlinePanel } from './SkeletonOutlinePanel';
import { InteractiveProblemView } from './InteractiveProblemView';
import {
  getTutorScriptPack,
  matchGuideAnswer,
  matchPrereqAnswer,
  parseGenericGuideStartStepIndex,
  parseGuideStartStepIndex,
  GUIDE_JUMP_PREREQ,
  TutorPhase,
  StepBoardView,
} from '../../data/tutorTwoPhaseScript';
import {
  TutorCharacterId,
  getTutorCharacter,
} from '../../data/tutorCharacterThemes';
import {
  DEEP_THINKING_STEPS,
  getGuideQuestion,
  getWrongFeedback,
  getFreeAskReply,
  getPrereqPrompt,
  getPrereqRetry,
  getPrereqFallback,
  getQuickDoneSpeech,
  getGuideIntakeSpeech,
  getGuideIntakeUnclear,
} from '../../data/tutorCharacterCopy';
import { getQuickDoneHintLine, type QuickDoneHintLine } from '../../data/tutorQuickDoneHints';
import { AISolveQuestion } from '../../data/aiSolveMockData';
import { TutorExplainFeedback } from './TutorExplainFeedback';

type InputMode = 'idle' | 'guide_intake' | 'prereq_confirm' | 'guide_answer' | 'free_ask' | 'checking';

interface AITutorLayerProps {
  onClose: () => void;
  mockProblemComponent?: React.ReactNode;
  question?: AISolveQuestion | null;
  onPhaseChange?: (phase: TutorPhase) => void;
  enterFade?: boolean;
}

export interface AITutorLayerHandle {
  startGuide: () => void;
}

const QUICK_TITLE_CHAR_MS = 52;
const QUICK_BODY_CHAR_MS = 42;
const TITLE_TO_BODY_PAUSE_MS = 380;
const FILL_CHAR_MS = 36;

function buildInitialSteps(
  quickSteps: ReturnType<typeof getTutorScriptPack>['quickSteps'],
): StepBoardView[] {
  return quickSteps.map((s) => ({
    id: s.id,
    label: s.label,
    title: s.title,
    skeleton: s.skeleton,
    titleRevealed: 0,
    titleComplete: false,
    skeletonRevealed: 0,
    skeletonComplete: false,
    fills: [],
    status: 'pending' as const,
  }));
}

export const AITutorLayer = forwardRef<AITutorLayerHandle, AITutorLayerProps>(function AITutorLayer(
  { onClose, mockProblemComponent, question, onPhaseChange, enterFade = true },
  ref,
) {
  const scriptPack = useMemo(() => getTutorScriptPack(question), [question]);
  const quickSteps = scriptPack.quickSteps;
  const guideSteps = scriptPack.guideSteps;
  const jumpPrereq = useMemo(
    () => (scriptPack.scriptKey === 'paint-wall' ? GUIDE_JUMP_PREREQ : {}),
    [scriptPack.scriptKey],
  );

  const [phase, setPhase] = useState<TutorPhase>('quick');
  const [boardSteps, setBoardSteps] = useState<StepBoardView[]>(() => buildInitialSteps(quickSteps));
  const [quickLineIndex, setQuickLineIndex] = useState(0);
  const [guideStepIndex, setGuideStepIndex] = useState(-1);
  const [speechText, setSpeechText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isWriting, setIsWriting] = useState(true);
  const [inputMode, setInputMode] = useState<InputMode>('idle');
  const [pendingAnswer, setPendingAnswer] = useState('');
  const [hintText, setHintText] = useState('');
  const [quickDoneHint, setQuickDoneHint] = useState<QuickDoneHintLine>(() => getQuickDoneHintLine());
  const [wrongCount, setWrongCount] = useState(0);
  const [prereqWrongCount, setPrereqWrongCount] = useState(0);
  const [characterId, setCharacterId] = useState<TutorCharacterId>('change');
  const [deepThinking, setDeepThinking] = useState(false);
  const [deepThinkingStep, setDeepThinkingStep] = useState(0);
  const animTimerRef = useRef<number | undefined>(undefined);
  const animTimeoutRef = useRef<number | undefined>(undefined);

  const theme = getTutorCharacter(characterId);

  const clearAnim = useCallback(() => {
    if (animTimerRef.current) {
      window.clearInterval(animTimerRef.current);
      animTimerRef.current = undefined;
    }
    if (animTimeoutRef.current) {
      window.clearTimeout(animTimeoutRef.current);
      animTimeoutRef.current = undefined;
    }
  }, []);

  const pulseSpeech = useCallback((ms = 2200) => {
    setIsSpeaking(true);
    window.setTimeout(() => setIsSpeaking(false), ms);
  }, []);

  useEffect(() => {
    clearAnim();
    setPhase('quick');
    setBoardSteps(buildInitialSteps(quickSteps));
    setQuickLineIndex(0);
    setGuideStepIndex(-1);
    setSpeechText('');
    setIsSpeaking(false);
    setIsWriting(true);
    setInputMode('idle');
    setPendingAnswer('');
    setHintText('');
    setWrongCount(0);
    setPrereqWrongCount(0);
    setQuickDoneHint(getQuickDoneHintLine());
  }, [scriptPack.scriptKey, quickSteps, clearAnim]);

  useEffect(() => {
    if (phase !== 'quick') return;

    const stepIndex = quickLineIndex;
    const scriptStep = quickSteps[stepIndex];
    if (!scriptStep) {
      setIsWriting(false);
      setIsSpeaking(false);
      setSpeechText(getQuickDoneSpeech(characterId));
      setQuickDoneHint(getQuickDoneHintLine(quickSteps.length + stepIndex));
      setPhase('quick_done');
      return;
    }

    setIsSpeaking(false);
    setSpeechText('');
    setIsWriting(true);

    setBoardSteps((prev) =>
      prev.map((s, i) => {
        if (i < stepIndex) {
          return { ...s, status: 'done' as const };
        }
        if (i === stepIndex) {
          return {
            ...s,
            status: 'active' as const,
            titleRevealed: 0,
            titleComplete: false,
            skeletonRevealed: 0,
            skeletonComplete: false,
          };
        }
        return { ...s, status: 'pending' as const };
      }),
    );

    let cancelled = false;
    let charIdx = 0;

    const schedule = (fn: () => void, ms: number) => {
      animTimeoutRef.current = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const runBodyTick = () => {
      charIdx += 1;
      const skLen = scriptStep.skeleton.length;
      const skDone = charIdx >= skLen;

      setBoardSteps((prev) =>
        prev.map((s, i) => {
          if (i !== stepIndex) return s;
          return {
            ...s,
            titleRevealed: scriptStep.title.length,
            titleComplete: true,
            skeletonRevealed: Math.min(charIdx, skLen),
            skeletonComplete: skDone,
            status: skDone ? ('done' as const) : ('active' as const),
          };
        }),
      );

      if (skDone) {
        schedule(() => setQuickLineIndex((i) => i + 1), 450);
        return;
      }

      schedule(runBodyTick, QUICK_BODY_CHAR_MS);
    };

    const runTitleTick = () => {
      charIdx += 1;
      const titleLen = scriptStep.title.length;
      const titleDone = charIdx >= titleLen;

      setBoardSteps((prev) =>
        prev.map((s, i) => {
          if (i !== stepIndex) return s;
          return {
            ...s,
            titleRevealed: Math.min(charIdx, titleLen),
            titleComplete: titleDone,
          };
        }),
      );

      if (titleDone) {
        charIdx = 0;
        schedule(runBodyTick, TITLE_TO_BODY_PAUSE_MS);
        return;
      }

      schedule(runTitleTick, QUICK_TITLE_CHAR_MS);
    };

    schedule(runTitleTick, QUICK_TITLE_CHAR_MS);

    return () => {
      cancelled = true;
      clearAnim();
    };
  }, [phase, quickLineIndex, clearAnim, characterId, quickSteps]);

  const needsPrereqForStep = useCallback(
    (targetIndex: number, steps: StepBoardView[], fromStepIndex = -1) => {
      if (targetIndex <= 0) return false;
      const stepId = guideSteps[targetIndex]?.id;
      if (!stepId || !jumpPrereq[stepId]) return false;
      if (fromStepIndex >= 0 && targetIndex <= fromStepIndex) return false;

      const prevStep = steps[targetIndex - 1];
      const prevFullyDone =
        prevStep?.status === 'done' &&
        prevStep.fills.length > 0 &&
        prevStep.fills.every((f) => f.complete);
      if (prevFullyDone) return false;

      return true;
    },
    [guideSteps, jumpPrereq],
  );

  const enterGuideAnswer = useCallback(
    (stepIndex: number) => {
      setGuideStepIndex(stepIndex);
      setWrongCount(0);
      setPrereqWrongCount(0);
      setHintText('');
      setInputMode('guide_answer');
      setIsWriting(false);
      setBoardSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < stepIndex ? ('done' as const) : i === stepIndex ? ('active' as const) : ('pending' as const),
          fills: i === stepIndex && s.status !== 'done' ? [] : s.fills,
        })),
      );
      const guide = guideSteps[stepIndex];
      if (!guide) return;
      setSpeechText(getGuideQuestion(guide.id, characterId, guide.question));
      pulseSpeech();
    },
    [characterId, pulseSpeech, guideSteps],
  );

  const enterPrereqConfirm = useCallback(
    (stepIndex: number) => {
      const step = guideSteps[stepIndex];
      if (!step) return;
      const prereq = jumpPrereq[step.id];
      if (!prereq) {
        enterGuideAnswer(stepIndex);
        return;
      }
      setGuideStepIndex(stepIndex);
      setPrereqWrongCount(0);
      setHintText('');
      setInputMode('prereq_confirm');
      setIsWriting(false);
      setBoardSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < stepIndex ? ('done' as const) : i === stepIndex ? ('active' as const) : ('pending' as const),
        })),
      );
      setSpeechText(getPrereqPrompt(characterId, prereq.prompt));
      pulseSpeech(2800);
    },
    [characterId, enterGuideAnswer, pulseSpeech, guideSteps, jumpPrereq],
  );

  const startGuideFrom = useCallback(
    (stepIndex: number) => {
      const clamped = Math.min(Math.max(stepIndex, 0), guideSteps.length - 1);
      clearAnim();
      setPhase('guide');
      setGuideStepIndex(clamped);
      setWrongCount(0);
      setPrereqWrongCount(0);
      setHintText('');

      setBoardSteps((prev) => {
        const next = prev.map((s, i) => ({
          ...s,
          titleRevealed: s.title.length,
          titleComplete: true,
          skeletonRevealed: s.skeleton.length,
          skeletonComplete: true,
          fills: i >= clamped ? [] : [],
          status:
            i < clamped ? ('done' as const) : i === clamped ? ('active' as const) : ('pending' as const),
        }));
        if (needsPrereqForStep(clamped, next)) {
          window.setTimeout(() => enterPrereqConfirm(clamped), 0);
        } else {
          window.setTimeout(() => enterGuideAnswer(clamped), 0);
        }
        return next;
      });
    },
    [clearAnim, needsPrereqForStep, enterPrereqConfirm, enterGuideAnswer, guideSteps],
  );

  const selectGuideStep = useCallback(
    (targetIndex: number) => {
      if (phase !== 'guide' || inputMode === 'checking') return;
      if (inputMode === 'guide_intake') {
        startGuideFrom(targetIndex);
        return;
      }
      if (targetIndex === guideStepIndex && inputMode === 'guide_answer') return;

      clearAnim();
      setWrongCount(0);
      setPrereqWrongCount(0);
      setHintText('');

      setBoardSteps((prev) => {
        const next = prev.map((s, i) => {
          if (i < targetIndex) {
            return { ...s, status: 'done' as const };
          }
          if (i === targetIndex) {
            return {
              ...s,
              status: 'active' as const,
              fills: s.status === 'done' ? s.fills : [],
            };
          }
          return {
            ...s,
            status: 'pending' as const,
            fills: s.status === 'done' ? s.fills : [],
          };
        });

        if (needsPrereqForStep(targetIndex, next, guideStepIndex)) {
          window.setTimeout(() => enterPrereqConfirm(targetIndex), 0);
        } else {
          window.setTimeout(() => enterGuideAnswer(targetIndex), 0);
        }
        return next;
      });
    },
    [phase, inputMode, guideStepIndex, clearAnim, needsPrereqForStep, enterPrereqConfirm, enterGuideAnswer, startGuideFrom],
  );

  const enterGuideIntake = useCallback(() => {
    clearAnim();
    setPhase('guide');
    setGuideStepIndex(-1);
    setWrongCount(0);
    setPrereqWrongCount(0);
    setHintText('');
    setInputMode('guide_intake');
    setIsWriting(false);
    setBoardSteps((prev) =>
      prev.map((s) => ({
        ...s,
        titleRevealed: s.title.length,
        titleComplete: true,
        skeletonRevealed: s.skeleton.length,
        skeletonComplete: true,
        fills: [],
        status: 'pending' as const,
      })),
    );
    setSpeechText(getGuideIntakeSpeech(characterId));
    pulseSpeech(3200);
  }, [clearAnim, characterId, pulseSpeech]);

  const startGuide = useCallback(() => {
    enterGuideIntake();
  }, [enterGuideIntake]);

  const animateFills = useCallback(
    (stepIdx: number, onDone: () => void) => {
      const guide = guideSteps[stepIdx];
      if (!guide) return;

      const fillDefs = guide.fillLines.map((fl, i) => ({
        id: `f${i}`,
        text: fl.text,
        style: fl.style,
        revealed: 0,
        complete: false,
      }));

      setBoardSteps((prev) =>
        prev.map((s, i) => (i === stepIdx ? { ...s, fills: fillDefs } : s)),
      );

      let fillLineIdx = 0;
      let charIdx = 0;

      const tick = () => {
        const line = fillDefs[fillLineIdx];
        if (!line) {
          clearAnim();
          onDone();
          return;
        }
        charIdx += 1;
        setBoardSteps((prev) =>
          prev.map((s, i) => {
            if (i !== stepIdx) return s;
            return {
              ...s,
              fills: s.fills.map((f, fi) => {
                if (fi !== fillLineIdx) return f;
                const full = charIdx >= f.text.length;
                return {
                  ...f,
                  revealed: Math.min(charIdx, f.text.length),
                  complete: full,
                };
              }),
            };
          }),
        );

        if (charIdx >= line.text.length) {
          setBoardSteps((prev) =>
            prev.map((s, i) => {
              if (i !== stepIdx) return s;
              return {
                ...s,
                fills: s.fills.map((f, fi) =>
                  fi === fillLineIdx ? { ...f, justFilled: true } : f,
                ),
              };
            }),
          );
          window.setTimeout(() => {
            setBoardSteps((prev) =>
              prev.map((s, i) => {
                if (i !== stepIdx) return s;
                return {
                  ...s,
                  fills: s.fills.map((f, fi) =>
                    fi === fillLineIdx ? { ...f, justFilled: false } : f,
                  ),
                };
              }),
            );
          }, 1200);
          fillLineIdx += 1;
          charIdx = 0;
        }
      };

      clearAnim();
      setIsWriting(true);
      animTimerRef.current = window.setInterval(tick, FILL_CHAR_MS);
    },
    [clearAnim, guideSteps],
  );

  useImperativeHandle(ref, () => ({ startGuide }), [startGuide]);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  const advanceGuideStep = useCallback(
    (fromIndex: number) => {
      const next = fromIndex + 1;
      if (next >= guideSteps.length) {
        setPhase('guide_done');
        setInputMode('idle');
        setIsSpeaking(true);
        setIsWriting(false);
        setSpeechText(guideSteps[fromIndex].successSpeech);
        setBoardSteps((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
        window.setTimeout(() => setIsSpeaking(false), 3000);
        return;
      }

      setGuideStepIndex(next);
      setWrongCount(0);
      setHintText('');
      setInputMode('guide_answer');
      setBoardSteps((prev) =>
        prev.map((s, i) => ({
          ...s,
          status: i < next ? 'done' : i === next ? 'active' : 'pending',
        })),
      );
      setSpeechText(
        getGuideQuestion(guideSteps[next].id, characterId, guideSteps[next].question),
      );
      pulseSpeech();
    },
    [characterId, pulseSpeech, guideSteps],
  );

  const handleAnnotate = useCallback(
    (label: string) => {
      const replies: Partial<Record<TutorCharacterId, string>> = {
        holmes: `标记「${label}」——关键线索已锁定。`,
        nezha: `圈对了！${label} 这块看清楚就稳了！`,
      };
      setSpeechText(replies[characterId] ?? `你标注了「${label}」，很好！继续对照这个区域读题。`);
      setIsSpeaking(true);
      pulseSpeech(2200);
    },
    [characterId, pulseSpeech],
  );

  const handlePrereqAnswer = (text: string) => {
    const step = guideSteps[guideStepIndex];
    if (!step) return;
    const prereq = jumpPrereq[step.id];
    if (!prereq) {
      enterGuideAnswer(guideStepIndex);
      return;
    }

    setPendingAnswer(text);
    setInputMode('checking');
    setIsSpeaking(false);

    window.setTimeout(() => {
      if (matchPrereqAnswer(text, prereq)) {
        setHintText('');
        setBoardSteps((prev) =>
          prev.map((s, i) => (i < guideStepIndex ? { ...s, status: 'done' as const } : s)),
        );
        enterGuideAnswer(guideStepIndex);
      } else {
        const next = prereqWrongCount + 1;
        if (next >= 2) {
          const fallback = prereq.fallbackStepIndex;
          setSpeechText(getPrereqFallback(characterId, fallback + 1));
          pulseSpeech(2600);
          setBoardSteps((prev) =>
            prev.map((s, i) => ({
              ...s,
              status: i < fallback ? ('done' as const) : i === fallback ? ('active' as const) : ('pending' as const),
              fills: i >= fallback && s.status !== 'done' ? [] : s.fills,
            })),
          );
          window.setTimeout(() => enterGuideAnswer(fallback), 400);
        } else {
          setPrereqWrongCount(next);
          setSpeechText(getPrereqRetry(characterId, prereq.hint));
          if (next >= 1) setHintText(prereq.hint);
          pulseSpeech(2800);
          setInputMode('prereq_confirm');
        }
      }
      setPendingAnswer('');
    }, 700);
  };

  const handleGuideAnswer = (text: string) => {
    const step = guideSteps[guideStepIndex];
    if (!step) return;

    setPendingAnswer(text);
    setInputMode('checking');
    setIsSpeaking(false);
    setDeepThinkingStep(0);

    const checkDelay = deepThinking ? 2400 : 900;
    const stepTimers: number[] = [];

    if (deepThinking) {
      DEEP_THINKING_STEPS.forEach((_, i) => {
        stepTimers.push(
          window.setTimeout(() => setDeepThinkingStep(i), (checkDelay / DEEP_THINKING_STEPS.length) * i),
        );
      });
    }

    window.setTimeout(() => {
      stepTimers.forEach((t) => window.clearTimeout(t));
      setDeepThinkingStep(0);

      if (matchGuideAnswer(text, step)) {
        setHintText('');
        setIsSpeaking(true);
        setSpeechText(step.successSpeech);
        setBoardSteps((prev) =>
          prev.map((s, i) => (i === guideStepIndex ? { ...s, status: 'done' } : s)),
        );
        animateFills(guideStepIndex, () => {
          setIsWriting(false);
          window.setTimeout(() => advanceGuideStep(guideStepIndex), 600);
        });
      } else {
        const next = wrongCount + 1;
        const fb = getWrongFeedback(next, step.hint, characterId);
        setWrongCount(next);
        setSpeechText(fb.speech);
        if (fb.showHint) setHintText(step.hint);
        else if (next < 3) setHintText('');
        pulseSpeech(2500);
        setInputMode('guide_answer');
      }
      setPendingAnswer('');
    }, checkDelay);
  };

  const handleGuideIntake = (text: string) => {
    setInputMode('checking');
    setPendingAnswer(text);
    setIsSpeaking(false);

    window.setTimeout(() => {
      const parsed =
        scriptPack.scriptKey === 'paint-wall'
          ? parseGuideStartStepIndex(text)
          : parseGenericGuideStartStepIndex(text);
      if (parsed != null) {
        setPendingAnswer('');
        startGuideFrom(parsed);
        return;
      }
      setSpeechText(getGuideIntakeUnclear(characterId));
      setIsSpeaking(true);
      pulseSpeech(2800);
      setInputMode('guide_intake');
      setPendingAnswer('');
    }, 700);
  };

  const handleFreeAsk = (text: string) => {
    setInputMode('checking');
    setPendingAnswer(text);
    setIsSpeaking(false);
    window.setTimeout(() => {
      setSpeechText(getFreeAskReply(text, characterId));
      setIsSpeaking(true);
      setInputMode(phase === 'guide' ? 'guide_answer' : 'idle');
      setPendingAnswer('');
    }, deepThinking ? 1800 : 1000);
  };

  const handleSend = (text: string) => {
    if (phase === 'guide_done' && /引导|填数|继续解|深入/.test(text)) {
      enterGuideIntake();
      return;
    }
    if (phase === 'quick') handleFreeAsk(text);
    else if (phase === 'guide' && inputMode === 'guide_intake') handleGuideIntake(text);
    else if (phase === 'guide' && inputMode === 'prereq_confirm') handlePrereqAnswer(text);
    else if (phase === 'guide' && inputMode === 'guide_answer') handleGuideAnswer(text);
    else if (phase === 'guide_done') handleFreeAsk(text);
  };

  const handleRecordingChange = (recording: boolean) => {
    setIsSpeaking(recording);
    if (recording) setIsWriting(false);
  };

  const isGuideLayout = phase === 'guide' || phase === 'guide_done';

  const inputDisabled = inputMode === 'checking';
  const inputPlaceholder =
    phase === 'guide' && inputMode === 'guide_intake'
      ? '说说卡在哪一步，或「从头讲」…'
      : phase === 'guide' && inputMode === 'prereq_confirm'
        ? '确认一下（如「会了」「45.6」）…'
        : phase === 'guide' && inputMode === 'guide_answer'
          ? '写下你的答案或思路…'
          : phase === 'quick'
            ? `边看边问，${theme.name}会继续讲…`
            : phase === 'guide_done'
            ? `向${theme.name}自由提问…`
            : '梳理思路中，请稍候…';

  const speechVisible =
    inputMode === 'checking' ||
    phase === 'guide' ||
    phase === 'guide_done';

  const problemView =
    question != null ? (
      <InteractiveProblemView question={question ?? undefined} onAnnotate={handleAnnotate} />
    ) : (
      mockProblemComponent
    );

  useEffect(() => () => clearAnim(), [clearAnim]);

  return (
    <motion.div
      initial={{ opacity: enterFade ? 0 : 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: enterFade ? 0.45 : 0, ease: 'easeOut' }}
      className={`absolute inset-0 z-[50] flex flex-col overflow-hidden ${theme.pageBg}`}
    >
      <div className={`absolute inset-0 z-0 pointer-events-none ${theme.pageGradient}`} />

      <div className="absolute left-4 top-4 z-50">
        <button
          type="button"
          onClick={onClose}
          className={`interactive-control w-10 h-10 rounded-full border flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors active:scale-95 shadow-sm ${theme.backBtn}`}
          aria-label="返回"
        >
          <ChevronLeft size={22} />
        </button>
      </div>

      <div className={`relative z-40 flex-1 flex flex-col min-h-0 w-full overflow-hidden ${theme.contentBg}`}>
        <div className="flex-1 w-full max-w-[1200px] mx-auto px-4 md:px-8 py-4 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden min-h-0">
          <div
            className={`md:w-[320px] lg:w-[360px] shrink-0 flex flex-col gap-2 min-h-0 ${
              isGuideLayout ? 'md:self-stretch' : ''
            }`}
          >
            <motion.div
              layoutId="captured-problem"
              className={`relative rounded-2xl overflow-hidden shadow-md border bg-white shrink-0 w-full ${
                isGuideLayout ? 'max-h-[36vh] overflow-y-auto custom-scrollbar' : ''
              } ${theme.cardBorder} ring-1 ${theme.cardRing}`}
            >
              <div
                className={`absolute top-2.5 left-2.5 z-10 px-2 py-1 rounded-md border text-[10px] font-bold tracking-wide shadow-sm backdrop-blur-sm ${theme.backBtn}`}
                aria-label="题目区域"
                title="题目区域"
              >
                题目区域
              </div>
              <div className="relative w-full p-3 md:p-4">{problemView}</div>
            </motion.div>
            {isGuideLayout && (
              <SkeletonOutlinePanel
                steps={boardSteps}
                theme={theme}
                activeStepIndex={guideStepIndex}
                variant="guide"
                onStepSelect={phase === 'guide' ? selectGuideStep : undefined}
                className="flex-1 min-h-[120px] md:min-h-0"
              />
            )}
          </div>

          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            <div
              className={`flex-1 min-h-0 ${
                phase === 'quick' || phase === 'quick_done'
                  ? 'overflow-y-auto custom-scrollbar'
                  : 'overflow-hidden flex flex-col'
              }`}
            >
              <ChangETutorStage
                speechText={speechText}
                speechVisible={speechVisible}
                boardSteps={boardSteps}
                isSpeaking={isSpeaking}
                isWriting={isWriting}
                theme={theme}
                boardVariant={isGuideLayout ? 'guide' : 'skeleton'}
                boardScrollable={isGuideLayout}
                boardActiveStepIndex={isGuideLayout ? guideStepIndex : -1}
                questionMeta={scriptPack.meta}
                celebration={phase === 'guide_done'}
                thinkingQuestion={inputMode === 'checking' ? pendingAnswer : undefined}
                deepThinking={deepThinking && phase === 'guide' && inputMode === 'checking'}
                deepThinkingStep={deepThinkingStep}
                hintText={
                  phase === 'guide' && (wrongCount > 0 || prereqWrongCount > 0) ? hintText : undefined
                }
                footer={
                  phase === 'quick_done' ? (
                    <TutorExplainFeedback
                      questionId={question?.id}
                      scriptKey={scriptPack.scriptKey}
                    />
                  ) : undefined
                }
                className={isGuideLayout ? 'flex-1 min-h-0 h-full' : ''}
              />
            </div>

            <div className={`shrink-0 pt-2 mt-1 ${phase !== 'quick_done' ? `border-t ${theme.inputDivider}` : ''}`}>
              {phase === 'quick_done' ? (
                <TutorQuickDoneTip
                  theme={theme}
                  hint={quickDoneHint}
                  onStartGuide={startGuide}
                  onCharacterSelect={setCharacterId}
                  isSpeaking={isSpeaking}
                  isWriting={isWriting}
                />
              ) : (
                <TutorInputBar
                  onSend={handleSend}
                  onRecordingChange={handleRecordingChange}
                  disabled={inputDisabled}
                  placeholder={inputPlaceholder}
                  isSpeaking={isSpeaking}
                  isWriting={isWriting}
                  theme={theme}
                  onCharacterSelect={setCharacterId}
                  voiceFirst={phase === 'guide'}
                  compact
                  className="interactive-control"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
