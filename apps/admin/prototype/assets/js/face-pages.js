/* 人脸识别管理 · MVP 原型 */
const FACE_SCHOOLS = [
  { id: 'school-001', name: '深圳市南山实验学校' },
  { id: 'school-002', name: '深圳市科技实验学校' },
];
const FACE_STUDENTS = [
  { id: '2026001', schoolId: 'school-001', name: '张三', className: '一年级1班', photoFile: '2026001.jpg', updatedAt: '2026-09-20 10:12:00', recognitionSource: '上传照片' },
  { id: '2026002', schoolId: 'school-001', name: '李四', className: '一年级1班', photoFile: '2026002.jpg', updatedAt: '2026-10-02 09:18:00', recognitionSource: '柜机视频' },
  { id: '2026003', schoolId: 'school-001', name: '王五', className: '一年级2班', photoFile: null, updatedAt: '2026-10-03 16:40:00', recognitionSource: '柜机视频' },
  { id: '2026004', schoolId: 'school-001', name: '赵六', className: '一年级2班', photoFile: '2026004.jpg', updatedAt: '2026-09-18 15:22:00', recognitionSource: '上传照片' },
  { id: '2026005', schoolId: 'school-001', name: '孙七', className: '一年级3班', photoFile: '2026005.jpg', updatedAt: '2026-10-04 14:08:00', recognitionSource: '柜机视频' },
  { id: '2026006', schoolId: 'school-001', name: '周八', className: '一年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026007', schoolId: 'school-001', name: '吴九', className: '二年级1班', photoFile: '2026007.jpg', updatedAt: '2026-09-17 16:18:00', recognitionSource: '上传照片' },
  { id: '2026014', schoolId: 'school-001', name: '蒋一', className: '二年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026015', schoolId: 'school-001', name: '沈二', className: '二年级2班', photoFile: '2026015.jpg', updatedAt: '2026-09-14 11:05:00', recognitionSource: '上传照片' },
  { id: '2026016', schoolId: 'school-001', name: '韩三', className: '二年级2班', photoFile: null, updatedAt: '2026-10-06 08:46:00', recognitionSource: '柜机视频' },
  { id: '2026017', schoolId: 'school-001', name: '杨四', className: '二年级3班', photoFile: '2026017.jpg', updatedAt: '2026-09-12 13:26:00', recognitionSource: '上传照片' },
  { id: '2026018', schoolId: 'school-001', name: '朱五', className: '二年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026008', schoolId: 'school-002', name: '郑十', className: '二年级1班', photoFile: '2026008.jpg', updatedAt: '2026-10-01 15:42:00', recognitionSource: '柜机视频' },
  { id: '2026009', schoolId: 'school-002', name: '钱一', className: '二年级2班', photoFile: '2026009.jpg', updatedAt: '2026-09-16 11:26:00', recognitionSource: '上传照片' },
  { id: '2026010', schoolId: 'school-002', name: '冯二', className: '二年级2班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026011', schoolId: 'school-002', name: '陈三', className: '二年级3班', photoFile: '2026011.jpg', updatedAt: '2026-09-15 16:44:00', recognitionSource: '上传照片' },
  { id: '2026012', schoolId: 'school-002', name: '褚四', className: '二年级3班', photoFile: '2026012.jpg', updatedAt: '2026-10-05 15:30:00', recognitionSource: '柜机视频' },
  { id: '2026013', schoolId: 'school-002', name: '卫五', className: '三年级1班', photoFile: '2026013.jpg', updatedAt: '2026-09-15 14:12:00', recognitionSource: '上传照片' },
  { id: '2026019', schoolId: 'school-002', name: '秦六', className: '三年级1班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026020', schoolId: 'school-002', name: '尤七', className: '三年级2班', photoFile: null, updatedAt: '2026-10-07 09:37:00', recognitionSource: '柜机视频' },
  { id: '2026021', schoolId: 'school-002', name: '许八', className: '三年级2班', photoFile: '2026021.jpg', updatedAt: '2026-09-11 10:20:00', recognitionSource: '上传照片' },
  { id: '2026022', schoolId: 'school-002', name: '何九', className: '三年级3班', photoFile: null, updatedAt: null, recognitionSource: null },
  { id: '2026023', schoolId: 'school-002', name: '吕十', className: '三年级3班', photoFile: '2026023.jpg', updatedAt: '2026-10-08 14:55:00', recognitionSource: '柜机视频' },
  { id: '2026024', schoolId: 'school-002', name: '施一', className: '四年级1班', photoFile: '2026024.jpg', updatedAt: '2026-09-10 09:48:00', recognitionSource: '上传照片' },
];

const FACE_LOGIN_RECORDS = [
  { time: '2026-09-28 08:31:22', id: '2026001', name: '张三', className: '一年级1班', result: 'success', method: '人脸识别', cabinet: '柜机-001', reason: '—' },
  { time: '2026-09-28 08:29:07', id: '2026008', name: '赵六', className: '一年级2班', result: 'failed', method: '人脸识别', cabinet: '柜机-001', reason: '未匹配到人脸' },
  { time: '2026-09-27 16:12:45', id: '2026003', name: '王五', className: '一年级2班', result: 'fallback', method: '学号密码', cabinet: '柜机-002', reason: '人脸已停用' },
];
let faceCurrentPage = 1;
let facePageSize = 10;
let faceSelectedSchool = '';


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
  document.getElementById('modal-body').innerHTML = `<div style="text-align:center"><div class="face-photo-preview">${student.name.slice(0, 1)}</div><p class="form-hint">${student.name}（${student.id}）· 当前人脸照片</p></div>`;
  document.getElementById('modal-footer').innerHTML = '<button type="button" class="btn" onclick="closeModal()">关闭</button>';
  document.getElementById('modal-footer').style.display = '';
  modal.classList.remove('modal-sm'); modal.classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
}

let faceImportFiles = [];

function analyzeFaceImportFile(index) {
  if (index === 3) return { uploadStatus: 'fail', outcome: 'upload-fail', note: '文件格式不正确' };
  if (index === 2) return { uploadStatus: 'success', outcome: 'validation-fail', note: '照片编号不存在，请检查文件名' };
  if (index === 1) return { uploadStatus: 'success', outcome: 'partial', note: '成功 8 条，失败 2 条' };
  return { uploadStatus: 'success', outcome: 'success', note: '' };
}
function handleFaceImportFiles(fileList) {
  if (!fileList?.length) return;
  Array.from(fileList).forEach(file => {
    const analysis = analyzeFaceImportFile(faceImportFiles.length);
    faceImportFiles.push({
      id: `face-import-${Date.now()}-${faceImportFiles.length}`,
      fileName: file.name,
      uploadStatus: analysis.uploadStatus,
      importStatus: null,
      note: analysis.note || '',
      outcome: analysis.outcome,
    });
  });
  refreshFaceImportList();
}

function triggerFaceImportUpload() {
  document.getElementById('face-import-file-input')?.click();
}

function runFaceImport(recordId) {
  const record = faceImportFiles.find(item => item.id === recordId);
  if (!record || record.uploadStatus !== 'success' || record.importStatus) return;
  if (record.outcome === 'validation-fail') {
    record.importStatus = 'validation-fail';
    toast('校验失败', 'error');
  } else if (record.outcome === 'partial') {
    record.importStatus = 'partial';
    toast('部分数据导入成功', 'warning');
  } else {
    record.importStatus = 'success';
    record.note = '学生照片已匹配并更新';
    toast('导入成功', 'success');
  }
  refreshFaceImportList();
}
function renderFaceImportRow(record) {
  if (record.uploadStatus === 'fail') {
    return `<tr><td>${esc(record.fileName)}</td><td><span class="import-result-fail">上传失败</span></td><td>${esc(record.note)}</td><td>--</td></tr>`;
  }
  let noteCell = record.note ? esc(record.note) : '<span class="status-tag warning">等待导入</span>';
  let actionCell = `<button class="btn-link" onclick="runFaceImport('${record.id}')">导入</button>`;
  if (record.importStatus === 'success') {
    noteCell = esc(record.note);
    actionCell = '<span class="import-action-success">导入成功</span>';
  } else if (record.importStatus === 'partial') {
    noteCell = `${esc(record.note)}　<button class="btn-link" onclick="toast('失败明细下载（原型演示）')">下载失败明细</button>`;
    actionCell = '<span class="status-tag warning">部分成功</span>';
  } else if (record.importStatus === 'validation-fail') {
    noteCell = `<span class="import-result-fail">${esc(record.note)}</span>`;
    actionCell = '<span class="import-result-fail">校验失败</span>';
  }
  return `<tr><td>${esc(record.fileName)}</td><td>上传完成</td><td>${noteCell}</td><td>${actionCell}</td></tr>`;
}
function renderFaceImportList() {
  if (!faceImportFiles.length) return '<div class="batch-import-empty">暂无上传记录</div>';
  return `<div class="table-wrap"><table class="data-table"><thead><tr><th>文件名</th><th>上传结果</th><th>说明</th><th>操作</th></tr></thead><tbody>${faceImportFiles.map(renderFaceImportRow).join('')}</tbody></table></div>`;
}

function refreshFaceImportList() {
  const list = document.getElementById('face-import-list');
  if (list) list.innerHTML = renderFaceImportList();
}

function openFaceImportModal() {
  faceImportFiles = [];
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '导入学生照片';
  document.getElementById('modal-subtitle').style.display = 'none';
  const school = FACE_SCHOOLS.find(item => item.id === faceSelectedSchool);
  document.getElementById('modal-body').innerHTML = `<div class="batch-import-modal"><div class="batch-import-list" id="face-import-list">${renderFaceImportList()}</div><div class="batch-import-upload"><div class="batch-import-cabinet-row"><div class="batch-import-cabinet-field"><label class="form-label">当前学校</label><div class="input" style="width:100%;background:#f5f7fa">${esc(school?.name || '未选择学校')}</div></div></div><p class="form-hint">上传照片压缩包，照片按“学生编号.扩展名”命名。系统按当前学校的学生编号自动匹配，导入照片会替换当前识别数据。</p><div class="batch-import-dropzone" id="face-import-dropzone"><div class="batch-import-dropzone-icon">📄</div><p class="batch-import-dropzone-text">拖动或点击上传照片 ZIP 压缩包</p></div><input type="file" id="face-import-file-input" hidden accept=".zip"><div class="form-hint" style="margin-top:12px;line-height:1.8"><strong>照片命名规则</strong><br>格式：学生编号.扩展名<br>示例：2026001.jpg<br>支持：JPG、JPEG、PNG</div></div></div>`;
  document.getElementById('modal-footer').style.display = '';
  document.getElementById('modal-footer').innerHTML = '<button type="button" class="btn" onclick="closeModal()">取消</button><button type="button" class="btn btn-primary" onclick="closeModal()">确定</button>';
  modal.classList.remove('modal-sm'); modal.classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
  const zone = document.getElementById('face-import-dropzone');
  const input = document.getElementById('face-import-file-input');
  zone?.addEventListener('click', triggerFaceImportUpload);
  input?.addEventListener('change', event => {
    handleFaceImportFiles(event.target.files);
    event.target.value = '';
  });
  zone?.addEventListener('dragover', event => {
    event.preventDefault();
    zone.classList.add('batch-import-dropzone--active');
  });
  zone?.addEventListener('dragleave', () => zone.classList.remove('batch-import-dropzone--active'));
  zone?.addEventListener('drop', event => {
    event.preventDefault();
    zone.classList.remove('batch-import-dropzone--active');
    handleFaceImportFiles(event.dataTransfer.files);
  });
}
function switchFacePage(page) {
  faceCurrentPage = page;
  navigate('face-library');
}


function switchFaceSchool(schoolId) {
  faceSelectedSchool = schoolId;
  faceCurrentPage = 1;
  navigate('face-library');
}



function renderFaceLibraryPage() {
  const schoolSelector = `<div class="filter-row"><label>学校 <select class="select" onchange="switchFaceSchool(this.value)"><option value="">请选择学校</option>${FACE_SCHOOLS.map(school => `<option value="${school.id}" ${faceSelectedSchool === school.id ? 'selected' : ''}>${school.name}</option>`).join('')}</select></label></div>`;
  if (!faceSelectedSchool) {
    return `<div class="page-card"><div class="page-card-header"><div><div class="page-card-title">学生人脸信息</div><p class="form-hint">请先选择学校，再查看该校学生人脸信息。</p></div></div>${schoolSelector}<div class="empty-state"><div class="empty-icon">🏫</div><div class="empty-title">请先选择学校</div><div class="empty-desc">人脸信息和同步范围均按学校管理</div></div></div>`;
  }
  const schoolStudents = FACE_STUDENTS.filter(student => student.schoolId === faceSelectedSchool);
  const totalPages = Math.max(1, Math.ceil(schoolStudents.length / facePageSize));
  faceCurrentPage = Math.min(faceCurrentPage, totalPages);
  const pageStudents = schoolStudents.slice((faceCurrentPage - 1) * facePageSize, faceCurrentPage * facePageSize);
  return `<div class="page-card">
    <div class="page-card-header"><div><div class="page-card-title">学生人脸信息</div><p class="form-hint">查看当前学校柜机录入并同步的学生人脸信息。学生照片仅展示后台最近一次上传的照片，当前识别数据以当前识别来源为准。</p></div></div>
    ${schoolSelector}
    <div class="filter-row"><label>学生编号 <input class="input" placeholder="请输入学生编号"></label><label>姓名 <input class="input" placeholder="请输入姓名"></label><label>班级 <input class="input" placeholder="请输入班级"></label><button class="btn btn-secondary">重置</button><button class="btn btn-primary">搜索</button></div>
    <div class="page-card-actions" style="margin:16px 0"><button class="btn btn-primary" onclick="openFaceImportModal()">＋ 导入照片</button></div>
    <table class="data-table"><thead><tr><th>学生编号</th><th>姓名</th><th>班级</th><th title="后台最近一次导入的照片；当前识别数据以当前识别来源为准">学生照片</th><th>当前识别来源</th><th>最近更新时间</th></tr></thead><tbody>${pageStudents.map(s => `<tr><td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${facePhotoHtml(s)}</td><td>${s.recognitionSource || '—'}</td><td>${s.updatedAt || '—'}</td></tr>`).join('')}</tbody></table>
    <div class="pagination pagination--with-size"><span class="page-btn ${faceCurrentPage === 1 ? 'disabled' : ''}" onclick="${faceCurrentPage === 1 ? '' : 'switchFacePage(' + (faceCurrentPage - 1) + ')'}">‹</span>${Array.from({length: totalPages}, (_, i) => `<span class="page-btn ${faceCurrentPage === i + 1 ? 'active' : ''}" onclick="switchFacePage(${i + 1})">${i + 1}</span>`).join('')}<span class="page-btn ${faceCurrentPage === totalPages ? 'disabled' : ''}" onclick="${faceCurrentPage === totalPages ? '' : 'switchFacePage(' + (faceCurrentPage + 1) + ')'}">›</span><span class="page-size-picker">每页 <select class="select page-size-select" aria-label="每页条数"><option selected>10 条</option><option>20 条</option><option>50 条</option></select></span><span class="page-jump">跳至 <input class="input sm" value="${faceCurrentPage}"> 页</span></div>
  </div>`;
}

function renderFaceLoginRecordPage() {
  return `<div class="page-card"><div class="page-card-header"><div><div class="page-card-title">人脸登录记录</div><p class="form-hint">记录柜机上的人脸登录、识别失败及学号密码兜底登录。</p></div></div>
    <div class="filter-row"><label>学生编号 <input class="input" placeholder="请输入学生编号"></label><label>结果 <select class="select"><option>全部</option><option>成功</option><option>失败</option><option>密码兜底</option></select></label><button class="btn btn-secondary">重置</button><button class="btn btn-primary">搜索</button></div>
    <table class="data-table"><thead><tr><th>时间</th><th>学生编号</th><th>姓名</th><th>班级</th><th>柜机</th><th>登录方式</th><th>结果</th><th>说明</th></tr></thead><tbody>${FACE_LOGIN_RECORDS.map(r => `<tr><td>${r.time}</td><td>${r.id}</td><td>${r.name}</td><td>${r.className}</td><td>${r.cabinet}</td><td>${r.method}</td><td>${r.result === 'success' ? '<span class="status-tag enabled">成功</span>' : r.result === 'fallback' ? '<span class="status-tag warning">密码兜底</span>' : '<span class="status-tag disabled">失败</span>'}</td><td>${r.reason}</td></tr>`).join('')}</tbody></table>
  </div>`;
}
