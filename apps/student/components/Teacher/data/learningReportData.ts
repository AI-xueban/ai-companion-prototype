import { TeacherPortalUser } from './teacherAccess';
import { SCHOOL_LEARNING_DEMO, SchoolLearningPeriod } from './mockSchoolLearningData';
import { getDemoActivities, getDemoRoster } from './mockTeachingEvidence';

export type ReportView = 'school' | 'teaching' | 'homeroom';
export type Population = 'all' | 'used' | 'learned' | 'no-use';
export interface ReportScope { view: ReportView; classId: string; grade: string; subject: string; period: SchoolLearningPeriod }
export interface ReportStudent { id: string; name: string; classId: string; className: string; grade: number }
export interface LearningRecord { id: string; studentId: string; classId: string; subject: string; feature: string; content: string; day: number; start: string; minutes: number; status: '已完成' | '学习中断'; questionIds: string[] }
export interface LearningQuestion { id: string; subject: string; grade: number; unit: string; knowledge: string; stem: string; answer: string; wrong: string; scoring: string }
export interface LearningAttempt { id: string; activityId: string; studentId: string; questionId: string; day: number; answer: string; correct: boolean; kind: '首次' | '订正' }
interface UsageRecord { studentId: string; classId: string; subject: string; day: number; feature?: string; eventId?: string }
interface AiSolveRecord { id: string; activityId: string; studentId: string; classId: string; subject: string; day: number; problemId: string; askCount: number }

export const REPORT_CLASSES = SCHOOL_LEARNING_DEMO['7d'];
export const REPORT_STUDENTS: ReportStudent[] = REPORT_CLASSES.flatMap(row => getDemoRoster(row).map(student => ({ ...student, classId: row.id, className: row.name, grade: row.grade })));
export const REPORT_END = '2026-10-12';
export const REPORT_FEATURES = ['同步微课', '自主练习', '错题订正', 'AI解题'];
export const REPORT_QUESTIONS: LearningQuestion[] = [
  { id: 'm7a', subject: '数学', grade: 7, unit: '有理数', knowledge: '有理数混合运算', stem: '计算：(-3) × [2 - (-4)]。', answer: '-18', wrong: '18', scoring: '系统判分' },
  { id: 'm7b', subject: '数学', grade: 7, unit: '有理数', knowledge: '有理数混合运算', stem: '计算：12 ÷ (-3) + 5。', answer: '1', wrong: '-9', scoring: '系统判分' },
  { id: 'm8a', subject: '数学', grade: 8, unit: '一次函数', knowledge: '一次函数图像', stem: '一次函数 y = 2x - 3 与 y 轴交点的坐标是？', answer: '(0, -3)', wrong: '(0, 3)', scoring: '系统判分' },
  { id: 'm8b', subject: '数学', grade: 8, unit: '一次函数', knowledge: '一次函数图像', stem: '函数 y = -2x + 1 中，x 增大时 y 如何变化？', answer: '减小', wrong: '增大', scoring: '系统判分' },
  ...[7, 8].flatMap(grade => [
    { id: `c${grade}a`, subject: '语文', grade, unit: '现代文阅读', knowledge: '概括主要内容', stem: '短文：雨停后，同学们一起扫去操场的积水，摆好器材，继续练习接力。请概括这段话的主要内容。', answer: '同学们清理雨后的操场并继续练习接力。', wrong: '雨停了。', scoring: '人工评价（演示）' },
    { id: `c${grade}b`, subject: '语文', grade, unit: '现代文阅读', knowledge: '概括主要内容', stem: '短文：小林找来纸箱，和同伴分类整理班级图书，还制作了借阅登记表。请概括小林和同伴做了什么。', answer: '整理班级图书并制作借阅登记表。', wrong: '找来纸箱。', scoring: '人工评价（演示）' },
    { id: `e${grade}a`, subject: '英语', grade, unit: '阅读理解', knowledge: '提取文章信息', stem: 'Tom went to the library to borrow a science book. Why did Tom go to the library?', answer: 'To borrow a science book.', wrong: 'To meet his friend.', scoring: '系统判分' },
    { id: `e${grade}b`, subject: '英语', grade, unit: '阅读理解', knowledge: '提取文章信息', stem: 'Mary walks to school every day. How does Mary go to school?', answer: 'On foot.', wrong: 'By bus.', scoring: '系统判分' },
  ]),
  { id: 'p8a', subject: '物理', grade: 8, unit: '机械运动', knowledge: '速度计算', stem: '小车在 10 秒内行驶 50 米，平均速度是多少？', answer: '5 m/s', wrong: '0.2 m/s', scoring: '系统判分' },
  { id: 'p8b', subject: '物理', grade: 8, unit: '机械运动', knowledge: '速度计算', stem: '小车以 4 m/s 匀速行驶 5 秒，经过的路程是多少？', answer: '20 m', wrong: '1.25 m', scoring: '系统判分' },
];

const records: LearningRecord[] = [];
const attempts: LearningAttempt[] = [];
const usage: UsageRecord[] = [];
const aiSolves: AiSolveRecord[] = [];
// 固定日期的演示事实表；所有页面从同一批活动与作答计算，不独立填汇总数字。
REPORT_CLASSES.forEach((row, classIndex) => {
  const recent = getDemoActivities(row, '7d');
  const monthRow = SCHOOL_LEARNING_DEMO['30d'].find(item => item.id === row.id)!;
  const monthly = getDemoActivities(monthRow, '30d');
  monthly.forEach((item, index) => {
    const inWeek = recent.some(record => record.studentId === item.studentId && record.subject === item.subject);
    const day = inWeek ? (index + classIndex) % 6 + 1 : 9 + index % 20;
    const questions = REPORT_QUESTIONS.filter(q => q.grade === row.grade && q.subject === item.subject);
    const unit = questions[0]?.unit ?? item.subject;
    const make = (suffix: string, feature: string, dayOffset: number, minutes: number, questionIds: string[] = []) => {
      const record: LearningRecord = { id: `${item.studentId}:${item.subject}:${suffix}`, studentId: item.studentId, classId: row.id, subject: item.subject, feature, content: `${unit} · ${feature === '同步微课' ? '内容讲解' : feature === '自主练习' ? '自选练习' : feature === '错题订正' ? '错题回练' : '题目讲解'}`, day: dayOffset, start: `${16 + index % 3}:${index % 2 ? '10' : '30'}`, minutes, status: index % 11 === 10 && feature === '同步微课' ? '学习中断' : '已完成', questionIds };
      records.push(record);
      usage.push({ studentId: item.studentId, classId: row.id, subject: item.subject, day: dayOffset, feature, eventId: record.id });
      return record;
    };
    make('video', '同步微课', day, 6 + index % 7);
    if (index % 5 !== 4) {
      const practice = make('practice', '自主练习', day - 1, 8 + index % 9, questions.map(q => q.id));
      questions.forEach((question, qIndex) => {
        const correct = (index + qIndex + classIndex) % 4 >= 2;
        attempts.push({ id: `${practice.id}:${question.id}`, activityId: practice.id, studentId: item.studentId, questionId: question.id, day: practice.day, answer: correct ? question.answer : question.wrong, correct, kind: '首次' });
      });
      const wrong = attempts.filter(a => a.activityId === practice.id && !a.correct);
      if (wrong.length && index % 3 === 0) {
        const correction = make('correction', '错题订正', day - 1, 4, wrong.map(a => a.questionId));
        wrong.forEach((attempt, i) => {
          const question = questions.find(q => q.id === attempt.questionId)!;
          const correct = index % 2 === 0;
          attempts.push({ ...attempt, id: `${correction.id}:${i}`, activityId: correction.id, day: correction.day, answer: correct ? question.answer : question.wrong, correct, kind: '订正' });
        });
      }
    }
    if (index % 4 === 1) {
      const activity = make('solve', 'AI解题', day - 1, 5);
      const requests = index % 3 === 0 ? 2 : 1;
      for (let request = 0; request < requests; request++) aiSolves.push({ id: `${activity.id}:request:${request}`, activityId: activity.id, studentId: item.studentId, classId: row.id, subject: item.subject, day: activity.day, problemId: `${activity.id}:problem`, askCount: request === 0 ? 1 + index % 2 : 1 });
    }
    if (index % 7 === 0) for (let question = 0; question < 1 + index % 3; question++) usage.push({ studentId: item.studentId, classId: row.id, subject: '', day: day - 1, feature: '小晤问答', eventId: `${item.studentId}:${item.subject}:ask:${index}:${question}` });
  });
  getDemoRoster(monthRow).slice(0, monthRow.used).forEach((student, index) => usage.push({ studentId: student.id, classId: row.id, subject: '', day: index < row.used ? index % 7 : 10 + index % 18 }));
});

const dayMinutes = new Map<string, number>();
records.forEach(record => {
  const key = `${record.studentId}:${record.day}`;
  const elapsed = dayMinutes.get(key) ?? 0;
  record.start = `${16 + Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`;
  dayMinutes.set(key, elapsed + record.minutes + 2);
});
export const LEARNING_RECORDS = records;
export const LEARNING_ATTEMPTS = attempts;
export const AI_SOLVE_RECORDS = aiSolves;
export const reportDate = (day: number) => {
  const date = new Date(`${REPORT_END}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
};
export const periodLabel = (period: SchoolLearningPeriod) => `${reportDate(period === '7d' ? 6 : 29)} — ${REPORT_END}`;
export const percentage = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;
export const minutesLabel = (minutes: number) => minutes >= 60 ? `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分钟` : `${minutes} 分钟`;
export const getViews = (user: TeacherPortalUser): ReportView[] => [ ...(user.role === 'school-admin' ? ['school' as const] : []), ...(user.teachingAssignments.length ? ['teaching' as const] : []), ...(user.homeroomClassIds.length ? ['homeroom' as const] : []) ];
export const initialReportScope = (user: TeacherPortalUser, requestedView?: ReportView): ReportScope => {
  const view = requestedView ?? (user.role === 'school-admin' ? 'school' : user.role === 'class-teacher' && user.homeroomClassIds.length ? 'homeroom' : getViews(user)[0] ?? 'teaching');
  const base: ReportScope = { view, classId: 'all', grade: 'all', subject: 'all', period: '7d' };
  if (view === 'school') return base;
  const classId = scopeClasses(user, base)[0]?.id ?? '';
  return { ...base, classId, subject: view === 'teaching' ? subjectsForClass(user, view, classId)[0] ?? '' : 'all' };
};
export const subjectsForClass = (user: TeacherPortalUser, view: ReportView, classId: string) => {
  const row = REPORT_CLASSES.find(item => item.id === classId);
  if (!row || row.schoolId !== user.schoolId || !user.classIds.includes(classId)) return [];
  if (view === 'school' && user.role === 'school-admin' || view === 'homeroom' && user.homeroomClassIds.includes(classId)) return row.subjects.map(item => item.subject);
  if (view === 'teaching') return row.subjects.map(item => item.subject).filter(subject => user.teachingAssignments.some(item => item.classId === classId && item.subjects.includes(subject)));
  return [];
};
export const scopeClasses = (user: TeacherPortalUser, scope: ReportScope) => REPORT_CLASSES.filter(row => subjectsForClass(user, scope.view, row.id).length && (scope.grade === 'all' || String(row.grade) === scope.grade));
export const scopeSubjects = (user: TeacherPortalUser, scope: ReportScope) => [...new Set(scopeClasses(user, scope).filter(row => scope.classId === 'all' || row.id === scope.classId).flatMap(row => subjectsForClass(user, scope.view, row.id)))];

export function queryReport(user: TeacherPortalUser, scope: ReportScope) {
  const classes = scopeClasses(user, scope).filter(row => (scope.classId === 'all' || row.id === scope.classId) && (scope.subject === 'all' || subjectsForClass(user, scope.view, row.id).includes(scope.subject)));
  const ids = new Set(classes.map(row => row.id));
  const roster = REPORT_STUDENTS.filter(student => ids.has(student.classId));
  const match = (record: { classId: string; subject: string; day: number }) => ids.has(record.classId) && record.day < (scope.period === '7d' ? 7 : 30) && (record.subject ? subjectsForClass(user, scope.view, record.classId).includes(record.subject) && (scope.subject === 'all' || record.subject === scope.subject) : scope.view !== 'teaching' && scope.subject === 'all');
  const activities = records.filter(match);
  const operations = usage.filter(match);
  const activityIds = new Set(activities.map(item => item.id));
  const answers = attempts.filter(item => activityIds.has(item.activityId));
  const solveRequests = aiSolves.filter(item => activityIds.has(item.activityId));
  const usedIds = new Set(operations.map(item => item.studentId));
  const learnedIds = new Set(activities.map(item => item.studentId));
  const minutes = activities.reduce((sum, item) => sum + item.minutes, 0);
  return { classes, roster, activities, operations, answers, solveRequests, usedIds, learnedIds, minutes };
}
export type ReportData = ReturnType<typeof queryReport>;
export const featureUsage = (data: ReportData) => {
  const events = [...new Map(data.operations.filter(item => item.feature && item.feature !== 'AI解题' && item.eventId).map(item => [item.eventId!, item])).values()];
  const solves = [...new Map(data.solveRequests.map(item => [item.id, item])).values()];
  const names = [...new Set([...events.map(item => item.feature!), ...(solves.length ? ['AI解题'] : [])])];
  return names.map(name => {
    const rows = name === 'AI解题' ? solves : events.filter(item => item.feature === name);
    return { name, people: new Set(rows.map(item => item.studentId)).size, count: rows.length, problemCount: name === 'AI解题' ? new Set(solves.map(item => item.problemId)).size : 0, askCount: name === 'AI解题' ? solves.reduce((sum, item) => sum + item.askCount, 0) : 0 };
  });
};
export const groupActivities = (data: ReportData, field: 'subject' | 'feature' | 'content') => [...new Set(data.activities.map(item => item[field]))].map(name => {
  const rows = data.activities.filter(item => item[field] === name);
  return { name, people: new Set(rows.map(item => item.studentId)).size, count: rows.length, minutes: rows.reduce((sum, item) => sum + item.minutes, 0) };
}).sort((a, b) => b.minutes - a.minutes);
export const knowledgeGroups = (data: ReportData) => [...new Set(data.answers.map(a => { const q = REPORT_QUESTIONS.find(q => q.id === a.questionId)!; return `${q.grade}:${q.subject}:${q.knowledge}`; }))].map(key => {
  const answers = data.answers.filter(a => { const q = REPORT_QUESTIONS.find(q => q.id === a.questionId)!; return a.kind === '首次' && `${q.grade}:${q.subject}:${q.knowledge}` === key; });
  const questionIds = [...new Set(answers.map(a => a.questionId))];
  const question = REPORT_QUESTIONS.find(q => q.id === questionIds[0]);
  return { name: question?.knowledge ?? '', grade: question?.grade ?? 0, questionIds, people: new Set(answers.map(a => a.studentId)).size, wrongPeople: new Set(answers.filter(a => !a.correct).map(a => a.studentId)).size, answers, subject: question?.subject ?? '' };
}).filter(item => item.people > 0).sort((a, b) => b.wrongPeople - a.wrongPeople);
