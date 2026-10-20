/* 人脸识别管理 · MVP 原型 */
const FACE_SCHOOLS = [
  { id: 'school-001', name: '深圳市南山实验学校' },
  { id: 'school-002', name: '深圳市科技实验学校' },
];
const FACE_STUDENTS = [
  { id: '2026001', schoolId: 'school-001', name: '张三', className: '一年级1班', photoFile: '2026001.jpg', updatedAt: '2026-09-20 10:12:00', recognitionSource: '照片' },
  { id: '2026002', schoolId: 'school-001', name: '李四', className: '一年级1班', photoFile: '2026002.jpg', updatedAt: '2026-10-02 09:18:00', recognitionSource: '柜机视频' },
  { id: '2026003', schoolId: 'school-001', name: '王五（01）', className: '一年级1班', photoFile: null, updatedAt: '2026-10-03 16:40:00', recognitionSource: '柜机视频' },
  { id: '2026025', schoolId: 'school-001', name: '王五（02）', className: '一年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026004', schoolId: 'school-001', name: '赵六', className: '一年级2班', photoFile: '2026004.jpg', updatedAt: '2026-09-18 15:22:00', recognitionSource: '照片' },
  { id: '2026026', schoolId: 'school-001', name: '赵六', className: '一年级2班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026005', schoolId: 'school-001', name: '孙七', className: '一年级3班', photoFile: '2026005.jpg', updatedAt: '2026-10-04 14:08:00', recognitionSource: '柜机视频' },
  { id: '2026006', schoolId: 'school-001', name: '周八', className: '一年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026007', schoolId: 'school-001', name: '吴九', className: '二年级1班', photoFile: '2026007.jpg', updatedAt: '2026-09-17 16:18:00', recognitionSource: '照片' },
  { id: '2026014', schoolId: 'school-001', name: '蒋一', className: '二年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026015', schoolId: 'school-001', name: '沈二', className: '二年级2班', photoFile: '2026015.jpg', updatedAt: '2026-09-14 11:05:00', recognitionSource: '照片' },
  { id: '2026016', schoolId: 'school-001', name: '韩三', className: '二年级2班', photoFile: null, updatedAt: '2026-10-06 08:46:00', recognitionSource: '柜机视频' },
  { id: '2026017', schoolId: 'school-001', name: '杨四', className: '二年级3班', photoFile: '2026017.jpg', updatedAt: '2026-09-12 13:26:00', recognitionSource: '照片' },
  { id: '2026018', schoolId: 'school-001', name: '朱五', className: '二年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026008', schoolId: 'school-002', name: '郑十', className: '二年级1班', photoFile: '2026008.jpg', updatedAt: '2026-10-01 15:42:00', recognitionSource: '柜机视频' },
  { id: '2026009', schoolId: 'school-002', name: '钱一', className: '二年级2班', photoFile: '2026009.jpg', updatedAt: '2026-09-16 11:26:00', recognitionSource: '照片' },
  { id: '2026010', schoolId: 'school-002', name: '冯二', className: '二年级2班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026011', schoolId: 'school-002', name: '陈三', className: '二年级3班', photoFile: '2026011.jpg', updatedAt: '2026-09-15 16:44:00', recognitionSource: '照片' },
  { id: '2026012', schoolId: 'school-002', name: '褚四', className: '二年级3班', photoFile: '2026012.jpg', updatedAt: '2026-10-05 15:30:00', recognitionSource: '柜机视频' },
  { id: '2026013', schoolId: 'school-002', name: '卫五', className: '三年级1班', photoFile: '2026013.jpg', updatedAt: '2026-09-15 14:12:00', recognitionSource: '照片' },
  { id: '2026019', schoolId: 'school-002', name: '秦六', className: '三年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026020', schoolId: 'school-002', name: '尤七', className: '三年级2班', photoFile: null, updatedAt: '2026-10-07 09:37:00', recognitionSource: '柜机视频' },
  { id: '2026021', schoolId: 'school-002', name: '许八', className: '三年级2班', photoFile: '2026021.jpg', updatedAt: '2026-09-11 10:20:00', recognitionSource: '照片' },
  { id: '2026022', schoolId: 'school-002', name: '何九', className: '三年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026023', schoolId: 'school-002', name: '吕十', className: '三年级3班', photoFile: '2026023.jpg', updatedAt: '2026-10-08 14:55:00', recognitionSource: '柜机视频' },
  { id: '2026024', schoolId: 'school-002', name: '施一', className: '四年级1班', photoFile: '2026024.jpg', updatedAt: '2026-09-10 09:48:00', recognitionSource: '照片' },
];

const FACE_LOGIN_RECORDS = [
  { time: '2026-09-28 08:31:22', id: '2026001', name: '张三', className: '一年级1班', result: 'success', method: '人脸识别', cabinet: '柜机-001', reason: '—' },
  { time: '2026-09-28 08:29:07', id: '2026008', name: '赵六', className: '一年级2班', result: 'failed', method: '人脸识别', cabinet: '柜机-001', reason: '未匹配到人脸' },
  { time: '2026-09-27 16:12:45', id: '2026003', name: '王五（01）', className: '一年级1班', result: 'fallback', method: '学号密码', cabinet: '柜机-002', reason: '人脸已停用' },
];
let faceCurrentPage = 1;
let facePageSize = 10;
let faceSelectedSchool = '';
let faceFilters = { id: '', name: '', className: '', status: '' };
FACE_STUDENTS.forEach((student, index) => {
  student.syncStatus = student.recognitionSource ? ['同步成功', '同步中', '同步失败', '待同步'][index % 4] : '';
  student.syncFailureReason = student.syncStatus === '同步失败' ? (student.id === '2026005' ? '未检测到有效人脸，请更换照片' : '柜机 A03 下发失败，请重试') : '';
});
function searchFaceStudents(reset = false) {
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
  if (location.hash.startsWith('#face-library')) renderApp('face-library', currentParams);
  refreshFaceHistoryProgress();
}let faceEditPhoto = null;
function openFacePhotoEdit(id) {
  const student = FACE_STUDENTS.find(item => item.id === id);
  if (!student) return;
  faceEditPhoto = null;
  document.getElementById('modal-title').textContent = student.photoFile ? '修改照片' : '上传照片';
  document.getElementById('modal-subtitle').style.display = 'none';
  const photo = student.photoUrl ? '<img src="' + esc(student.photoUrl) + '" style="max-width:100%;height:220px;object-fit:contain">' : student.photoFile ? '<div class="face-photo-preview">' + esc(student.name.slice(0,1)) + '</div>' : '<p class="text-muted">暂无照片</p>';
  document.getElementById('modal-body').innerHTML = '<p>' + esc(student.name) + '（' + esc(student.id) + '） · ' + esc(student.className) + '</p><div style="display:flex;gap:32px;align-items:start"><div style="flex:1;text-align:center"><p>当前照片</p>' + photo + '</div><div style="flex:1"><p>新照片</p><input type="file" accept="image/jpeg,image/png" onchange="selectFaceEditPhoto(this)"><div id="face-edit-preview" style="margin-top:16px"></div><p class="form-hint">支持 JPG、JPEG、PNG，单张不超过 5MB。保存后替换当前照片并重新同步。</p></div></div>';
  document.getElementById('modal-footer').innerHTML = `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" id="face-edit-save">保存并同步</button>`;
  document.getElementById('face-edit-save').onclick = () => saveFacePhotoEdit(id);
  document.getElementById('modal-footer').style.display = '';
  document.getElementById('modal').classList.remove('modal-sm');
  document.getElementById('modal').classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
}
function selectFaceEditPhoto(input) {
  const file = input.files[0];
  faceEditPhoto = null;
  if (!file) return;
  if (!['image/jpeg','image/png'].includes(file.type) || file.size > 5*1024*1024) {
    input.value = ''; toast('请选择不超过 5MB 的 JPG、JPEG 或 PNG 照片', 'warning'); return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    faceEditPhoto = { url: reader.result, extension: file.type === 'image/png' ? 'png' : 'jpg' };
    document.getElementById('face-edit-preview').innerHTML = '<img src="' + reader.result + '" style="max-width:100%;height:220px;object-fit:contain">';
  };
  reader.readAsDataURL(file);
}
function saveFacePhotoEdit(id) {
  if (!faceEditPhoto) return toast('请上传新照片', 'warning');
  const student = FACE_STUDENTS.find(item => item.id === id);
  student.photoFile = student.id + '.' + faceEditPhoto.extension;
  student.photoUrl = faceEditPhoto.url;
  student.recognitionSource = '照片';
  student.updatedAt = new Date().toLocaleString('sv-SE');
  student.syncStatus = '同步中';
  closeModal(); navigate('face-library'); toast('照片已更新，正在同步', 'success');
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
      if (file.size > 50 * 1024 * 1024) throw new Error('压缩包不能超过 50MB');
      const students = FACE_STUDENTS.filter(item => item.schoolId === faceSelectedSchool && item.className === className);
      const names = new Map();
      students.forEach(student => {
        const list = names.get(student.name) || [];
        list.push(student);
        names.set(student.name, list);
      });
      const entries = await readZipEntries(file);
      const seenIds = new Set();
      entries.filter(entry => entry.name && !entry.name.endsWith('/') && !entry.name.includes('__MACOSX/')).forEach(entry => {
        const fileName = entry.name.split('/').pop();
        const dot = fileName.lastIndexOf('.');
        const name = (dot > 0 ? fileName.slice(0, dot) : fileName).trim().normalize('NFC');
        const extension = dot > 0 ? fileName.slice(dot).toLowerCase() : '';
        if (!['.jpg', '.jpeg', '.png'].includes(extension)) return;
        const matched = names.get(name) || [];
        if (entry.size > 5 * 1024 * 1024) record.failures.push(`${fileName}：照片超过 5MB`);
        else if (!matched.length) record.failures.push(`${fileName}：该班级中没有此姓名`);
        else if (matched.length > 1) record.failures.push(`${fileName}：该班级中姓名重复，请添加后缀`);
        else if (seenIds.has(matched[0].id)) record.failures.push(`${fileName}：同一学生存在多张照片`);
        else {
          seenIds.add(matched[0].id);
          record.matches.push({ studentId: matched[0].id, extension, originalName: fileName, blob: entry.blob });
        }
      });
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
function saveFaceHistory() { localStorage.setItem(FACE_HISTORY_KEY, JSON.stringify(faceHistory)); }
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
  const scope = student ? '<p>学生：' + esc(student.name) + '（' + student.id + '）</p>' : '<label>禁用范围 <select class="select" id="face-disable-scope" onchange="updateFaceDisableScope()"><option value="class">按班级</option><option value="grade">按年级</option></select></label> <select class="select" id="face-disable-target">' + options([...new Set(students.map(s=>s.className))]) + '</select>';
  openFaceDialog('禁用人脸', scope + '<p class="form-hint">禁用后该学生在本校所有柜机上不能通过人脸登录，编号密码登录仍可使用。照片保留，重新导入不会自动解除禁用。</p><p id="face-disable-count"></p>', '<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" id="face-disable-confirm">确认禁用</button>');
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
let faceHistoryFilters={className:'',start:'',end:''};
function renderFaceHistoryFilters(){
  const classes=[...new Set(FACE_STUDENTS.filter(s=>s.schoolId===faceSelectedSchool).map(s=>s.className))];
  return '<p class="form-hint">学校：'+esc(FACE_SCHOOLS.find(s=>s.id===faceSelectedSchool)?.name||'')+'</p><div class="filter-row"><label>班级 <select class="select" id="face-history-class"><option value="">全部班级</option>'+classes.map(c=>'<option '+(c===faceHistoryFilters.className?'selected':'')+'>'+esc(c)+'</option>').join('')+'</select></label><label>开始日期 <input class="input" id="face-history-start" type="date" value="'+faceHistoryFilters.start+'"></label><label>结束日期 <input class="input" id="face-history-end" type="date" value="'+faceHistoryFilters.end+'"></label><button class="btn btn-primary" onclick="searchFaceHistory()">搜索</button><button class="btn" onclick="searchFaceHistory(true)">重置</button></div>';
}
function searchFaceHistory(reset=false){
  const filters=reset?{className:'',start:'',end:''}:{className:document.getElementById('face-history-class').value,start:document.getElementById('face-history-start').value,end:document.getElementById('face-history-end').value};
  if(filters.start&&filters.end&&filters.start>filters.end)return toast('开始日期不能晚于结束日期','warning');
  faceHistoryFilters=filters;faceModalPages.history.page=1;navigate('face-import-history',{schoolId:faceSelectedSchool});
}
let faceDisableClasses=[];
let faceBulkScope='grade';
function faceBulkValue(student){return faceBulkScope==='grade'?faceGrade(student):student.className;}
function renderFaceBulkOptions(){
  const students=FACE_STUDENTS.filter(s=>s.schoolId===faceSelectedSchool);
  const values=[...new Set(students.map(faceBulkValue))];
  return values.map(value=>{const count=students.filter(s=>faceBulkValue(s)===value&&!faceDisabled[s.id]).length;return '<label class="face-bulk-row '+(!count?'is-disabled':'')+'"><input type="checkbox" name="face-disable-class" value="'+esc(value)+'" '+(!count?'disabled':'')+' '+(faceDisableClasses.includes(value)?'checked':'')+' onchange="updateFaceClassSelection()"><span>'+esc(value)+'</span><span class="face-bulk-row-count">'+(count?'可禁用 '+count+' 人':'已全部禁用')+'</span></label>';}).join('');
}
function switchFaceBulkScope(value){
  faceBulkScope=value==='class'?'class':'grade';faceDisableClasses=[];
  document.getElementById('face-bulk-options').innerHTML=renderFaceBulkOptions();updateFaceClassSelection();
}
function toggleAllFaceBulk(checked){
  document.querySelectorAll('input[name="face-disable-class"]:not(:disabled)').forEach(el=>el.checked=checked);updateFaceClassSelection();
}
function openFaceBulkDisable(keepSelection=false){
  if(!keepSelection)faceDisableClasses=[];
  const scopeButtons=['grade','class'].map(type=>'<label><input type="radio" name="face-bulk-scope" value="'+type+'" '+(faceBulkScope===type?'checked':'')+' onchange="switchFaceBulkScope(this.value)"><span>'+(type==='grade'?'按年级':'按班级')+'</span></label>').join('');
  openFaceDialog('批量禁用年级/班级','<div class="face-bulk-ui"><div class="face-bulk-school"><span>所属学校</span><strong>'+esc(FACE_SCHOOLS.find(s=>s.id===faceSelectedSchool)?.name||'')+'</strong></div><div class="face-bulk-scope"><span>禁用范围</span><div class="face-bulk-segments">'+scopeButtons+'</div></div><p class="face-bulk-help">勾选需要禁用的范围，可多选。已全部禁用的选项不可选。</p><div class="face-bulk-list"><div class="face-bulk-list-head"><label><input type="checkbox" id="face-bulk-all" onchange="toggleAllFaceBulk(this.checked)"> 全选</label><span>可禁用人数</span></div><div id="face-bulk-options">'+renderFaceBulkOptions()+'</div></div><div class="face-bulk-summary" id="face-disable-summary">已选 0 项，涉及 0 名学生</div></div>','<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" id="face-class-next" disabled onclick="confirmFaceClassDisable()">下一步</button>');
  updateFaceClassSelection();
}
function updateFaceClassSelection(){
  faceDisableClasses=[...document.querySelectorAll('input[name="face-disable-class"]:checked')].map(el=>el.value);
  const count=FACE_STUDENTS.filter(s=>s.schoolId===faceSelectedSchool&&faceDisableClasses.includes(faceBulkValue(s))&&!faceDisabled[s.id]).length;
  document.getElementById('face-disable-summary').textContent='已选 '+faceDisableClasses.length+' 个'+(faceBulkScope==='grade'?'年级':'班级')+'，涉及 '+count+' 名学生';
  document.getElementById('face-class-next').disabled=!count;
  const all=document.getElementById('face-bulk-all');
  const choices=[...document.querySelectorAll('input[name="face-disable-class"]:not(:disabled)')];
  if(all){all.disabled=!choices.length;all.checked=choices.length>0&&choices.every(el=>el.checked);all.indeterminate=choices.some(el=>el.checked)&&!all.checked;}
}
function confirmFaceClassDisable(){
  const schoolId=faceSelectedSchool, values=[...faceDisableClasses],scope=faceBulkScope;
  const label=scope==='grade'?'年级':'班级';
  const students=FACE_STUDENTS.filter(s=>s.schoolId===schoolId&&values.includes(scope==='grade'?faceGrade(s):s.className)&&!faceDisabled[s.id]);
  if(!students.length)return toast('请选择可禁用的'+label,'warning');
  openFaceDialog('确认批量禁用'+label,'<div class="face-bulk-ui face-bulk-confirm"><p style="line-height:1.8;overflow-wrap:anywhere;margin:0 0 16px">确认禁用 <strong>'+values.map(v=>esc(v)).join('、')+'</strong> 共 <strong>'+students.length+'</strong> 名学生的人脸？</p><div class="face-bulk-warning" style="margin-bottom:12px">禁用后无法扫脸登录，仍可使用编号密码。</div></div>','<button class="btn" onclick="openFaceBulkDisable(true)">上一步</button><button class="btn" onclick="closeModal()">取消</button><button class="btn face-bulk-danger" id="face-class-confirm">确认禁用</button>');
  document.getElementById('face-class-confirm').onclick=()=>{students.forEach(s=>faceDisabled[s.id]=true);localStorage.setItem(FACE_DISABLED_KEY,JSON.stringify(faceDisabled));closeModal();refreshFaceSyncView();toast('已禁用 '+values.length+' 个'+label+'、'+students.length+' 名学生的人脸','success');};
}
const faceModalPages = { history: { page:1, size:10 }, detail: { page:1, size:10 } };
let faceDetailTaskId = '';
function faceModalPager(kind, total) {
  const state=faceModalPages[kind], pages=Math.max(1,Math.ceil(total/state.size));
  state.page=Math.min(state.page,pages);
  const action=(page)=>'changeFaceModalPage(&quot;'+kind+'&quot;,'+page+')';
  const numbers=[];
  for(let n=Math.max(1,state.page-2);n<=Math.min(pages,state.page+2);n++)numbers.push('<button class="page-btn '+(n===state.page?'active':'')+'" onclick="'+action(n)+'">'+n+'</button>');
  return '<div class="pagination pagination--with-size" style="margin-top:16px"><span>共 '+total+' 条</span><button class="page-btn" '+(state.page===1?'disabled':'')+' onclick="'+action(state.page-1)+'">‹</button>'+numbers.join('')+'<button class="page-btn" '+(state.page===pages?'disabled':'')+' onclick="'+action(state.page+1)+'">›</button><span>共 '+pages+' 页</span><label>每页 <select class="select" onchange="changeFaceModalSize(&quot;'+kind+'&quot;,this.value)">'+[10,20,50].map(n=>'<option value="'+n+'" '+(n===state.size?'selected':'')+'>'+n+' 条</option>').join('')+'</select></label><label>跳至 <input class="input sm" type="number" min="1" max="'+pages+'" value="'+state.page+'" onchange="changeFaceModalPage(&quot;'+kind+'&quot;,this.value)"> 页</label></div>';
}
function changeFaceModalPage(kind, page) {
  const count=kind==='history'?faceHistory.filter(t=>t.schoolId===faceSelectedSchool).length:(()=>{const t=faceHistory.find(t=>t.id===faceDetailTaskId);return t?t.items.length+t.failures.length:0;})();
  faceModalPages[kind].page=Math.min(Math.max(1,Math.floor(Number(page)||1)),Math.max(1,Math.ceil(count/faceModalPages[kind].size)));
  if(kind==='history')navigate('face-import-history',{schoolId:faceSelectedSchool});else navigate('face-import-detail',{schoolId:faceSelectedSchool,id:faceDetailTaskId,keepPage:true});
}
function changeFaceModalSize(kind,size) {
  faceModalPages[kind].size=[10,20,50].includes(Number(size))?Number(size):10;
  changeFaceModalPage(kind,1);
}
function openFaceImportHistory() { openTab('face-import-history','导入历史',{schoolId:faceSelectedSchool}); }
function renderFaceImportHistoryPage(params) {
  faceSelectedSchool=params?.schoolId||faceSelectedSchool;
  const allTasks=faceHistory.filter(t=>t.schoolId===faceSelectedSchool && (!faceHistoryFilters.className||t.className===faceHistoryFilters.className) && (!faceHistoryFilters.start||t.time.slice(0,10)>=faceHistoryFilters.start) && (!faceHistoryFilters.end||t.time.slice(0,10)<=faceHistoryFilters.end));
  const pager=faceModalPager('history',allTasks.length), state=faceModalPages.history;
  const tasks=allTasks.slice((state.page-1)*state.size,state.page*state.size);
  return '<div class="page-card"><div class="page-card-header"><div class="page-card-title">导入历史记录</div><button class="btn" onclick="navigate(&quot;face-library&quot;)">返回人脸信息管理</button></div>'+renderFaceHistoryFilters()+'<div class="table-wrap" id="face-history-progress-list"><table class="data-table"><thead><tr><th>文件名</th><th>班级</th><th>导入时间</th><th>说明</th><th>同步结果</th><th>操作</th></tr></thead><tbody>' + (tasks.map(t=>{const c=faceTaskCounts(t);return '<tr><td>'+esc(t.fileName)+'</td><td>'+esc(t.className)+'</td><td>'+esc(t.time)+'</td><td style="min-width:240px;line-height:1.8">处理完成：共 '+(t.items.length+t.failures.length)+' 个文件，成功 '+t.items.length+' 个，跳过 '+t.failures.length+' 个'+(t.failures.length ? '<br>跳过原因：<div style="max-height:115px;overflow-y:auto;line-height:23px;overflow-wrap:anywhere;padding-right:8px">'+t.failures.map(value=>{const f=faceFailureInfo(value);return esc(f.fileName)+'：'+esc(f.reason);}).join('<br>')+'</div>' : '')+'</td><td data-face-task="'+esc(t.id)+'">'+renderFaceTaskProgress(t)+'</td><td><button class="btn-link" onclick="openFaceHistoryDetail(&quot;'+t.id+'&quot;)">查看</button> <button class="btn-link" onclick="exportFaceHistory(&quot;'+t.id+'&quot;)">导出记录</button></td></tr>';}).join('') || '<tr><td colspan="6">暂无导入记录</td></tr>') + '</tbody></table></div>'+pager+'</div>';
}
function openFaceHistoryDetail(id, keepPage = false) { openTab('face-import-detail','导入记录详情',{schoolId:faceSelectedSchool,id,keepPage}); }
function renderFaceImportDetailPage(params) {
  faceSelectedSchool=params?.schoolId||faceSelectedSchool;
  const id=params?.id, keepPage=params?.keepPage;
  if(!keepPage || faceDetailTaskId!==id)faceModalPages.detail.page=1;
  faceDetailTaskId=id;
  const t=faceHistory.find(t=>t.id===id && t.schoolId===faceSelectedSchool);if(!t)return '<div class="page-card">未找到导入记录</div>';
  const rows=renderFaceHistoryRows(t);
  return '<div class="page-card"><div class="page-card-header"><div class="page-card-title">导入记录详情</div></div>'+'<p>'+esc(t.fileName)+' · '+esc(t.time)+'</p><div id="face-history-detail-progress" data-face-task="'+esc(t.id)+'" style="padding:16px;background:#f0f5ff;border-radius:8px;margin-bottom:16px">'+renderFaceTaskProgress(t)+'</div><div class="table-wrap"><table class="data-table"><thead><tr><th>照片文件名</th><th>学生编号</th><th>姓名</th><th>导入状态</th><th>同步状态</th><th>说明</th></tr></thead><tbody id="face-history-detail-rows">'+rows+'</tbody></table></div>'+faceModalPager('detail',t.items.length+t.failures.length)+'<div style="margin-top:20px;display:flex;gap:12px"><button class="btn" onclick="openFaceImportHistory()">返回历史</button><button class="btn btn-primary" onclick="exportFaceHistory(&quot;'+t.id+'&quot;)">导出该记录</button></div></div>';
}
function exportFaceHistory(id) {
  const t=faceHistory.find(t=>t.id===id && t.schoolId===faceSelectedSchool);if(!t)return;
  const school=FACE_SCHOOLS.find(s=>s.id===t.schoolId)?.name||'';
  const rows=[['压缩包','学校','班级','导入时间','照片文件名','学生编号','姓名','导入状态','同步状态','说明'],...t.items.map(i=>[t.fileName,school,t.className,t.time,i.fileName,i.studentId,i.name,'导入成功',i.status,i.reason||'']),...t.failures.map(value=>{const f=faceFailureInfo(value);return [t.fileName,school,t.className,t.time,f.fileName,'','','导入失败','—',f.reason];})];
  const csv=rows.map(row=>row.map(v=>'"'+String(v).replace(/^[=+@-]/,"'").replaceAll('"','""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([String.fromCharCode(65279),csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=t.fileName.replace(/\.zip$/i,'')+'-导入记录.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function processFaceSyncQueue() {
  if(faceSyncBusy)return;
  let task,item;
  for(const t of [...faceHistory].reverse()) { const next=t.items.find(i=>i.status==='待同步');if(next){task=t;item=next;break;} }
  if(!item)return;
  faceSyncBusy=true;item.status='同步中';saveFaceHistory();refreshFaceSyncView();
  setTimeout(()=>{
    const failed=item.studentId==='2026005';item.status=failed?'同步失败':'同步成功';item.reason=failed?'未检测到有效人脸，请更换照片':'';
    const student=FACE_STUDENTS.find(s=>s.id===item.studentId);
    if(student && student.syncTaskId===task.id){student.syncStatus=item.status;student.syncFailureReason=item.reason;}
    faceSyncBusy=false;saveFaceHistory();refreshFaceSyncView();processFaceSyncQueue();
  },3000);
}

function renderFaceTaskProgress(t) {
  const c=faceTaskCounts(t), done=c.success+c.failed;
  const percent=t.items.length?Math.round(done/t.items.length*100):0;
  const label=!t.items.length?'无可同步照片':done===t.items.length?'同步已结束':c.running?'同步中':'待同步';
  return '<div style="min-width:250px"><div style="display:flex;justify-content:space-between;gap:16px"><strong>'+label+'</strong><span>'+(t.items.length?percent+'%':'—')+'</span></div><progress value="'+done+'" max="'+Math.max(1,t.items.length)+'" style="width:100%;height:10px;margin:8px 0" aria-label="批次同步进度"></progress><div style="font-size:13px;color:#64748b;line-height:1.8;white-space:nowrap">共 '+t.items.length+' 张 · 成功 '+c.success+' / 失败 '+c.failed+' / 待同步 '+c.waiting+' / 同步中 '+c.running+'</div></div>';
}
function refreshFaceHistoryProgress() {
  const history=document.getElementById('face-history-progress-list');
  if(history) history.querySelectorAll('[data-face-task]').forEach(el=>{
    const task=faceHistory.find(t=>t.id===el.dataset.faceTask);
    if(task)el.innerHTML=renderFaceTaskProgress(task);
  });
  const detail=document.getElementById('face-history-detail-progress');
  if(detail){const task=faceHistory.find(t=>t.id===detail.dataset.faceTask);if(task){detail.innerHTML=renderFaceTaskProgress(task);document.getElementById('face-history-detail-rows').innerHTML=renderFaceHistoryRows(task);}}
}
function faceFailureInfo(value) {
  if (typeof value === 'object' && value) return value;
  const text=String(value), index=text.indexOf('：');
  return { fileName:index>=0?text.slice(0,index):'—', reason:index>=0?text.slice(index+1):text };
}
function renderFaceHistoryRows(t) {
  const imported=t.items.map(i=>'<tr><td>'+esc(i.fileName)+'</td><td>'+esc(i.studentId)+'</td><td>'+esc(i.name)+'</td><td><span style="color:#389e0d">导入成功</span></td><td>'+esc(i.status)+'</td><td>'+esc(i.reason||'—')+'</td></tr>').join('');
  const failed=t.failures.map(value=>{const f=faceFailureInfo(value);return '<tr><td>'+esc(f.fileName)+'</td><td>—</td><td>—</td><td><span style="color:#cf1322">导入失败</span></td><td>—</td><td>'+esc(f.reason)+'</td></tr>';}).join('');
  const rows=(imported+failed).match(/<tr>[\s\S]*?<\/tr>/g)||[];
  const state=faceModalPages.detail;
  state.page=Math.min(state.page,Math.max(1,Math.ceil(rows.length/state.size)));
  return rows.slice((state.page-1)*state.size,state.page*state.size).join('')||'<tr><td colspan="6">暂无照片记录</td></tr>';
}
function runFaceImport(recordId) {
  const record=faceImportFiles.find(r=>r.id===recordId);
  if(!record || record.uploadStatus!=='success' || record.importStatus)return;
  const task={id:'FACE-'+Date.now()+'-'+Math.random().toString(36).slice(2,6),schoolId:record.schoolId,className:record.className,fileName:record.fileName,time:new Date().toLocaleString('sv-SE'),failures:[...record.failures],items:[]};
  record.matches.forEach(match=>{
    const student=FACE_STUDENTS.find(s=>s.id===match.studentId);if(!student)return;
    if(student.photoUrl?.startsWith('blob:'))URL.revokeObjectURL(student.photoUrl);
    student.photoUrl=URL.createObjectURL(match.blob);student.photoFile=match.originalName;student.updatedAt=task.time;student.recognitionSource='照片';student.syncStatus='待同步';student.syncFailureReason='';student.syncTaskId=task.id;
    task.items.push({studentId:student.id,name:student.name,fileName:match.originalName,status:'待同步',reason:''});
  });
  faceHistory.unshift(task);saveFaceHistory();record.importStatus=record.failures.length?'partial':'success';record.note='已导入 '+task.items.length+' 张，匹配失败 '+record.failures.length+' 张';
  refreshFaceImportList();refreshFaceSyncView();processFaceSyncQueue();
}

function renderFaceImportRow(record) {
  if (record.uploadStatus === 'checking') return `<tr><td>${esc(record.fileName)}</td><td>校验中</td><td>${esc(record.note)}</td><td>--</td></tr>`;
  if (record.uploadStatus === 'fail') return `<tr><td>${esc(record.fileName)}</td><td><span class="import-result-fail">上传失败</span></td><td>${esc(record.note)}</td><td>--</td></tr>`;
  let actionCell = `<button class="btn-link" onclick="runFaceImport('${record.id}')">导入</button>`;
  if (record.importStatus === 'processing') actionCell = '<span>导入中</span>';
  if (record.importStatus === 'success') actionCell = '<span class="import-action-success">导入成功</span>';
  if (record.importStatus === 'partial') actionCell = '<span class="status-tag warning">部分成功</span>';
  const detail = record.failures.length ? `<details><summary>${esc(record.note)}</summary><div class="form-hint" style="margin-top:6px">${record.failures.map(item => esc(item)).join('<br>')}</div></details>` : esc(record.note);
  return `<tr><td>${esc(record.fileName)}</td><td>上传完成</td><td>${detail}</td><td>${actionCell}</td></tr>`;
}

function renderFaceImportList() {
  if (!faceImportFiles.length) return '<div class="batch-import-empty">暂无上传记录</div>';
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>文件名</th><th>上传结果</th><th>匹配结果</th><th>操作</th></tr></thead><tbody>${faceImportFiles.map(renderFaceImportRow).join('')}</tbody></table></div>`;
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
  document.getElementById('modal-body').innerHTML = `<div class="batch-import-modal"><div class="face-import-main"><div class="batch-import-cabinet-row"><div class="batch-import-cabinet-field"><label class="form-label">当前学校</label><div class="input" style="width:100%;background:#f5f7fa">${esc(school?.name || '未选择学校')}</div></div><div class="batch-import-cabinet-field"><label class="form-label"><span class="required">*</span>班级</label><select class="select" id="face-import-class-select" style="width:100%"><option value="">请选择班级</option>${classes.map(item => `<option value="${esc(item)}">${esc(item)}</option>`).join('')}</select></div></div><div class="batch-import-list face-import-list" id="face-import-list">${renderFaceImportList()}</div></div><div class="batch-import-upload"><p class="form-hint">选择班级后上传该班照片 ZIP。系统按照片的完整姓名匹配该班学生编号，并将照片导入对应编号。</p><div class="batch-import-dropzone" id="face-import-dropzone"><div class="batch-import-dropzone-icon">📄</div><p class="batch-import-dropzone-text">拖动或点击上传该班照片 ZIP</p></div><input type="file" id="face-import-file-input" hidden accept=".zip"><div class="form-hint" style="margin-top:12px;line-height:1.8"><strong>照片命名规则</strong><br>格式：学生完整姓名.扩展名，例如：张三.jpg<br>同班重名示例：小明（01）.jpg、小明（02）.jpg<br>支持 JPG、JPEG、PNG；单张不超过 5MB；ZIP 不超过 50MB</div></div></div>`;
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

  faceFilters = { id: '', name: '', className: '', status: '' };
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
  const filteredStudents = schoolStudents.filter(student => student.id.includes(faceFilters.id) && student.name.includes(faceFilters.name) && (!faceFilters.className || student.className === faceFilters.className) && (!faceFilters.status || student.syncStatus === faceFilters.status));
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / facePageSize));
  faceCurrentPage = Math.min(faceCurrentPage, totalPages);
  const pageStudents = filteredStudents.slice((faceCurrentPage - 1) * facePageSize, faceCurrentPage * facePageSize);
  return `<div class="page-card">
    <div class="page-card-header"><div><div class="page-card-title">学生人脸信息</div><p class="form-hint">查看当前学校柜机录入并同步的学生人脸信息。学生照片仅展示后台最近一次上传的照片，当前识别数据以当前识别来源为准。</p></div></div>
    ${schoolSelector}
    <div class="filter-row"><label>学生编号 <input id="face-filter-id" class="input" placeholder="请输入学生编号" value="${esc(faceFilters.id)}"></label><label>姓名 <input id="face-filter-name" class="input" placeholder="请输入姓名" value="${esc(faceFilters.name)}"></label><label>班级 <select id="face-filter-class" class="select"><option value="">全部班级</option>${schoolClasses.map(c => `<option value="${esc(c)}" ${faceFilters.className === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label><label>同步状态 <select id="face-filter-status" class="select"><option value="">全部状态</option>${['同步中','同步成功','同步失败','待同步'].map(status => `<option ${faceFilters.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></label><button class="btn btn-secondary" onclick="searchFaceStudents(true)">重置</button><button class="btn btn-primary" onclick="searchFaceStudents()">搜索</button></div>
    <div class="page-card-actions" style="margin:16px 0"><button class="btn btn-primary" onclick="openFaceImportModal()">＋ 导入照片</button> <button class="btn" id="face-bulk-disable" onclick="openFaceBulkDisable()">批量禁用年级/班级</button> <button class="btn" onclick="openFaceImportHistory()">查看导入历史</button></div>
    <table class="data-table"><thead><tr><th>学生编号</th><th>姓名</th><th>班级</th><th title="后台最近一次导入的照片；当前识别数据以当前识别来源为准">学生照片</th><th>当前识别来源</th><th>最近更新时间</th><th>人脸状态</th><th>同步状态</th><th>说明</th><th>操作</th></tr></thead><tbody>${pageStudents.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${facePhotoHtml(s)}</td><td>${s.recognitionSource || '—'}</td><td>${s.updatedAt || '—'}</td><td>${faceDisabled[s.id] ? '<span style="color:#cf1322">已禁用</span>' : '正常'}</td><td><span style="color:${({'同步中':'#1677ff','同步成功':'#389e0d','同步失败':'#cf1322','待同步':'#d48806'})[s.syncStatus] || '#999'}">${s.syncStatus || '—'}</span></td><td style="min-width:180px;max-width:240px">${esc(s.syncFailureReason || '—')}</td><td style="white-space:nowrap"><button class="btn-link" onclick="openFacePhotoEdit('${s.id}')">${s.photoFile ? '修改照片' : '上传照片'}</button> ${faceDisabled[s.id] ? '<span class="text-muted">已禁用</span>' : `<button class="btn-link" onclick="openFaceDisable('${s.id}')">禁用人脸</button>`}</td></tr>`).join('')}</tbody></table>
    <div class="pagination pagination--with-size"><span class="page-btn ${faceCurrentPage === 1 ? 'disabled' : ''}" onclick="${faceCurrentPage === 1 ? '' : 'switchFacePage(' + (faceCurrentPage - 1) + ')'}">‹</span>${Array.from({length: totalPages}, (_, i) => `<span class="page-btn ${faceCurrentPage === i + 1 ? 'active' : ''}" onclick="switchFacePage(${i + 1})">${i + 1}</span>`).join('')}<span class="page-btn ${faceCurrentPage === totalPages ? 'disabled' : ''}" onclick="${faceCurrentPage === totalPages ? '' : 'switchFacePage(' + (faceCurrentPage + 1) + ')'}">›</span><span class="page-size-picker">每页 <select class="select page-size-select" aria-label="每页条数"><option selected>10 条</option><option>20 条</option><option>50 条</option></select></span><span class="page-jump">跳至 <input class="input sm" value="${faceCurrentPage}"> 页</span></div>
  </div>`;
}

function renderFaceLoginRecordPage() {
  return `<div class="page-card"><div class="page-card-header"><div><div class="page-card-title">人脸登录记录</div><p class="form-hint">记录柜机上的人脸登录、识别失败及学号密码兜底登录。</p></div></div>
    <div class="filter-row"><label>学生编号 <input class="input" placeholder="请输入学生编号"></label><label>结果 <select class="select"><option>全部</option><option>成功</option><option>失败</option><option>密码兜底</option></select></label><button class="btn btn-secondary">重置</button><button class="btn btn-primary">搜索</button></div>
    <table class="data-table"><thead><tr><th>时间</th><th>学生编号</th><th>姓名</th><th>班级</th><th>柜机</th><th>登录方式</th><th>结果</th><th>说明</th></tr></thead><tbody>${FACE_LOGIN_RECORDS.map(r => `<tr><td>${r.time}</td><td>${r.id}</td><td>${r.name}</td><td>${r.className}</td><td>${r.cabinet}</td><td>${r.method}</td><td>${r.result === 'success' ? '<span class="status-tag enabled">成功</span>' : r.result === 'fallback' ? '<span class="status-tag warning">密码兜底</span>' : '<span class="status-tag disabled">失败</span>'}</td><td>${r.reason}</td></tr>`).join('')}</tbody></table>
  </div>`;
}

faceHistory.forEach(t=>t.items.forEach(i=>{if(i.status==='同步中')i.status='待同步';}));
setTimeout(processFaceSyncQueue, 1000);
