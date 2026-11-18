import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const services=new Map();
function load(name){
  if(services.has(name))return services.get(name);
  const exports={};services.set(name,exports);
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../miniprogram/services/${name}.ts`,import.meta.url),'utf8'),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
  }).outputText,{exports,require:p=>load(p.replace('./','')),wx:{getStorageSync(){},setStorageSync(){}}});
  return exports;
}
const g=load('homeworkGrading'),roster=load('schoolDemoRoster');
const now=Date.parse('2026-11-18T12:00:00+08:00');
const record=(studentId,itemId,states)=>({taskId:'test',studentId,itemId,version:2,questions:states.map((state,i)=>({id:itemId+i,state,correct:i===0}))});
const combined=record('one','a',['queued','processing','failed','review','review']);
combined.gradingWaitEstimate={taskId:'test',studentId:'one',itemId:'a',submissionVersion:2,minMinutes:3,maxMinutes:5,expiresAt:new Date(now+60000).toISOString()};
let progress=g.teacherGradingProgress([combined,record('one','b',['failed','review'])],now);
assert.equal(progress.status.phase,'mixed');
assert.equal(progress.status.activity.failed,true);
assert.equal(progress.completed,0);
assert.equal(progress.total,1);
assert.equal(progress.reviewIds.length,1);
assert.equal(progress.failedIds.length,1);
assert.match(progress.status.text,/暂无法估算/,'A failed part invalidates its submission-wide completion estimate');
assert.doesNotMatch(progress.status.text,/3—5/);
const healthyMixed={...combined,questions:combined.questions.filter(q=>['queued','processing'].includes(q.state))};
assert.match(g.teacherGradingProgress([healthyMixed],now).status.text,/含排队/,'A healthy submission-wide estimate includes its queued questions');
assert.match(progress.status.note,/批改失败/);
assert.equal(g.teacherListGradingStatus(progress).label,'待复核 1 人');
assert.equal(g.teacherListGradingStatus(progress).note,'有失败');
assert.equal(g.teacherListGradingStatus(progress).action,'review');
assert.match(g.gradingWaitNotice([combined],now),/暂无法估算/,'Failed parts invalidate the duration, without hiding other questions still processing');

for(const records of [
  [record('one','a',['processing','failed'])],
  [record('one','a',['processing']),record('two','a',['failed'])],
]){
  progress=g.teacherGradingProgress(records,now);
  const list=g.teacherListGradingStatus(progress);
  assert.equal(progress.status.phase,'processing');
  assert.equal(list.label,'批改中');assert.equal(list.note,'有失败');
  assert.equal(list.action,'');assert.equal(list.tone,'attention');
}
progress=g.teacherGradingProgress([record('one','a',['queued','processing'])],now);
assert.equal(g.teacherListGradingStatus(progress).label,'批改中');
assert.match(progress.status.title,/部分内容排队/);
const expired={...combined,gradingWaitEstimate:{...combined.gradingWaitEstimate,submissionVersion:1}};
assert.match(g.teacherGradingProgress([expired],now).status.text,/暂无法估算/);
assert.doesNotMatch(g.teacherGradingProgress([expired],now).status.text,/3—5/);
assert.equal(g.teacherListGradingStatus(g.teacherGradingProgress([record('one','a',['failed'])],now)).label,'批改异常');
assert.equal(g.teacherListGradingStatus(g.teacherGradingProgress([record('one','a',['confirmed'])],now)).label,'已批完');
assert.equal(g.teacherGradingProgress([record('one','a',['confirmed'])],now).total,1,'Only submitted students enter grading progress');

const questions=(count,correct)=>Array.from({length:count},(_,i)=>({state:'confirmed',correct:i<correct}));
const stats=g.teacherGradedStatistics([{questions:questions(2,2)},{questions:questions(18,9)},
  {questions:[{state:'processing',correct:false},{state:'failed',correct:false},{state:'review',correct:false},
    {state:'confirmed',correct:true,reviewReason:'manual-hold'},{state:'confirmed',correct:true,mappingConfirmed:false},{state:'confirmed'}]}]);
assert.equal(stats.total,20);assert.equal(stats.correct,11);assert.equal(stats.wrong,9);assert.equal(stats.rate,55);
assert.equal(g.teacherGradedStatistics([{questions:[{state:'review'}]}]).rate,null);

const source=readFileSync(new URL('./homework-prototype.js',import.meta.url),'utf8').replace('    renderTeacher() {','    inspect:()=>store, renderTeacher() {');
const context={setTimeout:()=>1,clearTimeout(){},window:{homeworkGrading:g,homeworkFilters:load('homeworkFilters'),homeworkLearning:load('homeworkLearning'),confirm:()=>true},
  schoolDemoRoster:roster,location:{search:'?review=1'},URLSearchParams,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},teacherDesk(){},alert(){}};
vm.runInNewContext(source,context);
const p=context.window.homeworkPrototype,store=p.inspect(),task=store.tasks.find(t=>t.id==='grading-demo-v1');
const [first,second]=roster.DEMO_STUDENTS.filter(s=>s.classId==='c1'),other=roster.DEMO_STUDENTS.find(s=>s.classId==='c2');
const make=(student,itemIndex,qs,version=1)=>({...record(student.id,task.items[itemIndex].id,[]),taskId:task.id,version,questions:qs});
store.submissions=store.submissions.filter(r=>r.taskId!==task.id).concat([
  make(first,0,questions(2,2)),make(first,1,questions(18,9)),make(other,0,questions(10,0)),
]);
p.setScope({view:'subject',classIds:['c1'],teacherId:'teacher-demo-001'});p.openTeacher(task.id);
let html=p.renderTeacher();assert.match(html,/55%/);assert.match(html,/已批改正确率/);assert.match(html,/已判定 20 题次/);
store.submissions.push(make(first,0,questions(2,0),2));
html=p.renderTeacher();assert.match(html,/45%/,'A new submission replaces the old version in the current rate');assert.match(html,/已判定 20 题次/);
store.submissions=store.submissions.filter(r=>r.taskId!==task.id).concat([
  make(first,0,[{id:'a',state:'processing',correct:false},{id:'b',state:'failed',correct:false},{id:'c',state:'review',correct:false}]),
  make(first,1,[{id:'d',state:'failed',correct:false}]),make(second,0,[{id:'e',state:'processing',correct:false}]),
  make(other,0,[{id:'f',state:'failed',correct:false}]),
]);
p.openTeacher(task.id);html=p.renderTeacher();assert.match(html,/查看异常作业/);assert.doesNotMatch(html,/hp-graded-summary-grid/,'No valid judgments means no rate');
p.openTaskFilter('class');p.selectTaskFilter('c1');
p.openListTaskAction(task.id,'review');assert.match(p.renderTeacher(),/待复核作业/);assert.match(p.renderTeacher(),new RegExp(first.name));
p.openListTaskAction(task.id,'issues');html=p.renderTeacher();assert.match(html,/批改异常作业/);assert.match(html,new RegExp(first.name));
assert.doesNotMatch(html,new RegExp(second.name),'Failure list excludes students only processing');
assert.ok(!html.includes(`openStudent('${other.id}')`),'Failure list obeys the current class filter even for students with the same name');
console.log('PASS: independent mixed phases, student deduplication, failure routes, versioned estimates, weighted current rates and scoped browser navigation.');
