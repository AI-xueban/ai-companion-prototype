import React, { useCallback, useMemo, useState, useRef } from 'react';
import { UniversalQuizView, UniversalQuizQuestion } from './UniversalQuizView';
import { UniversalQuizResult, QuizSessionResult } from './UniversalQuizResult';
import {
  afterSteppingSubmit,
  initSteppingSession,
  pickQuestionByDifficulty,
  SteppingSession,
  SteppingStopReason,
} from '../../services/questionSteppingService';
import { QuestionItem, getQuestionsBySubject } from '../../data/questionBank';
import { UserStats } from '../../types';
import { grantQuizSessionReward } from '../../services/rewardService';
import type { RewardGrantResult } from '../../types/reward';

interface SteppingQuizPageProps {
  onExit: () => void;
  onRewardGranted?: (result: RewardGrantResult) => void;
  subject: 'math' | 'chinese' | 'english';
  knowledgePointId?: string;
  knowledgePointLabel?: string;
  grade?: number | string | null;
  userStats?: UserStats;
  scenario?: 'daily_task' | 'star_track';
  timeRemainingSec?: number;
}

const adaptQuestion = (q: QuestionItem): UniversalQuizQuestion => ({
  id: q.id,
  type: q.type,
  content: {
    stem: q.content.stem,
    options: q.content.options,
    audioUrl: q.content.audioUrl,
    transcript: q.content.transcript,
    examRules: q.content.examRules,
    subQuestions: q.content.subQuestions,
  },
  result: q.result,
  tags: q.tags,
  difficulty: q.difficulty,
  category: q.category,
  knowledgePoints: q.knowledgePoints,
  subject: q.subject,
});

const isAnswerMatch = (userAns: unknown, correct: unknown) =>
  JSON.stringify(userAns ?? '') === JSON.stringify(correct ?? '');

export const SteppingQuizPage: React.FC<SteppingQuizPageProps> = ({
  onExit,
  onRewardGranted,
  subject,
  knowledgePointId,
  knowledgePointLabel,
  grade,
  userStats,
  scenario = 'daily_task',
  timeRemainingSec,
}) => {
  const pool = useMemo(() => getQuestionsBySubject(subject), [subject]);

  const [session, setSession] = useState<SteppingSession>(() =>
    initSteppingSession({
      grade,
      scenario,
      timeRemainingSec,
      knowledgePointId,
    }),
  );
  const questionStartedRef = useRef(performance.now());
  const [history, setHistory] = useState<
    Array<{ question: UniversalQuizQuestion; userAnswer: unknown; isCorrect: boolean; timeSpentSec: number }>
  >([]);
  const [currentQuestion, setCurrentQuestion] = useState<UniversalQuizQuestion | null>(() => {
    const first = pickQuestionByDifficulty(pool, session.currentDiff, []);
    return first ? adaptQuestion(first) : null;
  });
  const [viewKey, setViewKey] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [stopReason, setStopReason] = useState<SteppingStopReason | undefined>();
  const [resultData, setResultData] = useState<QuizSessionResult | null>(null);

  const finishSession = useCallback(
    (
      nextHistory: Array<{ question: UniversalQuizQuestion; userAnswer: unknown; isCorrect: boolean; timeSpentSec: number }>,
      reason?: SteppingStopReason,
    ) => {
      setStopReason(reason);
      const processed = nextHistory.map((item, index) => ({
        questionId: item.question.id,
        index: index + 1,
        isCorrect: item.isCorrect,
        timeSpentSec: item.timeSpentSec,
        difficulty: item.question.difficulty || session.currentDiff,
        stemSummary: item.question.content.stem,
        correctAnswer: String(item.question.result?.correctAnswer ?? ''),
        userAnswer: String(item.userAnswer ?? ''),
        subject,
        knowledgePoint: knowledgePointLabel || item.question.knowledgePoints?.[0] || '综合',
        questionType: item.question.type,
        options: item.question.content.options,
        explanation: item.question.result?.explanation,
        knowledgePoints: item.question.knowledgePoints,
        rawCorrectAnswer: item.question.result?.correctAnswer,
        rawUserAnswer: item.userAnswer,
      }));

      const correctCount = processed.filter((q) => q.isCorrect).length;
      const grantResult = grantQuizSessionReward({ sessionId: crypto.randomUUID(), quizSetId: 'stepping_' + processed.map(q => q.questionId).join('_'), title: '逐题探索练习', correctCount, totalCount: processed.length, questions: processed, questionTimesSec: processed.map(q => q.timeSpentSec), totalTimeSec: processed.reduce((sum,q) => sum + q.timeSpentSec, 0) });
      onRewardGranted?.(grantResult);
      setResultData({
        sessionId: `stepping_${Date.now()}`,
        timestamp: Date.now(),
        totalTimeSec: processed.reduce((sum,q) => sum + q.timeSpentSec, 0),
        score: Math.round((correctCount / Math.max(processed.length, 1)) * 100),
        correctCount,
        totalCount: processed.length,
        questions: processed,
        rewards: { baseXp: grantResult.xp, bonusXp: 0, coins: grantResult.coins },
        grantResult,
        skillChanges: [],
        aiComment:
          reason === 'micro_lesson_required'
            ? '这个知识点需要先看微课再继续练习，别灰心！'
            : reason === 'consecutive_wrong_3'
              ? '连续错了几题，我们先复习一下再继续。'
              : '本轮探索完成，继续保持！',
      });
      setShowResult(true);
    },
    [knowledgePointLabel, session.currentDiff, subject, onRewardGranted],
  );

  const handleSteppingNext = useCallback(
    (payload: Record<string, unknown>) => {
      if (!currentQuestion) return;

      const userAns = payload[currentQuestion.id];
      const isCorrect = isAnswerMatch(userAns, currentQuestion.result?.correctAnswer);
      const lastR = (isCorrect ? 1 : 0) as 0 | 1;
      const nextHistory = [...history, { question: currentQuestion, userAnswer: userAns, isCorrect, timeSpentSec: (performance.now() - questionStartedRef.current) / 1000 }];
      questionStartedRef.current = performance.now();

      const step = afterSteppingSubmit(
        {
          ...session,
          doneQuestionIds: [...session.doneQuestionIds, currentQuestion.id],
        },
        lastR,
      );

      setHistory(nextHistory);
      setSession(step.session);

      if (step.shouldStop) {
        finishSession(nextHistory, step.stopReason);
        return;
      }

      const raw = pickQuestionByDifficulty(
        pool,
        step.nextDiff ?? step.session.currentDiff,
        step.session.doneQuestionIds,
      );

      if (!raw) {
        finishSession(nextHistory, 'target_reached');
        return;
      }

      setCurrentQuestion(adaptQuestion(raw));
      setViewKey((k) => k + 1);
    },
    [currentQuestion, finishSession, history, pool, session],
  );

  if (!currentQuestion && !showResult) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center space-y-3">
          <p className="text-slate-500 font-semibold">暂无匹配难度的题目</p>
          <button onClick={onExit} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold">
            返回
          </button>
        </div>
      </div>
    );
  }

  if (showResult && resultData) {
    return (
      <div className="absolute inset-0 z-50 bg-white">
        <UniversalQuizResult
          initialData={resultData}
          userStats={userStats}
          onClose={onExit}
          onNext={onExit}
          onRestart={onExit}
        />
        {stopReason === 'micro_lesson_required' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
            建议先看微课再继续
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-white">
      <UniversalQuizView
        key={`${currentQuestion!.id}-${viewKey}`}
        mode="practice"
        variant="stepping"
        questions={[currentQuestion!]}
        onClose={onExit}
        onSteppingNext={handleSteppingNext}
        themeColor="indigo"
      />
    </div>
  );
};
