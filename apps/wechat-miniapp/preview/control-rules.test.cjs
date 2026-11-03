const { test } = require('node:test');
const assert = require('node:assert/strict');
const R = require('./control-rules.js');
const weekly = (id, days, start = '08:00') => ({ id, mode: 'weekly', weekdays: days, startDate: '', endDate: '', deny: false, periods: [{ start, end: '17:30' }] });
const dates = (id, startDate, endDate, deny = false) => ({ id, mode: 'dates', weekdays: [], startDate, endDate, deny, periods: deny ? [] : [{ start: '09:00', end: '10:00' }] });
const student = id => ({ id, name: '学生' + id, schedules: [], durationRules: [], answer: false, explanation: false, world: true, locked: false, updated: {}, teacherModified: {} });
const actor = { by: '管理员', phone: '13800138000', role: 'school' };

test('管理员和老师能看到三个模块的现有规则与状态摘要', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  let stored, overlayBody;
  const first = student(1), second = student(2);
  first.durationRules = [{ id: 'duration-1', weekdays: [0, 1, 2, 3, 4], continuousMinutes: 45, restMinutes: 10, dailyMinutes: 120, periods: [{ start: '08:00', end: '18:00' }] }];
  first.homeworkSubjects = { 数学: { answer: true, explanation: false } };
  first.world = true; second.world = false;
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {}, crypto: { randomUUID() { return 'test-rule-id'; } },
    schoolControlClasses: ['五年级 2 班'], controlClasses: ['五年级 2 班'], selectedTeacherClass: '五年级 2 班',
    controlData: { '五年级 2 班': [first, second], schoolSettings: { homeroomDurationEnabled: false } },
    controlStudents() { return context.controlData['五年级 2 班']; }, adminAllStudents() { return context.controlData['五年级 2 班']; },
    adminVisibleScopeKeys() { return ['五年级']; }, controlRoleSwitcher() { return ''; }, teacherTabBar() { return ''; }, controlCardIcon() { return ''; },
    controlDemoRole: 'admin', controlWorkView: 'school', controlModule: 'duration', controlView: 'entry',
    controlLabels: { duration: '使用时长管控', homework: '智阅作业管控', world: '万象视界管控' },
    controlQuery: '', controlFilter: 'all', controlSelected: new Set(), adminSelectedScopes: new Set(), adminLevel: 'school', adminBatchMode: false,
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {}, binaryToggleButton() { return ''; },
    document: { getElementById() { return null; } },
    localStorage: { getItem(key) { return key === 'teacher-control-prototype-v1' ? stored || null : null; }, setItem(key, value) { if (key === 'teacher-control-prototype-v1') stored = value; } },
    controlOverlay(title, body) { overlayBody = body; },
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);
  context.renderControl();
  assert.match(context.app.innerHTML, /1人有单独规则/);
  assert.doesNotMatch(context.app.innerHTML, /答案允许 \d+ 人 · 详解允许 \d+ 人/);
  assert.match(context.app.innerHTML, /允许使用 1 人 · 禁止使用 1 人/);
  context.controlView = 'module';
  context.renderControl();
  assert.match(context.app.innerHTML, /部分班级有差异/);
  assert.match(context.app.innerHTML, /查看全部规则/);
  assert.doesNotMatch(context.app.innerHTML, /允许班主任调整本班使用时长|开放调整权限|关闭调整权限/);
  context.parity.showScopeRules('五年级');
  assert.match(overlayBody, /五年级 2 班（部分学生）/);
  assert.doesNotMatch(overlayBody, /[12]名学生/);
  assert.match(overlayBody, /连续 45 分钟/);
  assert.match(overlayBody, /连续 60 分钟/);
  context.adminLevel = 'grade';
  context.renderControl();
  assert.equal(context.adminLevel, 'school');
  assert.match(context.app.innerHTML, /<h3>五年级<\/h3>/);
  assert.doesNotMatch(context.app.innerHTML, /查看班级|<h3>五年级 2 班<\/h3>/);
  context.controlModule = 'homework';
  context.renderControl();
  assert.match(context.app.innerHTML, /<b>查看答案<\/b><span>部分允许<\/span>/);
  context.controlModule = 'world';
  context.renderControl();
  assert.match(context.app.innerHTML, /万象视界使用状态.*部分学生允许使用/);
  context.controlModule = 'lock';
  context.renderControl();
  assert.match(context.app.innerHTML, /<article class="parity-scope-card"/);
  assert.match(context.app.innerHTML, /<b>临时锁屏<\/b><span>未开启<\/span>/);
  context.controlDemoRole = 'teacher';
  context.controlWorkView = 'homeroom';
  context.controlModule = 'duration';
  context.controlView = 'module';
  context.renderControl();
  assert.match(context.app.innerHTML, /设置本班使用时长/);
  assert.doesNotMatch(context.app.innerHTML, /学校暂未开放|仅可查看/);
});

test('智阅作业按学生和科目分别保存，最后一次成功操作决定该科目状态', () => {
  const data = { A: [student(1)] }, refs = [{ className: 'A', id: 1 }];
  const teacher = { by: '数学老师', role: 'subject' };
  const first = R.transaction(data, refs, 'homework:数学', null, 'all', row => {
    row.homeworkSubjects = { ...row.homeworkSubjects, 数学: { answer: true, explanation: false } };
  }, teacher);
  assert.deepEqual(R.homeworkValue(first.data.A[0], '数学'), { answer: true, explanation: false });
  assert.deepEqual(R.homeworkValue(first.data.A[0], '语文'), { answer: false, explanation: false });
  assert.equal(R.modified(first.data.A[0], 'homework:数学'), true);
  assert.equal(R.modified(first.data.A[0], 'homework:语文'), false);
  assert.equal(R.modified(first.data.A[0], 'homework'), true);
  const globalBase = R.signature(first.data.A[0], 'homework');
  const mathBase = R.signature(first.data.A[0], 'homework:数学');
  const chineseBase = R.signature(first.data.A[0], 'homework:语文');
  const second = R.transaction(first.data, refs, 'homework:语文', null, 'all', row => {
    row.homeworkSubjects = { ...row.homeworkSubjects, 语文: { answer: false, explanation: true } };
  }, { by: '班主任', role: 'homeroom' });
  assert.equal(R.signature(second.data.A[0], 'homework:数学'), mathBase);
  assert.notEqual(R.signature(second.data.A[0], 'homework:语文'), chineseBase);
  assert.throws(() => R.prepare(second.data, refs, 'homework', { 'A:1': globalBase }), /其他老师修改/);
  const latest = R.transaction(second.data, refs, 'homework:数学', null, 'all', row => {
    row.homeworkSubjects = { ...row.homeworkSubjects, 数学: { answer: false, explanation: true } };
  }, actor);
  assert.deepEqual(R.homeworkValue(latest.data.A[0], '数学'), { answer: false, explanation: true });
  assert.equal(latest.data.A[0].updated['homework:数学'].role, 'school');
  assert.equal(R.modified(latest.data.A[0], 'homework:数学'), false);
  assert.throws(() => R.prepare(latest.data, refs, 'homework:数学', { 'A:1': mathBase }), /其他老师修改/);
});

test('老师智阅作业直达班级设置，任课老师仅显示所教科目', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  let stored, toast;
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {}, crypto: { randomUUID() { return 'test-rule-id'; } },
    schoolControlClasses: ['A'], controlClasses: ['A'], selectedTeacherClass: 'A',
    controlData: { A: [student(1), student(2)], schoolSettings: { homeroomDurationEnabled: true } },
    controlStudents() { return context.controlData.A; },
    controlDemoRole: 'teacher', controlWorkView: 'homeroom', controlModule: 'homework', controlView: 'module',
    controlLabels: { homework: '智阅作业' }, controlQuery: '', controlFilter: 'all',
    controlSelected: new Set(), adminSelectedScopes: new Set(), adminLevel: 'class', adminBatchMode: false,
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {},
    binaryToggleButton() { return ''; }, document: { getElementById() { return null; }, querySelector() { return null; } },
    localStorage: { getItem(key) { return key === 'teacher-control-prototype-v1' ? stored || null : null; }, setItem(key, value) { if (key === 'teacher-control-prototype-v1') stored = value; } },
    controlToast(message) { toast = message; }, controlOverlay() {},
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);
  context.renderControl();
  assert.equal(context.controlView,'ruleEditor');
  assert.match(context.app.innerHTML, /语文.*数学.*英语/s);
  assert.match(context.app.innerHTML, /设置智阅作业查看权限/);
  assert.doesNotMatch(context.app.innerHTML, /保留|名学生|当前状态|aria-label="智阅作业科目"/);
  assert.doesNotMatch(context.app.innerHTML, /搜索学生姓名或编号|筛选学生权限状态/);
  context.controlView = 'students'; context.renderControl();
  assert.equal(context.controlView, 'ruleEditor');
  context.controlView = 'module'; context.renderControl();
  context.parity.homeworkSubject('语文');
  context.toggleHomeworkPermission(1, 'answer', true);
  assert.equal(R.homeworkValue(JSON.parse(stored).A[0], '语文').answer, false);
  assert.equal(toast, '请设置本班查看权限');
  context.parity.editClass();
  assert.match(context.app.innerHTML, /设置智阅作业|查看答案/);
  context.controlWorkView = 'subject';
  context.controlView = 'module';
  context.renderControl();
  assert.doesNotMatch(context.app.innerHTML, /role="tab"|role="tablist"/);
  assert.match(context.app.innerHTML, /<h3>数学<\/h3>/);
  assert.doesNotMatch(context.app.innerHTML, /<h3>语文<\/h3>|<h3>英语<\/h3>/);
  context.parity.homeworkSubject('语文');
  assert.match(context.app.innerHTML, /<h3>数学<\/h3>/);
  context.toggleHomeworkPermission(1, 'explanation', true);
  assert.equal(toast, '请设置本班查看权限');
  context.openControlEditor(1);
  assert.equal(toast, '老师仅可设置班级');
});
test('智阅作业设置页平铺科目，一次保存所改权限并保留其他科目', () => {
  const fs=require('node:fs'), vm=require('node:vm');
  let stored, toast, inputs=[]; const error={textContent:''};
  const first=student(1), second=student(2); second.homeworkSubjects={语文:{answer:true,explanation:false}};
  const row=(subject,field,value)=>({dataset:{homeworkSubject:subject,homeworkField:field},value});
  const form={querySelectorAll(){return inputs;}};
  const context={controlRules:R,closeControlOverlay(){},addEventListener(){},setInterval(){},crypto:{randomUUID(){return 'test-rule-id';}},
    schoolControlClasses:['A'],controlClasses:['A'],selectedTeacherClass:'A',controlData:{A:[first,second],schoolSettings:{}},
    controlStudents(){return context.controlData.A;},controlDemoRole:'teacher',controlWorkView:'homeroom',controlModule:'homework',controlView:'module',
    controlLabels:{homework:'智阅作业'},controlQuery:'',controlFilter:'all',controlSelected:new Set(),adminSelectedScopes:new Set(),adminLevel:'school',adminBatchMode:false,
    schoolBorrowingEnabled:true,stage:'other',app:{innerHTML:''},header(title){return '<span></span><h2>'+title+'</h2>';},syncReview(){},binaryToggleButton(){return '';},
    isHeadTeacherClass(){return true;},controlRoleSwitcher(){return '';},teacherTabBar(){return '';},controlCardIcon(){return '';},
    document:{getElementById(id){return id==='parity-rule-form'?form:id==='parity-error'?error:null;}},localStorage:{getItem(key){return key==='teacher-control-prototype-v1'?stored||null:null;},setItem(key,value){if(key==='teacher-control-prototype-v1')stored=value;}},controlToast(value){toast=value;},controlOverlay(){}};
  context.window=context;vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'),'utf8'),context);
  context.parity.editClass();
  assert.match(context.app.innerHTML,/语文.*查看答案.*查看详解.*数学.*查看答案.*查看详解.*英语/s);
  assert.doesNotMatch(context.app.innerHTML,/保留|名学生|aria-label="智阅作业科目"/);
  inputs=[row('语文','explanation','true'),row('数学','answer','true'),row('数学','explanation','false'),row('英语','answer','false'),row('英语','explanation','false')];
  context.parity.saveEditor();
  assert.equal(error.textContent,'请为每个科目选择答案和详解权限');
  inputs=[row('语文','answer','false'),row('语文','explanation','true'),row('数学','answer','true'),row('数学','explanation','false'),row('英语','answer','false'),row('英语','explanation','false')];
  context.parity.saveEditor();
  const saved=JSON.parse(stored).A[0];
  assert.deepEqual(R.homeworkValue(saved,'语文'),{answer:false,explanation:true});
  assert.deepEqual(R.homeworkValue(saved,'数学'),{answer:true,explanation:false});
  assert.deepEqual(R.homeworkValue(saved,'英语'),{answer:false,explanation:false});
  assert.equal(saved.updated['homework:英语'],undefined);
  assert.equal(toast,'已保存并生效');
  context.controlWorkView='subject';context.controlView='module';context.renderControl();context.parity.editClass();
  assert.match(context.app.innerHTML,/数学.*查看答案.*查看详解/s);
  assert.doesNotMatch(context.app.innerHTML,/语文|英语/);
  inputs=[row('数学','answer','false'),row('数学','explanation','false')];
  context.parity.saveEditor();
  const after=JSON.parse(stored).A[0];
  assert.equal(R.homeworkValue(after,'数学').answer,false);
  assert.equal(R.homeworkValue(after,'语文').explanation,true);
  context.parity.editClass();
  inputs=[row('数学','answer','true'),row('数学','explanation','false')];
  const external=R.transaction(JSON.parse(stored),[{className:'A',id:1}], 'homework:数学',null,'all',entry=>{
    entry.homeworkSubjects={...entry.homeworkSubjects,数学:{answer:false,explanation:true}};
  },{by:'另一位老师',role:'subject'});
  stored=JSON.stringify(external.data);
  context.parity.saveEditor();
  assert.match(toast,/其他老师修改/);
  assert.equal(R.homeworkValue(JSON.parse(stored).A[0],'数学').explanation,true);
});

test('学校管理员统一设置各科，老师不能单独改学生', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const teacher = { by: '数学老师', role: 'subject' }, refs = [{ className: 'A', id: 1 }];
  const first = R.transaction({ A: [student(1)] }, refs, 'homework:数学', null, 'all', row => {
    row.homeworkSubjects = { 数学: { answer: false, explanation: true } };
  }, teacher);
  let stored = JSON.stringify({ ...first.data, schoolSettings: {} }), dialog;
  const form = {
    querySelectorAll() { return []; },
    querySelector(selector) {
      if (selector === '[name=parity-answer]:checked') return { value: 'true' };
      if (selector === '[name=parity-explanation]:checked') return { value: 'false' };
      return null;
    },
  };
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {}, crypto: { randomUUID() { return 'admin-rule-id'; } },
    schoolControlClasses: ['A'], controlClasses: ['A'], selectedTeacherClass: 'A',
    controlData: JSON.parse(stored), controlStudents() { return context.controlData.A; },
    controlDemoRole: 'admin', controlWorkView: 'school', controlModule: 'homework', controlView: 'module',
    controlLabels: { homework: '智阅作业' }, controlQuery: '', controlFilter: 'all',
    controlSelected: new Set(), adminSelectedScopes: new Set(), adminLevel: 'class', adminBatchMode: false,
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {},
    binaryToggleButton() {}, document: { getElementById(id) { return id === 'parity-rule-form' ? form : id === 'parity-error' ? { textContent: '' } : null; } },
    localStorage: { getItem(key) { return key === 'teacher-control-prototype-v1' ? stored : null; }, setItem(key, value) { if (key === 'teacher-control-prototype-v1') stored = value; } },
    controlToast() {}, controlOverlay(title, body, actions) { dialog = { title, body, actions }; },
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);
  context.renderControl();
  assert.doesNotMatch(context.app.innerHTML, /aria-label="智阅作业科目"/);
  assert.doesNotMatch(context.app.innerHTML, /批量设置|全选年级/);
  assert.match(context.app.innerHTML, /默认所有学生不能查看答案和详解/);
  context.adminLevel = 'school'; context.adminVisibleScopeKeys = () => ['A']; context.renderControl();
  assert.match(context.app.innerHTML, /设置全校查看权限/);
  context.parity.editSchool();
  assert.equal(dialog.title, '设置智阅作业');
  context.adminLevel = 'class'; context.renderControl();
  context.parity.editScope('A');
  assert.equal(context.controlView, 'module');
  assert.equal(dialog.title, '设置智阅作业');
  assert.match(dialog.body, /查看答案.*查看详解/);
  assert.match(dialog.actions, /parity\.saveEditor\(\)/);
  assert.doesNotMatch(dialog.body, /A · 语文|A · 数学|A · 英语/);
  assert.doesNotMatch(context.app.innerHTML, /borrow-editor-screen/);
  context.parity.saveEditor();
  assert.notEqual(dialog.title, '确认保存智阅作业？');
  const afterAdmin = JSON.parse(stored).A[0];
  assert.deepEqual(R.homeworkValue(afterAdmin, '数学'), { answer: true, explanation: false });
  assert.deepEqual(R.homeworkValue(afterAdmin, '语文'), { answer: true, explanation: false });
  assert.equal(R.modified(afterAdmin, 'homework'), false);
  assert.equal(R.modified(afterAdmin, 'homework:数学'), false);
  assert.throws(() => R.prepare(JSON.parse(stored), refs, 'homework:数学', { 'A:1': R.signature(first.data.A[0], 'homework:数学') }), /其他老师修改/);
  context.controlDemoRole = 'teacher'; context.controlWorkView = 'subject';
  context.toggleHomeworkPermission(1, 'answer', false);
  const afterTeacher = JSON.parse(stored).A[0];
  assert.deepEqual(R.homeworkValue(afterTeacher, '数学'), { answer: true, explanation: false });
  assert.deepEqual(R.homeworkValue(afterTeacher, '语文'), { answer: true, explanation: false });
  assert.equal(R.modified(afterTeacher, 'homework'), false);
});

test('管理员智阅作业弹窗在多学生范围要求选择修改范围', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  let stored, scope = null, dialog, error = { textContent: '' };
  const form = {
    querySelectorAll() { return []; },
    querySelector(selector) {
      if (selector === '[name=parity-answer]:checked') return { value: 'true' };
      if (selector === '[name=parity-explanation]:checked') return { value: 'false' };
      if (selector === '[name=parity-apply-scope]:checked') return scope ? { value: scope } : null;
      return null;
    },
  };
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {}, crypto: { randomUUID() { return 'modal-rule-id'; } },
    schoolControlClasses: ['A'], controlClasses: ['A'], selectedTeacherClass: 'A',
    controlData: { A: [student(1), student(2)], schoolSettings: {} }, controlStudents() { return context.controlData.A; },
    controlDemoRole: 'admin', controlWorkView: 'school', controlModule: 'homework', controlView: 'module',
    controlLabels: { homework: '智阅作业' }, controlQuery: '', controlFilter: 'all',
    controlSelected: new Set(), adminSelectedScopes: new Set(), adminLevel: 'class', adminBatchMode: false,
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {}, binaryToggleButton() {},
    document: { getElementById(id) { return id === 'parity-rule-form' ? form : id === 'parity-error' ? error : null; } },
    localStorage: { getItem(key) { return key === 'teacher-control-prototype-v1' ? stored || null : null; }, setItem(key, value) { if (key === 'teacher-control-prototype-v1') stored = value; } },
    controlToast() {}, controlOverlay(title, body, actions) { dialog = { title, body, actions }; },
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);
  context.renderControl(); context.parity.editScope('A');
  const beforeSave = stored;
  assert.match(dialog.body, /本次修改哪些学生/);
  assert.equal(context.controlView, 'module');
  context.closeControlOverlay();
  assert.equal(dialog.title, '放弃未保存的修改？');
  context.parity.renderEditor();
  assert.equal(dialog.title, '设置智阅作业');
  context.parity.cancelEditor(true);
  assert.equal(stored, beforeSave);
  context.parity.editScope('A');
  context.parity.saveEditor();
  assert.equal(error.textContent, '请选择本次修改范围');
  assert.equal(stored, beforeSave);
  scope = 'all'; context.parity.saveEditor();
  assert.equal(JSON.parse(stored).A.filter(row => row.answer).length, 2);
  assert.equal(context.controlView, 'module');
});

test('时长按显式星期来源保留，恢复默认标记也受保护，编辑保留其他星期', () => {
  const s = student(1);
  s.durationTeacherWeekdays = [0];
  s.durationRules = [{ ...R.copy(R.defaultDuration), id: 'teacher', weekdays: [2], source: 'homeroom' }];
  assert.deepEqual(R.durationDays(s, [0, 1, 2, 3], 'unmodified'), [1, 3]);
  assert.deepEqual(R.durationDays(s, [0, 1, 2, 3], 'all'), [0, 1, 2, 3]);
  const merged = R.mergeDuration([{ ...R.copy(R.defaultDuration), id: 'old', weekdays: [0, 1], continuousMinutes: 90 }], { ...R.copy(R.defaultDuration), id: 'new', weekdays: [0], continuousMinutes: 45 }, 'old');
  assert.equal(R.effectiveDuration({durationRules:merged}, 1).continuousMinutes, 60); // old useDefault=true still resolves fixed default
  assert.deepEqual(merged.find(rule => rule.id === 'old-retained').weekdays, [1]);
});

test('万象视界只更新实际变化学生，保留未变化学生来源及最近操作', () => {
  const data = { A: [student(1), student(2), student(3)] };
  data.A[0].world = false;
  data.A[1].worldSource = 'teacher'; data.A[1].updated.world = {version: 8, by: '老师'};
  const refs = data.A.map(s => ({className:'A',id:s.id}));
  const result = R.transaction(data, refs, 'world', null, 'all', s => { s.world = true; }, actor);
  assert.equal(result.count, 1);
  assert.equal(result.data.A[0].worldSource, 'school');
  assert.deepEqual(result.data.A[1], data.A[1]);
  assert.deepEqual(result.data.A[2], data.A[2]);
  assert.equal(R.modified({worldSource:'teacher', teacherModified:{world:false}}, 'world'), true);
});

test('指定日期生命周期按起止日期判断，只校验日期而不限制当天已过去的时段', () => {
  const rule = { ...dates('future', '2099-01-01', '2099-01-02'), periods: [{ start: '09:00', end: '10:00' }, { start: '14:00', end: '15:00' }] };
  assert.equal(R.borrowStatus(rule, new Date('2098-12-31T23:59:59')), '待生效');
  assert.equal(R.borrowStatus(rule, new Date('2099-01-01T08:59:00')), '生效中');
  assert.equal(R.borrowStatus(rule, new Date('2099-01-01T09:00:00')), '生效中');
  assert.equal(R.borrowStatus(rule, new Date('2099-01-01T10:00:00')), '生效中');
  assert.equal(R.borrowStatus(rule, new Date('2099-01-02T14:59:59')), '生效中');
  assert.equal(R.borrowStatus(rule, new Date('2099-01-02T23:59:59')), '生效中');
  assert.equal(R.borrowStatus(rule, new Date('2099-01-03T00:00:00')), '已失效');
  assert.equal(R.validateBorrow(rule, new Date('2099-01-01T08:59:00')), '');
  assert.equal(R.validateBorrow(rule, new Date('2099-01-01T20:00:00')), '');
  assert.match(R.validateBorrow(rule, new Date('2099-01-02T09:00:00')), /今天及以后/);
  const deny = dates('deny', '2099-01-01', '2099-01-02', true);
  assert.equal(R.borrowStatus(deny, new Date('2099-01-02T23:59:59')), '生效中');
  assert.equal(R.borrowStatus(deny, new Date('2099-01-03T00:00:00')), '已失效');
  assert.equal(R.validateBorrow(deny, new Date('2099-01-01T12:00:00')), '');
});

test('管理员锁屏只到年级，老师在管控首页直接设置锁屏', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  let stored, toast;
  const classes = ['五年级 1 班', '五年级 2 班'];
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {},
    schoolControlClasses: classes, controlClasses: classes, selectedTeacherClass: classes[0],
    controlData: { [classes[0]]: [student(1)], [classes[1]]: [student(2)], schoolSettings: { homeroomDurationEnabled: true } },
    controlStudents() { return context.controlData[context.selectedTeacherClass]; },
    adminAllStudents() { return classes.flatMap(name => context.controlData[name]); },
    controlRoleSwitcher() { return ''; }, teacherTabBar() { return ''; }, controlCardIcon() { return ''; }, isHeadTeacherClass() { return true; },
    controlDemoRole: 'admin', controlWorkView: 'school', controlModule: 'lock', controlView: 'module',
    controlLabels: { lock: '平板锁屏' }, controlQuery: '', controlFilter: 'all',
    controlSelected: new Set(), adminSelectedScopes: new Set(), adminLevel: 'class', adminBatchMode: false,
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {},
    binaryToggleButton() { return ''; }, document: { getElementById() { return null; } },
    localStorage: { getItem(key) { return key === 'teacher-control-prototype-v1' ? stored || null : null; }, setItem(key,value) { if(key === 'teacher-control-prototype-v1') stored=value; } },
    controlToast(message) { toast=message; }, controlOverlay() {},
  };
  context.window=context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'),'utf8'),context);
  context.renderControl();
  assert.equal(context.adminLevel,'school');
  assert.match(context.app.innerHTML, /<h3>五年级<\/h3>/);
  assert.doesNotMatch(context.app.innerHTML, /查看班级|<h3>五年级 1 班<\/h3>/);
  context.parity.editScope(classes[0]); assert.match(toast,/仅支持全校或年级/);
  const refs=classes.flatMap(className=>context.controlData[className].map(row=>({className,id:row.id})));
  context.parity.setTemporaryLocks([{key:'grade:五年级',refs}],true,true);
  assert.equal(JSON.parse(stored).schoolSettings.temporaryClassStates[classes[0]],true);
  assert.equal(JSON.parse(stored).schoolSettings.temporaryClassStates[classes[1]],true);
  context.controlDemoRole='teacher'; context.controlWorkView='homeroom'; context.controlView='module';
  context.renderControl();
  assert.equal(context.controlView,'entry');
  assert.match(context.app.innerHTML,/平板锁屏/);
  assert.doesNotMatch(context.app.innerHTML,/查看详情 ›/);
});
test('每周规则按每天独立时段执行，编辑时仍只保留一条每周规则', () => {
  const rule = { ...weekly('new', [0, 1]), dailyPeriods: { 0: [{ start: '08:00', end: '12:00' }], 1: [{ start: '13:00', end: '17:00' }] } };
  assert.equal(R.validateBorrow(rule), '');
  assert.match(R.borrowText(rule), /周一 08:00–12:00；周二 13:00–17:00/);
  assert.deepEqual(R.effectiveBorrow({ schedules: [rule] }, '2026-10-19').periods, [{ start: '08:00', end: '12:00' }]);
  assert.deepEqual(R.effectiveBorrow({ schedules: [rule] }, '2026-10-20').periods, [{ start: '13:00', end: '17:00' }]);
  const next = R.mergeBorrow([weekly('old', [0, 1, 2, 3, 4]), dates('holiday', '2099-01-01', '2099-01-03')], rule, 'old');
  assert.equal(next.filter(item => item.mode === 'weekly').length, 1);
  assert.equal(next.find(item => item.mode === 'dates').id, 'holiday');
});
test('指定日期冲突拒绝保存，全天禁止无需填写时段', () => {
  const deny = dates('deny', '2099-01-04', '2099-01-06', true);
  assert.equal(R.validateBorrow(deny), '');
  assert.throws(() => R.mergeBorrow([dates('old', '2099-01-01', '2099-01-10')], deny), /所选日期已有规则，请重新选择/);
  const next = R.mergeBorrow([dates('old', '2099-01-01', '2099-01-03')], deny);
  assert.equal(next.length, 2);
  assert.equal(R.effectiveBorrow({ schedules: next }, '2099-01-05').deny, true);
  assert.equal(R.effectiveBorrow({ schedules: next }, '2099-01-02').deny, false);
});
test('旧总开关不影响借用；过期指定日期不再遮挡每周规则', () => {
  const s = { schedules: [weekly('w', [0, 1, 2, 3, 4, 5, 6]), dates('expired', '2020-01-01', '2020-01-02', true)] };
  assert.equal(R.effectiveBorrow(s, '2026-10-19', false).deny, false);
  assert.equal(R.effectiveBorrow(s, '2026-10-19').id, 'w');
  assert.equal(R.prune(s.schedules).length, 1);
  assert.equal(R.effectiveBorrow({ schedules: [] }, '2026-10-19').deny, false);
});
test('删除指定日期恢复每周规则，删除全部规则不补造默认借用时段', () => {
  const rules = [weekly('w', [0]), dates('special', '2026-10-19', '2026-10-19', true)];
  assert.equal(R.effectiveBorrow({ schedules: rules }, '2026-10-19').deny, true);
  assert.equal(R.effectiveBorrow({ schedules: rules.filter(rule => rule.id !== 'special') }, '2026-10-19').id, 'w');
  assert.equal(R.effectiveBorrow({ schedules: [] }, '2026-10-19').reason, '未设置借用时间，默认随时可借');
  assert.equal(R.effectiveBorrow({ schedules: [weekly('w', [1])] }, '2026-10-19').deny, true);
});
test('使用时长支持多个星期规则、覆盖拆分以及默认规则回退', () => {
  const old = { id: 'old', weekdays: [0, 1, 2, 3, 4], continuousMinutes: 60, restMinutes: 15, dailyMinutes: 180, periods: [{ start: '08:00', end: '17:00' }] };
  const next = { ...old, id: 'new', weekdays: [0], continuousMinutes: 30 };
  const rules = R.mergeDuration([old], next);
  assert.deepEqual(rules[0].weekdays, [1, 2, 3, 4]);
  assert.equal(R.effectiveDuration({ durationRules: rules }, 0).continuousMinutes, 30);
  assert.equal(R.effectiveDuration({ durationRules: rules }, 6).source, '默认规则');
  assert.equal(R.effectiveDuration({ durationRules: [] }, 0).unavailable, false);
  assert.equal(R.effectiveDuration({ durationRules: [] }, 0).allDay, true);
  assert.equal(R.effectiveDuration({ durationRules: [{ ...next, useDefault: true }] }, 0).allDay, true);
});
test('空可用时段代表全天可用且仍受时长限制，填写时段仍校验重叠和跨日', () => {
  assert.equal(R.validatePeriods([], true), '');
  assert.match(R.durationText(R.defaultDuration), /全天可用/);
  assert.doesNotMatch(R.durationText(R.defaultDuration), /（仍受时长限制）/);
  assert.notEqual(R.validatePeriods([]), '');
  assert.notEqual(R.validatePeriods([{ start: '10:00', end: '09:00' }], true), '');
  assert.notEqual(R.validatePeriods([{ start: '08:00', end: '10:00' }, { start: '09:00', end: '11:00' }]), '');
});
test('仅修改未单独设置学生：按模块保留老师设置，实际人数去重', () => {
  const data = { A: [student(1), student(2)] };
  data.A[0].teacherModified.duration = true;
  data.A[0].durationRules = [{ id: 'teacher-rule', weekdays: [0] }];
  data.A[1].teacherModified.homework = true;
  const refs = [{ className: 'A', id: 1 }, { className: 'A', id: 2 }, { className: 'A', id: 2 }];
  const result = R.transaction(data, refs, 'duration', null, 'unmodified', s => s.durationRules = [{ id: 'new' }], actor);
  assert.equal(result.count, 1);
  assert.equal(result.data.A[0].durationRules[0].id, 'teacher-rule');
  assert.equal(result.data.A[1].durationRules[0].id, 'new');
  assert.deepEqual(data.A[1].durationRules, []);
});
test('任一所选学生版本变化时整批拒绝，包括确认后再次变更', () => {
  const data = { A: [student(1), student(2)] }, refs = [{ className: 'A', id: 1 }, { className: 'A', id: 2 }];
  const base = Object.fromEntries(refs.map(ref => [ref.className + ':' + ref.id, R.signature(data.A.find(s => s.id === ref.id), 'homework')]));
  data.A[1].updated.homework = { version: 2 };
  assert.throws(() => R.transaction(data, refs, 'homework', base, 'all', s => s.answer = true, actor), /其他老师修改/);
  assert.equal(data.A[0].answer, false);
  assert.equal(data.A[1].answer, false);
});
test('保存瞬间重新计算未单独设置范围，无对象不修改数据', () => {
  const data = { A: [student(1)] }, refs = [{ className: 'A', id: 1 }];
  data.A[0].teacherModified.borrowing = true;
  data.A[0].schedules = [weekly('teacher-rule', [0])];
  const result = R.transaction(data, refs, 'borrowing', null, 'unmodified', s => s.schedules = [weekly('n', [0])], actor);
  assert.equal(result.count, 0);
  assert.equal(result.data, data);
  assert.throws(() => R.transaction(data, [...refs, { className: 'missing', id: 3 }], 'borrowing', null, 'all', () => {}, actor), /操作对象/);
});
test('每个模块独立记录操作人与版本，修改锁屏不覆盖作业元数据', () => {
  const data = { A: [student(1)] }, refs = [{ className: 'A', id: 1 }];
  const one = R.transaction(data, refs, 'homework', null, 'all', s => s.answer = true, { by: '陈老师', role: 'homeroom' });
  const two = R.transaction(one.data, refs, 'lock', null, 'all', s => s.locked = true, actor);
  assert.equal(two.data.A[0].updated.homework.by, '陈老师');
  assert.equal(two.data.A[0].updated.lock.by, '管理员');
  assert.equal(two.data.A[0].teacherModified.homework, true);
  assert.equal(two.data.A[0].teacherModified.lock, false);
});
test('单独规则删除或过期后回归默认，不再被当作老师当前单独设置', () => {
  const s = student(1);
  s.teacherModified.borrowing = true;
  s.schedules = [dates('expired', '2020-01-01', '2020-01-02')];
  assert.equal(R.modified(s, 'borrowing'), false);
  s.teacherModified.duration = true;
  assert.equal(R.modified(s, 'duration'), false);
  s.durationRules = [{ id: 'custom', weekdays: [0] }];
  assert.equal(R.modified(s, 'duration'), true);
});

test('删除预览只计算含目标规则的学生，未匹配学生不发生写入', () => {
  const data = { A: [student(1), student(2)] };
  data.A[0].schedules = [weekly('target', [0]), weekly('keep', [1])];
  data.A[1].schedules = [weekly('other', [2])];
  const rows = R.resolve(data, [{ className: 'A', id: 1 }, { className: 'A', id: 2 }]);
  const preview = R.deletionPreview(rows, 'borrowing', { ruleId: 'target' });
  assert.equal(preview.refs.length, 1);
  assert.equal(preview.unchanged, 1);
  assert.deepEqual(preview.rules.map(rule => rule.id), ['target']);
  const result = R.transaction(data, preview.refs, 'borrowing', null, 'all', s => s.schedules = s.schedules.filter(rule => rule.id !== 'target'), actor);
  assert.equal(result.count, 1);
  assert.deepEqual(result.data.A[0].schedules.map(rule => rule.id), ['keep']);
  assert.deepEqual(result.data.A[1], data.A[1]);
});

test('全校删除弹窗对齐教师端：目标规则、回退说明和确认删除，不混排剩余规则', () => {
  const fs = require('node:fs');
  const vm = require('node:vm');
  let dialog;
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {},
    schoolControlClasses: ['A'], controlData: { A: [student(1), student(2)] },
    controlDemoRole: 'admin', controlWorkView: 'school', controlModule: 'borrowing',
    schoolBorrowingEnabled: true, stage: 'other',
    localStorage: { getItem() { return null; }, setItem() {} },
    controlToast(text) { throw Error(text); }, controlOverlay(title, body, actions) { dialog = { title, body, actions }; },
  };
  context.controlData.A[0].schedules = [dates('target', '2099-01-01', '2099-01-02'), weekly('keep', [0])];
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);
  context.parity.schoolBorrowDelete('target');
  assert.equal(dialog.title, '确认删除全校借用规则？');
  assert.match(dialog.body, /2099-01-01 至 2099-01-02/);
  assert.match(dialog.body, /恢复每周固定借用规则/);
  assert.match(dialog.body, /实际影响 2 名学生/);
  assert.equal(context.controlData.A[1].schedules[0].id, 'target');
  assert.deepEqual(Array.from(context.controlData.A[1].legacyBorrowingRules), []);
  assert.doesNotMatch(dialog.body, /周一|操作后实际生效规则|以保存后的规则为准/);
  assert.match(dialog.actions, /确认删除/);
  assert.doesNotMatch(dialog.actions, /确认生效/);
});

test('借用管控上下展示两类规则，悬浮新增选择类型，编辑删除为图标', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {},
    schoolControlClasses: ['A'], controlData: { A: [student(1)] },
    controlDemoRole: 'admin', controlWorkView: 'school', controlModule: 'borrowing', controlView: 'module',
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header() { return '<span></span><h2>借用管控</h2>'; }, syncReview() {},
    localStorage: { getItem() { return null; }, setItem() {} },
  };
  context.controlData.A[0].schedules = [weekly('weekly-rule', [0]), dates('date-rule', '2099-01-01', '2099-01-02'), dates('expired-rule', '2020-01-01', '2020-01-02')];
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);
  context.renderControl();
  const html = context.app.innerHTML;
  assert.equal((html.match(/class="parity-borrow-section"/g) || []).length, 2);
  assert.ok(html.indexOf('aria-label="每周固定借用规则"') < html.indexOf('aria-label="指定日期借用规则"'));
  assert.equal((html.match(/parity.newBorrowRule\(\)/g) || []).length, 1);
  assert.match(html, /parity-borrow-floating/);
  assert.equal((html.match(/aria-label="编辑规则"/g) || []).length, 2);
  assert.equal((html.match(/aria-label="删除规则"/g) || []).length, 3);
  assert.match(html, /已失效/);
  assert.match(html, /待生效/);
  assert.doesNotMatch(html, /schoolBorrowEdit\('expired-rule'\)/);
  assert.match(html, /schoolBorrowDelete\('expired-rule'\)/);
  assert.equal(context.controlData.A[0].schedules.length, 3);
  assert.doesNotMatch(html, />编辑<|>删除</);
  assert.match(html, /weekly-rule/);
  assert.match(html, /date-rule/);
  assert.doesNotMatch(html, /schoolBorrowMode/);
  let dialog;
  context.controlOverlay = (title, body, actions) => { dialog = { title, body, actions }; };
  context.parity.newBorrowRule();
  assert.equal(dialog.title, '新增借用规则');
  assert.match(dialog.body, /chooseBorrowType\('weekly'\)/);
  assert.match(dialog.body, /chooseBorrowType\('dates'\)/);
  assert.match(dialog.actions, /取消/);
});

test('老师锁屏只按班级设置，万象视界可单独开放所选学生', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const locked = student(1), unlocked = student(2);
  let dialog, toast;
  locked.locked = true;
  locked.world = true;
  unlocked.locked = false;
  unlocked.world = false;
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {},
    controlOverlay(title, body, actions) { dialog = { title, body, actions }; }, controlToast(message) { toast = message; },
    schoolControlClasses: ['A'], controlClasses: ['A'], selectedTeacherClass: 'A',
    controlData: { A: [locked, unlocked] }, controlStudents() { return context.controlData.A; },
    controlDemoRole: 'teacher', controlWorkView: 'homeroom', controlModule: 'lock', controlView: 'students',
    controlLabels: { lock: '平板锁屏', world: '万象视界' }, controlQuery: '', controlFilter: 'all',
    controlSelected: new Set(), adminSelectedScopes: new Set(), adminBulkRefs: [], adminLevel: 'class', adminBatchMode: false,
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {},
    controlRoleSwitcher() { return ''; }, teacherTabBar() { return ''; }, controlCardIcon() { return ''; }, isHeadTeacherClass() { return true; },
    document: { getElementById() { return null; } },
    localStorage: { getItem() { return null; }, setItem() {} },
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);

  const renderActions = (module, ids) => {
    context.controlModule = module;
    context.controlView = 'students';
    context.controlSelected.clear();
    ids.forEach(id => context.controlSelected.add(id));
    context.renderControl();
    return context.app.innerHTML;
  };
  const lock = renderActions('lock', [1, 2]);
  assert.equal(context.controlView, 'entry');
  assert.match(lock, /设置锁屏/);
  assert.doesNotMatch(lock, /选择学生|selectedBoolean|查看详情 ›/);
  context.parity.teacherLockChoice('all');
  assert.equal(dialog.title, '设置锁屏');
  assert.match(dialog.body, /1 人将解锁/);
  assert.match(dialog.body, /1 人将锁屏/);
  context.parity.saveTeacherLock(); assert.equal(toast, '请选择设置后的状态');
  context.parity.cancelTeacherLock();
  const world = renderActions('world', [2]);
  assert.match(world, /选择要开放的学生/);
  assert.match(world, /开放所选学生/);
  assert.doesNotMatch(world, /selectedBoolean\(false\)|>禁止使用<\/button>/);
  context.parity.selectedBoolean(false); assert.equal(toast, '当前仅可单独开放万象视界');
  context.parity.selectedBoolean(true); assert.equal(dialog.title, '确认开放万象视界？');
  context.controlView = 'module'; context.renderControl();
  assert.match(context.app.innerHTML, /设置全班使用状态/);
  assert.match(context.app.innerHTML, /单独开放学生/);
});
