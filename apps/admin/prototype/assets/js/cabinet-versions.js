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
function cvRefresh() { renderApp('cabinet-version'); }
function cvStatus(task) {
  if (task.status === 'installing' && task.manualStage === 'waiting') return '待更新';
  return { pending: '待更新', downloading: '待更新', installing: '待更新', success: '成功', failed: '失败' }[task.status];
}
function cvBusy(id) { return (data.cabinetInstallTasks || []).some(t => t.cabinetId === id && ['pending', 'downloading', 'installing'].includes(t.status)); }
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
function renderCabinetVersionPage() {
  const versions = cvFilterPackages(cvStore()).sort((a,b) => (Date.parse(b.createdAt)||0) - (Date.parse(a.createdAt)||0));
  cvPackagePage = Math.min(cvPackagePage, Math.max(1, Math.ceil(versions.length / cvPackageSize)));
  return `<div class="page-card" style="min-height:auto"><div class="page-card-title">柜机升级</div><p class="form-hint" style="margin:0 0 16px">上传柜机APK，向全部柜机下发更新。</p>
    <div id="cv-panel-packages">${cvPackageFiltersHtml()}<div class="toolbar" style="margin-bottom:16px"><div class="toolbar-left"><button class="btn btn-primary" onclick="cvUpload()">上传apk</button></div></div><div class="table-wrap"><table class="data-table"><thead><tr><th>版本号</th><th>安装包</th><th>大小</th><th>更新说明</th><th>已下发柜机数</th><th>上传时间</th><th>操作</th></tr></thead><tbody>${versions.slice((cvPackagePage-1)*cvPackageSize,cvPackagePage*cvPackageSize).map(v => {
      const dispatchedCount = new Set(data.cabinetInstallTasks.filter(t => t.packageId === v.id).map(t => t.cabinetId)).size;
      return `<tr><td>${esc(v.version)}</td><td>${esc(v.fileName)}</td><td>${v.size} MB</td><td style="max-width:280px;white-space:pre-wrap">${esc(v.notes)}</td><td>${dispatchedCount} 台</td><td>${esc(v.createdAt)}</td><td><button class="btn-link" onclick="cvDispatch('${v.id}')">下发更新</button> <button class="btn-link" onclick="cvDownloadApk('${v.id}')">下载</button> <button class="btn-link" style="color:var(--danger)" onclick="cvDeleteApk('${v.id}')">删除</button></td></tr>`;
    }).join('') || '<tr><td colspan="7" style="text-align:center;padding:36px">暂无符合条件的版本包</td></tr>'}</tbody></table></div>
    ${cvPackagePager(versions.length)}</div></div>`;
}function cvDescription(task) {
  if (task.status !== 'failed') return '—';
  return String(task.failureReason || '').trim() || '未返回失败原因';
}
let cvConsoleTaskId = '';
const cvConsoleFailures = { failed: '安装失败' };
function cvClearUpgradeData() {
  showConfirmModal({
    title: '清空升级数据',
    message: `将清空 ${data.cabinetVersions?.length || 0} 个版本包和 ${data.cabinetInstallTasks?.length || 0} 条升级任务，是否继续？`,
    hint: '清空后无法恢复，柜机当前版本保留。',
    confirmText: '确认清空',
    onConfirm: () => {
      data.cabinetVersions = [];
      data.cabinetInstallTasks = []; data.cabinetUpgradeBatches = [];
      cvPackageFilter = {};
      cvConsoleTaskId = '';
      saveData(data);
      cvRefresh();
      toast('已清空APK和升级数据');
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
    <section class="console-section"><button type="button" class="btn btn-danger" onclick="cvClearUpgradeData()">清空APK和升级数据</button></section>
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
function cvDispatch(id) {
  const pack = cvStore().find(p => p.id === id);
  if (!pack) return;
  if (!data.cabinets.length) return toast('暂无柜机可下发', 'warning');
  showConfirmModal({
    title: '确认柜机更新',
    message: `是否向全部 ${data.cabinets.length} 台柜机下发更新？`,
    hint: '目标版本：' + pack.version,
    confirmText: '确认下发',
    onConfirm: () => cvConfirmDispatch(id)
  });
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
function cvConfirmDispatch(id) {
  const v = cvStore().find(v => v.id === id);
  if (!v) return toast('版本包不存在', 'error');
  const targets = data.cabinets.filter(c => !cvVersionBlock(c, v) && !cvActiveTargetBlock(c, v));
  if (!targets.length) return toast('暂无需要更新的柜机', 'warning');
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
  saveData(data); closeModal(); cvRefresh(); toast('下发成功');
}// 一次下发一条批次；历史数据无批次依据时逐条保留，不猜测合并。
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
  showConfirmModal({title:'删除APK',message:`确认删除「${pack.fileName}」（${pack.version}）？`,hint:'删除后不再展示或用于新的下发，已下发任务保留。',confirmText:'删除',onConfirm:()=>{
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
