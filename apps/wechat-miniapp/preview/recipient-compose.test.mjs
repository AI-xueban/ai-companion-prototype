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
  .replace('    renderTeacher() {', '    inspect: () => store, inspectDraft: () => draft, renderTeacher() {');
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
