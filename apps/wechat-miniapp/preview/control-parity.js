/* 小程序管控页面：复用教师端规则语义，保留手机子页面及直接开关交互。 */
(() => {
  const R = window.controlRules;
  const storageKey = 'teacher-control-prototype-v1';
  const ui = { editor: null, pending: null, scopeQuery: '', scopeFilter: 'all', borrowMode: 'weekly' };
  const legacyCloseOverlay = window.closeControlOverlay;
  window.closeControlOverlay = () => { ui.pending = null; legacyCloseOverlay(); };
  const stateLabels = () => controlModule === 'borrowing' ? ['已设置', '未设置'] : controlModule === 'duration' ? ['有单独规则', '默认规则'] : controlModule === 'homework' ? ['有开放权限', '均不允许'] : controlModule === 'world' ? ['有已开放学生', '全部已关闭'] : ['有已锁屏学生', '全部未锁屏'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => 'rule-' + crypto.randomUUID();
  const actor = () => ({ by: controlWorkView === 'school' ? '学校管理员' : '陈老师', phone: '13800138000', role: controlWorkView });
  const allRefs = () => schoolControlClasses.flatMap(className => controlData[className].map(s => ({ className, id: s.id })));
  const classRefs = () => controlStudents().map(s => ({ className: selectedTeacherClass, id: s.id }));
  const targetRefs = target => target === 'school' ? allRefs() : target === 'adminSelected' ? R.copy(adminBulkRefs) : classRefs().filter(ref => target === 'all' || target === 'selected' && controlSelected.has(ref.id) || target === ref.id);
  const scopeRefs = key => (adminLevel === 'school' ? schoolControlClasses.filter(name => name.startsWith(key)) : [key]).flatMap(className => controlData[className].map(s => ({ className, id: s.id })));
  const activeRefs = () => controlDemoRole === 'admin' ? adminLevel === 'school' ? allRefs() : adminLevel === 'grade' ? schoolControlClasses.filter(name => name.startsWith(adminSelectedGrade)).flatMap(className => controlData[className].map(s => ({ className, id: s.id }))) : classRefs() : classRefs();
  const scopeLabel = () => controlDemoRole !== 'admin' || adminLevel === 'class' ? selectedTeacherClass : adminLevel === 'grade' ? adminSelectedGrade : '全校';
  const needScope = (refs, module = controlModule) => controlDemoRole === 'admin' && refs.length > 1 && ['borrowing', 'duration', 'homework'].includes(module);
  function assertPermission(refs, module) {
    if (controlDemoRole === 'admin') return;
    const classes = controlWorkView === 'homeroom' ? [controlClasses[0]] : controlClasses;
    if (refs.some(ref => !classes.includes(ref.className)) || ['borrowing', 'duration'].includes(module) && controlWorkView !== 'homeroom') throw Error('当前身份没有该范围的管控权限');
  }
  const baseFor = (refs, module = controlModule) => Object.fromEntries(R.resolve(controlData, refs).map(({ ref, student }) => [ref.className + ':' + ref.id, R.signature(student, module)]));
  const card = (title, body) => `<section class="control-module-panel"><h3>${title}</h3>${body}</section>`;
  const button = (text, action, secondary = false, disabled = false) => `<button type="button" class="control-${secondary ? 'secondary' : 'primary'}" onclick="${action}" ${disabled ? 'disabled' : ''}>${text}</button>`;
  function ruleIconButton(kind, action, disabled = false) {
    const label = kind === 'edit' ? '编辑规则' : '删除规则';
    const path = kind === 'edit' ? '<path d="m15 4 5 5M4 20l5-1L21 7a2.1 2.1 0 0 0-5-5L4 14z"/>' : '<path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/>';
    return `<button type="button" class="parity-rule-icon ${kind === 'delete' ? 'parity-danger' : ''}" aria-label="${label}" title="${label}" onclick="${action}" ${disabled ? 'disabled' : ''}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg></button>`;
  }
  const pageTop = (title, back) => header(title, false).replace('<span></span><h2', `<button class="wx-back" aria-label="返回上一页" onclick="${back}"><i></i></button><h2`);
  function shell(title, content, back = 'parity.back()', footer = '', classes = '') {
    app.innerHTML = `<main class="screen control-screen ${classes}">${pageTop(title, back)}<section class="control-content">${content}</section>${footer}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    syncReview();
  }
  function loadLatest() {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return controlData;
    const latest = JSON.parse(stored);
    if (!schoolControlClasses.every(name => Array.isArray(latest[name]))) throw Error('当前数据已变化，请刷新后重试');
    return latest;
  }
  function persist(next) {
    localStorage.setItem(storageKey, JSON.stringify(next));
    controlData = next;
  }
  // 为历史演示数据补齐规则 ID 和分模块操作信息，不清空用户已做的设置。
  schoolControlClasses.forEach(className => controlData[className].forEach(student => {
    student.schedules = R.prune((student.schedules || []).map((rule, i) => R.normalize(rule, 'borrow-' + student.id + '-' + i)));
    student.durationRules = (student.durationRules || []).map((rule, i) => R.normalize(rule, 'duration-' + student.id + '-' + i));
    // 旧版初始化样例没有操作记录；与基础规则相同的种子不是学生单独规则。
    const untouchedSeed = student.by === '学校管理员' && student.at === '今天 08:30';
    if (untouchedSeed && !student.operatedAt?.duration) student.durationRules = [];
    student.updated ||= {};
    student.teacherModified ||= {};
    Object.keys(student.operatedAt || {}).forEach(module => {
      student.updated[module] ||= { by: student.by || '学校管理员', phone: '', at: student.at || '—', role: student.by === '学校管理员' ? 'school' : 'homeroom', version: 1 };
      if (student.teacherModified[module] === undefined) student.teacherModified[module] = student.updated[module].role !== 'school';
    });
  }));
  controlData.schoolSettings ||= { borrowingRules: R.copy(controlData[schoolControlClasses[0]][0]?.schedules || []) };
  try { persist(controlData); } catch { /* 后续保存会明确报告失败，保留当前会话数据。 */ }
  function summary(student, module = controlModule) {
    if (module === 'borrowing') return student.schedules.length ? R.prune(student.schedules).map(R.borrowText) : ['未设置借用规则，没有有效规则时不能借用'];
    if (module === 'duration') return R.durationGroups(student);
    if (module === 'homework') return [`答案${student.answer ? '允许' : '不允许'} · 详解${student.explanation ? '允许' : '不允许'}`];
    return [module === 'world' ? student.world ? '万象视界已开放' : '万象视界已关闭' : student.locked ? '平板已锁屏' : '平板未锁屏'];
  }
  function configurationKey(student, module = controlModule) {
    return JSON.stringify(module === 'duration' ? R.durationGroups(student) : module === 'borrowing' ? R.prune(student.schedules).map(rule => { const { id, ...value } = rule; return value; }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : summary(student, module));
  }
  function groups(refs) {
    const grouped = new Map();
    R.resolve(controlData, refs).forEach(({ ref, student }) => {
      const key = configurationKey(student);
      if (!grouped.has(key)) grouped.set(key, { refs: [], student });
      grouped.get(key).refs.push(ref);
    });
    return [...grouped.values()].sort((a, b) => b.refs.length - a.refs.length);
  }
  function modifiedInfo(student) {
    const update = student.updated?.[controlModule];
    return `<small class="parity-operation">最近操作：${update ? `${esc(update.by)}${update.phone ? ' · ' + esc(update.phone) : ''} · ${esc(update.at)}` : '—'}</small>`;
  }
  function defaultCard() {
    if (controlModule === 'borrowing') return card('借用规则说明', '<p>每周固定与指定日期规则可同时设置。指定日期内按指定日期规则执行；到期或删除后恢复每周规则，没有有效规则时不能借用。</p>');
    if (controlModule === 'duration') return card('学校默认使用时长规则', `<p>${R.durationText(R.defaultDuration)}</p><p>没有单独规则的日期执行默认规则；未添加可用时段时全天可用，仍受时长限制。</p>`);
    if (controlModule === 'homework') return card('学生权限', '<p>默认所有学生不能查看答案和详解。</p>');
    const students = R.resolve(controlData, activeRefs()).map(row => row.student), count = students.filter(s => controlModule === 'world' ? s.world : s.locked).length;
    return card(scopeLabel() + '当前状态', `<p>${count}人${controlModule === 'world' ? '已开放' : '已锁屏'} · ${students.length - count}人${controlModule === 'world' ? '已关闭' : '未锁屏'}</p>`);
  }
  function renderEntry() {
    const admin = controlDemoRole === 'admin', students = admin ? adminAllStudents() : controlStudents(), locked = students.filter(s => s.locked).length;
    const lockScope = admin ? '全校' : '全班', lockAction = admin ? "adminBatchAction('lock'," : "controlModule='lock';confirmControl('all',";
    const lockCard = `<section class="control-entry-lock"><div class="control-entry-lock-head"><div><h3>${admin ? '全校' : ''}平板锁屏</h3><p>${locked}人已锁屏 · ${students.length - locked}人未锁屏</p></div><button onclick="${admin ? "enterAdminModule('lock')" : "openControlModule('lock')"}">查看详情 ›</button></div><div class="control-actions">${button(lockScope + '解锁', lockAction + 'false)', true, !locked)}${button(lockScope + '锁屏', lockAction + 'true)', false, locked === students.length)}</div></section>`;
    const borrowCard = admin ? `<section class="admin-school-toggle" onclick="enterAdminModule('borrowing')"><div class="admin-school-toggle-top"><div><div class="admin-school-toggle-head"><h3>全校借用管控</h3><span class="admin-state ${schoolBorrowingEnabled ? '' : 'off'}">${schoolBorrowingEnabled ? '已开启' : '已关闭'}</span></div><p>${schoolBorrowingEnabled ? '学生仅可在有效规则时段内借用' : '全校学生均不能借用，已有规则保留'}</p></div><span class="admin-detail-link">查看详情 ›</span></div><div class="control-actions">${button((schoolBorrowingEnabled ? '关闭' : '开启') + '全校借用管控', 'event.stopPropagation();toggleSchoolBorrowing()', schoolBorrowingEnabled)}</div></section>` : '';
    const entries = [...(!admin && isHeadTeacherClass() ? [['borrowing', '借用管控', '设置允许借用的日期和时段']] : []), ...(admin || isHeadTeacherClass() ? [['duration', '使用时长管控', '设置使用时长、休息和每日可用时段']] : []), ['homework', '智阅作业', '设置答案和详解的查看权限'], ['world', '万象视界', '开放或关闭学生进入权限']];
    const list = entries.map(([module, title, description]) => `<button class="control-entry-card" onclick="${admin ? 'enterAdminModule' : 'openControlModule'}('${module}')"><span class="control-entry-icon ${module}">${controlCardIcon(module)}</span><span class="control-entry-copy"><h3>${title}</h3><p>${description}</p></span><span class="control-entry-action">›</span></button>`).join('');
    app.innerHTML = `<main class="screen control-screen">${header('管控', false)}${controlRoleSwitcher()}<section class="control-entry" id="teacher-tab-panel" role="tabpanel">${lockCard}${borrowCard}<div class="control-entry-subtitle">其他管控</div><div class="control-entry-list">${list}</div></section>${teacherTabBar()}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    syncReview();
  }
  function scopeRows() {
    const keys = adminVisibleScopeKeys();
    return keys.map(key => {
      const refs = scopeRefs(key), students = R.resolve(controlData, refs).map(row => row.student), mixed = groups(refs).length > 1;
      const active = students.some(s => controlModule === 'duration' ? s.durationRules.length : controlModule === 'borrowing' ? s.schedules.length : controlModule === 'homework' ? s.answer || s.explanation : controlModule === 'world' ? s.world : s.locked);
      if (!key.includes(ui.scopeQuery) || ui.scopeFilter === 'mixed' && !mixed || ui.scopeFilter === 'same' && mixed || ui.scopeFilter === 'active' && !active || ui.scopeFilter === 'inactive' && active) return '';
      const next = adminLevel === 'school' ? `enterAdminGrade('${key}')` : `enterAdminClass('${key}')`;
      const count = students.filter(s => controlModule === 'duration' ? s.durationRules.length : controlModule === 'borrowing' ? s.schedules.length : controlModule === 'homework' ? s.answer || s.explanation : controlModule === 'world' ? s.world : s.locked).length;
      const direct = controlModule === 'world' || controlModule === 'lock', on = students.every(s => controlModule === 'world' ? s.world : s.locked);
      return `<div class="admin-level-row">${adminBatchMode ? `<label><input class="admin-level-check" type="checkbox" aria-label="选择${key}" ${adminSelectedScopes.has(key) ? 'checked' : ''} onchange="parity.selectScope('${key}',this.checked)"></label>` : ''}<button class="admin-level-link" onclick="${adminBatchMode ? `parity.selectScope('${key}',!adminSelectedScopes.has('${key}'))` : next}"><span class="admin-level-copy"><b>${key}</b><small>${students.length}名学生 · ${count}人${direct ? controlModule === 'world' ? '已开放' : '已锁屏' : '已设置'}</small><small>${mixed ? '学生规则有差异' : '学生规则一致'}</small></span><i>›</i></button>${!adminBatchMode ? `<div class="parity-scope-actions">${mixed ? `<button onclick="parity.differences('${key}')">查看差异</button>` : ''}${direct ? binaryToggleButton(controlModule, on, `parity.scopeBoolean('${key}',${!on})`, (on ? '关闭' : '开启') + key + controlLabels[controlModule]) : `<button onclick="parity.editScope('${key}')">设置</button>`}</div>` : ''}</div>`;
    }).join('') || '<div class="control-empty">没有符合条件的年级或班级</div>';
  }
  function selectionFooter(admin = false) {
    const refs = admin ? adminSelectionRefs() : targetRefs('selected'), selected = admin ? adminSelectedScopes.size : controlSelected.size;
    let actions;
    if (controlModule === 'lock' || controlModule === 'world') {
      const states = R.resolve(controlData, refs).map(({ student }) => controlModule === 'lock' ? student.locked : student.world);
      actions = (states.some(Boolean) ? button(controlModule === 'lock' ? '解锁' : '关闭', 'parity.selectedBoolean(false)', true) : '')
        + (states.some(value => !value) ? button(controlModule === 'lock' ? '锁屏' : '开放', 'parity.selectedBoolean(true)') : '');
    } else actions = button(controlModule === 'duration' ? '恢复默认' : controlModule === 'homework' ? '恢复默认' : '删除规则', 'parity.selectedReset()', true, !selected) + button(controlModule === 'borrowing' ? '设置规则' : controlModule === 'duration' ? '设置时长' : '设置权限', 'parity.selectedEdit()', false, !selected);
    const visible = admin ? visibleScopeKeys() : filteredControlStudents().map(s => s.id), set = admin ? adminSelectedScopes : controlSelected;
    return `<footer class="admin-batchbar parity-batchbar"><label class="control-footer-select"><input type="checkbox" aria-label="全选" ${visible.length && visible.every(key => set.has(key)) ? 'checked' : ''} onchange="parity.selectAll(this.checked)"><span>全选</span><small>${selected}/${visible.length}</small></label><div class="admin-batch-actions">${button('取消', 'parity.cancelSelection()', true)}${actions}</div><small class="parity-affected">本次已选 ${refs.length} 名学生</small></footer>`;
  }
  function scopePage() {
    const footer = adminBatchMode ? selectionFooter(true) : '';
    shell(controlLabels[controlModule], `${defaultCard()}<div class="admin-scope-summary"><b>${adminBatchMode ? '选择' : '按'}${adminLevel === 'school' ? '年级' : '班级'}${adminBatchMode ? '' : '查看'}</b>${adminBatchMode ? '' : '<button onclick="parity.startSelection()">批量设置</button>'}</div><div class="control-list-tools"><label class="borrow-list-search"><input aria-label="搜索年级或班级" placeholder="搜索年级或班级" value="${esc(ui.scopeQuery)}" oninput="parity.scopeFilter(this.value,null)"></label><select class="borrow-status-filter" aria-label="筛选范围规则状态" onchange="parity.scopeFilter(null,this.value)">${[['all', '全部状态'], ['same', '规则一致'], ['mixed', '规则有差异'], ['active', stateLabels()[0]], ['inactive', stateLabels()[1]]].map(([value, label]) => `<option value="${value}" ${ui.scopeFilter === value ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div id="parity-scope-rows" class="admin-level-list">${scopeRows()}</div>`, 'parity.back()', footer);
  }
  function filteredControlStudents() {
    return controlStudents().filter(s => {
      if (!s.name.includes(controlQuery) && !String(s.id).padStart(6, '0').includes(controlQuery)) return false;
      const active = controlModule === 'duration' ? s.durationRules.length > 0 : controlModule === 'borrowing' ? R.prune(s.schedules).length > 0 : controlModule === 'homework' ? s.answer || s.explanation : controlModule === 'world' ? s.world : s.locked;
      return controlFilter === 'all' || (controlFilter === 'yes' ? active : !active);
    }).sort((a, b) => (b.operatedAt?.[controlModule] || 0) - (a.operatedAt?.[controlModule] || 0));
  }
  function studentRows() {
    return filteredControlStudents().map(s => {
      const selection = controlView === 'students', rules = controlModule === 'borrowing' || controlModule === 'duration';
      const main = `<b>${esc(s.name)}</b><small>编号 ${String(s.id).padStart(6, '0')}</small>${rules || selection ? `<span>${summary(s).map(esc).join('<br>')}</span>` : ''}${modifiedInfo(s)}`;
      if (selection) return `<button class="control-student-row ${controlSelected.has(s.id) ? 'selected' : ''}" onclick="parity.selectStudent(${s.id})"><span class="parity-student-main">${main}</span><span class="control-check">${controlSelected.has(s.id) ? '✓' : ''}</span></button>`;
      const direct = controlModule === 'lock' || controlModule === 'world', on = controlModule === 'lock' ? s.locked : s.world;
      const action = direct ? binaryToggleButton(controlModule, on, `confirmControl(${s.id},${!on})`, (on ? '关闭' : '开启') + s.name + controlLabels[controlModule]) : controlModule === 'homework' ? `<span class="homework-inline-permissions">${permissionMiniSwitch(s, 'answer', '答案')}${permissionMiniSwitch(s, 'explanation', '详解')}</span>` : '<span class="control-detail-arrow">›</span>';
      return `<div class="parity-student-row"><button class="parity-student-main" onclick="openControlStudentDetail(${s.id})">${main}${direct ? `<span>${esc(summary(s)[0])}</span>` : ''}</button>${action}</div>`;
    }).join('') || '<div class="control-empty">没有符合条件的学生</div>';
  }
  function studentPage() {
    const selection = controlView === 'students';
    const reset = ['duration', 'homework'].includes(controlModule) ? button('全部恢复默认规则', 'parity.resetCurrent()', true) : '';
    shell(selection ? '选择学生' : controlLabels[controlModule], `<div class="parity-context">${selectedTeacherClass}${selection ? ' · 可多选' : ''}</div>${selection ? '' : defaultCard()}${reset ? `<div class="control-actions">${reset}</div>` : ''}<div class="borrow-list-head"><b>${selection ? '选择学生' : controlModule === 'homework' ? '学生权限' : '学生规则'}</b>${selection ? '' : `<button onclick="openControlStudents('${controlModule}')">批量设置</button>`}</div><div class="control-list-tools"><label class="borrow-list-search"><input aria-label="搜索学生姓名或编号" placeholder="搜索学生姓名或编号" value="${esc(controlQuery)}" oninput="parity.studentFilter(this.value,null)"></label><select class="borrow-status-filter" aria-label="筛选学生规则状态" onchange="parity.studentFilter(null,this.value)">${[['all', '全部'], ['yes', stateLabels()[0]], ['no', stateLabels()[1]]].map(([id, label]) => `<option value="${id}" ${controlFilter === id ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="parity-student-list" id="parity-student-rows">${studentRows()}</div>`, 'parity.back()', selection ? selectionFooter() : '', selection ? 'control-student-screen' : '');
  }
  function ruleCards(student) {
    const rules = controlModule === 'borrowing' ? R.prune(student.schedules) : student.durationRules;
    return rules.map(rule => `<article class="parity-rule"><b>${esc(controlModule === 'borrowing' ? R.borrowText(rule) : R.dayText(rule.weekdays))}</b>${controlModule === 'duration' ? `<p>${esc(R.durationText(rule.useDefault ? R.defaultDuration : rule))}</p>` : ''}<div class="parity-rule-actions">${ruleIconButton('edit', `parity.editStudentRule(${student.id},'${rule.id}')`)}${ruleIconButton('delete', `parity.deleteStudentRule(${student.id},'${rule.id}')`)}</div></article>`).join('') || `<p class="parity-note">${controlModule === 'borrowing' ? '尚未设置借用规则，没有有效规则时不能借用。' : '没有单独规则，按学校默认使用时长规则执行。'}</p>`;
  }
  function detailPage() {
    const student = controlStudents().find(s => s.id === controlStudentDetailId);
    if (!student) { controlView = 'module'; return renderControl(); }
    let body = `<section class="control-student-detail-card"><div class="control-student-detail-name"><h3>${esc(student.name)}</h3><span>编号 ${String(student.id).padStart(6, '0')}</span></div><div class="control-student-detail-content">${summary(student).map(text => `<p>${esc(text)}</p>`).join('')}${modifiedInfo(student)}</div>`;
    if (controlModule === 'borrowing' || controlModule === 'duration') {
      if (controlModule === 'borrowing') { const effective = R.effectiveBorrow(student, R.today(), schoolBorrowingEnabled); body += `<p class="parity-note">今日生效：${esc(effective.reason || R.periodText(effective))}</p>`; }
      body += button('新增' + (controlModule === 'borrowing' ? '借用规则' : '使用时长规则'), `openControlEditor(${student.id})`, false, controlModule === 'borrowing' && !schoolBorrowingEnabled) + ruleCards(student);
      if (controlModule === 'duration') body += button('恢复默认规则', `parity.resetStudent(${student.id})`, true);
    } else if (controlModule === 'homework') body += `<span class="homework-inline-permissions">${permissionMiniSwitch(student, 'answer', '答案')}${permissionMiniSwitch(student, 'explanation', '详解')}</span>`;
    else { const value = controlModule === 'lock' ? !student.locked : !student.world; body += button(controlModule === 'lock' ? value ? '锁屏平板' : '解锁平板' : value ? '开放万象视界' : '关闭万象视界', `confirmControl(${student.id},${value})`); }
    shell(controlLabels[controlModule] + '详情', `<div class="parity-context">${selectedTeacherClass}</div>${body}</section>`, "controlView='module';renderControl()");
  }
  function schoolBorrowPage() {
    const rules = R.prune(controlData.schoolSettings?.borrowingRules || []);
    const sections = [['weekly', '每周固定借用规则', '每周按所选星期和时段重复执行。'], ['dates', '指定日期借用规则', '指定日期内优先按本规则执行；到期或删除后恢复每周固定规则。']].map(([mode, title, note]) => {
      const items = rules.filter(rule => rule.mode === mode);
      return `<section class="parity-borrow-section" aria-label="${title}"><div class="parity-borrow-heading"><h3>${title}</h3></div><p class="parity-note">${note}</p>${items.map(rule => `<article class="parity-rule"><b>${esc(R.borrowText(rule))}</b><div class="parity-rule-actions">${ruleIconButton('edit', "parity.schoolBorrowEdit('" + rule.id + "')", !schoolBorrowingEnabled)}${ruleIconButton('delete', "parity.schoolBorrowDelete('" + rule.id + "')", !schoolBorrowingEnabled)}</div></article>`).join('') || '<p class="parity-borrow-empty">尚未设置' + title + '</p>'}</section>`;
    }).join('');
    const content = `<p class="parity-note">统一设置全校设备从柜机借出的时间，没有有效规则时不能借用。${schoolBorrowingEnabled ? '' : '全校借用管控已关闭，已有规则保留；开启后可编辑。'}</p>${sections}`;
    shell('借用管控', content, 'leaveControlCenter()', `<div class="parity-borrow-floating">${button('＋ 新增规则', 'parity.newBorrowRule()', false, !schoolBorrowingEnabled)}</div>`, 'parity-school-borrow');
  }
  function renderControl() {
    if (typeof renderControlAvailability === 'function' && renderControlAvailability()) return;
    schoolControlClasses.forEach(className => controlData[className].forEach(s => s.schedules = R.prune(s.schedules)));
    if (controlView === 'entry' || controlView === 'home') return renderEntry();
    if (controlView === 'ruleEditor') return renderEditor();
    if (controlView === 'studentDetail') return detailPage();
    if (controlDemoRole === 'admin' && controlModule === 'borrowing') return schoolBorrowPage();
    if (controlDemoRole === 'admin' && adminLevel !== 'class' && controlView !== 'students') return scopePage();
    return studentPage();
  }
  function scopeFields(editor) {
    return needScope(editor.refs) ? `<fieldset class="parity-apply-scope"><legend>修改范围（必选）</legend><label><input type="radio" name="parity-apply-scope" value="all" ${editor.scope === 'all' ? 'checked' : ''}>修改当前范围全部学生<small>包括老师按班级或学生单独设置的规则。</small></label><label><input type="radio" name="parity-apply-scope" value="unmodified" ${editor.scope === 'unmodified' ? 'checked' : ''}>仅修改老师未单独设置的学生<small>保留老师已按班级或学生设置的规则。</small></label></fieldset>` : '';
  }
  function daysFields(value) { return `<div class="control-weekdays" id="parity-days">${['一', '二', '三', '四', '五', '六', '日'].map((label, day) => `<button type="button" data-day="${day}" aria-pressed="${value.includes(day)}" onclick="this.setAttribute('aria-pressed',this.getAttribute('aria-pressed')!=='true')">${label}</button>`).join('')}</div>`; }
  function periodFields(value) { return `<div id="parity-periods" class="control-period-list">${value.map((period, index) => periodRow(period, index)).join('')}</div><button class="control-add-period" onclick="parity.addPeriod()">＋ 添加时段</button>`; }
  function periodRow(period, index) { return `<div class="control-period-row" data-period-row><input type="time" aria-label="第${index + 1}个时段开始时间" value="${period.start}"><span>至</span><input type="time" aria-label="第${index + 1}个时段结束时间" value="${period.end}"><button type="button" class="control-period-remove" aria-label="删除第${index + 1}个时段" onclick="this.closest('[data-period-row]').remove()"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/></svg></button></div>`; }
  function collectEditor() {
    const editor = ui.editor, form = document.getElementById('parity-rule-form');
    if (!editor || !form) return;
    const days = [...form.querySelectorAll('#parity-days [aria-pressed=true]')].map(node => Number(node.dataset.day));
    editor.scope = form.querySelector('[name=parity-apply-scope]:checked')?.value || null;
    const periodRows = [...form.querySelectorAll('#parity-periods [data-period-row]')].map(row => { const inputs = row.querySelectorAll('input'); return { start: inputs[0].value, end: inputs[1].value }; });
    if (controlModule === 'borrowing') {
      editor.rule.weekdays = days;
      editor.rule.startDate = form.querySelector('#parity-date-start')?.value || editor.rule.startDate;
      editor.rule.endDate = form.querySelector('#parity-date-end')?.value || editor.rule.endDate;
      editor.rule.deny = form.querySelector('[name=parity-borrow-way]:checked')?.value === 'deny';
      if (form.querySelector('#parity-periods')) editor.rule.periods = periodRows;
    } else if (controlModule === 'duration') {
      editor.rule.weekdays = days;
      if (!editor.rule.useDefault) {
        ['continuousMinutes', 'restMinutes', 'dailyMinutes'].forEach(key => editor.rule[key] = Number(form.querySelector('#parity-' + key).value));
        editor.rule.periods = periodRows;
      }
    } else {
      editor.value.answer = form.querySelector('[name=parity-answer]:checked')?.value;
      editor.value.explanation = form.querySelector('[name=parity-explanation]:checked')?.value;
    }
  }
  function renderEditor() {
    const editor = ui.editor;
    if (!editor) { controlView = 'module'; return renderControl(); }
    const rule = editor.rule;
    let form = `<p class="control-scope">${esc(editor.label)} · 已选 ${editor.refs.length} 名学生</p><div id="parity-rule-form" class="borrow-editor-card">`;
    if (controlModule === 'borrowing') {
      if (!editor.editingId && !editor.schoolRule) form += `<div class="control-form-section"><b class="control-form-title">规则类型</b><div class="control-segment">${[['weekly', '每周固定'], ['dates', '指定日期']].map(([mode, label]) => `<button aria-pressed="${rule.mode === mode}" onclick="parity.editorMode('${mode}')">${label}</button>`).join('')}</div></div>`;
      form += `<p class="control-form-note">指定日期内优先执行指定日期规则，到期或删除后恢复每周规则。</p>`;
      form += rule.mode === 'weekly' ? `<div class="control-form-section"><b class="control-form-title">适用星期</b>${daysFields(rule.weekdays)}</div>` : `<div class="control-form-section"><b class="control-form-title">适用日期（包含起止日期）</b><div class="control-date-row"><input id="parity-date-start" aria-label="开始日期" type="date" value="${rule.startDate}"><span>至</span><input id="parity-date-end" aria-label="结束日期" type="date" value="${rule.endDate}"></div><fieldset class="parity-borrow-choice"><legend class="control-form-title">借用方式</legend>${[['periods', '按时段借用', '仅在下方设置的时段内可借用'], ['deny', '全天禁止借用', '所选日期全天不能借用平板']].map(([value, label, note]) => `<label class="parity-borrow-option"><input type="radio" name="parity-borrow-way" value="${value}" ${rule.deny === (value === 'deny') ? 'checked' : ''} onchange="parity.borrowWay()"><span class="parity-borrow-option-body"><span><b>${label}</b><small>${note}</small></span><i aria-hidden="true">✓</i></span></label>`).join('')}</fieldset></div>`;
      if (!(rule.mode === 'dates' && rule.deny)) form += `<div class="control-form-section"><b class="control-form-title">借用时段</b>${periodFields(rule.periods)}</div>`;
    } else if (controlModule === 'duration') {
      form += `<div class="control-form-section"><b class="control-form-title">适用星期</b>${daysFields(rule.weekdays)}</div><div class="parity-radio-row">${[[true, '默认规则'], [false, '自定义']].map(([value, label]) => `<label><input type="radio" name="parity-duration-type" ${rule.useDefault === value ? 'checked' : ''} onchange="parity.durationType(${value})">${label}</label>`).join('')}</div>`;
      if (rule.useDefault) form += `<p class="parity-note">${R.durationText(R.defaultDuration)}</p>`;
      else form += `<div class="control-form-section">${[['continuousMinutes', '连续使用时长'], ['restMinutes', '休息时间'], ['dailyMinutes', '每日累计时长']].map(([key, label]) => `<div class="control-number-row"><label for="parity-${key}">${label}</label><span><input id="parity-${key}" type="number" min="1" step="1" value="${rule[key]}">分钟</span></div>`).join('')}</div><div class="control-form-section"><b class="control-form-title">每日可用时段</b>${periodFields(rule.periods)}<p class="control-form-note">不添加可用时段时，所选星期全天可用，仍受时长限制。</p></div>`;
    } else form += [['answer', '查看答案'], ['explanation', '查看详解']].map(([key, label]) => `<fieldset class="parity-permission"><legend>${label}</legend>${[['true', '允许'], ['false', '不允许']].map(([value, text]) => `<label><input type="radio" name="parity-${key}" value="${value}" ${String(editor.value[key]) === value ? 'checked' : ''}>${text}</label>`).join('')}</fieldset>`).join('');
    form += `${scopeFields(editor)}<p id="parity-error" class="control-error" role="alert"></p></div>`;
    const title = controlModule === 'borrowing' && (editor.editingId || editor.schoolRule) ? (editor.editingId ? '编辑' : '新增') + (rule.mode === 'weekly' ? '每周固定借用规则' : '指定日期借用规则') : '设置' + controlLabels[controlModule];
    app.innerHTML = `<main class="screen control-screen borrow-editor-screen">${pageTop(title, 'parity.cancelEditor()')}<section class="borrow-editor-content">${form}</section><footer class="borrow-editor-actions parity-editor-actions">${button('取消', 'parity.cancelEditor()', true)}${button('保存并生效', 'parity.saveEditor()')}</footer><div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    syncReview();
  }
  function openEditor(refs, label, ruleId, schoolRule = false) {
    if (!refs.length) return;
    try { assertPermission(refs, controlModule); } catch (error) { return controlToast(error.message); }
    if (controlModule === 'borrowing' && !schoolBorrowingEnabled) return controlToast('全校借用管控已关闭，规则保留，开启后可编辑');
    controlData = loadLatest();
    const first = R.resolve(controlData, refs)[0].student, key = controlModule === 'borrowing' ? 'schedules' : 'durationRules';
    const existing = ruleId ? (schoolRule ? controlData.schoolSettings?.borrowingRules || [] : first[key]).find(rule => rule.id === ruleId) : null;
    const rule = existing ? R.copy(existing) : controlModule === 'borrowing' ? { id: uid(), mode: schoolRule ? ui.borrowMode : 'weekly', weekdays: [], startDate: '', endDate: '', deny: false, periods: [{ start: '', end: '' }] } : { ...R.copy(R.defaultDuration), id: uid(), weekdays: [], useDefault: false, fixed: false };
    if (controlModule === 'duration') rule.useDefault = Boolean(rule.useDefault);
    const selectedStudents = R.resolve(controlData, refs).map(row => row.student);
    const permissionValue = key => selectedStudents.every(s => s[key] === first[key]) ? first[key] : '';
    ui.editor = { schoolRule, refs: R.copy(refs), label, base: baseFor(refs), scope: needScope(refs) ? null : 'all', editingId: existing?.id, returnView: controlView, rule, value: { answer: permissionValue('answer'), explanation: permissionValue('explanation') } };
    controlView = 'ruleEditor'; renderControl();
  }
  function operationChange(operation) {
    return student => {
      if (operation.kind === 'save') {
        if (operation.module === 'borrowing') student.schedules = R.mergeBorrow(R.prune(student.schedules), operation.value, operation.editingId);
        else if (operation.module === 'duration') student.durationRules = R.mergeDuration(student.durationRules, operation.value, operation.editingId);
        else Object.assign(student, operation.value);
      } else if (operation.kind === 'delete') {
        const key = operation.module === 'borrowing' ? 'schedules' : 'durationRules';
        student[key] = student[key].filter(rule => operation.ruleId ? rule.id !== operation.ruleId : operation.mode ? rule.mode !== operation.mode : false);
      } else if (operation.kind === 'reset') {
        if (operation.module === 'duration') student.durationRules = [];
        else if (operation.module === 'homework') { student.answer = false; student.explanation = false; }
      } else student[operation.module === 'lock' ? 'locked' : 'world'] = operation.value;
    };
  }
  function request(operation) {
    try {
      assertPermission(operation.refs, operation.module);
      if (operation.module === 'borrowing' && !schoolBorrowingEnabled) throw Error('全校借用管控已关闭，当前不能修改借用规则');
      if (!operation.refs.length) return controlToast('请先选择操作对象');
      if (needScope(operation.refs, operation.module) && !operation.scope) {
        ui.pending = operation;
        controlOverlay('选择修改范围', `<p class="control-scope">${esc(operation.label)} · 已选 ${operation.refs.length} 名学生</p>${scopeFields(operation)}<p id="parity-error" class="control-error" role="alert"></p>`, button('取消', 'closeControlOverlay()', true) + button('继续', 'parity.confirmScope()'));
        return;
      }
      const latest = loadLatest(), rows = R.prepare(latest, operation.refs, operation.module, operation.base, operation.scope || 'all');
      if (!rows.length) { renderControl(); return controlToast('没有符合修改范围的学生，已有单独设置均已保留'); }
      if (operation.kind === 'delete') {
        const preview = R.deletionPreview(rows, operation.module, operation);
        if (!preview.refs.length) return controlToast('所选范围内没有这条规则，无需删除');
        const borrowing = operation.module === 'borrowing';
        const modes = new Set(preview.rules.map(rule => rule.mode));
        const outcome = !borrowing ? '删除后，对应星期恢复默认使用时长规则。' : modes.size === 1 && modes.has('dates') ? '删除后，对应日期恢复每周固定借用规则；没有每周固定规则时不能借用。' : '删除后，对应日期没有其他有效借用规则时不能借用。';
        const title = operation.schoolRule ? '确认删除全校借用规则？' : borrowing ? '确认删除借用规则？' : '确认删除使用时长规则？';
        const rules = [...new Set(preview.rules.map(rule => borrowing ? (rule.mode === 'dates' ? '指定日期：' : '每周固定：') + R.borrowText(rule) : R.dayText(rule.weekdays) + ' · ' + R.durationText(rule.useDefault ? R.defaultDuration : rule)))];
        ui.pending = operation;
        controlOverlay(title, `<p class="control-scope">${esc(operation.label)} · 所选 ${operation.refs.length} 名学生</p><p class="control-confirm-copy">将删除以下${rules.length === 1 ? '' : rules.length + '条'}规则：</p><div class="parity-rule">${rules.map(text => `<p>${esc(text)}</p>`).join('')}</div><p class="control-confirm-copy">${outcome}其他规则不受影响。</p><p class="parity-note">实际影响 ${preview.refs.length} 名学生；${operation.refs.length - preview.refs.length} 名学生未匹配该规则或保留单独设置，不作修改。</p>`, button('取消', 'closeControlOverlay()', true) + `<button type="button" class="control-primary parity-delete-confirm" onclick="parity.apply()">确认删除</button>`);
        return;
      }
      const before = [];
      rows.forEach(({ student }) => {
        if (operation.module === 'borrowing' && operation.kind === 'save') student.schedules.filter(rule => rule.id !== operation.editingId && R.overlap(rule, operation.value)).forEach(rule => before.push(R.borrowText(rule)));
      });
      // 确认内容只取本次操作，学校管理员与班主任共用，不汇总学生原有规则。
      let texts;
      if (operation.kind === 'reset') texts = operation.module === 'duration' ? [R.durationText(R.defaultDuration)] : ['答案不允许 · 详解不允许'];
      else if (operation.module === 'borrowing') texts = [R.borrowText(operation.value)];
      else if (operation.module === 'duration') texts = [R.dayText(operation.value.weekdays) + ' · ' + R.durationText(operation.value.useDefault ? R.defaultDuration : operation.value)];
      else if (operation.module === 'homework') texts = [`答案${operation.value.answer ? '允许' : '不允许'} · 详解${operation.value.explanation ? '允许' : '不允许'}`];
      else texts = [operation.module === 'lock' ? operation.value ? '平板已锁屏' : '平板未锁屏' : operation.value ? '万象视界已开放' : '万象视界已关闭'];
      const previewTitle = operation.kind === 'reset' ? '本次恢复的默认规则' : operation.kind === 'boolean' ? '本次设置的状态' : '本次设置的规则';
      const warning = operation.scope === 'unmodified' ? `保留老师已单独设置的学生，本次跳过 ${operation.refs.length - rows.length} 人。` : '本次范围内以保存后的规则为准。';
      const label = operation.kind === 'delete' ? '删除规则' : operation.kind === 'reset' ? '恢复默认规则' : operation.module === 'lock' ? operation.value ? '锁屏' : '解除锁屏' : operation.module === 'world' ? operation.value ? '开放万象视界' : '关闭万象视界' : '保存' + controlLabels[operation.module];
      ui.pending = operation;
      controlOverlay(`确认${label}？`, `<p class="control-scope">${esc(operation.label)} · 实际影响 ${rows.length} 名学生</p><p class="control-confirm-copy">${warning}</p>${before.length ? `<details class="parity-preview"><summary>将覆盖以下原规则（仅替换重叠日期）</summary>${[...new Set(before)].map(text => `<p>${esc(text)}</p>`).join('')}</details>` : ''}<details open class="parity-preview"><summary>${previewTitle}</summary>${texts.map(text => `<p>${esc(text)}</p>`).join('')}</details>${operation.module === 'duration' && operation.kind === 'save' && !R.periods(operation.value.useDefault ? R.defaultDuration : operation.value).length ? '<p class="control-form-note">未限制每日可用时间，仍受连续使用、休息和每日累计时长限制。</p>' : ''}`, button('取消', 'closeControlOverlay()', true) + button('确认生效', 'parity.apply()'));
    } catch (error) { conflict(error); }
  }
  function conflict(error) {
    ui.pending = null; ui.editor = null;
    try { controlData = loadLatest(); } catch { /* 保留会话数据供用户刷新。 */ }
    if (controlView === 'ruleEditor') controlView = 'module';
    renderControl(); controlToast(error.message || '保存失败，原配置已保留');
  }
  function apply() {
    const operation = ui.pending;
    if (!operation) return;
    try {
      assertPermission(operation.refs, operation.module);
      if (operation.module === 'borrowing' && localStorage.getItem('school-borrowing-enabled') === 'false') throw Error('全校借用管控已关闭，请刷新后重新操作');
      const latest = loadLatest();
      // 完整范围先做版本校验；删除只写入确实包含目标规则的学生。
      const rows = R.prepare(latest, operation.refs, operation.module, operation.base, operation.scope || 'all');
      const refs = operation.kind === 'delete' ? R.deletionPreview(rows, operation.module, operation).refs : rows.map(row => row.ref);
      const result = R.transaction(latest, refs, operation.module, null, 'all', operationChange(operation), actor());
      if (result.count) {
        if (operation.schoolRule) {
          const rules = result.data.schoolSettings?.borrowingRules || [];
          result.data.schoolSettings = { ...result.data.schoolSettings, borrowingRules: operation.kind === 'save' ? R.mergeBorrow(R.prune(rules), operation.value, operation.editingId) : rules.filter(rule => rule.id !== operation.ruleId) };
        }
        persist(result.data);
      }
      const returnView = ui.editor?.returnView;
      ui.pending = null; ui.editor = null;
      if (controlView === 'ruleEditor') controlView = returnView === 'studentDetail' ? 'studentDetail' : 'module';
      adminBatchMode = false; controlSelected.clear(); adminSelectedScopes.clear();
      renderControl(); controlToast(result.count ? `${operation.kind === 'delete' ? '删除成功' : '已生效'} · ${result.count}名学生` : '没有符合修改范围的学生，原规则保留');
    } catch (error) { conflict(error); }
  }
  function makeOperation(refs, label, kind, value, extra = {}) { return { refs, label, kind, value, module: controlModule, base: baseFor(refs), ...extra }; }
  function currentSelectedRefs() { return controlDemoRole === 'admin' && adminLevel !== 'class' ? adminSelectionRefs() : targetRefs('selected'); }
  function visibleScopeKeys() {
    const container = document.getElementById('parity-scope-rows');
    if (!container) return adminVisibleScopeKeys();
    return adminVisibleScopeKeys().filter(key => [...container.querySelectorAll('.admin-level-copy b')].some(node => node.textContent === key));
  }
  window.parity = {
    newBorrowRule() {
      if (!schoolBorrowingEnabled) return controlToast('开启全校借用管控后可新增规则');
      controlOverlay('新增借用规则', `<div class="parity-borrow-type-actions">${button('每周固定借用规则', "parity.chooseBorrowType('weekly')", true)}${button('指定日期借用规则', "parity.chooseBorrowType('dates')", true)}</div>`, button('取消', 'closeControlOverlay()', true));
    },
    chooseBorrowType(mode) { closeControlOverlay(); this.schoolBorrowEdit(null, mode); },
    schoolBorrowEdit(id, mode) { if (mode) ui.borrowMode = mode; openEditor(allRefs(), '全校', id, true); },
    schoolBorrowDelete(ruleId) { request(makeOperation(allRefs(), '全校', 'delete', null, { ruleId, schoolRule: true, scope: 'all' })); },
    back() { ui.scopeQuery = ''; ui.scopeFilter = 'all'; if (controlView === 'students') { controlView = 'module'; controlSelected.clear(); return renderControl(); } if (controlDemoRole === 'admin') return adminBack(); leaveControlCenter(); },
    startSelection() { adminBatchMode = true; adminSelectedScopes.clear(); renderControl(); },
    cancelSelection() { adminBatchMode = false; controlSelected.clear(); adminSelectedScopes.clear(); controlView = 'module'; renderControl(); },
    selectScope(key, value) { value ? adminSelectedScopes.add(key) : adminSelectedScopes.delete(key); renderControl(); },
    selectStudent(id) { controlSelected.has(id) ? controlSelected.delete(id) : controlSelected.add(id); renderControl(); },
    selectAll(value) { const admin = controlDemoRole === 'admin' && adminLevel !== 'class', set = admin ? adminSelectedScopes : controlSelected; (admin ? visibleScopeKeys() : filteredControlStudents().map(s => s.id)).forEach(key => value ? set.add(key) : set.delete(key)); renderControl(); },
    scopeFilter(query, filter) { if (query !== null) ui.scopeQuery = query; if (filter !== null) ui.scopeFilter = filter; adminSelectedScopes.clear(); document.getElementById('parity-scope-rows').innerHTML = scopeRows(); const footer = document.querySelector('.parity-batchbar'); if (footer) footer.outerHTML = selectionFooter(true); },
    studentFilter(query, filter) { if (query !== null) controlQuery = query; if (filter !== null) controlFilter = filter; controlSelected.clear(); this.renderRows(); },
    renderRows() { const rows = document.getElementById('parity-student-rows'); if (rows) rows.innerHTML = studentRows(); const footer = document.querySelector('.parity-batchbar'); if (footer) footer.outerHTML = selectionFooter(); },
    editScope(key) { openEditor(scopeRefs(key), key); },
    selectedEdit() { const refs = currentSelectedRefs(); const names = controlDemoRole === 'admin' && adminLevel !== 'class' ? [...adminSelectedScopes] : R.resolve(controlData, refs).map(row => row.student.name); openEditor(refs, names.join('、')); },
    scopeBoolean(key, value) { request(makeOperation(scopeRefs(key), key, 'boolean', value)); },
    selectedBoolean(value) { request(makeOperation(currentSelectedRefs(), '所选对象', 'boolean', value)); },
    selectedReset() {
      const refs = currentSelectedRefs(); if (!refs.length) return;
      if (controlModule === 'borrowing') { this.borrowDeleteChoice(refs, '所选对象'); return; }
      request(makeOperation(refs, '所选对象', 'reset', null));
    },
    resetCurrent() { request(makeOperation(activeRefs(), scopeLabel(), 'reset', null)); },
    resetStudent(id) { request(makeOperation(targetRefs(id), selectedTeacherClass, 'reset', null)); },
    borrowDeleteChoice(refs, label) { ui.pending = makeOperation(refs, label, 'delete', null); controlOverlay('删除哪类借用规则？', '<p class="control-confirm-copy">删除所选类型的借用规则，另一类型规则保留。没有有效规则时不能借用。</p>', button('取消', 'closeControlOverlay()', true) + button('每周固定', "parity.deleteMode('weekly')", true) + button('指定日期', "parity.deleteMode('dates')")); },
    deleteMode(mode) { const operation = { ...ui.pending, mode }; request(operation); },
    editStudentRule(id, ruleId) { openEditor(targetRefs(id), selectedTeacherClass + ' · ' + controlStudents().find(s => s.id === id).name, ruleId); },
    deleteStudentRule(id, ruleId) { request(makeOperation(targetRefs(id), selectedTeacherClass + ' · ' + controlStudents().find(s => s.id === id).name, 'delete', null, { ruleId })); },
    differences(key) { const refs = key ? scopeRefs(key) : activeRefs(); controlOverlay((key || scopeLabel()) + ' · 学生规则差异', groups(refs).map((group, index) => `<details class="parity-rule"><summary>生效规则 ${index + 1} · ${group.refs.length}名学生</summary>${summary(group.student).map(text => `<p>${esc(text)}</p>`).join('')}<details><summary>查看学生</summary>${group.refs.map(ref => { const s = controlData[ref.className].find(row => row.id === ref.id); return `<p>${esc(s.name)} · ${ref.className} · 编号 ${String(s.id).padStart(6, '0')}</p>`; }).join('')}</details></details>`).join(''), button('关闭', 'closeControlOverlay()', true)); },
    cancelEditor() { const view = ui.editor?.returnView; ui.editor = null; ui.pending = null; controlView = view || 'module'; renderControl(); },
    editorMode(mode) { if (!ui.editor || ui.editor.editingId || ui.editor.schoolRule) return; collectEditor(); ui.editor.rule.mode = mode; ui.editor.rule.deny = false; renderEditor(); },
    borrowWay() { collectEditor(); renderEditor(); },
    durationType(value) { collectEditor(); ui.editor.rule.useDefault = value; renderEditor(); },
    addPeriod() { const host = document.getElementById('parity-periods'); host.insertAdjacentHTML('beforeend', periodRow({ start: '', end: '' }, host.children.length)); },
    saveEditor() {
      collectEditor(); const editor = ui.editor, rule = editor.rule, error = document.getElementById('parity-error');
      if (needScope(editor.refs) && !editor.scope) { error.textContent = '请选择本次修改范围'; return; }
      if (controlModule === 'borrowing') {
        const problem = R.validateBorrow(rule); if (problem) { error.textContent = problem; return; }
      } else if (controlModule === 'duration') {
        if (!rule.weekdays.length) { error.textContent = '请至少选择一个星期'; return; }
        if (!rule.useDefault && (![rule.continuousMinutes, rule.restMinutes, rule.dailyMinutes].every(value => Number.isInteger(value) && value > 0) || rule.dailyMinutes < rule.continuousMinutes)) { error.textContent = '时长须为正整数，每日累计不能短于连续使用时长'; return; }
        const problem = R.validatePeriods(rule.periods, true); if (problem && !rule.useDefault) { error.textContent = problem; return; }
      } else if (!['true', 'false'].includes(String(editor.value.answer)) || !['true', 'false'].includes(String(editor.value.explanation))) { error.textContent = '请选择答案和详解权限'; return; }
      const value = controlModule === 'homework' ? { answer: String(editor.value.answer) === 'true', explanation: String(editor.value.explanation) === 'true' } : R.copy(rule);
      request(makeOperation(editor.refs, editor.label, 'save', value, { base: editor.base, scope: editor.scope, editingId: editor.editingId, schoolRule: editor.schoolRule }));
    },
    confirmScope() { const scope = document.querySelector('[name=parity-apply-scope]:checked')?.value; if (!scope) { document.getElementById('parity-error').textContent = '请选择本次修改范围'; return; } request({ ...ui.pending, scope }); },
    apply,
  };
  window.renderControl = renderControl;
  window.filteredControlStudents = filteredControlStudents;
  window.openControlEditor = target => openEditor(targetRefs(target), target === 'adminSelected' ? '所选对象' : selectedTeacherClass + (typeof target === 'number' ? ' · ' + (controlStudents().find(s => s.id === target)?.name || '') : ''));
  window.confirmControl = (target, value) => request(makeOperation(targetRefs(target), selectedTeacherClass, 'boolean', value));
  window.adminBatchAction = (module, value) => { controlModule = module; request(makeOperation(allRefs(), '全校', 'boolean', value)); };
  window.toggleHomeworkPermission = (id, key, value) => {
    const refs = targetRefs(id);
    try {
      assertPermission(refs, 'homework');
      const result = R.transaction(loadLatest(), refs, 'homework', null, 'all', student => student[key] = value, actor());
      persist(result.data); renderControl(); controlToast('权限已' + (value ? '开启' : '关闭'));
    } catch (error) { conflict(error); }
  };
  window.toggleSchoolBorrowing = () => controlOverlay(`确认${schoolBorrowingEnabled ? '关闭' : '开启'}全校借用管控？`, `<p class="control-confirm-copy">${schoolBorrowingEnabled ? '关闭后，所有学生均不能从柜机借用平板，已有规则保留。' : '开启后，仅允许在有效规则允许的时段借用，没有有效规则时不能借用。'}</p>`, button('取消', 'closeControlOverlay()', true) + button('确认生效', `applySchoolBorrowing(${!schoolBorrowingEnabled})`));
  let displayedDate = R.today();
  const refreshExpiredRules = () => {
    if (displayedDate === R.today()) return;
    displayedDate = R.today();
    try {
      const latest = loadLatest();
      schoolControlClasses.forEach(className => latest[className].forEach(student => student.schedules = R.prune(student.schedules)));
      if (latest.schoolSettings) latest.schoolSettings.borrowingRules = R.prune(latest.schoolSettings.borrowingRules || []);
      persist(latest);
      if (!ui.editor && !ui.pending) renderControl();
    } catch { /* 不在后台覆盖失败数据；用户再次保存时会得到错误提示。 */ }
  };
  window.addEventListener('focus', refreshExpiredRules);
  setInterval(refreshExpiredRules, 60000);
  window.addEventListener('storage', event => {
    if (event.key === storageKey) { try { controlData = loadLatest(); } catch { return; } }
    if (event.key === 'school-borrowing-enabled') schoolBorrowingEnabled = event.newValue !== 'false';
    if ((event.key === storageKey || event.key === 'school-borrowing-enabled') && !ui.editor && !ui.pending) renderControl();
  });
  if (stage === 'teacherDesk' && teacherTab === 'control') renderControl();
})();
