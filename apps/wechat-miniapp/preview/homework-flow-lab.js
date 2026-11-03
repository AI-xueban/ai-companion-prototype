/* 独立的作业全流程交互原型。所有数据只存于当前浏览器，用演示时间驱动状态。 */
(() => {
  const KEY = 'twj_homework_flow_lab_v1';
  const root = document.getElementById('homework-flow-lab');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const stamp = value => { const local = new Date(value), pad = number => String(number).padStart(2, '0'); return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}T${pad(local.getHours())}:${pad(local.getMinutes())}`; };
  const display = value => value ? value.replace('T', ' ') : '不限时';
  const day = value => value.slice(0, 10);
  const date = value => new Date(value);
  const plusDays = (value, count) => { const next = date(value); next.setDate(next.getDate() + count); return stamp(next); };
  const startOfDay = value => `${day(value)}T00:00`;
  const startOfWeek = value => { const next = date(startOfDay(value)); const weekday = (next.getDay() + 6) % 7; next.setDate(next.getDate() - weekday); return stamp(next); };
  const periodEnd = (start, frequency) => plusDays(start, frequency === 'weekly' ? 7 : 1);
  const deadlineLabel = row => { if (!row.deadline) return '本期不限时'; const natural = row.frequency && periodEnd(row.frequency === 'weekly' ? startOfWeek(row.start) : startOfDay(row.start), row.frequency); if (natural === row.deadline) return `${display(stamp(new Date(date(row.deadline).getTime() - 60000)))} 截止`; return `${display(row.deadline)} 截止`; };
  const randomId = prefix => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const studentName = id => state.students.find(row => row.id === id)?.name || id;
  const mockPhoto = sub => { const name = esc(studentName(sub.studentId)); const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="520" viewBox="0 0 420 520"><rect width="420" height="520" fill="#e8eef2"/><rect x="28" y="22" width="364" height="476" rx="10" fill="#fff" stroke="#cad7e2"/><text x="52" y="76" font-size="23" font-family="sans-serif" fill="#2e4860">作业原图 · 模拟样张</text><text x="52" y="112" font-size="16" font-family="sans-serif" fill="#657d92">${name} · ${day(sub.submittedAt)}</text><path d="M52 138H368M52 282H368M52 414H368" stroke="#dce5ec"/><text x="58" y="191" font-size="20" font-family="sans-serif" fill="#324d63">第 1 题：12</text><text x="58" y="337" font-size="20" font-family="sans-serif" fill="#324d63">第 2 题：18</text><text x="52" y="460" font-size="14" font-family="sans-serif" fill="#b67878">仅用于交互演示，非真实作业</text></svg>`; return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; };
  const className = id => state.classes.find(row => row.id === id)?.name || id;
  const isDue = phase => Boolean(phase.deadline);
  const periodLabel = phase => phase.frequency === 'weekly' ? `${day(phase.start)} 所在周` : day(phase.start);
  const seed = () => {
    const students = [{ id: 's1', name: '林一诺', classId: 'c1' }, { id: 's2', name: '陈子涵', classId: 'c1' }, { id: 's3', name: '王晨', classId: 'c1' }, { id: 's4', name: '赵悦', classId: 'c2' }];
    const tasks = [
      { id: 'hw-math', kind: 'homework', title: '数学周末练习', subject: '数学', description: '完成练习册第 3 页，拍照并录制一道题讲解。', classIds: ['c1', 'c2'], targetMode: 'all', selectedIds: [], recipientIds: students.map(row => row.id), startMode: 'now', startAt: '2026-10-17T09:00', endAt: '', frequency: '', timeMode: 'limited', deadline: '2026-10-18T12:00', allowLate: true, allowReplace: true, status: 'published', publishedAt: '2026-10-17T09:00', items: [{ id: 'math-photo', title: '答题照片', type: 'photo', gradeMode: 'graded', answer1: '3/4', answer2: '24 人' }, { id: 'math-video', title: '讲解视频', type: 'video', gradeMode: 'collect' }, { id: 'math-offline', title: '线下朗读', type: 'none', gradeMode: 'collect' }] },
      { id: 'daily-read', kind: 'checkin', title: '每日阅读打卡', subject: '语文', description: '阅读 20 分钟，提交阅读记录。', classIds: ['c1'], targetMode: 'all', selectedIds: [], startMode: 'scheduled', startAt: '2026-10-16T09:00', endAt: '2026-10-21T00:00', frequency: 'daily', timeMode: 'limited', allowLate: true, allowReplace: true, status: 'published', publishedAt: '2026-10-15T16:00', items: [{ id: 'read-photo', title: '阅读记录', type: 'photo', gradeMode: 'collect' }] },
      { id: 'weekly-read', kind: 'checkin', title: '每周阅读记录', subject: '语文', description: '每周选一本书，记录阅读收获。', classIds: ['c1'], targetMode: 'all', selectedIds: [], startMode: 'scheduled', startAt: '2026-10-12T09:00', endAt: '2026-11-02T00:00', frequency: 'weekly', timeMode: 'unlimited', allowLate: true, allowReplace: true, status: 'published', publishedAt: '2026-10-11T16:00', items: [{ id: 'week-photo', title: '阅读感想', type: 'photo', gradeMode: 'collect' }] },
      { id: 'future-checkin', kind: 'checkin', title: '下周口算打卡', subject: '数学', description: '每天完成 10 道口算。', classIds: ['c1'], targetMode: 'selected', selectedIds: ['s1', 's2'], startMode: 'scheduled', startAt: '2026-10-19T09:00', endAt: '2026-10-23T00:00', frequency: 'daily', timeMode: 'limited', allowLate: false, allowReplace: true, status: 'published', publishedAt: '2026-10-17T09:00', items: [{ id: 'oral-photo', title: '口算照片', type: 'photo', gradeMode: 'graded', answer1: '12', answer2: '18' }] }
    ];
    const phases = [{ id: 'hw-math:once', taskId: 'hw-math', start: '2026-10-17T09:00', end: '', deadline: '2026-10-18T12:00', frequency: '', targetIds: students.map(row => row.id) }];
    const submissions = [];
    const add = (id, phaseId, studentId, itemId, at, grades = []) => submissions.push({ id, phaseId, studentId, itemId, submittedAt: at, invalidatedAt: '', status: 'accepted', fileName: itemId.includes('video') ? '讲解视频.mp4' : itemId.includes('offline') ? '家长确认已完成' : '作业照片.jpg', grades, history: [] });
    const grades = (a, b, secondState = 'confirmed') => [
      { id: 'q1', label: '第 1 题 · 分数计算', answer: '3/4', source: '教师录入', studentAnswer: a, correct: a === '3/4', firstCorrect: a === '3/4', state: 'confirmed', knowledge: '分数计算', reliable: true, revision: 1 },
      { id: 'q2', label: '第 2 题 · 简答应用', answer: '24 人', source: '外接服务模拟', studentAnswer: b, correct: b === '24 人', firstCorrect: b === '24 人', state: secondState, knowledge: '应用题', reliable: true, revision: 1 }
    ];
    add('sub-s2-photo', 'hw-math:once', 's2', 'math-photo', '2026-10-18T10:30', grades('3/4', '24 人'));
    add('sub-s2-video', 'hw-math:once', 's2', 'math-video', '2026-10-18T10:38');
    add('sub-s2-offline', 'hw-math:once', 's2', 'math-offline', '2026-10-18T10:40');
    add('sub-s3-photo', 'hw-math:once', 's3', 'math-photo', '2026-10-18T13:20', grades('2/4', '18 人', 'review'));
    add('sub-s3-video', 'hw-math:once', 's3', 'math-video', '2026-10-18T13:26');
    add('sub-s3-offline', 'hw-math:once', 's3', 'math-offline', '2026-10-18T13:28');
    add('sub-s4-photo', 'hw-math:once', 's4', 'math-photo', '2026-10-18T11:20', grades('3/4', '24 人', 'unreadable'));
    return { clock: '2026-10-18T15:00', classes: [{ id: 'c1', name: '五年级 2 班' }, { id: 'c2', name: '五年级 3 班' }], students, tasks, phases, submissions, release: {}, audit: [], parentId: 's1' };
  };
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY) || 'null') || seed(); if (!state.tasks || !state.phases) state = seed(); } catch { state = seed(); }
  let ui = { role: 'teacher', taskId: '', phaseId: '', mode: 'list', draft: null, error: '', notice: '', publishBranch: 'normal', submitBranch: 'normal', selectedStudent: '', schoolMetric: 'cutoff', replace: null, pending: null, answerDraft: {}, knowledgeDraft: {} };
  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const task = id => state.tasks.find(row => row.id === id);
  const phase = id => state.phases.find(row => row.id === id);
  const phasesOf = taskId => state.phases.filter(row => row.taskId === taskId).sort((a, b) => a.start.localeCompare(b.start));
  const phaseTask = row => task(row.taskId);
  const recipientIds = row => state.students.filter(student => row.classIds.includes(student.classId) && (row.targetMode === 'all' || row.selectedIds.includes(student.id))).map(student => student.id);
  function syncPhases() {
    for (const row of state.tasks) {
      if (row.status !== 'published' || row.kind !== 'checkin' || row.startAt > state.clock) continue;
      let start = row.startAt;
      let index = 0;
      while (start < row.endAt && start <= state.clock && index < 180) {
        const id = `${row.id}:${day(row.frequency === 'weekly' ? startOfWeek(start) : start)}`;
        if (!phase(id)) {
          const end = periodEnd(row.frequency === 'weekly' ? startOfWeek(start) : startOfDay(start), row.frequency);
          const actualEnd = end < row.endAt ? end : row.endAt;
          state.phases.push({ id, taskId: row.id, start, end: actualEnd, deadline: row.timeMode === 'limited' ? actualEnd : '', frequency: row.frequency, targetIds: recipientIds(row) });
        }
        const next = periodEnd(row.frequency === 'weekly' ? startOfWeek(start) : startOfDay(start), row.frequency);
        if (next <= start) break;
        start = next;
        index += 1;
      }
    }
    save();
  }
  function validSubmission(phaseId, studentId, itemId, at = state.clock) {
    return state.submissions.filter(row => row.phaseId === phaseId && row.studentId === studentId && row.itemId === itemId && row.status === 'accepted' && row.submittedAt <= at && (!row.invalidatedAt || row.invalidatedAt > at)).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  }
  const historyFor = (phaseId, studentId, itemId) => state.submissions.filter(row => row.phaseId === phaseId && row.studentId === studentId && row.itemId === itemId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const complete = (row, studentId, at = state.clock) => phaseTask(row).items.every(item => Boolean(validSubmission(row.id, studentId, item.id, at)));
  function metrics(row) {
    const work = phaseTask(row), completedIds = row.targetIds.filter(id => complete(row, id));
    const current = completedIds.length;
    const cutoffAt = row.frequency && row.deadline ? stamp(new Date(date(row.deadline).getTime() - 60000)) : row.deadline;
    const cutoff = row.deadline ? row.targetIds.filter(id => complete(row, id, cutoffAt)).length : null;
    const partial = row.targetIds.filter(id => !complete(row, id) && work.items.some(item => validSubmission(row.id, id, item.id))).length;
    const late = row.deadline ? completedIds.filter(id => work.items.some(item => validSubmission(row.id, id, item.id).submittedAt >= row.deadline)).length : null;
    const retake = row.targetIds.filter(id => !complete(row, id) && work.items.some(item => historyFor(row.id, id, item.id).some(record => record.status === 'retake' && !record.invalidatedAt))).length;
    return { target: row.targetIds.length, current, cutoff, partial, missing: row.targetIds.length - current - partial, onTime: row.deadline ? current - late : null, late, retake };
  }
  const cutoffDisplay = (row, m) => state.clock < row.deadline ? '待截止' : `${m.cutoff}/${m.target}`;
  function gradeRows(row) { return state.submissions.filter(sub => sub.phaseId === row.id && sub.status === 'accepted' && sub.submittedAt <= state.clock && (!sub.invalidatedAt || sub.invalidatedAt > state.clock)).flatMap(sub => (sub.grades || []).map(grade => ({ sub, grade }))); }
  function gradeMetrics(row) {
    const rows = gradeRows(row), valid = rows.filter(({ grade }) => grade.state === 'confirmed');
    const gradedItemCount = phaseTask(row).items.filter(item => item.type === 'photo' && item.gradeMode === 'graded').length;
    const expected = row.targetIds.length * gradedItemCount * 2;
    return { valid: valid.length, expected, correct: valid.filter(({ grade }) => grade.correct).length, review: rows.filter(({ grade }) => grade.state === 'review').length, abnormal: rows.filter(({ grade }) => ['unreadable', 'no-answer', 'error', 'misaligned'].includes(grade.state)).length };
  }
  function knowledgeSummary(rows) {
    const result = new Map();
    rows.filter(({ grade }) => grade.state === 'confirmed' && grade.reliable).forEach(({ grade }) => {
      String(grade.knowledge || '').split(/[,，、;；]/).map(name => name.trim()).filter(Boolean).forEach(name => {
        const item = result.get(name) || { questions: new Set(), valid: 0, firstCorrect: 0, correct: 0 };
        item.questions.add(grade.label);
        item.valid += 1;
        item.firstCorrect += Number(grade.firstCorrect ?? grade.correct);
        item.correct += Number(grade.correct);
        result.set(name, item);
      });
    });
    return [...result];
  }
  const knowledgeMarkup = rows => rows.map(([name, item]) => `<span>${esc(name)} · 涉及 ${item.questions.size} 题 · 有效 ${item.valid} 题次 · 首次答对 ${item.firstCorrect}/${item.valid} · 当前答对 ${item.correct}/${item.valid}</span>`).join('') || '<span>暂无可用结果</span>';
  function parentKnowledge(row, studentId) {
    const visible = gradeRows(row).filter(({ sub, grade }) => sub.studentId === studentId && state.release[`${sub.id}:${grade.id}`]?.revision === grade.revision);
    return `<div class="card"><h3 class="section-title">本次作业 · 我的知识点结果</h3><div class="knowledge">${knowledgeMarkup(knowledgeSummary(visible))}</div><p class="hint">只包含教师已开放、判定有效且知识点关联可靠的题目；首次作答不会被订正覆盖。题次较少时仅展示事实，不判断掌握程度。</p></div>`;
  }
  const rate = (a, b) => b ? `${Math.round(a / b * 100)}%` : '—';
  const statusOf = row => row.status === 'withdrawn' ? '已撤回' : row.kind === 'checkin' && state.clock < row.startAt ? '待生效' : row.kind === 'checkin' && state.clock >= row.endAt ? '已结束' : row.kind === 'homework' && state.clock >= row.deadline ? '已截止' : '进行中';
  function phaseStatus(row) { const work = phaseTask(row); if (work.status === 'withdrawn') return '已撤回'; if (work.kind === 'checkin' && state.clock >= work.endAt) return '已结束'; if (row.deadline && state.clock >= row.deadline) return '已截止'; return '进行中'; }
  function canSubmit(row, studentId, replacing = false) {
    const work = phaseTask(row);
    if (!row.targetIds.includes(studentId) || work.status === 'withdrawn') return '未接收或任务已撤回';
    if (work.kind === 'checkin' && state.clock >= work.endAt) return '整项打卡已结束';
    if (state.clock < row.start) return '尚未生效';
    if (replacing && !work.allowReplace) return '教师未开启重新提交';
    if (!replacing && row.deadline && state.clock >= row.deadline && !work.allowLate) return '截止后未开放首次补交';
    return '';
  }
  function streak(work, studentId) {
    const rows = phasesOf(work.id).filter(row => row.start <= state.clock);
    let longest = 0, current = 0;
    for (const row of rows) { current = complete(row, studentId) ? current + 1 : 0; longest = Math.max(longest, current); }
    return { current, longest };
  }
  const labelOf = row => row.kind === 'checkin' ? `${row.frequency === 'weekly' ? '每周' : '每日'}打卡 · ${row.timeMode === 'unlimited' ? '不限时' : '限时'}` : '普通作业';
  function top() { return `<div class="top"><div><h1>作业与打卡 · 全流程演示</h1><p>教师发布 → 家长提交 → 批改复核 → 结果开放 → 校级统计，所有记录是本地 mock 数据。</p></div><label class="clock">演示时间 <input id="demo-clock" type="datetime-local" value="${state.clock}"></label></div><nav class="nav"><button data-action="role" data-role="teacher" class="${ui.role === 'teacher' ? 'active' : ''}">教师端</button><button data-action="role" data-role="parent" class="${ui.role === 'parent' ? 'active' : ''}">家长端</button><button data-action="role" data-role="school" class="${ui.role === 'school' ? 'active' : ''}">校级看板</button></nav>`; }
  function sidebar() {
    if (ui.role === 'parent') return `<section class="panel scroll-list"><h2 class="section-title">孩子与任务</h2><label class="field"><span>当前孩子</span><select id="parent-student">${state.students.map(row => `<option value="${row.id}" ${row.id === state.parentId ? 'selected' : ''}>${esc(row.name)} · ${esc(className(row.classId))}</option>`).join('')}</select></label><p class="hint">两位家长关联同一学生时，共用以下进度和记录。</p>${state.tasks.filter(row => row.status !== 'withdrawn' && (row.kind === 'homework' ? row.recipientIds.includes(state.parentId) : phasesOf(row.id).some(part => part.start <= state.clock && part.targetIds.includes(state.parentId)))).map(row => {
      const relevant = phasesOf(row.id).filter(part => part.targetIds.includes(state.parentId));
      const count = relevant.filter(part => complete(part, state.parentId)).length;
      return `<button class="list-button ${ui.taskId === row.id ? 'active' : ''}" data-action="task" data-id="${row.id}"><strong>${esc(row.title)}</strong><small>${labelOf(row)} · ${statusOf(row)}<br>已完成 ${count}/${relevant.length} 期</small></button>`;
    }).join('')}</section>`;
    if (ui.role === 'school') return `<section class="panel"><h2 class="section-title">统计口径</h2><p class="muted">普通作业与限时打卡按截止时默认统计；不限时打卡只显示当前完成。</p><div class="seg"><button data-action="metric" data-value="cutoff" class="${ui.schoolMetric === 'cutoff' ? 'active' : ''}">截止时</button><button data-action="metric" data-value="current" class="${ui.schoolMetric === 'current' ? 'active' : ''}">当前</button></div><p class="hint">已撤回任务不进入常规统计；进行中期次单列。</p></section>`;
    return `<section class="panel scroll-list"><div class="row"><h2 class="section-title">布置任务</h2><button class="btn small" data-action="new">＋ 布置</button></div>${state.tasks.map(row => `<button class="list-button ${ui.taskId === row.id && ui.mode !== 'compose' ? 'active' : ''}" data-action="task" data-id="${row.id}"><strong>${esc(row.title)}</strong><small>${labelOf(row)} · ${statusOf(row)}<br>${esc(row.classIds.map(className).join('、'))}</small></button>`).join('')}<button class="btn secondary small" data-action="transfer">演示学生转班（影响未来期）</button><p class="hint">发布失败、名单变化等异常在发布预览页切换。</p></section>`;
  }
  function listPhases(work, role) {
    const rows = phasesOf(work.id).filter(row => role !== 'parent' || row.start <= state.clock && row.targetIds.includes(state.parentId));
    if (!rows.length) return `<div class="notice">${state.clock < work.startAt ? `指定 ${display(work.startAt)} 生效；当前尚无家长待办。` : '当前尚未生成期次。'}</div>`;
    return rows.map(row => { const m = metrics(row); return `<button class="list-button ${ui.phaseId === row.id ? 'active' : ''}" data-action="phase" data-id="${row.id}"><strong>${esc(periodLabel(row))} <span class="badge ${phaseStatus(row) === '已截止' ? 'warn' : ''}">${phaseStatus(row)}</span></strong><small>${row.deadline ? `${deadlineLabel(row)}` : '本期不限时'} · ${role === 'parent' ? complete(row, state.parentId) ? '已完成' : '待完成' : `当前完成 ${m.current}/${m.target}`}</small></button>`; }).join('');
  }
  function teacherView() {
    if (ui.mode === 'compose') return composeView();
    const work = task(ui.taskId);
    if (!work) return `<div class="card stage"><h2>选择左侧任务，或布置新作业</h2><p class="muted">演示数据包含普通作业、限时每日打卡、不限时每周打卡和待生效打卡。</p><div class="actions"><button class="btn" data-action="new">开始布置</button></div></div>`;
    const rows = phasesOf(work.id), chosen = phase(ui.phaseId) || rows[rows.length - 1];
    return `<div class="card"><div class="row wrap"><div><h2>${esc(work.title)} <span class="badge">${labelOf(work)}</span></h2><p class="muted">${esc(work.description)} · ${statusOf(work)}</p></div><div class="actions">${work.status === 'published' ? `<button class="btn danger small" data-action="withdraw">撤回任务</button>` : ''}</div></div><p class="summary">接收范围：${esc(work.classIds.map(className).join('、'))} · ${work.targetMode === 'all' ? '所选班级全体' : `指定 ${work.selectedIds.length} 名学生`}<br>${work.kind === 'checkin' ? `生效 ${display(work.startAt)} · 结束 ${display(work.endAt)}` : `截止 ${display(work.deadline)}`} · ${work.allowLate ? '允许首次补交' : '不允许首次补交'} · ${work.allowReplace ? '允许主动重交' : '不允许重交'}</p>${work.kind === 'checkin' && work.targetMode === 'selected' && work.status === 'published' ? `<div class="notice"><strong>调整尚未开始期的指定学生</strong><div class="seg">${state.students.filter(student => work.classIds.includes(student.classId)).map(student => `<button class="${work.selectedIds.includes(student.id) ? 'active' : ''}" data-action="toggle-future-student" data-id="${student.id}">${esc(student.name)}</button>`).join('')}</div><small>已开始期的接收名单与统计分母保持不变。</small></div>` : ''}${work.kind === 'checkin' && state.clock < work.startAt && work.status === 'published' ? `<div class="notice"><strong>首期尚未开始，可修改生效时间</strong><label class="field"><span>新的未来时间</span><input id="new-start" type="datetime-local" value="${esc(work.startAt)}"></label><div class="actions"><button class="btn secondary small" data-action="edit-start">保存指定时间</button><button class="btn secondary small" data-action="start-now">改为立即生效</button></div></div>` : ''}${work.status === 'withdrawn' ? '<div class="notice warn">撤回后停止接收提交并退出常规统计；原提交保留在历史记录。</div>' : ''}</div><div class="card"><h3 class="section-title">期次 / 单次任务</h3>${listPhases(work, 'teacher')}</div>${chosen ? teacherPhase(work, chosen) : ''}`;
  }
  function teacherPhase(work, row) {
    const m = metrics(row), g = gradeMetrics(row), gradeList = gradeRows(row);
    const knowledge = knowledgeSummary(gradeList);
    return `<div class="card"><h3 class="section-title">${esc(periodLabel(row))} · 完成与批改</h3><div class="grid"><div class="metric"><b>${m.current}/${m.target}</b><span>当前完成</span></div><div class="metric"><b>${row.deadline ? `${cutoffDisplay(row, m)}` : '—'}</b><span>${row.deadline ? '截止时完成' : '不限时无截止口径'}</span></div><div class="metric"><b>${rate(g.valid, g.expected)}</b><span>有效批改覆盖率 ${g.valid}/${g.expected}</span></div><div class="metric"><b>${rate(g.correct, g.valid)}</b><span>有效题次正确率</span></div><div class="metric"><b>${m.partial}</b><span>部分提交</span></div><div class="metric"><b>${m.missing}</b><span>未交</span></div><div class="metric"><b>${m.retake}</b><span>需重拍</span></div><div class="metric"><b>${row.deadline ? `${m.onTime} / ${m.late}` : '—'}</b><span>按时 / 逾期完成</span></div><div class="metric"><b>${g.review + g.abnormal}</b><span>待复核及异常题次</span></div></div><p class="hint">完成率按学生去重；批改只计当前有效提交，每题每人只计一次。</p><div class="line"></div><h3 class="section-title">知识点 · 本次任务</h3><div class="knowledge">${knowledgeMarkup(knowledge)}</div><div class="actions"><button class="btn secondary small" data-action="release">开放已确认结果给家长</button></div></div><div class="card"><h3 class="section-title">学生提交与异常下钻</h3><table class="table"><thead><tr><th>学生</th><th>进度</th><th>提交</th><th>操作</th></tr></thead><tbody>${row.targetIds.map(id => { const count = work.items.filter(item => validSubmission(row.id, id, item.id)).length; return `<tr><td>${esc(studentName(id))}</td><td>${count}/${work.items.length}</td><td>${complete(row, id) ? '已完成' : count ? '部分提交' : '未提交'}</td><td><button class="btn secondary small" data-action="student" data-id="${id}">查看</button></td></tr>`; }).join('')}</tbody></table></div>${ui.selectedStudent ? studentReview(work, row, ui.selectedStudent) : ''}`;
  }
  function studentReview(work, row, studentId) {
    if (!row.targetIds.includes(studentId)) return '';
    return `<div class="card"><div class="row"><h3 class="section-title">${esc(studentName(studentId))} · 逐项原件与复核</h3><button class="btn secondary small" data-action="student" data-id="">收起</button></div>${work.items.map(item => { const sub = validSubmission(row.id, studentId, item.id); const history = historyFor(row.id, studentId, item.id); return `<div class="item"><h3>${esc(item.title)} <span class="badge ${sub ? 'good' : 'warn'}">${sub ? '已提交' : '未提交'}</span></h3>${sub ? `<p>文件：${esc(sub.fileName)} · 服务端接收 ${display(sub.submittedAt)}${row.deadline && sub.submittedAt >= row.deadline ? ' · 补交' : ''}</p><div class="notice">${item.type === 'photo' ? '演示原图：数学练习样张（mock）' : item.type === 'video' ? '演示视频文件记录（mock）' : item.type === 'audio' ? '演示录音文件记录（mock）' : '家长确认已完成'}</div>${item.type === 'photo' ? `<img class="mock-photo" src="${mockPhoto(sub)}" alt="模拟作业原图">` : ''}${item.type === 'none' ? `<button class="btn secondary small" data-action="return-none" data-sub="${sub.id}">退回重做</button>` : ''}${sub.grades.map(grade => gradeEditor(sub, grade)).join('')}` : '<p>暂无当前有效提交</p>'}<div class="history">历史：${history.map(record => `${display(record.submittedAt)} ${record.status}${record.invalidatedAt ? '（已失效）' : ''}`).join('；') || '无'}</div></div>`; }).join('')}</div>`;
  }
  function gradeEditor(sub, grade) {
    const stateLabel = { confirmed: grade.correct ? '正确' : '做错', review: '待复核', unreadable: '识别不清', 'no-answer': '无可靠答案', misaligned: '题目对齐失败', error: '批改服务失败' }[grade.state] || grade.state;
    const id = `${sub.id}:${grade.id}`;
    return `<div class="item"><div class="row wrap"><strong>${esc(grade.label)}</strong><span class="badge ${grade.state === 'confirmed' ? 'good' : 'warn'}">${stateLabel}</span></div><p>学生作答 ${esc(grade.studentAnswer)} · 答案 ${esc(grade.answer || '暂无')}（${esc(grade.source)}） · 知识点 ${esc(grade.knowledge || '待关联')}</p><div class="actions"><button class="btn secondary small" data-action="grade" data-sub="${sub.id}" data-q="${grade.id}" data-result="correct">判对</button><button class="btn secondary small" data-action="grade" data-sub="${sub.id}" data-q="${grade.id}" data-result="wrong">判错</button>${grade.state === 'error' ? `<button class="btn secondary small" data-action="retry-grade" data-sub="${sub.id}" data-q="${grade.id}">重试自动批改</button>` : ''}</div><label class="field mini"><span>修改标准答案（保存后重算当前有效作答）</span><input data-answer="${id}" value="${esc(ui.answerDraft[id] ?? grade.answer)}"></label><label class="field mini"><span>修正知识点</span><input data-knowledge="${id}" value="${esc(ui.knowledgeDraft[id] ?? grade.knowledge)}"></label><div class="actions"><button class="btn secondary small" data-action="save-grade" data-sub="${sub.id}" data-q="${grade.id}">保存答案与知识点</button></div><p class="hint">修正保留在演示审计记录中；结果需要再次开放才对家长更新。</p></div>`;
  }
  function parentView() {
    const work = task(ui.taskId);
    if (!work) return `<div class="card stage"><h2>选择左侧作业或打卡</h2><p class="muted">可演示待生效、往期补交、不限时打卡、主动重交和上传异常。</p></div>`;
    if (work.status === 'withdrawn') return `<div class="card"><h2>${esc(work.title)} · 已撤回</h2><p>任务已退出待办，历史提交仍可查询。</p></div>`;
    const rows = phasesOf(work.id).filter(row => row.start <= state.clock && row.targetIds.includes(state.parentId));
    const selected = phase(ui.phaseId) && phase(ui.phaseId).taskId === work.id ? phase(ui.phaseId) : rows[rows.length - 1];
    const s = work.kind === 'checkin' ? streak(work, state.parentId) : null;
    return `<div class="card"><h2>${esc(work.title)} <span class="badge">${labelOf(work)}</span></h2><p>${esc(work.description)}</p><p class="summary">当前孩子：${esc(studentName(state.parentId))} · ${esc(className(state.students.find(item => item.id === state.parentId)?.classId))}<br>${work.kind === 'checkin' ? `整项结束 ${display(work.endAt)} · ${s.current} ${work.frequency === 'weekly' ? '周' : '天'}连续完成` : `截止 ${display(work.deadline)}`}<br>仅关联该学生的家长与有权限教师可查看提交内容。</p></div><div class="card"><h3 class="section-title">${work.kind === 'checkin' ? '已开始的期次（往期可查看）' : '作业任务'}</h3>${listPhases(work, 'parent')}</div>${selected ? parentPhase(work, selected) + parentKnowledge(selected, state.parentId) : ''}`;
  }
  function parentPhase(work, row) {
    const m = metrics(row); const done = complete(row, state.parentId);
    const notice = row.deadline ? `本期${deadlineLabel(row)}；${state.clock >= row.deadline ? '已过截止时间' : '当前仍在期限内'}。` : '本期不限时，不显示逾期或补交。';
    return `<div class="card"><h3>${esc(periodLabel(row))} · ${done ? '已完成' : '待完成'} <span class="badge">${work.items.filter(item => validSubmission(row.id, state.parentId, item.id)).length}/${work.items.length} 项</span></h3><div class="notice ${row.deadline && state.clock >= row.deadline ? 'warn' : ''}">${notice}${work.kind === 'checkin' && state.clock >= work.endAt ? '整项已结束，停止提交。' : ''}</div>${work.items.map(item => parentItem(work, row, item)).join('')}<p class="hint">教师端该期当前完成 ${m.current}/${m.target}；截止时 ${row.deadline ? `${cutoffDisplay(row, m)}` : '无此口径'}。</p></div>`;
  }
  function parentItem(work, row, item) {
    const sub = validSubmission(row.id, state.parentId, item.id); const hist = historyFor(row.id, state.parentId, item.id);
    const replacing = Boolean(sub);
    const blocked = canSubmit(row, state.parentId, replacing || hist.some(record => record.invalidatedAt));
    const showBranch = item.type !== 'none' && !ui.pending && !ui.replace;
    return `<div class="item"><div class="row"><h3>${esc(item.title)}</h3><span class="badge ${sub ? 'good' : 'warn'}">${sub ? '已提交' : '待提交'}</span></div><p>${item.type === 'none' ? '由家长确认线下完成' : item.type === 'photo' ? '提交清晰完整的图片' : item.type === 'video' ? '提交讲解视频' : '提交录音'}${item.gradeMode === 'graded' ? ' · 图片将逐题模拟批改' : ''}</p>${sub ? `<p class="good-text">${display(sub.submittedAt)} · ${esc(sub.fileName)}${row.deadline && sub.submittedAt >= row.deadline ? ' · 补交' : ''}</p>${item.type === 'photo' ? `<img class="mock-photo" src="${mockPhoto(sub)}" alt="当前提交的模拟原图">` : ''}${sub.grades.length ? `<div class="notice">${sub.grades.map(g => { const key = `${sub.id}:${g.id}`; const released = state.release[key]; return `<div>${esc(g.label)}：${released?.revision === g.revision && g.state === 'confirmed' ? `${g.correct ? '正确' : '做错'} · 标准答案 ${esc(g.answer)} · ${g.reliable ? esc(g.knowledge) : '知识点待确认'}` : released ? '结果待更新' : g.state === 'confirmed' ? '待教师开放' : g.state === 'review' ? '待教师复核' : '暂无可用结果'}</div>`; }).join('')}</div>` : ''}` : ''}${hist.length ? `<p class="history">提交记录：${hist.map(record => `${display(record.submittedAt)} ${record.status}${record.invalidatedAt ? ' · 已作废' : ''}`).join('；')}</p>` : ''}${blocked ? `<div class="notice warn">${esc(blocked)}</div>` : `<div class="actions"><button class="btn small" data-action="parent-start" data-item="${item.id}" ${ui.pending || ui.replace ? 'disabled' : ''}>${replacing ? '重新提交' : item.type === 'none' ? '确认已完成' : '选择演示文件并提交'}</button></div>`}${showBranch ? `<label class="field mini"><span>本项演示异常</span><select id="submit-branch"><option value="normal" ${ui.submitBranch === 'normal' ? 'selected' : ''}>正常上传</option><option value="upload-fail" ${ui.submitBranch === 'upload-fail' ? 'selected' : ''}>上传失败</option><option value="retake" ${ui.submitBranch === 'retake' ? 'selected' : ''}>图片模糊，需重拍</option><option value="grade-error" ${ui.submitBranch === 'grade-error' ? 'selected' : ''}>批改服务超时</option><option value="no-answer" ${ui.submitBranch === 'no-answer' ? 'selected' : ''}>外接服务无可靠答案</option><option value="misaligned" ${ui.submitBranch === 'misaligned' ? 'selected' : ''}>题目对齐失败</option><option value="knowledge-unreliable" ${ui.submitBranch === 'knowledge-unreliable' ? 'selected' : ''}>知识点关联不可靠</option><option value="missing-page" ${ui.submitBranch === 'missing-page' ? 'selected' : ''}>图片漏页</option><option value="wrong-type" ${ui.submitBranch === 'wrong-type' ? 'selected' : ''}>媒体类型不符</option><option value="duplicate" ${ui.submitBranch === 'duplicate' ? 'selected' : ''}>重复上传</option></select></label>` : ''}${ui.replace?.itemId === item.id ? `<div class="notice warn">确认重新提交后，原提交立即作废；新文件失败时本项恢复待提交或需重拍，教师端数据同步回退。</div><div class="actions"><button class="btn small" data-action="replace-confirm">确认作废并重交</button><button class="btn secondary small" data-action="cancel-replace">取消</button></div>` : ''}${ui.pending?.itemId === item.id ? `<div class="notice">${ui.pending.stage === 'validating' ? `已接收待校验 · ${esc(ui.pending.fileName)} · 接收 ${display(ui.pending.receivedAt)}` : `上传中 · ${esc(ui.pending.fileName)}`}</div><div class="actions"><button class="btn small" data-action="${ui.pending.stage === 'validating' ? 'finish-validate' : 'finish-upload'}">${ui.pending.stage === 'validating' ? '完成校验' : '文件到达服务端'}</button><button class="btn secondary small" data-action="cancel-upload">${ui.pending.stage === 'validating' ? '放弃本次提交' : '中断上传'}</button></div>` : ''}</div>`;
  }
  function schoolView() {
    const rows = state.phases.filter(row => phaseTask(row)?.status === 'published' && row.start <= state.clock);
    const closed = rows.filter(row => row.deadline && row.deadline <= state.clock);
    const unlimited = rows.filter(row => !row.deadline);
    const ongoing = rows.filter(row => row.deadline && row.deadline > state.clock);
    const workRows = closed.filter(row => phaseTask(row).kind === 'homework');
    const checkRows = closed.filter(row => phaseTask(row).kind === 'checkin');
    const sum = (items, key) => items.reduce((total, row) => total + metrics(row)[key], 0);
    const target = items => items.reduce((total, row) => total + metrics(row).target, 0);
    const key = ui.schoolMetric === 'cutoff' ? 'cutoff' : 'current';
    const schoolGrades = closed.flatMap(gradeRows).filter(({ grade }) => grade.state === 'confirmed');
    return `<div class="card"><h2>全校作业与打卡</h2><p class="muted">统计到 ${display(state.clock)} · 仅展示本原型的两个班级 mock 数据</p><div class="grid"><div class="metric"><b>${workRows.length}</b><span>已截止普通作业份数</span></div><div class="metric"><b>${sum(workRows, key)}/${target(workRows)}</b><span>普通作业${ui.schoolMetric === 'cutoff' ? '截止时' : '当前'}完成</span></div><div class="metric"><b>${rate(sum(workRows, key), target(workRows))}</b><span>整份完成率</span></div><div class="metric"><b>${rate(sum(checkRows, key), target(checkRows))}</b><span>限时打卡${ui.schoolMetric === 'cutoff' ? '截止时' : '当前'}完成率</span></div><div class="metric"><b>${rate(sum(unlimited, 'current'), target(unlimited))}</b><span>不限时打卡当前完成率</span></div><div class="metric"><b>${rate(schoolGrades.filter(({ grade }) => grade.correct).length, schoolGrades.length)}</b><span>有效题次正确率</span></div><div class="metric"><b>${ongoing.length}</b><span>进行中期次（单列）</span></div></div><p class="hint">跨任务按学生 × 任务累计应交人次；同一学生在同一任务只计一次。不限时打卡没有截止时口径。</p></div><div class="card"><h3 class="section-title">任务与期次明细</h3><table class="table"><thead><tr><th>任务</th><th>期次</th><th>人数</th><th>截止时</th><th>当前</th><th>批改</th></tr></thead><tbody>${rows.map(row => { const m = metrics(row), g = gradeMetrics(row); return `<tr><td>${esc(phaseTask(row).title)}</td><td>${esc(periodLabel(row))}</td><td>${m.target}</td><td>${row.deadline ? `${cutoffDisplay(row, m)}` : '不限时'}</td><td>${m.current}/${m.target}</td><td>${g.valid} 有效 · ${g.review + g.abnormal} 异常</td></tr>`; }).join('')}</tbody></table></div>`;
  }
  const blankDraft = () => ({ kind: 'homework', title: '', subject: '数学', description: '', classIds: ['c1'], targetMode: 'all', selectedIds: [], frequency: 'daily', startMode: 'now', startAt: state.clock, endAt: plusDays(state.clock, 4), timeMode: 'limited', deadline: plusDays(state.clock, 2), allowLate: false, allowReplace: true, items: [{ id: randomId('item'), title: '', type: 'photo', gradeMode: 'collect', answer1: '', answer2: '' }] });
  function composeView() {
    const d = ui.draft;
    return `<div class="card"><div class="row"><h2>布置作业 / 打卡</h2><button class="btn secondary small" data-action="cancel-compose">返回任务</button></div><div class="seg"><button data-action="draft-kind" data-value="homework" class="${d.kind === 'homework' ? 'active' : ''}">普通作业</button><button data-action="draft-kind" data-value="checkin" class="${d.kind === 'checkin' ? 'active' : ''}">周期打卡</button></div><label class="field"><span>名称</span><input data-draft="title" value="${esc(d.title)}" placeholder="例如：周末数学练习"></label><label class="field"><span>整体说明</span><textarea data-draft="description" placeholder="写明页码、完成方式">${esc(d.description)}</textarea></label><label class="field"><span>学科</span><select data-draft="subject"><option ${d.subject === '数学' ? 'selected' : ''}>数学</option><option ${d.subject === '语文' ? 'selected' : ''}>语文</option><option ${d.subject === '英语' ? 'selected' : ''}>英语</option></select></label><div class="line"></div><h3 class="section-title">时间与提交规则</h3>${d.kind === 'homework' ? `<label class="field"><span>截止时间</span><input type="datetime-local" data-draft="deadline" value="${esc(d.deadline)}"></label>` : `<div class="seg"><button data-action="draft-option" data-key="frequency" data-value="daily" class="${d.frequency === 'daily' ? 'active' : ''}">每日</button><button data-action="draft-option" data-key="frequency" data-value="weekly" class="${d.frequency === 'weekly' ? 'active' : ''}">每周</button></div><div class="seg"><button data-action="draft-option" data-key="timeMode" data-value="limited" class="${d.timeMode === 'limited' ? 'active' : ''}">限时提交</button><button data-action="draft-option" data-key="timeMode" data-value="unlimited" class="${d.timeMode === 'unlimited' ? 'active' : ''}">不限时提交</button></div><div class="seg"><button data-action="draft-option" data-key="startMode" data-value="now" class="${d.startMode === 'now' ? 'active' : ''}">立即生效</button><button data-action="draft-option" data-key="startMode" data-value="scheduled" class="${d.startMode === 'scheduled' ? 'active' : ''}">指定时间生效</button></div>${d.startMode === 'scheduled' ? `<label class="field"><span>生效时间</span><input type="datetime-local" data-draft="startAt" value="${esc(d.startAt)}"></label>` : ''}<label class="field"><span>整项任务结束时间</span><input type="datetime-local" data-draft="endAt" value="${esc(d.endAt)}"></label><div class="notice">首期归属实际生效时所在的自然${d.frequency === 'weekly' ? '周' : '日'}；${d.timeMode === 'limited' ? d.frequency === 'weekly' ? '每周周日 23:59 截止' : '每日 23:59 截止' : '每期不限时，不区分按时与补交'}。</div>`}<label class="check"><input type="checkbox" data-check="allowLate" ${d.allowLate ? 'checked' : ''}>允许截止后首次补交${d.kind === 'checkin' ? '（补往期）' : ''}</label><label class="check"><input type="checkbox" data-check="allowReplace" ${d.allowReplace ? 'checked' : ''}>允许家长主动重新提交</label><div class="line"></div><h3 class="section-title">接收对象</h3>${state.classes.map(row => `<label class="check"><input type="checkbox" data-class="${row.id}" ${d.classIds.includes(row.id) ? 'checked' : ''}>${esc(row.name)}</label>`).join('')}<div class="seg"><button data-action="draft-option" data-key="targetMode" data-value="all" class="${d.targetMode === 'all' ? 'active' : ''}">所选班级全体</button><button data-action="draft-option" data-key="targetMode" data-value="selected" class="${d.targetMode === 'selected' ? 'active' : ''}">指定学生</button></div>${d.targetMode === 'selected' ? state.students.filter(row => d.classIds.includes(row.classId)).map(row => `<label class="check"><input type="checkbox" data-student="${row.id}" ${d.selectedIds.includes(row.id) ? 'checked' : ''}>${esc(row.name)} · ${esc(className(row.classId))}</label>`).join('') : `<p class="muted">当前选中 ${recipientIds(d).length} 名学生；发布时固定普通作业名单，打卡按每期开始时固定名单。</p>`}<div class="line"></div><h3 class="section-title">作业项</h3>${d.items.map((item, index) => `<div class="item"><div class="row"><strong>第 ${index + 1} 项</strong><button class="btn secondary small" data-action="remove-item" data-index="${index}" ${d.items.length === 1 ? 'disabled' : ''}>移除</button></div><label class="field"><span>项目名称</span><input data-item="${index}" data-field="title" value="${esc(item.title)}"></label><label class="field"><span>提交方式</span><select data-item="${index}" data-field="type">${[['photo','图片'],['video','视频'],['audio','录音'],['none','无需线上提交']].map(([value, label]) => `<option value="${value}" ${item.type === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${item.type === 'photo' ? `<label class="field"><span>图片处理</span><select data-item="${index}" data-field="gradeMode"><option value="collect" ${item.gradeMode === 'collect' ? 'selected' : ''}>仅收集</option><option value="graded" ${item.gradeMode === 'graded' ? 'selected' : ''}>需要逐题批改</option></select></label>${item.gradeMode === 'graded' ? `<label class="field"><span>第 1 题教师答案（可留空，由模拟服务提供）</span><input data-item="${index}" data-field="answer1" value="${esc(item.answer1)}"></label><label class="field"><span>第 2 题教师答案</span><input data-item="${index}" data-field="answer2" value="${esc(item.answer2)}"></label>` : ''}` : ''}</div>`).join('')}<button class="btn secondary small" data-action="add-item">＋ 添加一项</button>${ui.error ? `<div class="notice error">${esc(ui.error)}</div>` : ''}<div class="actions"><button class="btn" data-action="preview">核对发布内容</button></div></div>`;
  }
  function previewView() {
    const d = ui.draft, start = d.kind === 'checkin' ? d.startMode === 'now' ? state.clock : d.startAt : state.clock;
    const naturalFirstEnd = d.kind === 'checkin' ? periodEnd(d.frequency === 'weekly' ? startOfWeek(start) : startOfDay(start), d.frequency) : d.deadline;
    const firstEnd = d.kind === 'checkin' && d.endAt < naturalFirstEnd ? d.endAt : naturalFirstEnd;
    return `<div class="card"><div class="row"><h2>发布前核对</h2><button class="btn secondary small" data-action="back-compose">返回修改</button></div><p class="summary"><strong>${esc(d.title)}</strong> · ${d.kind === 'checkin' ? `${d.frequency === 'weekly' ? '每周' : '每日'}打卡` : '普通作业'}<br>${esc(d.description)}<br>接收 ${recipientIds(d).length} 人 · ${esc(d.classIds.map(className).join('、'))}<br>${d.kind === 'homework' ? `截止 ${display(d.deadline)}` : `生效 ${display(start)} · 首期到 ${display(firstEnd)} · 整项结束 ${display(d.endAt)} · ${d.timeMode === 'unlimited' ? '不限时' : '限时'}`}</p><div class="notice ${start !== (d.frequency === 'weekly' ? startOfWeek(start) : startOfDay(start)) && d.kind === 'checkin' ? 'warn' : ''}">${d.kind === 'checkin' && start !== (d.frequency === 'weekly' ? startOfWeek(start) : startOfDay(start)) ? '首期不足完整自然日或自然周。' : ''}家长仅看自己孩子的提交内容；学生端不支持提交。</div><h3 class="section-title">完成项目</h3>${d.items.map(item => `<p>${esc(item.title)} · ${item.type === 'photo' ? '图片' : item.type === 'video' ? '视频' : item.type === 'audio' ? '录音' : '家长确认'}${item.gradeMode === 'graded' ? ' · 逐题模拟批改' : ''}</p>`).join('')}<div class="line"></div><h3 class="section-title">发布异常（本页面演示）</h3><div class="seg">${[['normal','正常发布'],['network','网络失败'],['roster','接收名单变化']].map(([value, label]) => `<button data-action="publish-branch" data-value="${value}" class="${ui.publishBranch === value ? 'active' : ''}">${label}</button>`).join('')}</div>${ui.error ? `<div class="notice error">${esc(ui.error)}</div>` : ''}<div class="actions"><button class="btn" data-action="publish">确认发布</button></div></div>`;
  }
  function render() { syncPhases(); root.innerHTML = `<div class="shell">${top()}${ui.notice ? `<div class="notice good">${esc(ui.notice)}</div>` : ''}<div class="layout">${sidebar()}<section class="stage">${ui.role === 'teacher' ? ui.mode === 'preview' ? previewView() : teacherView() : ui.role === 'parent' ? parentView() : schoolView()}</section></div><p class="foot">本页面仅供需求与交互评审。演示时间、任务、提交和批改结果保存在当前浏览器；“重置 mock 数据”会恢复初始演示场景。 <button class="btn secondary small" data-action="reset">重置 mock 数据</button></p></div>`; }
  function validateDraft(d) {
    if (!d.title.trim()) return '请填写任务名称。';
    if (!d.description.trim()) return '请填写整体说明。';
    if (!d.classIds.length || !recipientIds(d).length) return '接收对象为空，请选择班级或学生。';
    if (d.items.some(item => !item.title.trim())) return '请填写每项作业的名称。';
    if (d.kind === 'homework' && (!d.deadline || d.deadline <= state.clock)) return '普通作业截止时间须晚于发布时间。';
    if (d.kind === 'checkin') { const start = d.startMode === 'now' ? state.clock : d.startAt; if (d.startMode === 'scheduled' && start <= state.clock) return '指定生效时间须晚于当前演示时间。'; if (!d.endAt || d.endAt <= start) return '整项结束时间须晚于生效时间。'; }
    return '';
  }
  function createGrades(item, outcome) {
    if (item.type !== 'photo' || item.gradeMode !== 'graded') return [];
    return [
      { id: 'q1', label: '第 1 题 · 客观题', answer: item.answer1 || '12', source: item.answer1 ? '教师录入' : '外接服务模拟', studentAnswer: '12', correct: (item.answer1 || '12') === '12', firstCorrect: (item.answer1 || '12') === '12', state: outcome === 'grade-error' ? 'error' : 'confirmed', knowledge: '数与运算', reliable: true, revision: 1 },
      { id: 'q2', label: '第 2 题 · 短答案', answer: outcome === 'no-answer' ? '' : item.answer2 || '18', source: item.answer2 ? '教师录入' : '外接服务模拟', studentAnswer: '18', correct: (item.answer2 || '18') === '18', firstCorrect: (item.answer2 || '18') === '18', state: outcome === 'grade-error' ? 'error' : outcome === 'no-answer' ? 'no-answer' : outcome === 'misaligned' ? 'misaligned' : outcome === 'knowledge-unreliable' ? 'confirmed' : 'review', knowledge: '应用题', reliable: outcome !== 'grade-error' && outcome !== 'knowledge-unreliable', revision: 1 }
    ];
  }
  function invalidateActive(phaseId, studentId, itemId) { const existing = validSubmission(phaseId, studentId, itemId); if (existing) { existing.invalidatedAt = state.clock; state.audit.push({ at: state.clock, event: `重交使 ${existing.id} 作废` }); } }
  function updateSubmission(outcome) {
    const pending = ui.pending; if (!pending) return;
    const work = task(pending.taskId), item = work?.items.find(row => row.id === pending.itemId);
    if (!work || !item) return;
    const status = ['upload-fail', 'wrong-type', 'duplicate'].includes(outcome) ? 'failed' : ['retake', 'missing-page'].includes(outcome) ? 'retake' : 'accepted';
    state.submissions.push({ id: randomId('sub'), phaseId: pending.phaseId, studentId: pending.studentId, itemId: item.id, submittedAt: pending.receivedAt || state.clock, invalidatedAt: '', status, fileName: pending.fileName, grades: status === 'accepted' ? createGrades(item, outcome) : [], history: [] });
    ui.notice = status === 'accepted' ? '服务端模拟接收成功，教师端进度已更新。' : status === 'retake' ? '图片模糊或漏页，本项需重拍，不计完成。' : outcome === 'duplicate' ? '重复上传被拦截，没有形成新的有效提交。' : outcome === 'wrong-type' ? '媒体类型不符，没有形成有效提交。' : '上传失败，没有形成有效提交。';
    ui.pending = null; save(); render();
  }
  root.addEventListener('change', event => {
    const el = event.target;
    if (el.id === 'demo-clock') { state.clock = el.value; ui.notice = `演示时间已调整至 ${display(state.clock)}；待生效和期次状态已刷新。`; save(); render(); return; }
    if (el.id === 'parent-student') { state.parentId = el.value; ui.phaseId = ''; ui.taskId = ''; ui.notice = ''; save(); render(); return; }
    if (el.id === 'submit-branch') { ui.submitBranch = el.value; render(); return; }
    if (el.dataset.draft) { ui.draft[el.dataset.draft] = el.value; ui.error = ''; render(); return; }
    if (el.dataset.check) { ui.draft[el.dataset.check] = el.checked; render(); return; }
    if (el.dataset.class) { ui.draft.classIds = el.checked ? [...ui.draft.classIds, el.dataset.class] : ui.draft.classIds.filter(id => id !== el.dataset.class); ui.draft.selectedIds = ui.draft.selectedIds.filter(id => recipientIds({ ...ui.draft, targetMode: 'all' }).includes(id)); render(); return; }
    if (el.dataset.student) { ui.draft.selectedIds = el.checked ? [...ui.draft.selectedIds, el.dataset.student] : ui.draft.selectedIds.filter(id => id !== el.dataset.student); render(); return; }
    if (el.dataset.item) { const item = ui.draft.items[Number(el.dataset.item)]; item[el.dataset.field] = el.value; render(); return; }
    if (el.dataset.answer) { ui.answerDraft[el.dataset.answer] = el.value; return; }
    if (el.dataset.knowledge) { ui.knowledgeDraft[el.dataset.knowledge] = el.value; }
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button) return;
    const action = button.dataset.action, work = task(ui.taskId), row = phase(ui.phaseId) || (work && phasesOf(work.id).at(-1));
    ui.notice = '';
    if (action === 'role') { ui.role = button.dataset.role; ui.taskId = ''; ui.phaseId = ''; ui.mode = 'list'; ui.selectedStudent = ''; }
    else if (action === 'task') { ui.taskId = button.dataset.id; ui.phaseId = phasesOf(ui.taskId).at(-1)?.id || ''; ui.mode = 'detail'; ui.selectedStudent = ''; }
    else if (action === 'phase') { ui.phaseId = button.dataset.id; ui.selectedStudent = ''; }
    else if (action === 'metric') ui.schoolMetric = button.dataset.value;
    else if (action === 'new') { ui.mode = 'compose'; ui.draft = blankDraft(); ui.error = ''; ui.taskId = ''; }
    else if (action === 'cancel-compose') { ui.mode = 'list'; ui.draft = null; ui.error = ''; }
    else if (action === 'draft-kind') { ui.draft.kind = button.dataset.value; ui.draft.subject = ui.draft.kind === 'checkin' ? '语文' : '数学'; }
    else if (action === 'draft-option') ui.draft[button.dataset.key] = button.dataset.value;
    else if (action === 'add-item') ui.draft.items.push({ id: randomId('item'), title: '', type: 'photo', gradeMode: 'collect', answer1: '', answer2: '' });
    else if (action === 'remove-item' && ui.draft.items.length > 1) ui.draft.items.splice(Number(button.dataset.index), 1);
    else if (action === 'preview') { ui.error = validateDraft(ui.draft); if (!ui.error) ui.mode = 'preview'; }
    else if (action === 'back-compose') { ui.mode = 'compose'; ui.error = ''; }
    else if (action === 'publish-branch') ui.publishBranch = button.dataset.value;
    else if (action === 'publish') {
      if (ui.publishBranch === 'network') ui.error = '发布失败：网络不可用。草稿已保留，请切回正常发布后重试。';
      else if (ui.publishBranch === 'roster') { ui.error = '接收名单在预览后变化。请返回修改页重新核对接收对象。'; ui.publishBranch = 'normal'; }
      else {
        const d = ui.draft, id = randomId('task'), start = d.kind === 'checkin' ? d.startMode === 'now' ? state.clock : d.startAt : state.clock;
        const created = { ...d, id, startAt: start, status: 'published', publishedAt: state.clock, recipientIds: d.kind === 'homework' ? recipientIds(d) : [], items: d.items.map(item => ({ ...item })) };
        state.tasks.unshift(created);
        if (d.kind === 'homework') state.phases.push({ id: `${id}:once`, taskId: id, start, end: '', deadline: d.deadline, frequency: '', targetIds: [...created.recipientIds] });
        ui.mode = 'detail'; ui.taskId = id; ui.phaseId = d.kind === 'homework' ? `${id}:once` : ''; ui.draft = null; ui.error = ''; ui.notice = d.kind === 'checkin' && start > state.clock ? '发布成功，当前待生效；到时才生成首期和家长待办。' : '发布成功，接收名单与期次已生成。'; save();
      }
    }
    else if (action === 'student') ui.selectedStudent = button.dataset.id;
    else if (action === 'parent-start' && row && work) {
      const item = work.items.find(value => value.id === button.dataset.item), existing = item && validSubmission(row.id, state.parentId, item.id);
      const blocked = item && canSubmit(row, state.parentId, Boolean(existing) || historyFor(row.id, state.parentId, item.id).some(record => record.invalidatedAt));
      if (blocked) ui.notice = blocked;
      else if (existing) ui.replace = { taskId: work.id, phaseId: row.id, studentId: state.parentId, itemId: item.id };
      else if (item) { ui.pending = { taskId: work.id, phaseId: row.id, studentId: state.parentId, itemId: item.id, replacing: false, fileName: item.type === 'none' ? '家长确认已完成' : `演示${item.type === 'photo' ? '照片.jpg' : item.type === 'video' ? '视频.mp4' : '录音.mp3'}`, branch: item.type === 'none' ? 'normal' : ui.submitBranch }; if (item.type === 'none') updateSubmission('normal'); }
    }
    else if (action === 'replace-confirm' && ui.replace) { invalidateActive(ui.replace.phaseId, ui.replace.studentId, ui.replace.itemId); const item = task(ui.replace.taskId).items.find(value => value.id === ui.replace.itemId); ui.pending = { ...ui.replace, replacing: true, fileName: item.type === 'none' ? '家长再次确认' : `重交演示${item.type === 'photo' ? '照片.jpg' : item.type === 'video' ? '视频.mp4' : '录音.mp3'}`, branch: ui.submitBranch }; ui.replace = null; ui.notice = '旧版已立即作废，教师端完成进度同步回退。'; save(); }
    else if (action === 'cancel-replace') ui.replace = null;
    else if (action === 'finish-upload' && ui.pending) { const blocked = canSubmit(phase(ui.pending.phaseId), ui.pending.studentId, ui.pending.replacing); if (blocked) { ui.pending = null; ui.notice = `文件未能在可提交时间内完整到达服务端：${blocked}。本次不计完成。`; } else if (ui.pending.branch === 'upload-fail') { updateSubmission('upload-fail'); return; } else { ui.pending.stage = 'validating'; ui.pending.receivedAt = state.clock; ui.notice = `完整文件于 ${display(state.clock)} 到达模拟服务端，等待校验；按时性以此时间判定。`; } }
    else if (action === 'finish-validate' && ui.pending) { updateSubmission(ui.pending.branch); return; }
    else if (action === 'cancel-upload' && ui.pending) { ui.pending = null; ui.notice = '上传中断，未形成有效提交。'; }
    else if (action === 'return-none') { const sub = state.submissions.find(value => value.id === button.dataset.sub); if (sub) { sub.invalidatedAt = state.clock; sub.history.push({ at: state.clock, event: '教师退回线下确认项' }); ui.notice = '已退回重做，该项不再计入当前完成；截止时快照保持原值。'; save(); } }
    else if (action === 'grade' || action === 'retry-grade') { const sub = state.submissions.find(value => value.id === button.dataset.sub), grade = sub?.grades.find(value => value.id === button.dataset.q); if (grade) { const before = grade.state; grade.firstCorrect ??= grade.correct; grade.state = action === 'retry-grade' ? 'review' : 'confirmed'; if (action === 'grade') grade.correct = button.dataset.result === 'correct'; grade.revision += 1; sub.history.push({ at: state.clock, event: `教师复核 ${grade.id} ${before}→${grade.state}` }); ui.notice = '逐题结果已重算；家长端需教师再次开放才显示新结果。'; save(); } }
    else if (action === 'save-grade') { const sub = state.submissions.find(value => value.id === button.dataset.sub), grade = sub?.grades.find(value => value.id === button.dataset.q); if (grade) { const key = `${sub.id}:${grade.id}`, answer = ui.answerDraft[key] ?? grade.answer, knowledge = ui.knowledgeDraft[key] ?? grade.knowledge; const sameQuestion = state.submissions.filter(value => value.phaseId === sub.phaseId && value.itemId === sub.itemId && value.status === 'accepted' && !value.invalidatedAt).flatMap(value => value.grades.map(g => ({ value, g }))).filter(({ g }) => g.id === grade.id); sameQuestion.forEach(({ value, g }) => { value.history.push({ at: state.clock, event: `教师修正答案 ${g.answer}→${answer}；知识点 ${g.knowledge}→${knowledge}` }); g.firstCorrect ??= g.correct; g.answer = answer; g.source = '教师修订'; g.knowledge = knowledge; g.reliable = Boolean(knowledge); g.correct = Boolean(answer) && g.studentAnswer === answer; g.state = answer ? 'confirmed' : 'no-answer'; g.revision += 1; }); ui.notice = '同一作业项的同题当前有效作答已按教师答案重算；知识点与统计同步刷新。'; save(); } }
    else if (action === 'release' && row) { gradeRows(row).filter(({ grade }) => grade.state === 'confirmed').forEach(({ sub, grade }) => { state.release[`${sub.id}:${grade.id}`] = { revision: grade.revision, at: state.clock }; }); ui.notice = '已开放当前有效判定；待复核与异常题保持未开放。'; save(); }
    else if (action === 'withdraw' && work) { work.status = 'withdrawn'; work.withdrawnAt = state.clock; state.audit.push({ at: state.clock, event: `撤回 ${work.id}` }); ui.notice = '任务已撤回，家长待办停止，校级常规统计不再计入。'; save(); }
    else if (action === 'edit-start' && work && state.clock < work.startAt) { const next = root.querySelector('#new-start')?.value; if (!next || next <= state.clock || next >= work.endAt) ui.notice = '生效时间须晚于当前演示时间且早于整项结束时间。'; else { const old = work.startAt; work.startAt = next; state.audit.push({ at: state.clock, event: `生效时间 ${old}→${next}` }); ui.notice = `生效时间改为 ${display(next)}；首期开始前可调整。`; save(); } }
    else if (action === 'start-now' && work && state.clock < work.startAt) { const old = work.startAt; work.startAt = state.clock; state.audit.push({ at: state.clock, event: `生效时间 ${old}→立即生效` }); ui.notice = '已改为立即生效，首期及家长待办当即生成。'; save(); }
    else if (action === 'toggle-future-student' && work && work.kind === 'checkin' && work.targetMode === 'selected') { const id = button.dataset.id; work.selectedIds = work.selectedIds.includes(id) ? work.selectedIds.filter(value => value !== id) : [...work.selectedIds, id]; state.audit.push({ at: state.clock, event: `未来期指定学生调整：${id}` }); ui.notice = '已更新未来期名单；已开始期的接收名单和分母不变。'; save(); }
    else if (action === 'transfer') { const s4 = state.students.find(value => value.id === 's4'); s4.classId = s4.classId === 'c1' ? 'c2' : 'c1'; ui.notice = `赵悦现属 ${className(s4.classId)}。已开始期名单不变，后续期按新班级生成。`; save(); }
    else if (action === 'reset') { state = seed(); ui = { role: 'teacher', taskId: '', phaseId: '', mode: 'list', draft: null, error: '', notice: '已恢复初始 mock 数据。', publishBranch: 'normal', submitBranch: 'normal', selectedStudent: '', schoolMetric: 'cutoff', replace: null, pending: null, answerDraft: {}, knowledgeDraft: {} }; save(); }
    render();
  });
  window.homeworkFlowLab = { getState: () => structuredClone(state), reset: () => { state = seed(); save(); render(); }, setClock: value => { state.clock = value; save(); render(); } };
  render();
})();
