import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const cache=new Map();
function service(name){
  if(cache.has(name))return cache.get(name);
  const exports={};cache.set(name,exports);
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../miniprogram/services/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:path=>service(path.split('/').pop()),wx:{getStorageSync(){},setStorageSync(){}}});
  return exports;
}
const source=readFileSync(new URL('./homework-prototype.js',import.meta.url),'utf8');
const roster=service('schoolDemoRoster');
let client,role='subject',rendered='',realStorageCalls=0;
const document={body:{},addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];},getElementById(){return null;}};
const context={document,location:{search:'?review=1&documentation=1',protocol:'http:'},URLSearchParams,URL,schoolDemoRoster:roster,localStorage:{getItem(){realStorageCalls++;throw Error('Real storage must never be read');},setItem(){realStorageCalls++;throw Error('Real storage must never be written');},removeItem(){realStorageCalls++;throw Error('Real storage must never be removed');}},MutationObserver:class{observe(){}},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(){},alert(){},go(){},teacherTab:'homework',teacherDesk(){client?.setScope({view:role,classIds:['c1','c2'],teacherId:'teacher-demo-001'});if(client)rendered=client.renderTeacher();},window:{homeworkGrading:service('homeworkGrading'),homeworkFilters:service('homeworkFilters'),homeworkLearning:service('homeworkLearning'),homeworkTutor:service('homeworkTutor'),confirm:()=>true,workbenchPrototype:{demoIdentity(){client?.toTeacherListWithoutRefresh();},view(value){role=value;},class(){}},parentPrototype:{tab(){},render(){if(client)rendered=client.renderParent('李涵',0);},getDemoContext:()=>({homework:true,childIndex:0}),getTutorAccount:()=> 'guardian-demo-001'}}};
vm.runInNewContext(source,context);client=context.window.homeworkPrototype;
assert.equal(realStorageCalls,0,'Documentation startup must not even read existing tasks or drafts');
assert.ok(client.getDocumentationSceneOptions().length>=78);
for(const name of ['draft-list','draft-save-error','publish-network','publish-success','management-withdraw-parent','management-save-error','file-version-conflict','file-conflict-resolved','school-no-media','photo-network']){
  assert.equal(client.prepareDocumentationScene(name),true,name);
  assert.equal(realStorageCalls,0,name+' must not touch the user’s persistent store');
  if(name==='draft-save-error')assert.match(rendered,/草稿保存失败/);
  if(name==='publish-network')assert.match(rendered,/发布失败/);
  if(name==='publish-success')assert.match(rendered,/已发布给/);
  if(name==='management-withdraw-parent')assert.match(rendered,/老师已撤回/);
  if(name==='management-save-error')assert.match(rendered,/保存失败，尚未应用变更/);
  if(name==='file-version-conflict')assert.match(rendered,/已有新版本/);
  if(name==='file-conflict-resolved'){assert.doesNotMatch(rendered,/已有新版本/);assert.match(rendered,/提交记录.*2/);}
  if(name==='school-no-media')assert.doesNotMatch(rendered,/<video|<audio|class="hp-original|onclick="homeworkPrototype\.review/);
  if(name==='photo-network'){assert.match(rendered,/网络连接中断/);assert.match(rendered,/待提交 · 2 张/);}
}
assert.equal(client.prepareDocumentationScene('not-a-scene'),false);
context.stage='teacherDesk';context.window.demoWorkspace={enabled:true};context.window.addEventListener=()=>{};
vm.runInNewContext(readFileSync(new URL('./page-demo-tools.js',import.meta.url),'utf8'),context);
for(const scene of ['stats-overview','student-first']){
  client.prepareDocumentationScene(scene);
  const baseline=client.renderTeacher();
  for(const [id,copy] of [['normal','批改预计还需3—5分钟完成'],['peak','批改预计还需10—15分钟完成'],['unknown','正在排队批改，完成时间暂无法估算']]){
    assert.ok(client.getPageDemoContext('teacher').choices.some(c=>c[0]==='grading-wait-'+id));
    assert.ok(context.window.pageDemoTools.getContext().choices.some(c=>c.id==='grading-wait-'+id),'Visible state tool must retain the wait choice');
    client.applyPageDemo('grading-wait-'+id,'teacher');
    assert.ok(client.renderTeacher().includes(copy),scene+': '+copy);
    assert.equal(realStorageCalls,0,'Wait estimates are isolated demonstrations, not real service writes');
  }
  client.restorePageDemo('teacher');
  assert.equal(client.renderTeacher(),baseline,'Restoring wait demo must recover original results and versions');
}
client.prepareDocumentationScene('file-conflict-resolved');client.openTeacher('homework-console-v1');client.openQuestionResults();assert.equal(client.getTeacherMode(),'questions','The wait-row correction entry also opens an automatic file item without fabricating results');
const normal={...context,location:{search:'?review=1',protocol:'http:'},window:{...context.window},localStorage:{getItem:()=>null,setItem(){},removeItem(){}}};
vm.runInNewContext(source,normal);assert.equal(normal.window.homeworkPrototype.prepareDocumentationScene('publish-success'),false,'The fixture API is disabled outside the explicitly selected documentation session');
console.log('PASS documentation session: no real storage reads/writes/removal, existing controller failures, publish/recovery, read-only permissions, pending-media preservation and normal-mode guard.');
