import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const core=await readFile(new URL('./homework-tutor.js',import.meta.url),'utf8'),guideCode=await readFile(new URL('./homework-tutor-walkthrough.js',import.meta.url),'utf8');
let utterance=null,rendered='',storageWrites=0,nextTimer=0;const timers=new Map();
const hw={renderParent:()=>'',getParentNavigation:()=>({}),toParentList(){}};
const win={homeworkPrototype:hw,addEventListener(){},dispatchEvent(){},parentPrototype:{render(){rendered=hw.renderParent();}},demoWorkspace:{sync(){},syncFlow(){}},SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},speechSynthesis:{cancel(){const canceled=utterance;utterance=null;canceled?.onerror?.({error:'canceled'});},speak(value){utterance=value;}}};
const doc={hidden:false,querySelector:()=>null,getElementById:()=>null,addEventListener(){},body:{classList:{add(){},remove(){}}}};
const env={window:win,document:doc,location:{search:'?review=1&page=parent'},URLSearchParams,Event:class{},setTimeout(fn,ms){timers.set(++nextTimer,{fn,ms});return nextTimer;},clearTimeout(id){timers.delete(id);},localStorage:{setItem(){storageWrites++;}}};
vm.createContext(env);vm.runInContext(core,env);vm.runInContext(guideCode,env);
const ui=win.homeworkTutorUI,guide=win.homeworkTutorWalkthrough;
function start(){assert.ok(utterance,'Expected automatic speech');utterance.onstart?.();}
function finish(){const current=utterance;assert.ok(current);utterance=null;current.onstart?.();current.onend?.();}
function drain(){for(let i=0;i<25;i++){if(utterance){finish();continue;}const entry=[...timers].find(([,v])=>v.ms===290);if(entry){timers.delete(entry[0]);entry[1].fn();continue;}return;}throw Error('Speech failed to settle at a question or summary');}
guide.start();guide.goto(5);assert.ok(utterance);assert.doesNotMatch(rendered,/共48个苹果|平均装进6袋|卖出其中2袋/);
start();assert.match(rendered,/共48个苹果/);assert.doesNotMatch(rendered,/平均装进6袋|卖出其中2袋/);
finish();start();assert.match(rendered,/平均装进6袋/);assert.doesNotMatch(rendered,/卖出其中2袋/);
drain();assert.equal(ui.inspect().phase,'waiting');assert.equal(ui.inspect().cursor,0);assert.equal(utterance,null);assert.doesNotMatch(rendered,/每袋：48 ÷ 6 = 8/);
guide.branch('wrong');drain();assert.equal(ui.inspect().phase,'waiting');assert.equal(ui.inspect().correct,false);
guide.branch('ask');drain();assert.equal(ui.inspect().phase,'asideDone');assert.equal(utterance,null);guide.next();drain();assert.equal(ui.inspect().phase,'waiting');
guide.next();assert.equal(ui.inspect().phase,'feedback');assert.doesNotMatch(rendered,/每袋：48 ÷ 6 = 8/);start();assert.doesNotMatch(rendered,/每袋：48 ÷ 6 = 8/);finish();start();assert.match(rendered,/每袋：48 ÷ 6 = 8/);drain();assert.equal(ui.inspect().cursor,1);assert.equal(ui.inspect().phase,'waiting');assert.doesNotMatch(rendered,/8 × 2 = 16/);
guide.next();drain();assert.equal(ui.inspect().cursor,2);assert.equal(ui.inspect().phase,'waiting');assert.match(rendered,/8 × 2 = 16/);assert.doesNotMatch(rendered,/48 − 16 = 32/);
guide.next();drain();assert.equal(ui.inspect().phase,'done');assert.match(rendered,/48 − 16 = 32/);assert.equal(ui.inspect().board.flatMap(b=>b.turns||[]).filter(t=>t.kind==='correct').length,3);
guide.goto(5);start();const late=utterance;ui.pause();assert.equal(ui.inspect().phase,'paused');const paused=rendered;late.onend();assert.equal(rendered,paused);assert.equal(utterance,null);ui.resume();assert.ok(utterance);assert.doesNotMatch(rendered,/卖出其中2袋/);drain();assert.equal(ui.inspect().phase,'waiting');
guide.goto(5);start();ui.answer('为什么要除以6？');start();assert.doesNotMatch(rendered,/卖出其中2袋/);drain();assert.equal(ui.inspect().phase,'asideDone');assert.doesNotMatch(rendered,/卖出其中2袋/);ui.back();drain();assert.equal(ui.inspect().phase,'waiting');assert.match(rendered,/卖出其中2袋/);
guide.goto(5);const broken=utterance;broken.onerror();assert.equal(ui.inspect().error,'speech');assert.doesNotMatch(rendered,/共48个苹果/);ui.retry();assert.ok(utterance);drain();assert.equal(ui.inspect().phase,'waiting');
guide.goto(5);const stale=utterance;guide.goto(0);stale.onstart();stale.onend();assert.equal(ui.active(),false);assert.equal(utterance,null);
guide.start();guide.next();assert.equal(ui.inspect().phase,'loading');for(let i=0;i<4;i++){const event=[...timers].find(([,v])=>v.ms===950);assert.ok(event);timers.delete(event[0]);event[1].fn();}assert.ok(utterance);drain();assert.equal(ui.inspect().phase,'waiting');
guide.stop();assert.equal(storageWrites,0);assert.doesNotMatch(guide.panelHtml(),/>试听本段</);
console.log('PASS automatic spoken chunks, progressive board, automatic lecture transitions, three Q&A rounds, pause/resume, nested interruption, speech failure/retry, stale callbacks, automatic preparation and no persistence');
