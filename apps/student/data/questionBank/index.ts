import { chineseQuestions } from './chineseQuestions';
import { mathQuestions } from './mathQuestions';
import { englishQuestions } from './englishQuestions';
import { QuestionItem, SubjectType } from './types';
export * from './utils';

export * from './types';
export { chineseQuestions, mathQuestions, englishQuestions };

export const allQuestions: QuestionItem[] = [
  ...chineseQuestions,
  ...mathQuestions,
  ...englishQuestions,
];

export const getQuestionsBySubject = (subject: SubjectType): QuestionItem[] =>
  allQuestions.filter(q => q.subject === subject);

export const getQuestionsByKnowledgeNode = (nodeId: string): QuestionItem[] =>
  allQuestions.filter(q => q.knowledgePoints?.includes(nodeId));
