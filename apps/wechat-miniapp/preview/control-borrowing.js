/* Mobile borrowing workflow. Uses existing mobile shell; never exposes school student editing. */
(() => {
  const R = window.controlRules, M = window.borrowingModel, key = 'teacher-control-prototype-v1';
  const ui = { mode: 'weekly', scope: null, batch: false, selected: new Set(), editor: null, pending: null, studentDraft: null, groups: [], query: '', filter: 'all' };
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
  const state = () => {
    const current = latest().schoolSettings.borrowing;
    if (!['temporary-notice','temporary-blocked'].includes(ui.demo)) return current;
    const preview = R.copy(current);
    preview.temporaryClasses[selectedTeacherClass] = ui.demo === 'temporary-blocked';
    return preview;
  };
  const names = () => ui.scope || (adminLevel === 'class' ? [selectedTeacherClass] : adminLevel === 'grade' ? schoolControlClasses.filter(n => n.startsWith(adminSelectedGrade)) : [...schoolControlClasses]);
  const count = list => list.reduce((total, name) => total + (controlData[name]?.length || 0), 0);
  const stageOf = label => /^[一二三四五六]年级/.test(label) ? '小学' : /^[七八九]年级/.test(label) ? '初中' : '';
  const selectableRows = () => adminLevel === 'school' ? schoolGrades().filter(grade => count(schoolControlClasses.filter(name => name.startsWith(grade))) > 0) : names().filter(name => count([name]) > 0);
  const scopeText = list => {
    const eligible = schoolControlClasses.filter(name => count([name]) > 0);
    if (!eligible.length) return list.length === schoolControlClasses.length ? '全校' : list.join('、');
    if (eligible.every(name => list.includes(name))) return '全校';
    return schoolGrades().flatMap(grade => {
      const all = eligible.filter(n => n.startsWith(grade)), selected = all.filter(n => list.includes(n));
      if (!selected.length) return [];
      return selected.length === all.length ? [grade] : selected;
    }).join('、');
  };
  function shell(title, content, footer = '', extraClass = '') {
    const top = header(title, false).replace('<span></span><h2', '<button class="wx-back" aria-label="返回上一页" onclick="borrowing.back()"><i></i></button><h2');
    app.innerHTML = `<main class="screen control-screen borrowing-mobile ${extraClass}">${top}<section class="control-content">${content}</section>${footer}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    syncReview();
  }
  function ruleIcon(kind, action) {
    const edit = kind === 'edit', label = edit ? '编辑规则' : '删除规则';
    const path = edit ? '<path d="m15 4 5 5M4 20l5-1L21 7a2.1 2.1 0 0 0-5-5L4 14z"/>' : '<path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/>';
    return `<button type="button" class="parity-rule-icon ${edit ? '' : 'parity-danger'}" aria-label="${label}" title="${label}" onclick="${action}"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg></button>`;
  }
  function rulePanel(s, list) {
    const weekly = M.groups(s, list, 'weekly'), dates = M.groups(s, list, 'dates');
    ui.groups = [...weekly, ...dates];
    const section = (title, groups, offset) => `<section class="borrowing-rule-section"><h3>${title}</h3>${groups.map((group,i) => `<article class="parity-rule borrowing-rule-item"><div class="borrowing-rule-copy"><b>${esc(R.borrowText(group.rule))}</b>${group.rule.mode === 'dates' ? `<p>${R.borrowStatus(group.rule)}</p>` : ''}<p>适用范围：${esc(scopeText(group.names))}</p></div><div class="parity-rule-actions">${R.borrowStatus(group.rule) !== '已失效' ? ruleIcon('edit', `borrowing.edit(${offset+i})`) : ''}${ruleIcon('delete', `borrowing.remove(${offset+i})`)}</div></article>`).join('') || `<div class="control-empty">尚未设置${title}</div>`}</section>`;
    return `<p class="parity-note">指定日期内按日期规则执行；没有指定日期规则时，按每周规则执行。</p>${section('每周固定借用规则',weekly,0)}${section('指定日期借用规则',dates,weekly.length)}`;
  }
  function temporaryAction(s, list) {
    const denied = list.filter(name => M.denied(s, name)).length, mixed = denied > 0 && denied < list.length;
    return button(mixed || !list.length ? '设置临时禁借' : denied ? '解除临时禁借' : '临时禁借', mixed || !list.length ? `borrowing.temporaryChoice(${js(list)})` : `borrowing.temporary(${js(list)},${!denied})`, true, !count(list));
  }
  function scopeRows(s) {
    const rows = adminLevel === 'school' ? schoolGrades().map(label => ({ label, names: schoolControlClasses.filter(name => name.startsWith(label)) })) : names().map(label => ({ label, names:[label] }));
    let previousStage = '';
    return rows.map(row => {
      const rowCount = count(row.names), selectable = ui.batch && rowCount > 0;
      const stage = adminLevel === 'school' ? stageOf(row.label) : '';
      const heading = stage && stage !== previousStage ? `<div class="control-grade-group-title">${stage}</div>` : '';
      if (stage) previousStage = stage;
      const preview = M.preview(s,row.names), denied = row.names.filter(name => M.denied(s,name)).length;
      return `${heading}<article class="borrowing-scope-card ${selectable ? 'borrowing-selectable' : ''}" ${selectable ? `role="checkbox" tabindex="0" aria-label="选择${esc(row.label)}" aria-checked="${ui.selected.has(row.label)}" data-borrow-key="${esc(row.label)}" onclick="borrowing.select(${js(row.label)},this.getAttribute('aria-checked')!=='true')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"` : ''}><div class="borrowing-card-head">${selectable ? `<span class="borrowing-card-check" aria-hidden="true">${ui.selected.has(row.label) ? '✓' : ''}</span>` : ''}${adminLevel === 'school' && !ui.batch ? `<button class="borrowing-grade-link" onclick="borrowing.go(${js(row.label)})">${esc(row.label)} <span aria-hidden="true">›</span></button>` : `<b>${esc(row.label)}</b>`}${denied ? `<span class="borrowing-denied-badge">${denied === row.names.length ? '已临时禁止借用' : '部分临时禁止借用'}</span>` : ''}</div><p class="borrowing-card-count">${rowCount}名学生</p><div class="borrowing-card-rules">${rowCount ? preview.rules.map(rule => `<p>${esc(R.borrowText(rule))}${rule.mode === 'dates' ? `<small>${R.borrowStatus(rule)}</small>` : ''}</p>`).join('') + preview.notes.map(note => `<p class="parity-note">${esc(note)}</p>`).join('') : '<p class="parity-note">暂无学生，暂不能设置</p>'}${!ui.batch && rowCount && preview.more ? `<button class="borrowing-card-more" onclick="borrowing.manage(${js(row.names)},'${preview.moreMode}')">还有 ${preview.more} 条，查看全部</button>` : ''}</div>${!ui.batch ? `<div class="borrowing-card-actions">${button('设置规则', `borrowing.manage(${js(row.names)})`, true, !rowCount)}${temporaryAction(s,row.names)}</div>` : ''}</article>`;
    }).join('') || '<div class="control-empty">暂无班级</div>';
  }
  function adminPage() {
    const s = state(), list = names(), selected = selectedClasses();
    const eligible = selectableRows();
    const body = ui.scope ? rulePanel(s,list) : `<div class="admin-scope-summary"><b>${adminLevel === 'school' ? '年级' : '班级'}借用规则</b>${button(ui.batch ? '退出设置' : '批量设置','borrowing.batch()')}</div>${ui.batch ? `<label class="borrowing-select-all"><input id="borrowing-select-all" type="checkbox" ${eligible.length && ui.selected.size === eligible.length ? 'checked' : ''} ${!eligible.length ? 'disabled' : ''} onchange="borrowing.selectAll(this.checked)"><span id="borrowing-selected-count">全选 · 已选${ui.selected.size}项</span></label>` : ''}<div class="borrowing-scope-cards">${scopeRows(s)}</div>`;
    const footer = ui.scope ? `<footer class="borrowing-footer borrowing-rule-footer">${button('新增每周固定规则',"borrowing.edit(undefined,'weekly')",false,!count(list))}${button('新增指定日期规则',"borrowing.edit(undefined,'dates')",true,!count(list))}</footer>` : ui.batch ? `<footer class="borrowing-footer"><button type="button" class="control-primary" onclick="borrowing.batchRule()">新增借用规则</button><button type="button" class="control-secondary" onclick="borrowing.batchTemporary()">设置临时禁借</button></footer>` : '';
    shell(ui.scope ? '设置借用规则' : '柜机借用管控', `<p class="parity-context">${esc(scopeText(list))}</p>${!ui.scope ? thisScopeCard(s,list) : ''}${body}`,footer);
  }
  const borrowingDescription = () => '<details class="control-description-fold"><summary aria-label="柜机借用管控说明"><span>管控说明</span><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></summary><div class="control-description-body"><p class="parity-note">未设置借用时间时，学生可随时借用；设置后，按规定时间借用。学校或班主任禁借的学生除外。</p><p class="parity-note">解除学校临时禁借后，按当前借用安排执行；班主任单独设置的禁借仍需班主任解除。</p></div></details>';
  function thisScopeCard(s, list) {
    const school = adminLevel === 'school', blocked = list.filter(name => M.denied(s, name)).length;
    return card(esc(scopeText(list)) + '柜机借用管控', `<p class="parity-note">${school && s.schoolTemporaryActive ? '全校临时禁借中' + (blocked < list.length ? '，部分班级已解除' : '') : blocked === list.length ? '临时禁止借用' : blocked ? '部分班级临时禁借中' : '未开启临时禁借'}</p>${borrowingDescription()}<div class="control-actions">${school ? button(s.schoolTemporaryActive ? '结束全校临时禁借' : '一键临时禁借', `borrowing.temporary(${js(list)},${!s.schoolTemporaryActive},true)`, false, !count(list)) : temporaryAction(s, list)}</div>`);
  }
  const selectedClasses = () => schoolControlClasses.filter(n => count([n]) > 0 && (ui.selected.has(n) || ui.selected.has(n.split('年级')[0] + '年级')));
  const studentRows = () => (controlData[selectedTeacherClass] || []).filter(student => student.name.includes(ui.query) || String(student.id).padStart(6, '0').includes(ui.query)).filter(student => ui.filter === 'all' || Boolean(M.denied(state(), selectedTeacherClass) || state().studentBans[student.id]) === (ui.filter === 'yes'));
  function teacherRows() {
    const s = state(), blocked = M.denied(s, selectedTeacherClass), canManage = controlWorkView === 'homeroom' && isHeadTeacherClass();
    return studentRows().map(student => {
      const denied = blocked || s.studentBans[student.id], main = `<span class="parity-student-main"><b>${esc(student.name)}</b><span>${denied ? '禁止借用' : '未禁借'}</span></span>`;
      if (ui.batch && canManage && !blocked) return `<button type="button" class="control-student-row ${ui.selected.has(student.id) ? 'selected' : ''}" aria-pressed="${ui.selected.has(student.id)}" onclick="borrowing.select(${student.id},${!ui.selected.has(student.id)})">${main}<span class="control-check">${ui.selected.has(student.id) ? '✓' : ''}</span></button>`;
      return `<div class="parity-student-row">${main}${canManage && !blocked ? `<button type="button" class="control-secondary borrowing-student-action" onclick="borrowing.student([${student.id}],${!s.studentBans[student.id]})">${s.studentBans[student.id] ? '解除禁借' : '禁止借用'}</button>` : ''}</div>`;
    }).join('') || `<div class="control-empty">${(controlData[selectedTeacherClass] || []).length ? '没有符合条件的学生' : '暂无学生'}</div>`;
  }
  function teacherFooter() {
    const rows = studentRows();
    const selected = (controlData[selectedTeacherClass] || []).filter(student => ui.selected.has(student.id));
    const denied = selected.filter(student => state().studentBans[student.id]).length;
    const action = !selected.length || (denied > 0 && denied < selected.length)
      ? button('设置', 'borrowing.studentChoice()', false)
      : denied ? button('解除禁借', 'borrowing.student(null,false)', false) : button('禁止借用', 'borrowing.student(null,true)', false);
    return `<footer class="admin-batchbar parity-batchbar borrowing-teacher-footer"><label class="control-footer-select"><input type="checkbox" aria-label="全选" ${rows.length && rows.every(student => ui.selected.has(student.id)) ? 'checked' : ''} onchange="borrowing.selectAll(this.checked)"><span>全选</span><small>${rows.filter(student => ui.selected.has(student.id)).length}/${rows.length}</small></label><div class="admin-batch-actions">${button('退出设置', 'borrowing.batch()')}${action}</div><small class="parity-affected"><button class="borrowing-roster-link" onclick="borrowing.roster()">已选 ${ui.selected.size} 名学生 <span aria-hidden="true">›</span></button></small></footer>`;
  }
  function teacherPage() {
    const s = state(), students = controlData[selectedTeacherClass] || [], blocked = M.denied(s, selectedTeacherClass), canManage = controlWorkView === 'homeroom' && isHeadTeacherClass();
    if (blocked || !canManage) { ui.batch = false; ui.selected.clear(); }
    const selection = ui.batch, denied = students.filter(student => blocked || s.studentBans[student.id]).length;
    const summary = card(esc(selectedTeacherClass) + '当前状态', `<p>${denied}人已禁借 · ${students.length - denied}人未禁借</p><button class="borrowing-times-link" onclick="borrowing.showTimes()">查看借用时间 <span aria-hidden="true">›</span></button>`);
    shell(selection ? '选择学生' : '柜机借用管控', `<div class="parity-context">${esc(selectedTeacherClass)}${selection ? ' · 可多选' : ''}</div>${selection ? '' : summary}${blocked ? '<p class="parity-note">学校已临时禁止该班借用，暂时不能修改。</p>' : ''}<div class="borrow-list-head"><b>${selection ? '选择学生' : '学生规则'}</b>${!selection && canManage && !blocked ? '<button onclick="borrowing.batch()">批量设置</button>' : ''}</div><div class="control-list-tools"><label class="borrow-list-search"><input aria-label="搜索学生姓名或编号" placeholder="搜索学生姓名或编号" value="${esc(ui.query)}" oninput="borrowing.search(this.value)"></label><select class="borrow-status-filter" aria-label="筛选学生借用状态" onchange="borrowing.filter(this.value)">${[['all','全部'],['yes','已禁借'],['no','未禁借']].map(([value,label]) => `<option value="${value}" ${ui.filter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="parity-student-list" id="borrowing-student-rows">${teacherRows()}</div>`, selection ? teacherFooter() : '', 'borrowing-teacher' + (selection ? ' control-student-screen' : ''));
  }
  function refreshTeacherRows() {
    const host = document.getElementById('borrowing-student-rows');
    if (!host) return;
    host.innerHTML = teacherRows();
    const footer = document.querySelector('.borrowing-teacher-footer');
    if (footer) footer.outerHTML = teacherFooter();
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
    const activeDate = r.mode === 'dates' && e.original && R.borrowStatus(e.original) === '生效中';
    const dateFields = activeDate ? `<p class="parity-note">规则正在生效，只能修改结束日期。</p><p>开始日期：${esc(r.startDate)}</p><label>结束日期<input id="borrow-end" type="date" min="${R.today()}" value="${r.endDate}"></label><p>借用方式：${r.deny ? '全天禁止借用' : '按时段借用'}</p>${r.deny ? '' : `<p>借用时段：${esc(R.periodText(r))}</p>`}` : `<label>开始日期<input id="borrow-start" type="date" min="${R.today()}" value="${r.startDate}" onchange="document.getElementById('borrow-end').min=this.value"></label><label>结束日期<input id="borrow-end" type="date" min="${r.startDate || R.today()}" value="${r.endDate}"></label><label>借用方式<select id="borrow-way" onchange="borrowing.way()"><option value="periods" ${!r.deny ? 'selected' : ''}>按时段借用</option><option value="deny" ${r.deny ? 'selected' : ''}>全天禁止借用</option></select></label>`;
    shell('设置借用规则', `<p class="parity-context">${esc(scopeText(e.names))} · ${count(e.names)}名学生</p><section class="control-module-panel borrowing-form">${r.mode === 'weekly' ? `<fieldset><legend>适用星期</legend><div class="borrowing-days">${days.map((day,i) => `<label><input type="checkbox" name="borrow-day" value="${i}" ${r.weekdays.includes(i) ? 'checked' : ''}>${day}</label>`).join('')}</div></fieldset>` : dateFields}${!r.deny && !activeDate ? `<h3>借用时段</h3><div id="borrow-periods">${r.periods.map((p,i) => `<div class="borrowing-period"><input type="time" aria-label="开始时间${i+1}" value="${p.start}"><span>至</span><input type="time" aria-label="结束时间${i+1}" value="${p.end}">${button('删除', `borrowing.period(${i})`)}</div>`).join('')}</div>${button('＋ 添加时段', 'borrowing.period()')}` : ''}<p id="borrow-error" role="alert" class="parity-error"></p></section>`, `<footer class="borrowing-footer">${button('取消', 'borrowing.cancelEditor()')}${button('保存', 'borrowing.save()', false)}</footer>`);
  }
  function collect() {
    const r = ui.editor.rule;
    if (r.mode === 'weekly') r.weekdays = [...document.querySelectorAll('[name=borrow-day]:checked')].map(el => Number(el.value));
    else { const start = document.getElementById('borrow-start'), way = document.getElementById('borrow-way'); if (start) r.startDate = start.value; r.endDate = document.getElementById('borrow-end').value; if (way) r.deny = way.value === 'deny'; }
    const host = document.getElementById('borrow-periods');
    if (host) r.periods = [...host.children].map(row => { const fields = row.querySelectorAll('input'); return { start: fields[0].value, end: fields[1].value }; });
  }
  window.borrowing = {
    entryCard() {
      const s = state(), total = schoolControlClasses.length, blocked = schoolControlClasses.filter(n => M.denied(s, n)).length;
      return `<section class="control-entry-lock"><div class="control-entry-lock-head"><div><h3>柜机借用管控</h3><p>${blocked === total ? '全校临时禁借中' : blocked ? '部分班级临时禁借中' : '未开启临时禁借'}</p></div><button onclick="enterAdminModule('borrowing')">查看详情 ›</button></div>${borrowingDescription()}<div class="control-actions">${button(s.schoolTemporaryActive ? '结束全校临时禁借' : '一键临时禁借', `borrowing.temporary(${js(schoolControlClasses)},${!s.schoolTemporaryActive},true)`, s.schoolTemporaryActive, !count(schoolControlClasses))}</div></section>`;
    },
    busy() { return controlModule === 'borrowing' && Boolean(ui.editor || document.querySelector('#control-overlay .control-shade')); },
    render() {
      controlData = latest();
      if (['entry', 'home'].includes(controlView)) return renderControl();
      if (ui.editor) return editorPage();
      if (controlDemoRole === 'admin') adminPage(); else teacherPage();
    },
    reset() { Object.assign(ui, { temporaryDraft: null, mode: 'weekly', scope: null, batch: false, selected: new Set(), editor: null, pending: null, query: '', filter: 'all' }); },
    back() { if (ui.batch && controlDemoRole !== 'admin') { this.batch(); return; } if (ui.editor) return this.cancelEditor(); if (ui.scope) { ui.scope = null; } else if (adminLevel === 'grade' && controlDemoRole === 'admin' && adminModuleRoot === 'school') { adminLevel = 'school'; adminSelectedGrade = ''; } else { this.reset(); controlView = 'entry'; renderControl(); return; } ui.batch = false; ui.selected.clear(); this.render(); },
    go(label) { if (adminLevel !== 'school') return this.manage([label]); adminLevel = 'grade'; adminSelectedGrade = label; ui.selected.clear(); ui.batch = false; this.render(); },
    manage(list) { const eligible = list.filter(name => count([name]) > 0); if (!eligible.length) return controlToast('请选择设置对象'); ui.scope = eligible; ui.batch = false; ui.selected.clear(); this.render(); },
    batchRule() { const list = selectedClasses(); if (!list.length) return controlToast('请选择设置对象'); if (!count(list)) return; controlOverlay('新增借用规则', `<p class="control-scope">${esc(scopeText(list))} · ${count(list)}名学生</p><p class="parity-note">选择规则类型后填写新规则，保存前会核对已有设置。</p>`, button('每周固定规则', "borrowing.batchCreate('weekly')") + button('指定日期规则', "borrowing.batchCreate('dates')")); },
    batchCreate(mode) { const list = selectedClasses(); if (!list.length) return controlToast('请选择设置对象'); closeControlOverlay(); ui.mode = mode; this.edit(undefined, mode, list); },
    batchTemporary() { const list = selectedClasses(); if (!list.length) return controlToast('请选择设置对象'); if (!count(list)) return; const denied = list.filter(name => M.denied(state(),name)).length; if (denied && denied < list.length) this.temporaryChoice(list); else this.temporary(list,!denied); },
    batch() { ui.batch = !ui.batch; ui.selected.clear(); this.render(); },
    refreshAdminSelection() { const total = selectableRows().length; document.querySelectorAll?.('.borrowing-selectable').forEach(card => { const checked = ui.selected.has(card.dataset.borrowKey); card.setAttribute('aria-checked',String(checked)); card.classList.toggle('is-selected',checked); card.querySelector('.borrowing-card-check').textContent = checked ? '✓' : ''; }); const all = document.getElementById?.('borrowing-select-all'); if (all) { all.checked = total > 0 && ui.selected.size === total; all.indeterminate = ui.selected.size > 0 && ui.selected.size < total; } const counter = document.getElementById?.('borrowing-selected-count'); if (counter) counter.textContent = `全选 · 已选${ui.selected.size}项`; },
    select(id, checked) { if (controlDemoRole === 'admin' && !selectableRows().includes(id)) return; checked ? ui.selected.add(id) : ui.selected.delete(id); if (controlDemoRole !== 'admin') refreshTeacherRows(); else this.refreshAdminSelection(); },
    selectAll(checked) { const keys = controlDemoRole === 'admin' ? selectableRows() : studentRows().map(s => s.id); keys.forEach(id => checked ? ui.selected.add(id) : ui.selected.delete(id)); if (controlDemoRole !== 'admin') refreshTeacherRows(); else this.refreshAdminSelection(); },
    search(value) { ui.query = value; refreshTeacherRows(); }, filter(value) { ui.filter = value; refreshTeacherRows(); },
    roster() { const selected = (controlData[selectedTeacherClass] || []).filter(s => ui.selected.has(s.id)); controlOverlay('所选学生', `<div class="borrowing-roster">${selected.map(s => `<span>${esc(s.name)}</span>`).join('')}</div>`, button('关闭', 'closeControlOverlay()')); },
    showTimes() {
      const rules = state().classRules[selectedTeacherClass] || [];
      const shown = ui.demo === 'times-updated' ? [...rules.filter(rule => rule.mode === 'weekly'), {id:'demo-school-time',mode:'dates',startDate:R.today(),endDate:R.today(),deny:false,periods:[{start:'08:00',end:'18:00'}]}] : rules;
      controlOverlay('学校借用时间', `<p>${esc(selectedTeacherClass)}</p>${ui.demo === 'times-updated' ? '<p class="parity-note">学校借用时间已更新。</p>' : ''}${[['weekly','每周借用时间'],['dates','指定日期借用时间']].map(([mode,title]) => `<h3>${title}</h3>${shown.filter(r => r.mode === mode).map(r => `<p>${esc(R.borrowText(r))}${mode === 'dates' ? ' · ' + R.borrowStatus(r) : ''}</p>`).join('') || '<p>未设置</p>'}`).join('')}<p class="parity-note">未设置借用时间，默认随时可借；被学校或班主任禁借的学生除外。</p>`, button('关闭', 'closeControlOverlay()'));
    },
    demoStart(kind) {
      ui.demoPrevious = {role:controlDemoRole,work:controlWorkView,selectedClass:selectedTeacherClass,module:controlModule,view:controlView};
      controlDemoRole = 'teacher'; controlWorkView = 'homeroom'; selectedTeacherClass = controlClasses[0];
      controlModule = 'borrowing'; controlView = 'module'; this.reset();
      ui.demo = kind === 'temporary' ? 'temporary-notice' : 'times-notice';
      this.render();
      if (kind === 'temporary') {
        controlOverlay('学校已开启临时禁借', `<p>${esc(selectedTeacherClass)}</p><p>学校管理员已临时禁止该班借用，现在不能修改学生的借用状态。</p>`, button('知道了', 'controlPageDemo.dismiss()', false));
      } else {
        controlOverlay('借用时间已更新', `<p>${esc(selectedTeacherClass)}</p><p>学校管理员刚修改了本班借用时间，是否立即查看？</p>`, button('暂不查看', 'controlPageDemo.defer()') + button('立即查看', 'controlPageDemo.dismiss()', false));
      }
      const shade = document.querySelector?.('#control-overlay .control-shade');
      const closeAction = kind === 'temporary' ? 'controlPageDemo.dismiss()' : 'controlPageDemo.defer()';
      shade?.setAttribute('onclick',`if(event.target===this)${closeAction}`);
      shade?.querySelector('.control-sheet-head button')?.setAttribute('onclick',closeAction);
    },
    demoAcknowledge() {
      if (ui.demo === 'temporary-notice') { ui.demo = 'temporary-blocked'; this.render(); }
      else if (ui.demo === 'times-notice') { ui.demo = 'times-updated'; this.render(); this.showTimes(); }
    },
    demoDefer() {
      if (ui.demo !== 'times-notice') return;
      ui.demo = 'times-updated';
      this.render();
      closeControlOverlay();
    },
    demoRestore() {
      if (!ui.demo) return;
      const previous = ui.demoPrevious;
      ui.demo = null; ui.demoPrevious = null; ui.pending = null;
      controlDemoRole = previous.role; controlWorkView = previous.work; selectedTeacherClass = previous.selectedClass;
      controlModule = previous.module; controlView = previous.view;
      this.reset(); renderControl();
    },
    temporaryChoice(list) {
      if (controlDemoRole !== 'admin') return;
      list = list.filter(name => count([name]) > 0);
      if (!list.length) return controlToast('请选择设置对象');
      const data = latest();
      ui.temporaryDraft = operation({ type: 'temporary', names: [...list], value: null, school: false }, data);
      ui.temporaryDenied = list.filter(name => M.denied(data.schoolSettings.borrowing, name)).length;
      this.renderTemporaryChoice();
    },
    renderTemporaryChoice() {
      const draft = ui.temporaryDraft;
      if (!draft) return;
      const options = [true, false].map(value => `<label class="parity-borrow-option"><input type="radio" name="borrowing-temporary" ${draft.value === value ? 'checked' : ''} onchange="borrowing.chooseTemporary(${value})"><span class="parity-borrow-option-body"><span><b>${value ? '临时禁止借用' : '解除临时禁借'}</b><small>${value ? draft.names.length - ui.temporaryDenied : ui.temporaryDenied}个班${value ? '未禁借' : '已禁借'}</small></span><i>✓</i></span></label>`).join('');
      controlOverlay('设置临时禁借', `<p class="control-scope">${esc(scopeText(draft.names))} · ${count(draft.names)}名学生</p><fieldset class="parity-borrow-choice">${options}</fieldset><p class="parity-note">解除后按当前借用安排执行，班主任单独设置的禁借仍需班主任解除。</p>`, button('取消', 'borrowing.cancelTemporary()') + button('保存', 'borrowing.saveTemporary()', false));
    },
    chooseTemporary(value) { if (!ui.temporaryDraft) return; ui.temporaryDraft.value = value; this.renderTemporaryChoice(); },
    cancelTemporary() { ui.temporaryDraft = null; closeControlOverlay(); },
    saveTemporary() {
      const draft = ui.temporaryDraft;
      if (!draft) return;
      if (draft.value === null) return controlToast('请选择设置后的状态');
      ui.pending = R.copy(draft); ui.temporaryDraft = null; this.commit();
    },
    temporary(list, value, school = false) { if (controlDemoRole !== 'admin') return; const target = (list || names()).filter(name => count([name]) > 0); if (!target.length) return controlToast('请选择设置对象'); confirm(operation({ type: 'temporary', names: target, value, school }), value ? '确认临时禁止借用？' : school ? '确认结束全校临时禁借？' : '确认解除临时禁借？', `<p>${value ? '所选班级暂停新借出，班主任暂时不能修改借用状态。不影响已经借出的设备。' : '解除临时禁借后，按当前有效的借用规则执行，保留已有的学生禁借。'}</p>`); },
    student(ids, value) {
      if (ui.demo) return controlToast('当前为异常场景预览，请恢复正常后操作');
      if (controlWorkView !== 'homeroom' || !isHeadTeacherClass()) return;
      if (M.denied(state(), selectedTeacherClass)) return controlToast('学校正在临时禁止借用，暂时无法修改');
      const selected = ids || [...ui.selected]; if (!selected.length) return controlToast('请选择设置对象');
      confirm(operation({ type: 'student', names: [selectedTeacherClass], ids: selected, value }), value ? '确认禁止借用？' : '确认解除禁借？', `<p>${value ? '禁借立即生效，直到班主任手动解除。不影响已借出设备的使用和归还。' : '解除后按学校借用时间借用。'}</p>`);
    },
    studentChoice() {
      if (ui.demo) return controlToast('当前为异常场景预览，请恢复正常后操作');
      if (controlWorkView !== 'homeroom' || !isHeadTeacherClass()) return;
      if (M.denied(state(), selectedTeacherClass)) return controlToast('学校正在临时禁止借用，暂时无法修改');
      const selected = (controlData[selectedTeacherClass] || []).filter(student => ui.selected.has(student.id));
      if (!selected.length) return controlToast('请选择设置对象');
      ui.studentDraft = null;
      this.renderStudentChoice();
    },
    renderStudentChoice() {
      const selected = (controlData[selectedTeacherClass] || []).filter(student => ui.selected.has(student.id));
      const denied = selected.filter(student => state().studentBans[student.id]).length;
      const options = [true, false].map(value => `<label class="parity-borrow-option"><input type="radio" name="borrowing-student" ${ui.studentDraft === value ? 'checked' : ''} onchange="borrowing.chooseStudent(${value})"><span class="parity-borrow-option-body"><span><b>${value ? '禁止借用' : '解除禁借'}</b><small>${value ? selected.length - denied : denied} 人${value ? '未禁借' : '已禁借'}</small></span><i>✓</i></span></label>`).join('');
      controlOverlay('设置借用状态', `<p class="control-scope">已选 ${selected.length} 名学生 · ${denied} 人已禁借</p><fieldset class="parity-borrow-choice">${options}</fieldset>`, button('取消', 'borrowing.cancelStudentChoice()') + button('保存', 'borrowing.saveStudentChoice()', false));
    },
    chooseStudent(value) { ui.studentDraft = value; this.renderStudentChoice(); },
    cancelStudentChoice() { ui.studentDraft = null; closeControlOverlay(); },
    saveStudentChoice() {
      if (ui.studentDraft === null) return controlToast('请选择设置后的状态');
      const value = ui.studentDraft;
      ui.studentDraft = null;
      this.student(null, value);
    },
    edit(index, mode = ui.mode, targets = names()) {
      if (controlDemoRole !== 'admin') return;
      const group = index === undefined ? null : ui.groups[index], rule = group ? R.copy(group.rule) : { id: 'borrow-' + crypto.randomUUID(), mode, weekdays: [0,1,2,3,4], startDate: R.today(), endDate: R.today(), deny: false, periods: [{ start: '08:00', end: '17:30' }] };
      if (R.borrowStatus(rule) === '已失效') return;
      ui.editor = operation({ type: 'save', names: group?.names || targets, rule, original: group ? R.copy(group.rule) : null, editingIds: group?.ids || {} }); editorPage();
    },
    way() { collect(); editorPage(); },
    period(index) { collect(); if (index === undefined) ui.editor.rule.periods.push({ start: '', end: '' }); else ui.editor.rule.periods.splice(index, 1); editorPage(); },
    cancelEditor() { controlOverlay('放弃本次修改？', '<p>退出后不会保存。</p>', button('继续编辑', 'closeControlOverlay()') + button('放弃修改', 'borrowing.discard()', false)); },
    discard() { ui.editor = null; ui.pending = null; this.render(); },
    save() {
      collect(); const e = ui.editor, error = R.validateBorrow(e.rule, new Date(), e.original);
      if (error) { document.getElementById('borrow-error').textContent = error; return; }
      const s = state(), conflicts = e.names.flatMap(name => (s.classRules[name] || []).filter(r => r.id !== e.editingIds[name] && R.overlap(r, e.rule)).map(r => `${name}：${R.borrowText(r)}`));
      confirm(R.copy(e), conflicts.length ? '确认覆盖借用规则？' : '确认保存借用规则？', `<p>${esc(R.borrowText(e.rule))}</p>${conflicts.length ? '<p>以下规则的重叠日期将被替换，其余日期保留：</p><div class="borrowing-conflicts">' + conflicts.map(t => `<p>${esc(t)}</p>`).join('') + '</div>' : ''}<p>${e.rule.mode === 'weekly' ? '每周规则仅允许在所选星期和时段借用。' : '指定日期优先于每周规则。'}临时禁借和学生禁借不受影响。</p>`);
    },
    remove(index) {
      const group = ui.groups[index], s = state();
      const unrestricted = group.names.filter(name => !(s.classRules[name] || []).some(r => r.id !== group.ids[name]));
      const text = unrestricted.length ? `${scopeText(unrestricted)}删除后默认随时可借，已禁借的学生除外。${unrestricted.length !== group.names.length ? '其他班级按剩余规则执行。' : ''}` : '删除后按其他有效日期或每周规则执行；都未设置时默认可借。';
      confirm(operation({ type: 'delete', names: group.names, editingIds: group.ids }), '确认删除借用规则？', `<p>${esc(R.borrowText(group.rule))}</p><p>${esc(text)}</p>`);
    },
    commit() {
      if (ui.demo) return controlToast('当前为异常场景预览，请恢复正常后操作');
      if (!ui.pending) return;
      let data, next;
      try { data = latest(); next = M.commit(data.schoolSettings.borrowing, ui.pending, data, controlWorkView, [controlClasses[0]]); }
      catch (error) { ui.pending = null; ui.editor = null; controlData = latest(); this.render(); controlToast(error.message); return; }
      data.schoolSettings.borrowing = next;
      try { localStorage.setItem(key, JSON.stringify(data)); } catch { ui.pending = null; this.render(); controlToast('保存失败，请重试'); return; }
      controlData = data; ui.pending = null; ui.editor = null; ui.selected.clear(); ui.batch = false; this.render(); controlToast('已保存');
    },
  };
  const open = window.openControlModule, enter = window.enterAdminModule;
  window.openControlModule = module => { if (module === 'borrowing') borrowing.reset(); open(module); };
  window.enterAdminModule = module => { if (module === 'borrowing') borrowing.reset(); enter(module); };
  if (stage === 'teacherDesk' && teacherTab === 'control') renderControl();
})();
