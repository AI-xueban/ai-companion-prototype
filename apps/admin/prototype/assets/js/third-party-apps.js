const THIRD_PARTY_SCHOOLS = ['实验中学', '培英小学', '湖丰镇中学', '莲王柏中学'];
const THIRD_PARTY_STATUS = { enabled: '已上架', disabled: '已下架' };

function openSimpleModal({ title, body, footer }) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-subtitle').textContent = '';
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-footer').innerHTML = footer;
  overlay.hidden = false;
}

function getThirdPartyApps() {
  if (!Array.isArray(data.thirdPartyApps)) data.thirdPartyApps = [];
  if (!data.thirdPartyApps.length) {
    data.thirdPartyApps.push(
      { id: 'demo-wechat', name: '微信', packageName: 'com.tencent.mm', version: '8.0.50', fileName: 'wechat-8.0.50.apk', icon: '微', schools: ['实验中学', '培英小学'], enabled: true, updatedAt: '2026-09-23 10:00:00' },
      { id: 'demo-browser', name: '浏览器', packageName: 'com.android.browser', version: '12.4.1', fileName: 'browser-12.4.1.apk', icon: '网', schools: ['湖丰镇中学'], enabled: true, updatedAt: '2026-09-22 16:30:00' },
    );
    saveData(data);
  }
  data.thirdPartyApps.forEach((app) => { if (!Array.isArray(app.schools)) app.schools = ['实验中学']; });
  return data.thirdPartyApps;
}

function thirdPartySchoolTags(schools) {
  return (schools || []).map((school) => `<span class="third-party-school-tag">${esc(school)}</span>`).join('');
}

function renderThirdPartyAppsPage(params = {}) {
  params = params || {};
  const apps = getThirdPartyApps();
  const filters = { name: params.name || '', school: params.school || '', status: params.status || '', updatedStart: params.updatedStart || '', updatedEnd: params.updatedEnd || '' };
  const filtered = apps.filter((app) => {
    const appName = String(app.name || '');
    const nameMatch = !filters.name || appName.toLowerCase().includes(filters.name.toLowerCase());
    const schoolMatch = !filters.school || (app.schools || []).includes(filters.school);
    const statusMatch = !filters.status || (filters.status === 'enabled' ? app.enabled : !app.enabled);
    const appDate = String(app.updatedAt || '').slice(0, 10);
    const dateMatch = (!filters.updatedStart || appDate >= filters.updatedStart) && (!filters.updatedEnd || appDate <= filters.updatedEnd);
    return nameMatch && schoolMatch && statusMatch && dateMatch;
  });
  return `<div class="page third-party-app-page">
    <div class="page-header"><div><h2>第三方应用</h2><p class="page-subtitle">按学校维护应用安装包，发布后学生端按学校展示。</p></div><button class="btn btn-primary" onclick="openThirdPartyAppForm()">上传应用</button></div>
    <div class="third-party-filters"><label><span>应用名称</span><input class="input" id="third-party-filter-name" value="${esc(filters.name)}" placeholder="搜索应用名称"></label><label><span>学校</span><select class="select" id="third-party-filter-school"><option value="">全部学校</option>${THIRD_PARTY_SCHOOLS.map((school) => `<option value="${esc(school)}" ${filters.school === school ? 'selected' : ''}>${esc(school)}</option>`).join('')}</select></label><label><span>状态</span><select class="select" id="third-party-filter-status"><option value="">全部状态</option><option value="enabled" ${filters.status === 'enabled' ? 'selected' : ''}>已上架</option><option value="disabled" ${filters.status === 'disabled' ? 'selected' : ''}>已下架</option></select></label><label class="third-party-date-range"><span>更新时间</span><div><input class="input" id="third-party-filter-start" type="date" value="${esc(filters.updatedStart)}"><b>至</b><input class="input" id="third-party-filter-end" type="date" value="${esc(filters.updatedEnd)}"></div></label><div class="third-party-filter-actions"><button class="btn btn-primary btn-sm" onclick="applyThirdPartyFilters()">查询</button><button class="btn btn-sm" onclick="resetThirdPartyFilters()">重置</button></div></div>
    <div class="third-party-summary"><div><strong>${filtered.length}</strong><span>当前结果</span></div><div><strong>${apps.filter(app => app.enabled).length}</strong><span>已上架</span></div><div><strong>${apps.filter(app => !app.enabled).length}</strong><span>已下架</span></div></div>
    <div class="panel"><div class="third-party-list-toolbar"><button class="btn btn-primary" onclick="openLibraryAppForm()">上传应用</button></div><div class="table-wrap"><table class="third-party-table"><thead><tr><th>排序</th><th>应用</th><th>学校</th><th>包名</th><th>版本号</th><th>安装包</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${filtered.length ? filtered.map((app, i) => `<tr><td>${i + 1}</td><td><div class="third-party-app-name"><span class="third-party-app-icon">${app.icon || '▦'}</span><strong>${esc(app.name)}</strong></div></td><td><div class="third-party-school-tags">${thirdPartySchoolTags(app.schools)}</div></td><td class="muted">${esc(app.packageName || '未提取')}</td><td>${esc(app.version || '未提取')}</td><td>${esc(app.fileName || '未上传')}</td><td>${app.enabled ? '<span class="status-tag enabled">已上架</span>' : '<span class="status-tag disabled">已下架</span>'}</td><td>${esc(app.updatedAt || '—')}</td><td><button class="btn-link" onclick="openThirdPartyAppForm('${app.id}')">编辑</button><button class="btn-link" onclick="toggleThirdPartyApp('${app.id}')">${app.enabled ? '下架' : '上架'}</button></td></tr>`).join('') : '<tr><td colspan="10" class="empty-state">没有符合条件的应用。</td></tr>'}</tbody></table></div></div>
    <div class="third-party-app-tip">APK 上传后自动提取图标、包名和版本号；学生端已安装的应用即使后台下架也可以继续使用。</div>
  </div>`;
}

function applyThirdPartyFilters() {
  navigate('third-party-apps', { name: document.getElementById('third-party-filter-name')?.value.trim() || '', school: document.getElementById('third-party-filter-school')?.value || '', status: document.getElementById('third-party-filter-status')?.value || '', updatedStart: document.getElementById('third-party-filter-start')?.value || '', updatedEnd: document.getElementById('third-party-filter-end')?.value || '' });
}
function resetThirdPartyFilters() { navigate('third-party-apps'); }

function extractThirdPartyApk(file) {
  const base = file.name.replace(/\.apk$/i, '').toLowerCase();
  if (/wechat|weixin|微信/.test(base)) return { icon: '微', packageName: 'com.tencent.mm', version: '8.0.50' };
  if (/browser|浏览器/.test(base)) return { icon: '网', packageName: 'com.android.browser', version: '12.4.1' };
  if (/feishu|lark|飞书/.test(base)) return { icon: '飞', packageName: 'com.ss.android.lark', version: '7.2.0' };
  if (/notes|note|笔记/.test(base)) return { icon: '记', packageName: 'com.example.notes', version: '3.1.1' };
  return { icon: '', packageName: '', version: '' };
}

function showThirdPartyExtractError(id, message) { const el = document.getElementById(id); if (el) el.textContent = message; }
function handleThirdPartyFileChange(input) {
  ['third-party-icon-error', 'third-party-package-error', 'third-party-version-error', 'third-party-file-error'].forEach((id) => showThirdPartyExtractError(id, ''));
  const file = input.files?.[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.apk')) { showThirdPartyExtractError('third-party-file-error', '仅支持上传 APK 文件'); input.value = ''; return; }
  const meta = extractThirdPartyApk(file);
  document.getElementById('third-party-icon').value = meta.icon;
  const iconPreview = document.getElementById('third-party-icon-preview');
  if (iconPreview) iconPreview.textContent = meta.icon || '暂无图标';
  document.getElementById('third-party-package').value = meta.packageName;
  document.getElementById('third-party-version').value = meta.version;
  if (!meta.icon) showThirdPartyExtractError('third-party-icon-error', '未提取应用图标');
  if (!meta.packageName) showThirdPartyExtractError('third-party-package-error', '未提取应用包名');
  if (!meta.version) showThirdPartyExtractError('third-party-version-error', '未提取版本号');
}

function renderExtractField(label, id, value, errorId) { return `<label class="form-item"><span>${label}</span><input class="input" id="${id}" value="${esc(value || '')}" readonly><small id="${errorId}" class="third-party-field-error"></small></label>`; }
function renderIconField(app) { return `<label class="form-item"><span>应用图标</span><input class="input" id="third-party-icon-file" type="file" accept="image/*" onchange="handleThirdPartyIconChange(this)"><small class="form-help">可手动上传图标；APK 提取成功后会自动展示</small><div id="third-party-icon-preview" class="third-party-icon-preview">${app?.icon ? esc(app.icon) : '暂无图标'}</div><input type="hidden" id="third-party-icon" value="${esc(app?.icon || '')}"><small id="third-party-icon-error" class="third-party-field-error"></small></label>`; }
function handleThirdPartyIconChange(input) { const file = input.files?.[0]; if (!file) return; const preview = document.getElementById('third-party-icon-preview'); const value = document.getElementById('third-party-icon'); if (preview) preview.textContent = file.name; if (value) value.value = file.name; showThirdPartyExtractError('third-party-icon-error', ''); }
function renderSchoolPicker(selected = []) { return `<div class="form-item third-party-school-picker"><span>学校 <em>*</em></span><details class="third-party-school-dropdown"><summary>选择学校（可多选）</summary><div class="third-party-school-menu"><label class="third-party-school-check all"><input type="checkbox" id="third-party-school-all" onchange="toggleAllThirdPartySchools(this.checked)">全选</label>${THIRD_PARTY_SCHOOLS.map((school) => `<label class="third-party-school-check"><input type="checkbox" name="third-party-school" value="${esc(school)}" ${selected.includes(school) ? 'checked' : ''} onchange="syncThirdPartySchoolAll()">${esc(school)}</label>`).join('')}</div></details><small id="third-party-school-error" class="third-party-field-error"></small></div>`; }
function selectedThirdPartySchools() { return Array.from(document.querySelectorAll('input[name="third-party-school"]:checked')).map((el) => el.value); }
function toggleAllThirdPartySchools(checked) { document.querySelectorAll('input[name="third-party-school"]').forEach((el) => { el.checked = checked; }); }
function syncThirdPartySchoolAll() { const all = document.getElementById('third-party-school-all'); const items = Array.from(document.querySelectorAll('input[name="third-party-school"]')); if (all) all.checked = items.length > 0 && items.every((item) => item.checked); }

function openThirdPartyAppForm(id) {
  const app = getThirdPartyApps().find((item) => String(item.id) === String(id));
  const selectedSchools = app?.schools || [];
  const body = `<div class="form-grid"><label class="form-item"><span>应用名称 <em>*</em></span><input class="input" id="third-party-name" value="${esc(app?.name || '')}" placeholder="例如：微信"></label>${renderSchoolPicker(selectedSchools)}<label class="form-item"><span>APK 安装包 <em>*</em></span><input class="input" id="third-party-file" type="file" accept=".apk" onchange="handleThirdPartyFileChange(this)"><small class="form-help">${app?.fileName ? `当前：${esc(app.fileName)}；重新选择 APK 可更新版本` : '仅支持 APK 文件，上传后自动提取信息'}</small><small id="third-party-file-error" class="third-party-field-error"></small></label>${renderIconField(app)}${renderExtractField('应用包名（自动提取）', 'third-party-package', app?.packageName, 'third-party-package-error')}${renderExtractField('版本号（自动提取）', 'third-party-version', app?.version, 'third-party-version-error')}</div>`;
  openSimpleModal({ title: app ? '编辑第三方应用' : '上传第三方应用', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveThirdPartyApp('${app?.id || ''}')">保存并上架</button>` });
  syncThirdPartySchoolAll();
}

function saveThirdPartyApp(id) {
  const name = document.getElementById('third-party-name')?.value.trim();
  const schools = selectedThirdPartySchools();
  const file = document.getElementById('third-party-file')?.files?.[0];
  const existing = getThirdPartyApps().find((item) => String(item.id) === String(id));
  if (!name) return toast('请填写应用名称', 'warning');
  if (!schools.length) { showThirdPartyExtractError('third-party-school-error', '请选择至少一个学校'); return toast('请选择学校', 'warning'); }
  if (file && !file.name.toLowerCase().endsWith('.apk')) { showThirdPartyExtractError('third-party-file-error', '仅支持上传 APK 文件'); return toast('只能上传 APK 文件', 'warning'); }
  if (!existing && !file) { showThirdPartyExtractError('third-party-file-error', '请上传 APK 文件'); return toast('请上传 APK 文件', 'warning'); }
  const icon = document.getElementById('third-party-icon')?.value.trim() || existing?.icon || '';
  const packageName = document.getElementById('third-party-package')?.value.trim() || existing?.packageName || '';
  const version = document.getElementById('third-party-version')?.value.trim() || existing?.version || '';
  if (!icon) { showThirdPartyExtractError('third-party-icon-error', '未提取应用图标'); return toast('未提取应用图标', 'warning'); }
  if (!packageName) { showThirdPartyExtractError('third-party-package-error', '未提取应用包名'); return toast('未提取应用包名', 'warning'); }
  if (!version) { showThirdPartyExtractError('third-party-version-error', '未提取版本号'); return toast('未提取版本号', 'warning'); }
  const apps = getThirdPartyApps();
  const app = existing || { id: genId() };
  if (!existing) apps.push(app);
  const iconFile = document.getElementById('third-party-icon-file')?.files?.[0];
  Object.assign(app, { name, schools, icon, iconFileName: iconFile?.name || existing?.iconFileName || '', packageName, version, fileName: file?.name || existing.fileName, enabled: true, updatedAt: now() });
  saveData(data); closeModal(); toast('应用已保存并上架', 'success'); navigate('third-party-apps');
}

function toggleThirdPartyApp(id) { const app = getThirdPartyApps().find((item) => String(item.id) === String(id)); if (!app) return; app.enabled = !app.enabled; app.updatedAt = now(); saveData(data); toast(app.enabled ? '已上架' : '已下架', 'success'); navigate('third-party-apps'); }
/* 第三方应用拆分后的两个原型页面：应用库 / 学校应用 */
function getLibraryApps() {
  return getThirdPartyApps();
}

function getSchoolAppRelations() {
  if (!Array.isArray(data.schoolApps)) {
    data.schoolApps = [];
    getLibraryApps().forEach((app) => (app.schools || []).forEach((school) => {
      data.schoolApps.push({ id: genId(), school, appId: app.id, status: app.enabled === false ? 'disabled' : 'enabled', publishedAt: app.updatedAt || now() });
    }));
    saveData(data);
  }
  return data.schoolApps;
}

function librarySchoolCount(appId) {
  return getSchoolAppRelations().filter((relation) => relation.appId === appId).length;
}

function renderAppLibraryPage(params = {}) {
  params = params || {};
  const apps = getLibraryApps();
  const filters = { name: params.name || '', school: params.school || '', status: params.status || '', start: params.start || '', end: params.end || '' };
  const filtered = apps.filter((app) => { const date = String(app.updatedAt || '').slice(0, 10); return (!filters.name || String(app.name || '').toLowerCase().includes(filters.name.toLowerCase())) && (!filters.school || getSchoolAppRelations().some((relation) => relation.appId === app.id && relation.school === filters.school)) && (!filters.status || (filters.status === 'enabled' ? app.enabled !== false : app.enabled === false)) && (!filters.start || date >= filters.start) && (!filters.end || date <= filters.end); });
  return `<div class="page third-party-app-page"><div class="page-header"><div><h2>第三方应用</h2><p class="page-subtitle">维护应用本身。版本号和安装包只在应用库中管理。</p></div></div><div class="third-party-filters library-filters"><label><span>应用名称</span><input class="input" id="library-filter-name" value="${esc(filters.name)}" placeholder="搜索应用名称"></label><label><span>学校</span><select class="select" id="library-filter-school"><option value="">全部学校</option>${THIRD_PARTY_SCHOOLS.map((school) => `<option value="${esc(school)}" ${filters.school === school ? 'selected' : ''}>${esc(school)}</option>`).join('')}</select></label><label><span>状态</span><select class="select" id="library-filter-status"><option value="">全部状态</option><option value="enabled" ${filters.status === 'enabled' ? 'selected' : ''}>已上架</option><option value="disabled" ${filters.status === 'disabled' ? 'selected' : ''}>已下架</option></select></label><label class="third-party-date-range"><span>上传时间</span><div><input class="input" id="library-filter-start" type="date" value="${esc(filters.start)}"><b>至</b><input class="input" id="library-filter-end" type="date" value="${esc(filters.end)}"></div></label><div class="third-party-filter-actions"><button class="btn btn-primary btn-sm" onclick="applyLibraryFilters()">查询</button><button class="btn btn-sm" onclick="resetLibraryFilters()">重置</button></div></div><div class="panel"><div class="third-party-list-toolbar"><button class="btn btn-primary" onclick="openLibraryAppForm()">上传应用</button></div><div class="table-wrap"><table class="third-party-table"><thead><tr><th>序号</th><th>名称</th><th>图标</th><th>包名</th><th>版本号</th><th>安装包</th><th>关联学校</th><th>状态</th><th>上传时间</th><th>操作</th></tr></thead><tbody>${filtered.length ? filtered.map((app, index) => `<tr><td>${index + 1}</td><td><strong>${esc(app.name)}</strong></td><td><span class="third-party-app-icon">${esc(app.icon || '▦')}</span></td><td class="muted">${esc(app.packageName || '未提取')}</td><td>${esc(app.version || '未提取')}</td><td>${esc(app.fileName || '未上传')}</td><td><div class="third-party-school-tags">${getSchoolAppRelations().filter((relation) => relation.appId === app.id).map((relation) => `<span class="third-party-school-tag">${esc(relation.school)}</span>`).join('') || '—'}</div></td><td><span class="status-tag ${app.enabled === false ? 'disabled' : 'enabled'}">${app.enabled === false ? '已下架' : '已上架'}</span></td><td>${esc(app.updatedAt || '—')}</td><td><button class="btn-link" onclick="openLibraryAppForm('${app.id}')">编辑</button><button class="btn-link" onclick="openAppSchoolRelationForm('${app.id}')">关联学校</button><button class="btn-link" onclick="toggleLibraryApp('${app.id}')">${app.enabled === false ? '上架' : '下架'}</button></td></tr>`).join('') : '<tr><td colspan="10" class="empty-state">没有符合条件的应用。</td></tr>'}</tbody></table></div></div></div>`;
}
function applyLibraryFilters() { navigate('third-party-apps', { name: document.getElementById('library-filter-name')?.value.trim() || '', school: document.getElementById('library-filter-school')?.value || '', status: document.getElementById('library-filter-status')?.value || '', start: document.getElementById('library-filter-start')?.value || '', end: document.getElementById('library-filter-end')?.value || '' }); }
function resetLibraryFilters() { navigate('third-party-apps'); }
function openAppSchoolRelationForm(appId) {
  const app = getLibraryApps().find((item) => String(item.id) === String(appId));
  if (!app) return;
  const linkedSchools = getSchoolAppRelations().filter((relation) => relation.appId === app.id).map((relation) => relation.school);
  const body = `<div class="third-party-relation-help">可多选，已关联 ${linkedSchools.length} 个学校</div><div class="third-party-relation-header"><span>学校名称</span><span>操作</span></div><div class="third-party-action-school-menu">${THIRD_PARTY_SCHOOLS.map((school) => { const linked = linkedSchools.includes(school); return `<div class="third-party-school-relation-row"><span>${esc(school)}</span><button type="button" class="btn-link ${linked ? 'danger' : ''}" data-school="${esc(school)}" data-linked="${linked ? 'true' : 'false'}" onclick="toggleAppSchoolRelationButton(this)">${linked ? '取消关联' : '添加关联'}</button></div>`; }).join('')}</div>`;
  openSimpleModal({ title: '关联学校 - ' + app.name, body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveAppSchoolRelation('${app.id}')">确定</button>` });
}
function toggleAppSchoolRelationButton(button) {
  const linked = button.dataset.linked === 'true';
  button.dataset.linked = linked ? 'false' : 'true';
  button.textContent = linked ? '添加关联' : '取消关联';
  button.classList.toggle('danger', !linked);
}
function saveAppSchoolRelation(appId) {
  const selected = Array.from(document.querySelectorAll('.third-party-school-relation-row button[data-school]')).filter((button) => button.dataset.linked === 'true').map((button) => button.dataset.school);
  const relations = getSchoolAppRelations();
  data.schoolApps = relations.filter((relation) => !(relation.appId === appId && !selected.includes(relation.school)));
  selected.forEach((school) => { if (!data.schoolApps.some((relation) => relation.appId === appId && relation.school === school)) data.schoolApps.push({ id: genId(), school, appId, status: 'enabled', publishedAt: now() }); });
  saveData(data); closeModal(); toast('学校关联已更新', 'success'); navigate('third-party-apps');
}
function openLibraryAppForm(id) {
  const app = getLibraryApps().find((item) => String(item.id) === String(id));
  const body = `<div class="form-grid"><label class="form-item"><span>应用名称 <em>*</em></span><input class="input" id="third-party-name" value="${esc(app?.name || '')}" placeholder="例如：微信"></label><label class="form-item"><span>APK 安装包 <em>*</em></span><input class="input" id="third-party-file" type="file" accept=".apk" onchange="handleThirdPartyFileChange(this)"><small class="form-help">${app?.fileName ? `当前：${esc(app.fileName)}；重新选择 APK 可更新版本` : '仅支持 APK，上传后自动提取图标、包名和版本号'}</small><small id="third-party-file-error" class="third-party-field-error"></small></label>${renderIconField(app)}${renderExtractField('应用包名（自动提取）', 'third-party-package', app?.packageName, 'third-party-package-error')}${renderExtractField('版本号（自动提取）', 'third-party-version', app?.version, 'third-party-version-error')}</div>`;
  openSimpleModal({ title: app ? '编辑应用' : '上传应用', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveLibraryApp('${app?.id || ''}')">保存并上架</button>` });
}

function saveLibraryApp(id) {
  const name = document.getElementById('third-party-name')?.value.trim();
  const file = document.getElementById('third-party-file')?.files?.[0];
  const apps = getLibraryApps();
  const existing = apps.find((item) => String(item.id) === String(id));
  if (!name) return toast('请填写应用名称', 'warning');
  if (file && !file.name.toLowerCase().endsWith('.apk')) { showThirdPartyExtractError('third-party-file-error', '仅支持上传 APK 文件'); return toast('只能上传 APK 文件', 'warning'); }
  if (!existing && !file) { showThirdPartyExtractError('third-party-file-error', '请上传 APK 文件'); return toast('请上传 APK 文件', 'warning'); }
  const icon = document.getElementById('third-party-icon')?.value.trim() || existing?.icon || '';
  const packageName = document.getElementById('third-party-package')?.value.trim() || existing?.packageName || '';
  const version = document.getElementById('third-party-version')?.value.trim() || existing?.version || '';
  if (!icon) { showThirdPartyExtractError('third-party-icon-error', '未提取应用图标'); return toast('未提取应用图标', 'warning'); }
  if (!packageName) { showThirdPartyExtractError('third-party-package-error', '未提取应用包名'); return toast('未提取应用包名', 'warning'); }
  if (!version) { showThirdPartyExtractError('third-party-version-error', '未提取版本号'); return toast('未提取版本号', 'warning'); }
  const app = existing || { id: genId() };
  if (!existing) apps.push(app);
  const iconFile = document.getElementById('third-party-icon-file')?.files?.[0];
  Object.assign(app, { name, icon, iconFileName: iconFile?.name || existing?.iconFileName || '', packageName, version, fileName: file?.name || existing?.fileName || '', enabled: true, updatedAt: now() });
  saveData(data); closeModal(); toast('应用库保存成功', 'success'); navigate('app-library');
}

function toggleLibraryApp(id) {
  const app = getLibraryApps().find((item) => String(item.id) === String(id));
  if (!app) return;
  app.enabled = app.enabled === false;
  app.updatedAt = now();
  saveData(data);
  toast(app.enabled ? '应用已上架' : '应用已下架', 'success');
  navigate('app-library');
}

function renderSchoolAppsPage(params = {}) {
  params = params || {};
  const apps = getLibraryApps();
  const relations = getSchoolAppRelations();
  const filters = { school: params.school || '', schoolKeyword: params.schoolKeyword || '', app: params.app || '', start: params.start || '', end: params.end || '' };
  const groups = THIRD_PARTY_SCHOOLS.filter((school) => (!filters.school || school === filters.school) && (!filters.schoolKeyword || school.includes(filters.schoolKeyword))).map((school) => ({ school, relations: relations.filter((relation) => relation.school === school && (!filters.app || relation.appId === filters.app) && (!filters.start || String(relation.publishedAt || '').slice(0, 10) >= filters.start) && (!filters.end || String(relation.publishedAt || '').slice(0, 10) <= filters.end)) })).sort((a, b) => b.relations.length - a.relations.length);
  return `<div class="page third-party-app-page school-apps-page"><div class="page-header"><div><h2>学校应用</h2><p class="page-subtitle">版本和安装包统一使用应用库最新版本。</p></div></div><div class="third-party-filters school-app-filters"><label><span>搜索学校</span><input class="input" id="school-filter-keyword" value="${esc(filters.schoolKeyword)}" placeholder="输入学校名称"></label><label><span>学校</span><select class="select" id="school-filter-school"><option value="">全部学校</option>${THIRD_PARTY_SCHOOLS.map((school) => `<option value="${esc(school)}" ${filters.school === school ? 'selected' : ''}>${esc(school)}</option>`).join('')}</select></label><label><span>应用</span><select class="select" id="school-filter-app"><option value="">全部应用</option>${apps.map((app) => `<option value="${esc(app.id)}" ${filters.app === app.id ? 'selected' : ''}>${esc(app.name)}</option>`).join('')}</select></label><label class="third-party-date-range"><span>上架时间</span><div><input class="input" id="school-filter-start" type="date" value="${esc(filters.start)}"><b>至</b><input class="input" id="school-filter-end" type="date" value="${esc(filters.end)}"></div></label><div class="third-party-filter-actions"><button class="btn btn-primary btn-sm" onclick="applySchoolAppFilters()">查询</button><button class="btn btn-sm" onclick="resetSchoolAppFilters()">重置</button></div></div><div class="school-app-groups">${groups.map(({ school, relations: schoolRelations }) => `<section class="school-app-group"><div class="school-app-group-head"><div><strong>${esc(school)}</strong><span> · ${schoolRelations.length} 个应用</span></div><button class="btn-link school-app-add" onclick="openSchoolAppRelationForm('${esc(school)}')">[＋ 添加]</button></div><div class="school-app-chip-list">${schoolRelations.length ? schoolRelations.map((relation) => { const app = apps.find((item) => item.id === relation.appId); return `<div class="school-app-chip ${relation.status === 'disabled' ? 'is-disabled' : ''}"><div class="school-app-chip-main"><span class="third-party-app-icon">${esc(app?.icon || '▦')}</span><span>${esc(app?.name || '应用已删除')}</span></div><div class="school-app-chip-actions"><button class="btn-link danger" onclick="removeSchoolAppRelation('${relation.id}')">移除</button></div></div>`; }).join('') : '<span class="school-app-empty">暂无应用</span>'}</div></section>`).join('')}</div></div>`;
}
function applySchoolAppFilters() { navigate('school-apps', { school: document.getElementById('school-filter-school')?.value || '', schoolKeyword: document.getElementById('school-filter-keyword')?.value.trim() || '', app: document.getElementById('school-filter-app')?.value || '', start: document.getElementById('school-filter-start')?.value || '', end: document.getElementById('school-filter-end')?.value || '' }); }
function resetSchoolAppFilters() { navigate('school-apps'); }function openSchoolAppRelationForm(preselectedSchool = "") {
  const apps = getLibraryApps().filter((app) => app.enabled !== false);
  const body = `<div class="form-grid"><label class="form-item"><span>学校 <em>*</em></span><select class="select" id="school-app-school"><option value="">请选择学校</option>${THIRD_PARTY_SCHOOLS.map((school) => `<option value="${esc(school)}" ${preselectedSchool === school ? 'selected' : ''}>${esc(school)}</option>`).join('')}</select></label><div class="form-item third-party-school-picker"><span>应用（可多选） <em>*</em></span><div class="third-party-school-menu third-party-app-picker">${apps.map((app) => `<label class="third-party-school-check"><input type="checkbox" name="school-app-choice" value="${esc(app.id)}">${esc(app.name)}</label>`).join('')}</div><small id="school-app-error" class="third-party-field-error"></small></div></div>`;
  openSimpleModal({ title: '添加学校应用', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveSchoolAppRelations()">保存</button>` });
}

function saveSchoolAppRelations() {
  const school = document.getElementById('school-app-school')?.value;
  const appIds = Array.from(document.querySelectorAll('input[name="school-app-choice"]:checked')).map((input) => input.value);
  if (!school) return toast('请选择学校', 'warning');
  if (!appIds.length) return toast('请选择至少一个应用', 'warning');
  const relations = getSchoolAppRelations();
  appIds.forEach((appId) => { const existing = relations.find((relation) => relation.school === school && relation.appId === appId); if (existing) { existing.status = 'enabled'; existing.publishedAt = now(); } else relations.push({ id: genId(), school, appId, status: 'enabled', publishedAt: now() }); });
  saveData(data); closeModal(); toast('学校应用关系已保存', 'success'); navigate('school-apps');
}

function toggleSchoolAppRelation(id) { const relation = getSchoolAppRelations().find((item) => String(item.id) === String(id)); if (!relation) return; relation.status = relation.status === 'enabled' ? 'disabled' : 'enabled'; relation.publishedAt = now(); saveData(data); toast(relation.status === 'enabled' ? '已上架' : '已下架', 'success'); navigate('school-apps'); }
function removeSchoolAppRelation(id) { data.schoolApps = getSchoolAppRelations().filter((relation) => String(relation.id) !== String(id)); saveData(data); toast('学校应用关系已移除', 'success'); navigate('school-apps'); }






















