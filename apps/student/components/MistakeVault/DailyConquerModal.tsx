
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MistakeItem } from '../../types';
import { X, Zap, Bot } from 'lucide-react';
import { UniversalQuizView, UniversalQuizQuestion, normalizeQuizSubmitPayload } from '../Quiz/UniversalQuizView';
import { UniversalQuizResult, QuizSessionResult, QuizResultItem, enrichQuizResultWithPracticeStates } from '../Quiz/UniversalQuizResult';
import { SingleQuestionResultCard } from '../Quiz/SingleQuestionResultCard';
import { allQuestions } from '../../data/questionBank';
import { getPortalRoot } from '../../utils/portal';
import { grantQuizSessionReward } from '../../services/rewardService';
import { RewardGrantResult } from '../../types/reward';
import { UserStats } from '../../types';
import { PaperSelfGrade } from '../Quiz/components/PaperSourceAnalysisPanel';
import { resolveQuestionCorrectness } from '../../utils/manualGrade';

interface DailyConquerModalProps {
    items: MistakeItem[];
    onClose: () => void;
    onComplete: (results: { masteredIds: string[], xpEarned: number, coinsEarned: number }) => void;
    onRewardGranted?: (result: RewardGrantResult) => void;
    userStats?: UserStats;
    mode?: 'daily' | 'batch';
    subjectLabel?: string;
    onOpenAITutor?: () => void;
}

const mapMistakeItemToQuestion = (item: MistakeItem): UniversalQuizQuestion => {
    const originalId = item.id.startsWith('mist-') ? item.id.replace('mist-', '') : item.id;
    const originalQuestion = allQuestions.find(q => q.id === originalId);
    const cognitiveState = item.status === 'mastered' ? 'MASTERED' : item.status === 'reviewing' ? 'FADED' : 'GAP';

    return {
        id: item.id,
        type: (item.questionType as any) || 'fill_in_blank',
        content: {
            stem: originalQuestion?.content?.originalImageUrl
              ? (originalQuestion.content.stem || '')
              : (item.fullQuestion || item.questionSnippet),
            options: originalQuestion?.content?.options,
            audioUrl: originalQuestion?.content?.audioUrl,
            transcript: originalQuestion?.content?.transcript,
            examRules: originalQuestion?.content?.examRules,
            subQuestions: originalQuestion?.content?.subQuestions,
            stemImages: originalQuestion?.content?.stemImages,
            originalImageUrl: originalQuestion?.content?.originalImageUrl,
            htmlStem: originalQuestion?.content?.htmlStem,
            htmlExplanation: originalQuestion?.content?.htmlExplanation,
            manualGradeReferenceImageUrl: originalQuestion?.content?.manualGradeReferenceImageUrl,
            manualGradeBlankIndex: originalQuestion?.content?.manualGradeBlankIndex,
        },
        result: {
            correctAnswer: item.correctAnswer || '',
            explanation: item.analysis || '',
        },
        tags: item.tags,
        difficulty: typeof item.difficulty === 'number' ? item.difficulty : undefined,
        category: item.category,
        knowledgePoints: item.knowledgePoints || (item.topic ? [item.topic] : []),
        cognitiveState,
        bookmarked: item.stats?.isStarred,
        similarIds: item.similarIds,
        userAnswer: item.userWrongAnswer,
        subject: item.subject as any,
    };
};

type Phase = 'briefing' | 'quiz' | 'result';

/** 每日攻克 / 批量订正：单次 session 题量上限 */
export const DAILY_CONQUER_MAX = 20;

export const DailyConquerModal: React.FC<DailyConquerModalProps> = ({
    items,
    onClose,
    onComplete,
    onRewardGranted,
    userStats,
    mode = 'daily',
    subjectLabel,
    onOpenAITutor,
}) => {
    const [phase, setPhase] = useState<Phase>('briefing');
    
    // Quiz data/state
    const [queue, setQueue] = useState<UniversalQuizQuestion[]>([]);
    const [answers, setAnswers] = useState<Record<string, any> | null>(null);
    const [paperDraftSnapshots, setPaperDraftSnapshots] = useState<Record<string, string | null>>({});
    const [paperSelfGrades, setPaperSelfGrades] = useState<Record<string, PaperSelfGrade>>({});
    const [resultPayload, setResultPayload] = useState<QuizSessionResult | null>(null);
    const rewardGrantedRef = useRef(false);

    // Portal Target
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalTarget(getPortalRoot());

        const pendingItems = items.filter(item => item.status !== 'mastered');
        const source = pendingItems.length > 0 ? pendingItems : items;
        const limit = Math.min(source.length, DAILY_CONQUER_MAX);
        const playable = source.slice(0, limit).map(mapMistakeItemToQuestion);
        setQueue(playable);
        if (mode === 'batch' && playable.length > 0) {
            setPhase('quiz');
        }
    }, [items, mode]);

    // 结果页先展示，再触发金币动画（避免与提交同帧导致父级重挂载）
    useEffect(() => {
        if (phase !== 'result' || !resultPayload?.grantResult || rewardGrantedRef.current) return;
        const gr = resultPayload.grantResult;
        if (gr.xp <= 0 && gr.coins <= 0) return;
        const t = setTimeout(() => {
            rewardGrantedRef.current = true;
            onRewardGranted?.(gr);
        }, 400);
        return () => clearTimeout(t);
    }, [phase, resultPayload, onRewardGranted]);

    // --- HANDLERS ---
    const handleStart = () => setPhase('quiz');

    const buildResult = (userAnswers: Record<string, any>, paperSelfGrades: Record<string, PaperSelfGrade> = {}) => {
        const totalCount = queue.length;
        let correctCount = 0;
        const questions: QuizResultItem[] = queue.map((q, idx) => {
            const correct = resolveQuestionCorrectness(
                q.content?.manualGradeBlankIndex,
                q.result?.correctAnswer,
                userAnswers[q.id],
                paperSelfGrades[q.id],
            );
            if (correct) correctCount += 1;
            return {
                questionId: q.id,
                index: idx + 1,
                isCorrect: !!correct,
                timeSpentSec: 0,
                difficulty: q.difficulty || 1,
                stemSummary: (q.content.stem || '').slice(0, 50),
                correctAnswer: Array.isArray(q.result?.correctAnswer) ? (q.result?.correctAnswer as any[]).join('、') : (q.result?.correctAnswer as any) ?? '',
                userAnswer: Array.isArray(userAnswers[q.id]) ? (userAnswers[q.id] as any[]).join('、') : (userAnswers[q.id] ?? ''),
                subject: (q as any).subject ?? 'math',
                knowledgePoint: q.knowledgePoints?.[0] || '',
                questionType: q.type,
                options: q.content.options,
                explanation: q.result?.explanation,
                knowledgePoints: q.knowledgePoints,
                rawCorrectAnswer: q.result?.correctAnswer,
                rawUserAnswer: userAnswers[q.id],
            };
        });
        const score = Math.round((correctCount / totalCount) * 100);
        const grantResult = grantQuizSessionReward({
            sessionId: `daily-${Date.now()}`,
            quizSetId: 'daily_conquer_set',
            correctCount,
            totalCount,
            questions: questions.map((q) => ({
                difficulty: q.difficulty,
                isCorrect: q.isCorrect,
            })),
            isDailyConquer: true,
        });
        const result: QuizSessionResult = {
            sessionId: `daily-${Date.now()}`,
            timestamp: Date.now(),
            totalTimeSec: 0,
            score,
            correctCount,
            totalCount,
            rewards: {
                baseXp: grantResult.xp,
                bonusXp: 0,
                coins: grantResult.coins,
            },
            grantResult,
            skillChanges: [],
            aiComment: '继续保持，针对错题再练几道变式吧。',
            questions: enrichQuizResultWithPracticeStates(questions),
        };
        return result;
    };

    const handleQuizSubmit = (payload: any) => {
        const { answers: ans, paperDraftSnapshots: drafts, paperSelfGrades: grades } = normalizeQuizSubmitPayload(payload);
        setAnswers(ans);
        setPaperDraftSnapshots(drafts ?? {});
        setPaperSelfGrades(grades ?? {});
        const res = buildResult(ans, grades ?? {});
        setResultPayload(res);
        setPhase('result');
        const masteredIds = res.questions.filter(q => q.isCorrect).map(q => q.questionId);
        onComplete({
            masteredIds,
            xpEarned: res.rewards.baseXp,
            coinsEarned: res.rewards.coins,
        });
    };

    const handleStartTutor = () => {
        onClose();
        onOpenAITutor?.();
    };

    if (!portalTarget) return null;

    // --- CONTENT RENDERERS ---

    const renderBriefing = () => (
        <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-6 overflow-hidden z-[100] pointer-events-auto">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            
            <div className="relative mb-12">
                <motion.div 
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                    className="absolute inset-0 bg-brand rounded-full blur-xl"
                />
                <div className="w-32 h-32 rounded-full border-2 border-brand/50 bg-gray-800 flex items-center justify-center relative z-10 overflow-hidden shadow-[0_0_50px_rgba(108,93,211,0.5)]">
                    <div className="absolute inset-0 border-t-2 border-brand animate-spin origin-center"></div>
                    <Bot size={48} className="text-white" />
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center z-10 max-w-sm w-full"
            >
                <h2 className="text-2xl font-black text-white mb-4">
                    {mode === 'batch'
                        ? <>开始{subjectLabel ? `${subjectLabel}` : ''}批量订正</>
                        : <>AI 正在锁定<br/><span className="text-brand-light">记忆薄弱点...</span></>}
                </h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                    {mode === 'batch'
                        ? `本次将按顺序订正 ${queue.length} 道错题（单次最多 ${DAILY_CONQUER_MAX} 道），完成后自动更新掌握状态。`
                        : <>根据艾宾浩斯遗忘曲线，为你抓取了 {queue.length} 道“漏网之鱼”（单次最多 {DAILY_CONQUER_MAX} 道）。<br/>今日悬赏：<span className="text-accent font-bold">+200 XP</span></>}
                </p>
                
                <button 
                    onClick={handleStart}
                    className="w-full bg-brand hover:bg-brand-light text-white font-black text-lg py-4 rounded-2xl shadow-lg shadow-brand/30 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                >
                    <span>复习</span>
                    <Zap size={20} fill="currentColor" className="group-hover:animate-pulse" />
                </button>
                
                <button onClick={onClose} className="mt-4 text-gray-500 text-sm font-bold hover:text-gray-300">
                    暂不挑战
                </button>
            </motion.div>
        </div>
    );

    const renderResult = () => {
        if (!resultPayload || queue.length === 0) return null;
        if (queue.length === 1) {
            const q = queue[0];
            const isCorrect = resolveQuestionCorrectness(
                q.content?.manualGradeBlankIndex,
                q.result?.correctAnswer,
                answers?.[q.id],
                paperSelfGrades[q.id],
            );
            return (
                <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] pointer-events-auto">
                    <SingleQuestionResultCard
                        questionId={q.id}
                        questionType={q.type}
                        subject={(q as any).subject ?? 'math'}
                        difficulty={q.difficulty}
                        stem={q.content.stem}
                        options={q.content.options?.map(opt => ({
                            label: opt,
                            text: opt,
                            isCorrect: q.result?.correctAnswer === opt,
                            userSelected: answers?.[q.id] === opt,
                        }))}
                        userAnswerPreview={answers ? (Array.isArray(answers[q.id]) ? (answers[q.id] as any[]).join('、') : (answers[q.id] ?? '')) : ''}
                        correctAnswerPreview={Array.isArray(q.result?.correctAnswer) ? (q.result?.correctAnswer as any[]).join('、') : (q.result?.correctAnswer as any)}
                        explanationText={q.result?.explanation}
                        knowledgePoints={q.knowledgePoints?.map(k => ({ id: k, label: k, color: '#6C5DD3' }))}
                        status={isCorrect ? 'correct' : 'wrong'}
                        timeUsedSec={0}
                        attemptStats={{ totalAttempts: 1, correctCount: isCorrect ? 1 : 0, wrongCount: isCorrect ? 0 : 1 }}
                        paperDraftImageUrl={paperDraftSnapshots[q.id] ?? null}
                        paperSelfGrade={paperSelfGrades[q.id] ?? null}
                        onPaperSelfGrade={(grade) => setPaperSelfGrades((prev) => ({ ...prev, [q.id]: grade }))}
                        onOpenAITutor={onOpenAITutor ? handleStartTutor : undefined}
                        onClose={onClose}
                    />
                </motion.div>
            );
        }
        return (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-white">
                <UniversalQuizResult
                    initialData={resultPayload}
                    userStats={userStats}
                    onClose={onClose}
                />
            </motion.div>
        );
    };

    // Using Portal to ensure it sits inside the device frame "modal-root"
    return createPortal(
        <AnimatePresence mode="wait">
            {phase === 'briefing' && (
                <motion.div key="briefing" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0 z-[100]">
                    {renderBriefing()}
                </motion.div>
            )}
            
            {phase === 'result' && renderResult()}

            {phase === 'quiz' && queue.length > 0 && (
                <motion.div 
                    key="quiz" 
                    initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
                    className="absolute inset-0 z-[100] bg-white"
                >
                    <UniversalQuizView
                        mode="practice"
                        questions={queue}
                        onClose={onClose}
                        onSubmit={handleQuizSubmit}
                        variant="mistake-daily"
                        onOpenAITutor={onOpenAITutor ? handleStartTutor : undefined}
                    />
                </motion.div>
            )}
        </AnimatePresence>,
        portalTarget
    );
};
