import { SCHOOL_LEARNING_DEMO, SchoolClassUsage, SchoolLearningPeriod } from './mockSchoolLearningData';

export interface DemoStudent {
  id: string;
  name: string;
}

export interface DemoLearningActivity {
  id: string;
  studentId: string;
  subject: string;
  title: string;
  type: '一课一练' | '同步微课';
  minutes: number;
  timeLabel: string;
}

export interface DemoQuestion {
  id: string;
  knowledgePoint: string;
  stem: string;
  correctAnswer: string;
  commonWrongAnswer: string;
}

export interface DemoTeachingUnit {
  unit: string;
  scoringMethod: '系统判分演示' | '人工评价演示';
  questions: DemoQuestion[];
  attemptedCount: number;
  firstWrongCount: number;
}

export interface DemoQuestionAttempt {
  questionId: string;
  studentId: string;
  answer: string;
  correct: boolean;
}

const units: Record<string, DemoTeachingUnit> = {
  'c1:数学': {
    unit: '有理数', scoringMethod: '系统判分演示', attemptedCount: 10, firstWrongCount: 6,
    questions: [
      { id: 'M7-01', knowledgePoint: '有理数混合运算', stem: '计算 (-3) × [2 - (-4)] 的结果。', correctAnswer: '-18', commonWrongAnswer: '18' },
      { id: 'M7-02', knowledgePoint: '有理数混合运算', stem: '计算 12 ÷ (-3) + 5 的结果。', correctAnswer: '1', commonWrongAnswer: '-9' },
    ],
  },
  'c2:语文': {
    unit: '现代文阅读', scoringMethod: '人工评价演示', attemptedCount: 9, firstWrongCount: 5,
    questions: [{ id: 'C7-01', knowledgePoint: '概括文章主旨', stem: '阅读短文后，概括作者借“雨后的操场”表达的主要情感。', correctAnswer: '从雨后操场的变化表达对校园生活的喜爱。', commonWrongAnswer: '只描述操场积水消失。' }],
  },
  'c2:英语': {
    unit: '阅读理解', scoringMethod: '系统判分演示', attemptedCount: 8, firstWrongCount: 4,
    questions: [{ id: 'E7-01', knowledgePoint: '定位关键信息', stem: 'In the passage, why did Tom go to the library?', correctAnswer: 'To borrow a science book.', commonWrongAnswer: 'To meet his friend.' }],
  },
  'c3:物理': {
    unit: '运动和力', scoringMethod: '系统判分演示', attemptedCount: 6, firstWrongCount: 4,
    questions: [{ id: 'P8-01', knowledgePoint: '速度与时间关系', stem: '小车 10 秒行驶 50 米，平均速度是多少？', correctAnswer: '5 m/s', commonWrongAnswer: '0.2 m/s' }],
  },
};

const surnames = ['李', '王', '张', '陈', '刘', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾'];
const givenNames = ['晨', '宇', '欣', '泽', '宁', '彤', '睿', '涵', '博', '怡', '轩', '琳', '然', '琪', '涛', '月', '乐', '悦', '航', '颖', '阳', '萱', '洋', '思', '妍', '辰', '佳', '明', '瑶', '静', '文', '昕'];

export const getDemoRoster = (row: SchoolClassUsage): DemoStudent[] =>
  Array.from({ length: row.enrolled }, (_, index) => ({ id: `${row.id}-s${String(index + 1).padStart(2, '0')}`, name: surnames[index % surnames.length] + givenNames[(index + row.grade) % givenNames.length] }));

const getSubjectStudentIds = (row: SchoolClassUsage, subject: string): string[] => {
  const index = row.subjects.findIndex((item) => item.subject === subject);
  const usage = row.subjects[index];
  if (!usage) return [];
  const roster = getDemoRoster(row);
  if (row.id === 'c3' && row.learned === 24 && subject === '物理') {
    return [...roster.slice(0, 7), ...roster.slice(16, 24)].map((item) => item.id);
  }
  // 第二门学科错开成员，保证各科参与人数与班级去重学习人数同时能对上。
  const offset = row.id === 'c3' && subject === '语文' ? 4 : index === 1 ? Math.max(0, row.learned - usage.learned) : 0;
  return roster.slice(offset, offset + usage.learned).map((item) => item.id);
};

export const getDemoActivities = (row: SchoolClassUsage, period: SchoolLearningPeriod): DemoLearningActivity[] =>
  row.subjects.flatMap((subjectUsage) => getSubjectStudentIds(row, subjectUsage.subject).map((studentId, index) => {
    const unit = units[`${row.id}:${subjectUsage.subject}`];
    const type = unit && index < unit.attemptedCount ? '一课一练' : '同步微课';
    return {
      id: `${period}:${row.id}:${subjectUsage.subject}:${studentId}`,
      studentId,
      subject: subjectUsage.subject,
      title: `${unit?.unit ?? subjectUsage.subject} · ${type}`,
      type,
      minutes: type === '一课一练' ? 8 + index % 5 : 5 + index % 4,
      timeLabel: period === '7d' ? `近 7 天 · 第 ${index % 7 + 1} 天` : `近 30 天 · 第 ${index % 4 + 1} 周`,
    };
  }));

export const getDemoTeachingUnit = (classId: string, subject: string): DemoTeachingUnit | null => units[`${classId}:${subject}`] ?? null;

export const getDemoQuestionAttempts = (row: SchoolClassUsage, subject: string): DemoQuestionAttempt[] => {
  const unit = getDemoTeachingUnit(row.id, subject);
  if (!unit) return [];
  const baselineRow = SCHOOL_LEARNING_DEMO['7d'].find((item) => item.id === row.id) ?? row;
  const studentIds = getSubjectStudentIds(baselineRow, subject).slice(0, unit.attemptedCount);
  return unit.questions.flatMap((question, questionIndex) => studentIds.map((studentId, index) => {
    const correct = questionIndex === 0 ? index >= unit.firstWrongCount : index < 2 || index >= unit.firstWrongCount;
    return { questionId: question.id, studentId, answer: correct ? question.correctAnswer : question.commonWrongAnswer, correct };
  }));
};

export const getDemoNoRecordReason = (row: SchoolClassUsage, studentId: string): string | null => {
  const index = getDemoRoster(row).findIndex((item) => item.id === studentId);
  if (index < row.used || index < 0) return null;
  const missingIndex = index - row.used;
  if (missingIndex < row.syncPending) return '离线记录待同步';
  if (missingIndex < row.syncPending + row.deviceUnavailable) return '设备不可用';
  return '原因待核对';
};
