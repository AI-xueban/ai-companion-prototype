/* 教师发布—家长逐项提交—教师统计的浏览器演示。数据只保存在当前浏览器。 */
window.homeworkPrototype = (() => {
  const KEY = 'ai_companion_homework_preview_v1';
  const classes = schoolDemoRoster.DEMO_CLASSES.filter(row => row.id === 'c1' || row.id === 'c2');
  const students = schoolDemoRoster.DEMO_STUDENTS.filter(row => classes.some(classRow => classRow.id === row.classId));
  let guardianId = schoolDemoRoster.GUARDIAN_STUDENT_ID;
  const types = { photo: '图片', video: '视频', audio: '录音', none: '无需线上提交' };
  const accept = { photo: 'image/*', video: 'video/*', audio: 'audio/*' };
  const fileLimits = {
    photo: { bytes: 20 * 1024 * 1024, label: '20MB' },
    video: { bytes: 200 * 1024 * 1024, seconds: 5 * 60, label: '200MB、5分钟' },
    audio: { bytes: 50 * 1024 * 1024, seconds: 10 * 60, label: '50MB、10分钟' }
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const toDate = value => new Date(String(value || '').replace(' ', 'T'));
  const formatDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const addDays = (value, days) => { const date = toDate(value); date.setDate(date.getDate() + days); return formatDate(date); };
  const currentRows = rows => [...rows].sort((a, b) => (a.version || 1) - (b.version || 1) || (a.submittedAt || '').localeCompare(b.submittedAt || '')).reduce((latest, row) => { latest.set(`${row.taskId}:${row.studentId}:${row.itemId}`, row); return latest; }, new Map()).values();
  const latestRows = rows => [...currentRows(rows)];
  const targetIds = task => task.targetSnapshotIds ? [...task.targetSnapshotIds] : students.filter(student => task.classIds.includes(student.classId) && (!task.targetStudentIds || task.targetStudentIds.includes(student.id))).map(student => student.id);
  const seedQuestions = (task, item, studentId) => {
    if (task.kind !== 'homework' || item.type !== 'photo') return [];
    const number = Number(studentId.match(/\d+$/)?.[0]) || 1;
    return [
      { id: `${item.id}-q1`, label: '第 1 题 · 分数计算', answer: '3/4', answerVersion: 1, studentAnswer: number % 3 !== 0 ? '3/4' : '2/4', correct: number % 3 !== 0, state: number % 13 === 0 ? 'review' : 'confirmed' },
      { id: `${item.id}-q2`, label: '第 2 题 · 应用题', answer: number % 17 === 0 ? '' : '24 人', answerVersion: 1, studentAnswer: number % 4 !== 0 ? '24 人' : '18 人', correct: number % 4 !== 0, state: number % 17 === 0 ? 'no-answer' : number % 11 === 0 ? 'unreadable' : 'confirmed' }
    ];
  };
  function seed() {
    const tasks = [
      { id: 'demo-math', kind: 'homework', title: '数学周末练习', description: '完成纸质练习第 3 页，录制一道题的讲解，并由家长确认线下朗读。', photo: '', deadline: '2026-10-20 20:00', submitDeadline: '2026-10-27 20:00', classIds: ['c1', 'c2'], targetStudentIds: null, parentVisible: false, publishedBy: 'teacher-demo-001', items: [{ id: 'math-photo', title: '练习题拍照', instruction: '拍摄清晰完整的答题页', type: 'photo' }, { id: 'math-video', title: '讲解视频', instruction: '讲解你选择的一道题', type: 'video' }, { id: 'math-offline', title: '线下朗读', instruction: '完成后由家长确认', type: 'none' }] },
      ...[1, 2, 3].map(day => ({ id: day === 1 ? 'demo-read' : `demo-read-cycle-${day}`, seriesId: 'demo-read', cycleId: `cycle-${day}`, cycleCount: 3, kind: 'checkin', title: day === 1 ? '每日阅读打卡' : `每日阅读打卡 · 第${day}期`, description: '阅读 20 分钟，记录今天读的内容。', photo: '', deadline: `2026-10-${18 + day} 21:00`, submitDeadline: `2026-10-${25 + day} 21:00`, classIds: ['c1'], targetStudentIds: null, parentVisible: false, publishedBy: 'other-teacher-demo', items: [{ id: 'read-photo', title: '阅读记录', instruction: '拍下阅读记录页', type: 'photo' }] }))
    ];
    const submissions = [];
    tasks.filter(task => task.id !== 'demo-read-cycle-2' && task.id !== 'demo-read-cycle-3').forEach(task => targetIds(task).forEach((studentId, index) => {
      if (studentId === guardianId || index % 6 === 0) return;
      task.items.forEach((item, itemIndex) => {
        if (index % 5 === 0 && itemIndex > 0) return;
        submissions.push({ taskId: task.id, itemId: item.id, studentId, submittedBy: ['guardian-demo-001 · 王女士', 'guardian-demo-002 · 李先生', 'guardian-demo-003 · 张女士'][index % 3], label: item.type === 'none' ? '家长确认已完成' : `演示${types[item.type]}提交`, media: '', submittedAt: `2026-10-18 ${String(14 + index % 5).padStart(2, '0')}:${String(index * 7 % 60).padStart(2, '0')}`, mock: true, questions: seedQuestions(task, item, studentId) });
      });
    }));
    return { tasks, submissions };
  }
  let store;
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); store = saved?.tasks && saved?.submissions ? saved : seed(); } catch { store = seed(); }
  const migrateClass = id => id === 'g5-2' ? 'c1' : id === 'g5-3' ? 'c2' : id;
  const migrateStudent = id => id?.replace(/^g5-2-(\d+)$/, (_, number) => `c1-s${String(number).padStart(2, '0')}`).replace(/^g5-3-(\d+)$/, (_, number) => `c2-s${String(number).padStart(2, '0')}`);
  store.tasks.forEach(task => { task.parentVisible = false; task.classIds = task.classIds.map(migrateClass); if (task.targetStudentIds) task.targetStudentIds = task.targetStudentIds.map(migrateStudent); if (task.targetSnapshotIds) task.targetSnapshotIds = task.targetSnapshotIds.map(migrateStudent); if (!task.submitDeadline) task.submitDeadline = addDays(task.deadline, 7); if (!task.targetSnapshotIds) task.targetSnapshotIds = students.filter(student => task.classIds.includes(student.classId) && (!task.targetStudentIds || task.targetStudentIds.includes(student.id))).map(student => student.id); if (task.id === 'demo-math' && !task.items.some(item => item.id === 'math-offline')) task.items.push({ id: 'math-offline', title: '线下朗读', instruction: '完成后由家长确认', type: 'none' }); if (!task.publishedBy && task.id.startsWith('demo-')) task.publishedBy = task.id === 'demo-math' ? 'teacher-demo-001' : 'other-teacher-demo'; });
  store.submissions.forEach(row => { row.studentId = migrateStudent(row.studentId); });
  store.submissions.forEach((row, index) => {
    if (!row.submittedAt && row.label?.startsWith('演示')) row.submittedAt = `2026-10-18 ${String(14 + index % 5).padStart(2, '0')}:${String(index * 7 % 60).padStart(2, '0')}`;
    if (!row.submittedBy) row.submittedBy = ['guardian-demo-001 · 王女士', 'guardian-demo-002 · 李先生', 'guardian-demo-003 · 张女士'][index % 3];
    if (row.mock === undefined && row.label?.startsWith('演示')) row.mock = true;
  });
  if (store.tasks.some(task => task.id === 'demo-read')) {
    for (const phase of seed().tasks.filter(task => task.id === 'demo-read-cycle-2' || task.id === 'demo-read-cycle-3')) {
      if (!store.tasks.some(task => task.id === phase.id)) store.tasks.push(phase);
    }
    const first = store.tasks.find(task => task.id === 'demo-read');
    first.seriesId = 'demo-read'; first.cycleId = 'cycle-1'; first.cycleCount = 3;
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* 大图片超过浏览器本地容量时仍保留本次演示状态 */ } };
  const sessionMedia = new Map();
  const mediaKey = row => `${row.taskId}:${row.itemId}:${row.studentId}`;
  const mediaFor = row => row.media || sessionMedia.get(mediaKey(row)) || '';
  save();
  const newItem = () => ({ id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: '', instruction: '', type: 'photo' });
  const defaultDeadline = () => { const date = new Date(); date.setDate(date.getDate() + 2); date.setHours(20, 0, 0, 0); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 20:00`; };
  const newDraft = () => { const deadline = defaultDeadline(); return { kind: 'homework', subject: '数学', title: '', description: '', photo: '', deadline, submitDeadline: addDays(deadline, 7), cycleCount: 1, classIds: ['c1'], targetMode: 'all', targetStudentIds: [], parentVisible: false, items: [newItem()] }; };
  let teacherMode = 'list';
  let teacherTaskId = '';
  let teacherFilter = 'all';
  let teacherQuestionId = '';
  let teacherStudentId = '';
  let draft = newDraft();
  let materialSourceOpen = false;
  let chatDemoOpen = false;
  let composeStep = 0;
  let settingMode = 'uniform';
  let uniformType = 'photo';
  let recognizedCount = 0;
  let recognitionStale = false;
  let demoPasteActive = false;
  let composeError = '';
  let publishDemoBranch = 'normal';
  let rosterReviewRequired = false;
  let publishedNotice = '';
  let teacherSeriesId = '';
  let parentTaskId = '';
  let parentCompletedOpen = false;
  let pendingUpload = null;
  let sharedOpen = false;
  const taskById = id => store.tasks.find(task => task.id === id);
  let workScope = { view: 'school', classIds: ['c1', 'c2', 'c3'], teacherId: 'teacher-demo-001' };
  const teacherTask = task => task && ({ ...task, classIds: task.classIds.filter(id => workScope.classIds.includes(id)), targetStudentIds: task.targetStudentIds?.filter(id => students.some(student => student.id === id && workScope.classIds.includes(student.classId))) || null });
  const teacherTaskById = id => { const task = taskById(id); return task && task.classIds.some(classId => workScope.classIds.includes(classId)) && (workScope.view === 'school' || task.publishedBy === workScope.teacherId) ? teacherTask(task) : null; };
  const submissionsFor = task => latestRows(store.submissions.filter(row => row.taskId === task.id && targetIds(task).includes(row.studentId)));
  function summary(task) {
    const targets = targetIds(task);
    const submissions = submissionsFor(task);
    const completed = targets.filter(studentId => task.items.every(item => submissions.some(row => row.studentId === studentId && row.itemId === item.id))).length;
    const partial = targets.filter(studentId => submissions.some(row => row.studentId === studentId) && !task.items.every(item => submissions.some(row => row.studentId === studentId && row.itemId === item.id))).length;
    const questions = submissions.flatMap(row => row.questions || []);
    const confirmed = questions.filter(row => row.state === 'confirmed');
    const questionRows = [...new Set(questions.map(row => row.id))].map(id => {
      const rows = questions.filter(row => row.id === id);
      const valid = rows.filter(row => row.state === 'confirmed');
      return { id, label: rows[0].label, answer: rows[0].answer, valid: valid.length, correct: valid.filter(row => row.correct).length, review: rows.filter(row => row.state === 'review').length, unreadable: rows.filter(row => row.state === 'unreadable').length, noAnswer: rows.filter(row => row.state === 'no-answer').length };
    });
    return { target: targets.length, completed, partial, missing: targets.length - completed - partial, rate: targets.length ? Math.round(completed / targets.length * 100) : 0, graded: confirmed.length, correct: confirmed.filter(row => row.correct).length, correctness: confirmed.length ? Math.round(confirmed.filter(row => row.correct).length / confirmed.length * 100) : null, review: questions.filter(row => row.state === 'review').length, unreadable: questions.filter(row => row.state === 'unreadable').length, noAnswer: questions.filter(row => row.state === 'no-answer').length, questionRows };
  }
  const teacherRefresh = (reset = false) => { const top = typeof document === 'undefined' || reset ? 0 : document.getElementById('teacher-tab-panel')?.scrollTop || 0; if (typeof teacherDesk === 'function') teacherDesk(); if (typeof document !== 'undefined') { const panel = document.getElementById('teacher-tab-panel'); if (panel) panel.scrollTop = top; } };
  const clearComposeError = () => { composeError = ''; if (typeof document !== 'undefined') { const error = document.querySelector('.hp-error'); if (error) error.remove(); } };
  const parentRefresh = (reset = false) => { const top = typeof document === 'undefined' || reset ? 0 : document.querySelector('.parent-main')?.scrollTop || 0; window.parentPrototype?.render(); if (typeof document !== 'undefined') { const panel = document.querySelector('.parent-main'); if (panel) panel.scrollTop = top; } };
  function teacherList() {
    const tasks = store.tasks.filter(task => task.classIds.some(id => workScope.classIds.includes(id)) && (workScope.view === 'school' || task.publishedBy === workScope.teacherId));
    const due = tasks.filter(task => new Date(task.deadline.replace(' ', 'T')).getTime() <= Date.now());
    const homework = due.filter(task => task.kind === 'homework').map(task => summary(teacherTask(task)));
    const checkins = due.filter(task => task.kind === 'checkin').map(task => summary(teacherTask(task)));
    const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
    return `<div class="hp-hero"><span class="hp-eyebrow">${workScope.view === 'school' ? '学校管理员 · 只读' : workScope.view === 'homeroom' ? '班主任 · 本班' : '任课老师 · 数学'}</span><h1>作业与打卡</h1><p>查看作业进度与逐项提交。</p></div>${workScope.view === 'school' ? `<div class="hp-stats"><section><b>${homework.length}</b><span>已截止作业</span></section><section><b>${sum(homework, 'completed')}/${sum(homework, 'target')}</b><span>整份完成</span></section><section><b>${sum(checkins, 'completed')}/${sum(checkins, 'target')}</b><span>打卡完成</span></section></div><p class="hp-muted">进行中 ${tasks.length - due.length} 期；作业与打卡分别统计。</p>` : '<button class="hp-primary" onclick="homeworkPrototype.compose()">＋ 发布作业或打卡</button>'}<h2 class="hp-section">范围内任务</h2>${tasks.map(original => { const task = teacherTask(original); const stat = summary(task); return `<button class="hp-card hp-task" onclick="homeworkPrototype.openTeacher('${task.id}')"><span class="hp-line"><strong>${escape(task.title)}</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'}</em></span><small>${escape(task.classIds.map(id => classes.find(row => row.id === id)?.name).join('、'))} · 截止 ${escape(task.deadline)} · ${new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now() ? '进行中' : '已截止'}</small><span class="hp-line hp-task-bottom"><span>完成 ${stat.completed} / ${stat.target}</span><b>${stat.rate}% ›</b></span></button>`; }).join('') || '<section class="hp-card hp-muted">当前范围暂无任务。</section>'}`;
  }
  const filterTitle = { all: '全部学生', completed: '已完成学生', partial: '部分提交学生', missing: '未提交学生', wrong: '做错学生', questionWrong: '本题做错学生' };
  function studentRows(task) {
    return targetIds(task).map(id => {
      const student = students.find(row => row.id === id);
      const records = submissionsFor(task).filter(row => row.studentId === id);
      const required = task.items.filter(item => item.required !== false);
      const status = !records.length ? 'missing' : required.every(item => records.some(row => row.itemId === item.id)) ? 'completed' : 'partial';
      return { id, name: student?.name || id, classId: student?.classId || '', records, status, wrong: records.flatMap(row => row.questions || []).filter(row => row.state === 'confirmed' && !row.correct), latest: records.map(row => row.submittedAt || '').sort().pop() || '' };
    });
  }
  function teacherDetail() {
    const task = teacherTaskById(teacherTaskId);
    if (!task) return teacherList();
    const stat = summary(task);
    return `<div class="hp-top"><button onclick="homeworkPrototype.backFromTeacherDetail()">‹ ${teacherSeriesId && task.seriesId === teacherSeriesId ? '返回每日进度' : '返回任务'}</button><h1>${escape(task.title)}</h1></div><section class="hp-card"><strong>${task.kind === 'checkin' ? '打卡' : '作业'} · 截止 ${escape(task.deadline)}</strong><p>${escape(task.description)}</p><small>允许补交至 ${escape(task.submitDeadline)} · 接收名单已按发布时冻结</small></section><div class="hp-stats"><section><b>${stat.completed}/${stat.target}</b><span>整份完成</span></section><section><b>${stat.partial}</b><span>部分提交</span></section><section><b>${stat.graded ? stat.correctness + '%' : '—'}</b><span>有效题次正确率</span></section></div><h2 class="hp-section">逐题结果 · 外接批改模拟</h2>${stat.questionRows.map(row => `<section class="hp-card"><span class="hp-line"><strong>${escape(row.label)}</strong><b>${row.valid ? Math.round(row.correct / row.valid * 100) + '%' : '暂无可用结果'}</b></span><small>正确答案 ${escape(row.answer)} · 有效批改 ${row.valid} · 待复核 ${row.review} · 识别不清 ${row.unreadable} · 无答案 ${row.noAnswer}</small>${row.review && workScope.view !== 'school' && task.publishedBy === workScope.teacherId ? `<button class="hp-text-button" onclick="homeworkPrototype.review('${task.id}','${row.id}',true)">模拟改判：正确</button><button class="hp-text-button" onclick="homeworkPrototype.review('${task.id}','${row.id}',false)">模拟改判：错误</button>` : ''}</section>`).join('') || '<section class="hp-card hp-muted">当前任务没有可判分图片题。</section>'}<p class="hp-note">待复核、识别不清和无答案不计入正式正确率。</p>`;
  }
  function teacherDetailView() {
    const task = teacherTaskById(teacherTaskId);
    if (!task) return teacherList();
    const rows = studentRows(task);
    const counts = { completed: rows.filter(row => row.status === 'completed').length, partial: rows.filter(row => row.status === 'partial').length, missing: rows.filter(row => row.status === 'missing').length, wrong: rows.filter(row => row.wrong.length).length };
    const links = `<section class="hp-card hp-drill-list"><h2>按学生查看</h2>${[['completed','已完成'],['partial','部分提交'],['missing','未提交'],['wrong','做错']].map(([key,label]) => `<button onclick="homeworkPrototype.openStudents('${key}')"><span>${label}</span><b>${counts[key]} 人 ›</b></button>`).join('')}</section>`;
    const questionLinks = `<section class="hp-card hp-drill-list"><h2>按题查看做错学生</h2>${summary(task).questionRows.map(question => `<button onclick="homeworkPrototype.openStudents('questionWrong','${escape(question.id)}')"><span>${escape(question.label)}</span><b>${rows.filter(row => row.wrong.some(wrong => wrong.id === question.id)).length} 人 ›</b></button>`).join('')}</section>`;
    return teacherDetail().replace('<h2 class="hp-section">逐题结果', links + '<h2 class="hp-section">逐题结果').replace('<p class="hp-note">', questionLinks + '<p class="hp-note">');
  }
  function teacherStudents() {
    const task = teacherTaskById(teacherTaskId);
    if (!task) return teacherList();
    const question = summary(task).questionRows.find(row => row.id === teacherQuestionId);
    const rows = studentRows(task).filter(row => teacherFilter === 'all' || teacherFilter === 'wrong' && row.wrong.length || teacherFilter === 'questionWrong' && row.wrong.some(wrong => wrong.id === teacherQuestionId) || row.status === teacherFilter);
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToStats()">‹ 返回统计</button><h1>${filterTitle[teacherFilter]}</h1></div><p class="hp-muted">${escape(task.title)}${question ? ' · ' + escape(question.label) : ''} · ${rows.length} 人。${workScope.view === 'school' ? '点击学生查看提交状态与逐题结果。' : '点击学生查看逐项提交和原件。'}</p>${rows.length ? rows.map(row => `<button class="hp-card hp-task" onclick="homeworkPrototype.openStudent('${row.id}')"><span class="hp-line"><strong>${escape(row.name)}</strong><em>${row.status === 'missing' ? '未提交' : row.status === 'partial' ? '部分提交' : '已完成'}</em></span><small>${escape(classes.find(item => item.id === row.classId)?.name || '')} · 做错 ${row.wrong.length} 题 · ${row.latest ? '最近提交 ' + escape(row.latest) : '尚无提交时间'}</small><span class="hp-line hp-task-bottom"><span>已交 ${row.records.length}/${task.items.length} 项</span><b>查看提交 ›</b></span></button>`).join('') : '<section class="hp-card hp-muted">该范围暂无学生。</section>'}`;
  }
  const mockPhoto = (row, studentName) => {
    const wrong = (row.questions || []).some(question => question.state === 'confirmed' && !question.correct);
    const safeName = escape(studentName);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760"><rect width="600" height="760" fill="#dee8e9"/><rect x="38" y="28" width="524" height="704" rx="10" fill="#fffefa" stroke="#cad6d2"/><text x="70" y="92" font-family="sans-serif" font-size="26" fill="#36485a">数学练习 · 演示样张</text><text x="70" y="133" font-family="sans-serif" font-size="19" fill="#6f8391">姓名：${safeName}</text><path d="M70 155H530M70 355H530M70 555H530" stroke="#d4dfe5"/><text x="74" y="215" font-family="sans-serif" font-size="24" fill="#32475d">1. 分数计算</text><text x="100" y="275" font-family="sans-serif" font-size="31" fill="#405c79">${wrong ? '2/4' : '3/4'}</text><text x="74" y="415" font-family="sans-serif" font-size="24" fill="#32475d">2. 应用题</text><text x="100" y="475" font-family="sans-serif" font-size="31" fill="#405c79">24 人</text><text x="70" y="651" font-family="sans-serif" font-size="20" fill="#c96f6f">仅用于原型演示，非真实学生作业</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };
  function teacherStudent() {
    const task = teacherTaskById(teacherTaskId);
    const row = task && studentRows(task).find(item => item.id === teacherStudentId);
    if (!task || !row) return teacherStudents();
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToStudents()">‹ 返回学生名单</button><h1>${escape(row.name)}</h1></div><section class="hp-card"><strong>${escape(classes.find(item => item.id === row.classId)?.name || '')} · ${row.status === 'missing' ? '未提交' : row.status === 'partial' ? '部分提交' : '已完成'}</strong><p>已提交 ${row.records.length}/${task.items.length} 项 · 做错 ${row.wrong.length} 题</p></section><h2 class="hp-section">${workScope.view === 'school' ? '逐项提交与结果' : '逐项提交原件'}</h2>${task.items.map((item, index) => {
      const record = row.records.find(value => value.itemId === item.id);
      if (!record) return `<section class="hp-card"><span class="hp-line"><strong>${index + 1}. ${escape(item.title)}</strong><em>${types[item.type]}</em></span><p class="hp-muted">未提交 · 无原件和提交时间</p></section>`;
      const media = mediaFor(record) || (record.mock && item.type === 'photo' ? mockPhoto(record, row.name) : '');
      const mediaView = workScope.view === 'school' ? '' : item.type === 'photo' && media ? `<a href="${media}" target="_blank" rel="noopener"><img class="hp-original" src="${media}" alt="${escape(row.name)}的${escape(item.title)}提交原图"></a><small>点击图片查看原图</small>` : item.type === 'video' && media ? `<video class="hp-original-video" controls preload="metadata" src="${media}"></video>` : item.type === 'audio' && media ? `<audio controls src="${media}"></audio>` : item.type === 'video' ? '<div class="hp-video-sample">▶ 演示视频记录<small>模拟数据只有提交记录，没有真实视频文件；家长上传后可在此播放原视频。</small></div>' : item.type === 'none' ? '' : '<p class="hp-muted">演示记录暂无可播放的原文件。</p>';
      return `<section class="hp-card"><span class="hp-line"><strong>${index + 1}. ${escape(item.title)}</strong><em>${types[item.type]}</em></span><small>提交时间：${escape(record.submittedAt || '历史演示记录未保存时间')}</small><small>操作账号：${escape(record.submittedBy || '历史记录未保存账号')}</small>${workScope.view === 'school' ? '' : `<small>文件：${escape(record.label)}</small>${record.mock ? '<small>演示数据 · 图片为模拟样张</small>' : ''}${record.transient ? '<small>大文件仅在当前预览会话保留；刷新后需重新选择</small>' : ''}`}${mediaView}${(record.questions || []).length ? `<div class="hp-question-results">${record.questions.map(question => `<div><span>${escape(question.label)} · ${question.state === 'review' ? '待复核' : question.state === 'unreadable' ? '识别不清' : question.state === 'no-answer' ? '暂无标准答案' : question.correct ? '正确' : '做错'}</span><small>正确答案 ${escape(question.answer || '暂无标准答案')}</small>${(question.reviewHistory || []).map(history => `<small>改判记录：${escape(history.at.replace('T',' ').slice(0,16))} · ${history.correct ? '改判为正确' : '改判为错误'} · ${escape(history.reviewerId)} · ${escape(history.reason)}</small>`).join('')}</div>`).join('')}</div>` : ''}</section>`;
    }).join('')}`;
  }
  const typeLabel = type => type === 'none' ? '完成后家长确认' : types[type];
  function teacherTaskCards() {
    const tasks = store.tasks.filter(task => task.classIds.some(id => workScope.classIds.includes(id)) && (workScope.view === 'school' || task.publishedBy === workScope.teacherId));
    const groups = new Map();
    tasks.forEach(task => { const key = task.seriesId || task.id; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(task); });
    return [...groups].map(([seriesId, group]) => {
      if (group.length === 1) {
        const task = teacherTask(group[0]), stat = summary(task);
        return `<button class="hp-card hp-task" onclick="homeworkPrototype.openTeacher('${task.id}')"><span class="hp-line"><strong>${escape(task.title)}</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'}</em></span><small>${escape(task.classIds.map(id => classes.find(row => row.id === id)?.name).join('、'))} · 截止 ${escape(task.deadline)} · ${new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now() ? '进行中' : '已截止'}</small><span class="hp-line hp-task-bottom"><span>完成 ${stat.completed} / ${stat.target}</span><b>${stat.rate}% ›</b></span></button>`;
      }
      const phases = group.sort((a, b) => a.deadline.localeCompare(b.deadline));
      const upcoming = phases.findIndex(task => new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now());
      const nextIndex = upcoming >= 0 ? upcoming : phases.length - 1;
      const totals = phases.map(task => summary(teacherTask(task)));
      const completed = totals.reduce((sum, stat) => sum + stat.completed, 0), target = totals.reduce((sum, stat) => sum + stat.target, 0);
      const title = phases[0].title.replace(/ · 第\d+期$/, '');
      const classesLabel = teacherTask(phases[0]).classIds.map(id => classes.find(row => row.id === id)?.name).join('、');
      return `<section class="hp-card hp-series"><button class="hp-series-head" onclick="homeworkPrototype.openTeacherSeries('${escape(seriesId)}')"><span class="hp-line"><strong>${escape(title)}</strong><em>连续 ${phases.length} 期</em></span><small>${escape(classesLabel)} · ${phases[0].deadline.slice(5,10)}—${phases[phases.length-1].deadline.slice(5,10)} · 每日一交</small><span class="hp-series-next">最近截止：第${nextIndex+1}期 · ${escape(phases[nextIndex].deadline.slice(5))}</span><span class="hp-line hp-task-bottom"><span>累计完成 ${completed} / ${target} 人次</span><b>查看每日进度 ›</b></span></button></section>`;
    }).join('');
  }
  function teacherListV2() {
    const content = teacherList().replace(/^<div class="hp-hero">.*?<\/div>/s, '').split('<h2 class="hp-section">范围内任务</h2>')[0] + '<h2 class="hp-section">任务</h2>' + (teacherTaskCards() || '<section class="hp-card hp-muted">当前范围暂无任务。</section>');
    return publishedNotice ? content.replace('<h2 class="hp-section">任务</h2>', `<div class="hp-success" role="status">${escape(publishedNotice)}</div><h2 class="hp-section">任务</h2>`) : content;
  }
  function teacherSeriesView() {
    const phases = store.tasks.filter(task => task.seriesId === teacherSeriesId && teacherTaskById(task.id)).sort((a, b) => a.deadline.localeCompare(b.deadline));
    if (!phases.length) return `<div class="hp-top"><button onclick="homeworkPrototype.toTeacherList()">‹ 返回任务</button><h1>每日进度</h1></div><section class="hp-card hp-muted">当前范围暂无可查看的每日记录。</section>`;
    const totals = phases.map(task => summary(teacherTask(task)));
    const completed = totals.reduce((sum, row) => sum + row.completed, 0);
    const target = totals.reduce((sum, row) => sum + row.target, 0);
    const title = phases[0].title.replace(/ · 第\d+期$/, '');
    const classesLabel = teacherTask(phases[0]).classIds.map(id => classes.find(row => row.id === id)?.name).join('、');
    return `<div class="hp-top"><button onclick="homeworkPrototype.toTeacherList()">‹ 返回任务</button><h1>每日进度</h1></div><section class="hp-series-overview"><h2>${escape(title)}</h2><p>${escape(classesLabel)} · ${phases[0].deadline.slice(5, 10)}—${phases[phases.length - 1].deadline.slice(5, 10)} · 共 ${phases.length} 期</p>${phases[0].description ? `<p class="hp-series-description">${escape(phases[0].description)}</p>` : ''}<div><span>累计完成</span><strong>${completed} / ${target}</strong><span>人次</span></div></section><h2 class="hp-section">逐日进度</h2>${phases.map((task, index) => { const stat = totals[index], ongoing = new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now(); return `<button class="hp-card hp-series-day" onclick="homeworkPrototype.openTeacher('${escape(task.id)}')"><span class="hp-line"><strong>第${index + 1}期 · ${task.deadline.slice(5, 10)}</strong><em>${ongoing ? '进行中' : '已截止'}</em></span><small>截止 ${escape(task.deadline.slice(11))}</small><span class="hp-line hp-series-day-result"><span>完成 ${stat.completed} / ${stat.target} 人</span><b>${stat.rate}% ›</b></span><span class="hp-series-meter"><i style="width:${stat.rate}%"></i></span></button>`; }).join('')}`;
  }
  const numberedLine = line => {
    const match = line.trim().match(/^(?:[（(](\d{1,2})[）)]|([1-9]\d{0,1})[.．、]|([①②③④⑤⑥⑦⑧⑨⑩])|([一二三四五六七八九十])[、.．])\s*(.+)$/);
    if (!match) return null;
    const circles = '①②③④⑤⑥⑦⑧⑨⑩', chinese = '一二三四五六七八九十';
    return { number: match[1] ? Number(match[1]) : match[2] ? Number(match[2]) : match[3] ? circles.indexOf(match[3]) + 1 : chinese.indexOf(match[4]) + 1, style: match[1] ? 'bracket' : match[2] ? 'digit' : match[3] ? 'circle' : 'chinese', body: match[5] };
  };
  const recognizeItems = description => {
    const lines = description.replace(/\r\n?/g, '\n').split('\n'), groups = [];
    let group = null;
    lines.forEach((line, index) => {
      const marker = numberedLine(line);
      if (!marker) return;
      if (marker.number === 1) {
        if (group?.count >= 2) groups.push(group);
        group = { start: index, end: index, style: marker.style, count: 1, homework: lines.slice(Math.max(0, index - 2), index).some(row => /作业|任务|练习/.test(row)) };
      } else if (group && marker.style === group.style && marker.number === group.count + 1) { group.end = index; group.count++; }
    });
    if (group?.count >= 2) groups.push(group);
    groups.sort((a, b) => Number(b.homework) - Number(a.homework) || b.count - a.count);
    const winner = groups[0];
    if (!winner) return description.trim() ? [description.trim()] : [];
    const starts = [];
    for (let i = winner.start; i <= winner.end; i++) if (numberedLine(lines[i])?.style === winner.style) starts.push(i);
    return starts.map((start, index) => [numberedLine(lines[start])?.body || lines[start], ...lines.slice(start + 1, starts[index + 1] ?? lines.length)].join('\n').trim()).filter(Boolean);
  };

  function teacherComposeV2() {
    const eligible = students.filter(row => draft.classIds.includes(row.classId));
    const stepNames = ['填写内容与设置', '布置对象'];
    const steps = `<div class="hp-steps">${stepNames.map((name, index) => `<span class="${index === composeStep ? 'active' : ''}">${index + 1} ${name}</span>`).join('')}</div>`;
    const typeChoices = (selected, index = null) => `<div class="hp-type-choices" role="group" aria-label="提交方式">${Object.keys(types).map(type => `<button type="button" class="hp-type-choice ${selected === type ? 'active' : ''}" aria-pressed="${selected === type}" onclick="${index === null ? `homeworkPrototype.setUniformType('${type}')` : `homeworkPrototype.setItemType(${index},'${type}')`}">${types[type]}</button>`).join('')}</div>`;
    const settings = `<h3>提交方式</h3><div class="hp-tabs"><button class="${settingMode === 'uniform' ? 'active' : ''}" onclick="homeworkPrototype.setSettingMode('uniform')">统一设置</button><button class="${settingMode === 'individual' ? 'active' : ''}" onclick="homeworkPrototype.setSettingMode('individual')">按条设置</button></div><p class="hp-muted">${recognitionStale ? '内容已修改，请核对识别结果。' : recognizedCount ? `已自动识别 ${recognizedCount} 条作业；原文完整保留。` : '未发现连续编号时，整段内容作为一项。'}</p>${recognitionStale && settingMode === 'individual' && (recognizedCount > 0 || draft.items.length > 1) ? '<button class="hp-text-button" onclick="homeworkPrototype.applyRecognition()">确认重新识别</button>' : ''}${settingMode === 'uniform' ? `<div class="hp-field">所有要求${typeChoices(uniformType)}</div>` : draft.items.map((item, index) => `<div class="hp-recognized-item"><span class="hp-line"><strong>第 ${index + 1} 条</strong>${draft.items.length > 1 ? `<button class="hp-text-button" onclick="homeworkPrototype.removeItem(${index})">移除</button>` : ''}</span><textarea aria-label="第 ${index + 1} 条要求" oninput="homeworkPrototype.setItem(${index},'title',this.value)">${escape(item.title)}</textarea>${typeChoices(item.type, index)}</div>`).join('') + '<button class="hp-add" onclick="homeworkPrototype.addItem()">＋ 手动添加一项</button>'}`;
    const content = composeStep === 0 ? `<section class="hp-card"><h2>这次要布置什么？</h2><div class="hp-tabs"><button class="${draft.kind === 'homework' ? 'active' : ''}" onclick="homeworkPrototype.setKind('homework')">作业</button><button class="${draft.kind === 'checkin' ? 'active' : ''}" onclick="homeworkPrototype.setKind('checkin')">打卡</button></div>${draft.kind === 'checkin' ? `<label class="hp-field">连续打卡天数（1—30 天）<input type="number" min="1" max="30" value="${draft.cycleCount}" onchange="homeworkPrototype.setCycleCount(this.value)"></label>` : ''}<label class="hp-field">名称<input value="${escape(draft.title)}" placeholder="例如：数学周末练习" oninput="homeworkPrototype.setField('title',this.value)"></label><div class="hp-field hp-description-field"><span class="hp-field-heading"><strong>任务描述</strong><button type="button" class="hp-demo-button" onclick="homeworkPrototype.fillDemoPaste()">填入示例 · 看识别效果</button></span><textarea class="hp-paste-area" placeholder="直接粘贴整段作业要求，支持 1.、1、① 等编号" oninput="homeworkPrototype.setField('description',this.value)" onblur="setTimeout(() => homeworkPrototype.recognizeDescription(), 0)">${escape(draft.description)}</textarea><small>整段复制粘贴即可，编号会自动拆分为提交条目。</small>${demoPasteActive ? '<div class="hp-demo-result" role="status">演示已填入：完整原文已保留，系统自动识别 4 条要求；下面可逐条选择提交方式。</div>' : ''}</div><div class="hp-field">题目或说明照片（选填）<button type="button" class="hp-material-trigger" onclick="homeworkPrototype.openMaterialSource()">${draft.photo ? '更换图片' : '添加图片'}　›</button><input id="hp-material-file" class="hp-hidden-file" type="file" accept="image/*" onchange="homeworkPrototype.setPhoto(this)">${draft.photo ? `<div class="hp-material-picked"><img class="hp-photo" src="${draft.photo}" alt="布置内容照片"><span>${escape(draft.photoName || '已选图片')}<small>来源：${escape(draft.photoSource || '手机相册或拍照')}</small></span><button type="button" class="hp-text-button" onclick="homeworkPrototype.removePhoto()">移除</button></div>` : '<small>可从手机相册选择，或从微信聊天记录选择图片。</small>'}</div>${materialSourceOpen ? `<div class="hp-source-mask" onclick="homeworkPrototype.closeMaterialSource()"><div class="hp-source-sheet" onclick="event.stopPropagation()"><strong>选择图片来源</strong><button onclick="homeworkPrototype.chooseLocalPhoto()">手机相册或拍照　›</button><button onclick="homeworkPrototype.showChatDemo()">微信聊天记录　›</button>${chatDemoOpen ? `<div class="hp-chat-demo"><small>浏览器演示：模拟微信会话文件列表，实际小程序由微信打开会话选择器。</small><button onclick="homeworkPrototype.chooseChatDemoPhoto()">练习题.png · 图片　选择</button></div>` : ''}<button class="hp-source-cancel" onclick="homeworkPrototype.closeMaterialSource()">取消</button></div></div>` : ''}${settings}<label class="hp-field">首次截止时间<input type="datetime-local" value="${escape(draft.deadline.replace(' ', 'T'))}" onchange="homeworkPrototype.setDeadline(this.value)"></label><label class="hp-field">允许补交至<input type="datetime-local" value="${escape(draft.submitDeadline.replace(' ', 'T'))}" onchange="homeworkPrototype.setSubmitDeadline(this.value)"></label><p class="hp-muted">补交截止默认晚 7 天。</p></section>` : `<section class="hp-card"><h2>布置给谁？</h2><p class="hp-muted">可选择一个或多个任教班级。</p><div class="hp-chips">${classes.filter(row => workScope.classIds.includes(row.id)).map(row => `<button class="${draft.classIds.includes(row.id) ? 'active' : ''}" onclick="homeworkPrototype.toggleClass('${row.id}')">${escape(row.name)}</button>`).join('')}</div><div class="hp-tabs"><button class="${draft.targetMode === 'all' ? 'active' : ''}" onclick="homeworkPrototype.setTargetMode('all')">所选班级全体</button><button class="${draft.targetMode === 'selected' ? 'active' : ''}" onclick="homeworkPrototype.setTargetMode('selected')">指定学生</button></div>${draft.targetMode === 'selected' ? `<p class="hp-muted">已选 ${draft.targetStudentIds.length} 人。</p><input class="hp-search" placeholder="搜索学生" oninput="homeworkPrototype.filterStudents(this.value)"><div class="hp-students">${eligible.map(row => `<label class="hp-student-option" data-search="${escape((row.name + row.id + (row.className || '')).toLowerCase())}"><input type="checkbox" ${draft.targetStudentIds.includes(row.id) ? 'checked' : ''} onchange="homeworkPrototype.toggleStudent('${row.id}')"><span>${escape(row.name)}<small>${escape(row.className || '')}</small></span></label>`).join('')}</div>` : `<p class="hp-muted">将发给所选班级的 ${eligible.length} 名学生。</p>`}</section>`;
    return `${steps}${content}${composeError ? `<p class="hp-error" role="alert">${escape(composeError)}</p>` : ''}${composeStep ? '<button class="hp-text-button hp-space" onclick="homeworkPrototype.backCompose()">‹ 返回填写</button>' : ''}<button class="hp-primary hp-space" onclick="homeworkPrototype.nextCompose()">${composeStep ? '核对并发布' : '下一步：布置对象'}</button>`;
  }
  function teacherPreviewV2() {
    const eligible = students.filter(row => draft.classIds.includes(row.classId));
    const recipients = draft.targetMode === 'selected' ? eligible.filter(row => draft.targetStudentIds.includes(row.id)) : eligible;
    const demoChoices = new URLSearchParams(location.search).get('review') === '1' ? `<details class="hp-demo-choices"><summary>演示：发布异常</summary><p>仅用于原型演示；表单缺项、时间和接收对象错误可在前面的页面直接操作。</p><div><button class="${publishDemoBranch === 'normal' ? 'active' : ''}" onclick="homeworkPrototype.setPublishDemoBranch('normal')">正常发布</button><button class="${publishDemoBranch === 'network' ? 'active' : ''}" onclick="homeworkPrototype.setPublishDemoBranch('network')">发布失败</button><button class="${publishDemoBranch === 'roster' ? 'active' : ''}" onclick="homeworkPrototype.setPublishDemoBranch('roster')">接收名单变化</button></div></details>` : '';
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToCompose()">‹ 返回修改</button><h1>核对发布内容</h1></div><p class="hp-step-hint">请核对接收对象和两个截止时间，确认后家长会在作业列表看到这项任务。</p><section class="hp-card"><span class="hp-line"><strong>${escape(draft.title)}</strong><em>${draft.kind === 'checkin' ? '打卡' : '作业'}</em></span>${draft.description ? `<p>${escape(draft.description)}</p>` : ''}${draft.photo ? `<img class="hp-photo" src="${draft.photo}" alt="布置内容照片">` : ''}<small>正常截止：${escape(draft.deadline)}</small><small>允许补交至：${escape(draft.submitDeadline)}</small></section><section class="hp-card"><h2>完成项目 · ${draft.items.length} 项</h2>${draft.items.map((item, index) => `<div class="hp-review-item"><strong>${index + 1}. ${escape(item.title)}</strong><small>${escape(item.instruction)}</small><small>完成方式：${typeLabel(item.type)} · 必交</small></div>`).join('')}</section><section class="hp-card"><h2>接收对象 · ${recipients.length} 人</h2><p>${escape(draft.classIds.map(id => classes.find(row => row.id === id)?.name || id).join('、'))} · ${draft.targetMode === 'selected' ? '指定学生' : '全班'}</p>${draft.targetMode === 'selected' ? `<details class="hp-recipient-details"><summary>查看全部接收学生</summary><div>${recipients.map(row => `<span>${escape(row.name)}</span>`).join('')}</div></details>` : ''}<small>确认发布后冻结此名单；家长仅能查看自己孩子的提交内容。</small></section>${demoChoices}${composeError ? `<p class="hp-error" role="alert">${escape(composeError)}</p>` : ''}<button class="hp-primary hp-space" onclick="homeworkPrototype.publish()">确认发布</button>`;
  }
  function renderTeacher() { return teacherMode === 'success' ? `<button class="hp-success-back" onclick="homeworkPrototype.toTeacherList()" aria-label="返回作业首页">‹ 返回作业首页</button><section class="hp-card hp-publish-success"><div class="hp-publish-check">✓</div><h2>发布成功</h2><p>${escape(publishedNotice)}</p><button class="hp-primary" onclick="homeworkPrototype.toTeacherList()">查看已发布任务</button></section>` : teacherMode === 'compose' ? teacherComposeV2() : teacherMode === 'preview' ? teacherPreviewV2() : teacherMode === 'series' ? teacherSeriesView() : teacherMode === 'detail' ? teacherDetailView() : teacherMode === 'students' ? teacherStudents() : teacherMode === 'student' ? teacherStudent() : teacherListV2(); }
  function parentListV2(studentName) {
    const now = Date.now();
    const tasks = store.tasks.filter(task => targetIds(task).includes(guardianId)).map(task => {
      const complete = task.items.filter(item => latestRows(store.submissions).some(row => row.taskId === task.id && row.studentId === guardianId && row.itemId === item.id)).length;
      const done = complete === task.items.length;
      const due = toDate(task.deadline).getTime();
      const closed = toDate(task.submitDeadline).getTime() < now;
      const status = done ? '已完成' : closed ? '补交已结束' : due < now ? '补交中' : due - now <= 86400000 ? '即将截止' : complete ? '部分完成' : '待完成';
      const priority = done ? 5 : closed ? 4 : status === '补交中' ? 0 : status === '即将截止' ? 1 : status === '部分完成' ? 2 : 3;
      return { task, complete, done, status, priority };
    }).sort((a, b) => a.priority - b.priority || a.task.deadline.localeCompare(b.task.deadline));
    const pending = tasks.filter(row => !row.done), completed = tasks.filter(row => row.done);
    const cards = rows => rows.map(({ task, complete, done, status }) => `<button class="hp-card hp-task ${status === '补交中' || status === '补交已结束' ? 'hp-task-overdue' : status === '即将截止' ? 'hp-task-soon' : ''}" onclick="homeworkPrototype.openParent('${task.id}')"><span class="hp-line"><strong>${escape(task.title)}</strong><em class="${status === '补交中' || status === '补交已结束' ? 'hp-state-overdue' : status === '即将截止' ? 'hp-state-soon' : ''}">${status}</em></span><small>${escape(task.kind === 'checkin' ? '打卡' : '作业')} · 正常截止 ${escape(task.deadline)}</small><span class="hp-line hp-task-bottom"><span>已完成 ${complete}/${task.items.length} 项</span><b>${done || status === '补交已结束' ? '查看记录 ›' : '继续完成 ›'}</b></span></button>`).join('');
    return `<div class="hp-parent-context">${escape(studentName)} · ${escape(students.find(row => row.id === guardianId)?.className || '')}</div><h2 class="hp-section">待完成 ${pending.length} 项</h2>${pending.length ? cards(pending) : '<section class="hp-card hp-muted">暂无待完成作业。</section>'}${completed.length ? `<button class="hp-section hp-completed-toggle" onclick="homeworkPrototype.toggleCompleted()">已完成 ${completed.length} 项 ${parentCompletedOpen ? '⌃' : '⌄'}</button>${parentCompletedOpen ? cards(completed) : ''}` : ''}${!tasks.length ? '<p class="hp-muted">老师发布作业后会显示在这里。</p>' : ''}`;
  }
  function parentDetailV2(studentName) {
    const task = taskById(parentTaskId);
    if (!task || !targetIds(task).includes(guardianId)) { parentTaskId = ''; return parentListV2(studentName); }
    const closed = Date.now() > toDate(task.submitDeadline).getTime();
    const mine = latestRows(store.submissions.filter(row => row.taskId === task.id && row.studentId === guardianId));
    const done = task.items.filter(item => mine.some(row => row.itemId === item.id)).length;
    const items = task.items.map((item, index) => {
      const record = mine.find(row => row.itemId === item.id);
      const pending = pendingUpload?.taskId === task.id && pendingUpload.itemId === item.id && pendingUpload.studentId === guardianId ? pendingUpload : null;
      const submittedMedia = record && (mediaFor(record) || (record.mock && item.type === 'photo' ? mockPhoto(record, studentName) : ''));
      const submittedPreview = record && submittedMedia ? item.type === 'photo' ? `<img class="hp-submitted-media" src="${submittedMedia}" alt="已提交的作业照片">` : item.type === 'video' ? `<video class="hp-original-video" controls src="${submittedMedia}"></video>` : item.type === 'audio' ? `<audio controls src="${submittedMedia}"></audio>` : '' : '';
      const pendingPreview = pending ? pending.type === 'photo' ? `<img class="hp-original" src="${pending.media}" alt="待提交照片预览">` : pending.type === 'video' ? `<video class="hp-original-video" controls src="${pending.media}"></video>` : `<audio controls src="${pending.media}"></audio>` : '';
      const upload = closed ? '<p class="hp-muted">补交已结束，本项仅可查看。</p>' : item.type === 'none' ? record ? '' : `<button class="hp-primary hp-item-action" onclick="homeworkPrototype.submit('${task.id}','${item.id}')">确认已完成</button>` : pending ? `<div class="hp-pending"><strong>请核对要提交的${types[item.type]}</strong><small>${escape(pending.name)}</small>${pendingPreview}${record ? '<small>重新提交后，新版本将成为当前提交；旧版本仍保留在提交记录中。</small>' : ''}${pending.transient ? '<small>大文件只在本次预览中保留，刷新后需重新选择。</small>' : ''}<button class="hp-primary hp-item-action" onclick="homeworkPrototype.confirmUpload()">${record ? '确认重新提交' : '确认提交本项'}</button><button class="hp-text-button hp-cancel" onclick="homeworkPrototype.cancelUpload()">取消选择</button></div>` : `<label class="hp-upload hp-upload-primary">${record ? '重新提交' : '上传'}${types[item.type]}<input type="file" accept="${accept[item.type]}" onchange="homeworkPrototype.submitFile('${task.id}','${item.id}',this)"></label><small>图片≤20MB；视频≤200MB且≤5分钟；录音≤50MB且≤10分钟。</small>`;
      const history = store.submissions.filter(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId).sort((a, b) => (b.version || 1) - (a.version || 1));
      const grade = record?.questions?.length ? `<div class="hp-question-results"><strong>模拟批改结果</strong>${record.questions.map(question => `<div><span>${escape(question.label)} · ${question.state === 'review' ? '待教师复核' : question.state === 'unreadable' ? '识别不清' : question.state === 'no-answer' ? '暂无标准答案' : question.correct ? '正确' : '做错'}</span><small>学生作答 ${escape(question.studentAnswer || '未提供')} · 标准答案 ${escape(question.answer || '暂无标准答案')}</small></div>`).join('')}</div>` : '';
      return `<section class="hp-card hp-parent-item"><span class="hp-line"><strong>${index + 1}. ${escape(item.title)}</strong><em class="${record ? 'hp-tag-done' : ''}">${record ? '已完成' : typeLabel(item.type)}</em></span>${item.instruction ? `<p>${escape(item.instruction)}</p>` : ''}${record ? `<small class="hp-done">✓ ${escape(record.submittedAt || '已完成')} · 第 ${record.version || 1} 版 · ${record.late ? "补交 · " : ""}${escape(record.label)}</small>${record.mock ? '<small>演示提交记录</small>' : ''}${record.transient && !submittedMedia ? '<small>原文件已失效，请重新选择。</small>' : ''}${submittedPreview}${grade}${history.length > 1 ? `<div class="hp-question-results"><strong>提交记录</strong>${history.map(row => `<small>第 ${row.version || 1} 版 · ${escape(row.submittedAt)} · ${escape(row.label)}</small>`).join('')}</div>` : ''}` : ''}${upload}</section>`;
    }).join('');
    const deadlineNotice = closed ? '补交已结束，任务已转为只读。' : Date.now() > toDate(task.deadline).getTime() ? '已过正常截止时间，仍可补交或重新提交，记录将标记为补交。' : '请在正常截止时间前完成；补交截止前可重新提交。';
    return `<div class="hp-top"><button onclick="homeworkPrototype.toParentList()">‹ 返回作业</button><h1>${escape(task.title)}</h1></div><section class="hp-card hp-parent-summary"><span class="hp-line"><strong>已完成 ${done}/${task.items.length} 项</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'}</em></span>${task.description ? `<p>${escape(task.description)}</p>` : ''}${task.photo ? `<img class="hp-photo" src="${task.photo}" alt="老师布置的题目照片">` : ''}<small>正常截止 ${escape(task.deadline)}</small><small>允许补交至 ${escape(task.submitDeadline)}</small><p class="hp-deadline-notice">${deadlineNotice}</p><small>同一学生的绑定家长共享任务进度；系统记录本次操作账号。</small></section><details class="hp-card"><summary>演示提交异常</summary><div class="hp-demo-choice"><button onclick="homeworkPrototype.demoException('format')">格式不支持</button><button onclick="homeworkPrototype.demoException('size')">文件过大</button><button onclick="homeworkPrototype.demoException('duration')">视频超时</button><button onclick="homeworkPrototype.demoException('network')">网络中断</button></div></details><h2 class="hp-section">完成项目</h2>${items}`;
  }
  const renderParent = (studentName, childIndex = 0) => { guardianId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID; if (parentTaskId && !targetIds(taskById(parentTaskId) || { classIds: [], targetStudentIds: null }).includes(guardianId)) parentTaskId = ''; return parentTaskId ? parentDetailV2(studentName) : parentListV2(studentName); };
  const submitRecord = (task, item, label, media = '', transientMedia = '') => {
    const version = store.submissions.filter(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId).reduce((max, row) => Math.max(max, row.version || 1), 0) + 1;
    const submittedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-');
    const record = { taskId: task.id, itemId: item.id, studentId: guardianId, submittedBy: 'guardian-demo-001', label, media, transient: Boolean(transientMedia), submittedAt, late: submittedAt > task.deadline, version, mock: label.startsWith('模拟'), questions: seedQuestions(task, item, guardianId) };
    if (transientMedia) sessionMedia.set(mediaKey(record), transientMedia);
    else sessionMedia.delete(mediaKey(record));
    store.submissions.push(record);
    save(); parentRefresh();
  };
  const stageUpload = (task, item, file) => {
    const limit = fileLimits[item.type];
    if (file.size > limit.bytes) { alert(`${types[item.type]}不能超过 ${limit.label}。`); return; }
    const objectUrl = URL.createObjectURL(file);
    const finish = () => {
      if (pendingUpload?.media?.startsWith('blob:')) URL.revokeObjectURL(pendingUpload.media);
      if (file.size > 2 * 1024 * 1024) { pendingUpload = { taskId: task.id, itemId: item.id, studentId: guardianId, name: file.name, type: item.type, media: objectUrl, transient: true }; parentRefresh(); return; }
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => { pendingUpload = { taskId: task.id, itemId: item.id, studentId: guardianId, name: file.name, type: item.type, media: String(reader.result), transient: false }; parentRefresh(); };
      reader.onerror = () => alert('文件读取失败，请重新选择。');
      reader.readAsDataURL(file);
    };
    if (!limit.seconds) { finish(); return; }
    const media = document.createElement(item.type === 'video' ? 'video' : 'audio');
    media.preload = 'metadata';
    media.onloadedmetadata = () => { if (media.duration > limit.seconds) { URL.revokeObjectURL(objectUrl); alert(`${types[item.type]}时长不能超过 ${item.type === 'video' ? '5分钟' : '10分钟'}。`); return; } finish(); };
    media.onerror = () => { URL.revokeObjectURL(objectUrl); alert(`无法读取${types[item.type]}时长，请重新选择文件。`); };
    media.src = objectUrl;
  };
  return {
    renderTeacher, renderParent, getTeacherMode: () => teacherMode,
    resetParentView() { parentTaskId = ''; sharedOpen = false; parentCompletedOpen = false; if (pendingUpload?.media?.startsWith('blob:')) URL.revokeObjectURL(pendingUpload.media); pendingUpload = null; },
    setScope(value) { const changedRole = workScope.view !== value.view || workScope.teacherId !== value.teacherId; workScope = value; if (changedRole || draft.classIds.some(id => !value.classIds.includes(id))) { draft = newDraft(); draft.classIds = [value.classIds[0] || 'c1']; composeStep = 0; composeError = ''; } if (workScope.view === 'school' && (teacherMode === 'compose' || teacherMode === 'preview')) teacherMode = 'list'; },
    toTeacherListWithoutRefresh() { teacherMode = 'list'; teacherTaskId = ''; teacherSeriesId = ''; },
    openTeacherSeries(id) { if (!store.tasks.some(task => task.seriesId === id && teacherTaskById(task.id))) return; teacherSeriesId = id; teacherMode = 'series'; teacherRefresh(true); },
    compose() { if (workScope.view === 'school') return; if (teacherMode !== 'compose' && !draft.title && !draft.description && !draft.photo && !draft.items.some(item => item.title || item.instruction)) { draft = newDraft(); draft.classIds = [workScope.classIds[0] || 'c1']; composeStep = 0; } composeError = ''; publishDemoBranch = 'normal'; rosterReviewRequired = false; teacherMode = 'compose'; teacherRefresh(true); },
    toTeacherList() { teacherMode = 'list'; teacherSeriesId = ''; teacherRefresh(true); },
    backCompose() { if (composeStep) { composeStep -= 1; composeError = ''; teacherRefresh(true); } else this.toTeacherList(); },
    nextCompose() {
      if (recognitionStale && settingMode === 'individual' && (recognizedCount > 0 || draft.items.length > 1)) { composeError = '内容已修改，请先确认重新识别，避免覆盖逐条设置。'; teacherRefresh(); return; }
      if (recognitionStale) this.applyRecognition();
      composeError = '';
      if (composeStep === 0) {
        if (!draft.title.trim()) composeError = '请填写作业名称。';
        else if (!draft.description.trim() && !draft.photo) composeError = '请写布置说明或添加题目照片。';
        else if (!draft.deadline || Number.isNaN(toDate(draft.deadline).getTime()) || toDate(draft.deadline).getTime() <= Date.now()) composeError = '截止时间请选择未来的日期和时间。';
        else if (!draft.submitDeadline || Number.isNaN(toDate(draft.submitDeadline).getTime()) || toDate(draft.submitDeadline).getTime() <= toDate(draft.deadline).getTime()) composeError = '允许补交时间必须晚于正常截止时间。';
      } else {
        if (!draft.classIds.length) composeError = '请至少选择一个班级。';
        else if (draft.targetMode === 'selected' && !draft.targetStudentIds.length) composeError = '请选择要接收作业的学生。';
      }
      if (composeError) { teacherRefresh(); return; }
      if (composeStep < 1) { composeStep += 1; teacherRefresh(true); }
      else { teacherMode = 'preview'; teacherRefresh(true); }
    },
    openTeacher(id) { if (!teacherTaskById(id)) return; if (teacherMode !== 'series') teacherSeriesId = ''; teacherTaskId = id; teacherMode = 'detail'; teacherRefresh(true); },
    backFromTeacherDetail() { teacherMode = teacherSeriesId && teacherTaskById(teacherTaskId)?.seriesId === teacherSeriesId ? 'series' : 'list'; teacherRefresh(true); },
    openStudents(filter, questionId = '') { teacherFilter = filter; teacherQuestionId = questionId; teacherMode = 'students'; teacherRefresh(true); },
    backToStats() { teacherMode = 'detail'; teacherRefresh(true); },
    openStudent(id) { teacherStudentId = id; teacherMode = 'student'; teacherRefresh(true); },
    backToStudents() { teacherMode = 'students'; teacherRefresh(true); },
    setKind(kind) { draft.kind = kind; draft.subject = kind === 'checkin' ? '语文' : '数学'; teacherRefresh(); },
    setCycleCount(value) { const count = Number(value); draft.cycleCount = Number.isFinite(count) ? Math.max(1, Math.min(30, Math.floor(count))) : 1; },
    setField(key, value) { draft[key] = value; if (key === 'description') { recognitionStale = true; demoPasteActive = false; } clearComposeError(); },
    fillDemoPaste() {
      if (draft.description.trim() && !window.confirm('填入示例会替换当前任务描述，继续吗？')) return;
      const sample = '本周复习：回顾课堂知识\n📚作业：\n1. 完成数学练习第 3 页，拍照上传答题页\n2. 选择一道错题，录制 1 分钟讲解视频\n3. 朗读课文片段，上传录音\n4. 完成 20 分钟课外阅读，由家长确认';
      draft.title = draft.title.trim() || '周末综合实践作业';
      draft.description = sample;
      settingMode = 'individual';
      recognitionStale = true;
      draft.items = [newItem()];
      recognizedCount = 0;
      demoPasteActive = true;
      this.applyRecognition();
      clearComposeError();
    },
    recognizeDescription() {
      if (!recognitionStale && draft.items.some(item => item.title)) return;
      if (recognitionStale && settingMode === 'individual' && (recognizedCount > 0 || draft.items.length > 1)) { teacherRefresh(); return; }
      this.applyRecognition();
    },
    applyRecognition() {
      const texts = recognizeItems(draft.description);
      const previous = draft.items;
      draft.items = texts.length ? texts.map(text => ({ ...newItem(), title: text, instruction: '按上述要求完成', type: previous.find(item => item.title === text)?.type || uniformType })) : [{ ...newItem(), title: '题目照片', instruction: '按照片要求完成', type: uniformType }];
      recognizedCount = texts.length > 1 ? texts.length : 0;
      recognitionStale = false;
      teacherRefresh();
    },
    setSettingMode(mode) { settingMode = mode; teacherRefresh(); },
    setUniformType(type) { if (!(type in types)) return; uniformType = type; draft.items.forEach(item => item.type = type); teacherRefresh(); },
    setDeadline(value) { draft.deadline = value.replace('T', ' '); draft.submitDeadline = addDays(draft.deadline, 7); clearComposeError(); },
    setSubmitDeadline(value) { draft.submitDeadline = value.replace('T', ' '); clearComposeError(); },
    setItem(index, key, value) { if (draft.items[index]) draft.items[index][key] = value; demoPasteActive = false; clearComposeError(); },
    setItemType(index, value) { if (draft.items[index] && value in types) draft.items[index].type = value; },
    addItem() { draft.items.push({ ...newItem(), title: '补充要求', instruction: '按要求完成', type: uniformType }); demoPasteActive = false; teacherRefresh(); },
    removeItem(index) { if (draft.items.length > 1) draft.items.splice(index, 1); demoPasteActive = false; teacherRefresh(); },
    toggleClass(id) { if (!workScope.classIds.includes(id)) return; draft.classIds = draft.classIds.includes(id) ? draft.classIds.filter(value => value !== id) : [...draft.classIds, id]; draft.targetStudentIds = draft.targetStudentIds.filter(studentId => students.some(row => row.id === studentId && draft.classIds.includes(row.classId))); teacherRefresh(); },
    setTargetMode(mode) { draft.targetMode = mode; teacherRefresh(); },
    toggleStudent(id) { draft.targetStudentIds = draft.targetStudentIds.includes(id) ? draft.targetStudentIds.filter(value => value !== id) : [...draft.targetStudentIds, id]; teacherRefresh(); },
    filterStudents(value) { if (typeof document === 'undefined') return; const query = value.trim().toLowerCase(); document.querySelectorAll('.hp-student-option').forEach(node => { node.hidden = !node.dataset.search.includes(query); }); },
    openMaterialSource() { materialSourceOpen = true; chatDemoOpen = false; teacherRefresh(); },
    closeMaterialSource() { materialSourceOpen = false; chatDemoOpen = false; teacherRefresh(); },
    chooseLocalPhoto() { document.getElementById('hp-material-file')?.click(); },
    showChatDemo() { chatDemoOpen = true; teacherRefresh(); },
    chooseChatDemoPhoto() { draft.photo = '../miniprogram/assets/homework-demo-paper.png'; draft.photoName = '微信聊天中的练习题.png'; draft.photoSource = '微信聊天演示'; materialSourceOpen = false; chatDemoOpen = false; clearComposeError(); teacherRefresh(); },
    setPhoto(input) { const file = input.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { alert('请选择图片文件'); return; } const reader = new FileReader(); reader.onload = () => { draft.photo = String(reader.result); draft.photoName = file.name; draft.photoSource = '手机相册或拍照'; materialSourceOpen = false; chatDemoOpen = false; clearComposeError(); teacherRefresh(); }; reader.readAsDataURL(file); },
    removePhoto() { draft.photo = ''; draft.photoName = ''; draft.photoSource = ''; teacherRefresh(); },
    preview() { this.nextCompose(); },
    backToCompose() { teacherMode = 'compose'; composeStep = 1; rosterReviewRequired = false; composeError = ''; teacherRefresh(true); },
    setPublishDemoBranch(value) { if (!['normal', 'network', 'roster'].includes(value)) return; publishDemoBranch = value; composeError = ''; teacherRefresh(); },
    publish() { if (workScope.view === 'school' || teacherMode !== 'preview' || !draft.classIds.length || !draft.classIds.every(id => workScope.classIds.includes(id))) return; if (publishDemoBranch === 'network') { composeError = '发布失败：网络暂不可用。内容已保留，请恢复正常场景后重试。'; teacherRefresh(); return; } if (publishDemoBranch === 'roster' || rosterReviewRequired) { composeError = '发布前接收名单发生变化，请返回核对布置对象，再次预览后发布。'; publishDemoBranch = 'normal'; rosterReviewRequired = true; teacherRefresh(); return; } const seriesId = `task-${Date.now()}`; const count = draft.kind === 'checkin' ? draft.cycleCount : 1; const snapshot = students.filter(row => draft.classIds.includes(row.classId) && (draft.targetMode !== 'selected' || draft.targetStudentIds.includes(row.id))).map(row => row.id); const tasks = Array.from({ length: count }, (_, index) => { const deadline = addDays(draft.deadline, index); const submitDeadline = addDays(draft.submitDeadline, index); return { id: count === 1 ? seriesId : `${seriesId}-cycle-${index + 1}`, seriesId, cycleId: draft.kind === 'checkin' ? `cycle-${index + 1}` : null, kind: draft.kind, subject: draft.subject, schoolId: 'luohu-demo', title: count === 1 ? draft.title.trim() : `${draft.title.trim()} · 第${index + 1}期`, description: draft.description.trim(), photo: draft.photo, deadline, submitDeadline, classIds: [...draft.classIds], targetStudentIds: draft.targetMode === 'selected' ? [...draft.targetStudentIds] : null, targetSnapshotIds: [...snapshot], parentVisible: false, publishedBy: workScope.teacherId, items: draft.items.map(item => ({ ...item, required: true, title: item.title.trim(), instruction: item.instruction.trim() })) }; }); store.tasks.unshift(...tasks); save(); const studentsCount = targetIds(tasks[0]).length; publishedNotice = `已发布给 ${studentsCount} 名学生${count > 1 ? `，共 ${count} 期` : ''}，接收名单已冻结；家长可在作业列表查看。`; draft = newDraft(); composeStep = 0; publishDemoBranch = 'normal'; rosterReviewRequired = false; teacherMode = 'success'; teacherRefresh(true); },
    review(taskId, questionId, correct) { if (workScope.view === 'school' || teacherTaskById(taskId)?.publishedBy !== workScope.teacherId) return; const reason = window.prompt(`请输入改判为“${correct ? '正确' : '错误'}”的原因：`, '教师人工复核'); if (!reason?.trim()) { alert('改判原因不能为空。'); return; } const record = latestRows(store.submissions).find(row => row.taskId === taskId && row.questions?.some(question => question.id === questionId && question.state === 'review')); const question = record?.questions.find(row => row.id === questionId && row.state === 'review'); if (question) { question.reviewHistory = [...(question.reviewHistory || []), { at: new Date().toISOString(), before: question.state, after: 'confirmed', correct, reason: reason.trim(), reviewerId: workScope.teacherId }]; question.correct = correct; question.state = 'confirmed'; save(); teacherRefresh(); } },
    openParent(id) { parentTaskId = id; sharedOpen = false; parentRefresh(true); },
    toParentList() { parentTaskId = ''; parentRefresh(true); },
    toggleCompleted() { parentCompletedOpen = !parentCompletedOpen; parentRefresh(); },
    submit(taskId, itemId) { const task = taskById(taskId); const item = task?.items.find(row => row.id === itemId); if (!task || !item || item.type !== 'none' || !targetIds(task).includes(guardianId)) return; if (Date.now() > toDate(task.submitDeadline).getTime()) { alert('补交已结束，当前任务只可查看。'); return; } submitRecord(task, item, '家长确认已完成'); },
    demoException(type) { const messages = { format: '文件格式不支持，请选择 JPG、PNG、MP4、MOV、MP3、M4A 或 WAV。', size: '文件超过当前类型大小限制，请压缩后重新选择。', duration: '视频超过 5 分钟，请剪辑后重新选择。', network: '网络连接中断，当前选择已保留，请恢复网络后重试。' }; alert(messages[type] || '提交失败，请重试。'); },
    submitFile(taskId, itemId, input) {
      const task = taskById(taskId); const item = task?.items.find(row => row.id === itemId); const file = input.files?.[0];
      if (!task || !item || !file || !targetIds(task).includes(guardianId) || item.type === 'none') return;
      if (Date.now() > toDate(task.submitDeadline).getTime()) { alert('补交已结束，当前任务只可查看。'); return; }
      if (item.type === 'photo' && !file.type.startsWith('image/') || item.type === 'video' && !file.type.startsWith('video/') || item.type === 'audio' && !file.type.startsWith('audio/')) { alert(`这一项需要上传${types[item.type]}，请重新选择。`); return; }
      stageUpload(task, item, file);
    },
    cancelUpload() { if (pendingUpload?.media?.startsWith('blob:')) URL.revokeObjectURL(pendingUpload.media); pendingUpload = null; parentRefresh(); },
    confirmUpload() {
      const upload = pendingUpload; const task = upload && taskById(upload.taskId); const item = task?.items.find(row => row.id === upload.itemId);
      if (!upload || !task || !item || upload.studentId !== guardianId || !targetIds(task).includes(guardianId)) return;
      if (Date.now() > toDate(task.submitDeadline).getTime()) { alert('补交已结束，当前任务只可查看。'); return; }
      if (latestRows(store.submissions).some(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId) && !window.confirm('重新提交后，新版本将成为当前提交，旧版本仍保留在提交记录中。确认继续吗？')) return;
      pendingUpload = null;
      submitRecord(task, item, upload.name, upload.transient ? '' : upload.media, upload.transient ? upload.media : '');
    }
  };
})();
