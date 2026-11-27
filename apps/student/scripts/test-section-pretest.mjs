import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const records = new Map();
const localStorage = { getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value) };
function load(file, dependencies = {}) {
  const js = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, localStorage, require: name => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  } });
  return exports;
}
const progress = load('services/bookKnowledgeProgress.ts');
// Recommendation respects state priority, textbook order, and manual-learning evidence boundaries.
const points=[{id:'r'},{id:'u'},{id:'e'},{id:'w1'},{id:'w2'},{id:'m'}];
const health={r:{status:'reviewing'},u:{status:'unknown'},e:{status:'exploring'},w1:{status:'weak'},w2:{status:'weak'},m:{status:'mastered'}};
assert.equal(progress.recommendSectionPoint(points,health).id,'w1');
assert.equal(progress.recommendSectionPoint([...points].reverse(),health).id,'w2');
assert.equal(progress.recommendSectionPoint(points.slice(0,3),health).id,'e');
assert.equal(progress.recommendSectionPoint(points.slice(0,2),health).id,'u');
assert.equal(progress.recommendSectionPoint([points[0],points[5]],health).id,'r');
assert.equal(progress.recommendSectionPoint([points[5]],health),undefined);
assert.equal(progress.recommendSectionPoint([],health),undefined);
const beforeWatch=progress.recommendSectionPoint(points,health);
progress.writeBookPointProgress('book','w1',{watched:true});
assert.equal(progress.recommendSectionPoint(points,health),beforeWatch);
assert.equal(progress.applyPointPractice({}, {sessionId:'sample',questions:[{questionId:'q',isCorrect:true}],totalCount:1,correctCount:1}, true).questionStates.q, undefined);
const prototype = load('components/PersonalizedLearning/prototypePointHealth.ts', {'../../services/bookKnowledgeProgress':progress});
const entrySource=fs.readFileSync(path.join(root,'components/PersonalizedLearning/BookKnowledgeLearning.tsx'),'utf8');
assert.equal(/openPretest|pretestAvailable|开始学前测/.test(entrySource),false);
assert.equal(entrySource.includes('children[1]'),false);
assert.equal(progress.readBookPointProgress('book',progress.prototypeChapterId('chapter')).prototypeRevision,undefined);
progress.resetPrototypeChapter('book','chapter');
assert.equal(progress.readBookPointProgress('book',progress.prototypeChapterId('chapter')).prototypeRevision,1);
progress.writeBookPointProgress('book|chapter-demo:chapter:1','point',{questionStates:{q:'weak'}});
progress.resetPrototypeChapter('book','chapter');
assert.equal(progress.readBookPointProgress('book',progress.prototypeChapterId('chapter')).prototypeRevision,2);
assert.equal(prototype.getPrototypePointHealth('book|chapter-demo:chapter:2','point',true).score,null);
assert.equal(prototype.getPrototypePointHealth('book|chapter-demo:chapter:1','point',true).status,'weak');
assert.equal(progress.readBookPointProgress('book',progress.prototypeChapterId('other')).prototypeRevision,undefined);
assert.equal(progress.readBookPointProgress('other-book',progress.prototypeChapterId('chapter')).prototypeRevision,undefined);
assert.equal(prototype.getPrototypePointHealth('book|section-demo','point',true).score,null);
progress.writeBookPointProgress('book|section-demo','point',{questionStates:{q:'weak'}});
assert.equal(prototype.getPrototypePointHealth('book|section-demo','point',true).status,'weak');
assert.equal(prototype.getPrototypePointHealth('book|other-demo','point',true).score,null);

// Exercise the actual pointer handlers: blank taps restore, gestures/cancels do not.
const node = {point:{id:'node',name:'知识点'},x:100,y:100,depth:0};
const React = {createElement:(tag,props,...children)=>({tag,props:{...props,children}}), useCallback:fn=>fn, useEffect:()=>{}, useRef:value=>({current:value}), useState:value=>[value,()=>{}]};
const graph = load('components/PersonalizedLearning/BookBranchGraph.tsx', {'react': {...React,default:React}, './bookLearningGraph':{layoutBookGraph:()=>({nodes:[node],edges:[]})}});
let selected = 0, restored = 0;
const view = graph.BookBranchGraph({groups:[],onSelect:()=>selected++,onBackgroundClick:()=>restored++});
const element = {clientWidth:500,clientHeight:300,getBoundingClientRect:()=>({left:0,top:0,width:500,height:300}),setPointerCapture:()=>{},hasPointerCapture:()=>false};
view.props.ref.current = element;
const event = (x,y,pointId='',pointerId=1)=>({button:0,clientX:x,clientY:y,pointerId,currentTarget:element,target:{closest:()=>pointId?{getAttribute:()=>pointId}:null}});
view.props.onPointerDown(event(100,100,'node')); view.props.onPointerUp(event(100,100,'node'));
assert.equal(selected,1); assert.equal(restored,0);
view.props.onPointerDown(event(200,200)); view.props.onPointerUp(event(200,200));
assert.equal(restored,1);
view.props.onPointerDown(event(200,200));
for(let x=201;x<=210;x++) view.props.onPointerMove(event(x,200));
view.props.onPointerUp(event(210,200)); assert.equal(restored,1);
view.props.onPointerDown(event(200,200)); view.props.onPointerCancel(event(200,200)); assert.equal(restored,1);
view.props.onPointerDown(event(100,100)); view.props.onPointerDown(event(200,200,'',2));
view.props.onPointerUp(event(200,200,'',2)); view.props.onPointerUp(event(100,100)); assert.equal(restored,1);
console.log('PASS: recommendation priority, textbook order, mastered/empty states, activity isolation, chapter reset and blank-tap vs gesture behavior.');
