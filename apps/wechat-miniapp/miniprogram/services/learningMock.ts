import { DEMO_CLASSES, DEMO_STUDENTS, reportDate } from './schoolDemoRoster';
import type { DemoClass } from './schoolDemoRoster';

export type LearningPeriod = '7d' | '30d';
export type LearningFeature = '同步微课' | '自主练习' | '错题订正' | 'AI解题';
export interface LearningActivity { id: string; studentId: string; classId: string; subject: string; feature: LearningFeature; title: string; day: number; start: string; minutes: number; status: '已完成' | '学习中断' }
export interface LearningAttempt { id: string; activityId: string; studentId: string; classId: string; subject: string; questionId: string; knowledge: string; correct: boolean; kind: '首次' | '订正' }
export interface LearningQuestion { id: string; stem: string; answer: string; wrong: string; scoring: string; version: string }
interface UsageEvent { id: string; studentId: string; classId: string; subject: string; day: number; feature?: string }
interface SolveEvent { id: string; activityId: string; studentId: string; classId: string; subject: string; day: number; problemId: string; askCount: number }

const activities: LearningActivity[] = [];
const attempts: LearningAttempt[] = [];
const usage: UsageEvent[] = [];
const solves: SolveEvent[] = [];
const QUESTION_BANK: LearningQuestion[] = [
  { id: '7:数学:q0', stem: '计算：(-3) × [2 - (-4)]。', answer: '-18', wrong: '18', scoring: '系统判分', version: '演示题库 v1' },
  { id: '7:数学:q1', stem: '计算：12 ÷ (-3) + 5。', answer: '1', wrong: '-9', scoring: '系统判分', version: '演示题库 v1' },
  { id: '8:数学:q0', stem: '一次函数 y = 2x - 3 与 y 轴交点的坐标是？', answer: '(0, -3)', wrong: '(0, 3)', scoring: '系统判分', version: '演示题库 v1' },
  { id: '8:数学:q1', stem: '函数 y = -2x + 1 中，x 增大时 y 如何变化？', answer: '减小', wrong: '增大', scoring: '系统判分', version: '演示题库 v1' },
  ...[7, 8].flatMap(grade => [
    { id: `${grade}:语文:q0`, stem: '短文：雨停后，同学们一起扫去操场的积水，摆好器材，继续练习接力。请概括这段话的主要内容。', answer: '同学们清理雨后的操场并继续练习接力。', wrong: '雨停了。', scoring: '人工评价（演示）', version: '演示题库 v1' },
    { id: `${grade}:语文:q1`, stem: '短文：小林找来纸箱，和同伴分类整理班级图书，还制作了借阅登记表。请概括小林和同伴做了什么。', answer: '整理班级图书并制作借阅登记表。', wrong: '找来纸箱。', scoring: '人工评价（演示）', version: '演示题库 v1' },
    { id: `${grade}:英语:q0`, stem: 'Tom went to the library to borrow a science book. Why did Tom go to the library?', answer: 'To borrow a science book.', wrong: 'To meet his friend.', scoring: '系统判分', version: '演示题库 v1' },
    { id: `${grade}:英语:q1`, stem: 'Mary walks to school every day. How does Mary go to school?', answer: 'On foot.', wrong: 'By bus.', scoring: '系统判分', version: '演示题库 v1' },
  ]),
  { id: '8:物理:q0', stem: '小车在 10 秒内行驶 50 米，平均速度是多少？', answer: '5 m/s', wrong: '0.2 m/s', scoring: '系统判分', version: '演示题库 v1' },
  { id: '8:物理:q1', stem: '小车以 4 m/s 匀速行驶 5 秒，经过的路程是多少？', answer: '20 m', wrong: '1.25 m', scoring: '系统判分', version: '演示题库 v1' },
];
export const getLearningQuestion = (id: string) => QUESTION_BANK.find(question => question.id === id) || null;

const getSubjectStudents = (row: DemoClass, period: LearningPeriod, subject: string) => {
  const subjects = (period === '7d' ? row.subjects7 : row.subjects30) as Record<string, number>;
  const count = subjects[subject] || 0;
  const roster = DEMO_STUDENTS.filter(student => student.classId === row.id);
  const index = Object.keys(subjects).indexOf(subject);
  if (row.id === 'c3' && period === '30d' && subject === '物理') return [...roster.slice(0, 7), ...roster.slice(16, 24)].map(student => student.id);
  const learned = period === '7d' ? row.learned7 : row.learned30;
  const offset = row.id === 'c3' && subject === '语文' ? 4 : index === 1 ? Math.max(0, learned - count) : 0;
  return roster.slice(offset, offset + count).map(student => student.id);
};

const subjectActivities = (row: DemoClass, period: LearningPeriod) => Object.keys((period === '7d' ? row.subjects7 : row.subjects30) as Record<string, number>)
  .flatMap(subject => getSubjectStudents(row, period, subject).map(studentId => ({ studentId, subject })));

const knowledgeFor = (row: DemoClass, subject: string) => subject === '数学' ? row.grade === 7 ? '有理数混合运算' : '一次函数图像' : subject === '语文' ? '概括主要内容' : subject === '英语' ? '提取文章信息' : '速度计算';
const titleFor = (row: DemoClass, subject: string, feature: LearningFeature) => `${knowledgeFor(row, subject)} · ${feature}`;

DEMO_CLASSES.forEach((row, classIndex) => {
  const recent = subjectActivities(row, '7d');
  const monthly = subjectActivities(row, '30d');
  monthly.forEach((item, index) => {
    const inWeek = recent.some(record => record.studentId === item.studentId && record.subject === item.subject);
    const day = inWeek ? (index + classIndex) % 6 + 1 : 9 + index % 20;
    const add = (suffix: string, feature: LearningFeature, activityDay: number, minutes: number) => {
      const record: LearningActivity = { id: `${item.studentId}:${item.subject}:${suffix}`, studentId: item.studentId, classId: row.id, subject: item.subject, feature, title: titleFor(row, item.subject, feature), day: activityDay, start: '', minutes, status: index % 11 === 10 && feature === '同步微课' ? '学习中断' : '已完成' };
      activities.push(record);
      usage.push({ id: record.id, studentId: item.studentId, classId: row.id, subject: item.subject, day: activityDay, feature });
      return record;
    };
    add('video', '同步微课', day, 6 + index % 7);
    if (index % 5 !== 4) {
      const practice = add('practice', '自主练习', day - 1, 8 + index % 9);
      const wrong: number[] = [];
      for (let qIndex = 0; qIndex < 2; qIndex++) {
        const correct = (index + qIndex + classIndex) % 4 >= 2;
        if (!correct) wrong.push(qIndex);
        attempts.push({ id: `${practice.id}:q${qIndex}`, activityId: practice.id, studentId: item.studentId, classId: row.id, subject: item.subject, questionId: `${row.grade}:${item.subject}:q${qIndex}`, knowledge: knowledgeFor(row, item.subject), correct, kind: '首次' });
      }
      if (wrong.length && index % 3 === 0) {
        const correction = add('correction', '错题订正', day - 1, 4);
        wrong.forEach(qIndex => attempts.push({ id: `${correction.id}:q${qIndex}`, activityId: correction.id, studentId: item.studentId, classId: row.id, subject: item.subject, questionId: `${row.grade}:${item.subject}:q${qIndex}`, knowledge: knowledgeFor(row, item.subject), correct: index % 2 === 0, kind: '订正' }));
      }
    }
    if (index % 4 === 1) {
      const activity = add('solve', 'AI解题', day - 1, 5);
      const requests = index % 3 === 0 ? 2 : 1;
      for (let request = 0; request < requests; request++) solves.push({ id: `${activity.id}:request:${request}`, activityId: activity.id, studentId: item.studentId, classId: row.id, subject: item.subject, day: activity.day, problemId: `${activity.id}:problem`, askCount: request === 0 ? 1 + index % 2 : 1 });
    }
    if (index % 7 === 0) for (let question = 0; question < 1 + index % 3; question++) usage.push({ id: `${item.studentId}:${item.subject}:ask:${index}:${question}`, studentId: item.studentId, classId: row.id, subject: '', day: day - 1, feature: '小晤问答' });
  });
  DEMO_STUDENTS.filter(student => student.classId === row.id).slice(0, row.used30).forEach((student, index) => usage.push({ id: `${student.id}:app-use`, studentId: student.id, classId: row.id, subject: '', day: index < row.used7 ? index % 7 : 10 + index % 18 }));
});

const elapsedByStudentDay = new Map<string, number>();
activities.forEach(activity => {
  const key = `${activity.studentId}:${activity.day}`;
  const elapsed = elapsedByStudentDay.get(key) || 0;
  activity.start = `${16 + Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  elapsedByStudentDay.set(key, elapsed + activity.minutes + 2);
});

export function queryLearning(period: LearningPeriod, classId: string = 'all', subject: string = 'all', studentId: string = 'all') {
  const days = period === '7d' ? 7 : 30;
  const inScope = (row: { classId: string; studentId: string; subject?: string; day?: number }) => (classId === 'all' || row.classId === classId) && (studentId === 'all' || row.studentId === studentId) && (row.day === undefined || row.day < days) && (subject === 'all' || row.subject === subject);
  const roster = DEMO_STUDENTS.filter(student => (classId === 'all' || student.classId === classId) && (studentId === 'all' || student.id === studentId));
  const learning = activities.filter(inScope);
  const activityIds = new Set(learning.map(row => row.id));
  const operations = usage.filter(inScope);
  const answers = attempts.filter(row => activityIds.has(row.activityId));
  const solveRequests = solves.filter(row => activityIds.has(row.activityId));
  return { roster, activities: learning, operations, answers, solveRequests, usedIds: new Set(operations.map(row => row.studentId)), learnedIds: new Set(learning.map(row => row.studentId)), minutes: learning.reduce((sum, row) => sum + row.minutes, 0) };
}

export function learningOnDay(data: LearningReport, day: number): LearningReport {
  const activities = data.activities.filter(row => row.day === day);
  const activityIds = new Set(activities.map(row => row.id));
  const operations = data.operations.filter(row => row.day === day);
  return { ...data, activities, operations, answers: data.answers.filter(row => activityIds.has(row.activityId)), solveRequests: data.solveRequests.filter(row => activityIds.has(row.activityId)), usedIds: new Set(operations.map(row => row.studentId)), learnedIds: new Set(activities.map(row => row.studentId)), minutes: activities.reduce((sum, row) => sum + row.minutes, 0) };
}

export function activityEvidence(data: LearningReport, activityId: string) {
  const activity = data.activities.find(row => row.id === activityId);
  if (!activity) return null;
  return { activity, date: reportDate(activity.day), questions: data.answers.filter(row => row.activityId === activityId).map(row => {
    const question = getLearningQuestion(row.questionId);
    return { id: row.id, kind: row.kind, stem: question?.stem || '原题暂缺', answer: question ? row.correct ? question.answer : question.wrong : '作答暂缺', correct: row.correct, result: row.correct ? '正确' : '错误', reference: question?.answer || '暂无参考答案', scoring: question?.scoring || '判分方式暂缺', version: question?.version || '来源暂缺' };
  }) };
}

export type LearningReport = ReturnType<typeof queryLearning>;
export const pct = (part: number, whole: number) => whole ? Math.round(part / whole * 1000) / 10 : 0;
export const getStudentLearning = (data: LearningReport, studentId: string) => {
  const rows = data.activities.filter(row => row.studentId === studentId);
  const first = data.answers.filter(row => row.studentId === studentId && row.kind === '首次');
  return { studentId, minutes: rows.reduce((sum, row) => sum + row.minutes, 0), days: new Set(rows.map(row => row.day)).size, firstCount: first.length, firstWrong: first.filter(row => !row.correct).length, latest: rows.length ? reportDate(Math.min(...rows.map(row => row.day))) : '', learned: rows.length > 0, used: data.usedIds.has(studentId) };
};
export const subjectRows = (data: LearningReport) => [...new Set(data.activities.map(row => row.subject))].map(subject => {
  const rows = data.activities.filter(row => row.subject === subject);
  return { subject, people: new Set(rows.map(row => row.studentId)).size, minutes: rows.reduce((sum, row) => sum + row.minutes, 0), count: rows.length };
}).sort((a, b) => b.people - a.people);
export const knowledgeRows = (data: LearningReport) => [...new Set(data.answers.filter(row => row.kind === '首次').map(row => `${row.subject}:${row.knowledge}`))].map(key => {
  const rows = data.answers.filter(row => row.kind === '首次' && `${row.subject}:${row.knowledge}` === key);
  return { key, subject: rows[0].subject, knowledge: rows[0].knowledge, students: new Set(rows.map(row => row.studentId)).size, questions: new Set(rows.map(row => row.questionId)).size, wrongPeople: new Set(rows.filter(row => !row.correct).map(row => row.studentId)).size };
}).sort((a, b) => b.wrongPeople - a.wrongPeople);
export const featureRows = (data: LearningReport) => {
  const regular = [...new Map(data.operations.filter(row => row.feature && row.feature !== 'AI解题').map(row => [row.id, row])).values()];
  const solveRequests = [...new Map(data.solveRequests.map(row => [row.id, row])).values()];
  const names = [...new Set([...regular.map(row => row.feature!), ...(solveRequests.length ? ['AI解题'] : [])])];
  return names.map(name => {
    const rows = name === 'AI解题' ? solveRequests : regular.filter(row => row.feature === name);
    return { name, people: new Set(rows.map(row => row.studentId)).size, count: rows.length, problems: name === 'AI解题' ? new Set(solveRequests.map(row => row.problemId)).size : 0, questions: name === 'AI解题' ? solveRequests.reduce((sum, row) => sum + row.askCount, 0) : 0 };
  });
};
export const timelineRows = (data: LearningReport) => [...data.activities].sort((a, b) => a.day - b.day || b.start.localeCompare(a.start)).map(row => ({ ...row, date: reportDate(row.day), answers: data.answers.filter(answer => answer.activityId === row.id && answer.kind === '首次').length }));
