import React, { useState, useEffect, useMemo } from 'react';
import { Task } from '../../types';
import { isKgScopeMicroLessonTask, isSectionPracticeTask, SECTION_PRACTICE_DIFFICULTY, SECTION_PRACTICE_QUESTION_COUNT } from '../../utils/kgMicroLesson';
import { UniversalQuizView, UniversalQuizQuestion, normalizeQuizSubmitPayload } from './UniversalQuizView';
import { UniversalQuizResult, QuizSessionResult, enrichQuizResultWithPracticeStates } from './UniversalQuizResult';
import { getQuestionsBySubject, allQuestions } from '../../data/questionBank';
import { pickUnseenQuestions, markQuestionsPracticed } from '../../services/practicedQuestionStore';
import { markSyncPracticeDone, markSyncPracticeStarted } from '../../services/syncProgressStore';
import { grantQuizSessionReward, grantTaskCompleteReward, mergeRewardResults } from '../../services/rewardService';
import { RewardGrantResult } from '../../types/reward';
import { UserStats } from '../../types';
import type { LearningExitReason } from '../../types/learningReturn';

interface QuizPageProps {
  onExit: (reason?: LearningExitReason) => void;
  onReview?: () => void;
  task?: Task | null;
  overrideQuestions?: UniversalQuizQuestion[];
  onStartRemedial?: (qs: UniversalQuizQuestion[]) => void;
  onRewardGranted?: (result: RewardGrantResult) => void;
  onTaskComplete?: (task: Task) => void;
  todayTaskIds?: string[];
  isDailyConquer?: boolean;
  userStats?: UserStats;
}

export const QuizPage: React.FC<QuizPageProps> = ({
  onExit,
  onReview,
  task,
  overrideQuestions,
  onStartRemedial,
  onRewardGranted,
  onTaskComplete,
  todayTaskIds,
  isDailyConquer = false,
  userStats,
}) => {
  const isBossLevel = task?.levelType === 'boss';
  const isChapterMiniQuiz = isKgScopeMicroLessonTask(task);
  const isSectionPractice = isSectionPracticeTask(task);
  const [questions, setQuestions] = useState<UniversalQuizQuestion[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<QuizSessionResult | null>(null);

  // Load Data
  useEffect(() => {
    if (overrideQuestions?.length) {
      setQuestions(overrideQuestions);
      return;
    }
    let rawQuestions: any[] = [];

    if (task?.subject) {
      const subject =
        task.subject === '语文'
          ? 'chinese'
          : task.subject === '数学'
            ? 'math'
            : 'english';
      rawQuestions = getQuestionsBySubject(subject);
    } else {
      // 没有任务时取前 6 道题兜底
      rawQuestions = allQuestions.slice(0, 6);
    }

    const adaptedQuestions: UniversalQuizQuestion[] = rawQuestions.map((q) => ({
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
    }));

    const requestedCount = isSectionPractice
      ? (task?.questionCount ?? SECTION_PRACTICE_QUESTION_COUNT)
      : task?.questionCount;
    const targetDifficulty = isSectionPractice
      ? (task?.practiceDifficulty ?? SECTION_PRACTICE_DIFFICULTY)
      : task?.practiceDifficulty;
    let pool = adaptedQuestions;
    if (targetDifficulty) {
      const matched = pool.filter((q) => q.difficulty === targetDifficulty);
      const nearby = pool
        .filter((q) => q.difficulty !== targetDifficulty)
        .sort((a, b) => Math.abs((a.difficulty || 3) - targetDifficulty) - Math.abs((b.difficulty || 3) - targetDifficulty));
      pool = matched.length ? [...matched, ...nearby] : nearby;
    }

    if (isChapterMiniQuiz || isSectionPractice) {
      setQuestions(pickUnseenQuestions(pool, requestedCount ?? 5));
      return;
    }
    if (requestedCount) {
      setQuestions(pickUnseenQuestions(pool, requestedCount));
      return;
    }
    setQuestions(pickUnseenQuestions(pool, pool.length));
  }, [task, overrideQuestions, isChapterMiniQuiz, isSectionPractice]);

  const quizSetId = useMemo(
    () => task?.id ?? `set_${questions.map((q) => q.id).join('_')}`,
    [task?.id, questions],
  );

  const normalizeAnswer = (val: any): string => {
      if (Array.isArray(val)) {
          return val
            .map((v) => (v ?? '').toString().trim())
            .filter(Boolean)
            .sort()
            .join('|');
      }
      return (val ?? '').toString().trim();
  };

  const formatDisplayAnswer = (val: any): string => {
      if (Array.isArray(val)) {
          return val.map((v) => (v ?? '').toString().trim()).filter(Boolean).join(', ');
      }
      return (val ?? '').toString();
  };

  const handleQuizSubmit = (payload: any) => {
      const { answers: userAnswers } = normalizeQuizSubmitPayload(payload);
      // 1. Process answers to detailed result format
      const processedQuestions = questions.map((q, index) => {
          const userAnsRaw = userAnswers[q.id];
          const correctValRaw = q.result?.correctAnswer;

          const isCorrect = normalizeAnswer(userAnsRaw) === normalizeAnswer(correctValRaw);

          return {
              questionId: q.id,
              index: index + 1,
              isCorrect,
              timeSpentSec: 45, // Mock time per question
              difficulty: q.difficulty || 3,
              stemSummary: q.content.stem,
              correctAnswer: formatDisplayAnswer(correctValRaw),
              userAnswer: formatDisplayAnswer(userAnsRaw),
              subject: (q.subject || task?.subject || 'math') as any,
              knowledgePoint: q.knowledgePoints?.[0] || q.tags?.[0] || '综合',
              // Extra fields for richer result view
              questionType: q.type,
              options: q.content.options,
              explanation: q.result?.explanation,
              knowledgePoints: q.knowledgePoints,
              rawCorrectAnswer: correctValRaw,
              rawUserAnswer: userAnsRaw,
          };
      });
      markQuestionsPracticed(processedQuestions.map((q) => q.questionId));
      if (isSectionPractice && task?.syncPracticeMark) {
        markSyncPracticeDone(task.syncPracticeMark.bookKey, task.syncPracticeMark.practiceKey);
      }

      // 2. Calculate stats
      const correctCount = processedQuestions.filter(q => q.isCorrect).length;
      const score = Math.round((correctCount / questions.length) * 100);

      let grantResult = grantQuizSessionReward({
        sessionId: `sess_${Date.now()}`,
        quizSetId,
        correctCount,
        totalCount: questions.length,
        questions: processedQuestions.map((q) => ({
          difficulty: q.difficulty,
          isCorrect: q.isCorrect,
        })),
        totalTimeSec: processedQuestions.length * 45,
        isDailyConquer,
      });

      if (task && todayTaskIds?.includes(task.id)) {
        const taskResult = grantTaskCompleteReward({
          taskId: task.id,
          durationMinutes: task.durationMinutes,
          dayPlanTaskIds: todayTaskIds,
        });
        grantResult = mergeRewardResults(grantResult, taskResult);
        onTaskComplete?.(task);
      }

      if (grantResult.xp > 0 || grantResult.coins > 0) {
        onRewardGranted?.(grantResult);
      }

      // 3. Construct session result
      const sessionResult: QuizSessionResult = {
          sessionId: `sess_${Date.now()}`,
          timestamp: Date.now(),
          totalTimeSec: processedQuestions.length * 45,
          score,
          correctCount,
          totalCount: questions.length,
          questions: enrichQuizResultWithPracticeStates(processedQuestions),
          rewards: {
              baseXp: grantResult.xp,
              bonusXp: 0,
              coins: grantResult.coins,
          },
          grantResult,
          skillChanges: [
              { skillId: 'sk1', skillName: '代数思维', oldLevel: 40, newLevel: 45 },
              { skillId: 'sk2', skillName: '逻辑推理', oldLevel: 60, newLevel: 62 }
          ],
          aiComment: score === 100 
              ? "太棒了！你的表现无可挑剔，知识掌握得非常牢固。" 
              : score >= 60 
                  ? "整体表现不错，但在细节上还有提升空间，建议复盘错题。" 
                  : "别灰心，这次遇到了一些困难，我们可以通过针对性练习来攻克它。"
      };

      setResultData(sessionResult);
      setShowResult(true);
  };

  if (questions.length === 0) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="absolute inset-0 z-50 bg-white">
        {isChapterMiniQuiz && !showResult ? (
          <div className="absolute top-0 left-0 right-0 z-[60] px-4 pt-3 pb-2 bg-gradient-to-b from-indigo-50 to-transparent pointer-events-none">
            <p className="text-[10px] font-bold text-indigo-500">章节小测试</p>
            <p className="text-sm font-black text-slate-900 truncate">
              {task?.syncLesson?.scopeLabel ?? task?.title ?? '本章巩固'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">共 {questions.length} 题 · 检验本章掌握</p>
          </div>
        ) : null}
        {showResult && resultData ? (
            <UniversalQuizResult 
                initialData={resultData}
                userStats={userStats}
                onClose={() => onExit('complete')}
                onNext={() => {
                    if (onReview) onReview();
                    else onExit('complete');
                }}
                onRestart={() => {
                    setShowResult(false);
                    setResultData(null);
                    // Reset UniversalQuizView state would be needed here, 
                    // but since we unmount it below, it should reset automatically when re-mounted.
                }}
                onStartRemedial={onStartRemedial}
            />
        ) : (
            <UniversalQuizView 
                mode={isBossLevel ? 'exam' : 'practice'}
                questions={questions}
                onClose={(meta) => {
                    if (isSectionPractice && task?.syncPracticeMark && meta?.hasAnswered) {
                        markSyncPracticeStarted(task.syncPracticeMark.bookKey, task.syncPracticeMark.practiceKey);
                    }
                    onExit('abort');
                }}
                onSubmit={handleQuizSubmit}
                themeColor={isBossLevel ? 'violet' : 'indigo'}
            />
        )}
    </div>
  );
};
