import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const code=await readFile(new URL('./homework-tutor.js',import.meta.url),'utf8');
let storageReads=0,storageWrites=0;
const listeners={};
const document={querySelector:()=>null,getElementById:()=>null,addEventListener:(name,fn)=>{listeners[name]=fn;}};
const sandbox={window:{addEventListener(){},dispatchEvent(){}},document,Event:class{},setTimeout,clearTimeout,localStorage:{getItem(){storageReads++;throw Error('history must not be read');},setItem(){storageWrites++;throw Error('history must not be written');}}};
vm.createContext(sandbox);vm.runInContext(code,sandbox);const ui=sandbox.window.homeworkTutorUI;
const source={accountId:'a',studentId:'child-a',taskId:'homework-a',itemId:'item',submissionVersion:1,question:{id:'apple',stem:'把48个苹果平均装进6袋，卖出2袋，还剩多少个？',answer:'32个'}};
const open=()=>{ui.open({review:true,source,images:[]},{valid:()=>true,render(){},leave(){}});for(let i=0;i<4;i++)ui.next();};
open();assert.equal(ui.inspect().phase,'playing');assert.doesNotMatch(ui.html(),/深度解题|继续上次|讲题记录/);
assert.equal(ui.inspect().voiceMode,true);assert.equal(ui.inspect().recording,false);assert.ok(ui.html().includes('切换为键盘输入'));assert.ok(ui.html().includes('按住说话'));assert.doesNotMatch(ui.html(),/aria-label="回答或提问"/);
ui.reviewState('reading');const captionBoard=ui.inspect().board;ui.draft('未发送草稿');ui.toggleCaptions();assert.equal(ui.inspect().captionsVisible,false);assert.equal(ui.inspect().phase,'playing');assert.deepEqual(ui.inspect().board,captionBoard);assert.equal(ui.inspect().draft,'未发送草稿');assert.doesNotMatch(ui.html(),/已知有48个苹果，平均装进6袋，卖出了2袋/);assert.match(ui.html(),/显示讲解文字/);ui.inputMode();assert.equal(ui.inspect().captionsVisible,false);assert.equal(ui.inspect().draft,'未发送草稿');ui.toggleCaptions();assert.equal(ui.inspect().phase,'paused');assert.match(ui.html(),/已知有48个苹果，平均装进6袋，卖出了2袋/);
ui.reviewState('waiting');ui.toggleCaptions();assert.match(ui.html(),/要求剩余的苹果个数，你准备先求什么/);ui.reviewState('correct');ui.toggleCaptions();assert.match(ui.html(),/tv-answer-correct/);ui.reviewState('done');ui.toggleCaptions();assert.match(ui.html(),/本次讲题小结/);ui.reviewState('speech');ui.toggleCaptions();assert.match(ui.html(),/语音播放失败/);assert.match(ui.html(),/发消息或按住说话/);
ui.reviewState('waiting');ui.inputMode();assert.equal(ui.inspect().voiceMode,false);ui.draft('先求一袋有几个，48除以6');ui.inputMode();assert.equal(ui.inspect().voiceMode,true);assert.equal(ui.inspect().recording,false);assert.equal(ui.inspect().draft,'先求一袋有几个，48除以6');ui.inputMode();assert.equal(ui.inspect().draft,'先求一袋有几个，48除以6');
ui.reviewState('waiting');ui.voice();assert.equal(ui.inspect().recording,true);ui.inputMode();assert.equal(ui.inspect().recording,false);assert.equal(ui.inspect().voiceMode,false);assert.equal(ui.inspect().student,'');assert.equal(ui.inspect().phase,'waiting');
ui.reviewState('reading');ui.holdStart({button:0,pointerId:7,preventDefault(){}});assert.equal(ui.inspect().recording,true);assert.equal(ui.inspect().phase,'paused');listeners.pointerup({pointerId:7});assert.equal(ui.inspect().recording,false);assert.equal(ui.inspect().phase,'aside');const sent=ui.inspect().student;listeners.pointerup({pointerId:7});assert.equal(ui.inspect().student,sent);
ui.reviewState('reading');ui.holdStart({button:0,pointerId:8,preventDefault(){}});listeners.pointercancel({pointerId:8});assert.equal(ui.inspect().recording,false);assert.equal(ui.inspect().student,'');assert.equal(ui.inspect().phase,'paused');
ui.reviewState('draft');assert.equal(ui.inspect().modal,'');assert.equal(ui.inspect().phase,'waiting');assert.match(ui.html(),/原来有48个，卖出16个，还剩多少个/);assert.doesNotMatch(ui.html(),/展开问题|收起问题|完整问题|已输入：|role="dialog"/);ui.inputMode();ui.inputMode();assert.equal(ui.inspect().draft,'应该用48减');assert.equal(ui.inspect().phase,'waiting');ui.reviewState('waiting');ui.draft('先求一袋有几个，48除以6');
ui.submit();ui.submit();assert.equal(ui.inspect().phase,'submitting');await new Promise(r=>setTimeout(r,700));assert.equal(ui.inspect().phase,'feedback');assert.equal(ui.inspect().board.length,2);assert.ok(ui.inspect().feedback.includes('每袋有8个'));ui.next();assert.equal(ui.inspect().cursor,1);assert.equal(ui.inspect().phase,'playing');
ui.reviewState('waiting');ui.answer('48减2');await new Promise(r=>setTimeout(r,700));assert.equal(ui.inspect().correct,false);assert.equal(ui.inspect().board.length,1);assert.doesNotMatch(ui.html(),/32（个）|剩余.*32/);
ui.reviewState('restart');const before=ui.inspect();ui.dismiss();assert.equal(ui.inspect().phase,'paused');assert.equal(ui.inspect().draft,before.draft);assert.deepEqual(ui.inspect().board,before.board);
ui.reviewState('speech');const lines=ui.inspect().board;assert.match(ui.html(),/语音播放失败/);assert.match(ui.html(),/>重试</);assert.doesNotMatch(ui.html(),/无声查看|重试语音|已暂停后续讲解/);assert.match(ui.html(),/按住说话/);ui.inputMode();assert.match(ui.html(),/aria-label="回答或提问"/);ui.focusInput();ui.answer('为什么要除以6？');assert.equal(ui.inspect().phase,'aside');assert.deepEqual(ui.inspect().board,lines);ui.reviewState('speech');ui.retry();assert.notEqual(ui.inspect().phase,'error');assert.deepEqual(ui.inspect().board,lines);
ui.reviewState('unclear');assert.ok(ui.html().includes('题目不清晰或不完整'));assert.doesNotMatch(ui.html(),/>重试<|补充条件|重拍/);
ui.reviewState('access');assert.equal(ui.inspect().board.length,0);assert.doesNotMatch(ui.html(),/48|6袋|查看原题/);
ui.reviewState('saveFailure');assert.equal(ui.inspect().saved,false);ui.saveMistake();ui.confirmMistake();assert.equal(ui.inspect().saved,true);ui.reviewState('cancelFailure');assert.equal(ui.inspect().saved,true);ui.saveMistake();assert.equal(ui.inspect().saved,false);
// D04: custom reason boundaries and cancellation must not create a wrongbook entry.
ui.reviewState('waiting');ui.saveMistake();assert.equal(ui.inspect().modal,'mistake');ui.dismiss();assert.equal(ui.inspect().saved,false);ui.saveMistake();ui.chooseReason('custom');ui.customReason('   ');ui.confirmMistake();assert.equal(ui.inspect().saved,false);ui.customReason('甲乙丙丁戊己庚辛壬癸子');ui.confirmMistake();assert.equal(ui.inspect().saved,false);assert.ok(ui.inspect().reasonError.includes('最多10字'));ui.customReason('甲 乙丙丁戊己庚辛壬癸');ui.confirmMistake();assert.equal(ui.inspect().saved,true);assert.equal(ui.inspect().reason,'甲乙丙丁戊己庚辛壬癸');assert.equal(ui.inspect().modal,'');
ui.reviewState('waiting');ui.saveMistake();ui.chooseReason('计算失误');ui.confirmMistake();assert.equal(ui.inspect().saved,true);assert.equal(ui.inspect().reason,'计算失误');
ui.reviewState('reasonSaveFailure');assert.equal(ui.inspect().saved,false);assert.equal(ui.inspect().modal,'mistake');assert.equal(ui.inspect().customReason,'没有读懂题目关键条件');assert.ok(ui.inspect().reasonError.includes('失败'));ui.confirmMistake();assert.equal(ui.inspect().saved,true);
// Teaching controls are limited to pause/continue; other intentions are expressed through the input.
ui.reviewState('reading');assert.doesNotMatch(ui.html(),/>重讲当前步<|>重新讲<|>结束讲题<|>打断<|>我还不懂<|>跳过当前问题<|>我要提问<|>小晤<|>小晤反馈</);assert.match(ui.html(),/>暂停</);
ui.reviewState('waiting');ui.answer('我还不懂');assert.equal(ui.inspect().phase,'feedback');ui.next();ui.answer('跳过当前问题');assert.equal(ui.inspect().cursor,1);ui.answer('结束讲题');assert.equal(ui.inspect().phase,'done');
// D03: preserve the root teaching state across nested asides; continue is never skip.
ui.reviewState('waiting');const originalBoard=ui.inspect().board;ui.ask('为什么要除以6？');ui.next();assert.equal(ui.inspect().phase,'asideDone');assert.equal(ui.inspect().cursor,0);ui.ask('我还是没明白');ui.next();ui.answer('继续讲题');assert.equal(ui.inspect().phase,'waiting');assert.equal(ui.inspect().cursor,0);assert.deepEqual(ui.inspect().board,originalBoard);
ui.reviewState('reading');const readingBoard=ui.inspect().board;ui.focusInput();assert.equal(ui.inspect().phase,'paused');ui.ask('为什么要除以6？');ui.next();assert.equal(ui.inspect().phase,'asideDone');ui.back();assert.equal(ui.inspect().phase,'playing');assert.deepEqual(ui.inspect().board,readingBoard);ui.next();assert.equal(ui.inspect().phase,'waiting');
ui.reviewState('asideWaiting');ui.answer('先求一袋有几个，48除以6');await new Promise(r=>setTimeout(r,700));assert.equal(ui.inspect().phase,'feedback');ui.next();assert.equal(ui.inspect().cursor,1);assert.equal(ui.inspect().phase,'playing');
ui.reviewState('waiting');ui.pause();ui.resume();assert.equal(ui.inspect().phase,'waiting');assert.equal(ui.inspect().cursor,0);
ui.reviewState('done');assert.match(ui.html(),/本次讲题小结/);assert.match(ui.html(),/按住说话/);assert.doesNotMatch(ui.html(),/>返回原题<|>重讲当前步<|>重新讲<|>结束讲题</);ui.inputMode();ui.draft('我不懂');assert.match(ui.html(),/aria-label="回答或提问"/);ui.submit();assert.equal(ui.inspect().phase,'aside');ui.next();ui.back();assert.equal(ui.inspect().phase,'done');
ui.reviewState('done');ui.recommend('这道题容易错在哪里？');ui.next();assert.equal(ui.inspect().phase,'asideDone');assert.ok(ui.html().includes('继续'));ui.back();assert.equal(ui.inspect().phase,'done');
// D05: a correction can interrupt a pending reply; the canceled result must not overwrite it.
ui.reviewState('waiting');ui.answer('46个');assert.equal(ui.inspect().phase,'submitting');ui.focusInput();assert.equal(ui.inspect().phase,'paused');ui.draft('刚才识别错了，我说的是先求每袋有几个，48除以6');ui.submit();await new Promise(r=>setTimeout(r,700));assert.equal(ui.inspect().phase,'feedback');assert.equal(ui.inspect().correct,true);assert.ok(ui.inspect().feedback.includes('按你补充的意思'));assert.ok(ui.inspect().feedback.includes('每袋有8个'));assert.equal(ui.inspect().board.length,2);assert.doesNotMatch(ui.html(),/撤回|编辑已发送/);
ui.reviewState('waiting');ui.finish();assert.ok(ui.html().includes('未继续讲解的内容仍待理解'));ui.reviewState('done');ui.close();open();assert.equal(ui.inspect().cursor,0);assert.equal(ui.inspect().phase,'playing');assert.equal(ui.inspect().captionsVisible,true);assert.equal(storageReads+storageWrites,0);ui.close();
// Verdict cues fire once for a confirmed answer; ambiguous input, hints and interruptions stay neutral.
let cueStarts=0,cueStops=0;
sandbox.window.AudioContext=class{constructor(){this.state='running';this.currentTime=0;this.destination={};}createOscillator(){return {frequency:{setValueAtTime(){}},connect(){},start(){cueStarts++;},stop(){cueStops++;},disconnect(){}};}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}};
open();ui.reviewState('waiting');listeners.pointerdown();ui.answer('48除以6');await new Promise(r=>setTimeout(r,700));assert.equal(cueStarts,2);assert.match(ui.html(),/tv-answer-correct/);ui.html();ui.toggleCaptions();ui.toggleCaptions();assert.equal(cueStarts,2);ui.pause();ui.resume();assert.equal(cueStarts,2);assert.ok(cueStops>=2);
ui.reviewState('waiting');ui.answer('48减2');await new Promise(r=>setTimeout(r,700));assert.equal(cueStarts,4);assert.match(ui.html(),/tv-answer-incorrect/);
ui.reviewState('waiting');ui.answer('先算那个');await new Promise(r=>setTimeout(r,700));assert.equal(cueStarts,4);assert.equal(ui.inspect().feedbackKind,'');assert.doesNotMatch(ui.html(),/tv-answer-incorrect/);ui.next();ui.answer('我不懂');assert.equal(cueStarts,4);assert.equal(ui.inspect().feedbackKind,'');
ui.reviewState('waiting');ui.answer('48减2');ui.focusInput();ui.ask('为什么要除以6？');await new Promise(r=>setTimeout(r,700));assert.equal(cueStarts,4);ui.reviewState('correct');assert.equal(cueStarts,4);ui.close();
// Structured board is presentation only: pair reasoning to its step without revealing future answers.
open();ui.reviewState('waiting');assert.match(ui.html(),/tv-known/);assert.match(ui.html(),/已知与所求/);assert.match(ui.html(),/data-board-step="0"/);assert.doesNotMatch(ui.html(),/48 ÷ 6 = 8|8 × 2 = 16|48 − 16 = 32/);
ui.answer('48除以6');await new Promise(r=>setTimeout(r,700));assert.equal(ui.inspect().board[0].turns[0].student,'48除以6');assert.match(ui.html(),/tv-board-dialogue/);assert.match(ui.html(),/tv-board-formula/);assert.doesNotMatch(ui.html(),/8 × 2 = 16|剩余：48/);ui.next();assert.equal(ui.inspect().cursor,1);assert.match(ui.html(),/data-board-step="1"/);assert.equal(ui.inspect().board[0].turns.length,1);
ui.reviewState('boardStructured');const structured=ui.inspect();assert.equal(structured.cursor,1);assert.doesNotMatch(ui.html(),/tv-equal-parts|8 × 2 = 16|剩余：48/);ui.reviewState('boardVisual');assert.match(ui.html(),/tv-equal-parts/);assert.match(ui.html(),/每份8个/);assert.doesNotMatch(ui.html(),/8 × 2 = 16|剩余：48/);ui.toggleCaptions();assert.match(ui.html(),/tv-equal-parts/);assert.equal(ui.inspect().phase,'waiting');
ui.reviewState('boardText');assert.match(ui.html(),/3x/);assert.doesNotMatch(ui.html(),/苹果|tv-equal-parts|x = 4/);ui.original();assert.match(ui.html(),/解方程：3x/);ui.reviewState('waiting');assert.equal(ui.inspect().previewStem,'');assert.doesNotMatch(ui.html(),/3x/);assert.equal(ui.inspect().board[0].turns,undefined);ui.close();

// A browser recognizer may finish before the finger is released; it must not send early.
let fakeRecognition;
sandbox.window.SpeechRecognition=class{constructor(){fakeRecognition=this;}start(){}stop(){this.onend?.();}abort(){}};
const liveContext={review:true,source,images:[]};ui.open(liveContext,{valid:()=>true,render(){}});ui.reviewState('waiting');liveContext.review=false;
ui.holdStart({button:0,pointerId:9,preventDefault(){}});fakeRecognition.onresult({results:[[{transcript:'先求一袋有几个，48除以6'}]]});fakeRecognition.onend();assert.equal(ui.inspect().recording,true);assert.equal(ui.inspect().student,'');listeners.pointerup({pointerId:9});assert.equal(ui.inspect().recording,false);assert.equal(ui.inspect().phase,'submitting');assert.equal(ui.inspect().student,'先求一袋有几个，48除以6');ui.close();
console.log('PASS D03 root continuation, nested questions, explicit continue, answer progression, summary return; direct entry, memory-only sessions, answer branches, no premature answer, preserved draft/modal, retry, access hiding, wrongbook retry, fresh re-entry');

// Preparation precedes teaching; no student input, answer, voice or wrongbook control before ready.
ui.open({review:true,source,images:[]},{valid:()=>true,render(){},leave(){}});
assert.equal(ui.inspect().phase,'loading');assert.equal(ui.inspect().board.length,0);
assert.match(ui.html(),/解析题目信息/);assert.doesNotMatch(ui.html(),/tv-bottom|saveMistake|48 ÷ 6|tv-dock/);
for(let i=1;i<=3;i++){ui.next();assert.equal(ui.inspect().preparationIndex,i);assert.equal(ui.inspect().phase,'loading');assert.equal(ui.inspect().board.length,0);}
ui.next();assert.equal(ui.inspect().phase,'playing');assert.equal(ui.inspect().cursor,0);assert.match(ui.html(),/1 对 1 讲题/);assert.doesNotMatch(ui.html(),/tv-preparation/);
ui.reviewState('prepNetwork');assert.equal(ui.inspect().beforeError,'loading');assert.match(ui.html(),/准备失败/);assert.doesNotMatch(ui.html(),/tv-bottom/);ui.retry();assert.equal(ui.inspect().phase,'loading');assert.equal(ui.inspect().preparationIndex,2);assert.equal(ui.inspect().error,'');ui.next();ui.next();assert.equal(ui.inspect().phase,'playing');
ui.reviewState('prepTimeout');assert.match(ui.html(),/准备超时/);ui.retry();ui.next();assert.equal(ui.inspect().phase,'playing');
ui.reviewState('prepPaused');ui.next();assert.equal(ui.inspect().phase,'loading');assert.equal(ui.inspect().preparationIndex,1);assert.match(ui.html(),/继续准备/);ui.resumePreparation();assert.equal(ui.inspect().preparationPaused,false);ui.close();assert.equal(ui.inspect(),null);
ui.open({review:true,source,images:[]},{valid:()=>false,render(){}});assert.equal(ui.inspect().phase,'blocked');assert.equal(ui.inspect().error,'access');assert.doesNotMatch(ui.html(),/苹果|tv-preparation/);ui.close();
// An old mock event must never change a newly opened or failed session.
const prepTimers=[];const prepSandbox={...sandbox,window:{addEventListener(){},dispatchEvent(){}},setTimeout(fn){prepTimers.push(fn);return prepTimers.length;},clearTimeout(){}};
vm.createContext(prepSandbox);vm.runInContext(code,prepSandbox);const prep=prepSandbox.window.homeworkTutorUI;
const prepContext={review:true,source,images:[]};prep.open(prepContext,{render(){},valid:()=>true});prep.reviewState('prepDemo');const stale=prepTimers.at(-1);prep.close();prep.open(prepContext,{render(){},valid:()=>true});stale();assert.equal(prep.inspect().preparationIndex,0);assert.equal(prep.inspect().phase,'loading');
prep.reviewState('prepDemo');for(let i=0;i<4;i++)prepTimers.at(-1)();assert.equal(prep.inspect().phase,'playing');assert.equal(prep.inspect().cursor,0);prep.close();
console.log('PASS four-stage preparation, ready-to-tutoring, failure retry, background suspension, access recheck, stale events and fresh entry');

// A scripted explanation may begin with a narration-only step. Its summary belongs after the final step.
sandbox.window.homeworkTutor={tutorPlan:()=>[
  {title:'找到已知量对应的份数',speech:'24人对应4份。',board:{lines:['男生：24人 ↔ 4份','全班：？人 ↔ 7份']}},
  {title:'先求每一份',speech:'先求每份。',prompt:'每份有多少人？',board:{lines:['4份 = 24人','1份 = ？人']}},
  {title:'归纳方法',speech:'先求一份，再求总数。',board:{lines:['24 ÷ 4 = 6','6 × 7 = 42']}}
]};
ui.open({review:true,source:{...source,question:{id:'parts',stem:'男生24人对应4份，全班对应7份。',answer:'42人'}},images:[]},{valid:()=>true,render(){}});
for(let i=0;i<4;i++)ui.next();
assert.equal(ui.inspect().cursor,0);
ui.next();
assert.equal(ui.inspect().cursor,1);
assert.equal(ui.inspect().phase,'playing');
assert.doesNotMatch(ui.html(),/本次讲题小结/);
ui.next();
assert.equal(ui.inspect().phase,'waiting');
ui.skip();
assert.equal(ui.inspect().cursor,2);
ui.next();
assert.equal(ui.inspect().phase,'done');
assert.match(ui.html(),/本次讲题小结/);
ui.close();
console.log('PASS narration-only steps continue before the teaching summary');
