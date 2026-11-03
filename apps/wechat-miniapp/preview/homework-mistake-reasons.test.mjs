import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
const cache=new Map();
function load(name){if(cache.has(name))return cache.get(name);const source=readFileSync(new URL(`../miniprogram/services/${name}.ts`,import.meta.url),'utf8');const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const exports={};cache.set(name,exports);vm.runInNewContext(js,{exports,require:p=>load(p.replace('./',''))});return exports;}
const api=load('homeworkLearning');
const question={id:'q1',label:'题目',state:'confirmed',correct:false,answer:'32',studentAnswer:'46'};
const source={studentId:'child-a',taskId:'task-a',itemId:'item-a',version:1};
assert.equal(api.mistakeReasonLength('甲 乙 ab12，!'),8);assert.equal(api.mistakeReasonLength('𠮷'),1);
let entries=api.addNotebookEntry([],source,question,'甲 乙丙丁戊己庚辛壬癸');assert.equal(entries.length,1);assert.equal(entries[0].reason,'甲乙丙丁戊己庚辛壬癸');
assert.equal(api.addNotebookEntry(entries,source,question,'甲乙丙丁戊己庚辛壬癸子'),entries);assert.equal(api.addNotebookEntry(entries,source,question,'   '),entries);
entries=api.addNotebookEntry(entries,source,question,'计算失误');assert.equal(entries.length,1);assert.equal(entries[0].reason,'计算失误');
entries=api.addNotebookEntry(entries,{...source,taskId:'task-b'},question,'看错题意');assert.equal(entries.length,2);
assert.equal(api.addNotebookEntry(entries,source,{...question,state:'review'},'看错题意'),entries);
console.log('PASS custom reason 1–10 code points, mixed characters, whitespace, Unicode, over-limit rejection, source deduplication and released-result guard.');
