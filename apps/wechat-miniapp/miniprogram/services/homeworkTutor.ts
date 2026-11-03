/** Shared, deterministic teaching controller. Sample content only; never mutates grading records. */
export const TUTOR_STORAGE_KEY = 'homework_tutor_sessions_v1';
export interface TutorQuestion { id:string; stem?:string; answer:string; questionVersion?:number; answerVersion?:number; state:string; reviewReason?:string; correct?:boolean; reviewedAt?:string; explanation?:string }
export interface TutorSource { accountId:string; studentId:string; taskId:string; itemId:string; submissionVersion:number; question:TutorQuestion }
export interface TutorBoard { lines:string[]; columns:number; rows:number; fillColumns:number; fillRows:number; caption:string }
export interface TutorAction {
  id:string; title:string; tag:string; speech:string; board:TutorBoard;
  prompt?:string; options?:string[]; accepted?:string[]; rejected?:string[];
  hint?:string; explanation?:string; followup?:string;
}
export interface TutorEvidence { objective:string; status:'有帮助完成'|'本次回答符合判据'|'仍需巩固'|'未验证'; helped:boolean; attempts:number }
export type TutorPhase = 'playing'|'waiting'|'feedback'|'remedial'|'paused'|'resume'|'choice'|'aside'|'done'|'unsupported'|'transfer';
export interface TutorSession {
  schema:1; key:string; fingerprint:string; epoch:number; cursor:number; phase:TutorPhase;
  returnPhase:TutorPhase; asideReturn?:TutorPhase; draft:string; feedback:string; detail:string; helped:boolean;
  rounds:number; clarifications:number; evidence:TutorEvidence[]; silent:boolean; direct:boolean;
  parentMode:boolean; updatedAt:number; sourceAnswerSeen:boolean; originalOpen:boolean; hold:boolean; transferStatus?:string; transferHelped?:boolean;
}
const clean = (s:string) => s.trim().replace(/\s|[，。！？、；：,.!?;:（）()]/g,'').toLowerCase();
const board = (lines:string[], columns=0, rows=0, fillColumns=0, fillRows=0, caption=''):TutorBoard => ({lines,columns,rows,fillColumns,fillRows,caption});
const action = (id:string,title:string,speech:string,b:TutorBoard,extra:Partial<TutorAction>={}):TutorAction => ({id,title,speech,board:b,tag:'分步讲解',...extra});
export function tutorPlan(q:TutorQuestion):TutorAction[] {
  const stem=(q.stem||'').replace(/\s/g,''), answer=clean(q.answer);
  const scenario=/^tutor-scenario-(\d+)-q1$/.exec(q.id);
  if(scenario){
    const cases:[string,string,string,string,string,string,string,string,string,string][]=[
      ['比多比少','24张是小明的张数；“小红比小明多8张”说明要在24上增加。','小红有多少张？','32张','16张','24 + 8 = 32（张）','再画两条线段：小红那条比小明多出8格。','若小明有20张，小红多5张，小红有多少张？','25张','小红=小明+多出的张数。'],
      ['分数应用题','女生12人是男生人数的3/4；男生人数才是这里的整体。','12人对应几份？','3份','4份','12÷3=4人/份，男生有4份，所以4×4=16人。','先把男生画成4个相同的小格，女生占其中3格。','女生15人是男生的3/5，男生有多少人？','25人','15÷3×5=25人。'],
      ['组合图形面积','大长方形中缺去一个小长方形，实际图形要扣除缺口。','应计算哪部分面积？','大长方形减缺口','只算大长方形','8×6−3×2=42（平方厘米）。','先用笔圈出不属于图形的3×2缺口。','8×5的长方形挖去2×2，余下面积是多少？','36平方厘米','40−4=36。'],
      ['去括号方程','3乘的是整个(x−2)，括号里两项都要乘3。','去括号后左边是什么？','3x−6','3x−2','3x−6=12，3x=18，x=6。','代回：3×(6−2)=12。','2(y−3)=10，y是多少？','8','2y−6=10，y=8。'],
      ['几何证明','图上看着相等还不够；需要写出可用于证明的已知条件。','由D是BC中点，可以得到什么？','BD=DC','AB=AC','AB=AC、BD=DC、AD公共，△ABD≅△ACD，所以∠BAD=∠CAD。','把两边三角形共有的AD也标出来。','两三角形三边对应相等，可以判定什么？','全等','用SSS判定全等。'],
      ['阅读理解','“好孩子”是感受，回答还要指出文中的具体动作和它表现的品质。','哪句动作最能支持你的判断？','把伞向同学那边倾斜','他是好孩子','小宇把伞向同学那边倾斜，表现他关心同学、愿意照顾别人。','按“文中动作→人物品质”组织答案。','人物把座位让给老人，表现什么？','关心他人','用让座动作支撑判断。'],
      ['英语时态','Look! 提醒我们动作正在发生；Tom是单数不能单独决定时态。','这里应选择什么形式？','is playing','plays','Look! Tom is playing football in the playground.','先找时间信号词，再看主语决定be动词。','Listen! She ___ a song.','is singing','Listen! 提示现在进行时。'],
      ['猜对但理由错','结论“两个负数相乘为正”是对的，但“乘法总让数变大”不是普遍规律。','2×0.5 会让数变大吗？','不会','会','乘法可能变大也可能变小；本题依据是负负得正。','用反例检查自己说的“总是”。','−3×−2 的符号是什么？','正','负负得正。']
    ];
    const c=cases[Number(scenario[1])-1];if(!c)return [];
    const prefix='scenario-'+scenario[1]+'-';
    return [
      action(prefix+'read','先读懂题目',c[1],board([c[0],c[1]],0,0,0,0,'从学生原题出发')),
      action(prefix+'check','先判断关键一步','别急着看完整答案，先说说这一步。',board([c[2]],0,0,0,0,'轮到你判断'),{tag:'敲重点',prompt:c[2],options:[c[3],c[4]],accepted:[c[3]],rejected:[c[4]],hint:c[6],explanation:c[9]}),
      action(prefix+'solve','把理由讲完整',c[5],board([c[5]],0,0,0,0,'对照原题核查'),{tag:'难点步骤'}),
      action(prefix+'method','带走这道题的方法',c[9],board([c[9],c[7]],0,0,0,0,'再试一个同类判断'),{tag:'本题方法'})
    ];
  }
  if(stem.includes('3/7')&&stem.includes('2/5')&&answer==='6/35')return [
    action('whole','先确定整体','这个长方形代表单位“1”。我们先表示七分之三，再理解它的五分之二。',board(['整个长方形 = 单位“1”'],1,1,0,0,'先看整体')),
    action('first','表示七分之三','把同一个长方形平均分成七列，取其中三列。绿色部分是整体的七分之三。',board(['平均分成7列，取3列'],7,1,3,0,'绿色表示 3/7')),
    action('base','判断取部分的对象','这里的五分之二，是从哪一个量中取？请先判断。',board(['求 3/7 的 2/5'],7,1,3,0,'保留已知图形'),{tag:'敲重点',prompt:'这里的 2/5 是从哪部分取？',options:['绿色部分','整个长方形'],accepted:['绿色部分','绿色','七分之三','3/7'],rejected:['整个长方形','整体','单位1'],hint:'找一找“谁的五分之二”中的“谁”。',explanation:'这里求的是七分之三的五分之二，所以应把绿色部分作为这一次取部分的对象；单位整体仍是原长方形。',followup:'请区分：取整个长方形的2/5，与取绿色部分的2/5，得到的区域相同吗？'}),
    action('second','再等分，取其中两份','保留原来的七列，横向平均分成五行。从绿色区域中取两行，用蓝紫色标出来。横分便于同时看清两次等分，不是唯一合法画法。',board(['保留7列 → 平均分成5行','在绿色部分中取2行'],7,5,3,2,'蓝紫色表示部分中的部分'),{tag:'难点步骤'}),
    action('area','对应到整个长方形','现在看蓝紫色区域相对于整个长方形占多少。先数总份数，再数取出的份数。',board(['每个小格面积相同','总份数 = ？　取的份数 = ？'],7,5,3,2,'请根据等面积小格说明'),{prompt:'蓝紫色占整个长方形的几分之几？',options:['6/35','2/5','3/7'],accepted:['6/35','三十五分之六','总共35格取6格'],rejected:['2/5','3/7','5/12'],hint:'整体有7列、5行，蓝紫色有3列、2行。',explanation:'整体有7×5=35个等面积小格，蓝紫色有3×2=6个，所以相对整体是6/35。只说2/5会丢掉“这是绿色部分的2/5”这个条件。',followup:'换一个观察角度：为什么不能只用蓝紫色的2行除以整个图的5行？'}),
    action('method','把图形与计算连起来','分子相乘表示取出的份数，分母相乘表示整体被等分的份数。以后遇到一个量的几分之几，先明确取部分的对象。',board(['3/7 × 2/5 = (3×2)/(7×5) = 6/35','识别：一个量的几分之几','边界：分清整体与这次取部分的对象'],7,5,3,2,'图形、份数与算式一致'),{tag:'本题方法'})
  ];
  if(stem.includes('1/2+1/4')&&answer==='3/4')return [
    action('read','先看分数单位','一半和四分之一的每一份大小不同。把同一个整体分成同样大的小份，才能直接合并份数。',board(['1/2 + 1/4','分数单位不同，先统一'],2,1,1,0,'同一个单位整体')),
    action('unit','先确定共同单位','把一半改写成四分之几，大小才保持不变？',board(['1/2 = ？/4'],4,1,2,0,'观察同一整体的一半'),{tag:'敲重点',prompt:'1/2 = ?/4，分子应该填几？',options:['2','1','3'],accepted:['2','2/4','四分之二','两份'],rejected:['1','3','1/4','3/4'],hint:'整个图有4个相等小格，一半占几个？',explanation:'分母从2变成4，相当于每份再分成2份；分子也要乘2。因此1/2=2/4，分数的大小没有变。',followup:'如果只改分母不改分子，分数大小会保持不变吗？'}),
    action('combine','合并相同大小的份','把两个四分之一与一个四分之一放在一起。分母描述每份大小，分子描述有几份。',board(['1/2 = 2/4','2/4 + 1/4 = ？'],4,1,2,0,'先统一单位，再合并份数'),{tag:'难点步骤'}),
    action('result','试着完成这一步','现在把相同分数单位的份数合并，结果是多少？',board(['2个1/4 + 1个1/4 = ？'],4,1,2,0,'请先作答'),{prompt:'1/2 + 1/4 等于多少？',options:['3/4','2/6','2/4'],accepted:['3/4','四分之三','0.75'],rejected:['2/6','2/4','1/2'],hint:'已经有2份，再合并1份，每份还是1/4。',explanation:'2/4+1/4=3/4。合并的是份数，不是把分母相加；分数单位仍是四分之一。',followup:'为什么这里把分子相加，而分母仍然是4？'}),
    action('method','归纳异分母分数加法','先通分，化为相同分数单位，再把分子相加，分母保持不变。最后检查是否需要约分。',board(['1/2 + 1/4 = 2/4 + 1/4 = 3/4','识别：异分母分数相加','路径：通分 → 合并 → 检查约分'],4,1,3,0,'三格表示 3/4'),{tag:'本题方法'})
  ];
  if(stem.includes('1/4')&&stem.includes('3/8')&&answer.includes('5/8'))return [
    action('whole','确定整段路程','上午和下午走的分数都相对于同一段路程。先把整段路程看作单位“1”。',board(['上午：整段的1/4','下午：整段的3/8'],8,1,0,0,'同一段路程')),
    action('convert','只改写需要通分的分数','四分之一改写成八分之几？三分之八不在本题中，本题下午原来就是八分之三。',board(['1/4 = ？/8','3/8 保持不变'],8,1,2,0,'不要误改原有的3/8'),{tag:'敲重点',prompt:'1/4 等于几份 1/8？',options:['2','3','1'],accepted:['2','2/8','两份'],rejected:['1','3'],hint:'分母4乘2变成8，分子也乘2。',explanation:'1/4=2/8。通分只改写1/4，下午的3/8保持原值。',followup:'通分时为什么3/8不需要改成2/8？'}),
    action('walked','先求已经走的部分','已经走的路程是上午与下午之和。',board(['已经走：2/8 + 3/8 = ？'],8,1,2,0,'合并相同大小的份'),{prompt:'已经走了整段路程的几分之几？',options:['5/8','1/2','3/8'],accepted:['5/8','八分之五','0.625'],rejected:['1/2','3/8'],hint:'合并2份和3份，每份都是1/8。',explanation:'2/8+3/8=5/8。原作答将3/8错写为2/8，这一步应保留下午的三份。',followup:'把下午的3/8写成2/8，会少算哪一份？'}),
    action('left','再求剩余','整段路程是1，也就是8/8。减去已经走的5/8，剩下3/8。',board(['已经走：5/8','还剩：1 − 5/8 = 3/8'],8,1,5,0,'未填色部分为剩余')),
    action('method','对照两问检查','两问相互关联，但要分别判断过程。第一问的错误不能被第二问恰好答对掩盖。',board(['（1）5/8　（2）3/8','识别：同一整体的部分相加，再求剩余','检查：已走 + 剩余 = 1']),{tag:'本题方法'})
  ];
  if(stem.includes('24')&&stem.includes('4份')&&stem.includes('7份')&&answer.includes('42'))return [
    action('known','找到已知量对应的份数','24人对应的是男生的4份，不是全班的7份。先分清数量与份数的对应。',board(['男生：24人 ↔ 4份','全班：？人 ↔ 7份']),{tag:'敲重点'}),
    action('one','先求每一份','已经知道4份一共24人，每份应该怎样求？',board(['4份 = 24人','1份 = ？人']),{prompt:'每份有多少人？',options:['6人','24人','7人'],accepted:['6','6人','24÷4','24/4'],rejected:['24','24人','7','7人'],hint:'24人平均分到4份中。',explanation:'24÷4=6人。先求每份，再求需要的7份，不能直接用24乘7。',followup:'这里为什么先除以4，而不是除以7？'}),
    action('all','由一份得到七份','每份6人，全班对应7份。请把数量和份数配起来。',board(['每份：6人','全班：6 × 7 = ？人']),{prompt:'全班有多少人？',options:['42人','28人','168人'],accepted:['42','42人','6×7'],rejected:['28','168','28人','168人'],hint:'全班是每份人数的7倍。',explanation:'6×7=42人。检验男生4份就是6×4=24人，与已知一致。',followup:'怎样用已知的男生人数检查每份人数是否正确？'}),
    action('method','归纳先求一份的方法','先用已知数量除以对应份数，再乘所求份数。数量与份数始终一一对应。',board(['24 ÷ 4 × 7 = 42（人）','路径：已知几份 → 每份 → 所求几份']),{tag:'本题方法'})
  ];
  if(stem.includes('78.5')&&stem.includes('4x')&&answer==='15.7')return [
    action('relation','先找等量关系','上下两段分别是x和4x，右侧合计78.5，因此把两段相加。',board(['上段：x　下段：4x','两段合计：78.5']),{tag:'敲重点'}),
    action('equation','根据合计列方程','请选出与两段合计相对应的方程。',board(['上段 + 下段 = 78.5']),{prompt:'哪个方程符合题意？',options:['x + 4x = 78.5','4x − x = 78.5'],accepted:['x+4x=78.5','5x=78.5'],rejected:['4x−x=78.5','4x-x=78.5'],hint:'大括号表示合计，应把两段相加。',explanation:'x+4x=78.5，合并得到5x=78.5。这里是相加关系，不是相差关系。',followup:'大括号表示的是两段合计，还是两段相差？'}),
    action('solve','求出一份的值','五份x合计78.5，请算出一份。',board(['5x = 78.5','x = 78.5 ÷ 5 = ？']),{prompt:'x 等于多少？',options:['15.7','19.625','73.5'],accepted:['15.7'],rejected:['19.625','73.5'],hint:'把78.5平均分成5份。',explanation:'78.5÷5=15.7。代回检验：15.7+4×15.7=78.5。',followup:'求出x后，可以怎样代回原等量关系检验？'}),
    action('method','检查方程与图形一致','先看图中的合计关系，再列方程、解方程并代回。',board(['x + 4x = 78.5','x = 15.7','检查：15.7 + 62.8 = 78.5']),{tag:'本题方法'})
  ];
  if(stem.includes('合唱队有40')&&stem.includes('3/5')&&answer.includes('24'))return [
    action('whole','确定单位整体','40人是合唱队总人数，男生占总人数的五分之三。',board(['合唱队总人数：40人','男生占总人数的3/5'],5,1,0,0,'整体是40人')),
    action('part','先求一份','40人平均分成5份，每份多少人？',board(['5份 = 40人','1份 = ？人'],5,1,1,0,'每份大小相同'),{prompt:'每份有多少人？',options:['8人','5人','3人'],accepted:['8','8人','40÷5'],rejected:['5','3','5人','3人'],hint:'总人数平均分成5份。',explanation:'40÷5=8人，每份对应总人数的五分之一。',followup:'分母5在这里表示什么？'}),
    action('boys','再取三份','男生占其中3份，求3份的人数。',board(['每份8人','男生：8 × 3 = ？人'],5,1,3,0,'取其中3份'),{prompt:'男生有多少人？',options:['24人','8人','40人'],accepted:['24','24人','8×3'],rejected:['8','40','8人','40人'],hint:'男生有3个8人。',explanation:'8×3=24人，也可以直接列40×3/5=24人。',followup:'为什么求男生人数不能只停在每份8人？'}),
    action('method','归纳求一个量的几分之几','先确定单位整体，再按分母等分、按分子取份，或使用乘法计算。',board(['40 × 3/5 = 24（人）','整体 → 等分 → 取份']),{tag:'本题方法'})
  ];
  return [];
}
export function tutorKey(source:TutorSource) { return JSON.stringify([source.accountId,source.studentId,source.taskId,source.itemId,source.question.id]); }
export function tutorFingerprint(source:TutorSource) { const q=source.question;return JSON.stringify([source.itemId,q.id,source.submissionVersion,q.questionVersion||1,q.answerVersion||1,q.stem,q.answer,q.state,q.reviewReason||'',q.correct,q.reviewedAt,q.explanation]); }
export function createTutor(source:TutorSource,previous?:TutorSession):TutorSession {
  const key=tutorKey(source),fingerprint=tutorFingerprint(source),plan=tutorPlan(source.question);
  const phases=['playing','waiting','feedback','remedial','paused','resume','choice','aside','done','unsupported','transfer'];
  if(previous?.schema===1&&previous.key===key&&previous.fingerprint===fingerprint&&Number.isInteger(previous.epoch)&&phases.includes(previous.phase)&&phases.includes(previous.returnPhase)&&Number.isInteger(previous.cursor)&&previous.cursor>=0&&previous.cursor<plan.length&&Array.isArray(previous.evidence)&&previous.evidence.every(e=>e&&typeof e.objective==='string'&&typeof e.status==='string'))return {...previous,epoch:previous.epoch+1,originalOpen:false,phase:previous.phase==='done'?'done':'resume',returnPhase:previous.phase==='paused'||previous.phase==='resume'?previous.returnPhase:previous.phase,updatedAt:Date.now()};
  return {schema:1,key,fingerprint,epoch:1,cursor:0,phase:plan.length?'playing':'unsupported',returnPhase:'playing',draft:'',feedback:previous?'题目或结果已更新，已按当前版本重新准备。':'',detail:'',helped:false,rounds:0,clarifications:0,evidence:[],silent:true,direct:false,parentMode:false,updatedAt:Date.now(),sourceAnswerSeen:true,originalOpen:false,hold:false};
}
export function tutorCurrent(session:TutorSession,plan:TutorAction[]) { return plan[Math.max(0,Math.min(session.cursor,plan.length-1))]; }
export function tutorText(s:TutorSession,p:TutorAction[]) {
  const a=tutorCurrent(s,p);if(s.phase==='unsupported')return '本题暂未配置可校验的互动讲解。可返回查看已有解析；当前演示不生成未经验证的答案。';
  if(s.phase==='aside')return s.detail;
  if(s.phase==='transfer'||s.phase==='paused'&&s.returnPhase==='transfer')return s.feedback||'这是独立标记的一道简短变式，可以借助刚才的方法判断，也可以跳过。原题的记录不会被这次结果覆盖。';
  if(s.phase==='paused'&&['feedback','remedial'].includes(s.returnPhase))return s.feedback;
  if(s.phase==='remedial'||s.phase==='feedback'||s.phase==='choice')return s.feedback;
  if(s.phase==='done')return '本次讲解已结束。回答表现仅记录在本次会话，原作业判分与提交状态保持不变。';
  if(s.phase==='resume')return '上次讲到“'+(a?.title||'当前步骤')+'”，可以继续讲解。';
  return a?.speech||'';
}
export function tutorTransfer(p:TutorAction[]) {
  const scenario=p.find(a=>/^scenario-\d+-read$/.test(a.id));
  if(scenario){const index=Number(scenario.id.split('-')[1])-1;const cases:[string,string[],string,string][]=[
    ['若小明有20张，小红多5张，小红有多少张？',['25张','15张'],'25张','小红=小明+多出的张数。'],
    ['女生15人是男生的3/5，男生有多少人？',['25人','9人'],'25人','15÷3×5=25人。'],
    ['8×5的长方形挖去2×2，余下面积是多少？',['36平方厘米','40平方厘米'],'36平方厘米','40−4=36。'],
    ['2(y−3)=10，y是多少？',['8','5'],'8','2y−6=10，y=8。'],
    ['两三角形三边对应相等，可以判定什么？',['全等','不能判断'],'全等','用SSS判定全等。'],
    ['人物把座位让给老人，表现什么？',['关心他人','跑得快'],'关心他人','用让座动作支撑判断。'],
    ['Listen! She ___ a song.',['is singing','sings'],'is singing','Listen! 提示现在进行时。'],
    ['−3×−2 的符号是什么？',['正','负'],'正','负负得正。']
  ];const c=cases[index];return {prompt:c[0],options:c[1],answer:c[2],explanation:c[3]};}
  if(p.some(a=>a.id==='area'))return {prompt:'变式：求2/3的3/4，这里的3/4从哪里取？',options:['2/3所表示的部分','整个长方形'],answer:'2/3所表示的部分',explanation:'先表示整体的2/3，再在这部分里取3/4。整体仍是原长方形。'};
  if(p.some(a=>a.id==='unit'))return {prompt:'变式：1/3 + 1/6，先把1/3改写成多少？',options:['2/6','1/6','3/6'],answer:'2/6',explanation:'把1/3的分子、分母同时乘2，得到2/6，再合并同单位的份数。'};
  if(p.some(a=>a.id==='convert'))return {prompt:'变式：上午走1/4，下午走1/8，已经走了多少？',options:['3/8','2/12','2/8'],answer:'3/8',explanation:'把1/4改写为2/8，下午的1/8不变，合计3/8。'};
  if(p.some(a=>a.id==='equation'))return {prompt:'变式：y + 3y = 20，合并后应是哪个关系？',options:['4y = 20','2y = 20','3y = 20'],answer:'4y = 20',explanation:'一个y加三个y，一共有四个y，因此4y=20。'};
  return {prompt:'变式：5份一共30人，每份有多少人？',options:['6人','5人','30人'],answer:'6人',explanation:'先求每份，用30÷5=6人；份数与人数要对应。'};
}
export type TutorEvent = {type:'tick'|'pause'|'resume'|'skip'|'hint'|'restart'|'back'|'direct'|'parent'|'original'|'closeOriginal'|'transfer';epoch?:number;input?:boolean}|{type:'answer'|'ask'|'draft';text:string;epoch?:number};
export function tutorReduce(session:TutorSession,plan:TutorAction[],event:TutorEvent):TutorSession {
  if(event.epoch!==undefined&&event.epoch!==session.epoch)return session;
  const s:TutorSession={...session,evidence:session.evidence.map(e=>({...e})),updatedAt:Date.now()};
  const a=tutorCurrent(s,plan);if(!a&&event.type!=='pause')return s;
  const saveEvidence=(status:TutorEvidence['status'])=>{const existing=s.evidence.find(e=>e.objective===a.id);if(existing){existing.status=status;existing.helped=s.helped;existing.attempts++;}else s.evidence.push({objective:a.id,status,helped:s.helped,attempts:1});};
  const next=()=>{s.cursor++;s.epoch++;s.draft='';s.detail='';s.feedback='';s.helped=false;s.rounds=0;s.clarifications=0;s.phase=s.cursor>=plan.length?'done':'playing';if(s.phase==='done')s.cursor=plan.length-1;};
  const pause=()=>{if(s.phase!=='paused'&&s.phase!=='done'&&s.phase!=='unsupported'){if(s.phase!=='resume')s.returnPhase=s.phase;s.phase='paused';s.epoch++;}};
  switch(event.type){
    case 'pause':if(!event.input)s.hold=true;pause();break;
    case 'draft':s.draft=event.text.slice(0,500);break;
    case 'resume':if(s.phase==='paused'||s.phase==='resume'){s.hold=false;s.phase=s.returnPhase==='resume'?'playing':s.returnPhase;s.epoch++;}break;
    case 'tick':
      if(s.phase==='playing'){if(a.prompt&&!s.direct&&!s.parentMode)s.phase='waiting';else next();}
      else if(s.phase==='feedback')next();
      else if(s.phase==='remedial'){s.phase='waiting';s.feedback='再选一次试试。';}
      break;
    case 'skip':if(s.phase==='transfer'||s.phase==='paused'&&s.returnPhase==='transfer'){s.phase='done';s.transferStatus=s.transferStatus||'迁移未验证';s.epoch++;s.feedback='';break;}if(s.phase==='waiting'||s.phase==='choice'||s.phase==='remedial'||s.phase==='paused'&&s.returnPhase==='waiting'){if(!s.evidence.some(e=>e.objective===a.id))saveEvidence('未验证');next();}break;
    case 'hint':
      if(s.phase==='paused'&&s.returnPhase==='waiting')s.hold=false;
      if(s.phase==='transfer'||s.phase==='paused'&&s.returnPhase==='transfer'){s.transferHelped=true;s.transferStatus='迁移仍需帮助';s.feedback=tutorTransfer(plan).explanation;s.epoch++;break;}
      if(s.phase==='done'||s.phase==='unsupported')break;
      s.helped=true;s.epoch++;
      if(s.phase!=='waiting'&&!(s.phase==='paused'&&s.returnPhase==='waiting')){s.asideReturn=s.phase==='aside'?s.asideReturn:s.phase;s.detail=a.explanation||a.hint||a.speech;s.phase='aside';}
      else {s.rounds++;s.feedback=s.rounds===1?(a.hint||a.explanation||a.speech):(a.explanation||a.speech);s.phase='remedial';}
      break;
    case 'answer':{
      if(s.phase==='transfer'||s.phase==='paused'&&s.returnPhase==='transfer'){const quiz=tutorTransfer(plan);s.epoch++;s.draft=event.text.slice(0,500);if(clean(event.text)===clean(quiz.answer)){s.transferStatus=s.transferHelped?'变式在帮助下完成':'本次变式判断符合';s.phase='done';s.feedback='';}else if(quiz.options.some(v=>clean(v)===clean(event.text))){s.transferHelped=true;s.transferStatus='迁移仍需帮助';s.feedback=quiz.explanation+' 可以再选一次，或结束变式。';}else s.feedback='这段表达暂时不能可靠判断。请选择一个选项或跳过变式，不把你判错。';break;}
      if(!(s.phase==='waiting'||s.phase==='paused'&&s.returnPhase==='waiting'))break;
      if(s.phase==='paused'&&s.returnPhase==='waiting')s.hold=false;
      const text=clean(event.text);if(!text){s.feedback='还没有收到回答，请填写或选择一个选项。';break;}
      s.draft=event.text.slice(0,500);s.epoch++;
      const accepted=(a.accepted||[]).some(v=>clean(v)===text),wrong=(a.rejected||[]).some(v=>clean(v)===text);
      if(accepted){saveEvidence(s.helped?'有帮助完成':'本次回答符合判据');s.feedback='答对了。';s.phase='feedback';}
      else if(wrong){saveEvidence('仍需巩固');s.helped=true;s.rounds++;s.feedback=a.explanation||'我们把当前关系拆开看。';s.phase='remedial';}
      else {s.clarifications++;s.feedback=s.clarifications>=2?'当前演示暂时无法可靠判断这段表达。可选择一个选项、看提示或先继续；不会把你判错。':'这段表达还不能可靠对应当前判据。请用题目里的量简短说明，也可以选择一个选项。';s.phase='waiting';}
      break;
    }
    case 'ask':{
      if(!event.text.trim()){s.feedback='先写下你想问的问题。';break;}
      const text=event.text;
      if(/^(先继续|继续讲|跳过)$/.test(text.trim()))return tutorReduce(s,plan,{type:'skip'});
      if(/直接讲|讲完/.test(text))return tutorReduce(s,plan,{type:'direct'});
      if(/回原题|不用讲这个/.test(text)&&s.phase==='aside')return tutorReduce(s,plan,{type:'back'});
      s.asideReturn=s.phase==='aside'?s.asideReturn:s.phase==='paused'&&!s.hold?s.returnPhase:s.phase;s.epoch++;s.draft='';
      if(s.asideReturn==='transfer'){s.transferHelped=true;s.transferStatus='迁移仍需帮助';s.detail=tutorTransfer(plan).explanation;}
      else s.detail=/关键|思路|易错|列式|这一步|这步|为什么|怎么|除以|乘以|分母|分子|整体|绿色|蓝紫色|通分|相加|横|份|方程|合计|路程/.test(text)?(a.explanation||a.speech)+(a.followup?'\n'+a.followup:''):'暂时无法回答这个问题，可以查看当前步骤的讲解。';s.phase='aside';break;
    }
    case 'back':if(s.phase==='aside'){s.phase=s.asideReturn||'paused';s.detail='';s.draft='';s.epoch++;}break;
    case 'restart':s.cursor=0;s.phase='playing';s.returnPhase='playing';s.epoch++;s.draft='';s.feedback='';s.detail='';s.helped=false;s.rounds=0;s.clarifications=0;s.hold=false;s.transferStatus='';s.transferHelped=false;break;
    case 'direct':s.direct=!s.direct;s.epoch++;if(s.direct&&['waiting','choice','remedial'].includes(s.phase)){if(!s.evidence.some(e=>e.objective===a.id))saveEvidence('未验证');next();}break;
    case 'parent':s.parentMode=!s.parentMode;s.direct=s.parentMode;s.epoch++;if(s.parentMode&&['waiting','choice','remedial'].includes(s.phase))next();break;
    case 'original':s.hold=true;pause();s.originalOpen=true;break;
    case 'closeOriginal':s.originalOpen=false;break;
    case 'transfer':if(s.phase==='done'){s.transferStatus='';s.transferHelped=false;s.phase='transfer';s.feedback='';s.draft='';s.hold=false;s.epoch++;}break;
  }
  if(s.hold&&['playing','feedback','remedial'].includes(s.phase)){s.returnPhase=s.phase;s.phase='paused';}
  return s;
}
export function tutorDelay(text:string) { return Math.max(3500,Math.min(25000,text.length*250+1200)); }
export function tutorCells(b:TutorBoard) { return Array.from({length:b.columns*b.rows},(_,i)=>({id:i,color:i%b.columns<b.fillColumns?(b.fillRows&&Math.floor(i/b.columns)<b.fillRows?'orange':'green'):'empty'})); }
export function tutorSummary(s:TutorSession,p:TutorAction[]) { return p.filter(a=>a.prompt).map(a=>({id:a.id,title:a.title,status:s.evidence.find(e=>e.objective===a.id)?.status||'未验证'})); }
