/* 柜机版本：仅模拟包上传及安装回执，不调用真实设备。 */
function cvStore() {
  data.cabinetVersions ||= [];
  data.cabinetInstallTasks ||= [];

  // 清理原型早期上传的 ZIP 包及其明确关联的记录。
  const zipIds = new Set(data.cabinetVersions.filter(p => /\.zip$/i.test(p.fileName || '')).map(p => p.id));
  if (zipIds.size) {
    data.cabinetVersions = data.cabinetVersions.filter(p => !zipIds.has(p.id));
    data.cabinetInstallTasks = data.cabinetInstallTasks.filter(t => !zipIds.has(t.packageId));
    saveData(data);
  }
  return data.cabinetVersions;
}
function cvTime() { return new Date().toLocaleString('zh-CN', { hour12: false }); }
function cvCancelTask(id) {
  const task = data.cabinetInstallTasks.find(t => t.id === id);
  if (!cvCanCancel(task)) return toast('仅待更新任务可以取消', 'error');
  showConfirmModal({ title: '取消升级任务', message: '取消后柜机将不再执行此任务，是否继续？', confirmText: '确认取消', onConfirm: () => {
    if (!cvCanCancel(task)) return toast('任务已开始，无法取消', 'error');
    task.status = 'cancelled'; task.completedAt = cvTime(); saveData(data); cvRefresh();
  } });
}
let cvRecordFilter = {};
let cvRecordPage = 1;
let cvRecordSize = 10;
function cvOpenRecords(packageId) {
  cvRecordFilter = { packageId, version: data.cabinetVersions.find(p => p.id === packageId)?.version || '' };
  cvRecordPage = 1;
  cvActiveTab = 'records';
  cvRefresh();
}
function cvFilteredRecords() {
  const f = cvRecordFilter;
  return data.cabinetInstallTasks.filter(t => {
    const c = data.cabinets.find(c => c.id === t.cabinetId);
    const time = new Date(t.createdAt).getTime();
    return (!f.packageId || t.packageId === f.packageId)
      && (!f.cabinet || `${t.cabinetId} ${c?.name || ''}`.toLowerCase().includes(f.cabinet.toLowerCase()))
      && (!f.school || c?.schoolName === f.school)
      && (!f.version || t.version === f.version)
      && (!f.status || cvStatus(t) === f.status)
      && (!f.start || time >= new Date(f.start + 'T00:00:00').getTime())
      && (!f.end || time <= new Date(f.end + 'T23:59:59.999').getTime());
  });
}
function cvRecordFiltersHtml() {
  const f = cvRecordFilter;
  return `
    <form id="cv-record-filters" style="display:flex;flex-wrap:wrap;align-items:end;gap:12px;margin-bottom:16px" onsubmit="event.preventDefault();cvApplyRecords()">
      <label>柜机<input class="input" name="cabinet" placeholder="名称或ID" value="${esc(f.cabinet || '')}"></label>
      <label>学校<select class="select" name="school"><option value="">全部学校</option>${[...new Set(data.cabinets.map(c => c.schoolName).filter(Boolean))].map(name => `<option value="${esc(name)}" ${f.school === name ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label>
      <label>版本<select class="select" name="version"><option value="">全部版本</option>${[...new Set(data.cabinetInstallTasks.map(t => t.version))].map(v => `<option ${f.version === v ? 'selected' : ''} value="${esc(v)}">${esc(v)}</option>`).join('')}</select></label>
      <label>状态<select class="select" name="status"><option value="">全部状态</option>${['待更新','更新中','成功','失败','已取消'].map(v => `<option ${f.status === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>下发开始日期<input class="input" type="date" name="start" value="${esc(f.start || '')}"></label>
      <label>下发结束日期<input class="input" type="date" name="end" value="${esc(f.end || '')}"></label>
      <button class="btn btn-primary" type="submit">查询</button><button class="btn" type="button" onclick="cvResetRecords()">重置</button>
    </form>`;
}
function cvApplyRecords() {
  const fields = Object.fromEntries(new FormData(document.getElementById('cv-record-filters')));
  if (fields.start && fields.end && fields.start > fields.end) return toast('开始日期不能晚于结束日期', 'error');
  cvRecordFilter = { packageId: cvRecordFilter.packageId, ...fields };
  cvRecordPage = 1;
  cvRefresh();
}
function cvResetRecords() { cvRecordFilter = {}; cvRecordPage = 1; cvRefresh(); }
function cvRecordPager(total) {
  const pages = Math.max(1, Math.ceil(total / cvRecordSize));
  return `<div class="pagination pagination--with-size cv-record-pagination"><span>共 ${total} 条</span><button class="page-btn" ${cvRecordPage === 1 ? 'disabled' : ''} onclick="cvRecordPage--;cvRefresh()">‹</button><span>${cvRecordPage} / ${pages}</span><button class="page-btn" ${cvRecordPage === pages ? 'disabled' : ''} onclick="cvRecordPage++;cvRefresh()">›</button><label>跳至 <input type="number" class="input" style="width:70px" min="1" max="${pages}" value="${cvRecordPage}" onchange="cvRecordPage=Math.min(${pages},Math.max(1,Number(this.value)||1));cvRefresh()"> 页</label><select class="select" aria-label="每页条数" onchange="cvRecordSize=Number(this.value);cvRecordPage=1;cvRefresh()">${[10,20,50].map(n => `<option value="${n}" ${cvRecordSize === n ? 'selected' : ''}>${n} 条/页</option>`).join('')}</select></div>`;
}
function cvRefresh() { renderApp('cabinet-version'); }
function cvCanCancel(task) { return task?.status === 'pending' || (task?.status === 'installing' && task.manualStage === 'waiting'); }
function cvStatus(task) {
  if (task.status === 'installing' && task.manualStage === 'waiting') return '待更新';
  return { pending: '待更新', downloading: '更新中', installing: '更新中', success: '成功', failed: '失败', cancelled: '已取消' }[task.status];
}
function cvBusy(id) { return (data.cabinetInstallTasks || []).some(t => t.cabinetId === id && ['pending', 'downloading', 'installing'].includes(t.status)); }
let cvActiveTab = 'packages';
let cvPackageFilter = {};
function cvFilterPackages(packages) {
  const f = cvPackageFilter;
  return packages.filter(p => {
    const time = new Date(p.createdAt).getTime();
    return (!f.version || p.version.includes(f.version)) && (!f.start || time >= new Date(f.start + 'T00:00:00').getTime()) && (!f.end || time <= new Date(f.end + 'T23:59:59.999').getTime());
  });
}
function cvPackageFiltersHtml() {
  const f = cvPackageFilter;
  return `<form id="cv-package-filters" class="cv-package-filters" onsubmit="event.preventDefault();cvApplyPackages()"><label>版本号<input class="input" name="version" placeholder="请输入版本号" value="${esc(f.version || '')}"></label><label>上传开始日期<input class="input" type="date" name="start" value="${esc(f.start || '')}"></label><label>上传结束日期<input class="input" type="date" name="end" value="${esc(f.end || '')}"></label><button class="btn btn-primary" type="submit">查询</button><button class="btn" type="button" onclick="cvPackageFilter={};cvRefresh()">重置</button></form>`;
}
function cvApplyPackages() {
  const f = Object.fromEntries(new FormData(document.getElementById('cv-package-filters')));
  if (f.start && f.end && f.start > f.end) return toast('开始日期不能晚于结束日期', 'error');
  f.version = f.version.trim(); cvPackageFilter = f; cvRefresh();
}
function cvSwitchTab(value) { cvActiveTab = value; cvRefresh(); }
function renderCabinetVersionPage() {
  const versions = cvFilterPackages(cvStore());
  const records = cvFilteredRecords();
  cvRecordPage = Math.min(cvRecordPage, Math.max(1, Math.ceil(records.length / cvRecordSize)));
  return `<div class="page-card" style="min-height:auto"><div class="page-card-title">柜机升级</div><p class="form-hint" style="margin:0 0 16px">上传柜机安装包，选择指定柜机下发并跟踪安装结果。</p>
    <p class="form-hint" style="margin:0 0 16px">升级结果由柜机回执更新；原型可通过右下角控制台模拟回执。</p>
    <div class="mall-project-tabs" role="tablist" aria-label="柜机升级"><button type="button" id="cv-tab-packages" role="tab" aria-selected="${cvActiveTab === 'packages'}" aria-controls="cv-panel-packages" class="mall-project-tab ${cvActiveTab === 'packages' ? 'active' : ''}" onclick="cvSwitchTab('packages')">柜机版本</button><button type="button" id="cv-tab-records" role="tab" aria-selected="${cvActiveTab === 'records'}" aria-controls="cv-panel-records" class="mall-project-tab ${cvActiveTab === 'records' ? 'active' : ''}" onclick="cvSwitchTab('records')">升级记录</button></div><div id="cv-panel-packages" role="tabpanel" aria-labelledby="cv-tab-packages" ${cvActiveTab !== 'packages' ? 'hidden' : ''}>${cvPackageFiltersHtml()}<div class="toolbar" style="margin-bottom:16px"><div class="toolbar-left"><button class="btn btn-primary" onclick="cvUpload()">上传版本包</button></div><div class="toolbar-right status-text">共 ${versions.length} 个版本包</div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>版本号</th><th>安装包</th><th>大小</th><th>更新说明</th><th>已下发柜机数</th><th>上传时间</th><th>操作</th></tr></thead><tbody>${versions.map(v => {
      const dispatchedCount = new Set(data.cabinetInstallTasks.filter(t => t.packageId === v.id).map(t => t.cabinetId)).size;
      return `<tr><td>${esc(v.version)}</td><td>${esc(v.fileName)}</td><td>${v.size} MB</td><td style="max-width:280px;white-space:pre-wrap">${esc(v.notes)}</td><td><button class="btn-link" onclick="cvOpenRecords('${v.id}')">${dispatchedCount} 台</button></td><td>${esc(v.createdAt)}</td><td><button class="btn-link" onclick="cvDispatch('${v.id}')">下发柜机</button></td></tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;padding:36px">暂无符合条件的版本包</td></tr>'}</tbody></table></div>
    </div><div id="cv-panel-records" role="tabpanel" aria-labelledby="cv-tab-records" ${cvActiveTab !== 'records' ? 'hidden' : ''}>${cvRecordFiltersHtml()}<div class="status-text" style="margin-bottom:12px;text-align:right">共 ${records.length} 条记录</div><div class="table-wrap"><table class="data-table cv-record-table"><thead><tr><th>柜机ID</th><th>柜机名称</th><th>学校</th><th>升级前版本</th><th>目标版本</th><th>升级状态</th><th>下发时间</th><th>操作</th></tr></thead><tbody>${records.slice((cvRecordPage - 1) * cvRecordSize, cvRecordPage * cvRecordSize).map(t => {
      const c = data.cabinets.find(c => c.id === t.cabinetId);
      return `<tr><td>${esc(t.cabinetId)}</td><td>${esc(c?.name || '—')}</td><td>${esc(c?.schoolName || '—')}</td><td>${esc(t.from)}</td><td>${esc(t.version)}</td><td><span class="tag ${t.status === 'success' ? 'tag-green' : t.status === 'failed' ? 'tag-red' : ''}">${cvStatus(t)}</span></td><td>${esc(t.createdAt)}</td><td>${cvCanCancel(t) ? `<button class="btn-link" onclick="cvCancelTask('${t.id}')">取消</button>` : ''} ${t.status === 'failed' ? `<button class="btn-link" onclick="cvRetry('${t.id}')">重试</button>` : ''}</td></tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;padding:30px">暂无符合条件的升级记录</td></tr>'}</tbody></table></div>${cvRecordPager(records.length)}</div></div>`;
}
function cvDescription(task, cabinet) {
  if (task.status === 'pending') return task.downloadInterrupted ? '下载中断' : cabinet?.online === false ? '离线' : '待下载';
  if (task.status === 'downloading') return '下载中';
  if (task.status === 'installing') return task.manualStage === 'waiting' ? '待安装' : '安装中';
  if (task.status === 'failed') return '—';
  return '—';
}
let cvConsoleTaskId = '';
const cvConsoleFailures = { failed: '升级失败' };
function cvClearUpgradeData() {
  showConfirmModal({
    title: '清空升级数据',
    message: `将清空 ${data.cabinetVersions?.length || 0} 个版本包和 ${data.cabinetInstallTasks?.length || 0} 条升级记录，是否继续？`,
    hint: '清空后无法恢复，柜机当前版本保留。',
    confirmText: '确认清空',
    onConfirm: () => {
      data.cabinetVersions = [];
      data.cabinetInstallTasks = [];
      cvRecordFilter = {};
      cvPackageFilter = {};
      cvRecordPage = 1;
      cvSelection.clear();
      cvConsoleTaskId = '';
      saveData(data);
      cvRefresh();
      toast('已清空版本包和升级记录');
    }
  });
}
function renderCabinetUpgradeConsole() {
  cvStore();
  const tasks = data.cabinetInstallTasks.filter(t => ['pending', 'downloading', 'installing'].includes(t.status));
  if (!tasks.some(t => t.id === cvConsoleTaskId)) cvConsoleTaskId = tasks[0]?.id || '';
  const selected = tasks.find(t => t.id === cvConsoleTaskId);
  const device = data.cabinets.find(c => c.id === selected?.cabinetId);
  const pending = selected?.status === 'pending';
  const button = (key, label, enabled = true) => `<button class="btn" type="button" ${enabled ? '' : 'disabled'} onclick="cvConsoleResolve('${key}')">${label}</button>`;
  const options = tasks.map(t => {
    const cabinet = data.cabinets.find(c => c.id === t.cabinetId);
    return `<option value="${esc(t.id)}" ${t.id === cvConsoleTaskId ? 'selected' : ''}>${esc(cabinet?.name || t.cabinetId)} · ${esc(t.version)} · ${esc(cvStatus(t))}</option>`;
  }).join('');
  return `
    <div class="console-page-head">
      <span class="console-route-label">当前菜单</span>
      <strong>柜机升级</strong>
    </div>
    <section class="console-section">
      <h4>场景模拟</h4>
      <p>选择任务，模拟管理员更新。</p>
      ${tasks.length ? `
        <label class="console-field" for="cv-console-task">待回执任务</label>
        <select class="select console-select" id="cv-console-task" onchange="cvConsoleTaskId=this.value;renderConsolePanel()">${options}</select>
        <p>${esc(cvStatus(selected))} · ${device?.online ? '在线' : '离线'}</p>
        <p>${esc(cvDescription(selected, device))}</p>
        <div class="cv-console-buttons">
          ${button('offline',selected.status === 'downloading' ? '下载断网' : '柜机离线',!!device?.online)}${button('online','恢复联网',!device?.online)}
          ${pending ? button('progress',selected.downloadInterrupted ? '重新下载' : '管理员下载',!!device?.online) : ''}
          ${selected.status === 'downloading' ? button('downloaded','下载完成',!!device?.online) : ''}
          ${selected.status === 'installing' && selected.manualStage === 'waiting' ? button('cancelInstall','取消安装') + button('install','管理员安装') : ''}
          ${selected.status === 'installing' && selected.manualStage !== 'waiting' ? button('success','升级成功',!!device?.online) + button('failed','升级失败',!!device?.online) : ''}
        </div>
      ` : '<div class="console-empty console-empty--compact"><p>暂无待回执的升级任务</p></div>'}
    </section>
    <section class="console-section"><button type="button" class="btn btn-danger" onclick="cvClearUpgradeData()">清空版本包和升级记录</button></section>
    <div class="console-note">控制台仅用于原型演示，不向真实柜机发送指令。</div>
  `;
}

function cvConsoleResolve(result) {
  const taskId = document.getElementById('cv-console-task')?.value;
  const task = data.cabinetInstallTasks.find(t => t.id === taskId);
  if (!task || !['pending', 'downloading', 'installing'].includes(task.status)) {
    toast('请选择有效的待回执任务', 'error');
    renderConsolePanel?.();
    return;
  }
  const cabinet = data.cabinets.find(c => c.id === task.cabinetId);
  if (!cabinet) return toast('柜机不存在', 'error');
  cvConsoleTaskId = taskId;
  if (result === 'offline' || result === 'online') {

    cabinet.online = result === 'online'; if (!cabinet.online && task.status === 'downloading') { task.status = 'pending'; task.downloadInterrupted = true; }
    saveData(data); cvRefresh(); return;
  }
  const waiting = task.status === 'installing' && task.manualStage === 'waiting';
  const executing = task.status === 'installing' && task.manualStage !== 'waiting';
  const allowed = {
    progress: task.status === 'pending' && cabinet.online,
    downloaded: task.status === 'downloading' && cabinet.online,
    install: waiting,
    cancelInstall: waiting,
    success: executing && cabinet.online,
    failed: executing && cabinet.online
  };
  if (!allowed[result]) return toast('当前阶段不可执行该操作', 'error');
  if (result === 'cancelInstall') {
    toast('已取消本次安装，仍等待管理员安装');
    saveData(data); cvRefresh(); return;
  }  if (result === 'downloaded') { task.status = 'installing'; task.manualStage = 'waiting'; } else if (result === 'install') { task.status = 'installing'; task.manualStage = 'installing'; } else if (result === 'progress') { task.status = 'downloading'; task.downloadInterrupted = false; task.manualStage = null; task.message = '';
  } else if (result === 'success') {
    task.status = 'success';
    task.message = '安装成功，版本已更新（控制台模拟）';
    task.completedAt = cvTime();
    if (cabinet) { cabinet.installedVersion = task.version; cabinet.installedVersionCode = data.cabinetVersions.find(p => p.id === task.packageId)?.versionCode || null; }
    toast('已模拟柜机返回升级成功');
  } else {
    task.status = 'failed';
    if (!cvConsoleFailures[result]) return;
    task.failureReason = cvConsoleFailures[result];
    task.message = task.failureReason;
    toast('已模拟柜机返回升级失败', 'error');
  }
  saveData(data);
  cvActiveTab = 'records';
  cvRefresh();
}
function cvCabinetHistory(cabinetId) { cvHistory(null, cabinetId); }
function cvHistory(taskId, cabinetId) {
  cvStore();
  const task = data.cabinetInstallTasks.find(t => t.id === taskId);
  if (!task && !cabinetId) return;
  const targetId = cabinetId || task.cabinetId;
  const cabinet = data.cabinets.find(c => c.id === targetId);
  // 安装记录按创建顺序倒序保存；仅成功回执计入已安装版本历史。
  const history = data.cabinetInstallTasks.filter(t => t.cabinetId === targetId && t.status === 'success');
  openSimpleModal({ title: '柜机版本历史', size: 'xl', body: `<div class="cv-history-info"><span>柜机ID：${esc(targetId)}</span><span>柜机名称：${esc(cabinet?.name || '—')}</span><span>学校：${esc(cabinet?.schoolName || '—')}</span><span>当前版本：${esc(cabinet?.installedVersion || '未上报')}</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>安装包名称</th><th>已安装版本号</th><th>下发时间</th><th>安装完成时间</th></tr></thead><tbody>${history.map(t => {
    const fileName = data.cabinetVersions.find(p => p.id === t.packageId)?.fileName || t.fileName || '—';
    return `<tr><td>${esc(fileName)}</td><td>${esc(t.version)}</td><td>${esc(t.createdAt)}</td><td>${esc(t.completedAt || '—')}</td></tr>`;
  }).join('') || '<tr><td colspan="4" style="text-align:center;padding:30px">暂无安装成功的版本记录</td></tr>'}</tbody></table></div>`, footer: '<button class="btn btn-primary" onclick="closeModal()">关闭</button>' });
}

function cvUpload() {
  openSimpleModal({ title: '上传版本包', size: 'md', body: `<form id="cv-upload-form" style="display:grid;gap:24px;padding:8px 0"><div><label class="form-label" for="cv-version"><span class="required">*</span>版本号</label><input class="input" style="width:100%" id="cv-version" name="version" readonly placeholder="选择 APK 后自动解析"></div><div><label class="form-label" for="cv-package"><span class="required">*</span>版本包</label><div style="border:1px dashed var(--border);border-radius:6px;background:#fafafa;padding:20px"><input id="cv-package" name="package" type="file" accept=".apk" onchange="cvParseUpload(this)" required style="max-width:100%"><p class="form-hint" style="margin:12px 0 0">仅支持 APK 格式，文件大小不超过 500 MB</p></div></div><div><label class="form-label" for="cv-notes">更新说明 <span class="form-hint">（选填）</span></label><textarea class="input" style="width:100%;height:auto;resize:vertical" id="cv-notes" name="notes" maxlength="1000" rows="4" placeholder="请输入本次更新内容"></textarea></div><p id="cv-error" role="alert" style="color:var(--danger);margin:0"></p></form>`, footer: '<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="cvSaveUpload()">上传</button>' });
}
function cvSaveUpload() {
  const form = document.getElementById('cv-upload-form');
  if (!form.reportValidity()) return;
  if (!form.apkMetadata || form.apkFile !== form.elements.package.files[0]) { document.getElementById('cv-error').textContent = '请先选择 APK 并等待版本解析成功'; return; }
  const version = form.apkMetadata.version;
  const file = form.elements.package.files[0];
  const error = !version ? '请输入版本号' : !file || !/\.apk$/i.test(file.name) || file.size === 0 || file.size > 500 * 1024 * 1024 ? '请选择有效的 APK 文件，大小须大于 0 且不超过 500 MB' : '';
  if (error) { document.getElementById('cv-error').textContent = error; return; }
  const candidate = { id: crypto.randomUUID(), version, versionCode: form.apkMetadata.versionCode, fileName: file.name, size: (file.size / 1024 / 1024).toFixed(2), notes: form.elements.notes.value.trim(), createdAt: cvTime() };
  const save = () => { data.cabinetVersions.unshift(candidate); saveData(data); closeModal(); cvRefresh(); toast('版本包信息已保存（原型模拟）'); };
  if (cvStore().some(v => v.version.toLowerCase() === version.toLowerCase())) {
    showConfirmModal({ title: '相同版本已存在', message: `版本 ${version} 已有上传记录，是否继续上传「${file.name}」？`, hint: '继续上传将新增一条版本包记录，原包及已有升级记录保留。', confirmText: '继续上传', cancelText: '返回修改', onConfirm: save, onCancel: () => { cvUpload(); document.getElementById('cv-upload-form').replaceWith(form); } });
    return;
  }
  save();
}
let cvSelection = new Set();
let cvTargetState = { versionId: '', keyword: '', page: 1, pageSize: 10 };
function cvDispatch(id) {
  const v = cvStore().find(v => v.id === id);
  if (!v) return;
  cvSelection = new Set();
  cvTargetState = { versionId: id, keyword: '', page: 1, pageSize: 10 };
  openSimpleModal({ title: `下发安装 · ${v.version}`, size: 'xl', body: `<p>选择需要安装的柜机。离线柜机可下发，待上线后待管理员更新；同版本及有进行中任务的柜机不可重复下发。</p><input class="input" placeholder="搜索柜机名称、ID、学校" oninput="cvFilterTargets(this.value)" style="margin-bottom:16px"><div id="cv-target-list"></div><p id="cv-dispatch-error" role="alert" style="color:#d4380d"></p>`, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="cvConfirmDispatch('${id}')">下一步：确认下发</button>` });
  cvRenderTargets();
}
function cvFilterTargets(value) {
  cvTargetState.keyword = value.trim().toLowerCase();
  cvTargetState.page = 1;
  cvRenderTargets();
}
function cvTargetRows() {
  const keyword = cvTargetState.keyword;
  return data.cabinets.filter(c => !keyword || `${c.id} ${c.name} ${c.schoolName}`.toLowerCase().includes(keyword));
}
function cvTargetReason(c, version) {
  if (cvBusy(c.id)) return '已有进行中任务';
  const target = data.cabinetVersions.find(p => p.id === cvTargetState.versionId && p.version === version);
  return cvVersionBlock(c, target || { version });
}
function cvVersionBlock(c, pack) {
  const code = value => /^\d+$/.test(String(value ?? '')) ? BigInt(value) : null;
  const targetCode = code(pack.versionCode);
  const currentCode = code(c.installedVersionCode);
  if (targetCode !== null && currentCode !== null) {
    if (targetCode === currentCode) return '已是当前版本';
    if (targetCode < currentCode) return '目标版本低于当前版本';
    return '';
  }
  if (c.installedVersion === pack.version) return '已是当前版本';
  // 旧原型数据没有构建号；仅对纯数字点分版本做演示比较。
  if (/^\d+(\.\d+)*$/.test(c.installedVersion || '') && /^\d+(\.\d+)*$/.test(pack.version || '')) {
    const a = pack.version.split('.').map(BigInt), b = c.installedVersion.split('.').map(BigInt);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if ((a[i] || 0n) !== (b[i] || 0n)) return (a[i] || 0n) < (b[i] || 0n) ? '目标版本低于当前版本' : '';
    }
    return '已是当前版本';
  }
  return '当前版本无法比较，请先确认柜机版本';
}
function cvRenderTargets() {
  const root = document.getElementById('cv-target-list');
  const version = cvStore().find(v => v.id === cvTargetState.versionId)?.version;
  if (!root || !version) return;
  const filtered = cvTargetRows();
  const totalPages = Math.max(1, Math.ceil(filtered.length / cvTargetState.pageSize));
  cvTargetState.page = Math.min(cvTargetState.page, totalPages);
  const start = (cvTargetState.page - 1) * cvTargetState.pageSize;
  const rows = filtered.slice(start, start + cvTargetState.pageSize);
  const eligible = rows.filter(c => !cvTargetReason(c, version));
  const selectedCount = eligible.filter(c => cvSelection.has(c.id)).length;
  root.innerHTML = `<div class="cv-target-selection-summary">已选 <strong>${cvSelection.size}</strong> 台，共 ${filtered.length} 台 <button class="btn-link" onclick="cvToggleAllTargets(true, true)">选择全部搜索结果</button> <button class="btn-link" onclick="cvSelection.clear();cvRenderTargets()">清空选择</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th><label style="display:flex;align-items:center;gap:6px;white-space:nowrap"><input id="cv-target-select-all" type="checkbox" onchange="cvToggleAllTargets(this.checked)"> 全选本页</label></th><th>柜机名称</th><th>柜机ID</th><th>学校</th><th>在线状态</th><th>当前版本</th><th>说明</th></tr></thead><tbody>${rows.map(c => {
    const reason = cvTargetReason(c, version);
    return `<tr><td><input type="checkbox" ${reason ? 'disabled' : ''} ${cvSelection.has(c.id) ? 'checked' : ''} onchange="cvToggleTarget('${c.id}', this.checked)"></td><td>${esc(c.name)}</td><td>${esc(c.id)}</td><td>${esc(c.schoolName)}</td><td>${c.online ? '在线' : '离线'}</td><td>${esc(c.installedVersion || '未上报')}</td><td>${reason || (c.online ? '可下发' : '上线后待管理员更新')}</td></tr>`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;padding:30px">未找到符合条件的柜机</td></tr>'}</tbody></table></div><div class="pagination pagination--with-size"><span class="page-btn ${cvTargetState.page === 1 ? 'disabled' : ''}" onclick="cvTargetPage(${cvTargetState.page - 1})">‹</span>${Array.from({ length: totalPages }, (_, index) => index + 1).map(page => `<span class="page-btn ${page === cvTargetState.page ? 'active' : ''}" onclick="cvTargetPage(${page})">${page}</span>`).join('')}<span class="page-btn ${cvTargetState.page === totalPages ? 'disabled' : ''}" onclick="cvTargetPage(${cvTargetState.page + 1})">›</span><span class="page-size-picker">每页 <select class="select page-size-select" onchange="cvTargetPageSize(this.value)"><option value="10" ${cvTargetState.pageSize === 10 ? 'selected' : ''}>10 条</option><option value="20" ${cvTargetState.pageSize === 20 ? 'selected' : ''}>20 条</option><option value="50" ${cvTargetState.pageSize === 50 ? 'selected' : ''}>50 条</option></select></span></div>`;
  const master = document.getElementById('cv-target-select-all');
  if (master) {
    master.checked = eligible.length > 0 && selectedCount === eligible.length;
    master.indeterminate = selectedCount > 0 && selectedCount < eligible.length;
    master.disabled = eligible.length === 0;
  }
}
function cvToggleTarget(id, checked) {
  checked ? cvSelection.add(id) : cvSelection.delete(id);
  cvRenderTargets();
}
function cvToggleAllTargets(checked, all = false) {
  const version = cvStore().find(v => v.id === cvTargetState.versionId)?.version;
  const rows = cvTargetRows();
  (all ? rows : rows.slice((cvTargetState.page - 1) * cvTargetState.pageSize, cvTargetState.page * cvTargetState.pageSize)).filter(c => !cvTargetReason(c, version)).forEach(c => checked ? cvSelection.add(c.id) : cvSelection.delete(c.id));
  cvRenderTargets();
}
function cvTargetPage(page) {
  const totalPages = Math.max(1, Math.ceil(cvTargetRows().length / cvTargetState.pageSize));
  cvTargetState.page = Math.min(Math.max(1, page), totalPages);
  cvRenderTargets();
}
function cvTargetPageSize(value) {
  cvTargetState.pageSize = Number(value) || 10;
  cvTargetState.page = 1;
  cvRenderTargets();
}
function cvConfirmDispatch(id) {
  const v = cvStore().find(v => v.id === id);
  const targets = data.cabinets.filter(c => cvSelection.has(c.id));
  if (!targets.length) { document.getElementById('cv-dispatch-error').textContent = '请至少选择一台柜机'; return; }
  if (targets.some(c => cvBusy(c.id) || cvVersionBlock(c, v))) { toast('柜机状态或版本已变化，请重新选择', 'error'); return; }
  const offlineCount = targets.filter(c => !c.online).length;
  const onlineCount = targets.length - offlineCount;
  const targetItems = targets.map(c => `
    <li class="cv-confirm-target">
      <span class="cv-confirm-target-main"><strong>${esc(c.name)}</strong><span>${esc(c.id)}</span></span>
      <span class="tag ${c.online ? 'tag-green' : 'tag-red'}">${c.online ? '在线' : '离线'}</span>
    </li>
  `).join('');
  showConfirmModal({
    title: '确认升级柜机',
    size: 'md',
    htmlMessage: true,
    message: `
      <div class="cv-confirm-lead">将版本 <strong>${esc(v.version)}</strong> 下发至 <strong>${targets.length} 台柜机</strong></div>
      ${cvStore().filter(p => p.version === v.version).length > 1 ? `<p>版本包：${esc(v.fileName)}</p>` : ''}<div class="cv-confirm-counts">
        <span>在线 <strong>${onlineCount}</strong> 台</span>
        <span class="${offlineCount ? 'is-warning' : ''}">离线 <strong>${offlineCount}</strong> 台</span>
      </div>
      <details class="cv-confirm-details">
        <summary>查看已选柜机</summary>
        <ul class="cv-confirm-targets">${targetItems}</ul>
      </details>
      <div class="cv-confirm-note">${offlineCount ? `${offlineCount} 台柜机离线，上线后等待管理员下载安装；` : ''}升级时柜机可能重启，请避开借还高峰。</div>
    `,
    confirmText: `确认下发至 ${targets.length} 台柜机`,
    onConfirm: () => {
    if (targets.some(c => cvBusy(c.id) || cvVersionBlock(c, v))) return toast('柜机状态或版本已变化，请重新选择', 'error');
    targets.forEach(c => data.cabinetInstallTasks.unshift({ id: crypto.randomUUID(), cabinetId: c.id, packageId: v.id, version: v.version, from: c.installedVersion || '未上报', status: 'pending', createdAtMs: Date.now(), message: c.online ? '等待柜机接收安装任务' : '柜机离线，等待上线', createdAt: cvTime() }));
    cvActiveTab = 'records'; saveData(data); cvRefresh(); toast(`已创建 ${targets.length} 台柜机的安装任务（模拟）`);
  } });
}
function cvAdvance(id) {
  const t = data.cabinetInstallTasks.find(t => t.id === id);
  if (!t || !['pending','downloading','installing'].includes(t.status)) return;
  const c = data.cabinets.find(c => c.id === t.cabinetId);
  if (!c) return toast('柜机已删除，无法安装', 'error');
  if (!c.online) return toast('柜机离线，等待上线后再推进', 'error');
  t.status = { pending: 'downloading', downloading: 'installing', installing: 'success' }[t.status];
  t.message = { downloading: '柜机正在下载版本包（模拟）', installing: '下载完成，正在安装（模拟）', success: '安装成功，版本已更新（模拟）' }[t.status];
  if (t.status === 'success') { c.installedVersion = t.version; t.completedAt = cvTime(); }
  saveData(data); cvRefresh();
}
function cvFail(id) {
  const t = data.cabinetInstallTasks.find(t => t.id === id);
  if (!t || !['pending','downloading','installing'].includes(t.status)) return;
  t.status = 'failed'; t.message = '模拟安装失败：设备返回安装错误，请检查安装包后重试';
  saveData(data); cvRefresh();
}
function cvRetry(id) {
  const t = data.cabinetInstallTasks.find(t => t.id === id);
  if (!t || t.status !== 'failed') return;
  const c = data.cabinets.find(c => c.id === t.cabinetId);
  const pack = data.cabinetVersions.find(p => p.id === t.packageId) || t;
  if (!c || cvBusy(t.cabinetId) || cvVersionBlock(c, pack)) return toast(!c ? '柜机不存在' : cvBusy(t.cabinetId) ? '已有进行中任务' : cvVersionBlock(c, pack), 'error');
  data.cabinetInstallTasks.unshift({ ...t, id: crypto.randomUUID(), failureReason: null, from: c.installedVersion || '未上报', completedAt: null, status: 'pending', createdAtMs: Date.now(), createdAt: cvTime(), message: `重试任务；原任务 ${t.id}` });
  saveData(data); cvRefresh();
}
