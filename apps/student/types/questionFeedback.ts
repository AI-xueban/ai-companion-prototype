export type QuestionFeedbackCategory =
  | 'question_content'
  | 'answer_key'
  | 'grading';

export type QuestionFeedbackReason =
  | 'question_error'
  | 'question_unclear'
  | 'question_out_of_scope'
  | 'display_issue'
  | 'answer_wrong'
  | 'explanation_wrong'
  | 'grading_wrong'
  | 'handwriting_recognition';

export const QUESTION_FEEDBACK_REASON_META: Record<
  QuestionFeedbackReason,
  { label: string; category: QuestionFeedbackCategory }
> = {
  question_error: { label: '题目内容有误', category: 'question_content' },
  question_unclear: { label: '题目表述模糊', category: 'question_content' },
  question_out_of_scope: { label: '题目超纲', category: 'question_content' },
  display_issue: { label: '图片/公式显示异常', category: 'question_content' },
  answer_wrong: { label: '参考答案有误', category: 'answer_key' },
  explanation_wrong: { label: '解析讲解有误', category: 'answer_key' },
  grading_wrong: { label: '批改结果有误', category: 'grading' },
  handwriting_recognition: { label: '手写识别有误', category: 'grading' },
};

export const QUESTION_FEEDBACK_REASON_GROUPS: {
  title: string;
  reasons: QuestionFeedbackReason[];
}[] = [
  {
    title: '题目',
    reasons: ['question_error', 'question_unclear', 'question_out_of_scope', 'display_issue'],
  },
  {
    title: '答案与解析',
    reasons: ['answer_wrong', 'explanation_wrong'],
  },
  {
    title: '批改',
    reasons: ['grading_wrong', 'handwriting_recognition'],
  },
];

export type QuestionFeedbackScene =
  | 'practice'
  | 'review'
  | 'mistake'
  | 'stepping'
  | 'paper'
  | 'manual_grade';

export type QuestionFeedbackJudgment = 'correct' | 'wrong' | 'partial' | 'pending';

export interface QuestionFeedbackReport {
  id: string;
  createdAt: string;
  questionId: string;
  externalQuestionId?: string;
  source?: string;
  subject: string;
  questionType: string;
  knowledgePoints?: string[];
  stemSnapshot: string;
  sessionId?: string;
  scene: QuestionFeedbackScene;
  userAnswer?: string;
  systemCorrectAnswer?: string;
  systemJudgment?: QuestionFeedbackJudgment;
  draftImageUrl?: string;
  category: QuestionFeedbackCategory;
  reason: QuestionFeedbackReason;
  reasonLabel: string;
  description?: string;
}

export interface QuestionFeedbackSubmitInput {
  category: QuestionFeedbackCategory;
  reason: QuestionFeedbackReason;
  reasonLabel: string;
  description?: string;
  questionId: string;
  externalQuestionId?: string;
  source?: string;
  subject: string;
  questionType: string;
  knowledgePoints?: string[];
  stemSnapshot: string;
  scene: QuestionFeedbackScene;
  userAnswer?: string;
  systemCorrectAnswer?: string;
  systemJudgment?: QuestionFeedbackJudgment;
  draftImageUrl?: string;
}
