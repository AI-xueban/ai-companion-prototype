/* 内部作业与打卡只读原型。字段与口径参考小程序作业需求；以下均为演示数据。 */
function renderHomeworkManagementPage() {
  return '<div id="homework-management-root"></div>';
}

function initHomeworkManagementPage() {
  const host = document.getElementById('homework-management-root');
  if (!host) return;
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = '<link rel="stylesheet" href="assets/css/homework-management.css"><div id="hw-app"></div>';
  const app = root.getElementById('hw-app');
  const h = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const count = (part, total) => total ? `${part} / ${total}` : '—';
  const rate = (part, total) => total ? `${Math.round(part / total * 100)}%` : '—';
  const kindLabel = kind => kind === 'checkin' ? '连续打卡' : '作业';
  const typeLabel = type => ({ photo: '图片', video: '视频', audio: '录音', file: '文件', none: '家长确认' }[type] || type);
  const statusClass = status => /失败|撤回|未提交/.test(status) ? 'warn' : /待|部分|补交|处理中/.test(status) ? 'wait' : /已交齐|已批改|已提交|已结束|成功/.test(status) ? 'done' : 'info';
  const tag = status => `<span class="hw-tag ${statusClass(status)}">${h(status)}</span>`;

  const tasks = [
    {
      id: 'HW-20261027-014', kind: 'homework', title: '分数计算与表达', school: '第一实验小学', teacher: '陈老师', subject: '数学', status: '进行中',
      published: '10-27 08:30', deadline: '10-29 20:00', makeup: '11-05 20:00', target: 48, complete: 26, partial: 14, missing: 8,
      description: '完成练习题拍照，录制一道题的讲解视频，并确认线下订正。', attachmentCount: 2,
      classes: [{ name: '三年级2班', mode: '全班', target: 32 }, { name: '三年级3班', mode: '部分学生', target: 16 }],
      notice: { recipients: 57, sent: 55, pending: 1, failed: 1 },
      changes: ['10-27 08:30 · 教师发布任务，接收名单冻结', '10-28 09:10 · 教师更正文字说明，作业项及接收范围未变'],
      items: [
        { id: 'photo', name: '练习题拍照', instruction: '拍摄清晰完整的答题页', type: 'photo', required: true, grading: true, expectedPages: 2, submitted: 35, grade: { effective: 127, correct: 95, wrong: 32, review: 8, unreadable: 3, noAnswer: 2 }, questions: [
          { label: '第1题', effective: 33, correct: 28, wrong: 5, review: 1, unreadable: 1, noAnswer: 0 },
          { label: '第2题', effective: 32, correct: 21, wrong: 11, review: 2, unreadable: 0, noAnswer: 1 },
          { label: '第3题', effective: 31, correct: 22, wrong: 9, review: 3, unreadable: 1, noAnswer: 0 },
          { label: '第4题', effective: 31, correct: 24, wrong: 7, review: 2, unreadable: 1, noAnswer: 1 },
        ] },
        { id: 'video', name: '讲解视频', instruction: '讲解一道自己选择的题', type: 'video', required: true, grading: false, submitted: 29 },
        { id: 'confirm', name: '线下订正', instruction: '完成后请家长确认', type: 'none', required: true, grading: false, submitted: 34 },
      ],
      students: [
        { id: 's1', name: '林小禾', className: '三年级2班', status: '已交齐', latest: '10-28 19:14', items: {
          photo: { status: '已批改', version: 2, time: '10-28 19:14', timing: '按时', operator: '林女士', history: [{ version: 1, time: '10-27 20:02', timing: '按时', operator: '林女士', status: '已批改', grade: '4题：2对、2错；历史结果' }], grade: '4题：3对、1错；第3题由教师复核' },
          video: { status: '已提交', version: 2, time: '10-28 19:06', timing: '按时', operator: '林先生', history: [{ version: 1, time: '10-27 20:06', timing: '按时', operator: '林女士', status: '已提交', grade: '无需批改' }] },
          confirm: { status: '已提交', version: 1, time: '10-28 19:10', timing: '按时', operator: '家长确认' },
        } },
        { id: 's2', name: '周若宁', className: '三年级3班', status: '部分完成', latest: '10-28 18:55', items: {
          photo: { status: '待批改', version: 1, time: '10-28 18:52', timing: '按时', operator: '家长提交', grade: '当前版本尚无完整正式结果' },
          confirm: { status: '已提交', version: 1, time: '10-28 18:55', timing: '按时', operator: '家长确认' },
        } },
        { id: 's3', name: '唐可心', className: '三年级2班', status: '未提交', latest: '—', items: {} },
        { id: 's4', name: '苏子墨', className: '三年级3班', status: '已交齐', latest: '10-28 20:08', items: {
          photo: { status: '待批改', version: 1, time: '10-28 20:08', timing: '按时', operator: '家长提交', grade: '部分结果已返回，仍为待批改' },
          video: { status: '已提交', version: 1, time: '10-28 19:42', timing: '按时', operator: '家长提交' },
          confirm: { status: '已提交', version: 1, time: '10-28 19:40', timing: '按时', operator: '家长确认' },
        } },
      ],
    },
    {
      id: 'HW-20261024-006', kind: 'homework', title: '英语听写练习', school: '晨光小学', teacher: '刘老师', subject: '英语', status: '补交中',
      published: '10-24 08:00', deadline: '10-27 20:00', makeup: '11-03 20:00', target: 28, complete: 20, partial: 0, missing: 8,
      description: '完成听写后提交 PDF 或 Word 作答文件。', attachmentCount: 1,
      classes: [{ name: '五年级3班', mode: '全班', target: 28 }], notice: { recipients: 33, sent: 32, pending: 0, failed: 1 },
      changes: ['10-24 08:00 · 教师发布任务，接收名单冻结'],
      items: [{ id: 'file', name: '听写作答文件', instruction: '上传 PDF 或 Word 作答文件', type: 'file', required: true, grading: true, submitted: 20,
        grade: { effective: 34, correct: 24, wrong: 10, review: 3, unreadable: 2, noAnswer: 1 }, questions: [
          { label: '第1题', effective: 18, correct: 14, wrong: 4, review: 1, unreadable: 1, noAnswer: 0 },
          { label: '第2题', effective: 16, correct: 10, wrong: 6, review: 2, unreadable: 1, noAnswer: 1 },
        ] }],
      students: [
        { id: 's5', name: '许星河', className: '五年级3班', status: '已交齐', latest: '10-28 09:15', items: {
          file: { status: '待批改', version: 2, time: '10-28 09:15', timing: '补交', operator: '许女士', history: [{ version: 1, time: '10-26 19:40', timing: '按时', operator: '许先生', status: '已批改', grade: '2题：1对、1错；历史结果' }], grade: '文档转换中；旧版结果不参与当前统计' },
        } },
        { id: 's6', name: '沈亦然', className: '五年级3班', status: '未提交', latest: '—', items: {} },
      ],
    },
    {
      id: 'CI-20261026-003', kind: 'checkin', title: '每日阅读打卡', school: '育新学校', teacher: '王老师', subject: '语文', status: '进行中',
      published: '10-25 08:00', deadline: '10-28 21:00', makeup: '11-04 21:00', target: 36, complete: 15, partial: 8, missing: 13,
      description: '连续3天，每天记录阅读内容并由家长确认。', attachmentCount: 0,
      classes: [{ name: '四年级1班', mode: '全班', target: 36 }], notice: { recipients: 43, sent: 43, pending: 0, failed: 0 },
      changes: ['10-25 08:00 · 教师发布连续3期打卡，逐期生成记录'],
      items: [
        { id: 'record', name: '阅读记录', instruction: '拍摄当天阅读记录页', type: 'photo', required: true, grading: false, submitted: 22 },
        { id: 'confirm', name: '家长确认', instruction: '确认当天已完成阅读', type: 'none', required: true, grading: false, submitted: 16 },
      ],
      periods: [
        { id: 'p1', label: '第1期', date: '10-26', deadline: '10-26 21:00', makeup: '11-02 21:00', status: '补交中', target: 36, complete: 30, partial: 4, missing: 2, itemCounts: [34, 30], students: [
          { id: 's7', name: '吴清越', className: '四年级1班', status: '已交齐', latest: '10-28 08:10', items: {
            record: { status: '已提交', version: 2, time: '10-28 08:10', timing: '补交', operator: '吴女士', history: [{ version: 1, time: '10-26 19:00', timing: '按时', operator: '吴女士', status: '已提交', grade: '无需批改' }] },
            confirm: { status: '已提交', version: 1, time: '10-26 19:05', timing: '按时', operator: '吴女士' },
          } },
          { id: 's8', name: '顾予安', className: '四年级1班', status: '已交齐', latest: '10-26 20:15', items: {
            record: { status: '已提交', version: 1, time: '10-26 20:10', timing: '按时', operator: '顾先生' },
            confirm: { status: '已提交', version: 1, time: '10-26 20:15', timing: '按时', operator: '顾先生' },
          } },
          { id: 's9', name: '陆知远', className: '四年级1班', status: '未提交', latest: '—', items: {} },
        ] },
        { id: 'p2', label: '第2期', date: '10-27', deadline: '10-27 21:00', makeup: '11-03 21:00', status: '补交中', target: 36, complete: 24, partial: 6, missing: 6, itemCounts: [29, 25], students: [
          { id: 's7', name: '吴清越', className: '四年级1班', status: '已交齐', latest: '10-27 19:20', items: {
            record: { status: '已提交', version: 1, time: '10-27 19:14', timing: '按时', operator: '吴女士' },
            confirm: { status: '已提交', version: 1, time: '10-27 19:20', timing: '按时', operator: '吴女士' },
          } },
          { id: 's8', name: '顾予安', className: '四年级1班', status: '部分完成', latest: '10-27 20:08', items: {
            record: { status: '已提交', version: 1, time: '10-27 20:08', timing: '按时', operator: '顾先生' },
          } },
          { id: 's9', name: '陆知远', className: '四年级1班', status: '未提交', latest: '—', items: {} },
        ] },
        { id: 'p3', label: '第3期', date: '10-28', deadline: '10-28 21:00', makeup: '11-04 21:00', status: '进行中', target: 36, complete: 15, partial: 8, missing: 13, itemCounts: [22, 16] },
      ],
      students: [
        { id: 's7', name: '吴清越', className: '四年级1班', status: '已交齐', latest: '10-28 19:20', items: {
          record: { status: '已提交', version: 1, time: '10-28 19:14', timing: '按时', operator: '家长提交' },
          confirm: { status: '已提交', version: 1, time: '10-28 19:20', timing: '按时', operator: '家长确认' },
        } },
        { id: 's8', name: '顾予安', className: '四年级1班', status: '部分完成', latest: '10-28 20:08', items: {
          record: { status: '已提交', version: 1, time: '10-28 20:08', timing: '按时', operator: '家长提交' },
        } },
        { id: 's9', name: '陆知远', className: '四年级1班', status: '未提交', latest: '—', items: {} },
      ],
    },
    {
      id: 'HW-20261020-002', kind: 'homework', title: '科学观察日记', school: '第一实验小学', teacher: '赵老师', subject: '科学', status: '已撤回',
      published: '10-20 09:00', deadline: '10-26 20:00', makeup: '11-02 20:00', target: 31, complete: 0, partial: 0, missing: 31,
      description: '记录植物生长观察。教师已撤回任务，历史事实保留。', attachmentCount: 0,
      classes: [{ name: '四年级2班', mode: '全班', target: 31 }], notice: { recipients: 37, sent: 37, pending: 0, failed: 0 },
      changes: ['10-20 09:00 · 教师发布任务', '10-20 10:06 · 教师撤回任务；不再接受新提交'],
      items: [{ id: 'record', name: '观察记录', instruction: '拍摄观察日记', type: 'photo', required: true, grading: false, submitted: 0 }], students: [],
    },
  ];

  // 每期持有自己的学生记录；缺少某期数据时不回退到其他期次。
  tasks.filter(task => task.kind === 'checkin').forEach(task => { task.periods.at(-1).students = task.students; });
  const studentNo = student => `ST-${student.id.slice(1).padStart(6, '0')}`;
  const fullTime = time => time && time !== '—' ? `2026-${time}` : '—';
  const state = { view: 'list', kind: 'all', scenario: 'normal', school: 'all', className: 'all', subject: 'all', status: 'all', query: '', taskId: null, tab: 'overview', itemId: null, studentId: null, studentStatus: 'all', studentClass: 'all', studentQuery: '', periodId: null };
  const getTask = () => tasks.find(task => task.id === state.taskId);
  const getPeriod = task => task.periods?.find(period => period.id === state.periodId) || task.periods?.at(-1);
  const getContext = task => {
    const period = getPeriod(task);
    return period ? { ...task, ...period, id: task.id, period, items: task.items.map((item, i) => ({ ...item, submitted: period.itemCounts[i] })), students: period.students || [] } : task;
  };
  const resetStudentFilters = () => { state.studentStatus = 'all'; state.studentClass = 'all'; state.studentQuery = ''; state.studentId = null; };
  const readStudentFilters = () => {
    state.studentStatus = root.getElementById('hw-student-status').value;
    state.studentClass = root.getElementById('hw-student-class').value;
    state.studentQuery = root.getElementById('hw-student-query').value.trim();
    state.studentId = null;
  };
  const readFilters = () => {
    state.school = root.getElementById('hw-school').value;
    state.className = root.getElementById('hw-class').value;
    state.subject = root.getElementById('hw-subject').value;
    state.status = root.getElementById('hw-status').value;
    state.query = root.getElementById('hw-query').value.trim();
  };
  const visibleTasks = () => state.scenario === 'empty' || state.scenario === 'denied' ? [] : tasks.filter(task =>
    (state.kind === 'all' || task.kind === state.kind) && (state.school === 'all' || task.school === state.school) &&
    (state.className === 'all' || task.classes.some(row => row.name === state.className)) &&
    (state.subject === 'all' || task.subject === state.subject) && (state.status === 'all' || task.status === state.status) &&
    (!state.query || `${task.id} ${task.title} ${task.teacher}`.toLowerCase().includes(state.query.toLowerCase()))
  );

  function render() {
    app.innerHTML = `<div class="hw-wrap">${renderReviewControls()}${state.scenario === 'denied' ? renderDenied() : state.view === 'list' ? renderList() : renderDetail()}</div>`;
  }

  function renderReviewControls() {
    return `<details class="hw-review-controls" ${state.scenario !== 'normal' ? 'open' : ''}><summary>原型状态预览${state.scenario !== 'normal' ? ' · 当前为演示状态' : ''}</summary><div>${[['normal', '正常'], ['empty', '空列表'], ['lag', '数据延迟'], ['denied', '无权限']].map(([key, label]) => `<button type="button" data-action="scenario" data-value="${key}" class="${state.scenario === key ? 'active' : ''}">${label}</button>`).join('')}<em>仅供评审，非正式业务入口</em></div></details>`;
  }
  function renderDenied() {
    return `<div class="hw-empty"><strong>当前账号没有作业与打卡查询权限</strong><p>请按学校和岗位配置查询范围。直接访问任务 ID 时也应由服务端校验。</p></div>`;
  }
  function renderList() {
    const rows = visibleTasks();
    const homeworkCount = rows.filter(task => task.kind === 'homework').length;
    const checkinCount = rows.filter(task => task.kind === 'checkin').length;
    return `<div class="hw-heading"><div><h1>作业与打卡</h1><p>查看发布范围、作业项进度、学生提交和逐项批改结果</p></div><span class="hw-asof">演示数据 · 截至 2026-10-28 20:30</span></div>
      ${state.scenario === 'lag' ? '<div class="hw-banner warning">数据同步延迟：当前展示的是 20:30 的快照，请以服务端最新记录为准。</div>' : ''}
      <div class="hw-banner">本页只读，仅查看已发布任务。任务完成按必交项的有效提交计算；批改结果按作业项单独统计；连续打卡按期次查看。教师个人草稿不在此处展示。</div>
      <section class="hw-panel hw-search"><div class="hw-filter-grid">
        ${selectField('school', '学校', [['all', '全部授权学校'], ...Array.from(new Set(tasks.map(t => t.school))).map(v => [v, v])], state.school)}
        <label class="hw-field"><span>任务名称 / ID / 教师</span><input id="hw-query" value="${h(state.query)}" placeholder="输入名称、ID 或教师"></label>
        ${selectField('class', '班级', [['all', '全部班级'], ...Array.from(new Set(tasks.flatMap(t => t.classes.map(c => c.name)))).map(v => [v, v])], state.className)}
        ${selectField('subject', '学科', [['all', '全部学科'], ...Array.from(new Set(tasks.map(t => t.subject))).map(v => [v, v])], state.subject)}
        ${selectField('status', '任务状态', [['all', '全部状态'], ['进行中', '进行中'], ['补交中', '补交中'], ['已结束', '已结束'], ['已撤回', '已撤回']], state.status)}
      </div><div class="hw-filter-actions"><button type="button" class="hw-button primary" data-action="search">查询</button><button type="button" class="hw-button" data-action="reset">重置</button><span>当前筛选：${homeworkCount} 份作业 · ${checkinCount} 组连续打卡</span></div></section>
      <section class="hw-panel"><div class="hw-segments">${[['all', '全部'], ['homework', '作业'], ['checkin', '连续打卡']].map(([key, label]) => `<button type="button" data-action="kind" data-value="${key}" class="${state.kind === key ? 'active' : ''}">${label}</button>`).join('')}</div>
        ${rows.length ? `<div class="hw-table-scroll"><table class="hw-table hw-task-table"><thead><tr><th>任务 / 类型</th><th>学校</th><th>发布教师</th><th>发布时间</th><th>目标范围</th><th>整份完成</th><th>截止时间</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows.map(renderTaskRow).join('')}</tbody></table></div>` : '<div class="hw-empty"><strong>没有符合条件的任务</strong><p>可调整学校、任务类型或状态后重新查询。</p></div>'}
      </section>`;
  }
  function summaryCard(label, value, note, studentStatus) {
    const content = `<small>${h(label)}</small><strong>${h(value)}</strong><span>${h(note)}</span>${studentStatus !== undefined ? '<em>查看名单 ›</em>' : ''}`;
    return studentStatus === undefined ? `<div class="hw-panel hw-summary">${content}</div>` : `<button type="button" class="hw-panel hw-summary hw-summary-link" data-action="student-scope" data-value="${h(studentStatus)}" aria-label="查看${h(label)}学生名单，共${h(value)}人">${content}</button>`;
  }
  function selectField(id, label, options, value) { return `<label class="hw-field"><span>${h(label)}</span><select id="hw-${id}">${options.map(([key, text]) => `<option value="${h(key)}" ${key === value ? 'selected' : ''}>${h(text)}</option>`).join('')}</select></label>`; }
  function renderTaskRow(task) {
    const isCheckin = task.kind === 'checkin';
    return `<tr><td><strong>${h(task.title)}</strong><small>${h(task.id)} · ${kindLabel(task.kind)} · ${h(task.subject)}${isCheckin ? ` · ${task.periods.length} 期` : ` · ${task.items.length} 项`}</small></td>
      <td>${h(task.school)}</td><td>${h(task.teacher)}</td><td title="${h(fullTime(task.published))}">${h(task.published)}</td><td>${task.classes.length} 个班 · ${task.target} 人<small>${h(task.classes.map(c => c.name).join('、'))}${task.classes.some(c => c.mode === '部分学生') ? ' · 含指定学生' : ''}</small></td>
      <td><strong>${count(task.complete, task.target)}</strong><small>${isCheckin ? `当前第${task.periods.length}期 · 部分 ${task.partial} · 未交 ${task.missing}` : '部分 ' + task.partial + ' · 未交 ' + task.missing}</small></td>
      <td>正常 ${h(task.deadline)}<small>补交至 ${h(task.makeup)}</small></td><td>${tag(task.status)}</td><td><button type="button" class="hw-text-button" data-action="open" data-id="${h(task.id)}">查看详情 ›</button></td></tr>`;
  }

  function renderDetail() {
    const task = getTask();
    if (!task) { state.view = 'list'; return renderList(); }
    const tabs = [['overview', '任务概况'], ['items', '作业项进度'], ['students', '学生明细']];
    if (task.kind === 'checkin') tabs.splice(1, 0, ['periods', '打卡期次']);
    const summary = getContext(task);
    const period = summary.period;
    return `<div class="hw-detail-heading"><button type="button" class="hw-back" data-action="back">← 返回任务列表</button><div class="hw-heading"><div><div class="hw-title-row"><h1>${h(task.title)}</h1>${tag(task.status)}<span class="hw-type">${kindLabel(task.kind)}</span></div><p>${h(task.id)} · ${h(task.school)} · ${h(task.teacher)} · ${h(task.subject)}</p></div><span class="hw-asof">演示数据 · 截至 2026-10-28 20:30</span></div></div>
      ${state.scenario === 'lag' ? '<div class="hw-banner warning">数据同步延迟：详情仅为 20:30 快照，不能作为当前最新结果。</div>' : ''}
      <div class="hw-banner">只读查询 · ${period ? '切换期次后，概况、作业项和学生明细同步切换；各期独立统计。' : '整份完成与批改结果分别统计；不计算跨作业项总正确率。'}</div>
      ${period ? `<div class="hw-panel hw-period-context">${selectField('period', '查看期次', task.periods.map(p => [p.id, `${p.label} · ${p.date}${p.id === task.periods.at(-1).id ? '（最新期）' : ''}`]), period.id)}<div>${tag(period.status)}<span>正常截止 ${h(fullTime(period.deadline))}</span><span>补交至 ${h(fullTime(period.makeup))}</span></div></div>` : ''}
      <div class="hw-summary-grid">${summaryCard('目标学生', summary.target, period ? period.label + ' · 接收快照' : '发布时接收快照', 'all')}${summaryCard('已交齐', summary.complete, rate(summary.complete, summary.target) + ' · 全部必交项', '已交齐')}${summaryCard('部分完成', summary.partial, '至少一项有效提交', '部分完成')}${summaryCard('未提交', summary.missing, '尚无必交项有效提交', '未提交')}</div>
      <section class="hw-panel"><div class="hw-tabbar">${tabs.map(([key, text]) => `<button type="button" data-action="tab" data-value="${key}" class="${state.tab === key ? 'active' : ''}">${text}</button>`).join('')}</div><div class="hw-tab-content">${state.tab === 'overview' ? renderOverview(summary) : state.tab === 'items' ? renderItems(summary) : state.tab === 'students' ? renderStudents(summary) : renderPeriods(task)}</div></section>`;
  }

  function renderOverview(task) {
    return `<div class="hw-two-col"><div><h2>任务信息</h2><dl class="hw-facts"><div><dt>发布时间</dt><dd>${h(task.published)}</dd></div><div><dt>正常截止</dt><dd>${h(task.deadline)}</dd></div><div><dt>补交截止</dt><dd>${h(task.makeup)}</dd></div><div><dt>完成项目</dt><dd>${task.items.length} 项 · 均为必交</dd></div><div><dt>教师附件</dt><dd>${task.attachmentCount ? task.attachmentCount + ' 份（仅显示数量）' : '无'}</dd></div><div><dt>任务说明</dt><dd>${h(task.description)}</dd></div></dl></div>
      <div><h2>接收范围 · 发布时冻结</h2><table class="hw-table compact"><thead><tr><th>班级</th><th>布置方式</th><th>目标学生</th></tr></thead><tbody>${task.classes.map(c => `<tr><td>${h(c.name)}</td><td>${h(c.mode)}</td><td>${c.target} 人</td></tr>`).join('')}</tbody></table><p class="hw-note">跨班人数按学生 ID 去重；后续转班不改写发布时快照。</p></div></div>
      <div class="hw-two-col hw-subsection"><div><h2>作业项摘要</h2>${task.items.map(item => `<div class="hw-item-line"><div><strong>${h(item.name)}</strong><small>${typeLabel(item.type)} · ${item.grading ? '自动批改' : '无需批改'} · 必交</small></div><span>${count(item.submitted, task.target)} 已提交</span></div>`).join('')}</div>
      <div><h2>${task.period ? '系列发布通知与变更记录' : '通知与变更记录'}</h2><p class="hw-note">有效家长账号 ${task.notice.recipients} 个；已送达 ${task.notice.sent}、处理中 ${task.notice.pending}、未送达 ${task.notice.failed}。通知人数与学生人数不同。</p><ul class="hw-event-list">${task.changes.map(text => `<li>${h(text)}</li>`).join('')}</ul></div></div>`;
  }
  function renderItems(task) {
    const item = task.items.find(row => row.id === state.itemId) || task.items[0];
    return `<h2>${task.period ? h(task.period.label) + ' · ' : ''}逐项提交情况</h2><p class="hw-note">提交人数按该项当前有效版本统计；完成整份任务只看必交项，批改是否完成不改变已提交人数。</p>
      <div class="hw-table-scroll"><table class="hw-table"><thead><tr><th>作业项</th><th>提交方式</th><th>批改方式</th><th>已提交</th><th>未提交</th><th></th></tr></thead><tbody>${task.items.map(row => `<tr class="${row.id === item.id ? 'selected' : ''}"><td><strong>${h(row.name)}</strong><small>${h(row.instruction)}</small></td><td>${typeLabel(row.type)}</td><td>${row.grading ? '自动批改' : '无需批改'}</td><td>${count(row.submitted, task.target)}</td><td>${task.target - row.submitted}</td><td><button type="button" class="hw-text-button" data-action="item" data-id="${h(row.id)}">查看项统计</button></td></tr>`).join('')}</tbody></table></div>
      <div class="hw-item-detail" tabindex="-1"><div class="hw-section-head"><h2>${h(item.name)} · 项目统计</h2><span>提交方式：${typeLabel(item.type)}${item.expectedPages ? ` · 预计 ${item.expectedPages} 页` : ''}</span></div>
        ${item.grading ? renderItemGrades(item) : '<div class="hw-empty slim"><strong>本项无需批改</strong><p>仅统计有效提交人数，不显示题目、对错或正确率。</p></div>'}</div>`;
  }
  function renderItemGrades(item) {
    const grade = item.grade;
    return `<div class="hw-grade-grid">${summaryCard('有效判定题次', grade.effective, '当前提交版本')}${summaryCard('答对 / 答错', `${grade.correct} / ${grade.wrong}`, '仅本作业项')}${summaryCard('本项正确率', rate(grade.correct, grade.effective), '正确题次 ÷ 有效判定题次')}${summaryCard('待复核 / 识别不清 / 无答案', `${grade.review} / ${grade.unreadable} / ${grade.noAnswer}`, '不进入正确率分母')}</div>
      <h3>逐题结果</h3><div class="hw-table-scroll"><table class="hw-table compact"><thead><tr><th>题目</th><th>有效判定</th><th>答对</th><th>答错</th><th>正确率</th><th>待复核</th><th>识别不清</th><th>无答案</th></tr></thead><tbody>${item.questions.map(q => `<tr><td>${h(q.label)}</td><td>${q.effective}</td><td>${q.correct}</td><td>${q.wrong}</td><td>${rate(q.correct, q.effective)}</td><td>${q.review}</td><td>${q.unreadable}</td><td>${q.noAnswer}</td></tr>`).join('')}</tbody></table></div><p class="hw-note">本页不展示学生原始作答、批改图片或跨作业项总正确率。</p>`;
  }
  function renderStudents(task) {
    const query = state.studentQuery.toLowerCase();
    const rows = task.students.filter(student => (state.studentStatus === 'all' || student.status === state.studentStatus) &&
      (state.studentClass === 'all' || student.className === state.studentClass) &&
      (!query || `${student.name} ${studentNo(student)}`.toLowerCase().includes(query)));
    const student = rows.find(row => row.id === state.studentId) || rows[0];
    return `<div class="hw-section-head"><div><h2>${task.period ? h(task.period.label) + ' · ' : ''}目标学生明细</h2><p class="hw-note">目标 ${task.target} 人；本原型提供 ${task.students.length} 条学生样例，当前筛选显示 ${rows.length} 条。汇总人数按完整目标范围统计。</p></div></div>
      <div class="hw-student-filters">${selectField('student-class', '班级', [['all', '全部目标班级'], ...task.classes.map(c => [c.name, c.name])], state.studentClass)}
        <label class="hw-field"><span>学生姓名 / 编号</span><input id="hw-student-query" value="${h(state.studentQuery)}" placeholder="输入姓名或 ST-000001"></label>
        ${selectField('student-status', '完成状态', [['all', '全部状态'], ['已交齐', '已交齐'], ['部分完成', '部分完成'], ['未提交', '未提交']], state.studentStatus)}
        <div class="hw-inline-actions"><button type="button" class="hw-button primary" data-action="student-search">查询</button><button type="button" class="hw-button" data-action="student-reset">重置</button></div></div>
      ${rows.length ? `<div class="hw-table-scroll"><table class="hw-table"><thead><tr><th>学生</th><th>班级</th><th>整份完成</th>${task.items.map(item => `<th>${h(item.name)}</th>`).join('')}<th>最近提交</th><th></th></tr></thead><tbody>${rows.map(row => `<tr class="${student?.id === row.id ? 'selected' : ''}"><td>${h(row.name)}<small>${h(studentNo(row))}</small></td><td>${h(row.className)}</td><td>${tag(row.status)}</td>${task.items.map(item => `<td>${row.items[item.id] ? tag(row.items[item.id].status) : tag('未提交')}</td>`).join('')}<td>${h(row.latest)}</td><td><button type="button" class="hw-text-button" data-action="student" data-id="${h(row.id)}">查看记录</button></td></tr>`).join('')}</tbody></table></div>${student ? renderStudentDetail(task, student) : ''}` : '<div class="hw-empty slim"><strong>当前条件下没有学生样例</strong><p>可调整班级、姓名或完成状态；也可重置为本任务全部样例。</p><button type="button" class="hw-text-button" data-action="student-reset">重置学生筛选</button></div>'}`;
  }
  function renderStudentDetail(task, student) {
    const historyItems = task.items.filter(item => student.items[item.id]?.history?.length);
    return `<div class="hw-student-detail" tabindex="-1"><div class="hw-section-head"><h2>${h(student.name)} · ${task.period ? h(task.period.label) + ' · ' : ''}逐项记录</h2><span>${tag(student.status)} · ${h(student.className)} · ${h(studentNo(student))}</span></div><div class="hw-table-scroll"><table class="hw-table compact"><thead><tr><th>作业项</th><th>提交状态</th><th>当前有效版本</th><th>提交时间</th><th>时效</th><th>批改/确认</th></tr></thead><tbody>${task.items.map(item => { const sub = student.items[item.id]; return `<tr><td>${h(item.name)}<small>${typeLabel(item.type)} · ${item.grading ? '自动批改' : '无需批改'}</small></td><td>${tag(sub?.status || '未提交')}</td><td>${sub ? '第' + sub.version + '版 · 当前有效' : '—'}</td><td>${h(fullTime(sub?.time))}</td><td>${h(sub?.timing || '—')}</td><td>${h(sub?.grade || (sub ? item.grading ? '结果尚未返回' : '无需批改' : '—'))}</td></tr>`; }).join('')}</tbody></table></div>
      ${historyItems.length ? `<div class="hw-history"><h3>按作业项查看提交记录</h3><p class="hw-note">历史版本仅供追溯；展开记录不会替换当前有效版本或改变统计。</p>${historyItems.map(item => renderSubmissionHistory(item, student.items[item.id])).join('')}</div>` : ''}</div>`;
  }
  function renderSubmissionHistory(item, submission) {
    const versions = [{ ...submission, current: true }, ...submission.history.map(version => ({ ...version, current: false }))];
    return `<details class="hw-version-group"><summary><strong>${h(item.name)}</strong><span>提交记录 · ${versions.length}次 · 当前第${submission.version}版</span></summary><div class="hw-table-scroll"><table class="hw-table compact"><thead><tr><th>版本</th><th>归属</th><th>提交时间</th><th>提交人</th><th>时效</th><th>批改/提交状态</th><th>该版本结果</th></tr></thead><tbody>${versions.map(version => `<tr class="${version.current ? 'selected' : ''}"><td>第${version.version}版</td><td>${version.current ? tag('当前有效') : '历史版本'}</td><td>${h(fullTime(version.time))}</td><td>${h(version.operator && !/^家长/.test(version.operator) ? version.operator : '家长（姓名未记录）')}</td><td>${h(version.timing)}</td><td>${tag(version.status)}</td><td>${h(version.grade || (item.grading ? '结果尚未返回' : '无需批改'))}</td></tr>`).join('')}</tbody></table></div></details>`;
  }
  function renderPeriods(task) {
    const period = getPeriod(task);
    return `<h2>连续打卡期次</h2><p class="hw-note">每期有独立截止、补交时间、接收关系和完成情况；下表不把多期人数相加成一份任务的完成率。</p>
      <div class="hw-table-scroll"><table class="hw-table"><thead><tr><th>期次</th><th>正常截止</th><th>补交截止</th><th>目标学生</th><th>已交齐</th><th>部分完成</th><th>未提交</th><th>状态</th><th></th></tr></thead><tbody>${task.periods.map(p => `<tr class="${p.id === period.id ? 'selected' : ''}"><td><strong>${p.label}</strong><small>${p.date}</small></td><td>${p.deadline}</td><td>${p.makeup}</td><td>${p.target}</td><td>${p.complete}</td><td>${p.partial}</td><td>${p.missing}</td><td>${tag(p.status)}</td><td><button type="button" class="hw-text-button" data-action="period" data-id="${p.id}">查看本期</button></td></tr>`).join('')}</tbody></table></div>
      <div class="hw-item-detail" tabindex="-1"><h2>${period.label} · 逐项进度</h2><div class="hw-period-items">${task.items.map((item, i) => `<div><strong>${h(item.name)}</strong><span>${typeLabel(item.type)} · 已提交 ${count(period.itemCounts[i], period.target)}</span></div>`).join('')}</div><p class="hw-note">整期完成须两项必交内容均有有效提交；仅一项已交计入部分完成。</p></div>`;
  }

  root.addEventListener('click', event => {
    const control = event.target.closest('[data-action]');
    if (!control) return;
    const { action, value, id } = control.dataset;
    if (action === 'scenario') { state.scenario = value; state.view = 'list'; }
    if (action === 'kind') { readFilters(); state.kind = value; }
    if (action === 'search') readFilters();
    if (action === 'reset') { state.kind = 'all'; state.school = 'all'; state.className = 'all'; state.subject = 'all'; state.status = 'all'; state.query = ''; state.scenario = 'normal'; }
    if (action === 'open') { state.view = 'detail'; state.taskId = id; state.tab = 'overview'; state.itemId = null; resetStudentFilters(); state.periodId = null; }
    if (action === 'back') state.view = 'list';
    if (action === 'tab') state.tab = value;
    if (action === 'item') state.itemId = id;
    if (action === 'student') state.studentId = id;
    if (action === 'period') { state.periodId = id; state.itemId = null; resetStudentFilters(); }
    if (action === 'student-scope') { resetStudentFilters(); state.studentStatus = value; state.tab = 'students'; }
    if (action === 'student-search') readStudentFilters();
    if (action === 'student-reset') resetStudentFilters();
    render();
    if (action === 'open' || action === 'back') window.scrollTo({ top: 0, behavior: 'instant' });
    if (action === 'tab' || action === 'student-scope') root.querySelector('.hw-tabbar')?.scrollIntoView({ block: 'start', behavior: 'instant' });
    if (action === 'item' || action === 'period' || action === 'student') {
      const detail = root.querySelector(action === 'student' ? '.hw-student-detail' : '.hw-item-detail');
      detail?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      detail?.focus({ preventScroll: true });
    }
  });
  root.addEventListener('change', event => {
    if (event.target.id === 'hw-period') {
      state.periodId = event.target.value;
      state.itemId = null;
      resetStudentFilters();
      render();
      root.getElementById('hw-period')?.focus({ preventScroll: true });
    }
    if (['hw-student-status', 'hw-student-class'].includes(event.target.id)) { readStudentFilters(); render(); }
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    if (event.target.id === 'hw-query') root.querySelector('[data-action="search"]').click();
    if (event.target.id === 'hw-student-query') root.querySelector('[data-action="student-search"]').click();
  });
  render();
}
