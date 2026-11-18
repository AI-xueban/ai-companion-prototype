const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, filename);
const learning = require('../miniprogram/services/learningMock.ts');
const roster = require('../miniprogram/services/schoolDemoRoster.ts');
const { subjectLearningHome, subjectLearningPage } = require('../miniprogram/pages/teacher/learning/subjectIssues.ts');
const full = learning.queryLearning('7d', 'c1', '数学', 'all', true);
const today = learning.queryLearning('1d', 'c1', '数学', 'all', true);
assert(full.activities.some(row => row.day > 0));
assert(today.activities.every(row => row.day === 0));
assert(today.answers.every(row => today.activities.some(activity => activity.id === row.activityId)));
assert(today.answers.length < full.answers.length);
const home = subjectLearningHome(full, 7);
assert.deepEqual(home.participation, { enrolled: 30, learned: 29, answered: 29, firstAttempts: 73 });
assert.equal(home.links[0].detail, '查看错题');
assert.equal(home.links[0].meta, '29 人练过 · 3 道题有误 · 18 人首答有误');
assert.deepEqual(home.links[0].route, { kind: 'group', knowledge: '找整体', days: 7 });
const noToday = learning.learningOnDay({ ...full, activities: full.activities.filter(row => row.day > 0) }, 0);
assert.equal(subjectLearningHome(noToday, 1).links.length, 0);
assert.equal(subjectLearningHome(noToday, 1).participation.firstAttempts, 0);

let definition, session;
global.Page = config => { definition = config; };
global.wx = { getStorageSync: () => session, pageScrollTo() {}, reLaunch() {} };
require('../miniprogram/pages/teacher/learning/index.ts');
function native(assignments) {
  session = { expiresAt: Date.now() + 3600000, profile: { userId: 'scope-test', roles: ['teacher'], displayName: '测试老师', teachingAssignments: assignments } };
  const instance = { ...definition, data: structuredClone(definition.data), savedLearningScopes: {}, setData(data, callback) { Object.assign(this.data, data); callback?.(); } };
  instance.onShow();
  return instance;
}
const event = dataset => ({ currentTarget: { dataset } });
const assignments = [{ subject: '数学', classIds: ['c1', 'c2'] }, { subject: '英语', classIds: ['c1'] }];
const page = native(assignments);
assert.equal(page.data.classes.length, 2);
page.changeLearningSubject({ detail: { value: '1' } });
assert.equal(page.data.scope.learningSubject, '英语');
page.changeSubjectHomePeriod(event({ period: '1d' }));
page.selectSubjectClass('c2');
assert.equal(page.data.scope.learningSubject, '数学');
assert.deepEqual(page.data.subjectOptions, ['数学']);
assert.equal(page.data.scope.period, '1d');
page.changeLearningSubject({ detail: { value: '1' } });
assert.equal(page.data.scope.learningSubject, '数学');
page.selectSubjectClass('c1');
page.changeSubjectHomePeriod(event({ period: '7d' }));
assert.deepEqual(page.data.subjectHome.participation, {enrolled:30,learned:30,answered:29,firstAttempts:199});
page.showSubjectRoute(page.data.subjectHome.links[0].route);
assert.equal(page.data.subjectPage.title, '找整体');
page.onShow();
assert.equal(page.data.subjectPage.title, '找整体');
page.backFromSubjectIssue();
assert.equal(page.data.scope.period, '7d');
page.changeSubjectHomePeriod(event({ period: '1d' }));
page.changeTab(event({ tab: 'students' }));
page.openStudent(event({ id: page.data.students[0].studentId }));
assert.equal(page.data.studentPeriod, '1d');
page.closeStudent(); page.backFromDetail();
assert.equal(page.data.scope.period, '1d');
page.selectSubjectClass('unauthorized');
assert.equal(page.data.scope.classId, 'c1');
assert.equal(native([{ subject: '数学', classIds: ['c2'] }]).data.classes.length, 1);
assert.equal(native([]).data.subjectHome, null);

// A student's historical answer must not disappear when opening their report.
for (const days of [14, 30]) {
  const page = native(assignments);
  page.showSubjectRoute({ kind: 'review', days });
  page.openStudent(event({ id: page.data.students[0].studentId }));
  assert.equal(page.data.studentPeriod, days + 'd');
  page.onShow();
  assert.equal(page.data.studentPeriod, days + 'd');
  page.closeStudent();
  assert.equal(page.data.subjectRoute.days, days);
  page.backFromSubjectIssue();
  assert.equal(page.data.scope.period, '7d');
}
const issue = learning.reportDayIssues(full, 0, 'question')[0];
const student = issue.answerGroups[0].students[0];
const original = full.answers.find(row => row.id === student.id);
const corrected = { ...full, activities: [...full.activities,
  { ...full.activities[0], id: 'correction-test-1', day: 0, start: '17:00' },
  { ...full.activities[0], id: 'correction-test-2', day: 0, start: '18:00' }],
  answers: [...full.answers,
    { ...original, id: 'correction-test-2', activityId: 'correction-test-2', kind: '订正', originalAttemptId: original.id, correct: true },
    { ...original, id: 'correction-test-1', activityId: 'correction-test-1', kind: '订正', originalAttemptId: original.id, correct: false }] };
const answerPage = subjectLearningPage(corrected, { kind: 'answer', id: issue.id, day: 0, group: 0, studentId: student.studentId });
assert.deepEqual(answerPage.corrections.slice(-2).map(row => [row.id, row.result]), [['correction-test-1', '本次仍错'], ['correction-test-2', '本次答对']]);

function browserModel(assignments) {
  const context = vm.createContext({
    window: { learningData: learning, schoolDemoRoster: { ...roster, getDemoTeachingAssignments: () => assignments } },
    document: { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; } },
  });
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'workbench-prototype.js'), 'utf8'), context);
  const api = context.window.workbenchPrototype;
  api.view('subject'); api.renderLearning();
  return api;
}
const web = browserModel(assignments);
web.changeLearningSubject(1);
web.subjectPeriod('1d'); web.selectLearningClass('c2');
let markup = web.renderLearning();
assert(markup.includes('lr-preview-subject-static">数学'));
assert(!markup.includes('近 7 天学科学习概况'));
web.selectLearningClass('c1'); web.subjectPeriod('7d');
markup = web.renderLearning();
assert(markup.includes('14人答错'));
assert(markup.includes('29人有判定 · 2道题有误'));
assert(markup.includes('3道 · 12人答错'));
web.openRecentIssues(); assert.equal(web.getLearningNavigation().title, '班级错题');
web.materialGo({kind:'list',knowledge:'找整体',onlyWrong:true}); assert(web.renderLearning().includes('查看学生'));
web.backLearning(); web.backLearning();
assert(web.renderLearning().includes('14人答错'));
for (const days of [14, 30]) {
  web.openKnowledgeReview(); web.setReviewDays(days); web.materialGo({kind:'list',unknown:true}); web.materialGo({kind:'question',qid:'material:u1'});
  const student = learning.reportDayIssues(full, 0, 'question')[0].answerGroups[0].students[0];
  web.student(student.studentId);
  assert.equal(web.getScope().studentPeriod, days + 'd');
  assert(web.renderLearning().includes(learning.learningReportDays[days - 1]));
  web.navigateLearningHome();
  assert(web.renderLearning().includes('10-06 至 10-12'));
}
console.log('PASS: daily boundaries, weekly deduplication, empty today, class/subject authorization, single/empty scopes, route and student time preservation (web + native).');

// Same-question aggregation must retain all source chains, including later corrections.
const merged=learning.subjectAnswerQuestions(full);
const arithmetic=merged.filter(q=>q.knowledge==='有理数混合运算');
assert.equal(arithmetic.length,2);assert.deepEqual(arithmetic.map(q=>q.wrongPeople),[4,3]);
const cx=arithmetic.find(q=>q.id==='7:数学:q1').students.find(s=>s.name==='陈轩');
assert.equal(cx.status,'still');assert.equal(cx.chains[0].latest.correct,false);
const month=learning.queryLearning('30d','c1','数学','all',true);
const counts=learning.subjectStudentCounts(month,'c1-s01');
assert.deepEqual([counts.correctCount,counts.wrongCount,counts.correctedCount],[0,4,1]);
const nativeDetails=native(assignments);
nativeDetails.showSubjectRoute({kind:'material-list',unknown:true,days:7});
assert.equal(nativeDetails.data.subjectPage.material.matches.length,3);
nativeDetails.showSubjectRoute({kind:'problem',questionId:'material:u1',days:7});
assert.equal(nativeDetails.data.questionStudents.length,9);
nativeDetails.filterQuestionStudents({detail:{value:'2'}});assert.equal(nativeDetails.data.questionStudents.length,2);
nativeDetails.openStudent(event({id:'c1-s04'}));nativeDetails.closeStudent();
assert.equal(nativeDetails.data.questionFilter,'still');assert.equal(nativeDetails.data.questionStudents.length,2);
nativeDetails.returnToModuleHome();nativeDetails.showSubjectRoute({kind:'review',days:30});
assert.equal(nativeDetails.data.subjectPage.material.stats.attempts,286);
nativeDetails.openStageRoster();assert.equal(nativeDetails.data.students.find(r=>r.studentId==='c1-s01').counts.correctedCount,1);
nativeDetails.backFromDetail();assert.equal(nativeDetails.data.subjectRoute.days,30);
const expanded=subjectLearningPage(corrected,{kind:'problem',questionId:issue.questionId,days:7});
const chain=expanded.material.question.students.find(s=>s.id===student.studentId).chains.find(r=>r.id===original.id);
assert.deepEqual(chain.corrections.slice(-2).map(r=>r.correct),[false,true]);
// An all-correct knowledge point remains visible in stage review.
const allCorrect={...full,answers:full.answers.map(a=>({...a,correct:true}))};
assert.equal(subjectLearningPage(allCorrect,{kind:'review',days:7}).material.groups.length,3);
assert.equal(subjectLearningPage(allCorrect,{kind:'recent',days:7}).material.visible.length,0);
console.log('PASS: question aggregation, correction chains, stage all-correct coverage, student counts, native filters and return scope.');
