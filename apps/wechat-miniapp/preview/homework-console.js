/* Review tools stay outside the phone. Scenario setup touches only the dedicated demo task. */
window.homeworkDemoConsole = (() => {
  let previousModule = '', activeRole = 'teacher';
  const cases = [
    ['answerConflict','参考答案独立维护','AI 原判与教师参考答案对照'],['answerChanged','修改参考答案','修改参考不改判，统计独立更新'],
    ['published','未提交','家长逐页提交'],['partial','部分提交','已交一页，继续完成'],
    ['queued','等待批改','提交成功，等待处理'],['processing','正在批改','预计还需约 2 分钟'],
    ['partialGrade','部分完成','部分题仍在处理中'],['failed','批改失败','保留已完成结果'],
    ['review','待教师复核','原图核对与改判'],['unreleased','结果已同步','已有结果可直接查看'],
    ['partialRelease','部分结果可见','部分可用，待处理单独显示'],['released','全部批改完成','家长查看整份结果'],
    ['resubmit','重新提交','旧版保留，新版待批改'],['changed','人工纠正已同步','保存后自动同步'],
    ['late','逾期可补交','补交归入原作业'],['closed','补交已结束','历史只读'],
  ];
  const childIndex = () => window.parentPrototype?.getDemoContext?.().childIndex || 0;
  const snapshot = () => window.homeworkPrototype.getConsoleSnapshot(childIndex());
  const isActive = () => typeof stage !== 'undefined' && (stage === 'teacherDesk' && teacherTab === 'homework' || stage === 'parent' && Boolean(window.parentPrototype?.getDemoContext?.().homework));
  const descriptions = {
    answerConflict:'对照 AI 原判与教师答案。修改参考内容不改变学生判定与统计。',
    answerChanged:'教师已修订参考答案。学生判定与统计保持不变；发现误判时再对照原图纠正。',
    published:'从家长未提交开始，逐页提交后再演示后台处理。', partial:'提交状态与批改状态分别记录；提交一页仍是部分完成。',
    queued:'后台尚未产出结果。预计时间不是完成承诺。', processing:'模拟后台处理中；可离开页面后再回来查看。',
    partialGrade:'已有结果可以先确认开放，其他题继续处理中。', failed:'失败题不计作错误，可模拟服务重试返回。',
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
      go('parent'); window.parentPrototype.tab('homework');
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
    if (s.progress.released < s.progress.confirmed) return '切到教师，确认开放结果 →';
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
    const key = activeRole + ':homework';
    if (previousModule !== key && !window.demoWorkspace?.enabled) {
      document.body.classList.add('demo-console-open');
      const toggle = document.getElementById('demo-console-toggle');
      if (toggle) { toggle.setAttribute('aria-expanded','true'); toggle.querySelector('.demo-console-toggle-label').textContent = '收起控制台'; }
    }
    previousModule = key;
  }
  return { sync, role, start, next, publish, isActive };
})();
