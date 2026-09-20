import { QuizSessionResult } from '../Quiz/UniversalQuizResult';
import { ExpeditionPlanHistoryRecord } from '../../types';

export function buildHistoryLevelQuizResult(
  record: ExpeditionPlanHistoryRecord,
  levelIndex: number,
  levelTitle: string
): QuizSessionResult {
  const isBoss = levelIndex === record.levelCount - 1;
  const totalCount = 6;
  const correctCount = Math.min(totalCount, 3 + ((levelIndex * 7 + record.id.length) % 4));
  const score = Math.round((correctCount / totalCount) * 100);

  const questions = Array.from({ length: totalCount }).map((_, i) => {
    const isCorrect = i < correctCount;
    return {
      questionId: `${record.id}_lv${levelIndex}_q${i}`,
      index: i + 1,
      isCorrect,
      timeSpentSec: 40 + i * 8,
      difficulty: isBoss ? 4 : 3,
      stemSummary: `【${levelTitle}】${isCorrect ? '基础巩固' : '易错'}题 ${i + 1}：相关概念与计算…`,
      correctAnswer: 'A',
      userAnswer: isCorrect ? 'A' : 'B',
      subject: record.subject === '数学' ? 'math' : record.subject,
      knowledgePoint: levelTitle,
      knowledgePoints: [levelTitle],
      questionType: 'single',
      options: ['A. 正确选项', 'B. 干扰选项', 'C. 干扰选项', 'D. 干扰选项'],
      explanation: isCorrect
        ? `本题考查「${levelTitle}」核心知识点，你的作答正确。`
        : `本题考查「${levelTitle}」，建议回顾相关公式与解题步骤。`,
      rawCorrectAnswer: 'A',
      rawUserAnswer: isCorrect ? 'A' : 'B',
    };
  });

  return {
    sessionId: `hist_${record.id}_${levelIndex}`,
    timestamp: new Date(record.createdAt).getTime() + levelIndex * 86400000,
    totalTimeSec: 120 + levelIndex * 15,
    score,
    correctCount,
    totalCount,
    questions,
    rewards: {
      baseXp: 50,
      bonusXp: isBoss ? 50 : 10,
      coins: 20,
    },
    skillChanges: [
      {
        skillId: 'sk1',
        skillName: levelTitle,
        oldLevel: 40 + levelIndex * 2,
        newLevel: 40 + levelIndex * 2 + (score >= 80 ? 6 : 3),
      },
    ],
    aiComment:
      score === 100
        ? `「${levelTitle}」掌握得非常扎实，继续保持！`
        : score >= 80
          ? `「${levelTitle}」整体不错，个别细节还可以再巩固。`
          : `「${levelTitle}」还有提升空间，建议复盘错题后再练几题。`,
  };
}
