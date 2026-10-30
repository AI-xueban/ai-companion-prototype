import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const cache=new Map();let seconds=300,mediaError=false,destroyed=0,played=0;
const wx={
  getVideoInfo({success,fail}){mediaError?fail():success({duration:seconds});},
  createInnerAudioContext(){let ready,error;return {duration:seconds,autoplay:false,onCanplay(fn){ready=fn;},onError(fn){error=fn;},play(){played++;},destroy(){destroyed++;},set src(value){queueMicrotask(()=>mediaError?error():ready());}};}
};
function load(name){if(cache.has(name))return cache.get(name);const exports={};cache.set(name,exports);vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../miniprogram/services/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:p=>load(p.split('/').pop()),wx,setTimeout,clearTimeout,setInterval,clearInterval});return exports;}
const g=load('homeworkGrading'),media=load('homeworkMedia'),MB=1024*1024;
for(const [type,name,max] of [['photo','p.jpg',20],['video','v.mp4',100],['audio','a.mp3',20],['file','p.pdf',50]]){
  assert.equal(g.homeworkFileError(name,max*MB,type,false),'');
  assert.match(g.homeworkFileError(name,max*MB+1,type,false),/上限/);
}
assert.equal(g.homeworkAttachmentError(Array.from({length:10},()=>({type:'file',size:20*MB}))), '');
assert.match(g.homeworkAttachmentError(Array.from({length:11},()=>({type:'file',size:1}))),/10/);
assert.match(g.homeworkAttachmentError([{type:'video',size:100*MB},{type:'video',size:100*MB},{type:'photo',size:1}]),/200MB/);
assert.match(g.homeworkAttachmentError([{type:'audio',size:20*MB+1}]),/大小限制/);
assert.equal(g.homeworkMediaDurationError('video',180),'');
assert.match(g.homeworkMediaDurationError('video',181),/3 分钟/);
assert.equal(g.homeworkMediaDurationError('audio',300),'');
assert.match(g.homeworkMediaDurationError('audio',301),/5 分钟/);
assert.match(g.homeworkMediaDurationError('audio',NaN),/无法读取/);
await media.validateHomeworkMedia('/local/audio.mp3','audio');
seconds=301;await assert.rejects(media.validateHomeworkMedia('/local/audio.mp3','audio'),/5 分钟/);
seconds=180;await media.validateHomeworkMedia('/local/video.mp4','video');
seconds=181;await assert.rejects(media.validateHomeworkMedia('/local/video.mp4','video'),/3 分钟/);
mediaError=true;await assert.rejects(media.validateHomeworkMedia('/bad/audio.mp3','audio'),/无法读取/);
assert.equal(played,0,'Metadata validation must never autoplay a child recording');
assert.equal(destroyed,3,'All audio validation paths release the metadata player');
const js=readFileSync(new URL('./homework-prototype.js',import.meta.url),'utf8');
assert.ok(!js.includes('Math.round(file.size * 0.42)'), 'No invented compression result');
console.log('PASS file policy: exact size/duration boundaries, attachment count/total, metadata-only audio/video validation and no fabricated compression size.');
