/* 人脸识别管理 · MVP 原型 */
const FACE_STUDENTS = [
  { id: '2026001', name: '张三', className: '一年级1班', status: 'enabled', updatedAt: '2026-09-20 10:12:00' },
  { id: '2026002', name: '李四', className: '一年级1班', status: 'enabled', updatedAt: '2026-09-20 10:12:00' },
  { id: '2026003', name: '王五', className: '一年级2班', status: 'disabled', updatedAt: '2026-09-18 16:40:00' },
  { id: '2026004', name: '赵六', className: '一年级2班', status: 'enabled', updatedAt: '2026-09-18 15:22:00' },
  { id: '2026005', name: '孙七', className: '一年级3班', status: 'enabled', updatedAt: '2026-09-18 14:08:00' },
  { id: '2026006', name: '周八', className: '一年级3班', status: 'disabled', updatedAt: '2026-09-17 17:35:00' },
  { id: '2026007', name: '吴九', className: '二年级1班', status: 'enabled', updatedAt: '2026-09-17 16:18:00' },
  { id: '2026008', name: '郑十', className: '二年级1班', status: 'enabled', updatedAt: '2026-09-17 15:42:00' },
  { id: '2026009', name: '钱一', className: '二年级2班', status: 'enabled', updatedAt: '2026-09-16 11:26:00' },
  { id: '2026010', name: '冯二', className: '二年级2班', status: 'disabled', updatedAt: '2026-09-16 10:05:00' },
  { id: '2026011', name: '陈三', className: '二年级3班', status: 'enabled', updatedAt: '2026-09-15 16:44:00' },
  { id: '2026012', name: '褚四', className: '二年级3班', status: 'enabled', updatedAt: '2026-09-15 15:30:00' },
  { id: '2026013', name: '卫五', className: '三年级1班', status: 'enabled', updatedAt: '2026-09-15 14:12:00' },
];

const FACE_LOGIN_RECORDS = [
  { time: '2026-09-28 08:31:22', id: '2026001', name: '张三', className: '一年级1班', result: 'success', method: '人脸识别', cabinet: '柜机-001', reason: '—' },
  { time: '2026-09-28 08:29:07', id: '2026008', name: '赵六', className: '一年级2班', result: 'failed', method: '人脸识别', cabinet: '柜机-001', reason: '未匹配到人脸' },
  { time: '2026-09-27 16:12:45', id: '2026003', name: '王五', className: '一年级2班', result: 'fallback', method: '学号密码', cabinet: '柜机-002', reason: '人脸已停用' },
];
let faceCurrentPage = 1;
let facePageSize = 10;

function faceStatusLabel(status) { return status === 'enabled' ? '<span class="status-tag enabled">已启用</span>' : '<span class="status-tag disabled">已停用</span>'; }

function facePhotoHtml(student, large = false) {
  return `<button class="face-photo-thumb${large ? ' face-photo-large' : ''}" type="button" onclick="openFacePhotoPreview('${student.id}')" title="查看学生照片">${student.name.slice(0, 1)}</button>`;
}

function openFacePhotoPreview(id) {
  const student = FACE_STUDENTS.find(s => s.id === id);
  if (!student) return;
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '查看学生照片';
  document.getElementById('modal-subtitle').style.display = 'none';
  document.getElementById('modal-body').innerHTML = `<div style="text-align:center"><div class="face-photo-preview">${student.name.slice(0, 1)}</div><p class="form-hint">${student.name}（${student.id}）· 当前人脸照片</p></div>`;
  document.getElementById('modal-footer').innerHTML = '<button type="button" class="btn" onclick="closeModal()">关闭</button>';
  document.getElementById('modal-footer').style.display = '';
  modal.classList.remove('modal-sm'); modal.classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
}

function openFaceImportModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '批量导入学生人脸';
  document.getElementById('modal-subtitle').style.display = 'none';
  document.getElementById('modal-body').innerHTML = `<div class="batch-import-modal"><div class="batch-import-list"><div class="batch-import-empty">暂无上传记录</div></div><div class="batch-import-upload"><p class="form-hint">请先下载模板，填写学生编号、姓名、班级和照片文件名，再上传 Excel 与照片压缩包。</p><div class="batch-import-dropzone" id="face-import-dropzone"><div class="batch-import-dropzone-icon">📄</div><p class="batch-import-dropzone-text">拖动或点击上传 Excel / 照片压缩包</p></div><input type="file" id="face-import-file-input" hidden multiple accept=".xlsx,.xls,.csv,.zip"><button type="button" class="btn btn-primary batch-import-template-btn" onclick="toast('模板下载（原型演示）')">模板下载</button></div></div>`;
  document.getElementById('modal-footer').style.display = '';
  document.getElementById('modal-footer').innerHTML = '<button type="button" class="btn" onclick="closeModal()">取消</button><button type="button" class="btn btn-primary" onclick="toast(\'文件校验完成后导入\');closeModal()">确定</button>';
  modal.classList.remove('modal-sm'); modal.classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
  const zone = document.getElementById('face-import-dropzone'); const input = document.getElementById('face-import-file-input');
  zone?.addEventListener('click', () => input?.click());
  input?.addEventListener('change', e => { if (e.target.files?.length) { zone.querySelector('.batch-import-dropzone-text').textContent = `已选择 ${e.target.files.length} 个文件`; } });
}

function toggleAllFaceStudents(checked) {
  document.querySelectorAll('.face-student-check').forEach(el => { el.checked = checked; });
}

function batchToggleFaceStudents(status) {
  const ids = [...document.querySelectorAll('.face-student-check:checked')].map(el => el.value);
  if (!ids.length) { toast('请先选择学生', 'warning'); return; }
  const action = status === 'enabled' ? '启用' : '停用';
  showConfirmModal({
    title: `批量${action}`,
    message: `确认${action}选中的 ${ids.length} 名学生吗？`,
    hint: status === 'disabled' ? '停用只影响人脸登录，不会删除百度人脸数据，也不影响编号密码登录。' : '仅已完成人脸同步的学生可以正常使用人脸登录。',
    confirmText: '确认',
    cancelText: '取消',
    onConfirm: () => {
      let success = 0;
      let failed = 0;
      FACE_STUDENTS.forEach(student => {
        if (!ids.includes(student.id)) return;
        if (status === 'enabled' && student.status === 'unregistered') { failed += 1; return; }
        student.status = status;
        success += 1;
      });
      toast(`${action}完成：成功 ${success} 条${failed ? `，失败 ${failed} 条` : ''}`, failed ? 'warning' : 'success');
      navigate('face-library');
    },
  });
}

function switchFacePage(page) {
  faceCurrentPage = page;
  navigate('face-library');
}

function toggleFaceStudent(id) {
  const student = FACE_STUDENTS.find(s => s.id === id);
  if (!student) return;
  student.status = student.status === 'enabled' ? 'disabled' : 'enabled';
  toast(student.status === 'enabled' ? '已启用人脸登录' : '已停用人脸登录', 'success');
  navigate('face-library');
}

function openFaceStudentEdit(id) {
  const student = FACE_STUDENTS.find(s => s.id === id);
  if (!student) return;
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '编辑学生人脸信息';
  document.getElementById('modal-subtitle').textContent = '修改后将重新同步到百度人脸库';
  document.getElementById('modal-subtitle').style.display = '';
  const currentPhotoName = `${student.id}${student.name} ${student.className}.jpg`;
  document.getElementById('modal-body').innerHTML = `<div class="face-edit-form"><label>学生编号<input class="input" value="${student.id}" disabled></label><label>姓名<input class="input" id="face-edit-name" value="${student.name}"></label><label>班级<input class="input" id="face-edit-class" value="${student.className}"></label><div class="face-photo-edit"><h4>学生照片</h4><div class="face-photo-file-row"><a href="#" onclick="return false">${currentPhotoName}</a><label class="face-photo-select">选择文件<input id="face-edit-photo" type="file" accept="image/*"></label></div><p class="form-hint">上传后将替换原有人脸照片并同步到百度人脸库。</p></div></div>`;
  document.getElementById('modal-footer').style.display = '';
  document.getElementById('modal-footer').innerHTML = '<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveFaceStudentEdit(\'' + student.id + '\')">保存</button>';
  modal.classList.remove('modal-sm'); modal.classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;
}

function saveFaceStudentEdit(id) {
  const student = FACE_STUDENTS.find(s => s.id === id);
  if (!student) return;
  student.name = document.getElementById('face-edit-name')?.value || student.name;
  student.className = document.getElementById('face-edit-class')?.value || student.className;
  if (document.getElementById('face-edit-photo')?.files?.length) student.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
  closeModal();
  toast('学生人脸信息已更新', 'success');
  navigate('face-library');
}

function renderFaceLibraryPage() {
  const totalPages = Math.max(1, Math.ceil(FACE_STUDENTS.length / facePageSize));
  faceCurrentPage = Math.min(faceCurrentPage, totalPages);
  const pageStudents = FACE_STUDENTS.slice((faceCurrentPage - 1) * facePageSize, faceCurrentPage * facePageSize);
  return `<div class="page-card">
    <div class="page-card-header"><div><div class="page-card-title">学生人脸库</div><p class="form-hint">维护学生与百度人脸库的绑定关系，停用只影响人脸登录，不影响学号密码登录。</p></div></div>
    <div class="filter-row"><label>学生编号 <input class="input" placeholder="请输入学生编号"></label><label>姓名 <input class="input" placeholder="请输入姓名"></label><label>班级 <input class="input" placeholder="请输入班级"></label><label>状态 <select class="select"><option>全部</option><option>已启用</option><option>已停用</option></select></label><button class="btn btn-secondary">重置</button><button class="btn btn-primary">搜索</button></div>
    <div class="page-card-actions" style="margin:16px 0"><button class="btn btn-primary" onclick="openFaceImportModal()">＋ 批量导入</button><button class="btn btn-secondary" onclick="batchToggleFaceStudents('enabled')">批量启用</button><button class="btn btn-secondary" onclick="batchToggleFaceStudents('disabled')">批量停用</button></div>
    <table class="data-table"><thead><tr><th><input type="checkbox" aria-label="全选学生" onchange="toggleAllFaceStudents(this.checked)"></th><th>学生编号</th><th>姓名</th><th>班级</th><th>人脸状态</th><th>最近同步时间</th><th>操作</th></tr></thead><tbody>${pageStudents.map(s => `<tr><td><input class="face-student-check" type="checkbox" value="${s.id}" aria-label="选择${s.name}"></td><td>${s.id}</td><td>${s.name}</td><td>${s.className}</td><td>${faceStatusLabel(s.status)}</td><td>${s.updatedAt}</td><td><button class="btn-link" onclick="openFaceStudentEdit('${s.id}')">编辑</button><button class="btn-link" onclick="toggleFaceStudent('${s.id}')">${s.status === 'enabled' ? '停用' : '启用'}</button></td></tr>`).join('')}</tbody></table>
    <div class="pagination pagination--with-size"><span class="page-btn ${faceCurrentPage === 1 ? 'disabled' : ''}" onclick="${faceCurrentPage === 1 ? '' : 'switchFacePage(' + (faceCurrentPage - 1) + ')'}">‹</span>${Array.from({length: totalPages}, (_, i) => `<span class="page-btn ${faceCurrentPage === i + 1 ? 'active' : ''}" onclick="switchFacePage(${i + 1})">${i + 1}</span>`).join('')}<span class="page-btn ${faceCurrentPage === totalPages ? 'disabled' : ''}" onclick="${faceCurrentPage === totalPages ? '' : 'switchFacePage(' + (faceCurrentPage + 1) + ')'}">›</span><span class="page-size-picker">每页 <select class="select page-size-select" aria-label="每页条数"><option selected>10 条</option><option>20 条</option><option>50 条</option></select></span><span class="page-jump">跳至 <input class="input sm" value="${faceCurrentPage}"> 页</span></div>
  </div>`;
}

function renderFaceLoginRecordPage() {
  return `<div class="page-card"><div class="page-card-header"><div><div class="page-card-title">人脸登录记录</div><p class="form-hint">记录柜机上的人脸登录、识别失败及学号密码兜底登录。</p></div></div>
    <div class="filter-row"><label>学生编号 <input class="input" placeholder="请输入学生编号"></label><label>结果 <select class="select"><option>全部</option><option>成功</option><option>失败</option><option>密码兜底</option></select></label><button class="btn btn-secondary">重置</button><button class="btn btn-primary">搜索</button></div>
    <table class="data-table"><thead><tr><th>时间</th><th>学生编号</th><th>姓名</th><th>班级</th><th>柜机</th><th>登录方式</th><th>结果</th><th>说明</th></tr></thead><tbody>${FACE_LOGIN_RECORDS.map(r => `<tr><td>${r.time}</td><td>${r.id}</td><td>${r.name}</td><td>${r.className}</td><td>${r.cabinet}</td><td>${r.method}</td><td>${r.result === 'success' ? '<span class="status-tag enabled">成功</span>' : r.result === 'fallback' ? '<span class="status-tag warning">密码兜底</span>' : '<span class="status-tag disabled">失败</span>'}</td><td>${r.reason}</td></tr>`).join('')}</tbody></table>
  </div>`;
}
