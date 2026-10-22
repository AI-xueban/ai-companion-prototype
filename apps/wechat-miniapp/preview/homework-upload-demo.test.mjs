import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const storage=new Map();let now=Date.now();
class DemoDate extends Date {static now(){return now;}}
function boot(){
 const c={Date:DemoDate,window:{confirm:()=>true},document:{querySelector:()=>null},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},location:{search:'?review=1',protocol:'file:'},URLSearchParams,setTimeout:()=>1,clearTimeout(){},alert(){}};
 vm.runInNewContext(readFileSync(new URL('./learning-data.js',import.meta.url),'utf8'),c);
 c.schoolDemoRoster=c.window.schoolDemoRoster;
 const source=readFileSync(new URL('./homework-prototype.js',import.meta.url),'utf8').replace('    renderTeacher() {','    inspect:()=>store, renderTeacher() {');
 vm.runInNewContext(source,c);return c;
}
let c=boot(),p=c.window.homeworkPrototype;const id='guardian-demo-status-v1-pending-math',item=id+'-item';
p.openParent(id);p.renderParent('李涵');p.fillParentDemoPhoto(id,item);p.confirmUpload();
assert.match(p.renderParent('李涵'),/正在批改/);assert.doesNotMatch(p.renderParent('李涵'),/查看整份批改结果/);
now+=2000;c=boot();p=c.window.homeworkPrototype;p.openParent(id);assert.match(p.renderParent('李涵'),/查看整份批改结果/);
p.openParentGrade();let html=p.renderParent('李涵');assert.match(html,/homework-real-page-1.jpg/);assert.match(html,/第 21 题/);assert.match(html,/1对1讲题/);
const record=p.inspect().submissions.filter(r=>r.taskId===id).at(-1);assert.equal(record.questions[0].state,'confirmed');assert.equal(record.questions[0].answer,'42 人');
p.openParent(id);p.openParentPhotoSource(id,item);p.useParentChatDemoPhoto(2);p.confirmUpload();p.renderParent('李涵');now+=2000;assert.match(p.renderParent('李涵'),/查看已完成批改结果/);p.openParentGrade();html=p.renderParent('李涵');assert.match(html,/homework-real-page-2.png/);assert.match(html,/第 24 题/);
assert.equal(p.inspect().submissions.filter(r=>r.taskId===id).length,2);
console.log('PASS: demo submission processing, completion after reload, photo/question matching, tutor entry, resubmission and history');
