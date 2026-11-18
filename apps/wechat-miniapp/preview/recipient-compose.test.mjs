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
  vm.runInNewContext(js, { exports, require: dependency => load(dependency.replace('./', '')), wx: { getStorageSync: key => wxStorage.get(key), setStorageSync: (key, value) => wxStorage.set(key, structuredClone(value)) } });
  return exports;
}

const roster = load('schoolDemoRoster');
const storage = new Map();
const source = readFileSync(new URL('./homework-prototype.js', import.meta.url), 'utf8')
  .replace('    renderTeacher() {', '    inspect: () => store, inspectDraft: () => draft, commitForTest: change => workflowCommit(change), renderTeacher() {');
const context = {
  document: { body: {}, addEventListener() {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null },
  MutationObserver: class { observe() {} }, setTimeout: () => 1, clearTimeout() {},
  window: { homeworkTutor: load('homeworkTutor'), addEventListener() {}, homeworkGrading: load('homeworkGrading'), homeworkFilters: load('homeworkFilters'), homeworkLearning: load('homeworkLearning'), prompt: () => '', confirm: () => true },
  schoolDemoRoster: roster, location: { search: '?review=1' }, URLSearchParams,
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  teacherDesk() {}, alert() {},
};
vm.runInNewContext(readFileSync(new URL('./homework-tutor.js', import.meta.url), 'utf8'), context);
vm.runInNewContext(source, context);

const page = context.window.homeworkPrototype;
page.setScope({ view: 'subject', classIds: ['c1', 'c2'], teacherId: 'teacher-demo-001' });
page.compose();
page.fillDemoPaste();
page.inspectDraft().items.forEach((item, index) => page.setItemType(index, 'none'));
page.nextCompose();
if (!page.inspectDraft().classIds.includes('c2')) page.toggleClass('c2');
assert.match(page.renderTeacher(), /选择班级及接收人/);
assert.doesNotMatch(page.renderTeacher(), /发送范围/);

const first = roster.DEMO_STUDENTS.find(student => student.classId === 'c1');
const c2Ids = roster.DEMO_STUDENTS.filter(student => student.classId === 'c2').map(student => student.id);
page.setClassRecipientMode('c1', 'selected');
page.nextCompose();
assert.match(page.renderTeacher(), /至少指定一名学生/);
page.toggleStudent(first.id);
page.closeRecipientPicker();
assert.match(page.renderTeacher(), new RegExp(`共发送 ${c2Ids.length + 1} 人`));
page.nextCompose();
assert.match(page.renderTeacher(), /部分学生 · 1 人/);
assert.match(page.renderTeacher(), new RegExp(`全班 · ${c2Ids.length} 人`));
page.publish();
const task = page.inspect().tasks[0];
assert.deepEqual(Array.from(task.targetSnapshotIds).sort(), [first.id, ...c2Ids].sort());
assert.deepEqual(Array.from(task.classIds).sort(), ['c1', 'c2']);
console.log('逐班全班/部分选择、人数核对和发布快照通过。');

const future = days => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-') + ' 18:00';
};
page.newTeacherDraft();
page.setField('description', '定时发放的验收作业');
page.applyRecognition();
page.setTitle('定时发送验收');
page.setUniformType('none');
assert.equal(page.inspectDraft().deadlineEnabled, false);
assert.match(page.renderTeacher(), /aria-expanded="false"[^>]*[^\n]*高级设置/);
page.toggleSubmissionDeadline(true);
page.toggleScheduledSend(true);
page.setScheduledTime(future(2));
assert.equal(page.inspectDraft().deadline, future(3));
assert.equal(page.inspectDraft().submitDeadline, future(4));
page.setDeadline(future(3));
page.setScheduledTime(future(4));
page.nextCompose();
assert.match(page.renderTeacher(), /提交截止必须晚于发送时间/);
page.toggleSubmissionDeadline(false);
page.nextCompose();
page.nextCompose();
assert.match(page.renderTeacher(), /不限提交时间/);
page.publish();
const scheduled = page.inspect().tasks[0];
assert.equal(scheduled.title, '定时发送验收');
assert.equal(scheduled.publishedAt, '');
assert.equal(scheduled.deadlineEnabled, false);
assert.match(page.renderTeacher(), /定时发送已设置/);
page.toTeacherList();
assert.match(page.renderTeacher(), /hp-scheduled-task/);
page.setScope({view:'school',classIds:['c1','c2'],teacherId:'teacher-demo-001'});
assert.doesNotMatch(page.renderTeacher(), /定时发送验收/);
page.setScope({view:'subject',classIds:['c1','c2'],teacherId:'teacher-demo-001'});
page.openParent(scheduled.id);
assert.doesNotMatch(page.renderParent('演示孩子'), /定时发送验收/);
page.rescheduleTask(scheduled.id, future(5));
assert.equal(scheduled.scheduledAt, future(5));
scheduled.scheduledAt = future(-1);
page.renderTeacher();
assert.equal(scheduled.publishedAt, scheduled.scheduledAt);
page.openParent(scheduled.id);
assert.match(page.renderParent('演示孩子'), /定时发送验收/);
page.submit(scheduled.id, scheduled.items[0].id);
assert.equal(page.inspect().submissions.find(row => row.taskId === scheduled.id)?.late, false);
console.log('默认关闭、次日补交、定时冲突、待发送权限和无截止提交通过。');

const child = roster.GUARDIAN_STUDENT_ID;
page.newTeacherDraft();
page.setField('description', '拍照提交一页作答');
page.applyRecognition();
page.setTitle('作业金币验收');
page.setUniformType('none');
page.toggleCoinReward(true);
assert.equal(page.inspectDraft().coinReward, false);
page.setUniformType('photo');
page.setUniformGrading(true);
page.toggleCoinReward(true);
page.nextCompose();
page.nextCompose();
page.publish();
const rewarded = page.inspect().tasks[0];
assert.equal(rewarded.coinReward, true);
page.openParent(rewarded.id);
assert.match(page.renderParent('演示孩子'), /有效完成可得 5 金币/);
const day = future(0).slice(0,10);
page.inspect().homeworkCoinAwards = [{ taskId:'此前奖励',studentId:child,day,amount:148 }];
page.inspect().submissions.push({
  taskId:rewarded.id,itemId:rewarded.items[0].id,studentId:child,version:1,
  submittedAt:future(0),questions:[{id:'q1',state:'queued',correct:false}],
});
assert.match(page.renderParent('演示孩子'), /金币待确认/);
assert.equal(page.commitForTest(() => { page.inspect().submissions.at(-1).questions[0].state = 'confirmed'; }), true);
assert.equal(page.inspect().homeworkCoinAwards.filter(row => row.taskId === rewarded.id).length, 1, '批改结果保存时即结算，无需打开家长详情');
assert.match(page.renderParent('演示孩子'), /已到账 2 金币/);
assert.match(page.renderParent('演示孩子'), /已到账 2 金币/);
assert.equal(page.inspect().homeworkCoinAwards.filter(row=>row.taskId===rewarded.id).length,1);
console.log('金币资格、待确认、剩余额度和作业去重通过。');

page.newTeacherDraft();
page.setField('description', '切换作业类型的默认补交');
page.applyRecognition();
page.setDeadline(future(2));
page.setKind('checkin');
page.setKind('homework');
assert.equal(new Date(page.inspectDraft().submitDeadline.replace(' ', 'T')) - new Date(page.inspectDraft().deadline.replace(' ', 'T')), 86400000);
page.setSubmitDeadline(future(6));
page.setKind('checkin');
page.setKind('homework');
assert.equal(page.inspectDraft().submitDeadline, future(6), '手动补交时间在类型切换后保留');
console.log('作业类型切换恢复次日补交、手动时间保留通过。');

page.newTeacherDraft();
page.setField('description', '存储失败时不会产生新的金币记录');
page.applyRecognition();
page.setUniformType('photo');
page.setUniformGrading(true);
page.toggleCoinReward(true);
page.nextCompose();page.nextCompose();page.publish();
const retryTask = page.inspect().tasks[0];
page.inspect().submissions.push({taskId:retryTask.id,itemId:retryTask.items[0].id,studentId:child,version:1,questions:[{id:'q',state:'queued',correct:false}]});
const originalSetItem = context.localStorage.setItem;
context.localStorage.setItem = () => { throw new Error('模拟存储失败'); };
assert.equal(page.commitForTest(() => {
  page.inspect().submissions.find(row=>row.taskId===retryTask.id).questions[0].state='confirmed';
}),false);
assert.equal(page.inspect().submissions.find(row=>row.taskId===retryTask.id).questions[0].state,'queued');
assert.equal((page.inspect().homeworkCoinAwards||[]).some(row=>row.taskId===retryTask.id),false);
context.localStorage.setItem = originalSetItem;
assert.equal(page.commitForTest(() => {
  page.inspect().submissions.find(row=>row.taskId===retryTask.id).questions[0].state='confirmed';
}),true);
assert.equal(page.inspect().homeworkCoinAwards.filter(row=>row.taskId===retryTask.id).length,1);
console.log('批改与金币同次保存，失败回滚、重试只结算一次通过。');
