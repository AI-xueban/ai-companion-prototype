const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('三个保存异常进入时不提示，只点击保存才提示且不重绘表单', () => {
  let click, renders = 0;
  const toasts = [];
  const app = {childNodes: [], contains() {return true;}, querySelector() {return {setAttribute() {}};}};
  const context = vm.createContext({app, window: {parity: {renderDemoPage() {renders++;}}}, document: {addEventListener(type, fn) {if(type === 'click') click = fn;}}, stage: 'teacherDesk', teacherTab: 'control', controlToast: value => toasts.push(value)});
  vm.runInContext(fs.readFileSync(__dirname + '/control-page-demo.js', 'utf8'), context);
  const simulate = action => {
    const button = {closest() {return null;}, getAttribute() {return action;}};
    click({target: {closest() {return button;}}, preventDefault() {}, stopImmediatePropagation() {}});
  };
  for (const id of ['changed', 'removed', 'saveFailed']) {
    const before = toasts.length;
    context.window.controlPageDemo.select(id);
    assert.equal(toasts.length, before);
    simulate('parity.fillDefault()');
    assert.equal(toasts.length, before);
    const count = renders;
    simulate('parity.saveEditor()');
    assert.equal(toasts.length, before + 1);
    assert.equal(renders, count);
  }
  assert.deepEqual(toasts, ['规则已更新，请刷新后重试', '所选学生信息有变化，请刷新后重新选择', '保存失败，请重试']);
});
test('关闭权限每轮首次进入提醒，开启时不提醒', () => {
  const source = fs.readFileSync(__dirname + '/control-parity.js', 'utf8');
  const helper = source.slice(source.indexOf('  let durationNoticeOpen'), source.indexOf('  // 总开关'));
  const values = new Map(), overlay = {innerHTML: ''};
  let latest = {schoolSettings: {homeroomDurationEnabled: false, durationPermissionRevision: 1}};
  const ctx = vm.createContext({window: {}, document: {getElementById() {return overlay;}}, localStorage: {getItem(k) {return values.get(k);}}, loadLatest: () => latest, durationAllowed: d => d.schoolSettings.homeroomDurationEnabled, controlWorkView: 'homeroom', controlModule: 'duration', controlView: 'module'});
  vm.runInContext(helper + '\ncheckDurationNotice();', ctx);
  assert.ok(overlay.innerHTML.includes('现在只能查看'));
  values.set('teacher-duration-permission-seen', '1'); overlay.innerHTML = '';
  vm.runInContext('durationNoticeOpen=false;checkDurationNotice();', ctx);
  assert.equal(overlay.innerHTML, '');
  latest.schoolSettings = {homeroomDurationEnabled: true, durationPermissionRevision: 2};
  vm.runInContext('checkDurationNotice();', ctx);
  assert.equal(overlay.innerHTML, '');
  latest.schoolSettings = {homeroomDurationEnabled: false, durationPermissionRevision: 3};
  vm.runInContext('checkDurationNotice();', ctx);
  assert.ok(overlay.innerHTML.includes('现在只能查看'));
});
test('仅保留当前原型不能直接演示的异常，切换及恢复不修改业务数据', () => {
  const original = {page: 'original'};
  const app = {childNodes: [original], innerHTML: '', querySelector() { return {setAttribute() {}}; }, replaceChildren(...nodes) { this.childNodes = nodes; }};
  const borrowingCalls = [];
  const context = vm.createContext({window: {borrowing: {demoStart(kind) { borrowingCalls.push('start:'+kind); app.innerHTML = '<main class="screen"></main>'; }, demoAcknowledge() { borrowingCalls.push('ack'); }, demoRestore() { borrowingCalls.push('restore'); }}}, app, header: title => `<header>${title}</header>`, teacherTabBar: () => '<nav>tabs</nav>', stage: 'teacherDesk', teacherTab: 'control'});
  vm.runInContext(fs.readFileSync(__dirname + '/control-page-demo.js', 'utf8'), context);
  const demo = context.window.controlPageDemo;
  const initial = demo.context();
  assert.equal(initial.title, '管控');
  assert.equal(new Set(initial.choices.map(item => item.id)).size, initial.choices.length);
  assert.equal(new Set(initial.choices.map(item => item.group)).size, 4);
  assert.equal(initial.choices.map(item => item.id).join(','), 'noClasses,noStudents,durationRevoked,lockStarted,borrowTemporaryStarted,borrowTimesChanged,accountRemoved,loadFailed,changed,removed,saveFailed');
  assert.equal(initial.choices.find(item => item.id === 'noClasses').label, '老师未分配班级');
  assert.equal(initial.choices.find(item => item.id === 'saveFailed').label, '保存时网络或服务异常');
  for (const choice of initial.choices) {
    assert.ok(choice.hint);
    if (choice.id.startsWith('borrow')) {
      demo.select(choice.id);
      assert.equal(demo.context().active, choice.id);
      demo.dismiss();
      demo.restore();
      continue;
    }
    demo.select(choice.id);
    assert.equal(demo.context().active, choice.id);
    assert.ok(app.innerHTML.includes(`data-control-demo="${choice.id}"`));
    assert.ok(app.innerHTML.includes('controlPageDemo.retry()'));
    demo.retry();
    assert.ok(app.innerHTML.includes('当前异常仍未解除'));
  }
  assert.deepEqual(borrowingCalls, ['start:temporary','ack','restore','start:times','ack','restore']);
  demo.restore();
  assert.equal(demo.context().active, '');
  assert.equal(app.childNodes[0], original);
  let acknowledged = false;
  context.window.parity = {acknowledgeDurationRevoked() { acknowledged = true; }};
  demo.select('durationRevoked');
  demo.dismiss();
  assert.equal(acknowledged, true);
  assert.equal(demo.isActive(), false);
  demo.select('invalid');
  assert.equal(demo.context().active, '');
  context.teacherTab = 'learning';
  assert.equal(demo.context(), null);
});
