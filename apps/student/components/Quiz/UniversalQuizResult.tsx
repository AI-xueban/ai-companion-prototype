import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Clock, 
  Target, 
  Sparkles, 
  ChevronRight, 
  RotateCcw,
  Lightbulb,
  Share2,
  X,
  Coins,
} from 'lucide-react';
import { SubjectType, allQuestions, CognitiveState } from '../../data/questionBank';
import { mathQuestions } from '../../data/questionBank/mathQuestions';
import { StatusRing } from './StatusRing';
import { SingleQuestionResultCard } from './SingleQuestionResultCard';
import { UniversalQuizView, UniversalQuizQuestion, QuizSessionReviewItem, normalizeQuizSubmitPayload } from './UniversalQuizView';
import { RewardGrantResult } from '../../types/reward';
import { UserStats } from '../../types';
import { recordSimilarAttempt } from '../../utils/similarQuestionAttempts';
import { MistakeReasonKey } from '../../data/mistakeReasons';
import { recordMistakeReasons } from '../../services/mistakeReasonService';
import { getMasteryView } from '../../data/mockStudentMastery';

// --- Types ---

export type QuestionAttemptMeta = {
  total: number;
  correct: number;
  wrong: number;
};

export type QuizResultItem = {
  questionId: string;
  index: number;
  isCorrect: boolean;
  timeSpentSec: number;
  difficulty: number; // 1-5
  stemSummary: string;
  correctAnswer: string;
  userAnswer: string;
  subject: SubjectType | string;
  knowledgePoint: string;
  questionType?: string;
  options?: string[];
  explanation?: string;
  knowledgePoints?: string[];
  rawCorrectAnswer?: any;
  rawUserAnswer?: any;
  userMistakeTags?: MistakeReasonKey[]; // Optional: reasons for mistake
  /** 本题练习状态（GAP / FADED / MASTERED），用于结果页「本题练习情况」 */
  questionPracticeState?: CognitiveState;
  attemptMeta?: QuestionAttemptMeta;
};

export type SkillChange = {
  skillId: string;
  skillName: string;
  oldLevel: number; // 0-100
  newLevel: number; // 0-100
};

export type QuizSessionResult = {
  sessionId: string;
  timestamp: number;
  totalTimeSec: number;
  score: number; // 0-100
  correctCount: number;
  totalCount: number;
  questions: QuizResultItem[];
  rewards: {
    baseXp: number;
    bonusXp: number;
    coins: number;
  };
  grantResult?: RewardGrantResult;
  skillChanges: SkillChange[];
  aiComment: string;
};

// --- Mock Data ---

const PRACTICE_STATE_LABEL: Record<CognitiveState, string> = {
  GAP: '待攻克',
  FADED: '待复习',
  MASTERED: '本题已掌握',
};

const buildDemoResultItem = (
  bankId: string,
  index: number,
  config: {
    questionPracticeState: CognitiveState;
    attemptMeta: QuestionAttemptMeta;
    isCorrect: boolean;
    userAnswer: string;
  },
): QuizResultItem => {
  const bankQ = allQuestions.find((q) => q.id === bankId) ?? mathQuestions[0];
  const rawCorrect = bankQ.result?.correctAnswer;
  const correctPreview = Array.isArray(rawCorrect)
    ? rawCorrect.join('、')
    : String(rawCorrect ?? '');

  return {
    questionId: bankQ.id,
    index,
    isCorrect: config.isCorrect,
    timeSpentSec: 48 + index * 6,
    difficulty: bankQ.difficulty,
    stemSummary: (bankQ.content.stem || '').length > 72
      ? `${(bankQ.content.stem || '').slice(0, 72)}…`
      : (bankQ.content.stem || ''),
    correctAnswer: correctPreview,
    userAnswer: config.userAnswer,
    subject: bankQ.subject,
    knowledgePoint: bankQ.knowledgePoints?.[0] ?? '数学',
    knowledgePoints: bankQ.knowledgePoints,
    questionType: bankQ.type,
    options: bankQ.content.options,
    explanation: bankQ.result?.explanation,
    rawCorrectAnswer: rawCorrect,
    rawUserAnswer: config.userAnswer,
    questionPracticeState: config.questionPracticeState,
    attemptMeta: config.attemptMeta,
  };
};

/** 多题结果页演示：覆盖「本题练习情况」全部状态与文案分支 */
export const MOCK_PRACTICE_STATE_SESSION: QuizSessionResult = {
  sessionId: 'demo_practice_states',
  timestamp: Date.now(),
  totalTimeSec: 360,
  score: 50,
  correctCount: 3,
  totalCount: 6,
  rewards: {
    baseXp: 80,
    bonusXp: 20,
    coins: 30,
  },
  questions: [
    buildDemoResultItem('q-math-013', 1, {
      questionPracticeState: 'GAP',
      attemptMeta: { total: 4, correct: 0, wrong: 4 },
      isCorrect: false,
      userAnswer: '12',
    }),
    buildDemoResultItem('q-math-002', 2, {
      questionPracticeState: 'GAP',
      attemptMeta: { total: 0, correct: 0, wrong: 0 },
      isCorrect: true,
      userAnswer: '13',
    }),
    buildDemoResultItem('q-math-001', 3, {
      questionPracticeState: 'GAP',
      attemptMeta: { total: 3, correct: 1, wrong: 2 },
      isCorrect: true,
      userAnswer: 'A',
    }),
    buildDemoResultItem('q-math-003', 4, {
      questionPracticeState: 'FADED',
      attemptMeta: { total: 4, correct: 2, wrong: 2 },
      isCorrect: true,
      userAnswer: '错',
    }),
    buildDemoResultItem('q-math-009', 5, {
      questionPracticeState: 'MASTERED',
      attemptMeta: { total: 5, correct: 5, wrong: 0 },
      isCorrect: true,
      userAnswer: '对',
    }),
    buildDemoResultItem('q-math-010', 6, {
      questionPracticeState: 'GAP',
      attemptMeta: { total: 0, correct: 0, wrong: 0 },
      isCorrect: false,
      userAnswer: '',
    }),
  ],
  skillChanges: [
    { skillId: 's1', skillName: '找规律', oldLevel: 45, newLevel: 52 },
    { skillId: 's2', skillName: '勾股定理', oldLevel: 72, newLevel: 78 },
    { skillId: 's3', skillName: '二元一次方程', oldLevel: 60, newLevel: 58 },
  ],
  aiComment: '本次练习覆盖多种本题状态，可点击顶部题号切换查看「本题练习情况」各分支文案。',
};

const MOCK_SESSION_RESULT: QuizSessionResult = MOCK_PRACTICE_STATE_SESSION;

const DEMO_PRACTICE_PROFILES: Array<{
  questionPracticeState: CognitiveState;
  attemptMeta: QuestionAttemptMeta;
}> = [
  { questionPracticeState: 'GAP', attemptMeta: { total: 4, correct: 0, wrong: 4 } },
  { questionPracticeState: 'GAP', attemptMeta: { total: 0, correct: 0, wrong: 0 } },
  { questionPracticeState: 'GAP', attemptMeta: { total: 3, correct: 1, wrong: 2 } },
  { questionPracticeState: 'FADED', attemptMeta: { total: 4, correct: 2, wrong: 2 } },
  { questionPracticeState: 'MASTERED', attemptMeta: { total: 5, correct: 5, wrong: 0 } },
  { questionPracticeState: 'GAP', attemptMeta: { total: 0, correct: 0, wrong: 0 } },
];

const isQuizResultItemUnanswered = (q: QuizResultItem) => {
  const userRaw = q.rawUserAnswer ?? q.userAnswer;
  const userArr = Array.isArray(userRaw) ? userRaw : [userRaw];
  return userArr.map((v) => String(v ?? '').trim()).filter(Boolean).length === 0;
};

const pickPracticeProfile = (index: number, total: number) => {
  if (total >= 6) return DEMO_PRACTICE_PROFILES[index % DEMO_PRACTICE_PROFILES.length];
  if (total >= 3) {
    const compact = [DEMO_PRACTICE_PROFILES[0], DEMO_PRACTICE_PROFILES[3], DEMO_PRACTICE_PROFILES[4]];
    return compact[index % compact.length];
  }
  if (total === 2) {
    return [DEMO_PRACTICE_PROFILES[0], DEMO_PRACTICE_PROFILES[3]][index];
  }
  return DEMO_PRACTICE_PROFILES[0];
};

/** 多题结果页：为每道题 mock 本题练习状态（开发/演示用，≥2 题生效） */
export const enrichQuizResultWithPracticeStates = (
  questions: QuizResultItem[],
): QuizResultItem[] => {
  if (questions.length < 2) return questions;
  return questions.map((q, idx) => {
    if (isQuizResultItemUnanswered(q)) {
      const hasHistory = (q.attemptMeta?.total ?? 0) > 0;
      return {
        ...q,
        attemptMeta: q.attemptMeta ?? { total: 0, correct: 0, wrong: 0 },
        questionPracticeState: hasHistory ? q.questionPracticeState : undefined,
      };
    }
    const profile = pickPracticeProfile(idx, questions.length);
    return {
      ...q,
      questionPracticeState: profile.questionPracticeState,
      attemptMeta: profile.attemptMeta,
    };
  });
};

export const enrichQuizSessionWithPracticeStates = (
  session: QuizSessionResult,
): QuizSessionResult => ({
  ...session,
  questions: enrichQuizResultWithPracticeStates(session.questions),
});

const formatAnswerPreview = (value: unknown) => {
  if (Array.isArray(value)) return value.map((v) => String(v ?? '')).filter(Boolean).join('、');
  return String(value ?? '');
};

const isAnswerMatch = (userAns: unknown, correct?: string | string[]) => {
  if (userAns === undefined || userAns === null || correct === undefined) return false;
  if (Array.isArray(correct)) {
    const ua = Array.isArray(userAns) ? userAns : [userAns];
    return JSON.stringify(ua.map(String)) === JSON.stringify(correct.map(String));
  }
  if (typeof correct === 'string') {
    if (Array.isArray(userAns)) return userAns.map(String).includes(correct);
    return String(userAns).trim() === correct.trim();
  }
  return false;
};

const buildPracticeQuestion = (
  questionId: string,
  fallback?: UniversalQuizQuestion,
): UniversalQuizQuestion | null => {
  const fromBank = allQuestions.find((q) => q.id === questionId);
  if (fromBank) {
    return {
      id: fromBank.id,
      type: fromBank.type,
      content: fromBank.content,
      result: fromBank.result,
      difficulty: fromBank.difficulty,
      knowledgePoints: fromBank.knowledgePoints,
      category: fromBank.category,
      subject: fromBank.subject,
      tags: fromBank.tags,
    };
  }
  return fallback ? { ...fallback, userAnswer: undefined } : null;
};

// --- Components ---

const RadarChart = ({ skills }: { skills: SkillChange[] }) => {
  // Simplified visual representation for now
  return (
    <div className="flex flex-col justify-center h-full gap-4 py-2">
      {skills.map(skill => {
        const isUp = skill.newLevel > skill.oldLevel;
        return (
          <div key={skill.skillId} className="space-y-1.5">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-500">{skill.skillName}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs font-black text-slate-700">Lv.{Math.floor(skill.newLevel / 10)}</span>
                {isUp && (
                  <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1 rounded">
                    +{skill.newLevel - skill.oldLevel}
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: `${skill.oldLevel}%` }}
                animate={{ width: `${skill.newLevel}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-indigo-500 rounded-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const UniversalQuizResult: React.FC<{
  onClose?: () => void;
  onRestart?: () => void;
  onNext?: () => void;
  initialData?: QuizSessionResult;
  userStats?: UserStats;
  onStartRemedial?: (qs: any[]) => void;
  onOpenAITutor?: (question?: QuizResultItem) => void;
  reviewMode?: boolean;
}> = ({ onClose, initialData = MOCK_SESSION_RESULT, userStats, onStartRemedial, onOpenAITutor }) => {
  const [resultData, setResultData] = useState<QuizSessionResult>(initialData);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [similarPractice, setSimilarPractice] = useState<UniversalQuizQuestion | null>(null);
  const [retryQuestionId, setRetryQuestionId] = useState<string | null>(null);
  const [activeKpId, setActiveKpId] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setResultData(initialData);
    const shouldAutoOpenDetail =
      initialData.sessionId === 'demo_practice_states' ||
      initialData.questions.some((q) => q.questionPracticeState);
    if (!shouldAutoOpenDetail || !initialData.questions[0]) {
      setSelectedQuestionId(null);
      setShowSummary(true);
      return;
    }
    setSelectedQuestionId(initialData.questions[0].questionId);
    setShowSummary(false);
    setReviewIndex(0);
  }, [initialData.sessionId]);

  // Stats
  const score = Math.round((resultData.correctCount / resultData.totalCount) * 100);
  const isPerfect = score === 100;
  const wrongQuestions = resultData.questions.filter(q => !q.isCorrect);
  const unreviewedCount = wrongQuestions.filter(q => !q.userMistakeTags?.length).length;
  const showRemedialFloat = !isPerfect && unreviewedCount > 0;
  const totalXp = resultData.rewards.baseXp + resultData.rewards.bonusXp;

  // 知识点统计用于状态着色
  const knowledgePointStats = useMemo(() => {
    const stats: Record<string, { total: number; correct: number }> = {};
    resultData.questions.forEach((q) => {
      const kpList = q.knowledgePoints && q.knowledgePoints.length ? q.knowledgePoints : [q.knowledgePoint].filter(Boolean);
      kpList.forEach((kp) => {
        if (!kp) return;
        if (!stats[kp]) stats[kp] = { total: 0, correct: 0 };
        stats[kp].total += 1;
        if (q.isCorrect) stats[kp].correct += 1;
      });
    });
    return stats;
  }, [resultData]);

  const getHealthChange = (kp: string) => {
    const view = getMasteryView('demo-s1', kp);
    return { before: view.score, after: view.score, delta: 0 };
  };

  const getDeltaMeta = (delta: number) => {
    if (delta > 0) {
      return {
        text: `+${delta}`,
        valueClass: 'text-emerald-600',
        chipClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      };
    }
    if (delta < 0) {
      return {
        text: `${delta}`,
        valueClass: 'text-rose-600',
        chipClass: 'bg-rose-50 text-rose-700 border-rose-100',
      };
    }
    return {
      text: '±0',
      valueClass: 'text-slate-400',
      chipClass: 'bg-slate-50 text-slate-500 border-slate-100',
    };
  };

  const getKpStatusBadgeClass = (label: string) => {
    if (label === '已掌握') return 'bg-emerald-100 text-emerald-600';
    if (label === '待复习' || label === '需复习') return 'bg-amber-100 text-amber-700';
    if (label === '待攻克' || label === '未掌握') return 'bg-rose-100 text-rose-600';
    if (label === '未知') return 'bg-slate-100 text-slate-500';
    return 'bg-blue-100 text-blue-600';
  };

  const getKpCardSurfaceClass = (delta: number, isActive: boolean) => {
    if (isActive) {
      if (delta < 0) return 'bg-rose-50 border-rose-200 ring-2 ring-rose-100';
      if (delta > 0) return 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-100';
      return 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-100';
    }
    if (delta < 0) return 'bg-rose-50/40 border-rose-100/90 hover:bg-rose-50 hover:border-rose-200';
    return 'bg-white/75 border-white hover:bg-white hover:border-indigo-100';
  };

  const getKpStatus = (kp: string) => {
    const view = getMasteryView('demo-s1', kp);
    const color =
      view.status === 'mastered' ? 'bg-emerald-500' :
      view.status === 'reviewing' ? 'bg-amber-400' :
      view.status === 'weak' ? 'bg-rose-500' :
      view.status === 'unknown' ? 'bg-slate-400' :
      'bg-blue-500';
    return { label: view.label, color };
  };

  const getPrimaryActionLabel = (statusLabel: string) => {
    if (statusLabel === '已掌握') return '挑战高阶';
    if (statusLabel === '待复习' || statusLabel === '需复习') return '巩固强化';
    return '专项攻克';
  };

  type QuestionOutcome = 'correct' | 'partial' | 'wrong' | 'unanswered';
  const getQuestionOutcome = (q: QuizResultItem): QuestionOutcome => {
    const userRaw = q.rawUserAnswer ?? q.userAnswer;
    const correctRaw = q.rawCorrectAnswer ?? q.correctAnswer;

    const userArr = Array.isArray(userRaw) ? userRaw : [userRaw];
    const correctArr = Array.isArray(correctRaw) ? correctRaw : [correctRaw];
    const normalizedUser = userArr
      .map(v => String(v ?? '').trim())
      .filter(Boolean);
    const normalizedCorrect = correctArr
      .map(v => String(v ?? '').trim())
      .filter(Boolean);

    if (normalizedUser.length === 0) return 'unanswered';
    if (q.isCorrect) return 'correct';
    if (normalizedCorrect.length > 1) {
      const hitCount = normalizedUser.filter(v => normalizedCorrect.includes(v)).length;
      if (hitCount > 0 && hitCount < normalizedCorrect.length) return 'partial';
    }
    return 'wrong';
  };

  const OUTCOME_STYLE: Record<QuestionOutcome, { chip: string; label: string }> = {
    correct: { chip: 'bg-emerald-50 border-emerald-200 text-emerald-700', label: '正确' },
    partial: { chip: 'bg-amber-50 border-amber-200 text-amber-700', label: '半对' },
    wrong: { chip: 'bg-rose-50 border-rose-200 text-rose-700', label: '错误' },
    unanswered: { chip: 'bg-slate-50 border-slate-200 text-slate-500', label: '未答' },
  };
  
  // Handlers

  const handleTagSelect = (questionId: string, tagKeys: MistakeReasonKey[]) => {
    recordMistakeReasons(questionId, tagKeys);
    setResultData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.questionId === questionId ? { ...q, userMistakeTags: tagKeys } : q
      )
    }));
  };

  const buildOptionViews = (q: QuizResultItem) => {
    if (!q.options) return [];

    const correctVals = Array.isArray(q.rawCorrectAnswer)
      ? q.rawCorrectAnswer.map((v: any) => (v ?? '').toString())
      : [q.rawCorrectAnswer ?? ''];

    const userVals = Array.isArray(q.rawUserAnswer)
      ? q.rawUserAnswer.map((v: any) => (v ?? '').toString())
      : [q.rawUserAnswer ?? ''];

    return q.options.map((opt, idx) => {
      const label = String.fromCharCode(65 + idx);
      const normalizedOpt = opt.replace(/^[A-Z]\.\s*/, '');

      const isCorrect =
        correctVals.includes(label) ||
        correctVals.includes(opt) ||
        correctVals.includes(normalizedOpt);

      const isUserSelected =
        userVals.includes(label) ||
        userVals.includes(opt) ||
        userVals.includes(normalizedOpt);

      return {
        label,
        text: normalizedOpt,
        isCorrect,
        userSelected: isUserSelected,
      };
    });
  };

  const reviewQuestions: UniversalQuizQuestion[] = useMemo(
    () =>
      resultData.questions.map((q) => ({
        id: q.questionId,
        type: q.questionType || 'single_choice',
        content: {
          stem: q.stemSummary,
          options: q.options,
        },
        result: {
          correctAnswer: q.rawCorrectAnswer ?? q.correctAnswer,
          explanation: q.explanation || '',
        },
        userAnswer: q.rawUserAnswer ?? q.userAnswer,
        difficulty: q.difficulty,
        knowledgePoints: q.knowledgePoints || (q.knowledgePoint ? [q.knowledgePoint] : []),
        subject: q.subject,
      })),
    [resultData.questions],
  );

  const sessionReview = useMemo(() => {
    const map: Record<string, QuizSessionReviewItem> = {};
    resultData.questions.forEach((q) => {
      map[q.questionId] = {
        isCorrect: q.isCorrect,
        userAnswer: q.rawUserAnswer ?? q.userAnswer,
        reviewed: Boolean(q.userMistakeTags?.length),
      };
    });
    return map;
  }, [resultData.questions]);

  const currentSelectedQuestion = selectedQuestionId
    ? resultData.questions.find((q) => q.questionId === selectedQuestionId)
    : null;

  const handleRetrySubmit = (payload: any) => {
    const { answers } = normalizeQuizSubmitPayload(payload);
    if (!similarPractice || !retryQuestionId) {
      setSimilarPractice(null);
      setRetryQuestionId(null);
      return;
    }

    const userAnswer = answers[similarPractice.id];
    const correctRaw = similarPractice.result?.correctAnswer;
    const isCorrect = isAnswerMatch(userAnswer, correctRaw);
    const questionId = retryQuestionId;

    setResultData((prev) => {
      const questions = prev.questions.map((q) => {
        if (q.questionId !== questionId) return q;
        const prevMeta = (q as QuizResultItem & { attemptMeta?: { total: number; correct: number; wrong: number } }).attemptMeta ?? {
          total: 1,
          correct: q.isCorrect ? 1 : 0,
          wrong: q.isCorrect ? 0 : 1,
        };
        const attemptMeta = {
          total: prevMeta.total + 1,
          correct: prevMeta.correct + (isCorrect ? 1 : 0),
          wrong: prevMeta.wrong + (isCorrect ? 0 : 1),
        };
        return {
          ...q,
          isCorrect,
          userAnswer: formatAnswerPreview(userAnswer),
          rawUserAnswer: userAnswer as string | string[],
          userMistakeTags: isCorrect ? undefined : q.userMistakeTags,
          attemptMeta,
        };
      });
      const correctCount = questions.filter((q) => q.isCorrect).length;
      return {
        ...prev,
        questions,
        correctCount,
        score: Math.round((correctCount / Math.max(prev.totalCount, 1)) * 100),
      };
    });

    setSimilarPractice(null);
    setRetryQuestionId(null);
    setSelectedQuestionId(questionId);
    setShowSummary(false);
  };

  const openRetryPractice = (questionId: string) => {
    const fallback = reviewQuestions.find((q) => q.id === questionId);
    const practiceQuestion = buildPracticeQuestion(questionId, fallback);
    if (!practiceQuestion) return;
    setRetryQuestionId(questionId);
    setSimilarPractice(practiceQuestion);
  };

  const openSimilarPractice = (question: UniversalQuizQuestion) => {
    setRetryQuestionId(null);
    setSimilarPractice(question);
  };

  const handleSimilarSubmit = (payload: unknown) => {
    if (!similarPractice) {
      setSimilarPractice(null);
      return;
    }
    const { answers } = normalizeQuizSubmitPayload(payload);
    const userAnswer = answers[similarPractice.id];
    const correctRaw = similarPractice.result?.correctAnswer;
    const isCorrect = isAnswerMatch(userAnswer, correctRaw);
    recordSimilarAttempt(similarPractice.id, isCorrect);
    setSimilarPractice(null);
    setRetryQuestionId(null);
  };

  return (
    <div className="w-full h-full bg-slate-50 flex flex-col overflow-hidden relative">
      <div className="flex-none px-4 md:px-6 py-3 flex items-center gap-3 bg-white/95 backdrop-blur border-b border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
          aria-label="返回"
        >
          <ChevronRight size={18} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={() => {
            setSelectedQuestionId(null);
            setShowSummary(true);
          }}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
            showSummary
              ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
              : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-100'
          }`}
        >
          总结
        </button>
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 px-1">
            {resultData.questions.map((q, idx) => {
              const outcome = getQuestionOutcome(q);
              const isSelected = currentSelectedQuestion?.questionId === q.questionId;
              return (
                <button
                  key={q.questionId}
                  type="button"
                  onClick={() => {
                    setSelectedQuestionId(q.questionId);
                    setShowSummary(false);
                    setReviewIndex(idx);
                  }}
                  className={`shrink-0 px-2.5 h-8 rounded-full border text-xs font-black transition-all ${
                    OUTCOME_STYLE[outcome].chip
                  } ${isSelected ? 'ring-2 ring-indigo-200' : ''}`}
                  title={`第${q.index}题 · ${OUTCOME_STYLE[outcome].label}${q.questionPracticeState ? ` · ${PRACTICE_STATE_LABEL[q.questionPracticeState]}` : ''}`}
                >
                  {q.index} {OUTCOME_STYLE[outcome].label}
                </button>
              );
            })}
          </div>
        </div>

        {showRemedialFloat && (
          <div className="shrink-0 flex flex-col items-end gap-0.5 pl-1">
            <button
              type="button"
              title="复盘得金币"
              onClick={() => {
                const payload = wrongQuestions.map((q) => ({
                  id: q.questionId,
                  type: (q.questionType as any) || 'single',
                  content: {
                    stem: q.stemSummary,
                    options: q.options,
                    audioUrl: undefined,
                    transcript: undefined,
                    examRules: undefined,
                    subQuestions: undefined,
                  },
                  result: {
                    correctAnswer: q.rawCorrectAnswer ?? q.correctAnswer,
                    explanation: q.explanation,
                  },
                  tags: q.knowledgePoints || (q.knowledgePoint ? [q.knowledgePoint] : []),
                  difficulty: q.difficulty,
                  category: undefined,
                  knowledgePoints: q.knowledgePoints || (q.knowledgePoint ? [q.knowledgePoint] : []),
                  subject: q.subject,
                }));
                onStartRemedial?.(payload);
                if (!payload.length) {
                  const firstUnreviewed = wrongQuestions.find(q => !q.userMistakeTags?.length);
                  if (firstUnreviewed) setSelectedQuestionId(firstUnreviewed.questionId);
                }
              }}
              className="h-10 px-4 bg-slate-900 text-white rounded-full font-black text-xs shadow-md shadow-slate-900/15 hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              消灭错题 ({unreviewedCount})
              <Coins size={12} className="text-amber-400 fill-amber-400 ml-0.5" />
            </button>
            <span className="text-[8px] font-medium text-amber-600/60 leading-none pr-0.5">复盘得金币</span>
          </div>
        )}
      </div>

      {/* --- Main Content (Scrollable) --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Inline Single Question Result under recap */}
          {currentSelectedQuestion && (
            <div className="mt-4">
              <SingleQuestionResultCard
                key={`${currentSelectedQuestion.questionId}-${currentSelectedQuestion.userAnswer}-${currentSelectedQuestion.isCorrect}`}
                layout="inline"
                subject={currentSelectedQuestion.subject as any}
                questionId={currentSelectedQuestion.questionId}
                questionType={currentSelectedQuestion.questionType}
                difficulty={currentSelectedQuestion.difficulty}
                stem={currentSelectedQuestion.stemSummary}
                options={buildOptionViews(currentSelectedQuestion) as any}
                userAnswerPreview={
                  getQuestionOutcome(currentSelectedQuestion) === 'unanswered'
                    ? ''
                    : currentSelectedQuestion.userAnswer
                }
                correctAnswerPreview={currentSelectedQuestion.correctAnswer}
                explanationText={currentSelectedQuestion.explanation}
                knowledgePoints={
                  (currentSelectedQuestion.knowledgePoints || [currentSelectedQuestion.knowledgePoint])
                    .filter(Boolean)
                    .map((kp) => ({ id: kp, label: kp, color: '#6366F1' }))
                }
                status={getQuestionOutcome(currentSelectedQuestion) === 'correct' ? 'correct' : 'wrong'}
                timeUsedSec={currentSelectedQuestion.timeSpentSec || 45}
                attemptStats={(() => {
                  const outcome = getQuestionOutcome(currentSelectedQuestion);
                  const hasAttemptMeta = Boolean(currentSelectedQuestion.attemptMeta);
                  if (hasAttemptMeta) {
                    return {
                      totalAttempts: currentSelectedQuestion.attemptMeta!.total,
                      correctCount: currentSelectedQuestion.attemptMeta!.correct,
                      wrongCount: currentSelectedQuestion.attemptMeta!.wrong,
                      lastAttemptAt: '刚刚',
                    };
                  }
                  if (outcome === 'unanswered') {
                    return { totalAttempts: 0, correctCount: 0, wrongCount: 0, lastAttemptAt: '—' };
                  }
                  return {
                    totalAttempts: 1,
                    correctCount: outcome === 'correct' ? 1 : 0,
                    wrongCount: outcome === 'correct' ? 0 : 1,
                    lastAttemptAt: '刚刚',
                  };
                })()}
                questionPracticeState={
                  getQuestionOutcome(currentSelectedQuestion) === 'unanswered'
                    && (currentSelectedQuestion.attemptMeta?.total ?? 0) === 0
                    ? undefined
                    : currentSelectedQuestion.questionPracticeState
                }
                showMistakeTags={!currentSelectedQuestion.isCorrect}
                selectedMistakeReasons={currentSelectedQuestion.userMistakeTags ?? []}
                onMistakeReasonSelect={(reasons) =>
                  handleTagSelect(currentSelectedQuestion.questionId, reasons)
                }
                onClose={() => setSelectedQuestionId(null)}
                onRetry={() => openRetryPractice(currentSelectedQuestion.questionId)}
                onViewAnalysis={() => setReviewOpen(true)}
                onSimilarItemSelect={(id) => {
                  const mq = mathQuestions.find((q) => q.id === id);
                  if (!mq) return;
                  openSimilarPractice({
                    id: mq.id,
                    type: mq.type,
                    content: mq.content,
                    result: mq.result,
                    difficulty: mq.difficulty,
                    knowledgePoints: mq.knowledgePoints,
                    subject: mq.subject,
                  });
                }}
                onOpenAITutor={() => onOpenAITutor?.(currentSelectedQuestion)}
              />
            </div>
          )}

          {/* Summary */}
          {showSummary && !currentSelectedQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-indigo-100 via-violet-100 to-sky-100 p-4 md:p-6 shadow-sm border border-white/70"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_95%_18%,rgba(255,255,255,0.65),transparent_32%)]" />
              <div className="relative z-10 space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)] gap-5 items-stretch">
                  <div className="relative min-h-[230px] rounded-[30px] bg-white/55 border border-white/70 shadow-sm p-5 overflow-hidden">
                    <div className="absolute -left-4 top-3 h-36 w-28 rounded-full bg-gradient-to-b from-white/80 to-indigo-100/60 blur-sm" />
                    <div className="relative z-10 flex h-full items-end gap-4">
                      <div className="hidden sm:flex w-28 self-stretch items-center justify-center">
                        <div className="relative">
                          <div className="h-28 w-20 rounded-full bg-gradient-to-b from-indigo-200 to-sky-100 shadow-inner" />
                          <div className="absolute -top-6 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full bg-gradient-to-b from-amber-100 to-orange-100 border-4 border-white shadow-sm flex items-center justify-center text-2xl">
                            🐰
                          </div>
                          <div className="absolute -right-4 top-10 h-9 w-7 rotate-12 rounded-lg bg-amber-100 border border-white shadow-sm" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-5">
                        <div>
                          <div className="text-lg md:text-xl font-black text-indigo-700">
                            {isPerfect ? '完美通关！' : score >= 80 ? '你本次表现太棒了！' : score >= 60 ? '继续加油，进步很明显！' : '别灰心，我们继续补强！'}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-3 text-slate-700">
                            <div>
                              <div className="text-xs font-bold text-slate-500">题目数量</div>
                              <div className="text-2xl font-black text-slate-900">{resultData.totalCount}</div>
                            </div>
                            <div>
                              <div className="text-xs font-bold text-slate-500">正确率</div>
                              <div className="text-2xl font-black text-slate-900">{score}%</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/75 border border-white px-3 py-3 shadow-sm">
                            <Clock size={18} className="text-emerald-500" />
                            <span className="text-sm font-black text-slate-700">{Math.floor(resultData.totalTimeSec / 60)}min{resultData.totalTimeSec % 60}s</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/75 border border-white px-3 py-3 shadow-sm">
                            <Sparkles size={18} className="text-cyan-500" />
                            <span className="text-sm font-black text-slate-700">+{totalXp}</span>
                          </div>
                          <div className="flex items-center justify-center gap-2 rounded-2xl bg-white/75 border border-white px-3 py-3 shadow-sm">
                            <Coins size={18} className="text-amber-500" />
                            <span className="text-sm font-black text-slate-700">+{resultData.rewards.coins}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[30px] bg-white/55 border border-white/70 shadow-sm p-5 md:p-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-12 w-12 rounded-full bg-white border border-indigo-100 shadow-sm flex items-center justify-center text-xl">🐰</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800">结果点评</span>
                          <Sparkles size={14} className="text-indigo-500" />
                        </div>
                        <div className="text-xs font-bold text-slate-400">小晤学习助手</div>
                      </div>
                    </div>
                    <div className="relative rounded-3xl bg-white/45 p-5 text-sm md:text-base font-semibold leading-8 text-slate-700">
                      <div className="absolute left-4 top-2 text-6xl font-black text-indigo-200/50 leading-none">“</div>
                      <p className="relative z-10 pl-7">
                        {resultData.aiComment}
                      </p>
                      <div className="absolute right-5 bottom-1 text-6xl font-black text-indigo-200/50 leading-none">”</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[30px] bg-white/45 border border-white/70 shadow-sm p-5 md:p-6">
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black text-slate-900">知识点健康分</h3>
                        <Sparkles size={16} className="text-indigo-500" />
                      </div>
                      <p className="text-sm text-slate-500 mt-2 font-semibold">本次测试涉及的关键知识点与健康分变化</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(Object.keys(knowledgePointStats).length ? Object.keys(knowledgePointStats) : resultData.skillChanges.map(skill => skill.skillName))
                      .slice(0, 8)
                      .map((kp, idx) => {
                        const status = getKpStatus(kp);
                        const health = getHealthChange(kp);
                        const deltaMeta = getDeltaMeta(health.delta);
                        const isActive = activeKpId === kp;
                        return (
                          <button
                            type="button"
                            key={`${kp}-${idx}`}
                            onClick={() => setActiveKpId((prev) => (prev === kp ? null : kp))}
                            className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${getKpCardSurfaceClass(health.delta, isActive)}`}
                          >
                            <span className={`absolute right-0 top-0 rounded-bl-xl px-3 py-1 text-[10px] font-black ${getKpStatusBadgeClass(status.label)}`}>
                              {status.label}
                            </span>
                            <div className="text-base font-black text-slate-800 pr-12 truncate">{kp}</div>
                            <div className="mt-3 text-xs font-semibold text-slate-500">
                              健康分：<span className="font-black text-slate-800">{health.after}</span>
                              <span className={`ml-1 font-black ${deltaMeta.valueClass}`}>({deltaMeta.text})</span>
                            </div>
                          </button>
                        );
                      })}
                  </div>

                {activeKpId && (
                  <div className="mt-4 rounded-2xl border border-white/80 bg-white/70 p-4 space-y-3 shadow-sm">
                    {(() => {
                      const status = getKpStatus(activeKpId);
                      const health = getHealthChange(activeKpId);
                      const stat = knowledgePointStats[activeKpId] || { total: 0, correct: 0 };
                      const deltaMeta = getDeltaMeta(health.delta);
                      const primaryLabel = getPrimaryActionLabel(status.label);
                      const accuracy = stat.total ? Math.round((stat.correct / stat.total) * 100) : 0;
                      return (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-800">{activeKpId}</span>
                                <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-500">
                                  {status.label}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 font-semibold">
                                健康分 {health.after}
                                <span className={`ml-1 font-black ${deltaMeta.valueClass}`}>（{deltaMeta.text}）</span>
                                ，此次练习正确率 {accuracy}% · 共 {stat.total} 题
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                            >
                              {primaryLabel}
                            </button>
                            <button
                              type="button"
                              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-black hover:bg-white transition-all"
                            >
                              知识点题集
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {reviewOpen && (
        <div className="absolute inset-0 z-50 bg-white">
          <UniversalQuizView
            mode="analysis"
            questions={reviewQuestions}
            initialQuestionIndex={reviewIndex}
            sessionReview={sessionReview}
            showSummaryTab
            onGoToSummary={() => setReviewOpen(false)}
            onClose={() => setReviewOpen(false)}
            onStartSimilarPractice={(q) => openSimilarPractice(q)}
            themeColor="indigo"
          />
        </div>
      )}

      {similarPractice && (
        <div className="absolute inset-0 z-[60] bg-white">
          <UniversalQuizView
            mode="practice"
            questions={[similarPractice]}
            singleQuestionMode
            onClose={() => {
              setSimilarPractice(null);
              setRetryQuestionId(null);
            }}
            onSubmit={retryQuestionId ? handleRetrySubmit : handleSimilarSubmit}
            themeColor="indigo"
          />
        </div>
      )}

    </div>
  );
};

export default UniversalQuizResult;
