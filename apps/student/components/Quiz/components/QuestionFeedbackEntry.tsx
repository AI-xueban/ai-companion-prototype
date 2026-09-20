import React, { useEffect, useRef, useState } from 'react';
import { UniversalQuizQuestion } from '../UniversalQuizView';
import { PaperSelfGrade } from './PaperSourceAnalysisPanel';
import { QuestionFeedbackSheet } from './QuestionFeedbackSheet';
import {
  buildQuestionFeedbackInput,
  mapSelfGradeToJudgment,
  submitQuestionFeedback,
} from '../../../services/questionFeedbackService';
import {
  QUESTION_FEEDBACK_REASON_META,
  QuestionFeedbackJudgment,
  QuestionFeedbackScene,
} from '../../../types/questionFeedback';

export type QuestionFeedbackEntryVariant = 'footnote' | 'prominent';

interface QuestionFeedbackEntryProps {
  question: UniversalQuizQuestion;
  userAnswer?: string | string[];
  isCorrect?: boolean;
  scene: QuestionFeedbackScene;
  draftImageUrl?: string | null;
  selfGrade?: PaperSelfGrade | null;
  systemJudgment?: QuestionFeedbackJudgment;
  variant?: QuestionFeedbackEntryVariant;
  className?: string;
}

export const QuestionFeedbackEntry: React.FC<QuestionFeedbackEntryProps> = ({
  question,
  userAnswer,
  isCorrect,
  scene,
  draftImageUrl,
  selfGrade,
  systemJudgment,
  variant = 'footnote',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2400);
  };

  const judgment =
    systemJudgment ?? mapSelfGradeToJudgment(selfGrade) ?? (isCorrect !== undefined ? (isCorrect ? 'correct' : 'wrong') : undefined);

  const triggerClass =
    variant === 'footnote'
      ? 'text-[10px] text-slate-300 hover:text-slate-500 font-medium transition-colors'
      : 'inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-600 transition-colors';

  return (
    <>
      <div className={`flex justify-end ${className}`}>
        <button type="button" onClick={() => setOpen(true)} className={triggerClass}>
          {variant === 'footnote' ? (
            <>
              有疑问？<span className="underline underline-offset-2">反馈</span>
            </>
          ) : (
            <>
              <span>这道题有问题？</span>
              <span className="text-indigo-500 font-bold">反馈</span>
            </>
          )}
        </button>
      </div>

      <QuestionFeedbackSheet
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={(payload) => {
          const reasonMeta = QUESTION_FEEDBACK_REASON_META[payload.reason];
          submitQuestionFeedback({
            ...buildQuestionFeedbackInput({
              question,
              userAnswer,
              isCorrect,
              scene,
              draftImageUrl,
              systemJudgment: judgment,
            }),
            category: reasonMeta.category,
            reason: payload.reason,
            reasonLabel: reasonMeta.label,
            description: payload.description,
          });
          setOpen(false);
          showToast('感谢反馈，我们已收到');
        }}
      />

      {toast && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-sm font-bold shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </>
  );
};
