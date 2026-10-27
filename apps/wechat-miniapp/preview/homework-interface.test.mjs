import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const cache=new Map(),wxStorage=new Map();
function load(name){if(cache.has(name))return cache.get(name);const exports={};cache.set(name,exports);const source=readFileSync(new URL(`../miniprogram/services/${name}.ts`,import.meta.url),'utf8');vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:p=>load(p.replace('./','')),wx:{getStorageSync:k=>wxStorage.get(k),setStorageSync:(k,v)=>wxStorage.set(k,structuredClone(v))}});return exports;}
const g=load('homeworkGrading'),native=load('homeworkMock'),roster=load('schoolDemoRoster');
const records=[{questions:[{id:'q',label:'第1题',state:'confirmed',correct:false,answer:'C',explanation:'AI 解析'}]},{questions:[{id:'q',label:'第1题',state:'confirmed',correct:true,answer:'B',explanation:'另一份 AI 解析'}]}],task={};
g.initializeAnswerStandards(task,records);
assert.equal(g.teacherReference(task,'q'),null,'AI-generated answers must not become teacher references');
const snapshot=JSON.stringify(records),rate=g.gradingStatistics(records.flatMap(r=>r.questions));
assert.equal(rate.wrongRate,50);assert.ok(records.every(r=>g.isResultReleased(r.questions[0])));
assert.ok(g.confirmAnswerStandard(task,records,'q','custom','teacher','A','教师参考解析'));
assert.equal(JSON.stringify(records),snapshot,'Reference revisions must not mutate any student response');
assert.equal(g.gradingStatistics(records.flatMap(r=>r.questions)).wrongRate,50);
task.deadline='2026-10-22 20:00';
const deadline=new Date('2026-10-22T20:00').getTime();
assert.equal(g.teacherReference(task,'q',false,deadline-1).answer,'A','Teacher can see their own reference before the deadline');
const hidden=g.teacherReference(task,'q',true,deadline-1);
assert.equal(hidden.locked,true);assert.equal(hidden.answer,'');assert.equal(hidden.explanation,'','Hidden reference content must not be sent to the result renderer');
assert.equal(g.teacherReference(task,'q',true,deadline).answer,'A','Teacher reference becomes available at the first deadline');
assert.equal(g.teacherReference(task,'unmatched',true,deadline),null,'Unmatched question must not borrow another reference');
assert.equal(g.teacherReference({...task,deadline:undefined},'q',true,deadline).locked,true);
assert.equal(g.teacherReference({answerStandards:[{...task.answerStandards[0],source:'ai',teacherAnswer:'',answer:'C'}]},'q'),null,'Legacy AI-source entry is not a teacher reference');
assert.equal(JSON.stringify(records),snapshot,'Reference visibility must not affect per-student grades');
const first=records[0].questions[0];g.confirmManualResult(task,records,first,true,'now');
assert.equal(first.aiCorrect,false);assert.equal(first.answer,'C');assert.equal(first.decisionSource,'teacher');
assert.equal(g.gradingStatistics(records.flatMap(r=>r.questions)).wrongRate,0);assert.ok(g.isResultReleased(first));
g.holdManualResult(first,'later');assert.equal(g.isResultReleased(first),false);assert.equal(g.gradingProgress(records.flatMap(r=>r.questions)).confirmed,1);
assert.equal(g.gradingStatistics([{...first,state:'failed'},{...first,state:'unanswered'}]).wrongRate,null);
const legacy={gradingPolicyVersion:2,answerStandards:task.answerStandards};const old=[{questions:[{...first,reviewReason:'answer-changed',decisionSource:'ai',aiState:'confirmed',aiCorrect:false,aiAnswer:'C',answer:'A',standardVersion:1}]}];g.initializeAnswerStandards(legacy,old);assert.equal(old[0].questions[0].answer,'C');assert.equal(old[0].questions[0].state,'confirmed');
let failWrites=false;
const storage=new Map();const source=readFileSync(new URL('./homework-prototype.js',import.meta.url),'utf8').replace('    renderTeacher() {','    inspect:()=>store, renderTeacher() {');
function browser(){const c={setTimeout:()=>1,clearTimeout(){},window:{homeworkGrading:g,homeworkFilters:load('homeworkFilters'),homeworkLearning:load('homeworkLearning'),prompt:()=>'',confirm:()=>true},schoolDemoRoster:roster,location:{search:'?review=1'},URLSearchParams,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(failWrites)throw new Error("quota");storage.set(k,v)},removeItem:k=>storage.delete(k)},teacherDesk(){},alert(){}};vm.runInNewContext(source,c);const p=c.window.homeworkPrototype;p.setScope({view:'subject',classIds:['c1','c2'],teacherId:'teacher-demo-001'});return p;}
let p=browser();p.openTeacher('grading-demo-v1');
assert.equal((p.renderTeacher().match(/查看批改 ›/g)||[]).length,2,'Each graded item has its own result entry');
assert.doesNotMatch(p.renderTeacher(),/AI 批改统计|查看逐题结果 ›|核对统计并开放|确认一致答案/);
const gradedDemo=p.inspect().tasks.find(t=>t.id==='grading-demo-v1');
p.openQuestionResults('grading-page-2');assert.match(p.renderTeacher(),/作业提交项/);assert.match(p.renderTeacher(),/第 2 页练习/);p.openTeacher('grading-demo-v1');
p.openItemStudents('grading-page-2');p.openStudent(roster.GUARDIAN_STUDENT_ID);const submissionOnly=p.renderTeacher();assert.doesNotMatch(submissionOnly,/hp-question-results|正确答案|改判记录：/,'Submission records must not render grading summaries');assert.match(submissionOnly,/hp-record-overview/);assert.doesNotMatch(submissionOnly,/查看批改 ›/);p.openStudentGrade('grading-page-2');assert.equal(p.getTeacherMode(),'student');assert.match(p.renderTeacher(),/第 2 页练习/,'Legacy grade entry stays in the matching submission item');p.openTeacher('grading-demo-v1');
gradedDemo.items[0].gradingEnabled=false;
assert.equal((p.renderTeacher().match(/查看批改 ›/g)||[]).length,1,'An image-only item does not inherit another item’s grade entry');
assert.match(p.renderTeacher(),/仅收集，不批改/);p.openQuestionResults('grading-page-2');assert.doesNotMatch(p.renderTeacher(),/hp-result-item-picker/,'A single eligible item has no redundant switcher');p.openTeacher('grading-demo-v1');
gradedDemo.items[1].gradingEnabled=false;
assert.doesNotMatch(p.renderTeacher(),/查看批改 ›|AI 批改统计/,'No graded items means no grade entry');
gradedDemo.items.forEach(item=>item.gradingEnabled=true);
p.openQuestionResults('grading-page-2');
assert.match(p.renderTeacher(),/第 23 题 · 分数乘法/);
assert.doesNotMatch(p.renderTeacher(),/第 21 题 · 线段图/,'Question results stay within the chosen item');
p.openTeacher('grading-demo-v1');
const child=roster.GUARDIAN_STUDENT_ID;const record=p.inspect().submissions.find(r=>r.taskId==='grading-demo-v1'&&r.studentId===child&&r.questions.some(q=>q.state==='confirmed'));assert.ok(record);
const q=record.questions.find(q=>q.state==='confirmed');const original=q.correct;
p.openGradeQuestion(q.id);assert.match(p.renderTeacher(),/hp-inline-verdict/);
p.chooseInlineGrade('grading-demo-v1',q.id,child,original?'wrong':'right');
assert.equal(q.correct,original,'Selecting a verdict does not save it');
assert.doesNotMatch(p.renderTeacher(),/role="dialog"/);
assert.match(p.renderTeacher(),/待保存/);
p.closeGradeReview();assert.equal(q.correct,original);
p.chooseInlineGrade('grading-demo-v1',q.id,child,original?'wrong':'right');p.saveInlineGrade();
assert.equal(q.correct,!original);assert.equal(q.decisionSource,'teacher');
p.chooseInlineGrade('grading-demo-v1',q.id,child,'hold');p.saveInlineGrade();
assert.equal(q.state,'review');assert.equal(g.isResultReleased(q),false);
p.chooseInlineGrade('grading-demo-v1',q.id,child,original?'right':'wrong');p.saveInlineGrade();
assert.equal(q.correct,original);
p.review('grading-demo-v1',q.id,undefined,child);assert.match(p.renderTeacher(),/当前复核学生的题目原图|当前复核学生的作业原图/);
p.setGradeReviewDecision(!original);p.confirmGradeReview();assert.equal(q.correct,!original);assert.equal(q.decisionSource,'teacher');
p.openParent('grading-demo-v1');p.openParentGrade();assert.match(p.renderParent('林小满'),/判定已更新，解析暂未更新/,'Changed verdict must hide the stale explanation');assert.doesNotMatch(p.renderParent('林小满'),/class="hp-result-answer"|待教师开放|确认有效并开放/);
p.openTeacher('grading-demo-v1');p.review('grading-demo-v1',q.id,undefined,child);p.holdGradeReview();assert.equal(q.state,'review');assert.equal(g.isResultReleased(q),false);
p=browser();p.openTeacher('grading-demo-v1');assert.ok(p.inspect().submissions.some(r=>r.questions.some(v=>v.id===q.id&&v.reviewReason==='manual-hold')));
// Stale dialogs and read-only roles must not mutate results.
const r=p.inspect().submissions.find(r=>r.taskId==='grading-demo-v1'&&r.studentId===child&&r.questions.some(v=>v.id===q.id));const v=r.questions.find(v=>v.id===q.id);p.review('grading-demo-v1',q.id,undefined,child);v.answer='updated-response';p.setGradeReviewDecision(true);p.confirmGradeReview();assert.equal(v.state,'review');
p.setScope({view:'school',classIds:['c1','c2'],teacherId:'teacher-demo-001'});p.openTeacher('grading-demo-v1');assert.doesNotMatch(p.renderTeacher(),/保存参考答案|onclick="homeworkPrototype.review/);
// Native service follows same per-student and version guards.
const nt=native.getHomeworkTask('grading-demo-v1'),nr=native.getStudentSubmissions(nt.id,child).find(r=>r.questions.some(q=>q.state==='confirmed')),nq=nr.questions.find(q=>q.state==='confirmed');const expected={itemId:nr.itemId,version:nr.version||1,signature:g.gradingSignature(nq)};
assert.equal(native.confirmMockReview(nt.id,nq.id,!nq.correct,'原图核实','unauthorized',[child],expected),false);
assert.equal(native.confirmMockReview(nt.id,nq.id,!nq.correct,'原图核实',nt.publishedBy,[child],expected),true);
assert.equal(native.confirmMockReview(nt.id,nq.id,true,'过期弹窗',nt.publishedBy,[child],expected),false);
console.log('PASS: independent references, AI statistics, scoped correction/hold, family sync, persistence, stale guards and role boundaries.');

// New workflow: explicit question mapping, scoped batch review, parent feedback and stale explanation guards.
p.setScope({view:'subject',classIds:['c1','c2'],teacherId:'teacher-demo-001'});
p.prepareWorkflowExperience();
let demo=p.inspect().tasks.find(t=>t.id==='homework-console-v1');
let demoRows=p.inspect().submissions.filter(r=>r.taskId===demo.id);
const firstQuestion=demo.items[0].id+'-q1';
assert.equal(typeof p.editReference,'undefined');
assert.doesNotMatch(p.renderTeacher(),/教师参考资料|查看原资料|参考资料标题/);
const unknownRow=demoRows.find(r=>r.questions.some(q=>q.mappingConfirmed===false)),unknown=unknownRow.questions.find(q=>q.mappingConfirmed===false);
const unknownId=unknown.id,unknownCorrect=unknown.correct;
p.chooseQuestionMapping(unknownRow.studentId,unknownRow.itemId,unknownId,demo.items[0].id+'-q2');p.saveQuestionMapping(unknownRow.studentId,unknownId);
assert.equal(unknown.mappingConfirmed,true);assert.equal(unknown.correct,unknownCorrect);
p.openGradeQuestion(firstQuestion);
const batchRows=demoRows.filter(r=>r.itemId===demo.items[0].id).slice(0,2);
batchRows.forEach(r=>p.toggleBatchStudent(r.studentId));p.chooseBatch('right');
const oldVerdicts=batchRows.map(r=>r.questions[0].correct);assert.deepEqual(batchRows.map(r=>r.questions[0].correct),oldVerdicts);
p.saveBatch();assert.ok(batchRows.every(r=>r.questions[0].correct&&r.questions[0].decisionSource==='teacher'));
const childRow=demoRows.find(r=>r.studentId===child&&r.itemId===demo.items[0].id),childQuestion=childRow.questions[0];
assert.equal(childQuestion.explanationInvalidated,true);assert.equal(childQuestion.parentFeedback.status,'resolved');
p.openParent(demo.id);p.openParentGrade();
let parentHTML=p.renderParent('李涵');assert.match(parentHTML,/判定已更新，解析暂未更新/);assert.doesNotMatch(parentHTML,/onclick="homeworkPrototype.openHomeworkTutor/);
p.openHomeworkTutor();assert.doesNotMatch(p.renderParent('李涵'),/hp-homework-tutor/);
p.reportGradeIssue();assert.equal(childQuestion.parentFeedback.status,'pending');assert.equal(childQuestion.correct,true);
assert.doesNotMatch(p.renderParent('李涵'),/教师参考资料|查看原资料|参考资料标题/);
p.openTeacher(demo.id);p.openGradeQuestion(firstQuestion);p.toggleBatchStudent(child);p.chooseBatch('wrong');childRow.version=(childRow.version||1)+1;p.saveBatch();assert.equal(childQuestion.correct,true,'A stale batch cannot overwrite a newer submission');
p.clearBatch();p.toggleBatchStudent(child);p.chooseBatch('hold');p.saveBatch();assert.equal(childQuestion.reviewReason,'manual-hold');
p.openTeacher(demo.id);assert.doesNotMatch(p.renderTeacher(),/hp-resume/);p.openQuestionResults(demo.items[0].id);assert.match(p.renderTeacher(),/上次查看：/);assert.doesNotMatch(p.renderTeacher(),/继续上次查看的题目/);
p=browser();p.openTeacher(demo.id);p.openQuestionResults(demo.items[0].id);assert.match(p.renderTeacher(),/上次查看：/);assert.match(p.renderTeacher(),/全部班级/);p.resumeReview();assert.equal(p.getTeacherMode(),'question');
p.setScope({view:'school',classIds:['c1','c2'],teacherId:'teacher-demo-001'});p.openTeacher(demo.id);assert.doesNotMatch(p.renderTeacher(),/教师参考资料|查看原资料|参考资料标题/);
console.log('PASS: removed teacher-material interactions, explicit question mapping, batch/stale guards, resume, parent feedback, and invalidated analysis/tutor.');
p.setScope({view:'subject',classIds:['c1'],teacherId:'teacher-demo-001'});p.openTeacher(demo.id);p.openGradeQuestion(firstQuestion);
const currentBefore=JSON.stringify(p.inspect().submissions);
p.holdCurrentScope();p.chooseBatch('right');assert.equal(JSON.stringify(p.inspect().submissions),currentBefore,'Selecting a scope does not save; it cannot imply correct judgments');
failWrites=true;p.saveBatch();failWrites=false;
assert.equal(JSON.stringify(p.inspect().submissions),currentBefore,'A failed save rolls back all selected verdicts');assert.match(p.renderTeacher(),/保存失败/);
p.saveBatch();assert.ok(p.inspect().submissions.filter(r=>r.taskId===demo.id&&r.studentId.startsWith('c1-')&&r.itemId===demo.items[0].id).every(r=>r.questions[0].reviewReason==='manual-hold'));
assert.ok(p.inspect().submissions.filter(r=>r.taskId===demo.id&&r.studentId.startsWith('c2-')&&r.itemId===demo.items[0].id).some(r=>r.questions[0].state==='confirmed'),'Out-of-scope class stays unchanged');
console.log('PASS: scoped hold is distinct from reviewed batch judgments; save failures roll back atomically.');

const multi=p.inspect().tasks.find(t=>t.id==='demo-multi-requirements-v2');
assert.ok(multi);assert.equal(multi.items.map(i=>i.type).join(','),'photo,video,file,none');
const multiRows=p.inspect().submissions.filter(r=>r.taskId===multi.id);
const missingFor=id=>multi.items.filter(i=>i.required!==false&&!multiRows.some(r=>r.studentId===id&&r.itemId===i.id));
assert.equal(multi.targetSnapshotIds.filter(id=>missingFor(id).length===0).length,2);
assert.equal(missingFor(multi.targetSnapshotIds[2]).map(i=>i.type).join(','),'video,file');
assert.equal(missingFor(multi.targetSnapshotIds[3]).length,4);
assert.ok(multiRows.filter(r=>r.itemId!=='multi-photo').every(r=>r.questions.length===0));
console.log('PASS: four-item demo has 2 complete, 1 missing video/file, 1 unsubmitted; non-photo items have no grades.');

const combinations = [
  ['shared-combo-math-v1', 'photo,video,file,none', 'teacher-demo-001', 1],
  ['shared-combo-english-v1', 'photo,file', 'teacher-demo-001', 0],
  ['shared-combo-reading-v1', 'video,none', 'other-teacher-demo', 1],
];
for (const [id, types, publisher, guardianDone] of combinations) {
  const webTask=p.inspect().tasks.find(t=>t.id===id),nativeTask=native.getHomeworkTask(id);
  assert.ok(webTask&&nativeTask,`${id} exists in teacher and guardian stores`);
  assert.equal(webTask.items.map(i=>i.type).join(','),types);
  assert.equal(nativeTask.items.map(i=>i.submitType).join(','),types);
  assert.equal(webTask.publishedBy,publisher);
  assert.equal(nativeTask.publishedBy,publisher);
  assert.ok(webTask.targetSnapshotIds.includes(child)&&nativeTask.targetSnapshotIds.includes(child));
  assert.equal(p.inspect().submissions.filter(r=>r.taskId===id&&r.studentId===child).length,guardianDone);
  assert.equal(native.getStudentSubmissions(id,child).length,guardianDone);
}
console.log('PASS: teacher and guardian share photo/video/file/confirmation combinations with matching pending progress.');
