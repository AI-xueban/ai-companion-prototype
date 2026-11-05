import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const root=new URL('./',import.meta.url);
let html='',utterance=null,serial=0,writes=0;const timers=new Map();
const hw={renderParent:()=>'<p>original</p>',getParentNavigation:()=>({}),toParentList(){}};
const win={homeworkPrototype:hw,parentPrototype:{render(){html=hw.renderParent();}},demoWorkspace:{sync(){},syncFlow(){}},addEventListener(){},dispatchEvent(){},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},speechSynthesis:{cancel(){const old=utterance;utterance=null;old?.onerror?.();},speak(u){utterance=u;}}};
const env={window:win,document:{hidden:false,querySelector:()=>null,getElementById:()=>null,addEventListener(){},body:{classList:{add(){},remove(){}}}},location:{search:'?review=1'},URLSearchParams,Event:class{},setTimeout(fn,ms){timers.set(++serial,{fn,ms});return serial;},clearTimeout(id){timers.delete(id);},localStorage:{setItem(){writes++;}}};
vm.createContext(env);for(const file of ['homework-tutor.js','homework-tutor-walkthrough.js'])vm.runInContext(await readFile(new URL(file,root),'utf8'),env);
const guide=win.homeworkTutorWalkthrough,ui=win.homeworkTutorUI;
function finish(){const old=utterance;assert.ok(old);utterance=null;old.onstart?.();old.onend?.();}
function drain(){for(let n=0;n<60;n++){if(utterance){finish();continue;}const entry=[...timers].find(([,v])=>[290,950].includes(v.ms));if(entry){timers.delete(entry[0]);entry[1].fn();continue;}return;}throw Error('did not stop at question');}
guide.start();assert.match(html,/48个苹果/);assert.equal(ui.active(),false);
guide.next();drain();assert.equal(ui.inspect().phase,'waiting');assert.doesNotMatch(html,/每袋：48 ÷ 6 = 8/);
guide.branch('wrong');drain();assert.equal(ui.inspect().phase,'waiting');assert.equal(ui.inspect().correct,false);assert.doesNotMatch(html,/每袋：48 ÷ 6 = 8/);
guide.branch('ask');drain();assert.equal(ui.inspect().phase,'asideDone');guide.next();drain();assert.equal(ui.inspect().phase,'waiting');
guide.branch('correct');assert.doesNotMatch(html,/每袋：48 ÷ 6 = 8/);drain();assert.equal(ui.inspect().cursor,1);assert.doesNotMatch(html,/8 × 2 = 16/);
guide.next();drain();assert.equal(ui.inspect().cursor,2);assert.doesNotMatch(html,/48 − 16 = 32/);guide.next();drain();assert.equal(ui.inspect().phase,'done');assert.match(html,/48 − 16 = 32/);
for(const id of ['B','C','figure']){
 guide.choose(id);assert.equal(ui.active(),false);guide.goto(5);const stale=utterance;ui.pause();stale.onend();assert.equal(ui.inspect().phase,'paused');ui.resume();drain();assert.equal(ui.inspect().phase,'waiting');assert.doesNotMatch(html,/48个苹果|每袋|卖出/);
 guide.branch('wrong');drain();assert.equal(ui.inspect().feedbackKind,'incorrect');assert.equal(ui.inspect().cursor,0);
 guide.branch('unclear');drain();assert.equal(ui.inspect().feedbackKind,'');
 for(const [name] of [['speech'],['mic'],['asr'],['unclear'],['access'],['version'],['prepNetwork']]){guide.exception(name);if(name==='access')assert.doesNotMatch(html,/原题配图|小溪|She ___/);guide.restore();assert.equal(guide.sampleId(),id);assert.doesNotMatch(html,/48个苹果/);}
 guide.goto(6);drain();if(id==='figure')assert.match(html,/geometry-crop.png/);
 for(let n=0;n<5&&ui.inspect().phase!=='done';n++){guide.next();drain();}
 assert.equal(ui.inspect().phase,'done');assert.doesNotMatch(html,/每袋数量|卖出数量/);
 guide.goto(5);const canceled=utterance;guide.choose('A');canceled.onstart?.();canceled.onend?.();assert.equal(ui.active(),false);assert.equal(utterance,null);
}
guide.stop();assert.match(html,/original/);assert.equal(writes,0);
const nonReview={...env,window:{},location:{search:''}};vm.createContext(nonReview);vm.runInContext(await readFile(new URL('homework-tutor-walkthrough.js',root),'utf8'),nonReview);assert.equal(nonReview.window.homeworkTutorWalkthrough,null);
console.log('PASS multi-sample automatic speech, no premature answers, wrong/clarify/ask, pause/resume, stale callbacks, image board, exceptions/restore, no persistence and review gating');
