/* 人脸识别管理 · MVP 原型 */
const FACE_SCHOOLS = [
  { id: 'school-001', name: '深圳市南山实验学校' },
  { id: 'school-002', name: '深圳市科技实验学校' },
];
const FACE_STUDENTS = [
  { id: '2026001', schoolId: 'school-001', name: '张三', className: '一年级1班', photoFile: '2026001.jpg', updatedAt: '2026-09-20 10:12:00', recognitionSource: '后台上传' },
  { id: '2026002', schoolId: 'school-001', name: '李四', className: '一年级1班', photoFile: '2026002.jpg', updatedAt: '2026-10-02 09:18:00', recognitionSource: '柜机录入' },
  { id: '2026003', schoolId: 'school-001', name: '王五（01）', className: '一年级1班', photoFile: '2026003.jpg', updatedAt: '2026-10-03 16:40:00', recognitionSource: '柜机录入' },
  { id: '2026025', schoolId: 'school-001', name: '王五（02）', className: '一年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026004', schoolId: 'school-001', name: '赵六', className: '一年级2班', photoFile: '2026004.jpg', updatedAt: '2026-09-18 15:22:00', recognitionSource: '后台上传' },
  { id: '2026026', schoolId: 'school-001', name: '赵六', className: '一年级2班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026005', schoolId: 'school-001', name: '孙七', className: '一年级3班', photoFile: '2026005.jpg', updatedAt: '2026-10-04 14:08:00', recognitionSource: '柜机录入' },
  { id: '2026006', schoolId: 'school-001', name: '周八', className: '一年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026007', schoolId: 'school-001', name: '吴九', className: '二年级1班', photoFile: '2026007.jpg', updatedAt: '2026-09-17 16:18:00', recognitionSource: '后台上传' },
  { id: '2026014', schoolId: 'school-001', name: '蒋一', className: '二年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026015', schoolId: 'school-001', name: '沈二', className: '二年级2班', photoFile: '2026015.jpg', updatedAt: '2026-09-14 11:05:00', recognitionSource: '后台上传' },
  { id: '2026016', schoolId: 'school-001', name: '韩三', className: '二年级2班', photoFile: '2026016.jpg', updatedAt: '2026-10-06 08:46:00', recognitionSource: '柜机录入' },
  { id: '2026017', schoolId: 'school-001', name: '杨四', className: '二年级3班', photoFile: '2026017.jpg', updatedAt: '2026-09-12 13:26:00', recognitionSource: '后台上传' },
  { id: '2026018', schoolId: 'school-001', name: '朱五', className: '二年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026008', schoolId: 'school-002', name: '郑十', className: '二年级1班', photoFile: '2026008.jpg', updatedAt: '2026-10-01 15:42:00', recognitionSource: '柜机录入' },
  { id: '2026009', schoolId: 'school-002', name: '钱一', className: '二年级2班', photoFile: '2026009.jpg', updatedAt: '2026-09-16 11:26:00', recognitionSource: '后台上传' },
  { id: '2026010', schoolId: 'school-002', name: '冯二', className: '二年级2班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026011', schoolId: 'school-002', name: '陈三', className: '二年级3班', photoFile: '2026011.jpg', updatedAt: '2026-09-15 16:44:00', recognitionSource: '后台上传' },
  { id: '2026012', schoolId: 'school-002', name: '褚四', className: '二年级3班', photoFile: '2026012.jpg', updatedAt: '2026-10-05 15:30:00', recognitionSource: '柜机录入' },
  { id: '2026013', schoolId: 'school-002', name: '卫五', className: '三年级1班', photoFile: '2026013.jpg', updatedAt: '2026-09-15 14:12:00', recognitionSource: '后台上传' },
  { id: '2026019', schoolId: 'school-002', name: '秦六', className: '三年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026020', schoolId: 'school-002', name: '尤七', className: '三年级2班', photoFile: '2026020.jpg', updatedAt: '2026-10-07 09:37:00', recognitionSource: '柜机录入' },
  { id: '2026021', schoolId: 'school-002', name: '许八', className: '三年级2班', photoFile: '2026021.jpg', updatedAt: '2026-09-11 10:20:00', recognitionSource: '后台上传' },
  { id: '2026022', schoolId: 'school-002', name: '何九', className: '三年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026023', schoolId: 'school-002', name: '吕十', className: '三年级3班', photoFile: '2026023.jpg', updatedAt: '2026-10-08 14:55:00', recognitionSource: '柜机录入' },
  { id: '2026024', schoolId: 'school-002', name: '施一', className: '四年级1班', photoFile: '2026024.jpg', updatedAt: '2026-09-10 09:48:00', recognitionSource: '后台上传' },
];

const FACE_LOGIN_RECORDS = [
  { time: '2026-09-28 08:31:22', id: '2026001', name: '张三', className: '一年级1班', result: 'success', method: '人脸识别', cabinet: '柜机-001', reason: '—' },
  { time: '2026-09-28 08:29:07', id: '2026008', name: '赵六', className: '一年级2班', result: 'failed', method: '人脸识别', cabinet: '柜机-001', reason: '未匹配到人脸' },
  { time: '2026-09-27 16:12:45', id: '2026003', name: '王五（01）', className: '一年级1班', result: 'fallback', method: '学号密码', cabinet: '柜机-002', reason: '未录入人脸' },
];
let faceCurrentPage = 1;
let facePageSize = 10;
let faceSelectedSchool = '';
let faceFilters = { id: '', name: '', className: '', status: '' };
FACE_STUDENTS.forEach((student, index) => {
  student.syncStatus = student.recognitionSource ? ['同步成功', '同步中', '同步失败', '待同步'][index % 4] : '';
  student.registeredPhotoFile = student.syncStatus === '同步成功' ? student.photoFile : null;
  student.syncFailureReason = student.syncStatus === '同步失败' ? (student.id === '2026005' ? '未检测到有效人脸，请更换照片' : '下发失败，请重新上传照片') : '';
});
function searchFaceStudents(reset = false) {
  faceBulkSelected.clear();
  faceFilters = reset ? { id: '', name: '', className: '', status: '' } : {
    id: document.getElementById('face-filter-id').value.trim(),
    name: document.getElementById('face-filter-name').value.trim(),
    className: document.getElementById('face-filter-class').value,
    status: document.getElementById('face-filter-status').value
  };
  faceCurrentPage = 1;
  navigate('face-library');
}
function refreshFaceSyncView() {
  const scrollState = [...document.querySelectorAll(".main-content, .content, main, #main-content")].map(el=>[el,el.scrollTop,el.scrollLeft]);
  const windowScroll = [window.scrollX,window.scrollY];
  if (location.hash.startsWith('#face-library')) renderApp('face-library', currentParams);
  if (location.hash.startsWith('#face-sync')) {
    const draft={};['name','status','start','end'].forEach(k=>{const el=document.getElementById('face-sync-'+k);if(el)draft[k]=el.value;});
    const active=document.activeElement?.id;
    renderApp(location.hash.startsWith('#face-sync-detail')?'face-sync-detail':'face-sync-status', currentParams);
    Object.entries(draft).forEach(([k,v])=>{const el=document.getElementById('face-sync-'+k);if(el)el.value=v;});
    if(active?.startsWith('face-sync-'))document.getElementById(active)?.focus();
  }
  refreshFaceSyncDetailDrawer();
  scrollState.forEach(([el,top,left])=>{el.scrollTop=top;el.scrollLeft=left;});
  window.scrollTo(...windowScroll);
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
  document.getElementById('modal-body').innerHTML = '<div class="face-edit-ui"><div class="face-edit-student"><strong>'+esc(student.name)+'</strong><span>编号：'+esc(student.id)+'</span><span>'+esc(student.className)+'</span></div><div class="face-edit-columns"><section class="face-edit-panel"><h4>当前照片</h4><div class="face-edit-image">'+photo+'</div><p class="face-edit-filename">'+esc(student.photoFile||'尚未上传照片')+'</p></section><section class="face-edit-panel"><h4>新照片</h4><label class="face-edit-upload" id="face-edit-upload" for="face-edit-file"><div id="face-edit-preview" class="face-edit-image"><div class="face-edit-empty"><span class="face-edit-plus">＋</span><strong>点击上传照片</strong><span>JPG / JPEG / PNG · 自动压缩</span></div></div><input id="face-edit-file" type="file" accept="image/jpeg,image/png" hidden onchange="selectFaceEditPhoto(this)"></label><div class="face-edit-file-actions"><span class="face-edit-filename" id="face-edit-filename">请选择照片</span><button type="button" class="btn-link" id="face-edit-reselect" hidden onclick="document.getElementById(&quot;face-edit-file&quot;).click()">重新选择</button></div></section></div><p class="face-edit-note">自动压缩至每张不超过 2MB。同步成功后更新学生照片及最近同步成功照片。</p></div>';
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
  const savedName = file.name;
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
function faceStudentHasPhoto(student) {
  return !!(student?.photoFile || student?.registeredPhotoFile || student?.pendingPhoto);
}
let faceDeleteScenario = 'success';
function setFaceDeleteScenario(value) {
  faceDeleteScenario = value;
  toast('下一次删除模拟：'+({success:'删除成功',timeout:'删除超时',failed:'删除失败'})[value], 'success');
}
function submitFaceDelete(students) {
  const result = faceDeleteScenario;
  faceDeleteScenario = 'success';
  if (result === 'success') { students.forEach(deleteFaceStudentPhotos); faceBulkSelected.clear(); faceBulkDeleteMode=false; }
  closeModal(); navigate('face-library');
  toast(result==='success'?'删除成功':result==='timeout'?'删除超时，请重试':'删除失败，请重试',result==='success'?'success':'warning');
}
function deleteFaceStudentPhotos(student) {
  if (student.photoUrl?.startsWith('blob:')) URL.revokeObjectURL(student.photoUrl);
  if (student.pendingPhoto?.url?.startsWith('blob:')) URL.revokeObjectURL(student.pendingPhoto.url);
  student.photoFile = null;
  student.photoUrl = null;
  student.registeredPhotoFile = null;
  delete student.pendingPhoto;
  delete student.syncTaskId;
  student.recognitionSource = null;
  student.updatedAt = null;
  student.syncStatus = '';
  student.syncFailureReason = '';
}
function openFacePhotoDelete(id) {
  const student = FACE_STUDENTS.find(item => item.id === id && item.schoolId === faceSelectedSchool);
  if (!student || !faceStudentHasPhoto(student)) return;
  openFaceDialog('删除照片', '<p>确认删除学生：'+esc(student.name)+'（'+esc(student.id)+'）的照片吗？</p><p class="form-hint">删除后，学生照片和最近同步成功照片都会清空。</p>', '<button class="btn" onclick="closeModal()">取消</button><button class="btn face-bulk-danger" id="face-photo-delete-confirm">确认删除</button>');
  document.getElementById('modal').classList.remove('modal-xl', 'modal-sm', 'modal-lg');
  document.getElementById('modal').classList.add('modal-md');
  document.getElementById('face-photo-delete-confirm').onclick = () => {
    submitFaceDelete([student]);
  };
}
let faceBulkDeleteMode = false;
let faceBulkSelected = new Set();
function filteredFaceStudents() {
  return FACE_STUDENTS.filter(student => student.schoolId === faceSelectedSchool && student.id.includes(faceFilters.id) && student.name.includes(faceFilters.name) && (!faceFilters.className || student.className === faceFilters.className) && (!faceFilters.status || (faceFilters.status === '无' ? !student.syncStatus : student.syncStatus === faceFilters.status)));
}

function faceBulkPageStudents() {
  return filteredFaceStudents().slice((faceCurrentPage-1)*facePageSize,faceCurrentPage*facePageSize).filter(faceStudentHasPhoto);
}
function openFacePhotoBulkDelete() { faceBulkDeleteMode=true; faceBulkSelected.clear(); navigate('face-library'); }
function cancelFaceBulkDelete() { faceBulkDeleteMode=false; faceBulkSelected.clear(); navigate('face-library'); }
function toggleFaceBulkStudent(id,checked) {
  if(checked) faceBulkSelected.add(id); else faceBulkSelected.delete(id);
  updateFaceBulkSelection();
}
function toggleFaceBulkPage(checked) {
  faceBulkPageStudents().forEach(s=>{if(checked)faceBulkSelected.add(s.id);else faceBulkSelected.delete(s.id);});
  document.querySelectorAll('[data-face-bulk-id]').forEach(el=>el.checked=faceBulkSelected.has(el.dataset.faceBulkId));
  updateFaceBulkSelection();
}
function updateFaceBulkSelection() {
  const choices=faceBulkPageStudents();
  const all=document.getElementById('face-bulk-page-all');
  const count=choices.filter(s=>faceBulkSelected.has(s.id)).length;
  if(all){all.checked=choices.length>0&&count===choices.length;all.indeterminate=count>0&&count<choices.length;all.disabled=!choices.length;}
  const summary=document.getElementById('face-bulk-selected-count'); if(summary)summary.textContent='已选 '+count+' 名学生';
  const button=document.getElementById('face-bulk-delete-next'); if(button)button.disabled=!count;
}
function confirmFacePhotoBulkDelete() {
  const students=faceBulkPageStudents().filter(s=>faceBulkSelected.has(s.id));
  if(!students.length)return;
  openFaceDialog('确认批量删除照片','<p>确认删除所选 <strong>'+students.length+'</strong> 名学生的照片吗？</p><p class="form-hint">删除后，学生照片和最近同步成功照片都会清空。</p>','<button class="btn" onclick="closeModal()">取消</button><button class="btn face-bulk-danger" id="face-photo-delete-confirm">确认删除</button>');
  const modal=document.getElementById('modal');modal.classList.remove('modal-xl','modal-sm','modal-lg');modal.classList.add('modal-md');
  document.getElementById('face-photo-delete-confirm').onclick=()=>submitFaceDelete(students);
}

function facePhotoHtml(student) {
  if (!student.photoFile) return '<span class="text-muted">未导入</span>';
  return `<button class="face-photo-thumb" type="button" onclick="openFacePhotoPreview('${student.id}')" title="${esc(student.photoFile)} · 点击放大" aria-label="查看${esc(student.name)}的照片">${student.photoUrl ? `<img src="${esc(student.photoUrl)}" alt="${esc(student.name)}" loading="lazy">` : `<span class="face-photo-thumb-placeholder"><span>${esc(student.name.slice(0,1))}</span><small>示例照片</small></span>`}</button>`;
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

async function uploadFaceDemoZip(button) {
  if (faceSelectedSchool !== 'school-001') { toast('请切换至深圳市南山实验学校体验演示', 'warning'); return; }
  button.disabled = true;
  try {
    document.getElementById('face-import-class-select').value = '一年级1班';
    const response = await fetch('assets/demo/face-grade1-demo.zip');
    if (!response.ok) throw new Error('演示包加载失败，请重试');
    const file = new File([await response.blob()], '一年级1班全场景演示.zip', {type:'application/zip'});
    await handleFaceImportFiles([file]);
    const record = faceImportFiles[faceImportFiles.length - 1];
    if (record?.uploadStatus === 'success') record.demo = true;
    toast('演示包已上传，点击导入可体验同步成功及失败场景', 'success');
  } catch (error) { toast(error.message, 'error'); }
  finally { button.disabled = false; }
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
function readFaceLocal(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } }
let faceHistory = readFaceLocal(FACE_HISTORY_KEY, []);
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
function faceTaskCounts(t) {
  return { success:t.items.filter(i=>i.status==='同步成功').length, failed:t.items.filter(i=>i.status==='同步失败').length, waiting:t.items.filter(i=>i.status==='待同步').length, running:t.items.filter(i=>i.status==='同步中').length };
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
  if (record.demo) {
    task.items.forEach(item => {
      delete item.simulationHold; delete item.simulationReason;
      item.simulationNormal = true;
      if (item.studentId === '2026002') item.simulationReason = '未检测到有效人脸，请更换照片';
      if (item.studentId === '2026003') item.simulationReason = '下发失败，请重新上传照片';
    });
  }
  faceHistory.unshift(task);saveFaceHistory();record.importStatus=record.failures.length?'partial':'success';record.note='导入 '+task.items.length+' 张，跳过 '+record.failures.length+' 张';
  record.importTime=task.time;
  record.historyId=task.id;
  if(!task.items.length)record.importStatus='failed';
  refreshFaceImportList();refreshFaceSyncView();processFaceSyncQueue();
  toast(task.items.length?'已导入 '+task.items.length+' 张，正在同步。可前往同步记录查看。':'未导入照片，请查看说明或前往同步记录导出明细。',task.items.length?'success':'warning');
}

function renderFaceImportRow(record) {
  if (record.uploadStatus === 'checking') return `<tr><td>${esc(record.fileName)}</td><td>校验中</td><td>—</td><td>${esc(record.note)}</td><td>—</td></tr>`;
  if (record.uploadStatus === 'fail') return `<tr><td>${esc(record.fileName)}</td><td><span class="import-result-fail">上传失败</span></td><td>—</td><td>${esc(record.note)}</td><td>—</td></tr>`;
  let actionCell = `<span class="text-muted">待导入</span> <button class="btn btn-primary" onclick="runFaceImport('${record.id}')">导入</button>`;
  if (record.importStatus === 'processing') actionCell = '<span>导入中</span>';
  if (['success','partial','failed'].includes(record.importStatus)) actionCell = '';
  if (record.historyId) actionCell += ` <button class="btn-link" onclick="closeModal();openFaceSyncStatus()">查看同步记录</button>`;
  const failures = (record.failures || []).map(faceFailureInfo);
  const detail = record.historyId && failures.length
    ? '<details><summary style="cursor:pointer">' + esc(record.note) + '</summary><div style="max-height:160px;overflow-y:auto;margin-top:8px" class="text-muted">' + failures.map(item => '<div>' + esc(item.fileName) + '：' + esc(item.reason) + '</div>').join('') + '</div></details>'
    : esc(record.note);
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
  document.getElementById('modal-body').innerHTML = `<p class="form-hint">请先创建学生账号，再选择班级导入照片。</p><div class="batch-import-modal"><div class="face-import-main"><div class="batch-import-cabinet-row"><div class="batch-import-cabinet-field"><label class="form-label">当前学校</label><div class="input" style="width:100%;background:#f5f7fa">${esc(school?.name || '未选择学校')}</div></div><div class="batch-import-cabinet-field"><label class="form-label"><span class="required">*</span>班级</label><select class="select" id="face-import-class-select" style="width:100%"><option value="">请选择班级</option>${classes.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select></div></div><div class="batch-import-list face-import-list" id="face-import-list">${renderFaceImportList()}</div></div><div class="batch-import-upload"><p class="form-hint">选择班级后上传照片 ZIP，上传完成后点击“导入”。</p><div class="batch-import-dropzone" id="face-import-dropzone"><div class="batch-import-dropzone-icon">📄</div><p class="batch-import-dropzone-text">拖动或点击上传该班照片 ZIP</p></div><input type="file" id="face-import-file-input" hidden accept=".zip"><button class="btn" style="margin-top:12px;width:100%" onclick="uploadFaceDemoZip(this)">上传演示 ZIP</button><p class="form-hint">一年级1班：编号/姓名匹配、重复、未找到学生及同步异常（模拟）。</p><div class="form-hint" style="margin-top:12px;line-height:1.8"><strong>照片准备</strong><br>① 按学生编号或姓名命名，如2026001.jpg、张三.jpg。编号保留前导零。<br>② 同一班级照片直接打包为ZIP，每名学生仅一张。<br>③ 同班重名请使用学生编号，或在列表中单独上传。<br>支持 JPG、JPEG、PNG；系统自动将每张照片压缩至 2MB 以内</div></div></div>`;
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
function changeFacePageSize(size) {
  facePageSize = [10,20,50].includes(Number(size)) ? Number(size) : 10;
  switchFacePage(1);
}
function switchFacePage(page) {
  page = Math.max(1, Math.min(Math.ceil(filteredFaceStudents().length / facePageSize) || 1, Math.floor(Number(page) || 1)));
  faceBulkSelected.clear();
  faceCurrentPage = page;
  navigate('face-library');
}


function switchFaceSchool(schoolId) {
  faceBulkSelected.clear();
  faceSelectedSchool = schoolId;

  faceFilters = { id: '', name: '', className: '', status: '' };
  faceCurrentPage = 1;
  navigate('face-library');
}



function renderFaceLibraryPage() {
  const schoolSelector = `<div class="filter-row"><label>学校 <select class="select" onchange="switchFaceSchool(this.value)"><option value="">请选择学校</option>${FACE_SCHOOLS.map(school => `<option value="${school.id}" ${faceSelectedSchool === school.id ? 'selected' : ''}>${school.name}</option>`).join('')}</select></label></div>`;
  if (!faceSelectedSchool) {
    return `<div class="page-card"><div class="page-card-header"><div style="width:100%"><div style="display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%"><div class="page-card-title">学生人脸信息</div><div style="display:flex;align-items:center;gap:8px;flex-shrink:0"><button class="btn" style="border-color:#1677ff;color:#1677ff" onclick="openFaceSyncStatus()" ${!faceSelectedSchool ? 'disabled title="请先选择学校"' : ''}>同步记录${faceSelectedSchool && faceSyncPendingCount() ? "（进行中 "+faceSyncPendingCount()+"）" : ""}</button><button class="btn btn-primary" style="flex-shrink:0" onclick="openFaceImportModal()" ${!faceSelectedSchool ? 'disabled title="请先选择学校"' : ''}>＋ 批量导入照片</button></div></div><p class="form-hint">请先选择学校，再查看该校学生人脸信息。</p></div></div>${schoolSelector}<div class="empty-state"><div class="empty-icon">🏫</div><div class="empty-title">请先选择学校</div><div class="empty-desc">人脸信息和同步范围均按学校管理</div></div></div>`;
  }
  const schoolStudents = FACE_STUDENTS.filter(student => student.schoolId === faceSelectedSchool);
  const schoolClasses = [...new Set(schoolStudents.map(student => student.className))];
  const filteredStudents = filteredFaceStudents();
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / facePageSize));
  faceCurrentPage = Math.min(faceCurrentPage, totalPages);
  const pageStudents = filteredStudents.slice((faceCurrentPage - 1) * facePageSize, faceCurrentPage * facePageSize);
  return `<div class="page-card">
    <div class="page-card-header"><div style="width:100%"><div style="display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%"><div class="page-card-title">学生人脸信息</div><div style="display:flex;align-items:center;gap:8px;flex-shrink:0"><button class="btn" style="border-color:#1677ff;color:#1677ff" onclick="openFaceSyncStatus()" ${!faceSelectedSchool ? 'disabled title="请先选择学校"' : ''}>同步记录${faceSelectedSchool && faceSyncPendingCount() ? "（进行中 "+faceSyncPendingCount()+"）" : ""}</button><button class="btn btn-primary" style="flex-shrink:0" onclick="openFaceImportModal()" ${!faceSelectedSchool ? 'disabled title="请先选择学校"' : ''}>＋ 批量导入照片</button></div></div><p class="form-hint">管理本校学生人脸照片，导入后可查看同步记录。<span title="柜机录入关联柜机人脸注册功能，本期暂未开发；该来源仅为预留演示。"> ⓘ</span></p></div></div>
    ${schoolSelector}
    <div class="filter-row"><label>学生编号 <input id="face-filter-id" class="input" placeholder="请输入学生编号" value="${esc(faceFilters.id)}"></label><label>姓名 <input id="face-filter-name" class="input" placeholder="请输入姓名" value="${esc(faceFilters.name)}"></label><label>班级 <select id="face-filter-class" class="select"><option value="">全部班级</option>${schoolClasses.map(c => `<option value="${esc(c)}" ${faceFilters.className === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label><label>同步状态 <select id="face-filter-status" class="select"><option value="">全部状态</option>${['无','同步中','同步成功','同步失败','待同步'].map(status => `<option ${faceFilters.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><button class="btn btn-secondary" onclick="searchFaceStudents(true)">重置</button><button class="btn btn-primary" onclick="searchFaceStudents()">搜索</button></div>
    <div class="page-card-actions" style="margin:16px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap"><div>${faceBulkDeleteMode ? `<span id="face-bulk-selected-count">已选 ${faceBulkSelected.size} 名学生</span> <button class="btn face-bulk-danger" id="face-bulk-delete-next" ${faceBulkSelected.size ? '' : 'disabled'} onclick="confirmFacePhotoBulkDelete()">删除所选</button> <button class="btn" onclick="cancelFaceBulkDelete()">取消</button>` : `<button class="btn" onclick="openFacePhotoBulkDelete()">批量删除</button>`}</div></div>
    <table class="data-table"><thead><tr>${faceBulkDeleteMode ? `<th><input type="checkbox" id="face-bulk-page-all" aria-label="全选当页" ${!pageStudents.some(faceStudentHasPhoto) ? 'disabled' : ''} onchange="toggleFaceBulkPage(this.checked)"> 全选当页</th>` : ''}<th>学生编号</th><th>姓名</th><th>班级</th><th title="保留最近同步成功的照片，新照片同步成功后更新">学生照片</th><th title="本次更新尚未同步成功时为空">最近同步成功照片</th><th>人脸来源</th><th>最近更新时间</th><th>同步状态</th><th>说明</th><th>操作</th></tr></thead><tbody>${pageStudents.map(s => `<tr>${faceBulkDeleteMode ? `<td><input type="checkbox" data-face-bulk-id="${s.id}" aria-label="选择${esc(s.name)}" ${!faceStudentHasPhoto(s) ? 'disabled title="暂无照片"' : ''} ${faceBulkSelected.has(s.id) ? 'checked' : ''} onchange="toggleFaceBulkStudent('${s.id}',this.checked)"></td>` : ''}<td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${facePhotoHtml(s)}</td><td>${s.registeredPhotoFile ? facePhotoHtml(s) : '<span class="text-muted">—</span>'}</td><td>${s.recognitionSource || '—'}</td><td>${s.updatedAt || '—'}</td><td><span style="color:${({'同步中':'#1677ff','同步成功':'#389e0d','同步失败':'#cf1322','待同步':'#d48806'})[s.syncStatus] || '#999'}">${s.syncStatus || '—'}</span></td><td style="min-width:180px;max-width:280px;white-space:normal;overflow-wrap:anywhere">${esc(s.syncStatus === '同步失败' ? (s.syncFailureReason || '—') : '—')}</td><td style="white-space:nowrap"><button class="btn-link" onclick="openFacePhotoEdit('${s.id}')">${s.photoFile ? '修改照片' : '上传照片'}</button>${faceStudentHasPhoto(s) ? ` <button class="btn-link" style="color:#cf1322" onclick="openFacePhotoDelete('${s.id}')">删除照片</button>` : ''}</td></tr>`).join('')}</tbody></table>
    <div class="pagination pagination--with-size"><span class="page-btn ${faceCurrentPage === 1 ? 'disabled' : ''}" onclick="${faceCurrentPage === 1 ? '' : 'switchFacePage(' + (faceCurrentPage - 1) + ')'}">‹</span>${Array.from({length: totalPages}, (_, i) => `<span class="page-btn ${faceCurrentPage === i + 1 ? 'active' : ''}" onclick="switchFacePage(${i+1})">${i + 1}</span>`).join('')}<span class="page-btn ${faceCurrentPage === totalPages ? 'disabled' : ''}" onclick="${faceCurrentPage === totalPages ? '' : 'switchFacePage(' + (faceCurrentPage + 1) + ')'}">›</span><span class="page-size-picker">每页 <select class="select page-size-select" aria-label="每页条数" onchange="changeFacePageSize(this.value)">${[10,20,50].map(n=>`<option value="${n}" ${facePageSize===n ? 'selected' : ''}>${n} 条</option>`).join('')}</select></span><span class="page-jump">跳至 <input class="input sm" type="number" min="1" max="${totalPages}" value="${faceCurrentPage}" onchange="switchFacePage(this.value)"> 页</span></div>
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
const faceSyncPages = { list:{page:1,size:10,status:''}, detail:{page:1,size:10,status:'',importStatus:'',id:''} };
function faceSyncTasks(){return faceHistory.concat(faceSingleSyncTasks).filter(t=>t.schoolId===faceSelectedSchool && (t.items.length || t.failures?.length)).sort((a,b)=>(b.queuedAt||Date.parse(b.time)||0)-(a.queuedAt||Date.parse(a.time)||0));}
function faceSyncTaskState(t){
  const c=faceTaskCounts(t);
  if(c.running || (c.waiting && c.success+c.failed))return '同步中';
  if(c.waiting)return '待同步';
  return c.failed?'同步失败':'同步成功';
}
function faceSyncBadge(status){const color={'待同步':'#d48806','同步中':'#1677ff','同步成功':'#389e0d','同步失败':'#cf1322'}[status]||'#666';return '<span style="color:'+color+'">'+esc(status)+'</span>';}
function faceSyncSummary(t){const c=faceTaskCounts(t);return '<div style="line-height:1.8">'+faceSyncBadge(faceSyncTaskState(t))+'<div class="form-hint">共 '+t.items.length+' 张 · 同步成功 '+c.success+' / 同步失败 '+c.failed+' / 同步中 '+c.running+' / 待同步 '+c.waiting+'</div></div>';}

function openFaceSyncDetail(id){
  Object.assign(faceSyncPages.detail,{id,page:1,status:'',importStatus:''});
  let overlay=document.getElementById('face-sync-detail-overlay');
  if(!overlay){overlay=document.createElement('div');overlay.id='face-sync-detail-overlay';overlay.className='face-record-detail-overlay';document.body.appendChild(overlay);overlay.addEventListener('click',e=>{if(e.target===overlay)closeFaceSyncDetail();});overlay.addEventListener('keydown',e=>{if(e.key==='Escape')closeFaceSyncDetail();});}
  refreshFaceSyncDetailDrawer();overlay.querySelector('button')?.focus();
}
function closeFaceSyncDetail(){document.getElementById('face-sync-detail-overlay')?.remove();}
function refreshFaceSyncDetailDrawer(){
  const el=document.getElementById('face-sync-detail-overlay');if(!el)return;
  el.innerHTML='<section class="face-record-detail" role="dialog" aria-modal="true" aria-label="同步明细">'+renderFaceSyncDetailPage({schoolId:faceSelectedSchool,id:faceSyncPages.detail.id})+'</section>';
}
function filterFaceImportStatus(value){faceSyncPages.detail.importStatus=value;faceSyncPages.detail.page=1;refreshFaceSyncRoute('detail');}
function faceSyncFilter(kind){return '<div class="filter-row">'+(kind==='detail'?'<label>导入状态 <select class="select" onchange="filterFaceImportStatus(this.value)"><option value="">全部</option>'+['导入成功','已跳过'].map(value=>'<option '+(faceSyncPages.detail.importStatus===value?'selected':'')+'>'+value+'</option>').join('')+'</select></label>':'')+'<label>同步状态 <select class="select" onchange="filterFaceSync(&quot;'+kind+'&quot;,this.value)"><option value="">全部状态</option>'+FACE_SYNC_STATES.map(status=>'<option '+(faceSyncPages[kind].status===status?'selected':'')+'>'+status+'</option>').join('')+'</select></label></div>';}
function filterFaceSync(kind,status){faceSyncPages[kind].status=status;faceSyncPages[kind].page=1;refreshFaceSyncRoute(kind);}
function refreshFaceSyncRoute(kind){if(kind==='detail'&&document.getElementById('face-sync-detail-overlay')){refreshFaceSyncDetailDrawer();return;}navigate(kind==='list'?'face-sync-status':'face-sync-detail',{schoolId:faceSelectedSchool,...(kind==='detail'?{id:faceSyncPages.detail.id}:{})});}
function pageFaceSync(kind,page,size){const state=faceSyncPages[kind];if(size){state.size=[10,20,50].includes(Number(size))?Number(size):10;state.page=1;}else state.page=Math.max(1,Math.floor(Number(page)||1));refreshFaceSyncRoute(kind);}
function faceSyncPager(kind,total){
  const s=faceSyncPages[kind],max=Math.max(1,Math.ceil(total/s.size));s.page=Math.min(s.page,max);
  let buttons='';for(let n=Math.max(1,s.page-2);n<=Math.min(max,s.page+2);n++)buttons+='<button class="page-btn '+(n===s.page?'active':'')+'" onclick="pageFaceSync(&quot;'+kind+'&quot;,'+n+')">'+n+'</button>';
  return '<div class="pagination pagination--with-size"><span>共 '+total+' 条</span><button class="page-btn" '+(s.page===1?'disabled':'')+' onclick="pageFaceSync(&quot;'+kind+'&quot;,'+(s.page-1)+')">‹</button>'+buttons+'<button class="page-btn" '+(s.page===max?'disabled':'')+' onclick="pageFaceSync(&quot;'+kind+'&quot;,'+(s.page+1)+')">›</button><span>共 '+max+' 页</span><select class="select" onchange="pageFaceSync(&quot;'+kind+'&quot;,1,this.value)">'+[10,20,50].map(n=>'<option value="'+n+'" '+(s.size===n?'selected':'')+'>'+n+' 条 / 页</option>').join('')+'</select><label>跳至 <input class="input sm" type="number" min="1" max="'+max+'" value="'+s.page+'" onchange="pageFaceSync(&quot;'+kind+'&quot;,this.value)"> 页</label></div>';
}
function renderFaceSyncStatusPage(params){
  faceSelectedSchool=params?.schoolId||faceSelectedSchool;faceSyncDrawerSchool=faceSelectedSchool;
  const state=faceSyncPages.list;
  const tasks=faceSyncTasks().slice(0,100).filter(faceSyncRecordMatches);
  const pending=t=>t.items.some(i=>i.status==='待同步'||i.status==='同步中');
  tasks.sort((a,b)=>Number(pending(b))-Number(pending(a))||(b.queuedAt||Date.parse(b.time)||0)-(a.queuedAt||Date.parse(a.time)||0));
  const pager=faceSyncPager('list',tasks.length);
  let form="<form class=\"face-sync-filters\" onsubmit=\"event.preventDefault();searchFaceSyncRecords()\"><label>文件名称<input class=\"input\" id=\"face-sync-name\" placeholder=\"请输入文件名称\"></label><label>状态<select class=\"select\" id=\"face-sync-status\"><option value=\"\">全部</option><option>进行中</option><option>已完成</option></select></label><label>时间段<span class=\"face-sync-date-range\"><input class=\"input\" type=\"date\" id=\"face-sync-start\" aria-label=\"开始日期\"><span>至</span><input class=\"input\" type=\"date\" id=\"face-sync-end\" aria-label=\"结束日期\"></span></label><div class=\"face-sync-filter-actions\"><button class=\"btn btn-primary\" type=\"submit\">查询</button><button class=\"btn\" type=\"button\" onclick=\"searchFaceSyncRecords(true)\">重置</button></div></form>";
  form=form.replace('id="face-sync-name"','id="face-sync-name" value="'+esc(faceSyncFilters.name)+'"').replace('id="face-sync-start"','id="face-sync-start" value="'+esc(faceSyncFilters.start)+'"').replace('id="face-sync-end"','id="face-sync-end" value="'+esc(faceSyncFilters.end)+'"');
  if(faceSyncFilters.status)form=form.replace('<option>'+faceSyncFilters.status+'</option>','<option selected>'+faceSyncFilters.status+'</option>');
  return '<div class="page-card"><div class="page-card-header"><div><div class="page-card-title">同步记录</div><p class="form-hint">'+esc(FACE_SCHOOLS.find(s=>s.id===faceSelectedSchool)?.name||'')+'</p></div></div>'+form+'<div class="table-wrap"><table class="data-table"><thead><tr><th>文件名称</th><th>班级</th><th>提交时间</th><th>状态</th><th>已处理/总数</th><th>成功</th><th>失败</th><th>操作</th></tr></thead><tbody>'+tasks.slice((state.page-1)*state.size,state.page*state.size).map(t=>{const c=faceTaskCounts(t),done=!pending(t);return '<tr><td>'+esc(t.fileName)+'<div class="form-hint">导入 '+t.items.length+' 张，跳过 '+(t.failures?.length||0)+' 张</div></td><td>'+esc(t.className)+'</td><td>'+esc(t.time)+'</td><td>'+ (done?'已完成':'进行中')+'</td><td>'+(c.success+c.failed)+' / '+t.items.length+'</td><td>'+c.success+'</td><td>'+c.failed+'</td><td style="white-space:nowrap"><button class="btn-link" onclick="openFaceSyncDetail(&quot;'+esc(t.id)+'&quot;)">查看明细</button>'+' <button class="btn-link" title="导出本次任务的全部明细（Excel），状态以导出时为准。" onclick="exportFaceSyncRecord(&quot;'+esc(t.id)+'&quot;)">导出明细</button>'+ '</td></tr>';}).join('')+(tasks.length?'':'<tr><td colspan="8">暂无符合条件的同步记录</td></tr>')+'</tbody></table></div>'+pager+'</div>';
}
function renderFaceSyncDetailPage(params){
  faceSelectedSchool=params?.schoolId||faceSelectedSchool;
  const state=faceSyncPages.detail;if(state.id!==params?.id)Object.assign(state,{id:params?.id,page:1,status:'',importStatus:''});
  const t=faceSyncTasks().find(t=>t.id===state.id);if(!t)return '<div class="page-card">未找到同步任务</div>';
  const allItems=[...t.items.map(i=>({...i,importStatus:'导入成功'})),...(t.failures||[]).map(value=>{const f=faceFailureInfo(value);return {fileName:f.fileName,studentId:'—',name:'—',importStatus:'已跳过',status:'未同步',reason:f.reason};})];
  const items=allItems.filter(i=>(!state.status||i.status===state.status)&&(!state.importStatus||i.importStatus===state.importStatus)),pager=faceSyncPager('detail',items.length);
  return '<div class="page-card"><div class="face-detail-heading"><h3>同步明细</h3><button type="button" class="face-detail-close" aria-label="关闭同步明细" title="关闭" onclick="closeFaceSyncDetail()">×</button></div><div class="face-detail-context"><strong>'+esc(t.fileName)+'</strong><span>'+esc(t.className)+' · '+esc(t.time)+'</span></div><div class="face-detail-toolbar">'+faceSyncFilter('detail').replace('<option value="">全部状态</option>','<option value="">全部状态</option><option '+(state.status==='未同步'?'selected':'')+'>未同步</option>')+'<button class="btn btn-primary"  title="导出本次任务的全部明细（Excel），状态以导出时为准。" onclick="exportFaceSyncRecord(&quot;'+esc(t.id)+'&quot;)">导出明细</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>照片文件名</th><th>学生编号</th><th>姓名</th><th>导入状态</th><th>同步状态</th><th>说明</th></tr></thead><tbody>'+(items.slice((state.page-1)*state.size,state.page*state.size).map(i=>'<tr><td>'+esc(i.fileName)+'</td><td>'+esc(i.studentId)+'</td><td>'+esc(i.name||'—')+'</td><td>'+esc(i.importStatus)+'</td><td>'+faceSyncBadge(i.status)+'</td><td>'+esc(/下发失败/.test(i.reason||'')?'下发失败，请重新上传照片':i.reason||'—')+'</td></tr>').join('')||'<tr><td colspan="6">暂无符合条件的照片</td></tr>')+'</tbody></table></div>'+pager+'</div>';
}

let faceConsoleScenario='normal';
const faceConsoleLabels={normal:'正常模拟',compress:'照片压缩失败',noFace:'未检测到人脸',delivery:'柜机下发失败',queued:'待同步排队'};
function renderFaceConsole(){
  return '<div class="console-page-head"><span class="console-route-label">当前菜单</span><strong>人脸信息管理</strong></div><section class="console-section"><h4>异常场景模拟</h4><p>当前：'+faceConsoleLabels[faceConsoleScenario]+'</p><p>选择后作用于下一次单人上传，或批量导入的第一张有效照片。</p><div style="display:flex;flex-wrap:wrap;gap:8px">'+Object.entries(faceConsoleLabels).filter(([key])=>key!=='normal').map(([key,label])=>'<button class="btn '+(faceConsoleScenario===key?'btn-primary':'')+'" onclick="setFaceConsoleScenario(&quot;'+key+'&quot;)">'+label+'</button>').join('')+'<button class="btn" onclick="setFaceConsoleScenario(&quot;normal&quot;)">恢复正常模拟</button></div><p>待同步排队将暂停该照片；点击恢复正常模拟后继续同步。</p></section><section class="console-section"><h4>删除结果模拟</h4><button class="btn" onclick="setFaceDeleteScenario(&quot;success&quot;)">删除成功</button> <button class="btn" onclick="setFaceDeleteScenario(&quot;timeout&quot;)">删除超时</button> <button class="btn" onclick="setFaceDeleteScenario(&quot;failed&quot;)">删除失败</button></section><div class="console-note">仅用于原型演示，不影响真实柜机。</div>';
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
  if(faceConsoleScenario==='delivery')item.simulationReason='下发失败，请重新上传照片';
  if(faceConsoleScenario!=='compress'){faceConsoleScenario='normal';renderConsolePanel();}
}

let faceSyncDrawerSchool='';
let faceSyncFilters={name:'',status:'',start:'',end:''};
function searchFaceSyncRecords(reset=false){
  const get=id=>document.getElementById(id);
  const next=reset?{name:'',status:'',start:'',end:''}:{name:get('face-sync-name').value.trim(),status:get('face-sync-status').value,start:get('face-sync-start').value,end:get('face-sync-end').value};
  if(next.start&&next.end&&next.start>next.end)return toast('开始日期不能晚于结束日期','warning');
  faceSyncFilters=next;
  if(reset){['name','status','start','end'].forEach(key=>get('face-sync-'+key).value='');}
  faceSyncPages.list.page=1;
  refreshFaceSyncRoute('list');
}
function faceSyncRecordMatches(t){
  const f=faceSyncFilters,day=(t.time||'').slice(0,10),pending=t.items.some(i=>i.status==='待同步'||i.status==='同步中');
  return (!f.name||t.fileName.toLowerCase().includes(f.name.toLowerCase()))&&(!f.status||(f.status==='进行中'?pending:!pending))&&(!f.start||day>=f.start)&&(!f.end||day<=f.end);
}
function faceSyncPendingCount(){return faceSyncTasks().filter(t=>t.items.some(i=>i.status==='待同步'||i.status==='同步中')).length;}
function openFaceSyncStatus(){
  faceSyncDrawerSchool=faceSelectedSchool;
  openTab('face-sync-status','同步记录',{schoolId:faceSelectedSchool});
}
// Minimal OOXML workbook: all values are text, preserving student numbers and filenames.
function buildFaceExcel(rows, sheetName='导入记录'){
  const xml=value=>String(value??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const data=rows.map((row,r)=>'<row r="'+(r+1)+'">'+row.map((value,c)=>'<c r="'+String.fromCharCode(65+c)+(r+1)+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>').join('')+'</row>').join('');
  const files={
    '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml':'<workbook xmlns="'+ns+'" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'+xml(sheetName)+'" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml':'<worksheet xmlns="'+ns+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="9" width="24" customWidth="1"/><col min="9" max="9" width="45" customWidth="1"/></cols><sheetData>'+data+'</sheetData><autoFilter ref="A1:'+String.fromCharCode(64+rows[0].length)+rows.length+'"/></worksheet>'
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

function exportFaceSyncRecord(id){
  const t=faceHistory.concat(faceSingleSyncTasks).find(t=>t.id===id&&t.schoolId===faceSyncDrawerSchool);
  if(!t)return;
  const school=FACE_SCHOOLS.find(s=>s.id===t.schoolId)?.name||'';
  const rows=[['任务文件名','学校','班级','提交时间','照片文件名','学生编号','姓名','导入状态','同步状态','说明'],...t.items.map(i=>[t.fileName,school,t.className,t.time,i.fileName,i.studentId,i.name||'','导入成功',i.status,i.status==='同步失败'?(/下发失败/.test(i.reason||'')?'下发失败，请重新上传照片':i.reason||''):'']),...(t.failures||[]).map(value=>{const f=faceFailureInfo(value);return [t.fileName,school,t.className,t.time,f.fileName,'','','已跳过','未同步',f.reason];})];
  const url=URL.createObjectURL(buildFaceExcel(rows,'同步记录'));
  const a=document.createElement('a');a.href=url;a.download=t.fileName.replace(/\.[^.]+$/,'')+'-同步记录.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
