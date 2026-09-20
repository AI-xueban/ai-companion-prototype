import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ChevronLeft, ChevronRight, Clock, PenTool, X, 
    RotateCcw, Check, Pen, LayoutTemplate, Eraser, Move,
    PauseCircle, LogOut
} from 'lucide-react';
import { SplitLayout } from './components/SplitLayout';
import { SelectionCard } from './components/SelectionCard';
import { QuizStem, countStemGaps } from './components/QuizStem';
import { XkwHtmlStem } from './components/XkwHtmlStem';
import { VirtualNumPad } from './components/VirtualNumPad';
import { ListeningPlayer } from './components/ListeningPlayer';
import { QuestionBadges, DifficultyStars } from './components/QuestionBadges';
import { QuizNavHeader, QuestionNavStatus } from './components/QuizNavHeader';
import { QuizInteractionToolbar } from './components/QuizInteractionToolbar';
import { BlankAnswerSlots, type AnswerInputMode } from './components/BlankAnswerSlots';
import { QuizReviewPanel } from './components/QuizReviewPanel';
import { DrawingCanvas, DrawingCanvasHandle } from './DrawingCanvas';
import { PaperSourceImageControls } from './components/PaperSourceImageControls';
import { PaperSourceAnalysisPanel, PaperSelfGrade } from './components/PaperSourceAnalysisPanel';
import { CognitiveState } from '../../data/questionBank';
import { QuestionFeedbackEntry } from './components/QuestionFeedbackEntry';
import { QuestionFeedbackScene } from '../../types/questionFeedback';
import { MistakeReasonPicker } from './components/MistakeReasonPicker';
import { MistakeReasonKey } from '../../data/mistakeReasons';
import { getMistakeReasons, recordMistakeReasons } from '../../services/mistakeReasonService';

// --- Types (Preserved & Enhanced) ---
export type QuizMode = 'practice' | 'exam' | 'mistake_review' | 'analysis' | 'browse';

export interface UniversalQuizQuestion {
    id: string;
    type: 'single_choice' | 'multiple_choice' | 'fill_in_blank' | 'true_false' | string;
    content: {
        stem: string;
        stemImages?: string[];
        originalImageUrl?: string;
        presetAnswerDraftUrl?: string;
        htmlStem?: string;
        htmlExplanation?: string;
        manualGradeReferenceImageUrl?: string;
        options?: string[]; // For choice questions
        audioUrl?: string;
        transcript?: string;
        examRules?: {
            allowSeek?: boolean;
            maxReplays?: number | null;
            subtitlesAllowed?: boolean;
        };
        subQuestions?: {
            question: string;
            options?: string[];
            answer?: string;
            manualGrade?: boolean;
        }[];
        manualGradeBlankIndex?: number;
    };
    result?: {
        correctAnswer: string | string[]; // For blanks: array of strings matching gaps
        explanation: string;
    };
    subject?: string; // optional: 来源学科
    userAnswer?: string | string[];
    tags?: string[];
    difficulty?: number;
    category?: string;
    knowledgePoints?: string[];
    cognitiveState?: CognitiveState;
    bookmarked?: boolean;
    similarIds?: string[];
}

export interface QuizSessionReviewItem {
    isCorrect: boolean;
    userAnswer?: string | string[];
    reviewed?: boolean;
}

export type QuizSubmitPayload = {
    answers: Record<string, any>;
    paperDraftSnapshots?: Record<string, string | null>;
    paperSelfGrades?: Record<string, PaperSelfGrade>;
};

export function normalizeQuizSubmitPayload(payload: any): QuizSubmitPayload {
    if (payload && typeof payload === 'object' && payload.answers != null) {
        return {
            answers: payload.answers,
            paperDraftSnapshots: payload.paperDraftSnapshots,
            paperSelfGrades: payload.paperSelfGrades,
        };
    }
    return { answers: (payload ?? {}) as Record<string, any> };
}

interface UniversalQuizViewProps {
    mode: QuizMode;
    questions: UniversalQuizQuestion[];
    initialQuestionIndex?: number;
    onClose: (meta?: { hasAnswered?: boolean }) => void;
    onSubmit?: (results: any) => void;
    themeColor?: string;
    singleQuestionMode?: boolean;
    variant?: 'mistake-daily' | 'stepping'; // 错题-每日攻克 / 动态推题
    sessionReview?: Record<string, QuizSessionReviewItem>;
    onStartSimilarPractice?: (question: UniversalQuizQuestion) => void;
    onGoToSummary?: () => void;
    showSummaryTab?: boolean;
    onSteppingNext?: (answers: Record<string, any>) => void;
    onOpenAITutor?: () => void;
}

interface QuizConfirmDialogProps {
    isOpen: boolean;
    icon: React.ReactNode;
    title: string;
    description?: string;
    cancelLabel: string;
    confirmLabel: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmFirst?: boolean;
}

const QuizConfirmDialog: React.FC<QuizConfirmDialogProps> = ({
    isOpen,
    icon,
    title,
    description,
    cancelLabel,
    confirmLabel,
    onCancel,
    onConfirm,
    confirmFirst = false,
}) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[170] bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center px-6"
                onClick={onCancel}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0, y: 12 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.92, opacity: 0, y: 12 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className="relative w-full max-w-[360px] rounded-[28px] bg-white px-7 pb-6 pt-12 shadow-2xl border border-slate-100 text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-16 h-16 rounded-[18px] bg-gradient-to-br from-[#A996FF] to-[#6F55F6] shadow-lg shadow-indigo-500/25 flex items-center justify-center text-white rotate-6">
                            <div className="-rotate-6">{icon}</div>
                        </div>
                    </div>
                    <div className="text-[15px] font-black text-slate-800 leading-6 whitespace-pre-line">
                        {title}
                    </div>
                    {description && (
                        <div className="mt-2 text-xs font-semibold text-slate-500 leading-5">
                            {description}
                        </div>
                    )}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                        {confirmFirst ? (
                            <>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className="py-3 rounded-full bg-indigo-50 text-indigo-500 text-sm font-black shadow-sm active:scale-95 transition"
                                >
                                    {confirmLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="py-3 rounded-full bg-[#6F55F6] text-white text-sm font-black shadow-lg shadow-indigo-500/25 active:scale-95 transition"
                                >
                                    {cancelLabel}
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    className="py-3 rounded-full bg-indigo-50 text-indigo-500 text-sm font-black shadow-sm active:scale-95 transition"
                                >
                                    {cancelLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className="py-3 rounded-full bg-[#6F55F6] text-white text-sm font-black shadow-lg shadow-indigo-500/25 active:scale-95 transition"
                                >
                                    {confirmLabel}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

// --- Main Component ---
export const UniversalQuizView: React.FC<UniversalQuizViewProps> = ({
    mode,
    questions,
    initialQuestionIndex = 0,
    onClose,
    onSubmit,
    themeColor = 'indigo',
    singleQuestionMode = false,
    variant,
    sessionReview,
    onStartSimilarPractice,
    onGoToSummary,
    showSummaryTab = false,
    onSteppingNext,
    onOpenAITutor,
}) => {
    const isMistakeDaily = variant === 'mistake-daily';
    const isStepping = variant === 'stepping';
    const isReviewMode = mode === 'analysis' || Boolean(sessionReview);
    // Core State
    const [currentIndex, setCurrentIndex] = useState(initialQuestionIndex);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(mode === 'exam' || mode === 'practice');
    const [isPaused, setIsPaused] = useState(false);
    
    // UI State
    const [isDraftMode, setIsDraftMode] = useState(false);
    const [draftTool, setDraftTool] = useState<'pen' | 'eraser'>('pen');
    const [penColor, setPenColor] = useState<string>('#7C3AED');
    const [penSize, setPenSize] = useState<number>(3);
    const [eraserSize, setEraserSize] = useState<number>(12);
    const draftCanvasRef = useRef<DrawingCanvasHandle | null>(null);
    const paperAnswerCanvasRef = useRef<DrawingCanvasHandle | null>(null);
    const paperAnswerAreaRef = useRef<HTMLDivElement | null>(null);
    const [paperAnswerCanvasSize, setPaperAnswerCanvasSize] = useState({ width: 320, height: 200 });
    const [paperDraftSnapshots, setPaperDraftSnapshots] = useState<Record<string, string | null>>({});
    const [paperSelfGrades, setPaperSelfGrades] = useState<Record<string, PaperSelfGrade>>({});
    const [activeGapIndex, setActiveGapIndex] = useState<number | null>(0);
    const [answerInputMode, setAnswerInputMode] = useState<AnswerInputMode>('handwrite');
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [showProgressPanel, setShowProgressPanel] = useState(false);
    const [showTimerSheet, setShowTimerSheet] = useState(false);
    const [showPauseConfirm, setShowPauseConfirm] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    // Mistake-daily: 记录已提交题目
    const [submittedMap, setSubmittedMap] = useState<Record<string, boolean>>({});
    const [mistakeReasonMap, setMistakeReasonMap] = useState<Record<string, MistakeReasonKey[]>>({});

    const currentQ = questions[currentIndex];
    const totalQ = questions.length;
    const isLast = currentIndex === totalQ - 1;
    const showProgressUI = !singleQuestionMode && totalQ > 1 && !isMistakeDaily;
    const hasAudio = Boolean(currentQ?.content?.audioUrl);
    const listeningRules = currentQ?.content?.examRules;
    const listeningTranscript = currentQ?.content?.transcript;
    const isReadingComp = currentQ.type === 'reading_comp';
    const readingSubQuestions = isReadingComp ? currentQ.content.subQuestions || [] : [];
    const isChineseAccumulation = currentQ.subject === 'chinese' && currentQ.type === 'accumulation';
    const isTrueFalse = currentQ.type === 'true_false';
    const isBlankType = [
        'fill_in_blank',
        'listening_blank',
        'cloze_choice',
        'sentence_completion',
        'dialogue_fill',
        'short_cloze'
    ].includes(currentQ.type);
    const hasSubQuestions = Array.isArray(currentQ?.content?.subQuestions) && currentQ.content.subQuestions.length > 0;
    const isPaperSourceQuestion = Boolean(currentQ.content.originalImageUrl);
    const showSubQuestions = hasSubQuestions && !isPaperSourceQuestion;
    const preferSplitLayout = isPaperSourceQuestion;
    const splitRatio = isPaperSourceQuestion ? 0.55 : currentQ.type === 'fill_in_blank' ? 0.5 : 0.6;
    const paperSourceSubmitted = isPaperSourceQuestion && !!submittedMap[currentQ.id];
    const paperSourceAnswering = isPaperSourceQuestion && !paperSourceSubmitted && !isReviewMode;
    const currentSubmitted = Boolean(submittedMap[currentQ.id]);

    useEffect(() => {
        setShowAnalysis(currentSubmitted);
        setIsDraftMode(false);
        setActiveGapIndex(isBlankType ? 0 : null);
    }, [currentQ.id, currentSubmitted, isBlankType]);

    const blankGapCount = useMemo(() => {
        if (!isBlankType || showSubQuestions || isPaperSourceQuestion) return 0;
        const fromStem = countStemGaps(currentQ.content.stem || '');
        if (fromStem > 0) return fromStem;
        if (Array.isArray(currentQ.result?.correctAnswer)) return currentQ.result!.correctAnswer.length;
        return 1;
    }, [isBlankType, showSubQuestions, isPaperSourceQuestion, currentQ]);

    const blankGapValues = useMemo(() => {
        const raw = answers[currentQ.id];
        if (Array.isArray(raw)) return raw.map((v) => String(v ?? ''));
        if (typeof raw === 'string') return [raw];
        return Array.from({ length: blankGapCount }, () => '');
    }, [answers, currentQ.id, blankGapCount]);

    useEffect(() => {
        if (!paperSourceAnswering) return;
        const el = paperAnswerAreaRef.current;
        if (!el) return;
        const updateSize = () => {
            const { width, height } = el.getBoundingClientRect();
            if (width > 0 && height > 0) {
                setPaperAnswerCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
            }
        };
        updateSize();
        const ro = new ResizeObserver(updateSize);
        ro.observe(el);
        return () => ro.disconnect();
    }, [paperSourceAnswering, currentQ.id]);

    const getPaperSourceCorrectAnswer = () => {
        const correct = currentQ.result?.correctAnswer;
        if (Array.isArray(correct)) return correct.join('；');
        return (correct as string) ?? '—';
    };

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            if (isTimerRunning) setElapsedTime(p => p + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [isTimerRunning]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const buildSubmitPayload = (): QuizSubmitPayload => {
        const qId = currentQ.id;
        let snapshots = paperDraftSnapshots;
        if (isPaperSourceQuestion) {
            const dataUrl = paperAnswerCanvasRef.current?.getDataUrl() ?? null;
            const presetDraft = currentQ.content.presetAnswerDraftUrl ?? null;
            const snapshot = dataUrl || presetDraft;
            snapshots = { ...paperDraftSnapshots, [qId]: snapshot };
        }
        return {
            answers,
            paperDraftSnapshots: snapshots,
            paperSelfGrades,
        };
    };

    // Navigation
    const handleNext = () => {
        if (isLast) {
            onSubmit?.(buildSubmitPayload());
        } else {
            setCurrentIndex(prev => prev + 1);
            setActiveGapIndex(null); // Reset focus
        }
    };
    
    const handlePrev = () => {
        if (isMistakeDaily) return; // 禁用上一题
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setActiveGapIndex(null);
        }
    };

    // Utility: determine if a question is answered
    const isQuestionAnswered = (qId: string) => {
        const val = answers[qId];
        if (val === undefined || val === null) return false;
        if (Array.isArray(val)) {
            return val.some(v => typeof v === 'string' ? v.trim() !== '' : !!v);
        }
        if (typeof val === 'string') return val.trim() !== '';
        return true;
    };

    const handleJumpToQuestion = (idx: number) => {
        if (isMistakeDaily) return; // 禁用跳题
        setCurrentIndex(idx);
        setActiveGapIndex(null);
        setShowProgressPanel(false);
    };

    const handlePause = () => {
        setIsTimerRunning(false);
        setIsPaused(true);
        setShowPauseConfirm(false);
    };

    const handleResume = () => {
        setIsTimerRunning(true);
        setIsPaused(false);
    };

    const handleExit = () => {
        setShowExitConfirm(false);
        onClose({ hasAnswered: questions.some((q) => isQuestionAnswered(q.id)) });
    };

    const handleClearDraft = () => {
        if (paperSourceAnswering) {
            paperAnswerCanvasRef.current?.clearCanvas();
            return;
        }
        draftCanvasRef.current?.clearCanvas();
    };

    const handlePaperSelfGrade = (grade: PaperSelfGrade) => {
        setPaperSelfGrades((prev) => ({ ...prev, [currentQ.id]: grade }));
    };

    // Mistake-daily / stepping: 判题与提交
    const isAnswerCorrect = (q: UniversalQuizQuestion, userAns: any) => {
        if (userAns === undefined || userAns === null) return false;
        const correct = q.result?.correctAnswer;
        if (Array.isArray(correct)) {
            const ua = Array.isArray(userAns) ? userAns : [userAns];
            return JSON.stringify(ua.map(String)) === JSON.stringify(correct.map(String));
        }
        if (typeof correct === 'string') {
            if (Array.isArray(userAns)) return userAns.map(String).includes(correct);
            return String(userAns).trim() === correct;
        }
        return false;
    };

    const advanceMistakeDaily = () => {
        const qId = currentQ.id;
        if (isPaperSourceQuestion) {
            const dataUrl = paperAnswerCanvasRef.current?.getDataUrl() ?? null;
            setPaperDraftSnapshots((prev) => ({ ...prev, [qId]: dataUrl }));
        }
        setCurrentIndex((prev) => prev + 1);
        setActiveGapIndex(null);
    };

    const handleMistakeDailyFinalSubmit = () => {
        const payload = buildSubmitPayload();
        if (isPaperSourceQuestion) {
            setPaperDraftSnapshots(payload.paperDraftSnapshots ?? {});
        }
        onSubmit?.(payload);
    };

    const handleSubmitCurrent = () => {
        const qId = currentQ.id;
        const payload = buildSubmitPayload();
        if (isPaperSourceQuestion) {
            setPaperDraftSnapshots(payload.paperDraftSnapshots ?? {});
        }
        setSubmittedMap(prev => ({ ...prev, [qId]: true }));
        if (isStepping) {
            setShowAnalysis(true);
        }
    };

    const getQuestionNavStatus = (qId: string, idx: number): QuestionNavStatus => {
        if (idx === currentIndex) return 'current';
        const review = sessionReview?.[qId];
        if (review) {
            if (review.reviewed && !review.isCorrect) return 'reviewed';
            return review.isCorrect ? 'correct' : 'wrong';
        }
        if (submittedMap[qId]) {
            return isAnswerCorrect(questions[idx], answers[qId]) ? 'correct' : 'wrong';
        }
        if (isQuestionAnswered(qId)) return 'answered';
        return 'default';
    };

    const navItems = useMemo(
        () =>
            questions.map((q, idx) => ({
                id: q.id,
                index: idx,
                status: getQuestionNavStatus(q.id, idx),
            })),
        [questions, currentIndex, sessionReview, submittedMap, answers],
    );

    const unansweredCount = useMemo(
        () => questions.filter((q) => !isQuestionAnswered(q.id)).length,
        [questions, answers],
    );

    const submitCurrentFlow = () => {
        if (showProgressUI && isLast && unansweredCount > 0) {
            setShowSubmitConfirm(true);
            return;
        }
        handleNext();
    };

    const handlePrimaryAction = () => {
        if (isReviewMode) {
            if (isLast) {
                onGoToSummary?.();
                if (!onGoToSummary) onClose();
            } else {
                setCurrentIndex((prev) => prev + 1);
                setActiveGapIndex(null);
            }
            return;
        }
        if (isMistakeDaily && !isStepping) {
            if (isLast) {
                const canSubmit = isPaperSourceQuestion || isQuestionAnswered(currentQ.id);
                if (!canSubmit) return;
                handleMistakeDailyFinalSubmit();
            } else {
                advanceMistakeDaily();
            }
            return;
        }
        if (isStepping) {
            if (!submittedMap[currentQ.id]) {
                handleSubmitCurrent();
            } else if (onSteppingNext) {
                onSteppingNext(answers);
            } else {
                handleNext();
            }
            return;
        }
        if (showProgressUI) {
            submitCurrentFlow();
            return;
        }
        if (onSubmit) onSubmit(answers);
        else onClose();
    };

    const primaryActionMeta = useMemo(() => {
        if (isReviewMode) {
            return {
                label: isLast ? '返回总结' : '下一题',
                variant: isLast ? ('success' as const) : ('default' as const),
                disabled: false,
                showPrimaryAction: true,
            };
        }
        if (isMistakeDaily && !isStepping) {
            if (isLast) {
                const canSubmit = isPaperSourceQuestion || isQuestionAnswered(currentQ.id);
                return { label: '提交', variant: 'default' as const, disabled: !canSubmit, showPrimaryAction: true };
            }
            return { label: '下一题', variant: 'default' as const, disabled: false, showPrimaryAction: true };
        }
        if (isStepping) {
            if (!submittedMap[currentQ.id]) {
                const canSubmit = isPaperSourceQuestion || isQuestionAnswered(currentQ.id);
                return { label: '提交', variant: 'default' as const, disabled: !canSubmit, showPrimaryAction: true };
            }
            return { label: '下一题', variant: 'default' as const, disabled: false, showPrimaryAction: true };
        }
        if (showProgressUI) {
            return {
                label: isLast ? '提交试卷' : '下一题',
                variant: isLast ? ('success' as const) : ('default' as const),
                disabled: false,
                showPrimaryAction: true,
            };
        }
        return { label: '完成本题', variant: 'default' as const, disabled: false, showPrimaryAction: true };
    }, [isReviewMode, isMistakeDaily, isStepping, submittedMap, currentQ.id, isLast, showProgressUI, answers, isPaperSourceQuestion, totalQ]);

    const canJumpQuestions = isReviewMode || (showProgressUI && !isMistakeDaily && !isStepping);

    const handleNavSelect = (idx: number) => {
        if (!canJumpQuestions) return;
        setCurrentIndex(idx);
        setActiveGapIndex(null);
    };

    const handleBackPress = () => {
        if (mode === 'browse') {
            onClose();
            return;
        }
        setShowExitConfirm(true);
    };

    const reviewUserAnswer = sessionReview?.[currentQ.id]?.userAnswer ?? currentQ.userAnswer ?? answers[currentQ.id];
    const reviewIsCorrect = sessionReview?.[currentQ.id]?.isCorrect ?? isAnswerCorrect(currentQ, reviewUserAnswer);
    const feedbackScene = useMemo((): QuestionFeedbackScene => {
        if (isPaperSourceQuestion) return 'paper';
        if (isMistakeDaily || mode === 'mistake_review') return 'mistake';
        if (isStepping) return 'stepping';
        if (isReviewMode) return 'review';
        return 'practice';
    }, [isPaperSourceQuestion, isMistakeDaily, mode, isStepping, isReviewMode]);
    const currentMistakeReasons = mistakeReasonMap[currentQ.id] ?? getMistakeReasons(currentQ.id);
    const handleMistakeReasonSelect = (reasons: MistakeReasonKey[]) => {
        recordMistakeReasons(currentQ.id, reasons);
        setMistakeReasonMap((prev) => ({ ...prev, [currentQ.id]: reasons }));
    };
    const currentAnswerWrong = !isAnswerCorrect(currentQ, answers[currentQ.id]);

    // Mistake-daily: 当前题是否应即时反馈
    const showImmediate = (isMistakeDaily || isStepping) && submittedMap[currentQ.id];

    // 填空题逐空判对错
    const isGapCorrect = (q: UniversalQuizQuestion, gapIndex: number, userAns: any) => {
        const correct = q.result?.correctAnswer;
        if (Array.isArray(correct)) {
            return String((userAns ?? '')).trim() === String(correct[gapIndex] ?? '').trim();
        }
        if (typeof correct === 'string') {
            // 单空也视为第 0 个
            return gapIndex === 0 && String((userAns ?? '')).trim() === correct.trim();
        }
        return false;
    };

    // Answer Handlers
    const handleChoiceSelect = (option: string) => {
        if (mode === 'analysis' || isReviewMode) return;
        
        const qId = currentQ.id;
        
        if (currentQ.type === 'multiple_choice') {
            const current = (answers[qId] as string[]) || [];
            if (current.includes(option)) {
                setAnswers(prev => ({ ...prev, [qId]: current.filter(o => o !== option) }));
            } else {
                setAnswers(prev => ({ ...prev, [qId]: [...current, option] }));
            }
        } else {
            // Single choice / True False
            setAnswers(prev => ({ ...prev, [qId]: option }));
        }
    };

    const handleGapInput = (val: string) => {
        if (activeGapIndex === null) return;
        
        const qId = currentQ.id;
        const currentGaps = (answers[qId] as string[]) || [];
        const newGaps = [...currentGaps];
        while (newGaps.length <= activeGapIndex) newGaps.push("");
        
        const currentVal = newGaps[activeGapIndex] || "";
        
        if (val === 'BACKSPACE') {
            newGaps[activeGapIndex] = currentVal.slice(0, -1);
        } else {
            newGaps[activeGapIndex] = currentVal + val;
        }
        
        setAnswers(prev => ({ ...prev, [qId]: newGaps }));
    };

    const handleGapValueSet = (idx: number, value: string) => {
        const qId = currentQ.id;
        const currentGaps = (answers[qId] as string[]) || [];
        const newGaps = [...currentGaps];
        while (newGaps.length <= idx) newGaps.push('');
        newGaps[idx] = value;
        setAnswers((prev) => ({ ...prev, [qId]: newGaps }));
        setActiveGapIndex(idx);
    };

    // For sub-questions (grouped listening) text input handler
    const handleSubQuestionInput = (idx: number, val: string) => {
        const qId = currentQ.id;
        const current = (answers[qId] as string[]) || [];
        const next = [...current];
        while (next.length <= idx) next.push('');
        next[idx] = val;
        setAnswers(prev => ({ ...prev, [qId]: next }));
    };

    // --- Renderers ---

    const renderLeftPane = () => (
        <div className={`h-full flex flex-col ${isPaperSourceQuestion ? 'p-3 md:p-4' : 'p-4 md:p-5'}`}>
                <div className="flex-1 max-w-2xl mx-auto w-full space-y-3.5">
                {!isPaperSourceQuestion && (
                <div className="flex items-start justify-between gap-3">
                  <QuestionBadges
                    typeLabel={
                        currentQ.type === 'single_choice' ? '单选题' : 
                        currentQ.type === 'multiple_choice' ? '多选题' :
                        currentQ.type === 'true_false' ? '判断题' :
                        currentQ.type === 'fill_in_blank' ? '填空题' :
                        currentQ.type?.startsWith('listening') ? '听力题' : '题目'
                    }
                    category={currentQ.category || 'typical'}
                    knowledgePoints={[]}
                    showDifficultyStars={false}
                    typeClassName="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100"
                    categoryClassName="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100"
                  />
                  <DifficultyStars level={currentQ.difficulty ?? 2} size={12} />
                </div>
                )}

                {/* Listening Player on left pane for better context */}
                {hasAudio && currentQ.content.audioUrl && (
                    <div className="mb-2">
                        <ListeningPlayer
                            audioUrl={currentQ.content.audioUrl}
                            transcript={listeningTranscript}
                            mode={isReviewMode ? 'analysis' : mode}
                            themeColor={themeColor}
                            examRules={
                                isReviewMode
                                    ? { allowSeek: true, maxReplays: null, subtitlesAllowed: true }
                                    : listeningRules
                            }
                            title="听力音频"
                        />
                    </div>
                )}

                {/* Unified stem — 轻量展示，内联空回填 */}
                <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-1">
                    {isReadingComp && (
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">阅读材料</div>
                    )}
                    <div className={`${isReadingComp ? 'text-[13px] leading-6 text-slate-800 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-3 shadow-sm' : ''}`}>
                        {isReadingComp ? (
                            currentQ.content.stem
                        ) : currentQ.content.htmlStem ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                              <XkwHtmlStem html={currentQ.content.htmlStem} />
                            </div>
                        ) : (
                            <QuizStem
                                content={isPaperSourceQuestion ? '' : currentQ.content.stem}
                                images={currentQ.content.stemImages}
                                highlightIndex={activeGapIndex}
                                gapAnswers={isBlankType ? blankGapValues : undefined}
                                onGapClick={(idx) => {
                                    if (showImmediate || showAnalysis) return;
                                    setActiveGapIndex(idx);
                                }}
                            />
                        )}
                    </div>
                </div>

                {isPaperSourceQuestion && currentQ.content.originalImageUrl && (
                    <div className="flex justify-end -mt-2">
                        <PaperSourceImageControls imageUrl={currentQ.content.originalImageUrl} />
                    </div>
                )}
            </div>
        </div>
    );

    const renderRightPane = () => (
        <div className={`h-full flex flex-col relative ${isPaperSourceQuestion ? 'p-3 md:p-4' : 'p-3'}`}>
            <div className={`flex-1 min-h-0 flex flex-col ${isPaperSourceQuestion ? '' : 'rounded-2xl border border-violet-100/80 bg-white shadow-[0_8px_24px_rgba(99,102,241,0.06)] p-3'}`}>
            {!isReviewMode && !paperSourceSubmitted && (
                <div className="shrink-0 mb-2.5">
                    <QuizInteractionToolbar
                        elapsedLabel={formatTime(elapsedTime)}
                        onTimerClick={() => setShowTimerSheet(true)}
                        isDraftMode={isDraftMode}
                        onToggleDraft={() => setIsDraftMode(!isDraftMode)}
                        hideDraftToggle={paperSourceAnswering}
                        showAnswerInputModes={isBlankType && !showSubQuestions && !isPaperSourceQuestion}
                        answerInputMode={answerInputMode}
                        onAnswerInputModeChange={(mode) => {
                            setAnswerInputMode(mode);
                            if (activeGapIndex === null && blankGapCount > 0) setActiveGapIndex(0);
                        }}
                        showInkTools={
                            isDraftMode
                            || (isBlankType && !showSubQuestions && answerInputMode === 'handwrite')
                            || paperSourceAnswering
                        }
                        draftTool={draftTool}
                        onDraftToolChange={setDraftTool}
                        penColor={penColor}
                        onPenColorChange={setPenColor}
                        penSize={penSize}
                        onPenSizeChange={setPenSize}
                        onClearDraft={handleClearDraft}
                    />
                </div>
            )}

            {isReviewMode ? (
                <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm">
                    <QuizReviewPanel
                        question={currentQ}
                        userAnswer={reviewUserAnswer}
                        isCorrect={reviewIsCorrect}
                        feedbackScene={feedbackScene}
                        showMistakeReason={!reviewIsCorrect}
                        selectedMistakeReasons={currentMistakeReasons}
                        onMistakeReasonSelect={handleMistakeReasonSelect}
                        onStartSimilarPractice={onStartSimilarPractice}
                    />
                </div>
            ) : (
            <div className={`flex-1 w-full flex flex-col gap-2 overflow-y-auto no-scrollbar pb-3 ${isPaperSourceQuestion ? 'min-h-0' : 'max-w-md mx-auto'}`}>

                {isPaperSourceQuestion && !isReviewMode ? (
                    paperSourceSubmitted ? (
                        <div className="flex-1 flex flex-col min-h-0 gap-3">
                        <PaperSourceAnalysisPanel
                            draftImageUrl={paperDraftSnapshots[currentQ.id] ?? null}
                            correctAnswer={getPaperSourceCorrectAnswer()}
                            explanation={currentQ.result?.explanation ?? ''}
                            selfGrade={paperSelfGrades[currentQ.id] ?? null}
                            onSelfGrade={handlePaperSelfGrade}
                            onStartTutor={onOpenAITutor}
                            feedbackSlot={
                                <div className="flex items-center justify-between gap-3">
                                {(paperSelfGrades[currentQ.id] === 'wrong' || paperSelfGrades[currentQ.id] === 'partial') ? (
                                    <MistakeReasonPicker
                                        selectedReasons={currentMistakeReasons}
                                        onSelect={handleMistakeReasonSelect}
                                        className="min-w-0 flex-1 px-0.5"
                                    />
                                ) : (
                                    <span />
                                )}
                                <QuestionFeedbackEntry
                                    question={currentQ}
                                    userAnswer={answers[currentQ.id]}
                                    scene="paper"
                                    draftImageUrl={paperDraftSnapshots[currentQ.id] ?? null}
                                    selfGrade={paperSelfGrades[currentQ.id] ?? null}
                                    className="shrink-0 px-0.5"
                                />
                                </div>
                            }
                        />
                        </div>
                    ) : (
                    <div className="flex-1 flex flex-col min-h-0 w-full">
                        <div
                            ref={paperAnswerAreaRef}
                            className="flex-1 min-h-[200px] rounded-2xl border-2 border-dashed border-slate-300/90 bg-white shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 p-6 text-center z-0">
                                <span className="text-[11px] font-bold text-slate-400 tracking-wide">作答区域</span>
                                <p className="text-sm text-slate-400 font-medium leading-relaxed">请在此处书写作答</p>
                            </div>
                            <DrawingCanvas
                                ref={paperAnswerCanvasRef}
                                isActive
                                width={paperAnswerCanvasSize.width}
                                height={paperAnswerCanvasSize.height}
                                color={penColor}
                                penSize={penSize}
                                eraserSize={eraserSize}
                                tool={draftTool}
                                className="absolute inset-0 z-10 w-full h-full touch-none"
                            />
                        </div>
                    </div>
                    )
                ) : (
                <>
                {/* Reading comprehension layout: only questions here (passage already on left) */}
                {isReadingComp && readingSubQuestions.length > 0 ? (
                    <div className="space-y-3">
                        {readingSubQuestions.map((sq, idx) => {
                            const userAns = ((answers[currentQ.id] as string[]) || [])[idx] || '';
                            const correctAns = Array.isArray(currentQ.result?.correctAnswer)
                                ? currentQ.result?.correctAnswer[idx]
                                : currentQ.result?.correctAnswer;

                            let state: 'default' | 'correct' | 'wrong' = 'default';
                            if (showAnalysis && correctAns !== undefined) {
                                state = userAns?.toString().trim().toLowerCase() === correctAns?.toString().trim().toLowerCase()
                                    ? 'correct'
                                    : 'wrong';
                            }

                            return (
                                <div
                                    key={idx}
                                    className="rounded-2xl border border-slate-200 bg-white/90 p-3.5 md:p-4 space-y-2.5 shadow-sm"
                                >
                                    <div className="text-sm font-semibold text-slate-800 leading-6">
                                        {idx + 1}. {sq.question}
                                    </div>

                                    <div className="space-y-2">
                                        {(sq.options || []).map((opt, oidx) => {
                                            const label = String.fromCharCode(65 + oidx);
                                            const isSelected = userAns === opt;

                                            let choiceState: 'default' | 'correct' | 'wrong' = 'default';
                                            if ((showImmediate || showAnalysis) && correctAns) {
                                                if (opt === correctAns) choiceState = 'correct';
                                                else if (isSelected) choiceState = 'wrong';
                                            }

                                            return (
                                                <SelectionCard
                                                    key={opt}
                                                    id={`${idx}-${label}`}
                                                    label={label}
                                                    content={opt}
                                                    isSelected={isSelected}
                                                    isMulti={false}
                                                    onSelect={() => {
                                                        if (showImmediate || showAnalysis) return;
                                                        handleSubQuestionInput(idx, opt);
                                                    }}
                                                    state={choiceState}
                                                    disabled={showImmediate || showAnalysis}
                                                    className="!p-2.5"
                                                    labelClassName="!w-7 !h-7 !text-[11px]"
                                                    contentClassName="text-[13px] leading-6"
                                                />
                                            );
                                        })}
                                    </div>

                                    {showAnalysis && correctAns && (
                                        <div className="text-xs text-slate-500">
                                            <span className="font-bold text-emerald-600 mr-2">标准答案</span>
                                            <span>{correctAns}</span>
                                            {userAns && state === 'wrong' && (
                                                <span className="ml-3 text-rose-500">你的答案: {userAns}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : showSubQuestions ? (
                    <div className="space-y-3">
                        {currentQ.content.subQuestions?.map((sq, idx) => {
                            const isChoice = Array.isArray(sq.options) && sq.options.length > 0;
                            const userAns = ((answers[currentQ.id] as string[]) || [])[idx] || '';
                            const correctAns = sq.answer || (Array.isArray(currentQ.result?.correctAnswer) ? currentQ.result?.correctAnswer[idx] : undefined);
                            const isPhoneticSQ =
                                isChineseAccumulation &&
                                /注音|拼音|（[a-züv]/i.test(sq.question);
                            
                            let state: 'default' | 'correct' | 'wrong' = 'default';
                            if (showAnalysis && correctAns !== undefined) {
                                if (typeof correctAns === 'string') {
                                    state = userAns?.toString().trim().toLowerCase() === correctAns.trim().toLowerCase() ? 'correct' : 'wrong';
                                } else {
                                    state = 'default';
                                }
                            }

                            return (
                                <div key={idx} className="rounded-2xl border border-slate-200 bg-white/80 p-3.5 space-y-2.5">
                                    <div className="text-sm font-semibold text-slate-800 leading-6">
                                        {idx + 1}. {sq.question}
                                    </div>

                                    {isChoice ? (
                                        <div className="space-y-2">
                                            {sq.options!.map((opt, oidx) => {
                                                const label = String.fromCharCode(65 + oidx);
                                                const hasPrefix = /^[A-Z]\.\s*/.test(opt);
                                                const content = hasPrefix ? opt.replace(/^[A-Z]\.\s*/, '') : opt;
                                                const isSelected = userAns === opt;

                                                // Choice correctness
                                                let choiceState: 'default' | 'correct' | 'wrong' = 'default';
                                                if ((showImmediate || showAnalysis) && correctAns) {
                                                    const correctSet = Array.isArray(correctAns) ? correctAns : [correctAns];
                                                    const isCorrectOpt = correctSet.includes(opt);
                                                    if (isCorrectOpt) choiceState = 'correct';
                                                    else if (isSelected) choiceState = 'wrong';
                                                }

                                                return (
                                                    <SelectionCard
                                                        key={oidx}
                                                        id={`${idx}-${oidx}`}
                                                        label={label}
                                                        content={content}
                                                        isSelected={isSelected}
                                                        isMulti={false}
                                                        onSelect={() => {
                                                            if (showImmediate || showAnalysis) return;
                                                            handleSubQuestionInput(idx, opt);
                                                        }}
                                                        state={choiceState}
                                                        disabled={showImmediate || showAnalysis}
                                                        className="!p-3"
                                                        labelClassName="!w-7 !h-7 !text-[11px]"
                                                        contentClassName="text-[13px] leading-6"
                                                    />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {isChineseAccumulation ? (
                                                <div className="flex flex-col gap-2">
                                                    {/* 分号分隔的单行输入 */}
                                                    <input
                                                        type="text"
                                                        value={userAns}
                                                        onChange={(e) => handleSubQuestionInput(idx, e.target.value)}
                                                        disabled={showImmediate || showAnalysis}
                                                        className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-${themeColor}-200 focus:border-${themeColor}-300 transition ${
                                                            showAnalysis
                                                                ? state === 'correct'
                                                                    ? 'border-emerald-300 bg-emerald-50'
                                                                    : 'border-rose-300 bg-rose-50'
                                                                : 'border-slate-200'
                                                        }`}
                                                        placeholder={idx === 0 ? "按顺序用分号分隔：魄；浊；wǎn；píng" : "填写标点，如：；"}
                                                    />
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="text-[11px] text-slate-400">提示：多个答案请用分号分隔</div>
                                                        {/* 注音键盘仅在注音相关小题显示 */}
                                                        {isPhoneticSQ && (
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setActiveGapIndex(activeGapIndex === idx ? null : idx)}
                                                                    className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-[12px] text-slate-600 hover:bg-slate-50 transition"
                                                                >
                                                                    注音键盘
                                                                </button>
                                                                {activeGapIndex === idx && (
                                                                    <div className="absolute right-0 mt-2 z-20 w-60 rounded-xl border border-slate-200 bg-white shadow-lg p-3 space-y-3">
                                                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                                                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">元音</span>
                                                                            <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500">声母</span>
                                                                            <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500">韵母</span>
                                                                        </div>
                                                                        <div className="grid grid-cols-6 gap-2 text-sm text-slate-700">
                                                                            {['ā','á','ǎ','à','ō','ó','ǒ','ò','ē','é','ě','è','ī','í','ǐ','ì','ū','ú','ǔ','ù','ǖ','ǘ','ǚ','ǜ','ü'].map(ch => (
                                                                                <button
                                                                                    key={ch}
                                                                                    type="button"
                                                                                    onClick={() => handleSubQuestionInput(idx, userAns ? `${userAns}${userAns.endsWith(';') ? '' : ''}${ch}` : ch)}
                                                                                    className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100"
                                                                                >
                                                                                    {ch}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                        <div className="text-[11px] text-slate-400">规则提示：可直接点选插入；仍可手打分号分隔。</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={userAns}
                                                    onChange={(e) => handleSubQuestionInput(idx, e.target.value)}
                                                        disabled={showImmediate || showAnalysis}
                                                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-${themeColor}-200 focus:border-${themeColor}-300 transition ${
                                                        showAnalysis
                                                            ? state === 'correct'
                                                                ? 'border-emerald-300 bg-emerald-50'
                                                                : 'border-rose-300 bg-rose-50'
                                                            : 'border-slate-200'
                                                    }`}
                                                    placeholder="请输入答案"
                                                />
                                            )}
                                        </div>
                                    )}

                                    {showAnalysis && correctAns && (
                                        <div className="text-xs text-slate-500">
                                            <span className="font-bold text-emerald-600 mr-2">标准答案</span>
                                            <span>{correctAns}</span>
                                            {userAns && state === 'wrong' && (
                                                <span className="ml-3 text-rose-500">你的答案: {userAns}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                /* A. Choice / TrueFalse (single question) */
                [
                    'single_choice',
                    'multiple_choice',
                    'true_false',
                    'listening_choice',
                    'listening_blank',
                    'listening_judge',
                    'listening_match',
                    'listening_sort',
                    'grammar_choice',
                    'word_choice',
                    'cloze_choice',
                    'sentence_completion',
                    'situation',
                    'reading_comp',
                    'task_reading',
                    'short_cloze',
                    'dialogue_fill',
                    'translation',
                    'correction'
                ].includes(currentQ.type) && (
                   (
                        (isTrueFalse
                            ? (currentQ.content.options && currentQ.content.options.length > 0
                                ? currentQ.content.options
                                : ['对', '错'])
                            : currentQ.content.options) || []
                    ).map((opt, idx) => {
                        const label = isTrueFalse
                            ? (opt.includes('对') ? '√' : '×')
                            : String.fromCharCode(65 + idx);

                        let isSelected = false;
                        
                        if (currentQ.type === 'multiple_choice') {
                            isSelected = (answers[currentQ.id] as string[])?.includes(opt);
                        } else {
                            isSelected = answers[currentQ.id] === opt;
                        }

                        // 即时反馈或解析态的红绿标色
                        let state: 'default' | 'correct' | 'wrong' = 'default';
                        if ((showImmediate || showAnalysis) && currentQ.result) {
                             const correct = currentQ.result.correctAnswer;
                             const isCorrectOpt = Array.isArray(correct) ? correct.includes(opt) : correct === opt;
                             if (isCorrectOpt) state = 'correct';
                             else if (isSelected) state = 'wrong';
                        }

                        return (
                            <SelectionCard
                                 key={idx}
                                 id={label}
                                 label={label}
                                 content={opt}
                                 isSelected={isSelected}
                                 isMulti={currentQ.type === 'multiple_choice'}
                                 onSelect={() => handleChoiceSelect(opt)}
                                 state={state}
                                 disabled={showImmediate || showAnalysis}
                                 variant={isTrueFalse ? 'true_false' : 'default'}
                            />
                        );
                    })
                ))}

                {/* B. Fill in Blank — 左栏内联空 + 右栏按槽手写/键盘 */}
                {isBlankType && !showSubQuestions && !isPaperSourceQuestion && (
                    <>
                        <BlankAnswerSlots
                          gapCount={blankGapCount}
                          values={blankGapValues}
                          activeIndex={activeGapIndex}
                          inputMode={isDraftMode ? 'keyboard' : answerInputMode}
                          disabled={showImmediate || showAnalysis}
                          penColor={penColor}
                          penSize={penSize}
                          eraserSize={eraserSize}
                          draftTool={draftTool}
                          feedback={
                            (showImmediate || showAnalysis)
                              ? Array.from({ length: blankGapCount }).map((_, idx) => {
                                  const userVal = blankGapValues[idx] || '';
                                  return isGapCorrect(currentQ, idx, userVal) ? 'correct' : 'wrong';
                                })
                              : undefined
                          }
                          onSelectGap={(idx) => {
                            if (showImmediate || showAnalysis) return;
                            setActiveGapIndex(idx);
                          }}
                          onChangeGap={(idx, value) => {
                            if (showImmediate || showAnalysis) return;
                            handleGapValueSet(idx, value);
                          }}
                        />

                        {answerInputMode === 'keyboard' && !isDraftMode && !showImmediate && !showAnalysis && (
                          <div className="mt-auto pt-4">
                            <VirtualNumPad
                              onInput={(c) => handleGapInput(c)}
                              onDelete={() => handleGapInput('BACKSPACE')}
                              onConfirm={() =>
                                setActiveGapIndex((prev) => {
                                  const cur = prev ?? 0;
                                  return cur + 1 < blankGapCount ? cur + 1 : cur;
                                })
                              }
                            />
                          </div>
                        )}
                    </>
                )}

                {/* Analysis Card — 错题日练/分步推题使用下方「当前题反馈」，避免重复 */}
                <AnimatePresence>
                    {showAnalysis && currentQ.result && !isMistakeDaily && !isStepping && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl mt-3 space-y-2"
                        >
                            <h4 className="font-bold text-blue-900 mb-2 text-sm">解析</h4>
                            <p className="text-sm text-blue-800 leading-relaxed">
                                {currentQ.result.explanation}
                            </p>
                            <div className="flex items-center justify-between gap-3 pt-2 border-t border-blue-100">
                                {currentAnswerWrong ? (
                                    <MistakeReasonPicker
                                        selectedReasons={currentMistakeReasons}
                                        onSelect={handleMistakeReasonSelect}
                                        className="min-w-0 flex-1"
                                    />
                                ) : (
                                    <span />
                                )}
                                <QuestionFeedbackEntry
                                    question={currentQ}
                                    userAnswer={answers[currentQ.id]}
                                    isCorrect={isAnswerCorrect(currentQ, answers[currentQ.id])}
                                    scene={feedbackScene}
                                    className="shrink-0"
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mistake-daily 单题：提交后展示即时反馈；多题批量订正统一在结果页查看 */}
                {isMistakeDaily && !isPaperSourceQuestion && totalQ === 1 && (
                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                        <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between">
                            <span>当前题反馈</span>
                            {submittedMap[currentQ.id] ? (
                                isAnswerCorrect(currentQ, answers[currentQ.id]) ? (
                                    <span className="text-emerald-600 font-black text-sm">正确</span>
                                ) : (
                                    <span className="text-rose-500 font-black text-sm">错误</span>
                                )
                            ) : (
                                <span className="text-slate-400 font-semibold text-[11px]">提交后显示</span>
                            )}
                        </div>
                        {submittedMap[currentQ.id] ? (
                            <div className="text-sm text-slate-700 leading-relaxed">
                                <div className="text-xs text-slate-500 mb-1">简要解析</div>
                                <p className="text-sm text-slate-700 line-clamp-3">
                                    {currentQ.result?.explanation || '提交后查看提示'}
                                </p>
                                <div className="flex items-center justify-between gap-3 mt-2 pt-2 border-t border-slate-100">
                                    {currentAnswerWrong ? (
                                        <MistakeReasonPicker
                                            selectedReasons={currentMistakeReasons}
                                            onSelect={handleMistakeReasonSelect}
                                            className="min-w-0 flex-1"
                                        />
                                    ) : (
                                        <span />
                                    )}
                                    <QuestionFeedbackEntry
                                        question={currentQ}
                                        userAnswer={answers[currentQ.id]}
                                        isCorrect={isAnswerCorrect(currentQ, answers[currentQ.id])}
                                        scene="mistake"
                                        className="shrink-0"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400">提交答案后将展示对错与简短解析</div>
                        )}
                    </div>
                )}

                </>
                )}

            </div>
            )}
            </div>
        </div>
    );

    return (
        <div className="absolute inset-0 z-[100] bg-[#F3F0FA] flex flex-col min-h-0 overflow-hidden rounded-[inherit] pointer-events-auto">
            
            <QuizNavHeader
                showStepper={!singleQuestionMode && totalQ > 1}
                items={navItems}
                currentIndex={currentIndex}
                onBack={handleBackPress}
                onSelectQuestion={canJumpQuestions ? handleNavSelect : undefined}
                primaryLabel={primaryActionMeta.label}
                onPrimaryAction={handlePrimaryAction}
                primaryDisabled={primaryActionMeta.disabled}
                primaryVariant={primaryActionMeta.variant}
                showPrimaryAction={primaryActionMeta.showPrimaryAction}
                showSummary={showSummaryTab}
                onSummaryClick={onGoToSummary}
            />

            {/* Main Content (Split View) */}
            <div className="flex-1 min-h-0 overflow-hidden relative z-10 flex flex-col md:flex-row">
                 <div className={`w-full h-full flex-1 min-h-0 min-w-0 ${preferSplitLayout ? 'block' : 'hidden md:block'}`}>
                     <SplitLayout 
                        left={renderLeftPane()} 
                        right={renderRightPane()}
                        defaultRatio={splitRatio}
                     />
                 </div>
                 
                 {/* Mobile Fallback (Stack) — 试卷原图题固定左右分栏，不走上下堆叠 */}
                 <div className={`w-full h-full flex-1 min-h-0 overflow-y-auto ${preferSplitLayout ? 'hidden' : 'flex flex-col md:hidden'}`}>
                    <div className="shrink-0 border-b border-gray-200">
                        {renderLeftPane()}
                    </div>
                    <div className="shrink-0 min-h-[500px] bg-white">
                        {renderRightPane()}
                    </div>
                 </div>
                 
                 {/* Draft Layer (Overlay) — 试卷原图题使用作答区内嵌画布 */}
                 {!isPaperSourceQuestion && (
                 <DrawingCanvas 
                    isActive={isDraftMode}
                    className={`absolute inset-0 z-50 transition-all duration-300 ${isDraftMode ? 'opacity-100 pointer-events-auto bg-black/5' : 'opacity-0 pointer-events-none'}`}
                    width={1024} // Approximate max width
                    height={768} 
                    color={penColor} // Apple Red default
                    penSize={penSize}
                    eraserSize={eraserSize}
                    tool={draftTool}
                    ref={draftCanvasRef}
                 />
                 )}
                 
                 {/* Grid Overlay for Draft Mode */}
                 {!isPaperSourceQuestion && isDraftMode && (
                     <div 
                        className="absolute inset-0 z-40 pointer-events-none opacity-20"
                        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                     />
                 )}

                 {/* Pause Overlay */}
                 {isPaused && (
                    <div className="absolute inset-0 z-[140] bg-black/30 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                        <div className="bg-white/90 px-6 py-4 rounded-2xl shadow-xl text-center space-y-2">
                            <div className="text-gray-800 font-bold text-lg">已暂停</div>
                            <div className="text-gray-500 text-sm">计时已停止，可随时继续</div>
                            <button
                                onClick={handleResume}
                                className="px-5 py-2 rounded-full bg-[#007AFF] text-white font-semibold shadow-md hover:shadow-lg transition"
                            >
                                继续做题
                            </button>
                        </div>
                    </div>
                 )}
            </div>

            {/* Progress Drawer (legacy fallback) */}
            {showProgressUI && (
              <AnimatePresence>
                  {showProgressPanel && (
                      <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 z-[150] bg-black/30 backdrop-blur-[2px]"
                          onClick={() => setShowProgressPanel(false)}
                      >
                          <motion.div
                              initial={{ y: 60, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: 60, opacity: 0 }}
                              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                              className="absolute inset-x-0 bottom-0 pb-6 px-4"
                              onClick={(e) => e.stopPropagation()}
                          >
                              <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
                                  <div className="px-5 py-4 flex items-center justify-between border-b border-black/5">
                                      <div className="font-bold text-gray-900">题目列表</div>
                                      <button 
                                          onClick={() => setShowProgressPanel(false)}
                                          className="p-2 rounded-full hover:bg-black/5 transition"
                                      >
                                          <X size={18} className="text-gray-500" />
                                      </button>
                                  </div>
                                  <div className="max-h-[50vh] overflow-y-auto no-scrollbar px-4 py-3 grid grid-cols-4 gap-3">
                                      {questions.map((q, idx) => {
                                          const answered = isQuestionAnswered(q.id);
                                          const isActive = idx === currentIndex;
                                          return (
                                              <button
                                                  key={q.id}
                                                  onClick={() => handleJumpToQuestion(idx)}
                                                  className={`
                                                      flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border text-sm font-semibold transition
                                                      ${isActive ? 'border-[#007AFF] bg-[#E8F0FF]' : 'border-gray-200 bg-white hover:border-[#007AFF]/60'}
                                                  `}
                                              >
                                                  <div className={`
                                                      w-9 h-9 rounded-full flex items-center justify-center font-bold
                                                      ${isActive ? 'bg-[#007AFF] text-white' : 'bg-gray-100 text-gray-700'}
                                                  `}>
                                                      {idx + 1}
                                                  </div>
                                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                                      <span className={`
                                                          w-2.5 h-2.5 rounded-full
                                                          ${answered ? 'bg-green-500' : 'border border-gray-300'}
                                                      `}/>
                                                      <span>{answered ? '已做' : '未做'}</span>
                                                  </div>
                                              </button>
                                          );
                                      })}
                                  </div>
                              </div>
                          </motion.div>
                      </motion.div>
                  )}
              </AnimatePresence>
            )}

            {/* Timer Action Sheet (constrained to tablet frame) */}
            <AnimatePresence>
                {showTimerSheet && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[155] bg-black/35 backdrop-blur-[2px]"
                        onClick={() => setShowTimerSheet(false)}
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 60, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                            className="absolute inset-x-0 bottom-0 pb-6 px-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
                                <div className="divide-y divide-gray-100">
                                    <button
                                        onClick={() => { setShowTimerSheet(false); setShowPauseConfirm(true); }}
                                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 text-gray-800 font-semibold transition"
                                    >
                                        <PauseCircle size={18} className="text-[#007AFF]" />
                                        暂停做题
                                    </button>
                                    <button
                                        onClick={() => { setShowTimerSheet(false); setShowExitConfirm(true); }}
                                        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 text-red-600 font-semibold transition"
                                    >
                                        <LogOut size={18} />
                                        退出测试
                                    </button>
                                    <button
                                        onClick={() => setShowTimerSheet(false)}
                                        className="w-full flex items-center justify-center px-5 py-4 text-gray-600 font-semibold hover:bg-gray-50 transition"
                                    >
                                        取消
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Pause Confirm (constrained to tablet frame) */}
            <AnimatePresence>
                {showPauseConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[160] bg-black/35 backdrop-blur-[2px] flex items-center justify-center px-6"
                        onClick={() => setShowPauseConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white/95 rounded-2xl shadow-2xl border border-white/70 w-full max-w-sm p-6 space-y-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="text-lg font-bold text-gray-900">暂停做题？</div>
                            <div className="text-sm text-gray-600">暂停后计时停止，可随时继续。</div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowPauseConfirm(false)}
                                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handlePause}
                                    className="flex-1 py-2.5 rounded-xl bg-[#007AFF] text-white font-semibold shadow-sm hover:shadow-md transition"
                                >
                                    确认暂停
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <QuizConfirmDialog
                isOpen={showExitConfirm}
                icon={<LogOut size={34} strokeWidth={3} />}
                title={'退出后，本次作答记录不保存哦，\n下次进入将重新开始作答。'}
                cancelLabel="继续作答"
                confirmLabel="坚持退出"
                onCancel={() => setShowExitConfirm(false)}
                onConfirm={handleExit}
            />

            <QuizConfirmDialog
                isOpen={showSubmitConfirm}
                icon={<PenTool size={34} strokeWidth={3} />}
                title="还有题目未作答，确认提交吗？"
                cancelLabel="继续作答"
                confirmLabel="坚持提交"
                confirmFirst
                onCancel={() => setShowSubmitConfirm(false)}
                onConfirm={() => {
                    setShowSubmitConfirm(false);
                    handleNext();
                }}
            />
        </div>
    );
};
