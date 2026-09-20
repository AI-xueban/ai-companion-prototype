import {
  TUTOR_EXPLAIN_FEEDBACK_REASONS,
  TutorExplainFeedbackReason,
  TutorExplainFeedbackReport,
  TutorExplainFeedbackSubmitInput,
} from '../data/tutorExplainFeedback';

const STORAGE_KEY = 'ai_friend_tutor_explain_feedback';

const readReports = (): TutorExplainFeedbackReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TutorExplainFeedbackReport[]) : [];
  } catch {
    return [];
  }
};

const writeReports = (reports: TutorExplainFeedbackReport[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

const getReasonLabels = (reasons: TutorExplainFeedbackReason[]) =>
  reasons.map(
    (key) => TUTOR_EXPLAIN_FEEDBACK_REASONS.find((item) => item.key === key)?.label ?? key,
  );

export const submitTutorExplainFeedback = (
  input: TutorExplainFeedbackSubmitInput,
): TutorExplainFeedbackReport => {
  const report: TutorExplainFeedbackReport = {
    id: `tef-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    questionId: input.questionId,
    scriptKey: input.scriptKey,
    rating: input.rating,
    reasons: input.reasons,
    reasonLabels: getReasonLabels(input.reasons),
  };

  const reports = readReports();
  reports.push(report);
  writeReports(reports);
  return report;
};

export const listTutorExplainFeedbackReports = (): TutorExplainFeedbackReport[] => readReports();
