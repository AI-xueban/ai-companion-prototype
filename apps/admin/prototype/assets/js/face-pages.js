/* 人脸识别管理 · MVP 原型 */
const FACE_SCHOOLS = [
  { id: 'school-001', name: '深圳市南山实验学校' },
  { id: 'school-002', name: '深圳市科技实验学校' },
];
const FACE_STUDENTS = [
  { id: '2026001', schoolId: 'school-001', name: '张三', className: '一年级1班', photoFile: '2026001.jpg', updatedAt: '2026-09-20 10:12:00', recognitionSource: '后台上传' },
  { id: '2026002', schoolId: 'school-001', name: '李四', className: '一年级1班', photoFile: '2026002.jpg', updatedAt: '2026-10-02 09:18:00', recognitionSource: '柜机录入' },
  { id: '2026003', schoolId: 'school-001', name: '王五（01）', className: '一年级1班', photoFile: null, updatedAt: '2026-10-03 16:40:00', recognitionSource: '柜机录入' },
  { id: '2026025', schoolId: 'school-001', name: '王五（02）', className: '一年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026004', schoolId: 'school-001', name: '赵六', className: '一年级2班', photoFile: '2026004.jpg', updatedAt: '2026-09-18 15:22:00', recognitionSource: '后台上传' },
  { id: '2026026', schoolId: 'school-001', name: '赵六', className: '一年级2班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026005', schoolId: 'school-001', name: '孙七', className: '一年级3班', photoFile: '2026005.jpg', updatedAt: '2026-10-04 14:08:00', recognitionSource: '柜机录入' },
  { id: '2026006', schoolId: 'school-001', name: '周八', className: '一年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026007', schoolId: 'school-001', name: '吴九', className: '二年级1班', photoFile: '2026007.jpg', updatedAt: '2026-09-17 16:18:00', recognitionSource: '后台上传' },
  { id: '2026014', schoolId: 'school-001', name: '蒋一', className: '二年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026015', schoolId: 'school-001', name: '沈二', className: '二年级2班', photoFile: '2026015.jpg', updatedAt: '2026-09-14 11:05:00', recognitionSource: '后台上传' },
  { id: '2026016', schoolId: 'school-001', name: '韩三', className: '二年级2班', photoFile: null, updatedAt: '2026-10-06 08:46:00', recognitionSource: '柜机录入' },
  { id: '2026017', schoolId: 'school-001', name: '杨四', className: '二年级3班', photoFile: '2026017.jpg', updatedAt: '2026-09-12 13:26:00', recognitionSource: '后台上传' },
  { id: '2026018', schoolId: 'school-001', name: '朱五', className: '二年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026008', schoolId: 'school-002', name: '郑十', className: '二年级1班', photoFile: '2026008.jpg', updatedAt: '2026-10-01 15:42:00', recognitionSource: '柜机录入' },
  { id: '2026009', schoolId: 'school-002', name: '钱一', className: '二年级2班', photoFile: '2026009.jpg', updatedAt: '2026-09-16 11:26:00', recognitionSource: '后台上传' },
  { id: '2026010', schoolId: 'school-002', name: '冯二', className: '二年级2班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026011', schoolId: 'school-002', name: '陈三', className: '二年级3班', photoFile: '2026011.jpg', updatedAt: '2026-09-15 16:44:00', recognitionSource: '后台上传' },
  { id: '2026012', schoolId: 'school-002', name: '褚四', className: '二年级3班', photoFile: '2026012.jpg', updatedAt: '2026-10-05 15:30:00', recognitionSource: '柜机录入' },
  { id: '2026013', schoolId: 'school-002', name: '卫五', className: '三年级1班', photoFile: '2026013.jpg', updatedAt: '2026-09-15 14:12:00', recognitionSource: '后台上传' },
  { id: '2026019', schoolId: 'school-002', name: '秦六', className: '三年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026020', schoolId: 'school-002', name: '尤七', className: '三年级2班', photoFile: null, updatedAt: '2026-10-07 09:37:00', recognitionSource: '柜机录入' },
  { id: '2026021', schoolId: 'school-002', name: '许八', className: '三年级2班', photoFile: '2026021.jpg', updatedAt: '2026-09-11 10:20:00', recognitionSource: '后台上传' },
  { id: '2026022', schoolId: 'school-002', name: '何九', className: '三年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026023', schoolId: 'school-002', name: '吕十', className: '三年级3班', photoFile: '2026023.jpg', updatedAt: '2026-10-08 14:55:00', recognitionSource: '柜机录入' },
  { id: '2026024', schoolId: 'school-002', name: '施一', className: '四年级1班', photoFile: '2026024.jpg', updatedAt: '2026-09-10 09:48:00', recognitionSource: '后台上传' },
];

const FACE_LOGIN_RECORDS = [
  { time: '2026-09-28 08:31:22', id: '2026001', name: '张三', className: '一年级1班', result: 'success', method: '人脸识别', cabinet: '柜机-001', reason: '—' },
  { time: '2026-09-28 08:29:07', id: '2026008', name: '赵六', className: '一年级2班', result: 'failed', method: '人脸识别', cabinet: '柜机-001', reason: '未匹配到人脸' },
  { time: '2026-09-27 16:12:45', id: '2026003', name: '王五（01）', className: '一年级1班', result: 'fallback', method: '学号密码', cabinet: '柜机-002', reason: '人脸已停用' },
];
let faceCurrentPage = 1;
let facePageSize = 10;
let faceSelectedSchool = '';
let faceFilters = { id: '', name: '', className: '', status: '', faceState: '', hasFace: '' };
FACE_STUDENTS.forEach((student, index) => {
  student.syncStatus = student.recognitionSource ? ['同步成功', '同步中', '同步失败', '待同步'][index % 4] : '';
  student.registeredPhotoFile = student.syncStatus === '同步成功' ? student.photoFile : null;
  student.syncFailureReason = student.syncStatus === '同步失败' ? (student.id === '2026005' ? '未检测到有效人脸，请更换照片' : '柜机 A03 下发失败，请重试') : '';
});
function searchFaceStudents(reset = false) {
  faceFilters = reset ? { id: '', name: '', className: '', status: '', faceState: '', hasFace: '' } : {
    id: document.getElementById('face-filter-id').value.trim(),
    name: document.getElementById('face-filter-name').value.trim(),
    className: document.getElementById('face-filter-class').value,
    status: document.getElementById('face-filter-status').value,
    faceState: document.getElementById('face-filter-state').value,
    hasFace: document.getElementById('face-filter-has-face').value
  };
  faceCurrentPage = 1;
  navigate('face-library');
}
function refreshFaceSyncView() {
  if (location.hash.startsWith('#face-library')) renderApp('face-library', currentParams);
  if (location.hash.startsWith('#face-sync')) renderApp(location.hash.startsWith('#face-sync-detail')?'face-sync-detail':'face-sync-status', currentParams);
  refreshFaceSyncDrawer();
}let faceEditPhoto = null;
let faceEditStudentId = '';
let faceEditSelectionVersion = 0;
function openFacePhotoEdit(id) {
  const student = FACE_STUDENTS.find(item => item.id === id);
  if (!student) return;
  faceEditPhoto = null;
  faceEditStudentId = id;
  faceEditSelectionVersion++;
  document.getElementById('modal-title').textContent = student.photoFile ? '修改照片' : '上传照片';
  document.getElementById('modal-subtitle').style.display = 'none';
  const photo = student.photoUrl ? '<img src="'+esc(student.photoUrl)+'" alt="当前学生照片">' : '<div class="face-edit-empty"><span class="face-edit-avatar">'+(student.photoFile?esc(student.name.slice(0,1)):'—')+'</span><span>'+(student.photoFile?'示例照片':'暂无照片')+'</span></div>';
  document.getElementById('modal-body').innerHTML = '<div class="face-edit-ui"><div class="face-edit-student"><strong>'+esc(student.name)+'</strong><span>编号：'+esc(student.id)+'</span><span>'+esc(student.className)+'</span></div><div class="face-edit-columns"><section class="face-edit-panel"><h4>当前照片</h4><div class="face-edit-image">'+photo+'</div><p class="face-edit-filename">'+esc(student.photoFile||'尚未上传照片')+'</p></section><section class="face-edit-panel"><h4>新照片</h4><label class="face-edit-upload" id="face-edit-upload" for="face-edit-file"><div id="face-edit-preview" class="face-edit-image"><div class="face-edit-empty"><span class="face-edit-plus">＋</span><strong>点击上传照片</strong><span>JPG / JPEG / PNG · 自动压缩</span></div></div><input id="face-edit-file" type="file" accept="image/jpeg,image/png" hidden onchange="selectFaceEditPhoto(this)"></label><div class="face-edit-file-actions"><span class="face-edit-filename" id="face-edit-filename">上传后自动以学生姓名命名</span><button type="button" class="btn-link" id="face-edit-reselect" hidden onclick="document.getElementById(&quot;face-edit-file&quot;).click()">重新选择</button></div></section></div><p class="face-edit-note">自动压缩至每张不超过 2MB，并以学生姓名命名。同步成功后更新学生照片及最近注册成功照片。</p></div>';
  document.getElementById('modal-footer').innerHTML = `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" id="face-edit-save" disabled>保存并同步</button>`;
  document.getElementById('face-edit-save').onclick = () => saveFacePhotoEdit(id);
  document.getElementById('modal-footer').style.display = '';
  document.getElementById('modal').classList.remove('modal-sm');
  document.getElementById('modal').classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
}
async function compressFacePhoto(blob) {
  if(faceConsoleScenario==='compress'){faceConsoleScenario='normal';renderConsolePanel();throw new Error('照片压缩失败，请重新上传');}
  const limit=2*1024*1024;
  if(blob.size<=limit)return blob;
  let bitmap;
  try {bitmap=await createImageBitmap(blob);} catch {throw new Error('照片无法读取，请更换照片');}
  try {
    const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
    if(!ctx)throw new Error('照片压缩失败，请重新上传');
    const type=blob.type==='image/png'?'image/png':'image/jpeg';
    let width=bitmap.width,height=bitmap.height;
    for(let step=0;step<20;step++){
      canvas.width=Math.max(1,Math.round(width));canvas.height=Math.max(1,Math.round(height));
      ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
      const output=await new Promise(resolve=>canvas.toBlob(resolve,type,0.9));
      if(!output)throw new Error('照片压缩失败，请重新上传');
      if(output.size<=limit)return output;
      width*=0.8;height*=0.8;
    }
    throw new Error('照片压缩失败，请更换照片');
  } finally {bitmap.close();}
}

async function selectFaceEditPhoto(input) {
  const file = input.files[0];
  const version = ++faceEditSelectionVersion;
  const student = FACE_STUDENTS.find(s => s.id === faceEditStudentId);
  faceEditPhoto = null;
  document.getElementById('face-edit-save').disabled = true;
  if (!file) return;
  if (!['image/jpeg','image/png'].includes(file.type) || !/\.(jpe?g|png)$/i.test(file.name)) {
    input.value = ''; toast('请选择 JPG、JPEG 或 PNG 照片', 'warning'); return;
  }
  if (!student) return;
  const extension = file.name.slice(file.name.lastIndexOf('.') + 1).toLowerCase();
  const savedName = student.name + '.' + extension;
  document.getElementById('face-edit-filename').textContent = '正在处理照片…';
  let compressed;
  try { compressed = await compressFacePhoto(file); } catch(error) {
    if(version === faceEditSelectionVersion){document.getElementById('face-edit-filename').textContent='照片处理失败，请重新选择';toast(error.message,'warning');}
    return;
  }
  if(version !== faceEditSelectionVersion)return;
  const reader = new FileReader();
  reader.onload = () => {
    if (version !== faceEditSelectionVersion) return;
    faceEditPhoto = { url: reader.result, fileName: savedName, extension };
    document.getElementById('face-edit-preview').innerHTML = '<img src="' + reader.result + '" alt="新照片预览">';
    document.getElementById('face-edit-filename').textContent = savedName;
    document.getElementById('face-edit-reselect').hidden = false;
    document.getElementById('face-edit-save').disabled = false;
  };
  reader.readAsDataURL(compressed);
}
function saveFacePhotoEdit(id) {
  if (!faceEditPhoto) return toast('请上传新照片', 'warning');
  const student = FACE_STUDENTS.find(item => item.id === id);
  student.registeredPhotoFile = null;
  const submittedAt = new Date().toLocaleString('sv-SE');
  const task = { queuedAt: Date.now(), id: 'FACE-SINGLE-' + Date.now() + '-' + Math.random().toString(36).slice(2,6), schoolId: student.schoolId, className: student.className, fileName: faceEditPhoto.fileName, time: submittedAt, items: [{ studentId: id, name: student.name, fileName: faceEditPhoto.fileName, status: '待同步', reason: '' }] };
  applyFaceConsoleScenario(task);
  student.pendingPhoto = {taskId:task.id,fileName:faceEditPhoto.fileName,url:faceEditPhoto.url};
  student.syncTaskId = task.id;
  student.syncStatus = '待同步';
  student.syncFailureReason = '';
  faceSingleSyncTasks.push(task);
  saveFaceHistory();
  closeModal(); navigate('face-library'); toast('照片已更新，已加入同步队列', 'success');
  processFaceSyncQueue();
}


function facePhotoHtml(student) {
  if (!student.photoFile) return '<span class="text-muted">未导入</span>';
  return `<button class="btn-link" type="button" onclick="openFacePhotoPreview('${student.id}')" title="查看学生照片">${student.photoFile}</button>`;
}

function openFacePhotoPreview(id) {
  const student = FACE_STUDENTS.find(s => s.id === id);
  if (!student || !student.photoFile) return;
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '查看学生照片';
  document.getElementById('modal-subtitle').style.display = 'none';
  const preview = student.photoUrl ? `<img src="${esc(student.photoUrl)}" alt="${esc(student.name)}" style="max-width:100%;max-height:420px;border-radius:8px">` : `<div class="face-photo-preview">${student.name.slice(0, 1)}</div>`;
  document.getElementById('modal-body').innerHTML = `<div style="text-align:center">${preview}<p class="form-hint">${student.name}（${student.id}）· ${esc(student.photoFile)}</p></div>`;
  document.getElementById('modal-footer').innerHTML = '<button type="button" class="btn" onclick="closeModal()">关闭</button>';
  document.getElementById('modal-footer').style.display = '';
  modal.classList.remove('modal-sm'); modal.classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
}

let faceImportFiles = [];

function faceImportSelectedClass() {
  return document.getElementById('face-import-class-select')?.value || '';
}

function readZipEntries(file) {
  return window.FacePhotoImporter.readZip(file);
}

function matchFacePhotoEntries(entries, students) {
  const ids = new Map(students.map(student => [student.id, student]));
  const names = new Map();
  students.forEach(student => {
    const name = student.name.trim().normalize('NFC');
    names.set(name, [...(names.get(name) || []), student]);
  });
  const candidates = [], failures = [];
  entries.filter(entry => entry.name && !entry.name.endsWith('/') && !entry.name.includes('__MACOSX/')).forEach(entry => {
    const fileName = entry.name.split('/').pop();
    const dot = fileName.lastIndexOf('.');
    const name = (dot > 0 ? fileName.slice(0, dot) : fileName).trim().normalize('NFC');
    const extension = dot > 0 ? fileName.slice(dot).toLowerCase() : '';
    if (!['.jpg', '.jpeg', '.png'].includes(extension)) return;
    const matched = ids.has(name) ? [ids.get(name)] : (names.get(name) || []);
    if (!matched.length) failures.push(`${fileName}：班级内未找到学生`);
    else if (matched.length > 1) failures.push(`${fileName}：姓名重复，请使用编号或单独上传`);
    else candidates.push({ studentId: matched[0].id, extension, originalName: fileName, blob: entry.blob, size: entry.size });
  });
  const counts = new Map();
  candidates.forEach(item => counts.set(item.studentId, (counts.get(item.studentId) || 0) + 1));
  const matches = [];
  candidates.forEach(item => {
    if (counts.get(item.studentId) > 1) failures.push(`${item.originalName}：照片重复，请保留一张`);
    else matches.push(item);
  });
  return { matches, failures };
}

async function handleFaceImportFiles(fileList) {
  if (!fileList?.length) return;
  const className = faceImportSelectedClass();
  if (!className) {
    toast('请先选择班级', 'warning');
    return;
  }
  for (const file of Array.from(fileList)) {
    const record = { schoolId: faceSelectedSchool, className, id: `face-import-${Date.now()}-${faceImportFiles.length}`, fileName: file.name, uploadStatus: 'checking', importStatus: null, note: '正在校验…', matches: [], failures: [] };
    faceImportFiles.push(record);
    refreshFaceImportList();
    try {
      if (!file.name.toLowerCase().endsWith('.zip')) throw new Error('仅支持 ZIP 压缩包');
      const students = FACE_STUDENTS.filter(item => item.schoolId === faceSelectedSchool && item.className === className);
      const entries = await readZipEntries(file);
      const result = matchFacePhotoEntries(entries, students);
      record.matches = [];
      for(const match of result.matches){
        try {match.blob=await compressFacePhoto(match.blob);match.size=match.blob.size;record.matches.push(match);}
        catch(error){result.failures.push(match.originalName+'：'+error.message);}
      }
      record.failures = result.failures;
      if (!record.matches.length && !record.failures.length) throw new Error('压缩包中没有 JPG、JPEG 或 PNG 照片');
      record.uploadStatus = 'success';
      record.note = `已匹配 ${record.matches.length} 张${record.failures.length ? `，失败 ${record.failures.length} 张` : ''}`;
    } catch (error) {
      record.uploadStatus = 'fail';
      record.note = error.message || '文件校验失败';
    }
    refreshFaceImportList();
  }
}

function triggerFaceImportUpload() {
  if (!faceImportSelectedClass()) {
    toast('请先选择班级', 'warning');
    document.getElementById('face-import-class-select')?.focus();
    return;
  }
  document.getElementById('face-import-file-input')?.click();
}

const FACE_HISTORY_KEY = 'face-import-history-v1';
const FACE_DISABLED_KEY = 'face-disabled-v1';
function readFaceLocal(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
let faceHistory = readFaceLocal(FACE_HISTORY_KEY, []);
let faceDisabled = readFaceLocal(FACE_DISABLED_KEY, {});
let faceSyncBusy = false;
const faceSingleSyncTasks = readFaceLocal('face-single-sync-v1', []);
function saveFaceHistory() { localStorage.setItem(FACE_HISTORY_KEY, JSON.stringify(faceHistory)); localStorage.setItem('face-single-sync-v1', JSON.stringify(faceSingleSyncTasks)); }
function openFaceDialog(title, body, footer) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-subtitle').style.display = 'none';
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-footer').style.display = '';
  document.getElementById('modal-footer').innerHTML = footer || '<button class="btn" onclick="closeModal()">关闭</button>';
  document.getElementById('modal').classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
}
function faceGrade(student) { return student.className.split('年级')[0] + '年级'; }
function openFaceDisable(id) {
  const students = FACE_STUDENTS.filter(s => s.schoolId === faceSelectedSchool);
  const student = students.find(s => s.id === id);
  const options = values => values.map(v => '<option>' + esc(v) + '</option>').join('');
  const scope = student ? '<p>确认禁用学生：' + esc(student.name) + '（' + student.id + '）的人脸信息吗？</p>' : '<label>禁用范围 <select class="select" id="face-disable-scope" onchange="updateFaceDisableScope()"><option value="class">按班级</option><option value="grade">按年级</option></select></label> <select class="select" id="face-disable-target">' + options([...new Set(students.map(s=>s.className))]) + '</select>';
  openFaceDialog('禁用人脸', scope + '<p class="form-hint">禁用后该学生在本校所有柜机上不能通过人脸登录，编号密码登录仍可使用。</p><p id="face-disable-count"></p>', '<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" id="face-disable-confirm">确认禁用</button>');
  document.getElementById('face-disable-confirm').onclick = () => {
    const type = student ? 'student' : document.getElementById('face-disable-scope').value;
    const value = student ? id : document.getElementById('face-disable-target').value;
    const targets = students.filter(s => student ? s.id === id : type === 'grade' ? faceGrade(s) === value : s.className === value).filter(s=>!faceDisabled[s.id]);
    if (!targets.length) return toast('该范围没有可禁用的学生', 'warning');
    targets.forEach(s=>faceDisabled[s.id]=true);
    localStorage.setItem(FACE_DISABLED_KEY, JSON.stringify(faceDisabled));
    closeModal(); refreshFaceSyncView(); toast('已禁用 ' + targets.length + ' 名学生的人脸', 'success');
  };
  const target = document.getElementById('face-disable-target');
  if(target) { target.onchange=updateFaceDisableCount; updateFaceDisableCount(); }
}
function openFaceRestore(id) {
  const student=FACE_STUDENTS.find(s=>s.id===id && s.schoolId===faceSelectedSchool);
  if(!student || !faceDisabled[id]) return;
  openFaceDialog('恢复人脸','<p>确认恢复学生：'+esc(student.name)+'（'+esc(student.id)+'）的人脸信息吗？</p><p class="form-hint">恢复后可使用已同步的人脸信息登录本校柜机。</p>','<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" id="face-restore-confirm">确认恢复</button>');
  document.getElementById('face-restore-confirm').onclick=()=>{
    delete faceDisabled[id];localStorage.setItem(FACE_DISABLED_KEY,JSON.stringify(faceDisabled));
    closeModal();refreshFaceSyncView();toast('已恢复该学生的人脸','success');
  };
}
function updateFaceDisableScope() {
  const grade = document.getElementById('face-disable-scope').value === 'grade';
  const students=FACE_STUDENTS.filter(s=>s.schoolId===faceSelectedSchool);
  document.getElementById('face-disable-target').innerHTML=[...new Set(students.map(s=>grade ? faceGrade(s):s.className))].map(v=>'<option>'+esc(v)+'</option>').join('');
  updateFaceDisableCount();
}
function updateFaceDisableCount() {
  const grade=document.getElementById('face-disable-scope').value==='grade';
  const value=document.getElementById('face-disable-target').value;
  const count=FACE_STUDENTS.filter(s=>s.schoolId===faceSelectedSchool && (grade?faceGrade(s):s.className)===value && !faceDisabled[s.id]).length;
  document.getElementById('face-disable-count').textContent='将禁用 '+count+' 名学生（包含其他分页）。';
}
function faceTaskCounts(t) {
  return { success:t.items.filter(i=>i.status==='同步成功').length, failed:t.items.filter(i=>i.status==='同步失败').length, waiting:t.items.filter(i=>i.status==='待同步').length, running:t.items.filter(i=>i.status==='同步中').length };
}
let faceDisableClasses=[];
let faceBulkScope='grade';
let faceBulkAction='disable';
function faceBulkEligible(student){return faceBulkAction==='restore' ? !!faceDisabled[student.id] : !faceDisabled[student.id];}
function openFaceBulkRestore(){faceBulkAction='restore';openFaceBulkDisable(false,'restore');}
function faceBulkValue(student){return faceBulkScope==='grade'?faceGrade(student):student.className;}
function renderFaceBulkOptions(){
  const verb=faceBulkAction==='restore'?'恢复':'禁用';
  const students=FACE_STUDENTS.filter(s=>s.schoolId===faceSelectedSchool);
  const values=[...new Set(students.map(faceBulkValue))];
  return values.map(value=>{const count=students.filter(s=>faceBulkValue(s)===value&&faceBulkEligible(s)).length;return '<label class="face-bulk-row '+(!count?'is-disabled':'')+'"><input type="checkbox" name="face-disable-class" value="'+esc(value)+'" '+(!count?'disabled':'')+' '+(faceDisableClasses.includes(value)?'checked':'')+' onchange="updateFaceClassSelection()"><span>'+esc(value)+'</span><span class="face-bulk-row-count">'+(count?'可'+verb+' '+count+' 人':(faceBulkAction==='restore'?'暂无已禁用学生':'已全部禁用'))+'</span></label>';}).join('');
}
function switchFaceBulkScope(value){
  faceBulkScope=value==='class'?'class':'grade';faceDisableClasses=[];
  document.getElementById('face-bulk-options').innerHTML=renderFaceBulkOptions();updateFaceClassSelection();
}
function toggleAllFaceBulk(checked){
  document.querySelectorAll('input[name="face-disable-class"]:not(:disabled)').forEach(el=>el.checked=checked);updateFaceClassSelection();
}
function openFaceBulkDisable(keepSelection=false,action='disable'){
  if(!keepSelection)faceBulkAction=action;
  const verb=faceBulkAction==='restore'?'恢复':'禁用';
  if(!keepSelection)faceDisableClasses=[];
  const scopeButtons=['grade','class'].map(type=>'<label><input type="radio" name="face-bulk-scope" value="'+type+'" '+(faceBulkScope===type?'checked':'')+' onchange="switchFaceBulkScope(this.value)"><span>'+(type==='grade'?'按年级':'按班级')+'</span></label>').join('');
  openFaceDialog('批量'+verb+'年级/班级','<div class="face-bulk-ui"><div class="face-bulk-school"><span>所属学校</span><strong>'+esc(FACE_SCHOOLS.find(s=>s.id===faceSelectedSchool)?.name||'')+'</strong></div><div class="face-bulk-scope"><span>'+verb+'范围</span><div class="face-bulk-segments">'+scopeButtons+'</div></div><p class="face-bulk-help">勾选需要'+verb+'的范围，可多选。'+(faceBulkAction==='restore'?'仅可选择有已禁用学生的范围。':'已全部禁用的选项不可选。')+'</p><div class="face-bulk-list"><div class="face-bulk-list-head"><label><input type="checkbox" id="face-bulk-all" onchange="toggleAllFaceBulk(this.checked)"> 全选</label><span>可'+verb+'人数</span></div><div id="face-bulk-options">'+renderFaceBulkOptions()+'</div></div><div class="face-bulk-summary" id="face-disable-summary">已选 0 项，涉及 0 名学生</div></div>','<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" id="face-class-next" disabled onclick="confirmFaceClassDisable()">下一步</button>');
  updateFaceClassSelection();
}
function updateFaceClassSelection(){
  faceDisableClasses=[...document.querySelectorAll('input[name="face-disable-class"]:checked')].map(el=>el.value);
  const count=FACE_STUDENTS.filter(s=>s.schoolId===faceSelectedSchool&&faceDisableClasses.includes(faceBulkValue(s))&&faceBulkEligible(s)).length;
  document.getElementById('face-disable-summary').textContent='已选 '+faceDisableClasses.length+' 个'+(faceBulkScope==='grade'?'年级':'班级')+'，涉及 '+count+' 名学生';
  document.getElementById('face-class-next').disabled=!count;
  const all=document.getElementById('face-bulk-all');
  const choices=[...document.querySelectorAll('input[name="face-disable-class"]:not(:disabled)')];
  if(all){all.disabled=!choices.length;all.checked=choices.length>0&&choices.every(el=>el.checked);all.indeterminate=choices.some(el=>el.checked)&&!all.checked;}
}
function confirmFaceClassDisable(){
  const schoolId=faceSelectedSchool, values=[...faceDisableClasses],scope=faceBulkScope;
  const label=scope==='grade'?'年级':'班级', action=faceBulkAction, verb=action==='restore'?'恢复':'禁用';
  const students=FACE_STUDENTS.filter(s=>s.schoolId===schoolId&&values.includes(scope==='grade'?faceGrade(s):s.className)&&faceBulkEligible(s));
  if(!students.length)return toast('请选择可'+verb+'的'+label,'warning');
  openFaceDialog('确认批量'+verb+label,'<div class="face-bulk-ui face-bulk-confirm"><p style="line-height:1.8;overflow-wrap:anywhere;margin:0 0 16px">确认'+verb+' <strong>'+values.map(v=>esc(v)).join('、')+'</strong> 共 <strong>'+students.length+'</strong> 名学生的人脸？</p><div class="face-bulk-warning" style="margin-bottom:12px">'+(action==='restore'?'恢复后可使用已同步的人脸信息登录本校柜机。':'禁用后无法扫脸登录，仍可使用编号密码。')+'</div></div>','<button class="btn" onclick="openFaceBulkDisable(true)">上一步</button><button class="btn" onclick="closeModal()">取消</button><button class="btn '+(action==='restore'?'btn-primary':'face-bulk-danger')+'" id="face-class-confirm">确认'+verb+'</button>');
  document.getElementById('face-class-confirm').onclick=()=>{students.forEach(s=>{if(action==='restore')delete faceDisabled[s.id];else faceDisabled[s.id]=true;});localStorage.setItem(FACE_DISABLED_KEY,JSON.stringify(faceDisabled));closeModal();refreshFaceSyncView();toast('已'+verb+' '+values.length+' 个'+label+'、'+students.length+' 名学生的人脸','success');};
}
function exportFaceHistory(id) {
  const t=faceHistory.find(t=>t.id===id && t.schoolId===faceSelectedSchool);if(!t)return;
  const school=FACE_SCHOOLS.find(s=>s.id===t.schoolId)?.name||'';
  const rows=[['压缩包','学校','班级','导入时间','照片文件名','学生编号','姓名','导入状态','说明'],...t.items.map(i=>[t.fileName,school,t.className,t.time,i.fileName,i.studentId,i.name,'导入成功','']),...t.failures.map(value=>{const f=faceFailureInfo(value);return [t.fileName,school,t.className,t.time,f.fileName,'','','导入失败',f.reason];})];
  const url=URL.createObjectURL(buildFaceExcel(rows));
  const a=document.createElement('a');a.href=url;a.download=t.fileName.replace(/\.zip$/i,'')+'-导入记录.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function processFaceSyncQueue() {
  if(faceSyncBusy)return;
  let task,item;
  for(const t of [...faceHistory].reverse().concat(faceSingleSyncTasks).sort((a,b)=>(a.queuedAt || 0)-(b.queuedAt || 0))) { const next=t.items.find(i=>i.status==='待同步' && !i.simulationHold);if(next){task=t;item=next;break;} }
  if(!item)return;
  faceSyncBusy=true;item.status='同步中';
  const syncingStudent=FACE_STUDENTS.find(s=>s.id===item.studentId);
  if(syncingStudent && syncingStudent.syncTaskId===task.id) syncingStudent.syncStatus='同步中';
  saveFaceHistory();refreshFaceSyncView();
  setTimeout(()=>{
    const failed=!!item.simulationReason || (!item.simulationNormal && item.studentId==='2026005');item.status=failed?'同步失败':'同步成功';item.reason=item.simulationReason || (failed?'未检测到有效人脸，请更换照片':'');
    const student=FACE_STUDENTS.find(s=>s.id===item.studentId);
    if(student && student.syncTaskId===task.id){
      student.syncStatus=item.status;student.syncFailureReason=item.reason;
      if(!failed && student.pendingPhoto?.taskId===task.id){
        if(student.photoUrl?.startsWith('blob:'))URL.revokeObjectURL(student.photoUrl);
        student.photoFile=student.pendingPhoto.fileName;student.photoUrl=student.pendingPhoto.url;
        student.registeredPhotoFile=student.photoFile;student.recognitionSource='后台上传';
        student.updatedAt=new Date().toLocaleString('sv-SE');delete student.pendingPhoto;
      }
    }

    faceSyncBusy=false;saveFaceHistory();refreshFaceSyncView();processFaceSyncQueue();
  },3000);
}

function compactFaceImportReason(reason) {
  return String(reason||'').replace('该班级中没有此编号或姓名','班级内未找到学生').replace('该班级中没有此姓名','班级内未找到学生').replace('该班级中姓名重复，请使用学生编号命名','姓名重复，请使用编号或单独上传').replace('该班级中姓名重复，请添加后缀','姓名重复，请使用编号或单独上传').replace('同一学生存在多张照片，请仅保留一张后重新导入','照片重复，请保留一张');
}
function faceFailureInfo(value) {
  if (typeof value === 'object' && value) return {...value,reason:compactFaceImportReason(value.reason)};
  const text=String(value), index=text.indexOf('：');
  return { fileName:index>=0?text.slice(0,index):'—', reason:compactFaceImportReason(index>=0?text.slice(index+1):text) };
}
function runFaceImport(recordId) {
  const record=faceImportFiles.find(r=>r.id===recordId);
  if(!record || record.uploadStatus!=='success' || record.importStatus)return;
  const task={queuedAt:Date.now(),id:'FACE-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),schoolId:record.schoolId,className:record.className,fileName:record.fileName,time:new Date().toLocaleString('sv-SE'),failures:[...record.failures],items:[]};
  record.matches.forEach(match=>{
    const student=FACE_STUDENTS.find(s=>s.id===match.studentId);if(!student)return;
    if(student.pendingPhoto?.url?.startsWith('blob:'))URL.revokeObjectURL(student.pendingPhoto.url);
    student.pendingPhoto={taskId:task.id,fileName:match.originalName,url:URL.createObjectURL(match.blob)};student.registeredPhotoFile=null;student.syncStatus='待同步';student.syncFailureReason='';student.syncTaskId=task.id;
    task.items.push({studentId:student.id,name:student.name,fileName:match.originalName,status:'待同步',reason:''});
  });
  applyFaceConsoleScenario(task);
  faceHistory.unshift(task);saveFaceHistory();record.importStatus=record.failures.length?'partial':'success';record.note='导入 '+task.items.length+' 张，跳过 '+record.failures.length+' 张';
  record.importTime=task.time;
  record.historyId=task.id;
  if(!task.items.length)record.importStatus='failed';
  refreshFaceImportList();refreshFaceSyncView();processFaceSyncQueue();
}

function exportFaceImportRecord(recordId) {
  const record=faceImportFiles.find(r=>r.id===recordId);
  if(!record || !['success','partial','failed'].includes(record.importStatus) || !record.historyId)return;
  exportFaceHistory(record.historyId);
}

function renderFaceImportRow(record) {
  if (record.uploadStatus === 'checking') return `<tr><td>${esc(record.fileName)}</td><td>校验中</td><td>—</td><td>${esc(record.note)}</td><td>—</td></tr>`;
  if (record.uploadStatus === 'fail') return `<tr><td>${esc(record.fileName)}</td><td><span class="import-result-fail">上传失败</span></td><td>—</td><td>${esc(record.note)}</td><td>—</td></tr>`;
  let actionCell = `<button class="btn-link" onclick="runFaceImport('${record.id}')">导入</button>`;
  if (record.importStatus === 'processing') actionCell = '<span>导入中</span>';
  if (record.importStatus === 'success') actionCell = '<span class="import-action-success">导入成功</span>';
  if (record.importStatus === 'partial') actionCell = '<span class="status-tag warning">部分成功</span>';
  if (record.importStatus === 'failed') actionCell = '<span class="import-result-fail">导入失败</span>';
  if (['success','partial','failed'].includes(record.importStatus) && record.historyId) actionCell += ` <button class="btn-link" onclick="exportFaceImportRecord('${record.id}')">导出Excel</button>`;
  const detail = record.failures.length ? `<details><summary>${esc(record.note)}</summary><div class="form-hint" style="margin-top:6px;max-height:115px;overflow-y:auto;line-height:23px">${record.failures.map(item => {const f=faceFailureInfo(item);return esc(f.fileName)+'：'+esc(f.reason);}).join('<br>')}</div></details>` : esc(record.note);
  return `<tr><td>${esc(record.fileName)}</td><td>上传完成</td><td style="white-space:nowrap">${esc(record.importTime||'—')}</td><td>${detail}</td><td style="white-space:nowrap">${actionCell}</td></tr>`;
}

function renderFaceImportList() {
  if (!faceImportFiles.length) return '<div class="batch-import-empty">暂无上传记录</div>';
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>文件名</th><th>上传结果</th><th>导入时间</th><th>说明</th><th>操作</th></tr></thead><tbody>${faceImportFiles.map(renderFaceImportRow).join('')}</tbody></table></div>`;
}

function refreshFaceImportList() {
  const list = document.getElementById('face-import-list');
  if (list) list.innerHTML = renderFaceImportList();
}

function openFaceImportModal() {
  faceImportFiles = [];
  const modal = document.getElementById('modal');
  const school = FACE_SCHOOLS.find(item => item.id === faceSelectedSchool);
  const classes = [...new Set(FACE_STUDENTS.filter(item => item.schoolId === faceSelectedSchool).map(item => item.className))];
  document.getElementById('modal-title').textContent = '导入学生照片';
  document.getElementById('modal-subtitle').style.display = 'none';
  document.getElementById('modal-body').innerHTML = `<div class="batch-import-modal"><div class="face-import-main"><div class="batch-import-cabinet-row"><div class="batch-import-cabinet-field"><label class="form-label">当前学校</label><div class="input" style="width:100%;background:#f5f7fa">${esc(school?.name || '未选择学校')}</div></div><div class="batch-import-cabinet-field"><label class="form-label"><span class="required">*</span>班级</label><select class="select" id="face-import-class-select" style="width:100%"><option value="">请选择班级</option>${classes.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select></div></div><div class="batch-import-list face-import-list" id="face-import-list">${renderFaceImportList()}</div></div><div class="batch-import-upload"><p class="form-hint">选择班级后上传该班照片 ZIP。支持按学生编号或完整姓名匹配，可在同一压缩包内混用。</p><div class="batch-import-dropzone" id="face-import-dropzone"><div class="batch-import-dropzone-icon">📄</div><p class="batch-import-dropzone-text">拖动或点击上传该班照片 ZIP</p></div><input type="file" id="face-import-file-input" hidden accept=".zip"><div class="form-hint" style="margin-top:12px;line-height:1.8"><strong>照片命名规则</strong><br>格式：学生编号或完整姓名.扩展名<br>例如：2026001.jpg、张三.jpg；编号需保留前导零<br>同班姓名重复请使用学生编号；同一学生仅保留一张照片<br>支持 JPG、JPEG、PNG；系统自动将每张照片压缩至 2MB 以内</div></div></div>`;
  document.getElementById('modal-footer').style.display = '';
  document.getElementById('modal-footer').innerHTML = '<button type="button" class="btn" onclick="closeModal()">关闭</button>';
  modal.classList.remove('modal-sm'); modal.classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
  const zone = document.getElementById('face-import-dropzone');
  const input = document.getElementById('face-import-file-input');
  zone?.addEventListener('click', triggerFaceImportUpload);
  input?.addEventListener('change', async event => { await handleFaceImportFiles(event.target.files); event.target.value = ''; });
  zone?.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('batch-import-dropzone--active'); });
  zone?.addEventListener('dragleave', () => zone.classList.remove('batch-import-dropzone--active'));
  zone?.addEventListener('drop', async event => { event.preventDefault(); zone.classList.remove('batch-import-dropzone--active'); await handleFaceImportFiles(event.dataTransfer.files); });
}
function switchFacePage(page) {
  faceCurrentPage = page;
  navigate('face-library');
}


function switchFaceSchool(schoolId) {
  faceSelectedSchool = schoolId;

  faceFilters = { id: '', name: '', className: '', status: '', faceState: '', hasFace: '' };
  faceCurrentPage = 1;
  navigate('face-library');
}



function renderFaceLibraryPage() {
  const schoolSelector = `<div class="filter-row"><label>学校 <select class="select" onchange="switchFaceSchool(this.value)"><option value="">请选择学校</option>${FACE_SCHOOLS.map(school => `<option value="${school.id}" ${faceSelectedSchool === school.id ? 'selected' : ''}>${school.name}</option>`).join('')}</select></label></div>`;
  if (!faceSelectedSchool) {
    return `<div class="page-card"><div class="page-card-header"><div><div class="page-card-title">学生人脸信息</div><p class="form-hint">请先选择学校，再查看该校学生人脸信息。</p></div></div>${schoolSelector}<div class="empty-state"><div class="empty-icon">🏫</div><div class="empty-title">请先选择学校</div><div class="empty-desc">人脸信息和同步范围均按学校管理</div></div></div>`;
  }
  const schoolStudents = FACE_STUDENTS.filter(student => student.schoolId === faceSelectedSchool);
  const schoolClasses = [...new Set(schoolStudents.map(student => student.className))];
  const filteredStudents = schoolStudents.filter(student => student.id.includes(faceFilters.id) && student.name.includes(faceFilters.name) && (!faceFilters.className || student.className === faceFilters.className) && (!faceFilters.status || student.syncStatus === faceFilters.status) && (!faceFilters.faceState || (faceDisabled[student.id] ? 'disabled' : 'normal') === faceFilters.faceState) && (!faceFilters.hasFace || (student.photoFile || student.recognitionSource ? 'yes' : 'no') === faceFilters.hasFace));
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / facePageSize));
  faceCurrentPage = Math.min(faceCurrentPage, totalPages);
  const pageStudents = filteredStudents.slice((faceCurrentPage - 1) * facePageSize, faceCurrentPage * facePageSize);
  return `<div class="page-card">
    <div class="page-card-header"><div><div class="page-card-title">学生人脸信息</div><p class="form-hint">查看当前学校柜机录入并同步的学生人脸信息。学生照片仅展示后台最近一次上传的照片，当前识别数据以人脸来源为准。</p></div></div>
    ${schoolSelector}
    <div class="filter-row"><label>学生编号 <input id="face-filter-id" class="input" placeholder="请输入学生编号" value="${esc(faceFilters.id)}"></label><label>姓名 <input id="face-filter-name" class="input" placeholder="请输入姓名" value="${esc(faceFilters.name)}"></label><label>班级 <select id="face-filter-class" class="select"><option value="">全部班级</option>${schoolClasses.map(c => `<option value="${esc(c)}" ${faceFilters.className === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label><label>是否已有人脸信息 <select id="face-filter-has-face" class="select"><option value="">全部</option><option value="yes" ${faceFilters.hasFace === 'yes' ? 'selected' : ''}>有</option><option value="no" ${faceFilters.hasFace === 'no' ? 'selected' : ''}>无</option></select></label><label>人脸状态 <select id="face-filter-state" class="select"><option value="">全部</option><option value="normal" ${faceFilters.faceState === 'normal' ? 'selected' : ''}>正常</option><option value="disabled" ${faceFilters.faceState === 'disabled' ? 'selected' : ''}>已禁用</option></select></label><label>同步状态 <select id="face-filter-status" class="select"><option value="">全部状态</option>${['同步中','同步成功','同步失败','待同步'].map(status => `<option ${faceFilters.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><button class="btn btn-secondary" onclick="searchFaceStudents(true)">重置</button><button class="btn btn-primary" onclick="searchFaceStudents()">搜索</button></div>
    <div class="page-card-actions" style="margin:16px 0"><button class="btn btn-primary" onclick="openFaceImportModal()">＋ 导入照片</button> <button class="btn" id="face-bulk-disable" onclick="openFaceBulkDisable()">批量禁用年级/班级</button> <button class="btn" id="face-bulk-restore" onclick="openFaceBulkRestore()">批量恢复年级/班级</button> <button class="btn" onclick="openFaceSyncStatus()">查看同步状态${faceSyncPendingCount() ? '（'+faceSyncPendingCount()+'）' : ''}</button></div>
    <table class="data-table"><thead><tr><th>学生编号</th><th>姓名</th><th>班级</th><th title="保留最近同步成功的照片，新照片同步成功后更新">学生照片</th><th title="本次更新尚未同步成功时为空">最近注册成功照片</th><th>人脸来源</th><th>最近更新时间</th><th>人脸状态</th><th>同步状态</th><th>操作</th></tr></thead><tbody>${pageStudents.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${facePhotoHtml(s)}</td><td>${s.registeredPhotoFile ? facePhotoHtml(s) : '<span class="text-muted">—</span>'}</td><td>${s.recognitionSource || '—'}</td><td>${s.updatedAt || '—'}</td><td>${faceDisabled[s.id] ? '<span style="color:#cf1322">已禁用</span>' : '正常'}</td><td><span style="color:${({'同步中':'#1677ff','同步成功':'#389e0d','同步失败':'#cf1322','待同步':'#d48806'})[s.syncStatus] || '#999'}">${s.syncStatus || '—'}</span></td><td style="white-space:nowrap"><button class="btn-link" onclick="openFacePhotoEdit('${s.id}')">${s.photoFile ? '修改照片' : '上传照片'}</button> ${faceDisabled[s.id] ? `<button class="btn-link" onclick="openFaceRestore('${s.id}')">恢复</button>` : `<button class="btn-link" onclick="openFaceDisable('${s.id}')">禁用人脸</button>`}</td></tr>`).join('')}</tbody></table>
    <div class="pagination pagination--with-size"><span class="page-btn ${faceCurrentPage === 1 ? 'disabled' : ''}" onclick="${faceCurrentPage === 1 ? '' : 'switchFacePage(' + (faceCurrentPage - 1) + ')'}">‹</span>${Array.from({length: totalPages}, (_, i) => `<span class="page-btn ${faceCurrentPage === i + 1 ? 'active' : ''}" onclick="switchFacePage(${i + 1})">${i + 1}</span>`).join('')}<span class="page-btn ${faceCurrentPage === totalPages ? 'disabled' : ''}" onclick="${faceCurrentPage === totalPages ? '' : 'switchFacePage(' + (faceCurrentPage + 1) + ')'}">›</span><span class="page-size-picker">每页 <select class="select page-size-select" aria-label="每页条数"><option selected>10 条</option><option>20 条</option><option>50 条</option></select></span><span class="page-jump">跳至 <input class="input sm" value="${faceCurrentPage}"> 页</span></div>
  </div>`;
}

function renderFaceLoginRecordPage() {
  return `<div class="page-card"><div class="page-card-header"><div><div class="page-card-title">人脸登录记录</div><p class="form-hint">记录柜机上的人脸登录、识别失败及学号密码兜底登录。</p></div></div>
    <div class="filter-row"><label>学生编号 <input class="input" placeholder="请输入学生编号"></label><label>结果 <select class="select"><option>全部</option><option>成功</option><option>失败</option><option>密码兜底</option></select></label><button class="btn btn-secondary">重置</button><button class="btn btn-primary">搜索</button></div>
    <table class="data-table"><thead><tr><th>时间</th><th>学生编号</th><th>姓名</th><th>班级</th><th>柜机</th><th>登录方式</th><th>结果</th><th>说明</th></tr></thead><tbody>${FACE_LOGIN_RECORDS.map(r => `<tr><td>${r.time}</td><td>${r.id}</td><td>${r.name}</td><td>${r.className}</td><td>${r.cabinet}</td><td>${r.method}</td><td>${r.result === 'success' ? '<span class="status-tag enabled">成功</span>' : r.result === 'fallback' ? '<span class="status-tag warning">密码兜底</span>' : '<span class="status-tag disabled">失败</span>'}</td><td>${r.reason}</td></tr>`).join('')}</tbody></table>
  </div>`;
}

faceHistory.concat(faceSingleSyncTasks).forEach(t=>t.items.forEach(i=>{if(i.status==='同步中')i.status='待同步';}));
setTimeout(processFaceSyncQueue, 1000);

const FACE_SYNC_STATES = ['待同步','同步中','同步成功','同步失败'];
const faceSyncPages = { list:{page:1,size:10,status:''}, detail:{page:1,size:10,status:'',id:''} };
function faceSyncTasks(){return faceHistory.concat(faceSingleSyncTasks).filter(t=>t.schoolId===faceSelectedSchool && t.items.length).sort((a,b)=>(b.queuedAt||Date.parse(b.time)||0)-(a.queuedAt||Date.parse(a.time)||0));}
function faceSyncTaskState(t){
  const c=faceTaskCounts(t);
  if(c.running || (c.waiting && c.success+c.failed))return '同步中';
  if(c.waiting)return '待同步';
  return c.failed?'同步失败':'同步成功';
}
function faceSyncBadge(status){const color={'待同步':'#d48806','同步中':'#1677ff','同步成功':'#389e0d','同步失败':'#cf1322'}[status]||'#666';return '<span style="color:'+color+'">'+esc(status)+'</span>';}
function faceSyncSummary(t){const c=faceTaskCounts(t);return '<div style="line-height:1.8">'+faceSyncBadge(faceSyncTaskState(t))+'<div class="form-hint">共 '+t.items.length+' 张 · 同步成功 '+c.success+' / 同步失败 '+c.failed+' / 同步中 '+c.running+' / 待同步 '+c.waiting+'</div></div>';}

function openFaceSyncDetail(id){if(faceSyncPages.detail.id!==id)Object.assign(faceSyncPages.detail,{id,page:1,status:''});openTab('face-sync-detail','同步状态详情',{schoolId:faceSelectedSchool,id});}
function faceSyncFilter(kind){return '<div class="filter-row"><label>同步状态 <select class="select" onchange="filterFaceSync(&quot;'+kind+'&quot;,this.value)"><option value="">全部状态</option>'+FACE_SYNC_STATES.map(status=>'<option '+(faceSyncPages[kind].status===status?'selected':'')+'>'+status+'</option>').join('')+'</select></label></div>';}
function filterFaceSync(kind,status){faceSyncPages[kind].status=status;faceSyncPages[kind].page=1;refreshFaceSyncRoute(kind);}
function refreshFaceSyncRoute(kind){navigate(kind==='list'?'face-sync-status':'face-sync-detail',{schoolId:faceSelectedSchool,...(kind==='detail'?{id:faceSyncPages.detail.id}:{})});}
function pageFaceSync(kind,page,size){const state=faceSyncPages[kind];if(size){state.size=[10,20,50].includes(Number(size))?Number(size):10;state.page=1;}else state.page=Math.max(1,Math.floor(Number(page)||1));refreshFaceSyncRoute(kind);}
function faceSyncPager(kind,total){
  const s=faceSyncPages[kind],max=Math.max(1,Math.ceil(total/s.size));s.page=Math.min(s.page,max);
  let buttons='';for(let n=Math.max(1,s.page-2);n<=Math.min(max,s.page+2);n++)buttons+='<button class="page-btn '+(n===s.page?'active':'')+'" onclick="pageFaceSync(&quot;'+kind+'&quot;,'+n+')">'+n+'</button>';
  return '<div class="pagination pagination--with-size"><span>共 '+total+' 条</span><button class="page-btn" '+(s.page===1?'disabled':'')+' onclick="pageFaceSync(&quot;'+kind+'&quot;,'+(s.page-1)+')">‹</button>'+buttons+'<button class="page-btn" '+(s.page===max?'disabled':'')+' onclick="pageFaceSync(&quot;'+kind+'&quot;,'+(s.page+1)+')">›</button><span>共 '+max+' 页</span><select class="select" onchange="pageFaceSync(&quot;'+kind+'&quot;,1,this.value)">'+[10,20,50].map(n=>'<option value="'+n+'" '+(s.size===n?'selected':'')+'>'+n+' 条 / 页</option>').join('')+'</select><label>跳至 <input class="input sm" type="number" min="1" max="'+max+'" value="'+s.page+'" onchange="pageFaceSync(&quot;'+kind+'&quot;,this.value)"> 页</label></div>';
}
function renderFaceSyncStatusPage(params){
  faceSelectedSchool=params?.schoolId||faceSelectedSchool;
  const state=faceSyncPages.list,tasks=faceSyncTasks().filter(t=>!state.status||faceSyncTaskState(t)===state.status),pager=faceSyncPager('list',tasks.length);
  const school=FACE_SCHOOLS.find(s=>s.id===faceSelectedSchool)?.name||'';
  return '<div class="page-card"><div class="page-card-header"><div class="page-card-title">同步状态</div><button class="btn" onclick="navigate(&quot;face-library&quot;)">返回人脸信息管理</button></div><p class="form-hint">学校：'+esc(school)+'</p>'+faceSyncFilter('list')+'<div class="table-wrap"><table class="data-table"><thead><tr><th>文件名</th><th>班级</th><th>提交时间</th><th>同步状态</th><th>操作</th></tr></thead><tbody>'+ (tasks.slice((state.page-1)*state.size,state.page*state.size).map(t=>'<tr><td>'+esc(t.fileName)+'</td><td>'+esc(t.className)+'</td><td>'+esc(t.time)+'</td><td>'+faceSyncSummary(t)+'</td><td><button class="btn-link" onclick="openFaceSyncDetail(&quot;'+t.id+'&quot;)">查看详情</button></td></tr>').join('')||'<tr><td colspan="5">暂无同步任务</td></tr>')+'</tbody></table></div>'+pager+'</div>';
}
function renderFaceSyncDetailPage(params){
  faceSelectedSchool=params?.schoolId||faceSelectedSchool;
  const state=faceSyncPages.detail;if(state.id!==params?.id)Object.assign(state,{id:params?.id,page:1,status:''});
  const t=faceSyncTasks().find(t=>t.id===state.id);if(!t)return '<div class="page-card">未找到同步任务</div>';
  const items=t.items.filter(i=>!state.status||i.status===state.status),pager=faceSyncPager('detail',items.length);
  return '<div class="page-card"><div class="page-card-header"><div class="page-card-title">同步状态详情</div><button class="btn" onclick="openFaceSyncStatus()">返回同步状态</button></div><p>'+esc(t.fileName)+' · '+esc(t.className)+' · '+esc(t.time)+'</p><div style="padding:16px;background:#f5f7fa;border-radius:8px;margin-bottom:16px">'+faceSyncSummary(t)+'</div>'+faceSyncFilter('detail')+'<div class="table-wrap"><table class="data-table"><thead><tr><th>照片文件名</th><th>学生编号</th><th>姓名</th><th>同步状态</th><th>说明</th></tr></thead><tbody>'+(items.slice((state.page-1)*state.size,state.page*state.size).map(i=>'<tr><td>'+esc(i.fileName)+'</td><td>'+esc(i.studentId)+'</td><td>'+esc(i.name||'—')+'</td><td>'+faceSyncBadge(i.status)+'</td><td>'+esc(i.reason||'—')+'</td></tr>').join('')||'<tr><td colspan="5">暂无符合条件的照片</td></tr>')+'</tbody></table></div>'+pager+'</div>';
}

let faceConsoleScenario='normal';
const faceConsoleLabels={normal:'正常模拟',compress:'照片压缩失败',noFace:'未检测到人脸',delivery:'柜机下发失败',queued:'待同步排队'};
function renderFaceConsole(){
  return '<div class="console-page-head"><span class="console-route-label">当前菜单</span><strong>人脸信息管理</strong></div><section class="console-section"><h4>异常场景模拟</h4><p>当前：'+faceConsoleLabels[faceConsoleScenario]+'</p><p>选择后作用于下一次单人上传，或批量导入的第一张有效照片。</p><div style="display:flex;flex-wrap:wrap;gap:8px">'+Object.entries(faceConsoleLabels).filter(([key])=>key!=='normal').map(([key,label])=>'<button class="btn '+(faceConsoleScenario===key?'btn-primary':'')+'" onclick="setFaceConsoleScenario(&quot;'+key+'&quot;)">'+label+'</button>').join('')+'<button class="btn" onclick="setFaceConsoleScenario(&quot;normal&quot;)">恢复正常模拟</button></div><p>待同步排队将暂停该照片；点击恢复正常模拟后继续同步。</p></section><div class="console-note">仅用于原型演示，不影响真实柜机。</div>';
}
function setFaceConsoleScenario(value){
  if(!Object.hasOwn(faceConsoleLabels,value))return;
  faceConsoleScenario=value;
  if(value==='normal'){
    faceHistory.concat(faceSingleSyncTasks).forEach(t=>t.items.forEach(i=>{if(i.simulationHold){delete i.simulationHold;i.simulationNormal=true;}}));
    saveFaceHistory();processFaceSyncQueue();
  }
  renderConsolePanel();toast(value==='normal'?'已恢复正常模拟':'下一次上传模拟：'+faceConsoleLabels[value],'success');
}
function applyFaceConsoleScenario(task){
  const item=task.items[0];if(!item)return;
  if(faceConsoleScenario==='queued')item.simulationHold=true;
  if(faceConsoleScenario==='noFace')item.simulationReason='未检测到有效人脸，请更换照片';
  if(faceConsoleScenario==='delivery')item.simulationReason='柜机下发失败，请检查柜机连接';
  if(faceConsoleScenario!=='compress'){faceConsoleScenario='normal';renderConsolePanel();}
}

let faceSyncDrawerSchool='';
function faceSyncPendingCount(){return faceSyncTasks().filter(t=>t.items.some(i=>i.status==='待同步'||i.status==='同步中')).length;}
function openFaceSyncStatus(){
  faceSyncDrawerSchool=faceSelectedSchool;
  let overlay=document.getElementById('face-sync-drawer');
  if(!overlay){
    overlay=document.createElement('div');overlay.id='face-sync-drawer';overlay.className='face-sync-drawer-overlay';
    overlay.innerHTML='<section class="face-sync-drawer" role="dialog" aria-modal="true" aria-labelledby="face-sync-drawer-title"><header><div><h3 id="face-sync-drawer-title">同步状态</h3><span id="face-sync-drawer-school"></span></div><button class="btn" aria-label="返回" onclick="closeFaceSyncDrawer()">返回</button></header><div id="face-sync-drawer-body" class="face-sync-drawer-body"></div></section>';
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeFaceSyncDrawer();});
    overlay.addEventListener('keydown',e=>{
      if(e.key==='Escape')closeFaceSyncDrawer();
      if(e.key==='Tab'){const targets=[...overlay.querySelectorAll('button,summary')],first=targets[0],last=targets[targets.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    });
    document.body.appendChild(overlay);
  }
  refreshFaceSyncDrawer();overlay.querySelector('button').focus();
}
function closeFaceSyncDrawer(){document.getElementById('face-sync-drawer')?.remove();document.querySelector('[onclick="openFaceSyncStatus()"]')?.focus();}
function renderFaceSyncCard(t){
  const c=faceTaskCounts(t),done=c.success+c.failed,remaining=c.waiting+c.running;
  const errors=t.items.filter(i=>i.status==='同步失败');
  return '<article class="face-sync-card"><div class="face-sync-card-head"><strong title="'+esc(t.fileName)+'">'+esc(t.fileName)+'</strong><span class="face-sync-card-time">'+esc(t.time)+'</span>'+(remaining===0?'<span>同步完成</span>':'<span style="color:#1677ff">同步中</span>')+'</div><div class="face-sync-card-progress"><progress max="'+t.items.length+'" value="'+done+'" aria-label="'+esc(t.fileName)+'同步进度"></progress><strong>'+done+' / '+t.items.length+' 张</strong></div><div class="face-sync-card-meta"><span>'+esc(t.className)+'</span><span>待同步 '+c.waiting+'</span><span>同步中 '+c.running+'</span><span>同步成功 '+c.success+'</span><span class="'+(c.failed?'face-sync-card-failed':'')+'">同步失败 '+c.failed+'</span></div>'+(errors.length?'<details data-task="'+esc(t.id)+'"><summary>查看异常（'+errors.length+'）</summary><div class="face-sync-errors">'+errors.map(i=>'<div><strong>'+esc(i.fileName)+'</strong>'+(i.reason && i.reason!=='未检测到有效人脸，请更换照片'?'<p>'+esc(i.reason)+'</p>':'')+'</div>').join('')+'</div></details>':'')+'</article>';
}
function refreshFaceSyncDrawer(){
  const body=document.getElementById('face-sync-drawer-body');if(!body)return;
  const expanded=new Set([...body.querySelectorAll('details[open]')].map(el=>el.dataset.task)),scroll=body.scrollTop;
  const tasks=faceHistory.concat(faceSingleSyncTasks).filter(t=>t.schoolId===faceSyncDrawerSchool&&t.items.length).sort((a,b)=>(b.queuedAt||Date.parse(b.time)||0)-(a.queuedAt||Date.parse(a.time)||0)).slice(0,100);
  const pending=t=>t.items.some(i=>i.status==='待同步'||i.status==='同步中');
  tasks.sort((a,b)=>Number(pending(b))-Number(pending(a))||(b.queuedAt||Date.parse(b.time)||0)-(a.queuedAt||Date.parse(a.time)||0));
  document.getElementById('face-sync-drawer-school').textContent=FACE_SCHOOLS.find(s=>s.id===faceSyncDrawerSchool)?.name||'';
  body.innerHTML=tasks.length?tasks.map(renderFaceSyncCard).join(''):'<div class="empty-state">暂无同步任务，上传照片后可在此查看</div>';
  body.querySelectorAll('details').forEach(el=>el.open=expanded.has(el.dataset.task));body.scrollTop=scroll;
}

// Minimal OOXML workbook: all values are text, preserving student numbers and filenames.
function buildFaceExcel(rows){
  const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const data=rows.map((row,r)=>'<row r="'+(r+1)+'">'+row.map((value,c)=>'<c r="'+String.fromCharCode(65+c)+(r+1)+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>').join('')+'</row>').join('');
  const files={
    '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':'<workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="导入记录" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml':'<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="9" width="24" customWidth="1"/><col min="9" max="9" width="45" customWidth="1"/></cols><sheetData>'+data+'</sheetData><autoFilter ref="A1:I'+rows.length+'"/></worksheet>'
  };
  const encoder=new TextEncoder(),parts=[],directory=[];let offset=0;
  const crc=bytes=>{let value=0xffffffff;for(const byte of bytes){value^=byte;for(let bit=0;bit<8;bit++)value=(value>>>1)^((value&1)?0xedb88320:0);}return (value^0xffffffff)>>>0;};
  for(const [path,content] of Object.entries(files)){
    const name=encoder.encode(path),body=encoder.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+content),checksum=crc(body);
    const header=new Uint8Array(30+name.length),h=new DataView(header.buffer);h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,checksum,true);h.setUint32(18,body.length,true);h.setUint32(22,body.length,true);h.setUint16(26,name.length,true);header.set(name,30);parts.push(header,body);
    const central=new Uint8Array(46+name.length),v=new DataView(central.buffer);v.setUint32(0,0x02014b50,true);v.setUint16(4,20,true);v.setUint16(6,20,true);v.setUint16(8,0x800,true);v.setUint32(16,checksum,true);v.setUint32(20,body.length,true);v.setUint32(24,body.length,true);v.setUint16(28,name.length,true);v.setUint32(42,offset,true);central.set(name,46);directory.push(central);offset+=header.length+body.length;
  }
  const end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,directory.length,true);v.setUint16(10,directory.length,true);v.setUint32(12,directory.reduce((n,b)=>n+b.length,0),true);v.setUint32(16,offset,true);
  return new Blob([...parts,...directory,end],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
