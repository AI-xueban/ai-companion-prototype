import { DEMO_CLASSES, DEMO_STUDENTS, GUARDIAN_STUDENT_ID, reportDate } from './schoolDemoRoster';
import type { DemoClass } from './schoolDemoRoster';

export type LearningPeriod = '1d' | '7d' | '14d' | '30d';

export type PersonalLearningRange = { mode: LearningPeriod | 'custom' | 'term'; start: string; end: string };
export type PersonalQuestionFilter = 'all' | 'correct' | 'wrong' | 'corrected';

export function personalLearningRange(mode: PersonalLearningRange['mode'], start = '', end = ''): PersonalLearningRange | null {
  const last = learningReportDays[0], earliest = learningReportDays[29];
  if (mode === 'custom') {
    if (!learningReportDays.includes(start) || !learningReportDays.includes(end) || start > end) return null;
    return { mode, start, end };
  }
  // This prototype has a 30-day data window, not complete term data.
  if (mode === 'term') return { mode, start: last.slice(0, 4) + '-09-01', end: last };
  const days = { '1d': 1, '7d': 7, '14d': 14, '30d': 30 }[mode];
  return days ? { mode, start: learningReportDays[days - 1] || earliest, end: last } : null;
}

export function personalLearningReport(report: LearningReport, range: PersonalLearningRange): LearningReport {
  const inRange = (day: number) => range.mode !== 'term' && learningReportDays[day] >= range.start && learningReportDays[day] <= range.end;
  const activities = report.activities.filter(row => inRange(row.day));
  const ids = new Set(activities.map(row => row.id));
  const operations = report.operations.filter(row => inRange(row.day));
  return { ...report, activities, operations, answers: report.answers.filter(row => ids.has(row.activityId)), pendingAnswers: report.pendingAnswers?.filter(row => ids.has(row.activityId)),
    solveRequests: report.solveRequests.filter(row => ids.has(row.activityId)),
    usedIds: new Set(operations.map(row => row.studentId)), learnedIds: new Set(activities.map(row => row.studentId)),
    minutes: activities.reduce((n, row) => n + row.minutes, 0) };
}

export function personalLearningView(report: LearningReport, studentId: string, range: PersonalLearningRange, filter: PersonalQuestionFilter = 'all', topic = 'all') {
  const scoped = personalLearningReport(report, range);
  const summary = subjectStudentCounts(scoped, studentId);
  const count = (questions: typeof summary.questions) => ({ all: questions.length,
    correct: questions.filter(q => !q.wrongPeople).length, wrong: questions.filter(q => q.wrongPeople > 0).length,
    corrected: questions.filter(q => q.students.some(student => student.hasCorrection)).length });
  const topics = [...new Set(summary.questions.map(q => q.knowledge).filter(Boolean))].map(name => ({ name, ...count(summary.questions.filter(q => q.knowledge === name)) }));
  const unknownCount = summary.questions.filter(q => !q.knowledge).length;
  const selectedTopic = topics.some(row => row.name === topic) || (unknownCount > 0 && topic === '知识点暂未明确') ? topic : 'all';
  const questions = summary.questions.filter(q => selectedTopic === 'all' || (selectedTopic === '知识点暂未明确' ? !q.knowledge : q.knowledge === selectedTopic));
  const visible = questions.filter(q => filter === 'all' || (filter === 'correct' ? !q.wrongPeople : filter === 'wrong' ? q.wrongPeople > 0 : q.students.some(student => student.hasCorrection)));
  const label = { '1d': '今天', '7d': '近7天', '14d': '近14天', '30d': '近30天', custom: '自选日期', term: '本学期' }[range.mode];
  return { range, label, complete: range.mode !== 'term', summary, topics, selectedTopic, filter, counts: count(questions), visible,
    unknownCount, activities: timelineRows(scoped), topicOptions: ['全部知识点', ...topics.map(row => row.name), ...(unknownCount ? ['知识点暂未明确'] : [])] };
}

// Subject-teacher drill-downs share one scope and retain individual answer chains.
export function subjectAnswerRange(report: LearningReport, days: number, day?: number): LearningReport {
  const activities = report.activities.filter(row => day === undefined ? row.day < days : row.day === day);
  const ids = new Set(activities.map(row => row.id));
  return { ...report, activities, answers: report.answers.filter(row => ids.has(row.activityId)), pendingAnswers: report.pendingAnswers?.filter(row => ids.has(row.activityId)), learnedIds: new Set(activities.map(row => row.studentId)) };
}

export function subjectAnswerQuestions(report: LearningReport) {
  const activities = new Map(report.activities.map(row => [row.id, row]));
  const first = report.answers.filter(row => row.kind === '首次' && activities.has(row.activityId));
  const evidence = (row: LearningAttempt) => {
    const activity = activities.get(row.activityId)!;
    return { id: row.id, date: learningReportDays[activity.day], time: activity.start, correct: row.correct,
      answer: row.answerText || (row.kind === '订正' ? '原始订正内容暂缺' : '原始作答内容暂缺') };
  };
  const ordered = (a: { date: string; time: string }, b: { date: string; time: string }) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
  return [...new Set(first.map(row => row.questionId))].map(id => {
    const rows = first.filter(row => row.questionId === id);
    const students = report.roster.filter(student => rows.some(row => row.studentId === student.id)).map(student => {
      const chains = rows.filter(row => row.studentId === student.id).map(row => {
        const corrections = report.answers.filter(item => item.kind === '订正' && item.originalAttemptId === row.id && item.studentId === row.studentId && item.questionId === id && activities.has(item.activityId)).map(evidence).sort(ordered);
        return { ...evidence(row), corrections, latest: corrections[corrections.length - 1] || null };
      }).sort(ordered);
      const wrong = chains.filter(row => !row.correct);
      const status = !wrong.length ? 'correct' : wrong.some(row => row.latest && !row.latest.correct) ? 'still' : wrong.some(row => !row.latest) ? 'missing' : 'fixed';
      return { id: student.id, name: student.name, chains, wrong: wrong.length > 0, status,
        statusLabel: { correct: '答对', still: '订正仍错', missing: '暂无订正记录', fixed: '订正答对' }[status],
        date: (wrong[0] || chains[0]).date, hasCorrection: wrong.some(row => row.corrections.length > 0) };
    });
    const question = rows[0].question || getLearningQuestion(id);
    return { id, knowledge: rows[0].knowledge, stem: question?.stem || '原题暂缺', reference: question?.answer || '参考答案暂缺', source: question?.source,
      people: students.length, wrongPeople: students.filter(row => row.wrong).length, days: new Set(rows.map(row => activities.get(row.activityId)!.day)).size,
      attempts: rows.length, correctAttempts: rows.filter(row => row.correct).length, students };
  }).sort((a, b) => b.wrongPeople - a.wrongPeople || b.people - a.people || a.id.localeCompare(b.id));
}

export function subjectStudentCounts(report: LearningReport, studentId: string) {
  const questions = subjectAnswerQuestions({ ...report, answers: report.answers.filter(row => row.studentId === studentId) });
  const wrong = questions.filter(row => row.wrongPeople > 0);
  return { correctCount: questions.length - wrong.length, wrongCount: wrong.length,
    correctedCount: wrong.filter(row => row.students.some(student => student.hasCorrection)).length,
    totalCount: questions.length, questions };
}
export type LearningFeature = '同步微课' | '自主练习' | '错题订正' | 'AI解题' | '作业练习';
export interface LearningActivity { id: string; studentId: string; classId: string; subject: string; feature: LearningFeature; title: string; day: number; start: string; minutes: number; status: '已完成' | '学习中断' }
export interface LearningAttempt {
  id: string; activityId: string; studentId: string; classId: string; subject: string;
  questionId: string; knowledge: string; correct: boolean; kind: '首次' | '订正';
  answerText?: string;
  originalAttemptId?: string;
  question?: LearningQuestion;
  // Only checks explicitly assigned a stage participate in the weekly comparison.
  check?: { key: string; stage?: 'before' | 'after'; label: string; description?: string; correct: boolean };
}
export interface LearningQuestion { id: string; stem: string; answer: string; wrong: string; scoring: string; version: string; source?: { id: string; name: string; date: string; kind: string; number: number; page: number; version: number } }
interface UsageEvent { id: string; studentId: string; classId: string; subject: string; day: number; feature?: string }
interface SolveEvent { id: string; activityId: string; studentId: string; classId: string; subject: string; day: number; problemId: string; askCount: number }

const activities: LearningActivity[] = [];
const attempts: LearningAttempt[] = [];
const usage: UsageEvent[] = [];
const solves: SolveEvent[] = [];
const QUESTION_BANK: LearningQuestion[] = [
  { id: 'report:before', stem: '一袋米原有 25 千克，剩下原来的 ⅗。还剩多少千克？', answer: '25 × ⅗ = 15 千克', wrong: '', scoring: '示例判定', version: '学情演示' },
  { id: 'report:after', stem: '一件衣服原价 80 元，现价是原价的 ¾。现价是多少元？', answer: '80 × ¾ = 60 元', wrong: '', scoring: '示例判定', version: '学情演示' },
  { id: 'report:product', stem: '求 20 的 ⅗ 是多少。', answer: '12', wrong: '', scoring: '示例判定', version: '学情演示' },
  { id: 'report:remainder', stem: '一桶水有 24 升，用去它的 ⅜，还剩多少升？', answer: '15 升', wrong: '', scoring: '示例判定', version: '学情演示' },
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
        wrong.forEach(qIndex => attempts.push({ id: `${correction.id}:q${qIndex}`, activityId: correction.id, studentId: item.studentId, classId: row.id, subject: item.subject, questionId: `${row.grade}:${item.subject}:q${qIndex}`, knowledge: knowledgeFor(row, item.subject), correct: index % 2 === 0, kind: '订正', originalAttemptId: `${practice.id}:q${qIndex}` }));
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

// The report preview uses linked examples without changing the original school dashboard fixtures.
const reportActivities: LearningActivity[] = [];
const reportAttempts: LearningAttempt[] = [];
const reportPupils = DEMO_STUDENTS.filter(student => student.classId === 'c1');
reportPupils.forEach((student, index) => {
  const context = { studentId: student.id, classId: student.classId, subject: '数学' };
  const primary = student.id === GUARDIAN_STUDENT_ID;
  const afterId = `report:${student.id}:after`;
  const add = (id: string, feature: LearningFeature, title: string, day: number, start: string, minutes: number) =>
    reportActivities.push({ ...context, id, feature, title, day, start, minutes, status: '已完成' });
  if (index < 28) {
    const beforeId = `report:${student.id}:before`;
    const correct = index >= 14;
    add(beforeId, '自主练习', '分数应用题 · 第一次检查', 4, '16:40', 4);
    reportAttempts.push({ ...context, id: beforeId, activityId: beforeId, questionId: 'report:before', knowledge: '找整体', kind: '首次', correct,
      answerText: correct ? '整体是原有的米，25 × ⅗' : '整体是剩下的米，25 ÷ ⅗',
      check: { key: 'fraction-whole', stage: 'before', label: '找整体', correct } });
  }
  if (index === 29) return;
  const foundWhole = !(index >= 8 && index < 17 || index === 28);
  add(afterId, '自主练习', '分数乘法应用题', 0, '16:40', 8);
  reportAttempts.push({ ...context, id: afterId, activityId: afterId, questionId: 'report:after', knowledge: '找整体', kind: '首次', correct: foundWhole && !primary,
    answerText: foundWhole ? (primary ? '整体是原价，80 ÷ ¾' : '整体是原价，80 × ¾') : '整体是现价，80 ÷ ¾',
    check: { key: 'fraction-whole', stage: 'after', label: '找整体', description: '判断题目中的哪个量是整体', correct: foundWhole } });
  if (!primary) return;
  add(`report:${student.id}:video`, '同步微课', '分数应用题讲解', 0, '17:10', 5);
  const productId = `${afterId}:product`;
  reportAttempts.push(
    { ...context, id: productId, activityId: afterId, questionId: 'report:product', knowledge: '分数乘法', kind: '首次', correct: false, answerText: '60' },
    { ...context, id: `${afterId}:remainder`, activityId: afterId, questionId: 'report:remainder', knowledge: '找整体', kind: '首次', correct: false, answerText: '整体是用去的水，算得 9 升', check: { key: 'fraction-whole', label: '找整体', description: '判断题目中的哪个量是整体', correct: false } },
  );
  const correctionId = `report:${student.id}:correction`;
  add(correctionId, '错题订正', '分数乘法练习订正', 0, '17:20', 3);
  reportAttempts.push({ ...context, id: correctionId, activityId: correctionId, questionId: 'report:product', knowledge: '分数乘法', kind: '订正', correct: true, answerText: '12', originalAttemptId: productId });
});
const activityKey = (row: LearningActivity) => `${row.studentId}:${row.subject}:${row.day}:${row.feature}`;
const reportActivityKeys = new Set(reportActivities.map(activityKey));

export function queryLearning(period: LearningPeriod, classId: string = 'all', subject: string = 'all', studentId: string = 'all', includeReportExamples = false) {
  const days = period === '1d' ? 1 : period === '7d' ? 7 : period === '14d' ? 14 : 30;
  const inScope = (row: { classId: string; studentId: string; subject?: string; day?: number }) => (classId === 'all' || row.classId === classId) && (studentId === 'all' || row.studentId === studentId) && (row.day === undefined || row.day < days) && (subject === 'all' || row.subject === subject);
  const roster = DEMO_STUDENTS.filter(student => (classId === 'all' || student.classId === classId) && (studentId === 'all' || student.id === studentId));
  const source = includeReportExamples ? [...activities.filter(row => !reportActivityKeys.has(activityKey(row))), ...reportActivities] : activities;
  const learning = source.filter(inScope);
  const activityIds = new Set(learning.map(row => row.id));
  const operations = usage.filter(inScope);
  const answers = (includeReportExamples ? [...attempts, ...reportAttempts] : attempts).filter(row => activityIds.has(row.activityId));
  const solveRequests = solves.filter(row => activityIds.has(row.activityId));
  return { roster, activities: learning, operations, answers, solveRequests, usedIds: new Set([...operations, ...learning].map(row => row.studentId)), learnedIds: new Set(learning.map(row => row.studentId)), minutes: learning.reduce((sum, row) => sum + row.minutes, 0) };
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
    const question = row.question || getLearningQuestion(row.questionId);
    return { id: row.id, kind: row.kind, stem: question?.stem || '原题暂缺', answer: row.answerText || '原始作答暂缺', correct: row.correct, result: row.correct ? '正确' : '错误', reference: question?.answer || '暂无参考答案', scoring: question?.scoring || '判分方式暂缺', version: question?.version || '来源暂缺' };
  }) };
}

export type LearningReport = ReturnType<typeof queryLearning> & { pendingAnswers?: LearningAttempt[] };
export function reportParticipation(data: Pick<LearningReport, 'roster' | 'learnedIds' | 'answers'>) {
  const first = data.answers.filter(row => row.kind === '首次');
  return {
    enrolled: data.roster.length,
    learned: data.learnedIds.size,
    answered: new Set(first.map(row => row.studentId)).size,
    firstAttempts: first.length,
  };
}
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

export const learningReportDays = Array.from({ length: 30 }, (_, day) => reportDate(day));

export function reportAttemptEvidence(row: LearningAttempt, activity: LearningActivity) {
  const question = getLearningQuestion(row.questionId);
  return {
    id: row.id, activityId: row.activityId, questionId: row.questionId,
    subject: row.subject, knowledge: row.knowledge, date: reportDate(activity.day),
    time: activity.start, title: activity.title, stem: question?.stem || '原题暂缺',
    answer: row.answerText || '原始作答暂缺', reference: question?.answer || '参考答案暂缺',
    result: row.correct ? '整题答对' : '整题答错',
    step: row.check ? `${row.check.label}${row.check.correct ? '正确' : '有误'}` : '',
  };
}

export function reportMistakes(data: LearningReport, day: number) {
  const byActivity = new Map(data.activities.map(row => [row.id, row]));
  const corrections = new Map<string, LearningAttempt>();
  const rows = [...data.answers].sort((a, b) => {
    const left = byActivity.get(a.activityId), right = byActivity.get(b.activityId);
    return (left?.day ?? 0) - (right?.day ?? 0) || (right?.start || '').localeCompare(left?.start || '');
  });
  for (const row of rows) {
    if (row.kind === '订正' && row.originalAttemptId && !corrections.has(row.originalAttemptId)) {
      corrections.set(row.originalAttemptId, row);
    }
  }
  const used = new Set<string>();
  return rows.flatMap(row => {
    const activity = byActivity.get(row.activityId);
    const key = `${row.studentId}:${row.questionId}`;
    if (!activity || activity.day !== day || row.kind !== '首次' || row.correct || used.has(key)) return [];
    used.add(key);
    const correction = corrections.get(row.id);
    const correctionActivity = correction && byActivity.get(correction.activityId);
    const linked = correction && correctionActivity && correction.studentId === row.studentId && correction.questionId === row.questionId;
    return [{ ...reportAttemptEvidence(row, activity), correction: linked ? reportAttemptEvidence(correction, correctionActivity) : null }];
  });
}

export function reportSubjects(data: LearningReport) {
  return subjectRows(data).map(subject => {
    const first = data.answers.filter(row => row.subject === subject.subject && row.kind === '首次');
    const corrections = data.answers.filter(row => row.subject === subject.subject && row.kind === '订正');
    return {
      ...subject, first: first.length, firstCorrect: first.filter(row => row.correct).length,
      corrections: corrections.length, correctionCorrect: corrections.filter(row => row.correct).length,
      contents: [...new Set(data.activities.filter(row => row.subject === subject.subject).map(row => row.title))].slice(0, 3).join('、'),
    };
  });
}

export function reportDayIssues(data: LearningReport, day: number, basis: 'step' | 'question' = 'step') {
  const today = learningOnDay(data, day);
  const roster = new Map(today.roster.map(row => [row.id, row.name]));
  const activities = new Map(today.activities.map(row => [row.id, row]));
  const groups = new Map<string, Map<string, LearningAttempt>>();
  for (const row of today.answers) {
    if (row.kind !== '首次' || !roster.has(row.studentId)) continue;
    const key = `${row.classId}:${row.subject}:${row.questionId}`;
    const group = groups.get(key) ?? new Map<string, LearningAttempt>();
    if (!group.has(row.studentId)) group.set(row.studentId, row);
    groups.set(key, group);
  }
  const results = [...groups.values()].flatMap(group => {
    const first = [...group.values()];
    const question = first[0];
    const activity = activities.get(question.activityId);
    if (!activity) return [];
    const checks = first.flatMap(row => row.check ? [row.check] : []);
    const check = checks[0];
    const hasStep = Boolean(check && checks.every(item => item.key === check.key && item.stage === check.stage));
    const judged = hasStep ? first.filter(row => row.check) : first;
    const mistakes = judged.filter(row => hasStep ? row.check?.correct === false : !row.correct);
    const toEvidence = (rows: LearningAttempt[]) => rows.flatMap(row => {
      const record = activities.get(row.activityId);
      return record ? [{ ...reportAttemptEvidence(row, record), studentId: row.studentId, name: roster.get(row.studentId) || '学生' }] : [];
    });
    const evidence = toEvidence(mistakes);
    const wholeWrong = first.filter(row => !row.correct);
    if (!(basis === 'question' ? wholeWrong.length : mistakes.length)) return [];
    const groups = hasStep ? [
      { label: check.label + '有误', rows: wholeWrong.filter(row => row.check?.correct === false) },
      { label: check.label + '正确，整题答错', rows: wholeWrong.filter(row => row.check?.correct === true) },
      { label: '暂无步骤判定，整题答错', rows: wholeWrong.filter(row => !row.check) },
      { label: check.label + '有误，整题答对', rows: mistakes.filter(row => row.correct) },
    ] : [{ label: '整题答错', rows: wholeWrong }];
    const answerGroups = groups.filter(group => group.rows.length).map(group => ({
      label: group.label, students: toEvidence(group.rows),
    }));
    return [{
      ...reportAttemptEvidence(question, activity), day,
      checkType: hasStep ? 'step' as const : 'question' as const,
      checkLabel: hasStep ? '步骤判定' : '整题判定',
      checkName: hasStep ? check.description || check.label : '本题作答是否正确',
      finding: hasStep ? '该项有误' : '首次答错本题',
      answered: first.length, judged: judged.length, wrong: evidence.length,
      students: basis === 'question' ? toEvidence(wholeWrong) : evidence,
      wholeWrong: wholeWrong.length, answerGroups,
      representative: evidence.find(row => row.answer !== '原始作答暂缺') ?? null,
    }];
  });
  results.sort((a, b) => b.wrong - a.wrong || b.answered - a.answered);
  return results;
}

export function reportPracticeDays(data: LearningReport) {
  const firstActivityIds = new Set(data.answers.filter(row => row.kind === '首次').map(row => row.activityId));
  return [...new Set(data.activities.filter(row => firstActivityIds.has(row.id)).map(row => row.day))].sort((a, b) => a - b);
}

export function reportIssueGroups(issues: ReturnType<typeof reportDayIssues>) {
  type Group = { name: string; knowledge: string; issues: typeof issues; people: Set<string>; questionIds: Set<string> };
  const groups = new Map<string, Group>();
  for (const issue of issues) {
    const key = issue.subject + ':' + issue.knowledge;
    const group = groups.get(key) ?? { name: issue.subject + ' · ' + issue.knowledge, knowledge: issue.knowledge, issues: [], people: new Set<string>(), questionIds: new Set<string>() };
    group.issues.push(issue);
    group.questionIds.add(issue.questionId);
    for (const student of issue.students) group.people.add(student.studentId);
    groups.set(key, group);
  }
  return [...groups.values()].map(group => ({ ...group, questionCount: group.questionIds.size }))
    .sort((a, b) => b.people.size - a.people.size || b.questionCount - a.questionCount);
}

export function rankReportQuestions(issues: ReturnType<typeof reportDayIssues>) {
  return [...issues].sort((a, b) => b.wholeWrong - a.wholeWrong || b.answered - a.answered);
}

export function reportDayFocus(data: LearningReport, day: number) {
  return reportDayIssues(data, day)[0] ?? null;
}

export function reportWeeklyComparison(data: LearningReport) {
  const roster = new Map(data.roster.map(row => [row.id, row.name]));
  const activities = new Map(data.activities.filter(row => row.day >= 0 && row.day < 7).map(row => [row.id, row]));
  type CheckRow = LearningAttempt & { check: NonNullable<LearningAttempt['check']> };
  const groups = new Map<string, { before: Map<string, CheckRow>; after: Map<string, CheckRow>; ambiguous: Set<string> }>();
  for (const row of data.answers) {
    if (!row.check?.stage || row.kind !== '首次' || !activities.has(row.activityId) || !roster.has(row.studentId)) continue;
    const key = `${row.classId}:${row.subject}:${row.check.key}`;
    const group = groups.get(key) ?? { before: new Map(), after: new Map(), ambiguous: new Set<string>() };
    const stage = group[row.check.stage];
    if (stage.has(row.studentId) && stage.get(row.studentId)?.id !== row.id) group.ambiguous.add(row.studentId);
    stage.set(row.studentId, { ...row, check: row.check });
    groups.set(key, group);
  }
  // A cohort comparison must use the same two checks, not merely the same knowledge tag.
  const cohorts = new Map<string, {
    label: string; beforeDay: number; afterDay: number;
    pairs: Array<{ studentId: string; name: string; before: ReturnType<typeof reportAttemptEvidence>; after: ReturnType<typeof reportAttemptEvidence>; beforeCorrect: boolean; afterCorrect: boolean }>;
  }>();
  for (const [groupKey, group] of groups) {
    for (const [studentId, before] of group.before) {
      const after = group.after.get(studentId);
      if (!after || group.ambiguous.has(studentId) || before.questionId === after.questionId || before.check.label !== after.check.label) continue;
      const previous = activities.get(before.activityId)!;
      const latest = activities.get(after.activityId)!;
      if (previous.day <= latest.day) continue;
      const key = JSON.stringify([groupKey, before.questionId, after.questionId, previous.day, latest.day]);
      const cohort = cohorts.get(key) ?? { label: before.check.label, beforeDay: previous.day, afterDay: latest.day, pairs: [] };
      cohort.pairs.push({
        studentId, name: roster.get(studentId) || '学生',
        before: reportAttemptEvidence(before, previous), after: reportAttemptEvidence(after, latest),
        beforeCorrect: before.check.correct, afterCorrect: after.check.correct,
      });
      cohorts.set(key, cohort);
    }
  }
  const cohort = [...cohorts.values()].sort((a, b) => b.pairs.length - a.pairs.length || a.afterDay - b.afterDay)[0];
  if (!cohort) return null;
  const { label, beforeDay, afterDay, pairs } = cohort;
  return {
    label, beforeDate: reportDate(beforeDay), afterDate: reportDate(afterDay), size: pairs.length, pairs,
    beforeWrong: pairs.filter(row => !row.beforeCorrect).length, afterWrong: pairs.filter(row => !row.afterCorrect).length,
    improved: pairs.filter(row => !row.beforeCorrect && row.afterCorrect).length,
    newlyWrong: pairs.filter(row => row.beforeCorrect && !row.afterCorrect).length,
    repeated: pairs.filter(row => !row.beforeCorrect && !row.afterCorrect),
  };
}

const MATERIAL_SOURCES = {
  "w1": {
    "name": "数学周末练习",
    "date": "2026-10-12",
    "kind": "上传资料",
    "icon": "▤"
  },
  "p1": {
    "name": "有理数与方程巩固练习",
    "date": "2026-09-26",
    "kind": "自主练习",
    "icon": "▧"
  },
  "w2": {
    "name": "数学课堂巩固练习",
    "date": "2026-10-08",
    "kind": "上传资料",
    "icon": "▤"
  }
};
const MATERIAL_QUESTION_SEEDS = [
  {
    "id": "k1",
    "source": "w1",
    "num": 1,
    "knowledge": "找整体",
    "stem": "一件衣服原价80元，现价是原价的¾。现价是多少元？",
    "answer": "60元",
    "wrong": [
      0,
      1,
      2,
      3,
      4,
      9,
      12,
      13,
      14,
      15,
      16
    ],
    "valid": 29,
    "page": 1,
    "date": "2026-10-12"
  },
  {
    "id": "k2",
    "source": "w1",
    "num": 2,
    "knowledge": "分数乘法",
    "stem": "求20的⅗是多少。",
    "answer": "12",
    "wrong": [
      3,
      4
    ],
    "valid": 29,
    "page": 1,
    "date": "2026-10-12"
  },
  {
    "id": "k3",
    "source": "w1",
    "num": 3,
    "knowledge": "异分母分数加减法",
    "stem": "计算：½＋¼。",
    "answer": "¾",
    "wrong": [
      5,
      6,
      7,
      8
    ],
    "valid": 28,
    "page": 1,
    "date": "2026-10-12"
  },
  {
    "id": "u2",
    "source": "w1",
    "num": 4,
    "knowledge": "",
    "stem": "一个长方形花坛长12米，宽比长的½多2米。它的面积是多少平方米？",
    "answer": "96平方米",
    "wrong": [
      7,
      8,
      9,
      10
    ],
    "valid": 27,
    "page": 2,
    "date": "2026-10-12"
  },
  {
    "id": "u1",
    "source": "w1",
    "num": 5,
    "knowledge": "",
    "stem": "一根绳子长24米，第一次用去全长的⅓，第二次用去剩下的¼。还剩多少米？",
    "answer": "12米",
    "wrong": [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8
    ],
    "valid": 28,
    "page": 2,
    "date": "2026-10-12"
  },
  {
    "id": "k4",
    "source": "p1",
    "num": 1,
    "knowledge": "有理数混合运算",
    "stem": "计算：－8＋3×（－2）。",
    "answer": "－14",
    "wrong": [
      1,
      6,
      12,
      13,
      20
    ],
    "valid": 29,
    "page": 1,
    "date": "2026-09-26"
  },
  {
    "id": "k5",
    "source": "p1",
    "num": 2,
    "knowledge": "有理数混合运算",
    "stem": "计算：（－12）÷3＋5。",
    "answer": "1",
    "wrong": [
      6,
      12,
      21
    ],
    "valid": 29,
    "page": 1,
    "date": "2026-09-26"
  },
  {
    "id": "k6",
    "source": "p1",
    "num": 3,
    "knowledge": "一元一次方程",
    "stem": "解方程：3x＋5＝20。",
    "answer": "x＝5",
    "wrong": [],
    "valid": 29,
    "page": 1,
    "date": "2026-09-26"
  },
  {
    "id": "k7",
    "source": "w2",
    "num": 1,
    "knowledge": "找整体",
    "stem": "一桶水有24升，用去它的⅜，还剩多少升？",
    "answer": "15升",
    "wrong": [
      0,
      2,
      7,
      10,
      17
    ],
    "valid": 29,
    "page": 1,
    "date": "2026-10-08"
  },
  {
    "id": "u3",
    "source": "w2",
    "num": 2,
    "knowledge": "",
    "stem": "一本书有120页，第一天读了全书的¼，第二天读了余下的⅓。还剩多少页？",
    "answer": "60页",
    "wrong": [
      10,
      11
    ],
    "valid": 29,
    "page": 1,
    "date": "2026-10-08"
  }
];

// Isolated subject-teacher demo: uploaded material identity is independent of knowledge classification.
// Called only after role/class/subject/student authorization. Other roles retain queryLearning's records.
export function withSubjectMaterialData(base: LearningReport, subject: string, period: LearningPeriod): LearningReport {
  if (subject !== '数学' || !base.roster.some(s => s.classId === 'c1')) return base;
  const days = { '1d': 1, '7d': 7, '14d': 14, '30d': 30 }[period];
  const students = DEMO_STUDENTS.filter(s => s.classId === 'c1');
  const allowed = new Set(base.roster.filter(s => s.classId === 'c1').map(s => s.id));
  const retained = base.activities.filter(a => !(a.classId === 'c1' && a.subject === '数学'));
  const retainedIds = new Set(retained.map(a => a.id));
  const events: LearningActivity[] = [], answers: LearningAttempt[] = [], pending: LearningAttempt[] = [];
  for (const seed of MATERIAL_QUESTION_SEEDS) {
    const day = learningReportDays.indexOf(seed.date); if (day < 0 || day >= days) continue;
    const info = MATERIAL_SOURCES[seed.source as keyof typeof MATERIAL_SOURCES];
    const question: LearningQuestion = { id: 'material:' + seed.id, stem: seed.stem, answer: seed.answer, wrong: '', scoring: '演示判定', version: '资料版本1', source: { id: seed.source, name: info.name, date: info.date, kind: info.kind, number: seed.num, page: seed.page, version: 1 } };
    students.forEach((student, index) => {
      if (!allowed.has(student.id)) return;
      const id = question.id + ':' + student.id + ':original';
      const isWrong = seed.wrong.includes(index), known = index < seed.valid;
      const context = { studentId: student.id, classId: 'c1', subject: '数学' };
      events.push({ ...context, id, feature: info.kind === '上传资料' ? '作业练习' : '自主练习', title: info.name + ' · 第' + seed.num + '题', day, start: '16:00', minutes: 2, status: '已完成' });
      const attempt: LearningAttempt = { ...context, id, activityId: id, questionId: question.id, knowledge: seed.knowledge, kind: '首次', correct: !isWrong, answerText: !known ? '原始作答内容暂缺' : isWrong ? (seed.id === 'u1' ? '24 × (1－⅓－¼) = 10米' : '原始作答内容暂缺') : seed.answer, question };
      (known ? answers : pending).push(attempt);
      if (known && seed.id === 'u1' && index < 6) {
        const correctionId = id + ':correction', correct = ![2, 3].includes(index);
        events.push({ ...context, id: correctionId, feature: '错题订正', title: info.name + ' · 第5题订正', day, start: '17:20', minutes: 2, status: '已完成' });
        answers.push({ ...attempt, id: correctionId, activityId: correctionId, kind: '订正', correct, originalAttemptId: id, answerText: correct ? '24 × (1－⅓) × (1－¼) = 12米' : '24－8－6 = 10米' });
      }
    });
  }
  const activities = [...retained, ...events];
  const operations = base.operations.filter(a => !(a.classId === 'c1' && a.subject === '数学'));
  return { ...base, activities, operations, answers: [...base.answers.filter(a => retainedIds.has(a.activityId)), ...answers],
    pendingAnswers: [...(base.pendingAnswers || []).filter(a => retainedIds.has(a.activityId)), ...pending],
    solveRequests: base.solveRequests.filter(a => retainedIds.has(a.activityId)), usedIds: new Set([...operations, ...activities].map(a => a.studentId)), learnedIds: new Set(activities.map(a => a.studentId)), minutes: activities.reduce((n, a) => n + a.minutes, 0) };
}

export function subjectMaterialQuestions(report: LearningReport) {
  const questions = subjectAnswerQuestions(report);
  const activities = new Map(report.activities.map(a => [a.id, a]));
  const pending = (report.pendingAnswers || []).filter(a => activities.has(a.activityId) && report.roster.some(s => s.id === a.studentId));
  const ids = [...new Set([...questions.map(q => q.id), ...pending.map(a => a.questionId)])];
  return ids.map(id => {
    const raw = questions.find(q => q.id === id), sample = pending.find(a => a.questionId === id);
    const q = raw || { id, knowledge: sample?.knowledge || '', stem: sample?.question?.stem || '原题暂缺', reference: sample?.question?.answer || '参考答案暂缺', source: sample?.question?.source, people: 0, wrongPeople: 0, days: 0, attempts: 0, correctAttempts: 0, students: [] as ReturnType<typeof subjectAnswerQuestions>[number]['students'] };
    const source = q.source || { id: 'legacy:' + (report.answers.find(a => a.questionId === id)?.subject || '') + ':' + (q.students[0]?.date || ''), name: '自主练习', kind: '自主练习', date: q.students[0]?.date || '', number: 0, page: 0, version: 1 };
    const allStudents = report.roster.flatMap(student => {
      const valid = q.students.find(s => s.id === student.id);
      const records = pending.filter(a => a.questionId === id && a.studentId === student.id).map(a => ({ id: a.id, answer: a.answerText || '原始作答内容暂缺', date: learningReportDays[activities.get(a.activityId)!.day], time: activities.get(a.activityId)!.start }));
      if (!valid && !records.length) return [];
      return [{ ...(valid || { id: student.id, name: student.name, chains: [], wrong: false, status: 'pending', statusLabel: '待复核', date: records[0].date, hasCorrection: false }), pendingAttempts: records }];
    });
    return { ...q, source, allStudents, pendingPeople: allStudents.filter(s => s.pendingAttempts.length).length, pendingAttempts: pending.filter(a => a.questionId === id).length,
      correctedPeople: q.students.filter(s => s.wrong && s.hasCorrection).length, correctPeople: q.students.filter(s => !s.wrong).length,
      title: source.number ? '第' + source.number + '题' + (source.page > 1 ? ' · 第' + source.page + '页' : '') : q.knowledge || '练习题目' };
  }).sort((a, b) => b.wrongPeople - a.wrongPeople || a.id.localeCompare(b.id));
}
export type MaterialQuestion = ReturnType<typeof subjectMaterialQuestions>[number];
export function subjectMaterialStats(questions: MaterialQuestion[]) {
  const valid = questions.filter(q => q.people > 0);
  return { questions: valid.length, totalQuestions: questions.length, people: new Set(valid.flatMap(q => q.students.map(s => s.id))).size,
    bad: new Set(valid.flatMap(q => q.students.filter(s => s.wrong).map(s => s.id))).size,
    wrongQuestions: valid.filter(q => q.wrongPeople > 0).length, attempts: valid.reduce((n, q) => n + q.attempts, 0), correct: valid.reduce((n, q) => n + q.correctAttempts, 0),
    wrongAttempts: valid.reduce((n, q) => n + q.attempts - q.correctAttempts, 0), linked: valid.filter(q => !!q.knowledge).length, pending: questions.reduce((n, q) => n + q.pendingAttempts, 0) };
}
export function subjectMaterialView(report: LearningReport, days: number, selection: { sourceId?: string; unknown?: boolean; knowledge?: string; onlyWrong?: boolean } = {}) {
  const questions = subjectMaterialQuestions(subjectAnswerRange(report, days));
  const stats = subjectMaterialStats(questions);
  const matches = questions.filter(q => (!selection.sourceId || q.source.id === selection.sourceId) && (!selection.unknown || !q.knowledge) && (!selection.knowledge || q.knowledge === selection.knowledge));
  const visible = matches.filter(q => !selection.onlyWrong || q.wrongPeople > 0);
  const sources = [...new Set(visible.map(q => q.source.id))].map(id => { const rows = visible.filter(q => q.source.id === id);return { ...rows[0].source, questions: rows, stats: subjectMaterialStats(rows) }; }).sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const groups = [...new Set(questions.filter(q => q.people && q.knowledge).map(q => q.knowledge))].map(name => { const rows = questions.filter(q => q.knowledge === name);return { name, questions: rows, stats: subjectMaterialStats(rows) }; });
  const unknown = questions.filter(q => !q.knowledge && q.people);
  return { questions, stats, sources, groups, unknown, unknownStats: subjectMaterialStats(unknown), matches, visible, selectionStats: subjectMaterialStats(matches), enrolled: report.roster.length };
}
