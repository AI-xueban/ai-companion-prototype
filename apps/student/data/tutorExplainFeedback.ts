export type TutorExplainFeedbackRating = 'satisfied' | 'unsatisfied';

export type TutorExplainFeedbackReason =
  | 'too_wordy'
  | 'explanation_error'
  | 'hard_to_follow'
  | 'judgment_error'
  | 'misheard_user'
  | 'other';

export const TUTOR_EXPLAIN_FEEDBACK_REASONS: {
  key: TutorExplainFeedbackReason;
  label: string;
}[] = [
  { key: 'too_wordy', label: '讲得太啰嗦' },
  { key: 'explanation_error', label: '讲解有错误' },
  { key: 'hard_to_follow', label: '听不懂讲解' },
  { key: 'judgment_error', label: '判断有错误' },
  { key: 'misheard_user', label: '没听懂我说的话' },
  { key: 'other', label: '其他问题' },
];

export interface TutorExplainFeedbackReport {
  id: string;
  createdAt: string;
  questionId?: string;
  scriptKey?: string;
  rating: TutorExplainFeedbackRating;
  reasons: TutorExplainFeedbackReason[];
  reasonLabels: string[];
}

export interface TutorExplainFeedbackSubmitInput {
  questionId?: string;
  scriptKey?: string;
  rating: TutorExplainFeedbackRating;
  reasons: TutorExplainFeedbackReason[];
}
