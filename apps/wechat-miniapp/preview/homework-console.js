/* Review tools stay outside the phone. Scenario setup touches only the dedicated demo task. */
window.homeworkDemoConsole = (() => {
  let previousModule = '', activeRole = 'teacher';
  let view='featured',guide={active:false,step:0,message:''};
  try{view=sessionStorage.getItem('hw-demo-data-view')||'featured';guide=JSON.parse(sessionStorage.getItem('hw-demo-guide')||'null')||guide;}catch{}
  const saveGuide=()=>{try{sessionStorage.setItem('hw-demo-guide',JSON.stringify(guide));}catch{}};
  const reviewMode=()=>Boolean(window.demoWorkspace?.enabled||new URLSearchParams(location.search).get('review')==='1');
  const featuredIds=['grading-demo-v1','shared-combo-math-v1','demo-math','demo-read'];
  function taskRank(task){if(!reviewMode()||view!=='featured')return 99;const current=window.homeworkPrototype?.getConsoleSnapshot(0).taskId;return task.id===current?0:featuredIds.indexOf(task.seriesId||task.id)+1||99;}
  // 精选仅过滤演示列表，不删除任务；切换全部数据即可找回原记录。
  function filterTasks(tasks){if(!reviewMode()||view==='all')return tasks;const current=window.homeworkPrototype?.getConsoleSnapshot(0).taskId;return tasks.filter(t=>t.id===current||(t.id!=='grading-demo-v1'||!tasks.some(r=>r.id===current))&&featuredIds.includes(t.seriesId||t.id)).sort((a,b)=>taskRank(a)-taskRank(b));}
  function dataView(value){view=value==='all'?'all':'featured';try{sessionStorage.setItem('hw-demo-data-view',view);}catch{}window.homeworkPrototype.refreshDemoLists();sync();window.demoWorkspace?.sync();}
  const steps=[['教师发布','使用专用新草稿，完成要求、接收班级和截止时间核对。'],['家长提交','当前孩子固定为李涵；打开刚发布的作业，上传并提交两项要求。'],['AI 批改','提交状态与批改状态分别展示；下面按钮只模拟后台处理。'],['教师查看','查看提交名单、按题错误率和学生完整作业；复核作为可选分支。'],['家长订正','查看同一孩子的错题与解析，在手机中提交订正。'],['教师反馈','从订正情况进入待查看，核对并发送结果、点赞或评语。'],['家长回看','查看刚才的订正反馈，完成一次发布到反馈的闭环。']];
  function guidedPublish(){const previousGuide=guide;guide={active:true,step:0,message:''};role('teacher',false);if(!window.homeworkPrototype.beginGuidedPublish()){guide=previousGuide;return;}guide={active:true,step:0,message:''};saveGuide();dataView('featured');document.body.classList.add('dw-flow-open');sync();}
  // 标准讲解始终沿用同一任务与孩子，前置步骤未完成时只提示、不重建数据。
  function guideStep(step){const s=snapshot();guide.message='';if(step<0||step>6)return;if(step>0&&(s.publishing||!s.active||!s.taskId)){guide.message='请先在手机中核对并发布作业。';sync();return;}if(step>0&&!s.assigned){guide.message='李涵不在当前接收名单，请先核对本轮演示对象。';sync();return;}if(step>=2&&s.submitted<s.required){guide.message='请完成提交，或点击“模拟提交缺少的项目”。';sync();return;}if(step>=3&&(s.progress.pending||s.progress.failed)){guide.message='请先模拟后台完成批改。';sync();return;}if(step>=5&&!s.corrections){guide.message='请先在家长端提交一次订正。';sync();return;}if(step>=6&&!s.correctionFeedback){guide.message='请先在教师端发送订正反馈。';sync();return;}guide.step=step;saveGuide();if(step===0){role('teacher',!s.publishing);}else if(step===1){role('parent',true,false);}else if(step===2||step===3){role('teacher');}else if(step===4||step===6){role('parent',true,true);if(!window.homeworkPrototype.openGuidedCorrection())guide.message='本次没有可订正的错题，请先查看结果。';}else{role('teacher');window.homeworkPrototype.openCorrectionList('pending');}sync();}
  function simulateSubmit(){const s=snapshot();if(!guide.active||s.publishing||!s.assigned)return;role('parent',true,false);for(const i of s.missingItems||[])window.homeworkPrototype.submitConsolePage(i,0,true);role('parent',true,false);sync();}
  function simulateGrade(phase){if(!guide.active)return;role('teacher');window.homeworkPrototype.advanceConsoleGrading(phase,0);sync();}
  function guideMarkup(s){return '<div class="review-label">标准讲解 · 第 '+(guide.step+1)+' / 7 步</div><p>固定孩子：李涵<br>当前作业：'+escapeText(s.title||'发布中的专用草稿')+'</p><ol class="review-steps">'+steps.map((r,i)=>'<li class="'+(i===guide.step?'current':i<guide.step?'done':'')+'">'+(i+1)+'. '+r[0]+'</li>').join('')+'</ol><div class="data"><strong>'+steps[guide.step][0]+'</strong><p>'+steps[guide.step][1]+'</p>'+(guide.message?'<p role="alert">'+escapeText(guide.message)+'</p>':'')+'</div><button onclick="homeworkDemoConsole.guideStep('+Math.max(0,guide.step-1)+')">上一步</button>'+(guide.step<6?'<button class="review-next" onclick="homeworkDemoConsole.guideStep('+(guide.step+1)+')">下一步：'+steps[guide.step+1][0]+' →</button>':'<p>本轮演示已到最后一步，可自由查看记录。</p>')+(guide.step===1?'<button onclick="homeworkDemoConsole.simulateSubmit()">模拟提交缺少的项目（演示素材）</button>':'')+(guide.step===2?'<button onclick="homeworkDemoConsole.simulateGrade(&quot;processing&quot;)">模拟后台开始批改</button><button onclick="homeworkDemoConsole.simulateGrade(&quot;complete&quot;)">模拟后台完成批改</button>':'')+'<button onclick="homeworkDemoConsole.exitGuide()">退出讲解，保留当前数据</button><button onclick="homeworkDemoConsole.guidedPublish()">开始新一轮（旧作业保留）</button>';}
  const escapeText=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function exitGuide(){window.homeworkPrototype.endGuidedPublish();guide.active=false;saveGuide();sync();}
  function dataMarkup(){return '<b>演示数据</b><button aria-pressed="'+(view==='featured')+'" onclick="homeworkDemoConsole.dataView(&quot;featured&quot;)">演示精选</button><button aria-pressed="'+(view==='all')+'" onclick="homeworkDemoConsole.dataView(&quot;all&quot;)">全部数据</button><button onclick="demoWorkspace.select(&quot;hw-guide&quot;)">开始标准讲解</button><small>仅收纳列表，未删除任何作业；其他任务及你创建的作业在“全部数据”。</small>';}

  const cases = [
    ['published','未提交','家长逐页提交'],['partial','部分提交','已交一页，继续完成'],
    ['queued','等待批改','提交成功，等待处理'],['processing','正在批改','预计还需约 2 分钟'],
    ['partialGrade','部分完成','部分题仍在处理中'],['failed','批改失败','保留已完成结果'],
    ['review','待教师复核','原图核对与改判'],['unreleased','结果已同步','已有结果可直接查看'],
    ['partialRelease','部分结果可见','部分可用，待处理单独显示'],['released','全部批改完成','家长查看整份结果'],
    ['resubmit','重新提交','旧版保留，新版待批改'],['changed','人工纠正已同步','保存后自动同步'],
    ['late','逾期可补交','补交归入原作业'],['closed','补交已结束','历史只读'],
  ];
  const childIndex = () => guide.active?0:window.parentPrototype?.getDemoContext?.().childIndex || 0;
  const snapshot = () => window.homeworkPrototype.getConsoleSnapshot(childIndex());
  const isActive = () => typeof stage !== 'undefined' && (stage === 'teacherDesk' && teacherTab === 'homework' || stage === 'parent' && Boolean(window.parentPrototype?.getDemoContext?.().homework));
  const descriptions = {
    published:'从家长未提交开始，逐页提交后再演示后台处理。', partial:'提交状态与批改状态分别记录；提交一页仍是部分完成。',
    queued:'后台尚未产出结果。预计时间不是完成承诺。', processing:'模拟后台处理中；可离开页面后再回来查看。',
    partialGrade:'已完成的有效结果自动同步，其他题继续处理中。', failed:'失败题不计作错误，可模拟服务重试返回。',
    review:'选择学生，对照原图纠正，保存后自动同步。', unreleased:'家长查看整份原图和已完成结果，待处理题目单独标记。',
    partialRelease:'第 1 页已有结果，第 2 页继续处理。', released:'家长可翻页、点题目、查看答案解析与错题。',
    resubmit:'新提交不继承旧版批改结果，统计仅取最新版本。', changed:'人工纠正后统计和家长结果自动更新。',
    late:'正常截止已过，仍在允许补交期限内。', closed:'补交已结束，提交按钮关闭，历史仍可查看。',
  };
  function role(value, openTask = true, result = false) {
    window.homeworkPrototype?.restorePageDemo(activeRole);
    const index = childIndex();
    if (value === 'parent') {
      if (!window.parentPrototype.hasGuardianAccess()) window.parentPrototype.scenario('twoChildren');
      go('parent'); if(guide.active)window.parentPrototype.selectChild(0); window.parentPrototype.tab('homework');
    } else {
      showHomeworkTeacherDemo();
      const id = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[index];
      const cls = schoolDemoRoster.DEMO_STUDENTS.find(s => s.id === id)?.classId;
      if (cls) workbenchPrototype.class(cls);
    }
    activeRole = value;
    if (openTask) window.homeworkPrototype.openConsoleTask(value, index, result);
    sync();
  }
  function start(name) {
    guide.active=false;saveGuide();
    if (!cases.some(([id]) => id === name)) return;
    window.homeworkPrototype.prepareConsoleScenario(name, childIndex());
    role(activeRole, true, activeRole === 'parent' && ['partialGrade','failed','review','unreleased','partialRelease','released','changed'].includes(name));
  }
  function publish() {
    window.homeworkPrototype?.restorePageDemo(activeRole);
    window.homeworkPrototype.beginConsolePublish();
    startHomeworkPublishDemo();
  }
  function next() {
    window.homeworkPrototype?.restorePageDemo(activeRole);
    const s = snapshot();
    if (!s.active || !s.taskId) { start('published'); role('parent'); return; }
    if(s.taskId&&!s.assigned)return;
    if(s.scenario==='closed'){role('parent');return;}
    if(s.answerPhase==='answers'&&!s.progress.pending&&!s.progress.failed){role('teacher');return;}
    if (s.submitted < s.required) {
      role('parent');
      window.homeworkPrototype.submitConsolePage(s.submitted, childIndex());
    } else if (s.progress.pending || s.progress.failed) {
      role('teacher');
      window.homeworkPrototype.advanceConsoleGrading(s.progress.title.startsWith('等待') ? 'processing' : 'complete', childIndex());
    } else if (s.progress.review) {
      role('teacher'); window.homeworkPrototype.openConsoleReview(childIndex());
    } else if (s.progress.released < s.progress.confirmed) {
      role('teacher'); window.homeworkPrototype.openGradeRelease();
    } else role('parent', true, Boolean(s.progress.total));
    sync();
  }
  function nextLabel(s) {
    if (s.publishing) return '在手机中完成发布';
    if (s.taskId&&!s.assigned) return '当前孩子不在本次接收名单';
    if (s.scenario==='closed') return '切到家长，查看历史作业 →';
    if (!s.active || !s.taskId) return '从家长提交开始 →';
    if(s.answerPhase==='answers'&&!s.progress.pending&&!s.progress.failed)return '在手机当前页核对 AI 参考答案 →';
    if (s.submitted < s.required) return `切到家长，模拟提交第 ${s.submitted + 1} 项 →`;
    if (s.progress.pending || s.progress.failed) return s.progress.title.startsWith('等待') ? '模拟后台开始批改 →' : '模拟后台返回结果，切到教师 →';
    if (s.progress.review) return '进入待复核题，核对学生原图 →';
    if (s.progress.released < s.progress.confirmed) return '切到家长，查看已同步结果 →';
    return s.progress.total ? '切到家长，查看整份批改结果 →' : '切到家长，查看提交记录 →';
  }
  function sync() {
    const active = isActive();
    document.body.classList.toggle('demo-homework-mode', active);
    if (!active) { previousModule = ''; return; }
    activeRole = stage === 'parent' ? 'parent' : 'teacher';
    const panel = document.getElementById('demo-console-panel'); if (!panel) return;
    let pane = document.getElementById('homework-demo-pane');
    if (!pane) { pane = document.createElement('section'); pane.id = 'homework-demo-pane'; panel.append(pane); }
    const s = snapshot(), current = s.scenario;
    const progress = !s.active || s.publishing ? 0 : s.answerPhase==='answers'&&!s.progress.pending?2: s.submitted < s.required ? 1 : s.progress.pending || s.progress.failed ? 2 : s.progress.review ? 3 : s.progress.released < s.progress.confirmed ? 4 : 5;
    pane.innerHTML = `<div class="review-label">作业全流程 · ${activeRole === 'parent' ? '家长端' : '教师端'}</div><div class="hw-console-path">教师布置 → 学生提交 → AI 批改统计 → 自动同步；误判按需纠正</div><button onclick="homeworkDemoConsole.publish()">从教师发布开始<small>沿用当前草稿，按手机页面完成发布</small></button><div data-workspace-duplicate><div class="review-label">当前页状态与异常</div><p class="hw-console-path">在手机顶部“异常演示”中切换；这里保留跨角色完整流程。</p><button onclick="pageDemoTools.open()">打开当前页异常演示</button></div><div class="review-label">当前流程进度</div><ol class="review-steps">${['教师布置作业','学生提交','AI 批改与统计','按需原图纠正','结果自动同步','家长查看整份结果'].map((t,i) => `<li class="${i < progress ? 'done' : i === progress ? 'current' : ''}">${i+1}. ${t}</li>`).join('')}</ol><div class="data"><strong>${s.active ? s.title || '正在发布作业' : '选择一个作业场景开始'}</strong>${s.active ? `家长当前已交 ${s.submitted}/${s.required} 项<br>${s.progress.title}` : '场景使用独立演示作业，保留已有任务与提交。'}<p>${descriptions[current] || '在手机页面操作，控制台会跟随进度更新。'}</p></div><button class="review-next" ${s.publishing || s.taskId && !s.assigned ? 'disabled' : ''} onclick="homeworkDemoConsole.next()">${nextLabel(s)}</button><div class="hw-console-role-actions"><button onclick="homeworkDemoConsole.role('teacher')">教师查看当前作业</button><button onclick="homeworkDemoConsole.role('parent',true,true)">家长查看当前结果</button></div><button class="parent-review-reset" onclick="homeworkDemoConsole.start('published')">重置专用作业演示</button>`;
    if(guide.active)pane.innerHTML=guideMarkup(s);
    const key = activeRole + ':homework';
    if (previousModule !== key && !window.demoWorkspace?.enabled) {
      document.body.classList.add('demo-console-open');
      const toggle = document.getElementById('demo-console-toggle');
      if (toggle) { toggle.setAttribute('aria-expanded','true'); toggle.querySelector('.demo-console-toggle-label').textContent = '收起控制台'; }
    }
    previousModule = key;
  }
  return { sync, role, start, next, publish, isActive,filterTasks,taskRank,dataView,dataMarkup,guidedPublish,guideStep,simulateSubmit,simulateGrade,exitGuide,isGuided:()=>guide.active };
})();
