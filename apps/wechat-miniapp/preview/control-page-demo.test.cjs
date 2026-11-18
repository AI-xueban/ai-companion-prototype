const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
test('保留的保存冲突在点击保存时处理并关闭编辑', () => {
  let click, renders = 0; const closed = [];
  const toasts = [];
  const app = {childNodes: [], contains() {return true;}, querySelector() {return {setAttribute() {}};}};
  const context = vm.createContext({app, window: {parity: {renderDemoPage(kind, closeEditor) {renders++; if (closeEditor) closed.push(kind);}}}, document: {addEventListener(type, fn) {if(type === 'click') click = fn;}}, stage: 'teacherDesk', teacherTab: 'control', controlToast: value => toasts.push(value)});
  vm.runInContext(fs.readFileSync(__dirname + '/control-page-demo.js', 'utf8'), context);
  const simulate = action => {
    const button = {closest() {return null;}, getAttribute() {return action;}};
    click({target: {closest() {return button;}}, preventDefault() {}, stopImmediatePropagation() {}});
  };
  for (const id of ['changed', 'removed']) {
    const before = toasts.length;
    context.window.controlPageDemo.select(id);
    assert.equal(toasts.length, before);
    simulate('parity.fillDefault()');
    assert.equal(toasts.length, before);
    const count = renders;
    simulate('parity.saveEditor()');
    assert.equal(toasts.length, before + 1);
    assert.equal(renders, count + (id === 'saveFailed' ? 0 : 1));
  }
  assert.deepEqual(closed, ['changed','removed']);
  assert.deepEqual(toasts, ['规则已更新，请刷新后重试', '所选学生信息有变化，请刷新后重新选择']);
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
  assert.equal(new Set(initial.choices.map(item => item.group)).size, 2);
  assert.equal(initial.choices.map(item => item.id).join(','), 'lockStarted,borrowTemporaryStarted,borrowTimesChanged,changed,removed');
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
  demo.select('invalid');
  assert.equal(demo.context().active, '');
  context.teacherTab = 'learning';
  assert.equal(demo.context(), null);
});
test('移除的场景不可从旧链接或目录重新进入',()=>{
 const app={childNodes:[],innerHTML:'当前管控页面'};
 const context=vm.createContext({app,window:{},stage:'teacherDesk',teacherTab:'control'});
 vm.runInContext(fs.readFileSync(__dirname+'/control-page-demo.js','utf8'),context);
 const demo=context.window.controlPageDemo;
 for(const id of ['adminNoGrades','adminNoClasses','noClasses','noStudents','classRevoked','accountRemoved','loadFailed','saveFailed']){
   demo.select(id);assert.equal(demo.context().active,'');assert.equal(app.innerHTML,'当前管控页面');
   assert.equal(demo.context().choices.some(item=>item.id===id),false);
 }
});
