import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const cache = new Map(), wxStorage = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  const source = readFileSync(new URL(`../miniprogram/services/${name}.ts`, import.meta.url), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  cache.set(name, exports);
  vm.runInNewContext(js, { exports, require: p => load(p.replace('./', '')), wx: { getStorageSync: k => wxStorage.get(k), setStorageSync: (k, v) => wxStorage.set(k, structuredClone(v)) } });
  return exports;
}
const g = load('homeworkGrading'), native = load('homeworkMock'), roster = load('schoolDemoRoster');
const q = { id: 'q', label: '题目', state: 'confirmed', correct: false, answer: '3/4', studentAnswer: '2/4' };
assert.equal(g.isResultReleased(q), true);
g.releaseQuestion(q, 'now');
assert.equal(g.isResultReleased(q), true);
q.explanation = '教师修订解析';
assert.equal(g.isResultReleased(q), true, 'Visible results do not require a separate release');
q.state = 'processing'; q.estimatedMinutes = 2;
assert.match(g.gradingProgress([q], true).title, /预计还需约 2 分钟/);
assert.equal(g.gradingProgress([q], true).wrong, 0);
assert.equal(q.state, 'processing', 'An estimate does not produce a completion result');
q.estimatedMinutes = undefined;
assert.match(g.gradingProgress([q]).title, /请稍后查看/);
assert.equal(g.releaseQuestion(q, 'now'), false);

native.approveMatchingHomeworkAnswers('grading-demo-v1','teacher-demo-001');native.refreshMockHomeworkAnswerGrading('grading-demo-v1','teacher-demo-001');
const task = native.getHomeworkTask('grading-demo-v1'), child = roster.GUARDIAN_STUDENT_ID;
assert.ok(task);
const c1Task = { ...task, targetSnapshotIds: native.getTargetStudents(task).filter(s => s.classId === 'c1').map(s => s.id) };
const before = native.summarizeHomework(c1Task);
for (const row of before.questionRows) if (row.graded) assert.equal(row.wrongRate, Math.round(row.wrong / row.graded * 100));
native.releaseHomeworkResults(c1Task);
assert.ok(native.getStudentSubmissions(task.id, child).flatMap(r => r.questions).some(g.isResultReleased));
const c2 = native.getTargetStudents(task).find(s => s.classId === 'c2' && native.getStudentSubmissions(task.id, s.id).length);
assert.ok(native.getStudentSubmissions(task.id, c2.id).flatMap(r => r.questions).some(g.isResultReleased), 'Other classes also see their own completed results');
native.submitHomeworkItem(task.id, task.items[0].id, child, { path: '/new-photo.png', name: '重新提交' });
const newRecord = native.getStudentSubmissions(task.id, child).find(r => r.itemId === task.items[0].id);
assert.ok(newRecord.questions.every(q => ['queued','processing'].includes(q.state) && !g.isResultReleased(q)), 'Resubmission starts a new grading job with no inherited release');
assert.ok(native.getSubmissionHistory(task.id, task.items[0].id, child).length > 1);
const after = native.summarizeHomework(c1Task);
assert.ok(after.graded < before.graded, 'The superseded version does not inflate statistics');
native.refreshMockHomeworkAnswerGrading(task.id,'teacher-demo-001');

const storage = new Map();
const browserSource = readFileSync(new URL('./homework-prototype.js', import.meta.url), 'utf8')
  .replace('    renderTeacher() {', '    inspect: () => store, inspectDraft: () => draft, inspectTutor:()=>window.homeworkTutorUI.inspect(), tutorTick:()=>window.homeworkTutorUI.next(), renderTeacher() {');
function browser() {
  const context = { document:{body:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null},MutationObserver:class{observe(){}},setTimeout:()=>1,clearTimeout(){}, window: { homeworkTutor:load('homeworkTutor'),addEventListener(){},homeworkGrading: g, homeworkFilters: load('homeworkFilters'), homeworkLearning: load('homeworkLearning'), prompt: () => '教师人工复核', confirm: () => true }, schoolDemoRoster: roster, location: { search: '?review=1' }, URLSearchParams, localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) }, teacherDesk() {}, alert() {} };
  vm.runInNewContext(readFileSync(new URL('./homework-tutor.js',import.meta.url),'utf8'),context);
  vm.runInNewContext(browserSource, context);
  const controller = context.window.homeworkPrototype;
  controller.setScope({ view: 'subject', classIds: ['c1'], teacherId: 'teacher-demo-001' });
  // Existing release/permission regressions start with an explicitly confirmed standard.
  const sample=controller.inspect().tasks.find(t=>t.id==='grading-demo-v1');if(g.standardPhase(sample)==='answers'){controller.openTeacher(sample.id);controller.confirmMatchingAnswers();controller.refreshAnswerGrading();}
  return controller;
}
let p = browser();
p.openTeacher('grading-demo-v1');
p.openQuestionResults('grading-page-1');
assert.match(p.renderTeacher(), /错误率/);
p.openParent('grading-demo-v1');p.openParentGrade();
assert.match(p.renderParent('林小满'), /class="hp-result-answer"/, 'Completed results are automatically visible');
p.openGradeRelease();p.confirmGradeRelease();
assert.match(p.renderParent('林小满'), /class="hp-result-answer"/);
p = browser();p.openParent('grading-demo-v1');p.openParentGrade();
assert.match(p.renderParent('林小满'), /class="hp-result-answer"/, 'Released results survive reload');
p.openTeacher('grading-demo-v1');p.gradeScenario('partial');
p.confirmGradeRelease();p.openParent('grading-demo-v1');p.openParentGrade();
let html = p.renderParent('林小满');
assert.match(html, /class="hp-result-sheet"/);
assert.equal((html.match(/class="hp-result-answer"/g) || []).length, 1, 'Only the selected confirmed question has an answer');
const records = p.inspect().submissions.filter(r => r.taskId === 'grading-demo-v1' && r.studentId.startsWith('c2'));
assert.ok(records.flatMap(r => r.questions).some(g.isResultReleased));
assert.ok(records.flatMap(r => r.questions).some(q => !g.isResultReleased(q)), 'Partial grading keeps unreleased questions');
p.setScope({ view: 'school', classIds: ['c1', 'c2'], teacherId: 'teacher-demo-001' });
p.openTeacher('grading-demo-v1');
assert.doesNotMatch(p.renderTeacher(), /onclick="homeworkPrototype.openGradeRelease/);
console.log('作业批改回归通过：预估等待、逐题统计、自动同步与权限隔离、持久化、重交版本、班级范围与校级只读。');

// Console scenarios must be repeatable without resetting ordinary homework.
p = browser();
const otherWork = JSON.stringify(p.inspect().submissions.filter(r => r.taskId !== 'homework-console-v1'));
p.prepareConsoleScenario('published');
assert.equal(p.getConsoleSnapshot().submitted, 0);
p.submitConsolePage(0);
assert.equal(p.getConsoleSnapshot().submitted, 1);
p.submitConsolePage(1);
assert.equal(p.getConsoleSnapshot().progress.pending, 4);
p.openConsoleTask('teacher');
p.advanceConsoleGrading('processing');
assert.match(p.getConsoleSnapshot().progress.title, /预计还需约 2 分钟/);
p.advanceConsoleGrading('complete');
assert.equal(p.getConsoleSnapshot().progress.review, 1);
p.openConsoleReview();
assert.match(p.renderTeacher(), /待复核 1 人/);
let pending = p.inspect().submissions.filter(r => r.taskId === 'homework-console-v1' && r.studentId === child).flatMap(r => r.questions).find(q => q.state === 'review');
p.review('homework-console-v1', pending.id);p.setGradeReviewDecision(false);
p.setGradeReviewReason('已核对原图，作答有误');
p.confirmGradeReview();
assert.equal(p.getConsoleSnapshot().progress.review, 0);
p.confirmGradeRelease();
assert.equal(p.getConsoleSnapshot().progress.released, 4);
for (const name of ['partialGrade','failed','review','unreleased','partialRelease','released','resubmit','changed','late','closed']) {
  p.prepareConsoleScenario(name);
  const s = p.getConsoleSnapshot();
  if (name === 'partialRelease') assert.equal(s.progress.released, s.progress.confirmed);
  if (name === 'resubmit') assert.equal(s.progress.released, 0);
  if (name === 'changed') assert.equal(s.progress.released, s.progress.confirmed);
  if (name === 'closed') assert.equal(p.submitConsolePage(0), false);
}
assert.equal(JSON.stringify(p.inspect().submissions.filter(r => r.taskId !== 'homework-console-v1')), otherWork);
const gate = { stage:'teacherDesk', teacherTab:'learning', window:{ parentPrototype:{ getDemoContext:()=>({ homework:gate.parentHomework }) } } };
vm.runInNewContext(readFileSync(new URL('./homework-console.js',import.meta.url),'utf8'),gate);
assert.equal(gate.window.homeworkDemoConsole.isActive(), false);
gate.teacherTab='homework';
assert.equal(gate.window.homeworkDemoConsole.isActive(), true);
gate.stage='parent';gate.parentHomework=false;
assert.equal(gate.window.homeworkDemoConsole.isActive(), false);
gate.parentHomework=true;
assert.equal(gate.window.homeworkDemoConsole.isActive(), true);
console.log('作业控制台回归通过：模块跟随、逐页提交到同步完整主线、10 类边界场景及普通作业保护。');

// Local previews must be reversible and must leave the full-flow data intact.
p.prepareConsoleScenario('partialRelease');
p.openParent('homework-console-v1');p.openParentGrade();
const beforeLocal = JSON.stringify(p.inspect().submissions);
const beforeStorage = JSON.stringify([...storage]);
const flowProgress = JSON.stringify(p.getConsoleSnapshot());
const initialChoices = JSON.stringify(p.getPageDemoContext('parent').choices);
p.applyPageDemo('processing','parent');
assert.match(p.renderParent('李涵',0), /预计还需约/);
assert.equal(JSON.stringify(p.getPageDemoContext('parent').choices), initialChoices);
assert.equal(JSON.stringify(p.getConsoleSnapshot()),flowProgress);
assert.equal(JSON.stringify([...storage]),beforeStorage);
p.applyPageDemo('failed','parent');
assert.equal(p.getPageDemoContext('parent').active, 'failed');
p.applyPageDemo('unknown','parent');
assert.equal(p.getPageDemoContext('parent').active,'failed');
p.restorePageDemo('parent');
const ordered = value => [...value].sort((a,b)=>(a.id||a.taskId+a.studentId+a.itemId).localeCompare(b.id||b.taskId+b.studentId+b.itemId));
assert.equal(JSON.stringify(ordered(p.inspect().submissions)),JSON.stringify(ordered(JSON.parse(beforeLocal))));
p.applyPageDemo('queued','parent');p.clearPageDemo();
assert.equal(p.getPageDemoContext('parent').active,'');
p.openParent('homework-console-v1');
p.applyPageDemo('published','parent');
assert.ok(p.getPageDemoContext('parent').choices.some(c=>c[0]==='processing'),'Choices remain available after hiding the current submissions');
p.restorePageDemo('parent');
console.log('当前页演示回归通过：状态切换、无持久化、完整流程隔离、恢复及离开页面清理。');

// Multi-class statistics remain scoped, while visibility has no release gate.
p=browser();p.setScope({view:'subject',classIds:['c1','c2'],teacherId:'teacher-demo-001'});p.openTeacher('grading-demo-v1');p.selectDetailClass('c2');
assert.match(p.renderTeacher(),/七年级\(4\)班/);assert.doesNotMatch(p.renderTeacher(),/核对统计并开放/);

const scopeService=load('workbenchScope');
let resultLinkedChildren=[];
let resultDefinition, resultProfile={userId:'teacher-demo-001',roles:['teacher']}, resultScope={view:'subject',classId:'c1',grade:'all',period:'7d'};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../miniprogram/pages/homework-result/index.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:{},setTimeout:()=>1,clearTimeout(){},Page:def=>resultDefinition=def,require:path=>path.endsWith('/stores/session')?{getSession:()=>({profile:resultProfile,expiresAt:Date.now()+60000}),linkedGuardianStudents:()=>resultLinkedChildren}:path.endsWith('/workbenchScope')?{...scopeService,workScope:()=>resultScope}:load(path.split('/').pop()),wx:{pageScrollTo(){},reLaunch(){},getStorageSync:k=>wxStorage.get(k),setStorageSync:(k,v)=>wxStorage.set(k,v),showToast(){}}});
const nativeResult={...resultDefinition,data:{...resultDefinition.data,taskId:task.id,studentId:c2.id,role:'teacher'},setData(value){Object.assign(this.data,value);}};
nativeResult.refreshResult();assert.equal(nativeResult.data.denied,false,'Authorized teacher can view the other assigned class without changing the global list filter');
resultScope={...resultScope,view:'homeroom'};nativeResult.refreshResult();assert.equal(nativeResult.data.denied,true,'Homeroom scope does not gain other classes');
resultScope={...resultScope,view:'subject'};resultProfile={userId:'other-teacher-demo',roles:['teacher']};nativeResult.refreshResult();assert.equal(nativeResult.data.denied,true,'Another teacher cannot open this task result');
nativeResult.data.role='guardian';resultProfile={userId:'unlinked-parent',roles:['guardian']};nativeResult.refreshResult();assert.equal(nativeResult.data.denied,true,'Parent access still requires the student binding');
console.log('小程序多班结果权限回归通过：任课范围、班主任边界、其他教师及家长绑定校验。');

const filterRules=load('homeworkFilters');
assert.equal(filterRules.matchesTaskStatuses(filterRules.ALL_TASK_STATUSES,[]),true,'Unrestricted filters include tasks with no grading');
assert.equal(filterRules.matchesTaskStatuses([],['review']),false);
assert.equal(filterRules.matchesTaskStatuses(['submitted','review'],['partial','review']),false);
assert.equal(filterRules.matchesTaskStatuses(['submitted','review'],['submitted','review']),true);
assert.equal(filterRules.matchesTaskStatuses(['submitted','review','failed'],['submitted','failed']),true);
p=browser();p.setScope({view:'subject',classIds:['c1'],teacherId:'teacher-demo-001',teachingAssignments:[{subject:'数学',classIds:['c1','c2']},{subject:'英语',classIds:['c2']}]});
const fixture=JSON.parse(JSON.stringify(p.inspect().tasks.find(t=>t.id==='grading-demo-v1'))),s1=roster.DEMO_STUDENTS.find(s=>s.classId==='c1').id,s2=roster.DEMO_STUDENTS.find(s=>s.classId==='c2').id;
p.inspect().tasks.push({...fixture,id:'filter-multi',title:'筛选专用任务',targetSnapshotIds:[s1,s2],items:[{id:'filter-one',type:'photo',required:true,gradingEnabled:true}]});
p.inspect().submissions.push(...[s1,s2].map((studentId,index)=>({taskId:'filter-multi',studentId,itemId:'filter-one',version:1,questions:[{id:'filter-q',state:index?'review':'confirmed',correct:true,answer:'1'}]})));
p.toTeacherListWithoutRefresh();
p.openTaskFilter('status');p.toggleAllTaskStatuses();p.confirmTaskStatuses();assert.match(p.renderTeacher(),/请至少选择一个状态/);p.closeTaskFilter();
assert.equal(p.getTaskListFilters().statuses.length,filterRules.ALL_TASK_STATUSES.length,'Cancel must preserve applied filters');
p.openTaskFilter('status');p.toggleAllTaskStatuses();p.toggleTaskStatus('submitted');p.toggleTaskStatus('review');p.confirmTaskStatuses();
assert.ok(p.getFilteredTaskIds().includes('filter-multi'));
p.openTaskFilter('class');p.selectTaskFilter('c1');assert.ok(!p.getFilteredTaskIds().includes('filter-multi'),'A review in another class cannot satisfy the selected class filter');
p.resetTaskFilters();p.openTaskFilter('class');p.selectTaskFilter('c2');p.openTaskFilter('subject');p.selectTaskFilter('英语');assert.equal(p.getTaskListFilters().classId,'c2');
p.setScope({view:'subject',classIds:['c1'],teacherId:'teacher-demo-001',teachingAssignments:[{subject:'数学',classIds:['c1']},{subject:'英语',classIds:['c2']}]});
p.openTaskFilter('subject');p.selectTaskFilter('数学');assert.equal(p.getTaskListFilters().classId,'all','Incompatible class resets when changing subjects');
p.openTaskFilter('class');p.selectTaskFilter('c2');assert.equal(p.getTaskListFilters().classId,'all','Invalid subject/class pair cannot be selected');
p.openTaskFilter('subject');p.selectTaskFilter('英语');p.openTaskFilter('class');p.selectTaskFilter('c2');p.toTeacherListWithoutRefresh();assert.match(p.renderTeacher(),/hp-list-tools/);assert.match(p.renderTeacher(),/hp-list-subject/);
p.setScope({view:'school',classIds:['c1','c2'],teacherId:'teacher-demo-001'});assert.equal(p.getTaskListFilters().subject,'all');
console.log('任务筛选回归通过：状态全选与取消、同组或跨组且、班级统计隔离、学科班级联动及身份切换。');

let homeworkDefinition;
resultProfile={userId:'teacher-demo-001',roles:['teacher'],teachingAssignments:[{subject:'数学',classIds:['c1']},{subject:'英语',classIds:['c2']}]};resultScope={view:'subject',classId:'c1',grade:'all',period:'7d'};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../miniprogram/pages/teacher/homework/index.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:{},Page:def=>homeworkDefinition=def,require:path=>path.endsWith('/stores/session')?{getSession:()=>({profile:resultProfile,expiresAt:Date.now()+60000})}:path.endsWith('/workbenchScope')?{...scopeService,workScope:()=>resultScope}:load(path.split('/').pop()),wx:{getStorageSync:k=>wxStorage.get(k),setStorageSync:(k,v)=>wxStorage.set(k,v)}});
const page={...homeworkDefinition,data:structuredClone(homeworkDefinition.data),setData(value){Object.assign(this.data,value);}};page.data.scope=resultScope;
const englishTask=native.publishHomework({title:'英语筛选任务',subject:'英语',kind:'homework',description:'英语练习',classIds:['c2'],targetStudentIds:[s2],deadline:'2026-12-21 20:00',submitDeadline:'2026-12-28 20:00',parentVisible:false,publishedBy:'teacher-demo-001',items:[{id:'english-file',title:'英语练习',instruction:'上传照片',submitType:'photo',required:true}]});
page.refreshList();assert.ok(page.data.tasks.some(t=>t.id===englishTask.id),'All subjects includes a task in another authorized teaching class');
const event=(key,value)=>({currentTarget:{dataset:{[key]:value}}});
page.openTaskFilter(event('kind','class'));page.selectTaskFilter(event('id','c2'));page.openTaskFilter(event('kind','subject'));page.selectTaskFilter(event('id','数学'));assert.equal(page.data.listClassId,'all');assert.ok(page.data.tasks.every(t=>t.subject==='数学'));
page.openTaskFilter(event('kind','subject'));page.selectTaskFilter(event('id','英语'));page.openTaskFilter(event('kind','class'));page.selectTaskFilter(event('id','c2'));page.openDetail(event('id',englishTask.id));assert.equal(page.data.selectedTask.id,englishTask.id);assert.equal(page.data.selectedTask.classIds[0],'c2');
page.backToList();page.openTaskFilter(event('kind','status'));page.toggleAllTaskStatuses();page.confirmTaskStatuses();assert.equal(page.data.taskFilterError,'请至少选择一个状态');page.closeTaskFilter();assert.equal(page.data.listStatuses.length,filterRules.ALL_TASK_STATUSES.length);
page.data.hasDraft=false;page.startCompose();assert.equal(page.data.draft.subject,'英语');assert.deepEqual(Array.from(page.data.draft.classIds),['c2']);
console.log('小程序任务筛选回归通过：任教关系联动、跨班进入详情、全选校验与发布预选。');

const homeworkLearning=load('homeworkLearning');
const geometryQ={id:'photo-q',label:'原图题目',stem:'测试题',answer:'3/4',correct:false,state:'confirmed'};
assert.equal(homeworkLearning.questionRegion(geometryQ,0,false),null,'Never invent coordinates on a real photo');
assert.ok(homeworkLearning.questionRegion(geometryQ,0,true));
assert.equal(homeworkLearning.questionRegion({...geometryQ,region:{x:.9,y:.1,width:.3,height:.2}},0,false),null);
assert.equal(homeworkLearning.questionMark(geometryQ,true).tone,'wrong','Completed results are visible without release');
assert.equal(homeworkLearning.questionMark({...geometryQ,state:'review'},true).mark,'?');
assert.equal(homeworkLearning.questionMark({...geometryQ,state:'unreadable'},true).tone,'pending');
g.releaseQuestion(geometryQ,'now');assert.equal(homeworkLearning.questionMark(geometryQ,true).mark,'×');
let book=homeworkLearning.addNotebookEntry([],{studentId:s1,taskId:'t',itemId:'p',version:1},geometryQ,'计算失误');
book=homeworkLearning.addNotebookEntry(book,{studentId:s1,taskId:'t',itemId:'p',version:2},geometryQ,'思路不清');assert.equal(book.length,1);assert.equal(book[0].version,2);
book=homeworkLearning.addNotebookEntry(book,{studentId:s2,taskId:'t',itemId:'p',version:1},geometryQ,'计算失误');assert.equal(book.length,2);
assert.equal(homeworkLearning.addNotebookEntry(book,{studentId:s1,taskId:'t',itemId:'p',version:3},{...geometryQ,state:'review'},'计算失误').length,2);

assert.equal(homeworkLearning.checkGuideAnswer('24（人）','24 人'),true);
p=browser();p.prepareConsoleScenario('released');p.openParent('homework-console-v1');p.openParentGrade();
let gradeHtml=p.renderParent('李涵',0);assert.match(gradeHtml,/hp-result-paper/);assert.match(gradeHtml,/hp-paper-region/);assert.match(gradeHtml,/AI 解题/);
p.openMistakeReason();assert.match(p.renderParent('李涵',0),/标记错因/);p.chooseMistakeReason('计算失误');p.saveHomeworkMistake();p.saveHomeworkMistake();
let savedBook=JSON.parse(storage.get(homeworkLearning.NOTEBOOK_KEY));assert.equal(savedBook.length,1);assert.equal(savedBook[0].reason,'计算失误');
assert.match(p.renderParent('李涵',0),/hp-result-paper/);
p.openHomeworkNotebook();assert.match(p.renderParent('李涵',0),/孩子的错题本/);p.closeHomeworkLearning();
p.prepareConsoleScenario('processing');p.openParent('homework-console-v1');p.openParentGrade();gradeHtml=p.renderParent('李涵',0);assert.doesNotMatch(gradeHtml,/onclick="homeworkPrototype.openHomeworkTutor/);
console.log('原图批改学习回归通过：题框定位与存疑标记、自动同步与权限隔离、错题去重与孩子隔离、分步引导及返回原题。');

resultProfile={userId:'guardian-demo-001',roles:['guardian']};resultLinkedChildren=[{id:c2.id}];native.releaseHomeworkResults(task);
const nativeRecords=native.getStudentSubmissions(task.id,c2.id),nativePage=nativeRecords.findIndex(r=>r.questions.some(q=>g.isResultReleased(q))),nativeQuestion=nativeRecords[nativePage].questions.find(q=>g.isResultReleased(q));
nativeResult.data={...structuredClone(resultDefinition.data),taskId:task.id,studentId:c2.id,role:'guardian',pageIndex:nativePage,focus:nativeQuestion.id};nativeResult.refreshResult();assert.equal(nativeResult.data.denied,false);assert.ok(nativeResult.data.questions.some(q=>q.regionStyle),'Demo image has calibrated region overlays');
nativeResult.openMistakeReason();assert.equal(nativeResult.data.reasonOpen,true);nativeResult.saveMistake();nativeResult.saveMistake();assert.equal(wxStorage.get(homeworkLearning.NOTEBOOK_KEY).length,1);
nativeResult.openTutor();assert.equal(nativeResult.data.learningMode,'tutor');assert.ok(nativeResult.data.tutor);nativeResult.beginGuide();nativeResult.tutorDirect();for(let i=0;i<12&&nativeResult.data.tutor.phase!=='done';i++)nativeResult.nextTutor();assert.equal(nativeResult.data.tutor.phase,'done');nativeResult.goBack();assert.equal(nativeResult.data.learningMode,'result');assert.equal(nativeResult.data.pageIndex,nativePage);
resultLinkedChildren=[];nativeResult.openMistakeReason();assert.equal(nativeResult.data.denied,true);assert.equal(nativeResult.data.reasonOpen,false);nativeResult.saveMistake();assert.equal(wxStorage.get(homeworkLearning.NOTEBOOK_KEY).length,1);
console.log('小程序原图学习回归通过：题框、加入错题、引导返回与家长解绑后的即时阻断。');

assert.equal(homeworkLearning.checkGuideAnswer('0.75','3/4'),true);assert.equal(homeworkLearning.checkGuideAnswer('1/0','3/4'),false);
p.prepareConsoleScenario('released');p.openParent('homework-console-v1');p.openParentGrade();assert.equal(p.getParentNavigation(0).title,'单题批改结果');assert.match(p.renderParent('李涵',0),/hp-result-paper/);

assert.ok(filterRules.taskStatusKeys({target:30,completed:0,partial:1},[]).includes('unsubmitted'));assert.ok(!filterRules.ALL_TASK_STATUSES.includes('partial'));

p=browser();p.setScope({view:'subject',classIds:['c1'],teacherId:'teacher-demo-001'});p.openTeacher('grading-demo-v1');const photoQuestion=p.inspect().submissions.find(r=>r.taskId==='grading-demo-v1'&&r.questions?.length).questions[0].id;p.openGradeQuestion(photoQuestion);assert.match(p.renderTeacher(),/题目区域的原照片截取/);assert.match(p.renderTeacher(),/查看文字/);p.showQuestionSource('text');assert.match(p.renderTeacher(),/文字由图片提取，仅供核对/);assert.match(p.renderTeacher(),/查看原图/);p.selectDetailClass('c2');p.showQuestionSource('photo');assert.match(p.renderTeacher(),/题目区域的原照片截取/);p.setScope({view:'school',classIds:['c1','c2'],teacherId:'teacher-demo-001'});assert.doesNotMatch(p.renderTeacher(),/题目区域的原照片截取/);
resultProfile={userId:'teacher-demo-001',roles:['teacher'],teachingAssignments:[{subject:'数学',classIds:['c1','c2']},{subject:'英语',classIds:['c2']}]};resultScope={view:'subject',classId:'c1',grade:'all',period:'7d'};page.data.scope=resultScope;page.data.readOnly=false;page.openTask(task.id);page.openGradeQuestion(event('id',nativeQuestion.id));assert.ok(page.data.questionPhoto?.region);page.loadQuestionPhoto({currentTarget:{dataset:{path:page.data.questionPhoto.path}},detail:{width:600,height:760}});assert.ok(page.data.questionPhotoHeight>0);page.toggleQuestionText();assert.equal(page.data.questionTextOpen,true);page.data.scope={...resultScope,view:'school'};page.data.readOnly=true;page.openTask(task.id);page.openGradeQuestion(event('id',nativeQuestion.id));assert.equal(page.data.questionPhoto,null);
console.log('单题原照片回归通过：按题定位、班级切换、识别文字辅助、原图比例与校级隐私边界。');

// Photo-backed samples must keep page paths, coordinates and actual answers aligned.
const photoPage1=g.realPhotoQuestions('grading-page-1','sample-');
const photoPage2=g.realPhotoQuestions('grading-page-2','sample-');
assert.equal(photoPage1[0].answer,'42 人');
assert.equal(photoPage1[1].answer,'15.7');
assert.equal(photoPage2[0].state,'review','Cross-page handwritten work requires review');
assert.equal(photoPage2[1].correct,false);
assert.match(photoPage2[1].explanation,/2\/8 \+ 3\/8 = 5\/8/);
assert.match(g.demoPhotoPath('console-page-2'),/real-page-2.png$/);
for(const sample of [...photoPage1,...photoPage2])assert.ok(load('homeworkLearning').questionRegion(sample,0,true));
console.log('真实样张回归通过：两页原图、21—24题定位、跨页待复核与答案解析一致。');

// Review must show and update the exact student/version that the teacher inspected.
p=browser();p.setScope({view:'subject',classIds:['c1','c2'],teacherId:'teacher-demo-001'});p.prepareConsoleScenario('review');p.openConsoleTask('teacher');
const reviewRows=p.inspect().submissions.filter(r=>r.taskId==='homework-console-v1'&&r.itemId==='console-page-1');
const firstReview=reviewRows.find(r=>r.questions.some(q=>q.state==='review'));
const anotherReview=reviewRows.find(r=>r.studentId!==firstReview.studentId&&r.studentId.startsWith('c1'));
const exactQuestion=firstReview.questions[0];
p.review('homework-console-v1',exactQuestion.id);anotherReview.questions[0].state='review';
assert.match(p.renderTeacher(),/对照原图复核/);assert.match(p.renderTeacher(),/当前复核学生的题目原图/);assert.match(p.renderTeacher(),/AI 原始判定/);
p.setGradeReviewReason('核对原图');p.confirmGradeReview();assert.equal(exactQuestion.state,'review','No implicit default decision');
p.setGradeReviewDecision(true);firstReview.version=2;p.confirmGradeReview();assert.equal(exactQuestion.state,'review');assert.equal(anotherReview.questions[0].state,'review','Stale review must not apply to the next student');
p.closeGradeReview();anotherReview.questions[0].state='confirmed';p.review('homework-console-v1',exactQuestion.id);anotherReview.questions[0].state='review';p.setGradeReviewDecision(true);p.setGradeReviewReason('已核对这名学生的原图');p.confirmGradeReview();
assert.equal(exactQuestion.state,'confirmed');assert.equal(anotherReview.questions[0].state,'review');assert.equal(g.isResultReleased(exactQuestion),true,'Saving correction automatically updates the family view');
console.log('对照审核回归通过：原图与AI结果同屏、主动判定、精确学生与版本、过期阻断及自动同步与权限隔离。');

// Reference independence, migrations and scoped corrections have dedicated coverage.
await import('./homework-interface.test.mjs');
assert.equal(g.answersEquivalent('-1','1'),false);assert.equal(g.answersEquivalent('1 米','1 厘米'),false);

// Each selected class chooses its own full-class or partial-student recipients.
p=browser();p.setScope({view:'subject',classIds:['c1','c2'],teacherId:'teacher-demo-001'});p.compose();p.fillDemoPaste();p.inspectDraft().items.forEach((item,index)=>p.setItemType(index,'none'));p.nextCompose();
if(!p.inspectDraft().classIds.includes('c2'))p.toggleClass('c2');
const firstChild=roster.DEMO_STUDENTS.find(s=>s.classId==='c1'),secondChild=roster.DEMO_STUDENTS.find(s=>s.classId==='c2');
p.setClassRecipientMode('c1','selected');p.nextCompose();assert.match(p.renderTeacher(),/至少指定一名学生/);
p.toggleStudent(firstChild.id);p.filterStudents('不存在的姓名');assert.match(p.renderTeacher(),/确定 · 1 名学生/);
p.closeRecipientPicker();assert.match(p.renderTeacher(),/已选 2 个班 · 共发送/);
p.nextCompose();assert.match(p.renderTeacher(),/部分学生 · 1 人/);assert.match(p.renderTeacher(),/全班 · 28 人/);p.publish();
const crossPublished=p.inspect().tasks[0];assert.deepEqual(Array.from(crossPublished.targetSnapshotIds).sort(),[firstChild.id,...roster.DEMO_STUDENTS.filter(s=>s.classId==='c2').map(s=>s.id)].sort());assert.equal(crossPublished.classIds.length,2);

resultProfile={userId:'teacher-demo-001',roles:['teacher'],teachingAssignments:[{subject:'数学',classIds:['c1','c2']}]};resultScope={view:'subject',classId:'all',grade:'all',period:'7d'};page.data.scope=resultScope;page.data.draft={...page.data.draft,subject:'数学',classIds:['c1','c2'],targetMode:'selected',targetStudentIds:[]};page.refreshDraft();
page.toggleStudent(event('id',firstChild.id));page.selectRecipientClass(event('id','c2'));page.toggleStudent(event('id',secondChild.id));assert.equal(page.data.recipientSelectedClassCount,2);assert.equal(page.data.draft.targetStudentIds.length,2);
page.data.studentSearch='不存在';page.refreshDraft();assert.equal(page.data.studentGroups[0].students.length,0);assert.equal(page.data.studentGroups[0].selectedCount,1);page.selectRecipientClassAll(event('selected','false'));assert.deepEqual(Array.from(page.data.draft.targetStudentIds),[firstChild.id]);
console.log('跨班指定学生回归通过：班级切换保留、整班选择与清空、搜索不影响已选、分班核对与发布名单快照。');

p.compose();p.fillDemoPaste();p.inspectDraft().items.forEach((item,index)=>p.setItemType(index,'none'));p.nextCompose();if(!p.inspectDraft().classIds.includes('c2'))p.toggleClass('c2');p.setClassRecipientMode('c1','selected');p.toggleStudent(firstChild.id);p.setClassRecipientMode('c2','selected');p.nextCompose();assert.match(p.renderTeacher(),/至少指定一名学生/);p.toggleStudent(secondChild.id);p.closeRecipientPicker();p.nextCompose();p.publish();assert.deepEqual(Array.from(p.inspect().tasks[0].targetSnapshotIds).sort(),[firstChild.id,secondChild.id].sort());
