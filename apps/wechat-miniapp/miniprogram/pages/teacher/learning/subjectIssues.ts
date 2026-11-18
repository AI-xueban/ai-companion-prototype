import { subjectMaterialView, subjectMaterialStats, learningReportDays, reportDayIssues as dayIssues, reportIssueGroups, reportPracticeDays, reportParticipation, rankReportQuestions, reportWeeklyComparison, subjectAnswerRange, subjectAnswerQuestions } from '../../../services/learningMock';
import type { LearningReport } from '../../../services/learningMock';

const reportDayIssues = (report: LearningReport, day: number) => dayIssues(report, day, 'question');
type Issue = ReturnType<typeof reportDayIssues>[number];
type Evidence = Issue['students'][number];
export type SubjectRoute =
  | { kind: 'history'; days: number }
  | { kind: 'review'; days: number; mode?: 'source' | 'knowledge' }
  | { kind: 'material-list'; days: number; sourceId?: string; unknown?: boolean; unknownFromMistakes?: boolean; knowledge?: string; onlyWrong?: boolean }
  | { kind: 'recent'; days: number }
  | { kind: 'review-followup' }
  | { kind: 'review-student'; studentId: string }
  | { kind: 'day'; day: number; byQuestion: boolean }
  | { kind: 'group'; knowledge: string; day?: number; days?: number; all?: boolean }
  | { kind: 'problem'; questionId: string; days: number; day?: number; all?: boolean }
  | { kind: 'question'; id: string; day: number }
  | { kind: 'affected'; id: string; day: number; group: number }
  | { kind: 'answer'; id: string; day: number; group: number; studentId: string };

type Link = { id: string; label: string; detail: string; route: SubjectRoute; featured?: boolean; sample?: string; count?: string };
type SubjectPage = {
  material?: NonNullable<ReturnType<typeof materialPage>>['material'];
  title: string;
  problem?: ReturnType<typeof subjectAnswerQuestions>[number];
  stage?: { people: number; enrolled: number; questions: number; attempts: number; correct: number };
  summary?: string;
  date: string;
  empty?: string;
  links?: Link[];
  issue?: Issue;
  dateOptions?: { label: string; day: number }[];
  dateIndex?: number;
  comparison?: { label: string; size: number; beforeDate: string; beforeWrong: number; afterDate: string; afterWrong: number; repeated: number };
  comparisonAnswer?: { name: string; answers: ReturnType<typeof import('../../../services/learningMock').reportAttemptEvidence>[] };
  student?: Evidence;
  corrections?: { id: string; answer: string; result: string; date: string; time: string }[];
};

const range = (days: number) => days === 1 ? learningReportDays[0] : learningReportDays[days - 1] + ' 至 ' + learningReportDays[0];
export const historyDays = [1, 7, 14, 30];

const groupLinks = (issues: Issue[], scope: { day?: number; days?: number }): Link[] =>
  reportIssueGroups(issues).map(group => ({
    id: group.knowledge,
    label: group.knowledge,
    detail: group.questionCount + ' 道题 · ' + group.people.size + ' 人有误',
    route: { kind: 'group', knowledge: group.knowledge, ...scope },
  }));

function questionLinks(issues: Issue[], showDate: boolean, highlightFirst = false): Link[] {
  const ordered = highlightFirst ? rankReportQuestions(issues) : issues;
  return ordered.map((issue, index) => ({
    id: issue.id,
    label: issue.stem,
    detail: [showDate ? issue.date : '', issue.answered + ' 人首答', issue.wholeWrong + ' 人整题答错'].filter(Boolean).join(' · '),
    featured: highlightFirst && index === 0 && issue.wholeWrong > 0,
    route: { kind: 'question', id: issue.id, day: issue.day },
  }));
}

export function subjectLearningHome(report: LearningReport, days: 1 | 7) {
  const material = subjectMaterialView(report, days);
  const known = material.groups.filter(g=>g.stats.bad).slice(0,5);
  const unknownWrong = subjectMaterialStats(material.unknown.filter(q=>q.wrongPeople));
  const issues = Array.from({ length: days }, (_, day) => reportDayIssues(report, day)).flat();
  const first = report.answers.filter(row => row.kind === '首次');
  return {
    material, unknownWrong, unknownRoute: { kind:'material-list',days,unknown:true,unknownFromMistakes:true,onlyWrong:true } as SubjectRoute,
    known: known.map(g=>{const n=subjectMaterialStats(g.questions.filter(q=>q.wrongPeople));return {name:g.name,stats:n,route:{kind:'material-list',days,knowledge:g.name,onlyWrong:true} as SubjectRoute};}),
    date: range(days),
    participation: reportParticipation(report),
    links: reportIssueGroups(issues).slice(0, 5).map(group => ({
      id: group.knowledge, label: group.knowledge,
      detail: '查看错题',
      meta: new Set(first.filter(row => row.knowledge === group.knowledge).map(row => row.studentId)).size + ' 人练过 · ' + group.questionCount + ' 道题有误 · ' + group.people.size + ' 人首答有误',
      route: { kind: 'group', knowledge: group.knowledge, days } as SubjectRoute,
    })),
    empty: first.length ? '所选区间暂无首次答错的题目' : '所选区间暂无首次作答记录',
    history: { kind: 'recent', days } as SubjectRoute,
    review: { kind: 'review', days } as SubjectRoute,
  };
}

export function subjectLearningPage(report: LearningReport, route: SubjectRoute): SubjectPage | null {
  const modern = materialPage(report, route); if (modern) return modern;
  if (route.kind === 'history') return {
    title: '班级错题', date: range(route.days), empty: '暂无首次作答记录',
    links: reportPracticeDays(report).filter(day => day < route.days).map(day => {
      const count = reportDayIssues(report, day).length;
      return { id: String(day), label: learningReportDays[day], detail: count ? count + ' 道题有误' : '暂无有误题目', route: { kind: 'day', day, byQuestion: false } };
    }),
  };
  if (route.kind === 'day') {
    const issues = reportDayIssues(report, route.day);
    const dateOptions = reportPracticeDays(report).map(day => ({ label: learningReportDays[day], day }));
    return {
      dateOptions, dateIndex: dateOptions.findIndex(item => item.day === route.day),
      title: '当天错题与知识点', date: learningReportDays[route.day], empty: '该日期暂无错题记录',
      links: route.byQuestion ? questionLinks(issues, false) : groupLinks(issues, { day: route.day }),
    };
  }
  if (route.kind === 'problem') {
    const scoped = subjectAnswerRange(report, route.days, route.day);
    const problem = subjectAnswerQuestions(scoped).find(q => q.id === route.questionId);
    if (!problem) return null;
    return { title: '原题与学生作答', date: route.day === undefined ? range(route.days) : learningReportDays[route.day],
      problem: { ...problem, students: problem.students.filter(row => route.all || row.wrong) } };
  }
  if (route.kind === 'review' || route.kind === 'recent' || route.kind === 'group') {
    const day = route.kind === 'group' ? route.day : undefined, days = route.days ?? 30;
    const scoped = subjectAnswerRange(report, days, day);
    const all = route.kind === 'review' || (route.kind === 'group' && route.all);
    const questions = subjectAnswerQuestions(scoped).filter(q => all || q.wrongPeople);
    if (route.kind === 'group') {
      const list = questions.filter(q => q.knowledge === route.knowledge);
      const people = new Set(list.flatMap(q => q.students.filter(s => s.wrong).map(s => s.id))).size;
      return { title: route.knowledge, date: day === undefined ? range(days) : learningReportDays[day],
        summary: list.length + (all ? ' 道题 · ' : ' 道题有误 · ') + people + ' 人答错', empty: '所选区间暂无题目',
        links: list.map(q => ({ id: q.id, label: q.stem, detail: q.people + ' 人作答 · ' + q.wrongPeople + ' 人答错 · 涉及 ' + q.days + ' 个作答日', count: '查看作答', route: { kind: 'problem', questionId: q.id, days, day, all: !!all } })) };
    }
    const first = scoped.answers.filter(row => row.kind === '首次');
    return { title: all ? '知识点回顾' : '班级错题', date: range(days), empty: '所选区间暂无' + (all ? '作答' : '错题') + '记录',
      stage: all ? { people: new Set(first.map(r => r.studentId)).size, enrolled: report.roster.length, questions: questions.length, attempts: first.length, correct: first.filter(r => r.correct).length } : undefined,
      links: [...new Set(questions.map(q => q.knowledge))].map(knowledge => {
        const list = questions.filter(q => q.knowledge === knowledge);
        return { id: knowledge, label: knowledge,
          detail: new Set(list.flatMap(q => q.students.map(s => s.id))).size + ' 人练过 · ' + list.length + ' 道题 · ' + new Set(list.flatMap(q => q.students.filter(s => s.wrong).map(s => s.id))).size + ' 人答错',
          sample: all ? '答对 ' + list.reduce((n,q) => n+q.correctAttempts,0) + ' / ' + list.reduce((n,q) => n+q.attempts,0) + ' 题次' : undefined,
          count: all ? '查看题目' : '查看错题', route: { kind: 'group', knowledge, days, all: !!all } };
      }) };
  }
  if (route.kind === 'review-followup' || route.kind === 'review-student') {
    const week = reportWeeklyComparison(report);
    if (!week) return null;
    const date = week.beforeDate + ' 至 ' + week.afterDate;
    if (route.kind === 'review-followup') return {
      title: '两次都有误的学生', date, empty: '暂无两次都有误的学生',
      links: week.repeated.map(pair => ({
        id: pair.studentId, label: pair.name, detail: pair.before.step + ' · ' + pair.after.step,
        route: { kind: 'review-student', studentId: pair.studentId },
      })),
    };
    const pair = week.repeated.find(item => item.studentId === route.studentId);
    return pair ? {
      title: '学生两次作答', date, comparisonAnswer: { name: pair.name, answers: [pair.before, pair.after] },
    } : null;
  }
  if (!('id' in route)) return null;
  const issue = reportDayIssues(report, route.day).find(item => item.id === route.id);
  if (!issue) return null;
  if (route.kind === 'question') return {
    title: '本题详情', date: issue.date, issue,
    links: issue.answerGroups.map((group, index) => ({
      id: String(index), label: group.label, detail: '', count: group.students.length + ' 人',
      sample: group.students.find(student => student.answer !== '原始作答暂缺')?.answer,
      route: { ...route, kind: 'affected', group: index },
    })),
  };
  const group = issue.answerGroups[route.group];
  if (!group) return null;
  if (route.kind === 'affected') return {
    title: group.label + ' · ' + group.students.length + ' 人', date: issue.date, issue,
    links: group.students.map(student => ({
      id: student.studentId, label: student.name, detail: [student.step, student.result].filter(Boolean).join(' · '),
      route: { ...route, kind: 'answer', studentId: student.studentId },
    })),
  };
  const student = group.students.find(item => item.studentId === route.studentId);
  if (!student) return null;
  const corrections = report.answers.filter(row => row.kind === '订正' && row.originalAttemptId === student.id && row.studentId === student.studentId && row.questionId === issue.questionId).flatMap(attempt => {
    const activity = report.activities.find(item => item.id === attempt.activityId);
    return activity ? [{ id: attempt.id, answer: attempt.answerText || '原始作答暂缺', result: attempt.correct ? '本次答对' : '本次仍错', date: learningReportDays[activity.day], time: activity.start }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  return { title: '学生本题作答', date: issue.date, issue, student, corrections };
}


function materialPage(report: LearningReport, route: SubjectRoute) {
  if (!['review','recent','group','material-list','problem'].includes(route.kind)) return null;
  const days = 'days' in route ? route.days ?? 30 : 30;
  const selection = route.kind === 'material-list' ? route : route.kind === 'group' ? { knowledge: route.knowledge, onlyWrong: !route.all } : { onlyWrong: route.kind === 'recent' };
  const view = subjectMaterialView(report, days, selection);
  const listRoute = (extra: object = {}) => ({ kind: 'material-list', days, ...extra } as SubjectRoute);
  const sources = view.sources.map(s => ({ ...s, route: listRoute({ sourceId: s.id }), questions: s.questions.map(q => ({ ...q, route: { kind: 'problem', days, questionId: q.id } as SubjectRoute })) }));
  const question = route.kind === 'problem' ? view.questions.find(q => q.id === route.questionId) : undefined;
  const mode = route.kind === 'review' ? route.mode || 'source' : 'source';
  const material = { ...view, sources, question, mode, kind: route.kind === 'review' ? 'stage' : route.kind === 'problem' ? 'question' : 'list',
    groups: view.groups.map(g => ({ ...g, route: listRoute({ knowledge: g.name }) })),
    unknown: 'unknown' in selection && !!selection.unknown, sourceId: 'sourceId' in selection ? selection.sourceId : '', onlyWrong: !!selection.onlyWrong,
    source: view.matches[0]?.source, unknownRoute: listRoute({ unknown: true }),
    allRoute: listRoute({ ...selection, onlyWrong: false }), wrongRoute: listRoute({ ...selection, onlyWrong: true }),
    resultOptions: question ? [{ key:'wrong',label:'答错',count:question.wrongPeople },{ key:'correct',label:'答对',count:question.correctPeople },{ key:'pending',label:'待复核',count:question.pendingPeople },{ key:'all',label:'全部',count:question.allStudents.length }] : [],
  };
  return { material, title: route.kind === 'review' ? '阶段回顾' : route.kind === 'problem' ? '题目与学生作答' : material.unknown ? ('unknownFromMistakes' in selection && selection.unknownFromMistakes ? '其他错题' : '其他题目') : 'knowledge' in selection && selection.knowledge ? selection.knowledge : route.kind === 'recent' ? '班级错题' : '作业题目', date: range(days) };
}
