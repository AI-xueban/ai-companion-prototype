import type { PaperSelfGrade } from '../components/Quiz/components/PaperSourceAnalysisPanel';
import { parseXkwFillAnswers } from './xkwQuestion';

export function normalizeBlank(value: string): string {
  return value.trim().toLowerCase().replace(/％/g, '%');
}

export function isBlankMatch(user: string | undefined, correct: string | undefined): boolean {
  if (!user || !correct) return false;
  return normalizeBlank(user) === normalizeBlank(correct);
}

export function isMultiBlankManualGradeCorrect(
  userAnswer: string | string[] | undefined,
  correctAnswer: string | string[] | undefined,
  manualGradeBlankIndex: number,
  selfGrade: PaperSelfGrade | null,
): boolean {
  if (!selfGrade) return false;

  const userParts = parseXkwFillAnswers(userAnswer);
  const correctParts = Array.isArray(correctAnswer)
    ? correctAnswer.map(String)
    : parseXkwFillAnswers(correctAnswer as string | undefined);

  const autoBlanksOk = userParts
    .slice(0, manualGradeBlankIndex)
    .every((ans, idx) => isBlankMatch(ans, correctParts[idx]));

  const manualOk = selfGrade === 'correct' || selfGrade === 'partial';
  return autoBlanksOk && manualOk;
}

export function resolveQuestionCorrectness(
  manualGradeBlankIndex: number | undefined,
  correctAnswer: unknown,
  userAnswer: unknown,
  selfGrade: PaperSelfGrade | null | undefined,
): boolean {
  if (manualGradeBlankIndex !== undefined) {
    return isMultiBlankManualGradeCorrect(
      userAnswer as string | string[] | undefined,
      correctAnswer as string | string[] | undefined,
      manualGradeBlankIndex,
      selfGrade ?? null,
    );
  }

  const autoCorrect = Array.isArray(correctAnswer)
    ? JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)
    : userAnswer === correctAnswer;
  return !!autoCorrect;
}

export function getManualGradeLabel(selfGrade: PaperSelfGrade | null): string | null {
  if (!selfGrade) return null;
  if (selfGrade === 'correct') return '正确';
  if (selfGrade === 'partial') return '半对';
  return '错误';
}
