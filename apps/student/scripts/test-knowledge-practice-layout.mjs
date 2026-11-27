import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function load(file,deps={}){
 const output=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};vm.runInNewContext(output,{exports,require:name=>{if(!(name in deps))throw Error(name);return deps[name];}});return exports;
}
const config=load('data/knowledgePracticeConfig.ts');
const details=load('components/PersonalizedLearning/pointKnowledgeDetails.ts');
const resources=load('data/bookKnowledgeResources.ts',{'./knowledgePracticeConfig':config,'../components/PersonalizedLearning/pointKnowledgeDetails':details});
const allocations={基础:[2,3,1,0,0],进阶:[0,1,4,1,0],拓展:[0,0,1,3,2]};
for(const [difficulty,allocation] of Object.entries(allocations))for(const name of ['数轴','未接入知识点']){
 const paper=resources.getBookPointPractice('数学',{id:name,name},difficulty);
 assert.equal(paper.questions.length,6);
 assert.deepEqual(Array.from({length:5},(_,index)=>paper.questions.filter(q=>q.difficulty===index+1).length),allocation);
 assert.equal(new Set(paper.questions.map(q=>q.id)).size,6);
 assert.equal(new Set(paper.questions.map(q=>q.content.stem)).size,6);
 assert.equal(paper.simulated,true);
 for(const question of paper.questions.filter(q=>q.id.startsWith('book-practice-preview-')))assert.ok(question.content.stem.includes('流程模拟题'));
}
const graph=load('components/PersonalizedLearning/bookLearningGraph.ts');
const leaf=(id)=>({point:{id,name:'一个需要两行显示的较长知识点名称'},children:[]});
const branch={point:{id:'branch',name:'章节知识点'},children:[leaf('c1'),{point:{id:'deep',name:'多层知识点'},children:[leaf('d1'),leaf('d2')]},leaf('c3'),leaf('c4')]};
for(const roots of [Array.from({length:9},(_,i)=>leaf('p'+i)),[branch,...Array.from({length:5},(_,i)=>leaf('root'+i))]]){
 const layout=graph.layoutBookGraph([{catalog:{},points:[],roots}]);
 for(let a=0;a<layout.nodes.length;a++)for(let b=a+1;b<layout.nodes.length;b++){
  const n=layout.nodes[a],m=layout.nodes[b];
  assert.ok(Math.abs(n.x-m.x)>=150||Math.abs(n.y-m.y)>=160,'node and two-line label boxes overlap');
 }
 for(const edge of layout.edges){
  const commands=graph.knowledgeEdgePath(edge,layout.nodes,'branch',24).match(/[ML][\d.,-]+/g);
  const vertices=commands.map(command=>command.slice(1).split(',').map(Number));
  for(let i=1;i<vertices.length;i++)for(const node of layout.nodes){
   const label={left:node.x-62,right:node.x+62,top:node.y+(node.depth?26:29),bottom:node.y+98};
   const [a,b]=[vertices[i-1],vertices[i]];
   for(let step=0;step<=100;step++){
    const x=a[0]+(b[0]-a[0])*step/100,y=a[1]+(b[1]-a[1])*step/100;
    assert.ok(!(x>label.left&&x<label.right&&y>label.top&&y<label.bottom),`line crosses label ${node.point.id}`);
   }
  }
 }
}
console.log('PASS: all practice allocations, six distinct preview questions, explicit simulation, two-line label spacing and edge clearance.');
