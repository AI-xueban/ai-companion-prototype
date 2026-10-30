import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const storage=new Map();let now=Date.now();
class DemoDate extends Date {static now(){return now;}}
function boot(){
 const c={Date:DemoDate,window:{confirm:()=>true},document:{querySelector:()=>null,getElementById:()=>null},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},location:{search:'?review=1',protocol:'file:'},URLSearchParams,setTimeout:()=>1,clearTimeout(){},alert(){}};
 vm.runInNewContext(readFileSync(new URL('./learning-data.js',import.meta.url),'utf8'),c);
 c.schoolDemoRoster=c.window.schoolDemoRoster;
 const source=readFileSync(new URL('./homework-prototype.js',import.meta.url),'utf8').replace('    renderTeacher() {','    inspect:()=>store, renderTeacher() {');
 vm.runInNewContext(source,c);return c;
}
let c=boot(),p=c.window.homeworkPrototype;const id='guardian-demo-status-v1-pending-math',item=id+'-item';
p.openParent(id);p.renderParent('李涵');p.openParentPhotoSource(id,item);p.useParentChatDemoPhoto(0);p.confirmUpload();
assert.match(p.renderParent('李涵'),/待批改|批改结果尚未全部完成/);
let record=p.inspect().submissions.filter(r=>r.taskId===id).at(-1);
assert.equal(record.photos.length,1);assert.match(record.photos[0].path,/math-basic-answered.webp/);
now+=2000;c=boot();p=c.window.homeworkPrototype;p.openParent(id);let html=p.renderParent('李涵');
record=p.inspect().submissions.filter(r=>r.taskId===id).at(-1);
assert.ok(record.questions.some(c.window.homeworkGrading.isResultReleased));
assert.match(html,/hp-record-photo/,'Completed records keep the original photo preview');
const question=record.questions.find(c.window.homeworkGrading.isResultReleased);
p.openParentQuestion(item,question.id);html=p.renderParent('李涵');
assert.ok(html.includes(record.photos[0].path),'Selected question keeps the submitted original photo');
assert.ok(html.includes(question.answer));
p.toParentList();p.openParent(id);p.appendPhotos(id,item);p.openParentPhotoSource(id,item);p.useParentChatDemoPhoto(2);p.confirmUpload();
now+=2000;p.renderParent('李涵');
record=p.inspect().submissions.filter(r=>r.taskId===id).at(-1);
assert.equal(record.photos.length,2);assert.equal(record.version,2);
const second=record.questions.find(q=>q.pageIndex===1&&c.window.homeworkGrading.isResultReleased(q));assert.ok(second);
p.openParentQuestion(item,second.id);html=p.renderParent('李涵');assert.ok(html.includes(record.photos[1].path),'Second-page question uses the second page original');
assert.equal(p.inspect().submissions.filter(r=>r.taskId===id).length,2,'Earlier submission version is retained');
c=boot();p=c.window.homeworkPrototype;p.openParent(id);p.renderParent('李涵');
record=p.inspect().submissions.filter(r=>r.taskId===id).at(-1);assert.equal(record.photos.length,2);assert.ok(record.questions.length);
console.log('PASS: multi-photo demo processing, reload persistence, per-page question/original matching, append and version history');
