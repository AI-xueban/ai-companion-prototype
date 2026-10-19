import { REPORT_STUDENTS, reportDate } from './learningReportData';
import type { SchoolLearningPeriod } from './mockSchoolLearningData';

type TaskKind = 'homework' | 'checkin';
type GradeState = 'confirmed' | 'review' | 'unreadable' | 'no-answer';

interface HomeworkQuestion { id: string; label: string; answer: string }
interface HomeworkTask {
  id: string;
  title: string;
  subject: string;
  kind: TaskKind;
  dueDay: number;
  classIds: string[];
  selectedStudentIds?: string[];
  questions: HomeworkQuestion[];
  itemTypes: string[];
}

const rosterByClass = (classId: string) => REPORT_STUDENTS.filter(student => student.classId === classId);
const c3Selected = rosterByClass('c3').slice(0, 12).map(student => student.id);

// 同一批任务、目标学生与模拟批改返回生成全部校级数字；它与小程序运行时并未实时同步。
export const SCHOOL_HOMEWORK_TASKS: HomeworkTask[] = [
  { id: 'hw-101', title: '有理数计算与朗读', subject: '数学', kind: 'homework', dueDay: 2, classIds: ['c1', 'c2'], itemTypes: ['图片答题', '视频朗读', '无需线上提交'], questions: [{ id: 'hw-101-q1', label: '第 1 题 · 有理数混合运算', answer: '-18' }, { id: 'hw-101-q2', label: '第 2 题 · 整数运算', answer: '1' }] },
  { id: 'hw-102', title: '现代文阅读练习', subject: '语文', kind: 'homework', dueDay: 5, classIds: ['c3'], selectedStudentIds: c3Selected, itemTypes: ['图片答题'], questions: [{ id: 'hw-102-q1', label: '第 1 题 · 概括主要内容', answer: '同学们清理操场并继续练习接力' }] },
  { id: 'check-103', title: '本周阅读打卡', subject: '语文', kind: 'checkin', dueDay: 1, classIds: ['c1', 'c2', 'c3'], itemTypes: ['图片打卡'], questions: [] },
  { id: 'hw-104', title: '英语阅读理解', subject: '英语', kind: 'homework', dueDay: 17, classIds: ['c1', 'c2'], itemTypes: ['图片答题'], questions: [{ id: 'hw-104-q1', label: '第 1 题 · 信息提取', answer: 'To borrow a science book.' }] },
  { id: 'hw-105', title: '一次函数预习', subject: '数学', kind: 'homework', dueDay: -2, classIds: ['c3'], itemTypes: ['图片答题'], questions: [{ id: 'hw-105-q1', label: '第 1 题 · 图像交点', answer: '(0, -3)' }] },
];

interface TargetFact { taskId: string; studentId: string; classId: string; grade: number; status: 'completed' | 'partial' | 'missing'; photoSubmitted: boolean }
interface ItemFact { taskId: string; studentId: string; itemIndex: number; itemType: string; evidence: 'uploaded' | 'parent-confirmed' | 'missing' }
interface GradeFact { taskId: string; studentId: string; questionId: string; state: GradeState; correct: boolean }

const targetFacts: TargetFact[] = [];
const itemFacts: ItemFact[] = [];
const gradeFacts: GradeFact[] = [];
const requiresUpload = (itemType: string) => /图片|视频|录音/.test(itemType);
SCHOOL_HOMEWORK_TASKS.forEach((task, taskIndex) => {
  const targets = REPORT_STUDENTS.filter(student => task.classIds.includes(student.classId) && (!task.selectedStudentIds || task.selectedStudentIds.includes(student.id)));
  targets.forEach((student, index) => {
    const seed = index + taskIndex * 3;
    const items: ItemFact[] = task.itemTypes.map((itemType, itemIndex) => {
      const done = seed % 7 !== 0 && !(seed % 5 === 0 && task.itemTypes.length > 1 && itemIndex > 0);
      return { taskId: task.id, studentId: student.id, itemIndex, itemType, evidence: done ? requiresUpload(itemType) ? 'uploaded' : 'parent-confirmed' : 'missing' };
    });
    itemFacts.push(...items);
    const status: TargetFact['status'] = items.every(item => item.evidence !== 'missing') ? 'completed' : items.some(item => item.evidence !== 'missing') ? 'partial' : 'missing';
    const photoSubmitted = items.some(item => item.itemType.includes('图片答题') && item.evidence === 'uploaded');
    targetFacts.push({ taskId: task.id, studentId: student.id, classId: student.classId, grade: student.grade, status, photoSubmitted });
    if (photoSubmitted) task.questions.forEach((question, questionIndex) => {
      const mark = seed + questionIndex * 4;
      const state: GradeState = mark % 19 === 0 ? 'no-answer' : mark % 11 === 0 ? 'unreadable' : mark % 7 === 0 ? 'review' : 'confirmed';
      gradeFacts.push({ taskId: task.id, studentId: student.id, questionId: question.id, state, correct: mark % 4 !== 0 });
    });
  });
});

const pct = (part: number, whole: number) => whole ? Math.round(part / whole * 1000) / 10 : 0;

export function querySchoolHomework(period: SchoolLearningPeriod, grade: string, subject = 'all') {
  const days = period === '7d' ? 7 : 30;
  const tasks = SCHOOL_HOMEWORK_TASKS.filter(task => task.dueDay >= 0 && task.dueDay < days && (subject === 'all' || task.subject === subject));
  const matchingTargets = targetFacts.filter(fact => tasks.some(task => task.id === fact.taskId) && (grade === 'all' || String(fact.grade) === grade));
  const eligibleIds = new Set(matchingTargets.map(fact => `${fact.taskId}:${fact.studentId}`));
  const grades = gradeFacts.filter(fact => eligibleIds.has(`${fact.taskId}:${fact.studentId}`));
  const homeworkTargets = matchingTargets.filter(fact => SCHOOL_HOMEWORK_TASKS.find(task => task.id === fact.taskId)?.kind === 'homework');
  const checkinTargets = matchingTargets.filter(fact => SCHOOL_HOMEWORK_TASKS.find(task => task.id === fact.taskId)?.kind === 'checkin');
  const validGrades = grades.filter(fact => fact.state === 'confirmed');
  const taskRows = tasks.map(task => {
    const rows = matchingTargets.filter(fact => fact.taskId === task.id);
    const taskGrades = grades.filter(fact => fact.taskId === task.id);
    const confirmed = taskGrades.filter(fact => fact.state === 'confirmed');
    const completed = rows.filter(fact => fact.status === 'completed').length;
    const taskItems = itemFacts.filter(fact => fact.taskId === task.id && eligibleIds.has(`${fact.taskId}:${fact.studentId}`));
    const itemRows = task.itemTypes.map((itemType, itemIndex) => ({ label: itemType, done: taskItems.filter(fact => fact.itemIndex === itemIndex && fact.evidence !== 'missing').length, method: requiresUpload(itemType) ? '提交内容' : '家长确认' }));
    return { ...task, dueDate: reportDate(task.dueDay), target: rows.length, completed, completionRate: pct(completed, rows.length), partial: rows.filter(fact => fact.status === 'partial').length, missing: rows.filter(fact => fact.status === 'missing').length, itemRows, graded: confirmed.length, gradeTotal: taskGrades.length, correct: confirmed.filter(fact => fact.correct).length };
  }).filter(task => task.target > 0);
  const questionRows = taskRows.flatMap(task => task.questions.map(question => {
    const results = grades.filter(fact => fact.questionId === question.id);
    const confirmed = results.filter(fact => fact.state === 'confirmed');
    return { taskId: task.id, taskTitle: task.title, subject: task.subject, ...question, graded: confirmed.length, correct: confirmed.filter(fact => fact.correct).length, review: results.filter(fact => fact.state === 'review').length, rate: pct(confirmed.filter(fact => fact.correct).length, confirmed.length) };
  }));
  const classRows = [...new Set(matchingTargets.map(fact => fact.classId))].map(classId => {
    const rows = homeworkTargets.filter(fact => fact.classId === classId);
    const student = REPORT_STUDENTS.find(item => item.classId === classId);
    return { id: classId, name: student?.className ?? classId, target: rows.length, completed: rows.filter(fact => fact.status === 'completed').length, partial: rows.filter(fact => fact.status === 'partial').length, rate: pct(rows.filter(fact => fact.status === 'completed').length, rows.length) };
  });
  return {
    taskRows, questionRows, classRows,
    published: taskRows.filter(task => task.kind === 'homework').length,
    target: homeworkTargets.length,
    completed: homeworkTargets.filter(fact => fact.status === 'completed').length,
    partial: homeworkTargets.filter(fact => fact.status === 'partial').length,
    completionRate: pct(homeworkTargets.filter(fact => fact.status === 'completed').length, homeworkTargets.length),
    checkinTarget: checkinTargets.length,
    checkinCompleted: checkinTargets.filter(fact => fact.status === 'completed').length,
    checkinRate: pct(checkinTargets.filter(fact => fact.status === 'completed').length, checkinTargets.length),
    gradeTotal: grades.length,
    graded: validGrades.length,
    gradingCoverage: pct(validGrades.length, grades.length),
    correct: validGrades.filter(fact => fact.correct).length,
    correctness: pct(validGrades.filter(fact => fact.correct).length, validGrades.length),
    review: grades.filter(fact => fact.state === 'review').length,
    unreadable: grades.filter(fact => fact.state === 'unreadable').length,
    noAnswer: grades.filter(fact => fact.state === 'no-answer').length,
    ongoing: SCHOOL_HOMEWORK_TASKS.filter(task => task.dueDay < 0 && (subject === 'all' || task.subject === subject) && targetFacts.some(fact => fact.taskId === task.id && (grade === 'all' || String(fact.grade) === grade))).length,
  };
}
