/* Mobile borrowing workflow. Uses existing mobile shell; never exposes school student editing. */
(() => {
  const R = window.controlRules, M = window.borrowingModel, key = 'teacher-control-prototype-v1';
  const ui = { mode: 'weekly', scope: null, batch: false, selected: new Set(), editor: null, pending: null, classDraft: null, groups: [] };
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
    data.schoolSettings.borrowing.classBans ||= {};
    Object.values(data.schoolSettings.borrowing.classRules || {}).forEach(rules => rules.forEach(rule => {
      if (rule.mode === 'dates') { rule.deny = true; rule.periods = []; }
    }));
    data.schoolSettings.borrowing.studentBans ||= {};
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
  const ruleLines = rule => rule.mode === 'weekly'
    ? (rule.weekdays || []).map(day => '<span class="borrowing-day-line">' + esc(R.dayText([day]) + ' ' + R.periodText({deny:rule.deny,periods:R.borrowDayPeriods(rule,day)})) + '</span>').join('')
    : esc(R.borrowText(rule));
  function rulePanel(s, list) {
    const weekly = M.groups(s, list, 'weekly'), dates = M.groups(s, list, 'dates');
    ui.groups = [...weekly, ...dates];
    const section = (title, groups, offset) => `<section class="borrowing-rule-section"><h3>${title}</h3>${groups.map((group,i) => `<article class="parity-rule borrowing-rule-item"><div class="borrowing-rule-copy"><b>${ruleLines(group.rule)}</b>${group.rule.mode === 'dates' ? `<p>${R.borrowStatus(group.rule)}</p>` : ''}<p>适用范围：${esc(scopeText(group.names))}</p></div><div class="parity-rule-actions">${R.borrowStatus(group.rule) !== '已失效' ? ruleIcon('edit', `borrowing.edit(${offset+i})`) : ''}${ruleIcon('delete', `borrowing.remove(${offset+i})`)}</div></article>`).join('') || `<div class="control-empty">尚未设置${title}</div>`}</section>`;
    return `<p class="parity-note">指定日期内全天禁止借用；没有指定日期规则时，按每周规则执行。</p>${section('每周固定借用规则',weekly,0)}${!weekly.length ? button('设置每周固定规则', "borrowing.edit(undefined,'weekly')", false, !count(list)) : '<p class="parity-note">每个年级仅一条每周固定规则，请直接编辑已有规则，逐日设置时段。</p>'}${section('指定日期禁借规则',dates,weekly.length)}${button('新增指定日期规则',"borrowing.edit(undefined,'dates')",false,!count(list))}`;
  }
  function temporaryAction(s, list) {
    const denied = list.filter(name => M.denied(s, name)).length, mixed = denied > 0 && denied < list.length;
    return button(mixed || !list.length ? '设置临时禁借' : denied ? '解除临时禁借' : '临时禁借', mixed || !list.length ? `borrowing.temporaryChoice(${js(list)})` : `borrowing.temporary(${js(list)},${!denied})`, true, !count(list));
  }
  function scopeRows(s) {
    const rows = schoolGrades().map(label => ({ label, names: schoolControlClasses.filter(name => name.startsWith(label)) }));
    let previousStage = '';
    return rows.map(row => {
      const rowCount = count(row.names), selectable = ui.batch && rowCount > 0;
      const stage = stageOf(row.label);
      const heading = stage && stage !== previousStage ? `<div class="control-grade-group-title">${stage}</div>` : '';
      if (stage) previousStage = stage;
      const preview = M.preview(s,row.names), denied = row.names.filter(name => M.denied(s,name)).length;
      return `${heading}<article class="borrowing-scope-card"><div class="borrowing-card-head"><button class="borrowing-grade-link" onclick="borrowing.manage(${js(row.names)})">${esc(row.label)} <span aria-hidden="true">›</span></button>${denied ? `<span class="borrowing-denied-badge">${denied === row.names.length ? '已临时禁止借用' : '部分临时禁止借用'}</span>` : ''}</div><div class="borrowing-card-rules">${rowCount ? preview.rules.map(rule => `<p>${ruleLines(rule)}${rule.mode === 'dates' ? `<small>${R.borrowStatus(rule)}</small>` : ''}</p>`).join('') + preview.notes.map(note => `<p class="parity-note">${esc(note)}</p>`).join('') : '<p class="parity-note">暂无可管控班级</p>'}${rowCount && preview.more ? `<button class="borrowing-card-more" onclick="borrowing.manage(${js(row.names)})">还有 ${preview.more} 条，查看全部</button>` : ''}</div><div class="borrowing-card-actions">${button('设置规则', `borrowing.manage(${js(row.names)})`, true, !rowCount)}${temporaryAction(s,row.names)}</div></article>`;
    }).join('') || '<div class="control-empty">暂无班级</div>';
  }
  function adminPage() {
    const s = state(), list = names();
    ui.batch = false; ui.selected.clear();
    const body = ui.scope ? rulePanel(s,list) : `<div class="admin-scope-summary"><b>${adminLevel === 'school' ? '年级' : '班级'}借用规则</b>${adminLevel === 'school' ? button('设置全校借用规则', 'borrowing.manage(schoolControlClasses)', true, !count(schoolControlClasses)) : ''}</div><div class="borrowing-scope-cards">${scopeRows(s)}</div>`;
    const footer = '';
    shell(ui.scope ? '设置借用规则' : '柜机借用管控', `<p class="parity-context">${esc(scopeText(list))}</p>${!ui.scope ? thisScopeCard(s,list) : ''}${body}`,footer);
  }
  const borrowingDescription = () => '<details class="control-description-fold"><summary aria-label="柜机借用管控说明"><span>管控说明</span><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></summary><div class="control-description-body"><p class="parity-note">未设置借用时间时，班级可随时借用；设置后，按规定时间借用。学校临时禁借或班主任设置全班禁借时不可借用。</p><p class="parity-note">解除学校临时禁借后，按当前借用安排和班主任设置的本班借用状态执行。</p></div></details>';
  function thisScopeCard(s, list) {
    const school = adminLevel === 'school', blocked = list.filter(name => M.denied(s, name)).length;
    return card(esc(scopeText(list)) + '柜机借用管控', `<p class="parity-note">${school && s.schoolTemporaryActive ? '全校临时禁借中' + (blocked < list.length ? '，部分班级已解除' : '') : blocked === list.length ? '临时禁止借用' : blocked ? '部分班级临时禁借中' : '未开启临时禁借'}</p>${borrowingDescription()}<div class="control-actions">${school ? button(s.schoolTemporaryActive ? '结束全校临时禁借' : '一键临时禁借', `borrowing.temporary(${js(list)},${!s.schoolTemporaryActive},true)`, false, !count(list)) : temporaryAction(s, list)}</div>`);
  }
  const teacherBanStatus = (s, students) => { const flags=students.map(student=>s.studentBans?.[selectedTeacherClass]?.[student.id] ?? Boolean(s.classBans?.[selectedTeacherClass])); return flags.length && flags.every(Boolean) ? '全班禁止借用' : flags.some(Boolean) ? '部分学生禁止借用' : '本班未禁借'; };
  function teacherPage() {
    const s = state(), students = controlData[selectedTeacherClass] || [], blocked = M.denied(s, selectedTeacherClass), canManage = controlWorkView === 'homeroom' && isHeadTeacherClass();
    ui.batch = false; ui.selected.clear();
    const denied = blocked || Boolean(s.classBans?.[selectedTeacherClass]);
    const action = blocked ? '<p class="parity-note">学校已临时禁止该班借用，暂时不能修改。</p>' : canManage && students.length
      ? button(denied ? '解除禁止借用' : '全班禁止借用', `borrowing.toggleClass(${!denied})`, denied)
      : '<p class="parity-note">借用时间由学校设置，当前仅可查看。</p>';
    const individualRows = canManage ? students.map(student => {const ban=s.studentBans?.[selectedTeacherClass]?.[student.id] ?? Boolean(s.classBans?.[selectedTeacherClass]); return '<div class="parity-student-row"><b>'+esc(student.name)+'</b>'+button(ban?'解除禁止借用':'禁止借用', 'borrowing.toggleStudent('+student.id+','+!ban+')',true,blocked)+'</div>';}).join('') : '';
    shell('柜机借用管控', `<div class="parity-context">${esc(selectedTeacherClass)}</div><section class="control-module-panel teacher-class-control"><h3>${esc(selectedTeacherClass)}当前状态</h3><p class="parity-note">${blocked ? '学校临时禁止借用' : teacherBanStatus(s, students)}</p><button class="borrowing-times-link" onclick="borrowing.showTimes()">查看借用时间 <span aria-hidden="true">›</span></button><div class="control-actions">${action}</div></section>${individualRows}`, '', 'borrowing-teacher');
  }
  function operation(value, data = latest()) {
    const s = data.schoolSettings.borrowing;
    return { ...value, revision: s.revision, targets: M.targets(data, value.names) };
  }
  function confirm(op, title, description, showScope = true) {
    ui.pending = op;
    controlOverlay(title, `${showScope ? `<p>${esc(scopeText(op.names))}</p>` : ''}${description}`, button('取消', 'closeControlOverlay()') + button('确认', 'borrowing.commit()', false));
  }
  function editorPage() {
    const e = ui.editor, r = e.rule;
    if (r.mode === 'dates') { r.deny = true; r.periods = []; }
    const days = ['周一','周二','周三','周四','周五','周六','周日'];
    const activeDate = r.mode === 'dates' && e.original && R.borrowStatus(e.original) === '生效中';
    const gradeOptions = schoolGrades().filter(grade => count(schoolControlClasses.filter(name => name.startsWith(grade))) > 0 && (!ui.scope || ui.scope.some(name => name.startsWith(grade))));
    const typeField = e.original || e.fixedMode ? `<p>规则类型：${r.mode === 'weekly' ? '每周固定' : '指定日期'}</p>` : `<label>新增规则类型<select id="borrow-rule-type" onchange="borrowing.editorType(this.value)"><option value="">请选择规则类型</option><option value="weekly" ${r.mode === 'weekly' ? 'selected' : ''}>每周固定</option><option value="dates" ${r.mode === 'dates' ? 'selected' : ''}>指定日期</option></select></label>`;
    const gradeField = e.original || e.gradeLocked ? `<p>适用年级：${esc(e.grade)}</p>` : '<fieldset><legend>选择年级（可多选）</legend><div class="control-weekdays control-group-weekdays">' + gradeOptions.map(grade => `<label><input type="checkbox" data-borrow-grade value="${esc(grade)}" ${e.grades.includes(grade) ? 'checked' : ''} onchange="borrowing.editorGrade(this.value,this.checked)">${esc(grade)}</label>`).join('') + '</div></fieldset>';
    if(r.mode === 'weekly') r.settingGroups ||= R.settingGroups(r,'borrowing');
    const weeklyFields = r.mode !== 'weekly' ? '' : '<fieldset><legend>每周借用规则组</legend><p class="parity-note">一组勾选多个星期，共用借用时段；未选的星期不可借用。需拆分时先取消已有组的星期，再添加组。</p>' + r.settingGroups.map((group,index)=>{
      const choices=days.map((name,day)=>'<label><input type="checkbox" data-borrow-group-day value="' + day + '" ' + (group.weekdays.includes(day)?'checked ':'') + (r.settingGroups.some((other,i)=>i!==index && other.weekdays.includes(day))?'disabled ':'') + ' onchange="borrowing.weekdayChanged()">' + name + '</label>').join('');
      return '<section class="control-form-section" data-borrow-group="' + index + '"><div class="control-group-heading"><h3>第' + (index+1) + '组</h3>' + (r.settingGroups.length>1?'<button type="button" class="control-group-delete" aria-label="删除第'+(index+1)+'组" onclick="borrowing.removeWeeklyGroup('+index+')">'+"<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v7M14 10v7\"/></svg>"+'</button>':'') + '</div><div class="borrowing-weekdays control-group-weekdays">' + choices + '</div>' + '<div class="control-period-heading">可用时段 <small>未设置则全天可用</small></div>' + group.value.periods.map((period,i)=>'<div class="borrowing-period" data-group-period><input type="time" aria-label="第' + (index+1) + '组开始时间' + (i+1) + '" value="' + period.start + '"><span>至</span><input type="time" aria-label="第' + (index+1) + '组结束时间' + (i+1) + '" value="' + period.end + '">' + button('删除','borrowing.weeklyPeriod(' + index + ',' + i + ')') + '</div>').join('') + button('＋ 添加时段','borrowing.weeklyPeriod(' + index + ')') + '</section>';
    }).join('') + '<div class="control-add-group">' + button('＋ 添加规则组','borrowing.addWeeklyGroup()',true,r.settingGroups.flatMap(group=>group.weekdays).length>=7) + '</div>' + '</fieldset>';
    const dateFields = (activeDate ? `<p class="parity-note">规则正在生效，只能修改结束日期。</p><p>开始日期：${esc(r.startDate)}</p><label>结束日期<input id="borrow-end" type="date" min="${R.today()}" value="${r.endDate}"></label>` : `<label>开始日期<input id="borrow-start" type="date" min="${R.today()}" value="${r.startDate}" onchange="document.getElementById('borrow-end').min=this.value"></label><label>结束日期<input id="borrow-end" type="date" min="${r.startDate || R.today()}" value="${r.endDate}"></label>`) + '<p class="parity-note">所选日期内全天禁止借用（包含开始和结束日期），到期后恢复每周规则。</p>';
    shell(e.original ? '编辑借用规则' : '新增借用规则', `<p class="parity-context">${esc(e.grade || '请选择年级')}</p><section class="control-module-panel borrowing-form">${typeField}${gradeField}${r.mode === 'weekly' ? weeklyFields : r.mode === 'dates' ? dateFields : '<p class="parity-note">先选择规则类型和年级。</p>'}<p id="borrow-error" role="alert" class="parity-error"></p></section>`, `<footer class="borrowing-footer">${button('取消', 'borrowing.cancelEditor()')}${button('保存', 'borrowing.save()', false)}</footer>`);
  }
  function collect() {
    const r = ui.editor.rule;
    if (r.mode === 'weekly') {
      document.querySelectorAll('[data-borrow-group]').forEach(section=>{
        const group=r.settingGroups[section.dataset.borrowGroup];
        group.weekdays=[...section.querySelectorAll('[data-borrow-group-day]:checked')].map(input=>Number(input.value));
        group.value.periods=[...section.querySelectorAll('[data-group-period]')].map(row=>{const fields=row.querySelectorAll('input');return {start:fields[0].value,end:fields[1].value};});
      });
      Object.assign(r,R.expandSettingGroups(r,r.settingGroups || R.settingGroups(r,'borrowing'),'borrowing'));
    } else if (r.mode === 'dates') { const start = document.getElementById('borrow-start'); if (start) r.startDate = start.value; const end = document.getElementById('borrow-end'); if (end) r.endDate = end.value; r.deny = true; r.periods = []; }
    const host = document.getElementById('borrow-periods');
    if (host) r.periods = [...host.children].map(row => { const fields = row.querySelectorAll('input'); return { start: fields[0].value, end: fields[1].value }; });
  }
  window.borrowing = {
    teacherEntryCard() {
      const students = controlData[selectedTeacherClass] || [], s = state();
      const blocked = M.denied(s, selectedTeacherClass), denied = blocked || Boolean(s.classBans?.[selectedTeacherClass]);
      const canManage = controlWorkView === 'homeroom' && isHeadTeacherClass();
      const action = blocked ? '<p class="parity-note">学校已临时禁止该班借用，暂时不能修改。</p>'
        : canManage && students.length ? button(denied ? '解除禁止借用' : '全班禁止借用', `borrowing.toggleClass(${!denied})`, denied)
        : '<p class="parity-note">借用状态由班主任设置，当前仅可查看。</p>';
      return `<section class="control-entry-lock borrowing-entry-card"><div class="control-entry-lock-head"><div><h3>柜机借用管控</h3><p>${blocked ? '学校临时禁止借用' : teacherBanStatus(s, students)}</p></div></div><button type="button" class="borrowing-times-link" onclick="borrowing.showTimes()">查看借用时间 <span aria-hidden="true">›</span></button><div class="control-actions">${action}</div></section>`;
    },
    entryCard() {
      const s = state(), total = schoolControlClasses.length, blocked = schoolControlClasses.filter(n => M.denied(s, n)).length;
      return `<section class="control-entry-lock"><div class="control-entry-lock-head"><div><h3>柜机借用管控</h3><p>${blocked === total ? '全校临时禁借中' : blocked ? '部分班级临时禁借中' : '未开启临时禁借'}</p></div><button onclick="enterAdminModule('borrowing')">查看详情 ›</button></div>${borrowingDescription()}<div class="control-actions">${button(s.schoolTemporaryActive ? '结束全校临时禁借' : '一键临时禁借', `borrowing.temporary(${js(schoolControlClasses)},${!s.schoolTemporaryActive},true)`, s.schoolTemporaryActive, !count(schoolControlClasses))}</div></section>`;
    },
    busy() { return controlModule === 'borrowing' && Boolean(ui.editor || document.querySelector('#control-overlay .control-shade')); },
    render() {
      controlData = latest();
      if (['entry', 'home'].includes(controlView)) return renderControl();
      if (controlDemoRole === 'admin') adminLevel = 'school';
      if (ui.editor) return editorPage();
      if (controlDemoRole === 'admin') adminPage(); else teacherPage();
    },
    reset() { Object.assign(ui, { temporaryDraft: null, mode: 'weekly', scope: null, batch: false, selected: new Set(), editor: null, pending: null, query: '', filter: 'all' }); },
    back() { if (ui.editor) return this.cancelEditor(); if (ui.scope) { ui.scope = null; ui.batch = false; ui.selected.clear(); return this.render(); } this.reset(); controlView = 'entry'; renderControl(); },
    go(label) { return this.manage(schoolControlClasses.filter(name => name.startsWith(label))); },
    manage(list) {
      const eligible = list.filter(name => count([name]) > 0);
      if (!eligible.length) return controlToast('请选择设置对象');
      const all = schoolControlClasses.filter(name => count([name]) > 0), grades = [...new Set(eligible.map(name => name.match(/^[一二三四五六七八九]+年级/)?.[0] || name))];
      if (eligible.length !== all.length && (grades.length !== 1 || all.filter(name => name.startsWith(grades[0])).some(name => !eligible.includes(name)))) return controlToast('学校管理员只能按年级设置');
      ui.scope = eligible; ui.batch = false; ui.selected.clear(); this.render();
    },
    batchRule() { return; },
    batchCreate() { return; },
    batchTemporary() { return; },
    batch() { return; },
    refreshAdminSelection() { const total = selectableRows().length; document.querySelectorAll?.('.borrowing-selectable').forEach(card => { const checked = ui.selected.has(card.dataset.borrowKey); card.setAttribute('aria-checked',String(checked)); card.classList.toggle('is-selected',checked); card.querySelector('.borrowing-card-check').textContent = checked ? '✓' : ''; }); const all = document.getElementById?.('borrowing-select-all'); if (all) { all.checked = total > 0 && ui.selected.size === total; all.indeterminate = ui.selected.size > 0 && ui.selected.size < total; } const counter = document.getElementById?.('borrowing-selected-count'); if (counter) counter.textContent = `全选 · 已选${ui.selected.size}项`; },
    select(id, checked) { if (!ui.batch || controlDemoRole !== 'admin' || !selectableRows().includes(id)) return; checked ? ui.selected.add(id) : ui.selected.delete(id); this.refreshAdminSelection(); },
    selectAll(checked) { if (!ui.batch || controlDemoRole !== 'admin') return; selectableRows().forEach(id => checked ? ui.selected.add(id) : ui.selected.delete(id)); this.refreshAdminSelection(); },
    roster() { const selected = (controlData[selectedTeacherClass] || []).filter(s => ui.selected.has(s.id)); controlOverlay('所选学生', `<div class="borrowing-roster">${selected.map(s => `<span>${esc(s.name)}</span>`).join('')}</div>`, button('关闭', 'closeControlOverlay()')); },
    showTimes() {
      const rules = state().classRules[selectedTeacherClass] || [];
      const shown = ui.demo === 'times-updated' ? [...rules.filter(rule => rule.mode === 'weekly'), {id:'demo-school-time',mode:'dates',startDate:R.today(),endDate:R.today(),deny:true,periods:[]}] : rules;
      controlOverlay('学校借用时间', `<p>${esc(selectedTeacherClass)}</p>${ui.demo === 'times-updated' ? '<p class="parity-note">学校借用时间已更新。</p>' : ''}${[['weekly','每周借用时间'],['dates','指定日期借用时间']].map(([mode,title]) => `<h3>${title}</h3>${shown.filter(r => r.mode === mode).map(r => `<p>${esc(R.borrowText(r))}${mode === 'dates' ? ' · ' + R.borrowStatus(r) : ''}</p>`).join('') || '<p>未设置</p>'}`).join('')}<p class="parity-note">未设置借用时间时默认随时可借；学校临时禁借或班主任设置全班禁借时不可借用。</p>`, button('关闭', 'closeControlOverlay()'));
    },
    demoStart(kind) {
      ui.demoPrevious = {role:controlDemoRole,work:controlWorkView,selectedClass:selectedTeacherClass,module:controlModule,view:controlView};
      controlDemoRole = 'teacher'; controlWorkView = 'homeroom'; selectedTeacherClass = controlClasses[0];
      controlModule = 'borrowing'; controlView = 'module'; this.reset();
      ui.demo = kind === 'temporary' ? 'temporary-notice' : 'times-notice';
      this.render();
      if (kind === 'temporary') {
        controlOverlay('学校已开启临时禁借', `<p>${esc(selectedTeacherClass)}</p><p>学校管理员已临时禁止该班借用，现在不能修改本班借用状态。</p>`, button('知道了', 'controlPageDemo.dismiss()', false));
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
      controlOverlay('设置临时禁借', `<p class="control-scope">${esc(scopeText(draft.names))}</p><fieldset class="parity-borrow-choice">${options}</fieldset><p class="parity-note">解除后按当前借用安排和班主任设置的本班借用状态执行。</p>`, button('取消', 'borrowing.cancelTemporary()') + button('保存', 'borrowing.saveTemporary()', false));
    },
    chooseTemporary(value) { if (!ui.temporaryDraft) return; ui.temporaryDraft.value = value; this.renderTemporaryChoice(); },
    cancelTemporary() { ui.temporaryDraft = null; closeControlOverlay(); },
    saveTemporary() {
      const draft = ui.temporaryDraft;
      if (!draft) return;
      if (draft.value === null) return controlToast('请选择设置后的状态');
      ui.pending = R.copy(draft); ui.temporaryDraft = null; this.commit();
    },
    temporary(list, value, school = false) { if (controlDemoRole !== 'admin') return; const target = (list || names()).filter(name => count([name]) > 0); if (!target.length) return controlToast('请选择设置对象'); confirm(operation({ type: 'temporary', names: target, value, school }), value ? '确认临时禁止借用？' : school ? '确认结束全校临时禁借？' : '确认解除临时禁借？', `<p>${value ? '所选班级暂停新借出，班主任暂时不能修改借用状态。不影响已经借出的设备。' : '解除临时禁借后，按当前借用规则和班主任设置的本班借用状态执行。'}</p>`); },
    toggleStudent(id,value) { if(controlDemoRole==='admin' || controlWorkView!=='homeroom' || !isHeadTeacherClass()) return; const op=operation({type:'student',names:[selectedTeacherClass],id,value}); confirm(op,value?'确认禁止借用？':'确认解除禁止借用？','<p>'+esc((controlData[selectedTeacherClass] || []).find(student=>student.id===id)?.name || '')+'</p>'); },
    toggleClass(value) {
      if (ui.demo) return controlToast('当前为异常场景预览，请恢复正常后操作');
      if (controlWorkView !== 'homeroom' || !isHeadTeacherClass()) return;
      if (M.denied(state(), selectedTeacherClass)) return controlToast('学校正在临时禁止借用，暂时无法修改');
      if (!(controlData[selectedTeacherClass] || []).length || typeof value !== 'boolean') return;
      confirm(operation({ type: 'class', names: [selectedTeacherClass], value }), value ? '确认全班禁止借用？' : '确认解除禁止借用？', '<p>' + (value ? '全班禁借立即生效，直到班主任手动解除。不影响已借出设备的使用和归还。' : '解除后按学校借用时间借用。') + '</p>');
    },
    edit(index, mode = null, targets = names()) {
      if (controlDemoRole !== 'admin') return;
      const group = index === undefined ? null : ui.groups[index], rule = group ? R.copy(group.rule) : { id: 'borrow-' + crypto.randomUUID(), mode: mode || '', weekdays: [0,1,2,3,4], dailyPeriods: {}, startDate: R.today(), endDate: R.today(), deny: mode === 'dates', periods: [{ start: '08:00', end: '17:30' }] };
      if (R.borrowStatus(rule) === '已失效') return;
      const selected = group?.names || targets, gradeNames = [...new Set(selected.map(name => name.match(/^[一二三四五六七八九]+年级/)?.[0] || name))];
      ui.editor = operation({ type: 'save', fixedMode: Boolean(mode), gradeLocked: gradeNames.length === 1, names: gradeNames.length === 1 || group ? selected : [], grades: gradeNames.length === 1 || group ? gradeNames : [], grade: gradeNames.length === 1 || group ? gradeNames.join('、') : '', rule, original: group ? R.copy(group.rule) : null, editingIds: group?.ids || {} }); editorPage();
    },
    editorType(mode) { collect(); ui.editor.rule.mode = mode; ui.editor.rule.deny = mode === 'dates'; editorPage(); },
    editorGrade(grade, checked = true) { if (ui.editor.gradeLocked || ui.editor.original) return; collect(); const e=ui.editor; e.grades=e.grades.filter(value=>value!==grade); if(checked) e.grades.push(grade); e.grade=e.grades.join('、'); e.names=schoolControlClasses.filter(name=>e.grades.some(value=>name.startsWith(value)) && controlData[name]?.length); e.targets=M.targets(controlData,e.names); editorPage(); },
    weekdayChanged() { collect(); editorPage(); },
    addWeeklyGroup() { collect(); const groups=ui.editor.rule.settingGroups, days=[0,1,2,3,4,5,6].filter(day=>!groups.some(group=>group.weekdays.includes(day))); if(!days.length) return controlToast('请先从已有组取消需要分组的星期'); groups.push({weekdays:days,value:{periods:[{start:'08:00',end:'17:30'}]}}); editorPage(); },
    removeWeeklyGroup(index) { collect(); if(ui.editor.rule.settingGroups.length<=1)return controlToast('至少保留一组规则');ui.editor.rule.settingGroups.splice(index,1); Object.assign(ui.editor.rule,R.expandSettingGroups(ui.editor.rule,ui.editor.rule.settingGroups,'borrowing')); editorPage(); },
    weeklyPeriod(index, period) { collect(); const list=ui.editor.rule.settingGroups[index].value.periods; if(period===undefined) list.push({start:'',end:''}); else list.splice(period,1); editorPage(); },
    way() { collect(); editorPage(); },
    period(index) { collect(); if (index === undefined) ui.editor.rule.periods.push({ start: '', end: '' }); else ui.editor.rule.periods.splice(index, 1); editorPage(); },
    cancelEditor() { controlOverlay('放弃本次修改？', '<p>退出后不会保存。</p>', button('继续编辑', 'closeControlOverlay()') + button('放弃修改', 'borrowing.discard()', false)); },
    discard() { ui.editor = null; ui.pending = null; this.render(); },
    save() {
      collect(); const e = ui.editor, problem = !['weekly','dates'].includes(e.rule.mode) ? '请选择规则类型' : !e.grade || !e.names.length ? '请选择年级' : R.validateBorrow(e.rule, new Date(), e.original);
      const groupError=e.rule.mode === 'weekly' ? R.validateSettingGroups(e.rule.settingGroups || R.settingGroups(e.rule,'borrowing'),'borrowing') : '';
      if (problem || groupError) { document.getElementById('borrow-error').textContent = groupError || problem; return; }
      const s = state(), rules = e.names.flatMap(name => (s.classRules[name] || []).filter(rule => rule.id !== e.editingIds[name]));
      if (e.rule.mode === 'weekly' && rules.some(rule => rule.mode === 'weekly')) { document.getElementById('borrow-error').textContent = '该年级已有每周规则，请编辑现有规则'; return; }
      if (e.rule.mode === 'dates' && rules.some(rule => rule.mode === 'dates' && R.overlap(rule, e.rule))) { document.getElementById('borrow-error').textContent = '所选日期已有规则，请重新选择'; return; }
      confirm(R.copy(e), '确认保存借用规则？', '', false);
    },
    remove(index) {
      const group = ui.groups[index], s = state();
      const unrestricted = group.names.filter(name => !(s.classRules[name] || []).some(r => r.id !== group.ids[name]));
      const text = unrestricted.length ? `${scopeText(unrestricted)}删除后默认随时可借，临时禁借和全班禁借仍生效。${unrestricted.length !== group.names.length ? '其他班级按剩余规则执行。' : ''}` : '删除后按其他有效日期或每周规则执行；都未设置时默认可借。';
      confirm(operation({ type: 'delete', names: group.names, editingIds: group.ids }), '确认删除借用规则？', `<p>${esc(text.replace(scopeText(unrestricted), ''))}</p>`, false);
    },
    commit() {
      if (ui.demo) return controlToast('当前为异常场景预览，请恢复正常后操作');
      if (!ui.pending) return;
      let data, next;
      try { data = latest(); next = M.commit(data.schoolSettings.borrowing, ui.pending, data, controlWorkView, [controlClasses[0]]); }
      catch (error) {
        ui.pending = null;
        if (ui.editor && /所选日期已有规则|已有每周规则/.test(error.message)) { editorPage(); document.getElementById('borrow-error').textContent = error.message; return; }
        ui.editor = null; controlData = latest(); this.render(); controlToast(error.message); return;
      }
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
