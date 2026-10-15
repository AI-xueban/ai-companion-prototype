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
  getGuideIntakeSpeech,
  getGuideIntakeUnclear,
} from '../../data/tutorCharacterCopy';
import { getQuickDoneHintLine, type QuickDoneHintLine } from '../../data/tutorQuickDoneHints';
import { AISolveQuestion } from '../../data/aiSolveMockData';
import { TutorExplainFeedback } from './TutorExplainFeedback';
import { TUTOR_VOICE_KEY, useTutorVoice } from '../../hooks/useTutorVoice';

type InputMode = 'idle' | 'guide_intake' | 'prereq_confirm' | 'guide_answer' | 'free_ask' | 'checking';

interface AITutorLayerProps {
  onClose: () => void;
  mockProblemComponent?: React.ReactNode;
  problemContent?: React.ReactNode;
  question?: AISolveQuestion | null;
  onPhaseChange?: (phase: TutorPhase) => void;
  enterFade?: boolean;
}

export interface AITutorLayerHandle {
  startGuide: () => void;
}

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
  { onClose, mockProblemComponent, problemContent, question, onPhaseChange, enterFade = true },
  ref,
) {
  const scriptPack = useMemo(() => getTutorScriptPack(question), [question]);
  const quickSteps = scriptPack.quickSteps;
  const guideSteps = scriptPack.guideSteps;
  const jumpPrereq = useMemo(
    () => (scriptPack.scriptKey === 'paint-wall' ? GUIDE_JUMP_PREREQ : {}),
    [scriptPack.scriptKey],
  );

  const [phase, setPhase] = useState<TutorPhase>('quick_done');
  const [boardSteps, setBoardSteps] = useState<StepBoardView[]>(() => buildInitialSteps(quickSteps));
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

  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    try { return localStorage.getItem(TUTOR_VOICE_KEY) !== 'false'; } catch { return true; }
  });
  const [recording, setRecording] = useState(false);
  const [replyRevision, setReplyRevision] = useState(0);
  const replyTimerRef = useRef<number | undefined>(undefined);
  const replyVersionRef = useRef(0);
  const checkingModeRef = useRef<InputMode>('idle');
  const planText = useMemo(() => quickSteps.map((step, index) =>
    '第' + (index + 1) + '步，' + step.title + '。' + step.skeleton,
  ).join('\n'), [quickSteps]);
  const voiceText = phase === 'quick_done' ? speechText || planText : speechText;
  const voice = useTutorVoice(voiceText, voiceEnabled, recording, replyRevision);
  const toggleVoice = () => {
    if (voiceEnabled && !voice.playing) {
      voice.replay();
      return;
    }
    const next = !voiceEnabled;
    if (!next) voice.stop();
    setVoiceEnabled(next);
    try { localStorage.setItem(TUTOR_VOICE_KEY, String(next)); } catch { /* Keep session preference. */ }
  };
  const theme = getTutorCharacter(characterId);
  useEffect(() => () => {
    replyVersionRef.current += 1;
    if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
  }, []);

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
    replyVersionRef.current += 1;
    if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
    setPhase('quick_done');
    setBoardSteps(buildInitialSteps(quickSteps).map(step => ({
      ...step, titleRevealed: step.title.length, titleComplete: true,
      skeletonRevealed: step.skeleton.length, skeletonComplete: true, status: 'done' as const,
    })));
    setGuideStepIndex(-1);
    setSpeechText('');
    setIsSpeaking(false);
    setIsWriting(false);
    setInputMode('idle');
    setPendingAnswer('');
    setHintText('');
    setWrongCount(0);
    setPrereqWrongCount(0);
    setQuickDoneHint(getQuickDoneHintLine());
  }, [scriptPack.scriptKey, quickSteps, clearAnim]);

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
    replyVersionRef.current += 1;
    if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
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
    checkingModeRef.current = 'prereq_confirm';
    const version = ++replyVersionRef.current;
    setInputMode('checking');
    setIsSpeaking(false);

    window.setTimeout(() => {
      if (version !== replyVersionRef.current) return;
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
          window.setTimeout(() => {
            if (version === replyVersionRef.current) enterGuideAnswer(fallback);
          }, 400);
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
    checkingModeRef.current = 'guide_answer';
    const version = ++replyVersionRef.current;
    setInputMode('checking');
    setIsSpeaking(false);
    setDeepThinkingStep(0);

    const checkDelay = deepThinking ? 2400 : 900;
    const stepTimers: number[] = [];

    if (deepThinking) {
      DEEP_THINKING_STEPS.forEach((_, i) => {
        stepTimers.push(
          window.setTimeout(() => {
            if (version === replyVersionRef.current) setDeepThinkingStep(i);
          }, (checkDelay / DEEP_THINKING_STEPS.length) * i),
        );
      });
    }

    window.setTimeout(() => {
      stepTimers.forEach((t) => window.clearTimeout(t));
      if (version !== replyVersionRef.current) return;
      setDeepThinkingStep(0);

      if (matchGuideAnswer(text, step)) {
        setHintText('');
        setIsSpeaking(true);
        setSpeechText(step.successSpeech);
        setBoardSteps((prev) =>
          prev.map((s, i) => (i === guideStepIndex ? { ...s, status: 'done' } : s)),
        );
        animateFills(guideStepIndex, () => {
          if (version !== replyVersionRef.current) return;
          setIsWriting(false);
          window.setTimeout(() => {
            if (version === replyVersionRef.current) advanceGuideStep(guideStepIndex);
          }, 600);
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
    checkingModeRef.current = 'guide_intake';
    const version = ++replyVersionRef.current;
    setInputMode('checking');
    setPendingAnswer(text);
    setIsSpeaking(false);

    window.setTimeout(() => {
      if (version !== replyVersionRef.current) return;
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
    const version = ++replyVersionRef.current;
    checkingModeRef.current = phase === 'guide' ? 'guide_answer' : 'idle';
    if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
    setInputMode('checking');
    setPendingAnswer(text);
    setIsSpeaking(false);
    replyTimerRef.current = window.setTimeout(() => {
      if (version !== replyVersionRef.current) return;
      setSpeechText(getFreeAskReply(text, characterId));
      setReplyRevision(value => value + 1);
      setIsSpeaking(true);
      setInputMode(phase === 'guide' ? 'guide_answer' : 'idle');
      setPendingAnswer('');
    }, deepThinking ? 1800 : 1000);
  };

  const interruptTutorReply = () => {
    if (inputMode === 'checking' || isWriting) {
      replyVersionRef.current += 1;
      if (replyTimerRef.current) window.clearTimeout(replyTimerRef.current);
      clearAnim();
      setInputMode(inputMode === 'checking' ? checkingModeRef.current : inputMode);
      setIsWriting(false);
      setPendingAnswer('');
      setDeepThinkingStep(0);
      if (isWriting && phase === 'guide' && guideStepIndex >= 0) {
        setBoardSteps(prev => prev.map((step, index) => index === guideStepIndex
          ? { ...step, status: 'active', fills: [] }
          : step));
      }
    }
    voice.stop();
  };

  const handleSend = (text: string) => {
    const mode = inputMode === 'checking' ? checkingModeRef.current : inputMode;
    interruptTutorReply();
    if (phase === 'guide_done' && /引导|填数|继续解|深入/.test(text)) {
      enterGuideIntake();
      return;
    }
    if (phase === 'quick' || phase === 'quick_done') handleFreeAsk(text);
    else if (phase === 'guide' && mode === 'guide_intake') handleGuideIntake(text);
    else if (phase === 'guide' && mode === 'prereq_confirm') handlePrereqAnswer(text);
    else if (phase === 'guide' && mode === 'guide_answer') handleGuideAnswer(text);
    else if (phase === 'guide_done') handleFreeAsk(text);
  };

  const handleRecordingChange = (recording: boolean) => {
    setRecording(recording);
    if (recording) interruptTutorReply();
    setIsSpeaking(false);
  };

  const isGuideLayout = phase === 'guide' || phase === 'guide_done';

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
            : phase === 'quick_done' ? '输入追问，或点击麦克风…' : '输入或语音提问，可打断当前讲解…';

  const speechVisible =
    inputMode === 'checking' ||
    phase === 'guide' ||
    phase === 'guide_done' || (phase === 'quick_done' && Boolean(speechText));

  const problemView = problemContent ?? (
    question != null ? (
      <InteractiveProblemView question={question ?? undefined} onAnnotate={handleAnnotate} />
    ) : (
      mockProblemComponent
    ));

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
            <div className="shrink-0 flex items-center justify-between gap-3 pb-2">
              <span className="text-sm font-bold text-slate-700">{isGuideLayout ? '1对1讲题' : '解题方案'}</span>
              <button type="button"
                aria-label={!voiceEnabled ? '开启语音播报' : voice.playing ? '正在播报，点击静音' : '重新播放语音'}
                title={!voiceEnabled ? '开启播报' : voice.playing ? '点击静音' : '从头播放'}
                disabled={recording}
                onClick={toggleVoice}
                className={`interactive-control inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 transition-colors disabled:opacity-40 ${voiceEnabled ? 'bg-violet-50 text-brand hover:bg-violet-100' : 'text-slate-400 hover:bg-slate-100'}`}>
                <svg aria-hidden="true" width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5 6 9H3v6h3l5 4V5Z" />
                    <path d="M15.5 8.5a5 5 0 0 1 0 7">
                      {voiceEnabled && voice.playing && <animate attributeName="opacity" values="0.25;1;0.25" dur="1s" repeatCount="indefinite" />}
                    </path>
                    <path d="M19 5a10 10 0 0 1 0 14">
                      {voiceEnabled && voice.playing && <animate attributeName="opacity" values="0.15;0.15;1;0.15" dur="1s" repeatCount="indefinite" />}
                    </path>
                  {!voiceEnabled && <path d="m3 3 18 18" />}
                </svg>
                <span className="text-xs">播报</span>
              </button>
            </div>
            {voice.error && <p role="status" className="shrink-0 pb-2 text-xs text-slate-500">{voice.error}</p>}
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
                isSpeaking={voice.playing}
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
                  isSpeaking={voice.playing}
                  isWriting={isWriting}
                />
              ) : (
                <TutorInputBar
                  onSend={handleSend}
                  onRecordingChange={handleRecordingChange}
                  placeholder={inputPlaceholder}
                  isSpeaking={voice.playing}
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
