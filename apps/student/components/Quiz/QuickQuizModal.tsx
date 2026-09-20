import React, { useMemo } from 'react';
import { allQuestions, getQuestionsBySubject, SubjectType } from '../../data/questionBank';
import { UniversalQuizQuestion, UniversalQuizView } from './UniversalQuizView';

interface QuickQuizModalProps {
  questionId: string | null;
  onClose: () => void;
  subject?: SubjectType;
}

/**
 * 知识图谱里的快速练习入口。
 *
 * 这里只负责确定题目和关闭回流；作答、草稿、计时、听力、提交与解析
 * 统一交给 UniversalQuizView，避免快速练习维护另一套答题交互。
 */
export const QuickQuizModal: React.FC<QuickQuizModalProps> = ({ questionId, onClose, subject }) => {
  const question = useMemo(() => {
    if (!questionId) return null;
    const questionSource = subject ? getQuestionsBySubject(subject) : allQuestions;
    return questionSource.find((item) => item.id === questionId) ?? questionSource[0] ?? null;
  }, [questionId, subject]);

  if (!questionId || !question) return null;

  return (
    <div className="absolute inset-0 z-[200] bg-white">
      <UniversalQuizView
        key={question.id}
        mode="practice"
        questions={[question as UniversalQuizQuestion]}
        singleQuestionMode
        variant="stepping"
        onClose={onClose}
        onSteppingNext={onClose}
      />
    </div>
  );
};
