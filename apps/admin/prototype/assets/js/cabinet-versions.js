/* 柜机版本：仅模拟包上传及安装回执，不调用真实设备。 */
function cvStore() {
  data.cabinetVersions ||= [];
  data.cabinetInstallTasks ||= [];
  cvEnsureBatches();

  // 清理原型早期上传的 ZIP 包及其明确关联的记录。
  const zipIds = new Set(data.cabinetVersions.filter(p => /\.zip$/i.test(p.fileName || '')).map(p => p.id));
  if (zipIds.size) {
    data.cabinetVersions = data.cabinetVersions.filter(p => !zipIds.has(p.id));
    data.cabinetInstallTasks = data.cabinetInstallTasks.filter(t => !zipIds.has(t.packageId));
    saveData(data);
  }
  return data.cabinetVersions.filter(p => !p.deleted);
}
function cvTime() { return new Date().toLocaleString('zh-CN', { hour12: false }); }
let cvRecordFilter = {};
let cvRecordPage = 1;
let cvRecordSize = 10;
function cvOpenRecords(packageId) {
  cvBatchDetailId = null; cvBatchPage = 1; cvBatchFilter = { packageId, version: data.cabinetVersions.find(p => p.id === packageId)?.version || "" };
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
      <label>版本<select class="select" name="version"><option value="">全部版本</option>${[...new Set(data.cabinetInstallTasks.map(t=>t.version))].map(v=>`<option value="${esc(v)}" ${f.version===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>
      <label>下发开始日期<input class="input" type="date" name="start" value="${esc(f.start||'')}"></label><label>下发结束日期<input class="input" type="date" name="end" value="${esc(f.end||'')}"></label>
      <label>状态<select class="select" name="status"><option value="">全部状态</option>${['待更新','成功','失败'].map(v => `<option ${f.status === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
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
function cvStatus(task) {
  if (task.status === 'installing' && task.manualStage === 'waiting') return '待更新';
  return { pending: '待更新', downloading: '待更新', installing: '待更新', success: '成功', failed: '失败' }[task.status];
}
function cvBusy(id) { return (data.cabinetInstallTasks || []).some(t => t.cabinetId === id && ['pending', 'downloading', 'installing'].includes(t.status)); }
let cvActiveTab = 'packages';
let cvPackageFilter = {};
let cvPackagePage = 1;
let cvPackageSize = 10;
function cvPackagePager(total) {
  const pages = Math.max(1, Math.ceil(total / cvPackageSize));
  return `<div class="pagination pagination--with-size cv-record-pagination"><span>共${total}个</span><button class="page-btn" aria-label="上一页" ${cvPackagePage === 1 ? 'disabled' : ''} onclick="cvPackagePage--;cvRefresh()">‹</button><span>${cvPackagePage} / ${pages}</span><button class="page-btn" aria-label="下一页" ${cvPackagePage === pages ? 'disabled' : ''} onclick="cvPackagePage++;cvRefresh()">›</button><label>跳至 <input type="number" class="input" style="width:70px" min="1" max="${pages}" value="${cvPackagePage}" onchange="cvPackagePage=Math.min(${pages},Math.max(1,Math.floor(Number(this.value)||1)));cvRefresh()"> 页</label><select class="select" aria-label="APK每页条数" onchange="cvPackageSize=Number(this.value);cvPackagePage=1;cvRefresh()">${[10,20,50].map(n => `<option value="${n}" ${cvPackageSize === n ? 'selected' : ''}>${n} 条/页</option>`).join('')}</select></div>`;
}
function cvFilterPackages(packages) {
  const f = cvPackageFilter;
  return packages.filter(p => {
    const time = new Date(p.createdAt).getTime();
    return (!f.version || p.version.includes(f.version)) && (!f.start || time >= new Date(f.start + 'T00:00:00').getTime()) && (!f.end || time <= new Date(f.end + 'T23:59:59.999').getTime());
  });
}
function cvPackageFiltersHtml() {
  const f = cvPackageFilter;
  return `<form id="cv-package-filters" class="cv-package-filters" onsubmit="event.preventDefault();cvApplyPackages()"><label>版本号<input class="input" name="version" placeholder="请输入版本号" value="${esc(f.version || '')}"></label><label>上传开始日期<input class="input" type="date" name="start" value="${esc(f.start || '')}"></label><label>上传结束日期<input class="input" type="date" name="end" value="${esc(f.end || '')}"></label><button class="btn btn-primary" type="submit">查询</button><button class="btn" type="button" onclick="cvPackageFilter={};cvPackagePage=1;cvRefresh()">重置</button></form>`;
}
function cvApplyPackages() {
  const f = Object.fromEntries(new FormData(document.getElementById('cv-package-filters')));
  if (f.start && f.end && f.start > f.end) return toast('开始日期不能晚于结束日期', 'error');
  f.version = f.version.trim(); cvPackageFilter = f; cvPackagePage=1; cvRefresh();
}
function cvSwitchTab(value) { cvActiveTab = value; if (value === 'records') { cvRecordFilter = {}; cvRecordPage = 1; } cvRefresh(); }
function renderCabinetVersionPage() {
  const versions = cvFilterPackages(cvStore()).sort((a,b) => (Date.parse(b.createdAt)||0) - (Date.parse(a.createdAt)||0));
  cvPackagePage = Math.min(cvPackagePage, Math.max(1, Math.ceil(versions.length / cvPackageSize)));
  const records = cvFilteredRecords();
  cvRecordPage = Math.min(cvRecordPage, Math.max(1, Math.ceil(records.length / cvRecordSize)));
  return `<div class="page-card" style="min-height:auto"><div class="page-card-title">柜机升级</div><p class="form-hint" style="margin:0 0 16px">上传柜机安装包，选择指定柜机下发并跟踪安装结果。</p>
    <p class="form-hint" style="margin:0 0 16px">升级结果由柜机回执更新；原型可通过右下角控制台模拟回执。</p>
    <div class="mall-project-tabs" role="tablist" aria-label="柜机升级"><button type="button" id="cv-tab-packages" role="tab" aria-selected="${cvActiveTab === 'packages'}" aria-controls="cv-panel-packages" class="mall-project-tab ${cvActiveTab === 'packages' ? 'active' : ''}" onclick="cvSwitchTab('packages')">柜机apk</button><button type="button" id="cv-tab-records" role="tab" aria-selected="${cvActiveTab === 'records'}" aria-controls="cv-panel-records" class="mall-project-tab ${cvActiveTab === 'records' ? 'active' : ''}" onclick="cvSwitchTab('records')">升级记录</button></div><div id="cv-panel-packages" role="tabpanel" aria-labelledby="cv-tab-packages" ${cvActiveTab !== 'packages' ? 'hidden' : ''}>${cvPackageFiltersHtml()}<div class="toolbar" style="margin-bottom:16px"><div class="toolbar-left"><button class="btn btn-primary" onclick="cvUpload()">上传apk</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>版本号</th><th>安装包</th><th>大小</th><th>更新说明</th><th>已下发柜机数</th><th>上传时间</th><th>操作</th></tr></thead><tbody>${versions.slice((cvPackagePage-1)*cvPackageSize,cvPackagePage*cvPackageSize).map(v => {
      const dispatchedCount = new Set(data.cabinetInstallTasks.filter(t => t.packageId === v.id).map(t => t.cabinetId)).size;
      return `<tr><td>${esc(v.version)}</td><td>${esc(v.fileName)}</td><td>${v.size} MB</td><td style="max-width:280px;white-space:pre-wrap">${esc(v.notes)}</td><td><button class="btn-link" onclick="cvOpenRecords('${v.id}')">${dispatchedCount} 台</button></td><td>${esc(v.createdAt)}</td><td><button class="btn-link" onclick="cvDispatch('${v.id}')">下发更新</button> <button class="btn-link" onclick="cvOpenRecords('${v.id}')">下发记录</button> <button class="btn-link" onclick="cvDownloadApk('${v.id}')">下载</button> <button class="btn-link" style="color:var(--danger)" onclick="cvDeleteApk('${v.id}')">删除</button></td></tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;padding:36px">暂无符合条件的版本包</td></tr>'}</tbody></table></div>
    ${cvPackagePager(versions.length)}</div><div id="cv-panel-records" role="tabpanel" aria-labelledby="cv-tab-records" ${cvActiveTab !== 'records' ? 'hidden' : ''}>${cvFlatRecordsHtml()}</div></div>`;
}function cvDescription(task) {
  if (task.status !== 'failed') return '—';
  return String(task.failureReason || '').trim() || '未返回失败原因';
}
let cvConsoleTaskId = '';
const cvConsoleFailures = { failed: '安装失败' };
function cvClearUpgradeData() {
  showConfirmModal({
    title: '清空升级数据',
    message: `将清空 ${data.cabinetVersions?.length || 0} 个版本包和 ${data.cabinetInstallTasks?.length || 0} 条升级记录，是否继续？`,
    hint: '清空后无法恢复，柜机当前版本保留。',
    confirmText: '确认清空',
    onConfirm: () => {
      data.cabinetVersions = [];
      data.cabinetInstallTasks = []; data.cabinetUpgradeBatches = []; cvBatchDetailId = null; cvBatchPage = 1; cvBatchFilter = {};
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
        <p>${esc(cvDescription(selected, device))}</p>${selected.status === 'installing' && selected.manualStage !== 'waiting' ? '<label class="console-field">失败原因<input id="cv-failure-reason" class="input" maxlength="200" placeholder="输入柜机返回的原因（可留空）"></label>' : ''}
        <div class="cv-console-buttons">
          ${button('offline',selected.status === 'downloading' ? '下载断网' : '柜机离线',!!device?.online)}${button('online','恢复联网',!device?.online)}
          ${pending ? button('progress',selected.downloadInterrupted ? '重新下载' : '管理员下载',!!device?.online) : ''}
          ${selected.status === 'downloading' ? button('downloaded','下载完成',!!device?.online) : ''}
          ${selected.status === 'installing' && selected.manualStage === 'waiting' ? button('install','管理员安装') : ''}
          ${selected.status === 'installing' && selected.manualStage !== 'waiting' ? button('success','升级成功',!!device?.online) + button('failed','升级失败',!!device?.online) : ''}
        </div>
      ` : '<div class="console-empty console-empty--compact"><p>暂无待回执的升级任务</p></div>'}
    </section>
    <section class="console-section"><button type="button" class="btn btn-danger" onclick="cvClearUpgradeData()">清空版本包和升级记录</button></section>
    <div class="console-note">控制台仅用于原型演示，不向真实柜机发送指令。</div>
  `;
}

function cvConsoleResolve(result, explicitTaskId) {
  const taskId = explicitTaskId || document.getElementById('cv-console-task')?.value;
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
    success: executing && cabinet.online,
    failed: executing && cabinet.online
  };
  if (!allowed[result]) return toast('当前阶段不可执行该操作', 'error');
  if (result === 'downloaded') { task.status = 'installing'; task.manualStage = 'waiting'; } else if (result === 'install') { task.status = 'installing'; task.manualStage = 'installing'; } else if (result === 'progress') { task.status = 'downloading'; task.downloadInterrupted = false; task.manualStage = null; task.message = '';
  } else if (result === 'success') {
    task.status = 'success';
    task.message = '安装成功，版本已更新（控制台模拟）';
    task.completedAt = cvTime();
    if (cabinet) { cabinet.installedVersion = task.version; cabinet.installedVersionCode = data.cabinetVersions.find(p => p.id === task.packageId)?.versionCode || null; }
    toast('已模拟柜机返回升级成功');
  } else {
    task.status = 'failed';
    if (!cvConsoleFailures[result]) return;
    task.failureReason = document.getElementById(explicitTaskId ? 'cv-reason-' + explicitTaskId : 'cv-failure-reason')?.value.trim() || '';
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
  // 仅成功回执计入历史；优先按安装完成时间倒序，旧缺失记录排后。
  const timeValue = value => { const ms = Date.parse(value || ''); return Number.isFinite(ms) ? ms : 0; };
  const history = data.cabinetInstallTasks.filter(t => t.cabinetId === targetId && t.status === 'success').sort((a, b) => {
    const at = timeValue(a.completedAt), bt = timeValue(b.completedAt);
    return (!!bt - !!at) || (bt - at) || (timeValue(b.createdAt) - timeValue(a.createdAt));
  });
  openSimpleModal({ title: '柜机版本历史', size: 'xl', body: `<div class="cv-history-info"><span>柜机ID：${esc(targetId)}</span><span>柜机名称：${esc(cabinet?.name || '—')}</span><span>学校：${esc(cabinet?.schoolName || '—')}</span><span>当前版本：${esc(cabinet?.installedVersion || '未上报')}</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>安装包名称</th><th>已安装版本号</th><th>下发时间</th><th>安装完成时间</th></tr></thead><tbody>${history.map(t => {
    const fileName = data.cabinetVersions.find(p => p.id === t.packageId)?.fileName || t.fileName || '—';
    return `<tr><td>${esc(fileName)}</td><td>${esc(t.version)}</td><td>${esc(t.createdAt)}</td><td>${esc(t.completedAt || '—')}</td></tr>`;
  }).join('') || '<tr><td colspan="4" style="text-align:center;padding:30px">暂无安装成功的版本记录</td></tr>'}</tbody></table></div>`, footer: '<button class="btn btn-primary" onclick="closeModal()">关闭</button>' });
}

function cvUpload() {
  openSimpleModal({ title: '上传apk', size: 'md', body: `<form id="cv-upload-form" style="display:grid;gap:24px;padding:8px 0"><div><label class="form-label" for="cv-version"><span class="required">*</span>版本号</label><input class="input" style="width:100%;background:#f5f5f5;color:#8c8c8c;cursor:not-allowed" id="cv-version" name="version" disabled placeholder="选择 APK 后自动解析"></div><div><label class="form-label" for="cv-package"><span class="required">*</span>apk</label><div style="border:1px dashed var(--border);border-radius:6px;background:#fafafa;padding:20px"><input id="cv-package" name="package" type="file" accept=".apk" onchange="cvParseUpload(this)" required style="max-width:70%"><button type="button" class="btn" onclick="cvDemoUpload()">演示上传apk</button><p class="form-hint" style="margin:12px 0 0">仅支持 APK 格式，文件大小不超过 500 MB</p></div></div><div><label class="form-label" for="cv-notes">更新说明 <span class="form-hint">（选填）</span></label><textarea class="input" style="width:100%;height:auto;resize:vertical" id="cv-notes" name="notes" maxlength="1000" rows="4" placeholder="请输入本次更新内容"></textarea></div><p id="cv-error" role="alert" style="color:var(--danger);margin:0"></p></form>`, footer: '<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="cvSaveUpload()">上传</button>' });
}
function cvSaveUpload() {
  const form = document.getElementById('cv-upload-form');
  if (!form.reportValidity()) return;
  if (!form.apkMetadata || form.apkFile !== form.elements.package.files[0]) { document.getElementById('cv-error').textContent = '请先选择 APK 并等待版本解析成功'; return; }
  const version = form.apkMetadata.version;
  const file = form.elements.package.files[0];
  const error = !version ? '未解析到版本号，请重新选择有效的 APK' : !file || !/\.apk$/i.test(file.name) || file.size === 0 || file.size > 500 * 1024 * 1024 ? '请选择有效的 APK 文件，大小须大于 0 且不超过 500 MB' : '';
  if (error) { document.getElementById('cv-error').textContent = error; return; }
  const candidate = { id: crypto.randomUUID(), version, versionCode: form.apkMetadata.versionCode, fileName: file.name, size: (file.size / 1024 / 1024).toFixed(2), notes: form.elements.notes.value.trim(), createdAt: cvTime() };
  let saving = false;
  const save = async () => { if (saving) return; saving = true; try { await cvApkFile('put', candidate.id, file); data.cabinetVersions.unshift(candidate); saveData(data); closeModal(); cvRefresh(); toast('APK已保存'); } catch (e) { toast('保存失败，请检查浏览器存储空间后重试', 'error'); } finally { saving = false; } };
  // 上传不限制版本高低；未删除列表中的同版本禁止重复上传。
  if (cvStore().some(v => v.version.toLowerCase() === version.toLowerCase())) {
    document.getElementById('cv-error').textContent = '该版本已存在，请使用已有APK下发';
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
  const options = values => [...new Set(values.filter(Boolean))].map(value => `<option value="${esc(value)}">${esc(value)}</option>`).join('');
  openSimpleModal({ title: `下发安装 · ${v.version}`, size: 'xl', body: `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px"><input class="input" aria-label="柜机名称/ID" placeholder="搜索柜机名称/ID" oninput="cvFilterTargets(this.value)"><select class="select" aria-label="学校" onchange="cvTargetFilter('school',this.value)"><option value="">全部学校</option>${options(data.cabinets.map(c => c.schoolName))}</select><select class="select" aria-label="在线状态" onchange="cvTargetFilter('online',this.value)"><option value="">全部在线状态</option><option value="online">在线</option><option value="offline">离线</option></select><select class="select" aria-label="当前版本" onchange="cvTargetFilter('currentVersion',this.value)"><option value="">全部当前版本</option>${options(data.cabinets.map(c => c.installedVersion))}</select></div><div id="cv-target-list"></div><p id="cv-dispatch-error" role="alert" style="color:#d4380d"></p>`, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="cvConfirmDispatch('${id}')">下发更新</button>` });  cvRenderTargets();
}
function cvFilterTargets(value) {
  cvTargetState.keyword = value.trim().toLowerCase();
  cvTargetState.page = 1;
  cvRenderTargets();
}
function cvTargetFilter(field, value) {
  cvTargetState[field] = value; cvTargetState.page = 1; cvRenderTargets();
}
function cvTargetRows() {
  const f = cvTargetState;
  const pack = data.cabinetVersions.find(p => p.id === f.versionId);
  if (!pack) return [];
  return data.cabinets.filter(c => !cvVersionBlock(c, pack) && !cvActiveTargetBlock(c, pack) && (!f.keyword || `${c.id} ${c.name}`.toLowerCase().includes(f.keyword))
    && (!f.school || c.schoolName === f.school)
    && (!f.online || (f.online === 'online' ? c.online : !c.online))
    && (!f.currentVersion || c.installedVersion === f.currentVersion));
}function cvTargetReason(c, version) {

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
function cvActiveTargetBlock(c, pack) {
  return data.cabinetInstallTasks.some(task => {
    if (task.cabinetId !== c.id || !['pending', 'downloading', 'installing'].includes(task.status)) return false;
    const oldPackage = data.cabinetVersions.find(item => item.id === task.packageId);
    return !!cvVersionBlock({ installedVersion: task.version, installedVersionCode: oldPackage?.versionCode }, pack);
  }) ? '已有相同或更高版本待更新' : '';
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
  root.innerHTML = `<div class="cv-target-selection-summary">已选 <strong>${cvSelection.size}</strong> 台，共 ${filtered.length} 台 <button class="btn-link" onclick="cvToggleAllTargets(true, true)">选择全部搜索结果</button> <button class="btn-link" onclick="cvSelection.clear();cvRenderTargets()">清空选择</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th><label style="display:flex;align-items:center;gap:6px;white-space:nowrap"><input id="cv-target-select-all" type="checkbox" onchange="cvToggleAllTargets(this.checked)"> 全选本页</label></th><th>柜机名称</th><th>柜机ID</th><th>学校</th><th>在线状态</th><th>当前版本</th></tr></thead><tbody>${rows.map(c => {
    const reason = cvTargetReason(c, version);
    return `<tr><td><input type="checkbox" title="${esc(reason)}" ${reason ? 'disabled' : ''} ${cvSelection.has(c.id) ? 'checked' : ''} onchange="cvToggleTarget('${c.id}', this.checked)"></td><td>${esc(c.name)}</td><td>${esc(c.id)}</td><td>${esc(c.schoolName)}</td><td>${c.online ? '在线' : '离线'}</td><td>${esc(c.installedVersion || '未上报')}</td></tr>`;
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:30px">未找到符合条件的柜机</td></tr>'}</tbody></table></div><div class="pagination pagination--with-size"><span class="page-btn ${cvTargetState.page === 1 ? 'disabled' : ''}" onclick="cvTargetPage(${cvTargetState.page - 1})">‹</span>${Array.from({ length: totalPages }, (_, index) => index + 1).map(page => `<span class="page-btn ${page === cvTargetState.page ? 'active' : ''}" onclick="cvTargetPage(${page})">${page}</span>`).join('')}<span class="page-btn ${cvTargetState.page === totalPages ? 'disabled' : ''}" onclick="cvTargetPage(${cvTargetState.page + 1})">›</span><span class="page-size-picker">每页 <select class="select page-size-select" onchange="cvTargetPageSize(this.value)"><option value="10" ${cvTargetState.pageSize === 10 ? 'selected' : ''}>10 条</option><option value="20" ${cvTargetState.pageSize === 20 ? 'selected' : ''}>20 条</option><option value="50" ${cvTargetState.pageSize === 50 ? 'selected' : ''}>50 条</option></select></span></div>`;
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
  if (!v) return toast('版本包不存在', 'error');
  const targets = data.cabinets.filter(c => cvSelection.has(c.id));
  if (!targets.length) { document.getElementById('cv-dispatch-error').textContent = '请至少选择一台柜机'; return; }
  if (targets.some(c => cvVersionBlock(c, v) || cvActiveTargetBlock(c, v))) return toast('柜机版本或待更新目标已变化，请重新选择', 'error');
  const batch = cvCreateBatch(v, targets.length);
  targets.forEach(c => {
    data.cabinetInstallTasks.forEach(task => {
      if (task.cabinetId !== c.id || !['pending', 'downloading', 'installing'].includes(task.status)) return;
      // An active system installation must finish. Earlier stages are superseded only by a higher target.
      if (task.status === 'installing' && task.manualStage !== 'waiting') return;
      const oldPackage = data.cabinetVersions.find(pack => pack.id === task.packageId);
      if (cvVersionBlock({ installedVersion: task.version, installedVersionCode: oldPackage?.versionCode }, v)) return;
      task.status = 'failed';
      task.failureReason = '已被更高版本替代';
      task.message = task.failureReason;
      task.failedAt = cvTime();
    });
    data.cabinetInstallTasks.unshift({ batchId: batch.id, id: crypto.randomUUID(), cabinetId: c.id, packageId: v.id, version: v.version, from: c.installedVersion, status: 'pending', createdAtMs: Date.now(), createdAt: cvTime() });
  });
  cvSelection.clear(); cvRecordFilter = {}; cvRecordPage = 1; cvBatchDetailId = null; cvBatchPage = 1; cvBatchFilter = {}; cvActiveTab = 'records'; saveData(data); closeModal(); cvRefresh(); toast(`已下发至 ${targets.length} 台柜机`);
}function cvAdvance(id) {
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
// 一次下发一条批次；历史数据无批次依据时逐条保留，不猜测合并。
let cvBatchDetailId = null, cvBatchFilter = {}, cvBatchPage = 1, cvBatchSize = 10;
function cvEnsureBatches() {
  data.cabinetUpgradeBatches ||= [];
  const cancelled = data.cabinetInstallTasks.filter(t => t.status === 'cancelled');
  if (cancelled.length) {
    data.cabinetUpgradeArchive ||= [];
    data.cabinetUpgradeArchive.push(...cancelled);
    data.cabinetInstallTasks = data.cabinetInstallTasks.filter(t => t.status !== 'cancelled');
    saveData(data);
  }
  let changed = false;
  for (const t of data.cabinetInstallTasks) {
    if (!t.batchId) { t.batchId = 'OLD-' + t.id; changed = true; }
    if (!data.cabinetUpgradeBatches.some(b => b.id === t.batchId)) {
      const p = data.cabinetVersions.find(p => p.id === t.packageId);
      data.cabinetUpgradeBatches.push({ id: t.batchId, packageId: t.packageId, version: t.version, fileName: p?.fileName || t.fileName || '—', operator: '—', createdAt: t.createdAt, createdAtMs: t.createdAtMs || Date.parse(t.createdAt) || 0, legacy: true }); changed = true;
    }
  }
  let sequence = Math.max(data.cabinetUpgradeSequence || 0, ...data.cabinetUpgradeBatches.map(b => Number(b.recordNo) || 0));
  [...data.cabinetUpgradeBatches].sort((a,b) => a.createdAtMs-b.createdAtMs).forEach(b => { if (!b.recordNo) { b.recordNo = String(++sequence).padStart(4,'0'); changed = true; } });
  data.cabinetUpgradeSequence = sequence;
  if (changed) saveData(data);
}
function cvCreateBatch(pack) {
  const now = Date.now();
  const recordNo = String(data.cabinetUpgradeSequence = (data.cabinetUpgradeSequence || 0) + 1).padStart(4, '0');
  const batch = { recordNo, id: 'UP-' + now.toString(36).toUpperCase() + '-' + crypto.randomUUID().slice(0,8).toUpperCase(), packageId: pack.id || pack.packageId, version: pack.version, fileName: pack.fileName || '—', operator: '演示管理员', createdAt: cvTime(), createdAtMs: now };
  data.cabinetUpgradeBatches.unshift(batch); return batch;
}
function cvBatchTasks(id) { return data.cabinetInstallTasks.filter(t => t.batchId === id); }
function cvBatchRows() {
  const f = cvBatchFilter;
  return data.cabinetUpgradeBatches.filter(b => cvBatchTasks(b.id).length && (!f.id || b.recordNo.includes(f.id.trim())) && (!f.version || b.version === f.version) && (!f.packageId || b.packageId === f.packageId) && (!f.start || b.createdAtMs >= Date.parse(f.start+'T00:00:00')) && (!f.end || b.createdAtMs <= Date.parse(f.end+'T23:59:59.999'))).sort((a,b) => b.createdAtMs-a.createdAtMs);
}
function cvApplyBatchFilter() {
  const f = Object.fromEntries(new FormData(document.getElementById('cv-batch-filter')));
  if(f.start && f.end && f.start > f.end) return toast('开始日期不能晚于结束日期','error');
  cvBatchFilter = {...f, packageId:cvBatchFilter.packageId}; cvBatchPage=1; cvRefresh();
}
function cvBatchListHtml() {
  const f=cvBatchFilter, rows=cvBatchRows(), pages=Math.max(1,Math.ceil(rows.length/cvBatchSize)); cvBatchPage=Math.min(cvBatchPage,pages);
  return `<form id="cv-batch-filter" class="cv-package-filters" onsubmit="event.preventDefault();cvApplyBatchFilter()"><label>记录ID<input class="input" name="id" value="${esc(f.id||'')}" placeholder="请输入记录ID"></label><label>版本号<select class="select" name="version"><option value="">全部版本</option>${[...new Set(data.cabinetUpgradeBatches.map(b=>b.version))].map(v=>`<option ${f.version===v?'selected':''} value="${esc(v)}">${esc(v)}</option>`).join('')}</select></label><label>下发开始日期<input class="input" type="date" name="start" value="${esc(f.start||'')}"></label><label>下发结束日期<input class="input" type="date" name="end" value="${esc(f.end||'')}"></label><button class="btn btn-primary">查询</button><button type="button" class="btn" onclick="cvBatchFilter={};cvBatchPage=1;cvRefresh()">重置</button></form><p style="text-align:right">共${rows.length}条记录</p><div class="table-wrap"><table class="data-table cv-batch-table"><thead><tr><th>记录ID</th><th>版本号</th><th>安装包名称</th><th>下发柜机数</th><th>待更新</th><th>成功</th><th>失败</th><th>下发时间</th><th>操作</th></tr></thead><tbody>${rows.slice((cvBatchPage-1)*cvBatchSize,cvBatchPage*cvBatchSize).map(b=>{
    const tasks=cvBatchTasks(b.id), counts={}; tasks.forEach(t=>counts[cvStatus(t)]=(counts[cvStatus(t)]||0)+1);
    return `<tr><td>${esc(b.recordNo)}</td><td>${esc(b.version)}</td><td>${esc(b.fileName)}</td><td>${tasks.length}</td>${['待更新','成功','失败'].map(s=>`<td>${counts[s]||0}</td>`).join('')}<td>${esc(b.createdAt)}</td><td><button class="btn-link" onclick="cvOpenBatch('${b.id}')">查看详情</button></td></tr>`;
  }).join('')||'<tr><td colspan="10" style="text-align:center">暂无下发记录</td></tr>'}</tbody></table></div><div class="pagination"><button class="btn" ${cvBatchPage===1?'disabled':''} onclick="cvBatchPage--;cvRefresh()">上一页</button><span>${cvBatchPage}/${pages}</span><button class="btn" ${cvBatchPage===pages?'disabled':''} onclick="cvBatchPage++;cvRefresh()">下一页</button><select class="select" style="width:100px" aria-label="批次每页条数" onchange="cvBatchSize=Number(this.value);cvBatchPage=1;cvRefresh()">${[10,20,50].map(n=>`<option ${n===cvBatchSize?'selected':''} value="${n}">${n}条/页</option>`).join('')}</select></div>`;
}
function cvOpenBatch(id) { cvBatchDetailId=id;cvRecordFilter={};cvRecordPage=1;cvActiveTab='records';cvRefresh(); }
function cvBatchDetailHtml() {
  const b=data.cabinetUpgradeBatches.find(b=>b.id===cvBatchDetailId);
  if(!b) {cvBatchDetailId=null;return cvBatchListHtml();}
  const records=cvFilteredRecords(); cvRecordPage=Math.min(cvRecordPage,Math.max(1,Math.ceil(records.length/cvRecordSize)));
  return `<button class="btn" onclick="cvBatchDetailId=null;cvRefresh()">返回记录列表</button><h3>记录 ${esc(b.recordNo)}</h3><p>版本：${esc(b.version)}　安装包：${esc(b.fileName)}　下发时间：${esc(b.createdAt)}</p>${b.legacy?'<p class="form-hint">历史记录未保存批次信息，按原记录展示。</p>':''}${cvRecordFiltersHtml()}<p style="text-align:right">共${records.length}台柜机</p><div class="table-wrap"><table class="data-table"><thead><tr><th>柜机ID</th><th>柜机名称</th><th>学校</th><th>升级前版本</th><th>目标版本</th><th>升级状态</th><th>安装完成时间</th><th>操作</th></tr></thead><tbody>${records.slice((cvRecordPage-1)*cvRecordSize,cvRecordPage*cvRecordSize).map(t=>{
    const c=data.cabinets.find(c=>c.id===t.cabinetId);
    return `<tr><td>${esc(t.cabinetId)}</td><td>${esc(c?.name||'—')}</td><td>${esc(c?.schoolName||'—')}</td><td>${esc(t.from)}</td><td>${esc(t.version)}</td><td>${cvStatus(t)}</td><td>${t.status==='success'?esc(t.completedAt||'—'):'—'}</td><td></td></tr>`;
  }).join('')||'<tr><td colspan="8" style="text-align:center">暂无符合条件的柜机</td></tr>'}</tbody></table></div>${cvRecordPager(records.length)}`;
}
function cvFlatRecordsHtml() {
  const records = cvFilteredRecords().sort((a,b) => (b.createdAtMs || Date.parse(b.createdAt) || 0) - (a.createdAtMs || Date.parse(a.createdAt) || 0));
  cvRecordPage = Math.min(cvRecordPage, Math.max(1, Math.ceil(records.length / cvRecordSize)));
  return `${cvRecordFiltersHtml()}<div class="table-wrap"><table class="data-table cv-record-table"><thead><tr><th>柜机ID</th><th>柜机名称</th><th>学校</th><th>升级前版本</th><th>目标版本</th><th>升级状态</th><th>说明</th><th>下发时间</th></tr></thead><tbody>${records.slice((cvRecordPage-1)*cvRecordSize,cvRecordPage*cvRecordSize).map(t=>{
    const c=data.cabinets.find(c=>c.id===t.cabinetId);
    return `<tr><td>${esc(t.cabinetId)}</td><td>${esc(c?.name||'—')}</td><td>${esc(c?.schoolName||'—')}</td><td>${esc(t.from)}</td><td>${esc(t.version)}</td><td><div class="cv-status-demo"><span>${cvStatus(t)}</span>${cvRowDemo(t,c)}</div></td><td>${esc(cvDescription(t,c))}</td><td>${esc(t.createdAt)}</td></tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center">暂无符合条件的升级记录</td></tr>'}</tbody></table></div>${cvRecordPager(records.length)}`;
}
function cvApkFile(action, id, file) {
  return new Promise((resolve,reject) => {
    const request=indexedDB.open('cabinet-apk-files',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('files');
    request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{
      const db=request.result, tx=db.transaction('files',action==='get'?'readonly':'readwrite');
      const store=tx.objectStore('files'), op=action==='put'?store.put(file,id):store.get(id);
      let result; op.onsuccess=()=>result=op.result;
      tx.oncomplete=()=>{db.close();resolve(result)};
      tx.onerror=()=>{db.close();reject(tx.error)};
      tx.onabort=()=>{db.close();reject(tx.error)};
    };
  });
}
function cvDownloadApk(id) {
  if (!cvStore().some(p => p.id === id)) return;
  toast('下载完成');
}
function cvDeleteApk(id) {
  const pack=cvStore().find(p=>p.id===id);if(!pack)return;
  showConfirmModal({title:'删除APK',message:`确认删除「${pack.fileName}」（${pack.version}）？`,hint:'删除后不再展示或用于新的下发，已有升级记录保留。',confirmText:'删除',onConfirm:()=>{
    pack.deleted=true;saveData(data);cvRefresh();toast('已删除');
  }});
}
function cvDemoUpload() {
  const form = document.getElementById('cv-upload-form');
  let patch = 0;
  const versions = [...cvStore().map(p => p.version), ...data.cabinets.map(c => c.installedVersion)];
  const majors = versions.map(v => Number(String(v || '').split('.')[0])).filter(Number.isFinite);
  const version = `${Math.max(1, ...majors) + 1}.0.${patch}`;
  const file = new File(['Prototype APK demonstration only'], `cabinet_v${version}.apk`, {type:'application/vnd.android.package-archive'});
  const transfer = new DataTransfer(); transfer.items.add(file);
  form.elements.package.files = transfer.files;
  form.apkFile = file;
  form.apkMetadata = {version, versionCode: null};
  form.elements.version.value = version;
  document.getElementById('cv-error').textContent = '';
  toast('已模拟选择APK，请点击上传');
}
function cvRowDemo(task) {
  if (!['pending','downloading','installing'].includes(task.status)) return '';
  return `<div class="cv-row-demo"><button type="button" class="btn cv-demo-btn" title="演示升级成功" onclick="cvDemoResult('${task.id}','success')">成功</button><button type="button" class="btn cv-demo-btn" title="演示升级失败" onclick="cvDemoFailure('${task.id}')">失败</button></div>`;
}
function cvDemoFailure(id) {
  const reasons = ['下载失败', '安装包损坏', '版本不兼容', '存储空间不足', '安装失败'];
  openSimpleModal({
    title: '演示升级失败',
    size: 'sm',
    body: `<label class="form-label" for="cv-demo-reason">异常场景</label><select id="cv-demo-reason" class="select" style="width:100%"><option value="">请选择异常场景</option>${reasons.map(reason => `<option value="${reason}">${reason}</option>`).join('')}</select><p id="cv-demo-reason-error" role="alert" style="color:var(--danger);margin:8px 0 0"></p>`,
    footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="cvConfirmDemoFailure('${id}')">确定</button>`
  });
}
function cvConfirmDemoFailure(id) {
  const reason = document.getElementById('cv-demo-reason')?.value;
  if (!reason) {
    document.getElementById('cv-demo-reason-error').textContent = '请选择异常场景';
    return;
  }
  cvDemoResult(id, 'failed', reason);
  closeModal();
}
function cvDemoResult(id, result, reason='') {
  const task=data.cabinetInstallTasks.find(t=>t.id===id);
  if (!task || !['pending','downloading','installing'].includes(task.status) || !['success','failed'].includes(result)) return;
  const cabinet=data.cabinets.find(c=>c.id===task.cabinetId);
  task.status=result;
  if(result==='success') {
    task.completedAt=cvTime(); task.failureReason='';
    if(cabinet) {cabinet.installedVersion=task.version;cabinet.installedVersionCode=data.cabinetVersions.find(p=>p.id===task.packageId)?.versionCode || null;}
  } else { task.failureReason=reason.trim(); }
  saveData(data); cvRefresh(); toast(result==='success'?'已演示升级成功':'已演示升级失败');
}
