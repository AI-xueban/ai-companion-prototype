const { test } = require('node:test');
const assert = require('node:assert/strict');
const R = require('./control-rules.js');
const weekly = (id, days, start = '08:00') => ({ id, mode: 'weekly', weekdays: days, startDate: '', endDate: '', deny: false, periods: [{ start, end: '17:30' }] });
const dates = (id, startDate, endDate, deny = false) => ({ id, mode: 'dates', weekdays: [], startDate, endDate, deny, periods: deny ? [] : [{ start: '09:00', end: '10:00' }] });
const student = id => ({ id, name: '学生' + id, schedules: [], durationRules: [], answer: false, explanation: false, world: true, locked: false, updated: {}, teacherModified: {} });
const actor = { by: '管理员', phone: '13800138000', role: 'school' };

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

test('全校、年级、班级临时锁屏保留原状态，范围重叠及教师权限正确', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  let stored, toast, dialog;
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {},
    schoolControlClasses: ['A'], controlClasses: ['A'], selectedTeacherClass: 'A',
    controlData: { A: [student(1), student(2)], schoolSettings: { homeroomDurationEnabled: true } }, controlStudents() { return context.controlData.A; },
    controlDemoRole: 'admin', controlWorkView: 'school', controlModule: 'lock', controlView: 'students',
    controlLabels: { lock: '平板锁屏' }, controlQuery: '', controlFilter: 'all',
    controlSelected: new Set([1, 2]), adminSelectedScopes: new Set(), adminLevel: 'class', adminBatchMode: false,
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {},
    binaryToggleButton(module, on, action, label) { return `<button onclick="${action}" aria-label="${label}" aria-checked="${on}"></button>`; },
    adminVisibleScopeKeys() { return ['A']; }, adminSelectionRefs() { return context.adminSelectedScopes.has('A') ? context.controlData.A.map(s => ({ className: 'A', id: s.id })) : []; },
    document: { getElementById() { return null; } },
    localStorage: { getItem(key) { return key === 'teacher-control-prototype-v1' ? stored || null : null; }, setItem(key, value) { if (key === 'teacher-control-prototype-v1') stored = value; } },
    controlToast(message) { toast = message; }, controlOverlay(title) { dialog = title; },
  };
  context.controlData.A[0].locked = true;
  context.controlData.A[0].updated.homework = { by: '作业老师', at: '2026/10/18 09:00:00', version: 7 };
  context.window = context;
  const code = fs.readFileSync(require.resolve('./control-parity.js'), 'utf8');
  vm.runInNewContext(code, context);
  context.parity.toggleTemporaryLock(undefined, true);
  assert.equal(JSON.parse(stored).schoolSettings.temporaryLock.active, true);
  assert.deepEqual(JSON.parse(stored).A.map(s => s.locked), [true, false]);
  assert.equal(JSON.parse(stored).A[0].updated.lock.by, '学校管理员');
  assert.equal(JSON.parse(stored).A[0].updated.lock.version, 1);
  assert.equal(JSON.parse(stored).A[0].updated.homework.by, '作业老师');
  assert.doesNotMatch(context.app.innerHTML, /最近操作/);
  assert.doesNotMatch(context.app.innerHTML, /平板未锁屏/);
  assert.match(context.app.innerHTML, /临时锁屏/);
  context.controlData = JSON.parse(stored);
  vm.runInNewContext(code, context);
  context.renderControl();
  assert.doesNotMatch(context.app.innerHTML, /平板未锁屏/);
  for (const role of ['homeroom', 'subject']) {
    context.controlDemoRole = 'teacher'; context.controlWorkView = role;
    context.confirmControl('all', false);
    assert.equal(dialog, undefined);
    assert.match(toast, /临时锁屏管控/);
    assert.deepEqual(JSON.parse(stored).A.map(s => s.locked), [true, false]);
    context.parity.toggleTemporaryLock(undefined, true);
    assert.equal(JSON.parse(stored).schoolSettings.temporaryLock.active, true);
  }
  context.controlDemoRole = 'admin'; context.controlWorkView = 'school';
  context.parity.toggleTemporaryLock(undefined, true);
  assert.equal(JSON.parse(stored).schoolSettings.temporaryLock.active, false);
  assert.deepEqual(JSON.parse(stored).A.map(s => s.locked), [true, false]);
  assert.match(context.app.innerHTML, /未开启临时锁屏/);
  assert.doesNotMatch(context.app.innerHTML, /搜索学生|openControlStudentDetail|enterAdminClass/);
  context.confirmControl(1, false);
  assert.match(toast, /仅支持全校、年级或班级/);
  const grade = { key: 'grade:五年级', refs: [{ className: 'A', id: 1 }, { className: 'A', id: 2 }] };
  const classScope = { key: 'class:A', refs: [{ className: 'A', id: 1 }, { className: 'A', id: 2 }] };
  context.parity.setTemporaryLocks([grade], true, true);
  context.parity.setTemporaryLocks([classScope], true, true);
  context.controlDemoRole = 'teacher'; context.controlWorkView = 'homeroom';
  context.confirmControl('all', false);
  assert.match(toast, /临时锁屏/);
  assert.equal(dialog, undefined);
  context.controlDemoRole = 'admin'; context.controlWorkView = 'school';
  context.parity.setTemporaryLocks([classScope], false, true);
  assert.doesNotMatch(context.app.innerHTML, /平板未锁屏/);
  context.parity.toggleTemporaryLock(true, true);
  context.parity.toggleTemporaryLock(false, true);
  assert.doesNotMatch(context.app.innerHTML, /平板未锁屏/);
  context.parity.setTemporaryLocks([grade], false, true);
  assert.match(context.app.innerHTML, /未开启临时锁屏/);
  assert.deepEqual(JSON.parse(stored).A.map(s => s.locked), [true, false]);
  assert.ok(JSON.parse(stored).A[0].updated.lock.version > 1);
  assert.equal(JSON.parse(stored).A[0].updated.homework.version, 7);
  // 全校会话仍开启，但班级解除后老师恢复原有操作权限。
  context.parity.toggleTemporaryLock(true, true);
  context.controlData.A.push(student(3)); stored = JSON.stringify(context.controlData);
  context.parity.setTemporaryLocks([{key:'class:A',refs:context.controlData.A.map(s => ({className:'A',id:s.id}))}], false, true);
  assert.equal(JSON.parse(stored).schoolSettings.temporaryLock.active, true);
  context.controlDemoRole = 'teacher'; context.controlWorkView = 'homeroom';
  toast = ''; dialog = '';
  context.confirmControl('all', false);
  assert.doesNotMatch(toast, /临时锁屏管控/);
  assert.ok(dialog, '已解除班级可以进入普通锁屏确认');
  context.controlModule = 'borrowing'; context.openControlEditor('all');
  assert.match(toast, /老师仅可查看/);
  context.controlModule = 'duration'; context.controlData.schoolSettings.homeroomDurationEnabled = false;
  stored = JSON.stringify(context.controlData); context.openControlEditor('all');
  assert.match(toast, /暂未开放/);
  context.controlModule = 'lock'; context.controlDemoRole = 'admin'; context.controlWorkView = 'school';
  context.parity.toggleTemporaryLock(false, true);
  assert.equal(JSON.parse(stored).schoolSettings.temporaryLock.active, false);
  assert.deepEqual(JSON.parse(stored).A.map(s => Boolean(s.locked)), [true, false, false]);
});

for (const role of ['school', 'homeroom']) for (const type of (role === 'school' ? ['weekly', 'dates', 'duration'] : ['duration'])) {
  test(`${role}的${type}保存确认只展示本次规则，不混入学生历史配置`, () => {
    const fs = require('node:fs'), vm = require('node:vm');
    let dialog;
    const form = {
      querySelectorAll(selector) {
        if (selector.includes('parity-days')) return [{ dataset: { day: '0' } }];
        return [{ querySelectorAll() { return [{ value: '09:00' }, { value: '10:00' }]; } }];
      },
      querySelector(selector) {
        const values = { '#parity-date-start': '2099-01-01', '#parity-date-end': '2099-01-02', '#parity-continuousMinutes': '55', '#parity-restMinutes': '11', '#parity-dailyMinutes': '155' };
        if (selector.includes('parity-apply-scope')) return { value: 'all' };
        if (selector === '#parity-periods') return {};
        return values[selector] ? { value: values[selector] } : null;
      },
    };
    const context = {
      controlRules: R, crypto: require('node:crypto').webcrypto,
      closeControlOverlay() {}, addEventListener() {}, setInterval() {},
      schoolControlClasses: ['A'], controlClasses: ['A'], selectedTeacherClass: 'A',
      controlData: { A: [student(1), student(2)], schoolSettings: { homeroomDurationEnabled: true } }, controlStudents() { return context.controlData.A; },
      controlDemoRole: role === 'school' ? 'admin' : 'teacher', controlWorkView: role,
      controlModule: type === 'duration' ? 'duration' : 'borrowing', controlView: 'module', adminLevel: 'grade',
      controlLabels: { borrowing: '借用管控', duration: '使用时长管控' },
      schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
      header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {},
      localStorage: { getItem() { return null; }, setItem() {} },
      document: { getElementById(id) { return id === 'parity-rule-form' ? form : { textContent: '' }; } },
      controlOverlay(title, body, actions) { dialog = { title, body, actions }; },
      controlToast(text) { throw Error(text); },
    };
    context.controlData.A.forEach((s, index) => {
      s.schedules = [weekly('old-' + index, [0, index + 1]), dates('old-date-' + index, '2099-02-01', '2099-02-02')];
      s.durationRules = [{ id: 'duration-' + index, weekdays: [index + 1], continuousMinutes: 88, restMinutes: 22, dailyMinutes: 300, periods: [{ start: '08:00', end: '17:30' }] }];
    });
    context.window = context;
    vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);
    context.openControlEditor('all');
    if (type === 'dates') context.parity.editorMode('dates');
    if (role === 'school' && type === 'dates') {
      assert.match(context.app.innerHTML, /默认对全校学生生效/);
      assert.doesNotMatch(context.app.innerHTML, /name="parity-apply-scope"/);
    }
    context.parity.saveEditor();
    assert.ok(dialog, '应进入保存确认弹窗');
    if (type === 'dates') {
      assert.match(dialog.actions, />保存<\/button>/);
      assert.doesNotMatch(dialog.actions, /确认生效/);
    }
    const preview = dialog.body.match(/<div class="parity-preview">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(preview);
    assert.match(preview, /09:00–10:00/);
    assert.doesNotMatch(preview, /08:00|17:30|2099-02|88 分钟|300 分钟/);
    assert.equal((preview.match(/<p>/g) || []).length, 1);
    assert.match(dialog.body, /实际影响 2 名学生/);
  });
}
test('借用规则只覆盖重叠星期，保留其他星期及不同类型规则', () => {
  const next = R.mergeBorrow([weekly('old', [0, 1, 2, 3, 4]), dates('holiday', '2099-01-01', '2099-01-03')], weekly('new', [0, 1], '09:00'));
  assert.deepEqual(next.find(r => r.id === 'old').weekdays, [2, 3, 4]);
  assert.equal(next.length, 3);
});
test('指定日期冲突按起止日期拆分，全天禁止无需填写时段', () => {
  const deny = dates('deny', '2099-01-04', '2099-01-06', true);
  assert.equal(R.validateBorrow(deny), '');
  const next = R.mergeBorrow([dates('old', '2099-01-01', '2099-01-10')], deny);
  assert.deepEqual(next.map(r => [r.startDate, r.endDate]), [['2099-01-01', '2099-01-03'], ['2099-01-07', '2099-01-10'], ['2099-01-04', '2099-01-06']]);
  assert.equal(R.effectiveBorrow({ schedules: next }, '2099-01-05').deny, true);
  assert.equal(R.effectiveBorrow({ schedules: next }, '2099-01-08').deny, false);
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

test('老师锁屏保留反向动作，万象视界统一进入未预选状态的设置', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const locked = student(1), unlocked = student(2);
  locked.locked = true;
  locked.world = true;
  unlocked.locked = false;
  unlocked.world = false;
  const context = {
    controlRules: R, closeControlOverlay() {}, addEventListener() {}, setInterval() {},
    schoolControlClasses: ['A'], controlClasses: ['A'], selectedTeacherClass: 'A',
    controlData: { A: [locked, unlocked] }, controlStudents() { return context.controlData.A; },
    controlDemoRole: 'teacher', controlWorkView: 'homeroom', controlModule: 'lock', controlView: 'students',
    controlLabels: { lock: '平板锁屏', world: '万象视界' }, controlQuery: '', controlFilter: 'all',
    controlSelected: new Set(), adminSelectedScopes: new Set(), adminBulkRefs: [], adminLevel: 'class', adminBatchMode: false,
    schoolBorrowingEnabled: true, stage: 'other', app: { innerHTML: '' },
    header(title) { return '<span></span><h2>' + title + '</h2>'; }, syncReview() {},
    localStorage: { getItem() { return null; }, setItem() {} },
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(require.resolve('./control-parity.js'), 'utf8'), context);

  const renderActions = (module, ids) => {
    context.controlModule = module;
    context.controlSelected.clear();
    ids.forEach(id => context.controlSelected.add(id));
    context.renderControl();
    return context.app.innerHTML;
  };
  for (const [module, offLabel, onLabel] of [['lock', '解锁', '锁屏'], ['world', '禁止使用', '允许使用']]) {
    const activeOnly = renderActions(module, [1]);
    assert.match(activeOnly, /parity\.selectedBoolean\(false\)/);
    assert.doesNotMatch(activeOnly, /parity\.selectedBoolean\(true\)/);
    assert.match(activeOnly, new RegExp('>' + offLabel + '<'));

    const inactiveOnly = renderActions(module, [2]);
    assert.doesNotMatch(inactiveOnly, /parity\.selectedBoolean\(false\)/);
    assert.match(inactiveOnly, /parity\.selectedBoolean\(true\)/);
    assert.match(inactiveOnly, new RegExp('>' + onLabel + '<'));

    const mixed = renderActions(module, [1, 2]);
    assert.match(mixed, /parity\.selectedBoolean\(false\)/);
    assert.match(mixed, /parity\.selectedBoolean\(true\)/);
  }
  for (const ids of [[1], [2], [1, 2]]) {
    const html = renderActions('world', ids);
    assert.doesNotMatch(html, /设置使用状态/);
    assert.match(html, /parity\.selectedBoolean/);
  }
});
