const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const l=require('../miniprogram/services/learningMock.ts');
const base=l.queryLearning('30d','c1','数学','all',true),before=JSON.stringify(base);
const report=l.withSubjectMaterialData(base,'数学','30d'),view=l.subjectMaterialView(report,30);
assert.equal(JSON.stringify(base),before,'subject fixtures must not mutate another role report');
assert.deepEqual(view.stats,{questions:10,totalQuestions:10,people:29,bad:20,wrongQuestions:9,attempts:286,correct:241,wrongAttempts:45,linked:7,pending:14});
assert.equal(l.subjectMaterialView(report,7).stats.attempts,199);
assert.equal(l.subjectMaterialView(report,1).stats.attempts,29+29+28+27+28);
assert.equal(view.unknownStats.questions,3);assert.equal(view.unknownStats.bad,12);
const q=view.questions.find(q=>q.id==='material:u1');
assert.deepEqual([q.people,q.wrongPeople,q.pendingPeople,q.correctedPeople],[28,9,2,6]);
assert.deepEqual(['fixed','still','missing'].map(status=>q.allStudents.filter(s=>s.status===status).length),[4,2,3]);
assert.equal(q.allStudents.length,30);assert.equal(q.source.name,'数学周末练习');assert.equal(q.source.number,5);
assert(view.groups.find(g=>g.name==='一元一次方程').questions.every(q=>q.wrongPeople===0),'all-correct topic stays in review');
// Unclassified records must remain visible and count in the overall summary.
const missing={...report,answers:report.answers.map(a=>({...a,knowledge:''})),pendingAnswers:report.pendingAnswers.map(a=>({...a,knowledge:''}))};
const mv=l.subjectMaterialView(missing,30);assert.equal(mv.groups.length,0);assert.equal(mv.stats.attempts,286);assert.equal(mv.unknownStats.questions,10);
// Pending-only records still have a source/roster, but zero judged/wrong counts.
const pendingOnly={...report,answers:[],pendingAnswers:[...report.pendingAnswers,...report.answers.filter(a=>a.kind==='首次')]};
const pv=l.subjectMaterialView(pendingOnly,30);assert.equal(pv.stats.people,0);assert.equal(pv.stats.bad,0);assert.equal(pv.stats.questions,0);assert.equal(pv.stats.pending,300);assert.equal(pv.sources.length,3);assert.equal(pv.questions[0].allStudents.length,30);
const empty=l.subjectMaterialView({...report,answers:[],pendingAnswers:[],activities:[]},30);assert.equal(empty.questions.length,0);assert.equal(empty.stats.pending,0);
// A source-local identity, rather than title/knowledge, controls same-question merging.
const original=report.answers.find(a=>a.questionId==='material:u1'&&a.kind==='首次'),a=report.activities.find(a=>a.id===original.activityId);
const duplicate={...original,id:'another-source',questionId:'different-source:q5',activityId:'another-source',question:{...original.question,id:'different-source:q5',source:{...original.question.source,id:'different-source'}}};
const distinct=l.subjectMaterialView({...report,answers:[...report.answers,duplicate],activities:[...report.activities,{...a,id:'another-source'}]},30);assert.equal(distinct.stats.questions,11);assert.equal(distinct.sources.length,4);
// A second answer to the same question increases attempts, not question/student counts.
const repeat={...original,id:'repeat',activityId:'repeat',correct:true};
const repeated=l.subjectMaterialView({...report,answers:[...report.answers,repeat],activities:[...report.activities,{...a,id:'repeat',start:'18:00'}]},30);
assert.equal(repeated.stats.questions,10);assert.equal(repeated.stats.attempts,287);assert.equal(repeated.stats.bad,20);
const personal=l.personalLearningView(report,'c1-s01',l.personalLearningRange('30d'),'all','知识点暂未明确');assert.equal(personal.unknownCount,3);assert.equal(personal.visible.length,3);
// Restrict fixtures to the previously authorized roster/class/subject.
const one=l.withSubjectMaterialData(l.queryLearning('30d','c1','数学','c1-s01'),'数学','30d');assert(one.answers.every(a=>a.studentId==='c1-s01'));assert.equal(l.subjectMaterialView(one,30).stats.people,1);
const c2=l.queryLearning('30d','c2','数学');assert.equal(l.withSubjectMaterialData(c2,'数学','30d'),c2);
assert.equal(l.withSubjectMaterialData(base,'英语','30d'),base);
console.log('PASS material learning: deduplication, source identity, period counts, unknown coverage, pending-only/empty states, corrections, personal totals, authorization and report isolation.');
