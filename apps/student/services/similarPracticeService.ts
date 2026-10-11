import { allQuestions, type QuestionItem } from '../data/questionBank';
import type { UniversalQuizQuestion } from '../components/Quiz/UniversalQuizView';

export type RelativeDifficulty = 'easier' | 'same' | 'harder';

export function recommendSimilarQuestions(source: UniversalQuizQuestion, level: RelativeDifficulty, bank: QuestionItem[] = allQuestions): QuestionItem[] {
  const sourceId = source.id.replace(/^mist-/, '');
  const original = bank.find((question) => question.id === sourceId);
  const difficulty = original?.difficulty ?? source.difficulty;
  if (typeof difficulty !== 'number') return [];
  const target = difficulty + (level === 'easier' ? -1 : level === 'harder' ? 1 : 0);
  const points = original?.knowledgePoints ?? source.knowledgePoints ?? [];
  const related = new Set([...(original?.similarIds ?? []), ...(source.similarIds ?? [])]);
  const subjectNames: Record<string, string> = { 数学: 'math', 语文: 'chinese', 英语: 'english' };
  const subject = original?.subject ?? subjectNames[source.subject ?? ''] ?? source.subject;
  const seen = new Set<string>();
  return bank.filter((question) => {
    if (question.id === sourceId || question.id === source.id || seen.has(question.id)) return false;
    if (question.subject !== subject || question.difficulty !== target) return false;
    if (!question.result || (!related.has(question.id) && !question.knowledgePoints.some((point) => points.includes(point)))) return false;
    seen.add(question.id);
    return true;
  }).sort((a, b) => Number(related.has(b.id)) - Number(related.has(a.id))
    || Number(b.type === (original?.type ?? source.type)) - Number(a.type === (original?.type ?? source.type)))
    .slice(0, 3);
}
