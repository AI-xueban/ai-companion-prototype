/* 教师发布—家长逐项提交—教师统计的浏览器演示。数据只保存在当前浏览器。 */
window.homeworkPrototype = (() => {
  const parentDemoPhotos = [
    { name: '练习题.png', file: 'homework-demo-paper.png', detail: '分数练习 · 演示样张' },
    { name: '数学作业-第1页.jpg', file: 'homework-real-page-1.jpg', detail: '看图列式、方程与分数乘法' },
    { name: '数学作业-第2页.png', file: 'homework-real-page-2.png', detail: '分数乘法与应用题' }
  ];
  const KEY = 'ai_companion_homework_preview_v1';
  const grading = window.homeworkGrading;
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
  const renderMaterialPreview = () => !materialPreview ? '' : `<div class="hp-source-mask" onclick="homeworkPrototype.closeMaterialPreview()"><section class="hp-material-preview-sheet" role="dialog" aria-modal="true" aria-label="附件预览" onclick="event.stopPropagation()"><header><strong>${escape(materialPreview.name)}</strong><button type="button" aria-label="关闭附件预览" onclick="homeworkPrototype.closeMaterialPreview()">×</button></header>${materialPreview.type === 'image' ? `<img src="${escape(materialPreview.path)}" alt="${escape(materialPreview.name)}">` : materialPreview.type === 'video' ? `<video src="${escape(materialPreview.path)}" controls playsinline></video>` : `<div class="hp-attachment-document">${escape(materialPreview.name)}<a href="${escape(materialPreview.path)}" ${/\.pdf$/i.test(materialPreview.name) ? 'target="_blank" rel="noopener"' : `download="${escape(materialPreview.name)}"`}>${/\.pdf$/i.test(materialPreview.name) ? '打开文件' : '下载并打开'}</a></div>`}</section></div>`;
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
  const multiQuestionExplanation={
    'multi-photo-q3':'先把 2/3 通分成 4/6，再与 1/6 相加，得到 5/6。',
    'multi-photo-q4':'3/4 等于 6/8；6/8 大于 5/8，所以 3/4 大于 5/8。',
    'multi-photo-q5':'全长的 2/5 是 8 米，因此全长为 8 ÷ (2/5) = 20 米。',
    'multi-photo-q6':'先算 48 ÷ 4 = 12，再算 12 × 3 = 36。'
  };
  const multiQuestionRegion=id=>{const n=Number(/^multi-photo-q([1-6])$/.exec(id)?.[1]);return n?{x:.075,y:(130+(n-1)*154)/1100,width:.85,height:.12}:undefined;};
  const seedQuestions = (task, item, studentId) => {
    if (task.kind !== 'homework' || task.subject !== '数学' || item.type !== 'photo' || item.gradingEnabled === false) return [];
    if((task.id==='grading-demo-v1'||task.id==='homework-console-v1'))return grading.realPhotoQuestions(item.id,item.id+'-');
    const number = Number(studentId.match(/\d+$/)?.[0]) || 1;
    const base = [
      { id: `${item.id}-q1`, label: '第 1 题 · 分数计算', answer: '3/4', answerVersion: 1, studentAnswer: number % 3 !== 0 ? '3/4' : '2/4', correct: number % 3 !== 0, ...grading.demoQuestionContent('q1'), state: number % 13 === 0 ? 'review' : 'confirmed' },
      { id: `${item.id}-q2`, label: '第 2 题 · 应用题', answer: number % 17 === 0 ? '' : '24 人', answerVersion: 1, studentAnswer: number % 4 !== 0 ? '24 人' : '18 人', correct: number % 4 !== 0, ...grading.demoQuestionContent('q2'), state: number % 17 === 0 ? 'no-answer' : number % 11 === 0 ? 'unreadable' : 'confirmed' }
    ];
    if(task.id!=='demo-multi-requirements-v2'||item.id!=='multi-photo')return base;
    const index=targetIds(task).indexOf(studentId);
    const example=(n,label,stem,answer,studentAnswer,states,correct)=>({id:`${item.id}-q${n}`,label:`第 ${n} 题 · ${label}`,stem,answer,answerVersion:1,studentAnswer,state:states[index]||'confirmed',correct:correct[index]??true,analysis:'请先对照学生提交的原图核对题目与作答。',explanation:multiQuestionExplanation[`${item.id}-q${n}`],knowledge:'分数计算与应用'});
    return base.concat([
      example(3,'异分母加法','计算：2/3 + 1/6 =（　）。','5/6','5/6',['confirmed','review','confirmed'],[true,false,false]),
      example(4,'分数比较','比较 3/4 和 5/8 的大小。','3/4 > 5/8','3/4 > 5/8',['unreadable','confirmed','no-answer'],[false,true,false]),
      example(5,'单位“1”判断','判断：一根绳子的 2/5 是 8 米，绳子全长多少米？','20 米','20 米',['queued','processing','confirmed'],[false,false,true]),
      example(6,'分数乘法','计算：48 × 3/4 =（　）。','36','32',['failed','confirmed','review'],[false,false,false])
    ]).map(q=>({...q,region:multiQuestionRegion(q.id)}));
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
  let localPageDemo = null;
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
  // Dedicated cross-role example; existing work and submissions are preserved.
  if (!store.tasks.some(task => task.id === 'grading-demo-v1')) {
    const deadline = addDays(formatDate(new Date()), 2);
     const task = { id:'grading-demo-v1', title:'分数计算与应用题', subject:'数学', kind:'homework', classIds:['c1','c2'], targetStudentIds:null, targetSnapshotIds:students.map(s=>s.id), description:'完成两页分数练习，每页分别拍照提交。', deadline, submitDeadline:addDays(deadline,7), parentVisible:false, publishedAt:addDays(deadline,-3), publishedBy:'teacher-demo-001', items:[1,2].map(n=>({id:'grading-page-'+n,title:'第 '+n+' 页练习',instruction:'拍摄完整答题页',type:'photo',gradingEnabled:true})) };
    store.tasks.push(task);
    targetIds(task).forEach((studentId,i)=>{if(i%6===0&&!schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS.includes(studentId))return;task.items.forEach(item=>store.submissions.push({taskId:task.id,itemId:item.id,studentId,label:'分数练习作业原图',media:'',submittedAt:addDays(deadline,-2),submittedBy:'guardian-demo-001',mock:true,version:1,questions:seedQuestions(task,item,studentId)}));});
  }
  store.submissions.filter(row=>row.mock).forEach(row=>(row.questions||[]).forEach(q=>{if(!q.stem)Object.assign(q,grading.demoQuestionContent(q.id));}));
  store.submissions.filter(row=>row.mock&&row.taskId==='demo-multi-requirements-v2'&&row.itemId==='multi-photo').forEach(row=>(row.questions||[]).forEach(q=>{const explanation=multiQuestionExplanation[q.id],generic=`参考答案：${q.answer}。AI 判定仅供参考。`;if(explanation&&q.explanation===generic)q.explanation=explanation;if(explanation&&q.aiExplanation===generic)q.aiExplanation=explanation;if(!q.region)q.region=multiQuestionRegion(q.id);}));
  store.submissions.filter(row=>['grading-demo-v1','homework-console-v1'].includes(row.taskId)&&row.mock).forEach(row=>{if(!row.questions?.some(q=>q.label.startsWith('第 21 题')||q.label.startsWith('第 23 题'))){const task=store.tasks.find(t=>t.id===row.taskId),item=task.items.find(i=>i.id===row.itemId);row.questions=seedQuestions(task,item,row.studentId);}});
  // Repair seeded records only; user uploads and teacher corrections remain intact.
  function reconcileMockData(data){
    const report={removed:0,clearedGrades:0};
    data.submissions=data.submissions.filter(record=>{
      if(!record.mock)return true;
      const task=data.tasks.find(t=>t.id===record.taskId),item=task?.items.find(i=>i.id===record.itemId);
      if(!task||!item||!targetIds(task).includes(record.studentId)){report.removed++;return false;}
      if((task.kind!=='homework'||task.subject!=='数学'||item.type!=='photo')&&record.questions?.length){record.questions=[];report.clearedGrades++;}
      if(item.type==='none'){record.label='家长确认已完成';record.media='';}
      return true;
    });
    return report;
  }
  reconcileMockData(store);
  // One coherent four-requirement example: 2 complete, 1 partial, 1 missing.
  if(!store.tasks.some(t=>t.id==='demo-multi-requirements-v2')){
    const ids=students.filter(s=>s.classId==='c1').slice(0,4).map(s=>s.id),now=formatDate(new Date()),deadline=addDays(now,2);
     const task={id:'demo-multi-requirements-v2',title:'数学作业 · 四项要求演示',subject:'数学',kind:'homework',schoolId:'luohu-demo',classIds:['c1'],targetStudentIds:ids,targetSnapshotIds:ids,publishedBy:'teacher-demo-001',publishedAt:now,deadline,submitDeadline:addDays(deadline,7),description:'巩固分数知识，完成以下 4 项要求。',items:[{id:'multi-photo',title:'完成数学练习第 3 页',type:'photo',gradingEnabled:true},{id:'multi-video',title:'选择一道错题，录制 1 分钟讲解视频',type:'video'},{id:'multi-file',title:'填写练习文档并上传文件',type:'file'},{id:'multi-confirm',title:'完成 20 分钟课外阅读，由家长确认',type:'none'}].map(i=>({...i,required:true,instruction:i.title}))};
    store.tasks.unshift(task);
    ids.slice(0,3).forEach((studentId,index)=>task.items.filter((item,itemIndex)=>index<2||itemIndex===0||itemIndex===3).forEach(item=>store.submissions.push({taskId:task.id,itemId:item.id,studentId,submittedAt:now,submittedBy:'guardian-demo-001',label:item.type==='none'?'家长确认已完成':'演示提交记录（无真实附件）',media:'',mock:true,version:1,questions:seedQuestions(task,item,studentId)})));
  }
  // Extend only the seeded photo records; preserve uploads and any teacher changes to existing questions.
  const multiDemo=store.tasks.find(task=>task.id==='demo-multi-requirements-v2');
  if(multiDemo){const photo=multiDemo.items.find(item=>item.id==='multi-photo');store.submissions.filter(row=>row.taskId===multiDemo.id&&row.itemId===photo?.id&&row.mock).forEach(row=>{row.questions||=[];seedQuestions(multiDemo,photo,row.studentId).slice(2).forEach(question=>{if(!row.questions.some(existing=>existing.id===question.id))row.questions.push(question);});});}
  const multiDemoPaper=(()=>{const questions=[['分数计算','计算：1/2 + 1/4 =（　）。'],['应用题','学校合唱队有 40 名学生，其中男生占 3/5，','男生有多少人？'],['','计算：2/3 + 1/6 =（　）。'],['分数比较','比较 3/4 和 5/8 的大小。'],['单位“1”判断','判断：一根绳子的 2/5 是 8 米，绳子全长多少米？'],['分数乘法','计算：48 × 3/4 =（　）。']];const lines=questions.map(([title,stem,extra],i)=>{const top=166+i*154;return `<text x="65" y="${top}" font-size="20" font-weight="700">${title?`${i+1}. ${title}`:stem}</text>${title?`<text x="65" y="${top+37}" font-size="20">${stem}</text>`:''}${extra?`<text x="65" y="${top+67}" font-size="20">${extra}</text>`:''}<path d="M65 ${top+84}H655" stroke="#e3ebf0" stroke-width="2"/>`;}).join('');return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1100" viewBox="0 0 720 1100"><rect width="720" height="1100" fill="#eaf0f3"/><rect x="32" y="24" width="656" height="1052" rx="8" fill="#fff" stroke="#d7e3eb" stroke-width="2"/><g font-family="Microsoft YaHei, PingFang SC, sans-serif" fill="#27445a"><text x="65" y="76" font-size="27" font-weight="700">数学练习 · 第 3 页</text><text x="65" y="108" font-size="17" fill="#7a91a1">按题完成计算与应用</text>${lines}<text x="65" y="1050" font-size="15" fill="#9baeba">原型演示题目页</text></g></svg>`);})();
  const samplePhoto = record => record.taskId==='demo-multi-requirements-v2'&&record.itemId==='multi-photo'?multiDemoPaper:record.media||(typeof location!=='undefined'&&location.protocol==='file:'?'../miniprogram':'miniprogram')+grading.demoPhotoPath(record.itemId);
   store.tasks.find(task=>task.id==='guardian-demo-status-v1-pending-math')?.items.forEach(item=>{if(item.type==='photo')item.gradingEnabled=true;});
   store.tasks.forEach(task=>task.items.forEach(item=>{if(item.gradingEnabled===undefined)item.gradingEnabled=task.kind==='homework'&&item.type==='photo'&&store.submissions.some(row=>row.taskId===task.id&&row.itemId===item.id&&row.questions?.length);if(item.type!=='photo')item.gradingEnabled=false;}));
   // Repair two unsubmitted demo tasks created with mismatched sample submit types.
   store.tasks.filter(task=>/^10月(?:20|21)日（周[二三]）数学任务$/.test(task.title)&&task.items.length===4&&!store.submissions.some(row=>row.taskId===task.id)).forEach(task=>task.items.forEach(item=>{
     const expected=/家长确认/.test(item.title)?'none':/视频/.test(item.title)?'video':/文档|文件/.test(item.title)?'file':/拍照|图片/.test(item.title)?'photo':'';
     if(expected&&item.type!==expected){item.type=expected;item.gradingEnabled=false;}
   }));
   const currentSample=store.tasks.find(t=>t.id==='grading-demo-v1');if(currentSample)currentSample.needsAnswerConfirmation=true;
  store.tasks.filter(t=>t.needsAnswerConfirmation).forEach(t=>{const records=latestRows(store.submissions.filter(r=>r.taskId===t.id));grading.initializeAnswerStandards(t,records);});
  const save = () => { if(localPageDemo?.snapshot)return; try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* 大图片超过浏览器本地容量时仍保留本次演示状态 */ } };
  const sessionMedia = new Map();
  const mediaKey = row => `${row.taskId}:${row.itemId}:${row.studentId}`;
  const mediaFor = row => row.media || sessionMedia.get(mediaKey(row)) || '';
  save();
   const newItem = () => ({ id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: '', instruction: '', type: '', gradingEnabled: false });
  const defaultDeadline = () => { const date = new Date(); date.setDate(date.getDate() + 2); date.setHours(20, 0, 0, 0); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 20:00`; };
  const newDraft = () => { const deadline = defaultDeadline(); return { kind: 'homework', subject: '数学', title: '', description: '', photo: '', attachments: [], deadline, submitDeadline: addDays(deadline, 7), cycleCount: 1, classIds: ['c1'], targetMode: 'all', targetStudentIds: [], parentVisible: false, items: [newItem()] }; };
  let teacherMode = 'list';
  let gradeUI = { page:0, q:'', wrongOnly:false, parentOpen:false, origin:'detail' };
  let recipientClassId='',recipientSearch='';
  let answerExpanded='',answerError='';
  let gradeReleaseOpen = false;
  let gradeReviewDraft = null;
  let teacherTaskId = '';
  let teacherFilter = 'all';
  let teacherQuestionId = '';
  let teacherQuestionSource = 'photo';
  let teacherStudentId = '';
  let detailClassId = 'all';
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
  let parentPhotoSource = null;
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
  const teacherTask = task => task && ({ ...task, targetSnapshotIds: task.targetSnapshotIds?.filter(id=>students.some(student=>student.id===id&&workScope.classIds.includes(student.classId))), classIds: task.classIds.filter(id => workScope.classIds.includes(id)), targetStudentIds: task.targetStudentIds?.filter(id => students.some(student => student.id === id && workScope.classIds.includes(student.classId))) || null });
  const detailTaskBase = task => {const allowed=workScope.view==='subject'?subjectClassIds(task.subject||'数学'):workScope.classIds;return {...task,classIds:task.classIds.filter(id=>allowed.includes(id)),targetSnapshotIds:task.targetSnapshotIds?.filter(id=>students.some(s=>s.id===id&&allowed.includes(s.classId))),targetStudentIds:task.targetStudentIds?.filter(id=>students.some(s=>s.id===id&&allowed.includes(s.classId)))||null};};
  const teacherTaskById = id => { const task = taskById(id); return task && detailTaskBase(task).classIds.length && (workScope.view === 'school' || task.publishedBy === workScope.teacherId) ? (()=>{const scoped=id===teacherTaskId?detailTaskBase(task):teacherTask(task);return id===teacherTaskId&&detailClassId!=='all'&&scoped.classIds.includes(detailClassId)?{...scoped,classIds:[detailClassId],targetSnapshotIds:scoped.targetSnapshotIds?.filter(id=>students.some(student=>student.id===id&&student.classId===detailClassId)),targetStudentIds:scoped.targetStudentIds?.filter(id=>students.some(student=>student.id===id&&student.classId===detailClassId))||null}:scoped;})() : null; };
  const submissionsFor = task => latestRows(store.submissions.filter(row => row.taskId === task.id && targetIds(task).includes(row.studentId)));
  function summary(task) {
    const targets = targetIds(task);
    const submissions = submissionsFor(task);
    const completed = targets.filter(studentId => task.items.filter(item=>item.required!==false).every(item => submissions.some(row => row.studentId === studentId && row.itemId === item.id))).length;
    const partial = targets.filter(studentId => submissions.some(row => row.studentId === studentId) && !task.items.filter(item=>item.required!==false).every(item => submissions.some(row => row.studentId === studentId && row.itemId === item.id))).length;
     const questions = submissions.filter(row=>task.items.some(item=>item.id===row.itemId&&item.type==='photo'&&item.gradingEnabled===true)).flatMap(row => row.questions || []).filter(q=>q.mappingConfirmed!==false);
    const confirmed = questions.filter(grading.isFormalGrade);
    const questionRows = [...new Set(questions.map(row => row.id))].map(id => {
      const rows = questions.filter(row => row.id === id);
      const valid = rows.filter(grading.isFormalGrade);
      return { id, ...grading.gradingStatistics(rows), wrong: valid.filter(q=>!q.correct).length, pending:rows.filter(q=>['queued','processing'].includes(q.state)).length, queued:rows.filter(q=>q.state==='queued').length, processing:rows.filter(q=>q.state==='processing').length, failed:rows.filter(q=>q.state==='failed').length, unanswered:rows.filter(q=>q.state==='unanswered').length, label: (task.items.find(i=>submissions.some(s=>s.itemId===i.id&&s.questions?.some(q=>q.id===id)))?.title||'作业')+' · '+rows[0].label, answer: rows[0].answer, valid: valid.length, correct: valid.filter(row => row.correct).length, review: rows.filter(row => row.state === 'review').length, unreadable: rows.filter(row => row.state === 'unreadable').length, noAnswer: rows.filter(row => row.state === 'no-answer').length };
    });
    return { target: targets.length, completed, partial, missing: targets.length - completed - partial, rate: targets.length ? Math.round(completed / targets.length * 100) : 0, graded: confirmed.length, correct: confirmed.filter(row => row.correct).length, ...grading.gradingStatistics(questions), review: questions.filter(row => row.state === 'review').length, unreadable: questions.filter(row => row.state === 'unreadable').length, noAnswer: questions.filter(row => row.state === 'no-answer').length, questionRows };
  }
  const resizeDescription = () => { if (typeof document === 'undefined' || !document.querySelector) return; const field = document.querySelector('.hp-paste-area'); if (!field) return; field.style.height = 'auto'; field.style.height = `${Math.min(320, Math.max(112, field.scrollHeight + 2))}px`; field.style.overflowY = field.scrollHeight > 318 ? 'auto' : 'hidden'; };
  const teacherRefresh = (reset = false) => { const top = typeof document === 'undefined' || reset ? 0 : document.getElementById('teacher-tab-panel')?.scrollTop || 0; if (typeof teacherDesk === 'function') teacherDesk(); resizeDescription(); if (typeof document !== 'undefined') { const panel = document.getElementById('teacher-tab-panel'); if (panel) panel.scrollTop = top; } };
  const clearComposeError = () => { composeError = ''; if (typeof document !== 'undefined') { const error = document.querySelector('.hp-error'); if (error) error.remove(); } };
  const parentRefresh = (reset = false) => { const top = typeof document === 'undefined' || reset ? 0 : document.querySelector('.parent-main')?.scrollTop || 0; window.parentPrototype?.render(); if (typeof document !== 'undefined') { const panel = document.querySelector('.parent-main'); if (panel) panel.scrollTop = top; } };
  function teacherList() {
    const tasks = filteredListTasks();
    const due = tasks.filter(task => new Date(task.deadline.replace(' ', 'T')).getTime() <= Date.now());
    const homework = due.filter(task => task.kind === 'homework').map(task => summary(listTask(task)));
    const checkins = due.filter(task => task.kind === 'checkin').map(task => summary(listTask(task)));
    const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
    return `<div class="hp-hero"><span class="hp-eyebrow">${workScope.view === 'school' ? '学校管理员 · 只读' : workScope.view === 'homeroom' ? '班主任 · 本班' : '任课老师 · 数学'}</span><h1>作业与打卡</h1><p>查看作业进度与逐项提交。</p></div>${workScope.view === 'school' ? `<div class="hp-stats"><section><b>${homework.length}</b><span>已截止作业</span></section><section><b>${sum(homework, 'completed')}/${sum(homework, 'target')}</b><span>整份完成</span></section><section><b>${sum(checkins, 'completed')}/${sum(checkins, 'target')}</b><span>打卡完成</span></section></div><p class="hp-muted">进行中 ${tasks.length - due.length} 期；作业与打卡分别统计。</p>` : `<button class="hp-primary hp-publish-entry" onclick="homeworkPrototype.compose()">${hasTeacherDraft() ? '草稿 · 继续编辑' : '＋ 发布作业或打卡'}</button>${hasTeacherDraft() ? '<p class="hp-muted">发布内容已自动保存在草稿中，尚未发送给学生。</p>' : ''}`}<h2 class="hp-section">范围内任务</h2>${tasks.map(original => { const task = teacherTask(original); const stat = summary(task); return `<button class="hp-card hp-task" onclick="homeworkPrototype.openTeacher('${task.id}',true)"><span class="hp-line"><strong><span class="hp-list-subject">${escape(task.subject||'综合')}</span>${escape(task.title)}</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'}</em></span><small>共 ${task.items.length} 项 · ${escape([...new Set(task.items.map(item=>typeLabel(item.type)))].join('、'))}</small><small>${escape(task.classIds.map(id => classes.find(row => row.id === id)?.name).join('、'))} · 截止 ${escape(task.deadline)} · ${new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now() ? '进行中' : '已截止'}</small><span class="hp-line hp-task-bottom"><span>完成 ${stat.completed} / ${stat.target}</span><b>${stat.rate}% ›</b></span></button>`; }).join('') || '<section class="hp-card hp-muted">当前范围暂无任务。</section>'}`;
  }
  const filterTitle = { all: '全部学生', completed: '已完成学生', partial: '未交齐学生', missing: '未交齐学生', wrong: '做错学生', questionWrong: '本题做错学生' };
  function studentRows(task) {
    return targetIds(task).map(id => {
      const student = students.find(row => row.id === id);
      const records = submissionsFor(task).filter(row => row.studentId === id && task.items.some(item=>item.id===row.itemId));
      const required = task.items.filter(item => item.required !== false);
      const status = required.every(item => records.some(row => row.itemId === item.id)) ? 'completed' : !records.length ? 'missing' : 'partial';
      return { missingItems:required.filter(item=>!records.some(record=>record.itemId===item.id)), id, name: student?.name || id, classId: student?.classId || '', records, status, wrong: records.flatMap(row => row.questions || []).filter(row => grading.isFormalGrade(row) && !row.correct), latest: records.map(row => row.submittedAt || '').sort().pop() || '' };
    });
  }
  function detailClassSelector(){
    const original=taskById(teacherTaskId),base=original&&detailTaskBase(original);if(!base||base.classIds.length<2)return '';
    const options=[{id:'all',name:'全部班级',task:base},...base.classIds.map(id=>({id,name:classes.find(c=>c.id===id)?.name||id,task:{...base,classIds:[id],targetSnapshotIds:base.targetSnapshotIds?.filter(sid=>students.some(s=>s.id===sid&&s.classId===id)),targetStudentIds:base.targetStudentIds?.filter(sid=>students.some(s=>s.id===sid&&s.classId===id))||null}}))];
    return '<section class="hp-detail-classes"><div role="group" aria-label="本作业班级范围">'+options.map(option=>{const stat=summary(option.task);return '<button aria-pressed="'+(detailClassId===option.id)+'" class="'+(detailClassId===option.id?'active':'')+'" onclick="homeworkPrototype.selectDetailClass(&quot;'+option.id+'&quot;)"><strong>'+escape(option.name)+(option.id==='all'?' · '+base.classIds.length+'个班':'')+'</strong><small>已交 '+stat.completed+'/'+stat.target+' 人</small></button>';}).join('')+'</div></section>';
  }
  function teacherTaskOverview(task, stat) {
    const classLabel=task.classIds.map(id=>classes.find(row=>row.id===id)?.name||id).join('、');
    return `<section class="hp-card hp-task-brief"><div class="hp-task-title-row"><strong>${escape(task.title)}</strong><button class="hp-reference-shortcut" onclick="homeworkPrototype.openReferences()">参考资料 ›</button></div><small class="hp-brief-class">${escape(classLabel)}</small><div class="hp-brief-content"><p>${escape(briefDescription(task)||'请完成以下各项要求')}</p>${renderMaterialAttachments(task)}</div><div class="hp-brief-dates"><span>截止时间</span><time>${escape(task.deadline)}</time>${task.submitDeadline&&task.submitDeadline!==task.deadline?`<span>补交截止</span><time>${escape(task.submitDeadline)}</time>`:''}</div><div class="hp-submission-line"><button onclick="homeworkPrototype.openStudents('completed')">已交齐 <b>${stat.completed}</b> 人 ›</button><button onclick="homeworkPrototype.openStudents('missing')">未交齐 <b>${stat.target-stat.completed}</b> 人 ›</button><button aria-label="查看全部提交名单" onclick="homeworkPrototype.openStudents('all')">名单 ›</button></div></section>`;
  }

  function taskRequirementList(task){
    const rows=submissionsFor(task);
    return `<section class="hp-card hp-requirement-overview"><strong>作业要求 · 共 ${task.items.length} 项</strong>${task.items.map((item,index)=>{
      const count=new Set(rows.filter(row=>row.itemId===item.id).map(row=>row.studentId)).size;
      const graded=item.gradingEnabled===true&&item.type==='photo';
      const questions=rows.filter(row=>row.itemId===item.id).flatMap(row=>row.questions||[]);
      const pending=questions.filter(q=>q.state==='review').length;
      const description=`${typeLabel(item.type)} · ${item.type==='none'?'已完成':'已交'} ${count}/${targetIds(task).length} 人${item.required===false?' · 选交':''}`;
      return `<div class="hp-requirement-entry"><i>${index+1}</i><div class="hp-requirement-content"><strong>${escape(item.title)}</strong><small>${escape(description)}</small>${item.type==='photo'?`<small class="hp-item-grading ${graded?'active':''}">${graded?`AI 批改${pending?` · 待复核 ${pending} 题次`:''}`:'仅收集图片'}</small>`:''}</div><div class="hp-requirement-actions"><button type="button" onclick="homeworkPrototype.openItemStudents('${item.id}')">查看提交</button>${graded?`<button type="button" class="hp-grade-link" onclick="homeworkPrototype.openQuestionResults('${item.id}')">查看批改 ›</button>`:''}</div></div>`;
    }).join('')}</section>`;
  }
  let rosterItemId='';
  const pageKey = role => role+':'+(role==='teacher'?teacherMode+(teacherMode==='student'||teacherMode==='result'?':'+teacherStudentId:'')+(teacherMode==='question'?':'+teacherQuestionId:''):gradeUI.parentOpen?'result':'detail')+':'+(role==='teacher'?teacherTaskId+':'+detailClassId:parentTaskId);
  function restoreLocalDemo(){if(!localPageDemo)return;const snap=localPageDemo.snapshot;if(snap){store.tasks=store.tasks.map(task=>task.id===snap.task.id?JSON.parse(JSON.stringify(snap.task)):task);store.submissions=[...store.submissions.filter(r=>r.taskId!==snap.task.id),...JSON.parse(JSON.stringify(snap.submissions))];}publishDemoBranch='normal';rosterReviewRequired=false;composeError=localPageDemo.composeError||'';localPageDemo=null;}
  function checkLocalDemo(role){if(localPageDemo&&localPageDemo.key!==pageKey(role))restoreLocalDemo();}
  function pageDemoContext(role){
    const mode=role==='teacher'?teacherMode:parentTaskId?gradeUI.parentOpen?'result':'detail':'list';
    const task=taskById(role==='teacher'?teacherTaskId:parentTaskId);
    const closed=task&&Date.now()>toDate(task.submitDeadline).getTime();
    const cases=[];
    if(mode==='preview')cases.push(['publish-network','发布失败','网络异常，保留当前发布内容。','异常情况'],['publish-roster','接收名单变化','阻止发布，返回核对接收对象。','异常情况']);
    if(mode==='list')cases.push(['empty','暂无作业','当前列表为空，不删除已有任务。','业务状态'],['load-failed','列表加载失败','显示失败提示，可恢复原列表。','异常情况']);
    if(task&&['detail','student','question','result'].includes(mode)){
      if(mode==='detail')cases.push(['published','未提交','预览当前作业的未提交状态。','业务状态'],['partial','部分提交','预览仅提交一项的情况。','业务状态'],['late','逾期可补交','原截止已过，仍允许补交。','业务状态'],['closed','补交已结束','停止提交，保留历史。','业务状态']);
      const hasResults=store.submissions.some(r=>r.taskId===task.id&&r.questions?.length);
      if(hasResults)cases.push(...[['queued','等待批改','提交成功，等待后台处理。'],['processing','正在批改','展示后台预估等待时间。'],['partialGrade','部分批改完成','已完成题与处理中题分别显示。'],['failed','批改失败','保留已完成结果，失败题不计错。'],['review','待教师复核','低把握判定等待教师核对。'],['unreleased','结果已同步','当前已有结果自动同步。'],['partialRelease','部分结果可见','已完成结果可见，其他题继续处理。'],['released','全部批改完成','查看当前学生整份已开放结果。'],['resubmit','重新提交后批改中','新版本不继承旧版开放状态。'],['changed','人工纠正已同步','人工新判定自动同步。']].map(([id,title,hint])=>[id,title,hint,id==='failed'?'异常情况':'业务状态']));
      if(role==='parent'&&mode==='detail'&&!closed){const uploads=task.items.filter(i=>i.type!=='none');if(uploads.length)cases.push(['upload-format','格式不支持','保留已选文件，提示重新选择。','异常情况'],['upload-size','文件过大','提示当前提交类型大小限制。','异常情况']);if(uploads.some(i=>i.type==='video'))cases.push(['upload-duration','视频时长超限','提示视频时长不能超过 5 分钟。','异常情况']);cases.push(['upload-network','提交时网络中断','当前选择保留，恢复后可重试。','异常情况']);}
    }
    if(role==='teacher'&&mode==='question'){const allowed=['queued','processing','partialGrade','failed','review'];for(let i=cases.length-1;i>=0;i--)if(!allowed.includes(cases[i][0]))cases.splice(i,1);}
    if(role==='teacher'){const index=cases.findIndex(c=>c[0]==='partial');if(index>=0)cases.splice(index,1);}
    return {key:pageKey(role),role,mode,taskId:task?.id||'',title:mode==='preview'?'核对发布内容':mode==='result'?'整份批改结果':mode==='question'?'单题批改结果':mode==='list'?'作业列表':'作业详情',choices:localPageDemo?.key===pageKey(role)?localPageDemo.choices:cases,active:localPageDemo?.key===pageKey(role)?localPageDemo.id:'',label:localPageDemo?.label||''};
  }
  function localDemoNotice(role){return localPageDemo?.key===pageKey(role)&&localPageDemo.message?'<section class="hp-card hp-page-demo-error" role="status">'+escape(localPageDemo.message)+'</section>':'';}
  function decoratePageDemo(html,role){checkLocalDemo(role);if(localPageDemo?.key!==pageKey(role))return html;if(localPageDemo.id==='empty')return '<section class="hp-card hp-muted">当前暂无作业</section>';if(localPageDemo.id==='load-failed')return '<section class="hp-card hp-page-demo-error">作业加载失败，请稍后重试。<button class="hp-secondary" onclick="homeworkPrototype.restorePageDemo(\''+role+'\')">重新加载</button></section>';return localDemoNotice(role)+html;}

   const gradeQuestions = task => submissionsFor(task).filter(row=>task.items.some(item=>item.id===row.itemId&&item.gradingEnabled===true&&item.type==='photo')).flatMap(r=>r.questions||[]);
  const gradeStatus = (task, records, parent=false) => {
    const progress=grading.gradingProgress(records.flatMap(r=>r.questions||[]),parent);
    if(!progress.total)return '';
    return '<section class="hp-grade-status"><strong>'+escape(progress.title)+'</strong><small>'+(progress.pending?'提交已成功，可离开页面稍后查看；完成时间以实际批改结果为准。':parent?'AI 判定供参考，教师纠正后自动同步。':'待复核、识别不清和无可靠答案不计入有效判定。')+'</small></section>';
  };
  const canRelease = task => workScope.view!=='school'&&task.publishedBy===workScope.teacherId;
  function gradeDemoControls() { return ''; }
  const standardRecords=task=>latestRows(store.submissions.filter(r=>r.taskId===task.id&&targetIds(taskById(task.id)).includes(r.studentId)));
  const workflowTask=task=>taskById(task.id);
  function syncAnswerWorkflow(task,conflicts=false){const base=workflowTask(task);if(!base?.needsAnswerConfirmation)return;const records=standardRecords(base);grading.initializeAnswerStandards(base,records,conflicts);}
  // Reference files are teacher-authored material, never copied from a student's AI response.
  let referenceEdit=null,referenceExpanded='',workflowNotice='',batchReview={key:'',selected:{},choice:''},mappingChoice=null;
  const referenceOwner=id=>id==='draft'?draft:taskById(id);
  const editReferenceAllowed=id=>id==='draft'?teacherMode==='compose'&&workScope.view!=='school':!!teacherTaskById(id)&&canRelease(teacherTaskById(id));
  const referenceVisible=(task,parent)=>!parent||(targetIds(task).includes(guardianId)&&Number.isFinite(toDate(task.deadline).getTime())&&Date.now()>=toDate(task.deadline).getTime());
  function workflowCommit(change){
    const snapshot=JSON.stringify(store);
    try{change();if(!localPageDemo?.snapshot)localStorage.setItem(KEY,JSON.stringify(store));return true;}
    catch{store=JSON.parse(snapshot);workflowNotice='保存失败，尚未更新。请重试。';return false;}
  }
  function referenceLibrary(task,parent=false,questionId=null){
    const owner=task.id||'draft',files=task.referenceMaterials||[],editable=!parent&&editReferenceAllowed(owner);
    const visibleFiles=questionId===null?files:files.filter(f=>f.questionId===questionId);
    if(!editable&&!visibleFiles.length)return '';
    const fold=questionId===null||questionId==='';
    if(!referenceVisible(task,parent))return '<section class="hp-card hp-muted">教师参考资料 · 首次截止后可查看</section>';
    const questions=task.id?[...new Map(gradeQuestions(teacherTaskById(task.id)||task).filter(q=>q.mappingConfirmed!==false).map(q=>[q.id,q])).values()]:[];
    return `<${fold?'details':'section'} class="hp-card hp-reference-library" ${referenceEdit?.owner===owner||referenceExpanded===owner?'open':''}>${fold?'<summary>教师参考资料 · '+files.length+' 份</summary>':''}<span class="hp-line"><strong>教师参考资料${editable?'（选填）':''}</strong>${editable?`<button class="hp-text-button" onclick="homeworkPrototype.editReference('${owner}')">＋ 添加</button>`:''}</span><small>${parent?'老师提供 · 与 AI 批改结果独立':'整份保存，按需关联题目；首次截止后家长可见。'}</small>${visibleFiles.map(file=>{
      if(file.path)restoreMaterialFile(file);
      return `<div class="hp-reference-entry"><strong>${escape(file.name)}</strong><small>${file.questionId?'对应：'+escape(file.questionLabel):'整份参考资料 · 未逐题关联'}</small>${file.text?`<p class="hp-reference-text">${escape(file.text)}</p>`:''}${file.path?`<button class="hp-secondary" ${file.unavailable?'disabled':''} onclick="homeworkPrototype.previewReference('${owner}','${file.id}',${parent})">${file.unavailable?'文件失效，请老师重新上传':'查看原资料'}</button>`:''}${editable?`<div class="hp-line"><button class="hp-text-button" onclick="homeworkPrototype.editReference('${owner}','${file.id}')">编辑 / 关联题目</button><button class="hp-text-button" onclick="homeworkPrototype.removeReference('${owner}','${file.id}')">删除</button></div>`:''}</div>`;
    }).join('')||'<p class="hp-muted">可以不提供，不影响学生提交与批改。</p>'}${editable&&referenceEdit?.owner===owner?`<div class="hp-reference-editor"><label>资料标题<input aria-label="参考资料标题" value="${escape(referenceEdit.name)}" oninput="homeworkPrototype.referenceField('name',this.value)"></label><label>答案或说明<textarea aria-label="参考答案内容" oninput="homeworkPrototype.referenceField('text',this.value)">${escape(referenceEdit.text)}</textarea></label><label class="hp-upload">${referenceEdit.path?'替换附件':'上传图片、视频或文档'}<input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt" onchange="homeworkPrototype.uploadReference(this)"></label>${referenceEdit.path?`<small>${escape(referenceEdit.fileName||'已添加附件')}</small>`:''}<label>关联题目<select aria-label="参考资料关联题目" onchange="homeworkPrototype.referenceField('questionId',this.value)"><option value="">整份资料，暂不关联</option>${questions.map(q=>`<option value="${escape(q.id)}" ${q.id===referenceEdit.questionId?'selected':''}>${escape(q.label)}</option>`).join('')}</select></label><small>选择题目表示已核对资料与该题对应，不会改变批改结果。</small><div class="hp-line"><button class="hp-text-button" onclick="homeworkPrototype.cancelReference()">取消</button><button class="hp-secondary" ${referenceEdit.loading?'disabled':''} onclick="homeworkPrototype.saveReference()">${referenceEdit.loading?'上传中…':'保存资料'}</button></div></div>`:''}${editable&&workflowNotice?`<p class="hp-muted" role="status">${escape(workflowNotice)}</p>`:''}</${fold?'details':'section'}>`;
  }
  function batchContext(studentId){
    const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return null;
    const record=submissionsFor(task).find(r=>r.studentId===studentId&&r.questions?.some(q=>q.id===teacherQuestionId));
    const q=record?.questions.find(q=>q.id===teacherQuestionId);
    if(!q||!['confirmed','review','unreadable','no-answer'].includes(q.state))return null;
    return {task,record,q,src:record.mock?samplePhoto(record):mediaFor(record)};
  }
  function batchKey(){return [teacherTaskId,teacherQuestionId,detailClassId,teacherFilter,workScope.teacherId].join(':');}
  function batchChoice(row){
    if(!batchContext(row.id))return '';
    if(batchReview.key!==batchKey())batchReview={key:batchKey(),selected:{},choice:''};
    return `<label class="hp-batch-check"><input type="checkbox" ${batchReview.selected[row.id]?'checked':''} onchange="homeworkPrototype.toggleBatchStudent('${row.id}')">已看原图，选中这位学生</label>`;
  }
  function batchToolbar(){
    const ids=Object.keys(batchReview.selected),holdOnly=ids.some(id=>!batchReview.selected[id].reviewed);if(batchReview.key!==batchKey()||!ids.length)return workflowNotice?`<p role="status" class="hp-muted">${escape(workflowNotice)}</p>`:'';
    return `<section class="hp-batch-toolbar" aria-label="批量判定"><span class="hp-line"><strong>已选 ${ids.length} 人</strong><button class="hp-text-button" onclick="homeworkPrototype.clearBatch()">取消选择</button></span><small>${escape(ids.map(id=>students.find(s=>s.id===id)?.name||id).join('、'))}</small><div class="hp-inline-verdict">${[['right','判对'],['wrong','判错'],['hold','暂缓']].map(([v,label])=>`<button ${holdOnly&&v!=='hold'?'disabled':''} class="${batchReview.choice===v?'selected':''}" onclick="homeworkPrototype.chooseBatch('${v}')">${label}</button>`).join('')}</div>${batchReview.choice?`<button class="hp-primary" onclick="homeworkPrototype.saveBatch()">保存 ${ids.length} 人的${{right:'判对',wrong:'判错',hold:'暂缓'}[batchReview.choice]}结果</button>`:''}${workflowNotice?`<p role="status">${escape(workflowNotice)}</p>`:''}</section>`;
  }
  function rememberReview(){
    if(!teacherTaskId||!teacherQuestionId)return;
    store.reviewPositions||={};store.reviewPositions[workScope.teacherId+':'+teacherTaskId]={questionId:teacherQuestionId,filter:teacherFilter,classId:detailClassId,studentId:gradeReviewDraft?.studentId||''};save();
  }
  function resumeReview(task){const position=store.reviewPositions?.[workScope.teacherId+':'+task.id];return position?`<button class="hp-secondary hp-resume" onclick="homeworkPrototype.resumeReview()">继续上次查看的题目 ›</button>`:'';}
  function parentFeedback(q){return `<section class="hp-feedback"><button class="hp-text-button" onclick="homeworkPrototype.reportGradeIssue()">${q.parentFeedback?.status==='pending'?'已反馈，等待老师查看':q.parentFeedback?.status==='resolved'?'老师已处理 · 仍有疑问':'这道题可能批错了'}</button><small>${q.parentFeedback?.status==='pending'?'反馈已记录，原判定不会自动改变。':''}</small></section>`;}
  function unmatchedQuestions(task){
    const rows=submissionsFor(task).filter(record=>task.items.some(item=>item.id===record.itemId&&item.gradingEnabled===true&&item.type==='photo')).flatMap(record=>(record.questions||[]).filter(q=>q.mappingConfirmed===false).map(q=>({record,q})));if(!rows.length)return '';
    const choices=[...new Map(gradeQuestions(task).filter(q=>q.mappingConfirmed!==false).map(q=>[q.id,q])).values()];
    return `<details class="hp-card"><summary>有 ${rows.length} 份作答待确认题目对应</summary><small>个人结果保留，暂不计入班级同题比例。</small>${rows.map(({record,q})=>{const src=record.mock?samplePhoto(record):mediaFor(record);return `<div class="hp-reference-entry"><strong>${escape(students.find(s=>s.id===record.studentId)?.name)} · ${escape(q.label)}</strong>${src?`<a href="${escape(src)}" target="_blank" rel="noopener"><img class="hp-original" src="${escape(src)}" alt="待关联题目的学生原图"></a>`:''}${canRelease(task)?`<select aria-label="选择这份作答对应的题目" onchange="homeworkPrototype.chooseQuestionMapping('${record.studentId}','${record.itemId}','${q.id}',this.value)"><option value="">看原图后选择对应题目</option>${choices.map(target=>`<option value="${target.id}" ${mappingChoice?.studentId===record.studentId&&mappingChoice?.target===target.id?'selected':''}>${escape(target.label)}</option>`).join('')}</select><button class="hp-secondary" onclick="homeworkPrototype.saveQuestionMapping('${record.studentId}','${q.id}')">确认对应，不改变对错</button>`:''}</div>`;}).join('')}${workflowNotice?`<p role="status">${escape(workflowNotice)}</p>`:''}</details>`;
  }
  const workflowActions={
    chooseQuestionMapping(studentId,itemId,id,target){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;const record=submissionsFor(task).find(r=>r.studentId===studentId&&r.itemId===itemId),q=record?.questions.find(q=>q.id===id&&q.mappingConfirmed===false);if(q)mappingChoice={studentId,itemId,id,target,version:record.version||1,signature:grading.gradingSignature(q)};},
    saveQuestionMapping(studentId,id){const task=teacherTaskById(teacherTaskId),choice=mappingChoice;if(!task||!canRelease(task)||!choice||choice.studentId!==studentId||choice.id!==id||!choice.target)return;const record=submissionsFor(task).find(r=>r.studentId===studentId&&r.itemId===choice.itemId),q=record?.questions.find(q=>q.id===id),target=gradeQuestions(task).find(q=>q.id===choice.target&&q.mappingConfirmed!==false);if(!q||!target||(record.version||1)!==choice.version||grading.gradingSignature(q)!==choice.signature||record.questions.some(q=>q.id===target.id)){workflowNotice='题目或提交已变化，请重新核对，不能重复关联同一道题';teacherRefresh();return;}if(workflowCommit(()=>{q.sourceQuestionId=q.id;q.id=target.id;q.label=target.label;q.mappingConfirmed=true;})){mappingChoice=null;workflowNotice='题目对应已确认，个人判定保持不变';}teacherRefresh();},
    prepareWorkflowExperience(){this.prepareConsoleScenario('unreleased');const task=taskById('homework-console-v1');if(!task)return;task.deadline=addDays(formatDate(new Date()),-1);task.submitDeadline=addDays(formatDate(new Date()),6);task.referenceMaterials=[{id:'teacher-demo-reference-21',name:'第 21 题参考答案（教师提供演示）',text:'24 ÷ 4 × 7 = 42（人）。先求每份人数，再求全班人数。',questionId:task.items[0].id+'-q1',questionLabel:'第 21 题 · 线段图',source:'teacher'},{id:'teacher-demo-reference-whole',name:'本次作业讲解要点（教师提供演示）',text:'列方程时先读清线段图。分数相加先通分，注意单位与答语。',questionId:'',source:'teacher'}];const records=latestRows(store.submissions.filter(r=>r.taskId===task.id));const child=records.find(r=>r.studentId===guardianId&&r.itemId===task.items[0].id);if(child){const q=child.questions[0];q.correct=false;q.aiCorrect=false;q.aiState='confirmed';q.state='confirmed';delete q.reviewReason;delete q.decisionSource;delete q.explanationInvalidated;q.parentFeedback={status:'pending',version:child.version||1};}const others=records.filter(r=>r.itemId===task.items[0].id&&r.studentId!==guardianId);others.slice(0,2).forEach(r=>grading.holdManualResult(r.questions[0],new Date().toISOString()));if(others[2]){const q=others[2].questions[1];q.id+='-unmatched';q.mappingConfirmed=false;}delete task.answerStandards;syncAnswerWorkflow(task);save();referenceEdit=null;workflowNotice='';this.openTeacher(task.id);},
    openReferences(){referenceExpanded=teacherTaskId;teacherMode='references';teacherRefresh(true);},
    editReference(owner,id=''){if(!editReferenceAllowed(owner))return;const file=referenceOwner(owner).referenceMaterials?.find(f=>f.id===id);referenceExpanded=owner;referenceEdit={owner,id,...(file||{name:'参考答案',text:'',questionId:'',path:''})};workflowNotice='';teacherRefresh();},
    referenceField(key,value){if(referenceEdit&&['name','text','questionId'].includes(key))referenceEdit[key]=value.slice(0,12000);},
    cancelReference(){referenceEdit=null;workflowNotice='';teacherRefresh();},
    async uploadReference(input){const edit=referenceEdit,file=input.files?.[0];if(!edit||!file||!editReferenceAllowed(edit.owner))return;if(file.size>100*1024*1024||!(/^(image|video)\//.test(file.type)||/\.(pdf|docx?|txt)$/i.test(file.name))){workflowNotice='请选择 100MB 以内的图片、视频、PDF 或 Word 文件';teacherRefresh();return;}edit.loading=true;teacherRefresh();try{const id='ref-file-'+Date.now()+'-'+Math.random().toString(36).slice(2);await storeMaterialFile(id,file);if(referenceEdit!==edit)return;edit.fileId=id;edit.path=URL.createObjectURL(file);materialUrls.set(id,edit.path);edit.fileName=file.name;edit.type=file.type.startsWith('image/')?'image':file.type.startsWith('video/')?'video':'file';edit.size=file.size;workflowNotice='';}catch{workflowNotice='上传失败，请重试，已填写内容保留。';}finally{edit.loading=false;teacherRefresh();}},
    saveReference(){const edit=referenceEdit;if(!edit||edit.loading||!editReferenceAllowed(edit.owner))return;if(!edit.name.trim()||(!edit.text.trim()&&!edit.path)){workflowNotice='填写标题，并提供答案文字或附件。';teacherRefresh();return;}const owner=referenceOwner(edit.owner),q=edit.questionId&&gradeQuestions(teacherTaskById(edit.owner)||owner).find(q=>q.id===edit.questionId);if(edit.questionId&&!q){workflowNotice='题目已变化，请重新选择对应题目';teacherRefresh();return;}const file={id:edit.fileId||edit.id||'ref-'+Date.now(),name:edit.name.trim(),text:edit.text.trim(),path:edit.path||'',type:edit.type||'file',fileName:edit.fileName||'',size:edit.size||0,questionId:q?.id||'',questionLabel:q?.label||'',source:'teacher'};const update=()=>{owner.referenceMaterials=[...(owner.referenceMaterials||[]).filter(f=>f.id!==edit.id),file];};if(edit.owner==='draft'){update();saveTeacherDraft();}else if(!workflowCommit(update)){teacherRefresh();return;}referenceEdit=null;workflowNotice='参考资料已保存，批改统计保持不变';teacherRefresh();},
    removeReference(owner,id){if(!editReferenceAllowed(owner))return;const target=referenceOwner(owner);const update=()=>{target.referenceMaterials=(target.referenceMaterials||[]).filter(f=>f.id!==id);};if(owner==='draft'){update();saveTeacherDraft();}else if(!workflowCommit(update)){teacherRefresh();return;}workflowNotice='已删除参考资料，批改结果不变';teacherRefresh();},
    previewReference(owner,id,parent=false){const task=referenceOwner(owner);if(!task||parent&&(!referenceVisible(task,true)||owner!==parentTaskId)||!parent&&!editReferenceAllowed(owner))return;const file=task.referenceMaterials?.find(f=>f.id===id);if(!file||file.unavailable||!file.path)return;materialPreview={...file,name:file.fileName||file.name};refreshMaterialView();},
    clearTeacherReference(id){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;if(workflowCommit(()=>{const s=workflowTask(task).answerStandards?.find(s=>s.questionId===id);if(s){s.teacherAnswer='';s.teacherExplanation='';s.answer='';s.explanation='';s.source='';}})){workflowNotice='参考答案已移除，统计不变';}teacherRefresh();},
    toggleBatchStudent(id){const c=batchContext(id);if(!c)return;if(batchReview.key!==batchKey())batchReview={key:batchKey(),selected:{},choice:''};if(batchReview.selected[id])delete batchReview.selected[id];else batchReview.selected[id]={itemId:c.record.itemId,version:c.record.version||1,signature:grading.gradingSignature(c.q),reviewed:true};batchReview.choice='';workflowNotice='';teacherRefresh();},
    chooseBatch(value){if(value!=='hold'&&Object.values(batchReview.selected).some(row=>!row.reviewed))return;if(['right','wrong','hold'].includes(value)){batchReview.choice=value;teacherRefresh();}},
    holdCurrentScope(){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;batchReview={key:batchKey(),selected:{},choice:'hold'};studentRows(task).forEach(row=>{const c=batchContext(row.id);if(!c)return;const match=teacherFilter==='all'||teacherFilter==='pending'&&!grading.isFormalGrade(c.q)||teacherFilter==='correct'&&grading.isFormalGrade(c.q)&&c.q.correct||teacherFilter==='wrong'&&grading.isFormalGrade(c.q)&&!c.q.correct;if(match)batchReview.selected[row.id]={itemId:c.record.itemId,version:c.record.version||1,signature:grading.gradingSignature(c.q),reviewed:false};});workflowNotice='仅暂缓当前班级与筛选范围；判对判错需要逐份核对后勾选。';teacherRefresh();},
    clearBatch(){batchReview={key:'',selected:{},choice:''};workflowNotice='';teacherRefresh();},
    saveBatch(){const selection=Object.entries(batchReview.selected),choice=batchReview.choice;if(!selection.length||batchReview.key!==batchKey()||!['right','wrong','hold'].includes(choice))return;if(choice!=='hold'&&selection.some(([,row])=>!row.reviewed))return;const contexts=selection.map(([id,expected])=>{const c=batchContext(id);return c&&c.record.itemId===expected.itemId&&(c.record.version||1)===expected.version&&grading.gradingSignature(c.q)===expected.signature&&(choice==='hold'||c.src)?c:null;});if(contexts.some(c=>!c)){workflowNotice='部分作答已变化或原图不可用，请取消选择后重新核对；尚未保存任何判定。';teacherRefresh();return;}if(!workflowCommit(()=>contexts.forEach(c=>{const at=new Date().toISOString();c.q.reviewHistory=[...(c.q.reviewHistory||[]),{at,before:c.q.state,after:choice==='hold'?'review':'confirmed',correct:choice==='right',reason:'已对照所选学生原图，批量'+choice,reviewerId:workScope.teacherId}];if(choice==='hold')grading.holdManualResult(c.q,at);else grading.confirmManualResult(c.task,[],c.q,choice==='right',at);if(c.q.parentFeedback)c.q.parentFeedback.status=choice==='hold'?'pending':'resolved';}))){teacherRefresh();return;}batchReview={key:'',selected:{},choice:''};workflowNotice=`已保存 ${selection.length} 人；统计与家长结果已同步`;rememberReview();teacherRefresh();},
    resumeReview(){const p=store.reviewPositions?.[workScope.teacherId+':'+teacherTaskId];if(!p)return;this.selectDetailClass(p.classId);this.openGradeQuestion(p.questionId);this.filterGradeStudents(p.filter);if(p.studentId&&typeof document!=='undefined')document.querySelector('[data-student-id="'+p.studentId+'"]')?.scrollIntoView({block:'center'});},
    reportGradeIssue(){const task=taskById(parentTaskId);if(!task||!targetIds(task).includes(guardianId)||!gradeUI.parentOpen)return;const record=latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.studentId===guardianId)).filter(r=>r.questions?.length)[gradeUI.page],q=record?.questions.find(q=>q.id===gradeUI.q);if(!q||q.parentFeedback?.status==='pending')return;workflowCommit(()=>{q.parentFeedback={status:'pending',at:new Date().toISOString(),version:record.version||1};});parentRefresh();},
  };
  function answerWorkflowPanel(task){
    const base=workflowTask(task),standards=base.answerStandards||[];if(!standards.some(s=>s.teacherAnswer||s.source==='custom'&&s.answer))return referenceLibrary(base);
    const records=submissionsFor(task),editable=canRelease(task),pending=standards.filter(s=>s.status==='pending');
    let html='<details class="hp-card hp-answer-workflow" '+(answerExpanded?'open':'')+'><summary><strong>已保存的逐题参考答案</strong><small> · 不影响批改统计</small></summary><p class="hp-muted">老师提供；首次截止后家长可查看，无需再次开放。</p>';
    html+=standards.map(s=>{const provided=s.source==='custom'?s.answer:s.teacherAnswer,detail=s.source==='custom'?s.explanation:s.teacherExplanation;return '<details class="hp-answer-standard" '+(answerExpanded===s.questionId?'open':'')+'><summary><span>'+escape(s.label)+'</span><b>'+escape(provided||'未提供（选填）')+'</b></summary><small>'+(s.demoTeacherReference?'演示预填的教师答案 · 可修改':provided?'老师提供 · 按本作业题目关联':'选填；未提供也可正常批改')+'</small><p>'+escape(s.stem)+'</p><p>'+escape(detail||'暂无参考解析')+'</p>'+(editable?'<details><summary>修改参考答案</summary><label>答案<textarea aria-label="修订答案" id="answer-value-'+escape(s.questionId)+'">'+escape(provided||'')+'</textarea></label><label>解析<textarea aria-label="修订解析" id="answer-explain-'+escape(s.questionId)+'">'+escape(detail||'')+'</textarea></label><button class="hp-secondary" onclick="homeworkPrototype.approveCustomAnswer(&quot;'+s.questionId+'&quot;)">保存参考答案</button><button class="hp-text-button" onclick="homeworkPrototype.clearTeacherReference(&quot;'+s.questionId+'&quot;)">移除参考答案</button></details>':'')+'</details>';}).join('');
    return referenceLibrary(base)+html+(answerError?'<p role="status">'+escape(answerError)+'</p>':'')+'</details>';
  }

  function teacherDetail() {
    const task=teacherTaskById(teacherTaskId);if(!task)return teacherList();
    const stat=summary(task);
    return detailClassSelector()+teacherTaskOverview(task,stat)+taskRequirementList(task)+resumeReview(task);
  }
  let questionResultsItem='';
  function teacherQuestionResults(){
    const task=teacherTaskById(teacherTaskId);if(!task)return teacherList();
    const items=task.items.filter(item=>item.type==='photo'&&item.gradingEnabled===true);
    if(!items.length)return teacherDetail();
    if(!items.some(item=>item.id===questionResultsItem))questionResultsItem=items[0].id;
    const scoped={...task,items:items.filter(item=>item.id===questionResultsItem)};
    const stat=summary(scoped);
    const tabs=items.length>1?`<div class="hp-result-item-tabs" role="group" aria-label="按作业项筛选">${items.map(item=>`<button class="${questionResultsItem===item.id?'active':''}" onclick="homeworkPrototype.filterQuestionResults('${item.id}')">${escape(item.title)}</button>`).join('')}</div>`:'';
    const records=submissionsFor(scoped).filter(row=>row.itemId===questionResultsItem);
    const heading=`<div class="hp-item-grade-context"><div class="hp-item-grade-metric"><span>本项已提交</span><strong>${records.length}<small> / ${stat.target} 人</small></strong></div><div class="hp-item-grade-metric"><span class="hp-item-grade-label">题次正确率<details class="hp-item-grade-info"><summary aria-label="查看正确率和错误率统计说明">!</summary><div class="hp-item-grade-popover"><strong>统计口径</strong><p>本项正确率＝判对题次 ÷ 已判定题次${stat.graded?`（${stat.correct} ÷ ${stat.graded}）`:''}。同一学生每道题各计 1 题次。</p><p>下方各题错误率＝该题判错人数 ÷ 该题已判定人数。待复核、识别不清等未判定结果不计入。</p></div></details></span><strong>${stat.correctness===null?'—':stat.correctness+'%'}</strong></div></div><div class="hp-item-grade-note"><p>AI 批改结果仅供参考，请对照原图核对。</p></div>`;
    const statusTags=row=>[['判对',row.correct,'right'],['判错',row.wrong,'wrong'],['待复核',row.review,'needs-review'],['识别不清',row.unreadable,'pending'],['暂无答案',row.noAnswer,'pending'],['等待批改',row.queued,'pending'],['正在批改',row.processing,'pending'],['批改失败',row.failed,'failed'],['未作答',row.unanswered,'pending']].filter(([,count])=>count>0).map(([label,count,tone])=>`<span class="${tone}">${label}${count}</span>`).join('');
    return detailClassSelector()+tabs+heading+unmatchedQuestions(scoped)+`<h2 class="hp-section hp-item-grade-section">逐题批改 · 共 ${stat.questionRows.length} 题</h2>`+(stat.questionRows.map((row,index)=>'<section class="hp-card hp-question-card"><button class="hp-question-entry" onclick="homeworkPrototype.openGradeQuestion(&quot;'+row.id+'&quot;)"><span class="hp-line"><strong>'+escape(task.id==='demo-multi-requirements-v2'?'第 '+(index+1)+' 题':row.label.replace(scoped.items[0].title+' · ',''))+'</strong><b>查看学生结果 ›</b></span><span class="hp-question-meta"><small>'+(row.valid?'已判'+row.valid+'/'+records.length+' · 错误率'+row.wrongRate+'%':'暂无已判定')+'</small><span class="hp-question-statuses">'+statusTags(row)+'</span></span></button>'+(row.review&&canRelease(task)?'<div class="hp-review-action"><button class="hp-text-button" onclick="homeworkPrototype.review(&quot;'+task.id+'&quot;,&quot;'+row.id+'&quot;)">开始复核 ›</button></div>':'')+'</section>').join('')||'<section class="hp-card hp-muted">本项暂无批改结果，提交后可在这里查看。</section>');
  }
  const teacherDetailView=teacherDetail;
  function gradeExplanation(q) {
    return [['分析',q.analysis],['答案',q.answer],['详解',q.explanation],['点睛',q.keyPoint],['知识点',q.knowledge]].map(([title,value],i)=>'<details class="hp-grade-explanation" '+(i<3?'open':'')+'><summary>'+title+'</summary><p>'+escape(value||('暂无'+title))+'</p></details>').join('')+'<details class="hp-grade-explanation"><summary>知识点视频</summary>'+(q.knowledgeVideoUrl&&['https://','http://','blob:','/'].some(prefix=>q.knowledgeVideoUrl.startsWith(prefix))?'<video class="hp-original-video" controls src="'+escape(q.knowledgeVideoUrl)+'"></video>':'<p>暂无知识点视频</p>')+'</details>';
  }
  function referenceForQuestion(task,q,parent=false){const reference=grading.teacherReference(workflowTask(task)||task,q.id,parent);if(!reference)return '';if(reference.locked)return '<section class="hp-card hp-muted"><strong>教师参考答案</strong><p>'+escape(reference.availableAt?'首次截止后可查看 · '+reference.availableAt:'参考资料查看时间待设置')+'</p></section>';return '<section class="hp-card"><strong>教师参考答案</strong><p>'+escape(reference.answer)+'</p><details><summary>查看参考解析</summary><p>'+escape(reference.explanation||'暂无参考解析')+'</p></details><small>老师提供 · 按本作业题目关联；不影响 AI 批改统计。</small></section>';}
  function gradeQuestionCard(q,parent=false) {
    const allowed=!parent||grading.isResultReleased(q),ready=grading.isFormalGrade(q);
    return '<section class="hp-card hp-grade-detail"><span class="hp-line"><strong>'+escape(q.label)+'</strong><em>'+escape(parent?grading.parentGradeLabel(q):grading.gradeLabel(q))+'</em></span><p class="hp-grade-stem">'+escape(q.stem||'题目内容暂未返回，请查看提交原图。')+'</p>'+'<small>'+escape(q.decisionSource==='teacher'?'教师已复核':'AI 批改')+'</small>'+(allowed&&ready?(parent&&!grading.canUseAIExplanation(q)?'<p class="hp-grade-locked">判定已更新，解析暂未更新</p>':'<p class="hp-muted">本次 AI 答案与解析 · 不代表教师已核对</p>'+gradeExplanation(q)):'<p class="hp-grade-locked">'+escape(parent?grading.parentGradeLabel(q):grading.gradeLabel(q))+'，有可用结果后自动更新。</p>')+'</section>';
  }
  function teacherQuestionPhoto(task,questionId){
    const school=workScope.view==='school';
    if(school)return '';
    const photos=studentRows(task).flatMap(student=>student.records.map(record=>{const index=record.questions?.findIndex(q=>q.id===questionId)??-1;if(index<0)return null;const region=learning().questionRegion(record.questions[index],index,record.mock),src=record.mock?samplePhoto(record):mediaFor(record);return src?{student,record,region,src}:null;})).filter(Boolean);
    const photo=photos.find(photo=>photo.region)||(!school&&photos[0]);if(!photo)return '';
    const r=photo.region,src=escape(photo.src),scope=photo.record.mock?'演示题目页':`来自 ${escape(photo.student.name)} 的提交 · 第 ${photo.record.version||1} 版`;
    const limited=school||photo.record.mock,link=limited?'':`<a class="hp-text-button" href="${src}" target="_blank" rel="noopener">查看整页 ↗</a>`;
    const tag=limited?'div':'a',href=limited?'':` href="${src}" target="_blank" rel="noopener" aria-label="查看题目原照片整页"`;
    const image=r?`<${tag} class="hp-question-photo-crop"${href}><img alt="题目区域的原照片截取" src="${src}" style="width:${100/r.width}%;height:${100/r.height}%;left:${-100*r.x/r.width}%;top:${-100*r.y/r.height}%" onload="this.parentElement.style.aspectRatio=(this.naturalWidth*${r.width})/(this.naturalHeight*${r.height})"></${tag}>`:`<img class="hp-original" src="${src}" alt="题目定位尚未返回，展示整页原照片"><small>题目区域尚未定位，暂展示整页原图。</small>`;
    return `${link?`<div class="hp-line">${link}</div>`:''}${image}<small>${scope}${r?' · 已截取当前题目':''}</small>`;
  }
  function inlineGradeControls(task, row, question, src) {
    if(!canRelease(task)||!['confirmed','review','unreadable','no-answer'].includes(row.q.state))return '';
    const d=gradeReviewDraft,active=d?.inline&&d.taskId===task.id&&d.questionId===question.id&&d.studentId===row.id;
    return `<div class="hp-inline-verdict" role="group" aria-label="${escape(row.name)}的判定">${[['right','✓ 判对'],['wrong','× 判错'],['hold','暂缓']].map(([value,label])=>`<button ${!src&&value!=='hold'?'disabled':''} aria-pressed="${!!active&&d.choice===value}" class="${active&&d.choice===value?'selected '+value:''}" onclick="homeworkPrototype.chooseInlineGrade('${task.id}','${question.id}','${row.id}','${value}')">${label}</button>`).join('')}</div>${active?`<div class="hp-inline-save"><small role="status">${escape(d.error||'待保存：'+({right:'判对',wrong:'判错',hold:'暂缓'}[d.choice]))}</small><button class="hp-text-button" onclick="homeworkPrototype.closeGradeReview()">取消</button><button class="hp-secondary" onclick="homeworkPrototype.saveInlineGrade()">保存</button></div>`:''}`;
  }
  function teacherGradeQuestion() {
    const task=teacherTaskById(teacherTaskId);if(!task)return teacherList();
    const rows=studentRows(task),question=gradeQuestions(task).find(q=>q.id===teacherQuestionId);if(!question)return teacherDetail();
    const stat=summary(task).questionRows.find(q=>q.id===teacherQuestionId);
    const matching=rows.map(row=>({...row,q:row.records.flatMap(r=>r.questions||[]).find(q=>q.id===teacherQuestionId)})).filter(row=>row.q);
    const filtered=matching.filter(row=>teacherFilter==='all'||teacherFilter==='correct'&&grading.isFormalGrade(row.q)&&row.q.correct||teacherFilter==='wrong'&&grading.isFormalGrade(row.q)&&!row.q.correct||teacherFilter==='pending'&&!grading.isFormalGrade(row.q));
    const count=v=>matching.filter(row=>v==='all'||v==='correct'&&grading.isFormalGrade(row.q)&&row.q.correct||v==='wrong'&&grading.isFormalGrade(row.q)&&!row.q.correct||v==='pending'&&!grading.isFormalGrade(row.q)).length;
    const pending=count('pending');
    const pendingParts=[['等待批改',stat.queued],['正在批改',stat.processing],['待复核',stat.review],['识别不清',stat.unreadable],['暂无答案',stat.noAnswer],['批改失败',stat.failed],['未作答',stat.unanswered]].filter(([,total])=>total>0).map(([label,total])=>`${label} ${total} 人`).join(' · ');
    const photo=teacherQuestionPhoto(task,question.id),source=photo&&teacherQuestionSource==='photo'?'photo':'text';
    const questionContent=`<div class="hp-question-source-panel">${source==='photo'?photo:`<p class="hp-grade-stem">${escape(question.stem||'暂未提取到题目文字，请查看下方学生原图。')}</p><small>文字由图片提取，仅供核对。</small>`}<button class="hp-question-source-switch" ${photo?'':'disabled'} aria-label="${source==='photo'?'查看提取文字':'查看题目原图'}" onclick="homeworkPrototype.showQuestionSource('${source==='photo'?'text':'photo'}')">${source==='photo'?'查看文字':'查看原图'} ›</button></div>`;
    const filters='<div class="hp-tabs hp-result-filters" role="group" aria-label="按学生批改状态筛选">'+[['all','全部'],['wrong','判错'],['correct','判对'],['pending','待处理']].map(([v,t])=>`<button class="${teacherFilter===v?'active':''}" onclick="homeworkPrototype.filterGradeStudents('${v}')">${t} <b>${count(v)}</b></button>`).join('')+'</div>';
    return detailClassSelector()+`<section class="hp-card hp-question-overview">${questionContent}<div class="hp-question-summary"><span>错误率 <b class="hp-grade-wrong">${stat.wrongRate===null?'—':stat.wrongRate+'%'}</b></span><span>已判定 ${stat.valid}/${matching.length} 人</span></div>${filters}${pending?`<details class="hp-question-recognition"><summary>待处理状态明细</summary><small>${pendingParts}</small></details>`:''}</section>`+referenceForQuestion(task,question)+referenceLibrary(workflowTask(task),false,question.id)+(canRelease(task)?'<button class="hp-text-button" onclick="homeworkPrototype.holdCurrentScope()">暂缓当前列表…</button>':'')+filtered.map(row=>{
      const record=row.records.find(r=>r.questions?.some(q=>q.id===question.id)),src=record&&(record.mock?samplePhoto(record):mediaFor(record)),r=record&&learning().questionRegion(row.q,record.questions.indexOf(row.q),record.mock);
      const photo=workScope.view==='school'?'':!src?'<p class="hp-muted">原图暂不可用</p>':r?`<a class="hp-question-photo-crop" href="${escape(src)}" target="_blank" rel="noopener" aria-label="查看${escape(row.name)}的整页原图"><img loading="lazy" alt="${escape(row.name)}的本题作答" src="${escape(src)}" style="width:${100/r.width}%;height:${100/r.height}%;left:${-100*r.x/r.width}%;top:${-100*r.y/r.height}%" onload="this.parentElement.style.aspectRatio=(this.naturalWidth*${r.width})/(this.naturalHeight*${r.height})"></a>`:`<a href="${escape(src)}" target="_blank" rel="noopener"><img class="hp-original" loading="lazy" src="${escape(src)}" alt="${escape(row.name)}的作业原图"></a>`;
      return `<section class="hp-card hp-student-result" data-student-id="${row.id}"><span class="hp-line"><strong>${escape(row.name)}</strong><em>${escape(grading.gradeLabel(row.q))}</em></span><small>${row.q.decisionSource==='teacher'?'教师已复核':'AI 批改'}${record?.mock?' · 演示共用样张':''}</small>${photo}${batchChoice(row)}${row.q.parentFeedback?.status==='pending'?'<p class="hp-feedback-note">家长反馈：这道题可能批错了</p>':''}<details class="hp-student-analysis"><summary>查看这份作答的 AI 答案与解析</summary>${gradeExplanation(row.q)}</details><div class="hp-student-actions"><button class="hp-text-button" onclick="homeworkPrototype.openGradedStudent('${row.id}')">整份作业 ›</button></div>${inlineGradeControls(task,row,question,src)}</section>`;
    }).join('')+(!filtered.length?'<section class="hp-card hp-muted">该状态暂无学生</section>':'')+batchToolbar();
  }
  const learningUI={mode:'result',reasonOpen:false,reason:'知识点不熟',phase:'quick',step:0,answer:'',feedback:''};
  const learning=()=>window.homeworkLearning;
  function readNotebook(){try{const entries=JSON.parse(localStorage.getItem(learning().NOTEBOOK_KEY)||'[]');return Array.isArray(entries)?entries:[];}catch{return [];}}
  function parentQuestionContext(){const task=taskById(parentTaskId);if(!gradeUI.parentOpen||!task||!targetIds(task).includes(guardianId))return null;const records=latestRows(store.submissions.filter(row=>row.taskId===task.id&&row.studentId===guardianId)).filter(row=>row.questions?.length),record=records[gradeUI.page],q=record?.questions.find(question=>question.id===gradeUI.q);return q&&grading.isResultReleased(q)&&(learningUI.mode!=='tutor'||grading.canUseAIExplanation(q))?{task,record,q,studentId:guardianId}:null;}
  function parentTutorContext(){const context=parentQuestionContext();return context&&grading.canUseAIExplanation(context.q)?context:null;}
  function gradePaper(record,selected,parent){const src=record.mock?samplePhoto(record):mediaFor(record);if(!src)return '<p class="hp-muted">原图暂不可用，仍可从下方题目入口查看结果。</p>';const regions=record.questions.map((q,i)=>({q,region:learning().questionRegion(q,i,record.mock)})).filter(item=>item.region);return (record.mock?'<small>共用作业样张 · 班级统计为模拟数据</small>':'')+'<div class="hp-marked-paper"><img src="'+escape(src)+'" alt="学生作业原图">'+regions.map(({q,region:r})=>{const mark=learning().questionMark(q,parent);return '<button class="hp-paper-region '+mark.tone+(q.id===selected?.id?' selected':'')+'" aria-label="'+escape(q.label+'，'+mark.label+'，查看题目')+'" style="left:'+r.x*100+'%;top:'+r.y*100+'%;width:'+r.width*100+'%;height:'+r.height*100+'%" onclick="homeworkPrototype.selectGradeQuestion(&quot;'+q.id+'&quot;,'+parent+')"><span>'+escape(mark.mark)+'</span><small>'+escape(q.label)+' · '+escape(mark.label)+'</small></button>';}).join('')+'</div><small>✓ 正确　× 错误　? 待复核或存疑；点击题框查看单题。</small>'+(!regions.length?'<p class="hp-muted">题目区域暂未定位，可通过下方题目入口查看。</p>':'')+'<a class="hp-text-button" href="'+escape(src)+'" target="_blank" rel="noopener">查看原图</a>';}
  function parentQuestionActions(q,record,studentId){if(!grading.isResultReleased(q))return '';const key=learning().notebookKey(studentId,parentTaskId,record.itemId,q.id),saved=readNotebook().some(entry=>entry.key===key);return '<div class="hp-learning-actions"><button class="hp-secondary" onclick="homeworkPrototype.openMistakeReason()">'+(saved?'已加入错题本 · 修改错因':'加入错题本')+'</button><button class="hp-primary" '+(!grading.canUseAIExplanation(q)?'disabled':'')+' onclick="homeworkPrototype.openHomeworkTutor()">'+(grading.canUseAIExplanation(q)?'1对1讲题':'解析更新后可解题')+'</button></div><button class="hp-text-button" onclick="homeworkPrototype.openHomeworkNotebook()">查看孩子的错题本</button>';}
  function renderLearningPanel(context){const {q}=context;if(learningUI.mode==='tutor'&&!grading.canUseAIExplanation(q)){learningUI.mode='result';return '<p class="hp-muted">判定已更新，解析暂未更新</p>';}if(learningUI.mode==='notebook'){const entries=readNotebook().filter(entry=>entry.studentId===guardianId);return '<button class="hp-text-button" onclick="homeworkPrototype.closeHomeworkLearning()">‹ 返回批改结果</button><h2>孩子的错题本</h2>'+entries.slice().reverse().map(entry=>'<section class="hp-card"><strong>'+escape(entry.question.label)+'</strong><p>'+escape(entry.question.stem||'题目原图已随作业保存')+'</p><small>错因：'+escape(entry.reason)+' · 第 '+entry.version+' 版</small></section>').join('');}
    return window.homeworkTutorUI?.html() || '<p>讲题模块未加载，请刷新重试。</p>'; }
  function renderMistakeReason(){if(!learningUI.reasonOpen)return '';return '<div class="hp-filter-mask" onclick="homeworkPrototype.closeMistakeReason()"><section class="hp-filter-sheet" role="dialog" aria-modal="true" aria-label="标记错因" onclick="event.stopPropagation()"><header><h2>加入错题本 · 标记错因</h2><button onclick="homeworkPrototype.closeMistakeReason()">×</button></header><div class="hp-filter-grid">'+learning().MISTAKE_REASONS.map(reason=>'<button class="'+(learningUI.reason===reason?'active':'')+'" onclick="homeworkPrototype.chooseMistakeReason(&quot;'+reason+'&quot;)">'+reason+'</button>').join('')+'</div><p>记录到当前孩子的错题本，重复加入会更新错因。</p><button class="hp-primary" onclick="homeworkPrototype.saveHomeworkMistake()">确认加入</button><p role="status">'+escape(learningUI.feedback)+'</p></section></div>';}
  function wholeGrade(task,studentId,studentName,parent=false) {
    const records=(parent?latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.studentId===studentId)):submissionsFor(task).filter(r=>r.studentId===studentId)).filter(r=>(r.questions||[]).length);
    const qs=records.flatMap(r=>r.questions),progress=grading.gradingProgress(qs,parent);
    if(!records.length)return '<section class="hp-card hp-muted">暂无可查看的作业批改结果</section>';
    gradeUI.page=Math.max(0,Math.min(gradeUI.page,records.length-1));
    const record=records[gradeUI.page];
    const candidates=record.questions.filter(q=>!gradeUI.wrongOnly||(q.state==='confirmed'&&!q.correct&&(!parent||grading.isResultReleased(q))));
    const selected=candidates.find(q=>q.id===gradeUI.q)||candidates[0];
    if(parent&&selected)gradeUI.q=selected.id;
    const context=parent&&parentQuestionContext();
    if(parent&&learningUI.mode!=='result'){if(context)return renderLearningPanel(context);learningUI.mode='result';}
    return referenceLibrary(task,parent,parent?'':null)+ '<div class="hp-grade-context"><small>'+escape(task.title)+'</small><h2>'+escape(studentName)+'的批改结果</h2></div>'+gradeStatus(task,records,parent)+'<div class="hp-grade-overview"><div><strong>'+progress.total+'</strong><span>总题数</span></div><div><strong>'+progress.correct+'</strong><span>答对</span></div><div><strong class="hp-grade-wrong">'+progress.wrong+'</strong><span>答错</span></div><div><strong>'+progress.unavailable+'</strong><span>'+('待处理')+'</span></div></div><h2 class="hp-section">整份作业 <small>共 '+records.length+' 页提交</small></h2>'+(records.length>1?'<div class="hp-grade-pages">'+records.map((r,i)=>'<button class="'+(i===gradeUI.page?'active':'')+'" onclick="homeworkPrototype.gradePage('+i+','+parent+')">第 '+(i+1)+' 页</button>').join('')+'</div>':'')+(parent||workScope.view!=='school'?'<section class="hp-card hp-grade-paper"><strong>'+escape(task.items.find(i=>i.id===record.itemId)?.title||'作业原图')+'</strong>'+gradePaper(record,selected,parent)+'</section>':'<p class="hp-muted">校级只读视角仅展示逐题结果。</p>')+'<h2 class="hp-section">逐题查看 <button class="hp-text-button" onclick="homeworkPrototype.toggleGradeWrong('+parent+')">'+(gradeUI.wrongOnly?'显示全部':'只看错题')+'</button></h2><div class="hp-chips">'+candidates.map(q=>'<button class="'+(q.id===selected?.id?'active':'')+'" onclick="homeworkPrototype.selectGradeQuestion(&quot;'+q.id+'&quot;,'+parent+')">'+escape(q.label)+' · '+escape(parent?grading.parentGradeLabel(q):grading.gradeLabel(q))+'</button>').join('')+'</div><div id="hp-grade-selected">'+(selected?(parent?parentQuestionActions(selected,record,studentId):'')+gradeQuestionCard(selected,parent)+referenceForQuestion(task,selected,parent)+(parent?referenceLibrary(task,true,selected.id)+parentFeedback(selected):''):'<section class="hp-card hp-muted">当前页暂无可查看的错题</section>')+'</div>'+(parent?renderMistakeReason():'');
  }
  function gradeReviewContext(){const d=gradeReviewDraft,task=d&&teacherTaskById(d.taskId);if(!d||!task||!canRelease(task))return null;const record=submissionsFor(task).find(r=>r.studentId===d.studentId&&r.itemId===d.itemId&&(r.version||1)===d.version),q=record?.questions.find(q=>q.id===d.questionId);return q&&grading.gradingSignature(q)===d.signature?{task,record,q}:null;}
  function renderGradeReviewDialog(){
    const d=gradeReviewDraft;if(!d||d.inline)return '';const c=gradeReviewContext();
    if(!c)return '<div class="hp-source-mask"><section class="hp-grade-dialog" role="dialog" aria-modal="true" aria-label="复核状态已更新"><h2>作答或权限已更新</h2><p>请关闭后重新进入，核对最新提交。</p><button class="hp-secondary" onclick="homeworkPrototype.closeGradeReview()">关闭</button></section></div>';
    const {record,q,task}=c,student=students.find(s=>s.id===record.studentId),index=record.questions.indexOf(q),r=learning().questionRegion(q,index,record.mock),src=record.mock?samplePhoto(record):mediaFor(record);
    const pending=submissionsFor(task).filter(row=>row.questions?.some(v=>v.id===q.id&&['review','confirmed','unreadable','no-answer'].includes(v.state)));
    const photo=!src?'<p class="hp-muted">原图暂不可用，请保留待复核后稍后处理。</p>':r?'<a class="hp-question-photo-crop" href="'+escape(src)+'" target="_blank" rel="noopener" aria-label="查看此学生整页原图"><img alt="当前复核学生的题目原图" src="'+escape(src)+'" style="width:'+100/r.width+'%;height:'+100/r.height+'%;left:'+(-100*r.x/r.width)+'%;top:'+(-100*r.y/r.height)+'%" onload="this.parentElement.style.aspectRatio=(this.naturalWidth*'+r.width+')/(this.naturalHeight*'+r.height+')"></a>':'<img class="hp-original" src="'+escape(src)+'" alt="当前复核学生的作业原图">';
    return '<div class="hp-source-mask"><section class="hp-grade-dialog hp-review-dialog" role="dialog" aria-modal="true" aria-label="对照原图复核"><header class="hp-review-heading"><div><h2>对照原图复核</h2><small>'+escape(q.label)+' · 仅处理当前学生</small></div><button aria-label="关闭复核" onclick="homeworkPrototype.closeGradeReview()">×</button></header><div class="hp-review-scroll"><label class="hp-review-student">当前学生<select aria-label="选择学生" onchange="homeworkPrototype.review(&quot;'+task.id+'&quot;,&quot;'+q.id+'&quot;,undefined,this.value)">'+pending.map(row=>{const stu=students.find(v=>v.id===row.studentId);return '<option value="'+row.studentId+'" '+(row.studentId===record.studentId?'selected':'')+'>'+escape(stu?.name||row.studentId)+' · '+escape(classes.find(v=>v.id===stu?.classId)?.name||'')+'</option>';}).join('')+'</select></label>'+photo+(record.mock?'<small>共用作业样张 · 仅用于演示，学生之间的判定为模拟数据</small>':'')+'<div class="hp-review-ai"><div><strong>AI 原始判定</strong><p>'+ (typeof q.aiCorrect==='boolean'?(q.aiCorrect?'✓ 正确':'× 错误'):!q.aiUnavailable&&!q.reviewReason&&q.decisionSource!=='teacher'?(q.correct?'✓ 正确':'× 错误'):'原判未留存')+'</p><small>AI 参考答案：'+escape(q.aiAnswer||(!q.reviewReason?q.answer:'未留存'))+'</small></div><div><strong>教师参考答案</strong><p>'+escape((()=>{const r=workflowTask(task).answerStandards?.find(v=>v.questionId===q.id);return r?.source==='custom'?r.answer:r?.teacherAnswer||'暂无教师参考';})())+'</p><small>v'+(q.answerVersion||1)+' · 请根据上方原图判断</small></div></div><details class="hp-review-explanation"><summary>查看解析与复核说明</summary><p>'+escape(q.explanation||q.analysis||'暂无解析')+'</p><label class="hp-field">复核说明<textarea aria-label="改判原因" oninput="homeworkPrototype.setGradeReviewReason(this.value)">'+escape(d.reason)+'</textarea></label></details>'+(d.error?'<p class="hp-grade-wrong" role="alert">'+escape(d.error)+'</p>':'')+'</div><footer class="hp-review-footer"><div class="hp-review-decisions"><button '+(!src?'disabled':'')+' class="'+(d.correct===true?'selected':'')+'" onclick="homeworkPrototype.setGradeReviewDecision(true)">✓ 判对</button><button '+(!src?'disabled':'')+' class="'+(d.correct===false?'selected wrong':'')+'" onclick="homeworkPrototype.setGradeReviewDecision(false)">× 判错</button><button onclick="homeworkPrototype.holdGradeReview()">暂缓本题</button></div><div class="hp-review-save"><button class="hp-secondary" onclick="homeworkPrototype.confirmGradeReview()">保存返回</button><button class="hp-primary" onclick="homeworkPrototype.confirmGradeReview(true)">'+(pending.some(row=>row.studentId!==record.studentId&&row.questions.some(v=>v.id===q.id&&v.state==='review'))?'保存并下一位':'保存并完成')+'</button></div><small>保存即更新统计和家长结果。</small></footer></section></div>';
  }
  function gradeReleaseDialog(task) {
    if(!gradeReleaseOpen)return '';
    return '<div class="hp-source-mask"><section class="hp-grade-dialog" role="dialog" aria-modal="true" aria-label="确认开放批改结果"><h2>核对统计并开放</h2><p>当前有效判定 '+summary(task).graded+' 题次，待复核 '+summary(task).review+' 题次。待复核不算对错，也不开放旧判定。</p><p>开放范围：'+escape(task.classIds.map(id=>classes.find(c=>c.id===id)?.name||id).join('、'))+'。仅向这些班级对应家长开放已确认的结果、答案与解析；其他班级保持原状态，待处理和待复核题目继续保留。</p><button class="hp-primary" onclick="homeworkPrototype.confirmGradeRelease()">确认开放</button><button class="hp-secondary" onclick="homeworkPrototype.closeGradeRelease()">暂不开放</button></section></div>';
  }
  let rosterTouch = null;
  const rosterTabs = [{id:'all',label:'全部'},{id:'completed',label:'已交齐'},{id:'missing',label:'未交齐'},{id:'unsubmitted',label:'未提交'}];
  const rosterMatches = (row,filter) => filter==='all'||filter==='completed'&&row.status==='completed'||filter==='missing'&&row.status!=='completed'||filter==='unsubmitted'&&row.status==='missing'||filter==='partial'&&row.status==='partial';
  function teacherStudents() {
    const task = teacherTaskById(teacherTaskId);
    if (!task) return teacherList();
    const special=teacherFilter==='wrong'||teacherFilter==='questionWrong';
    const all=studentRows(rosterItemId?{...task,items:task.items.filter(item=>item.id===rosterItemId)}:task),rows=all.filter(row=>special?(teacherFilter==='wrong'?row.wrong.length:row.wrong.some(q=>q.id===teacherQuestionId)):rosterMatches(row,teacherFilter));
    const tabs=special?'':`<div class="hp-roster-tabs" role="tablist" aria-label="提交情况">${rosterTabs.map(tab=>`<button role="tab" aria-selected="${teacherFilter===tab.id}" class="${teacherFilter===tab.id?'active':''}" onclick="homeworkPrototype.rosterSelect('${tab.id}')">${tab.label}<span>${all.filter(row=>rosterMatches(row,tab.id)).length}</span></button>`).join('')}</div>`;
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToStats()">‹ 返回统计</button><h1>学生名单</h1></div>${tabs}<div class="hp-roster-panel" onpointerdown="homeworkPrototype.rosterSwipeStart(event)" onpointerup="homeworkPrototype.rosterSwipeEnd(event)" onpointercancel="homeworkPrototype.rosterSwipeCancel()"><p class="hp-roster-caption">${rosterItemId?escape(task.items.find(item=>item.id===rosterItemId)?.title||'')+' · ':''}${rows.length} 名学生${teacherFilter==='missing'?' · 含未提交学生':''}${special?' · 做错学生':''}</p>${rows.length?rows.map(row=>`<button class="hp-card hp-task hp-roster-card" onclick="homeworkPrototype.openStudent('${row.id}')"><span class="hp-line"><strong>${escape(row.name)}</strong><em>${row.status==='completed'?'已交齐':row.status==='missing'?'未提交':'未交齐'}</em></span><small>${escape(classes.find(item=>item.id===row.classId)?.name||'')}${row.wrong.length?' · 做错 '+row.wrong.length+' 题':''}${row.latest?' · 最近提交 '+escape(row.latest):' · 尚未提交'}</small><div class="hp-missing-items">${row.missingItems.length?'<strong>还缺 '+row.missingItems.length+' 项</strong>'+row.missingItems.map(item=>'<span>· '+escape(item.title)+' <small>'+escape(typeLabel(item.type))+'</small></span>').join(''):'<span>全部必交项已完成</span>'}</div><span class="hp-line hp-task-bottom"><span>已交 ${new Set(row.records.map(record=>record.itemId)).size}/${rosterItemId?1:task.items.length} 项</span><span class="hp-roster-link">查看提交 ›</span></span></button>`).join(''):'<section class="hp-card hp-muted">暂无这类学生</section>'}</div>`;
  }
  const mockPhoto = (row, studentName) => {
    if(/^(?:grading|console)-page-[12]$/.test(row.itemId))return samplePhoto(row);
    const firstAnswer = escape(row.questions?.[0]?.studentAnswer || '未识别'), secondAnswer = escape(row.questions?.[1]?.studentAnswer || '未识别');
    const safeName = escape(studentName);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760"><rect width="600" height="760" fill="#dee8e9"/><rect x="38" y="28" width="524" height="704" rx="10" fill="#fffefa" stroke="#cad6d2"/><text x="70" y="92" font-family="sans-serif" font-size="26" fill="#36485a">数学练习 · 演示样张</text><text x="70" y="133" font-family="sans-serif" font-size="19" fill="#6f8391">姓名：${safeName}</text><path d="M70 155H530M70 355H530M70 555H530" stroke="#d4dfe5"/><text x="74" y="215" font-family="sans-serif" font-size="24" fill="#32475d">1. 分数计算</text><text x="100" y="275" font-family="sans-serif" font-size="31" fill="#405c79">${firstAnswer}</text><text x="74" y="415" font-family="sans-serif" font-size="24" fill="#32475d">2. 应用题</text><text x="100" y="475" font-family="sans-serif" font-size="31" fill="#405c79">${secondAnswer}</text><text x="70" y="651" font-family="sans-serif" font-size="20" fill="#c96f6f">仅用于原型演示，非真实学生作业</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };
  function teacherStudent() {
    const task = teacherTaskById(teacherTaskId);
    const scopedTask = task && rosterItemId ? {...task, items: task.items.filter(item => item.id === rosterItemId)} : task;
    const row = scopedTask && studentRows(scopedTask).find(item => item.id === teacherStudentId);
    if (!task || !row) return teacherStudents();
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToStudents()">‹ 返回学生名单</button><h1>${escape(row.name)}</h1></div><section class="hp-card"><strong>${escape(classes.find(item => item.id === row.classId)?.name || '')} · ${rosterItemId ? row.records.length ? '本项已提交' : '本项未提交' : row.status === 'missing' ? '未提交' : row.status === 'partial' ? '部分提交' : '已完成'}</strong>${rosterItemId ? '' : `<p>已提交 ${row.records.length}/${task.items.length} 项 · 做错 ${row.wrong.length} 题</p>`}</section>${rosterItemId ? '' : '<button class="hp-secondary" onclick="homeworkPrototype.openStudentGrade()">查看整份批改结果 ›</button>'}<h2 class="hp-section">${rosterItemId ? '本项提交记录' : workScope.view === 'school' ? '逐项提交与结果' : '逐项提交原件'}</h2>${scopedTask.items.map(item => { const index = task.items.indexOf(item);
      const record = row.records.find(value => value.itemId === item.id);
      if (!record) return `<section class="hp-card"><span class="hp-line"><strong>${index + 1}. ${escape(item.title)}</strong><em>${types[item.type]}</em></span><p class="hp-muted">未提交 · 无原件和提交时间</p></section>`;
      const media = mediaFor(record) || (record.mock && item.type === 'photo' ? mockPhoto(record, row.name) : '');
      const mediaView = workScope.view === 'school' ? '' : item.type === 'photo' && media ? `<button class="hp-paper-preview" onclick="homeworkPrototype.openPaper(this)"><img class="hp-original" src="${media}" alt="${escape(row.name)}的${escape(item.title)}提交原图"><span>点击放大查看</span></button>` : item.type === 'video' && media ? `<video class="hp-original-video" controls preload="metadata" src="${media}"></video>` : item.type === 'audio' && media ? `<audio controls src="${media}"></audio>` : item.type === 'video' ? '<div class="hp-video-sample">▶ 演示视频记录<small>模拟数据只有提交记录，没有真实视频文件；家长上传后可在此播放原视频。</small></div>' : item.type === 'none' ? '' : '<p class="hp-muted">演示记录暂无可播放的原文件。</p>';
      return `<section class="hp-card"><span class="hp-line"><strong>${index + 1}. ${escape(item.title)}</strong><em>${types[item.type]}</em></span><small>提交时间：${escape(record.submittedAt || '历史演示记录未保存时间')}</small><small>操作账号：${escape(record.submittedBy || '历史记录未保存账号')}</small>${workScope.view === 'school' ? '' : `<small>文件：${escape(record.label)}</small>${record.mock ? '<small>演示数据 · 图片为模拟样张</small>' : ''}${record.transient ? '<small>大文件仅在当前预览会话保留；刷新后需重新选择</small>' : ''}`}${mediaView}${(record.questions || []).length ? `<div class="hp-question-results">${record.questions.map(question => `<div><span>${escape(question.label)} · ${question.state === 'review' ? '待复核' : question.state === 'unreadable' ? '识别不清' : question.state === 'no-answer' ? '暂无标准答案' : question.correct ? '正确' : '做错'}</span><small>正确答案 ${escape(question.answer || '暂无标准答案')}</small>${(question.reviewHistory || []).map(history => `<small>改判记录：${escape(history.at.replace('T',' ').slice(0,16))} · ${history.correct ? '改判为正确' : '改判为错误'} · ${escape(history.reviewerId)} · ${escape(history.reason)}</small>`).join('')}</div>`).join('')}</div>` : ''}</section>`;
    }).join('')}`;
  }
  const typeLabel = type => type === 'none' ? '家长确认' : types[type];
  const suggestSubmissionType = text => /视频|录像|录制/.test(text)?'video':/家长确认|家长.*确认/.test(text)?'none':/文档|文件|PDF|Word/i.test(text)?'file':/拍照|图片|答题页/.test(text)?'photo':/录音|音频/.test(text)?'audio':'';
  const briefDescription = task => (task.description||'').split('\n').filter(line=>!/^\s*\d+[.、．)）]/.test(line)&&!/^[📚\s]*作业[：:]?$/.test(line.trim())).join('\n');
  const listFilters={subject:'all',classId:'all',statuses:[...window.homeworkFilters.ALL_TASK_STATUSES]};
  let taskFilterSheet='', taskStatusDraft=[], taskFilterError='';
  const listSubjects=()=>workScope.view==='school'?[...new Set(store.tasks.map(task=>task.subject||'综合'))]:subjectOptions();
  const listClassIds=()=>workScope.view==='subject'?[...new Set(teachingAssignments().filter(a=>listFilters.subject==='all'||a.subject===listFilters.subject).flatMap(a=>a.classIds))]:workScope.classIds;
  function normalizeListFilters(){if(listFilters.subject!=='all'&&!listSubjects().includes(listFilters.subject))listFilters.subject='all';if(listFilters.classId!=='all'&&!listClassIds().includes(listFilters.classId))listFilters.classId='all';}
  function listTask(task){const base=detailTaskBase(task);const ids=base.classIds.filter(id=>listFilters.classId==='all'||id===listFilters.classId);return {...base,classIds:ids,targetSnapshotIds:base.targetSnapshotIds?.filter(sid=>students.some(student=>student.id===sid&&ids.includes(student.classId))),targetStudentIds:base.targetStudentIds?.filter(sid=>students.some(student=>student.id===sid&&ids.includes(student.classId)))||null};}
  function filteredListTasks(){normalizeListFilters();return store.tasks.filter(task=>(workScope.view==='school'||task.publishedBy===workScope.teacherId)&&(listFilters.subject==='all'||(task.subject||'综合')===listFilters.subject)).filter(task=>{const visible=listTask(task);return visible.classIds.length&&window.homeworkFilters.matchesTaskStatuses(listFilters.statuses,window.homeworkFilters.taskStatusKeys(summary(visible),gradeQuestions(visible)));});}
  function listFilterBar(){const groups=new Set(filteredListTasks().map(task=>task.seriesId||task.id));return '<div class="hp-list-tools"><h2>任务列表 <small>'+groups.size+'</small></h2>'+[['subject',listFilters.subject==='all'?'学科':listFilters.subject],['class',listFilters.classId==='all'?'班级':classes.find(c=>c.id===listFilters.classId)?.name||'班级'],['status',listFilters.statuses.length===window.homeworkFilters.ALL_TASK_STATUSES.length?'状态':'状态·'+listFilters.statuses.length]].map(([id,label])=>'<button aria-label="筛选'+({subject:'学科',class:'班级',status:'任务状态'})[id]+'，当前'+escape(label)+'" class="'+((id==='subject'?listFilters.subject!=='all':id==='class'?listFilters.classId!=='all':listFilters.statuses.length!==window.homeworkFilters.ALL_TASK_STATUSES.length)?'active':'')+'" onclick="homeworkPrototype.openTaskFilter(&quot;'+id+'&quot;)"><span>'+escape(label)+'</span><b>⌄</b></button>').join('')+'</div>';}
  function renderTaskFilter(){if(!taskFilterSheet)return '';const status=taskFilterSheet==='status';const title=status?'任务状态':taskFilterSheet==='subject'?'选择学科':'选择班级';let body='';
    if(status){const groups=window.homeworkFilters.TASK_STATUS_GROUPS;body='<p>支持多选；同组任一匹配，跨组同时满足。未选的分组不限。</p><button class="hp-filter-all" aria-pressed="'+(taskStatusDraft.length===window.homeworkFilters.ALL_TASK_STATUSES.length)+'" onclick="homeworkPrototype.toggleAllTaskStatuses()">'+(taskStatusDraft.length===window.homeworkFilters.ALL_TASK_STATUSES.length?'☑':'□')+' 全选</button>'+groups.map(group=>'<h3>'+group.label+'</h3><div class="hp-filter-grid">'+group.options.map(option=>'<button aria-pressed="'+taskStatusDraft.includes(option.id)+'" class="'+(taskStatusDraft.includes(option.id)?'active':'')+'" onclick="homeworkPrototype.toggleTaskStatus(&quot;'+option.id+'&quot;)">'+(taskStatusDraft.includes(option.id)?'✓ ':'')+option.label+'</button>').join('')+'</div>').join('')+(taskFilterError?'<p class="hp-error" role="alert">'+taskFilterError+'</p>':'')+'<footer><button onclick="homeworkPrototype.resetTaskStatusDraft()">重置为全部</button><button class="hp-primary" onclick="homeworkPrototype.confirmTaskStatuses()">确定</button></footer>';}
    else {const options=taskFilterSheet==='subject'?[['all','全部学科'],...listSubjects().map(subject=>[subject,subject])]:[['all','全部班级'],...classes.filter(c=>listClassIds().includes(c.id)).map(c=>[c.id,c.name])];body=options.map(([id,label])=>'<button class="hp-filter-option" aria-pressed="'+((taskFilterSheet==='subject'?listFilters.subject:listFilters.classId)===id)+'" onclick="homeworkPrototype.selectTaskFilter(&quot;'+id+'&quot;)">'+escape(label)+'<b>'+((taskFilterSheet==='subject'?listFilters.subject:listFilters.classId)===id?'✓':'')+'</b></button>').join('');}
    return '<div class="hp-filter-mask" onclick="homeworkPrototype.closeTaskFilter()"><section class="hp-filter-sheet" role="dialog" aria-modal="true" aria-label="'+title+'" onclick="event.stopPropagation()"><header><h2>'+title+'</h2><button aria-label="关闭筛选" onclick="homeworkPrototype.closeTaskFilter()">×</button></header>'+body+'</section></div>';}
  function teacherTaskCards() {
    const tasks = filteredListTasks();
    const groups = new Map();
    tasks.forEach(task => { const key = task.seriesId || task.id; if (!groups.has(key)) groups.set(key, []); groups.get(key).push(task); });
    let previousSection = '';
    return [...groups].sort(([, a], [, b]) => {
      const aDue = Math.max(...a.map(task => toDate(task.deadline).getTime())), bDue = Math.max(...b.map(task => toDate(task.deadline).getTime()));
      const published = group => Math.max(...group.map(task => {const time=toDate(task.publishedAt||'').getTime();return Number.isFinite(time)?time:0;}));
      return Number(bDue > Date.now()) - Number(aDue > Date.now()) || published(b) - published(a);
    }).map(([seriesId, group]) => {
      const ended = group.every(task => toDate(task.deadline).getTime() <= Date.now());
      const section = ended ? '历史任务' : '当前任务';
      const heading = section==='历史任务'&&section !== previousSection ? `<h2 class="hp-section">${section}</h2>` : '';
      previousSection = section;
      if (group.length === 1) {
        const task = listTask(group[0]), stat = summary(task), assignedClasses=detailTaskBase(group[0]).classIds;
        const listProgressLabel=assignedClasses.length>task.classIds.length?'本班已交齐':'已交齐';
        const allSubmitted = stat.target > 0 && stat.completed === stat.target;
        const canSupplement = toDate(task.submitDeadline).getTime() > Date.now();
        const status = allSubmitted ? listFilters.classId!=='all'&&assignedClasses.length>1?'本班已交齐':'全部已交' : !ended ? '进行中' : canSupplement ? '补交中' : '已截止';
        const statusTone = allSubmitted ? 'complete' : !ended ? 'ongoing' : canSupplement ? 'supplement' : 'closed';
        const shortTime = value => value.slice(5).replace('-', '月').replace(' ', '日 ');
        const timeLabel = allSubmitted || ended && !canSupplement ? '' : (!ended ? shortTime(task.deadline)+' 截止' : '补交至 '+shortTime(task.submitDeadline));
        const reviewCount = gradeQuestions(task).filter(q=>q.state==='review').length;
        const attention = reviewCount ? '待复核 '+reviewCount+' 题次' : '';
        const submissionRemainder = stat.target>stat.completed?'未交齐 '+(stat.target-stat.completed)+' 人':'';
        return `${heading}<button class="hp-card hp-task" onclick="homeworkPrototype.openTeacher('${task.id}',true)"><strong class="hp-list-task-title" title="${escape(task.title)}">${escape(task.title)}</strong><span class="hp-list-task-tags"><span class="hp-list-subject">${escape(task.subject||'综合')}</span><em class="hp-list-kind">${task.kind === 'checkin' ? '打卡' : '作业'}</em><em class="hp-list-state hp-list-state-${statusTone}">${status}</em></span><small>共 ${task.items.length} 项 · ${escape([...new Set(task.items.map(item=>typeLabel(item.type)))].join('、'))}</small><small>${escape(task.classIds.map(id => classes.find(row => row.id === id)?.name).join('、'))}${assignedClasses.length>1?' · 共 '+assignedClasses.length+' 个班':''}</small>${timeLabel ? `<div class="hp-task-times"><span>${escape(timeLabel)}</span></div>` : ''}${attention ? `<small>${escape(attention)}</small>` : ''}<span class="hp-line hp-task-bottom hp-submission-summary"><span>${listProgressLabel} <strong>${stat.completed}</strong> 人${submissionRemainder ? ` · ${submissionRemainder}` : ''}</span><b>查看提交 ›</b></span></button>`;
      }
      const phases = group.sort((a, b) => a.deadline.localeCompare(b.deadline));
      const upcoming = phases.findIndex(task => new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now());
      const nextIndex = upcoming >= 0 ? upcoming : phases.length - 1;
      const totals = phases.map(task => summary(listTask(task)));
      const completed = totals.reduce((sum, stat) => sum + stat.completed, 0), target = totals.reduce((sum, stat) => sum + stat.target, 0);
      const title = phases[0].title.replace(/ · 第\d+期$/, '');
      const classesLabel = listTask(phases[0]).classIds.map(id => classes.find(row => row.id === id)?.name).join('、');
      return `${heading}<section class="hp-card hp-series"><button class="hp-series-head" onclick="homeworkPrototype.openTeacherSeries('${escape(seriesId)}')"><strong class="hp-list-task-title" title="${escape(title)}">${escape(title)}</strong><span class="hp-list-task-tags"><span class="hp-list-subject">${escape(phases[0].subject||'综合')}</span><em>打卡 · 连续 ${phases.length} 期 · ${ended ? '已截止' : '进行中'}</em></span><small>${escape(classesLabel)} · 每日一交</small>${!ended ? `<span class="hp-series-next">最近截止：第${nextIndex+1}期 · ${escape(phases[nextIndex].deadline.slice(5))}</span>` : ''}<span class="hp-line hp-task-bottom"><span>累计完成 ${completed} / ${target} 人次</span><b>查看每日进度 ›</b></span></button></section>`;
    }).join('');
  }
  function teacherListV2() {
    return teacherList().replace(/^<div class="hp-hero">.*?<\/div>/s, '').split('<h2 class="hp-section">范围内任务</h2>')[0] + (publishedNotice ? `<div class="hp-success" role="status">${escape(publishedNotice)}</div>` : '') + listFilterBar() + (teacherTaskCards() || '<section class="hp-card hp-muted">没有符合筛选条件的任务。<button class="hp-secondary" onclick="homeworkPrototype.resetTaskFilters()">重置筛选</button></section>') + renderTaskFilter();
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
    const gradingChoice = (checked, index) => `<label class="hp-grading-choice"><input type="checkbox" ${checked?'checked':''} onchange="homeworkPrototype.${index===null?'setUniformGrading(this.checked)':`setItemGrading(${index},this.checked)`}"><span><strong>${index===null&&draft.items.length>1?'AI 批改所有图片项':'AI 批改这项图片作业'}</strong><small>关闭时只收集图片，不生成批改统计</small></span></label>`;
    const itemRows = draft.items.map((item, index) => `<div class="hp-requirement"><div class="hp-requirement-head"><span class="hp-requirement-number">${index + 1}</span><button type="button" class="hp-requirement-toggle" onclick="homeworkPrototype.toggleItemOptions(${index})"><strong>${escape(item.title || '未填写要求')}</strong><em>${typeLabel(item.type) || '选择提交方式'}${item.type==='photo'?` · ${item.gradingEnabled?'AI批改':'仅收图'}`:''} ${expandedItemIndex === index ? '⌃' : '›'}</em></button></div>${expandedItemIndex === index ? `<textarea aria-label="第 ${index + 1} 条要求" oninput="homeworkPrototype.setItem(${index},'title',this.value)">${escape(item.title)}</textarea>${typeChoices(item.type, index)}${draft.kind==='homework'&&item.type==='photo'?gradingChoice(item.gradingEnabled,index):''}${draft.items.length > 1 ? `<button class="hp-text-button" onclick="homeworkPrototype.removeItem(${index})">移除本条</button>` : ''}` : ''}</div>`).join('');
    const settings = `<section class="hp-compose-section"><div class="hp-setting-head"><h3>本次作业 · 共 ${draft.items.length} 项</h3><div class="hp-mode-switch"><button type="button" class="${settingMode === 'uniform' ? 'active' : ''}" onclick="homeworkPrototype.setSettingMode('uniform')">统一设置</button><button type="button" class="${settingMode === 'individual' ? 'active' : ''}" onclick="homeworkPrototype.setSettingMode('individual')">单独设置</button></div></div><p class="hp-muted">${recognitionStale ? '内容已修改，请核对识别结果。' : recognizedCount ? `以下 ${draft.items.length} 项将作为一次作业发布。` : '未识别出编号时，按整段内容设置。'}</p>${recognitionStale && settingMode === 'individual' && (recognizedCount > 0 || draft.items.length > 1) ? '<button class="hp-text-button" onclick="homeworkPrototype.applyRecognition()">确认重新识别</button>' : ''}${settingMode === 'uniform' ? typeChoices(uniformType)+(draft.kind==='homework'&&uniformType==='photo'?gradingChoice(draft.items.every(item=>item.gradingEnabled),null):'') : `${itemRows}<button class="hp-add" onclick="homeworkPrototype.addItem()">＋ 手动添加一项</button>`}</section>`;
    const material = `<div class="hp-attachment-field"><div class="hp-attachment-heading"><strong>附件<span>（选填）</span></strong><button type="button" onclick="homeworkPrototype.openMaterialSource()" ${materialReading ? 'disabled' : ''}>${materialReading ? '正在添加…' : '＋ 添加附件'}</button></div>${renderMaterialAttachments(draft, true)}<input id="hp-material-album" class="hp-hidden-file" type="file" accept="image/*,video/*" multiple onchange="homeworkPrototype.addMaterialFiles(this)"><input id="hp-material-camera" class="hp-hidden-file" type="file" accept="image/*,video/*" capture="environment" onchange="homeworkPrototype.addMaterialFiles(this)"><input id="hp-material-document" class="hp-hidden-file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt" multiple onchange="homeworkPrototype.addMaterialFiles(this)"></div>${materialSourceOpen ? `<div class="hp-source-mask" onclick="homeworkPrototype.closeMaterialSource()"><section class="hp-source-sheet hp-attachment-source" role="dialog" aria-modal="true" aria-label="添加附件" onclick="event.stopPropagation()"><strong>${chatDemoOpen ? '选择聊天附件（演示）' : '添加附件'}</strong>${chatDemoOpen ? `<button type="button" onclick="homeworkPrototype.chooseChatAttachment('image')">练习题.png<small>图片 · 微信聊天记录</small></button><button type="button" onclick="homeworkPrototype.chooseChatAttachment('file')">作业要求.txt<small>文件 · 微信聊天记录</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('chat-video')">选择视频演示<small>视频 · 使用本地视频体验</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('chat-file')">选择其他文件<small>PDF、Word、PPT、Excel、TXT</small></button>` : `<button type="button" onclick="homeworkPrototype.chooseMaterialMedia('album')">从手机相册选择<small>图片或视频</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('camera')">拍照或拍摄<small>拍摄图片或视频</small></button><button type="button" onclick="homeworkPrototype.showChatDemo()">从微信聊天记录选择<small>图片、视频或文件</small></button>`}<button type="button" class="hp-source-cancel" onclick="homeworkPrototype.closeMaterialSource()">取消</button></section></div>` : ''}`;
    const dateRows = `<section class="hp-compose-section"><h3>截止时间</h3><button type="button" class="hp-date-summary" onclick="homeworkPrototype.openDatePicker('deadline')"><span>首次截止</span><strong>${prettyDate(draft.deadline)}</strong><b>›</b></button><button type="button" class="hp-date-summary" onclick="homeworkPrototype.openDatePicker('submitDeadline')"><span>允许补交至</span><strong>${prettyDate(draft.submitDeadline)}</strong><b>›</b></button><p class="hp-muted">补交截止默认比首次截止晚 7 天，可修改。</p></section>`;
    const firstStep = `<section class="hp-card hp-compose-card"><div class="hp-auto-title-row"><strong>${escape(draft.title)}</strong>${subjectOptions().length > 1 ? `<select aria-label="选择任教学科" onchange="homeworkPrototype.setSubject(this.value)">${subjectOptions().map(subject => `<option value="${escape(subject)}" ${draft.subject === subject ? 'selected' : ''}>${escape(subject)}</option>`).join('')}</select>` : ''}</div>${!subjectOptions().length ? '<p class="hp-error">暂无可发布学科，请联系学校管理员核对任教关系。</p>' : ''}${draft.kind === 'checkin' ? `<label class="hp-field">连续打卡天数（1—30 天）<input type="number" min="1" max="30" value="${draft.cycleCount}" onchange="homeworkPrototype.setCycleCount(this.value)"></label>` : ''}<details class="hp-field hp-description-field" ${recognizedCount?'':'open'}><summary>任务内容${recognizedCount?' · 已整理为下方要求':''}</summary><span class="hp-field-heading"><strong>作业说明</strong><button type="button" class="hp-demo-button" onclick="homeworkPrototype.fillDemoPaste()">填入演示内容</button></span><textarea class="hp-paste-area" placeholder="粘贴作业要求，编号自动分条" oninput="homeworkPrototype.setField('description',this.value)" onblur="setTimeout(() => homeworkPrototype.recognizeDescription(), 0)">${escape(draft.description)}</textarea></details>${material}</section>${settings}${dateRows}`;
    const selectedClasses=classes.filter(c=>draft.classIds.includes(c.id));if(!draft.classIds.includes(recipientClassId))recipientClassId=draft.classIds[0]||'';
    const activeClass=selectedClasses.find(c=>c.id===recipientClassId),classRoster=eligible.filter(student=>student.classId===recipientClassId),selectedInClass=classRoster.filter(student=>draft.targetStudentIds.includes(student.id)).length;
    const matchStudent=student=>(student.name+' '+student.id).toLowerCase().includes(recipientSearch.toLowerCase());
    const picking=`<div class="hp-recipient-summary"><strong>已选 ${selectedClasses.filter(c=>eligible.some(student=>student.classId===c.id&&draft.targetStudentIds.includes(student.id))).length} 个班 · ${draft.targetStudentIds.length} 名学生</strong><small>切换下方班级可继续选人，其他班级的选择会保留。</small></div><div class="hp-recipient-tabs" role="tablist" aria-label="按班选择学生">${selectedClasses.map(c=>`<button type="button" role="tab" aria-selected="${recipientClassId===c.id}" class="${recipientClassId===c.id?'active':''}" onclick="homeworkPrototype.selectRecipientClass(' single-id ')"><strong>${escape(c.name)}</strong><span>已选 ${eligible.filter(student=>student.classId===c.id&&draft.targetStudentIds.includes(student.id)).length}/${eligible.filter(student=>student.classId===c.id).length}</span></button>`.replace(' single-id ',c.id)).join('')}</div>${activeClass?`<div class="hp-recipient-roster"><div class="hp-recipient-roster-heading"><strong>${escape(activeClass.name)}</strong><span><button onclick="homeworkPrototype.selectRecipientClassAll(true)">全选本班</button><button onclick="homeworkPrototype.selectRecipientClassAll(false)">清空本班</button></span></div><input class="hp-search" aria-label="搜索本班学生" placeholder="搜索本班姓名或学号" value="${escape(recipientSearch)}" oninput="homeworkPrototype.filterStudents(this.value)"><small class="hp-muted">本班已选 ${selectedInClass}/${classRoster.length} 人；全选与清空作用于整个班级。</small><div class="hp-students">${classRoster.map(student=>`<label class="hp-student-option" data-search="${escape((student.name+' '+student.id).toLowerCase())}" ${matchStudent(student)?'':'hidden'}><input type="checkbox" ${draft.targetStudentIds.includes(student.id)?'checked':''} onchange="homeworkPrototype.toggleStudent('${student.id}')"><span>${escape(student.name)}<small>${escape(student.id)}</small></span></label>`).join('')}<p class="hp-recipient-empty" ${classRoster.some(matchStudent)?'hidden':''}>本班没有匹配的学生，已选名单保留。</p></div></div>`:'<p class="hp-muted">请先选择任教班级。</p>'}<p class="hp-target-count">预计接收 ${draft.targetStudentIds.length} 名学生<small>未选学生的班级不会收到本任务。</small></p>`;
    const recipients=`<section class="hp-compose-section"><h3>选择任教班级<span class="hp-class-hint">可多选</span></h3><div class="hp-class-options">${classes.filter(row=>subjectClassIds(draft.subject).includes(row.id)).map(row=>`<button type="button" class="${draft.classIds.includes(row.id)?'active':''}" onclick="homeworkPrototype.toggleClass('${row.id}')"><span>${escape(row.name)}</span><small>${students.filter(student=>student.classId===row.id).length}人</small><b>${draft.classIds.includes(row.id)?'✓':'○'}</b></button>`).join('')}</div></section><section class="hp-compose-section"><h3>发送范围</h3><div class="hp-target-options"><button class="${draft.targetMode==='all'?'active':''}" onclick="homeworkPrototype.setTargetMode('all')">${draft.targetMode==='all'?'◉':'○'} 所选班级全体</button><button class="${draft.targetMode==='selected'?'active':''}" onclick="homeworkPrototype.setTargetMode('selected')">${draft.targetMode==='selected'?'◉':'○'} 跨班指定学生</button></div>${draft.targetMode==='selected'?picking:`<p class="hp-target-count">预计接收 ${eligible.length} 名学生</p>`}</section>`;

    return `${steps}${composeStep === 0 ? firstStep : recipients}${composeError ? `<p class="hp-error" role="alert">${escape(composeError)}</p>` : ''}${composeStep ? '<button class="hp-text-button hp-compose-back" onclick="homeworkPrototype.backCompose()">返回修改</button>' : ''}<button class="hp-primary hp-space" onclick="homeworkPrototype.nextCompose()">${composeStep ? '核对发布内容' : '下一步：选择班级和学生'}</button>${renderDatePicker()}`;
  }
  function teacherPreviewV2() {
    syncDraftTitle();
    const eligible = students.filter(row => draft.classIds.includes(row.classId));
    const recipients = draft.targetMode === 'selected' ? eligible.filter(row => draft.targetStudentIds.includes(row.id)) : eligible;
    const demoChoices = '';
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToCompose()">‹ 返回修改</button><h1>核对发布内容</h1></div><p class="hp-step-hint">请核对接收对象和两个截止时间，确认后家长会在作业列表看到这项任务。</p><section class="hp-card"><span class="hp-line"><strong>${escape(draft.title)}</strong><em>${draft.kind === 'checkin' ? '打卡' : '作业'}</em></span>${draft.description ? `<p>${escape(draft.description)}</p>` : ''}${renderMaterialAttachments(draft)}<small>正常截止：${escape(draft.deadline)}</small><small>允许补交至：${escape(draft.submitDeadline)}</small></section><section class="hp-card"><h2>完成项目 · ${draft.items.length} 项</h2>${draft.items.map((item, index) => `<div class="hp-review-item"><strong>${index + 1}. ${escape(item.title)}</strong><small>${escape(item.instruction)}</small><small>${typeLabel(item.type)} · 必交${item.type==='photo'&&draft.kind==='homework'?` · ${item.gradingEnabled?'AI 批改':'仅收集图片'}`:''}</small></div>`).join('')}</section><section class="hp-card"><h2>接收对象 · ${recipients.length} 人</h2><p>${escape(draft.classIds.map(id => classes.find(row => row.id === id)?.name || id).join('、'))} · ${draft.targetMode === 'selected' ? '指定学生' : '全班'}</p>${draft.targetMode === 'selected' ? `<details class="hp-recipient-details"><summary>查看全部接收学生</summary><div>${classes.filter(c=>draft.classIds.includes(c.id)).map(c=>`<section class="hp-recipient-preview-group"><strong>${escape(c.name)} · ${recipients.filter(student=>student.classId===c.id).length} 人</strong><p>${recipients.filter(student=>student.classId===c.id).map(student=>escape(student.name)).join('、')||'未选学生，本班不发送'}</p></section>`).join('')}</div></details>` : ''}<small>确认发布后冻结此名单；家长仅能查看自己孩子的提交内容。</small></section><p class="hp-muted">请确认题目和页数没有遗漏。发布后不再补充题目，遗漏需另发任务。参考资料可后续维护。</p>${demoChoices}${composeError ? `<p class="hp-error" role="alert">${escape(composeError)}</p>` : ''}<button class="hp-primary hp-space" onclick="homeworkPrototype.publish()">确认发布</button>`;
  }
  function renderTeacher() { checkLocalDemo('teacher'); return teacherMode === 'success' ? `<button class="hp-success-back" onclick="homeworkPrototype.toTeacherList()" aria-label="返回作业首页">‹ 返回作业首页</button><section class="hp-card hp-publish-success"><div class="hp-publish-check">✓</div><h2>发布成功</h2><p>${escape(publishedNotice)}</p><button class="hp-primary" onclick="homeworkPrototype.toTeacherList()">查看已发布任务</button></section>` : teacherMode === 'compose' ? teacherComposeV2() : teacherMode === 'preview' ? teacherPreviewV2() : teacherMode === 'series' ? teacherSeriesView() : teacherMode === 'questions' ? teacherQuestionResults() : teacherMode === 'question' ? teacherGradeQuestion() : teacherMode === 'result' ? teacherTaskById(teacherTaskId) ? wholeGrade(teacherTaskById(teacherTaskId),teacherStudentId,students.find(s=>s.id===teacherStudentId)?.name||'学生') : teacherListV2() : teacherMode === 'references' ? answerWorkflowPanel(teacherTaskById(teacherTaskId)) : teacherMode === 'detail' ? teacherDetailView() : teacherMode === 'students' ? teacherStudents() : teacherMode === 'student' ? teacherStudent() : teacherListV2(); }
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
      const submittedPreview = record && submittedMedia ? item.type === 'photo' ? `<button class="hp-paper-preview" onclick="homeworkPrototype.openPaper(this)"><img class="hp-submitted-media" src="${submittedMedia}" alt="已提交的作业照片"><span>点击放大查看</span></button>` : item.type === 'video' ? `<video class="hp-original-video" controls src="${submittedMedia}"></video>` : item.type === 'audio' ? `<audio controls src="${submittedMedia}"></audio>` : item.type === 'file' ? `<a class="hp-file-preview" href="${submittedMedia}" download="${escape(record.label)}">📄 ${escape(record.label)}　查看文件 ›</a>` : '' : '';
      const pendingPreview = pending ? pending.type === 'photo' ? `<button class="hp-paper-preview" onclick="homeworkPrototype.openPaper(this)"><img class="hp-original" src="${pending.media}" alt="待提交照片预览"><span>A3 / A4 横竖版均可 · 点击放大检查</span></button>` : pending.type === 'video' ? `<video class="hp-original-video" controls src="${pending.media}"></video>` : pending.type === 'audio' ? `<audio controls src="${pending.media}"></audio>` : `<div class="hp-file-preview">📄 ${escape(pending.name)}</div>` : '';
      const upload = closed ? '<p class="hp-muted">补交已结束，本项仅可查看。</p>' : item.type === 'none' ? record ? '' : `<button class="hp-primary hp-item-action" onclick="homeworkPrototype.submit('${task.id}','${item.id}')">确认已完成</button>` : pending ? `<div class="hp-pending"><strong>请核对要提交的${types[item.type]}</strong><small>${escape(pending.name)}</small>${pendingPreview}${record ? '<small>重新提交后，新版本将成为当前提交；旧版本仍保留在提交记录中。</small>' : ''}${pending.transient ? '<small>大文件只在本次预览中保留，刷新后需重新选择。</small>' : ''}<button class="hp-primary hp-item-action" onclick="homeworkPrototype.confirmUpload()">${record ? '确认重新提交' : '确认提交本项'}</button><button class="hp-text-button hp-cancel" onclick="homeworkPrototype.cancelUpload()">取消选择</button></div>` : item.type === 'photo' ? `<span class="hp-field-heading hp-photo-demo-heading"><strong>作业照片</strong><button type="button" class="hp-demo-button" onclick="homeworkPrototype.fillParentDemoPhoto('${task.id}','${item.id}')">填入演示内容</button></span><button class="hp-primary hp-item-action" onclick="homeworkPrototype.openParentPhotoSource('${task.id}','${item.id}')">${record ? '重新提交' : '上传'}图片</button><input id="hp-parent-photo-${escape(item.id)}" class="hp-hidden-file" type="file" accept="image/*" onchange="homeworkPrototype.submitFile('${task.id}','${item.id}',this)"><small>图片≤20MB；选择后请先核对，再确认提交。</small>` : `<label class="hp-upload hp-upload-primary">${record ? '重新提交' : '上传'}${types[item.type]}<input type="file" accept="${accept[item.type]}" onchange="homeworkPrototype.submitFile('${task.id}','${item.id}',this)"></label><small>${item.type === 'file' ? '支持 PDF、Word、PPT、Excel、TXT，≤50MB。' : '图片≤20MB；视频≤200MB且≤5分钟；录音≤50MB且≤10分钟。'}</small>`;
      const history = store.submissions.filter(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId).sort((a, b) => (b.version || 1) - (a.version || 1));
      const grade = '';
      return `<section class="hp-card hp-parent-item"><span class="hp-line"><strong>${index + 1}. ${escape(item.title)}</strong><em class="${record ? 'hp-tag-done' : ''}">${record ? '已完成' : typeLabel(item.type)}</em></span>${item.instruction ? `<p>${escape(item.instruction)}</p>` : ''}${record ? `<small class="hp-done">✓ ${escape(record.submittedAt || '已完成')} · 第 ${record.version || 1} 版 · ${record.late ? "补交 · " : ""}${escape(record.label)}</small>${record.mock ? '<small>演示提交记录</small>' : ''}${record.transient && !submittedMedia ? '<small>原文件已失效，请重新选择。</small>' : ''}${submittedPreview}${grade}${history.length > 1 ? `<div class="hp-question-results"><strong>提交记录</strong>${history.map(row => `<small>第 ${row.version || 1} 版 · ${escape(row.submittedAt)} · ${escape(row.label)}</small>`).join('')}</div>` : ''}` : ''}${upload}</section>`;
    }).join('');
    const deadlineNotice = closed ? '补交已结束，任务已转为只读。' : Date.now() > toDate(task.deadline).getTime() ? '已过正常截止时间，仍可补交或重新提交，记录将标记为补交。' : '请在正常截止时间前完成；补交截止前可重新提交。';
    const photoSource = parentPhotoSource?.taskId === task.id ? `<div class="hp-source-mask" onclick="homeworkPrototype.closeParentPhotoSource()"><section class="hp-source-sheet hp-attachment-source" role="dialog" aria-modal="true" aria-label="选择图片来源" onclick="event.stopPropagation()"><strong>${parentPhotoSource.chatOpen ? (parentPhotoSource.demoOpen ? '选择作业演示图片' : '选择微信内图片（演示）') : '选择图片来源'}</strong>${parentPhotoSource.chatOpen ? `${parentDemoPhotos.map((photo,index)=>`<button type="button" class="hp-demo-photo-choice" onclick="homeworkPrototype.useParentChatDemoPhoto(${index})"><img src="../miniprogram/assets/${photo.file}" alt="${photo.name}"><span>${photo.name}<small>${photo.detail} · 演示素材</small></span></button>`).join('')}<button type="button" onclick="homeworkPrototype.chooseParentPhotoFile()">选择本地图片体验<small>网页原型使用本地文件模拟微信选择</small></button>` : `<button type="button" onclick="homeworkPrototype.chooseParentPhotoFile()">从手机相册选择<small>图片，单次 1 张</small></button><button type="button" onclick="homeworkPrototype.showParentChatPhotos()">从微信聊天记录选择<small>聊天中的图片</small></button><button type="button" onclick="homeworkPrototype.showParentChatPhotos(true)">填入演示作业照片<small>内置 3 张素材，无需准备本地图片</small></button>`}<button type="button" class="hp-source-cancel" onclick="homeworkPrototype.closeParentPhotoSource()">取消</button></section></div>` : '';
    return referenceLibrary(task,true)+`<section class="hp-card hp-parent-summary"><span class="hp-line"><strong>已完成 ${done}/${task.items.length} 项</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'}</em></span>${task.description ? `<p>${escape(task.description)}</p>` : ''}${renderMaterialAttachments(task)}<small>正常截止 ${escape(task.deadline)}</small><small>允许补交至 ${escape(task.submitDeadline)}</small><p class="hp-deadline-notice">${deadlineNotice}</p><small>同一学生的绑定家长共享任务进度；系统记录本次操作账号。</small></section>${mine.some(row=>row.questions?.length)?gradeStatus(task,mine,true)+(grading.gradingProgress(mine.flatMap(row=>row.questions||[]),true).released?'<button class="hp-secondary" onclick="homeworkPrototype.openParentGrade()">'+(grading.gradingProgress(mine.flatMap(row=>row.questions||[]),true).unavailable?'查看已完成批改结果':'查看整份批改结果')+' ›</button>':''):''}<h2 class="hp-section">完成项目</h2>${items}${photoSource}`;
  }
  const renderParent = (studentName, childIndex = 0) => { completeDemoUploads(); checkLocalDemo('parent'); guardianId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID; if (parentTaskId && !targetIds(taskById(parentTaskId) || { classIds: [], targetStudentIds: null }).includes(guardianId)) parentTaskId = ''; return parentTaskId ? gradeUI.parentOpen ? wholeGrade(taskById(parentTaskId),guardianId,studentName,true) : parentDetailV2(studentName) : parentListV2(studentName); };
  let demoUploadTimer;
  function completeDemoUploads() {
    clearTimeout(demoUploadTimer);
    if(localPageDemo?.snapshot)return;
    let changed=false,nextReadyAt=Infinity;
    latestRows(store.submissions).forEach(record=>{
      if(!record.demoGradeReadyAt)return;
      if(record.demoGradeReadyAt>Date.now()){nextReadyAt=Math.min(nextReadyAt,record.demoGradeReadyAt);return;}
      record.questions.forEach(q=>{if(q.state==='processing'&&q.demoFinalState){q.state=q.demoFinalState;delete q.demoFinalState;delete q.estimatedMinutes;}});
      delete record.demoGradeReadyAt;changed=true;
    });
    if(changed)save();
    if(Number.isFinite(nextReadyAt))demoUploadTimer=setTimeout(()=>parentRefresh(),Math.max(0,nextReadyAt-Date.now())+30);
  }
  const submitRecord = (task, item, label, media = '', transientMedia = '', demoPhotoIndex = null) => {
    const version = store.submissions.filter(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId).reduce((max, row) => Math.max(max, row.version || 1), 0) + 1;
    const submittedAt = new Date().toLocaleString('zh-CN', { hour12: false }).replaceAll('/', '-');
    const record = { taskId: task.id, itemId: item.id, studentId: guardianId, submittedBy: 'guardian-demo-001', label, media, transient: Boolean(transientMedia), submittedAt, late: submittedAt > task.deadline, version, mock: label.startsWith('模拟'), questions: seedQuestions(task, item, guardianId).map(q=>({...q,state:'queued',estimatedMinutes:2})) };
    if(Number.isInteger(demoPhotoIndex)&&parentDemoPhotos[demoPhotoIndex]&&record.questions.length){
      const questions=demoPhotoIndex===0?seedQuestions(task,item,guardianId):grading.realPhotoQuestions('page-'+demoPhotoIndex,item.id+'-');
      record.questions=questions.map(q=>({...q,demoFinalState:q.state,state:'processing'}));
      record.mock=true;record.demoGradeReadyAt=Date.now()+1200;
    }
    if (transientMedia) sessionMedia.set(mediaKey(record), transientMedia);
    else sessionMedia.delete(mediaKey(record));
    const previous=latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.itemId===item.id&&r.studentId===guardianId))[0];record.questions.forEach(q=>{if(previous?.questions?.some(old=>old.id===q.id&&old.reviewReason==='manual-hold')){q.state='review';q.reviewReason='manual-hold';}});
    store.submissions.push(record);if(task.needsAnswerConfirmation){syncAnswerWorkflow(task);grading.startStandardGrading(workflowTask(task),standardRecords(task));}
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
    ...workflowActions,
    renderTeacher() { return decoratePageDemo(renderTeacher(),'teacher').replace(/<div class="hp-top">[\s\S]*?<\/h1><\/div>/g, '').replace(/<button class="hp-success-back"[\s\S]*?<\/button>/g, '').replace(/<button class="hp-text-button hp-compose-back"[\s\S]*?<\/button>/g, '').replace(/(<section class="hp-series-overview">)<h2>[\s\S]*?<\/h2>/, '$1').replace('<h2>发布成功</h2>', '') + renderMaterialPreview() + renderGradeReviewDialog(); }, renderParent(studentName, childIndex = 0) { return decoratePageDemo(renderParent(studentName, childIndex),'parent') + renderMaterialPreview(); }, getTeacherMode: () => teacherMode,

    openQuestionResults(itemId){const task=teacherTaskById(teacherTaskId);const items=task?.items.filter(item=>item.type==='photo'&&item.gradingEnabled===true)||[];if(!items.length)return;questionResultsItem=items.some(item=>item.id===itemId)?itemId:items[0].id;teacherMode='questions';teacherRefresh(true);},
    filterQuestionResults(id){questionResultsItem=id;teacherRefresh(true);},
    openGradeQuestion(id){const task=teacherTaskById(teacherTaskId);if(!task||!gradeQuestions(task).some(q=>q.id===id))return;teacherQuestionId=id;teacherQuestionSource='photo';teacherFilter='all';teacherMode='question';batchReview={key:'',selected:{},choice:''};rememberReview();teacherRefresh(true);},
    showQuestionSource(source){if(!['photo','text'].includes(source))return;teacherQuestionSource=source;teacherRefresh();},
    filterGradeStudents(value){if(!['all','correct','wrong','pending'].includes(value))return;teacherFilter=value;batchReview={key:'',selected:{},choice:''};rememberReview();teacherRefresh();},
    openGradedStudent(id){const task=teacherTaskById(teacherTaskId);if(!task||!targetIds(task).includes(id))return;teacherStudentId=id;gradeUI.origin='question';gradeUI.q=teacherQuestionId;gradeUI.wrongOnly=false;const records=submissionsFor(task).filter(r=>r.studentId===id&&r.questions?.length);gradeUI.page=Math.max(0,records.findIndex(r=>r.questions.some(q=>q.id===teacherQuestionId)));teacherMode='result';teacherRefresh(true);},
    openStudentGrade(){gradeUI.origin='student';gradeUI.page=0;gradeUI.q='';gradeUI.wrongOnly=false;teacherMode='result';teacherRefresh(true);},
    openMistakeReason(){if(!parentQuestionContext())return;learningUI.reasonOpen=true;learningUI.feedback='';parentRefresh();},
    closeMistakeReason(){learningUI.reasonOpen=false;parentRefresh();},
    chooseMistakeReason(reason){if(learning().MISTAKE_REASONS.includes(reason))learningUI.reason=reason;parentRefresh();},
    saveHomeworkMistake(){const c=parentQuestionContext();if(!c)return;const entries=learning().addNotebookEntry(readNotebook(),{studentId:c.studentId,taskId:c.task.id,itemId:c.record.itemId,version:c.record.version||1,imagePath:c.record.mock?samplePhoto(c.record):mediaFor(c.record),taskTitle:c.task.title},c.q,learningUI.reason);try{localStorage.setItem(learning().NOTEBOOK_KEY,JSON.stringify(entries));learningUI.reasonOpen=false;learningUI.feedback='';}catch{learningUI.feedback='保存失败，请稍后重试';}parentRefresh();},
    openHomeworkNotebook(){if(!parentQuestionContext())return;learningUI.mode='notebook';parentRefresh(true);},
    openHomeworkTutor(){
      const c=parentQuestionContext();if(!c)return;
      if(grading.canUseAIExplanation&&!grading.canUseAIExplanation(c.q)){alert('判定已更新，讲解暂未核实，请稍后重试。');return;}
      if(!window.homeworkTutorUI||!window.homeworkTutor){alert('讲题模块未加载，请刷新重试。');return;}
      const accountId=window.parentPrototype?.getTutorAccount?.()||'guardian-demo-001';
      const source={accountId,studentId:c.studentId,taskId:c.task.id,itemId:c.record.itemId,submissionVersion:c.record.version||1,question:JSON.parse(JSON.stringify(c.q))};
      const fingerprint=window.homeworkTutor.tutorFingerprint(source);
      const records=latestRows(store.submissions.filter(r=>r.taskId===c.task.id&&r.studentId===c.studentId));
      const images=(/跨页|续答|第1页|第 1 页/.test(c.q.stem||'')?records:[c.record]).map(r=>r.mock?samplePhoto(r):mediaFor(r)).filter(Boolean);
      const returnPanel=document.querySelector('.parent-main'),returnScroll=returnPanel?.scrollTop||0;
      const expanded=Array.from(document.querySelectorAll('#hp-grade-selected details')).map(el=>el.open);
      learningUI.mode='tutor';learningUI.reasonOpen=false;
      window.homeworkTutorUI.open({source,label:c.q.label,images,studentName:students.find(s=>s.id===c.studentId)?.name||'当前孩子'},{render:()=>{parentRefresh();const panel=document.querySelector('.parent-main');if(panel&&panel.scrollTop>panel.scrollHeight-panel.clientHeight)panel.scrollTop=0;},valid:()=>{const now=parentQuestionContext();const p=window.parentPrototype?.getDemoContext?.();return Boolean(now&&(!window.parentPrototype||window.parentPrototype.hasGuardianAccess())&&(!p||p.homework)&&now.studentId===source.studentId&&(window.parentPrototype?.getTutorAccount?.()||'guardian-demo-001')===accountId&&window.homeworkTutor.tutorFingerprint({...source,submissionVersion:now.record.version||1,question:now.q})===fingerprint&&(!grading.canUseAIExplanation||grading.canUseAIExplanation(now.q)));},leave:()=>{learningUI.mode='result';parentRefresh();Array.from(document.querySelectorAll('#hp-grade-selected details')).forEach((el,i)=>{if(i<expanded.length)el.open=expanded[i];});const panel=document.querySelector('.parent-main');if(panel)panel.scrollTop=returnScroll;}});
      if(returnPanel)document.querySelector('.parent-main').scrollTop=0;
    },
    closeHomeworkLearning(){if(learningUI.mode==='tutor'&&window.homeworkTutorUI?.active()){window.homeworkTutorUI.close();return;}learningUI.mode='result';learningUI.reasonOpen=false;parentRefresh();},
    beginHomeworkGuide(){window.homeworkTutorUI?.restart();},
    setHomeworkTutorAnswer(value){window.homeworkTutorUI?.draft(value);},
    askHomeworkTutor(){window.homeworkTutorUI?.ask();},
    homeworkTutorHint(){window.homeworkTutorUI?.hint();},
    advanceHomeworkTutor(){window.homeworkTutorUI?.submit();},
    openParentGrade(){const task=taskById(parentTaskId);if(!task||!targetIds(task).includes(guardianId)||!latestRows(store.submissions.filter(row=>row.taskId===task.id&&row.studentId===guardianId)).some(row=>row.questions?.some(grading.isResultReleased)))return;learningUI.mode='result';learningUI.reasonOpen=false;gradeUI.parentOpen=true;gradeUI.page=0;gradeUI.q='';gradeUI.wrongOnly=false;parentRefresh(true);},
    gradePage(index,parent){learningUI.mode='result';learningUI.reasonOpen=false;gradeUI.page=index;gradeUI.q='';parent?parentRefresh():teacherRefresh();},
    selectGradeQuestion(id,parent){learningUI.mode='result';learningUI.reasonOpen=false;gradeUI.wrongOnly=false;gradeUI.q=id;parent?parentRefresh():teacherRefresh();if(typeof document!=='undefined')document.getElementById('hp-grade-selected')?.scrollIntoView({behavior:'smooth',block:'start'});},
    toggleGradeWrong(parent){gradeUI.wrongOnly=!gradeUI.wrongOnly;gradeUI.q='';parent?parentRefresh():teacherRefresh();},
    enableAnswerWorkflow(conflicts=false){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;const base=workflowTask(task);base.needsAnswerConfirmation=true;syncAnswerWorkflow(base,conflicts);teacherMode='detail';answerError='';save();teacherRefresh();},
    approveAnswer(id,source,answer='',explanation=''){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task)||!['teacher','ai','custom'].includes(source))return;const base=workflowTask(task),records=standardRecords(base);if(!grading.confirmAnswerStandard(base,records,id,source,workScope.teacherId,answer,explanation)){answerError='请填写参考答案（解析选填）';teacherRefresh();return;}answerExpanded=id;answerError='参考答案已保存，学生判定和统计保持不变';save();teacherRefresh();},
    approveCustomAnswer(id){if(typeof document==='undefined')return;this.approveAnswer(id,'custom',document.getElementById('answer-value-'+id)?.value||'',document.getElementById('answer-explain-'+id)?.value||'');},
    confirmMatchingAnswers(){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;const base=workflowTask(task),records=standardRecords(base);base.answerStandards?.filter(s=>s.status==='pending'&&grading.answersEquivalent(s.teacherAnswer,s.aiAnswer)).forEach(s=>grading.confirmAnswerStandard(base,records,s.questionId,'teacher',workScope.teacherId));save();teacherRefresh();},
    refreshAnswerGrading(){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;const base=workflowTask(task);grading.completeMockStandardGrading(base,standardRecords(base));save();teacherRefresh();},
    prepareAnswerWorkflow(){this.prepareConsoleScenario('unreleased');this.openConsoleTask('teacher');const base=taskById('homework-console-v1');delete base.answerStandards;base.needsAnswerConfirmation=true;syncAnswerWorkflow(base,true);store.consoleDemo.scenario='answerConflict';answerExpanded='';answerError='';save();teacherRefresh();},
    openGradeRelease(){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;gradeReleaseOpen=true;teacherRefresh();},
    closeGradeRelease(){gradeReleaseOpen=false;teacherRefresh();},
    confirmGradeRelease(){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;gradeQuestions(task).forEach(q=>grading.releaseQuestion(q,new Date().toISOString()));save();gradeReleaseOpen=false;answerError='已开放当前有效结果，待复核题继续保留';teacherRefresh();},
    gradeScenario(value){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task)||typeof location==='undefined'||!new URLSearchParams(location.search).has('review'))return;submissionsFor(task).forEach(r=>r.questions?.forEach((q,i)=>{q.demoOriginalState??=q.state==='queued'||q.state==='processing'||q.state==='failed'?'confirmed':q.state;q.state=value==='complete'?q.demoOriginalState:value==='partial'&&i===0?q.demoOriginalState:value==='failed'&&i===0?q.demoOriginalState:value==='failed'?'failed':value==='queued'?'queued':'processing';q.estimatedMinutes=value==='failed'?undefined:2;delete q.releasedSignature;delete q.releasedAt;}));save();teacherRefresh();},


    getPageDemoContext:pageDemoContext,
    getTaskListFilters(){return JSON.parse(JSON.stringify(listFilters));},
    getFilteredTaskIds(){return filteredListTasks().map(task=>task.id);},
    openTaskFilter(kind){if(!['subject','class','status'].includes(kind))return;taskFilterSheet=kind;taskStatusDraft=[...listFilters.statuses];taskFilterError='';teacherRefresh();},
    closeTaskFilter(){taskFilterSheet='';teacherRefresh();},
    selectTaskFilter(id){if(taskFilterSheet==='subject'&&(id==='all'||listSubjects().includes(id)))listFilters.subject=id;else if(taskFilterSheet==='class'&&(id==='all'||listClassIds().includes(id)))listFilters.classId=id;else return;normalizeListFilters();taskFilterSheet='';teacherRefresh();},
    toggleTaskStatus(id){if(!window.homeworkFilters.ALL_TASK_STATUSES.includes(id))return;taskStatusDraft=taskStatusDraft.includes(id)?taskStatusDraft.filter(value=>value!==id):[...taskStatusDraft,id];taskFilterError='';teacherRefresh();},
    toggleAllTaskStatuses(){taskStatusDraft=taskStatusDraft.length===window.homeworkFilters.ALL_TASK_STATUSES.length?[]:[...window.homeworkFilters.ALL_TASK_STATUSES];taskFilterError='';teacherRefresh();},
    resetTaskStatusDraft(){taskStatusDraft=[...window.homeworkFilters.ALL_TASK_STATUSES];taskFilterError='';teacherRefresh();},
    confirmTaskStatuses(){if(!taskStatusDraft.length){taskFilterError='请至少选择一个状态';teacherRefresh();return;}listFilters.statuses=window.homeworkFilters.normalizeTaskStatuses(taskStatusDraft);taskFilterSheet='';teacherRefresh();},
    resetTaskFilters(){listFilters.subject='all';listFilters.classId='all';listFilters.statuses=[...window.homeworkFilters.ALL_TASK_STATUSES];taskFilterSheet='';teacherRefresh();},
    clearPageDemo(){restoreLocalDemo();},
    restorePageDemo(role){if(!localPageDemo)return;restoreLocalDemo();role==='parent'?parentRefresh():teacherRefresh();},
    applyPageDemo(id,role){
      const context=pageDemoContext(role),choice=context.choices.find(c=>c[0]===id);if(!choice)return;
      const old=localPageDemo;restoreLocalDemo();const task=taskById(context.taskId);
      localPageDemo={key:context.key,id,label:choice[1],composeError:composeError||'',choices:context.choices,snapshot:old?.snapshot||(task?{task:JSON.parse(JSON.stringify(task)),submissions:JSON.parse(JSON.stringify(store.submissions.filter(r=>r.taskId===task.id)))}:null)};
      if(id==='publish-network'||id==='publish-roster'){publishDemoBranch=id==='publish-network'?'network':'roster';composeError=id==='publish-network'?'发布失败：网络暂不可用。内容已保留，请恢复正常后重试。':'发布前接收名单发生变化，请返回核对布置对象。';}
      else if(id.startsWith('upload-'))localPageDemo.message=({ 'upload-format':'文件格式不支持，请选择老师要求的文件类型。','upload-size':'文件超过大小限制，请压缩后重新选择。','upload-duration':'视频不能超过 5 分钟，请剪辑后重新选择。','upload-network':'网络连接中断，当前选择已保留，请恢复网络后重试。'})[id];
      else if(task){
        const isMine=r=>r.taskId===task.id&&(role==='parent'?r.studentId===guardianId:(['student','result'].includes(teacherMode)?r.studentId===teacherStudentId:targetIds(teacherTaskById(task.id)||task).includes(r.studentId)));
        const rows=latestRows(store.submissions.filter(isMine));
        if(id==='published')store.submissions=store.submissions.filter(r=>!isMine(r));
        else if(id==='partial'){const first=task.items[0]?.id;store.submissions=store.submissions.filter(r=>!isMine(r)||r.itemId===first);}
        else if(id==='late'||id==='closed'){task.deadline=addDays(formatDate(new Date()),-2);task.submitDeadline=addDays(formatDate(new Date()),id==='closed'?-1:5);}
        else rows.forEach((r,rowIndex)=>{r.questions?.forEach((q,questionIndex)=>{const single=role==='teacher'&&teacherMode==='question';if(single&&q.id!==teacherQuestionId)return;const i=single?rowIndex%2:questionIndex;q.state='confirmed';delete q.estimatedMinutes;delete q.releasedSignature;delete q.releasedAt;
          if(id==='queued'||id==='resubmit'){q.state='queued';q.estimatedMinutes=2;}if(id==='processing'||id==='partialGrade'&&i>0){q.state='processing';q.estimatedMinutes=2;}if(id==='failed'&&i>0)q.state='failed';if(id==='review'&&i===0)q.state='review';
          if(id==='released'||id==='partialRelease'&&r.itemId===task.items[0]?.id||id==='changed'){grading.releaseQuestion(q,new Date().toISOString());if(id==='changed'&&i===0)q.reviewedAt=new Date().toISOString();}
        });if(id==='resubmit')r.version=(r.version||1)+1;});
      }
      role==='parent'?parentRefresh():teacherRefresh();
    },

    getConsoleSnapshot(childIndex=0){
      const task=store.consoleDemo?.publishing?undefined:taskById(store.consoleDemo?.taskId||'homework-console-v1');
      const childId=schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID;
      const sourceRows=localPageDemo?.snapshot&&task&&localPageDemo.snapshot.task.id===task.id?localPageDemo.snapshot.submissions:store.submissions;
      const mine=task?latestRows(sourceRows.filter(r=>r.taskId===task.id&&r.studentId===childId)):[];
      const progress=grading.gradingProgress(mine.flatMap(r=>r.questions||[]),true);
      return {assigned: Boolean(task&&targetIds(task).includes(childId)),active:Boolean(store.consoleDemo),taskId:task?.id||'',title:task?.title||'',scenario:store.consoleDemo?.scenario||'',answerPhase:task?grading.standardPhase(task):'legacy',publishing:Boolean(store.consoleDemo?.publishing),submitted:mine.length,required:task?.items.length||2,progress,pageTitle:teacherMode==='question'?'单题批改结果':teacherMode==='result'||gradeUI.parentOpen?'整份批改结果':teacherMode==='student'?'学生提交':'作业详情'};
    },
    prepareConsoleScenario(name,childIndex=0){if(name==='answerConflict'){this.prepareAnswerWorkflow();return;}restoreLocalDemo();
      if(name==='answerChanged'){this.prepareAnswerWorkflow();this.confirmMatchingAnswers();const base=taskById('homework-console-v1');base.answerStandards.filter(s=>s.status==='pending').forEach(s=>this.approveAnswer(s.questionId,s.label.includes('24 题')?'teacher':'ai'));store.consoleDemo.scenario='answerChanged';answerExpanded='';save();teacherRefresh();return;}
      const allowed=['published','partial','queued','processing','partialGrade','failed','review','unreleased','partialRelease','released','resubmit','changed','late','closed'];if(!allowed.includes(name))return;
      const id='homework-console-v1',now=formatDate(new Date()),due=addDays(now,name==='late'||name==='closed'?-2:2);
      let task=taskById(id);
      const config={id,title:'分数练习',subject:'数学',kind:'homework',classIds:['c1','c2'],targetStudentIds:null,targetSnapshotIds:students.map(s=>s.id),description:'完成两页练习，每页分别拍照上传。',deadline:due,submitDeadline:addDays(due,name==='closed'?1:7),parentVisible:false,publishedAt:addDays(now,-3),publishedBy:'teacher-demo-001',items:[1,2].map(n=>({id:'console-page-'+n,title:'第 '+n+' 页练习',instruction:'拍摄清晰完整的答题页',type:'photo',required:true,gradingEnabled:true}))};
      if(task)Object.assign(task,config);else{task=config;store.tasks.unshift(task);}
      store.submissions=store.submissions.filter(r=>r.taskId!==id);
      const childId=schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID;
      targetIds(task).forEach((studentId,index)=>task.items.forEach((item,page)=>{
        const mine=studentId===childId;if(index%6===0&&!mine)return;
        if(mine&&['published','late','closed'].includes(name)||mine&&name==='partial'&&page===1)return;
        const qs=seedQuestions(task,item,studentId);
        qs.forEach((q,i)=>{
          q.state='confirmed';
          if(['queued','resubmit'].includes(name))q.state='queued';
          if(name==='processing'||name==='partialGrade'&&i===1)q.state='processing';
          if(name==='failed'&&i===1)q.state='failed';
          if(name==='review'&&mine&&page===0&&i===0)q.state='review';
          if(q.state==='queued'||q.state==='processing')q.estimatedMinutes=2;
          if(name==='released'||name==='partialRelease'&&page===0||name==='changed'){grading.releaseQuestion(q,now);if(name==='changed'&&mine&&page===0&&i===0){q.correct=!q.correct;q.reviewedAt=now;}}
        });
        const record={taskId:id,itemId:item.id,studentId,submittedBy:'guardian-demo-001 · 演示家长',label:'模拟作业原图',media:'',submittedAt:addDays(now,-1),mock:true,version:1,questions:qs};
        if(mine&&name==='resubmit'){const old={...record,questions:seedQuestions(task,item,studentId),version:1};old.questions.forEach(q=>grading.releaseQuestion(q,now));store.submissions.push(old);record.version=2;}
        store.submissions.push(record);
      }));
      store.consoleDemo={taskId:id,scenario:name,publishing:false};gradeReleaseOpen=false;gradeReviewDraft=null;save();
    },
    beginConsolePublish(){gradeReviewDraft=null;saveTeacherDraft();store.consoleDemo={taskId:'',scenario:'publish',publishing:true};save();},
    openConsoleTask(role,childIndex=0,result=false){const task=taskById(store.consoleDemo?.taskId||'homework-console-v1');if(!task)return false;if(role==='teacher'){this.openTeacher(task.id);}else{guardianId=schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID;if(!targetIds(task).includes(guardianId))return false;this.openParent(task.id);if(result)this.openParentGrade();}return true;},
    submitConsolePage(index,childIndex=0){const task=taskById(store.consoleDemo?.taskId||'homework-console-v1');if(!task||Date.now()>toDate(task.submitDeadline).getTime())return false;guardianId=schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID;if(!targetIds(task).includes(guardianId))return false;const item=task.items[index];if(!item)return false;submitRecord(task,item,item.type==='none'?'家长确认已完成':'模拟'+types[item.type]+'提交');store.consoleDemo={taskId:task.id,scenario:'submitted',publishing:false};save();return true;},
    advanceConsoleGrading(phase,childIndex=0){const task=teacherTaskById(store.consoleDemo?.taskId||'homework-console-v1');if(!task||!canRelease(task))return;submissionsFor(task).forEach(r=>r.questions?.forEach((q,i)=>{if(phase==='processing'){q.state='processing';q.estimatedMinutes=2;}else{q.state=r.studentId===(schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID)&&r.itemId===task.items[0].id&&i===0?'review':'confirmed';delete q.estimatedMinutes;}if(q.reviewReason&&q.state==='confirmed')q.state='review';delete q.releasedSignature;}));if(task.needsAnswerConfirmation)syncAnswerWorkflow(task);save();this.openTeacher(task.id);},
    openConsoleReview(childIndex=0){const task=teacherTaskById(store.consoleDemo?.taskId||'homework-console-v1'),id=schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID;if(!task)return;const q=submissionsFor(task).filter(r=>r.studentId===id).flatMap(r=>r.questions||[]).find(q=>q.state==='review');if(!q)return;this.openTeacher(task.id);this.openGradeQuestion(q.id);this.filterGradeStudents('pending');},

    getParentTaskSummary(childIndex = 0) {
      const childId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID;
      const now = Date.now();
      const pending = store.tasks.filter(task => targetIds(task).includes(childId) && toDate(task.submitDeadline).getTime() >= now && !task.items.every(item => latestRows(store.submissions).some(row => row.taskId === task.id && row.itemId === item.id && row.studentId === childId)));
      return { pending: pending.length, dueSoon: pending.filter(task => { const remaining = toDate(task.deadline).getTime() - now; return remaining >= 0 && remaining <= 86400000; }).length, overdue: pending.filter(task => toDate(task.deadline).getTime() < now).length };
    },
    getParentNavigation(childIndex = 0) { const task = taskById(parentTaskId); const childId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID; const detail = Boolean(task && targetIds(task).includes(childId)); return { detail, title: detail ? gradeUI.parentOpen ? learningUI.mode==='tutor'?'1对1讲题':learningUI.mode==='notebook'?'孩子的错题本':'整份批改结果' : task.title : '作业' }; },
    getTeacherNavigation() {
      const task = taskById(teacherTaskId);
      const filterTitles = { all: '全部学生', completed: '已完成学生', partial: '未交齐学生', missing: '未交齐学生', wrong: '做错学生', questionWrong: '本题做错学生' };
      const series = store.tasks.find(row => row.seriesId === teacherSeriesId);
      const titles = { questions:task?.items.find(item=>item.id===questionResultsItem)?.title || '批改结果', references:'教师参考资料', question:'单题批改结果',result:'整份批改结果', list: '作业', compose: '发布任务', preview: '核对发布内容', success: '发布成功', detail: task?.title || '任务详情', series: series?.title.replace(/ · 第\d+期$/, '') || '每日进度', students: ['wrong','questionWrong'].includes(teacherFilter)?filterTitles[teacherFilter]:'学生名单', student: students.find(row => row.id === teacherStudentId)?.name || '学生提交详情' };
      return { title: titles[teacherMode] || '作业', back: teacherMode !== 'list' };
    },
    navigateTeacherBack() { if(teacherMode==='references'||teacherMode==='questions'){teacherMode='detail';teacherRefresh(true);} else if(teacherMode==='result'){teacherMode=gradeUI.origin;teacherRefresh(true);} else if(teacherMode==='question'){teacherMode='questions';teacherRefresh(true);} else if (teacherMode === 'preview') this.backToCompose(); else if (teacherMode === 'compose') this.backCompose(); else if (teacherMode === 'student') this.backToStudents(); else if (teacherMode === 'students') this.backToStats(); else if (teacherMode === 'detail') this.backFromTeacherDetail(); else this.toTeacherList(); },
    navigateTeacherHome() { saveTeacherDraft(); teacherMode = 'list'; teacherTaskId = ''; teacherSeriesId = ''; teacherFilter = 'all'; teacherQuestionId = ''; teacherStudentId = ''; materialSourceOpen = false; chatDemoOpen = false; materialPreview = null; datePickerTarget = ''; composeError = ''; teacherRefresh(true); },
    resetParentView() { if(window.homeworkTutorUI?.active())window.homeworkTutorUI.close(); learningUI.mode='result';learningUI.reasonOpen=false; gradeUI.parentOpen=false; parentTaskId = ''; sharedOpen = false; parentTaskTouch = null; parentPhotoSource = null; if (pendingUpload?.media?.startsWith('blob:')) URL.revokeObjectURL(pendingUpload.media); pendingUpload = null; },
    setScope(value) { const changedRole = workScope.view !== value.view || workScope.teacherId !== value.teacherId; const allowedForDraft = value.view !== 'school' ? [...new Set((value.teachingAssignments ?? schoolDemoRoster.getDemoTeachingAssignments(value.teacherId)).flatMap(row => row.classIds))] : value.classIds; const resetDraft = changedRole || draft.classIds.some(id => !allowedForDraft.includes(id)); if (resetDraft) saveTeacherDraft(); workScope = value; if(changedRole){listFilters.subject='all';listFilters.classId='all';listFilters.statuses=[...window.homeworkFilters.ALL_TASK_STATUSES];taskFilterSheet='';} if(changedRole||detailClassId!=='all'&&!(value.view==='subject'?allowedForDraft:value.classIds).includes(detailClassId))detailClassId=value.classIds.length===1?value.classIds[0]:'all'; if (resetDraft) { draft = newDraft(); subjectTouched = false; draft.classIds = [value.classIds[0] || 'c1']; composeStep = 0; composeError = ''; restoreTeacherDraft(); } if (workScope.view === 'school' && (teacherMode === 'compose' || teacherMode === 'preview')) teacherMode = 'list'; },
    toTeacherListWithoutRefresh() { teacherMode = 'list'; teacherTaskId = ''; teacherSeriesId = ''; },
    openTeacherSeries(id) { if (!store.tasks.some(task => task.seriesId === id && teacherTaskById(task.id))) return; teacherSeriesId = id; teacherMode = 'series'; teacherRefresh(true); },
    compose() { if (workScope.view === 'school') return; if (teacherMode !== 'compose' && !hasTeacherDraft()) { draft = newDraft(); if(listFilters.subject!=='all'&&subjectOptions().includes(listFilters.subject))draft.subject=listFilters.subject;draft.classIds=listFilters.classId!=='all'&&subjectClassIds(draft.subject).includes(listFilters.classId)?[listFilters.classId]:subjectClassIds(draft.subject).slice(0,1); composeStep = 0; uniformType = ''; settingMode = 'uniform'; } composeError = ''; publishDemoBranch = 'normal'; rosterReviewRequired = false; teacherMode = 'compose'; teacherRefresh(true); },
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
    selectDetailClass(id){const original=taskById(teacherTaskId),base=original&&detailTaskBase(original);if(!base||id!=='all'&&!base.classIds.includes(id))return;restoreLocalDemo();detailClassId=id;gradeReleaseOpen=false;gradeReviewDraft=null;if(teacherMode!=='question')teacherMode='detail';teacherRefresh();},
    openTeacher(id,fromList=false) { if (!teacherTaskById(id)) return; detailClassId=fromList?listFilters.classId:workScope.classIds.length===1?workScope.classIds[0]:'all'; if (teacherMode !== 'series') teacherSeriesId = ''; teacherTaskId = id; teacherMode = 'detail'; teacherRefresh(true); },
    backFromTeacherDetail() { teacherMode = teacherSeriesId && teacherTaskById(teacherTaskId)?.seriesId === teacherSeriesId ? 'series' : 'list'; teacherRefresh(true); },
    openPaper(button) {
      const source=button.querySelector('img');if(!source)return;
      document.getElementById('hp-paper-dialog')?.remove();
      const dialog=document.createElement('dialog');dialog.id='hp-paper-dialog';dialog.className='hp-paper-dialog';
      dialog.innerHTML='<header><strong>作业原图</strong><button autofocus aria-label="关闭原图" onclick="this.closest(\'dialog\').close()">关闭 ✕</button></header><div class="hp-paper-viewport"><img alt=""></div><footer><button aria-label="缩小原图" onclick="homeworkPrototype.zoomPaper(-0.5)">−</button><output>100%</output><button aria-label="放大原图" onclick="homeworkPrototype.zoomPaper(0.5)">＋</button><button onclick="homeworkPrototype.zoomPaper(0)">适应屏幕</button></footer>';
      const img=dialog.querySelector('img');img.src=source.src;img.alt=source.alt;dialog.dataset.zoom='1';
      dialog.addEventListener('close',()=>{dialog.remove();button.focus();});document.body.appendChild(dialog);dialog.showModal();
    },
    zoomPaper(delta) { const dialog=document.getElementById('hp-paper-dialog');if(!dialog)return;const zoom=delta===0?1:Math.max(1,Math.min(4,Number(dialog.dataset.zoom)+delta));dialog.dataset.zoom=String(zoom);const img=dialog.querySelector('img');img.style.width=(zoom*100)+'%';img.style.maxHeight=zoom===1?'100%':'none';dialog.querySelector('output').textContent=Math.round(zoom*100)+'%'; },
    rosterSelect(filter) { if(!rosterTabs.some(tab=>tab.id===filter))return;teacherFilter=filter;rosterTouch=null;teacherRefresh(true); },
    rosterSwipeStart(event) { if(event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;rosterTouch={x:event.clientX,y:event.clientY,id:event.pointerId}; },
    rosterSwipeCancel() { rosterTouch=null; },
    rosterSwipeEnd(event) { const start=rosterTouch;rosterTouch=null;if(!start||start.id!==event.pointerId)return;const dx=event.clientX-start.x,dy=event.clientY-start.y,index=rosterTabs.findIndex(tab=>tab.id===teacherFilter);if(index<0||Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.4)return;const next=index+(dx<0?1:-1);if(next>=0&&next<rosterTabs.length){event.preventDefault();this.rosterSelect(rosterTabs[next].id);} },
    openItemStudents(id){rosterItemId=id;teacherFilter='all';teacherMode='students';teacherRefresh(true);},
    openStudents(filter, questionId = '') { rosterItemId='';teacherFilter = filter; teacherQuestionId = questionId; teacherMode = 'students'; teacherRefresh(true); },
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
       draft.items = texts.length ? texts.map(text => {const old=previous.find(item=>item.title===text);return {...newItem(),title:text,instruction:'按上述要求完成',type:old?.type||(settingMode==='uniform'?uniformType:suggestSubmissionType(text)),gradingEnabled:Boolean(old?.gradingEnabled&&old?.type==='photo')};}) : [{ ...newItem(), title: '完成作业', instruction: '按任务要求完成', type: settingMode === 'uniform' ? uniformType : '' }];
      recognizedCount = texts.length > 1 ? texts.length : 0;
      recognitionStale = false;
      teacherRefresh();
    },
    setSettingMode(mode) { if (mode === 'uniform' && settingMode !== mode) uniformType = draft.items.length && draft.items.every(item => item.type === draft.items[0].type) ? draft.items[0].type : ''; settingMode = mode; expandedItemIndex = 0; teacherRefresh(); },
    applyUniformToAll() { settingMode = 'uniform'; draft.items.forEach(item => {item.type = uniformType;if(uniformType!=='photo')item.gradingEnabled=false;}); teacherRefresh(); },
    toggleItemOptions(index) { expandedItemIndex = expandedItemIndex === index ? -1 : index; teacherRefresh(); },
    setUniformType(type) { if (!(type in types)) return; uniformType = type; draft.items.forEach(item => {item.type = type;if(type!=='photo')item.gradingEnabled=false;}); teacherRefresh(); },
    setUniformGrading(enabled) { if(draft.kind!=='homework'||uniformType!=='photo')return;draft.items.forEach(item=>item.gradingEnabled=Boolean(enabled));teacherRefresh(); },
    setItemGrading(index,enabled) { const item=draft.items[index];if(!item||draft.kind!=='homework'||item.type!=='photo')return;item.gradingEnabled=Boolean(enabled);teacherRefresh(); },
    setDeadline(value) { draft.deadline = value.replace('T', ' '); draft.submitDeadline = addDays(draft.deadline, 7); clearComposeError(); },
    setSubmitDeadline(value) { draft.submitDeadline = value.replace('T', ' '); clearComposeError(); },
    setItem(index, key, value) { if (draft.items[index]) draft.items[index][key] = value; demoPasteActive = false; clearComposeError(); },
    setItemType(index, value) { if (draft.items[index] && publishTypes.includes(value)) { draft.items[index].type = value;if(value!=='photo')draft.items[index].gradingEnabled=false;expandedItemIndex = index; teacherRefresh(); } },
    openDatePicker(target) { datePickerTarget = target; datePickerValue = draft[target]; teacherRefresh(); },
    closeDatePicker() { datePickerTarget = ''; teacherRefresh(); },
    shiftPickerMonth(delta) { const date = toDate(datePickerValue); const day = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + delta); date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())); datePickerValue = formatDate(date); teacherRefresh(); },
    pickDateDay(day) { const date = toDate(datePickerValue); date.setDate(day); datePickerValue = formatDate(date); teacherRefresh(); },
    setPickerTime(part, value) { const date = toDate(datePickerValue); if (part === 'hour') date.setHours(Number(value)); else date.setMinutes(Number(value)); datePickerValue = formatDate(date); },
    confirmDatePicker() { const date = toDate(datePickerValue); if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now() && datePickerTarget === 'deadline') { alert('首次截止请选择未来时间。'); return; } if (datePickerTarget === 'submitDeadline' && date.getTime() <= toDate(draft.deadline).getTime()) { alert('补交截止必须晚于首次截止。'); return; } if (datePickerTarget === 'deadline') { draft.deadline = datePickerValue; draft.submitDeadline = addDays(datePickerValue, 7); } else draft.submitDeadline = datePickerValue; datePickerTarget = ''; clearComposeError(); teacherRefresh(); },
    addItem() { draft.items.push({ ...newItem(), title: '补充要求', instruction: '按要求完成', type: settingMode === 'uniform' ? uniformType : '' }); demoPasteActive = false; teacherRefresh(); },
    removeItem(index) { if (draft.items.length > 1) draft.items.splice(index, 1); demoPasteActive = false; teacherRefresh(); },
    toggleClass(id) { if (!subjectClassIds(draft.subject).includes(id)) return; draft.classIds = draft.classIds.includes(id) ? draft.classIds.filter(value => value !== id) : [...draft.classIds, id]; draft.targetStudentIds = draft.targetStudentIds.filter(studentId => students.some(row => row.id === studentId && draft.classIds.includes(row.classId))); teacherRefresh(); },
    setTargetMode(mode) { if(!['all','selected'].includes(mode))return;draft.targetMode = mode; teacherRefresh(); },
    toggleStudent(id) { if (!students.some(row => row.id === id && draft.classIds.includes(row.classId))) return; draft.targetStudentIds = draft.targetStudentIds.includes(id) ? draft.targetStudentIds.filter(value => value !== id) : [...draft.targetStudentIds, id]; teacherRefresh(); },
    selectRecipientClass(id){if(!draft.classIds.includes(id)||!subjectClassIds(draft.subject).includes(id))return;recipientClassId=id;recipientSearch='';teacherRefresh();},
    selectRecipientClassAll(selected){if(draft.targetMode!=='selected'||!draft.classIds.includes(recipientClassId)||!subjectClassIds(draft.subject).includes(recipientClassId))return;const ids=students.filter(student=>student.classId===recipientClassId).map(student=>student.id);draft.targetStudentIds=selected?[...new Set([...draft.targetStudentIds,...ids])]:draft.targetStudentIds.filter(id=>!ids.includes(id));teacherRefresh();},
    filterStudents(value) { recipientSearch=value;if (typeof document === 'undefined') return; const query = value.trim().toLowerCase(); document.querySelectorAll('.hp-student-option').forEach(node => { node.hidden = !node.dataset.search.includes(query); }); const empty=document.querySelector('.hp-recipient-empty');if(empty)empty.hidden=Array.from(document.querySelectorAll('.hp-student-option')).some(row=>!row.hidden); },
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
    publish() { if (draft.items.some(item => !publishTypes.includes(item.type))) { composeError = '请为每条要求选择提交方式。'; teacherRefresh(); return; } syncDraftTitle(); if (!subjectOptions().includes(draft.subject) || workScope.view === 'school' || teacherMode !== 'preview' || !draft.classIds.length || !draft.classIds.every(id => subjectClassIds(draft.subject).includes(id))) return; if (publishDemoBranch === 'network') { composeError = '发布失败：网络暂不可用。内容已保留，请恢复正常场景后重试。'; teacherRefresh(); return; } if (publishDemoBranch === 'roster' || rosterReviewRequired) { composeError = '发布前接收名单发生变化，请返回核对布置对象，再次预览后发布。'; publishDemoBranch = 'normal'; rosterReviewRequired = true; teacherRefresh(); return; } const seriesId = `task-${Date.now()}`; const count = draft.kind === 'checkin' ? draft.cycleCount : 1; const snapshot = students.filter(row => draft.classIds.includes(row.classId) && (draft.targetMode !== 'selected' || draft.targetStudentIds.includes(row.id))).map(row => row.id); const tasks = Array.from({ length: count }, (_, index) => { const deadline = addDays(draft.deadline, index); const submitDeadline = addDays(draft.submitDeadline, index); return { id: count === 1 ? seriesId : `${seriesId}-cycle-${index + 1}`, seriesId, cycleId: draft.kind === 'checkin' ? `cycle-${index + 1}` : null, kind: draft.kind, subject: draft.subject, schoolId: 'luohu-demo', title: count === 1 ? draft.title.trim() : `${draft.title.trim()} · 第${index + 1}期`, description: draft.description.trim(), referenceMaterials: (draft.referenceMaterials||[]).map(file=>({...file})), photo: draft.photo, attachments: materialAttachments(draft).map(file => ({ ...file })), publishedAt: formatDate(new Date()), deadline, submitDeadline, classIds: draft.classIds.filter(id=>draft.targetMode!=='selected'||students.some(student=>student.classId===id&&draft.targetStudentIds.includes(student.id))), targetStudentIds: draft.targetMode === 'selected' ? [...draft.targetStudentIds] : null, targetSnapshotIds: [...snapshot], parentVisible: false, publishedBy: workScope.teacherId, items: draft.items.map(item => ({ ...item, required: true, title: item.title.trim(), instruction: item.instruction.trim() })) }; }); store.tasks.unshift(...tasks); if(store.consoleDemo?.publishing){store.consoleDemo={taskId:tasks[0].id,scenario:'published',publishing:false};} save(); const studentsCount = targetIds(tasks[0]).length; publishedNotice = `已发布给 ${studentsCount} 名学生${count > 1 ? `，共 ${count} 期` : ''}，接收名单已冻结；家长可在作业列表查看。`; draft = newDraft(); subjectTouched = false; try { localStorage.removeItem(DRAFT_KEY + workScope.teacherId); } catch {} composeStep = 0; publishDemoBranch = 'normal'; rosterReviewRequired = false; teacherMode = 'success'; teacherRefresh(true); },
    review(taskId,questionId,correct,studentId='',inline=false){const task=teacherTaskById(taskId);if(!task||!canRelease(task))return;const eligible=q=>q.id===questionId&&['review','confirmed','unreadable','no-answer'].includes(q.state);const records=submissionsFor(task),record=studentId?records.find(r=>r.studentId===studentId&&r.questions?.some(eligible)):records.find(r=>r.questions?.some(q=>eligible(q)&&q.state==='review'))||records.find(r=>r.questions?.some(eligible)),q=record?.questions.find(eligible);if(!q)return;gradeReviewDraft={taskId,questionId,studentId:record.studentId,itemId:record.itemId,version:record.version||1,signature:grading.gradingSignature(q),inline,correct:null,reason:'已对照学生原图核对',error:''};teacherRefresh();},
    chooseInlineGrade(taskId,questionId,studentId,choice){
      if(!['right','wrong','hold'].includes(choice))return;
      const d=gradeReviewDraft;
      if(!d?.inline||d.taskId!==taskId||d.questionId!==questionId||d.studentId!==studentId)this.review(taskId,questionId,undefined,studentId,true);
      if(!gradeReviewDraft?.inline)return;
      gradeReviewDraft.choice=choice;gradeReviewDraft.correct=choice==='hold'?null:choice==='right';gradeReviewDraft.error='';teacherRefresh();
    },
    saveInlineGrade(){
      const d=gradeReviewDraft;if(!d?.inline)return;
      if(!gradeReviewContext()){d.error='作答或权限已更新，请取消后重新核对';teacherRefresh();return;}
      if(d.choice==='hold')this.holdGradeReview();else if(['right','wrong'].includes(d.choice))this.confirmGradeReview();
    },
    holdGradeReview(){const c=gradeReviewContext();if(!c)return;if(!workflowCommit(()=>grading.holdManualResult(c.q,new Date().toISOString()))){gradeReviewDraft.error=workflowNotice;teacherRefresh();return;}rememberReview();gradeReviewDraft=null;answerError='已暂缓该学生本题，统计和家长状态已更新';teacherRefresh();},

    setGradeReviewDecision(correct){if(gradeReviewDraft){gradeReviewDraft.correct=correct;gradeReviewDraft.error='';teacherRefresh();}},
    setGradeReviewReason(reason){if(gradeReviewDraft)gradeReviewDraft.reason=reason;},
    closeGradeReview(){gradeReviewDraft=null;teacherRefresh();},
    confirmGradeReview(next=false){const draft=gradeReviewDraft,c=gradeReviewContext();if(!draft||!c)return;if(!(c.record.mock?samplePhoto(c.record):mediaFor(c.record))){draft.error='原图不可用，请保留待复核';teacherRefresh();return;}if(typeof draft.correct!=='boolean'){draft.error='请先选择判对或判错';teacherRefresh();return;}if(!draft.reason.trim()){draft.error='请填写复核说明';teacherRefresh();return;}const q=c.q,at=new Date().toISOString();if(!workflowCommit(()=>{q.reviewHistory=[...(q.reviewHistory||[]),{at,before:q.state,after:'confirmed',correct:draft.correct,reason:draft.reason.trim(),reviewerId:workScope.teacherId}];grading.confirmManualResult(workflowTask(c.task),standardRecords(workflowTask(c.task)),q,draft.correct,at);if(q.parentFeedback)q.parentFeedback.status='resolved';})){gradeReviewDraft.error=workflowNotice;teacherRefresh();return;}rememberReview();gradeReviewDraft=null;answerError='已保存，统计和家长结果已更新';if(next&&submissionsFor(c.task).some(r=>r.questions?.some(q=>q.id===draft.questionId&&q.state==='review'))){this.review(draft.taskId,draft.questionId);return;}answerError='已保存，统计和家长结果已更新';teacherRefresh();},
    openParent(id) { gradeUI.parentOpen=false; parentTaskId = id; sharedOpen = false; parentPhotoSource = null; parentRefresh(true); },
    toParentList() { if(learningUI.reasonOpen){learningUI.reasonOpen=false;parentRefresh();return;}if(learningUI.mode!=='result'){this.closeHomeworkLearning();return;}if(gradeUI.parentOpen){gradeUI.parentOpen=false;parentRefresh(true);return;} parentTaskId = ''; parentPhotoSource = null; parentRefresh(true); },
    changeParentTaskTab(value) { if (!['pending', 'completed', 'ended'].includes(value)) return; parentTaskTab = value; parentTaskTouch = null; parentRefresh(true); },
    taskSwipeStart(event) { if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return; parentTaskTouch = { x: event.clientX, y: event.clientY, id: event.pointerId }; },
    taskSwipeCancel() { parentTaskTouch = null; },
    taskSwipeEnd(event) { const start = parentTaskTouch; parentTaskTouch = null; if (!start || start.id !== event.pointerId) return; const dx = event.clientX - start.x, dy = event.clientY - start.y; if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.3) return; const tabs = ['pending', 'completed', 'ended']; const next = tabs.indexOf(parentTaskTab) + (dx < 0 ? 1 : -1); if (next >= 0 && next < tabs.length) this.changeParentTaskTab(tabs[next]); },
    submit(taskId, itemId) { const task = taskById(taskId); const item = task?.items.find(row => row.id === itemId); if (!task || !item || item.type !== 'none' || !targetIds(task).includes(guardianId)) return; if (Date.now() > toDate(task.submitDeadline).getTime()) { alert('补交已结束，当前任务只可查看。'); return; } submitRecord(task, item, '家长确认已完成'); },
    demoException(type) { const messages = { format: '文件格式不支持，请按老师指定的方式选择 PDF、Word、PPT、Excel、TXT、图片或视频。', size: '文件超过当前类型大小限制，请压缩后重新选择。', duration: '视频超过 5 分钟，请剪辑后重新选择。', network: '网络连接中断，当前选择已保留，请恢复网络后重试。' }; alert(messages[type] || '提交失败，请重试。'); },
    openParentPhotoSource(taskId,itemId) { const task=taskById(taskId),item=task?.items.find(row=>row.id===itemId); if(!task||item?.type!=='photo'||Date.now()>toDate(task.submitDeadline).getTime()||!targetIds(task).includes(guardianId))return;parentPhotoSource={taskId,itemId,chatOpen:false};parentRefresh(); },
    fillParentDemoPhoto(taskId,itemId) {
      this.openParentPhotoSource(taskId,itemId);
      if(parentPhotoSource?.taskId!==taskId||parentPhotoSource?.itemId!==itemId)return;
      const index=taskById(taskId).items.filter(item=>item.type==='photo').findIndex(item=>item.id===itemId);
      this.useParentChatDemoPhoto(1+index%2);
    },
    closeParentPhotoSource() { parentPhotoSource=null;parentRefresh(); },
    showParentChatPhotos(demoOpen=false) { if(!parentPhotoSource)return;parentPhotoSource.chatOpen=true;parentPhotoSource.demoOpen=demoOpen;parentRefresh(); },
    chooseParentPhotoFile() { const itemId=parentPhotoSource?.itemId,input=itemId&&document.getElementById('hp-parent-photo-'+itemId);if(input){input.value='';input.click();} },
    useParentChatDemoPhoto(index=0) {
      const source=parentPhotoSource,task=source&&taskById(source.taskId),item=task?.items.find(row=>row.id===source.itemId),photo=parentDemoPhotos[index];
      if(!task||item?.type!=='photo'||!photo||!targetIds(task).includes(guardianId))return;
      if(Date.now()>toDate(task.submitDeadline).getTime()){alert('补交已结束，当前任务只可查看。');return;}
      pendingUpload={taskId:task.id,itemId:item.id,studentId:guardianId,name:photo.name,type:'photo',media:'../miniprogram/assets/'+photo.file,transient:false,demoPhotoIndex:index};
      parentPhotoSource=null;parentRefresh();
    },
    submitFile(taskId, itemId, input) {
      const task = taskById(taskId); const item = task?.items.find(row => row.id === itemId); const file = input.files?.[0];
      if (!task || !item || !file || !targetIds(task).includes(guardianId) || item.type === 'none') return;
      if (Date.now() > toDate(task.submitDeadline).getTime()) { alert('补交已结束，当前任务只可查看。'); return; }
      if (item.type === 'photo' && !file.type.startsWith('image/') || item.type === 'video' && !file.type.startsWith('video/') || item.type === 'audio' && !file.type.startsWith('audio/') || item.type === 'file' && !/\.(pdf|docx?|pptx?|xlsx?|txt)$/i.test(file.name)) { alert(`这一项需要上传${types[item.type]}，请重新选择。`); return; }
      if(item.type==='photo')parentPhotoSource=null;
      stageUpload(task, item, file);
    },
    cancelUpload() { if (pendingUpload?.media?.startsWith('blob:')) URL.revokeObjectURL(pendingUpload.media); pendingUpload = null; parentRefresh(); },
    confirmUpload() {
      const upload = pendingUpload; const task = upload && taskById(upload.taskId); const item = task?.items.find(row => row.id === upload.itemId);
      if (!upload || !task || !item || upload.studentId !== guardianId || !targetIds(task).includes(guardianId)) return;
      if (Date.now() > toDate(task.submitDeadline).getTime()) { alert('补交已结束，当前任务只可查看。'); return; }
      if (latestRows(store.submissions).some(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId) && !window.confirm('重新提交后，新版本将成为当前提交，旧版本仍保留在提交记录中。确认继续吗？')) return;
      pendingUpload = null;
      submitRecord(task, item, upload.name, upload.transient ? '' : upload.media, upload.transient ? upload.media : '',upload.demoPhotoIndex ?? null);
    }
  };
})();
