import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const tutor = {};
vm.runInNewContext(ts.transpileModule(readFileSync(new URL('../miniprogram/services/homeworkTutor.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText, { exports: tutor });
const timers = new Map();
let nextTimer = 0;
let savedReason = '';
const window = { homeworkTutor: tutor, addEventListener() {}, dispatchEvent() {} };
const document = { body: {}, addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } };
vm.runInNewContext(readFileSync(new URL('./homework-tutor.js', import.meta.url), 'utf8'), {
  window, document, Event: class {}, MutationObserver: class { observe() {} },
  setTimeout(fn) { const id = ++nextTimer; timers.set(id, fn); return id; },
  clearTimeout(id) { timers.delete(id); },
});
const flush = () => { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } };
const ui = window.homeworkTutorUI;
const context = {
  review: true,
  source: { accountId: 'guardian', studentId: 'child', taskId: 'task', itemId: 'item', submissionVersion: 1,
    question: { id: 'ratio', stem: '男生24人对应4份，全班7份，全班多少人？', answer: '42人', state: 'confirmed' } },
  label: '第21题', images: [], isSaved: () => Boolean(savedReason), saveMistake: reason => { savedReason = reason; return true; },
};
ui.open(context, { render() {}, valid: () => true, leave() {} });
assert.equal(ui.active(), true);
assert.match(ui.html(), /1 对 1 讲题/);
ui.reviewState('waiting');
assert.equal(ui.inspect().phase, 'waiting');
ui.answer('先求一袋有几个');
flush();
assert.equal(ui.inspect().phase, 'feedback');
ui.saveMistake();
assert.match(ui.html(), /选择错因/);
ui.chooseReason('知识点不熟');
ui.confirmMistake();
assert.equal(savedReason, '知识点不熟');
ui.close();
assert.equal(ui.active(), false);
console.log('PASS tutor explanation, answer feedback and mistake reason save');
