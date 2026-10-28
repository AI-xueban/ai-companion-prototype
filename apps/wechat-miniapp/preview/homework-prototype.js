/* 教师发布—家长逐项提交—教师统计的浏览器演示。数据只保存在当前浏览器。 */
window.homeworkPrototype = (() => {
  const documentationMode=typeof location!=='undefined'&&new URLSearchParams(location.search).get('review')==='1'&&new URLSearchParams(location.search).get('documentation')==='1';
  const documentationStorage=new Map();let documentationFault='';
  const previewStorage={getItem(key){if(documentationMode){if(documentationFault==='read')throw Error('Documentation read failure');return documentationStorage.get(key)||null;}return localStorage.getItem(key);},setItem(key,value){if(documentationMode){if(documentationFault==='save'||documentationFault==='pending'&&key.startsWith('homework-pending-v2'))throw Error('Documentation storage failure');documentationStorage.set(key,String(value));return;}localStorage.setItem(key,value);},removeItem(key){if(documentationMode){documentationStorage.delete(key);return;}localStorage.removeItem(key);}};
  const worksheetLibrary = window.homeworkWorksheets?.HOMEWORK_WORKSHEET_LIBRARY || [];
  const worksheetAsset = path => (typeof location !== 'undefined' && location.protocol === 'file:' ? '../miniprogram' : 'miniprogram') + path;
  const demoMaterialFiles = [
    { id: 'promo-video', name: '宣传视频（30秒演示版）.mp4', type: 'video', path: 'assets/homework-demo-files/promo-video-30s.mp4', size: 6029004, source: '微信聊天记录（演示）' },
    { id: 'campus-intro', name: '至善校区.pdf', type: 'file', path: 'assets/homework-demo-files/campus-intro.pdf', size: 55331, source: '微信聊天记录（演示）', previewPages: ['assets/homework-demo-files/campus-intro-pages/page-1.jpg', 'assets/homework-demo-files/campus-intro-pages/page-2.jpg'] },
    { id: 'exercise-paper', name: '组卷-65c9fea9-fb3b-4b.pdf', type: 'file', path: 'assets/homework-demo-files/exercise-paper.pdf', size: 390398, source: '微信聊天记录（演示）', previewPages: Array.from({ length: 10 }, (_, index) => `assets/homework-demo-files/exercise-paper-pages/page-${String(index + 1).padStart(2, '0')}.jpg`) },
    { id: 'reading-audio', name: 'lv_0_20260710192519.mp3', type: 'audio', path: 'assets/homework-demo-files/reading-audio.mp3', size: 1918703, source: '微信聊天记录（演示）' },
    { id: 'feedback-audio', name: 'lv_0_20260717162637.mp3', type: 'audio', path: 'assets/homework-demo-files/feedback-audio.mp3', size: 92668, source: '微信聊天记录（演示）' },
  ];
  const parentDemoPhotos = [
    { templateId: 'math-basic-grade4', name: '01_四年级数学家庭作业_已作答.webp', file: 'homework-worksheets/math-basic-answered.webp', detail: '四年级 · 数学家庭作业' },
    { templateId: 'chinese-grade4', name: '02_四年级语文综合练习_已作答.webp', file: 'homework-worksheets/chinese-grade4-answered.webp', detail: '四年级 · 语文综合练习' },
    { templateId: 'english-grade4', name: '03_四年级英语Unit3练习_已作答.webp', file: 'homework-worksheets/english-grade4-answered.webp', detail: '四年级 · 英语 Unit 3' },
    { templateId: 'science-grade4', name: '04_四年级科学探究记录_已作答.webp', file: 'homework-worksheets/science-grade4-answered.webp', detail: '四年级 · 科学探究记录' },
    { templateId: 'math-application-grade4', name: '05_四年级数学生活应用题_已作答.webp', file: 'homework-worksheets/math-grade4-application-answered.webp', detail: '四年级 · 数学生活应用题' },
    { templateId: 'math-application-grade5', name: '06_五年级数学生活情境应用题_已作答.webp', file: 'homework-worksheets/math-grade5-application-answered.webp', detail: '五年级 · 数学生活情境应用题' },
    { templateId: 'math-application-grade6', name: '07_六年级数学综合应用题_已作答.webp', file: 'homework-worksheets/math-grade6-application-answered.webp', detail: '六年级 · 数学综合应用题' },
    { templateId: 'math-application-grade7', name: '08_七年级数学综合应用题_已作答.png', file: 'homework-worksheets/math-grade7-application-answered.png', detail: '七年级 · 数学综合应用题' },
    { templateId: 'generic-math', name: '数学练习演示作答页.png', file: 'homework-demo-paper.png', detail: '数学 · 通用演示作答页' }
  ];
  const demoPhotoAsset = photo => worksheetAsset('/assets/' + photo.file);
  const KEY = 'ai_companion_homework_preview_v1';
  const grading = window.homeworkGrading;
  const closedTask = task => grading.homeworkClosed(task);
  let management = null, familyPreview = false, uploadMessage = '', uploadBusy=false;
  const familyAccount=()=>window.parentPrototype?.getTutorAccount?.()||'guardian-demo-001';
  const pendingKey = () => 'homework-pending-v2:'+familyAccount()+':'+guardianId;
  let pendingLastId='';
  const pendingMap=()=>{try{const data=JSON.parse(previewStorage.getItem(pendingKey())||'{}');return data.taskId?{[data.taskId+':'+data.itemId]:data}:data;}catch{return {};}};
  const persistPending = () => { try {const all=pendingMap();if(pendingUpload){pendingLastId=pendingUpload.taskId+':'+pendingUpload.itemId;all[pendingLastId]=pendingUpload;}else if(pendingLastId)delete all[pendingLastId];previewStorage.setItem(pendingKey(),JSON.stringify(all));return true;}catch { uploadMessage='当前选择暂存失败，请勿关闭页面；可移除部分文件后重试。'; return false; } };
  const restorePending = () => { if(pendingUpload?.studentId===guardianId&&pendingUpload.taskId===parentTaskId&&(!pendingUpload.accountId||pendingUpload.accountId===familyAccount()))return;pendingUpload=Object.values(pendingMap()).find(p=>p.taskId===parentTaskId&&p.studentId===guardianId)||null;pendingLastId=pendingUpload?pendingUpload.taskId+':'+pendingUpload.itemId:''; };
  const photoPath = (record,q) => (record.photos?.[q?.pageIndex||0]?resolvePhoto(record.photos[q?.pageIndex||0]):'') || (record.mock?samplePhoto(record):mediaFor(record));
  const DRAFT_KEY = 'ai_companion_teacher_homework_preview_draft_v1:';
  const materialUrls = new Map(), materialLoads = new Set();
  const materialUploadTimers = new Map();
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
  const fileVisual = (name, type = 'file') => {
    const extension = String(name || '').split('.').pop().toLowerCase();
    if (type === 'video' || /^(mp4|mov|m4v|webm)$/.test(extension)) return { kind: 'video', mark: '▶' };
    if (type === 'audio' || /^(mp3|m4a|wav|aac|ogg)$/.test(extension)) return { kind: 'audio', mark: '♫' };
    if (type === 'image' || /^(png|jpe?g|webp|gif|bmp|heic)$/.test(extension)) return { kind: 'image', mark: '▣' };
    if (extension === 'pdf') return { kind: 'pdf', mark: 'PDF' };
    if (/^docx?$/.test(extension)) return { kind: 'word', mark: 'W' };
    if (/^xlsx?$/.test(extension)) return { kind: 'sheet', mark: 'X' };
    if (/^pptx?$/.test(extension)) return { kind: 'slides', mark: 'P' };
    if (extension === 'txt') return { kind: 'text', mark: 'TXT' };
    return { kind: 'generic', mark: 'FILE' };
  };
  const fileIcon = (name, type) => { const visual = fileVisual(name, type); return `<span class="hp-file-type-icon ${visual.kind}" aria-hidden="true"><span>${visual.mark}</span></span>`; };
  const materialPreviewPages = file => {
    if (Array.isArray(file.previewPages) && file.previewPages.length) return file.previewPages;
    if (file.name === '至善校区.pdf') return ['assets/homework-demo-files/campus-intro-pages/page-1.jpg', 'assets/homework-demo-files/campus-intro-pages/page-2.jpg'];
    if (file.name === '组卷-65c9fea9-fb3b-4b.pdf') return Array.from({ length: 10 }, (_, index) => `assets/homework-demo-files/exercise-paper-pages/page-${String(index + 1).padStart(2, '0')}.jpg`);
    return [];
  };
  const renderMaterialAttachments = (value, removable = false) => {
    const files = materialAttachments(value);
    return files.length ? `<div class="hp-attachment-list">${files.map(file => {
      restoreMaterialFile(file);
      const state = file.unavailable ? 'failed' : file.uploadState || 'complete';
      const active = state === 'optimizing' || state === 'uploading';
      const progress = Math.max(0, Math.min(100, Number(file.uploadProgress || 0)));
      const kind = file.type === 'image' ? '图片' : file.type === 'video' ? '视频' : file.type === 'audio' ? '音频' : '文件';
      const completeSize = materialSize(file.uploadSize || file.size);
      const optimized = file.optimizedFrom && file.uploadSize && file.optimizedFrom > file.uploadSize
        ? `已优化 ${materialSize(file.optimizedFrom)} → ${materialSize(file.uploadSize)}`
        : completeSize;
      const lifecycleStatus = state === 'optimizing'
        ? file.type === 'image' ? '正在优化图片…' : '正在准备上传…'
        : state === 'uploading'
          ? `正在上传 ${progress}%${completeSize ? ` · ${progress ? materialSize(Math.round((file.uploadSize || file.size) * progress / 100)) : '0 KB'} / ${completeSize}` : ''}`
          : state === 'failed'
            ? escape(file.uploadError || (file.unavailable ? '附件已失效，请重新添加' : '网络异常，上传失败'))
            : `上传完成${optimized ? ` · ${optimized}` : ''}${file.sessionOnly ? ' · 本次预览可用' : ''}`;
      const status = removable ? lifecycleStatus : file.unavailable ? '附件已失效，请重新添加' : `${kind}${completeSize ? ` · ${completeSize}` : ''}`;
      const previewDisabled = active || state === 'failed';
      const side = removable
        ? state === 'optimizing'
          ? '<span class="hp-upload-spinner" role="status" aria-label="正在处理"></span>'
          : state === 'uploading'
            ? `<button type="button" class="hp-upload-cancel" onclick="homeworkPrototype.cancelMaterialUpload('${file.id}')">取消</button>`
            : state === 'failed'
              ? `<span class="hp-upload-failed-actions"><button type="button" onclick="homeworkPrototype.retryMaterialUpload('${file.id}')">重新上传</button><button type="button" onclick="homeworkPrototype.removeMaterialAttachment('${file.id}')">移除</button></span>`
              : `<span class="hp-upload-complete" aria-label="上传完成">✓</span><button type="button" class="hp-attachment-remove" aria-label="移除附件 ${escape(file.name)}" onclick="homeworkPrototype.removeMaterialAttachment('${file.id}')">×</button>`
        : '<b>›</b>';
      return `<div class="hp-attachment-row is-${state}" data-material-id="${escape(file.id)}"><button type="button" class="hp-attachment-main" onclick="homeworkPrototype.previewMaterialAttachment('${file.id}')" ${previewDisabled ? 'disabled' : ''}>${file.type === 'image' && !file.unavailable ? `<img src="${escape(file.path)}" alt="${escape(file.name)}">` : fileIcon(file.name, file.type)}<span class="hp-attachment-info"><strong>${escape(file.name)}</strong><small>${status}</small>${grading.homeworkPreviewNotice(file,true)?`<small>${escape(grading.homeworkPreviewNotice(file,true))}</small>`:''}</span></button><span class="hp-attachment-side">${side}</span>${state === 'uploading' ? `<span class="hp-upload-progress" aria-label="上传进度 ${progress}%"><i style="width:${progress}%"></i></span>` : ''}</div>`;
    }).join('')}</div>` : '';
  };
  const materialPreviewHeader = file => typeof header === 'function'
    ? header(file.name, true, false, 'homeworkPrototype.closeMaterialPreview()', 'homeworkPrototype.closeMaterialPreview()', '返回附件列表')
    : `<header class="hp-material-preview-fallback"><button type="button" onclick="homeworkPrototype.closeMaterialPreview()">‹</button><strong>${escape(file.name)}</strong></header>`;
  const renderMaterialPreviewBody = file => {
    const visual = fileVisual(file.name, file.type);
    const name = escape(file.name);
    const path = escape(file.path);
    if (visual.kind === 'image') return `<section class="hp-material-stage hp-material-stage-image"><div class="hp-material-image-scroll"><img src="${path}" alt="${name}"></div><span class="hp-material-page-chip">1 / 1</span><span class="hp-material-gesture">双指缩放 · 左右滑动切换</span></section>`;
    if (visual.kind === 'pdf') {
      const pages = materialPreviewPages(file);
      const pageCount = pages.length;
      const pageIndex = Math.min(materialPreviewPage, Math.max(0, pageCount - 1));
      const preview = pageCount
        ? `<div class="hp-material-pdf-scroll"><img src="${escape(pages[pageIndex])}" alt="${name} 第 ${pageIndex + 1} 页"></div>`
        : `<iframe title="${name}" src="${path}"></iframe>`;
      return `<section class="hp-material-stage hp-material-stage-pdf">${preview}<div class="hp-material-pager" aria-label="PDF 页码"><button type="button" ${pageIndex <= 0 ? 'disabled' : ''} aria-label="上一页" onclick="homeworkPrototype.changeMaterialPreviewPage(-1)">‹</button><span>${pageIndex + 1} / ${pageCount || 1}</span><button type="button" ${pageIndex >= pageCount - 1 ? 'disabled' : ''} aria-label="下一页" onclick="homeworkPrototype.changeMaterialPreviewPage(1)">›</button></div></section>`;
    }
    if (visual.kind === 'video') return `<section class="hp-material-video-area"><div class="hp-material-video-card"><video src="${path}" controls playsinline preload="metadata"></video><p>点击画面播放，支持全屏查看</p></div></section>`;
    if (visual.kind === 'audio') return `<section class="hp-material-audio-area"><div class="hp-material-audio-card"><div class="hp-material-audio-art" aria-hidden="true">♫</div><h3>${name.replace(/\.[^.]+$/, '')}</h3><p>音频附件</p><div class="hp-material-wave" aria-hidden="true">${Array.from({ length: 34 }, (_, index) => `<i style="height:${12 + ((index * 13) % 31)}px"></i>`).join('')}</div><audio src="${path}" controls preload="metadata"></audio><small>锁屏或切换页面后将暂停播放</small></div></section>`;
    return `<section class="hp-material-document-area">${fileIcon(file.name, file.type)}<strong>${name}</strong><p>该格式暂不支持在线预览，可使用顶部下载按钮打开文件。</p></section>`;
  };
  const renderMaterialPreview = () => {
    if (!materialPreview) return '';
    const size = materialSize(materialPreview.size) || '大小未知';
    const path = escape(materialPreview.path);
    const name = escape(materialPreview.name);
    return `<div class="hp-material-preview-layer" role="dialog" aria-modal="true" aria-label="${name}附件预览"><main class="screen hp-material-preview-page">${materialPreviewHeader(materialPreview)}<div class="hp-material-toolbar"><span>${escape(size)}</span><a href="${path}" download="${name}" aria-label="下载 ${name}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 18v2h14v-2"/></svg>下载</a></div><div class="hp-material-preview-content ${fileVisual(materialPreview.name, materialPreview.type).kind}">${renderMaterialPreviewBody(materialPreview)}</div></main></div>`;
  };
  const renderMaterialList = () => { const task=materialListTaskId&&taskById(materialListTaskId); const files=task?materialAttachments(task):[]; return files.length>1?`<div class="hp-source-mask" onclick="homeworkPrototype.closeMaterialList()"><section class="hp-material-preview-sheet hp-material-list-sheet" role="dialog" aria-modal="true" aria-label="附件清单" onclick="event.stopPropagation()"><header><strong>附件清单 · ${files.length}</strong><button type="button" aria-label="关闭附件清单" onclick="homeworkPrototype.closeMaterialList()">×</button></header>${renderMaterialAttachments(task)}</section></div>`:''; };
  const classes = schoolDemoRoster.DEMO_CLASSES.filter(row => row.id === 'c1' || row.id === 'c2');
  const students = schoolDemoRoster.DEMO_STUDENTS.filter(row => classes.some(classRow => classRow.id === row.classId));
  let guardianId = schoolDemoRoster.GUARDIAN_STUDENT_ID;
  const types = { file: '文件', photo: '图片', video: '视频', audio: '录音', none: '线下完成' };
  const publishTypes = ['file', 'photo', 'video', 'audio', 'none'];
  const gradingEligible = type => type === 'photo' || type === 'file';
  const accept = { file: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt', photo: 'image/*', video: 'video/*', audio: 'audio/*' };

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
  const tutorScenarioSamples=[
    {name:'比多比少',subject:'数学',stem:'小明有24张卡片，比小红少8张。小红有多少张卡片？',studentAnswer:'24－8＝16（张）',answer:'32张',correct:false,image:'01-比多比少.png',analysis:'学生可能把“少”直接对应减法，需先确认谁更多。'},
    {name:'分数应用题',subject:'数学',stem:'科技小组有女生12人，女生人数是男生人数的3/4。男生有多少人？',studentAnswer:'12×3/4＝9（人）',answer:'16人',correct:false,image:'02-分数应用题.png',analysis:'先判断男生人数对应完整4份，女生12人对应3份。'},
    {name:'组合图形面积',subject:'数学',stem:'一个长8厘米、宽6厘米的长方形，从右上角剪去一个长3厘米、宽2厘米的小长方形。剩下图形的面积是多少平方厘米？',studentAnswer:'8×6＝48（平方厘米）',answer:'42平方厘米',correct:false,image:'03-组合图形.png',analysis:'学生只计算完整长方形，遗漏被剪去的部分。'},
    {name:'解方程',subject:'数学',stem:'解方程：3(x－2)＝12。',studentAnswer:'3x－2＝12；3x＝14；x＝14/3',answer:'x＝6',correct:false,image:'04-解方程.png',analysis:'去括号时漏将3乘以－2，应只补讲出错步骤。'},
    {name:'几何证明',subject:'数学',stem:'在△ABC中，AB＝AC，D是BC的中点。连接AD。证明：∠BAD＝∠CAD。',studentAnswer:'AD画在中间，所以两个角一样大。',answer:'由AB＝AC、BD＝DC、AD＝AD，得△ABD≌△ACD（SSS），所以∠BAD＝∠CAD。',correct:false,image:'05-几何证明.png',analysis:'需要把图形直觉转为有依据的证明。'},
    {name:'语文阅读',subject:'语文',stem:'小宇把伞偏向没带伞的小林，自己的半边肩膀湿了。你觉得小宇是一个怎样的孩子？请结合短文内容说明。',studentAnswer:'小宇是个好孩子。',answer:'小宇很体贴。伞偏向小林、自己淋湿的行为说明他关心同伴。',correct:false,image:'06-语文阅读.png',analysis:'观点有了，还需要从原文找到具体行为作为依据。'},
    {name:'英语时态',subject:'英语',stem:'Look! Tom ___ football in the playground. A. plays B. is playing C. played',studentAnswer:'选A。Tom是一个人，所以选plays。',answer:'B. is playing',correct:false,image:'07-英语时态.png',analysis:'先确认词义，再区分习惯与眼前正在发生的动作。'},
    {name:'猜对但理由错',subject:'数学',stem:'判断：任意两个负数的乘积，一定大于这两个负数中的每一个。A. 正确 B. 错误',studentAnswer:'选A。我是猜的，乘法会让数变大。',answer:'A. 正确',correct:true,image:'08-猜对但理由错.png',analysis:'答案正确，但理由不成立；应引导用负负得正与正负数比较说明。'}
  ];
  const seedQuestions = (task, item, studentId) => {
    if (task.kind !== 'homework' || !['photo','file'].includes(item.type) || item.gradingEnabled === false) return [];
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
  try { const saved = JSON.parse(previewStorage.getItem(KEY) || 'null'); store = saved?.tasks && saved?.submissions ? saved : seed(); } catch { store = seed(); }
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
  if(!store.tasks.some(task=>task.id==='tutor-scenarios-v1')){
    const now=formatDate(new Date()),deadline=addDays(now,4),childIds=[...schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS];
    const task={id:'tutor-scenarios-v1',title:'AI讲题 · 模拟作业',subject:'综合',kind:'homework',schoolId:'luohu-demo',classIds:['c1','c2'],targetStudentIds:childIds,targetSnapshotIds:childIds,description:'8张模拟学生手写作业，点击照片上的题目体验1对1讲题。',publishedAt:addDays(now,-2),deadline,submitDeadline:addDays(deadline,7),parentVisible:false,publishedBy:'teacher-demo-001',items:tutorScenarioSamples.map((sample,index)=>({id:'tutor-scenario-'+(index+1),title:sample.subject+' · '+sample.name,instruction:'已提交的模拟作业照片',type:'photo',gradingEnabled:true}))};
    store.tasks.push(task);
    childIds.forEach(studentId=>tutorScenarioSamples.forEach((sample,index)=>{const item=task.items[index];store.submissions.push({taskId:task.id,itemId:item.id,studentId,label:'模拟学生作业',media:'assets/tutor-scenarios/'+sample.image,submittedAt:addDays(now,-1),submittedBy:'guardian-demo-001 · 演示家长',mock:true,version:1,questions:[{id:item.id+'-q1',label:'第1题 · '+sample.name,stem:sample.stem,studentAnswer:sample.studentAnswer,answer:sample.answer,correct:sample.correct,state:'confirmed',questionVersion:1,answerVersion:1,region:{x:.03,y:.08,width:.94,height:.82},analysis:sample.analysis,explanation:sample.analysis+' 参考答案：'+sample.answer,knowledge:sample.subject}]});}));
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
      if(!record.photos?.length&&task.id!=='tutor-scenarios-v1'&&(task.kind!=='homework'||task.subject!=='数学'||item.type!=='photo')&&record.questions?.length){record.questions=[];report.clearedGrades++;}
      if(item.type==='none'){record.label='家长确认已完成';record.media='';}
      return true;
    });
    return report;
  }
  reconcileMockData(store);
  // Teacher-published task combinations shared with the guardian's pending list.
  const combinationNow = formatDate(new Date()).slice(0, 10) + ' 18:00';
  const combinationSpecs = [
    { id: 'shared-combo-math-v1', title: '分数单元综合练习', subject: '数学', kind: 'homework', publisher: 'teacher-demo-001', classIds: ['c1', 'c2'], dueIn: 3, description: '完成纸质练习，按要求提交照片、讲解视频和练习文档，并确认线下订正。', items: [['math-photo', '练习答题页', '拍摄完整、清晰的答题页。', 'photo'], ['math-video', '错题讲解', '选择一道错题录制讲解视频。', 'video'], ['math-file', '订正记录', '上传订正后的 PDF 或 Word 文件。', 'file'], ['math-confirm', '线下订正确认', '订正完成后由家长确认。', 'none']], doneForFirst: ['math-confirm'] },
    { id: 'shared-combo-english-v1', title: '英语阅读与写作', subject: '英语', kind: 'homework', publisher: 'teacher-demo-001', classIds: ['c1', 'c2'], dueIn: 4, description: '提交阅读记录照片和作文文档，两项分别完成。', items: [['english-photo', '阅读记录', '拍摄阅读记录页。', 'photo'], ['english-file', '英语小作文', '上传 PDF 或 Word 文档。', 'file']], doneForFirst: [] },
    { id: 'shared-combo-reading-v1', title: '朗读与阅读打卡', subject: '语文', kind: 'checkin', publisher: 'other-teacher-demo', classIds: ['c1'], dueIn: 5, description: '录制朗读视频，完成阅读后由家长确认。', items: [['reading-video', '朗读视频', '录制一段朗读视频。', 'video'], ['reading-confirm', '阅读完成确认', '阅读完成后由家长确认。', 'none']], doneForFirst: ['reading-confirm'] }
  ];
  combinationSpecs.forEach(spec => {
    if (store.tasks.some(task => task.id === spec.id)) return;
    const targetSnapshotIds = students.filter(student => spec.classIds.includes(student.classId)).map(student => student.id);
    const deadline = addDays(combinationNow, spec.dueIn);
    const task = { id: spec.id, title: spec.title, subject: spec.subject, kind: spec.kind, schoolId: 'luohu-demo', classIds: spec.classIds, targetStudentIds: null, targetSnapshotIds, publishedBy: spec.publisher, publishedAt: combinationNow, deadline, submitDeadline: addDays(deadline, 7), parentVisible: false, description: spec.description, items: spec.items.map(([id, title, instruction, type]) => ({ id, title, instruction, type, required: true, gradingEnabled: false })) };
    store.tasks.push(task);
    targetSnapshotIds.forEach((studentId, index) => task.items.forEach((item, itemIndex) => {
      if (schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS.includes(studentId) ? !spec.doneForFirst.includes(item.id) : index % 4 === 0 || index % 5 === 0 && itemIndex > 0) return;
      store.submissions.push({ taskId: task.id, itemId: item.id, studentId, submittedAt: combinationNow, submittedBy: 'guardian-demo-001 · 演示家长', label: item.type === 'none' ? '家长确认已完成' : `演示${types[item.type]}提交`, media: item.type === 'photo' ? 'miniprogram/assets/homework-demo-paper.png' : '', mock: true, version: 1, questions: [] });
    }));
  });
  // One coherent four-requirement example: 2 complete, 1 partial, 1 missing.
  if(!store.tasks.some(t=>t.id==='demo-multi-requirements-v2')){
    const ids=students.filter(s=>s.classId==='c1').slice(0,4).map(s=>s.id),now=formatDate(new Date()),deadline=addDays(now,2);
     const task={id:'demo-multi-requirements-v2',title:'数学作业 · 四项要求演示',subject:'数学',kind:'homework',schoolId:'luohu-demo',classIds:['c1'],targetStudentIds:ids,targetSnapshotIds:ids,publishedBy:'teacher-demo-001',publishedAt:now,deadline,submitDeadline:addDays(deadline,7),description:'巩固分数知识，完成以下 4 项要求。',items:[{id:'multi-photo',title:'完成数学练习第 3 页',type:'photo',gradingEnabled:true},{id:'multi-video',title:'选择一道错题，录制 1 分钟讲解视频',type:'video'},{id:'multi-file',title:'填写练习文档并上传文件',type:'file'},{id:'multi-confirm',title:'完成 20 分钟课外阅读，由家长确认',type:'none'}].map(i=>({...i,required:true,instruction:i.title}))};
    store.tasks.unshift(task);
    ids.slice(0,3).forEach((studentId,index)=>task.items.filter((item,itemIndex)=>index<2||itemIndex===0||itemIndex===3).forEach(item=>store.submissions.push({taskId:task.id,itemId:item.id,studentId,submittedAt:now,submittedBy:'guardian-demo-001',label:item.type==='none'?'家长确认已完成':'演示提交记录（无真实附件）',media:'',mock:true,version:1,questions:seedQuestions(task,item,studentId)})));
  }
  // Extend only the seeded photo records; preserve uploads and any teacher changes to existing questions.
  const multiDemo=store.tasks.find(task=>task.id==='demo-multi-requirements-v2');
  const demoAsset=name=>(typeof location!=='undefined'&&location.protocol==='file:'?'../miniprogram':'miniprogram')+'/assets/'+name;
  const gradingDemo=store.tasks.find(task=>task.id==='grading-demo-v1');
  if(gradingDemo&&!Array.isArray(gradingDemo.attachments))gradingDemo.attachments=[{id:'demo-grading-paper',name:'分数练习样张.png',type:'image',path:demoAsset('homework-demo-paper.png'),size:0,source:'演示附件'}];
  if(multiDemo){const photo=multiDemo.items.find(item=>item.id==='multi-photo');store.submissions.filter(row=>row.taskId===multiDemo.id&&row.itemId===photo?.id&&row.mock).forEach(row=>{row.questions||=[];seedQuestions(multiDemo,photo,row.studentId).slice(2).forEach(question=>{if(!row.questions.some(existing=>existing.id===question.id))row.questions.push(question);});});}
  const multiDemoPaper=(()=>{const questions=[['分数计算','计算：1/2 + 1/4 =（　）。'],['应用题','学校合唱队有 40 名学生，其中男生占 3/5，','男生有多少人？'],['','计算：2/3 + 1/6 =（　）。'],['分数比较','比较 3/4 和 5/8 的大小。'],['单位“1”判断','判断：一根绳子的 2/5 是 8 米，绳子全长多少米？'],['分数乘法','计算：48 × 3/4 =（　）。']];const lines=questions.map(([title,stem,extra],i)=>{const top=166+i*154;return `<text x="65" y="${top}" font-size="20" font-weight="700">${title?`${i+1}. ${title}`:stem}</text>${title?`<text x="65" y="${top+37}" font-size="20">${stem}</text>`:''}${extra?`<text x="65" y="${top+67}" font-size="20">${extra}</text>`:''}<path d="M65 ${top+84}H655" stroke="#e3ebf0" stroke-width="2"/>`;}).join('');return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1100" viewBox="0 0 720 1100"><rect width="720" height="1100" fill="#eaf0f3"/><rect x="32" y="24" width="656" height="1052" rx="8" fill="#fff" stroke="#d7e3eb" stroke-width="2"/><g font-family="Microsoft YaHei, PingFang SC, sans-serif" fill="#27445a"><text x="65" y="76" font-size="27" font-weight="700">数学练习 · 第 3 页</text><text x="65" y="108" font-size="17" fill="#7a91a1">按题完成计算与应用</text>${lines}<text x="65" y="1050" font-size="15" fill="#9baeba">原型演示题目页</text></g></svg>`);})();
  if(multiDemo&&(!Array.isArray(multiDemo.attachments)||multiDemo.attachments.every(file=>['demo-task-page-1','demo-task-page-2'].includes(file.id))))multiDemo.attachments=[{id:'demo-task-page-1',name:'数学练习样张.png',type:'image',path:demoAsset('homework-demo-paper.png'),size:0,source:'演示附件'},{id:'demo-task-page-2',name:'数学练习第 3 页.svg',type:'image',path:multiDemoPaper,size:0,source:'演示附件'}];
  const worksheetDemo = worksheetLibrary.find(item => item.id === 'math-application-grade7');
  if (worksheetDemo && !store.tasks.some(task => task.id === 'worksheet-flow-grade5-v1')) {
    const now = formatDate(new Date()), deadline = addDays(now, 3), itemId = 'worksheet-grade5-photo';
    const targetSnapshotIds = students.filter(student => ['c1', 'c2'].includes(student.classId)).map(student => student.id);
    const task = { id: 'worksheet-flow-grade5-v1', title: worksheetDemo.title, subject: worksheetDemo.subject, kind: 'homework', schoolId: 'luohu-demo', classIds: ['c1', 'c2'], targetStudentIds: null, targetSnapshotIds, publishedBy: 'teacher-demo-001', publishedAt: now, deadline, submitDeadline: addDays(deadline, 7), parentVisible: false, description: worksheetDemo.description, attachments: [{ id: 'worksheet-grade5-blank', name: '七年级数学应用题（空白作业）.png', type: 'image', path: worksheetAsset(worksheetDemo.blankPath), size: 0, source: '作业素材库' }], items: [{ id: itemId, title: '提交整张作答页', instruction: worksheetDemo.requirement, type: 'photo', required: true, gradingEnabled: true }] };
    store.tasks.unshift(task);
    targetSnapshotIds.forEach((studentId, index) => {
      if (studentId === schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[0] || index % 7 === 0) return;
      const correct = index % 4 !== 0;
      store.submissions.push({ taskId: task.id, itemId, studentId, submittedAt: addDays(now, 1), submittedBy: 'guardian-demo-001 · 演示家长', label: '七年级数学应用题作答页', media: worksheetAsset(worksheetDemo.answeredPath), mock: false, version: 1, questions: [
        { id: `${task.id}:q1`, label: '第 1 题 · 有理数混合运算', answer: '-18', studentAnswer: '-18', correct: true, state: 'confirmed', region: { x: .14, y: .25, width: .78, height: .10 }, knowledge: '有理数混合运算' },
        { id: `${task.id}:q2`, label: '第 2 题 · 一元一次方程', answer: 'x=7', studentAnswer: 'x=7', correct: true, state: 'confirmed', region: { x: .14, y: .44, width: .78, height: .10 }, knowledge: '解一元一次方程' },
        { id: `${task.id}:q3`, label: '第 3 题 · 整式求值', answer: '15', studentAnswer: correct ? '15' : '11', correct, state: correct ? 'confirmed' : 'review', region: { x: .14, y: .63, width: .78, height: .10 }, knowledge: '整式求值' },
        { id: `${task.id}:q4`, label: '第 4 题 · 线段关系', answer: '6厘米', studentAnswer: '6厘米', correct: true, state: 'confirmed', region: { x: .14, y: .82, width: .78, height: .10 }, knowledge: '线段关系' }
      ] });
    });
  }
  // 保留历史演示任务 ID 与提交版本，只替换内置五年级样例的可见素材。
  if (worksheetDemo) {
    const task = store.tasks.find(row => row.id === 'worksheet-flow-grade5-v1');
    if (task) {
      task.title = worksheetDemo.title;
      task.description = worksheetDemo.description;
      task.attachments = [{ id: 'worksheet-grade5-blank', name: '七年级数学应用题（空白作业）.png', type: 'image', path: worksheetAsset(worksheetDemo.blankPath), size: 0, source: '作业素材库' }];
      const item = task.items.find(row => row.id === 'worksheet-grade5-photo');
      if (item) item.instruction = worksheetDemo.requirement;
    }
    store.submissions.filter(row => row.taskId === 'worksheet-flow-grade5-v1' && /math-grade5-application-answered\.webp$/.test(row.media || '')).forEach(row => {
      row.label = '七年级数学应用题作答页';
      row.media = worksheetAsset(worksheetDemo.answeredPath);
      const answers = ['-18', 'x=7', '15', '6厘米'];
      const labels = ['有理数混合运算', '一元一次方程', '整式求值', '线段关系'];
      const knowledge = ['有理数混合运算', '解一元一次方程', '整式求值', '线段关系'];
      row.questions?.forEach((question, index) => { if (index >= 4) return; question.label = `第 ${index + 1} 题 · ${labels[index]}`; question.answer = answers[index]; question.studentAnswer = question.correct ? answers[index] : '11'; question.knowledge = knowledge[index]; question.region = { x: .14, y: .25 + index * .19, width: .78, height: .10 }; });
    });
  }
  const samplePhoto = record => record.taskId==='demo-multi-requirements-v2'&&record.itemId==='multi-photo'?multiDemoPaper:/^(?:grading|console)-page-[12]$/.test(record.itemId)?(typeof location!=='undefined'&&location.protocol==='file:'?'../miniprogram':'miniprogram')+grading.demoPhotoPath(record.itemId):record.media||(typeof location!=='undefined'&&location.protocol==='file:'?'../miniprogram':'miniprogram')+grading.demoPhotoPath(record.itemId);
   store.tasks.find(task=>task.id==='guardian-demo-status-v1-pending-math')?.items.forEach(item=>{if(item.type==='photo')item.gradingEnabled=true;});
    store.tasks.forEach(task=>task.items.forEach(item=>{if(item.gradingEnabled===undefined)item.gradingEnabled=task.kind==='homework'&&item.type==='photo'&&store.submissions.some(row=>row.taskId===task.id&&row.itemId===item.id&&row.questions?.length);if(!gradingEligible(item.type))item.gradingEnabled=false;}));
   // Repair two unsubmitted demo tasks created with mismatched sample submit types.
   store.tasks.filter(task=>/^10月(?:20|21)日（周[二三]）数学任务$/.test(task.title)&&task.items.length===4&&!store.submissions.some(row=>row.taskId===task.id)).forEach(task=>task.items.forEach(item=>{
     const expected=/家长确认/.test(item.title)?'none':/视频/.test(item.title)?'video':/文档|文件/.test(item.title)?'file':/拍照|图片/.test(item.title)?'photo':'';
     if(expected&&item.type!==expected){item.type=expected;item.gradingEnabled=false;}
   }));
   const currentSample=store.tasks.find(t=>t.id==='grading-demo-v1');if(currentSample)currentSample.needsAnswerConfirmation=true;
  store.tasks.filter(t=>t.needsAnswerConfirmation).forEach(t=>{const records=latestRows(store.submissions.filter(r=>r.taskId===t.id));grading.initializeAnswerStandards(t,records);});
  const save = () => { if(localPageDemo?.snapshot)return; try { previewStorage.setItem(KEY, JSON.stringify(store)); } catch { /* 大图片超过浏览器本地容量时仍保留本次演示状态 */ } };
  const sessionMedia = new Map();
  const mediaKey = row => `${row.taskId}:${row.itemId}:${row.studentId}`;
  const mediaFor = row => row.media || sessionMedia.get(mediaKey(row)) || '';
  save();
   const newItem = () => ({ id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: '', instruction: '', type: '', gradingEnabled: false });
  const defaultDeadline = () => { const date = new Date(); date.setDate(date.getDate() + 2); date.setHours(20, 0, 0, 0); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 20:00`; };
  const newDraft = () => { const deadline = defaultDeadline(); return { kind: 'homework', subject: '数学', title: '', description: '', photo: '', attachments: [], deadline, submitDeadline: addDays(deadline, 7), allowSupplement:true, supplementTouched:false, cycleCount: 1, classIds: ['c1', 'c2'], targetMode: 'all', recipientModes: { c1: 'all', c2: 'all' }, targetStudentIds: [], parentVisible: false, items: [newItem()] }; };
  let teacherMode = 'list';
  let gradeUI = { page:0, q:'', wrongOnly:false, parentOpen:false, origin:'detail' };
  let recipientClassId='',recipientSearch='',recipientPickerOpen=false;
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
  let worksheetLibraryOpen = false;
  let chatDemoOpen = false;
  let materialPreview = null;
  let materialPreviewPage = 0;
  let materialListTaskId = '';
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
  const collapsedParentAttachments = new Set();
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
  const recipientModeForClass = id => draft.recipientModes?.[id] === 'selected' ? 'selected' : 'all';
  const draftRecipients = () => students.filter(row => draft.classIds.includes(row.classId) && (recipientModeForClass(row.classId) === 'all' || draft.targetStudentIds.includes(row.id)));
  const syncDraftTitle = () => {
    const options = subjectOptions(), changed = !options.includes(draft.subject);
    if (changed) draft.subject = options[0] || '';
    const allowed = subjectClassIds(draft.subject);
    draft.classIds = draft.classIds.filter(id => allowed.includes(id));
    if (changed && !draft.classIds.length) draft.classIds = allowed.slice(0, 1);
    if (!draft.recipientModes) draft.recipientModes = Object.fromEntries(draft.classIds.map(id => [id, draft.targetMode === 'selected' ? 'selected' : 'all']));
    draft.recipientModes = Object.fromEntries(draft.classIds.map(id => [id, draft.recipientModes[id] === 'selected' ? 'selected' : 'all']));
    draft.targetStudentIds = draft.targetStudentIds.filter(id => students.some(row => row.id === id && draft.classIds.includes(row.classId)));
    const defaultTitle = schoolDemoRoster.formatHomeworkTitle(draft.subject, draft.kind);
    if (!draft.titleCustomized || !draft.title?.trim()) { draft.title = defaultTitle; draft.titleCustomized = false; }
  };
  const hasTeacherDraft = () => Boolean(draft.titleCustomized || draft.description.trim() || materialAttachments(draft).length || draft.items.some(item => item.title || item.instruction) || subjectTouched || draft.kind === 'checkin');
  let draftStorageError='',draftNotice='',draftMenu=null,draftDelete=null,composeOrigin='list',draftListScroll=0;
  const draftArchiveKey = () => DRAFT_KEY + workScope.teacherId + ':archive';
  const readDraftArchive = () => {
    const value=JSON.parse(previewStorage.getItem(draftArchiveKey())||'[]');
    if(!Array.isArray(value)||value.some(row=>!row?.id||!row.saved?.draft||!Array.isArray(row.saved.draft.items)||!Array.isArray(row.saved.draft.classIds)))throw Error('草稿数据无法读取，请重试；原内容仍保留。');
    return value;
  };
  const draftArchive = () => {try{const rows=readDraftArchive();draftStorageError='';return rows;}catch{draftStorageError='草稿暂时无法读取，请重试；原内容仍保留。';return [];}};
  const saveTeacherDraft = () => {
    if(workScope.view==='school'||!hasTeacherDraft())return true;
    try{const old=JSON.parse(previewStorage.getItem(DRAFT_KEY+workScope.teacherId)||'null');const saved={draft,composeStep,settingMode,uniformType,recognizedCount,recognitionStale,subjectTouched};
      saved.updatedAt=old&&JSON.stringify(old.draft)===JSON.stringify(draft)?old.updatedAt||0:Date.now();
      previewStorage.setItem(DRAFT_KEY+workScope.teacherId,JSON.stringify(saved));return true;
    }catch{composeError='草稿保存失败，请保留当前页面，移除部分附件后重试。';draftNotice=composeError;return false;}
  };
  const archiveCurrentDraft = () => {
    if(!hasTeacherDraft())return true;
    if(!saveTeacherDraft())return false;
    try{const rows=readDraftArchive(),saved=JSON.parse(previewStorage.getItem(DRAFT_KEY+workScope.teacherId));rows.unshift({id:'draft-'+Date.now()+'-'+Math.random().toString(36).slice(2),saved});previewStorage.setItem(draftArchiveKey(),JSON.stringify(rows));return true;}
    catch{draftNotice='草稿保存失败，请重试；当前内容仍保留。';return false;}
  };
  const teacherDraftRows = () => {
    const rows=draftArchive().map(row=>({id:row.id,saved:row.saved}));
    if(hasTeacherDraft()){let saved;try{saved=JSON.parse(previewStorage.getItem(DRAFT_KEY+workScope.teacherId)||'null');}catch{draftStorageError='草稿暂时无法读取，请重试；原内容仍保留。';}rows.push({id:'current',saved:{draft,updatedAt:saved?.updatedAt||0}});}
    return rows.sort((a,b)=>(b.saved.updatedAt||0)-(a.saved.updatedAt||0));
  };
  const draftEditLabel = at => at?'最近编辑 '+formatDate(new Date(at)):'历史草稿 · 编辑时间未记录';
  function teacherDraftList(){
    const rows=teacherDraftRows();
    return '<div class="hp-drafts-page"><div class="hp-draft-toolbar"><span>共 '+rows.length+' 份 · 最近编辑排序</span><button onclick="homeworkPrototype.newTeacherDraft()">＋ 新建</button></div>'+
      (draftStorageError?'<section class="hp-draft-error" role="alert">'+escape(draftStorageError)+'<button onclick="homeworkPrototype.retryDraftList()">重试</button></section>':'')+
      (draftNotice?'<p class="hp-draft-feedback" role="status">'+escape(draftNotice)+'</p>':'')+
      (rows.length?rows.map(({id,saved})=>{const d=saved.draft,expired=toDate(d.deadline).getTime()<=Date.now();return '<article class="hp-draft-card"><button class="hp-draft-main" onclick="homeworkPrototype.openSavedDraft(\''+escape(id)+'\')"><time>'+escape(draftEditLabel(saved.updatedAt))+'</time><strong>'+escape(d.title||'未命名作业')+'</strong><span class="hp-draft-meta"><em>'+escape(d.subject||'综合')+'</em> '+(d.kind==='checkin'?'打卡':'作业')+' · '+d.items.length+' 项　'+escape(d.classIds.map(id=>classes.find(c=>c.id===id)?.name||id).join('、')||'待选择班级')+'</span>'+(expired?'<span class="hp-draft-expired">首次截止已过，继续时需调整</span>':'')+'<span class="hp-draft-bottom"><span>首次截止 '+escape(d.deadline||'待设置')+'</span><b>继续编辑 ›</b></span></button><button class="hp-draft-more" aria-label="'+escape(d.title||'未命名作业')+'更多操作" onclick="homeworkPrototype.openDraftMenu(\''+escape(id)+'\')">···</button></article>';}).join(''):
        draftStorageError?'':'<section class="hp-draft-empty"><strong>暂无草稿</strong><p>未发布的内容会保存在这里。</p><button class="hp-secondary" onclick="homeworkPrototype.newTeacherDraft()">新建作业或打卡</button></section>')+
      '<p class="hp-draft-privacy">仅自己可见，尚未发送给学生</p></div>';
  }
  function draftOverlays(){
    if(draftDelete)return '<div class="hp-draft-mask"><section class="hp-draft-dialog" role="dialog" aria-modal="true" aria-labelledby="hp-draft-delete-title"><div><h2 id="hp-draft-delete-title">删除这份草稿？</h2><p class="hp-draft-object">'+escape(draftDelete.title)+'</p><p>删除后无法恢复，已发布任务不受影响。</p>'+(draftDelete.error?'<p class="hp-draft-error" role="alert">'+escape(draftDelete.error)+'</p>':'')+'</div><footer><button id="hp-draft-cancel" onclick="homeworkPrototype.closeDraftOverlay()">取消</button><button onclick="homeworkPrototype.confirmDraftDeletion()">删除草稿</button></footer></section></div>';
    if(draftMenu)return '<div class="hp-draft-mask hp-draft-menu-mask" onclick="homeworkPrototype.closeDraftOverlay()"><section class="hp-draft-menu" role="dialog" aria-modal="true" aria-label="草稿操作" onclick="event.stopPropagation()"><p>'+escape(draftMenu.title)+'</p><button class="hp-draft-danger" onclick="homeworkPrototype.requestDraftDeletion()">删除草稿</button><button onclick="homeworkPrototype.closeDraftOverlay()">取消</button></section></div>';
    return '';
  }
  if(typeof document!=='undefined')document.addEventListener?.('keydown',event=>{if(event.key==='Escape'&&(draftDelete||draftMenu)){draftDelete=null;draftMenu=null;teacherRefresh();}});
  const findDraft = id => teacherDraftRows().find(row=>row.id===id);
  function requestDraftDelete(id){
    if(workScope.view==='school')return;
    const row=findDraft(id);if(!row||draftStorageError){draftNotice='草稿已变化或无法读取，请重试。';teacherRefresh();return;}
    const snapshot=id==='current'?previewStorage.getItem(DRAFT_KEY+workScope.teacherId):JSON.stringify(row.saved);
    draftDelete={id,title:row.saved.draft.title||'未命名作业',teacherId:workScope.teacherId,snapshot,error:''};draftMenu=null;teacherRefresh();
    document.getElementById('hp-draft-cancel')?.focus?.({preventScroll:true});
  }
  const restoreTeacherDraft = () => {
    if (workScope.view === 'school') return;
    try {
      const saved = JSON.parse(previewStorage.getItem(DRAFT_KEY + workScope.teacherId) || 'null');
      if (!saved?.draft || !Array.isArray(saved.draft.items) || !Array.isArray(saved.draft.classIds) || !saved.draft.classIds.every(id => publishingClassIds().includes(id))) return;
      draft = saved.draft; draft.attachments = materialAttachments(draft); draft.photo = ''; composeStep = saved.composeStep === 1 ? 1 : 0; settingMode = saved.settingMode === 'individual' ? 'individual' : 'uniform'; uniformType = publishTypes.includes(saved.uniformType) ? saved.uniformType : ''; recognizedCount = saved.recognizedCount || 0; recognitionStale = Boolean(saved.recognitionStale);
      draft.attachments.forEach(file => { if (file.uploadState === 'optimizing' || file.uploadState === 'uploading') { file.uploadState = 'failed'; file.uploadError = '上传已中断，请重新上传'; } });
      subjectTouched = Boolean(saved.subjectTouched);
    } catch { /* 无有效草稿时保持新建表单。 */ }
  };
  const materialFileById = id => materialAttachments(draft).find(file => file.id === id);
  const revealMaterialAttachment = id => requestAnimationFrame(() => {
    const row = document.querySelector(`.hp-attachment-row[data-material-id="${CSS.escape(String(id))}"]`);
    if (row) row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  const stopMaterialUpload = id => { const timer = materialUploadTimers.get(id); if (timer) clearTimeout(timer); materialUploadTimers.delete(id); };
  const scheduleMaterialUpload = id => {
    stopMaterialUpload(id);
    const timer = setTimeout(() => {
      const file = materialFileById(id);
      if (!file) { stopMaterialUpload(id); return; }
      if (file.uploadState === 'optimizing') {
        file.optimizedFrom = file.type === 'image' ? file.size || 0 : 0;
        file.uploadSize = file.size; // No real encoder is connected; never invent a compressed size.
        file.uploadState = 'uploading';
        file.uploadProgress = 8;
      } else if (file.uploadState === 'uploading') {
        file.uploadProgress = Math.min(100, Number(file.uploadProgress || 0) + 17);
        if (file.uploadProgress >= 100) {
          file.uploadState = 'complete';
          file.previewState = file.type==='file'&&!materialPreviewPages(file).length?'pending':'ready';
          file.uploadProgress = 100;
          file.uploadError = '';
          stopMaterialUpload(id);
        }
      } else { stopMaterialUpload(id); return; }
      saveTeacherDraft();
      refreshMaterialView();
      if (file.uploadState === 'optimizing' || file.uploadState === 'uploading') scheduleMaterialUpload(id);
    }, materialFileById(id)?.uploadState === 'optimizing' ? 1400 : 430);
    materialUploadTimers.set(id, timer);
  };
  const startMaterialUpload = (file, retry = false) => {
    if (!file) return;
    stopMaterialUpload(file.id);
    file.uploadError = '';
    file.uploadProgress = 0;
    file.uploadState = retry ? 'uploading' : 'optimizing';
    if (!file.uploadSize) file.uploadSize = file.size || 0;
    saveTeacherDraft();
    refreshMaterialView();
    scheduleMaterialUpload(file.id);
  };
  const teacherTask = task => task && ({ ...task, targetSnapshotIds: task.targetSnapshotIds?.filter(id=>students.some(student=>student.id===id&&workScope.classIds.includes(student.classId))), classIds: task.classIds.filter(id => workScope.classIds.includes(id)), targetStudentIds: task.targetStudentIds?.filter(id => students.some(student => student.id === id && workScope.classIds.includes(student.classId))) || null });
  const detailTaskBase = task => {const allowed=workScope.view==='subject'?subjectClassIds(task.subject||'数学'):workScope.classIds;return {...task,classIds:task.classIds.filter(id=>allowed.includes(id)),targetSnapshotIds:task.targetSnapshotIds?.filter(id=>students.some(s=>s.id===id&&allowed.includes(s.classId))),targetStudentIds:task.targetStudentIds?.filter(id=>students.some(s=>s.id===id&&allowed.includes(s.classId)))||null};};
  const teacherTaskById = id => { const task = taskById(id); return task && detailTaskBase(task).classIds.length && (workScope.view === 'school' || task.publishedBy === workScope.teacherId) ? (()=>{const scoped=id===teacherTaskId?detailTaskBase(task):teacherTask(task);return id===teacherTaskId&&detailClassId!=='all'&&scoped.classIds.includes(detailClassId)?{...scoped,classIds:[detailClassId],targetSnapshotIds:scoped.targetSnapshotIds?.filter(id=>students.some(student=>student.id===id&&student.classId===detailClassId)),targetStudentIds:scoped.targetStudentIds?.filter(id=>students.some(student=>student.id===id&&student.classId===detailClassId))||null}:scoped;})() : null; };
  const submissionsFor = task => latestRows(store.submissions.filter(row => row.taskId === task.id && targetIds(task).includes(row.studentId)));
  function summary(task) {
    const targets = targetIds(task);
    const submissions = submissionsFor(task);
    const completed = targets.filter(studentId => task.items.every(item => submissions.some(row => row.studentId === studentId && row.itemId === item.id))).length;
    const partial = targets.filter(studentId => submissions.some(row => row.studentId === studentId) && !task.items.every(item => submissions.some(row => row.studentId === studentId && row.itemId === item.id))).length;
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
  const teacherRefresh = (reset = false) => { if(teacherMode === 'compose' || teacherMode === 'preview')saveTeacherDraft();const top = typeof document === 'undefined' || reset ? 0 : document.getElementById('teacher-tab-panel')?.scrollTop || 0; if (typeof teacherDesk === 'function') teacherDesk(); resizeDescription(); if (typeof document !== 'undefined') { const panel = document.getElementById('teacher-tab-panel'); if (panel) panel.scrollTop = top; } };
  const clearComposeError = () => { composeError = ''; if (typeof document !== 'undefined') { const error = document.querySelector('.hp-error'); if (error) error.remove(); } };
  const parentRefresh = (reset = false) => { const top = typeof document === 'undefined' || reset ? 0 : document.querySelector('.parent-main')?.scrollTop || 0,photoTop=typeof document === 'undefined'||reset?0:document.querySelector('.hp-result-photo')?.scrollTop||0,sheetTop=typeof document === 'undefined'||reset?0:document.querySelector('.hp-result-sheet-body')?.scrollTop||0; window.parentPrototype?.render(); if (typeof document !== 'undefined') { const panel = document.querySelector('.parent-main'); if (panel) panel.scrollTop = top;const photo=document.querySelector('.hp-result-photo'),sheet=document.querySelector('.hp-result-sheet-body'),nav=document.querySelector('.hp-result-question-nav'),active=nav?.querySelector('.active');if(photo)photo.scrollTop=photoTop;if(sheet)sheet.scrollTop=sheetTop;if(nav&&active)nav.scrollLeft=Math.max(0,active.offsetLeft-nav.offsetLeft-nav.clientWidth/2+active.clientWidth/2); } };
  function teacherList() {
    if(workScope.view!=='school')return teacherListV2();
    const tasks = filteredListTasks();
    const due = tasks.filter(task => !task.withdrawnAt&&!task.stoppedAt&&new Date(task.deadline.replace(' ', 'T')).getTime() <= Date.now());
    const homework = due.filter(task => task.kind === 'homework').map(task => summary(listTask(task)));
    const checkins = due.filter(task => task.kind === 'checkin').map(task => summary(listTask(task)));
    const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);
    return `<div class="hp-hero"><span class="hp-eyebrow">${workScope.view === 'school' ? '学校管理员 · 只读' : workScope.view === 'homeroom' ? '班主任 · 本班' : '任课老师 · 数学'}</span><h1>作业与打卡</h1><p>查看作业进度与逐项提交。</p></div>${workScope.view === 'school' ? `<div class="hp-stats"><section><b>${homework.length}</b><span>已截止作业</span></section><section><b>${sum(homework, 'completed')}/${sum(homework, 'target')}</b><span>整份完成</span></section><section><b>${sum(checkins, 'completed')}/${sum(checkins, 'target')}</b><span>打卡完成</span></section></div><p class="hp-muted">进行中 ${tasks.length - due.length} 期；作业与打卡分别统计。</p>` : `<button class="hp-primary hp-publish-entry" onclick="homeworkPrototype.compose()">${hasTeacherDraft() ? '草稿 · 继续编辑' : '＋ 发布作业或打卡'}</button>${hasTeacherDraft() ? `<p class="hp-muted">当前草稿：${escape(draft.title||'未命名作业')}<br>发布内容已自动保存在草稿中，尚未发送给学生。</p><div class="hp-draft-actions"><button class="hp-secondary" onclick="homeworkPrototype.newTeacherDraft()">＋ 新建另一份</button><button class="hp-text-button" onclick="homeworkPrototype.deleteTeacherDraft()">删除当前草稿</button></div>` : ''}`}<h2 class="hp-section">范围内任务</h2>${tasks.map(original => { const task = teacherTask(original); const stat = summary(task); return `<button class="hp-card hp-task" onclick="homeworkPrototype.openTeacher('${task.id}',true)"><span class="hp-line"><strong><span class="hp-list-subject">${escape(task.subject||'综合')}</span>${escape(task.title)}</strong><em>${task.kind === 'checkin' ? '打卡' : '作业'}</em></span><small>共 ${task.items.length} 项 · ${escape([...new Set(task.items.map(item=>typeLabel(item.type)))].join('、'))}</small><small>${escape(task.classIds.map(id => classes.find(row => row.id === id)?.name).join('、'))} · 截止 ${escape(task.deadline)} · ${new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now() ? '进行中' : '已截止'}</small><span class="hp-line hp-task-bottom"><span>完成 ${stat.completed} / ${stat.target}</span><b>${stat.rate}% ›</b></span></button>`; }).join('') || '<section class="hp-card hp-muted">当前范围暂无任务。</section>'}`;
  }
  const filterTitle = { all: '全部学生', completed: '已完成学生', partial: '未交齐学生', missing: '未交齐学生', wrong: '答错学生', questionWrong: '本题答错学生' };
  function studentRows(task) {
    return targetIds(task).map(id => {
      const student = students.find(row => row.id === id);
      const records = submissionsFor(task).filter(row => row.studentId === id && task.items.some(item=>item.id===row.itemId));
      const required = task.items;
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
    const attachmentCount=materialAttachments(task).length;
    return `<section class="hp-card hp-task-brief"><span class="hp-detail-eyebrow">${escape(task.subject||'综合')}${task.kind==='checkin'?'打卡':'作业'}</span><div class="hp-task-title-row"><strong>${escape(task.title)}</strong>${attachmentCount?`<button class="hp-reference-shortcut" aria-label="查看 ${attachmentCount} 个附件" onclick="homeworkPrototype.openTaskAttachments()">附件 ${attachmentCount} ›</button>`:''}</div><small class="hp-brief-class">${escape(classLabel)}</small><div class="hp-brief-content"><p>${escape(briefDescription(task)||'请完成以下各项要求')}</p></div><div class="hp-brief-dates"><div><span>正常截止</span><time>${escape(task.deadline)}</time></div>${task.submitDeadline&&task.submitDeadline!==task.deadline?`<div><span>补交截止</span><time>${escape(task.submitDeadline)}</time></div>`:''}</div><div class="hp-submission-line"><button onclick="homeworkPrototype.openStudents('completed')"><b>${stat.completed}/${stat.target}</b><span>人已交齐</span></button><button onclick="homeworkPrototype.openStudents('missing')"><b>${stat.target-stat.completed}</b><span>人未交齐</span></button><button class="hp-roster-entry" aria-label="查看全部提交名单" onclick="homeworkPrototype.openStudents('all')">查看名单 ›</button></div></section>`;
  }

  function taskRequirementList(task){
    const rows=submissionsFor(task);
    return `<div class="hp-requirement-heading"><strong>作业要求</strong><span>共 ${task.items.length} 项 · 点击查看提交</span></div><section class="hp-card hp-requirement-overview">${task.items.map((item,index)=>{
      const count=new Set(rows.filter(row=>row.itemId===item.id).map(row=>row.studentId)).size;
      const graded=item.gradingEnabled===true&&item.type==='photo';
      const questions=rows.filter(row=>row.itemId===item.id).flatMap(row=>row.questions||[]);
      const pending=questions.filter(q=>q.state==='review').length;
      const meta=item.type==='photo'?(graded?`AI 批改${pending?` · 待复核 ${pending} 题次`:''}`:'仅收集，不批改'):item.required===false?'选交':'提交记录';
      return `<div class="hp-requirement-entry" role="button" tabindex="0" onclick="homeworkPrototype.openItemStudents('${item.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();homeworkPrototype.openItemStudents('${item.id}')}"><i>${index+1}</i><span class="hp-requirement-content"><strong>${escape(item.title)}</strong><small><em>${escape(typeLabel(item.type))}</em>${escape(meta)}</small></span><span class="hp-requirement-count"><b>${count}/${targetIds(task).length}</b> 人${item.type==='none'?'已完成':'已交'}${graded?`<button type="button" onclick="event.stopPropagation();homeworkPrototype.openQuestionResults('${item.id}')">查看批改 ›</button>`:'<i>›</i>'}</span></div>`;
    }).join('')}</section>`;
  }
  let rosterItemId='';
  let questionBrowseIds=null;
  const pageKey = role => role+':'+(role==='teacher'?teacherMode+(teacherMode==='student'||teacherMode==='result'?':'+teacherStudentId:'')+(teacherMode==='question'?':'+teacherQuestionId:''):gradeUI.parentOpen?'result':'detail')+':'+(role==='teacher'?teacherTaskId+':'+detailClassId:parentTaskId);
  function restoreLocalDemo(){if(!localPageDemo)return;const snap=localPageDemo.snapshot;if(snap){store.tasks=store.tasks.map(task=>task.id===snap.task.id?JSON.parse(JSON.stringify(snap.task)):task);store.submissions=[...store.submissions.filter(r=>r.taskId!==snap.task.id),...JSON.parse(JSON.stringify(snap.submissions))];}publishDemoBranch='normal';rosterReviewRequired=false;composeError=localPageDemo.composeError||'';localPageDemo=null;}
  function checkLocalDemo(role){if(localPageDemo&&localPageDemo.key!==pageKey(role))restoreLocalDemo();}
  function pageDemoContext(role){
    const mode=role==='teacher'?teacherMode:parentTaskId?gradeUI.parentOpen?'result':'detail':'list';
    const task=taskById(role==='teacher'?teacherTaskId:parentTaskId);
    const closed=task&&closedTask(task);
    const cases=[];
    if(mode==='preview')cases.push(['publish-network','发布失败','网络异常，保留当前发布内容。','异常情况'],['publish-roster','接收名单变化','阻止发布，返回核对接收对象。','异常情况']);
    if(mode==='list')cases.push(['empty','暂无作业','当前列表为空，不删除已有任务。','业务状态'],['load-failed','列表加载失败','显示失败提示，可恢复原列表。','异常情况']);
    if(task&&['detail','student','question','result'].includes(mode)){
      if(mode==='detail')cases.push(['published','未提交','预览当前作业的未提交状态。','业务状态'],['partial','部分提交','预览仅提交一项的情况。','业务状态'],['late','逾期可补交','原截止已过，仍允许补交。','业务状态'],['closed','补交已结束','停止提交，保留历史。','业务状态']);
      const hasResults=store.submissions.some(r=>r.taskId===task.id&&r.questions?.length);
      if(role==='parent'&&mode==='detail'&&(materialAttachments(task).some(file=>file.type==='file')||store.submissions.some(r=>r.taskId===task.id&&r.studentId===guardianId&&task.items.some(item=>item.id===r.itemId&&item.type==='file'))))cases.push(['upload-preview-ready','预览已就绪','原件与预览分别就绪，不改变提交或批改状态。','业务状态'],['upload-preview-pending','预览生成中','保留可用原件和已成功的提交，允许继续发布或提交。','业务状态'],['upload-preview-failed','预览生成失败','保留原件打开入口和成功记录，不当作上传或提交失败。','异常情况']);
      if(hasResults)cases.push(...[['queued','等待批改','提交成功，等待后台处理。'],['processing','正在批改','展示后台预估等待时间。'],['partialGrade','部分批改完成','已完成题与处理中题分别显示。'],['failed','批改失败','保留已完成结果，失败题不计错。'],['review','待教师复核','低把握判定等待教师核对。'],['unreleased','结果已同步','当前已有结果自动同步。'],['partialRelease','部分结果可见','已完成结果可见，其他题继续处理。'],['released','全部批改完成','查看当前学生整份已开放结果。'],['resubmit','重新提交后批改中','新版本不继承旧版开放状态。'],['changed','人工纠正已同步','人工新判定自动同步。']].map(([id,title,hint])=>[id,title,hint,id==='failed'?'异常情况':'业务状态']));
      if(role==='parent'&&mode==='detail'&&!closed){const uploads=task.items.filter(i=>i.type!=='none');if(uploads.length)cases.push(['upload-format','格式不支持','保留已选文件，提示重新选择。','异常情况'],['upload-size','文件过大','提示当前提交类型大小限制。','异常情况']);if(uploads.some(i=>i.type==='video'))cases.push(['upload-duration','视频时长超限','提示视频时长不能超过 3 分钟。','异常情况']);cases.push(['upload-network','提交时网络中断','当前选择保留，恢复后可重试。','异常情况']);}
    }
    if(role==='teacher'&&mode==='question'){const allowed=['queued','processing','partialGrade','failed','review'];for(let i=cases.length-1;i>=0;i--)if(!allowed.includes(cases[i][0]))cases.splice(i,1);}
    if(role==='teacher'){const index=cases.findIndex(c=>c[0]==='partial');if(index>=0)cases.splice(index,1);}
    return {key:pageKey(role),role,mode,taskId:task?.id||'',title:mode==='preview'?'核对发布内容':mode==='result'?(role==='parent'?'单题批改结果':'整份批改结果'):mode==='question'?'单题批改结果':mode==='list'?'作业列表':'作业详情',choices:localPageDemo?.key===pageKey(role)?localPageDemo.choices:cases,active:localPageDemo?.key===pageKey(role)?localPageDemo.id:'',label:localPageDemo?.label||''};
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
  let workflowNotice='',batchReview={key:'',selected:{},choice:''},mappingChoice=null;
  function workflowCommit(change){
    const snapshot=JSON.stringify(store);
    try{change();if(!localPageDemo?.snapshot)previewStorage.setItem(KEY,JSON.stringify(store));return true;}
    catch{store=JSON.parse(snapshot);workflowNotice='保存失败，尚未更新。请重试。';return false;}
  }
  function batchContext(studentId){
    const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return null;
    const record=submissionsFor(task).find(r=>r.studentId===studentId&&r.questions?.some(q=>q.id===teacherQuestionId));
    const q=record?.questions.find(q=>q.id===teacherQuestionId);
    if(!q||!['confirmed','review','unreadable','no-answer'].includes(q.state))return null;
    return {task,record,q,src:photoPath(record,q)};
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
  function reviewResumeContext(task) {
    const position=store.reviewPositions?.[workScope.teacherId+':'+task.id];if(!position)return null;
    if(position.classId!=='all'&&!task.classIds.includes(position.classId))return null;
    if(detailClassId!=='all'&&position.classId!==detailClassId)return null;
    const question=gradeQuestions(task).find(question=>question.id===position.questionId);if(!question)return null;
    const classLabel=position.classId==='all'?(task.classIds.length===1?classes.find(row=>row.id===task.classIds[0])?.name:'全部班级'):classes.find(row=>row.id===position.classId)?.name;
    return {position,question,label:(question.label.match(/第\s*\d+\s*题/)?.[0]||question.label)+' · '+(classLabel||'当前班级')};
  }
  function resumeReview(task){const context=reviewResumeContext(task);return context?'<div class="hp-resume" aria-label="上次查看位置"><span>上次查看：'+escape(context.label)+'</span><button class="hp-text-button" onclick="homeworkPrototype.resumeReview()" aria-label="继续查看'+escape(context.label)+'">继续 ›</button></div>':'';}
  function parentFeedback(q){return `<section class="hp-feedback"><button class="hp-text-button" onclick="homeworkPrototype.reportGradeIssue()">${q.parentFeedback?.status==='pending'?'已反馈，等待老师查看':q.parentFeedback?.status==='resolved'?'老师已处理 · 仍有疑问':'这道题可能批错了'}</button><small>${q.parentFeedback?.status==='pending'?'反馈已记录，原判定不会自动改变。':''}</small></section>`;}
  function unmatchedQuestions(task){
    const rows=submissionsFor(task).filter(record=>task.items.some(item=>item.id===record.itemId&&item.gradingEnabled===true&&item.type==='photo')).flatMap(record=>(record.questions||[]).filter(q=>q.mappingConfirmed===false).map(q=>({record,q})));if(!rows.length)return '';
    const choices=[...new Map(gradeQuestions(task).filter(q=>q.mappingConfirmed!==false).map(q=>[q.id,q])).values()];
    return `<details class="hp-card"><summary>有 ${rows.length} 份作答待确认题目对应</summary><small>个人结果保留，暂不计入班级同题比例。</small>${rows.map(({record,q})=>{const src=photoPath(record,q);return `<div class="hp-reference-entry"><strong>${escape(students.find(s=>s.id===record.studentId)?.name)} · ${escape(q.label)}</strong>${src?`<a href="${escape(src)}" target="_blank" rel="noopener"><img class="hp-original" src="${escape(src)}" alt="待关联题目的学生原图"></a>`:''}${canRelease(task)?`<select aria-label="选择这份作答对应的题目" onchange="homeworkPrototype.chooseQuestionMapping('${record.studentId}','${record.itemId}','${q.id}',this.value)"><option value="">看原图后选择对应题目</option>${choices.map(target=>`<option value="${target.id}" ${mappingChoice?.studentId===record.studentId&&mappingChoice?.target===target.id?'selected':''}>${escape(target.label)}</option>`).join('')}</select><button class="hp-secondary" onclick="homeworkPrototype.saveQuestionMapping('${record.studentId}','${q.id}')">确认对应，不改变对错</button>`:''}</div>`;}).join('')}${workflowNotice?`<p role="status">${escape(workflowNotice)}</p>`:''}</details>`;
  }
  const workflowActions={
    chooseQuestionMapping(studentId,itemId,id,target){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;const record=submissionsFor(task).find(r=>r.studentId===studentId&&r.itemId===itemId),q=record?.questions.find(q=>q.id===id&&q.mappingConfirmed===false);if(q)mappingChoice={studentId,itemId,id,target,version:record.version||1,signature:grading.gradingSignature(q)};},
    saveQuestionMapping(studentId,id){const task=teacherTaskById(teacherTaskId),choice=mappingChoice;if(!task||!canRelease(task)||!choice||choice.studentId!==studentId||choice.id!==id||!choice.target)return;const record=submissionsFor(task).find(r=>r.studentId===studentId&&r.itemId===choice.itemId),q=record?.questions.find(q=>q.id===id),target=gradeQuestions(task).find(q=>q.id===choice.target&&q.mappingConfirmed!==false);if(!q||!target||(record.version||1)!==choice.version||grading.gradingSignature(q)!==choice.signature||record.questions.some(q=>q.id===target.id)){workflowNotice='题目或提交已变化，请重新核对，不能重复关联同一道题';teacherRefresh();return;}if(workflowCommit(()=>{q.sourceQuestionId=q.id;q.id=target.id;q.label=target.label;q.mappingConfirmed=true;})){mappingChoice=null;workflowNotice='题目对应已确认，个人判定保持不变';}teacherRefresh();},
    prepareWorkflowExperience(){this.prepareConsoleScenario('unreleased');const task=taskById('homework-console-v1');if(!task)return;task.deadline=addDays(formatDate(new Date()),-1);task.submitDeadline=addDays(formatDate(new Date()),6);const records=latestRows(store.submissions.filter(r=>r.taskId===task.id));const child=records.find(r=>r.studentId===guardianId&&r.itemId===task.items[0].id);if(child){const q=child.questions[0];q.correct=false;q.aiCorrect=false;q.aiState='confirmed';q.state='confirmed';delete q.reviewReason;delete q.decisionSource;delete q.explanationInvalidated;q.parentFeedback={status:'pending',version:child.version||1};}const others=records.filter(r=>r.itemId===task.items[0].id&&r.studentId!==guardianId);others.slice(0,2).forEach(r=>grading.holdManualResult(r.questions[0],new Date().toISOString()));if(others[2]){const q=others[2].questions[1];q.id+='-unmatched';q.mappingConfirmed=false;}delete task.answerStandards;syncAnswerWorkflow(task);save();workflowNotice='';this.openTeacher(task.id);},
    clearTeacherReference(id){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;if(workflowCommit(()=>{const s=workflowTask(task).answerStandards?.find(s=>s.questionId===id);if(s){s.teacherAnswer='';s.teacherExplanation='';s.answer='';s.explanation='';s.source='';}})){workflowNotice='参考答案已移除，统计不变';}teacherRefresh();},
    toggleBatchStudent(id){const c=batchContext(id);if(!c)return;if(batchReview.key!==batchKey())batchReview={key:batchKey(),selected:{},choice:''};if(batchReview.selected[id])delete batchReview.selected[id];else batchReview.selected[id]={itemId:c.record.itemId,version:c.record.version||1,signature:grading.gradingSignature(c.q),reviewed:true};batchReview.choice='';workflowNotice='';teacherRefresh();},
    chooseBatch(value){if(value!=='hold'&&Object.values(batchReview.selected).some(row=>!row.reviewed))return;if(['right','wrong','hold'].includes(value)){batchReview.choice=value;teacherRefresh();}},
    holdCurrentScope(){const task=teacherTaskById(teacherTaskId);if(!task||!canRelease(task))return;batchReview={key:batchKey(),selected:{},choice:'hold'};studentRows(task).forEach(row=>{const c=batchContext(row.id);if(!c)return;const match=teacherFilter==='all'||teacherFilter==='pending'&&!grading.isFormalGrade(c.q)||teacherFilter==='correct'&&grading.isFormalGrade(c.q)&&c.q.correct||teacherFilter==='wrong'&&grading.isFormalGrade(c.q)&&!c.q.correct;if(match)batchReview.selected[row.id]={itemId:c.record.itemId,version:c.record.version||1,signature:grading.gradingSignature(c.q),reviewed:false};});workflowNotice='仅暂缓当前班级与筛选范围；判对判错需要逐份核对后勾选。';teacherRefresh();},
    clearBatch(){batchReview={key:'',selected:{},choice:''};workflowNotice='';teacherRefresh();},
    saveBatch(){const selection=Object.entries(batchReview.selected),choice=batchReview.choice;if(!selection.length||batchReview.key!==batchKey()||!['right','wrong','hold'].includes(choice))return;if(choice!=='hold'&&selection.some(([,row])=>!row.reviewed))return;const contexts=selection.map(([id,expected])=>{const c=batchContext(id);return c&&c.record.itemId===expected.itemId&&(c.record.version||1)===expected.version&&grading.gradingSignature(c.q)===expected.signature&&(choice==='hold'||c.src)?c:null;});if(contexts.some(c=>!c)){workflowNotice='部分作答已变化或原图不可用，请取消选择后重新核对；尚未保存任何判定。';teacherRefresh();return;}if(!workflowCommit(()=>contexts.forEach(c=>{const at=new Date().toISOString();c.q.reviewHistory=[...(c.q.reviewHistory||[]),{at,before:c.q.state,after:choice==='hold'?'review':'confirmed',correct:choice==='right',reason:'已对照所选学生原图，批量'+choice,reviewerId:workScope.teacherId}];if(choice==='hold')grading.holdManualResult(c.q,at);else grading.confirmManualResult(c.task,[],c.q,choice==='right',at);if(c.q.parentFeedback)c.q.parentFeedback.status=choice==='hold'?'pending':'resolved';}))){teacherRefresh();return;}batchReview={key:'',selected:{},choice:''};workflowNotice=`已保存 ${selection.length} 人；统计与家长结果已同步`;rememberReview();teacherRefresh();},
    resumeReview(){const task=teacherTaskById(teacherTaskId),context=task&&reviewResumeContext(task);if(!context)return;const p=context.position;this.selectDetailClass(p.classId);this.openGradeQuestion(p.questionId);this.filterGradeStudents(p.filter);if(p.studentId&&typeof document!=='undefined')document.querySelector('[data-student-id="'+p.studentId+'"]')?.scrollIntoView({block:'center'});},
    reportGradeIssue(){const task=taskById(parentTaskId);if(!task||!targetIds(task).includes(guardianId)||!gradeUI.parentOpen)return;const record=latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.studentId===guardianId)).filter(r=>r.questions?.length)[gradeUI.page],q=record?.questions.find(q=>q.id===gradeUI.q);if(!q||q.parentFeedback?.status==='pending')return;workflowCommit(()=>{q.parentFeedback={status:'pending',at:new Date().toISOString(),version:record.version||1};});parentRefresh();},
  };
  function answerWorkflowPanel(task){
    const base=workflowTask(task),standards=base.answerStandards||[];if(!standards.some(s=>s.teacherAnswer||s.source==='custom'&&s.answer))return '';
    const records=submissionsFor(task),editable=canRelease(task),pending=standards.filter(s=>s.status==='pending');
    let html='<details class="hp-card hp-answer-workflow" '+(answerExpanded?'open':'')+'><summary><strong>已保存的逐题参考答案</strong><small> · 不影响批改统计</small></summary><p class="hp-muted">老师提供；首次截止后家长可查看，无需再次开放。</p>';
    html+=standards.map(s=>{const provided=s.source==='custom'?s.answer:s.teacherAnswer,detail=s.source==='custom'?s.explanation:s.teacherExplanation;return '<details class="hp-answer-standard" '+(answerExpanded===s.questionId?'open':'')+'><summary><span>'+escape(s.label)+'</span><b>'+escape(provided||'未提供（选填）')+'</b></summary><small>'+(s.demoTeacherReference?'演示预填的教师答案 · 可修改':provided?'老师提供 · 按本作业题目关联':'选填；未提供也可正常批改')+'</small><p>'+escape(s.stem)+'</p><p>'+escape(detail||'暂无参考解析')+'</p>'+(editable?'<details><summary>修改参考答案</summary><label>答案<textarea aria-label="修订答案" id="answer-value-'+escape(s.questionId)+'">'+escape(provided||'')+'</textarea></label><label>解析<textarea aria-label="修订解析" id="answer-explain-'+escape(s.questionId)+'">'+escape(detail||'')+'</textarea></label><button class="hp-secondary" onclick="homeworkPrototype.approveCustomAnswer(&quot;'+s.questionId+'&quot;)">保存参考答案</button><button class="hp-text-button" onclick="homeworkPrototype.clearTeacherReference(&quot;'+s.questionId+'&quot;)">移除参考答案</button></details>':'')+'</details>';}).join('');
    return html+(answerError?'<p role="status">'+escape(answerError)+'</p>':'')+'</details>';
  }

  function teacherDetail() {
    const task=teacherTaskById(teacherTaskId);if(!task)return teacherList();
    const stat=summary(task);
    return detailClassSelector()+teacherTaskOverview(task,stat)+renderManagement(task)+taskRequirementList(task);
  }
  let questionResultsItem='';
  function teacherQuestionResults(){
    const task=teacherTaskById(teacherTaskId);if(!task)return teacherList();
    const items=task.items.filter(item=>gradingEligible(item.type)&&item.gradingEnabled===true);
    if(!items.length)return teacherDetail();
    if(!items.some(item=>item.id===questionResultsItem))questionResultsItem=items[0].id;
    const scoped={...task,items:items.filter(item=>item.id===questionResultsItem)};
    const stat=summary(scoped);
    const tabs=items.length>1?`<section class="hp-result-item-picker" aria-label="作业提交项"><div class="hp-result-item-label">作业提交项</div><div class="hp-result-item-tabs" role="group" aria-label="按作业提交项切换">${items.map(item=>`<button class="${questionResultsItem===item.id?'active':''}" onclick="homeworkPrototype.filterQuestionResults('${item.id}')" aria-pressed="${questionResultsItem===item.id}">${escape(item.title)}</button>`).join('')}</div></section>`:'';
    const records=submissionsFor(scoped).filter(row=>row.itemId===questionResultsItem);
    const heading=`<div class="hp-item-grade-context"><div class="hp-item-grade-metric"><span>本项已提交</span><strong>${records.length}<small> / ${stat.target} 人</small></strong></div><div class="hp-item-grade-metric"><span class="hp-item-grade-label">题次正确率<details class="hp-item-grade-info"><summary aria-label="查看正确率和错误率统计说明">!</summary><div class="hp-item-grade-popover"><strong>统计口径</strong><p>本项正确率＝判对题次 ÷ 已判定题次${stat.graded?`（${stat.correct} ÷ ${stat.graded}）`:''}。同一学生每道题各计 1 题次。</p><p>下方各题错误率＝该题判错人数 ÷ 该题已判定人数。待复核、识别不清等未判定结果不计入。</p></div></details></span><strong>${stat.correctness===null?'—':stat.correctness+'%'}</strong></div></div><div class="hp-item-grade-note"><p>AI 批改结果仅供参考，请对照原图核对。</p></div>`;
    const statusTags=row=>[['判对',row.correct,'right'],['判错',row.wrong,'wrong'],['待复核',row.review,'needs-review'],['识别不清',row.unreadable,'pending'],['暂无答案',row.noAnswer,'pending'],['等待批改',row.queued,'pending'],['正在批改',row.processing,'pending'],['批改失败',row.failed,'failed'],['未作答',row.unanswered,'pending']].filter(([,count])=>count>0).map(([label,count,tone])=>`<span class="${tone}">${label}${count}</span>`).join('');
    return detailClassSelector()+tabs+heading+unmatchedQuestions(scoped)+resumeReview(scoped)+`<h2 class="hp-section hp-item-grade-section">逐题批改 · 共 ${stat.questionRows.length} 题</h2>`+(stat.questionRows.map((row,index)=>'<section class="hp-card hp-question-card"><button class="hp-question-entry" onclick="homeworkPrototype.openGradeQuestion(&quot;'+row.id+'&quot;)"><span class="hp-line"><strong>'+escape(task.id==='demo-multi-requirements-v2'?'第 '+(index+1)+' 题':row.label.replace(scoped.items[0].title+' · ',''))+'</strong><b>查看学生结果 ›</b></span><span class="hp-question-meta"><small>'+(row.valid?'已判'+row.valid+'/'+records.length+' · 错误率'+row.wrongRate+'%':'暂无已判定')+'</small><span class="hp-question-statuses">'+statusTags(row)+'</span></span></button>'+(row.review&&canRelease(task)?'<div class="hp-review-action"><button class="hp-text-button" onclick="homeworkPrototype.review(&quot;'+task.id+'&quot;,&quot;'+row.id+'&quot;)">开始复核 ›</button></div>':'')+'</section>').join('')||'<section class="hp-card hp-muted">本项暂无批改结果，提交后可在这里查看。</section>');
  }
  const teacherDetailView=teacherDetail;
  function gradeExplanation(q,parent=false) {
    const sections=parent?[['答案',q.answer],['详解',q.explanation]]:[['分析',q.analysis],['答案',q.answer],['详解',q.explanation],['点睛',q.keyPoint],['知识点',q.knowledge]];
    return sections.filter(([,value])=>typeof value==='string'&&value.trim()).map(([title,value],i)=>'<details class="hp-grade-explanation" '+(i<3?'open':'')+'><summary>'+title+'</summary><p>'+escape(value||('暂无'+title))+'</p></details>').join('')+(parent||!q.knowledgeVideoUrl?'':'<details class="hp-grade-explanation"><summary>知识点视频</summary>'+(q.knowledgeVideoUrl&&['https://','http://','blob:','/'].some(prefix=>q.knowledgeVideoUrl.startsWith(prefix))?'<video class="hp-original-video" controls src="'+escape(q.knowledgeVideoUrl)+'"></video>':'<p>暂无知识点视频</p>')+'</details>');
  }
  function referenceForQuestion(task,q,parent=false){const reference=grading.teacherReference(workflowTask(task)||task,q.id,parent,latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.studentId===guardianId)).find(r=>r.questions?.some(row=>row.id===q.id)));if(!reference)return '';if(reference.locked)return '<section class="hp-card hp-muted"><strong>教师参考答案</strong><p>'+escape('本项批改完成后可查看')+'</p></section>';return '<section class="hp-card"><strong>教师参考答案</strong><p>'+escape(reference.answer)+'</p><details><summary>查看参考解析</summary><p>'+escape(reference.explanation||'暂无参考解析')+'</p></details><small>老师提供 · 按本作业题目关联；不影响 AI 批改统计。</small></section>';}
  function parentQuestionOriginal(record,q){
    if(!record)return '<section class="hp-single-original"><header><strong>原题原图</strong></header><p class="hp-single-original-empty">原图暂不可用</p></section>';
    const src=photoPath(record,q),index=record.questions?.findIndex(item=>item.id===q.id)??-1,r=index>=0?learning().questionRegion(q,index,record.mock):null;
    if(!src)return '<section class="hp-single-original"><header><strong>原题原图</strong></header><p class="hp-single-original-empty">原图暂不可用</p></section>';
    const path=escape(src),image=r?'<img src="'+path+'" alt="学生作业中的本题原图" style="width:'+100/r.width+'%;height:'+100/r.height+'%;left:'+(-100*r.x/r.width)+'%;top:'+(-100*r.y/r.height)+'%" onload="this.parentElement.style.aspectRatio=(this.naturalWidth*'+r.width+')/(this.naturalHeight*'+r.height+')">':'<img class="full" src="'+path+'" alt="学生作业原图">';
    return '<section class="hp-single-original"><header><strong>原题原图</strong><a href="'+path+'" target="_blank" rel="noopener">查看整页 ›</a></header><a class="hp-single-original-crop '+(r?'located':'full')+'" href="'+path+'" target="_blank" rel="noopener" aria-label="查看学生作业整页原图">'+image+'</a>'+(record.mock?'<small>演示作业样张'+(r?' · 已定位当前题目':'')+'</small>':'')+'</section>';
  }
  function gradeQuestionCard(q,parent=false,studentId='',record=null) {
    const allowed=!parent||grading.isResultReleased(q),ready=grading.isFormalGrade(q);
    const saved=parent&&record&&readNotebook().some(entry=>entry.key===learning().notebookKey(studentId,parentTaskId,record.itemId,q.id));
    const bookmark=parent&&allowed?'<button class="hp-grade-bookmark" aria-label="'+(saved?'已加入错题本，点击修改错因':'加入错题本')+'" onclick="homeworkPrototype.openMistakeReason()">'+(saved?'✓ 已加入':'＋ 错题本')+'</button>':'';
    const heading=parent?'<span class="hp-line hp-single-heading"><span class="hp-single-title"><strong>'+escape(q.label)+'</strong><em class="hp-single-status '+(q.correct?'correct':'wrong')+'">'+escape(grading.parentGradeLabel(q))+'</em></span>'+bookmark+'</span>':'<span class="hp-line"><strong>'+escape(q.label)+'</strong><em>'+escape(grading.gradeLabel(q))+'</em></span>';
    const explanation=allowed&&ready?(parent&&!grading.canUseAIExplanation(q)?'<p class="hp-grade-locked">判定已更新，解析暂未更新</p>':(parent?'<div class="hp-single-analysis"><div class="hp-ai-notice"><strong>✦ '+(q.decisionSource==='teacher'?'教师已复核':'AI 批改')+'</strong><span>'+(q.decisionSource==='teacher'?'当前判定已由教师复核，答案与解析供学习参考。':'结果仅供参考')+'</span></div>'+gradeExplanation(q,parent)+'</div>':'<p class="hp-muted">本次 AI 答案与解析 · 不代表教师已核对</p>'+gradeExplanation(q,parent))):'<p class="hp-grade-locked">'+escape(parent?grading.parentGradeLabel(q):grading.gradeLabel(q))+'，有可用结果后自动更新。</p>';
    const question=parent?parentQuestionOriginal(record,q)+'<section class="hp-extracted-question"><span>题目文字（批改提取）</span><p class="hp-grade-stem">'+escape(q.stem||'题目文字暂未提取，请查看上方原图。')+'</p></section>':'<p class="hp-grade-stem">'+escape(q.stem||'题目内容暂未返回，请查看提交原图。')+'</p><small>'+escape(q.decisionSource==='teacher'?'教师已复核':'AI 批改')+'</small>';
    return '<section class="hp-card hp-grade-detail'+(parent?' hp-single-question':'')+'">'+heading+question+explanation+'</section>';
  }
  function teacherQuestionPhoto(task,questionId){
    const school=workScope.view==='school';
    if(school)return '';
    const photos=studentRows(task).flatMap(student=>student.records.map(record=>{const index=record.questions?.findIndex(q=>q.id===questionId)??-1;if(index<0)return null;const region=learning().questionRegion(record.questions[index],index,record.mock),src=photoPath(record,record.questions[index]);return src?{student,record,region,src}:null;})).filter(Boolean);
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
    return detailClassSelector()+`<section class="hp-card hp-question-overview">${questionContent}<div class="hp-question-summary"><span>错误率 <b class="hp-grade-wrong">${stat.wrongRate===null?'—':stat.wrongRate+'%'}</b></span><span>已判定 ${stat.valid}/${matching.length} 人</span></div>${filters}${pending?`<details class="hp-question-recognition"><summary>待处理状态明细</summary><small>${pendingParts}</small></details>`:''}</section>`+referenceForQuestion(task,question)+(canRelease(task)?'<button class="hp-text-button" onclick="homeworkPrototype.holdCurrentScope()">暂缓当前列表…</button>':'')+filtered.map(row=>{
      const record=row.records.find(r=>r.questions?.some(q=>q.id===question.id)),src=record&&photoPath(record,row.q),r=record&&learning().questionRegion(row.q,record.questions.indexOf(row.q),record.mock);
      const photo=workScope.view==='school'?'':!src?'<p class="hp-muted">原图暂不可用</p>':r?`<a class="hp-question-photo-crop" href="${escape(src)}" target="_blank" rel="noopener" aria-label="查看${escape(row.name)}的整页原图"><img loading="lazy" alt="${escape(row.name)}的本题作答" src="${escape(src)}" style="width:${100/r.width}%;height:${100/r.height}%;left:${-100*r.x/r.width}%;top:${-100*r.y/r.height}%" onload="this.parentElement.style.aspectRatio=(this.naturalWidth*${r.width})/(this.naturalHeight*${r.height})"></a>`:`<a href="${escape(src)}" target="_blank" rel="noopener"><img class="hp-original" loading="lazy" src="${escape(src)}" alt="${escape(row.name)}的作业原图"></a>`;
      return `<section class="hp-card hp-student-result" data-student-id="${row.id}"><span class="hp-line"><strong>${escape(row.name)}</strong><em>${escape(grading.gradeLabel(row.q))}</em></span><small>${row.q.decisionSource==='teacher'?'教师已复核':'AI 批改'}${record?.mock?' · 演示共用样张':''}</small>${photo}${batchChoice(row)}${row.q.parentFeedback?.status==='pending'?'<p class="hp-feedback-note">家长反馈：这道题可能批错了</p>':''}<details class="hp-student-analysis"><summary>查看这份作答的 AI 答案与解析</summary>${gradeExplanation(row.q)}</details><div class="hp-student-actions"><button class="hp-text-button" onclick="homeworkPrototype.openGradedStudent('${row.id}')">整份作业 ›</button></div>${inlineGradeControls(task,row,question,src)}</section>`;
    }).join('')+(!filtered.length?'<section class="hp-card hp-muted">该状态暂无学生</section>':'')+batchToolbar();
  }
  const learningUI={mode:'result',reasonOpen:false,reason:'知识点不熟',phase:'quick',step:0,answer:'',feedback:'',sheetExpanded:false,sheetHeightRatio:null,sourceOpen:false,solutionOpen:false,returnPhotoTop:0,returnSheetTop:0};
  let resultSheetTouch=null, resultSheetDrag=null, resultSheetIgnoreClickUntil=0;
  function resultSheetBounds(){
    const stage=typeof document==='undefined'?null:document.querySelector('.hp-result-stage'),sheet=stage?.querySelector('.hp-result-sheet'),max=stage?.clientHeight||0;
    const chrome=sheet?['.hp-result-handle','.hp-result-sheet-top','.hp-result-footer'].reduce((sum,selector)=>sum+(sheet.querySelector(selector)?.getBoundingClientRect().height||0),0):138;
    return {max,min:Math.min(Math.ceil(chrome),max)};
  }
  function setResultSheetHeight(height){
    const {min,max}=resultSheetBounds();if(!max)return;
    let value=Math.max(min,Math.min(max,height));if(value>max-4)value=max;
    learningUI.sheetHeightRatio=value/max;learningUI.sheetExpanded=value>min+8;
    const sheet=document.querySelector('.hp-result-sheet');
    if(sheet){sheet.style.height=(learningUI.sheetHeightRatio*100)+'%';sheet.classList.toggle('is-full',value>=max-1);sheet.classList.toggle('is-minimized',value<=min+8);const body=sheet.querySelector('.hp-result-sheet-body');if(body){body.inert=value<=min+8;body.setAttribute('aria-hidden',String(value<=min+8));}sheet.querySelector('.hp-result-handle')?.setAttribute('aria-valuenow',String(Math.round(value/max*100)));sheet.querySelector('.hp-result-handle')?.setAttribute('aria-valuemin',String(Math.round(min/max*100)));}
    return value;
  }
  if(typeof document!=='undefined'&&document.addEventListener){
    document.addEventListener('pointermove',event=>window.homeworkPrototype?.resultSheetPointerMove(event),{passive:false});
    document.addEventListener('pointerup',event=>window.homeworkPrototype?.resultSheetPointerEnd(event));
    document.addEventListener('pointercancel',event=>window.homeworkPrototype?.resultSheetPointerEnd(event));
  }
  const focusResultPhotoSoon=()=>{if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>window.homeworkPrototype?.focusResultPhoto());};
  const learning=()=>window.homeworkLearning;
  function readNotebook(){try{const entries=JSON.parse(previewStorage.getItem(learning().NOTEBOOK_KEY)||'[]');return Array.isArray(entries)?entries:[];}catch{return [];}}
  function parentQuestionContext(){const task=taskById(parentTaskId);if(!gradeUI.parentOpen||!task||!targetIds(task).includes(guardianId))return null;const records=latestRows(store.submissions.filter(row=>row.taskId===task.id&&row.studentId===guardianId)).filter(row=>row.questions?.length),record=records[gradeUI.page],q=record?.questions.find(question=>question.id===gradeUI.q);return q&&grading.isResultReleased(q)&&(learningUI.mode!=='tutor'||grading.canUseAIExplanation(q))?{task,record,q,studentId:guardianId}:null;}
  function parentTutorContext(){const context=parentQuestionContext();return context&&grading.canUseAIExplanation(context.q)?context:null;}
  function gradePaper(record,selected,parent){const src=photoPath(record,selected);if(!src)return '<p class="hp-muted">原图暂不可用，仍可从下方题目入口查看结果。</p>';const regions=record.questions.map((q,i)=>({q,region:learning().questionRegion(q,i,record.mock)})).filter(item=>item.region&&(!record.photos||(item.q.pageIndex||0)===(selected?.pageIndex||0)));return (record.mock?'<small>共用作业样张 · 班级统计为模拟数据</small>':'')+'<div class="hp-marked-paper"><img src="'+escape(src)+'" alt="学生作业原图">'+regions.map(({q,region:r})=>{const mark=learning().questionMark(q,parent);return '<button class="hp-paper-region '+mark.tone+(q.id===selected?.id?' selected':'')+'" aria-label="'+escape(q.label+'，'+mark.label+'，查看题目')+'" style="left:'+r.x*100+'%;top:'+r.y*100+'%;width:'+r.width*100+'%;height:'+r.height*100+'%" onclick="homeworkPrototype.selectGradeQuestion(&quot;'+q.id+'&quot;,'+parent+')"><span>'+escape(mark.mark)+'</span></button>';}).join('')+'</div><small>✓ 答对　× 答错　? 待复核或存疑；点击题框查看单题。</small>'+(!regions.length?'<p class="hp-muted">题目区域暂未定位，可通过下方题目入口查看。</p>':'')+'<a class="hp-text-button" href="'+escape(src)+'" target="_blank" rel="noopener">查看原图</a>';}
  function parentInlineGrade(record,src){
    const questions=record.questions||[],progress=grading.gradingProgress(questions,true),released=questions.filter(grading.isResultReleased);
    const regions=released.map((q,i)=>({q,region:learning().questionRegion(q,questions.indexOf(q),record.mock)})).filter(item=>item.region);
    const paper='<div class="hp-inline-paper"><img src="'+escape(src)+'" alt="已提交的作业照片，批改结果标注在原图上">'+regions.map(({q,region:r})=>{const mark=learning().questionMark(q,true);return '<button class="hp-paper-region '+mark.tone+'" aria-label="'+escape(q.label+'，'+mark.label+'，查看单题')+'" style="left:'+r.x*100+'%;top:'+r.y*100+'%;width:'+r.width*100+'%;height:'+r.height*100+'%" onclick="homeworkPrototype.openParentQuestion(&quot;'+record.itemId+'&quot;,&quot;'+q.id+'&quot;)"><span>'+escape(mark.mark)+'</span></button>';}).join('')+'</div>';
    if(!questions.length)return '<button class="hp-paper-preview" onclick="homeworkPrototype.openPaper(this)">'+paper+'<span>点击放大查看</span></button>';
    const state=released.length?(progress.unavailable?'部分题目已批改，其他题目待处理':''):progress.title+(progress.pending?' · 可离开页面稍后查看':'');
    const unlocated=released.filter(q=>!regions.some(item=>item.q.id===q.id));
    const fallback=unlocated.length?'<div class="hp-inline-question-links">'+unlocated.map(q=>'<button onclick="homeworkPrototype.openParentQuestion(&quot;'+record.itemId+'&quot;,&quot;'+q.id+'&quot;)">'+escape(q.label+' · '+grading.parentGradeLabel(q))+'</button>').join('')+'</div>':'';
    return (state?'<div class="hp-inline-grade-status '+(released.length?'ready':'waiting')+'">'+state+'</div>':'')+paper+fallback+(released.length?'<small class="hp-inline-grade-hint">✓ 答对　× 答错 · 点击题框查看单题</small>':'');
  }
  function parentQuestionActions(q){if(!grading.isResultReleased(q))return '';return '<div class="hp-single-cta"><button class="hp-primary" '+(!grading.canUseAIExplanation(q)?'disabled':'')+' onclick="homeworkPrototype.openHomeworkTutor()">'+(grading.canUseAIExplanation(q)?'AI 解题':'解析更新后可解题')+'</button></div>';}
  function parentResultSheet(task,records,record,q){
    const released=records.flatMap(row=>(row.questions||[]).filter(grading.isResultReleased).map(question=>({row,question}))),ready=grading.isFormalGrade(q)&&grading.canUseAIExplanation(q),src=photoPath(record,q),index=record.questions.indexOf(q);
    const progress=grading.gradingProgress(records.flatMap(row=>row.questions),true);
    const paper=(!grading.isResultReleased(q)&&(progress.pending||progress.failed)?'<div class="hp-result-alert">'+escape(progress.title)+'</div>':'')+(src?'<div class="hp-result-paper"><img src="'+escape(src)+'" alt="学生作业原图">'+record.questions.map((question,i)=>{const r=learning().questionRegion(question,i,record.mock);if(!r||!grading.isResultReleased(question)||record.photos&&(question.pageIndex||0)!==(q.pageIndex||0))return '';const mark=learning().questionMark(question,true);return '<button class="hp-paper-region '+mark.tone+(question.id===q.id?' selected':'')+'" style="left:'+r.x*100+'%;top:'+r.y*100+'%;width:'+r.width*100+'%;height:'+r.height*100+'%" aria-label="'+escape(question.label+'，'+mark.label)+'" onclick="homeworkPrototype.openParentQuestion(&quot;'+record.itemId+'&quot;,&quot;'+question.id+'&quot;)"><span>'+escape(mark.mark)+'</span></button>';}).join('')+'</div>':'<p class="hp-muted">原图暂不可用，请查看下方提取的题目。</p>');
    const title=question=>question.label.match(/第\s*[^题]+题/)?.[0].replace(/\s/g,'')||question.label;
    const nav='<div class="hp-result-question-nav" aria-label="切换题目">'+released.map(({row,question})=>{const mark=learning().questionMark(question,true);return '<button class="'+(question.id===q.id?'active':'')+'" aria-label="'+escape(title(question)+'，'+grading.parentGradeLabel(question))+'" aria-current="'+(question.id===q.id)+'" onclick="homeworkPrototype.openParentQuestion(&quot;'+row.itemId+'&quot;,&quot;'+question.id+'&quot;)"><span>'+escape(title(question))+'</span><i class="grade-'+mark.tone+'" aria-hidden="true">'+escape(mark.mark)+'</i></button>';}).join('')+'</div>';
    const source={accountId:window.parentPrototype?.getTutorAccount?.()||'guardian-demo-001',studentId:guardianId,taskId:task.id,itemId:record.itemId,submissionVersion:record.version||1,question:q};
    let previous;try{if(window.homeworkTutor)previous=JSON.parse(previewStorage.getItem(window.homeworkTutor.TUTOR_STORAGE_KEY)||'{}')[window.homeworkTutor.tutorKey(source)];}catch{}
    const completed=Boolean(window.homeworkTutor&&previous?.fingerprint===window.homeworkTutor.tutorFingerprint(source)&&previous.phase==='done'),resumed=Boolean(window.homeworkTutor&&previous?.fingerprint===window.homeworkTutor.tutorFingerprint(source)&&previous.phase!=='done');
    const tutorButton='<button class="hp-primary" '+(!ready?'disabled':'')+(ready?' onclick="homeworkPrototype.openHomeworkTutor()"':'')+'>'+(!ready?'解析更新后可解题':'AI 解题')+'</button>';
    const history='';
    const detail='<div class="hp-result-detail"><header class="hp-result-answer-heading"><span>参考答案</span><button class="hp-result-show-original" onclick="homeworkPrototype.showResultOriginal()">查看原图 ⌄</button></header>'+(ready?'<div class="hp-result-answer">'+escape(q.answer||'暂无答案')+'</div>'+(q.decisionSource==='teacher'?'<small>教师已复核</small>':'')+'<section class="hp-result-reading"><h3>解析</h3><p class="hp-result-solution">'+escape(q.explanation||'暂无详解')+'</p></section>'+referenceForQuestion(task,q,true):'<p class="hp-grade-locked">'+(grading.isFormalGrade(q)?'判定已更新，解析暂未更新':escape(grading.parentGradeLabel(q))+'，答案与解析暂不可查看。')+'</p>')+history+'</div>';
    const ratio=learningUI.sheetHeightRatio??.55,minimized=learningUI.sheetHeightRatio!==null&&!learningUI.sheetExpanded;
    return '<div class="hp-result-stage"><div class="hp-result-photo">'+paper+'</div><section class="hp-result-sheet'+(ratio>=.999?' is-full':'')+(minimized?' is-minimized':'')+'" style="height:'+ratio*100+'%" aria-label="本题批改结果"><div class="hp-result-handle" role="slider" tabindex="0" aria-label="拖动调整解析高度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.round(ratio*100)+'" onkeydown="homeworkPrototype.resultSheetKey(event)" onclick="homeworkPrototype.toggleResultSheet()" onpointerdown="homeworkPrototype.resultSheetPointerStart(event)"><i></i></div><div class="hp-result-sheet-top" onpointerdown="homeworkPrototype.resultSheetPointerStart(event)">'+nav+'</div><div class="hp-result-sheet-body" '+(minimized?'inert aria-hidden="true"':'')+'>'+detail+'</div><footer class="hp-result-footer">'+tutorButton+'</footer></section>'+renderMistakeReason()+'</div>';
  }
  function renderLearningPanel(context){const {q}=context;if(learningUI.mode==='tutor'&&!grading.canUseAIExplanation(q)){learningUI.mode='result';return '<p class="hp-muted">判定已更新，解析暂未更新</p>';}if(learningUI.mode==='notebook'){const entries=readNotebook().filter(entry=>entry.studentId===guardianId);return '<button class="hp-text-button" onclick="homeworkPrototype.closeHomeworkLearning()">‹ 返回批改结果</button><h2>孩子的错题本</h2>'+(entries.length?'':'<section class="hp-card hp-muted">暂无错题，平板端收集的错题可前往平板查看。</section>')+entries.slice().reverse().map(entry=>'<section class="hp-card"><strong>'+escape(entry.question.label)+'</strong><p>'+escape(entry.question.stem||'题目原图已随作业保存')+'</p><small>错因：'+escape(entry.reason)+' · 第 '+entry.version+' 版</small></section>').join('');}
    return window.homeworkTutorUI?.html() || '<p>讲题模块未加载，请刷新重试。</p>'; }
  function renderMistakeReason(){if(!learningUI.reasonOpen)return '';return '<div class="hp-filter-mask" onclick="homeworkPrototype.closeMistakeReason()"><section class="hp-filter-sheet" role="dialog" aria-modal="true" aria-label="标记错因" onclick="event.stopPropagation()"><header><h2>加入错题本 · 标记错因</h2><button onclick="homeworkPrototype.closeMistakeReason()">×</button></header><div class="hp-filter-grid">'+learning().MISTAKE_REASONS.map(reason=>'<button class="'+(learningUI.reason===reason?'active':'')+'" onclick="homeworkPrototype.chooseMistakeReason(&quot;'+reason+'&quot;)">'+reason+'</button>').join('')+'</div><p>记录到当前孩子的错题本，重复加入会更新错因。</p><button class="hp-primary" onclick="homeworkPrototype.saveHomeworkMistake()">确认加入</button><p role="status">'+escape(learningUI.feedback)+'</p></section></div>';}
  function wholeGrade(task,studentId,studentName,parent=false) {
    const records=(parent?latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.studentId===studentId)):submissionsFor(task).filter(r=>r.studentId===studentId)).filter(r=>(r.questions||[]).length);
    const qs=records.flatMap(r=>r.questions),progress=grading.gradingProgress(qs,parent);
    if(!records.length)return '<section class="hp-card hp-muted">暂无可查看的作业批改结果</section>';
    gradeUI.page=Math.max(0,Math.min(gradeUI.page,records.length-1));
    const record=records[gradeUI.page];
    const candidates=record.questions.filter(q=>(!parent||grading.isResultReleased(q))&&(!gradeUI.wrongOnly||(q.state==='confirmed'&&!q.correct&&(!parent||grading.isResultReleased(q)))));
    const selected=candidates.find(q=>q.id===gradeUI.q)||candidates[0];
    if(parent&&selected)gradeUI.q=selected.id;
    const context=parent&&parentQuestionContext();
    if(parent&&learningUI.mode!=='result'){if(context)return renderLearningPanel(context);learningUI.mode='result';}
    if(parent)return selected?parentResultSheet(task,records,record,selected):gradeStatus(task,records,true)+'<section class="hp-card hp-muted">当前没有已开放的单题结果</section>';
    return '<div class="hp-grade-context"><small>'+escape(task.title)+'</small><h2>'+escape(studentName)+'的批改结果</h2></div>'+gradeStatus(task,records,parent)+'<div class="hp-grade-overview"><div><strong>'+progress.total+'</strong><span>总题数</span></div><div><strong>'+progress.correct+'</strong><span>答对</span></div><div><strong class="hp-grade-wrong">'+progress.wrong+'</strong><span>答错</span></div><div><strong>'+progress.unavailable+'</strong><span>'+('待处理')+'</span></div></div><h2 class="hp-section">整份作业 <small>共 '+records.length+' 页提交</small></h2>'+(records.length>1?'<div class="hp-grade-pages">'+records.map((r,i)=>'<button class="'+(i===gradeUI.page?'active':'')+'" onclick="homeworkPrototype.gradePage('+i+','+parent+')">第 '+(i+1)+' 页</button>').join('')+'</div>':'')+(parent||workScope.view!=='school'?'<section class="hp-card hp-grade-paper"><strong>'+escape(task.items.find(i=>i.id===record.itemId)?.title||'作业原图')+'</strong>'+gradePaper(record,selected,parent)+'</section>':'<p class="hp-muted">校级只读视角仅展示逐题结果。</p>')+'<h2 class="hp-section">逐题查看 <button class="hp-text-button" onclick="homeworkPrototype.toggleGradeWrong('+parent+')">'+(gradeUI.wrongOnly?'显示全部':'只看错题')+'</button></h2><div class="hp-chips">'+candidates.map(q=>'<button class="'+(q.id===selected?.id?'active':'')+'" onclick="homeworkPrototype.selectGradeQuestion(&quot;'+q.id+'&quot;,'+parent+')">'+escape(q.label)+' · '+escape(parent?grading.parentGradeLabel(q):grading.gradeLabel(q))+'</button>').join('')+'</div><div id="hp-grade-selected">'+(selected?(parent?parentQuestionActions(selected,record,studentId):'')+gradeQuestionCard(selected,parent)+referenceForQuestion(task,selected,parent)+(parent?parentFeedback(selected):''):'<section class="hp-card hp-muted">当前页暂无可查看的错题</section>')+'</div>'+(parent?renderMistakeReason():'');
  }
  function gradeReviewContext(){const d=gradeReviewDraft,task=d&&teacherTaskById(d.taskId);if(!d||!task||!canRelease(task))return null;const record=submissionsFor(task).find(r=>r.studentId===d.studentId&&r.itemId===d.itemId&&(r.version||1)===d.version),q=record?.questions.find(q=>q.id===d.questionId);return q&&grading.gradingSignature(q)===d.signature?{task,record,q}:null;}
  function renderGradeReviewDialog(){
    const d=gradeReviewDraft;if(!d||d.inline)return '';const c=gradeReviewContext();
    if(!c)return '<div class="hp-source-mask"><section class="hp-grade-dialog" role="dialog" aria-modal="true" aria-label="复核状态已更新"><h2>作答或权限已更新</h2><p>请关闭后重新进入，核对最新提交。</p><button class="hp-secondary" onclick="homeworkPrototype.closeGradeReview()">关闭</button></section></div>';
    const {record,q,task}=c,student=students.find(s=>s.id===record.studentId),index=record.questions.indexOf(q),r=learning().questionRegion(q,index,record.mock),src=photoPath(record,q);
    const pending=submissionsFor(task).filter(row=>row.questions?.some(v=>v.id===q.id&&['review','confirmed','unreadable','no-answer'].includes(v.state)));
    const photo=!src?'<p class="hp-muted">原图暂不可用，请保留待复核后稍后处理。</p>':r?'<a class="hp-question-photo-crop" href="'+escape(src)+'" target="_blank" rel="noopener" aria-label="查看此学生整页原图"><img alt="当前复核学生的题目原图" src="'+escape(src)+'" style="width:'+100/r.width+'%;height:'+100/r.height+'%;left:'+(-100*r.x/r.width)+'%;top:'+(-100*r.y/r.height)+'%" onload="this.parentElement.style.aspectRatio=(this.naturalWidth*'+r.width+')/(this.naturalHeight*'+r.height+')"></a>':'<img class="hp-original" src="'+escape(src)+'" alt="当前复核学生的作业原图">';
    return '<div class="hp-source-mask"><section class="hp-grade-dialog hp-review-dialog" role="dialog" aria-modal="true" aria-label="对照原图复核"><header class="hp-review-heading"><div><h2>对照原图复核</h2><small>'+escape(q.label)+' · 仅处理当前学生</small></div><button aria-label="关闭复核" onclick="homeworkPrototype.closeGradeReview()">×</button></header><div class="hp-review-scroll"><label class="hp-review-student">当前学生<select aria-label="选择学生" onchange="homeworkPrototype.review(&quot;'+task.id+'&quot;,&quot;'+q.id+'&quot;,undefined,this.value)">'+pending.map(row=>{const stu=students.find(v=>v.id===row.studentId);return '<option value="'+row.studentId+'" '+(row.studentId===record.studentId?'selected':'')+'>'+escape(stu?.name||row.studentId)+' · '+escape(classes.find(v=>v.id===stu?.classId)?.name||'')+'</option>';}).join('')+'</select></label>'+photo+(record.mock?'<small>共用作业样张 · 仅用于演示，学生之间的判定为模拟数据</small>':'')+'<div class="hp-review-ai"><div><strong>AI 原始判定</strong><p>'+ (typeof q.aiCorrect==='boolean'?(q.aiCorrect?'✓ 答对':'× 答错'):!q.aiUnavailable&&!q.reviewReason&&q.decisionSource!=='teacher'?(q.correct?'✓ 答对':'× 答错'):'原判未留存')+'</p><small>AI 参考答案：'+escape(q.aiAnswer||(!q.reviewReason?q.answer:'未留存'))+'</small></div><div><strong>教师参考答案</strong><p>'+escape((()=>{const r=workflowTask(task).answerStandards?.find(v=>v.questionId===q.id);return r?.source==='custom'?r.answer:r?.teacherAnswer||'暂无教师参考';})())+'</p><small>v'+(q.answerVersion||1)+' · 请根据上方原图判断</small></div></div><details class="hp-review-explanation"><summary>查看解析与复核说明</summary><p>'+escape(q.explanation||q.analysis||'暂无解析')+'</p><label class="hp-field">复核说明<textarea aria-label="改判原因" oninput="homeworkPrototype.setGradeReviewReason(this.value)">'+escape(d.reason)+'</textarea></label></details>'+(d.error?'<p class="hp-grade-wrong" role="alert">'+escape(d.error)+'</p>':'')+'</div><footer class="hp-review-footer"><div class="hp-review-decisions"><button '+(!src?'disabled':'')+' class="'+(d.correct===true?'selected':'')+'" onclick="homeworkPrototype.setGradeReviewDecision(true)">✓ 判对</button><button '+(!src?'disabled':'')+' class="'+(d.correct===false?'selected wrong':'')+'" onclick="homeworkPrototype.setGradeReviewDecision(false)">× 判错</button><button onclick="homeworkPrototype.holdGradeReview()">暂缓本题</button></div><div class="hp-review-save"><button class="hp-secondary" onclick="homeworkPrototype.confirmGradeReview()">保存返回</button><button class="hp-primary" onclick="homeworkPrototype.confirmGradeReview(true)">'+(pending.some(row=>row.studentId!==record.studentId&&row.questions.some(v=>v.id===q.id&&v.state==='review'))?'保存并下一位':'保存并完成')+'</button></div><small>保存即更新统计和家长结果。</small></footer></section></div>';
  }
  function gradeReleaseDialog(task) {
    if(!gradeReleaseOpen)return '';
    return '<div class="hp-source-mask"><section class="hp-grade-dialog" role="dialog" aria-modal="true" aria-label="确认开放批改结果"><h2>核对统计并开放</h2><p>当前有效判定 '+summary(task).graded+' 题次，待复核 '+summary(task).review+' 题次。待复核不算对错，也不开放旧判定。</p><p>开放范围：'+escape(task.classIds.map(id=>classes.find(c=>c.id===id)?.name||id).join('、'))+'。仅向这些班级对应家长开放已确认的结果、答案与解析；其他班级保持原状态，待处理和待复核题目继续保留。</p><button class="hp-primary" onclick="homeworkPrototype.confirmGradeRelease()">确认开放</button><button class="hp-secondary" onclick="homeworkPrototype.closeGradeRelease()">暂不开放</button></section></div>';
  }
  let rosterTouch = null;
  const rosterTabs = [{id:'all',label:'全部'},{id:'completed',label:'已交齐'},{id:'partial',label:'未交齐'},{id:'unsubmitted',label:'未提交'}];
  const rosterMatches = (row,filter) => filter==='all'||filter==='completed'&&row.status==='completed'||filter==='missing'&&row.status!=='completed'||filter==='unsubmitted'&&row.status==='missing'||filter==='partial'&&row.status==='partial';
  function currentStudentRows() {
    const task=teacherTaskById(teacherTaskId);if(!task)return [];
    const scoped=rosterItemId?{...task,items:task.items.filter(item=>item.id===rosterItemId)}:task;
    return studentRows(scoped).filter(row=>questionBrowseIds?.taskId===task.id&&teacherMode==='student'?questionBrowseIds.ids.includes(row.id):teacherFilter==='wrong'?row.wrong.length:teacherFilter==='questionWrong'?row.wrong.some(q=>q.id===teacherQuestionId):rosterMatches(row,teacherFilter));
  }
  function studentBrowseRows() {
    const rows=currentStudentRows(),current=rows.find(row=>row.id===teacherStudentId);
    return current?rows.filter(row=>row.classId===current.classId):[];
  }
  let studentPhotoTouch=null;
  function studentPhotoPages(itemId) {
    const task=teacherTaskById(teacherTaskId);if(!task||workScope.view==='school')return [];
    const items=rosterItemId?task.items.filter(item=>item.id===rosterItemId):task.items;
    return studentBrowseRows().flatMap(row=>items.flatMap(item=>{
      if(!['photo','video'].includes(item.type))return [];
      const record=row.records.find(record=>record.itemId===item.id);if(!record)return [];
      const originals=record.photos?.length?record.photos.map(photo=>resolvePhoto(photo)):[mediaFor(record)||(record.mock&&item.type==='photo'?mockPhoto(record,row.name):'')];
      const images=item.type==='photo'?grading.submissionImagePages(record,originals,submissionViews.get(submissionViewKey(record,'teacher'))===true):originals.map((path,page)=>({path,originalPath:path,gradedPath:'',showOriginal:true,page}));
      return images.flatMap((image,page)=>image.path?[{...image,src:image.path,alt:row.name+'的'+item.title+'第 '+(page+1)+' 张',studentId:row.id,itemId:item.id,type:item.type,page,title:row.name+' · '+item.title+' · '+(page+1)+' / '+images.length}]:[]);
    }));
  }
  function teacherStudents() {
    const task = teacherTaskById(teacherTaskId);
    if (!task) return teacherList();
    const special=teacherFilter==='wrong'||teacherFilter==='questionWrong';
    const all=studentRows(rosterItemId?{...task,items:task.items.filter(item=>item.id===rosterItemId)}:task),rows=all.filter(row=>special?(teacherFilter==='wrong'?row.wrong.length:row.wrong.some(q=>q.id===teacherQuestionId)):rosterMatches(row,teacherFilter));
    const tabs=special?'':`<div class="hp-roster-tabs" role="tablist" aria-label="提交情况">${rosterTabs.map(tab=>`<button role="tab" aria-selected="${teacherFilter===tab.id}" class="${teacherFilter===tab.id?'active':''}" onclick="homeworkPrototype.rosterSelect('${tab.id}')">${tab.label}<span>${all.filter(row=>rosterMatches(row,tab.id)).length}</span></button>`).join('')}</div>`;
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToStats()">‹ 返回统计</button><h1>学生名单</h1></div>${tabs}<div class="hp-roster-panel" onpointerdown="homeworkPrototype.rosterSwipeStart(event)" onpointerup="homeworkPrototype.rosterSwipeEnd(event)" onpointercancel="homeworkPrototype.rosterSwipeCancel()"><p class="hp-roster-caption">${rosterItemId?escape(task.items.find(item=>item.id===rosterItemId)?.title||'')+' · ':''}${rows.length} 名学生${teacherFilter==='missing'?' · 含未提交学生':''}${special?' · 答错学生':''}</p>${rows.length?rows.map(row=>`<button class="hp-card hp-task hp-roster-card" onclick="homeworkPrototype.openStudent('${row.id}')"><span class="hp-line"><strong>${escape(row.name)}</strong><em>${row.status==='completed'?'已交齐':row.status==='missing'?'未提交':'未交齐'}</em></span><small>${escape(classes.find(item=>item.id===row.classId)?.name||'')}${row.wrong.length?' · 答错 '+row.wrong.length+' 题':''}${row.latest?' · 最近提交 '+escape(row.latest):''}</small>${row.missingItems.length?'<div class="hp-missing-items"><strong>还缺 '+row.missingItems.length+' 项</strong>'+row.missingItems.map(item=>'<span>· '+escape(item.title)+' <small>'+escape(typeLabel(item.type))+'</small></span>').join('')+'</div>':''}<span class="hp-line hp-task-bottom hp-roster-actions"><span class="hp-roster-link">查看提交 ›</span></span></button>`).join(''):'<section class="hp-card hp-muted">暂无这类学生</section>'}</div>`;
  }
  const mockPhoto = (row, studentName) => {
    if(/^(?:grading|console)-page-[12]$/.test(row.itemId))return samplePhoto(row);
    const firstAnswer = escape(row.questions?.[0]?.studentAnswer || '未识别'), secondAnswer = escape(row.questions?.[1]?.studentAnswer || '未识别');
    const safeName = escape(studentName);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="760" viewBox="0 0 600 760"><rect width="600" height="760" fill="#dee8e9"/><rect x="38" y="28" width="524" height="704" rx="10" fill="#fffefa" stroke="#cad6d2"/><text x="70" y="92" font-family="sans-serif" font-size="26" fill="#36485a">数学练习 · 演示样张</text><text x="70" y="133" font-family="sans-serif" font-size="19" fill="#6f8391">姓名：${safeName}</text><path d="M70 155H530M70 355H530M70 555H530" stroke="#d4dfe5"/><text x="74" y="215" font-family="sans-serif" font-size="24" fill="#32475d">1. 分数计算</text><text x="100" y="275" font-family="sans-serif" font-size="31" fill="#405c79">${firstAnswer}</text><text x="74" y="415" font-family="sans-serif" font-size="24" fill="#32475d">2. 应用题</text><text x="100" y="475" font-family="sans-serif" font-size="31" fill="#405c79">${secondAnswer}</text><text x="70" y="651" font-family="sans-serif" font-size="20" fill="#c96f6f">仅用于原型演示，非真实学生作业</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };
  const submissionTime=value=>value?String(value).slice(String(value).startsWith(String(new Date().getFullYear()))?5:0,16):'时间未记录';
  function studentSubmissionHistory(task,item,studentId) {
    const records=store.submissions.filter(record=>record.taskId===task.id&&record.itemId===item.id&&record.studentId===studentId).sort((a,b)=>(b.version||1)-(a.version||1));
    if(records.length<2)return '';
    return '<details class="hp-submission-history"><summary>提交记录 · '+records.length+' 次</summary>'+records.map(record=>{const name=record.operatorName||String(record.submittedBy||'').split(' · ').at(-1);return '<div><strong>第 '+(record.version||1)+' 次提交</strong><small>'+escape(record.submittedAt||'时间未记录')+'</small><small>提交人：'+escape(name&&!/^(guardian-|user-)/.test(name)?name:'未记录')+'</small></div>';}).join('')+'</details>';
  }
  const submissionViews=new Map();
  const submissionViewKey=(record,role)=>[role,record.taskId,record.studentId,record.itemId,record.version||1].join(':');
  function recordImagePages(record,role){const originals=record.photos?.length?record.photos.map(photo=>resolvePhoto(photo)):[mediaFor(record)||(record.mock?mockPhoto(record,'学生'):'')];return grading.submissionImagePages(record,originals,submissionViews.get(submissionViewKey(record,role))===true);}
  function submissionState(task,item,record,pending=false){return grading.homeworkItemDisplayStatus({submitted:Boolean(record),pending,gradingEnabled:task.kind==='homework'&&gradingEligible(item.type)&&item.gradingEnabled!==false,questions:record?.questions,gradingError:record?.gradingError,gradingComplete:grading.submissionGradingComplete(record)});}
  function recordMetrics(records){const progress=grading.gradingProgress(records.flatMap(record=>record.questions||[]));return progress.total?'<div class="hp-record-metrics" aria-label="当前学生当前作业批改统计">'+[[progress.total,'总题数'],[progress.correct,'答对'],[progress.wrong,'答错'],[progress.unavailable,'待处理']].map(([n,label])=>'<div><strong>'+n+'</strong><small>'+label+'</small></div>').join('')+'</div>':'';}
  function recordOverview(task,records,person=''){return '<section class="hp-record-overview"><div class="hp-record-overview-title"><strong>'+escape(task.title)+'</strong><em>'+escape(task.subject||'综合')+'</em></div>'+person+recordMetrics(records)+'</section>';}
  function recordPhotoView(record,role,item){const pages=recordImagePages(record,role),hasGraded=pages.some(page=>page.gradedPath),original=submissionViews.get(submissionViewKey(record,role))===true;return '<div class="hp-record-photo-tools"><span>共 '+pages.length+' 张</span>'+(hasGraded?'<div class="hp-record-image-tabs" role="group" aria-label="照片视图">'+[['graded','批改图',!original],['original','原图',original]].map(([view,label,active])=>'<button aria-pressed="'+active+'" class="'+(active?'active':'')+'" onclick="homeworkPrototype.switchSubmissionImage(&quot;'+role+'&quot;,&quot;'+item.id+'&quot;,&quot;'+view+'&quot;)">'+label+'</button>').join('')+'</div>':'')+'</div>'+pages.map((page,index)=>'<button class="hp-paper-preview hp-record-photo" data-item-id="'+escape(item.id)+'" data-page="'+index+'" onclick="homeworkPrototype.openPaper(this)"><img class="hp-original" src="'+escape(page.path)+'" alt="'+(page.showOriginal?'提交原图':'批改图')+' '+(index+1)+'" onerror="homeworkPrototype.submissionImageError(this,&quot;'+role+'&quot;,&quot;'+item.id+'&quot;,'+index+')"><span class="hp-record-image-footer">'+(index+1)+' / '+pages.length+' · 点击放大查看</span></button>'+(hasGraded&&!original&&!page.gradedPath?'<small class="hp-muted">此照片暂无批改图，显示原图</small>':'')).join('')+(!hasGraded&&(grading.submissionGradingComplete(record)===true||record.questions?.length&&record.questions.every(grading.isResultReleased))?'<small class="hp-record-image-notice">暂无可展示的批改图，当前为原图</small>':'');}
  function teacherStudent() {
    const task = teacherTaskById(teacherTaskId);
    const scopedTask = task && rosterItemId ? {...task, items: task.items.filter(item => item.id === rosterItemId)} : task;
    const row = scopedTask && studentRows(scopedTask).find(item => item.id === teacherStudentId);
    if (!task || !row) return teacherStudents();
    const browse=studentBrowseRows(),position=browse.findIndex(student=>student.id===row.id);
    return `<div class="hp-student-browse" onpointerdown="homeworkPrototype.studentPhotoSwipeStart(event)" onpointerup="homeworkPrototype.studentPhotoSwipeEnd(event)" onpointercancel="homeworkPrototype.studentPhotoSwipeCancel()"><nav class="hp-student-switch" aria-label="切换学生"><button aria-label="上一位学生" ${position<=0?'disabled':''} onclick="homeworkPrototype.changeStudent(-1)"><span class="hp-student-chevron is-previous" aria-hidden="true"></span></button><div class="hp-student-identity"><strong>${escape(classes.find(item=>item.id===students.find(student=>student.id===row.id)?.classId)?.name||'班级未记录')}</strong><span>第 ${position+1} 位 / 共 ${browse.length} 位</span></div><button aria-label="下一位学生" ${position>=browse.length-1?'disabled':''} onclick="homeworkPrototype.changeStudent(1)"><span class="hp-student-chevron" aria-hidden="true"></span></button></nav>${recordOverview(task,studentRows(task).find(student=>student.id===row.id)?.records||[])}${scopedTask.items.map(item => { const index = task.items.indexOf(item);
      const record = row.records.find(value => value.itemId === item.id);const displayStatus=submissionState(task,item,record);
      if (!record) return `<section class="hp-card hp-student-submission"><div class="hp-record-heading"><div class="hp-record-title"><b>${String(index+1).padStart(2,'0')}</b><strong>${escape(item.title)}</strong></div><div class="hp-record-badges"><span class="hp-record-state is-missing">未提交</span><span class="hp-record-type">${types[item.type]}</span></div></div></section>`;
      if(record.fileRef){resolvePhoto(record.fileRef);record.media=record.fileRef.path;}
      const media = mediaFor(record) || (record.mock && item.type === 'photo' ? mockPhoto(record, row.name) : '');
      const mediaView = workScope.view === 'school' ? '' : item.type==='photo'?recordPhotoView(record,'teacher',item): record.photos?.length?record.photos.map((photo,page)=>`<p>第 ${page+1} 页</p><button class="hp-paper-preview" data-item-id="${escape(item.id)}" data-page="${page}" onclick="homeworkPrototype.openPaper(this)"><img class="hp-original" src="${escape(resolvePhoto(photo))}" alt="${escape(row.name)}的第 ${page+1} 页提交原图"><span>点击放大查看</span></button>`).join('') : item.type==='file'&&media?`<a class="hp-file-preview" href="${escape(media)}" target="_blank" rel="noopener">${fileIcon(record.label,item.type)}<span>${escape(record.label)} · 查看／保存文件</span></a>`:item.type === 'photo' && media ? `<button class="hp-paper-preview" data-item-id="${escape(item.id)}" data-page="0" onclick="homeworkPrototype.openPaper(this)"><img class="hp-original" src="${media}" alt="${escape(row.name)}的${escape(item.title)}提交原图"><span>点击放大查看</span></button>` : item.type === 'video' && media ? `<video class="hp-original-video" controls preload="metadata" src="${media}"></video><button class="hp-secondary" data-item-id="${escape(item.id)}" data-page="0" onclick="homeworkPrototype.openPaper(this)">连续查看照片与视频 ›</button>` : item.type === 'audio' && media ? `<audio controls src="${media}"></audio>` : item.type === 'video' ? '<div class="hp-video-sample">视频暂不可用</div>' : item.type === 'none' ? '' : '<p class="hp-muted">原文件暂不可用。</p>';
      return `<section class="hp-card hp-student-submission"><div class="hp-record-heading"><div class="hp-record-title"><b>${String(index+1).padStart(2,'0')}</b><strong>${escape(item.title)}</strong></div><div class="hp-record-badges"><span class="hp-record-state ${displayStatus==='待批改'||displayStatus==='批改失败'?'is-pending':''}">${displayStatus}</span><span class="hp-record-type">${types[item.type]}</span></div></div><div class="hp-submission-meta"><span>已提交 · ${escape(record.submittedAt || '时间未记录')}${record.late??(grading.homeworkTime(record.submittedAt)>grading.homeworkTime(task.deadline))?' · 补交':''}${(record.version||1)>1?' · 重新提交':''}</span></div>${record.transient?'<small class="hp-media-warning">文件暂存于当前会话，失效后需重新上传。</small>':''}${mediaView}${studentSubmissionHistory(task,item,row.id)}${grading.homeworkPreviewNotice(record)?'<p class="hp-record-image-notice">'+escape(grading.homeworkPreviewNotice(record))+'</p>':''}${record.gradingError?'<p class="hp-record-image-notice">'+escape(record.gradingError)+'</p>':''}</section>`;
    }).join('')}</div>`;
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
  function listFilterBar(){const groups=new Set(filteredListTasks().map(task=>task.seriesId||task.id));return '<div class="hp-list-tools"><h2>任务列表 <small>'+groups.size+'</small></h2><div class="hp-list-filters" role="group" aria-label="筛选任务">'+[['subject',listFilters.subject==='all'?'学科':listFilters.subject],['class',listFilters.classId==='all'?'班级':classes.find(c=>c.id===listFilters.classId)?.name||'班级'],['status',listFilters.statuses.length===window.homeworkFilters.ALL_TASK_STATUSES.length?'状态':'状态·'+listFilters.statuses.length]].map(([id,label])=>'<button aria-label="筛选'+({subject:'学科',class:'班级',status:'任务状态'})[id]+'，当前'+escape(label)+'" class="'+((id==='subject'?listFilters.subject!=='all':id==='class'?listFilters.classId!=='all':listFilters.statuses.length!==window.homeworkFilters.ALL_TASK_STATUSES.length)?'active':'')+'" onclick="homeworkPrototype.openTaskFilter(&quot;'+id+'&quot;)"><span>'+escape(label)+'</span><b aria-hidden="true"></b></button>').join('')+'</div></div>';}
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
        const task = listTask(group[0]), stat = summary(task), assignedClasses=group[0].classIds;
        const publishedTargetCount = targetIds(group[0]).length;
        const scopeLimited = publishedTargetCount > stat.target;
        const listProgressLabel=scopeLimited?'本班已交齐':'已交齐';
        const allSubmitted = stat.target > 0 && stat.completed === stat.target;
        const canSupplement = toDate(task.submitDeadline).getTime() > Date.now();
        const status = task.withdrawnAt?'老师已撤回':task.stoppedAt?'打卡已终止':allSubmitted ? scopeLimited?'本班已交齐':'全部已交' : !ended ? '进行中' : canSupplement ? '补交中' : '已截止';
        const statusTone = allSubmitted ? 'complete' : !ended ? 'ongoing' : canSupplement ? 'supplement' : 'closed';
        const shortTime = value => value.slice(5).replace('-', '月').replace(' ', '日 ');
        const timeLabel = allSubmitted || ended && !canSupplement ? '' : (!ended ? shortTime(task.deadline)+' 截止' : '补交至 '+shortTime(task.submitDeadline));
        const reviewCount = gradeQuestions(task).filter(q=>q.state==='review').length;
        const attention = reviewCount ? '待复核 '+reviewCount+' 题次' : '';
        const submissionRemainder = stat.target>stat.completed?'未交齐 '+(stat.target-stat.completed)+' 人':'';
        const audienceContext = scopeLimited ? ` · 当前范围 ${stat.target} 人，任务共 ${publishedTargetCount} 人` : assignedClasses.length>1 ? ` · 共 ${assignedClasses.length} 个班` : '';
        return `${heading}<button class="hp-card hp-task" onclick="homeworkPrototype.openTeacher('${task.id}',true)"><strong class="hp-list-task-title" title="${escape(task.title)}">${escape(task.title)}</strong><em class="hp-list-state hp-list-state-${statusTone}">${status}</em><span class="hp-list-task-tags"><span class="hp-list-subject">${escape(task.subject||'综合')}</span><em class="hp-list-kind">${task.kind === 'checkin' ? '打卡' : '作业'} · 共 ${task.items.length} 项 · ${escape([...new Set(task.items.map(item=>typeLabel(item.type)))].join('、'))}</em></span><small>${escape(task.classIds.map(id => classes.find(row => row.id === id)?.name).join('、'))}${audienceContext}</small>${timeLabel ? `<div class="hp-task-times"><span>${escape(timeLabel)}</span></div>` : ''}${attention ? `<small>${escape(attention)}</small>` : ''}<span class="hp-line hp-task-bottom hp-submission-summary"><span>${listProgressLabel} <strong>${stat.completed}</strong> 人${submissionRemainder ? ` · ${submissionRemainder}` : ''}</span><b>查看提交 ›</b></span></button>`;
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
    const prefix=workScope.view==='school'?teacherList().replace(/^<div class="hp-hero">.*?<\/div>/s,'').split('<h2 class="hp-section">范围内任务</h2>')[0]:
      '<button class="hp-primary hp-publish-entry" onclick="homeworkPrototype.newTeacherDraft()">＋ 发布作业或打卡</button>'+(draftNotice?'<p class="hp-draft-feedback" role="status">'+escape(draftNotice)+'</p>':'');
    return '<div class="hp-teacher-task-list">'+prefix+listFilterBar()+(teacherTaskCards()||'<section class="hp-card hp-muted">没有符合筛选条件的任务。<button class="hp-secondary" onclick="homeworkPrototype.resetTaskFilters()">重置筛选</button></section>')+renderTaskFilter()+'</div>';
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
    const days = Array.from({ length: offset }, () => '<span></span>').concat(Array.from({ length: count }, (_, index) => `<button type="button" ${new Date(year,month,index+1,23,59,59).getTime()<Date.now()?'disabled':''} class="${chosen.getDate() === index + 1 ? 'active' : ''}" onclick="homeworkPrototype.pickDateDay(${index + 1})">${index + 1}</button>`)).join('');
    const hour = String(chosen.getHours()).padStart(2, '0'), minute = String(chosen.getMinutes()).padStart(2, '0');
    return `<div class="hp-date-mask" onclick="homeworkPrototype.closeDatePicker()"><section class="hp-date-sheet" role="dialog" aria-modal="true" aria-label="设置${datePickerTarget === 'deadline' ? '首次截止' : '允许补交至'}时间" onclick="event.stopPropagation()"><header><button type="button" onclick="homeworkPrototype.closeDatePicker()">取消</button><strong>设置${datePickerTarget === 'deadline' ? '首次截止' : '允许补交至'}时间</strong><button type="button" onclick="homeworkPrototype.confirmDatePicker()">确定</button></header><div class="hp-draft-actions"><button class="hp-secondary" onclick="homeworkPrototype.quickPickerDate(0)">今天</button><button class="hp-secondary" onclick="homeworkPrototype.quickPickerDate(1)">明天</button></div><div class="hp-calendar-month"><button type="button" aria-label="上个月" onclick="homeworkPrototype.shiftPickerMonth(-1)">‹</button><strong>${year}年${month + 1}月</strong><button type="button" aria-label="下个月" onclick="homeworkPrototype.shiftPickerMonth(1)">›</button></div><div class="hp-calendar-grid hp-calendar-week">${['一','二','三','四','五','六','日'].map(day => `<span>${day}</span>`).join('')}</div><div class="hp-calendar-grid hp-calendar-days">${days}</div><div class="hp-time-row"><span>时间</span><select aria-label="小时" onchange="homeworkPrototype.setPickerTime('hour',this.value)">${Array.from({ length: 24 }, (_, index) => `<option ${chosen.toDateString()===new Date().toDateString()&&index<new Date().getHours()?'disabled':''} value="${String(index).padStart(2, '0')}" ${hour === String(index).padStart(2, '0') ? 'selected' : ''}>${String(index).padStart(2, '0')}</option>`).join('')}</select><b>:</b><select aria-label="分钟" onchange="homeworkPrototype.setPickerTime('minute',this.value)">${Array.from({ length: 60 }, (_, index) => `<option ${chosen.toDateString()===new Date().toDateString()&&chosen.getHours()===new Date().getHours()&&index<=new Date().getMinutes()?'disabled':''} value="${String(index).padStart(2, '0')}" ${minute === String(index).padStart(2, '0') ? 'selected' : ''}>${String(index).padStart(2, '0')}</option>`).join('')}</select></div></section></div>`;
  };
  function teacherComposeV2() {
    syncDraftTitle();
    const steps = `<div class="hp-compose-toolbar"><div class="hp-steps hp-steps-compact"><span class="${composeStep === 0 ? 'active' : 'done'}">① ${draft.kind === 'checkin' ? '填写打卡' : '填写作业'}</span><i></i><span class="${composeStep === 1 ? 'active' : ''}">② 选择班级和学生</span></div>${composeStep === 0 ? `<div class="hp-kind-toolbar" role="group" aria-label="任务类型"><button type="button" class="${draft.kind === 'homework' ? 'active' : ''}" onclick="homeworkPrototype.setKind('homework')">作业</button><button type="button" class="${draft.kind === 'checkin' ? 'active' : ''}" onclick="homeworkPrototype.setKind('checkin')">打卡</button></div>` : ''}</div>`;
    const typeChoices = (selected, index = null) => `<div class="hp-type-choices" role="group" aria-label="提交方式">${publishTypes.map(type => `<button type="button" class="hp-type-choice ${selected === type ? 'active' : ''}" aria-pressed="${selected === type}" onclick="${index === null ? `homeworkPrototype.setUniformType('${type}')` : `homeworkPrototype.setItemType(${index},'${type}')`}">${types[type]}</button>`).join('')}</div>`;
    const gradingChoice = (checked, index, type) => {
      const copy = checked ? type==='file'?'PDF/Word 提交后自动识题批改':'图片提交后自动识题批改' : '只保存提交，不识题、不判分';
      return `<div class="hp-auto-grade-card ${checked?'':'is-collect'}"><span class="hp-auto-grade-icon">✦</span><span class="hp-auto-grade-copy"><strong>${checked?'自动批改 <em>默认</em>':'无需批改'}</strong><small>${copy}</small></span><button type="button" aria-pressed="${!checked}" onclick="homeworkPrototype.${index===null?`setUniformGrading(${!checked})`:`setItemGrading(${index},${!checked})`}">${checked?'无需批改':'开启自动批改'}</button></div>`;
    };
    const gradingUnavailable = type => `<div class="hp-grading-unavailable"><span>—</span><span><strong>仅记录提交</strong><small>${type==='video'?'视频':type==='audio'?'录音':'线下完成'}不支持自动批改</small></span></div>`;
    const itemRows = draft.items.map((item, index) => `<div class="hp-requirement"><div class="hp-requirement-head"><span class="hp-requirement-number">${index + 1}</span><button type="button" class="hp-requirement-toggle" onclick="homeworkPrototype.toggleItemOptions(${index})"><strong>${escape(item.title || '未填写要求')}</strong><em>${typeLabel(item.type) || '选择提交方式'}${gradingEligible(item.type)?` · ${item.gradingEnabled?'自动批改':'仅收集'}`:''} ${expandedItemIndex === index ? '⌃' : '›'}</em></button></div>${expandedItemIndex === index ? `<textarea aria-label="第 ${index + 1} 条要求" oninput="homeworkPrototype.setItem(${index},'title',this.value)">${escape(item.title)}</textarea>${typeChoices(item.type, index)}${item.type==='photo'?`<label>预计页数（选填）<input type="number" min="1" max="9" aria-label="第 ${index+1} 项预计页数" value="${item.expectedPages||''}" oninput="homeworkPrototype.setExpectedPages(${index},this.value)"></label>`:''}${draft.kind==='homework'&&gradingEligible(item.type)?gradingChoice(item.gradingEnabled,index,item.type):draft.kind==='homework'&&item.type?gradingUnavailable(item.type):''}${draft.items.length > 1 ? `<button class="hp-text-button" onclick="homeworkPrototype.removeItem(${index})">移除本条</button>` : ''}` : ''}</div>`).join('');
    const settings = `<section class="hp-compose-section hp-submit-settings"><div class="hp-setting-head"><div><h3>提交与批改</h3></div><div class="hp-mode-switch"><button type="button" class="${settingMode === 'uniform' ? 'active' : ''}" onclick="homeworkPrototype.setSettingMode('uniform')">统一设置</button><button type="button" class="${settingMode === 'individual' ? 'active' : ''}" onclick="homeworkPrototype.setSettingMode('individual')">逐项设置</button></div></div>${recognitionStale ? '<p class="hp-muted">内容已修改，请核对识别结果。</p>' : ''}${recognitionStale && settingMode === 'individual' && (recognizedCount > 0 || draft.items.length > 1) ? '<button class="hp-text-button" onclick="homeworkPrototype.applyRecognition()">确认重新识别</button>' : ''}${settingMode === 'uniform' ? typeChoices(uniformType)+(uniformType==='photo'?`<label>预计页数（选填）<input type="number" min="1" max="9" aria-label="预计页数" value="${draft.items[0]?.expectedPages||''}" oninput="homeworkPrototype.setExpectedPages(-1,this.value)"></label>`:'')+(draft.kind==='homework'&&gradingEligible(uniformType)?gradingChoice(draft.items.every(item=>item.gradingEnabled),null,uniformType):draft.kind==='homework'&&uniformType?gradingUnavailable(uniformType):'') : `${itemRows}<button class="hp-add" onclick="homeworkPrototype.addItem()">＋ 手动添加一项</button>`}</section>`;
    const attachedMaterials = materialAttachments(draft);
    const activeMaterialUploads = attachedMaterials.filter(file => file.uploadState === 'optimizing' || file.uploadState === 'uploading');
    const failedMaterialUploads = attachedMaterials.filter(file => file.uploadState === 'failed' || file.unavailable);
    const attachmentBlocking = activeMaterialUploads.length || failedMaterialUploads.length;
    const material = `<div class="hp-attachment-field"><div class="hp-attachment-heading"><strong>附件<span>（选填，可供家长查看）</span></strong><button type="button" onclick="homeworkPrototype.openMaterialSource()" ${materialReading ? 'disabled' : ''}>${materialReading ? '正在添加…' : '＋ 添加附件'}</button></div>${renderMaterialAttachments(draft, true)}<input id="hp-material-album" class="hp-hidden-file" type="file" accept="image/*,video/*" multiple onchange="homeworkPrototype.addMaterialFiles(this)"><input id="hp-material-camera" class="hp-hidden-file" type="file" accept="image/*,video/*" capture="environment" onchange="homeworkPrototype.addMaterialFiles(this)"><input id="hp-material-document" class="hp-hidden-file" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp3,.m4a,.wav,.aac,.ogg,audio/*" multiple onchange="homeworkPrototype.addMaterialFiles(this)"></div>${materialSourceOpen ? `<div class="hp-source-mask" onclick="homeworkPrototype.closeMaterialSource()"><section class="hp-source-sheet hp-attachment-source" role="dialog" aria-modal="true" aria-label="添加附件" onclick="event.stopPropagation()"><strong>${chatDemoOpen ? '选择演示附件' : '添加附件'}</strong>${chatDemoOpen ? demoMaterialFiles.map(file => `<button type="button" onclick="homeworkPrototype.chooseDemoAttachment('${file.id}')">${escape(file.name)}<small>${types[file.type]} · 微信聊天记录（演示）</small></button>`).join('') : `<button type="button" onclick="homeworkPrototype.openWorksheetLibrary()">从作业库选择<small>选择现成的试卷或练习资料</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('album')">从手机相册选择<small>选择已有图片或视频</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('camera')">拍照或拍摄<small>现场拍摄图片或视频</small></button><button type="button" onclick="homeworkPrototype.showChatDemo()">选择演示文件<small>宣传视频、校区资料、组卷和录音</small></button><button type="button" onclick="homeworkPrototype.chooseMaterialMedia('chat-file')">从微信聊天记录选择<small>选择其他 PDF、Word、音频等文件</small></button>`}<button type="button" class="hp-source-cancel" onclick="homeworkPrototype.closeMaterialSource()">取消</button></section></div>` : ''}`;
    const worksheetPicker = worksheetLibraryOpen ? `<div class="hp-source-mask" onclick="homeworkPrototype.closeWorksheetLibrary()"><section class="hp-worksheet-sheet" role="dialog" aria-modal="true" aria-label="作业素材库" onclick="event.stopPropagation()"><header><strong>作业素材库</strong><button type="button" onclick="homeworkPrototype.closeWorksheetLibrary()">×</button></header><p>选择空白作业后，自动填入作业说明、附件和“拍照提交”要求。</p><div class="hp-worksheet-grid">${worksheetLibrary.map(item => `<button type="button" onclick="homeworkPrototype.applyWorksheet('${item.id}')"><img src="${worksheetAsset(item.blankPath)}" alt="${escape(item.title)}空白作业"><span><em>${item.grade}年级 · ${escape(item.subject)}</em><strong>${escape(item.title)}</strong><small>${escape(item.description)}</small></span></button>`).join('')}</div></section></div>` : '';
    const deadlineExpired = toDate(draft.deadline).getTime() <= Date.now();
    const dateRows = `${deadlineExpired ? '<p class="hp-error">截止时间已过，请重新设置。<button class="hp-text-button" onclick="homeworkPrototype.quickDeadline(0)">改为今天</button><button class="hp-text-button" onclick="homeworkPrototype.quickDeadline(1)">改为明天</button></p>' : ''}<section class="hp-compose-section hp-deadline-section"><div class="hp-section-heading"><div><h3>截止时间</h3><small>到期后仍可在补交期内提交</small></div></div><button type="button" class="hp-date-summary" onclick="homeworkPrototype.openDatePicker('deadline')"><span>首次截止</span><strong>${prettyDate(draft.deadline)}</strong><b>›</b></button><label class="hp-allow-supplement"><input type="checkbox" ${draft.allowSupplement!==false?'checked':''} onchange="homeworkPrototype.setAllowSupplement(this.checked)">允许补交</label><button type="button" class="hp-date-summary" ${draft.allowSupplement===false?'hidden':''} onclick="homeworkPrototype.openDatePicker('submitDeadline')"><span>补交截止</span><strong>${prettyDate(draft.submitDeadline)}</strong><b>›</b></button></section>`;
    const firstStep = `<section class="hp-card hp-compose-card"><div class="hp-form-label"><strong>作业标题</strong></div><div class="hp-auto-title-row"><label class="hp-title-edit"><input aria-label="作业标题，可修改" maxlength="40" value="${escape(draft.title)}" oninput="homeworkPrototype.setTitle(this.value)"><span class="hp-title-pencil" aria-hidden="true">✎</span></label>${subjectOptions().length > 1 ? `<select aria-label="选择任教学科" onchange="homeworkPrototype.setSubject(this.value)">${subjectOptions().map(subject => `<option value="${escape(subject)}" ${draft.subject === subject ? 'selected' : ''}>${escape(subject)}</option>`).join('')}</select>` : ''}</div>${!subjectOptions().length ? '<p class="hp-error">暂无可发布学科，请联系学校管理员核对任教关系。</p>' : ''}${draft.kind === 'checkin' ? `<label class="hp-field">连续打卡天数（1—30 天）<input type="number" min="1" max="30" value="${draft.cycleCount}" onchange="homeworkPrototype.setCycleCount(this.value)"></label>` : ''}<div class="hp-form-label hp-requirement-label"><strong>作业详情</strong><span>填写页码、完成内容等</span></div><div class="hp-requirement-editor"><div class="hp-description-field"><textarea class="hp-paste-area" aria-label="作业详情" placeholder="例如：完成练习册第 8 页，拍照提交" oninput="homeworkPrototype.setField('description',this.value)" onblur="setTimeout(() => homeworkPrototype.recognizeDescription(), 0)">${escape(draft.description)}</textarea></div>${material}</div></section>${settings}${dateRows}`;
    const availableClasses = classes.filter(row => subjectClassIds(draft.subject).includes(row.id));
    const selectedClasses = availableClasses.filter(row => draft.classIds.includes(row.id));
    const receivingStudents = draftRecipients();
    const classRows = availableClasses.map(row => {
      const selected = draft.classIds.includes(row.id), mode = recipientModeForClass(row.id);
      const total = students.filter(student => student.classId === row.id).length;
      const picked = draft.targetStudentIds.filter(id => students.some(student => student.id === id && student.classId === row.id)).length;
      return `<div class="hp-recipient-class-row ${selected?'is-selected':''} ${selected&&mode==='selected'&&!picked?'is-empty':''}"><label class="hp-recipient-class-name"><input type="checkbox" ${selected?'checked':''} onchange="homeworkPrototype.toggleClass('${row.id}')"><span><strong>${escape(row.name)}</strong></span></label>${selected?`<div class="hp-recipient-mode-buttons" role="group" aria-label="${escape(row.name)}接收范围"><button type="button" class="${mode==='all'?'active':''}" aria-pressed="${mode==='all'}" onclick="homeworkPrototype.setClassRecipientMode('${row.id}','all')">全班${mode==='all'?` ${total}人`:''}</button><button type="button" class="${mode==='selected'?'active':''}" aria-pressed="${mode==='selected'}" onclick="homeworkPrototype.setClassRecipientMode('${row.id}','selected')">部分${mode==='selected'?` ${picked}人 ›`:''}</button></div>`:''}</div>`;
    }).join('');
    const recipients=`<section class="hp-compose-section hp-recipient-merged"><div class="hp-recipient-merged-head"><h3>选择班级及接收人</h3><span>已选 ${selectedClasses.length}/${availableClasses.length}</span></div><p class="hp-recipient-merged-note">勾选班级后，设置发给全班或部分学生</p><div class="hp-recipient-class-list">${classRows}</div></section>`;
    const activeClass=selectedClasses.find(row=>row.id===recipientClassId),classRoster=students.filter(student=>student.classId===recipientClassId),selectedInClass=classRoster.filter(student=>draft.targetStudentIds.includes(student.id)).length;
    const matchStudent=student=>(student.name+' '+student.id).toLowerCase().includes(recipientSearch.toLowerCase());
    const picker=composeStep&&recipientPickerOpen&&activeClass&&recipientModeForClass(activeClass.id)==='selected'?`<div class="hp-recipient-picker-mask" onclick="homeworkPrototype.closeRecipientPicker()"><section class="hp-recipient-picker-sheet" role="dialog" aria-modal="true" aria-label="选择${escape(activeClass.name)}学生" onclick="event.stopPropagation()"><div class="hp-recipient-picker-handle"></div><header><strong>选择${escape(activeClass.name)}学生</strong><span>${selectedInClass}/${classRoster.length} 人</span></header><p>仅勾选需要接收作业的学生</p><input class="hp-search" aria-label="搜索本班学生" placeholder="搜索姓名或学号" value="${escape(recipientSearch)}" oninput="homeworkPrototype.filterStudents(this.value)"><div class="hp-recipient-picker-list">${classRoster.map(student=>`<label class="hp-student-option" data-search="${escape((student.name+' '+student.id).toLowerCase())}" ${matchStudent(student)?'':'hidden'}><span>${escape(student.name)}<small>${escape(student.id)}</small></span><input type="checkbox" ${draft.targetStudentIds.includes(student.id)?'checked':''} onchange="homeworkPrototype.toggleStudent('${student.id}')"></label>`).join('')}<p class="hp-recipient-empty" ${classRoster.some(matchStudent)?'hidden':''}>没有匹配的学生，已选名单保留。</p></div><button type="button" class="hp-primary" onclick="homeworkPrototype.closeRecipientPicker()">确定 · ${selectedInClass} 名学生</button></section></div>`:'';
    const nextLabel = composeStep ? '核对发布内容' : activeMaterialUploads.length ? `附件上传中 ${Math.max(...activeMaterialUploads.map(file => Number(file.uploadProgress || 0)))}%` : failedMaterialUploads.length ? '请处理上传失败附件' : '下一步：选择班级和学生';
    return `<div class="hp-compose-page${composeStep ? ' hp-recipient-page' : ''}">${steps}${composeStep===0&&toDate(draft.deadline).getTime()<=Date.now()?'<p class="hp-error" role="alert">这份草稿的截止时间已过，请在下方调整截止时间。</p>':''}${composeStep === 0 ? firstStep : recipients}${composeError ? `<p class="hp-error" role="alert">${escape(composeError)}</p>` : ''}${composeStep ? '<button class="hp-text-button hp-compose-back" onclick="homeworkPrototype.backCompose()">返回修改</button>' : ''}<div class="hp-compose-footer">${composeStep?`<div class="hp-recipient-footer-summary">已选 ${selectedClasses.length} 个班 · 共发送 ${receivingStudents.length} 人</div>`:''}<button class="hp-primary" onclick="homeworkPrototype.nextCompose()" ${composeStep === 0 && attachmentBlocking ? 'disabled' : ''}>${nextLabel}</button></div>${renderDatePicker()}${worksheetPicker}${picker}</div>`;
  }
  function teacherPreviewV2() {
    syncDraftTitle();
    const recipients = draftRecipients();
    const demoChoices = '';
    const recipientRows=classes.filter(c=>draft.classIds.includes(c.id)).map(c=>{const rows=recipients.filter(student=>student.classId===c.id),partial=recipientModeForClass(c.id)==='selected';return `<div class="hp-recipient-review-row"><strong>${escape(c.name)}</strong><span>${partial?'部分学生':'全班'} · ${rows.length} 人</span>${partial?`<small>${escape(rows.map(student=>student.name).join('、'))}</small>`:''}</div>`;}).join('');
    return `<div class="hp-top"><button onclick="homeworkPrototype.backToCompose()">‹ 返回修改</button><h1>核对发布内容</h1></div><p class="hp-step-hint">请核对接收对象和两个截止时间，确认后家长会在作业列表看到这项任务。</p><section class="hp-card"><span class="hp-line"><strong>${escape(draft.title)}</strong><em>${draft.kind === 'checkin' ? '打卡' : '作业'}</em></span>${draft.description ? `<p>${escape(draft.description)}</p>` : ''}${renderMaterialAttachments(draft)}<small>正常截止：${escape(draft.deadline)}</small><small>允许补交至：${escape(draft.submitDeadline)}</small></section><section class="hp-card"><h2>完成项目 · ${draft.items.length} 项</h2>${draft.items.map((item, index) => `<div class="hp-review-item"><strong>${index + 1}. ${escape(item.title)}</strong><small>${escape(item.instruction)}</small><small>${item.expectedPages?'预计 '+item.expectedPages+' 页 · ':''}${typeLabel(item.type)} · 必交${gradingEligible(item.type)&&draft.kind==='homework'?` · ${item.gradingEnabled?'AI 自动批改':'仅收集，不批改'}`:' · 仅记录提交'}</small></div>`).join('')}</section><section class="hp-card"><h2>接收对象 · ${recipients.length} 人</h2><div class="hp-recipient-review-rows">${recipientRows}</div><small>确认发布后冻结此名单；家长仅能查看自己孩子的提交内容。</small></section><p class="hp-muted">请确认题目和页数没有遗漏。发布后不再补充题目，遗漏需另发任务。</p>${demoChoices}${composeError ? `<p class="hp-error" role="alert">${escape(composeError)}</p>` : ''}<button class="hp-secondary" onclick="homeworkPrototype.previewFamily()">预览家长看到的内容</button><button class="hp-primary hp-space" onclick="homeworkPrototype.publish()">确认发布</button>`;
  }
  function renderTeacher() { return (teacherMode==='drafts' && workScope.view!=='school'?teacherDraftList():renderTeacherContent())+draftOverlays(); }
  function renderTeacherContent() { checkLocalDemo('teacher'); return teacherMode === 'success' ? `<button class="hp-success-back" onclick="homeworkPrototype.toTeacherList()" aria-label="返回作业首页">‹ 返回作业首页</button><section class="hp-card hp-publish-success"><div class="hp-publish-check">✓</div><h2>发布成功</h2><p>${escape(publishedNotice)}</p><button class="hp-primary" onclick="homeworkPrototype.toTeacherList()">查看已发布任务</button></section>` : teacherMode === 'compose' ? teacherComposeV2() : teacherMode === 'preview' ? teacherPreviewV2() : teacherMode === 'series' ? teacherSeriesView() : teacherMode === 'questions' ? teacherQuestionResults() : teacherMode === 'question' ? teacherGradeQuestion() : teacherMode === 'result' ? teacherStudent() : teacherMode === 'detail' ? teacherDetailView() : teacherMode === 'students' ? teacherStudents() : teacherMode === 'student' ? teacherStudent() : teacherListV2(); }
  function leavePending() {
    if(uploadBusy){alert('正在提交，请完成后再离开。');return false;}
    if(!pendingUpload)return true;
    if(pendingUpload.photos?.some(photo=>!photo.saved)){alert('部分照片尚未暂存成功，请重试后再离开。');return false;}
    try { if(persistPending()===false)throw Error(); uploadMessage='';return true; }
    catch { alert('暂存失败，请留在当前页面重试后再离开。');return false; }
  }
  function parentTaskGroups(childId) {
    const now = Date.now();
    const submissions = latestRows(store.submissions);
    const tasks = store.tasks.filter(task => targetIds(task).includes(childId)).map(task => {
      const complete = task.items.filter(item => submissions.some(row => row.taskId === task.id && row.studentId === childId && row.itemId === item.id)).length;
      const done = complete === task.items.length&&!task.withdrawnAt&&!task.stoppedAt;
      const due = toDate(task.deadline).getTime();
      const closed = closedTask(task);
      const status = task.withdrawnAt?'老师已撤回':task.stoppedAt?'打卡已终止':done ? '已完成' : closed ? '补交已结束' : due < now ? '补交中' : due - now <= 86400000 ? '即将截止' : complete ? '部分完成' : '待完成';
      const effectiveDue=due<now?toDate(task.submitDeadline).getTime():due; const priority = done ? 5 : closed ? 4 : 0;
      return { task, complete, done, closed, status, priority, effectiveDue };
    }).sort((a, b) => a.priority - b.priority || a.effectiveDue-b.effectiveDue || Number(b.complete>0)-Number(a.complete>0));
    const completedIds=tasks.filter(row=>row.done).map(row=>row.task.id);
    const demoEntries=tasks.map(row=>({id:row.task.id,kind:row.task.kind,completed:row.done,closed:row.closed,completedCount:row.complete,endedByDeadline:row.status==='补交已结束'}));
    const keepDemo=row=>!schoolDemoRoster.isRedundantIncompleteHomeworkDemo(demoEntries.find(entry=>entry.id===row.task.id),demoEntries);
    const pending = tasks.filter(row => !row.done && !row.closed&&keepDemo(row)), completed = tasks.filter(row => row.done&&!schoolDemoRoster.isRedundantCompletedHomeworkDemo(row.task.id,completedIds)), ended = tasks.filter(row => !row.done && row.closed&&keepDemo(row));
    return { pending, completed, ended };
  }
  function parentListV2(studentName) {
    const groups = parentTaskGroups(guardianId);
    const cards = rows => rows.map(({ task, complete, done, status }) => `<button class="hp-card hp-task hp-parent-task ${status === '补交中' || status === '补交已结束' ? 'hp-task-overdue' : status === '即将截止' ? 'hp-task-soon' : ''}" onclick="homeworkPrototype.openParent('${task.id}')"><span class="hp-line"><strong><span class="hp-parent-tags"><span class="hp-parent-subject">${escape(task.subject || '综合')}</span><span class="hp-parent-kind ${task.kind === 'checkin' ? 'checkin' : 'homework'}">${task.kind === 'checkin' ? '打卡' : '作业'}</span></span><span class="hp-parent-task-name">${escape(task.title)}</span></strong><em class="${status === '补交中' || status === '补交已结束' ? 'hp-state-overdue' : status === '即将截止' ? 'hp-state-soon' : ''}">${status}</em></span><small>${status==='补交中'?'可补交至 '+escape(task.submitDeadline):'正常截止 '+escape(task.deadline)}</small>${task.items.length > 1 ? `<small class="hp-parent-item-types">需完成 ${escape(task.items.map(item => item.type === 'none' ? '家长确认' : types[item.type]).join('、'))}</small>` : ''}<span class="hp-line hp-task-bottom"><span>已完成 ${complete}/${task.items.length} 项</span><b>${done || closedTask(task) ? '查看记录 ›' : complete > 0 ? '继续完成 ›' : '去完成 ›'}</b></span></button>`).join('');
    const labels = { pending: '待完成', completed: '已完成', ended: '已结束' };
    const tabs = `<div class="hp-parent-task-tabs" role="tablist" aria-label="任务状态">${Object.keys(groups).map(key => `<button id="hp-tab-${key}" role="tab" aria-controls="hp-task-panel" aria-selected="${parentTaskTab === key}" class="${parentTaskTab === key ? 'active' : ''}" onclick="homeworkPrototype.changeParentTaskTab('${key}')">${labels[key]}<span>${groups[key].length}</span></button>`).join('')}</div>`;
    const rows = groups[parentTaskTab];
    return `${tabs}<div id="hp-task-panel" class="hp-parent-task-panel" role="tabpanel" aria-labelledby="hp-tab-${parentTaskTab}" onpointerdown="homeworkPrototype.taskSwipeStart(event)" onpointerup="homeworkPrototype.taskSwipeEnd(event)" onpointercancel="homeworkPrototype.taskSwipeCancel()">${rows.length ? cards(rows) : `<section class="hp-card hp-muted">暂无${labels[parentTaskTab]}任务。</section>`}</div>`;
  }
  function parentDetailV2(studentName) {
    const task = taskById(parentTaskId);
    if (!task || !targetIds(task).includes(guardianId)) { parentTaskId = ''; return parentListV2(studentName); }
    const closed = closedTask(task);
    const mine = latestRows(store.submissions.filter(row => row.taskId === task.id && row.studentId === guardianId));
    const done = task.items.filter(item => mine.some(row => row.itemId === item.id)).length;
    const items = task.items.map((item, index) => {
      const record = mine.find(row => row.itemId === item.id);
      const savedPending=pendingMap()[task.id+':'+item.id];
      const pending = pendingUpload?.taskId === task.id && pendingUpload.itemId === item.id && pendingUpload.studentId === guardianId ? pendingUpload : null;
      if(record?.fileRef){resolvePhoto(record.fileRef);record.media=record.fileRef.path;}if(pending?.id){resolvePhoto(pending);pending.media=pending.path;}
      const displayStatus=submissionState(task,item,record,grading.hasPendingHomeworkContent(pending||savedPending));
      const submittedMedia = record && (mediaFor(record) || (record.mock && item.type === 'photo' ? mockPhoto(record, studentName) : ''));
      const submittedPreview = record && submittedMedia ? item.type === 'photo' ? recordPhotoView(record,'parent',item) : item.type === 'video' ? `<video class="hp-original-video" controls src="${submittedMedia}"></video>` : item.type === 'audio' ? `<audio controls src="${submittedMedia}"></audio>` : item.type === 'file' ? `<a class="hp-file-preview" href="${submittedMedia}" download="${escape(record.label)}">${fileIcon(record.label, item.type)}<span class="hp-file-preview-info"><strong>${escape(record.label)}</strong><small>已提交 · ${escape(record.submittedAt || '已完成')}</small></span><span class="hp-file-preview-action">查看文件 ›</span></a>` : '' : '';
      const pendingPreview = pending ? pending.type === 'photo' ? `<button class="hp-paper-preview" aria-label="放大查看待提交照片" onclick="homeworkPrototype.openPaper(this)"><img class="hp-original" src="${escape(pending.media)}" alt="待提交照片预览" onerror="homeworkPrototype.fallbackPendingDemoPhoto()"><span class="hp-preview-zoom">放大查看 ↗</span></button>` : pending.type === 'video' ? `<video class="hp-original-video" controls src="${pending.media}"></video>` : pending.type === 'audio' ? `<audio controls src="${pending.media}"></audio>` : `<div class="hp-file-preview">${fileIcon(pending.name, pending.type)}<span class="hp-file-preview-info"><strong>${escape(pending.name)}</strong><small>待确认提交</small></span></div>` : '';
      let upload = '';
      const gradingNotice=[grading.homeworkPreviewNotice(record),grading.homeworkGradingNotice(displayStatus,record?.gradingError)].filter(Boolean).join(' · ');
      const gradeNotice=record&&['photo','file'].includes(item.type)&&gradingNotice?`<p class="hp-item-note">${escape(gradingNotice)}</p>${item.type==='file'&&/失败|超时|异常/.test(record.gradingError||'')&&!/未接入|等待|已重试/.test(record.gradingError||'')?`<button class="hp-text-button hp-grading-retry" onclick="homeworkPrototype.retryItemGrading('${task.id}','${item.id}')">重试批改</button>`:''}`:'';
      if (closed) upload = record ? '' : '<p class="hp-item-note">补交已结束，本项仅可查看。</p>';
      else if (item.type === 'none') upload = record ? '' : `<button class="hp-primary hp-item-action" onclick="homeworkPrototype.submit('${task.id}','${item.id}')">确认已完成</button>`;
      else if(savedPending&&!pending)upload=`<button class="hp-primary" onclick="homeworkPrototype.resumePending('${task.id}','${item.id}')">继续尚未提交的内容</button>`;
      else if (pending?.photos) upload = renderPendingPhotos(pending,item,record);
      else if (pending) upload = `<div class="hp-pending hp-single-selection"><strong>待提交</strong>${item.type!=='file'?`<small>${escape(pending.name)}</small>`:''}${pendingPreview}${record ? '<small>重新提交后，新版本成为当前提交，历史版本保留。</small>' : ''}${pending.transient ? '<small>大文件只在本次预览中保留，刷新后需重新选择。</small>' : ''}<div class="hp-single-submit-actions"><button class="hp-single-reselect" ${uploadBusy?'disabled':''} onclick="homeworkPrototype.reselectPendingUpload()">重新选择</button><button class="hp-primary" ${uploadBusy?'disabled':''} onclick="homeworkPrototype.${uploadMessage.includes('已有新版本')?'acknowledgePendingVersion':'confirmUpload'}()">${uploadBusy?'正在处理…':uploadMessage.includes('已有新版本')?'使用当前文件':record?'确认重新提交':'提交本项'}</button></div></div>`;
      else if (item.type === 'photo') upload = `<button class="${record ? 'hp-resubmit-button' : 'hp-primary hp-item-action'}" onclick="homeworkPrototype.openParentPhotoSource('${task.id}','${item.id}')">${record ? '重新提交整项' : '上传图片／多页照片'}</button><input id="hp-parent-photo-${escape(item.id)}" class="hp-hidden-file" type="file" accept="image/*" multiple onchange="homeworkPrototype.submitFile('${task.id}','${item.id}',this)">${record ? `<button class="hp-secondary" onclick="homeworkPrototype.appendPhotos('${task.id}','${item.id}')">补充照片</button>` : `<button type="button" class="hp-photo-demo-link" onclick="homeworkPrototype.fillParentDemoPhoto('${task.id}','${item.id}')">填入演示内容 ›</button><small class="hp-item-hint">图片≤20MB；选择后预览核对，再确认提交。</small>`}`;
      else upload = `<label class="hp-upload ${record ? 'hp-resubmit-button' : 'hp-upload-primary'}">${record ? '重新提交' : '上传' + types[item.type]}<input id="hp-parent-single-${escape(item.id)}" type="file" accept="${item.type==='file'&&item.gradingEnabled?'.pdf,.doc,.docx':accept[item.type]}" onchange="homeworkPrototype.submitFile('${task.id}','${item.id}',this)"></label>${record ? '' : `<small class="hp-item-hint">${item.type === 'file' ? item.gradingEnabled?'仅支持 PDF、Word，≤50MB；已提交与批改状态分别展示。':'支持 PDF、Word、PPT、Excel、TXT，≤50MB；仅收集，不批改。' : item.type==='video'?'视频≤100MB且≤3分钟。':'录音≤20MB且≤5分钟。'}</small>`}`;
      const history = store.submissions.filter(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId).sort((a, b) => (b.version || 1) - (a.version || 1));
      return `<section class="hp-card hp-parent-item"><div class="hp-item-head"><span class="hp-item-number">${String(index + 1).padStart(2, '0')}</span><strong>${escape(item.title)}</strong><span class="hp-item-badges"><em class="${displayStatus==='已提交'||displayStatus==='已批改'?'hp-tag-done':'hp-tag-pending'}">${displayStatus}</em><em>${typeLabel(item.type)}</em></span></div>${item.instruction && !['拍摄清晰完整的答题页','按上述要求完成','按要求完成','按任务要求完成'].includes(item.instruction.trim()) ? `<p class="hp-item-instruction">${escape(item.instruction)}</p>` : ''}${record ? `${item.type === 'file' ? '' : `<small class="hp-item-submitted">${item.type === 'none' ? '已确认' : '已提交'} · ${escape(record.submittedAt || '已完成')}${record.late ? ' · 补交' : ''}</small>`}${record.transient && !submittedMedia ? '<small class="hp-item-note">原文件已失效，请重新选择。</small>' : ''}${submittedPreview}${studentSubmissionHistory(task,item,guardianId)}` : ''}${gradeNotice}${upload}${pending&&!pending.photos?`<input id="hp-parent-single-${escape(item.id)}" class="hp-hidden-file" type="file" accept="${item.type==='file'&&item.gradingEnabled?'.pdf,.doc,.docx':accept[item.type]}" onchange="homeworkPrototype.submitFile('${task.id}','${item.id}',this)">`:''}</section>`;
    }).join('');
    const deadlineNotice = task.withdrawnAt?'老师已撤回：'+task.managementReason:task.stoppedAt?'打卡已终止：'+task.managementReason:closed ? '补交已结束，任务已转为只读。' : Date.now() > toDate(task.deadline).getTime() ? '已过正常截止时间，仍可补交。' : '';
    const activePhotoItem = parentPhotoSource?.taskId === task.id ? task.items.find(item => item.id === parentPhotoSource.itemId) : null;
    const directWorksheetId = activePhotoItem?.id.startsWith('worksheet-submit-') ? activePhotoItem.id.slice('worksheet-submit-'.length) : task.id === 'worksheet-flow-grade5-v1' ? 'math-application-grade7' : '';
    const matchedDemoPhotos = directWorksheetId ? parentDemoPhotos.filter(photo => photo.templateId === directWorksheetId) : parentDemoPhotos;
    const photoSource = parentPhotoSource?.taskId === task.id ? `<div class="hp-source-mask" onclick="homeworkPrototype.closeParentPhotoSource()"><section class="hp-source-sheet hp-attachment-source" role="dialog" aria-modal="true" aria-label="选择图片来源" onclick="event.stopPropagation()"><strong>${parentPhotoSource.chatOpen ? (parentPhotoSource.demoOpen ? '选择学生已作答作业' : '选择微信内图片（演示）') : '选择图片来源'}</strong>${parentPhotoSource.chatOpen ? `${matchedDemoPhotos.map(photo=>{const index=parentDemoPhotos.indexOf(photo);return `<button type="button" class="hp-demo-photo-choice" onclick="homeworkPrototype.useParentChatDemoPhoto(${index})"><img src="${demoPhotoAsset(photo)}" alt="${photo.name}"><span>${photo.name}<small>${photo.detail} · 学生已作答</small></span></button>`;}).join('')}<button type="button" onclick="homeworkPrototype.chooseParentPhotoFile()">选择本地图片体验<small>网页原型使用本地文件模拟微信选择</small></button>` : `<button type="button" onclick="homeworkPrototype.chooseParentPhotoFile()">从手机相册选择<small>可多选图片</small></button><button type="button" onclick="homeworkPrototype.showParentChatPhotos()">从微信聊天记录选择<small>聊天中的图片</small></button><button type="button" onclick="homeworkPrototype.showParentChatPhotos(true)">填入学生已作答作业<small>${directWorksheetId ? '自动匹配教师发布的空白作业' : '内置演示作业图片'}</small></button>`}<button type="button" class="hp-source-cancel" onclick="homeworkPrototype.closeParentPhotoSource()">取消</button></section></div>` : '';
    const remaining = task.items.length - done;
    const progress = task.items.length ? Math.round(done / task.items.length * 100) : 0;
    const summaryLabel = remaining ? closed ? '未完成' : '待完成' : '已完成';
    const attachments = materialAttachments(task);
    const attachmentsExpanded = !collapsedParentAttachments.has(task.id);
    const person='<div class="hp-record-overview-person"><strong>'+escape(studentName)+'</strong><span>'+escape(classes.find(c=>c.id===students.find(st=>st.id===guardianId)?.classId)?.name||'')+'</span></div>';
    return `${recordOverview(task,mine,person)}<details class="hp-record-task-details"><summary>作业要求与截止时间</summary><div>正常截止 ${escape(task.deadline)}</div><div>补交至 ${escape(task.submitDeadline)}</div>${deadlineNotice?'<p>'+escape(deadlineNotice)+'</p>':''}${renderTeacherInstructions({...task,changes:[]},true)}</details>${renderTeacherInstructions({...task,description:''})}${uploadMessage?`<p class="${/失败|超|不支持|不符|新版本|已结束|撤回|加密|损坏|不可用/.test(uploadMessage)?'hp-error':'hp-item-note'}" role="status">${escape(uploadMessage)}</p>`:''}${attachments.length ? `<section class="hp-card hp-task-attachments"><div class="hp-task-attachments-head"><h3>附件 · ${attachments.length}</h3><button type="button" aria-expanded="${attachmentsExpanded}" aria-controls="hp-parent-attachment-list" onclick="homeworkPrototype.toggleParentAttachments('${task.id}')">${attachmentsExpanded ? '收起' : '展开'}<span class="hp-attachment-chevron" aria-hidden="true"></span></button></div><div id="hp-parent-attachment-list" ${attachmentsExpanded ? '' : 'hidden'}>${attachmentsExpanded ? renderMaterialAttachments(task) : ''}</div></section>` : ''}${items}${photoSource}`;
  }
  const renderParent = (studentName, childIndex = 0) => { completeDemoUploads(); checkLocalDemo('parent'); guardianId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID; restorePending(); if (parentTaskId && !targetIds(taskById(parentTaskId) || { classIds: [], targetStudentIds: null }).includes(guardianId)) parentTaskId = ''; return parentTaskId ? gradeUI.parentOpen ? wholeGrade(taskById(parentTaskId),guardianId,studentName,true) : parentDetailV2(studentName) : parentListV2(studentName); };
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
  const submitRecord = (task, item, label, media = '', transientMedia = '', demoPhotoIndex = null, photos = null) => {
    const beforeSubmission=JSON.stringify(store);
    const version = store.submissions.filter(row => row.taskId === task.id && row.itemId === item.id && row.studentId === guardianId).reduce((max, row) => Math.max(max, row.version || 1), 0) + 1;
    const requestId=pendingUpload?(pendingUpload.requestId ||= 'submit-'+Date.now()+'-'+Math.random().toString(36).slice(2)):undefined;
    if(requestId&&store.submissions.some(r=>r.taskId===task.id&&r.itemId===item.id&&r.studentId===guardianId&&r.requestId===requestId))return;
    if(pendingUpload){const error=grading.homeworkOriginalError(pendingUpload);if(error)throw new Error(error);}
    const receipt=grading.homeworkSubmissionReceipt(task);
    const submittedAt=receipt.submittedAt;
    const record = { taskId: task.id, itemId: item.id, studentId: guardianId, submittedBy: 'guardian-demo-001', label, media, transient: Boolean(transientMedia), ...receipt,requestId,uploadState:'complete',previewState:pendingUpload?.previewState||(item.type==='file'?'pending':'ready'),version, mock: label.startsWith('模拟'), questions: seedQuestions(task, item, guardianId).map(q=>({...q,state:'queued',estimatedMinutes:2})) };
    if(Number.isInteger(demoPhotoIndex)&&parentDemoPhotos[demoPhotoIndex]&&record.questions.length){
      const questions=demoPhotoIndex===0||parentDemoPhotos[demoPhotoIndex].templateId==='generic-math'?seedQuestions(task,item,guardianId):grading.realPhotoQuestions('page-'+demoPhotoIndex,item.id+'-');
      record.questions=questions.map(q=>({...q,demoFinalState:q.state,state:'processing'}));
      record.mock=true;record.demoGradeReadyAt=Date.now()+1200;
    }
    if (transientMedia) sessionMedia.set(mediaKey(record), transientMedia);
    else sessionMedia.delete(mediaKey(record));
    const previous=latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.itemId===item.id&&r.studentId===guardianId))[0];record.questions.forEach(q=>{if(previous?.questions?.some(old=>old.id===q.id&&old.reviewReason==='manual-hold')){q.state='review';q.reviewReason='manual-hold';}});
    if(pendingUpload?.id)record.fileRef={id:pendingUpload.id,path:pendingUpload.path,name:pendingUpload.name};
    if(item.type==='file'&&item.gradingEnabled){record.questions=[];record.gradingError='当前演示未接入文档转页与批改服务；提交已保留。';}
    if(photos){record.photos=photos;record.media=photos[0]?.path||'';record.questions=photos.flatMap((photo,page)=>{const demo=Number.isInteger(photo.demoPhotoIndex),base=task.kind==='homework'&&item.gradingEnabled!==false?(demo?grading.realPhotoQuestions('page-'+photo.demoPhotoIndex,item.id+'-'+page+'-'):seedQuestions(task,item,guardianId)):[];return base.map(q=>({...q,id:page===0?q.id:q.id+'-page-'+page,label:'第 '+(page+1)+' 页 · '+q.label,pageIndex:page,demoFinalState:demo?q.state:undefined,state:demo?'processing':'queued',estimatedMinutes:2}));});if(photos.some(p=>Number.isInteger(p.demoPhotoIndex))){record.mock=true;record.demoGradeReadyAt=Date.now()+1200;}}
    store.submissions.push(record);if(task.needsAnswerConfirmation){syncAnswerWorkflow(task);grading.startStandardGrading(workflowTask(task),standardRecords(task));}
    try{previewStorage.setItem(KEY,JSON.stringify(store));}catch{Object.assign(store,JSON.parse(beforeSubmission));throw new Error('保存失败，当前选择已保留，请释放存储空间后重试。');} parentRefresh();
  };
  const recoverPendingSubmission=()=>{const pending=pendingUpload;if(!pending?.requestId||pending.studentId!==guardianId)return false;const saved=store.submissions.find(r=>r.taskId===pending.taskId&&r.itemId===pending.itemId&&r.studentId===guardianId&&r.requestId===pending.requestId);if(!saved)return false;pendingUpload=null;persistPending();uploadMessage='本项已提交。';parentRefresh();return true;};
  async function validateSelectedMedia(file,type){
    const url=URL.createObjectURL(file);
    try{await new Promise((resolve,reject)=>{const media=document.createElement(type);let finished=false;const finish=error=>{if(finished)return;finished=true;clearTimeout(timer);media.removeAttribute('src');media.load?.();error?reject(error):resolve();};const timer=setTimeout(()=>finish(new Error('无法读取文件时长，请重新选择。')),4000);media.preload='metadata';media.onloadedmetadata=()=>{const error=grading.homeworkMediaDurationError(type,media.duration);finish(error?new Error(error):null);};media.onerror=()=>finish(new Error('无法读取文件时长，请重新选择。'));media.src=url;});}finally{URL.revokeObjectURL(url);}
  }
  const stageUpload = async (task,item,file) => {
    const child=guardianId,version=latestVersion(task.id,item.id),error=grading.homeworkFileError(file.name,file.size,item.type,item.gradingEnabled===true);if(error){uploadMessage=error;parentRefresh();return;}
    uploadBusy=true;uploadMessage='正在检查并暂存文件…';parentRefresh();
    try{
      if(item.type==='file'){const invalid=grading.homeworkDocumentError(file.name,new Uint8Array(await file.arrayBuffer()));if(invalid)throw new Error(invalid);}
      const id='submission-file-'+child+'-'+Date.now(),url=URL.createObjectURL(file);
      if(item.type==='video'||item.type==='audio')await validateSelectedMedia(file,item.type);
      await storeMaterialFile(id,file);materialUrls.set(id,url);
      if(guardianId!==child)return;
      pendingUpload={taskId:task.id,itemId:item.id,studentId:child,accountId:familyAccount(),name:file.name,type:item.type,uploadState:'complete',previewState:item.type==='file'?'pending':'ready',expectedVersion:version,media:url,path:url,id,transient:false,saved:true};persistPending();uploadMessage='文件已暂存，尚未提交。';
    }catch(error){uploadMessage=error.message||'文件暂存失败，原选择保留，请重试。';}finally{uploadBusy=false;parentRefresh();}
  };
  if(typeof window.addEventListener==='function')window.addEventListener('storage',event=>{if(documentationMode||event.key!==KEY||!event.newValue||localPageDemo?.snapshot)return;try{const remote=JSON.parse(event.newValue);if(Array.isArray(remote.tasks)&&Array.isArray(remote.submissions)){Object.assign(store,remote);refreshMaterialView();}}catch{}});
  const latestVersion=(taskId,itemId)=>latestRows(store.submissions.filter(r=>r.taskId===taskId&&r.itemId===itemId&&r.studentId===guardianId))[0]?.version||0;
  const resolvePhoto=photo=>{restoreMaterialFile(photo);return photo.unavailable?'':photo.path;};
  const renderTeacherInstructions=(task,compact=false)=>`${task.description?.trim()?compact?`<div class="hp-inline-instructions"><p>${escape(task.description)}</p></div>`:`<div class="${compact?'hp-inline-instructions':'hp-card hp-teacher-instructions'}"><details><summary>老师的要求<span class="hp-requirement-expand">展开</span><span class="hp-requirement-collapse">收起</span></summary><p>${escape(task.description)}</p></details></div>`:''}${task.changes?.length?`<details class="hp-card"><summary>老师已更新任务 · 查看变更记录</summary>${task.changes.map(c=>`<p>${escape(new Date(c.at).toLocaleString('zh-CN',{hour12:false}))} · ${escape(grading.homeworkChangeLabel(c.action))} · ${escape(c.reason)}</p><details><summary>变更前后</summary><pre>${escape(grading.homeworkSnapshotText(c.before))}</pre><pre>${escape(grading.homeworkSnapshotText(c.after))}</pre></details>`).join('')}</details>`:''}`;
  function renderPendingPhotos(pending,item,record){
    return `<div class="hp-pending hp-photo-selection hp-compact-photos"><div class="hp-photo-selection-head"><strong>待提交 · ${pending.photos.length} 张</strong>${pending.photos.length<9?`<button class="hp-photo-add" ${uploadBusy?'disabled':''} onclick="homeworkPrototype.openParentPhotoSource('${pending.taskId}','${pending.itemId}')"><span aria-hidden="true">＋</span>添加照片</button>`:''}</div><div class="hp-photo-grid">${pending.photos.map((photo,i)=>`<div class="hp-photo-cell"><div class="hp-photo-thumb"><button class="hp-photo-open" aria-label="查看第 ${i+1} 张照片" onclick="homeworkPrototype.openPaper(this)"><img src="${escape(resolvePhoto(photo))}" alt="待提交第 ${i+1} 页"></button><button class="hp-photo-delete" aria-label="移除第 ${i+1} 张照片" ${uploadBusy?'disabled':''} onclick="homeworkPrototype.removePendingPhoto(${i})">×</button>${pending.photos.length>1?`<span class="hp-photo-index">${i+1}</span>`:''}</div>${photo.error||photo.unavailable?`<p class="hp-photo-failure" role="alert">${escape(photo.error||'照片不可用，请重新选择')}${photo.error?`<button ${uploadBusy?'disabled':''} onclick="homeworkPrototype.retryPendingPhoto(${i})">重试本张</button>`:''}</p>`:''}</div>`).join('')}</div>${item.expectedPages?`<p>老师预计 ${item.expectedPages} 页</p>`:''}${record?'<p>提交后更新当前版本，历史记录保留。</p>':''}<div class="hp-photo-submit-actions"><button class="hp-primary" ${uploadBusy||!pending.photos.length?'disabled':''} onclick="homeworkPrototype.confirmUpload()">${uploadBusy?'正在提交…':'提交'}</button></div>${uploadMessage?.includes('新版本')?`<button class="hp-secondary" onclick="homeworkPrototype.mergeLatestPhotos()">查看并合并最新照片</button><button class="hp-secondary" onclick="homeworkPrototype.replaceLatestPhotos()">核对后替换最新版本</button>`:''}</div>`;
  }

  function newPhotoPending(task,item,photos=[]){return {taskId:task.id,itemId:item.id,studentId:guardianId,accountId:familyAccount(),type:'photo',expectedVersion:latestVersion(task.id,item.id),photos,path:photos[0]?.path||'',media:photos[0]?.path||'',name:'作业照片'};}
  function addDemoPhoto(task,item,photo,index){
    if(closedTask(task)){uploadMessage='任务已结束，不能提交。';parentRefresh();return;}
    const current=pendingUpload?.taskId===task.id&&pendingUpload.itemId===item.id&&pendingUpload.studentId===guardianId?pendingUpload:null;
    const photos=current?.photos||[];if(photos.length>=9){uploadMessage='每项最多 9 张，请先移除照片。';parentRefresh();return;}
    photos.push({id:'demo-photo-'+Date.now()+'-'+photos.length,path:demoPhotoAsset(photo),name:photo.name,saved:true,demoPhotoIndex:index});pendingUpload=current||newPhotoPending(task,item);pendingUpload.photos=photos;pendingUpload.media=photos[0].path;pendingUpload.path=photos[0].path;pendingUpload.demoPhotoIndex=index;persistPending();
  }
  async function stagePhotoFiles(task,item,files){
    if(!files.length||closedTask(task)||!targetIds(task).includes(guardianId))return;
    const child=guardianId;let pending=pendingUpload?.taskId===task.id&&pendingUpload.itemId===item.id&&pendingUpload.studentId===child?pendingUpload:newPhotoPending(task,item);
    if(!pending.photos)pending.photos=[];
    if(pending.photos.length+files.length>9){uploadMessage='每项最多 9 张，当前选择已保留。';parentRefresh();return;}
    uploadMessage='';pendingUpload=pending;uploadBusy=true;parentRefresh();
    for(const file of files){
      const error=grading.homeworkFileError(file.name,file.size,'photo',false);if(error){uploadMessage=file.name+'：'+error;continue;}
      if(pending.photos.some(p=>p.name===file.name&&p.size===file.size)&&!window.confirm(file.name+' 可能已添加，仍然保留吗？'))continue;
      const id='submission-'+child+'-'+Date.now()+'-'+Math.random().toString(36).slice(2),photo={id,name:file.name,size:file.size,path:URL.createObjectURL(file),saved:false,error:''};pending.photos.push(photo);materialUrls.set(id,photo.path);
      try{await new Promise((resolve,reject)=>{const image=document.createElement('img');image.onload=resolve;image.onerror=()=>{photo.validationError=true;reject(new Error('图片无法读取，请移除后重新选择。'));};image.src=photo.path;});await storeMaterialFile(id,file);photo.saved=true;}catch(error){photo.error=error.message||'本张暂存失败，请重试；其他照片已保留。';}
    }
    uploadBusy=false;if(guardianId===child&&pendingUpload===pending){persistPending();parentRefresh();}
  }
  function confirmPhotoBatch(){
    if(uploadBusy||recoverPendingSubmission())return;const pending=pendingUpload,task=taskById(pending.taskId),item=task?.items.find(i=>i.id===pending.itemId);
    if(!item||pending.studentId!==guardianId||!targetIds(task).includes(guardianId))return;
    if(closedTask(task)){uploadMessage='任务已撤回、终止或补交已结束，照片已保留，请联系老师。';parentRefresh();return;}
    if(latestVersion(task.id,item.id)!==pending.expectedVersion){uploadMessage='已有新版本，请查看最新内容后再决定合并或替换。';parentRefresh();return;}
    if(!pending.photos.length||pending.photos.length>9||pending.photos.some(p=>p.error||p.unavailable||!p.saved)){uploadMessage='请先处理失败或不可用的照片。';parentRefresh();return;}
    if(item.expectedPages&&item.expectedPages!==pending.photos.length&&!window.confirm('老师预计 '+item.expectedPages+' 页，当前 '+pending.photos.length+' 张。请核对，仍然提交吗？'))return;
    if(pending.expectedVersion&&!window.confirm('本次将保存 '+pending.photos.length+' 张为新的完整版本，旧版仍保留。确认提交吗？'))return;
    try{submitRecord(task,item,pending.photos.length+' 张作业照片',pending.photos[0].path,'',null,pending.photos.map(p=>({...p})));pendingUpload=null;persistPending();uploadMessage='';parentRefresh();}catch(e){uploadMessage=e.message;parentRefresh();}
  }
  function renderManagement(task){
    const original=taskById(task.id),own=workScope.view!=='school'&&original.publishedBy===workScope.teacherId&&original.classIds.every(id=>subjectClassIds(original.subject).includes(id));
    const inactive=Boolean(task.withdrawnAt||task.stoppedAt),status=task.withdrawnAt?'已撤回':task.stoppedAt?'已终止':'任务管理';
    const changes=[...(task.changes||[])].reverse();
    const history=changes.length?`<details class="hp-management-history"><summary><span>变更记录</span><span class="hp-management-history-meta">${changes.length} 条<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 4 4 4-4 4"/></svg></span></summary><ol>${changes.map(c=>`<li><div class="hp-management-event"><strong>${escape(grading.homeworkChangeLabel(c.action))}</strong><time>${escape(new Date(c.at).toLocaleString('zh-CN',{hour12:false}))}</time></div><p>${escape(c.reason||'未填写变更原因')}</p><details class="hp-management-diff"><summary>查看变更前后</summary><div><h4>变更前</h4><pre>${escape(grading.homeworkSnapshotText(c.before))}</pre><h4>变更后</h4><pre>${escape(grading.homeworkSnapshotText(c.after))}</pre></div></details></li>`).join('')}</ol></details>`:'';
    return `<section class="hp-card hp-management-card" aria-label="任务状态与管理"><header class="hp-management-header"><span class="hp-management-status${inactive?' is-inactive':''}">${inactive?'<span aria-hidden="true">−</span>':''}${status}</span>${own?`<button class="hp-management-action" onclick="homeworkPrototype.openTaskManagement(${inactive?"'copy'":''})">${inactive?'<svg viewBox="0 0 20 20" aria-hidden="true"><rect x="7" y="6" width="10" height="11" rx="2"/><path d="M12 6V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3"/></svg>再发一份':'管理任务'}</button>`:''}</header>${task.managementReason?.trim()?`<div class="hp-management-reason"><span>${task.withdrawnAt?'撤回原因':task.stoppedAt?'终止原因':'变更原因'}</span><p>${escape(task.managementReason)}</p></div>`:''}${inactive?'<p class="hp-management-preserved"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 8 3 3 7-7"/></svg>已有提交记录和批改结果已保留</p>':''}${own&&original.notification?.status==='failed'?'<div class="hp-management-notification" role="status"><span>任务已保存，通知发送失败</span><button onclick="homeworkPrototype.retryNotification()">重试通知</button></div>':''}${history}</section>`;
  }
  function renderFamilyPreview(){return familyPreview?`<div class="hp-filter-mask"><section class="hp-filter-sheet" role="dialog" aria-modal="true" aria-label="家长内容预览"><header><h2>${escape(draft.title)}</h2><button class="hp-sheet-text-action" onclick="homeworkPrototype.closeFamilyPreview()">关闭预览</button></header><p>仅预览，不会发送或提交。</p>${renderTeacherInstructions(draft)}${renderMaterialAttachments(draft)}${draft.items.map(i=>`<section class="hp-card"><strong>${escape(i.title)}</strong><p>${escape(i.instruction)}</p><small>${escape(typeLabel(i.type))} · ${i.gradingEnabled?'自动批改':'仅收集，不批改'}${i.expectedPages?' · 预计 '+i.expectedPages+' 页':''}</small></section>`).join('')}<p>正常截止 ${escape(draft.deadline)}<br>补交截止 ${escape(draft.submitDeadline)}</p></section></div>`:'';}
  const managementLabels={withdraw:'撤回任务',extend:'延长截止',reopen:'重新开放补交',correct:'更正文字说明',stop:'终止连续打卡',copy:'再发一份'};
  function renderManagementActions(task){
    const available=Object.entries(managementLabels).filter(([id])=>id==='copy'||(!task.withdrawnAt&&!task.stoppedAt&&(id!=='stop'||task.kind==='checkin')&&(id!=='extend'||!closedTask(task))&&(id!=='reopen'||closedTask(task))));
    const hints={extend:'调整截止时间，已有提交保持不变',reopen:'为未完成的学生重新开放补交',correct:'修改任务要求和文字说明',copy:'复制到新草稿，编辑后再发布',withdraw:'停止接收提交，已有记录保留',stop:'终止指定期次及后续打卡，保留已有记录'};
    const row=([id,label])=>`<button type="button" class="hp-management-menu-item${['withdraw','stop'].includes(id)?' is-destructive':''}" onclick="homeworkPrototype.chooseManagement('${id}')"><span><strong>${label}</strong><small>${hints[id]}</small></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m6 4 4 4-4 4"/></svg></button>`;
    const normal=available.filter(([id])=>!['withdraw','stop'].includes(id)),destructive=available.filter(([id])=>['withdraw','stop'].includes(id));
    return `<p class="hp-management-menu-note">选择要进行的操作</p><div class="hp-management-menu">${normal.map(row).join('')}</div>${destructive.length?`<div class="hp-management-menu hp-management-menu-danger">${destructive.map(row).join('')}</div>`:''}`;
  }
  function renderManagementDialog(){
    if(!management)return '';const task=taskById(management.taskId);if(!task)return '';const m=management;
    let body=!m.action?renderManagementActions(task):`<p class="hp-management-form-note">已有 ${studentRows(task).filter(s=>s.records.length).length} 人提交；历史提交和结果保留。</p>${['extend','reopen'].includes(m.action)?`<label>正常截止<input aria-label="新的正常截止" type="datetime-local" value="${escape(m.input.deadline.replace(' ','T'))}" onchange="homeworkPrototype.setManagementField('deadline',this.value.replace('T',' '))"></label><label>补交截止<input aria-label="新的补交截止" type="datetime-local" value="${escape(m.input.submitDeadline.replace(' ','T'))}" onchange="homeworkPrototype.setManagementField('submitDeadline',this.value.replace('T',' '))"></label>`:''}${m.action==='correct'?`<label>老师的要求<textarea aria-label="更正总说明" oninput="homeworkPrototype.setManagementField('description',this.value)">${escape(m.input.description)}</textarea></label>${m.input.itemTexts.map((i,n)=>`<label>第 ${n+1} 项标题<input aria-label="更正第 ${n+1} 项标题" value="${escape(i.title)}" oninput="homeworkPrototype.setManagementItem(${n},'title',this.value)"></label><label>第 ${n+1} 项说明<textarea aria-label="更正第 ${n+1} 项说明" oninput="homeworkPrototype.setManagementItem(${n},'instruction',this.value)">${escape(i.instruction)}</textarea></label>`).join('')}`:''}${m.action==='stop'?`<label>从第几期起终止<input type="number" min="1" max="${task.cycleCount||30}" aria-label="终止起始期次" value="${m.input.fromCycle}" onchange="homeworkPrototype.setManagementField('fromCycle',Number(this.value))"></label><p>将终止第 ${m.input.fromCycle} 期起的后续期次，已有记录保留。</p>`:''}<label>变更原因<textarea aria-label="变更原因" oninput="homeworkPrototype.setManagementField('reason',this.value)">${escape(m.input.reason)}</textarea></label>${m.error?`<p class="hp-error" role="alert">${escape(m.error)}</p>`:''}<button class="hp-primary" onclick="homeworkPrototype.saveTaskManagement()">${m.confirm?'确认执行，保留历史记录':'核对本次变更'}</button>`;
    return `<div class="hp-filter-mask"><section class="hp-filter-sheet hp-task-management-sheet" role="dialog" aria-modal="true" aria-labelledby="hp-management-dialog-title"><header><h2 id="hp-management-dialog-title">${escape(managementLabels[m.action]||'管理任务')}</h2><button type="button" class="hp-sheet-text-action" onclick="homeworkPrototype.closeTaskManagement()">取消</button></header>${body}</section></div>`;
  }

  // Documentation fixtures use the production prototype renderers and an isolated in-memory store.
  const documentationScenes = [
    ['teacher-home','教师首页与同排筛选','正常首页，包含草稿入口、任务数量和筛选。'],
    ['draft-list','草稿列表','两份独立草稿；不是同一草稿的覆盖副本。'],
    ['draft-delete','删除草稿确认','实际删除确认弹窗；截图不执行删除。'],
    ['draft-read-error','草稿读取失败','注入本地读取异常，走现有失败分支。'],
    ['draft-save-error','草稿保存失败','注入本地存储失败，原内容保留。','bottom'],
    ['draft-expired','过期草稿','实际时间校验阻止继续。'],
    ['compose-uniform','统一设置图片与默认批改','多个图片项统一设置；自动批改默认选中。','settings'],
    ['compose-file-no-grading','文件项设为无需批改','同一作业可按项关闭批改，不影响其他图片项。','settings'],
    ['compose-mixed','逐项提交和批改设置','图片、视频、文件、线下确认；非批改项不进入自动批改。','bottom'],
    ['compose-required','必填错误定位','清空详情且没有附件后点击下一步，走实际校验。','bottom'],
    ['compose-no-supplement','关闭补交与截止','关闭补交后两个截止一致。','bottom'],
    ['recipients-mixed','逐班全班与部分','当前原型有两个授权班级样例，不作为三班真机验收。'],
    ['recipients-picker','选择本班学生','实际学生选择层及人数。'],
    ['recipients-empty-search','搜索无结果','无匹配不清除已选择学生。'],
    ['recipients-zero','部分0人','实际下一步校验，停留问题班级。'],
    ['publish-review','最终核对','内容、双截止、逐班接收范围；可向下查看。'],
    ['publish-review-roster','核对接收人明细','核对页下半屏，展示逐班范围和人数。','bottom'],
    ['publish-network','发布失败保留内容','现有发布网络异常演示；没有真实发送请求。','bottom'],
    ['publish-roster','发布时名单变化','现有名单变化拦截，不伪造服务器鉴权。','bottom'],
    ['publish-success','发布成功回执','实际本地保存成功；不代表通知已送达。'],
    ['management-menu','任务管理入口','仅本人仍有权的任务显示管理操作。'],
    ['management-withdraw-confirm','撤回确认','实际原因、影响与最终确认界面。'],
    ['management-withdraw-parent','家长查看已撤回任务','保留已有提交，停止新增提交。'],
    ['management-extend-confirm','延长截止确认','实际校验只允许延长。'],
    ['management-extend-parent','家长查看延期与变更','展开要求可见最新双截止；历史提交保留。'],
    ['management-reopen-confirm','重新开放补交确认','已结束任务设置未来截止。'],
    ['management-reopen-parent','家长重新获得补交入口','原提交及历史保留。'],
    ['management-correct-confirm','更正要求确认','只更正文字，不新增提交方式。'],
    ['management-correct-parent','家长查看更正要求','实际修订记录与最新文字。'],
    ['management-stop-confirm','终止连续打卡确认','指定从哪一期终止，说明已有历史保留。'],
    ['management-stop-parent','终止期次只读','实际终止状态与原因。'],
    ['management-save-error','任务变更保存失败','注入本地保存失败；未应用更改。'],
    ['management-stale','任务变更版本冲突','模拟其他操作更新修订号，实际旧版本校验拦截。'],
    ['parent-child-one','孩子一的待提交内容','双孩子演示：李涵的待提交选择。'],
    ['parent-child-two','切到另一个孩子','实际切换到王博，不带入李涵的选择。'],
    ['parent-child-return','切回原孩子恢复选择','实际往返切换，恢复原孩子的待提交内容。'],
    ['parent-binding-removed','绑定解除后的权限反馈','隔离演示绑定解除，不等同服务器旧链接鉴权验收。'],
    ['parent-pending','家长待完成列表','未提交、部分完成和补交样例。'],
    ['parent-completed','家长已完成列表','完成分组不受批改是否结束影响。'],
    ['parent-ended','家长已结束列表','已结束或撤回的只读样例。'],
    ['parent-empty','家长无作业','现有空列表演示。'],
    ['parent-load-error','家长列表查询失败','现有列表失败演示，与空列表分开。'],
    ['parent-expanded','要求与截止展开','实际展开区，保留教师真实填写说明。'],
    ['parent-closed','补交已结束只读','保留原提交，隐藏提交入口。'],
    ['photo-pending','多图待提交','真实样图、累计数量、移除及提交。'],
    ['photo-overlimit','添加超过9张','调用实际添加逻辑；拒绝第10张，保留已有9张。'],
    ['photo-last-removed','移除最后一张','移除后仍可添加，不能提交空集合。'],
    ['photo-one-failed','单张照片暂存失败','隔离失败文件状态，保留另一成功图片。'],
    ['photo-network','待提交照片网络中断','替换旧图3；画面必须同时看到待提交选择。'],
    ['photo-resubmit','旧提交与新选择并存','新版本提交成功前旧版本继续有效。'],
    ['photo-resubmit-pending','重交的新选择核对区','接上一屏查看新选择；提交成功前旧版本不替换。','selection'],
    ['photo-version-conflict','多家长重交冲突','实际版本检查，展示合并/替换选择。'],
    ['photo-version-conflict-actions','冲突后的合并与替换','接上一屏向下查看实际核对操作。','selection'],
    ['file-version-conflict','文件重交冲突','实际版本检查，使用当前文件需再次核对。'],
    ['file-conflict-resolved','冲突核对后保存新版本','实际使用当前文件并确认，旧版进入历史。'],
    ['file-save-error','重交保存失败保留旧版','注入本地提交保存失败，旧版仍有效，新选择保留。'],
    ['pending-save-error','离开时暂存失败','本地暂存失败，阻止离开并保留选择。'],
    ['video-pending','视频待提交','使用真实演示视频，可播放后确认提交。'],
    ['video-submitted','视频提交成功','仅记录提交，不生成对错。'],
    ['offline-pending','线下完成确认入口','实际家长确认入口，不生成媒体。'],
    ['offline-submitted','线下确认完成','实际确认时间和完成状态。'],
    ['student-first','教师学生浏览首位','当前姓名、班级、位置及首位箭头边界。'],
    ['student-next','教师切到下一位','同一名单下一学生，身份、位置和内容同步。'],
    ['student-media','本人照片与视频','向下浏览同一学生其他作业项。','bottom'],
    ['student-question-filter','题目答错筛选','当前题目筛选结果，不复用完整班级人数。','bottom'],
    ['student-question-detail','从答错题进入学生记录','沿用本题答错名单，不复用完整班级人数。'],
    ['student-preview-photo','教师连续媒体预览','媒体人数与完整班级名单人数分别计数。'],
    ['student-preview-next','预览切至下一学生','进入下一学生首份可用内容，身份与计数同步。'],
    ['student-preview-video','同一学生内切至视频','只在本人媒体范围切换，首尾停止；原视频需暂停。'],
    ['review-dialog','教师实际复核操作','原图与AI判定对照；判对、判错、暂缓和保存。'],
    ['review-save-error','复核保存失败','注入本地保存失败，原判定不被改写。'],
    ['review-version-conflict','复核旧版本冲突','模拟家长已重交，实际版本/签名检查拦截。','bottom'],
    ['review-unreadable','识别不清','现有待处理题目状态，不伪造题框。','bottom'],
    ['review-no-answer','无答案待处理','切到另一题查看无答案状态，不计作错误。','bottom'],
    ['student-not-submitted','教师查看未提交学生','家长本地待提交不计入教师已交数据。'],
    ['grading-queued','照片已提交等待批改','提交已完成，批改尚未完成，不回退为未提交。'],
    ['stats-overview','任务概况与名单入口','目标人数、交齐和未交齐可继续查看名单。'],
    ['stats-no-valid','没有有效判定','有效分母为0，正确率显示横线。'],
    ['stats-unknown','无可靠批改数据','无来源的概览统计不显示。'],
    ['school-readonly','学校视角只读','不提供发布、草稿编辑和任务管理。'],
    ['school-no-media','学校视角不展示原件','学生统计可见，原始媒体与改判入口隐藏。'],
    ['parent-not-assigned','孩子不在接收范围','只展示当前孩子有权任务；不等同服务端旧链接鉴权。'],
    ['attachment-optimizing','图片准备与优化中','隔离演示优化阶段，不能冒充真实上传进度。'],
    ['attachment-uploading','原件上传中','隔离模拟进度；不代表OSS实际网络上传。'],
    ['attachment-partial-failed','附件部分上传失败','成功文件保留，失败项可重传/移除。'],
    ['file-encrypted','加密PDF校验失败','调用实际本地加密检测，旧提交不撤销。'],
    ['file-size','文件超过演示大小限制','按现有演示参数校验；不作为上线额度。'],
    ['file-invalid','损坏PDF校验失败','使用坏文件样例调用本地容器校验，未调用后端。'],
    ['file-format','文件类型不符合要求','调用实际格式校验，保留已有提交。'],
    ['video-duration','视频时长超限','已确认视频上限3分钟；异常在隔离会话中演示。'],
    ['temporary-file-expired','临时文件已失效','现有不可用图片反馈，需重选。'],
  ];
  function prepareDocumentationScene(id) {
    if(!documentationMode||!documentationScenes.some(row=>row[0]===id))return false;
    documentationFault='';documentationStorage.clear();restoreLocalDemo();management=null;gradeReviewDraft=null;materialPreview=null;materialListTaskId='';parentPhotoSource=null;pendingUpload=null;pendingLastId='';uploadMessage='';uploadBusy=false;draftNotice='';draftStorageError='';draftDelete=null;draftMenu=null;recipientPickerOpen=false;recipientSearch='';composeError='';rosterReviewRequired=false;publishDemoBranch='normal';gradeUI={page:0,q:'',wrongOnly:false,parentOpen:false,origin:'detail'};questionBrowseIds=null;rosterItemId='';teacherStudentId='';teacherFilter='all';detailClassId='c1';parentTaskId='';parentTaskTab='pending';
    draft=newDraft();composeStep=0;settingMode='uniform';uniformType='';
    store=seed();window.workbenchPrototype.demoIdentity('all');window.workbenchPrototype.view('subject');window.workbenchPrototype.class('c1');teacherTab='homework';go('teacherDesk');
    api.prepareConsoleScenario('released');const task=taskById('homework-console-v1'),child=schoolDemoRoster.GUARDIAN_STUDENT_ID;
    guardianId=child;task.title='周三分数练习';task.description='完成练习第3页，拍清完整作答过程；订正后再提交订正页。';task.items[0].title='完成第3页练习';task.items[1].title='提交订正页';
    const current=()=>latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.studentId===child));
    const first=()=>current().find(r=>r.itemId===task.items[0].id);
    const photo=(n=0)=>({id:'documentation-photo-'+n,path:demoPhotoAsset(parentDemoPhotos[n]),name:'第'+(n+1)+'页.jpg',saved:true});
    const parent=()=>{go('parent');window.parentPrototype.scenario?.('twoChildren');window.parentPrototype.tab('homework');api.openParent(task.id);};
    const teacher=()=>{teacherTab='homework';go('teacherDesk');api.openTeacher(task.id);};
    const pending=(count=2)=>{pendingUpload=newPhotoPending(task,task.items[0],Array.from({length:count},(_,n)=>photo(n%2)));persistPending();};
    const fillDraft=()=>{draft={...newDraft(),title:'周三分数练习',titleCustomized:true,description:task.description,items:task.items.map(i=>({...i})),classIds:['c1','c2'],recipientModes:{c1:'all',c2:'selected'},targetStudentIds:students.filter(s=>s.classId==='c2').slice(0,2).map(s=>s.id)};settingMode='individual';uniformType='photo';composeStep=0;teacherMode='compose';saveTeacherDraft();};
    const docFile=()=>({id:'documentation-pdf',type:'file',name:'练习要求.pdf',path:'assets/homework-demo-files/campus-intro.pdf',size:55331,source:'文档演示样例',uploadState:'complete',previewState:'ready'});
    const makeVideo=()=>{task.items=[{id:'documentation-video',title:'口述解题过程',instruction:'录制解题讲解视频。',type:'video',required:true,gradingEnabled:false}];store.submissions=store.submissions.filter(r=>r.taskId!==task.id);};
    if(id.startsWith('draft-')||id.startsWith('compose-')||id.startsWith('recipients-')||id.startsWith('publish-')||id.startsWith('attachment-')){
      fillDraft();
      if(id==='draft-list'||id==='draft-delete'||id==='draft-read-error'){api.newTeacherDraft();draft.title='阅读记录补充';draft.description='阅读20分钟后记录收获。';saveTeacherDraft();api.openTeacherDrafts();if(id==='draft-delete')api.deleteTeacherDraft();if(id==='draft-read-error'){documentationFault='read';teacherRefresh();}}
      if(id==='draft-save-error'){documentationFault='save';api.setTitle('草稿内容继续保留');}
      if(id==='draft-expired'){draft.deadline=addDays(formatDate(new Date()),-1);teacherMode='compose';}
      if(id==='compose-uniform'){settingMode='uniform';uniformType='photo';}if(id==='compose-file-no-grading'){draft.items[0].type='file';draft.items[0].gradingEnabled=false;expandedItemIndex=0;}
      if(id==='compose-mixed'){draft.items=[...draft.items,{id:'doc-v',title:'录制一道题的解题视频',instruction:'',type:'video',required:true,gradingEnabled:false},{id:'doc-f',title:'填写练习文档',instruction:'',type:'file',required:true,gradingEnabled:true},{id:'doc-n',title:'完成20分钟课外阅读',instruction:'',type:'none',required:true,gradingEnabled:false}];}
      if(id==='compose-required'){draft.description='';api.nextCompose();}
      if(id==='compose-no-supplement')api.setAllowSupplement(false);
      if(id.startsWith('recipients-')){composeStep=1;if(id==='recipients-picker'||id==='recipients-empty-search'){recipientClassId='c2';recipientPickerOpen=true;if(id==='recipients-empty-search')recipientSearch='不存在的姓名';}if(id==='recipients-zero'){draft.targetStudentIds=[];api.nextCompose();}}
      if(id.startsWith('publish-')){teacherMode='preview';composeStep=1;if(id==='publish-network'||id==='publish-roster'){publishDemoBranch=id==='publish-network'?'network':'roster';api.publish();}if(id==='publish-success')api.publish();}
      if(id.startsWith('attachment-')){draft.attachments=[docFile(),{...docFile(),id:'doc-failed',name:'补充说明.pdf',uploadState:id==='attachment-uploading'?'uploading':'failed',uploadProgress:38,uploadError:'上传中断，请重新上传'}];if(id==='attachment-optimizing')draft.attachments=[{...docFile(),type:'image',name:'练习页.jpg',path:photo().path,uploadState:'optimizing'}];}
      teacherRefresh(true);
    } else if(id.startsWith('management-')){
      const keep=task.items[0];task.title='课外阅读记录';task.description='完成20分钟课外阅读，由家长确认。';task.items=[{...keep,title:'完成20分钟课外阅读',instruction:'阅读后确认已完成。',type:'none',gradingEnabled:false}];store.submissions=store.submissions.filter(r=>r.taskId!==task.id||r.itemId===keep.id);store.submissions.filter(r=>r.taskId===task.id).forEach(r=>{r.questions=[];r.media='';r.mock=false;r.label='家长确认已完成';});if(id.includes('reopen'))store.submissions=store.submissions.filter(r=>r.taskId!==task.id||r.studentId!==child);
      if(id.includes('reopen'))task.deadline=task.submitDeadline=addDays(formatDate(new Date()),-1);
      if(id.includes('stop')){task.kind='checkin';task.seriesId='documentation-series';task.cycleId='cycle-2';task.cycleCount=3;task.title='课外阅读记录 · 第2期';store.tasks.unshift({...JSON.parse(JSON.stringify(task)),id:task.id+'-cycle-3',cycleId:'cycle-3',title:'课外阅读记录 · 第3期',deadline:addDays(task.deadline,1),submitDeadline:addDays(task.submitDeadline,1)});}
      teacher();api.openTaskManagement();
      if(id!=='management-menu'){
        const action=id.includes('withdraw')?'withdraw':id.includes('reopen')?'reopen':id.includes('correct')?'correct':id.includes('stop')?'stop':'extend';api.chooseManagement(action);api.setManagementField('reason',action==='withdraw'?'本次练习调整，保留已提交记录。':action==='stop'?'课程调整，从本期起停止打卡。':'按课堂安排更新要求与截止。');
        if(action==='extend'||action==='reopen'){api.setManagementField('deadline',addDays(formatDate(new Date()),4));api.setManagementField('submitDeadline',addDays(formatDate(new Date()),12));}
        if(action==='correct')api.setManagementField('description','阅读范围更正为课本第12—15页，完成20分钟阅读后由家长确认。');
        api.saveTaskManagement();
        if(id==='management-stale'){task.revision=(task.revision||0)+1;api.saveTaskManagement();}
        else if(id==='management-save-error'){documentationFault='save';api.saveTaskManagement();}
        else if(id.endsWith('-parent')){api.saveTaskManagement();parent();requestAnimationFrame(()=>{document.querySelectorAll('.hp-record-task-details,.parent-main > details').forEach(d=>d.open=true);});}
      }
    } else if(id.startsWith('parent-')){
      parent();
      if(['parent-pending','parent-completed','parent-ended','parent-empty','parent-load-error','parent-not-assigned'].includes(id)){parentTaskId='';parentTaskTab=id==='parent-completed'?'completed':id==='parent-ended'?'ended':'pending';if(id==='parent-pending'){const a={...task,id:'documentation-today',title:'今日计算练习',deadline:formatDate(new Date(new Date().setHours(20,0,0,0))),submitDeadline:addDays(formatDate(new Date()),7)};const b={...task,id:'documentation-partial',title:'阅读与订正',deadline:addDays(formatDate(new Date()),1)};const c={...task,id:'documentation-late',title:'周一练习补交',deadline:addDays(formatDate(new Date()),-1)};store.tasks=[a,b,c];store.submissions=[{...first(),taskId:b.id}];}if(id==='parent-not-assigned'){store.tasks=[{...task,targetSnapshotIds:students.filter(s=>s.id!==child).map(s=>s.id)}];}parentRefresh(true);if(id==='parent-empty'||id==='parent-load-error')api.applyPageDemo(id==='parent-empty'?'empty':'load-failed','parent');}
      if(id.startsWith('parent-child-')){store.submissions=store.submissions.filter(r=>r.taskId!==task.id||r.studentId!==child);pending(1);if(id!=='parent-child-one'){window.parentPrototype.selectChild(1);if(id==='parent-child-return')window.parentPrototype.selectChild(0);api.openParent(task.id);}parentRefresh(true);}if(id==='parent-binding-removed')window.parentPrototype.exception('bindingRemoved');
      if(id==='parent-expanded')requestAnimationFrame(()=>{const d=document.querySelector('.hp-record-task-details');if(d)d.open=true;});
      if(id==='parent-closed'){task.deadline=task.submitDeadline=addDays(formatDate(new Date()),-1);parentRefresh(true);}
    } else if(id==='grading-queued'){api.prepareConsoleScenario('queued');parent();
    } else if(id.startsWith('photo-')||id==='pending-save-error'||id==='temporary-file-expired'){
      parent();if(!['photo-resubmit','photo-resubmit-pending','photo-version-conflict','photo-version-conflict-actions'].includes(id))store.submissions=store.submissions.filter(r=>r.taskId!==task.id||r.studentId!==child);
      pending(id==='photo-overlimit'?9:id==='photo-last-removed'?1:2);
      if(id==='photo-overlimit'){parentPhotoSource={taskId:task.id,itemId:task.items[0].id,chat:true};api.useParentChatDemoPhoto(0);parentPhotoSource=null;}
      if(id==='photo-last-removed')api.removePendingPhoto(0);
      if(id==='photo-one-failed'){pendingUpload.photos[1].saved=false;pendingUpload.photos[1].error='本张暂存失败，请重试或移除';}
      if(id==='temporary-file-expired'){pendingUpload.photos[1].unavailable=true;pendingUpload.photos[1].error='临时文件已失效，请移除后重新选择';}
      if(id.startsWith('photo-version-conflict')){pendingUpload.expectedVersion=0;api.confirmUpload();}
      if(id==='pending-save-error'){documentationFault='pending';api.toParentList();}
      if(id==='photo-network')api.applyPageDemo('upload-network','parent');parentRefresh(true);
    } else if(id==='file-version-conflict'||id.startsWith('file-')||id==='video-duration'){
      task.items=[{id:'documentation-file',title:'上传练习文档',instruction:'提交PDF或Word文档。',type:'file',required:true,gradingEnabled:true}];store.submissions=store.submissions.filter(r=>r.taskId!==task.id);store.submissions.push({taskId:task.id,itemId:task.items[0].id,studentId:child,submittedAt:formatDate(new Date()),version:1,label:'练习.pdf',media:'assets/homework-demo-files/campus-intro.pdf',questions:[]});parent();pendingUpload={taskId:task.id,itemId:task.items[0].id,studentId:child,accountId:familyAccount(),type:'file',path:'assets/homework-demo-files/campus-intro.pdf',media:'assets/homework-demo-files/campus-intro.pdf',name:'新练习.pdf',saved:true,expectedVersion:['file-version-conflict','file-conflict-resolved'].includes(id)?0:1};persistPending();
      if(id==='file-version-conflict'||id==='file-conflict-resolved'){api.confirmUpload();if(id==='file-conflict-resolved'){api.acknowledgePendingVersion();api.confirmUpload();}}if(id==='file-save-error'){documentationFault='save';api.confirmUpload();}
      if(id==='file-encrypted')uploadMessage=grading.homeworkDocumentError('加密.pdf',new Uint8Array(Array.from('%PDF-1.7 /Encrypt 1 %%EOF').map(c=>c.charCodeAt(0))));
      if(id==='file-size')uploadMessage=grading.homeworkFileError('过大.pdf',51*1024*1024,'file',true);
      if(id==='file-invalid')uploadMessage=grading.homeworkDocumentError('损坏.pdf',new Uint8Array([1,2,3,4]));
      if(id==='file-format')uploadMessage=grading.homeworkFileError('练习.xlsx',100,'file',true);
      if(id==='video-duration'){task.items[0].type='video';task.items[0].title='口述解题过程';task.items[0].instruction='录制解题讲解视频。';store.submissions=store.submissions.filter(r=>r.taskId!==task.id);pendingUpload.type='video';pendingUpload.media=pendingUpload.path='assets/homework-demo-files/promo-video-30s.mp4';pendingUpload.name='原已选择的30秒视频.mp4';pendingUpload.expectedVersion=0;uploadMessage='新选视频时长超限，请剪辑后重新选择。原选择保留。';persistPending();}parentRefresh(true);
    } else if(id.startsWith('video-')){
      makeVideo();parent();pendingUpload={taskId:task.id,itemId:task.items[0].id,studentId:child,accountId:familyAccount(),type:'video',path:'assets/homework-demo-files/promo-video-30s.mp4',media:'assets/homework-demo-files/promo-video-30s.mp4',name:'讲题视频.mp4',saved:true,expectedVersion:0};persistPending();if(id==='video-submitted')api.confirmUpload();else parentRefresh(true);
    } else if(id.startsWith('offline-')){
      task.items=[{id:'documentation-offline',title:'完成20分钟课外阅读',instruction:'家长确认已完成阅读。',type:'none',required:true,gradingEnabled:false}];store.submissions=store.submissions.filter(r=>r.taskId!==task.id);parent();if(id==='offline-submitted')api.submit(task.id,task.items[0].id);else parentRefresh(true);
    } else if(id.startsWith('student-')||id.startsWith('stats-')||id.startsWith('school-')||id.startsWith('review-')){
      teacher();
      if(id.startsWith('student-')){task.items.push({id:'documentation-video',title:'讲解解题过程',instruction:'',type:'video',required:true,gradingEnabled:false});store.submissions.filter(r=>r.taskId===task.id&&r.itemId===task.items[0].id).forEach(r=>{r.photos=[photo(0),photo(1)];store.submissions.push({taskId:task.id,itemId:'documentation-video',studentId:r.studentId,label:'讲题视频.mp4',media:'assets/homework-demo-files/promo-video-30s.mp4',submittedAt:r.submittedAt,version:1,questions:[]});});if(id==='student-not-submitted'){store.submissions=store.submissions.filter(r=>r.taskId!==task.id||r.studentId!==child);pending();}api.openStudents('all');api.openStudent(child);if(id==='student-next')api.changeStudent(1);if(id==='student-question-filter'||id==='student-question-detail'){const r=current().find(r=>r.questions.some(q=>!q.correct)),q=r.questions.find(q=>!q.correct);api.openGradeQuestion(q.id);api.filterGradeStudents('wrong');if(id==='student-question-detail')api.openGradedStudent(child);}if(id.startsWith('student-preview-'))requestAnimationFrame(()=>{const button=document.querySelector('.hp-student-browse .hp-paper-preview');if(button){api.openPaper(button);if(id==='student-preview-next')api.changePaperStudent(1);if(id==='student-preview-video'){api.changePaperMedia(1);api.changePaperMedia(1);api.changePaperMedia(1);}}});}
      if(id.startsWith('review-')){const r=first();r.questions[0].state=id==='review-unreadable'?'unreadable':'review';if(id==='review-no-answer')r.questions[1].state='no-answer';api.openGradeQuestion(r.questions[id==='review-no-answer'?1:0].id);api.filterGradeStudents('pending');if(id==='review-unreadable'||id==='review-no-answer'){api.filterGradeStudents('pending');}else{api.review(task.id,r.questions[0].id,undefined,child,id==='review-version-conflict');if(id==='review-save-error'){api.setGradeReviewDecision(true);documentationFault='save';api.confirmGradeReview();}if(id==='review-version-conflict'){gradeReviewDraft.choice='right';r.version=2;api.saveInlineGrade();}}}
      if(id==='stats-no-valid'){store.submissions.filter(r=>r.taskId===task.id).forEach(r=>r.questions.forEach(q=>q.state='review'));api.openQuestionResults(task.items[0].id);}
      if(id==='stats-unknown'){store.submissions.filter(r=>r.taskId===task.id).forEach(r=>{r.questions=[];delete r.gradingResult;});api.openStudents('all');api.openStudent(child);}
      if(id.startsWith('school-')){window.workbenchPrototype.view('school');teacherTab='homework';go('teacherDesk');if(id==='school-readonly')api.toTeacherList();else{api.openTeacher(task.id);api.openStudents('all');api.openStudent(child);}}
    } else {api.toTeacherList();}
    if(typeof history!=='undefined'){const url=new URL(location.href);url.searchParams.set('documentation','1');history.replaceState(null,'',url);}
    const row=documentationScenes.find(row=>row[0]===id);requestAnimationFrame(()=>{const panel=document.querySelector('#teacher-tab-panel')||document.querySelector('.parent-main');if(panel){panel.scrollTop=row[3]==='bottom'?panel.scrollHeight:0;if(row[3]==='selection'||row[3]==='settings'){const area=panel.querySelector(row[3]==='settings'?'.hp-submit-settings':'.hp-photo-selection');if(area)panel.scrollTop=area.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop-20;}}const host=document.getElementById('documentation-capture-controls');if(host){host.querySelector('select').value=id;host.querySelector('[data-note]').textContent=row[2];host.dataset.scene=id;}});return true;
  }
  if(documentationMode&&typeof document!=='undefined')requestAnimationFrame(()=>{
    const host=document.createElement('section');host.id='documentation-capture-controls';host.style.cssText='position:fixed;left:12px;top:70px;width:260px;z-index:3000;background:#192838;color:#eaf5ff;border:1px solid #46657e;border-radius:12px;padding:14px;box-sizing:border-box;font:13px/1.6 sans-serif';
    host.innerHTML='<strong>需求截图 · 隔离演示会话</strong><p>画布使用当前原型组件。所有作业/草稿变动仅在内存；未接真实上传、通知或鉴权服务。</p><label>选择截图场景<select aria-label="文档截图场景" style="width:100%;margin:8px 0;padding:9px" onchange="homeworkPrototype.prepareDocumentationScene(this.value)"><option value="">请选择</option>'+documentationScenes.map(([id,label],i)=>'<option value="'+id+'">'+(i+1)+'. '+label+'</option>').join('')+'</select></label><p data-note></p>';document.body.append(host);
  });

  const api = {
    prepareDocumentationScene, getDocumentationSceneOptions:()=>documentationMode?documentationScenes:[],
    ...workflowActions,
    resumePending(taskId,itemId){persistPending();pendingUpload=pendingMap()[taskId+':'+itemId]||null;pendingLastId=taskId+':'+itemId;parentRefresh();},
    previewFamily(){familyPreview=true;teacherRefresh();},closeFamilyPreview(){familyPreview=false;teacherRefresh();},
    setExpectedPages(index,value){const pages=value?Number(value):0;draft.items.forEach((i,n)=>{if(index===-1||index===n)i.expectedPages=pages;});saveTeacherDraft();},
    setAllowSupplement(value){draft.allowSupplement=value;draft.submitDeadline=value?addDays(draft.deadline,7):draft.deadline;draft.supplementTouched=false;teacherRefresh();},
    openTaskManagement(action=''){const task=taskById(teacherTaskId);if(!task||workScope.view==='school'||task.publishedBy!==workScope.teacherId)return;management={taskId:task.id,revision:task.revision||0,action:'',input:{},confirm:false};if(action==='copy'){this.chooseManagement('copy');return;}teacherRefresh();},
    closeTaskManagement(){management=null;teacherRefresh();},
    chooseManagement(action){if(!management)return;const task=taskById(management.taskId);if(action==='copy'){if(!archiveCurrentDraft())return;draft={...newDraft(),...JSON.parse(JSON.stringify(task)),titleCustomized:true,title:task.title+'（副本）',deadline:defaultDeadline(),submitDeadline:addDays(defaultDeadline(),7),classIds:task.classIds.filter(id=>subjectClassIds(task.subject).includes(id)),recipientModes:Object.fromEntries(task.classIds.map(id=>[id,'all'])),targetStudentIds:[]};delete draft.withdrawnAt;delete draft.stoppedAt;delete draft.changes;delete draft.notification;delete draft.revision;management=null;teacherMode='compose';composeStep=0;recognitionStale=false;settingMode='individual';saveTeacherDraft();teacherRefresh(true);return;}management.action=action;management.input={reason:'',deadline:task.deadline,submitDeadline:task.submitDeadline,description:task.description,itemTexts:task.items.map(i=>({id:i.id,title:i.title,instruction:i.instruction})),fromCycle:Number(task.cycleId?.replace('cycle-',''))||1};management.error='';management.confirm=false;teacherRefresh();},
    setManagementField(key,value){if(management){management.input[key]=value;management.confirm=false;management.error='';}},setManagementItem(n,key,value){if(management){management.input.itemTexts[n][key]=value;management.confirm=false;management.error='';}},
    saveTaskManagement(){if(!management)return;const m=management,task=taskById(m.taskId),allowed=subjectClassIds(task.subject);const error=(task.revision||0)!==m.revision?'任务已更新，请重新进入后核对。':grading.validateHomeworkChange(task,m.action,m.input,workScope.view==='school'?'':workScope.teacherId,allowed);if(error){m.error=error;teacherRefresh();return;}const affected=m.action==='stop'?store.tasks.filter(t=>t.seriesId===task.seriesId&&Number(t.cycleId?.replace('cycle-',''))>=m.input.fromCycle):[task];if(!affected.length||affected.some(t=>grading.validateHomeworkChange(t,m.action,m.input,workScope.teacherId,allowed))){m.error='部分期次状态或权限已变化，请重新选择。';teacherRefresh();return;}if(!m.confirm){m.error='';m.confirm=true;teacherRefresh();return;}const before=JSON.stringify(store);affected.forEach(t=>grading.applyHomeworkChange(t,m.action,m.input,workScope.teacherId,new Date().toISOString()));try{previewStorage.setItem(KEY,JSON.stringify(store));management=null;teacherRefresh(true);}catch{Object.assign(store,JSON.parse(before));m.error='保存失败，尚未应用变更，请重试。';teacherRefresh();}},
    retryItemGrading(taskId,itemId){const r=latestRows(store.submissions.filter(r=>r.taskId===taskId&&r.itemId===itemId&&r.studentId===guardianId))[0];if(!r)return;r.gradingError='已重试，等待文档转页与批改服务接入；提交状态保持已完成。';save();parentRefresh();},
    retryNotification(failed=false){const task=taskById(teacherTaskId);if(!task||workScope.view==='school'||task.publishedBy!==workScope.teacherId)return;task.notification={status:failed?'failed':'pending',message:failed?'模拟通知失败，任务已保存，可重试。':'本地演示：已重新排队，尚未实际发送。',attempts:(task.notification?.attempts||0)+1};save();teacherRefresh();},
    appendPhotos(taskId,itemId){const task=taskById(taskId),item=task?.items.find(i=>i.id===itemId);if(!item||closedTask(task))return;const r=latestRows(store.submissions.filter(r=>r.taskId===taskId&&r.itemId===itemId&&r.studentId===guardianId))[0];const photos=r?.photos?.map(p=>({...p}))||(r?[{id:'legacy-'+taskId+'-'+itemId,name:r.label,path:mediaFor(r)||samplePhoto(r),saved:true}]:[]);pendingUpload=newPhotoPending(task,item,photos);persistPending();parentRefresh();},
    movePendingPhoto(i,delta){const a=pendingUpload?.photos,j=i+delta;if(!a||j<0||j>=a.length||uploadBusy)return;[a[i],a[j]]=[a[j],a[i]];persistPending();parentRefresh();},removePendingPhoto(i){if(uploadBusy||!pendingUpload?.photos)return;pendingUpload.photos.splice(i,1);persistPending();parentRefresh();},
    async retryPendingPhoto(i){const p=pendingUpload?.photos?.[i];if(!p||uploadBusy)return;if(p.validationError){uploadMessage='图片无法读取，请移除后重新选择。';parentRefresh();return;}uploadBusy=true;try{const response=await fetch(p.path);if(!response.ok)throw Error();await storeMaterialFile(p.id,await response.blob());p.saved=true;p.error='';}catch{p.error='重试失败，请重新选择本张。';}uploadBusy=false;persistPending();parentRefresh();},
    mergeLatestPhotos(){const p=pendingUpload;if(!p?.photos)return;const r=latestRows(store.submissions.filter(r=>r.taskId===p.taskId&&r.itemId===p.itemId&&r.studentId===guardianId))[0],photos=r?.photos||[];if(!window.confirm('最新版本 '+photos.length+' 张，将与当前 '+p.photos.length+' 张合并，请核对顺序。'))return;const merged=[...photos,...p.photos.filter(photo=>!photos.some(old=>old.id===photo.id))];if(merged.length>9){uploadMessage='合并后超过 9 张，请先移除部分照片。';parentRefresh();return;}p.photos=merged;p.expectedVersion=r?.version||0;uploadMessage='已合并最新照片，请核对后提交。';persistPending();parentRefresh();},
    replaceLatestPhotos(){const p=pendingUpload;if(!p)return;if(!window.confirm('请先查看页面上的最新提交；确认使用当前选择替换最新版本？历史版本仍保留。'))return;delete p.requestId;p.expectedVersion=latestVersion(p.taskId,p.itemId);uploadMessage='已确认替换范围，请再次提交。';persistPending();parentRefresh();},

    switchSubmissionImage(role,itemId,view){const taskId=role==='teacher'?teacherTaskId:parentTaskId,studentId=role==='teacher'?teacherStudentId:guardianId;const record=latestRows(store.submissions.filter(r=>r.taskId===taskId&&r.studentId===studentId)).find(r=>r.itemId===itemId);if(!record)return;submissionViews.set(submissionViewKey(record,role),view==='original');if(role==='teacher')teacherRefresh();else parentRefresh();},
    submissionImageError(image,role,itemId,page){const taskId=role==='teacher'?teacherTaskId:parentTaskId,studentId=role==='teacher'?teacherStudentId:guardianId,record=latestRows(store.submissions.filter(r=>r.taskId===taskId&&r.studentId===studentId)).find(r=>r.itemId===itemId),source=record&&recordImagePages(record,role)[page];if(!source)return;const failed=grading.submissionImageFailure({...source,path:image.getAttribute('src'),showOriginal:image.getAttribute('src')===source.originalPath});image.alt=failed.imageError;const notice=image.nextElementSibling;if(notice?.classList.contains('hp-record-image-notice'))notice.remove();image.insertAdjacentHTML('afterend','<span class="hp-record-image-notice" role="status">'+failed.imageError+'</span>');if(failed.path)image.src=failed.path;else{image.onerror=null;image.removeAttribute('src');image.hidden=true;}},
    renderTeacher() { return decoratePageDemo(renderTeacher(),'teacher').replace(/<div class="hp-top">[\s\S]*?<\/h1><\/div>/g, '').replace(/<button class="hp-success-back"[\s\S]*?<\/button>/g, '').replace(/<button class="hp-text-button hp-compose-back"[\s\S]*?<\/button>/g, '').replace(/(<section class="hp-series-overview">)<h2>[\s\S]*?<\/h2>/, '$1').replace('<h2>发布成功</h2>', '') + renderMaterialList() + renderMaterialPreview() + renderGradeReviewDialog()+renderManagementDialog()+renderFamilyPreview(); }, renderParent(studentName, childIndex = 0) { return decoratePageDemo(renderParent(studentName, childIndex),'parent') + renderMaterialPreview(); }, getTeacherMode: () => teacherMode,

    openQuestionResults(itemId){const task=teacherTaskById(teacherTaskId);const items=task?.items.filter(item=>item.type==='photo'&&item.gradingEnabled===true)||[];if(!items.length)return;questionResultsItem=items.some(item=>item.id===itemId)?itemId:items[0].id;teacherMode='questions';teacherRefresh(true);},
    filterQuestionResults(id){questionResultsItem=id;teacherRefresh(true);},
    openGradeQuestion(id){const task=teacherTaskById(teacherTaskId);if(!task||!gradeQuestions(task).some(q=>q.id===id))return;teacherQuestionId=id;teacherQuestionSource='photo';teacherFilter='all';teacherMode='question';batchReview={key:'',selected:{},choice:''};rememberReview();teacherRefresh(true);},
    showQuestionSource(source){if(!['photo','text'].includes(source))return;teacherQuestionSource=source;teacherRefresh();},
    filterGradeStudents(value){if(!['all','correct','wrong','pending'].includes(value))return;teacherFilter=value;batchReview={key:'',selected:{},choice:''};rememberReview();teacherRefresh();},
    openGradedStudent(id){const task=teacherTaskById(teacherTaskId);if(!task||!targetIds(task).includes(id))return;const ids=studentRows(task).filter(row=>{const q=row.records.flatMap(r=>r.questions||[]).find(q=>q.id===teacherQuestionId);return q&&(teacherFilter==='all'||teacherFilter==='correct'&&grading.isFormalGrade(q)&&q.correct||teacherFilter==='wrong'&&grading.isFormalGrade(q)&&!q.correct||teacherFilter==='pending'&&!grading.isFormalGrade(q));}).map(row=>row.id);if(!ids.includes(id))return;questionBrowseIds={taskId:task.id,ids};rosterItemId='';teacherStudentId=id;gradeUI.origin='question';gradeUI.q=teacherQuestionId;gradeUI.wrongOnly=false;const records=submissionsFor(task).filter(r=>r.studentId===id&&r.questions?.length);gradeUI.page=Math.max(0,records.findIndex(r=>r.questions.some(q=>q.id===teacherQuestionId)));teacherMode='student';teacherRefresh(true);},
    openStudentGrade(itemId=''){if(!teacherTaskById(teacherTaskId))return;teacherMode='student';rosterItemId=itemId;teacherRefresh(true);},
    openMistakeReason(){if(!parentQuestionContext())return;learningUI.reasonOpen=true;learningUI.feedback='';parentRefresh();},
    closeMistakeReason(){learningUI.reasonOpen=false;parentRefresh();},
    chooseMistakeReason(reason){if(learning().MISTAKE_REASONS.includes(reason))learningUI.reason=reason;parentRefresh();},
    saveHomeworkMistake(reason){const c=parentQuestionContext();if(!c)return false;if(typeof reason==='string')learningUI.reason=learning().normalizeMistakeReason(reason);if(!learning().isValidMistakeReason(learningUI.reason)){learningUI.feedback='错因须为1至10字，空格不计';return false;}const entries=learning().addNotebookEntry(readNotebook(),{studentId:c.studentId,taskId:c.task.id,itemId:c.record.itemId,version:c.record.version||1,imagePath:photoPath(c.record,c.q),taskTitle:c.task.title},c.q,learningUI.reason);try{previewStorage.setItem(learning().NOTEBOOK_KEY,JSON.stringify(entries));learningUI.reasonOpen=false;learningUI.feedback='';}catch{learningUI.feedback='保存失败，请稍后重试';}parentRefresh();},
    removeHomeworkMistake(){const c=parentQuestionContext();if(!c)return false;const key=learning().notebookKey(c.studentId,c.task.id,c.record.itemId,c.q.id);try{previewStorage.setItem(learning().NOTEBOOK_KEY,JSON.stringify(readNotebook().filter(entry=>entry.key!==key)));parentRefresh();return true;}catch{return false;}},
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
      learningUI.returnPhotoTop=document.querySelector('.hp-result-photo')?.scrollTop||0;
      learningUI.returnSheetTop=document.querySelector('.hp-result-sheet-body')?.scrollTop||0;
      const expanded=Array.from(document.querySelectorAll('.hp-result-sheet details')).map(el=>el.open),sheetScroll=document.querySelector('.hp-result-sheet-body')?.scrollTop||0;
      learningUI.mode='tutor';learningUI.reasonOpen=false;
      window.homeworkTutorUI.open({source,isSaved:()=>readNotebook().some(entry=>entry.key===learning().notebookKey(c.studentId,c.task.id,c.record.itemId,c.q.id)),saveMistake:(reason)=>{window.homeworkPrototype.saveHomeworkMistake(reason);return readNotebook().some(entry=>entry.key===learning().notebookKey(c.studentId,c.task.id,c.record.itemId,c.q.id));},removeMistake:()=>window.homeworkPrototype.removeHomeworkMistake(),previewStem:new URLSearchParams(typeof params!=='undefined'?params.toString():location.search).get('tutorText')==='long'?'学校组织同学们参加科技实践活动，老师用线段图记录班级人数。图中每一小段代表相同的人数，男生共有24人，对应线段图中的4份；全班同学的人数对应同样大小的7份。请先仔细观察线段图，再根据已知条件解答下面的问题。\n（1）线段图中每一份代表多少人？请写出你的计算过程。\n（2）全班一共有多少人？请列出综合算式，并写出答语。\n（3）计算完成后，请把求出的每份人数代回已知条件，检查4份是否仍然对应24人，再说明为什么不能直接用24乘7。':undefined,label:c.q.label,images,studentName:students.find(s=>s.id===c.studentId)?.name||'当前孩子'},{render:()=>{parentRefresh();const panel=document.querySelector('.parent-main');if(panel&&panel.scrollTop>panel.scrollHeight-panel.clientHeight)panel.scrollTop=0;},valid:()=>{const now=parentQuestionContext();const p=window.parentPrototype?.getDemoContext?.();return Boolean(now&&(!window.parentPrototype||window.parentPrototype.hasGuardianAccess())&&(!p||p.homework)&&now.studentId===source.studentId&&(window.parentPrototype?.getTutorAccount?.()||'guardian-demo-001')===accountId&&window.homeworkTutor.tutorFingerprint({...source,submissionVersion:now.record.version||1,question:now.q})===fingerprint&&(!grading.canUseAIExplanation||grading.canUseAIExplanation(now.q)));},leave:()=>{learningUI.mode='result';parentRefresh();const photo=document.querySelector('.hp-result-photo'),body=document.querySelector('.hp-result-sheet-body');if(photo)photo.scrollTop=learningUI.returnPhotoTop;if(body)body.scrollTop=learningUI.returnSheetTop||sheetScroll;const panel=document.querySelector('.parent-main');if(panel)panel.scrollTop=returnScroll;}});
      if(returnPanel)document.querySelector('.parent-main').scrollTop=0;
    },
    closeHomeworkLearning(){if(learningUI.mode==='tutor'&&window.homeworkTutorUI?.active()){window.homeworkTutorUI.close();return;}learningUI.mode='result';learningUI.reasonOpen=false;parentRefresh();const photo=document.querySelector('.hp-result-photo'),body=document.querySelector('.hp-result-sheet-body');if(photo)photo.scrollTop=learningUI.returnPhotoTop;if(body)body.scrollTop=learningUI.returnSheetTop;},
    beginHomeworkGuide(){window.homeworkTutorUI?.restart();},
    setHomeworkTutorAnswer(value){window.homeworkTutorUI?.draft(value);},
    askHomeworkTutor(){window.homeworkTutorUI?.ask();},
    homeworkTutorHint(){window.homeworkTutorUI?.hint();},
    advanceHomeworkTutor(){window.homeworkTutorUI?.submit();},
    openParentGrade(){const task=taskById(parentTaskId),records=task&&latestRows(store.submissions.filter(row=>row.taskId===task.id&&row.studentId===guardianId)).filter(row=>row.questions?.length),record=records?.find(row=>row.questions.some(grading.isResultReleased)),question=record?.questions.find(grading.isResultReleased);if(record&&question)this.openParentQuestion(record.itemId,question.id);},
    openParentQuestion(itemId,id){const task=taskById(parentTaskId),records=task&&latestRows(store.submissions.filter(row=>row.taskId===task.id&&row.studentId===guardianId)).filter(row=>row.questions?.length),index=records?.findIndex(row=>row.itemId===itemId),question=index>=0?records[index].questions.find(q=>q.id===id&&grading.isResultReleased(q)):null;if(!question)return;learningUI.mode='result';learningUI.reasonOpen=false;if(gradeUI.q!==id){learningUI.sourceOpen=false;learningUI.solutionOpen=false;}if(!gradeUI.parentOpen){learningUI.sheetExpanded=false;learningUI.sheetHeightRatio=null;learningUI.sourceOpen=false;learningUI.solutionOpen=false;}gradeUI.parentOpen=true;gradeUI.page=index;gradeUI.q=id;gradeUI.wrongOnly=false;parentRefresh(true);focusResultPhotoSoon();},
    focusResultPhoto(){const photo=document.querySelector('.hp-result-photo'),paper=photo?.querySelector('.hp-result-paper'),region=paper?.querySelector('.hp-paper-region.selected'),img=paper?.querySelector('img');if(!photo||!paper||!region||!img)return;const align=()=>{photo.scrollTop=Math.max(0,photo.scrollTop+region.getBoundingClientRect().top-photo.getBoundingClientRect().top+region.offsetHeight/2-photo.clientHeight/2);};if(img.complete&&img.naturalWidth)align();else img.addEventListener('load',align,{once:true});},
    showResultOriginal(){const {min}=resultSheetBounds();setResultSheetHeight(min);parentRefresh();focusResultPhotoSoon();},
    toggleResultSource(){this.showResultOriginal();},
    rememberResultSolution(){},
    expandResultSheet(){if(!parentQuestionContext())return;setResultSheetHeight(resultSheetBounds().max);parentRefresh();},
    toggleResultSheet(){if(Date.now()<resultSheetIgnoreClickUntil||!parentQuestionContext())return;const {min,max}=resultSheetBounds(),height=document.querySelector('.hp-result-sheet')?.clientHeight||max*.55;setResultSheetHeight(height<=min+8?max*.55:height<max-4?max:min);parentRefresh();focusResultPhotoSoon();},
    resultSheetPointerStart(event){if(event.button!==undefined&&event.button!==0||event.target?.closest?.('button,.hp-result-question-nav'))return;const sheet=document.querySelector('.hp-result-sheet'),bounds=resultSheetBounds();if(!sheet||!bounds.max)return;resultSheetDrag={y:event.clientY,height:sheet.getBoundingClientRect().height,moved:false,pointerId:event.pointerId,expanded:learningUI.sheetExpanded};sheet.classList.add('is-dragging');event.preventDefault?.();if(event.pointerId!==undefined)event.currentTarget?.setPointerCapture?.(event.pointerId);},
    resultSheetPointerMove(event){const drag=resultSheetDrag;if(!drag||event.pointerId!==undefined&&drag.pointerId!==undefined&&event.pointerId!==drag.pointerId)return;const delta=drag.y-event.clientY;if(!drag.moved&&Math.abs(delta)<4)return;drag.moved=true;event.preventDefault?.();setResultSheetHeight(drag.height+delta);window.homeworkPrototype.focusResultPhoto();},
    resultSheetPointerEnd(event){const drag=resultSheetDrag;if(!drag)return;if(event.pointerId!==undefined&&drag.pointerId!==undefined&&event.pointerId!==drag.pointerId)return;if(drag.moved&&event.type!=='pointercancel'&&typeof event.clientY==='number')setResultSheetHeight(drag.height+drag.y-event.clientY);resultSheetDrag=null;document.querySelector('.hp-result-sheet')?.classList.remove('is-dragging');if(!drag.moved)return;resultSheetIgnoreClickUntil=Date.now()+400;parentRefresh();focusResultPhotoSoon();},
    resultSheetKey(event){const keys=['ArrowUp','ArrowDown','Home','End'];if(!keys.includes(event.key))return;event.preventDefault();const {min,max}=resultSheetBounds(),height=document.querySelector('.hp-result-sheet')?.clientHeight||min;setResultSheetHeight(event.key==='Home'?min:event.key==='End'?max:height+(event.key==='ArrowUp'?32:-32));parentRefresh();document.querySelector('.hp-result-handle')?.focus();},
    resultSheetTouchStart(event){const touch=event.touches?.[0];if(touch)this.resultSheetPointerStart({...event,clientY:touch.clientY,target:event.target});},
    resultSheetTouchEnd(event){const touch=event.changedTouches?.[0];if(touch)this.resultSheetPointerMove({clientY:touch.clientY});this.resultSheetPointerEnd({});},
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
      else if(id.startsWith('upload-preview-')&&task){const previewState=id.slice('upload-preview-'.length);materialAttachments(task).filter(file=>file.type==='file'&&!grading.homeworkOriginalError(file)).forEach(file=>{file.previewState=previewState;});latestRows(store.submissions.filter(r=>r.taskId===task.id&&r.studentId===guardianId)).filter(r=>task.items.some(item=>item.id===r.itemId&&item.type==='file')).forEach(r=>{r.previewState=previewState;r.uploadState='complete';});}
      else if(id.startsWith('upload-'))localPageDemo.message=({ 'upload-format':'文件格式不支持，请选择老师要求的文件类型。','upload-size':'文件超过大小限制，请压缩后重新选择。','upload-duration':'视频不能超过 3 分钟，请剪辑后重新选择。','upload-network':'网络连接中断，当前选择已保留，请恢复网络后重试。'})[id];
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
      return {assigned: Boolean(task&&targetIds(task).includes(childId)),active:Boolean(store.consoleDemo),taskId:task?.id||'',title:task?.title||'',scenario:store.consoleDemo?.scenario||'',answerPhase:task?grading.standardPhase(task):'legacy',publishing:Boolean(store.consoleDemo?.publishing),submitted:mine.length,required:task?.items.length||2,progress,pageTitle:gradeUI.parentOpen?'单题批改结果':teacherMode==='question'?'单题批改结果':teacherMode==='result'?'整份批改结果':teacherMode==='student'?'学生提交':'作业详情'};
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
    beginConsolePublish(){gradeReviewDraft=null;draft.classIds=subjectClassIds(draft.subject);draft.recipientModes=Object.fromEntries(draft.classIds.map(id=>[id,'all']));draft.targetStudentIds=[];saveTeacherDraft();store.consoleDemo={taskId:'',scenario:'publish',publishing:true};save();},
    openConsoleTask(role,childIndex=0,result=false){const task=taskById(store.consoleDemo?.taskId||'homework-console-v1');if(!task)return false;if(role==='teacher'){this.openTeacher(task.id);}else{guardianId=schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID;if(!targetIds(task).includes(guardianId))return false;this.openParent(task.id);if(result)this.openParentGrade();}return true;},
    submitConsolePage(index,childIndex=0){const task=taskById(store.consoleDemo?.taskId||'homework-console-v1');if(!task||closedTask(task))return false;guardianId=schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID;if(!targetIds(task).includes(guardianId))return false;const item=task.items[index];if(!item)return false;submitRecord(task,item,item.type==='none'?'家长确认已完成':'模拟'+types[item.type]+'提交');store.consoleDemo={taskId:task.id,scenario:'submitted',publishing:false};save();return true;},
    advanceConsoleGrading(phase,childIndex=0){const task=teacherTaskById(store.consoleDemo?.taskId||'homework-console-v1');if(!task||!canRelease(task))return;submissionsFor(task).forEach(r=>r.questions?.forEach((q,i)=>{if(phase==='processing'){q.state='processing';q.estimatedMinutes=2;}else{q.state=r.studentId===(schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID)&&r.itemId===task.items[0].id&&i===0?'review':'confirmed';delete q.estimatedMinutes;}if(q.reviewReason&&q.state==='confirmed')q.state='review';delete q.releasedSignature;}));if(task.needsAnswerConfirmation)syncAnswerWorkflow(task);save();this.openTeacher(task.id);},
    openConsoleReview(childIndex=0){const task=teacherTaskById(store.consoleDemo?.taskId||'homework-console-v1'),id=schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex]||schoolDemoRoster.GUARDIAN_STUDENT_ID;if(!task)return;const q=submissionsFor(task).filter(r=>r.studentId===id).flatMap(r=>r.questions||[]).find(q=>q.state==='review');if(!q)return;this.openTeacher(task.id);this.openGradeQuestion(q.id);this.filterGradeStudents('pending');},

    getParentTaskSummary(childIndex = 0) {
      const childId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID;
      const now = Date.now();
      const pending = parentTaskGroups(childId).pending;
      return { pending: pending.length, dueSoon: pending.filter(({ task }) => { const remaining = toDate(task.deadline).getTime() - now; return remaining >= 0 && remaining <= 86400000; }).length, overdue: pending.filter(({ task }) => toDate(task.deadline).getTime() < now).length };
    },
    getParentNavigation(childIndex = 0) { const task = taskById(parentTaskId); const childId = schoolDemoRoster.DEMO_GUARDIAN_CHILD_IDS[childIndex] || schoolDemoRoster.GUARDIAN_STUDENT_ID; const detail = Boolean(task && targetIds(task).includes(childId)); return { detail, title: detail ? gradeUI.parentOpen ? learningUI.mode==='tutor'?'AI 解题':learningUI.mode==='notebook'?'孩子的错题本':'单题批改结果' : '作业' : '作业' }; },
    getTeacherNavigation() {
      const task = taskById(teacherTaskId);
      const filterTitles = { all: '全部学生', completed: '已完成学生', partial: '未交齐学生', missing: '未交齐学生', wrong: '答错学生', questionWrong: '本题答错学生' };
      const series = store.tasks.find(row => row.seriesId === teacherSeriesId);
      const titles = { questions:task?.items.find(item=>item.id===questionResultsItem)?.title || '批改结果', question:'单题批改结果',result:'整份批改结果', list: '作业', drafts:'我的草稿', compose: '发布任务', preview: '核对发布内容', success: '发布成功', detail: task?.title || '任务详情', series: series?.title.replace(/ · 第\d+期$/, '') || '每日进度', students: ['wrong','questionWrong'].includes(teacherFilter)?filterTitles[teacherFilter]:'学生名单', student: students.find(row=>row.id===teacherStudentId)?.name || '学生提交详情' };
      return { title: titles[teacherMode] || '作业', back: teacherMode !== 'list' };
    },
    navigateTeacherBack() { if(draftDelete||draftMenu){this.closeDraftOverlay();return;}if(teacherMode==='questions'){teacherMode='detail';teacherRefresh(true);} else if(teacherMode==='result'){teacherMode=gradeUI.origin;teacherRefresh(true);} else if(teacherMode==='question'){teacherMode='questions';teacherRefresh(true);} else if (teacherMode === 'preview') this.backToCompose(); else if (teacherMode === 'compose') this.backCompose(); else if (teacherMode === 'student') this.backToStudents(); else if (teacherMode === 'students') this.backToStats(); else if (teacherMode === 'detail') this.backFromTeacherDetail(); else this.toTeacherList(); },
    navigateTeacherHome() { if(!saveTeacherDraft()){teacherRefresh();return;}draftMenu=null;draftDelete=null; teacherMode = 'list'; teacherTaskId = ''; teacherSeriesId = ''; teacherFilter = 'all'; teacherQuestionId = ''; teacherStudentId = ''; materialSourceOpen = false; chatDemoOpen = false; materialPreview = null; datePickerTarget = ''; composeError = ''; teacherRefresh(true); },
    resetParentView() { if(!leavePending())return false; if(window.homeworkTutorUI?.active())window.homeworkTutorUI.close(); learningUI.mode='result';learningUI.reasonOpen=false; gradeUI.parentOpen=false; parentTaskId = ''; sharedOpen = false; parentTaskTouch = null; parentPhotoSource = null; if (pendingUpload?.media?.startsWith('blob:')) URL.revokeObjectURL(pendingUpload.media); pendingUpload = null; },
    setScope(value) { const changedRole = workScope.view !== value.view || workScope.teacherId !== value.teacherId; const allowedForDraft = value.view !== 'school' ? [...new Set((value.teachingAssignments ?? schoolDemoRoster.getDemoTeachingAssignments(value.teacherId)).flatMap(row => row.classIds))] : value.classIds; const resetDraft = changedRole || draft.classIds.some(id => !allowedForDraft.includes(id)); if (resetDraft) saveTeacherDraft(); workScope = value; if(changedRole){draftMenu=null;draftDelete=null;draftNotice='';composeOrigin='list';if(teacherMode==='drafts')teacherMode='list';listFilters.subject='all';listFilters.classId='all';listFilters.statuses=[...window.homeworkFilters.ALL_TASK_STATUSES];taskFilterSheet='';} if(changedRole||detailClassId!=='all'&&!(value.view==='subject'?allowedForDraft:value.classIds).includes(detailClassId))detailClassId=value.classIds.length===1?value.classIds[0]:'all'; if (resetDraft) { draft = newDraft(); subjectTouched = false; draft.classIds = subjectClassIds(draft.subject); draft.recipientModes = Object.fromEntries(draft.classIds.map(id => [id, 'all'])); composeStep = 0; composeError = ''; restoreTeacherDraft(); } if (workScope.view === 'school' && (teacherMode === 'compose' || teacherMode === 'preview')) teacherMode = 'list'; },
    toTeacherListWithoutRefresh() { draftDelete=null;draftMenu=null;teacherMode = 'list'; teacherTaskId = ''; teacherSeriesId = ''; },
    openTeacherSeries(id) { if (!store.tasks.some(task => task.seriesId === id && teacherTaskById(task.id))) return; teacherSeriesId = id; teacherMode = 'series'; teacherRefresh(true); },
    getTeacherDraftCount(){return workScope.view==='school'?0:teacherDraftRows().length;},
    openTeacherDrafts(){if(workScope.view==='school')return;if(!saveTeacherDraft()){teacherRefresh();return;}draftNotice='';draftDelete=null;draftMenu=null;teacherMode='drafts';teacherRefresh(true);const panel=document.getElementById('teacher-tab-panel');if(panel)panel.scrollTop=draftListScroll;},
    retryDraftList(){draftNotice='';teacherRefresh();},
    openSavedDraft(id){if(workScope.view==='school')return;draftListScroll=document.getElementById('teacher-tab-panel')?.scrollTop||0;composeOrigin='drafts';draftNotice='';if(id==='current'){this.compose();return;}this.resumeOtherDraft(id);},
    openDraftMenu(id){if(workScope.view==='school')return;const row=findDraft(id);if(!row)return;draftMenu={id,title:row.saved.draft.title||'未命名作业'};teacherRefresh();},
    requestDraftDeletion(){if(draftMenu)requestDraftDelete(draftMenu.id);},
    closeDraftOverlay(){draftMenu=null;draftDelete=null;teacherRefresh();},
    deleteTeacherDraft(){requestDraftDelete('current');},
    deleteOtherDraft(id){requestDraftDelete(id);},
    confirmDraftDeletion(){
      const target=draftDelete;if(!target)return;
      if(workScope.view==='school'||workScope.teacherId!==target.teacherId){draftMenu=null;draftDelete=null;draftNotice='工作身份已变化，请重新进入我的草稿。';teacherRefresh();return;}
      try{if(target.id==='current'){
        if(previewStorage.getItem(DRAFT_KEY+workScope.teacherId)!==target.snapshot)throw Error('这份草稿已更新，请取消后重新核对。');
        previewStorage.removeItem(DRAFT_KEY+workScope.teacherId);draft=newDraft();subjectTouched=false;composeStep=0;
      }else{const rows=readDraftArchive(),row=rows.find(row=>row.id===target.id);if(!row||JSON.stringify(row.saved)!==target.snapshot)throw Error('这份草稿已变化，请取消后重新核对。');previewStorage.setItem(draftArchiveKey(),JSON.stringify(rows.filter(row=>row.id!==target.id)));}
      draftDelete=null;draftMenu=null;draftNotice='草稿已删除';teacherMode='drafts';teacherRefresh();
      }catch(error){target.error=error.message.includes('已')?error.message:'删除失败，草稿仍保留，请重试。';teacherRefresh();}
    },
    newTeacherDraft(){if(workScope.view==='school')return;composeOrigin=teacherMode==='drafts'?'drafts':'list';if(!archiveCurrentDraft()){teacherRefresh();return;}try{previewStorage.removeItem(DRAFT_KEY+workScope.teacherId);}catch{draftNotice='草稿存储不可用，请重试。';teacherRefresh();return;}draft=newDraft();subjectTouched=false;composeStep=0;uniformType='';settingMode='uniform';recognizedCount=0;recognitionStale=false;this.compose();},
    resumeOtherDraft(id){if(workScope.view==='school')return;try{const rows=readDraftArchive(),row=rows.find(r=>r.id===id);if(!row){draftNotice='这份草稿已不存在，请刷新列表。';teacherRefresh();return;}if(!row.saved.draft.classIds.every(id=>publishingClassIds().includes(id))){draftNotice='接收范围已变化，请切换到有权限的工作身份后继续。';teacherRefresh();return;}if(!archiveCurrentDraft()){teacherRefresh();return;}previewStorage.setItem(DRAFT_KEY+workScope.teacherId,JSON.stringify(row.saved));previewStorage.setItem(draftArchiveKey(),JSON.stringify(readDraftArchive().filter(r=>r.id!==id)));restoreTeacherDraft();this.compose();}catch{draftNotice='草稿切换失败，内容仍保留，请重试。';teacherRefresh();}},
    compose() { if (workScope.view === 'school') return; if (teacherMode !== 'compose' && !hasTeacherDraft()) { draft = newDraft(); if(listFilters.subject!=='all'&&subjectOptions().includes(listFilters.subject))draft.subject=listFilters.subject;draft.classIds=listFilters.classId!=='all'&&subjectClassIds(draft.subject).includes(listFilters.classId)?[listFilters.classId]:subjectClassIds(draft.subject);draft.recipientModes=Object.fromEntries(draft.classIds.map(id=>[id,'all'])); composeStep = 0; uniformType = ''; settingMode = 'uniform'; } if(toDate(draft.deadline).getTime()<=Date.now())composeStep=0; composeError = ''; publishDemoBranch = 'normal'; rosterReviewRequired = false; teacherMode = 'compose'; teacherRefresh(true); },
    toTeacherList() { if(saveTeacherDraft()===false){teacherRefresh();return;}teacherMode = 'list'; teacherSeriesId = ''; teacherRefresh(true); },
    backCompose() { if (composeStep) { composeStep -= 1; composeError = ''; teacherRefresh(true); } else if(composeOrigin==='drafts')this.openTeacherDrafts();else this.toTeacherList(); },
    nextCompose() {
      const attachments = materialAttachments(draft);
      if (materialReading || attachments.some(file => file.uploadState === 'optimizing' || file.uploadState === 'uploading')) { composeError = '附件仍在处理中，请等待上传完成。'; teacherRefresh(); return; }
      if (attachments.some(file => file.uploadState === 'failed' || file.unavailable)) { composeError = '存在上传失败的附件，请重新上传或移除后继续。'; teacherRefresh(); return; }
      syncDraftTitle();
      if (recognitionStale && settingMode === 'individual' && (recognizedCount > 0 || draft.items.length > 1)) { composeError = '内容已修改，请先确认重新识别，避免覆盖逐条设置。'; teacherRefresh(); return; }
      if (recognitionStale) this.applyRecognition();
      composeError = '';
      if (composeStep === 0) {
        if (!subjectOptions().includes(draft.subject)) composeError = '暂无可发布学科，请联系学校管理员核对任教关系。';
        else if (!draft.description.trim() && !materialAttachments(draft).length) composeError = '请填写任务描述或添加附件。';
        else if (draft.items.some(item => !publishTypes.includes(item.type))) composeError = '请为每条要求选择提交方式。';
        else if (!draft.deadline || Number.isNaN(toDate(draft.deadline).getTime()) || toDate(draft.deadline).getTime() <= Date.now()) composeError = '截止时间请选择未来的日期和时间。';
        else if (!draft.submitDeadline || Number.isNaN(toDate(draft.submitDeadline).getTime()) || toDate(draft.submitDeadline).getTime() < toDate(draft.deadline).getTime()) composeError = '允许补交时间必须晚于正常截止时间。';
      } else {
        if (!draft.classIds.length) composeError = '请至少选择一个班级。';
        else if (draft.classIds.some(id => recipientModeForClass(id) === 'selected' && !draft.targetStudentIds.some(studentId => students.some(student => student.id === studentId && student.classId === id)))) composeError = '选择“部分”的班级，请至少指定一名学生。';
      }
      if (composeError) { teacherRefresh(); return; }
      if (composeStep < 1) { composeStep += 1; teacherRefresh(true); }
      else { teacherMode = 'preview'; teacherRefresh(true); }
    },
    selectDetailClass(id){const original=taskById(teacherTaskId),base=original&&detailTaskBase(original);if(!base||id!=='all'&&!base.classIds.includes(id))return;restoreLocalDemo();detailClassId=id;gradeReleaseOpen=false;gradeReviewDraft=null;if(teacherMode!=='question')teacherMode='detail';teacherRefresh();},
    openTeacher(id,fromList=false) { if (!teacherTaskById(id)) return;questionBrowseIds=null;rosterItemId=''; detailClassId=fromList?listFilters.classId:workScope.classIds.length===1?workScope.classIds[0]:'all'; if (teacherMode !== 'series') teacherSeriesId = ''; teacherTaskId = id; teacherMode = 'detail'; teacherRefresh(true); },
    backFromTeacherDetail() { teacherMode = teacherSeriesId && teacherTaskById(teacherTaskId)?.seriesId === teacherSeriesId ? 'series' : 'list'; teacherRefresh(true); },
    openPaper(button) {
      const source=['IMG','VIDEO'].includes(button.tagName)?button:button.querySelector('img')||button.closest('.hp-card')?.querySelector('video');if(!source)return;
      const canvas=button.closest('.screen')||document.getElementById('app');if(!canvas)return;
      document.getElementById('hp-paper-dialog')?.close();
      const dialog=document.createElement('dialog');dialog.id='hp-paper-dialog';dialog.className='hp-paper-dialog';
      dialog.innerHTML='<header><strong>作业原图</strong><button data-result-toggle hidden onclick="homeworkPrototype.togglePaperImage()">查看原图</button><button autofocus aria-label="关闭原图" onclick="this.closest(\'dialog\').close()">关闭 ✕</button></header><div class="hp-paper-viewport"><img alt=""><video controls playsinline hidden></video></div><footer><button aria-label="缩小原图" onclick="homeworkPrototype.zoomPaper(-0.5)">−</button><output>100%</output><button aria-label="放大原图" onclick="homeworkPrototype.zoomPaper(0.5)">＋</button><button onclick="homeworkPrototype.zoomPaper(0)">适应屏幕</button></footer>';
      const grid=button.closest('.hp-photo-grid'),card=button.closest('.hp-parent-item')||button.closest('.hp-card');
      const sources=grid?Array.from(grid.querySelectorAll('.hp-photo-open img')):card?Array.from(card.querySelectorAll('.hp-inline-paper>img,.hp-paper-preview img')):[];
      if(!sources.includes(source))sources.splice(0,sources.length,source);
      const studentPages=button.closest('.hp-student-browse')&&button.dataset.itemId?studentPhotoPages(button.dataset.itemId):[];
      const parentRecord=card?.classList.contains('hp-parent-item')?latestRows(store.submissions.filter(r=>r.taskId===parentTaskId&&r.studentId===guardianId)).find(r=>r.itemId===button.dataset.itemId):null;const parentPages=parentRecord?recordImagePages(parentRecord,'parent').map(page=>({...page,src:page.path,alt:page.showOriginal?'原图':'批改图',title:students.find(s=>s.id===guardianId)?.name||'作业照片'})):[];dialog._paperPages=studentPages.length?studentPages:parentPages.length?parentPages:sources.map(image=>({src:image.src,alt:image.alt}));dialog._paperIndex=studentPages.length?Math.max(0,studentPages.findIndex(page=>page.studentId===teacherStudentId&&page.itemId===button.dataset.itemId&&page.page===Number(button.dataset.page))):parentPages.length?Number(button.dataset.page||0):sources.indexOf(source);
      dialog._studentGallery=studentPages.length>0;const img=dialog.querySelector('img');img.src=source.src;img.alt=source.alt;img.draggable=false;dialog.dataset.zoom='1';
      const viewport=dialog.querySelector('.hp-paper-viewport'),pager=document.createElement('nav');pager.className='hp-paper-pager';pager.setAttribute('aria-label','照片切换');pager.hidden=dialog._paperPages.length<2;
      pager.innerHTML=dialog._studentGallery?'<button aria-label="上一位学生" onclick="homeworkPrototype.changePaperStudent(-1)">‹</button><span aria-live="polite"></span><button aria-label="下一位学生" onclick="homeworkPrototype.changePaperStudent(1)">›</button>':'<button aria-label="上一张照片" onclick="homeworkPrototype.changePaperPage(-1)">‹</button><span aria-live="polite"></span><button aria-label="下一张照片" onclick="homeworkPrototype.changePaperPage(1)">›</button>';dialog.insertBefore(pager,dialog.querySelector('footer'));
      let swipe=null;viewport.style.touchAction=dialog._studentGallery?'none':'pan-y';
      viewport.addEventListener('pointerdown',event=>{if(event.isPrimary===false){swipe=null;return;}if(Number(dialog.dataset.zoom)!==1||event.button!==0)return;if(event.target.tagName==='VIDEO'&&event.clientY>event.target.getBoundingClientRect().bottom-48)return;swipe={x:event.clientX,y:event.clientY,id:event.pointerId};if(event.target.tagName!=='VIDEO')viewport.setPointerCapture?.(event.pointerId);});
      viewport.addEventListener('pointerup',event=>{const start=swipe;swipe=null;if(!start||start.id!==event.pointerId||Number(dialog.dataset.zoom)!==1)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)>=45&&Math.abs(dx)>Math.abs(dy)*1.3){if(dialog._studentGallery)this.changePaperStudent(dx<0?1:-1);else this.changePaperPage(dx<0?1:-1);}else if(dialog._studentGallery&&Math.abs(dy)>=45&&Math.abs(dy)>Math.abs(dx)*1.3)this.changePaperMedia(dy<0?1:-1);});
      viewport.addEventListener('pointercancel',()=>{swipe=null;});
      if(dialog._studentGallery){const hint=document.createElement('small');hint.className='hp-media-hint';hint.textContent='左右切换学生 · 上下查看内容';dialog.insertBefore(hint,pager);}
      this.changePaperPage(0,dialog);
      const canvasOverflow=canvas.style.overflow;canvas.scrollTop=0;canvas.style.overflow='clip';
      const background=Array.from(canvas.children).map(element=>({element,inert:element.inert}));background.forEach(({element})=>{element.inert=true;});
      dialog.setAttribute('aria-label','作业原图');dialog.setAttribute('aria-modal','true');
      dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dialog.close();}if((event.key==='ArrowLeft'||event.key==='ArrowRight')&&Number(dialog.dataset.zoom)===1){event.preventDefault();if(dialog._studentGallery)this.changePaperStudent(event.key==='ArrowLeft'?-1:1);else this.changePaperPage(event.key==='ArrowLeft'?-1:1);}if(dialog._studentGallery&&Number(dialog.dataset.zoom)===1&&(event.key==='ArrowUp'||event.key==='ArrowDown')){event.preventDefault();this.changePaperMedia(event.key==='ArrowUp'?-1:1);}if(event.key==='Tab'){const controls=Array.from(dialog.querySelectorAll('button')).filter(control=>!control.disabled&&control.getClientRects().length),first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
      dialog.addEventListener('close',()=>{dialog.querySelector('video')?.pause();background.forEach(({element,inert})=>{element.inert=inert;});dialog.remove();canvas.style.overflow=canvasOverflow;canvas.scrollTop=0;if(button.isConnected)button.focus({preventScroll:true});});canvas.appendChild(dialog);dialog.show();dialog.querySelector('button').focus({preventScroll:true});
    },
    togglePaperImage(viewer){const dialog=viewer||document.getElementById('hp-paper-dialog'),page=dialog?._paperPages[dialog._paperIndex];if(!page?.gradedPath)return;page.showOriginal=!page.showOriginal;page.src=page.showOriginal?page.originalPath:page.gradedPath;page.imageError='';this.changePaperPage(0,dialog,true);},
    changePaperStudent(delta) {const dialog=document.getElementById('hp-paper-dialog');if(!dialog?._studentGallery)return;const pages=dialog._paperPages,current=pages[dialog._paperIndex],ids=[...new Set(pages.map(page=>page.studentId))],next=ids[ids.indexOf(current.studentId)+delta];if(next)this.changePaperPage(pages.findIndex(page=>page.studentId===next)-dialog._paperIndex);},
    changePaperMedia(delta) {const dialog=document.getElementById('hp-paper-dialog');if(!dialog?._studentGallery)return;const next=dialog._paperIndex+delta;if(dialog._paperPages[next]?.studentId===dialog._paperPages[dialog._paperIndex].studentId)this.changePaperPage(delta);},
    changePaperPage(delta,viewer,preserveViewport=false) {
      const dialog=viewer||document.getElementById('hp-paper-dialog');if(!dialog||!dialog._paperPages?.length)return;const index=Math.max(0,Math.min(dialog._paperPages.length-1,dialog._paperIndex+delta));if(delta&&index===dialog._paperIndex)return;dialog._paperIndex=index;
      const image=dialog.querySelector('img'),page=dialog._paperPages[index],video=dialog.querySelector('video'),viewport=dialog.querySelector('.hp-paper-viewport'),savedPosition=preserveViewport?{top:viewport.scrollTop,left:viewport.scrollLeft,src:page.src}:null;
      const restorePosition=()=>{if(savedPosition&&dialog._paperPages[dialog._paperIndex]===page&&page.src===savedPosition.src){viewport.scrollTop=savedPosition.top;viewport.scrollLeft=savedPosition.left;}};image.onload=savedPosition?restorePosition:null;
      if(video?.pause){video.pause();video.hidden=page.type!=='video';if(page.type==='video'){video.src=page.src;video.currentTime=0;}else video.removeAttribute('src');}
      image.onerror=page.type==='video'?null:()=>{if(dialog._paperPages[dialog._paperIndex]!==page)return;const failed=grading.submissionImageFailure({...page,path:page.src});Object.assign(page,failed,{src:failed.path});this.changePaperPage(0,dialog,true);};image.hidden=page.type==='video'||!page.src;if(page.type!=='video'&&page.src)image.src=page.src;else image.removeAttribute('src');image.alt=page.imageError||page.alt;const heading=dialog.querySelector('header strong');if(heading)heading.textContent=page.title||'作业原图';
      let notice=dialog.querySelector('[data-image-status]');if(!notice&&typeof document.createElement==='function'){notice=document.createElement('p');notice.dataset.imageStatus='';notice.className='hp-record-image-notice';notice.setAttribute('role','status');dialog.querySelector('.hp-paper-viewport').appendChild(notice);}if(notice){notice.textContent=page.imageError||'';notice.hidden=!page.imageError;}
      const toggle=dialog.querySelector('[data-result-toggle]');if(toggle&&'hidden' in toggle){toggle.hidden=!page.gradedPath;toggle.textContent=page.showOriginal?'查看批改图':'查看原图';}const pager=dialog.querySelector('.hp-paper-pager'),buttons=pager.querySelectorAll('button');
      if(dialog._studentGallery){const ids=[...new Set(dialog._paperPages.map(page=>page.studentId))],position=ids.indexOf(page.studentId),media=dialog._paperPages.filter(other=>other.studentId===page.studentId),mediaIndex=media.indexOf(page);pager.querySelector('span').textContent='学生 '+(position+1)+'/'+ids.length+' · 内容 '+(mediaIndex+1)+'/'+media.length;buttons[0].disabled=position===0;buttons[1].disabled=position===ids.length-1;}else{pager.querySelector('span').textContent=(index+1)+' / '+dialog._paperPages.length;buttons[0].disabled=index===0;buttons[1].disabled=index===dialog._paperPages.length-1;}
      if(savedPosition)restorePosition();else this.zoomPaper(0,dialog);const footer=dialog.querySelector('footer');if(footer)footer.hidden=page.type==='video';
    },
    zoomPaper(delta,viewer) { const dialog=viewer||document.getElementById('hp-paper-dialog');if(!dialog)return;const zoom=delta===0?1:Math.max(1,Math.min(4,Number(dialog.dataset.zoom)+delta));dialog.dataset.zoom=String(zoom);const img=dialog.querySelector('img'),viewport=dialog.querySelector('.hp-paper-viewport');img.style.width=(zoom*100)+'%';img.style.maxHeight=zoom===1?'100%':'none';viewport.style.touchAction=zoom===1?(dialog._studentGallery?'none':'pan-y'):'pan-x pan-y';if(delta===0){viewport.scrollTop=0;viewport.scrollLeft=0;}dialog.querySelector('output').textContent=Math.round(zoom*100)+'%'; },
    rosterSelect(filter) { if(!rosterTabs.some(tab=>tab.id===filter))return;teacherFilter=filter;rosterTouch=null;teacherRefresh(true); },
    rosterSwipeStart(event) { if(event.isPrimary===false||(event.pointerType==='mouse'&&event.button!==0))return;rosterTouch={x:event.clientX,y:event.clientY,id:event.pointerId}; },
    rosterSwipeCancel() { rosterTouch=null; },
    rosterSwipeEnd(event) { const start=rosterTouch;rosterTouch=null;if(!start||start.id!==event.pointerId)return;const dx=event.clientX-start.x,dy=event.clientY-start.y,index=rosterTabs.findIndex(tab=>tab.id===teacherFilter);if(index<0||Math.abs(dx)<55||Math.abs(dx)<Math.abs(dy)*1.4)return;const next=index+(dx<0?1:-1);if(next>=0&&next<rosterTabs.length){event.preventDefault();this.rosterSelect(rosterTabs[next].id);} },
    openItemStudents(id){questionBrowseIds=null;rosterItemId=id;teacherFilter='all';teacherMode='students';teacherRefresh(true);},
    openStudents(filter, questionId = '') { questionBrowseIds=null;rosterItemId='';teacherFilter = filter; teacherQuestionId = questionId; teacherMode = 'students'; teacherRefresh(true); },
    backToStats() { teacherMode = 'detail'; teacherRefresh(true); },
    changeStudent(delta) {const rows=studentBrowseRows(),index=rows.findIndex(row=>row.id===teacherStudentId),next=index+delta;if(next<0||next>=rows.length)return;this.openStudent(rows[next].id);},
    studentPhotoSwipeStart(event) {if(event.isPrimary===false||event.button!==0||event.target.closest('button:not(.hp-paper-preview),a,video,audio,input,dialog'))return;studentPhotoTouch={x:event.clientX,y:event.clientY,id:event.pointerId};},
    studentPhotoSwipeCancel() {studentPhotoTouch=null;},
    studentPhotoSwipeEnd(event) {const start=studentPhotoTouch;studentPhotoTouch=null;if(!start||start.id!==event.pointerId)return;const dx=event.clientX-start.x,dy=event.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4){event.preventDefault();this.changeStudent(dx<0?1:-1);}},
    openStudent(id) { teacherStudentId = id; teacherMode = 'student'; teacherRefresh(true); },
    backToStudents() { teacherMode = questionBrowseIds?'question':'students';questionBrowseIds=null;teacherRefresh(true); },
    setKind(kind) { draft.kind = kind; syncDraftTitle(); teacherRefresh(); },
    setSubject(value) { if (!subjectOptions().includes(value)) return;if(draft.subject!==value&&draft.classIds.length&&!window.confirm('切换学科将重新设置接收班级和部分学生名单，作业内容与自定义标题保留。继续吗？')){teacherRefresh();return;} subjectTouched = true; draft.subject = value; const allowed = subjectClassIds(value); draft.classIds = allowed; draft.recipientModes = Object.fromEntries(allowed.map(id => [id, 'all'])); draft.targetStudentIds = []; syncDraftTitle(); saveTeacherDraft(); teacherRefresh(); },
    setTitle(value) { draft.title = value; draft.titleCustomized = value.trim() !== schoolDemoRoster.formatHomeworkTitle(draft.subject, draft.kind); clearComposeError(); saveTeacherDraft(); },
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
       draft.items = texts.length ? texts.map(text => {const old=previous.find(item=>item.title===text);const type=old?.type||(settingMode==='uniform'?uniformType:suggestSubmissionType(text));return {...newItem(),...old,title:text,instruction:old?.instruction||'按上述要求完成',type,gradingEnabled:old&&old.type===type?Boolean(old.gradingEnabled):draft.kind==='homework'&&gradingEligible(type)};}) : [{ ...newItem(), title: '完成作业', instruction: '按任务要求完成', type: settingMode === 'uniform' ? uniformType : '', gradingEnabled: draft.kind==='homework'&&gradingEligible(uniformType) }];
      recognizedCount = texts.length > 1 ? texts.length : 0;
      recognitionStale = false;
      teacherRefresh();
    },
    setSettingMode(mode) { if (mode === 'uniform' && settingMode !== mode) uniformType = draft.items.length && draft.items.every(item => item.type === draft.items[0].type) ? draft.items[0].type : ''; settingMode = mode; expandedItemIndex = 0; teacherRefresh(); },
    applyUniformToAll() { settingMode = 'uniform'; draft.items.forEach(item => {item.type = uniformType;item.gradingEnabled=draft.kind==='homework'&&gradingEligible(uniformType);}); teacherRefresh(); },
    toggleItemOptions(index) { expandedItemIndex = expandedItemIndex === index ? -1 : index; teacherRefresh(); },
    setUniformType(type) { if (!(type in types)) return; const wasEligible=gradingEligible(uniformType);uniformType = type; draft.items.forEach(item => {item.type = type;if(!gradingEligible(type))item.gradingEnabled=false;else if(!wasEligible)item.gradingEnabled=true;}); teacherRefresh(); },
    setUniformGrading(enabled) { if(draft.kind!=='homework'||!gradingEligible(uniformType))return;draft.items.forEach(item=>item.gradingEnabled=Boolean(enabled));teacherRefresh(); },
    setItemGrading(index,enabled) { const item=draft.items[index];if(!item||draft.kind!=='homework'||!gradingEligible(item.type))return;item.gradingEnabled=Boolean(enabled);teacherRefresh(); },
    setDeadline(value) { draft.deadline = value.replace('T', ' '); if(draft.allowSupplement===false)draft.submitDeadline=draft.deadline;else if(!draft.supplementTouched)draft.submitDeadline = addDays(draft.deadline, 7); clearComposeError(); },
    setSubmitDeadline(value) { draft.submitDeadline = value.replace('T', ' ');draft.supplementTouched=true; clearComposeError(); },
    setItem(index, key, value) { if (draft.items[index]) draft.items[index][key] = value; demoPasteActive = false; clearComposeError();saveTeacherDraft(); },
    setItemType(index, value) { const item=draft.items[index];if (item && publishTypes.includes(value)) { const wasEligible=gradingEligible(item.type);item.type = value;if(!gradingEligible(value))item.gradingEnabled=false;else if(!wasEligible)item.gradingEnabled=true;expandedItemIndex = index; teacherRefresh(); } },
    openDatePicker(target) { datePickerTarget = target; datePickerValue = draft[target]; teacherRefresh(); },
    closeDatePicker() { datePickerTarget = ''; teacherRefresh(); },
    shiftPickerMonth(delta) { const date = toDate(datePickerValue); const day = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + delta); date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())); datePickerValue = formatDate(date); teacherRefresh(); },
    quickDeadline(days) { const date=new Date();date.setDate(date.getDate()+days);date.setHours(20,0,0,0);if(date.getTime()<=Date.now()) {alert('今天 20:00 已过，请选择今天更晚的时间或改为明天。');this.openDatePicker('deadline');return;}this.setDeadline(formatDate(date));teacherRefresh(); },
    quickPickerDate(days) { const old=toDate(datePickerValue),date=new Date();date.setDate(date.getDate()+days);date.setHours(old.getHours(),old.getMinutes(),0,0);datePickerValue=formatDate(date);teacherRefresh(); },
    pickDateDay(day) { const date = toDate(datePickerValue); date.setDate(day); if(date.getTime()<new Date().setHours(0,0,0,0))return; datePickerValue = formatDate(date); teacherRefresh(); },
    setPickerTime(part, value) { const date = toDate(datePickerValue); if (part === 'hour') date.setHours(Number(value)); else date.setMinutes(Number(value)); if(date.getTime()<=Date.now()){alert('请选择未来时间。');return;}datePickerValue = formatDate(date); teacherRefresh(); },
    confirmDatePicker() { const date = toDate(datePickerValue); if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now() && datePickerTarget === 'deadline') { alert('首次截止请选择未来时间。'); return; } if (datePickerTarget === 'submitDeadline' && date.getTime() <= toDate(draft.deadline).getTime()) { alert('补交截止必须晚于首次截止。'); return; } if (datePickerTarget === 'deadline') { draft.deadline = datePickerValue; if(draft.allowSupplement===false)draft.submitDeadline=datePickerValue;else if(!draft.supplementTouched){draft.submitDeadline=addDays(datePickerValue,7);composeError='补交时间已随截止时间调整。';} } else {draft.submitDeadline = datePickerValue;draft.supplementTouched=true;} datePickerTarget = ''; clearComposeError(); teacherRefresh(); },
    addItem() { const type=settingMode === 'uniform' ? uniformType : '';draft.items.push({ ...newItem(), title: '补充要求', instruction: '按要求完成', type, gradingEnabled:draft.kind==='homework'&&gradingEligible(type) }); demoPasteActive = false; teacherRefresh(); },
    removeItem(index) { if (draft.items.length > 1) draft.items.splice(index, 1); demoPasteActive = false; teacherRefresh(); },
    toggleClass(id) { if (!subjectClassIds(draft.subject).includes(id)) return; const selected=draft.classIds.includes(id); draft.classIds = selected ? draft.classIds.filter(value => value !== id) : [...draft.classIds, id]; draft.recipientModes ||= {}; if(selected)delete draft.recipientModes[id];else draft.recipientModes[id]='all'; draft.targetStudentIds = draft.targetStudentIds.filter(studentId => students.some(row => row.id === studentId && draft.classIds.includes(row.classId))); if(selected&&recipientClassId===id)recipientPickerOpen=false;clearComposeError();teacherRefresh(); },
    setTargetMode(mode) { if(!['all','selected'].includes(mode))return;draft.targetMode=mode;draft.recipientModes=Object.fromEntries(draft.classIds.map(id=>[id,mode]));recipientPickerOpen=false;clearComposeError();teacherRefresh(); },
    setClassRecipientMode(id,mode){if(!draft.classIds.includes(id)||!['all','selected'].includes(mode))return;draft.recipientModes ||= {};draft.recipientModes[id]=mode;recipientClassId=id;recipientSearch='';recipientPickerOpen=mode==='selected';clearComposeError();teacherRefresh();},
    closeRecipientPicker(){recipientPickerOpen=false;recipientSearch='';teacherRefresh();},
    toggleStudent(id) { if (!students.some(row => row.id === id && draft.classIds.includes(row.classId) && recipientModeForClass(row.classId)==='selected')) return; draft.targetStudentIds = draft.targetStudentIds.includes(id) ? draft.targetStudentIds.filter(value => value !== id) : [...draft.targetStudentIds, id];clearComposeError(); teacherRefresh(); },
    selectRecipientClass(id){if(!draft.classIds.includes(id)||!subjectClassIds(draft.subject).includes(id))return;recipientClassId=id;recipientSearch='';recipientPickerOpen=recipientModeForClass(id)==='selected';teacherRefresh();},
    selectRecipientClassAll(selected){if(recipientModeForClass(recipientClassId)!=='selected'||!draft.classIds.includes(recipientClassId)||!subjectClassIds(draft.subject).includes(recipientClassId))return;const ids=students.filter(student=>student.classId===recipientClassId).map(student=>student.id);draft.targetStudentIds=selected?[...new Set([...draft.targetStudentIds,...ids])]:draft.targetStudentIds.filter(id=>!ids.includes(id));teacherRefresh();},
    filterStudents(value) { recipientSearch=value;if (typeof document === 'undefined') return; const query = value.trim().toLowerCase(); document.querySelectorAll('.hp-recipient-picker-list .hp-student-option').forEach(node => { node.hidden = !node.dataset.search.includes(query); }); const empty=document.querySelector('.hp-recipient-picker-list .hp-recipient-empty');if(empty)empty.hidden=Array.from(document.querySelectorAll('.hp-recipient-picker-list .hp-student-option')).some(row=>!row.hidden); },
    openMaterialSource() { if (materialReading) return; materialSourceOpen = true; chatDemoOpen = false; teacherRefresh(); },
    closeMaterialSource() { materialSourceOpen = false; chatDemoOpen = false; teacherRefresh(); },
    openWorksheetLibrary() { materialSourceOpen = false; chatDemoOpen = false; worksheetLibraryOpen = true; teacherRefresh(); },
    closeWorksheetLibrary() { worksheetLibraryOpen = false; teacherRefresh(); },
    applyWorksheet(id) {
      const template = worksheetLibrary.find(item => item.id === id);
      if (!template) return;
      if (!subjectOptions().includes(template.subject)) { alert(`当前演示教师暂无${template.subject}任教范围，请切换对应学科教师后选择。`); return; }
      draft.subject = template.subject;
      const allowed = subjectClassIds(template.subject);
      draft.classIds = draft.classIds.filter(classId => allowed.includes(classId));
      if (!draft.classIds.length) draft.classIds = allowed.slice(0, 1);
      draft.recipientModes = Object.fromEntries(draft.classIds.map(id => [id, 'all']));
      draft.targetStudentIds = [];
      draft.description = template.description;
      draft.attachments = [...materialAttachments(draft).filter(file => !String(file.id).startsWith('worksheet-')), { id: `worksheet-${template.id}`, name: `${template.title}（空白）.webp`, type: 'image', path: worksheetAsset(template.blankPath), size: 0, source: '作业素材库' }];
      draft.items = [{ ...newItem(), id: `worksheet-submit-${template.id}`, title: '提交整张作答页', instruction: template.requirement, type: 'photo', gradingEnabled: true }];
      settingMode = 'uniform'; uniformType = 'photo'; recognizedCount = 1; recognitionStale = false; expandedItemIndex = 0; worksheetLibraryOpen = false;
      clearComposeError(); saveTeacherDraft(); teacherRefresh();
    },
    chooseMaterialMedia(source) {
      materialSelectionSource = source.startsWith('chat') ? '微信聊天记录（演示）' : source === 'camera' ? '拍照或拍摄' : '手机相册';
      const input = document.getElementById(source === 'camera' ? 'hp-material-camera' : source === 'chat-file' ? 'hp-material-document' : 'hp-material-album');
      if (input) { input.value = ''; input.accept = source === 'chat-video' ? 'video/*' : source === 'chat-file' ? '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.mp3,.m4a,.wav,.aac,.ogg,audio/*' : 'image/*,video/*'; input.click(); }
    },
    showChatDemo() { chatDemoOpen = true; teacherRefresh(); },
    chooseDemoAttachment(id) {
      const selected = demoMaterialFiles.find(file => file.id === id);
      if (!selected) return;
      const file = { ...selected, id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
      const capacityError=grading.homeworkAttachmentError([...materialAttachments(draft),file]);if(capacityError){composeError=capacityError;teacherRefresh();return;}
      draft.attachments = [...materialAttachments(draft), file]; draft.photo = ''; materialSourceOpen = false; chatDemoOpen = false; clearComposeError();
      if (!draft.items.some(item => item.title.trim())) this.applyRecognition();
      startMaterialUpload(file);
      revealMaterialAttachment(file.id);
    },
    async addMaterialFiles(input) {
      const files = Array.from(input.files || []); if (!files.length || materialReading) return;
      materialReading = true; materialSourceOpen = false; chatDemoOpen = false; teacherRefresh();
      const added = [], errors = [];
      for (const file of files) {
        const type = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(file.name) ? 'image' : file.type.startsWith('video/') || /\.(mp4|mov|m4v|webm)$/i.test(file.name) ? 'video' : file.type.startsWith('audio/') || /\.(mp3|m4a|wav|aac|ogg)$/i.test(file.name) ? 'audio' : /\.(pdf|docx?|pptx?|xlsx?|txt)$/i.test(file.name) ? 'file' : '';
        if (!type) { errors.push(`${file.name}：不支持的附件格式`); continue; }
        const max = type === 'image' || type === 'audio' ? 20 : type === 'video' ? 100 : 50;
        if (file.size > max * 1024 * 1024) { errors.push(`${file.name}：不能超过 ${max}MB`); continue; }
        const entry = { id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: file.name, type, size: file.size, source: materialSelectionSource, path: '' };
        const capacityError=grading.homeworkAttachmentError([...materialAttachments(draft),...added,entry]);if(capacityError){errors.push(capacityError);continue;}
        try {
          if(type==='video'||type==='audio')await validateSelectedMedia(file,type);
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
      saveTeacherDraft(); teacherRefresh(); added.forEach(file => startMaterialUpload(file)); if (added.length) revealMaterialAttachment(added[added.length - 1].id); if (errors.length) alert(errors.join('\n'));
    },
    cancelMaterialUpload(id) { stopMaterialUpload(id); const file = materialFileById(id); if (file?.path?.startsWith('blob:')) URL.revokeObjectURL(file.path); draft.attachments = materialAttachments(draft).filter(row => row.id !== id); draft.photo = ''; saveTeacherDraft(); teacherRefresh(); },
    retryMaterialUpload(id) { const file = materialFileById(id); if (!file) return; startMaterialUpload(file, true); },
    removeMaterialAttachment(id) { stopMaterialUpload(id); draft.attachments = materialAttachments(draft).filter(file => file.id !== id); draft.photo = ''; saveTeacherDraft(); teacherRefresh(); },
    openTaskAttachments() { const task=teacherTaskById(teacherTaskId); if(!task)return; const files=materialAttachments(task); if(files.length===1){this.previewMaterialAttachment(files[0].id);return;} if(files.length>1){materialListTaskId=task.id;teacherRefresh();} },
    closeMaterialList() { materialListTaskId='';teacherRefresh(); },
    previewMaterialAttachment(id) { const file = [...materialAttachments(draft), ...store.tasks.flatMap(materialAttachments)].find(row => row.id === id); if (!file || file.unavailable || ['optimizing','uploading','failed'].includes(file.uploadState)) return; materialListTaskId=''; materialPreview = file; materialPreviewPage = 0; refreshMaterialView(); },
    changeMaterialPreviewPage(step) { if (!materialPreview) return; const pages = materialPreviewPages(materialPreview); if (!pages.length) return; materialPreviewPage = Math.max(0, Math.min(pages.length - 1, materialPreviewPage + Number(step || 0))); refreshMaterialView(); },
    closeMaterialPreview() { materialPreview = null; materialPreviewPage = 0; refreshMaterialView(); },
    preview() { this.nextCompose(); },
    backToCompose() { teacherMode = 'compose'; composeStep = 1; rosterReviewRequired = false; composeError = ''; teacherRefresh(true); },
    setPublishDemoBranch(value) { if (!['normal', 'network', 'roster'].includes(value)) return; publishDemoBranch = value; composeError = ''; teacherRefresh(); },
    publish() {
      const error=grading.homeworkPublishError(draft);if(error){composeError=error;teacherMode='compose';composeStep=0;teacherRefresh(true);return;}
      if (draft.items.some(item => !publishTypes.includes(item.type))) { composeError = '请为每条要求选择提交方式。'; teacherRefresh(); return; }
      syncDraftTitle();
      if (!subjectOptions().includes(draft.subject) || workScope.view === 'school' || teacherMode !== 'preview' || !draft.classIds.length || !draft.classIds.every(id => subjectClassIds(draft.subject).includes(id))) return;
      if (draft.classIds.some(id => recipientModeForClass(id) === 'selected' && !draft.targetStudentIds.some(studentId => students.some(student => student.id === studentId && student.classId === id)))) { composeError = '选择“部分”的班级，请至少指定一名学生。'; teacherRefresh(); return; }
      if (publishDemoBranch === 'network') { composeError = '发布失败：网络暂不可用。内容已保留，请恢复正常场景后重试。'; teacherRefresh(); return; }
      if (publishDemoBranch === 'roster' || rosterReviewRequired) { composeError = '发布前接收名单发生变化，请返回核对布置对象，再次预览后发布。'; publishDemoBranch = 'normal'; rosterReviewRequired = true; teacherRefresh(); return; }
      const seriesId = `task-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, count = draft.kind === 'checkin' ? draft.cycleCount : 1;
      const snapshot = draftRecipients().map(row => row.id);
      const allFull = draft.classIds.every(id => recipientModeForClass(id) === 'all');
      const tasks = Array.from({ length: count }, (_, index) => {
        const deadline = addDays(draft.deadline, index), submitDeadline = addDays(draft.submitDeadline, index);
        return { id: count === 1 ? seriesId : `${seriesId}-cycle-${index + 1}`, seriesId, cycleId: draft.kind === 'checkin' ? `cycle-${index + 1}` : null, kind: draft.kind, allowSupplement:draft.allowSupplement,subject: draft.subject, schoolId: 'luohu-demo', title: count === 1 ? draft.title.trim() : `${draft.title.trim()} · 第${index + 1}期`, description: draft.description.trim(), photo: draft.photo, attachments: materialAttachments(draft).map(file => ({ ...file })), publishedAt: formatDate(new Date()), deadline, submitDeadline, classIds: [...draft.classIds], targetStudentIds: allFull ? null : [...snapshot], targetSnapshotIds: [...snapshot], parentVisible: false, notification:{status:'pending',message:'本地演示：任务已保存，通知待服务接入后发送。',attempts:0}, publishedBy: workScope.teacherId, items: draft.items.map(item => ({ ...item, required: true, title: item.title.trim(), instruction: item.instruction.trim() })) };
      });
      store.tasks.unshift(...tasks);
      if(store.consoleDemo?.publishing)store.consoleDemo={taskId:tasks[0].id,scenario:'published',publishing:false};
      try{previewStorage.setItem(KEY,JSON.stringify(store));}catch{store.tasks.splice(0,tasks.length);composeError='发布未保存成功，内容已保留，请重试。';teacherRefresh();return;}
      const studentsCount = targetIds(tasks[0]).length;
      publishedNotice = `已发布给 ${studentsCount} 名学生${count > 1 ? `，共 ${count} 期` : ''}，接收名单已冻结；家长可在作业列表查看。`;
      draft = newDraft(); subjectTouched = false; recipientPickerOpen = false;
      try { previewStorage.removeItem(DRAFT_KEY + workScope.teacherId); } catch {}
      composeStep = 0; publishDemoBranch = 'normal'; rosterReviewRequired = false; teacherMode = 'success'; teacherRefresh(true);
    },
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
    confirmGradeReview(next=false){const draft=gradeReviewDraft,c=gradeReviewContext();if(!draft||!c)return;if(!photoPath(c.record,c.q)){draft.error='原图不可用，请保留待复核';teacherRefresh();return;}if(typeof draft.correct!=='boolean'){draft.error='请先选择判对或判错';teacherRefresh();return;}if(!draft.reason.trim()){draft.error='请填写复核说明';teacherRefresh();return;}const q=c.q,at=new Date().toISOString();if(!workflowCommit(()=>{q.reviewHistory=[...(q.reviewHistory||[]),{at,before:q.state,after:'confirmed',correct:draft.correct,reason:draft.reason.trim(),reviewerId:workScope.teacherId}];grading.confirmManualResult(workflowTask(c.task),standardRecords(workflowTask(c.task)),q,draft.correct,at);if(q.parentFeedback)q.parentFeedback.status='resolved';})){gradeReviewDraft.error=workflowNotice;teacherRefresh();return;}rememberReview();gradeReviewDraft=null;answerError='已保存，统计和家长结果已更新';if(next&&submissionsFor(c.task).some(r=>r.questions?.some(q=>q.id===draft.questionId&&q.state==='review'))){this.review(draft.taskId,draft.questionId);return;}answerError='已保存，统计和家长结果已更新';teacherRefresh();},
    openParent(id) { gradeUI.parentOpen=false;learningUI.sheetExpanded=false;learningUI.sheetHeightRatio=null; parentTaskId = id; sharedOpen = false; parentPhotoSource = null; parentRefresh(true); },
    toggleParentAttachments(id) { const task = taskById(id); if (id !== parentTaskId || !task || !materialAttachments(task).length) return; if (collapsedParentAttachments.has(id)) collapsedParentAttachments.delete(id); else collapsedParentAttachments.add(id); parentRefresh(); },
    openTutorScenario(index){if(!Number.isInteger(index)||index<0||index>=tutorScenarioSamples.length)return;this.openParent('tutor-scenarios-v1');requestAnimationFrame(()=>document.querySelectorAll('.hp-parent-item')[index]?.scrollIntoView({block:'start'}));},
    toParentList() { if(learningUI.reasonOpen){learningUI.reasonOpen=false;parentRefresh();return;}if(learningUI.mode!=='result'){this.closeHomeworkLearning();return;}if(gradeUI.parentOpen){gradeUI.parentOpen=false;learningUI.sheetExpanded=false;learningUI.sheetHeightRatio=null;parentRefresh(true);return;} if(!leavePending())return; parentTaskId = ''; parentPhotoSource = null; parentRefresh(true); },
    changeParentTaskTab(value) { if (!['pending', 'completed', 'ended'].includes(value)) return; parentTaskTab = value; parentTaskTouch = null; parentRefresh(true); },
    taskSwipeStart(event) { if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return; parentTaskTouch = { x: event.clientX, y: event.clientY, id: event.pointerId }; },
    taskSwipeCancel() { parentTaskTouch = null; },
    taskSwipeEnd(event) { const start = parentTaskTouch; parentTaskTouch = null; if (!start || start.id !== event.pointerId) return; const dx = event.clientX - start.x, dy = event.clientY - start.y; if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.3) return; const tabs = ['pending', 'completed', 'ended']; const next = tabs.indexOf(parentTaskTab) + (dx < 0 ? 1 : -1); if (next >= 0 && next < tabs.length) this.changeParentTaskTab(tabs[next]); },
    submit(taskId, itemId) { const task = taskById(taskId); const item = task?.items.find(row => row.id === itemId); if (!task || !item || item.type !== 'none' || !targetIds(task).includes(guardianId)) return; if (closedTask(task)) { alert('补交已结束，当前任务只可查看。'); return; } submitRecord(task, item, '家长确认已完成'); },
    demoException(type) { const messages = { format: '文件格式不支持，请按老师指定的方式选择 PDF、Word、PPT、Excel、TXT、图片或视频。', size: '文件超过当前类型大小限制，请压缩后重新选择。', duration: '视频超过 3 分钟，请剪辑后重新选择。', network: '网络连接中断，当前选择已保留，请恢复网络后重试。' }; alert(messages[type] || '提交失败，请重试。'); },
    openParentPhotoSource(taskId,itemId) { const task=taskById(taskId),item=task?.items.find(row=>row.id===itemId); if(!task||item?.type!=='photo'||closedTask(task)||!targetIds(task).includes(guardianId))return;parentPhotoSource={taskId,itemId,chatOpen:false};parentRefresh(); },
    fillParentDemoPhoto(taskId,itemId) {
      this.openParentPhotoSource(taskId,itemId);
      if(parentPhotoSource?.taskId!==taskId||parentPhotoSource?.itemId!==itemId)return;
      const task=taskById(taskId),item=task.items.find(row=>row.id===itemId);
      const templateId=item?.id.startsWith('worksheet-submit-')?item.id.slice('worksheet-submit-'.length):task.id==='worksheet-flow-grade5-v1'?'math-application-grade7':'';
      const index=parentDemoPhotos.findIndex(photo=>photo.templateId===(templateId||'generic-math'));
      if(index<0||(!templateId&&task.subject!=='数学')){this.showParentChatPhotos(true);return;}
      this.useParentChatDemoPhoto(index);
    },
    fallbackPendingDemoPhoto() {
      if(!pendingUpload||!Number.isInteger(pendingUpload.demoPhotoIndex))return;
      const task=taskById(pendingUpload.taskId),fallback=parentDemoPhotos.find(photo=>photo.templateId==='generic-math');
      if(task?.subject!=='数学'||!fallback||pendingUpload.demoPhotoIndex===parentDemoPhotos.indexOf(fallback))return;
      pendingUpload.name=fallback.name;
      pendingUpload.media=demoPhotoAsset(fallback);
      pendingUpload.demoPhotoIndex=parentDemoPhotos.indexOf(fallback);
      parentRefresh();
    },
    closeParentPhotoSource() { parentPhotoSource=null;parentRefresh(); },
    showParentChatPhotos(demoOpen=false) { if(!parentPhotoSource)return;parentPhotoSource.chatOpen=true;parentPhotoSource.demoOpen=demoOpen;parentRefresh(); },
    chooseParentPhotoFile() { const itemId=parentPhotoSource?.itemId,input=itemId&&document.getElementById('hp-parent-photo-'+itemId);if(input){input.value='';input.click();} },
    useParentChatDemoPhoto(index=0) {
      const source=parentPhotoSource,task=source&&taskById(source.taskId),item=task?.items.find(row=>row.id===source.itemId),photo=parentDemoPhotos[index];
      if(!task||item?.type!=='photo'||!photo||!targetIds(task).includes(guardianId))return;
      if(closedTask(task)){alert('补交已结束，当前任务只可查看。');return;}
      addDemoPhoto(task,item,photo,index);
      parentPhotoSource=null;parentRefresh();
    },
    submitFile(taskId, itemId, input) {
      if(uploadBusy)return;
      const selectedTask=taskById(taskId),selectedItem=selectedTask?.items.find(i=>i.id===itemId);if(selectedItem?.type==='photo'){parentPhotoSource=null;stagePhotoFiles(selectedTask,selectedItem,Array.from(input.files||[]));input.value='';return;}

      const task = taskById(taskId); const item = task?.items.find(row => row.id === itemId); const file = input.files?.[0];
      if (!task || !item || !file || !targetIds(task).includes(guardianId) || item.type === 'none') return;
      if (closedTask(task)) { alert('补交已结束，当前任务只可查看。'); return; }
      if (item.type === 'photo' && !file.type.startsWith('image/') || item.type === 'video' && !file.type.startsWith('video/') || item.type === 'audio' && !file.type.startsWith('audio/') || item.type === 'file' && !/\.(pdf|docx?|pptx?|xlsx?|txt)$/i.test(file.name)) { uploadMessage=`这一项需要上传${types[item.type]}，请重新选择。原选择保留。`;parentRefresh();return; }
      if(item.type==='photo')parentPhotoSource=null;
      stageUpload(task, item, file);
    },
    reselectPendingUpload() { if(uploadBusy||!pendingUpload)return;const input=document.getElementById('hp-parent-single-'+pendingUpload.itemId);if(input){input.value='';input.click();} },
    acknowledgePendingVersion() {const p=pendingUpload;if(!p||uploadBusy||p.photos)return;delete p.requestId;p.expectedVersion=latestVersion(p.taskId,p.itemId);uploadMessage='已选择使用当前文件，核对后确认重新提交；历史版本保留。';persistPending();parentRefresh();},
    cancelUpload() { if (pendingUpload?.media?.startsWith('blob:')) URL.revokeObjectURL(pendingUpload.media); pendingUpload = null; persistPending();parentRefresh(); },
    replacePendingPhoto() { const upload = pendingUpload; if (upload?.type !== 'photo') return; this.cancelUpload(); this.openParentPhotoSource(upload.taskId, upload.itemId); },
    confirmUpload() {
      if(uploadBusy||recoverPendingSubmission())return;
      if(pendingUpload?.photos){confirmPhotoBatch();return;}
      const upload = pendingUpload; const task = upload && taskById(upload.taskId); const item = task?.items.find(row => row.id === upload.itemId);
      if (!upload || !task || !item || upload.studentId !== guardianId || !targetIds(task).includes(guardianId)) return;
      if (closedTask(task)) { uploadMessage='补交已结束，当前任务只可查看。';parentRefresh();return; }
      if(upload.expectedVersion!==undefined&&upload.expectedVersion!==latestVersion(task.id,item.id)){uploadMessage='已有新版本，请查看最新内容后再决定合并或替换。';parentRefresh();return;}
      try{submitRecord(task, item, upload.name, upload.transient ? '' : upload.media, upload.transient ? upload.media : '',upload.demoPhotoIndex ?? null);pendingUpload=null;persistPending();uploadMessage='本项已提交。';parentRefresh();}catch(error){uploadMessage=error.message;parentRefresh();}
    }
  };
  return api;
})();
