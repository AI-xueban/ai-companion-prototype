export type SchoolLearningPeriod = '7d' | '30d';

export interface SchoolSubjectUsage {
  subject: string;
  eligible: number;
  learned: number;
}

export interface SchoolClassUsage {
  id: string;
  schoolId: string;
  name: string;
  grade: number;
  enrolled: number;
  used: number;
  learned: number;
  answered: number;
  syncPending: number;
  deviceUnavailable: number;
  unknownNoRecord: number;
  subjects: SchoolSubjectUsage[];
}

export interface SchoolKnowledgeIssue {
  id: string;
  grade: number;
  subject: string;
  unit: string;
  knowledgePoint: string;
  attemptedStudents: number;
  firstWrongStudents: number;
  questionCount: number;
  classIds: string[];
}

export interface SchoolLearningTrendPoint {
  label: string;
  grade7Used: number;
  grade7Learned: number;
  grade8Used: number;
  grade8Learned: number;
}

// 仅供全校学情交互评审。人数按班级去重；同一学生可参与多个学科。
export const SCHOOL_LEARNING_DEMO: Record<SchoolLearningPeriod, SchoolClassUsage[]> = {
  '7d': [
    { id: 'c1', schoolId: 'luohu-lab', name: '七年级(2)班', grade: 7, enrolled: 30, used: 18, learned: 15, answered: 12, syncPending: 2, deviceUnavailable: 3, unknownNoRecord: 7, subjects: [
      { subject: '数学', eligible: 30, learned: 12 }, { subject: '语文', eligible: 30, learned: 10 }, { subject: '英语', eligible: 30, learned: 8 },
    ] },
    { id: 'c2', schoolId: 'luohu-lab', name: '七年级(4)班', grade: 7, enrolled: 28, used: 21, learned: 18, answered: 14, syncPending: 1, deviceUnavailable: 2, unknownNoRecord: 4, subjects: [
      { subject: '数学', eligible: 28, learned: 15 }, { subject: '语文', eligible: 28, learned: 12 }, { subject: '英语', eligible: 28, learned: 11 },
    ] },
    { id: 'c3', schoolId: 'luohu-lab', name: '八年级(1)班', grade: 8, enrolled: 32, used: 19, learned: 14, answered: 11, syncPending: 3, deviceUnavailable: 4, unknownNoRecord: 6, subjects: [
      { subject: '数学', eligible: 32, learned: 11 }, { subject: '语文', eligible: 32, learned: 10 }, { subject: '英语', eligible: 32, learned: 8 }, { subject: '物理', eligible: 32, learned: 7 },
    ] },
  ],
  '30d': [
    { id: 'c1', schoolId: 'luohu-lab', name: '七年级(2)班', grade: 7, enrolled: 30, used: 26, learned: 23, answered: 20, syncPending: 0, deviceUnavailable: 1, unknownNoRecord: 3, subjects: [
      { subject: '数学', eligible: 30, learned: 21 }, { subject: '语文', eligible: 30, learned: 18 }, { subject: '英语', eligible: 30, learned: 15 },
    ] },
    { id: 'c2', schoolId: 'luohu-lab', name: '七年级(4)班', grade: 7, enrolled: 28, used: 25, learned: 22, answered: 19, syncPending: 0, deviceUnavailable: 1, unknownNoRecord: 2, subjects: [
      { subject: '数学', eligible: 28, learned: 21 }, { subject: '语文', eligible: 28, learned: 19 }, { subject: '英语', eligible: 28, learned: 18 },
    ] },
    { id: 'c3', schoolId: 'luohu-lab', name: '八年级(1)班', grade: 8, enrolled: 32, used: 28, learned: 24, answered: 21, syncPending: 1, deviceUnavailable: 1, unknownNoRecord: 2, subjects: [
      { subject: '数学', eligible: 32, learned: 20 }, { subject: '语文', eligible: 32, learned: 19 }, { subject: '英语', eligible: 32, learned: 16 }, { subject: '物理', eligible: 32, learned: 15 },
    ] },
  ],
};

export const SCHOOL_LEARNING_TREND: Record<SchoolLearningPeriod, SchoolLearningTrendPoint[]> = {
  '7d': [
    { label: '周一', grade7Used: 18, grade7Learned: 14, grade8Used: 7, grade8Learned: 5 },
    { label: '周二', grade7Used: 23, grade7Learned: 18, grade8Used: 8, grade8Learned: 6 },
    { label: '周三', grade7Used: 25, grade7Learned: 20, grade8Used: 12, grade8Learned: 9 },
    { label: '周四', grade7Used: 21, grade7Learned: 17, grade8Used: 9, grade8Learned: 7 },
    { label: '周五', grade7Used: 29, grade7Learned: 23, grade8Used: 14, grade8Learned: 10 },
    { label: '周六', grade7Used: 15, grade7Learned: 11, grade8Used: 5, grade8Learned: 4 },
    { label: '周日', grade7Used: 11, grade7Learned: 8, grade8Used: 4, grade8Learned: 3 },
  ],
  '30d': [
    { label: '第 1 周', grade7Used: 31, grade7Learned: 25, grade8Used: 16, grade8Learned: 12 },
    { label: '第 2 周', grade7Used: 34, grade7Learned: 28, grade8Used: 18, grade8Learned: 14 },
    { label: '第 3 周', grade7Used: 40, grade7Learned: 33, grade8Used: 20, grade8Learned: 16 },
    { label: '第 4 周', grade7Used: 45, grade7Learned: 37, grade8Used: 25, grade8Learned: 20 },
    { label: '末 2 天', grade7Used: 14, grade7Learned: 10, grade8Used: 8, grade8Learned: 6 },
  ],
};

export const SCHOOL_KNOWLEDGE_ISSUES: SchoolKnowledgeIssue[] = [
  { id: 'k1', grade: 7, subject: '数学', unit: '有理数', knowledgePoint: '有理数混合运算', attemptedStudents: 32, firstWrongStudents: 19, questionCount: 4, classIds: ['c1', 'c2'] },
  { id: 'k2', grade: 7, subject: '语文', unit: '现代文阅读', knowledgePoint: '概括文章主旨', attemptedStudents: 27, firstWrongStudents: 15, questionCount: 3, classIds: ['c1', 'c2'] },
  { id: 'k3', grade: 8, subject: '数学', unit: '一次函数', knowledgePoint: '斜率与截距判断', attemptedStudents: 18, firstWrongStudents: 11, questionCount: 3, classIds: ['c3'] },
  { id: 'k4', grade: 8, subject: '物理', unit: '运动和力', knowledgePoint: '速度与时间关系', attemptedStudents: 14, firstWrongStudents: 8, questionCount: 2, classIds: ['c3'] },
];
