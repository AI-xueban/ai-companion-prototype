/* 教师发布—家长逐项提交—教师统计的浏览器演示。数据只保存在当前浏览器。 */
window.homeworkPrototype = (() => {
  const KEY = 'ai_companion_homework_preview_v1';
  const DRAFT_KEY = 'ai_companion_teacher_homework_preview_draft_v1:';
  const materialUrls = new Map(), materialLoads = new Set();
  let materialDb;
  const openMaterialDb = () => materialDb ||= new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('附件存储不可用')); return; }
    const request = indexedDB.open('homework-preview-attachments', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  });
  const storeMaterialFile = async (id, file) => { const db = await openMaterialDb(); await new Promise((resolve, reject) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file, id); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); }); };
  const refreshMaterialView = () => { if (typeof stage === 'undefined') teacherRefresh(); else if (stage === 'parent') parentRefresh(); else if (stage === 'teacherDesk' && typeof teacherTab !== 'undefined' && teacherTab === 'homework') teacherRefresh(); };
  const materialAttachments = value => Array.isArray(value.attachments) && value.attachments.length ? value.attachments : value.photo ? [{ id: `legacy-${value.id || 'draft'}`, type: 'image', name: value.photoName || '题目图片', path: value.photo, size: 0, source: value.photoSource || '' }] : [];
  const restoreMaterialFile = async file => {
    if (materialUrls.has(file.id)) { file.path = materialUrls.get(file.id); file.unavailable = false; return; }
    if (!file.path?.startsWith('blob:') || materialLoads.has(file.id)) return;
    materialLoads.add(file.id);
    try {
      const db = await openMaterialDb();
      const data = await new Promise((resolve, reject) => { const request = db.transaction('files', 'readonly').objectStore('files').get(file.id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
      if (!data) throw new Error('附件已失效');
      file.path = URL.createObjectURL(data); materialUrls.set(file.id, file.path); file.unavailable = false;
    } catch { file.unavailable = true; }
    refreshMaterialView();
  };
  const materialSize = bytes => !bytes ? '' : bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const renderMaterialAttachments = (value, removable = false) => {
    const files = materialAttachments(value);
    return files.length ? `<div class="hp-attachment-list">${files.map(file => { restoreMaterialFile(file); return `<div class="hp-attachment-row"><button type="button" class="hp-attachment-main" onclick="homeworkPrototype.previewMaterialAttachment('${file.id}')" ${file.unavailable ? 'disabled' : ''}>${file.type === 'image' && !file.unavailable ? `<img src="${escape(file.path)}" alt="${escape(file.name)}">` : `<span class="hp-attachment-icon ${file.type}">${file.type === 'video' ? '▷' : '文档'}</span>`}<span class="hp-attachment-info"><strong>${escape(file.name)}</strong><small>${file.unavailable ? '附件已失效，请重新添加' : `${file.type === 'image' ? '图片' : file.type === 'video' ? '视频' : '文件'}${file.size ? ' · ' + materialSize(file.size) : ''}${file.sessionOnly ? ' · 本次预览可用' : ''}`}</small></span>${removable ? '' : '<b>›</b>'}</button>${removable ? `<button type="button" class="hp-attachment-remove" aria-label="移除附件 ${escape(file.name)}" onclick="homeworkPrototype.removeMaterialAttachment('${file.id}')">×</button>` : ''}</div>`; }).join('')}</div>` : '';
  };
  const renderMaterialPreview = () => !materialPreview ? '' : `<div class="hp-source-mask" onclick="homeworkPrototype.closeMaterialPreview()"><section class="hp-material-preview-sheet" role="dialog" aria-modal="true" aria-label="附件预览" onclick="event.stopPropagation()"><header><strong>${escape(materialPreview.name)}</strong><button type="button" aria-label="关闭附件预览" onclick="homeworkPrototype.closeMaterialPreview()">×</button></header>${materialPreview.type === 'image' ? `<img src="${escape(materialPreview.path)}" alt="${escape(materialPreview.name)}">` : materialPreview.type === 'video' ? `<video src="${escape(materialPreview.path)}" controls playsinline></video>` : `<div class="hp-attachment-document">${escape(materialPreview.name)}<a href="${escape(materialPreview.path)}" ${/\.pdf$/i.test(materialPreview.name) ? 'target="_blank" rel="noopener"' : `download="${escape(materialPreview.name)}"`}>${/\.pdf$/i.test(materialPreview.name) ? '打开文件' : '下载文件'}</a></div>`}</section></div>`;
  const classes = schoolDemoRoster.DEMO_CLASSES.filter(row => row.id === 'c1' || row.id === 'c2');
  const students = schoolDemoRoster.DEMO_STUDENTS.filter(row => classes.some(classRow => classRow.id === row.classId));
  let guardianId = schoolDemoRoster.GUARDIAN_STUDENT_ID;
  const types = { file: '文件', photo: '图片', video: '视频', audio: '录音', none: '线下完成' };
  const publishTypes = ['file', 'photo', 'video', 'none'];
  const accept = { file: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt', photo: 'image/*', video: 'video/*', audio: 'audio/*' };
  const fileLimits = {
    file: { bytes: 50 * 1024 * 1024, label: '50MB' },
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
      { id: 'demo-math', subject: '数学', kind: 'homework', title: '数学周末练习', description: '完成纸质练习第 3 页，录制一道题的讲解，并由家长确认线下朗读。', photo: '', publishedAt: '2026-10-09 09:00', deadline: '2026-10-11 20:00', submitDeadline: '2026-10-18 20:00', classIds: ['c1', 'c2'], targetStudentIds: null, parentVisible: false, publishedBy: 'teacher-demo-001', items: [{ id: 'math-photo', title: '练习题拍照', instruction: '拍摄清晰完整的答题页', type: 'photo' }, { id: 'math-video', title: '讲解视频', instruction: '讲解你选择的一道题', type: 'video' }, { id: 'math-offline', title: '线下朗读', instruction: '完成后由家长确认', type: 'none' }] },
      ...[1, 2, 3].map(day => ({ id: day === 1 ? 'demo-read' : `demo-read-cycle-${day}`, seriesId: 'demo-read', cycleId: `cycle-${day}`, cycleCount: 3, subject: '语文', kind: 'checkin', publishedAt: '2026-10-18 08:00', title: day === 1 ? '每日阅读打卡' : `每日阅读打卡 · 第${day}期`, description: '阅读 20 分钟，记录今天读的内容。', photo: '', deadline: `2026-10-${18 + day} 21:00`, submitDeadline: `2026-10-${25 + day} 21:00`, classIds: ['c1'], targetStudentIds: null, parentVisible: false, publishedBy: 'other-teacher-demo', items: [{ id: 'read-photo', title: '阅读记录', instruction: '拍下阅读记录页', type: 'photo' }] }))
    ];
    const submissions = [];
    tasks.filter(task => task.id !== 'demo-read-cycle-2' && task.id !== 'demo-read-cycle-3').forEach(task => targetIds(task).forEach((studentId, index) => {
      if (studentId === guardianId || index % 6 === 0) return;
      task.items.forEach((item, itemIndex) => {
        if (index % 5 === 0 && itemIndex > 0) return;
        submissions.push({ taskId: task.id, itemId: item.id, studentId, submittedBy: ['guardian-demo-001 · 王女士', 'guardian-demo-002 · 李先生', 'guardian-demo-003 · 张女士'][index % 3], label: item.type === 'none' ? '家长确认已完成' : `演示${types[item.type]}提交`, media: '', submittedAt: `${task.id === 'demo-math' ? '2026-10-10' : '2026-10-18'} ${String(14 + index % 5).padStart(2, '0')}:${String(index * 7 % 60).padStart(2, '0')}`, mock: true, questions: seedQuestions(task, item, studentId) });
      });
    }));
    return { tasks, submissions };
  }
  let store;
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); store = saved?.tasks && saved?.submissions ? saved : seed(); } catch { store = seed(); }
  // 仅补充专用演示任务，不覆盖老师已发布的任务或提交记录。
  for (const completed of [true, false]) {
    const id = completed ? 'teacher-history-completed' : 'teacher-history-pending';
    if (store.tasks.some(task => task.id === id)) continue;
    const day = delta => { const date = new Date(); date.setDate(date.getDate() + delta); return formatDate(date).slice(0, 10) + ' 20:00'; };
    const task = { id, subject: '数学', kind: 'homework', title: completed ? '数学口算练习' : '数学应用题练习', description: '完成练习后由家长确认。', publishedAt: day(-6), deadline: day(completed ? -4 : -1), submitDeadline: day(completed ? -2 : 6), classIds: ['c1', 'c2'], targetStudentIds: null, parentVisible: false, publishedBy: 'teacher-demo-001', items: [{id: id + '-item', title:'完成练习', instruction:'完成后由家长确认', type:'none'}] };
    store.tasks.push(task);
    if (completed) students.filter(row => task.classIds.includes(row.classId)).forEach(row => store.submissions.push({taskId:id,itemId:task.items[0].id,studentId:row.id,submittedBy:'guardian-demo-001',label:'家长确认已完成',media:'',submittedAt:day(-5),mock:true,questions:[]}));
  }
  const migrateClass = id => id === 'g5-2' ? 'c1' : id === 'g5-3' ? 'c2' : id;
  const migrateStudent = id => id?.replace(/^g5-2-(\d+)$/, (_, number) => `c1-s${String(number).padStart(2, '0')}`).replace(/^g5-3-(\d+)$/, (_, number) => `c2-s${String(number).padStart(2, '0')}`);
  store.tasks.forEach(task => { if (!task.subject) task.subject = task.id === 'demo-math' ? '数学' : task.id.startsWith('demo-read') ? '语文' : '综合'; task.parentVisible = false; task.classIds = task.classIds.map(migrateClass); if (task.targetStudentIds) task.targetStudentIds = task.targetStudentIds.map(migrateStudent); if (task.targetSnapshotIds) task.targetSnapshotIds = task.targetSnapshotIds.map(migrateStudent); if (!task.submitDeadline) task.submitDeadline = addDays(task.deadline, 7); if (!task.targetSnapshotIds) task.targetSnapshotIds = students.filter(student => task.classIds.includes(student.classId) && (!task.targetStudentIds || task.targetStudentIds.includes(student.id))).map(student => student.id); if (task.id === 'demo-math' && !task.items.some(item => item.id === 'math-offline')) task.items.push({ id: 'math-offline', title: '线下朗读', instruction: '完成后由家长确认', type: 'none' }); if (!task.publishedBy && task.id.startsWith('demo-')) task.publishedBy = task.id === 'demo-math' ? 'teacher-demo-001' : 'other-teacher-demo'; });
  store.submissions.forEach(row => { row.studentId = migrateStudent(row.studentId); });
  const historicalDemo = store.tasks.find(task => task.id === 'demo-math');
  if (historicalDemo) {
    historicalDemo.publishedAt = '2026-10-09 09:00';
    if (historicalDemo.deadline === '2026-10-20 20:00') { historicalDemo.deadline = '2026-10-11 20:00'; historicalDemo.submitDeadline = '2026-10-18 20:00'; }
    store.submissions.filter(row => row.taskId === 'demo-math' && row.mock && row.submittedAt?.startsWith('2026-10-18')).forEach(row => { row.submittedAt = row.submittedAt.replace('2026-10-18', '2026-10-10'); });
  }
  store.tasks.filter(task => task.id.startsWith('demo-read') && !task.publishedAt).forEach(task => { task.publishedAt = '2026-10-18 08:00'; });
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
  // Add all three task states once, preserving existing tasks and user submissions.
  const demoStatusNow = formatDate(new Date());
  for (const [suffix, title, subject, kind, status] of [["pending-math","有理数计算练习","数学","homework","pending"],["pending-read","课外阅读打卡","语文","checkin","pending"],["completed-english","英语词汇巩固","英语","homework","completed"],["completed-read","朗读背诵打卡","语文","checkin","completed"],["ended-math","数学基础巩固","数学","homework","ended"],["ended-english","英语听力打卡","英语","checkin","ended"]]) {
    const id = 'guardian-demo-status-v1-' + suffix;
    if (store.tasks.some(task => task.id === id)) continue;
    const childIds = [...schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS];
    const past = status !== 'pending';
    const deadline = addDays(demoStatusNow, past ? -3 : 2);
    const submitDeadline = addDays(demoStatusNow, past ? -1 : 9);
    const itemId = id + '-item';
    store.tasks.push({ id, title, subject, kind, schoolId: 'luohu-demo', classIds: ['c1', 'c2'], targetStudentIds: childIds, targetSnapshotIds: childIds, publishedAt: addDays(demoStatusNow, -5), publishedBy: 'teacher-demo-001', parentVisible: false, deadline, submitDeadline, description: status === 'completed' ? '完成线下学习后由家长确认，当前为已完成演示记录。' : status === 'ended' ? '本期任务已结束，可查看完成要求与历史进度。' : '完成老师安排的学习内容，并上传学习记录。', items: [{ id: itemId, title: status === 'completed' ? '线下学习确认' : '学习记录', instruction: status === 'completed' ? '由家长确认孩子已完成本次学习。' : '拍摄清晰的学习记录后提交。', type: status === 'completed' ? 'none' : 'photo' }] });
    if (status === 'completed') for (const studentId of childIds) store.submissions.push({ taskId: id, itemId, studentId, submittedAt: addDays(demoStatusNow, -4), submittedBy: 'guardian-demo-001 · 演示家长', label: '家长确认已完成', media: '', mock: true, version: 1, questions: [] });
  }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* 大图片超过浏览器本地容量时仍保留本次演示状态 */ } };
  const sessionMedia = new Map();
  const mediaKey = row => `${row.taskId}:${row.itemId}:${row.studentId}`;
  const mediaFor = row => row.media || sessionMedia.get(mediaKey(row)) || '';
  save();
  const newItem = () => ({ id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: '', instruction: '', type: '' });
  const defaultDeadline = () => { const date = new Date(); date.setDate(date.getDate() + 2); date.setHours(20, 0, 0, 0); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 20:00`; };
  const newDraft = () => { const deadline = defaultDeadline(); return { kind: 'homework', subject: '数学', title: '', description: '', photo: '', attachments: [], deadline, submitDeadline: addDays(deadline, 7), cycleCount: 1, classIds: ['c1'], targetMode: 'all', targetStudentIds: [], parentVisible: false, items: [newItem()] }; };
  let teacherMode = 'list';
  let teacherTaskId = '';
  let teacherFilter = 'all';
  let teacherQuestionId = '';
  let teacherStudentId = '';
  let draft = newDraft();
  let subjectTouched = false;
  let materialSourceOpen = false;
  let chatDemoOpen = false;
  let materialPreview = null;
  let materialReading = false;
  let materialSelectionSource = '手机相册';
  let expandedItemIndex = 0;
  let datePickerTarget = '';
  let datePickerValue = '';
  let composeStep = 0;
  let settingMode = 'uniform';
  let uniformType = '';
  let recognizedCount = 0;
  let recognitionStale = false;
  let demoPasteActive = false;
  let composeError = '';
  let publishDemoBranch = 'normal';
  let rosterReviewRequired = false;
  let publishedNotice = '';
  let teacherSeriesId = '';
  let parentTaskId = '';
  let parentTaskTab = 'pending';
  let parentTaskTouch = null;
  let pendingUpload = null;
  let sharedOpen = false;
  const taskById = id => store.tasks.find(task => task.id === id);
  let workScope = { view: 'school', classIds: ['c1', 'c2', 'c3'], teacherId: 'teacher-demo-001' };
  const teachingAssignments = () => workScope.teachingAssignments ?? schoolDemoRoster.getDemoTeachingAssignments(workScope.teacherId);
  const publishingClassIds = () => workScope.view !== 'school' ? [...new Set(teachingAssignments().flatMap(row => row.classIds))] : workScope.classIds;
  const subjectOptions = () => [...new Set(teachingAssignments().filter(row => row.classIds.some(id => publishingClassIds().includes(id))).map(row => row.subject))];
  const subjectClassIds = subject => [...new Set(teachingAssignments().filter(row => row.subject === subject).flatMap(row => row.classIds).filter(id => publishingClassIds().includes(id)))];
  const syncDraftTitle = () => {
    const options = subjectOptions(), changed = !options.includes(draft.subject);
    if (changed) draft.subject = options[0] || '';
    const allowed = subjectClassIds(draft.subject);
    draft.classIds = draft.classIds.filter(id => allowed.includes(id));
    if (changed && !draft.classIds.length) draft.classIds = allowed.slice(0, 1);
    draft.targetStudentIds = draft.targetStudentIds.filter(id => students.some(row => row.id === id && draft.classIds.includes(row.classId)));
    draft.title = schoolDemoRoster.formatHomeworkTitle(draft.subject, draft.kind);
  };
  const hasTeacherDraft = () => Boolean(draft.description.trim() || materialAttachments(draft).length || draft.items.some(item => item.title || item.instruction) || subjectTouched || draft.kind === 'checkin');
  const saveTeacherDraft = () => { if (workScope.view === 'school' || !hasTeacherDraft()) return; try { localStorage.setItem(DRAFT_KEY + workScope.teacherId, JSON.stringify({ draft, composeStep, settingMode, uniformType, recognizedCount, recognitionStale, subjectTouched })); } catch { /* 存储空间不足时仍保留当前会话的草稿。 */ } };
  const restoreTeacherDraft = () => {
    if (workScope.view === 'school') return;
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY + workScope.teacherId) || 'null');
      if (!saved?.draft || !Array.isArray(saved.draft.items) || !Array.isArray(saved.draft.classIds) || !saved.draft.classIds.every(id => publishingClassIds().includes(id))) return;
      draft = saved.draft; draft.attachments = materialAttachments(draft); draft.photo = ''; composeStep = saved.composeStep === 1 ? 1 : 0; settingMode = saved.settingMode === 'individual' ? 'individual' : 'uniform'; uniformType = publishTypes.includes(saved.uniformType) ? saved.uniformType : ''; recognizedCount = saved.recognizedCount || 0; recognitionStale = Boolean(saved.recognitionStale);
      subjectTouched = Boolean(saved.subjectTouched);
    } catch { /* 无有效草稿时保持新建表单。 */ }
  };
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
  const resizeDescription = () => { if (typeof document === 'undefined' || !document.querySelector) return; const field = document.querySelector('.hp-paste-area'); if (!field) return; field.style.height = 'auto'; field.style.height = `${Math.min(320, Math.max(112, field.scrollHeight + 2))}px`; field.style.overflowY = field.scrollHeight > 318 ? 'auto' : 'hidden'; };
  const teacherRefresh = (reset = false) => { const top = typeof document === 'undefined' || reset ? 0 : document.getElementById('teacher-tab-panel')?.scrollTop || 0; if (typeof teacherDesk === 'function') teacherDesk(); resizeDescription(); if (typeof document !== 'undefined') { const panel = document.getElementById('teacher-tab-panel'); if (panel) panel.scrollTop = top; } };
  const clearComposeError = () => { composeError = ''; if (typeof document !== 'undefined') { const error = document.querySelector('.hp-error'); if (error) error.remove(); } };
  const parentRefresh = (reset = false) => { const top = typeof document === 'undefined' || reset ? 0 : document.querySelector('.parent-main')?.scrollTop || 0; window.parentPrototype?.render(); if (typeof document !== 'undefined') { const panel = document.querySelector('.parent-main'); if (panel) panel.scrollTop = top; } };
  function teacherList() {
    const tasks = store.tasks.filter(task => task.classIds.some(id => workScope.classIds.includes(id)) && (workScope.view === 'school' || task.publishedBy === workScope.teacherId));
    const due = tasks.filter(task => new Date(task.deadline.replace(' ', 'T')).getTime() <= Date.now());
    const homework = due.filter(task => task.kind === 'homework').map(task => summary(teacherTask(task)));
    const checkins = due.filter(task => task.kind === 'checkin').map(task => summary(teacherTask(task)));
    const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
    return `<div class="hp-hero"><span class="hp-eyebrow">${workScope.view === 'school' ? '学校管理员 · 只读' : workScope.view === 'homeroom' ? '班主任 · 本班' : '任课老师 · 数学'}</span><h1>作业与打卡</h1><p>查看作业进度与逐项提交。</p></div>${workScope.view === 'school' ? `<div class="hp-stats"><section><b>${homework.length}</b><span>已截止作业</span></section><section><b>${sum(homework, 'completed')}/${sum(homework, 'target')}</b><span>整份完成</span></section><section><b>${sum(checkins, 'completed')}/${sum(checkins, 'target')}</b><span>打卡完成</span></section></div><p class="hp-muted">进行中 ${tasks.length - due.length} 期；作业与打卡分别统计。</p>` : `<button class="hp-primary" onclick="homeworkPrototype.compose()">${hasTeacherDraft() ? '草稿 · 继续编辑' : '＋ 发布作业或打卡'}</button>${hasTeacherDraft() ? '<p class="hp-muted">发布内容已自动保存在草稿中，尚未发送给学生。</p>' : ''}`}<h2 class="hp-section">范围内任务</h2>${tasks.map(original => { const task = teacherTask(original); const stat = summary(task); return `<button class="hp-card hp-task" onclick="homeworkPrototype.openTeacher('${task.id}')"><span class="hp-line"><strong>${escape(task.title)}</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'}</em></span><small>${escape(task.classIds.map(id => classes.find(row => row.id === id)?.name).join('、'))} · 截止 ${escape(task.deadline)} · ${new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now() ? '进行中' : '已截止'}</small><span class="hp-line hp-task-bottom"><span>完成 ${stat.completed} / ${stat.target}</span><b>${stat.rate}% ›</b></span></button>`; }).join('') || '<section class="hp-card hp-muted">当前范围暂无任务。</section>'}`;
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
  function teacherTaskOverview(task, stat) {
    const now = Date.now(), ongoing = toDate(task.deadline).getTime() > now, canSupplement = toDate(task.submitDeadline).getTime() > now;
    const status = ongoing ? '进行中' : canSupplement ? '可补交' : '已结束';
    const tone = ongoing ? 'active' : canSupplement ? 'late' : 'ended';
    const wrong = studentRows(task).filter(row => row.wrong.length).length;
    const classLabel = task.classIds.map(id => classes.find(row => row.id === id)?.name || id).join('、');
    return `<section class="hp-card hp-task-focus"><div class="hp-focus-heading"><span>${task.kind === 'checkin' ? '打卡' : '作业'} · ${escape(classLabel)}</span><em class="${tone}">${status}</em></div><div class="hp-focus-progress"><div><strong>${stat.rate}<small>%</small></strong><span>完成率</span></div><button onclick="homeworkPrototype.openStudents('completed')"><strong>${stat.completed}<span> / ${stat.target} 人</span></strong><span>已完成 ›</span></button></div><div class="hp-focus-meter" aria-label="完成率 ${stat.rate}%"><i style="width:${stat.rate}%"></i></div><div class="hp-focus-actions"><button class="missing" onclick="homeworkPrototype.openStudents('missing')"><b>${stat.missing}<small>人</small></b><span>未提交 ›</span></button><button class="partial" onclick="homeworkPrototype.openStudents('partial')"><b>${stat.partial}<small>人</small></b><span>部分提交 ›</span></button><button onclick="homeworkPrototype.openStudents('wrong')"><b>${wrong}<small>人</small></b><span>做错学生 ›</span></button></div><div class="hp-focus-deadline"><span>${ongoing ? '截止时间' : '原截止'}</span><strong>${escape(task.deadline)}</strong></div><div class="hp-focus-secondary"><span>${canSupplement ? '补交截止' : '补交已结束'}</span><span>${escape(task.submitDeadline)}</span></div></section><section class="hp-task-description"><header class="hp-task-description-heading">作业要求</header><div>${task.description ? `<p>${escape(task.description)}</p>` : '<p>本任务未填写文字说明。</p>'}${renderMaterialAttachments(task)}<small>发布时间　${escape(task.publishedAt || '历史记录未保存')}</small><small>接收对象　${escape(classLabel)} · ${stat.target} 人</small></div></section><div class="hp-grade-overview"><div><strong>${stat.graded ? stat.correctness + '%' : '—'}</strong><span>有效题次正确率</span></div><div><strong>${stat.review}</strong><span>待复核题次</span></div><div><strong>${stat.graded}</strong><span>有效批改题次</span></div></div>`;
  }
  function teacherDetail() {
    const task = teacherTaskById(teacherTaskId);
    if (!task) return teacherList();
    const stat = summary(task);
    return `${teacherTaskOverview(task, stat)}<h2 class="hp-section">AI批改结果</h2>${stat.questionRows.map(row => `<section class="hp-card"><span class="hp-line"><strong>${escape(row.label)}</strong><b>${row.valid ? Math.round(row.correct / row.valid * 100) + '%' : '暂无可用结果'}</b></span><small>正确答案 ${escape(row.answer)} · 有效批改 ${row.valid} · 待复核 ${row.review} · 识别不清 ${row.unreadable} · 无答案 ${row.noAnswer}</small>${row.review && workScope.view !== 'school' && task.publishedBy === workScope.teacherId ? `<button class="hp-text-button" onclick="homeworkPrototype.review('${task.id}','${row.id}',true)">模拟改判：正确</button><button class="hp-text-button" onclick="homeworkPrototype.review('${task.id}','${row.id}',false)">模拟改判：错误</button>` : ''}</section>`).join('') || '<section class="hp-card hp-muted">当前任务没有可判分图片题。</section>'}<p class="hp-note">待复核、识别不清和无答案不计入正式正确率。</p>`;
  }
  function teacherDetailView() {
    const task = teacherTaskById(teacherTaskId);
    if (!task) return teacherList();
    const rows = studentRows(task);
    const questionLinks = `<section class="hp-card hp-drill-list"><h2>按题查看做错学生</h2>${summary(task).questionRows.map(question => `<button onclick="homeworkPrototype.openStudents('questionWrong','${escape(question.id)}')"><span>${escape(question.label)}</span><b>${rows.filter(row => row.wrong.some(wrong => wrong.id === question.id)).length} 人 ›</b></button>`).join('')}</section>`;
    return teacherDetail().replace('<p class="hp-note">', questionLinks + '<p class="hp-note">');
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
    let previousSection = '';
    return [...groups].sort(([, a], [, b]) => {
      const aDue = Math.max(...a.map(task => toDate(task.deadline).getTime())), bDue = Math.max(...b.map(task => toDate(task.deadline).getTime()));
      return Number(bDue > Date.now()) - Number(aDue > Date.now()) || bDue - aDue;
    }).map(([seriesId, group]) => {
      const ended = group.every(task => toDate(task.deadline).getTime() <= Date.now());
      const section = ended ? '历史任务' : '当前任务';
      const heading = section !== previousSection ? `<h2 class="hp-section">${section}</h2>` : '';
      previousSection = section;
      if (group.length === 1) {
        const task = teacherTask(group[0]), stat = summary(task);
        const status = stat.target > 0 && stat.completed === stat.target ? '全部完成' : !ended ? '待完成' : toDate(task.submitDeadline).getTime() > Date.now() ? '待完成 · 可补交' : '已结束 · 未完成';
        return `${heading}<button class="hp-card hp-task" onclick="homeworkPrototype.openTeacher('${task.id}')"><span class="hp-line"><strong>${escape(task.title)}</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'} · ${status}</em></span><small>${escape(task.classIds.map(id => classes.find(row => row.id === id)?.name).join('、'))}</small><div class="hp-task-times"><span>发布 ${escape(task.publishedAt || '历史记录未保存')}</span><span>截止 ${escape(task.deadline)}</span>${ended ? `<span>补交截止 ${escape(task.submitDeadline)}</span>` : ''}</div><span class="hp-line hp-task-bottom"><span>完成 ${stat.completed} / ${stat.target}</span><b>${stat.rate}% ›</b></span></button>`;
      }
      const phases = group.sort((a, b) => a.deadline.localeCompare(b.deadline));
      const upcoming = phases.findIndex(task => new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now());
      const nextIndex = upcoming >= 0 ? upcoming : phases.length - 1;
      const totals = phases.map(task => summary(teacherTask(task)));
      const completed = totals.reduce((sum, stat) => sum + stat.completed, 0), target = totals.reduce((sum, stat) => sum + stat.target, 0);
      const title = phases[0].title.replace(/ · 第\d+期$/, '');
      const classesLabel = teacherTask(phases[0]).classIds.map(id => classes.find(row => row.id === id)?.name).join('、');
      return `${heading}<section class="hp-card hp-series"><button class="hp-series-head" onclick="homeworkPrototype.openTeacherSeries('${escape(seriesId)}')"><span class="hp-line"><strong>${escape(title)}</strong><em>连续 ${phases.length} 期 · ${ended ? '已截止' : '进行中'}</em></span><small>${escape(classesLabel)} · 每日一交</small><div class="hp-task-times"><span>发布 ${escape(phases[0].publishedAt || '历史记录未保存')}</span><span>任务周期 ${escape(phases[0].deadline.slice(0,10))} — ${escape(phases[phases.length-1].deadline.slice(0,10))}</span></div><span class="hp-series-next">${ended ? '最后截止' : '最近截止'}：第${nextIndex+1}期 · ${escape(phases[nextIndex].deadline)}</span><span class="hp-line hp-task-bottom"><span>累计完成 ${completed} / ${target} 人次</span><b>查看每日进度 ›</b></span></button></section>`;
    }).join('');
  }
  function teacherListV2() {
    return teacherList().replace(/^<div class="hp-hero">.*?<\/div>/s, '').split('<h2 class="hp-section">范围内任务</h2>')[0] + (publishedNotice ? `<div class="hp-success" role="status">${escape(publishedNotice)}</div>` : '') + (teacherTaskCards() || '<section class="hp-card hp-muted">当前范围暂无任务。</section>');
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

  const prettyDate = value => { const date = toDate(value); return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
  const renderDatePicker = () => {
    if (!datePickerTarget) return '';
    const chosen = toDate(datePickerValue);
    const year = chosen.getFullYear(), month = chosen.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const offset = (firstWeekday + 6) % 7;
    const count = new Date(year, month + 1, 0).getDate();
    const days = Array.from({ length: offset }, () => '<span></span>').concat(Array.from({ length: count }, (_, index) => `<button type="button" class="${chosen.getDate() === index + 1 ? 'active' : ''}" onclick="homeworkPrototype.pickDateDay(${index + 1})">${index + 1}</button>`)).join('');
    const hour = String(chosen.getHours()).padStart(2, '0'), minute = String(chosen.getMinutes()).padStart(2, '0');
    return `<div class="hp-date-mask" onclick="homeworkPrototype.closeDatePicker()"><section class="hp-date-sheet" role="dialog" aria-modal="true" aria-label="设置${datePickerTarget === 'deadline' ? '首次截止' : '允许补交至'}时间" onclick="event.stopPropagation()"><header><button type="button" onclick="homeworkPrototype.closeDatePicker()">取消</button><strong>设置${datePickerTarget === 'deadline' ? '首次截止' : '允许补交至'}时间</strong><button type="button" onclick="homeworkPrototype.confirmDatePicker()">确定</button></header><div class="hp-calendar-month"><button type="button" aria-label="上个月" onclick="homeworkPrototype.shiftPickerMonth(-1)">‹</button><strong>${year}年${month + 1}月</strong><button type="button" aria-label="下个月" onclick="homeworkPrototype.shiftPickerMonth(1)">›</button></div><div class="hp-calendar-grid hp-calendar-week">${['一','二','三','四','五','六','日'].map(day => `<span>${day}</span>`).join('')}</div><div class="hp-calendar-grid hp-calendar-days">${days}</div><div class="hp-time-row"><span>时间</span><select aria-label="小时" onchange="homeworkPrototype.setPickerTime('hour',this.value)">${Array.from({ length: 24 }, (_, index) => `<option value="${String(index).padStart(2, '0')}" ${hour === String(index).padStart(2, '0') ? 'selected' : ''}>${String(index).padStart(2, '0')}</option>`).join('')}</select><b>:</b><select aria-label="分钟" onchange="homeworkPrototype.setPickerTime('minute',this.value)">${Array.from({ length: 60 }, (_, index) => `<option value="${String(index).padStart(2, '0')}" ${minute === String(index).padStart(2, '0') ? 'selected' : ''}>${String(index).padStart(2, '0')}</option>`).join('')}</select></div></section></div>`;
  };
  function teacherComposeV2() {
    syncDraftTitle();
    const eligible = students.filter(row => draft.classIds.includes(row.classId));
    const steps = `<div class="hp-compose-toolbar"><div class="hp-steps hp-steps-compact"><span class="${composeStep === 0 ? 'active' : 'done'}">① ${draft.kind === 'checkin' ? '填写打卡' : '填写作业'}</span><i></i><span class="${composeStep === 1 ? 'active' : ''}">② 选择班级和学生</span></div>${composeStep === 0 ? `<div class="hp-kind-toolbar" role="group" aria-label="任务类型"><button type="button" class="${draft.kind === 'homework' ? 'active' : ''}" onclick="homeworkPrototype.setKind('homework')">作业</button><button type="button" class="${draft.kind === 'checkin' ? 'active' : ''}" onclick="homeworkPrototype.setKind('checkin')">打卡</button></div>` : ''}</div>`;
    const typeChoices = (selected, index = null) => `<div class="hp-type-choices" role="group" aria-label="提交方式">${publishTypes.map(type => `<button type="button" class="hp-type-choice ${selected === type ? 'active' : ''}" aria-pressed="${selected === type}" onclick="${index === null ? `homeworkPrototype.setUniformType('${type}')` : `homeworkPrototype.setItemType(${index},'${type}')`}">${types[type]}</button>`).join('')}</div>`;
    const itemRows = draft.items.map((item, index) => `<div class="hp-requirement"><div class="hp-requirement-head"><span class="hp-requirement-number">${index + 1}</span><button type="button" class="hp-requirement-toggle" onclick="homeworkPrototype.toggleItemOptions(${index})"><strong>${escape(item.title || '未填写要求')}</strong><em>${types[item.type] || '请选择'} ${expandedItemIndex === index ? '⌃' : '›'}</em></button></div>${expandedItemIndex === index ? `<textarea aria-label="第 ${index + 1} 条要求" oninput="homeworkPrototype.setItem(${index},'title',this.value)">${escape(item.title)}</textarea>${typeChoices(item.type, index)}${draft.items.length > 1 ? `<button class="hp-text-button" onclick="homeworkPrototype.removeItem(${index})">移除本条</button>` : ''}` : ''}</div>`).join('');
    const settings = `<section class="hp-compose-section"><div class="hp-setting-head"><h3>提交方式</h3><div class="hp-mode-switch"><button type="button" class="${settingMode === 'uniform' ? 'active' : ''}" onclick="homeworkPrototype.setSettingMode('uniform')">统一设置</button><button type="button" class="${settingMode === 'individual' ? 'active' : ''}" onclick="homeworkPrototype.setSettingMode('individual')">单独设置</button></div></div><p class="hp-muted">${recognitionStale ? '内容已修改，请核对识别结果。' : recognizedCount ? `已识别 ${recognizedCount} 条要求，可逐条设置。` : '未识别出编号时，按整段内容设置。'}</p>${recognitionStale && settingMode === 'individual' && (recognizedCount > 0 || draft.items.length > 1) ? '<button class="hp-text-button" onclick="homeworkPrototype.applyRecognition()">确认重新识别</button>' : ''}${settingMode === 'uniform' ? typeChoices(uniformType) : `<div class="hp-requirement-title"><strong>完成要求 · ${draft.items.length}项</strong></div>${itemRows}<button class="hp-add" onclick="homeworkPrototype.addItem()">＋ 手动添加一项</button>`}</section>`;
    const material = `<div class="hp-attachment-field"><div class="hp-attachment-heading"><strong>附件<span>（选填）</span></strong><button type="button" onclick="homeworkPrototype.openMaterialSource()" ${materialReading ? 'disabled' : ''}>${materialReading ? '正在添加…' : '＋ 添加附件'}</button></div>${renderMaterialAttachments(draft, true)}<input id="hp-material-album" class="hp-hidden-file" type="file" accept="image/*,video/*" multiple onchange="homeworkPrototype.addMaterialFiles(this)"><input id="hp-material-camera" class="hp-hidden-file" type="file" accept="image/*,video/*" capture="environment" onchange="homeworkPrototype.addMaterialFiles(this)"><input id="hp-material-document" class="hp-hidden-file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" multiple onchange="homeworkPrototype.addMaterialFiles(this)"></div>${materialSourceOpen ? `<div class="hp-source-mask" onclick="homeworkPrototype.closeMaterialSource()"><section class="hp-source-sheet hp-attachment-source" role="dialog" aria-modal="true" aria-label="添加附件" onclick="event.stopPropagation()"><strong>${chatDemoOpen ? '选择聊天附件（演示）' : '添加附件'}</strong>${chatDemoOpen ? `<button type="button" onclick="homeworkPrototype.chooseChatAttachment('image')">练习题.png<small>图片 · 微信聊天记录</small></button><button type="button" onclick="homeworkPrototype.chooseChatAttachment('file')">作业要求.txt<small>文件 · 微信聊天记录</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('chat-video')">选择视频演示<small>视频 · 使用本地视频体验</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('chat-file')">选择其他文件<small>PDF、Word、PPT、Excel、TXT</small></button>` : `<button type="button" onclick="homeworkPrototype.chooseMaterialMedia('album')">从手机相册选择<small>图片或视频</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('camera')">拍照或拍摄<small>拍摄图片或视频</small></button><button type="button" onclick="homeworkPrototype.showChatDemo()">从微信聊天记录选择<small>图片、视频或文件</small></button>`}<button type="button" class="hp-source-cancel" onclick="homeworkPrototype.closeMaterialSource()">取消</button></section></div>` : ''}`;
    const dateRows = `<section class="hp-compose-section"><h3>截止时间</h3><button type="button" class="hp-date-summary" onclick="homeworkPrototype.openDatePicker('deadline')"><span>首次截止</span><strong>${prettyDate(draft.deadline)}</strong><b>›</b></button><button type="button" class="hp-date-summary" onclick="homeworkPrototype.openDatePicker('submitDeadline')"><span>允许补交至</span><strong>${prettyDate(draft.submitDeadline)}</strong><b>›</b></button><p class="hp-muted">补交截止默认比首次截止晚 7 天，可修改。</p></section>`;
    const firstStep = `<section class="hp-card hp-compose-card"><div class="hp-auto-title-row"><strong>${escape(draft.title)}</strong>${subjectOptions().length > 1 ? `<select aria-label="选择任教学科" onchange="homeworkPrototype.setSubject(this.value)">${subjectOptions().map(subject => `<option value="${escape(subject)}" ${draft.subject === subject ? 'selected' : ''}>${escape(subject)}</option>`).join('')}</select>` : ''}</div>${!subjectOptions().length ? '<p class="hp-error">暂无可发布学科，请联系学校管理员核对任教关系。</p>' : ''}${draft.kind === 'checkin' ? `<label class="hp-field">连续打卡天数（1—30 天）<input type="number" min="1" max="30" value="${draft.cycleCount}" onchange="homeworkPrototype.setCycleCount(this.value)"></label>` : ''}<div class="hp-field hp-description-field"><span class="hp-field-heading"><strong>任务描述</strong><button type="button" class="hp-demo-button" onclick="homeworkPrototype.fillDemoPaste()">填入演示内容</button></span><textarea class="hp-paste-area" placeholder="粘贴作业要求，编号自动分条" oninput="homeworkPrototype.setField('description',this.value)" onblur="setTimeout(() => homeworkPrototype.recognizeDescription(), 0)">${escape(draft.description)}</textarea></div>${material}</section>${settings}${dateRows}`;
    const recipients = `<section class="hp-compose-section"><h3>选择任教班级<span class="hp-class-hint">可多选</span></h3><div class="hp-class-options">${classes.filter(row => subjectClassIds(draft.subject).includes(row.id)).map(row => `<button type="button" class="${draft.classIds.includes(row.id) ? 'active' : ''}" onclick="homeworkPrototype.toggleClass('${row.id}')"><span>${escape(row.name)}</span><small>${students.filter(student => student.classId === row.id).length}人</small><b>${draft.classIds.includes(row.id) ? '✓' : '○'}</b></button>`).join('')}</div></section><section class="hp-compose-section"><h3>发送范围</h3><div class="hp-target-options"><button type="button" class="${draft.targetMode === 'all' ? 'active' : ''}" onclick="homeworkPrototype.setTargetMode('all')">${draft.targetMode === 'all' ? '◉' : '○'} 所选班级全体</button><button type="button" class="${draft.targetMode === 'selected' ? 'active' : ''}" onclick="homeworkPrototype.setTargetMode('selected')">${draft.targetMode === 'selected' ? '◉' : '○'} 指定学生</button></div>${draft.targetMode === 'selected' ? `<p class="hp-muted">已选 ${draft.classIds.length} 个班级中的 ${draft.targetStudentIds.length} 名学生。</p><input class="hp-search" placeholder="搜索学生" oninput="homeworkPrototype.filterStudents(this.value)"><div class="hp-students">${classes.filter(group => draft.classIds.includes(group.id)).map(group => `<section class="hp-student-group"><div class="hp-student-group-heading"><strong>${escape(group.name)}</strong><small>已选 ${eligible.filter(row => row.classId === group.id && draft.targetStudentIds.includes(row.id)).length} / ${group.count} 人</small></div>${eligible.filter(row => row.classId === group.id).map(row => `<label class="hp-student-option" data-search="${escape((row.name + row.id + group.name).toLowerCase())}"><input type="checkbox" ${draft.targetStudentIds.includes(row.id) ? 'checked' : ''} onchange="homeworkPrototype.toggleStudent('${row.id}')"><span>${escape(row.name)}<small>${escape(row.id)}</small></span></label>`).join('')}</section>`).join('')}</div>` : `<p class="hp-target-count">预计接收 ${eligible.length} 名学生</p>`}</section>`;
    return `${steps}${composeStep === 0 ? firstStep : recipients}${composeError ? `<p class="hp-error" role="alert">${escape(composeError)}</p>` : ''}${composeStep ? '<button class="hp-text-button hp-compose-back" onclick="homeworkPrototype.backCompose()">返回修改</button>' : ''}<button class="hp-primary hp-space" onclick="homeworkPrototype.nextCompose()">${composeStep ? '核对发布内容' : '下一步：选择班级和学生'}</button>${renderDatePicker()}`;
  }
  function teacherPreviewV2() {
    syncDraftTitle();
    const eligible = students.filter(row => draft.classIds.includes(row.classId));
    const recipients = draft.targetMode === 'selected' ? eligible.filter(row => draft.targetStudentIds.includes(row.id)) : eligible;
    const demoChoices = new URLSearchParams(location.search).get('review') === '1' ? `<details class="hp-demo-choices"><summary>演示：发布异常</summary><p>仅用于原型演示；表单缺项、时间和接收对象错误可在前面的页面直接操作。</p><div><button class="${publishDemoBranch === 'normal' ? 'active' : ''}" onclick="homeworkPrototype.setPublishDemoBranch('normal')">正常发布</button><button class="${publishDemoBranch === 'network' ? 'active' : ''}" onclick="homeworkPrototype.setPublishDemoBranch('network')">发布失败</button><button class="${publishDemoBranch === 'roster' ? 'active' : ''}" onclick="homeworkPrototype.setPublishDemoBranch('roster')">接收名单变化</button></div></details>` : '';
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToCompose()">‹ 返回修改</button><h1>核对发布内容</h1></div><p class="hp-step-hint">请核对接收对象和两个截止时间，确认后家长会在作业列表看到这项任务。</p><section class="hp-card"><span class="hp-line"><strong>${escape(draft.title)}</strong><em>${draft.kind === 'checkin' ? '打卡' : '作业'}</em></span>${draft.description ? `<p>${escape(draft.description)}</p>` : ''}${renderMaterialAttachments(draft)}<small>正常截止：${escape(draft.deadline)}</small><small>允许补交至：${escape(draft.submitDeadline)}</small></section><section class="hp-card"><h2>完成项目 · ${draft.items.length} 项</h2>${draft.items.map((item, index) => `<div class="hp-review-item"><strong>${index + 1}. ${escape(item.title)}</strong><small>${escape(item.instruction)}</small><small>完成方式：${typeLabel(item.type)} · 必交</small></div>`).join('')}</section><section class="hp-card"><h2>接收对象 · ${recipients.length} 人</h2><p>${escape(draft.classIds.map(id => classes.find(row => row.id === id)?.name || id).join('、'))} · ${draft.targetMode === 'selected' ? '指定学生' : '全班'}</p>${draft.targetMode === 'selected' ? `<details class="hp-recipient-details"><summary>查看全部接收学生</summary><div>${recipients.map(row => `<span>${escape(row.name)}</span>`).join('')}</div></details>` : ''}<small>确认发布后冻结此名单；家长仅能查看自己孩子的提交内容。</small></section>${demoChoices}${composeError ? `<p class="hp-error" role="alert">${escape(composeError)}</p>` : ''}<button class="hp-primary hp-space" onclick="homeworkPrototype.publish()">确认发布</button>`;
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
      return { task, complete, done, closed, status, priority };
    }).sort((a, b) => a.priority - b.priority || a.task.deadline.localeCompare(b.task.deadline));
    const pending = tasks.filter(row => !row.done && !row.closed), completed = tasks.filter(row => row.done), ended = tasks.filter(row => !row.done && row.closed);
    const cards = rows => rows.map(({ task, complete, done, status }) => `<button class="hp-card hp-task hp-parent-task ${status === '补交中' || status === '补交已结束' ? 'hp-task-overdue' : status === '即将截止' ? 'hp-task-soon' : ''}" onclick="homeworkPrototype.openParent('${task.id}')"><span class="hp-line"><strong><span class="hp-parent-tags"><span class="hp-parent-subject">${escape(task.subject || '综合')}</span><span class="hp-parent-kind ${task.kind === 'checkin' ? 'checkin' : 'homework'}">${task.kind === 'checkin' ? '打卡' : '作业'}</span></span><span class="hp-parent-task-name">${escape(task.title)}</span></strong><em class="${status === '补交中' || status === '补交已结束' ? 'hp-state-overdue' : status === '即将截止' ? 'hp-state-soon' : ''}">${status}</em></span><small>截止 ${escape(task.deadline)}</small><span class="hp-line hp-task-bottom"><span>已完成 ${complete}/${task.items.length} 项</span><b>${done || status === '补交已结束' ? '查看记录 ›' : complete > 0 ? '继续完成 ›' : '去完成 ›'}</b></span></button>`).join('');
    const groups = { pending, completed, ended };
    const labels = { pending: '待完成', completed: '已完成', ended: '已结束' };
    const tabs = `<div class="hp-parent-task-tabs" role="tablist" aria-label="任务状态">${Object.keys(groups).map(key => `<button id="hp-tab-${key}" role="tab" aria-controls="hp-task-panel" aria-selected="${parentTaskTab === key}" class="${parentTaskTab === key ? 'active' : ''}" onclick="homeworkPrototype.changeParentTaskTab('${key}')">${labels[key]}<span>${groups[key].length}</span></button>`).join('')}</div>`;
    const rows = groups[parentTaskTab];
    return `${tabs}<div id="hp-task-panel" class="hp-parent-task-panel" role="tabpanel" aria-labelledby="hp-tab-${parentTaskTab}" onpointerdown="homeworkPrototype.taskSwipeStart(event)" onpointerup="homeworkPrototype.taskSwipeEnd(event)" onpointercancel="homeworkPrototype.taskSwipeCancel()">${rows.length ? cards(rows) : `<section class="hp-card hp-muted">暂无${labels[parentTaskTab]}任务。</section>`}</div>`;
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
      const submittedPreview = record && submittedMedia ? item.type === 'photo' ? `<img class="hp-submitted-media" src="${submittedMedia}" alt="已提交的作业照片">` : item.type === 'video' ? `<video class="hp-original-video" controls src="${submittedMedia}"></video>` : item.type === 'audio' ? `<audio controls src="${submittedMedia}"></audio>` : item.type === 'file' ? `<a class="hp-file-preview" href="${submittedMedia}" download="${escape(record.label)}">📄 ${escape(record.label)}　查看文件 ›</a>` : '' : '';
      const pendingPreview = pending ? pending.type === 'photo' ? `<img class="hp-original" src="${pending.media}" alt="待提交照片预览">` : pending.type === 'video' ? `<video class="hp-original-video" controls src="${pending.media}"></video>` : pending.type === 'audio' ? `<audio controls src="${pending.media}"></audio>` : `<div class="hp-file-preview">📄 ${escape(pending.name)}</div>` : '';
      const upload = closed ? '<p class="hp-muted">补交已结束，本项仅可查看。</p>' : item.type === 'none' ? record ? '' : `<button class="hp-primary hp-item-action" onclick="homeworkPrototype.submit('${task.id}','${item.id}')">确认已完成</button>` : pending ? `<div class="hp-pending"><strong>请核对要提交的${types[item.type]}</strong><small>${escape(pending.name)}</small>${pendingPreview}${record ? '<small>重新提交后，新版本将成为当前提交；旧版本仍保留在提交记录中。</small>' : ''}${pending.transient ? '<small>大文件只在本次预览中保留，刷新后需重新选择。</small>' : ''}<button class="hp-primary hp-item-action" onclick="homeworkPrototype.confirmUpload()">${record ? '确认重新提交' : '确认提交本项'}</button><button class="hp-text-button hp-cancel" onclick="homeworkPrototype.cancelUpload()">取消选择</button></div>` : `<label class="hp-upload hp-upload-primary">${record ? '重新提交' : '上传'}${types[item.type]}<input type="file" accept="${accept[item.type]}" onchange="homeworkPrototype.submitFile('${task.id}','${item.id}',this)"></label><small>${item.type === 'file' ? '支持 PDF、Word、PPT、Excel、TXT，≤50MB。' : '图片≤20MB；视频≤200MB且≤5分钟；录音≤50MB且≤10分钟。'}</small>`;
      const history = store.submissions.filter(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId).sort((a, b) => (b.version || 1) - (a.version || 1));
      const grade = record?.questions?.length ? `<div class="hp-question-results"><strong>模拟批改结果</strong>${record.questions.map(question => `<div><span>${escape(question.label)} · ${question.state === 'review' ? '待教师复核' : question.state === 'unreadable' ? '识别不清' : question.state === 'no-answer' ? '暂无标准答案' : question.correct ? '正确' : '做错'}</span><small>学生作答 ${escape(question.studentAnswer || '未提供')} · 标准答案 ${escape(question.answer || '暂无标准答案')}</small></div>`).join('')}</div>` : '';
      return `<section class="hp-card hp-parent-item"><span class="hp-line"><strong>${index + 1}. ${escape(item.title)}</strong><em class="${record ? 'hp-tag-done' : ''}">${record ? '已完成' : typeLabel(item.type)}</em></span>${item.instruction ? `<p>${escape(item.instruction)}</p>` : ''}${record ? `<small class="hp-done">✓ ${escape(record.submittedAt || '已完成')} · 第 ${record.version || 1} 版 · ${record.late ? "补交 · " : ""}${escape(record.label)}</small>${record.mock ? '<small>演示提交记录</small>' : ''}${record.transient && !submittedMedia ? '<small>原文件已失效，请重新选择。</small>' : ''}${submittedPreview}${grade}${history.length > 1 ? `<div class="hp-question-results"><strong>提交记录</strong>${history.map(row => `<small>第 ${row.version || 1} 版 · ${escape(row.submittedAt)} · ${escape(row.label)}</small>`).join('')}</div>` : ''}` : ''}${upload}${!closed && (item.type !== 'none' || !record) ? `<details class="hp-submit-demo"><summary>演示提交异常</summary><div class="hp-submit-demo-options">${item.type !== 'none' ? `<button onclick="homeworkPrototype.demoException('format')">格式不支持</button><button onclick="homeworkPrototype.demoException('size')">文件过大</button>` : ''}${item.type === 'video' ? `<button onclick="homeworkPrototype.demoException('duration')">视频超时</button>` : ''}<button onclick="homeworkPrototype.demoException('network')">网络中断</button></div></details>` : ''}</section>`;
    }).join('');
    const deadlineNotice = closed ? '补交已结束，任务已转为只读。' : Date.now() > toDate(task.deadline).getTime() ? '已过正常截止时间，仍可补交或重新提交，记录将标记为补交。' : '请在正常截止时间前完成；补交截止前可重新提交。';
    return `<section class="hp-card hp-parent-summary"><span class="hp-line"><strong>已完成 ${done}/${task.items.length} 项</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'}</em></span>${task.description ? `<p>${escape(task.description)}</p>` : ''}${renderMaterialAttachments(task)}<small>正常截止 ${escape(task.deadline)}</small><small>允许补交至 ${escape(task.submitDeadline)}</small><p class="hp-deadline-notice">${deadlineNotice}</p><small>同一学生的绑定家长共享任务进度；系统记录本次操作账号。</small></section><h2 class="hp-section">完成项目</h2>${items}`;
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
    renderTeacher() { return renderTeacher().replace(/<div class="hp-top">[\s\S]*?<\/h1><\/div>/g, '').replace(/<button class="hp-success-back"[\s\S]*?<\/button>/g, '').replace(/<button class="hp-text-button hp-compose-back"[\s\S]*?<\/button>/g, '').replace(/(<section class="hp-series-overview">)<h2>[\s\S]*?<\/h2>/, '$1').replace('<h2>发布成功</h2>', '') + renderMaterialPreview(); }, renderParent(studentName, childIndex = 0) { return renderParent(studentName, childIndex) + renderMaterialPreview(); }, getTeacherMode: () => teacherMode,
    getParentTaskSummary(childIndex = 0) {
      const childId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID;
      const now = Date.now();
      const pending = store.tasks.filter(task => targetIds(task).includes(childId) && toDate(task.submitDeadline).getTime() >= now && !task.items.every(item => latestRows(store.submissions).some(row => row.taskId === task.id && row.itemId === item.id && row.studentId === childId)));
      return { pending: pending.length, dueSoon: pending.filter(task => { const remaining = toDate(task.deadline).getTime() - now; return remaining >= 0 && remaining <= 86400000; }).length, overdue: pending.filter(task => toDate(task.deadline).getTime() < now).length };
    },
    getParentNavigation(childIndex = 0) { const task = taskById(parentTaskId); const childId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID; const detail = Boolean(task && targetIds(task).includes(childId)); return { detail, title: detail ? task.title : '作业' }; },
    getTeacherNavigation() {
      const task = taskById(teacherTaskId);
      const filterTitles = { all: '全部学生', completed: '已完成学生', partial: '部分提交学生', missing: '未提交学生', wrong: '做错学生', questionWrong: '本题做错学生' };
      const series = store.tasks.find(row => row.seriesId === teacherSeriesId);
      const titles = { list: '作业', compose: '发布任务', preview: '核对发布内容', success: '发布成功', detail: task?.title || '任务详情', series: series?.title.replace(/ · 第\d+期$/, '') || '每日进度', students: filterTitles[teacherFilter] || '学生名单', student: students.find(row => row.id === teacherStudentId)?.name || '学生提交详情' };
      return { title: titles[teacherMode] || '作业', back: teacherMode !== 'list' };
    },
    navigateTeacherBack() { if (teacherMode === 'preview') this.backToCompose(); else if (teacherMode === 'compose') this.backCompose(); else if (teacherMode === 'student') this.backToStudents(); else if (teacherMode === 'students') this.backToStats(); else if (teacherMode === 'detail') this.backFromTeacherDetail(); else this.toTeacherList(); },
    navigateTeacherHome() { saveTeacherDraft(); teacherMode = 'list'; teacherTaskId = ''; teacherSeriesId = ''; teacherFilter = 'all'; teacherQuestionId = ''; teacherStudentId = ''; materialSourceOpen = false; chatDemoOpen = false; materialPreview = null; datePickerTarget = ''; composeError = ''; teacherRefresh(true); },
    resetParentView() { parentTaskId = ''; sharedOpen = false; parentTaskTouch = null; if (pendingUpload?.media?.startsWith('blob:')) URL.revokeObjectURL(pendingUpload.media); pendingUpload = null; },
    setScope(value) { const changedRole = workScope.view !== value.view || workScope.teacherId !== value.teacherId; const allowedForDraft = value.view !== 'school' ? [...new Set((value.teachingAssignments ?? schoolDemoRoster.getDemoTeachingAssignments(value.teacherId)).flatMap(row => row.classIds))] : value.classIds; const resetDraft = changedRole || draft.classIds.some(id => !allowedForDraft.includes(id)); if (resetDraft) saveTeacherDraft(); workScope = value; if (resetDraft) { draft = newDraft(); subjectTouched = false; draft.classIds = [value.classIds[0] || 'c1']; composeStep = 0; composeError = ''; restoreTeacherDraft(); } if (workScope.view === 'school' && (teacherMode === 'compose' || teacherMode === 'preview')) teacherMode = 'list'; },
    toTeacherListWithoutRefresh() { teacherMode = 'list'; teacherTaskId = ''; teacherSeriesId = ''; },
    openTeacherSeries(id) { if (!store.tasks.some(task => task.seriesId === id && teacherTaskById(task.id))) return; teacherSeriesId = id; teacherMode = 'series'; teacherRefresh(true); },
    compose() { if (workScope.view === 'school') return; if (teacherMode !== 'compose' && !hasTeacherDraft()) { draft = newDraft(); draft.classIds = [workScope.classIds[0] || 'c1']; composeStep = 0; uniformType = ''; settingMode = 'uniform'; } composeError = ''; publishDemoBranch = 'normal'; rosterReviewRequired = false; teacherMode = 'compose'; teacherRefresh(true); },
    toTeacherList() { saveTeacherDraft(); teacherMode = 'list'; teacherSeriesId = ''; teacherRefresh(true); },
    backCompose() { if (composeStep) { composeStep -= 1; composeError = ''; teacherRefresh(true); } else this.toTeacherList(); },
    nextCompose() {
      if (materialReading) return;
      syncDraftTitle();
      if (recognitionStale && settingMode === 'individual' && (recognizedCount > 0 || draft.items.length > 1)) { composeError = '内容已修改，请先确认重新识别，避免覆盖逐条设置。'; teacherRefresh(); return; }
      if (recognitionStale) this.applyRecognition();
      composeError = '';
      if (composeStep === 0) {
        if (!subjectOptions().includes(draft.subject)) composeError = '暂无可发布学科，请联系学校管理员核对任教关系。';
        else if (!draft.description.trim() && !materialAttachments(draft).length) composeError = '请填写任务描述或添加附件。';
        else if (draft.items.some(item => !publishTypes.includes(item.type))) composeError = '请为每条要求选择提交方式。';
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
    setKind(kind) { draft.kind = kind; syncDraftTitle(); teacherRefresh(); },
    setSubject(value) { if (!subjectOptions().includes(value)) return; subjectTouched = true; draft.subject = value; const allowed = subjectClassIds(value), selected = draft.classIds.filter(id => allowed.includes(id)); draft.classIds = selected.length ? selected : allowed.slice(0, 1); syncDraftTitle(); saveTeacherDraft(); teacherRefresh(); },
    setCycleCount(value) { const count = Number(value); draft.cycleCount = Number.isFinite(count) ? Math.max(1, Math.min(30, Math.floor(count))) : 1; },
    setField(key, value) { if (key === 'title' || key === 'subject') return; draft[key] = value; if (key === 'description') { recognitionStale = true; demoPasteActive = false; resizeDescription(); } clearComposeError(); },
    fillDemoPaste() {
      if (draft.description.trim() && !window.confirm('填入示例会替换当前任务描述，继续吗？')) return;
      const sample = '本周复习：回顾课堂知识\n📚作业：\n1. 完成数学练习第 3 页，拍照上传答题页\n2. 选择一道错题，录制 1 分钟讲解视频\n3. 填写练习文档并上传文件\n4. 完成 20 分钟课外阅读，由家长确认';
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
      draft.items = texts.length ? texts.map(text => ({ ...newItem(), title: text, instruction: '按上述要求完成', type: previous.find(item => item.title === text)?.type || (settingMode === 'uniform' ? uniformType : '') })) : [{ ...newItem(), title: '完成作业', instruction: '按任务要求完成', type: settingMode === 'uniform' ? uniformType : '' }];
      recognizedCount = texts.length > 1 ? texts.length : 0;
      recognitionStale = false;
      teacherRefresh();
    },
    setSettingMode(mode) { if (mode === 'uniform' && settingMode !== mode) uniformType = draft.items.length && draft.items.every(item => item.type === draft.items[0].type) ? draft.items[0].type : ''; settingMode = mode; expandedItemIndex = 0; teacherRefresh(); },
    applyUniformToAll() { settingMode = 'uniform'; draft.items.forEach(item => item.type = uniformType); teacherRefresh(); },
    toggleItemOptions(index) { expandedItemIndex = expandedItemIndex === index ? -1 : index; teacherRefresh(); },
    setUniformType(type) { if (!(type in types)) return; uniformType = type; draft.items.forEach(item => item.type = type); teacherRefresh(); },
    setDeadline(value) { draft.deadline = value.replace('T', ' '); draft.submitDeadline = addDays(draft.deadline, 7); clearComposeError(); },
    setSubmitDeadline(value) { draft.submitDeadline = value.replace('T', ' '); clearComposeError(); },
    setItem(index, key, value) { if (draft.items[index]) draft.items[index][key] = value; demoPasteActive = false; clearComposeError(); },
    setItemType(index, value) { if (draft.items[index] && publishTypes.includes(value)) { draft.items[index].type = value; expandedItemIndex = -1; teacherRefresh(); } },
    openDatePicker(target) { datePickerTarget = target; datePickerValue = draft[target]; teacherRefresh(); },
    closeDatePicker() { datePickerTarget = ''; teacherRefresh(); },
    shiftPickerMonth(delta) { const date = toDate(datePickerValue); const day = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + delta); date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())); datePickerValue = formatDate(date); teacherRefresh(); },
    pickDateDay(day) { const date = toDate(datePickerValue); date.setDate(day); datePickerValue = formatDate(date); teacherRefresh(); },
    setPickerTime(part, value) { const date = toDate(datePickerValue); if (part === 'hour') date.setHours(Number(value)); else date.setMinutes(Number(value)); datePickerValue = formatDate(date); },
    confirmDatePicker() { const date = toDate(datePickerValue); if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now() && datePickerTarget === 'deadline') { alert('首次截止请选择未来时间。'); return; } if (datePickerTarget === 'submitDeadline' && date.getTime() <= toDate(draft.deadline).getTime()) { alert('补交截止必须晚于首次截止。'); return; } if (datePickerTarget === 'deadline') { draft.deadline = datePickerValue; draft.submitDeadline = addDays(datePickerValue, 7); } else draft.submitDeadline = datePickerValue; datePickerTarget = ''; clearComposeError(); teacherRefresh(); },
    addItem() { draft.items.push({ ...newItem(), title: '补充要求', instruction: '按要求完成', type: settingMode === 'uniform' ? uniformType : '' }); demoPasteActive = false; teacherRefresh(); },
    removeItem(index) { if (draft.items.length > 1) draft.items.splice(index, 1); demoPasteActive = false; teacherRefresh(); },
    toggleClass(id) { if (!subjectClassIds(draft.subject).includes(id)) return; draft.classIds = draft.classIds.includes(id) ? draft.classIds.filter(value => value !== id) : [...draft.classIds, id]; draft.targetStudentIds = draft.targetStudentIds.filter(studentId => students.some(row => row.id === studentId && draft.classIds.includes(row.classId))); teacherRefresh(); },
    setTargetMode(mode) { draft.targetMode = mode; teacherRefresh(); },
    toggleStudent(id) { if (!students.some(row => row.id === id && draft.classIds.includes(row.classId))) return; draft.targetStudentIds = draft.targetStudentIds.includes(id) ? draft.targetStudentIds.filter(value => value !== id) : [...draft.targetStudentIds, id]; teacherRefresh(); },
    filterStudents(value) { if (typeof document === 'undefined') return; const query = value.trim().toLowerCase(); document.querySelectorAll('.hp-student-option').forEach(node => { node.hidden = !node.dataset.search.includes(query); }); document.querySelectorAll('.hp-student-group').forEach(group => { group.hidden = !Array.from(group.querySelectorAll('.hp-student-option')).some(row => !row.hidden); }); },
    openMaterialSource() { if (materialReading) return; materialSourceOpen = true; chatDemoOpen = false; teacherRefresh(); },
    closeMaterialSource() { materialSourceOpen = false; chatDemoOpen = false; teacherRefresh(); },
    chooseMaterialMedia(source) {
      materialSelectionSource = source.startsWith('chat') ? '微信聊天记录（演示）' : source === 'camera' ? '拍照或拍摄' : '手机相册';
      const input = document.getElementById(source === 'camera' ? 'hp-material-camera' : source === 'chat-file' ? 'hp-material-document' : 'hp-material-album');
      if (input) { input.value = ''; input.accept = source === 'chat-video' ? 'video/*' : source === 'chat-file' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt' : 'image/*,video/*'; input.click(); }
    },
    showChatDemo() { chatDemoOpen = true; teacherRefresh(); },
    chooseChatAttachment(type) {
      const file = { id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: type === 'image' ? '练习题.png' : '作业要求.txt', type, path: type === 'image' ? '../miniprogram/assets/homework-demo-paper.png' : 'data:text/plain;charset=utf-8,' + encodeURIComponent('请完成附件中的练习，并按照老师设置的方式提交作业。'), size: 0, source: '微信聊天记录（演示）' };
      draft.attachments = [...materialAttachments(draft), file]; draft.photo = ''; materialSourceOpen = false; chatDemoOpen = false; clearComposeError();
      if (!draft.items.some(item => item.title.trim())) this.applyRecognition();
      saveTeacherDraft(); teacherRefresh();
    },
    async addMaterialFiles(input) {
      const files = Array.from(input.files || []); if (!files.length || materialReading) return;
      materialReading = true; materialSourceOpen = false; chatDemoOpen = false; teacherRefresh();
      const added = [], errors = [];
      for (const file of files) {
        const type = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(file.name) ? 'image' : file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(file.name) ? 'video' : /\.(pdf|docx?|pptx?|xlsx?|txt)$/i.test(file.name) ? 'file' : '';
        if (!type) { errors.push(`${file.name}：不支持的附件格式`); continue; }
        const max = type === 'image' ? 20 : type === 'video' ? 200 : 50;
        if (file.size > max * 1024 * 1024) { errors.push(`${file.name}：不能超过 ${max}MB`); continue; }
        const entry = { id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: file.name, type, size: file.size, source: materialSelectionSource, path: '' };
        try {
          try { await storeMaterialFile(entry.id, file); entry.path = URL.createObjectURL(file); materialUrls.set(entry.id, entry.path); }
          catch {
            if (file.size <= 2 * 1024 * 1024) entry.path = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
            else { entry.path = URL.createObjectURL(file); materialUrls.set(entry.id, entry.path); entry.sessionOnly = true; }
          }
          added.push(entry);
        } catch { errors.push(`${file.name}：读取失败，请重试`); }
      }
      draft.attachments = [...materialAttachments(draft), ...added]; draft.photo = ''; materialReading = false; clearComposeError();
      if (!draft.items.some(item => item.title.trim())) this.applyRecognition();
      saveTeacherDraft(); teacherRefresh(); if (errors.length) alert(errors.join('\n'));
    },
    removeMaterialAttachment(id) { draft.attachments = materialAttachments(draft).filter(file => file.id !== id); draft.photo = ''; saveTeacherDraft(); teacherRefresh(); },
    previewMaterialAttachment(id) { const file = [...materialAttachments(draft), ...store.tasks.flatMap(materialAttachments)].find(row => row.id === id); if (!file || file.unavailable) return; materialPreview = file; refreshMaterialView(); },
    closeMaterialPreview() { materialPreview = null; refreshMaterialView(); },
    preview() { this.nextCompose(); },
    backToCompose() { teacherMode = 'compose'; composeStep = 1; rosterReviewRequired = false; composeError = ''; teacherRefresh(true); },
    setPublishDemoBranch(value) { if (!['normal', 'network', 'roster'].includes(value)) return; publishDemoBranch = value; composeError = ''; teacherRefresh(); },
    publish() { if (draft.items.some(item => !publishTypes.includes(item.type))) { composeError = '请为每条要求选择提交方式。'; teacherRefresh(); return; } syncDraftTitle(); if (!subjectOptions().includes(draft.subject) || workScope.view === 'school' || teacherMode !== 'preview' || !draft.classIds.length || !draft.classIds.every(id => subjectClassIds(draft.subject).includes(id))) return; if (publishDemoBranch === 'network') { composeError = '发布失败：网络暂不可用。内容已保留，请恢复正常场景后重试。'; teacherRefresh(); return; } if (publishDemoBranch === 'roster' || rosterReviewRequired) { composeError = '发布前接收名单发生变化，请返回核对布置对象，再次预览后发布。'; publishDemoBranch = 'normal'; rosterReviewRequired = true; teacherRefresh(); return; } const seriesId = `task-${Date.now()}`; const count = draft.kind === 'checkin' ? draft.cycleCount : 1; const snapshot = students.filter(row => draft.classIds.includes(row.classId) && (draft.targetMode !== 'selected' || draft.targetStudentIds.includes(row.id))).map(row => row.id); const tasks = Array.from({ length: count }, (_, index) => { const deadline = addDays(draft.deadline, index); const submitDeadline = addDays(draft.submitDeadline, index); return { id: count === 1 ? seriesId : `${seriesId}-cycle-${index + 1}`, seriesId, cycleId: draft.kind === 'checkin' ? `cycle-${index + 1}` : null, kind: draft.kind, subject: draft.subject, schoolId: 'luohu-demo', title: count === 1 ? draft.title.trim() : `${draft.title.trim()} · 第${index + 1}期`, description: draft.description.trim(), photo: draft.photo, attachments: materialAttachments(draft).map(file => ({ ...file })), publishedAt: formatDate(new Date()), deadline, submitDeadline, classIds: [...draft.classIds], targetStudentIds: draft.targetMode === 'selected' ? [...draft.targetStudentIds] : null, targetSnapshotIds: [...snapshot], parentVisible: false, publishedBy: workScope.teacherId, items: draft.items.map(item => ({ ...item, required: true, title: item.title.trim(), instruction: item.instruction.trim() })) }; }); store.tasks.unshift(...tasks); save(); const studentsCount = targetIds(tasks[0]).length; publishedNotice = `已发布给 ${studentsCount} 名学生${count > 1 ? `，共 ${count} 期` : ''}，接收名单已冻结；家长可在作业列表查看。`; draft = newDraft(); subjectTouched = false; try { localStorage.removeItem(DRAFT_KEY + workScope.teacherId); } catch {} composeStep = 0; publishDemoBranch = 'normal'; rosterReviewRequired = false; teacherMode = 'success'; teacherRefresh(true); },
    review(taskId, questionId, correct) { if (workScope.view === 'school' || teacherTaskById(taskId)?.publishedBy !== workScope.teacherId) return; const reason = window.prompt(`请输入改判为“${correct ? '正确' : '错误'}”的原因：`, '教师人工复核'); if (!reason?.trim()) { alert('改判原因不能为空。'); return; } const record = latestRows(store.submissions).find(row => row.taskId === taskId && row.questions?.some(question => question.id === questionId && question.state === 'review')); const question = record?.questions.find(row => row.id === questionId && row.state === 'review'); if (question) { question.reviewHistory = [...(question.reviewHistory || []), { at: new Date().toISOString(), before: question.state, after: 'confirmed', correct, reason: reason.trim(), reviewerId: workScope.teacherId }]; question.correct = correct; question.state = 'confirmed'; save(); teacherRefresh(); } },
    openParent(id) { parentTaskId = id; sharedOpen = false; parentRefresh(true); },
    toParentList() { parentTaskId = ''; parentRefresh(true); },
    changeParentTaskTab(value) { if (!['pending', 'completed', 'ended'].includes(value)) return; parentTaskTab = value; parentTaskTouch = null; parentRefresh(true); },
    taskSwipeStart(event) { if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return; parentTaskTouch = { x: event.clientX, y: event.clientY, id: event.pointerId }; },
    taskSwipeCancel() { parentTaskTouch = null; },
    taskSwipeEnd(event) { const start = parentTaskTouch; parentTaskTouch = null; if (!start || start.id !== event.pointerId) return; const dx = event.clientX - start.x, dy = event.clientY - start.y; if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.3) return; const tabs = ['pending', 'completed', 'ended']; const next = tabs.indexOf(parentTaskTab) + (dx < 0 ? 1 : -1); if (next >= 0 && next < tabs.length) this.changeParentTaskTab(tabs[next]); },
    submit(taskId, itemId) { const task = taskById(taskId); const item = task?.items.find(row => row.id === itemId); if (!task || !item || item.type !== 'none' || !targetIds(task).includes(guardianId)) return; if (Date.now() > toDate(task.submitDeadline).getTime()) { alert('补交已结束，当前任务只可查看。'); return; } submitRecord(task, item, '家长确认已完成'); },
    demoException(type) { const messages = { format: '文件格式不支持，请按老师指定的方式选择 PDF、Word、PPT、Excel、TXT、图片或视频。', size: '文件超过当前类型大小限制，请压缩后重新选择。', duration: '视频超过 5 分钟，请剪辑后重新选择。', network: '网络连接中断，当前选择已保留，请恢复网络后重试。' }; alert(messages[type] || '提交失败，请重试。'); },
    submitFile(taskId, itemId, input) {
      const task = taskById(taskId); const item = task?.items.find(row => row.id === itemId); const file = input.files?.[0];
      if (!task || !item || !file || !targetIds(task).includes(guardianId) || item.type === 'none') return;
      if (Date.now() > toDate(task.submitDeadline).getTime()) { alert('补交已结束，当前任务只可查看。'); return; }
      if (item.type === 'photo' && !file.type.startsWith('image/') || item.type === 'video' && !file.type.startsWith('video/') || item.type === 'audio' && !file.type.startsWith('audio/') || item.type === 'file' && !/\.(pdf|docx?|pptx?|xlsx?|txt)$/i.test(file.name)) { alert(`这一项需要上传${types[item.type]}，请重新选择。`); return; }
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
