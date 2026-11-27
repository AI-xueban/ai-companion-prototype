import { getPointHealth, readBookPointProgress, type QuestionHealthState } from '../../services/bookKnowledgeProgress';

/** Display-only prototype data. Never persist it or use it as practice evidence. */
export function getPrototypePointHealth(context: string, pointId: string, useLearningRecords = false) {
  if (useLearningRecords) return getPointHealth(readBookPointProgress(context, pointId));
  const seed = Array.from(`${context}|${pointId}`).reduce(
    (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
  const mastered = seed % 11;
  const reviewing = (seed >>> 8) % (11 - mastered);
  const questionStates: Record<string, QuestionHealthState> = {};
  for (let index = 0; index < 10; index++) {
    questionStates[`prototype-${index}`] = index < mastered ? 'mastered'
      : index < mastered + reviewing ? 'reviewing' : 'weak';
  }
  return getPointHealth({ questionStates });
}
