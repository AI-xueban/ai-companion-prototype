/** Shared display rules for native pages and browser previews. Service results drive completion, never the estimate. */
export interface GradingQuestion {
  id: string; label: string; state: string; correct: boolean; answer: string;
  standardStatus?: 'pending'|'processing'|'ready'; standardVersion?: number; recognizedFinalAnswer?: string;
  aiCorrect?: boolean; aiState?: string; aiAnswer?: string; aiExplanation?: string;
  aiUnavailable?: boolean;
  explanationInvalidated?: boolean;
  reviewReason?: 'answer-changed'|'manual-hold'; decisionSource?: 'ai'|'teacher';
  studentAnswer?: string; answerVersion?: number; reviewedAt?: string;
  releasedSignature?: string; releasedAt?: string; estimatedMinutes?: number;
  stem?: string; analysis?: string; explanation?: string; keyPoint?: string; knowledge?: string; knowledgeVideoUrl?: string;
}
export const DEMO_QUESTION_CONTENT = [
  { stem: '计算：1/2 + 1/4 =（　）。', analysis: '异分母分数相加，先通分，再把分子相加。', explanation: '1/2 = 2/4，所以 1/2 + 1/4 = 2/4 + 1/4 = 3/4。', keyPoint: '通分时分数的大小不变；结果能约分时要约分。', knowledge: '异分母分数加法' },
  { stem: '学校合唱队有 40 名学生，其中男生占 3/5，男生有多少人？', analysis: '把合唱队总人数看作单位“1”，求一个数的几分之几用乘法。', explanation: '40 × 3/5 = 24（人）。答：男生有 24 人。', keyPoint: '对应数量＝单位“1”的量 × 对应分率。', knowledge: '分数乘法应用题' },
];
export function demoQuestionContent(id: string) { return DEMO_QUESTION_CONTENT[/q2$/.test(id) ? 1 : 0]; }
// 用户提供的两页纸质作业；同一照片用于多个学生时仅作演示样张。
export function demoPhotoPath(itemId: string) {
  return /(?:grading|console)-page-[12]$/.test(itemId) ? '/assets/homework-real-page-' + (/2$/.test(itemId) ? '2.png' : '1.jpg') : '/assets/homework-demo-paper.png';
}
export function realPhotoQuestions(itemId: string, prefix: string) {
  const second = /2$/.test(itemId);
  const content = second ? [
    { label:'第 23 题 · 分数乘法', stem:'探索 3/7 × 2/5：画图表示、参照整数与小数乘法写出计算过程，并总结分数乘法法则。本题题干在第 1 页，续答在第 2 页。', answer:'6/35', studentAnswer:'6/35（部分过程待核实）', correct:true, state:'review' as const, region:{x:.065,y:.015,width:.905,height:.42}, analysis:'分数乘法可以理解为求一个分数的几分之几。跨页的画图和推导过程需结合两页核对。', explanation:'把 3/7 改写为 3 × 1/7，把 2/5 改写为 2 × 1/5，积为（3 × 2）×（1/7 × 1/5）＝6/35。分子相乘作分子，分母相乘作分母。', keyPoint:'结果为 6/35；画图与手写推导尚需教师复核。', knowledge:'分数乘法的意义与计算法则' },
    { label:'第 24 题 · 路程问题', stem:'上午走了这段路程的 1/4，下午又走了这段路程的 3/8。（1）已经走了几分之几？（2）还剩几分之几没走完？', answer:'（1）5/8；（2）3/8', studentAnswer:'（1）1/4 + 3/8 = 2/8 + 2/8 = 1/2；（2）3/8', correct:false, state:'confirmed' as const, region:{x:.012,y:.565,width:.975,height:.395}, analysis:'把整段路程看作单位“1”。已走路程相加，剩余路程用 1 减去已走部分。', explanation:'（1）1/4 + 3/8 = 2/8 + 3/8 = 5/8。原作答把 3/8 错写成了 2/8。（2）1 − 5/8 = 3/8。第（1）问错误，第（2）问结果正确。', keyPoint:'通分只改写 1/4 为 2/8，3/8 保持不变。', knowledge:'异分母分数加减法、路程应用题' }
  ] : [
    { label:'第 21 题 · 线段图', stem:'看图列算式或方程，并解答：男生有 24 人，对应 4 份，全班对应 7 份。全班有多少人？', answer:'42 人', studentAnswer:'24 ÷ 4 = 6；6 × 7 = 42（人）', correct:true, state:'confirmed' as const, region:{x:.112,y:.16,width:.425,height:.17}, analysis:'先根据男生的 24 人求出每份人数，再求全班 7 份的人数。', explanation:'每份人数为 24 ÷ 4 = 6（人），全班人数为 6 × 7 = 42（人）。答：全班有 42 人。', keyPoint:'24 人对应 4 份，全班对应 7 份。', knowledge:'线段图与倍比问题' },
    { label:'第 22 题 · 列方程', stem:'看图列方程，并解答：上方线段为 x，下方线段为 4x，两段合计 78.5。求 x。', answer:'15.7', studentAnswer:'x + 4x = 78.5；5x = 78.5；x = 15.7', correct:true, state:'confirmed' as const, region:{x:.085,y:.379,width:.40,height:.217}, analysis:'两条线段的长度分别为 x 和 4x，合计 78.5，据此列方程。', explanation:'x + 4x = 78.5，合并同类项得 5x = 78.5，两边同时除以 5，得 x = 15.7。', keyPoint:'右侧大括号表示上下两段合计。', knowledge:'看图列方程、一元一次方程' }
  ];
  return content.map((q,index)=>({...q,id:prefix+'q'+(index+1),questionVersion:1,answerVersion:1}));
}
export function gradingSignature(q: GradingQuestion): string {
  return JSON.stringify([q.reviewReason||'',q.decisionSource||'',q.state,q.correct,q.answer,q.answerVersion||1,q.reviewedAt||'',q.explanation||'']);
}
export function isFormalGrade(q:GradingQuestion){return q.state==='confirmed'&&!q.reviewReason;}
// Compatibility name: eligible current results are now visible without a release action.
export function isResultReleased(q:GradingQuestion){return isFormalGrade(q);}
export function canUseAIExplanation(q:GradingQuestion){return isFormalGrade(q)&&!q.explanationInvalidated&&!(q.decisionSource==='teacher'&&typeof q.aiCorrect==='boolean'&&q.aiCorrect!==q.correct);}
export function releaseQuestion(q:GradingQuestion,at:string){if(!isFormalGrade(q))return false;q.releasedSignature=gradingSignature(q);q.releasedAt=at;return true;}
export function gradeLabel(q:GradingQuestion):string {
  return ({queued:'等待批改',processing:'正在批改',failed:'批改失败',review:'待核对',unreadable:'无法批改','no-answer':'暂无答案',unanswered:'未作答'} as Record<string,string>)[q.state]||(isFormalGrade(q)?q.correct?'正确':'错误':'待核对');
}
export function parentGradeLabel(q:GradingQuestion){return gradeLabel(q);}
export function gradingProgress(questions:GradingQuestion[],_parent=false){
  const pending=questions.filter(q=>['queued','processing'].includes(q.state));
  const failed=questions.filter(q=>q.state==='failed').length,valid=questions.filter(isFormalGrade);
  const estimates=pending.map(q=>q.estimatedMinutes).filter((n):n is number=>typeof n==='number'&&Number.isFinite(n)&&n>0);
  const estimate=estimates.length?Math.ceil(Math.max(...estimates)):null;
  const review=questions.length-pending.length-failed-valid.length;
  const title=pending.length?`${pending.every(q=>q.state==='queued')?'等待批改':'正在批改'}${estimate?`，预计还需约 ${estimate} 分钟`:'，请稍后查看'}`:failed?'部分题目批改失败':review?'部分题目待处理，已有结果可查看':valid.length?'批改结果已同步':'暂无批改结果';
  return {title,total:questions.length,pending:pending.length,failed,confirmed:valid.length,released:valid.length,review,correct:valid.filter(q=>q.correct).length,wrong:valid.filter(q=>!q.correct).length,unavailable:questions.length-valid.length,estimate};
}
export interface AnswerStandard {
  questionId:string; label:string; stem:string; teacherAnswer:string; teacherExplanation:string; aiAnswer:string; aiExplanation:string;
  demoTeacherReference?:boolean;
  answer:string; explanation:string; source:'teacher'|'ai'|'custom'|''; version:number; status:'pending'|'approved'|'processing'|'review';
  confirmedBy?:string; confirmedAt?:string; history?:Array<{version:number;answer:string;source:string;at:string;by:string}>;
}
export interface StandardTask { id?:string; deadline?:string; answerStandards?:AnswerStandard[]; gradingPolicyVersion?:number }
// The mock catalog uses an assigned question ID. Real uploaded pages need verified mapping first.
export function teacherReference(task:StandardTask,questionId:string,parent=false,now=Date.now()) {
  const reference=task.answerStandards?.find(s=>s.questionId===questionId);
  if(!reference)return null;
  const answer=reference.source==='custom'?reference.answer:reference.teacherAnswer;
  const explanation=reference.source==='custom'?reference.explanation:reference.teacherExplanation;
  if(!answer?.trim())return null;
  const deadline=task.deadline?new Date(task.deadline.replace(' ','T')).getTime():NaN;
  const locked=parent&&(!Number.isFinite(deadline)||now<deadline);
  return {answer:locked?'':answer,explanation:locked?'':explanation,locked,availableAt:task.deadline||''};
}
export interface StandardRecord { questions:GradingQuestion[] }
export function answersEquivalent(a:string,b:string){
  const tidy=(s:string)=>s.replace(/[（(][12][)）]/g,'').replace(/\s|[（）()。]/g,'');
  const x=tidy(a),y=tidy(b);if(x===y)return Boolean(x);
  const parse=(text:string)=>text.split(/[；;]/).map(part=>{const match=part.match(/^([+-]?\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?(人|个|米|厘米|千米|cm|km|m|元|分钟|小时)?$/);if(!match)return null;return {value:Number(match[1])/(match[2]?Number(match[2]):1),unit:match[3]||''};});
  const u=parse(x),v=parse(y);return u.length===v.length&&u.every((n,i)=>{const other=v[i];return n!==null&&other!==null&&Number.isFinite(n.value)&&Number.isFinite(other.value)&&(!n.unit||!other.unit||n.unit===other.unit)&&Math.abs(n.value-other.value)<1e-9;});
}
export function standardPhase(task:StandardTask){return task.answerStandards?.length?'ready':'legacy';}
function preserveAI(q:GradingQuestion){
  if(q.aiAnswer===undefined){q.aiAnswer=q.answer;q.aiExplanation=q.explanation||q.analysis||'';}
  if(!q.aiUnavailable&&!['queued','processing','failed'].includes(q.state)&&q.aiCorrect===undefined){q.aiCorrect=q.correct;q.aiState=q.state;}
}
export function initializeAnswerStandards(task:StandardTask,records:StandardRecord[],conflicts=false){
  // Restore snapshots from the old reference-driven demo once; never invent a missing AI verdict.
  if(task.gradingPolicyVersion!==3){
    records.forEach(r=>r.questions.forEach(q=>{
      if(q.standardVersion||q.reviewReason==='answer-changed'){
        if(q.aiAnswer!==undefined){q.answer=q.aiAnswer;q.explanation=q.aiExplanation||'';q.analysis=q.aiExplanation||'';}
        if(q.standardVersion&&!q.aiState&&q.decisionSource!=='teacher'){q.aiUnavailable=true;q.state='review';q.reviewReason='manual-hold';}
        if(q.reviewReason==='answer-changed'){
          if(q.decisionSource==='teacher')delete q.reviewReason;
          else if(!q.aiUnavailable&&q.aiState&&typeof q.aiCorrect==='boolean'){q.state=q.aiState;q.correct=q.aiCorrect;delete q.reviewReason;}
          else {q.state='review';q.reviewReason='manual-hold';}
        }
      }
      delete q.standardStatus;delete q.standardVersion;
    }));
    task.answerStandards?.forEach(s=>{if(s.version)s.status='approved';});task.gradingPolicyVersion=3;
  }
  const unique=new Map<string,GradingQuestion>();records.forEach(r=>r.questions.forEach(q=>{preserveAI(q);if(!unique.has(q.id))unique.set(q.id,q);}));
  const existing=task.answerStandards||[];
  // Legacy unconfirmed mock references were copied from one student's AI result.
  // Clear that copy; only a teacher save may provide the reference.
  existing.forEach(s=>{if(!s.version&&!s.confirmedBy&&!s.demoTeacherReference){s.teacherAnswer='';s.teacherExplanation='';}});
  task.answerStandards=[...existing,...[...unique.values()].filter(q=>!existing.some(s=>s.questionId===q.id)).map((q,index)=>({questionId:q.id,label:q.label,stem:q.stem||'',teacherAnswer:conflicts&&index===0?'40 人':'',teacherExplanation:conflicts&&index===0?'演示用教师意见：全班人数为 40 人。':'',demoTeacherReference:conflicts&&index===0,aiAnswer:q.aiAnswer||q.answer,aiExplanation:q.aiExplanation||q.explanation||'',answer:'',explanation:'',source:'' as const,version:0,status:'pending' as const}))];
}
export function confirmAnswerStandard(task:StandardTask,_records:StandardRecord[],id:string,source:'teacher'|'ai'|'custom',by:string,answer='',explanation=''){
  const s=task.answerStandards?.find(s=>s.questionId===id);if(!s)return false;
  const value=source==='teacher'?s.teacherAnswer:source==='ai'?s.aiAnswer:answer,detail=source==='teacher'?s.teacherExplanation:source==='ai'?s.aiExplanation:explanation;
  if(!value.trim())return false;
  s.version++;s.answer=value.trim();s.explanation=detail.trim();s.source=source;s.status='approved';s.confirmedAt=new Date().toISOString();s.confirmedBy=by;s.history=[...(s.history||[]),{version:s.version,answer:s.answer,source,at:s.confirmedAt,by}];return true;
}
export function startStandardGrading(_task:StandardTask,_records:StandardRecord[]){return false;}
export function completeMockStandardGrading(_task:StandardTask,_records:StandardRecord[]){return false;}
export function confirmManualResult(_task:StandardTask,_records:StandardRecord[],q:GradingQuestion,correct:boolean,at:string){
  preserveAI(q);if(q.correct!==correct||q.aiUnavailable||q.aiCorrect===undefined)q.explanationInvalidated=true;q.correct=correct;q.state='confirmed';q.decisionSource='teacher';q.reviewedAt=at;delete q.reviewReason;
}
export function holdManualResult(q:GradingQuestion,at:string){preserveAI(q);q.state='review';q.reviewReason='manual-hold';q.reviewedAt=at;}
export function gradingStatistics(questions:GradingQuestion[]){
  const valid=questions.filter(isFormalGrade),wrong=valid.filter(q=>!q.correct).length;
  return {ratePending:false,wrongRate:valid.length?Math.round(wrong/valid.length*100):null,correctness:valid.length?Math.round((valid.length-wrong)/valid.length*100):null};
}
