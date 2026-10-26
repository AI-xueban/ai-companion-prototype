/* Mobile borrowing workflow. Uses existing mobile shell; never exposes school student editing. */
(() => {
  const R = window.controlRules, M = window.borrowingModel, key = 'teacher-control-prototype-v1';
  const ui = { mode: null, scope: null, batch: false, selected: new Set(), editor: null, pending: null, groups: [], query: '', filter: 'all' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const js = value => esc(JSON.stringify(value));
  const button = (label, action, secondary = true, disabled = false) => `<button type="button" class="control-${secondary ? 'secondary' : 'primary'}" onclick="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  const card = (title, body) => `<section class="control-module-panel"><h3>${title}</h3>${body}</section>`;
  function latest() {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : R.copy(controlData);
    data.schoolSettings ||= {};
    if (!data.schoolSettings.borrowing) {
      data.schoolSettings.borrowing = M.initial();
      schoolControlClasses.forEach(name => { data.schoolSettings.borrowing.classRules[name] = R.copy(data.schoolSettings.borrowingRules || []); });
    }
    return data;
  }
  const state = () => latest().schoolSettings.borrowing;
  const names = () => ui.scope || (adminLevel === 'class' ? [selectedTeacherClass] : adminLevel === 'grade' ? schoolControlClasses.filter(n => n.startsWith(adminSelectedGrade)) : [...schoolControlClasses]);
  const count = list => list.reduce((total, name) => total + (controlData[name]?.length || 0), 0);
  const scopeText = list => list.length === schoolControlClasses.length ? '全校' : schoolGrades().flatMap(grade => {
    const all = schoolControlClasses.filter(n => n.startsWith(grade)), selected = all.filter(n => list.includes(n));
    return selected.length === all.length ? [grade] : selected;
  }).join('、');
  function shell(title, content, footer = '') {
    const top = header(title, false).replace('<span></span><h2', '<button class="wx-back" aria-label="返回上一页" onclick="borrowing.back()"><i></i></button><h2');
    app.innerHTML = `<main class="screen control-screen borrowing-mobile">${top}<section class="control-content">${content}</section>${footer}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    syncReview();
  }
  const modeTitle = () => ui.mode === 'weekly' ? '每周固定借用时间' : '指定日期借用时间';
  function ruleActions(rule, index) {
    const icon = (kind, label, path) => `<button class="parity-rule-icon ${kind === 'remove' ? 'parity-danger' : ''}" aria-label="${label}" onclick="borrowing.${kind}(${index})"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg></button>`;
    return `<div class="parity-rule-actions">${R.borrowStatus(rule) !== '已失效' ? icon('edit','编辑规则','<path d="m15 4 5 5M4 20l5-1L21 7a2.1 2.1 0 0 0-5-5L4 14z"/>') : ''}${icon('remove','删除规则','<path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/>')}</div>`;
  }
  function overview(s, list) {
    ui.groups = [];
    return [['weekly', '每周固定借用时间'], ['dates', '指定日期借用时间']].map(([mode, title]) => {
      const groups = M.groups(s, list, mode);
      return `<section class="parity-borrow-section"><div class="parity-borrow-heading"><h3>${title}</h3><button class="borrowing-detail-link" onclick="borrowing.mode('${mode}')">查看详情 ›</button></div>${groups.map(group => { const index = ui.groups.push(group) - 1, {rule,names} = group; return `<article class="parity-rule"><b>${esc(R.borrowText(rule))}</b>${mode === 'dates' ? `<p>${R.borrowStatus(rule)}</p>` : ''}<p>适用范围：${esc(scopeText(names))}</p>${ruleActions(rule,index)}</article>`; }).join('') || '<p class="parity-borrow-empty">尚未设置借用时间</p>'}</section>`;
    }).join('');
  }
  function rulePanel(s, list) {
    ui.groups = M.groups(s, list, ui.mode);
    return `<section class="parity-borrow-section"><div class="parity-borrow-heading"><h3>${esc(scopeText(list))}借用规则</h3>${button('新增规则', 'borrowing.edit()', false, !count(list))}</div>${ui.groups.map((group, i) => `<article class="parity-rule"><b>${esc(R.borrowText(group.rule))}</b>${group.rule.mode === 'dates' ? `<p>${R.borrowStatus(group.rule)}</p>` : ''}<p>适用范围：${esc(scopeText(group.names))}</p><div class="control-actions">${R.borrowStatus(group.rule) !== '已失效' ? button('编辑', `borrowing.edit(${i})`) : ''}${button('删除', `borrowing.remove(${i})`)}</div></article>`).join('') || '<p class="parity-borrow-empty">尚未设置借用规则</p>'}</section>`;
  }
  function scopeRows(s) {
    const rows = adminLevel === 'school' ? schoolGrades().map(label => ({ label, names: schoolControlClasses.filter(n => n.startsWith(label)) })) : names().map(label => ({ label, names: [label] }));
    return rows.map((row, i) => {
      const summary = M.summary(s, row.names, ui.mode), denied = row.names.every(n => M.denied(s, n)), some = row.names.some(n => M.denied(s, n));
      return `<div class="admin-level-row">${ui.batch ? `<label><input class="admin-level-check" type="checkbox" aria-label="选择${esc(row.label)}" ${ui.selected.has(row.label) ? 'checked' : ''} onchange="borrowing.select(${js(row.label)},this.checked)"></label>` : ''}<button class="admin-level-link" ${adminLevel !== 'school' ? 'disabled' : ''} onclick="borrowing.go(${js(row.label)})"><span class="admin-level-copy"><b>${esc(row.label)}</b><small>${count(row.names)}名学生 · ${denied ? '临时禁止借用' : some ? '部分临时禁借' : '未开启临时禁借'}</small></span>${adminLevel === 'school' ? '<i>›</i>' : ''}</button>${!ui.batch ? `<div class="parity-scope-actions borrowing-list-actions">${button('设置规则', `borrowing.manage(${js(row.names)})`, true, !count(row.names))}${button(denied ? '解除临时禁借' : '临时禁借', `borrowing.temporary(${js(row.names)},${!denied})`, true, !count(row.names))}</div>` : ''}</div>`;
    }).join('') || '<div class="control-empty">暂无班级</div>';
  }
  function adminPage() {
    const s = state(), list = names();
    if (!ui.mode) return shell('借用管控', `<p class="parity-context">${esc(scopeText(list))}</p>${overview(s, list)}`);
    const selected = selectedClasses();
    shell(modeTitle(), `<p class="parity-context">${esc(scopeText(list))}</p>${ui.scope ? rulePanel(s, list) : `<div class="admin-scope-summary"><b>${adminLevel === 'school' ? '年级' : '班级'}</b>${button(ui.batch ? '取消批量' : '批量设置', 'borrowing.batch()')}</div>${ui.batch ? `<label class="borrowing-select-all"><input type="checkbox" ${selected.length === list.length ? 'checked' : ''} onchange="borrowing.selectAll(this.checked)">全选 · 已选${ui.selected.size}项</label>` : ''}<div class="admin-level-list">${scopeRows(s)}</div>`}`, ui.batch ? `<footer class="borrowing-footer">${button('设置规则', `borrowing.manage(${js(selected)})`, false, !selected.length || !count(selected))}${button('禁止借用', `borrowing.temporary(${js(selected)},true)`, true, !selected.length || !count(selected))}${button('解除禁借', `borrowing.temporary(${js(selected)},false)`, true, !selected.length || !count(selected))}</footer>` : '');
  }
  const selectedClasses = () => schoolControlClasses.filter(n => ui.selected.has(n) || ui.selected.has(n.split('年级')[0] + '年级'));
  const studentRows = () => (controlData[selectedTeacherClass] || []).filter(s => s.name.includes(ui.query) || String(s.id).includes(ui.query)).filter(s => ui.filter === 'all' || Boolean(state().studentBans[s.id]) === (ui.filter === 'yes'));
  function teacherPage() {
    const s = state(), blocked = M.denied(s, selectedTeacherClass), rows = studentRows();
    const canManage = controlWorkView === 'homeroom' && isHeadTeacherClass();
    const body = rows.map(student => `<article class="control-student-row"><span class="parity-student-main"><b>${esc(student.name)}</b><span>${blocked || s.studentBans[student.id] ? '禁止借用' : '未禁借'}</span></span>${canManage && !blocked ? ui.batch ? `<input type="checkbox" aria-label="选择${esc(student.name)}" ${ui.selected.has(student.id) ? 'checked' : ''} onchange="borrowing.select(${student.id},this.checked)">` : button(s.studentBans[student.id] ? '解除禁借' : '禁止借用', `borrowing.student([${student.id}],${!s.studentBans[student.id]})`) : ''}</article>`).join('');
    shell('借用管控', `<p class="parity-context">${esc(selectedTeacherClass)}</p>${blocked ? '<p class="parity-note">学校正在临时禁止借用，暂时无法修改。</p>' : '<p class="parity-note">未禁借的学生按学校借用时间借用。</p>'}<div class="control-actions">${button('查看借用时间', 'borrowing.showTimes()')}${canManage && !blocked ? button(ui.batch ? '取消批量' : '批量设置', 'borrowing.batch()') : ''}</div><div class="control-filters"><input type="search" aria-label="搜索学生" placeholder="搜索学生姓名或编号" value="${esc(ui.query)}" onchange="borrowing.search(this.value)"><select aria-label="禁借状态" onchange="borrowing.filter(this.value)">${[['all','全部'],['yes','已禁借'],['no','未禁借']].map(([v,t]) => `<option value="${v}" ${ui.filter === v ? 'selected' : ''}>${t}</option>`).join('')}</select></div>${body || '<div class="control-empty">暂无学生</div>'}`, ui.batch && !blocked ? `<footer class="borrowing-footer"><label><input type="checkbox" ${rows.length && rows.every(s => ui.selected.has(s.id)) ? 'checked' : ''} onchange="borrowing.selectAll(this.checked)">全选</label>${button('禁止借用', 'borrowing.student(null,true)', false, !ui.selected.size)}${button('解除禁借', 'borrowing.student(null,false)', true, !ui.selected.size)}${button('已选' + ui.selected.size + '名学生 ›', 'borrowing.roster()')}</footer>` : '');
  }
  function operation(value, data = latest()) {
    const s = data.schoolSettings.borrowing;
    return { ...value, revision: s.revision, targets: M.targets(data, value.names) };
  }
  function confirm(op, title, description) {
    ui.pending = op;
    controlOverlay(title, `<p>${esc(scopeText(op.names))} · 影响 ${op.type === 'student' ? op.ids.length : count(op.names)} 名学生</p>${description}`, button('取消', 'closeControlOverlay()') + button('确认', 'borrowing.commit()', false));
  }
  function editorPage() {
    const e = ui.editor, r = e.rule;
    const days = ['周一','周二','周三','周四','周五','周六','周日'];
    shell('设置借用规则', `<p class="parity-context">${esc(scopeText(e.names))} · ${count(e.names)}名学生</p><section class="control-module-panel borrowing-form">${r.mode === 'weekly' ? `<fieldset><legend>适用星期</legend><div class="borrowing-days">${days.map((day,i) => `<label><input type="checkbox" name="borrow-day" value="${i}" ${r.weekdays.includes(i) ? 'checked' : ''}>${day}</label>`).join('')}</div></fieldset>` : `<label>开始日期<input id="borrow-start" type="date" min="${R.today()}" value="${r.startDate}" onchange="document.getElementById('borrow-end').min=this.value"></label><label>结束日期<input id="borrow-end" type="date" min="${r.startDate || R.today()}" value="${r.endDate}"></label><label>借用方式<select id="borrow-way" onchange="borrowing.way()"><option value="periods" ${!r.deny ? 'selected' : ''}>按时段借用</option><option value="deny" ${r.deny ? 'selected' : ''}>全天禁止借用</option></select></label>`}${!r.deny ? `<h3>借用时段</h3><div id="borrow-periods">${r.periods.map((p,i) => `<div class="borrowing-period"><input type="time" aria-label="开始时间${i+1}" value="${p.start}"><span>至</span><input type="time" aria-label="结束时间${i+1}" value="${p.end}">${button('删除', `borrowing.period(${i})`)}</div>`).join('')}</div>${button('＋ 添加时段', 'borrowing.period()')}` : ''}<p id="borrow-error" role="alert" class="parity-error"></p></section>`, `<footer class="borrowing-footer">${button('取消', 'borrowing.cancelEditor()')}${button('保存', 'borrowing.save()', false)}</footer>`);
  }
  function collect() {
    const r = ui.editor.rule;
    if (r.mode === 'weekly') r.weekdays = [...document.querySelectorAll('[name=borrow-day]:checked')].map(el => Number(el.value));
    else { r.startDate = document.getElementById('borrow-start').value; r.endDate = document.getElementById('borrow-end').value; r.deny = document.getElementById('borrow-way').value === 'deny'; }
    const host = document.getElementById('borrow-periods');
    if (host) r.periods = [...host.children].map(row => { const fields = row.querySelectorAll('input'); return { start: fields[0].value, end: fields[1].value }; });
  }
  window.borrowing = {
    entryCard() {
      const s = state(), total = schoolControlClasses.length, blocked = schoolControlClasses.filter(n => M.denied(s, n)).length;
      return `<section class="control-entry-lock"><div class="control-entry-lock-head"><div><h3>学校借用安排</h3><p>${blocked === total ? '全校临时禁借中' : blocked ? '部分班级临时禁借中' : '未开启临时禁借'}</p></div><button onclick="enterAdminModule('borrowing')">查看详情 ›</button></div><p class="parity-note">未设置借用时间，默认随时可借；设置后按规定时间借用。被学校或班主任禁借的学生除外。</p><div class="control-actions">${button(s.schoolTemporaryActive ? '结束全校临时禁借' : '一键临时禁借', `borrowing.temporary(${js(schoolControlClasses)},${!s.schoolTemporaryActive},true)`, s.schoolTemporaryActive, !count(schoolControlClasses))}</div></section>`;
    },
    busy() { return controlModule === 'borrowing' && Boolean(ui.editor || document.querySelector('#control-overlay .control-shade')); },
    render() {
      controlData = latest();
      if (['entry', 'home'].includes(controlView)) return renderControl();
      if (ui.editor) return editorPage();
      if (controlDemoRole === 'admin') adminPage(); else teacherPage();
    },
    reset() { Object.assign(ui, { mode: null, scope: null, batch: false, selected: new Set(), editor: null, pending: null, query: '', filter: 'all' }); },
    back() { if (ui.editor) return this.cancelEditor(); if (ui.scope) { ui.scope = null; } else if (adminLevel === 'grade' && controlDemoRole === 'admin' && adminModuleRoot === 'school') { adminLevel = 'school'; adminSelectedGrade = ''; } else if (controlDemoRole === 'admin' && ui.mode) { ui.mode = null; } else { this.reset(); controlView = 'entry'; renderControl(); return; } ui.batch = false; ui.selected.clear(); this.render(); },
    mode(mode) { ui.mode = mode; this.render(); },
    go(label) { if (adminLevel !== 'school') return this.manage([label]); adminLevel = 'grade'; adminSelectedGrade = label; ui.selected.clear(); ui.batch = false; this.render(); },
    manage(list) { if (!list.length || !count(list)) return; ui.scope = list; ui.batch = false; ui.selected.clear(); this.render(); },
    batch() { ui.batch = !ui.batch; ui.selected.clear(); this.render(); },
    select(id, checked) { const top = document.querySelector('.control-content')?.scrollTop || 0; checked ? ui.selected.add(id) : ui.selected.delete(id); this.render(); document.querySelector('.control-content').scrollTop = top; },
    selectAll(checked) { const keys = controlDemoRole === 'admin' ? adminLevel === 'school' ? schoolGrades() : names() : studentRows().map(s => s.id); keys.forEach(id => checked ? ui.selected.add(id) : ui.selected.delete(id)); this.render(); },
    search(value) { ui.query = value; this.render(); }, filter(value) { ui.filter = value; this.render(); },
    roster() { const selected = (controlData[selectedTeacherClass] || []).filter(s => ui.selected.has(s.id)); controlOverlay('所选学生', `<div class="borrowing-roster">${selected.map(s => `<span>${esc(s.name)}</span>`).join('')}</div>`, button('关闭', 'closeControlOverlay()')); },
    showTimes() {
      const rules = state().classRules[selectedTeacherClass] || [];
      controlOverlay('学校借用时间', `<p>${esc(selectedTeacherClass)}</p>${[['weekly','每周借用时间'],['dates','指定日期借用时间']].map(([mode,title]) => `<h3>${title}</h3>${rules.filter(r => r.mode === mode).map(r => `<p>${esc(R.borrowText(r))}${mode === 'dates' ? ' · ' + R.borrowStatus(r) : ''}</p>`).join('') || '<p>未设置</p>'}`).join('')}<p class="parity-note">未设置借用时间，默认随时可借；被学校或班主任禁借的学生除外。</p>`, button('关闭', 'closeControlOverlay()'));
    },
    temporary(list, value, school = false) { if (controlDemoRole !== 'admin') return; const target = list || names(); confirm(operation({ type: 'temporary', names: target, value, school }), value ? '确认临时禁止借用？' : school ? '确认结束全校临时禁借？' : '确认解除临时禁借？', `<p>${value ? '所选班级暂停新借出，班主任暂时不能修改借用状态。不影响已经借出的设备。' : '解除临时禁借后，按当前有效的借用规则执行，保留已有的学生禁借。'}</p>`); },
    student(ids, value) {
      if (controlWorkView !== 'homeroom' || !isHeadTeacherClass()) return;
      if (M.denied(state(), selectedTeacherClass)) return controlToast('学校正在临时禁止借用，暂时无法修改');
      const selected = ids || [...ui.selected]; if (!selected.length) return;
      confirm(operation({ type: 'student', names: [selectedTeacherClass], ids: selected, value }), value ? '确认禁止借用？' : '确认解除禁借？', `<p>${value ? '禁借立即生效，直到班主任手动解除。不影响已借出设备的使用和归还。' : '解除后按学校借用时间借用，不代表现在一定可借。'}</p>`);
    },
    edit(index) {
      if (controlDemoRole !== 'admin') return;
      const group = index === undefined ? null : ui.groups[index], rule = group ? R.copy(group.rule) : { id: 'borrow-' + crypto.randomUUID(), mode: ui.mode, weekdays: [0,1,2,3,4], startDate: R.today(), endDate: R.today(), deny: false, periods: [{ start: '08:00', end: '17:30' }] };
      if (R.borrowStatus(rule) === '已失效') return;
      ui.editor = operation({ type: 'save', names: group?.names || names(), rule, editingIds: group?.ids || {} }); editorPage();
    },
    way() { collect(); editorPage(); },
    period(index) { collect(); if (index === undefined) ui.editor.rule.periods.push({ start: '', end: '' }); else ui.editor.rule.periods.splice(index, 1); editorPage(); },
    cancelEditor() { controlOverlay('放弃本次修改？', '<p>退出后不会保存。</p>', button('继续编辑', 'closeControlOverlay()') + button('放弃修改', 'borrowing.discard()', false)); },
    discard() { ui.editor = null; ui.pending = null; this.render(); },
    save() {
      collect(); const e = ui.editor, error = R.validateBorrow(e.rule);
      if (error) { document.getElementById('borrow-error').textContent = error; return; }
      const s = state(), conflicts = e.names.flatMap(name => (s.classRules[name] || []).filter(r => r.id !== e.editingIds[name] && R.overlap(r, e.rule)).map(r => `${name}：${R.borrowText(r)}`));
      confirm(R.copy(e), conflicts.length ? '确认覆盖借用规则？' : '确认保存借用规则？', `<p>${esc(R.borrowText(e.rule))}</p>${conflicts.length ? '<p>以下规则的重叠日期将被替换，其余日期保留：</p><div class="borrowing-conflicts">' + conflicts.map(t => `<p>${esc(t)}</p>`).join('') + '</div>' : ''}<p>${e.rule.mode === 'weekly' ? '每周规则仅允许在所选星期和时段借用；其他已设规则保留，指定日期优先。' : '指定日期优先于每周规则。'}临时禁借和学生禁借不受影响。</p>`);
    },
    remove(index) {
      const group = ui.groups[index], s = state();
      const unrestricted = group.names.filter(name => !(s.classRules[name] || []).some(r => r.id !== group.ids[name]));
      const text = unrestricted.length ? `${scopeText(unrestricted)}删除后默认随时可借，已禁借的学生除外。${unrestricted.length !== group.names.length ? '其他班级按剩余规则执行。' : ''}` : '删除后按其他有效日期或每周规则执行；都未设置时默认可借。';
      confirm(operation({ type: 'delete', names: group.names, editingIds: group.ids }), '确认删除借用规则？', `<p>${esc(R.borrowText(group.rule))}</p><p>${esc(text)}</p>`);
    },
    commit() {
      if (!ui.pending) return;
      let data, next;
      try { data = latest(); next = M.commit(data.schoolSettings.borrowing, ui.pending, data, controlWorkView, [controlClasses[0]]); }
      catch (error) { ui.pending = null; ui.editor = null; this.render(); controlToast(error.message); return; }
      data.schoolSettings.borrowing = next;
      try { localStorage.setItem(key, JSON.stringify(data)); } catch { controlToast('保存失败，请重试'); return; }
      controlData = data; ui.pending = null; ui.editor = null; ui.selected.clear(); ui.batch = false; this.render(); controlToast('已保存');
    },
  };
  const open = window.openControlModule, enter = window.enterAdminModule;
  window.openControlModule = module => { if (module === 'borrowing') borrowing.reset(); open(module); };
  window.enterAdminModule = module => { if (module === 'borrowing') borrowing.reset(); enter(module); };
  if (stage === 'teacherDesk' && teacherTab === 'control') renderControl();
})();
