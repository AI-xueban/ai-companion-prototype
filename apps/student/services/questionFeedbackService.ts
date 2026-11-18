import { allQuestions } from '../data/questionBank';
import { PaperSelfGrade } from '../components/Quiz/components/PaperSourceAnalysisPanel';
import { UniversalQuizQuestion } from '../components/Quiz/UniversalQuizView';
import {
  QuestionFeedbackJudgment,
  QuestionFeedbackReport,
  QuestionFeedbackScene,
  QuestionFeedbackSubmitInput,
} from '../types/questionFeedback';

const STORAGE_KEY = 'ai_friend_question_feedback';

const readReports = (): QuestionFeedbackReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuestionFeedbackReport[]) : [];
  } catch {
    return [];
  }
};

const writeReports = (reports: QuestionFeedbackReport[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
};

const saveReport = (report: QuestionFeedbackReport) => {
  const reports = readReports();
  const existingIndex = reports.findIndex((item) => item.id === report.id);
  if (existingIndex >= 0) reports[existingIndex] = report;
  else reports.push(report);
  writeReports(reports);
};

const resolveBankQuestionId = (id: string) => (id.startsWith('mist-') ? id.replace('mist-', '') : id);

const formatAnswer = (val: unknown): string | undefined => {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) {
    const text = val.map((v) => String(v ?? '').trim()).filter(Boolean).join('、');
    return text || undefined;
  }
  const text = String(val).trim();
  return text || undefined;
};

const stemSnapshot = (question: UniversalQuizQuestion): string => {
  const raw =
    question.content.htmlStem?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
    question.content.stem ||
    '';
  return raw.slice(0, 200);
};

export const mapSelfGradeToJudgment = (
  grade: PaperSelfGrade | null | undefined,
): QuestionFeedbackJudgment | undefined => {
  if (!grade) return undefined;
  if (grade === 'correct') return 'correct';
  if (grade === 'wrong') return 'wrong';
  return 'partial';
};

export const buildQuestionFeedbackInput = (params: {
  question: UniversalQuizQuestion;
  userAnswer?: string | string[];
  isCorrect?: boolean;
  scene: QuestionFeedbackScene;
  draftImageUrl?: string | null;
  systemJudgment?: QuestionFeedbackJudgment;
}): Omit<QuestionFeedbackSubmitInput, 'category' | 'reason' | 'reasonLabel' | 'description'> => {
  const bankId = resolveBankQuestionId(params.question.id);
  const bankQuestion = allQuestions.find((q) => q.id === bankId);

  let systemJudgment = params.systemJudgment;
  if (!systemJudgment && params.isCorrect !== undefined) {
    systemJudgment = params.isCorrect ? 'correct' : 'wrong';
  }

  return {
    questionId: params.question.id,
    externalQuestionId: bankQuestion?.externalQuestionId,
    source: bankQuestion?.source,
    subject: params.question.subject || bankQuestion?.subject || 'unknown',
    questionType: params.question.type,
    knowledgePoints: params.question.knowledgePoints || bankQuestion?.knowledgePoints,
    stemSnapshot: stemSnapshot(params.question),
    practiceRequest: params.question.practiceRequest,
    questionSnapshot: {
      stem: (params.question.content.htmlStem || params.question.content.stem).replace(/<[^>]+>/g, ' ').trim(),
      images: [...(params.question.content.stemImages ?? []), ...(params.question.content.originalImageUrl ? [params.question.content.originalImageUrl] : [])]
        .map((url) => new URL(url, document.baseURI).href),
      options: params.question.content.options,
      difficulty: params.question.difficulty,
      explanation: (params.question.content.htmlExplanation || params.question.result?.explanation)?.replace(/<[^>]+>/g, ' ').trim(),
      subQuestions: params.question.content.subQuestions,
    },
    scene: params.scene,
    userAnswer: formatAnswer(params.userAnswer ?? params.question.userAnswer),
    systemCorrectAnswer: formatAnswer(params.question.result?.correctAnswer),
    systemJudgment,
    draftImageUrl: params.draftImageUrl || undefined,
  };
};

export const submitQuestionFeedback = async (
  input: QuestionFeedbackSubmitInput,
  id: string,
): Promise<QuestionFeedbackReport> => {
  const report: QuestionFeedbackReport = {
    id,
    createdAt: new Date().toISOString(),
    ...input,
    description: input.description?.trim() || undefined,
  };

  if (input.practiceRequest) {
    const endpoint = import.meta.env.VITE_QUESTION_FEEDBACK_URL ||
      (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://127.0.0.1:8080/api/question-feedback' : '/api/question-feedback');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('反馈提交失败');
    saveReport(report);
    return report;
  }

  saveReport(report);
  return report;
};

export const listQuestionFeedbackReports = (): QuestionFeedbackReport[] => readReports();
