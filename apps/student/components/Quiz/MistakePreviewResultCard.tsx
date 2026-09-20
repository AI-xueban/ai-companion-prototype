import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowRight, RefreshCw, FileText, Play, ChevronRight, Star, Check, X } from 'lucide-react';
import { StatusRing } from './StatusRing';
import { CognitiveState } from '../../data/questionBank';
import { allQuestions } from '../../data/questionBank';
import { mathQuestions } from '../../data/questionBank/mathQuestions';
import { DIFFICULTY_BADGE, getDifficultyColor, DifficultyStars } from './components/QuestionBadges';
import { getQuestionTypeLabel } from '../../data/questionBank';
import { UniversalQuizQuestion } from './UniversalQuizView';
import { QuestionRichContent } from './components/QuestionRichContent';
import { isQuestionBookmarked, toggleQuestionBookmark } from '../../services/geminiService';
import { PaperSourceAnalysisPanel, PaperSelfGrade } from './components/PaperSourceAnalysisPanel';
import { ManualGradeBlankPanel } from './components/ManualGradeBlankPanel';
import { XkwHtmlExplanation } from './components/XkwHtmlExplanation';
import { QuestionFeedbackEntry } from './components/QuestionFeedbackEntry';
import { QuestionFeedbackScene } from '../../types/questionFeedback';
import { MistakeReasonPicker, MistakeReasonTrigger } from './components/MistakeReasonPicker';
import { MistakeReasonKey } from '../../data/mistakeReasons';
import { getMistakeReasons, recordMistakeReasons } from '../../services/mistakeReasonService';
import {
  getSimilarAttemptStatus,
  SIMILAR_ATTEMPT_EVENT,
  SimilarAttemptStatus,
} from '../../utils/similarQuestionAttempts';
import { parseXkwFillAnswers } from '../../utils/xkwQuestion';
import {
  isBlankMatch,
  isMultiBlankManualGradeCorrect,
  getManualGradeLabel,
} from '../../utils/manualGrade';

export interface MistakePreviewResultCardProps {
  question: UniversalQuizQuestion;  // 改为接收完整对象
  practiceStats?: { correct: number; wrong: number };
  onOpenKnowledgeNode?: (name: string) => void;
  onViewAnalysis?: () => void;
  onRetry?: () => void;
  onSimilarItemSelect?: (id: string) => void;
  onOpenTutor?: () => void;
  preferSplitLayout?: boolean;
  /** 试卷原图题：作答草稿图 */
  draftImageUrl?: string | null;
  /** 试卷原图题：用户自批阅 */
  selfGrade?: PaperSelfGrade | null;
  onSelfGrade?: (grade: PaperSelfGrade) => void;
  feedbackScene?: QuestionFeedbackScene;
  showMistakeReason?: boolean;
  selectedMistakeReasons?: MistakeReasonKey[];
  onMistakeReasonSelect?: (reasons: MistakeReasonKey[]) => void;
}

// 扁平化错题预览主体：单层容器 + 同级分块，便于维护
export const MistakePreviewResultCard: React.FC<MistakePreviewResultCardProps> = ({
  question,
  practiceStats = { correct: 0, wrong: 0 },
  onOpenKnowledgeNode,
  onViewAnalysis,
  onRetry,
  onSimilarItemSelect,
  onOpenTutor,
  preferSplitLayout = false,
  draftImageUrl = null,
  selfGrade = null,
  onSelfGrade,
  feedbackScene = 'mistake',
  showMistakeReason = false,
  selectedMistakeReasons = [],
  onMistakeReasonSelect,
}) => {
  // 从 question 对象提取需要的字段
  const categoryLabel = question.category || '';
  const typeLabel = getQuestionTypeLabel(question.type as any);
  const correctAnswer = Array.isArray(question.result?.correctAnswer)
    ? (question.result?.correctAnswer as any[]).join('、')
    : (question.result?.correctAnswer as any) ?? '—';

  const parseUserAnswer = (raw: string | string[] | undefined) => {
    if (raw === undefined || raw === null) return { text: '—', isUnanswered: true };
    if (Array.isArray(raw)) {
      const text = raw.map((v) => String(v ?? '').trim()).filter(Boolean).join('、');
      return text ? { text, isUnanswered: false } : { text: '—', isUnanswered: true };
    }
    const text = String(raw).trim();
    if (!text || text === '—') return { text: '—', isUnanswered: true };
    return { text, isUnanswered: false };
  };

  const { text: userAnswer, isUnanswered } = parseUserAnswer(question.userAnswer);
  const manualGradeBlankIndex = question.content.manualGradeBlankIndex;
  const userAnswerParts = useMemo(
    () => parseXkwFillAnswers(question.userAnswer as string | string[] | undefined),
    [question.userAnswer],
  );
  const correctAnswerParts = useMemo(() => {
    const raw = question.result?.correctAnswer;
    if (Array.isArray(raw)) return raw.map(String);
    return parseXkwFillAnswers(raw as string | undefined);
  }, [question.result?.correctAnswer]);
  const isMultiBlankSurvey = manualGradeBlankIndex !== undefined && correctAnswerParts.length >= 3;

  const isAnswerCorrect = !isUnanswered && (
    isMultiBlankSurvey && manualGradeBlankIndex !== undefined
      ? isMultiBlankManualGradeCorrect(
          question.userAnswer as string | string[] | undefined,
          question.result?.correctAnswer as string | string[] | undefined,
          manualGradeBlankIndex,
          selfGrade,
        )
      : String(userAnswer).trim() === String(correctAnswer).trim()
  );
  const cognitiveState = question.cognitiveState || 'GAP';
  const explanationText = question.result?.explanation;
  const [activeTab, setActiveTab] = useState<'analysis' | 'similar'>('analysis');
  const [similarAttemptTick, setSimilarAttemptTick] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(() => isQuestionBookmarked(question.id));
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false);
  const [localMistakeReasons, setLocalMistakeReasons] = useState<MistakeReasonKey[]>(
    () => getMistakeReasons(question.id),
  );
  const reasonSheetIntentRef = useRef<'bookmark' | 'inline'>('inline');
  const knowledgePoints = useMemo(() => {
    const rawList = question.knowledgePoints ?? ((question as any).knowledgePoint ? [(question as any).knowledgePoint] : []);
    return Array.from(new Set((rawList ?? []).filter(Boolean)));
  }, [question]);

  useEffect(() => {
    setActiveTab('analysis');
    setIsBookmarked(isQuestionBookmarked(question.id));
    setLocalMistakeReasons(getMistakeReasons(question.id));
  }, [question.id]);

  useEffect(() => {
    const refreshSimilarAttempts = () => setSimilarAttemptTick((tick) => tick + 1);
    window.addEventListener(SIMILAR_ATTEMPT_EVENT, refreshSimilarAttempts);
    return () => window.removeEventListener(SIMILAR_ATTEMPT_EVENT, refreshSimilarAttempts);
  }, []);

  // Mock 健康分（可替换为真实数据）
  const MOCK_KP_HEALTH: Record<string, { health: number; delta: number }> = {
    '二元一次方程': { health: 62, delta: -3 },
    '代入消元': { health: 82, delta: 3 },
  };

  const normalizeKp = (kp: string | { name: string; health?: number; delta?: number }) => {
    if (typeof kp === 'string') {
      const mock = MOCK_KP_HEALTH[kp] || { health: 65, delta: 0 };
      return { name: kp, health: mock.health, delta: mock.delta };
    }
    const mock = MOCK_KP_HEALTH[kp.name] || { health: 65, delta: 0 };
    return {
      name: kp.name,
      health: kp.health ?? mock.health,
      delta: kp.delta ?? mock.delta,
    };
  };

  const getKpColor = (health?: number) => {
    if (health === undefined) return 'bg-amber-400';
    if (health >= 80) return 'bg-emerald-500';
    if (health >= 50) return 'bg-amber-400';
    return 'bg-rose-500';
  };

  const getDeltaText = (delta?: number) => {
    if (!delta) return '±0';
    return `${delta > 0 ? '+' : ''}${delta}`;
  };

  const getDeltaChipClass = (delta?: number) => {
    if (!delta) return 'text-slate-500 bg-slate-50';
    if (delta > 0) return 'text-emerald-700 bg-emerald-50';
    return 'text-rose-700 bg-rose-50';
  };

  const totalAttemptsRaw = practiceStats.correct + practiceStats.wrong;
  const totalAttemptsForRate = totalAttemptsRaw || 1;
  const stats = {
    correctCount: practiceStats.correct,
    wrongCount: practiceStats.wrong,
    totalAttempts: totalAttemptsRaw,
  };
  const correctRate = (stats.correctCount / totalAttemptsForRate) * 100;
  const wrongRate = (stats.wrongCount / totalAttemptsForRate) * 100;

  const isWrongAnswer = !isUnanswered && !isAnswerCorrect;
  const hasUserAnswer = !isUnanswered;

  const getQuestionPracticeReason = (state: CognitiveState) => {
    if (!hasUserAnswer) {
      if (stats.totalAttempts > 0) {
        return `本题本次未作答。历史记录：对 ${stats.correctCount} 次、错 ${stats.wrongCount} 次。`;
      }
      return '本题尚未作答，完成作答后将更新练次记录。';
    }

    if (isWrongAnswer) {
      return '本题本次作答有误，建议先看解析，再做几道变式巩固。';
    }

    switch (state) {
      case 'MASTERED':
        if (stats.correctCount > 0) {
          return `本题累计答对 ${stats.correctCount} 次，可按计划复习。`;
        }
        return '本题已标记掌握，可按计划复习。';
      case 'FADED':
        if (isAnswerCorrect) {
          return '作答后已纳入复习周期，到期会提醒你再过一遍。';
        }
        return '本题在复习周期中，建议尽快巩固。';
      case 'GAP':
      default:
        if (stats.wrongCount > 0) {
          return `本题已累计错 ${stats.wrongCount} 次，建议重做并多练变式。`;
        }
        return '建议通过变式多练几道同类题，巩固本题。';
    }
  };

  const currentCognitiveState = (cognitiveState ?? 'GAP') as CognitiveState;
  const showNeutralUnansweredBadge = isUnanswered && stats.totalAttempts === 0;
  const displayCognitiveState = showNeutralUnansweredBadge ? null : currentCognitiveState;
  const questionPracticeReason = getQuestionPracticeReason(currentCognitiveState);
  const answerStateSuffix = isUnanswered ? '' : isAnswerCorrect ? '，回答正确' : '，回答错误';
  const showPracticeStats = hasUserAnswer || stats.totalAttempts > 0;
  const resolvedMistakeReasons =
    selectedMistakeReasons.length > 0 ? selectedMistakeReasons : localMistakeReasons;

  const openReasonSheet = (intent: 'bookmark' | 'inline') => {
    reasonSheetIntentRef.current = intent;
    setReasonSheetOpen(true);
  };

  const handleMistakeReasonSelect = (reasons: MistakeReasonKey[]) => {
    recordMistakeReasons(question.id, reasons);
    setLocalMistakeReasons(reasons);
    onMistakeReasonSelect?.(reasons);

    if (reasonSheetIntentRef.current === 'bookmark' && !isBookmarked && !isWrongAnswer) {
      setIsBookmarked(toggleQuestionBookmark(question.id));
    }
  };

  const handleBookmarkClick = () => {
    openReasonSheet('bookmark');
  };

  const similarList = useMemo(() => {
    const bankQuestion = allQuestions.find((q) => q.id === question.id);
    const similarIds = bankQuestion?.similarIds ?? question.similarIds ?? [];
    const resolvedQuestions = similarIds
      .map((id) => allQuestions.find((q) => q.id === id))
      .filter(Boolean);

    const pool = resolvedQuestions.length > 0
      ? resolvedQuestions
      : mathQuestions.filter((q) => q.id !== question.id).slice(0, 3);

    const demoStatuses: SimilarAttemptStatus[] = ['correct', 'wrong', 'unattempted'];

    return pool.slice(0, 3).map((q, index) => ({
      id: q.id,
      stem: q.content.stem,
      difficulty: q.difficulty,
      type: q.type,
      knowledgePoint: q.knowledgePoints?.[0] || '数学',
      attemptStatus: resolvedQuestions.length > 0
        ? getSimilarAttemptStatus(q.id, { correctCount: q.correctCount, wrongCount: q.wrongCount })
        : demoStatuses[index % demoStatuses.length],
    }));
  }, [question.id, question.similarIds, similarAttemptTick]);

  const renderSimilarAttemptBadge = (status: SimilarAttemptStatus) => {
    if (status === 'unattempted') return null;

    const isCorrect = status === 'correct';
    return (
      <span
        className={`absolute top-0 right-0 z-10 inline-flex items-center gap-0.5 px-2 py-1 rounded-bl-xl rounded-tr-xl text-[10px] font-black shadow-sm ${
          isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
        }`}
      >
        {isCorrect ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
        {isCorrect ? '答对' : '答错'}
      </span>
    );
  };

  const isImageQuestion = Boolean(question.content.stemImages?.length);
  const isPaperSourceQuestion = Boolean(question.content.originalImageUrl);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto w-full">
      <div
        className={`grid grid-cols-1 gap-5 items-start ${
          preferSplitLayout
            ? 'md:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]'
            : 'lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]'
        }`}
      >
        <section className={`relative rounded-[28px] bg-white border border-slate-100 p-5 md:p-6 shadow-sm overflow-hidden ${preferSplitLayout ? 'min-h-[360px]' : 'min-h-[480px]'}`}>
          <div className={`${onRetry && isWrongAnswer ? 'pb-16' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              {!isImageQuestion && (
                <>
                  <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 text-[11px] font-black border border-sky-100">
                    {typeLabel}
                  </span>
                  {categoryLabel && (
                    <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 text-[11px] font-black border border-violet-100">
                      典型题
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-auto">
              <button
                type="button"
                onClick={handleBookmarkClick}
                className={`inline-flex items-center gap-1 h-9 px-2.5 rounded-full border text-[11px] font-black transition-all shadow-sm ${
                  isWrongAnswer || isBookmarked
                    ? 'bg-amber-50 border-amber-200 text-amber-600 hover:border-amber-300'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-500'
                }`}
                aria-label={isWrongAnswer || isBookmarked ? '已加入错题本' : '加入错题本'}
                title={isWrongAnswer || isBookmarked ? '标记错因' : '加入错题本'}
              >
                <Star
                  size={14}
                  className={isWrongAnswer || isBookmarked ? 'fill-current text-amber-500' : 'text-slate-400'}
                />
                {isWrongAnswer || isBookmarked ? '已加入错题本' : '加入错题本'}
              </button>
              {!isImageQuestion && (
                <div className="flex items-center gap-0.5">
                  <DifficultyStars level={question.difficulty} />
                </div>
              )}
            </div>
          </div>
          <QuestionRichContent question={question} showAudioPlayer={false} />
          </div>
          {onRetry && isWrongAnswer && (
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-4 pt-10 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none flex justify-center">
              <button
                type="button"
                onClick={onRetry}
                className="pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-black shadow-lg shadow-slate-900/25 hover:bg-slate-800 active:scale-[0.98] transition-all"
              >
                <RefreshCw size={16} />
                重做
              </button>
            </div>
          )}
        </section>

        <aside className={`rounded-[28px] bg-white border border-slate-100 shadow-sm p-4 md:p-5 ${isPaperSourceQuestion ? 'flex flex-col min-h-[360px]' : 'space-y-4'}`}>
          {isPaperSourceQuestion ? (
            <PaperSourceAnalysisPanel
              draftImageUrl={draftImageUrl}
              correctAnswer={correctAnswer}
              explanation={explanationText || ''}
              selfGrade={selfGrade}
              onSelfGrade={onSelfGrade ?? (() => {})}
              onStartTutor={onOpenTutor}
              answerTabLabel="作答结果"
              feedbackSlot={
                <QuestionFeedbackEntry
                  question={question}
                  userAnswer={question.userAnswer}
                  scene={feedbackScene}
                  draftImageUrl={draftImageUrl}
                  selfGrade={selfGrade}
                  className="px-0.5"
                />
              }
            />
          ) : (
          <>
          {/* 顶部分段导航 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'analysis'
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <FileText size={14} />
              解析
            </button>
            {similarList.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('similar')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black transition-all ${
                  activeTab === 'similar'
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm'
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FileText size={14} />
                相似题
              </button>
            )}
            {onOpenTutor && (
              <button
                type="button"
                onClick={onOpenTutor}
                className="flex-[1.15] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-indigo-500/20 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <Sparkles size={14} />
                AI 1对1解答
                <ChevronRight size={14} className="opacity-80" />
              </button>
            )}
          </div>

          {activeTab === 'analysis' ? (
            <>
              {/* 答案摘要 */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm leading-relaxed">
                      <span className="text-slate-400 font-bold mr-2">你的答案</span>
                    </p>
                    {isMultiBlankSurvey ? (
                      <div className="space-y-1.5">
                        {correctAnswerParts.map((correctPart, idx) => {
                          const userPart = userAnswerParts[idx];
                          const isManual = idx === manualGradeBlankIndex;
                          const matched = !isManual && isBlankMatch(userPart, correctPart);
                          const showWrong = !isManual && userPart && !matched;
                          const manualLabel = getManualGradeLabel(selfGrade ?? null);
                          const manualSuffix = isManual
                            ? manualLabel
                              ? `，${manualLabel}`
                              : '，待批改'
                            : '';
                          return (
                            <p key={idx} className="text-sm leading-relaxed">
                              <span className="text-slate-400 font-bold mr-1">空{idx + 1}</span>
                              <span
                                className={`font-black ${
                                  isManual
                                    ? !selfGrade
                                      ? 'text-indigo-600'
                                      : selfGrade === 'correct'
                                        ? 'text-emerald-600'
                                        : selfGrade === 'partial'
                                          ? 'text-amber-600'
                                          : 'text-rose-600'
                                    : showWrong
                                      ? 'text-rose-600'
                                      : matched
                                        ? 'text-emerald-600'
                                        : 'text-slate-400'
                                }`}
                              >
                                {userPart || (isManual && !selfGrade ? '见下方手写作答' : '未填')}
                                {!isManual && matched ? '，正确' : ''}
                                {!isManual && showWrong ? '，错误' : ''}
                                {manualSuffix}
                              </span>
                            </p>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">
                        <span className={`font-black ${isUnanswered ? 'text-slate-400' : isAnswerCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isUnanswered ? '未作答' : `${userAnswer}${answerStateSuffix}`}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed">
                  <span className="text-slate-400 font-bold mr-2">参考答案</span>
                  <span className="font-black text-emerald-700">
                    {isMultiBlankSurvey
                      ? correctAnswerParts.map((part, idx) => `空${idx + 1} ${part}`).join('；')
                      : correctAnswer}
                  </span>
                </p>
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  {showMistakeReason && isWrongAnswer ? (
                    <MistakeReasonTrigger
                      selectedReasons={resolvedMistakeReasons}
                      onClick={() => openReasonSheet('inline')}
                      className="min-w-0 flex-1"
                    />
                  ) : (
                    <span />
                  )}
                  <QuestionFeedbackEntry
                    question={question}
                    userAnswer={question.userAnswer}
                    isCorrect={isAnswerCorrect}
                    scene={feedbackScene}
                    draftImageUrl={draftImageUrl}
                    selfGrade={selfGrade}
                    className="shrink-0"
                  />
                </div>
              </div>

              {isMultiBlankSurvey && manualGradeBlankIndex !== undefined && onSelfGrade && (
                <ManualGradeBlankPanel
                  blankLabel={`空${manualGradeBlankIndex + 1}`}
                  userText={userAnswerParts[manualGradeBlankIndex]}
                  correctText={correctAnswerParts[manualGradeBlankIndex]}
                  referenceImageUrl={question.content.manualGradeReferenceImageUrl ?? null}
                  selfGrade={selfGrade}
                  onSelfGrade={onSelfGrade}
                />
              )}

              {/* 原题讲解视频 */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white shadow-sm">
                <div className="relative aspect-[16/10] bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button
                      type="button"
                      className="w-14 h-14 rounded-full bg-white/95 shadow-lg flex items-center justify-center text-indigo-600 hover:scale-105 transition-transform"
                    >
                      <Play size={22} className="ml-1" fill="currentColor" />
                    </button>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-2 border-t border-slate-100">
                  <Sparkles size={14} className="text-indigo-500" />
                  <span className="text-xs font-black text-slate-700">原题讲解视频</span>
                </div>
              </div>

              {/* 本题解析 */}
              <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4 space-y-2">
                <h4 className="text-sm font-black text-slate-800">本题解析</h4>
                {question.content.htmlExplanation ? (
                  <XkwHtmlExplanation html={question.content.htmlExplanation} />
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                    {explanationText || '正在生成 AI 解析中...'}
                  </p>
                )}
              </div>

              {/* 本题练习情况 */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 flex items-center gap-4">
                <div className="shrink-0">
                  {showNeutralUnansweredBadge ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-200 text-slate-600 text-xs font-black">
                      未作答
                    </div>
                  ) : displayCognitiveState === 'MASTERED' ? (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-black shadow-sm">
                      <Star size={12} className="fill-white" />
                      本题已掌握
                    </div>
                  ) : (
                    <StatusRing state={displayCognitiveState ?? 'GAP'} size={44} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-black text-slate-800 mb-1">本题练习情况</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{questionPracticeReason}</p>
                  {showPracticeStats ? (
                    <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-slate-400">
                      <span>本题错: {stats.wrongCount}次</span>
                      <span>本题对: {stats.correctCount}次</span>
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] font-bold text-slate-400">暂无练次记录</div>
                  )}
                </div>
                <div className="shrink-0 relative w-[72px] h-[72px]">
                  {showPracticeStats ? (
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="#e2e8f0" strokeWidth="10" />
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray={`${correctRate * 2.639} 263.9`} strokeLinecap="round" />
                    <circle cx="50" cy="50" r="42" fill="transparent" stroke="#f43f5e" strokeWidth="10" strokeDasharray={`${wrongRate * 2.639} 263.9`} strokeDashoffset={`-${correctRate * 2.639}`} strokeLinecap="round" />
                  </svg>
                  ) : (
                  <div className="w-full h-full rounded-full border-[10px] border-slate-200" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-slate-800">
                      {showPracticeStats ? stats.totalAttempts : '—'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">
                      {isUnanswered && stats.totalAttempts === 0 ? '未作答' : '本题练次'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 关联知识点 */}
              {!isImageQuestion && knowledgePoints.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-slate-700">关联知识点</div>
                  <div className="flex flex-wrap gap-2">
                    {knowledgePoints.slice(0, 5).map((kpRaw, idx) => {
                      const kp = normalizeKp(kpRaw as any);
                      const color = getKpColor(kp.health);
                      const deltaText = getDeltaText(kp.delta);
                      return (
                        <button
                          key={`${kp.name}-${idx}`}
                          type="button"
                          onClick={() => onOpenKnowledgeNode?.(kp.name)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-100 bg-white text-[12px] font-semibold text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                        >
                          <span className={`w-2 h-2 rounded-full ${color}`} />
                          <span>{kp.name}</span>
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${getDeltaChipClass(kp.delta)}`}>
                            健康分 {kp.health}（{deltaText}）
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {onViewAnalysis && (
                <button
                  type="button"
                  onClick={onViewAnalysis}
                  className="w-full py-2.5 rounded-xl border border-dashed border-indigo-200 text-indigo-600 text-xs font-black hover:bg-indigo-50 transition-all"
                >
                  查看完整解析页
                </button>
              )}

            </>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-black text-slate-700">相似题推荐</div>
              {similarList.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onSimilarItemSelect?.(q.id)}
                  className="relative w-full text-left bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98] group overflow-hidden"
                >
                  {renderSimilarAttemptBadge(q.attemptStatus)}
                  <div className="flex items-center gap-2 mb-2 pr-14">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getDifficultyColor(q.difficulty)}`}>
                      {DIFFICULTY_BADGE[q.difficulty]}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] font-bold">
                      {getQuestionTypeLabel(q.type as any)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2 mb-2 font-medium">{q.stem}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-indigo-600 font-medium">{q.knowledgePoint}</span>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
          </>
          )}
        </aside>
      </div>

      <MistakeReasonPicker
        showTrigger={false}
        open={reasonSheetOpen}
        onOpenChange={setReasonSheetOpen}
        selectedReasons={resolvedMistakeReasons}
        onSelect={handleMistakeReasonSelect}
        successMessage={() =>
          reasonSheetIntentRef.current === 'bookmark' ? '已加入错题本' : '错因已标记'
        }
      />
    </div>
  );
};
