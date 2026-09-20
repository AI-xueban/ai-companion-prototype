import React, { useMemo } from 'react';
import { Clock, ChevronRight, ChevronLeft, RefreshCw, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { SubjectType, allQuestions } from '../../data/questionBank';
import { CognitiveState } from './StatusRing';
import { InsightTag, PeerInsight } from '../MistakeVault/Social/types';
import { QuestionItem } from '../../data/questionBank/types';
import { MistakePreviewResultCard } from './MistakePreviewResultCard';
import { UniversalQuizQuestion } from './UniversalQuizView';
import { PaperSelfGrade } from './components/PaperSourceAnalysisPanel';
import { MistakeReasonKey } from '../../data/mistakeReasons';

type MistakeTag = { key: string; label: string };

type KnowledgePoint = { id: string; label: string; color: string; mastery?: 'low' | 'mid' | 'high' };

type OptionView = {
  label: string;
  text: string;
  isCorrect?: boolean;
  userSelected?: boolean;
  isUserAnswer?: boolean;
};

type AttemptStats = {
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  lastAttemptAt?: string;
  lastCorrectAt?: string;
  lastWrongAt?: string;
};

type MediaItem = {
  type: 'video' | 'audio';
  cover?: string;
  duration?: number;
};

interface SingleQuestionResultCardProps {
  subject?: SubjectType | string;
  questionId: string;
  questionType?: string;
  difficulty?: string | number;
  stem: string;
  options?: OptionView[];
  userAnswerPreview?: string;
  correctAnswerPreview?: string;
  explanationText?: string;
  explanationPitfalls?: string[];
  mediaList?: MediaItem[];
  knowledgePoints?: KnowledgePoint[];
  status: 'correct' | 'wrong';
  timeUsedSec: number;
  attemptStats: AttemptStats;
  /** 本题练习状态；未传时按本次对错推断 GAP / MASTERED */
  questionPracticeState?: CognitiveState;
  onRetry?: () => void;
  onNext?: () => void;
  onClose?: () => void;
  showMistakeTags?: boolean;
  defaultMistakeTags?: MistakeTag[];
  selectedMistakeReasons?: MistakeReasonKey[];
  onMistakeReasonSelect?: (reasons: MistakeReasonKey[]) => void;
  similarQuestions?: QuestionItem[];
  sparkTags?: InsightTag[];
  sparkInsights?: PeerInsight[];
  onSimilarSelect?: (question: QuestionItem) => void;
  onSparkShare?: () => void;
  onSparkTagToggle?: (id: string) => void;
  onSparkLike?: (id: string) => void;
  onSparkDislike?: (id: string) => void;
  layout?: 'modal' | 'inline';
  onViewAnalysis?: () => void;
  onSimilarItemSelect?: (id: string) => void;
  onOpenAITutor?: () => void;
  paperDraftImageUrl?: string | null;
  paperSelfGrade?: PaperSelfGrade | null;
  onPaperSelfGrade?: (grade: PaperSelfGrade) => void;
}

const resolveBankQuestionId = (id: string) => (id.startsWith('mist-') ? id.replace('mist-', '') : id);

const findBankQuestion = (questionId: string) =>
  allQuestions.find((q) => q.id === resolveBankQuestionId(questionId));

export const SingleQuestionResultCard: React.FC<SingleQuestionResultCardProps> = ({
  subject,
  questionId,
  questionType,
  difficulty,
  stem,
  options = [],
  userAnswerPreview,
  correctAnswerPreview,
  explanationText,
  knowledgePoints = [],
  status,
  timeUsedSec,
  attemptStats,
  questionPracticeState,
  onRetry,
  onNext,
  onClose,
  layout = 'modal',
  onViewAnalysis,
  onSimilarItemSelect,
  onOpenAITutor,
  paperDraftImageUrl = null,
  paperSelfGrade = null,
  onPaperSelfGrade,
  showMistakeTags = false,
  selectedMistakeReasons = [],
  onMistakeReasonSelect,
}) => {
  const timeLabel = `${Math.floor(timeUsedSec / 60)}分${(timeUsedSec % 60).toString().padStart(2, '0')}秒`;
  const isCorrect = status === 'correct';
  const isUnanswered = useMemo(() => {
    const raw = userAnswerPreview;
    if (raw === undefined || raw === null) return true;
    if (Array.isArray(raw)) {
      return raw.map((v) => String(v ?? '').trim()).filter(Boolean).length === 0;
    }
    const text = String(raw).trim();
    return !text || text === '—';
  }, [userAnswerPreview]);
  const cognitiveState: CognitiveState =
    isUnanswered && attemptStats.totalAttempts === 0
      ? 'GAP'
      : questionPracticeState ?? (isCorrect ? 'MASTERED' : 'GAP');

  const bankQuestion = useMemo(() => findBankQuestion(questionId), [questionId]);

  const questionForPreview = useMemo<UniversalQuizQuestion>(() => ({
    id: questionId,
    type: (questionType as any) || bankQuestion?.type || 'single_choice',
    content: {
      stem: bankQuestion?.content?.stem || stem,
      stemImages: bankQuestion?.content?.stemImages,
      originalImageUrl: bankQuestion?.content?.originalImageUrl,
      htmlStem: bankQuestion?.content?.htmlStem,
      htmlExplanation: bankQuestion?.content?.htmlExplanation,
      manualGradeReferenceImageUrl: bankQuestion?.content?.manualGradeReferenceImageUrl,
      manualGradeBlankIndex: bankQuestion?.content?.manualGradeBlankIndex,
      subQuestions: bankQuestion?.content?.subQuestions,
      options: options?.map(opt => opt.text ?? opt.label) ?? bankQuestion?.content?.options ?? [],
    },
    result: {
      correctAnswer: correctAnswerPreview ?? bankQuestion?.result?.correctAnswer ?? '',
      explanation: explanationText ?? bankQuestion?.result?.explanation ?? '',
    },
    subject: (subject as string | undefined) ?? bankQuestion?.subject,
    category: bankQuestion?.category ?? questionType ?? '',
    difficulty: typeof difficulty === 'number' ? difficulty : Number(difficulty) || bankQuestion?.difficulty,
    knowledgePoints: knowledgePoints?.map(k => k.label).filter(Boolean) ?? bankQuestion?.knowledgePoints,
    userAnswer: userAnswerPreview ?? '',
    cognitiveState,
  }), [
    bankQuestion,
    cognitiveState,
    correctAnswerPreview,
    difficulty,
    explanationText,
    knowledgePoints,
    options,
    questionId,
    questionType,
    stem,
    subject,
    userAnswerPreview,
    questionPracticeState,
  ]);

  const practiceStats = useMemo(() => ({
    correct: attemptStats.correctCount,
    wrong: attemptStats.wrongCount,
  }), [attemptStats.correctCount, attemptStats.wrongCount]);

  const isInline = layout === 'inline';
  const rootClass = isInline
    ? 'w-full relative'
    : 'fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-[999] flex items-center justify-center px-4 py-6 pointer-events-auto';

  const cardClass = isInline
    ? 'w-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col'
    : 'w-full max-w-5xl bg-slate-50/85 backdrop-blur-2xl border border-white/50 shadow-[0_28px_56px_-14px_rgba(0,0,0,0.18)] rounded-3xl overflow-hidden flex flex-col max-h-[90vh]';

  const cardMotionProps = isInline
    ? { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } }
    : { initial: { scale: 0.95, y: 20 }, animate: { scale: 1, y: 0 } };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={rootClass}
    >
      <motion.div
        {...cardMotionProps}
        className={cardClass}
        style={{ justifyContent: 'flex-start' }}
      >
        {!isInline && (
          <div className="flex flex-col">
            <div className="px-6 py-4 flex items-center gap-3 border-b border-white/20 bg-white/75 backdrop-blur-sm">
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
                  aria-label="返回"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 border border-white text-slate-700 font-black text-xs">
                  <Clock size={14} className="text-indigo-500" />
                  {timeLabel}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                <button className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-amber-500 hover:border-amber-200 transition-all flex items-center justify-center">
                  <Star size={18} className="text-slate-400" />
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <MistakePreviewResultCard
            question={questionForPreview}
            practiceStats={practiceStats}
            preferSplitLayout
            onViewAnalysis={onViewAnalysis}
            onRetry={onRetry}
            onSimilarItemSelect={onSimilarItemSelect}
            onOpenTutor={onOpenAITutor}
            draftImageUrl={paperDraftImageUrl}
            selfGrade={paperSelfGrade}
            onSelfGrade={onPaperSelfGrade}
            showMistakeReason={showMistakeTags && !isCorrect}
            selectedMistakeReasons={selectedMistakeReasons}
            onMistakeReasonSelect={onMistakeReasonSelect}
          />
        </div>

        {layout !== 'inline' && onNext && (
          <div className="px-6 py-5 bg-white/60 backdrop-blur-md border-t border-white/20 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <button
                onClick={onNext}
                className={`px-8 py-3 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center gap-2 ${
                  isCorrect
                    ? 'bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500'
                    : 'bg-white border-2 border-indigo-600 text-indigo-600 shadow-indigo-500/10 hover:bg-indigo-50'
                }`}
              >
                {isCorrect ? '进阶挑战' : '下一题'}
                <ChevronRight size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
