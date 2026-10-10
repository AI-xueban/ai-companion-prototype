function renderThirdPartyIcon(icon, fallback = '▦') { return icon && String(icon).startsWith('data:image') ? `<img src="${icon}" alt="应用图标" />` : (icon || fallback); }
const THIRD_PARTY_SCHOOLS = ['实验中学', '培英小学', '湖丰镇中学', '莲王柏中学'];
const THIRD_PARTY_STATUS = { enabled: '已上架', disabled: '已下架' };

function openSimpleModal({ title, body, footer, size = 'lg' }) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-xl', 'modal-lg', 'modal-sm', 'modal-md');
  modal?.classList.add('modal-' + size);
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-subtitle').textContent = '';
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-footer').innerHTML = footer;
  overlay.hidden = false;
}

function getThirdPartyApps() {
  if (!Array.isArray(data.thirdPartyApps)) data.thirdPartyApps = [];
  const demoApps = [
    { id: 'demo-wechat', type: 'apk', name: '微信', packageName: 'com.tencent.mm', version: '8.0.50', fileName: 'wechat-8.0.50.apk', icon: '微', schools: ['实验中学', '培英小学'], enabled: true, updatedAt: '2026-09-23 10:00:00' },
    { id: 'demo-browser', type: 'apk', name: '浏览器', packageName: 'com.android.browser', version: '12.4.1', fileName: 'browser-12.4.1.apk', icon: '网', schools: ['湖丰镇中学'], enabled: true, updatedAt: '2026-09-22 16:30:00' },
    { id: 'demo-feishu', type: 'apk', name: '飞书', packageName: 'com.ss.android.lark', version: '7.2.0', fileName: 'feishu-7.2.0.apk', icon: '飞', schools: [], enabled: true, updatedAt: '2026-09-21 14:20:00' },
    { id: 'demo-dingtalk', type: 'apk', name: '钉钉', packageName: 'com.alibaba.android.rimet', version: '7.6.10', fileName: 'dingtalk-7.6.10.apk', icon: '钉', schools: [], enabled: true, updatedAt: '2026-09-20 11:15:00' },
    { id: 'demo-tencent-meeting', type: 'apk', name: '腾讯会议', packageName: 'com.tencent.wemeet.app', version: '3.29.10', fileName: 'tencent-meeting-3.29.10.apk', icon: '会', schools: [], enabled: true, updatedAt: '2026-09-19 09:40:00' },
    { id: 'demo-wps', type: 'apk', name: 'WPS Office', packageName: 'cn.wps.moffice_eng', version: '18.12.1', fileName: 'wps-office-18.12.1.apk', icon: 'W', schools: [], enabled: true, updatedAt: '2026-09-18 17:30:00' },
    { id: 'demo-youdao', type: 'apk', name: '网易有道词典', packageName: 'com.youdao.dict', version: '10.2.3', fileName: 'youdao-10.2.3.apk', icon: '词', schools: [], enabled: true, updatedAt: '2026-09-17 15:05:00' },
    { id: 'demo-cloud-class', type: 'apk', name: '云课堂', packageName: 'com.example.cloudclass', version: '2.6.0', fileName: 'cloud-class-2.6.0.apk', icon: '云', schools: [], enabled: true, updatedAt: '2026-09-16 13:25:00' },
    { id: 'demo-study-helper', type: 'web', name: '学习助手', launchUrl: 'https://example.com/study-helper', icon: '学', schools: [], enabled: true, updatedAt: '2026-09-15 10:10:00' },
    { id: 'demo-smart-education', type: 'web', name: '国家智慧教育平台', launchUrl: 'https://www.smartedu.cn/', icon: '智', schools: [], enabled: true, updatedAt: '2026-09-14 16:45:00' },
    { id: 'demo-code-lab', type: 'web', name: '编程实验室', launchUrl: 'https://example.com/code-lab', icon: '码', schools: [], enabled: true, updatedAt: '2026-09-13 14:00:00' },
    { id: 'demo-library', type: 'web', name: '电子图书馆', launchUrl: 'https://example.com/library', icon: '书', schools: [], enabled: true, updatedAt: '2026-09-12 09:30:00' },
  ];
  let changed = false;
  for (const demoApp of demoApps) {
    if (data.thirdPartyApps.length >= 12) break;
    if (!data.thirdPartyApps.some((app) => app.id === demoApp.id)) {
      data.thirdPartyApps.push(demoApp);
      changed = true;
    }
  }
  data.thirdPartyApps.forEach((app) => {
    if (!Array.isArray(app.schools)) app.schools = [];
    if (!app.type) app.type = app.launchUrl ? 'web' : 'apk';
  });
  if (changed) saveData(data);
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
    <div class="panel"><div class="third-party-list-toolbar"><button class="btn btn-primary" onclick="openLibraryAppForm()">上传应用</button></div><div class="table-wrap"><table class="third-party-table"><thead><tr><th>排序</th><th>应用</th><th>学校</th><th>包名</th><th>版本号</th><th>安装包</th><th>Web 地址</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${filtered.length ? filtered.map((app, i) => `<tr><td>${i + 1}</td><td><div class="third-party-app-name"><span class="third-party-app-icon">${app.icon || '▦'}</span><strong>${esc(app.name)}</strong></div></td><td><div class="third-party-school-tags">${thirdPartySchoolTags(app.schools)}</div></td><td class="muted">${esc(app.packageName || '未提取')}</td><td>${esc(app.version || '未提取')}</td><td>${esc(app.fileName || '未上传')}</td><td>${app.enabled ? '<span class="status-tag enabled">已上架</span>' : '<span class="status-tag disabled">已下架</span>'}</td><td>${esc(app.updatedAt || '—')}</td><td><button class="btn-link" onclick="openThirdPartyAppForm('${app.id}')">编辑</button><button class="btn-link" onclick="toggleThirdPartyApp('${app.id}')">${app.enabled ? '下架' : '上架'}</button></td></tr>`).join('') : '<tr><td colspan="9" class="empty-state">没有符合条件的应用。</td></tr>'}</tbody></table></div></div>
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

function renderExtractField(label, id, value, errorId) { return `<label class="form-item third-party-apk-only"><span>${label}</span><input class="input" id="${id}" value="${esc(value || '')}" readonly><small id="${errorId}" class="third-party-field-error"></small></label>`; }
function renderIconField(app) { return `<label class="form-item"><span>应用图标</span><input class="input" id="third-party-icon-file" type="file" accept="image/*" onchange="handleThirdPartyIconChange(this)"><small class="form-help">可手动上传图标；APK 提取成功后会自动展示</small><div id="third-party-icon-preview" class="third-party-icon-preview">${app?.icon?.startsWith('data:image') ? `<img src="${app.icon}" alt="应用图标" />` : (app?.icon ? esc(app.icon) : '暂无图标')}</div><input type="hidden" id="third-party-icon" value="${esc(app?.icon || '')}"><small id="third-party-icon-error" class="third-party-field-error"></small></label>`; }
function handleThirdPartyIconChange(input) { const file = input.files?.[0]; if (!file) return; const preview = document.getElementById('third-party-icon-preview'); const value = document.getElementById('third-party-icon'); const reader = new FileReader(); reader.onload = () => { const dataUrl = String(reader.result || ''); if (preview) preview.innerHTML = `<img src=\"${dataUrl}\" alt=\"应用图标\" />`; if (value) value.value = dataUrl; }; reader.readAsDataURL(file); showThirdPartyExtractError('third-party-icon-error', ''); }
function renderSchoolPicker(selected = []) { return `<div class="form-item third-party-school-picker"><span>学校 <em>*</em></span><details class="third-party-school-dropdown"><summary>选择学校（可多选）</summary><div class="third-party-school-menu"><label class="third-party-school-check all"><input type="checkbox" id="third-party-school-all" onchange="toggleAllThirdPartySchools(this.checked)">全选</label>${THIRD_PARTY_SCHOOLS.map((school) => `<label class="third-party-school-check"><input type="checkbox" name="third-party-school" value="${esc(school)}" ${selected.includes(school) ? 'checked' : ''} onchange="syncThirdPartySchoolAll()">${esc(school)}</label>`).join('')}</div></details><small id="third-party-school-error" class="third-party-field-error"></small></div>`; }
function selectedThirdPartySchools() { return Array.from(document.querySelectorAll('input[name="third-party-school"]:checked')).map((el) => el.value); }
function toggleAllThirdPartySchools(checked) { document.querySelectorAll('input[name="third-party-school"]').forEach((el) => { el.checked = checked; }); }
function syncThirdPartySchoolAll() { const all = document.getElementById('third-party-school-all'); const items = Array.from(document.querySelectorAll('input[name="third-party-school"]')); if (all) all.checked = items.length > 0 && items.every((item) => item.checked); }

function openThirdPartyAppForm(id) {
  const app = getThirdPartyApps().find((item) => String(item.id) === String(id));
  const selectedSchools = app?.schools || [];
  const body = `<div class="form-grid third-party-app-form-grid"><label class="form-item"><span>应用类型 <em>*</em></span><div class="third-party-type-options"><label><input type="radio" name="third-party-type" value="apk" ${currentType === 'apk' ? 'checked' : ''} ${typeLocked} onchange="toggleThirdPartyTypeFields()"> APK</label><label><input type="radio" name="third-party-type" value="web" ${currentType === 'web' ? 'checked' : ''} ${typeLocked} onchange="toggleThirdPartyTypeFields()"> Web</label></div></label><label class="form-item third-party-web-only" style="display:none"><span>Web 地址</span><input class="input" id="third-party-url" value="${esc(app?.launchUrl || '')}" placeholder="https://example.com"></label><label class="form-item"><span>应用名称 <em>*</em></span><input class="input" id="third-party-name" value="${esc(app?.name || '')}" placeholder="例如：微信"></label>${renderSchoolPicker(selectedSchools)}<label class="form-item third-party-apk-only"><span>APK 安装包 <em>*</em></span><input class="input" id="third-party-file" type="file" accept=".apk" onchange="handleThirdPartyFileChange(this)"><small class="form-help">${app?.fileName ? `当前：${esc(app.fileName)}；重新选择 APK 可更新版本` : '仅支持 APK 文件，上传后自动提取信息'}</small><small id="third-party-file-error" class="third-party-field-error"></small></label>${renderIconField(app)}${renderExtractField('应用包名（自动提取）', 'third-party-package', app?.packageName, 'third-party-package-error')}${renderExtractField('版本号（自动提取）', 'third-party-version', app?.version, 'third-party-version-error')}</div>`;
  openSimpleModal({ title: app ? '编辑第三方应用' : '上传第三方应用', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveThirdPartyApp('${app?.id || ''}')">保存并上架</button>` });
  syncThirdPartySchoolAll();
}

function saveThirdPartyApp(id) {
  const type = document.querySelector("input[name=third-party-type]:checked")?.value || "apk";
  const name = document.getElementById('third-party-name')?.value.trim();
  const schools = selectedThirdPartySchools();
  const file = document.getElementById('third-party-file')?.files?.[0];
  const existing = getThirdPartyApps().find((item) => String(item.id) === String(id));
  if (!name) return toast('请填写应用名称', 'warning');
  if (!schools.length) { showThirdPartyExtractError('third-party-school-error', '请选择至少一个学校'); return toast('请选择学校', 'warning'); }
  if (type === "apk" && file && !file.name.toLowerCase().endsWith('.apk')) { showThirdPartyExtractError('third-party-file-error', '仅支持上传 APK 文件'); return toast('只能上传 APK 文件', 'warning'); }
  if (type === "apk" && !existing && !file) { showThirdPartyExtractError('third-party-file-error', '请上传 APK 文件'); return toast('请上传 APK 文件', 'warning'); }
  const icon = document.getElementById('third-party-icon')?.value.trim() || existing?.icon || '';
  const packageName = document.getElementById('third-party-package')?.value.trim() || existing?.packageName || '';
  const version = document.getElementById('third-party-version')?.value.trim() || existing?.version || '';
  const launchUrl = document.getElementById("third-party-url")?.value.trim() || existing?.launchUrl || "";
  if (type === "web" && !launchUrl) return toast("请填写 Web 地址", "warning");
  if (type === "apk" && !icon) { showThirdPartyExtractError('third-party-icon-error', '未提取应用图标'); return toast('未提取应用图标', 'warning'); }
  if (type === "apk" && !packageName) { showThirdPartyExtractError('third-party-package-error', '未提取应用包名'); return toast('未提取应用包名', 'warning'); }
  if (type === "apk" && !version) { showThirdPartyExtractError('third-party-version-error', '未提取版本号'); return toast('未提取版本号', 'warning'); }
  const apps = getThirdPartyApps();
  const previousResource = existing ? (existing.type === 'web' ? (existing.launchUrl || '') : (existing.fileName || '')) : '';
  const app = existing || { id: genId() };
  if (!existing) apps.push(app);
  const iconFile = document.getElementById('third-party-icon-file')?.files?.[0];
  Object.assign(app, { name, schools, icon, iconFileName: iconFile?.name || existing?.iconFileName || '', packageName, version, fileName: file?.name || existing.fileName, enabled: true, updatedAt: now() });
  saveData(data); closeModal(); toast('应用已保存并上架', 'success'); navigate('third-party-apps');
}

function toggleThirdPartyApp(id) { const app = getThirdPartyApps().find((item) => String(item.id) === String(id)); if (!app) return; app.enabled = !app.enabled; app.updatedAt = now(); saveData(data); toast(app.enabled ? '已上架' : '已下架', 'success'); navigate('third-party-apps'); }
/* 应用运营拆分后的两个原型页面：应用库 / 关联学校 */
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

function renderThirdPartyPagination(total, page, pageSize, pageHandler, sizeHandler) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return `<div class="pagination pagination--with-size"><span class="page-btn ${page === 1 ? 'disabled' : ''}" onclick="${page === 1 ? '' : `${pageHandler}(${page - 1})`}">‹</span>${pages.map((item) => `<span class="page-btn ${item === page ? 'active' : ''}" onclick="${pageHandler}(${item})">${item}</span>`).join('')}<span class="page-btn ${page === totalPages ? 'disabled' : ''}" onclick="${page === totalPages ? '' : `${pageHandler}(${page + 1})`}">›</span><span class="page-size-picker">每页 <select class="select page-size-select" onchange="${sizeHandler}(this.value)"><option value="10" ${pageSize === 10 ? 'selected' : ''}>10 条</option><option value="20" ${pageSize === 20 ? 'selected' : ''}>20 条</option><option value="50" ${pageSize === 50 ? 'selected' : ''}>50 条</option></select></span><span class="muted">共 ${total} 条</span></div>`;
}

function getLibraryFilterParams() {
  return {
    name: document.getElementById('library-filter-name')?.value.trim() || '',
    school: document.getElementById('library-filter-school')?.value || '',
    status: document.getElementById('library-filter-status')?.value || '',
    start: document.getElementById('library-filter-start')?.value || '',
    end: document.getElementById('library-filter-end')?.value || ''
  };
}

function renderAppLibraryPage(params = {}) {
  params = params || {};
  const apps = getLibraryApps();
  const filters = { name: params.name || '', school: params.school || '', status: params.status || '', start: params.start || '', end: params.end || '' };
  const allFiltered = apps.filter((app) => { const date = String(app.updatedAt || '').slice(0, 10); return (!filters.name || String(app.name || '').toLowerCase().includes(filters.name.toLowerCase())) && (!filters.school || getSchoolAppRelations().some((relation) => relation.appId === app.id && relation.school === filters.school)) && (!filters.status || (filters.status === 'enabled' ? app.enabled !== false : app.enabled === false)) && (!filters.start || date >= filters.start) && (!filters.end || date <= filters.end); });
  const pageSize = [10, 20, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 10;
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / pageSize));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
  const filtered = allFiltered.slice((page - 1) * pageSize, page * pageSize);
  return `<div class="page third-party-app-page"><div class="page-header"><div><h2>应用库</h2><p class="page-subtitle">维护应用本身。版本号和安装包只在应用库中管理。</p></div></div><div class="third-party-filters library-filters"><label><span>应用名称</span><input class="input" id="library-filter-name" value="${esc(filters.name)}" placeholder="搜索应用名称"></label><label><span>学校</span><select class="select" id="library-filter-school"><option value="">全部学校</option>${THIRD_PARTY_SCHOOLS.map((school) => `<option value="${esc(school)}" ${filters.school === school ? 'selected' : ''}>${esc(school)}</option>`).join('')}</select></label><label><span>状态</span><select class="select" id="library-filter-status"><option value="">全部状态</option><option value="enabled" ${filters.status === 'enabled' ? 'selected' : ''}>已上架</option><option value="disabled" ${filters.status === 'disabled' ? 'selected' : ''}>已下架</option></select></label><label class="third-party-date-range"><span>上传时间</span><div><input class="input" id="library-filter-start" type="date" value="${esc(filters.start)}"><b>至</b><input class="input" id="library-filter-end" type="date" value="${esc(filters.end)}"></div></label><div class="third-party-filter-actions"><button class="btn btn-primary btn-sm" onclick="applyLibraryFilters()">查询</button><button class="btn btn-sm" onclick="resetLibraryFilters()">重置</button></div></div><div class="panel"><div class="third-party-list-toolbar"><button class="btn btn-primary" onclick="openLibraryAppForm()">上传应用</button></div><div class="table-wrap"><table class="third-party-table"><thead><tr><th>序号</th><th>名称</th><th>图标</th><th>包名</th><th>版本号</th><th>安装包</th><th>Web 地址</th><th>状态</th><th>上传时间</th><th>操作</th></tr></thead><tbody>${filtered.length ? filtered.map((app, index) => `<tr><td>${(page - 1) * pageSize + index + 1}</td><td><strong>${esc(app.name)}</strong></td><td><span class="third-party-app-icon">${renderThirdPartyIcon(app.icon)}</span></td><td class="muted">${app.type === 'web' ? '—' : esc(app.packageName || '未提取')}</td><td>${app.type === 'web' ? '—' : esc(app.version || '未提取')}</td><td>${app.type === 'web' ? '—' : esc(app.fileName || '未上传')}</td><td class="muted third-party-web-url">${app.type === 'web' ? esc(app.launchUrl || '—') : '—'}</td><td><span class="status-tag ${app.enabled === false ? 'disabled' : 'enabled'}">${app.enabled === false ? '已下架' : '已上架'}</span></td><td>${esc(app.updatedAt || '—')}</td><td><button class="btn-link" onclick="openLibraryAppForm('${app.id}')">编辑</button><button class="btn-link" onclick="openAppVersionHistory('${app.id}')">版本历史</button><button class="btn-link" onclick="${app.enabled === false ? `toggleLibraryApp('${app.id}')` : `openLibraryAppStatusConfirm('${app.id}')`}">${app.enabled === false ? '上架' : '下架'}</button></td></tr>`).join('') : '<tr><td colspan="10" class="empty-state">没有符合条件的应用。</td></tr>'}</tbody></table></div>${renderThirdPartyPagination(allFiltered.length, page, pageSize, 'goLibraryPage', 'changeLibraryPageSize')}</div></div>`;
}
function applyLibraryFilters() { navigate('app-library', { ...getLibraryFilterParams(), page: 1, pageSize: 10 }); }
function resetLibraryFilters() { navigate('app-library'); }
function goLibraryPage(page) { const size = Number(document.querySelector('.page-size-select')?.value) || 10; navigate('app-library', { ...getLibraryFilterParams(), page, pageSize: size }); }
function changeLibraryPageSize(pageSize) { navigate('app-library', { ...getLibraryFilterParams(), page: 1, pageSize: Number(pageSize) || 10 }); }

function openAppVersionHistory(appId) {
  const app = getLibraryApps().find((item) => String(item.id) === String(appId));
  if (!app) return;
  const currentResource = app.type === 'web' ? (app.launchUrl || '—') : (app.fileName || '—');
  const history = (Array.isArray(app.versionHistory) && app.versionHistory.length ? app.versionHistory : [{ name: app.name || '—', icon: app.icon || '', packageName: app.type === 'web' ? '—' : (app.packageName || '—'), version: app.type === 'web' ? '—' : (app.version || '—'), uploadedAt: app.updatedAt || '—', resource: currentResource }])
    .slice()
    .sort((a, b) => String(b.uploadedAt || '').localeCompare(String(a.uploadedAt || '')));
  const body = `<div class="table-wrap"><table class="third-party-table version-history-table"><thead><tr><th>名称</th><th>图标</th><th>包名</th><th>版本号</th><th>上传时间</th><th>${app.type === 'web' ? 'Web 地址' : '安装包'}</th></tr></thead><tbody>${history.map((item) => `<tr><td><strong>${esc(item.name || app.name || '—')}</strong></td><td><span class="third-party-app-icon">${renderThirdPartyIcon(item.icon || app.icon)}</span></td><td class="muted">${esc(app.type === 'web' ? '—' : (item.packageName || app.packageName || '—'))}</td><td>${esc(app.type === 'web' ? '—' : (item.version || app.version || '—'))}</td><td>${esc(item.uploadedAt || '—')}</td><td class="muted">${esc(item.resource || '—')}</td></tr>`).join('')}</tbody></table></div>`;
  openSimpleModal({ size: 'xl', title: '版本历史 - ' + app.name, body, footer: '<button class="btn btn-primary" onclick="closeModal()">关闭</button>' });
}
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
  saveData(data); closeModal(); toast('学校关联已更新', 'success'); navigate('app-library');
}
function openLibraryAppForm(id) {
  const app = getLibraryApps().find((item) => String(item.id) === String(id));
  const currentType = app?.type === 'web' ? 'web' : 'apk';
  const typeLocked = app ? 'disabled' : '';
  const forceUpdateValue = app ? (app.forceUpdate ? 'force' : 'optional') : '';
  const body = `<div class="form-grid third-party-app-form-grid"><label class="form-item"><span>应用类型 <em>*</em></span><div class="third-party-type-options"><label><input type="radio" name="third-party-type" value="apk" ${currentType === 'apk' ? 'checked' : ''} ${typeLocked} onchange="toggleThirdPartyTypeFields()"> APK</label><label><input type="radio" name="third-party-type" value="web" ${currentType === 'web' ? 'checked' : ''} ${typeLocked} onchange="toggleThirdPartyTypeFields()"> Web</label></div></label><label class="form-item third-party-web-only" style="display:none"><span>Web 地址</span><input class="input" id="third-party-url" value="${esc(app?.launchUrl || '')}" placeholder="https://example.com"></label><label class="form-item"><span>应用名称 <em>*</em></span><input class="input" id="third-party-name" value="${esc(app?.name || '')}" placeholder="例如：微信"></label><label class="form-item third-party-apk-only"><span>APK 安装包 <em>*</em></span><input class="input" id="third-party-file" type="file" accept=".apk" onchange="handleThirdPartyFileChange(this)"><small class="form-help">${app?.fileName ? `当前：${esc(app.fileName)}；重新选择 APK 可更新版本` : '仅支持 APK，上传后自动提取图标、包名和版本号'}</small><small id="third-party-file-error" class="third-party-field-error"></small></label>${renderIconField(app)}${renderExtractField('应用包名（自动提取）', 'third-party-package', app?.packageName, 'third-party-package-error')}${renderExtractField('版本号（自动提取）', 'third-party-version', app?.version, 'third-party-version-error')}<div class="form-item third-party-apk-only"><span>是否强制更新 <em>*</em></span><div class="third-party-type-options"><label><input type="radio" name="third-party-force-update" value="force" ${forceUpdateValue === 'force' ? 'checked' : ''}> 强制</label><label><input type="radio" name="third-party-force-update" value="optional" ${forceUpdateValue === 'optional' ? 'checked' : ''}> 非强制</label></div><small class="form-help">强制更新时，学生必须完成更新后才能进入应用。</small></div></div>`;
  openSimpleModal({ title: app ? '编辑应用' : '上传应用', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveLibraryApp('${app?.id || ''}')">保存并上架</button>` });
  toggleThirdPartyTypeFields();
}

function toggleThirdPartyTypeFields() { const type = document.querySelector('input[name="third-party-type"]:checked')?.value || 'apk'; document.querySelectorAll('.third-party-web-only').forEach((el) => { el.style.display = type === 'web' ? 'grid' : 'none'; }); document.querySelectorAll('.third-party-apk-only').forEach((el) => { el.style.display = type === 'apk' ? 'grid' : 'none'; }); }
function saveLibraryApp(id) {
  const type = document.querySelector("input[name=third-party-type]:checked")?.value || "apk";
  const name = document.getElementById('third-party-name')?.value.trim();
  const file = document.getElementById('third-party-file')?.files?.[0];
  const apps = getLibraryApps();
  const existing = apps.find((item) => String(item.id) === String(id));
  const previousResource = existing ? (existing.type === 'web' ? (existing.launchUrl || '') : (existing.fileName || '')) : '';
  const forceUpdateValue = document.querySelector('input[name="third-party-force-update"]:checked')?.value || '';
  if (!name) return toast('请填写应用名称', 'warning');
  const launchUrl = document.getElementById('third-party-url')?.value.trim() || existing?.launchUrl || '';
  if (type === 'web' && !launchUrl) return toast('请填写 Web 地址', 'warning');
  if (type === 'apk' && file && !file.name.toLowerCase().endsWith('.apk')) return toast('只能上传 APK 文件', 'warning');
  if (type === 'apk' && !existing && !file) return toast('请上传 APK 文件', 'warning');
  if (type === 'apk' && !forceUpdateValue) return toast('请选择是否强制更新', 'warning');
  const icon = document.getElementById('third-party-icon')?.value.trim() || existing?.icon || '';
  const packageName = document.getElementById('third-party-package')?.value.trim() || existing?.packageName || '';
  const version = document.getElementById('third-party-version')?.value.trim() || existing?.version || '';
  if (!icon) return toast('请上传或提取应用图标', 'warning');
  if (type === 'apk' && !packageName) return toast('未提取应用包名', 'warning');
  if (type === 'apk' && !version) return toast('未提取版本号', 'warning');
  const app = existing || { id: genId() };
  if (!existing) apps.push(app);
  const iconFile = document.getElementById('third-party-icon-file')?.files?.[0];
  const uploadedAt = now();
  if (!Array.isArray(app.versionHistory)) app.versionHistory = existing && previousResource ? [{ name: existing.name || '—', icon: existing.icon || '', packageName: existing.packageName || '—', version: existing.version || '—', uploadedAt: existing.updatedAt || uploadedAt, resource: previousResource }] : [];
  Object.assign(app, { name, type, launchUrl, icon, iconFileName: iconFile?.name || existing?.iconFileName || '', packageName: type === 'apk' ? packageName : '', version: type === 'apk' ? version : '', fileName: type === 'apk' ? (file?.name || existing?.fileName || '') : '', forceUpdate: type === 'apk' ? forceUpdateValue === 'force' : false, enabled: true, updatedAt: uploadedAt });
  const currentResource = type === 'web' ? launchUrl : app.fileName;
  if (!existing || currentResource !== previousResource) app.versionHistory.unshift({ name: name || '—', icon: icon || '', packageName: type === 'web' ? '—' : (packageName || '—'), version: type === 'web' ? '—' : (version || '—'), uploadedAt, resource: currentResource || '—' });
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

function openLibraryAppStatusConfirm(id) {
  const app = getLibraryApps().find((item) => String(item.id) === String(id));
  if (!app || app.enabled === false) return toggleLibraryApp(id);
  const body = `<div class="confirm-message"><p>确认下架应用“<strong>${esc(app.name)}</strong>”吗？</p><small class="muted">下架后，学生端将不再展示该应用的安装或更新入口。</small></div>`;
  openSimpleModal({ size: 'md', title: '确认下架', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-danger" onclick="confirmLibraryAppOffline('${app.id}')">确认下架</button>` });
}

function confirmLibraryAppOffline(id) {
  closeModal();
  toggleLibraryApp(id);
}

function getSchoolAppFilterParams() {
  return {
    schoolKeyword: document.getElementById('school-filter-keyword')?.value.trim() || '',
    appKeyword: document.getElementById('school-filter-app-keyword')?.value.trim() || '',
    type: document.getElementById('school-filter-type')?.value || '',
    status: document.getElementById('school-filter-status')?.value || '',
    start: document.getElementById('school-filter-start')?.value || '',
    end: document.getElementById('school-filter-end')?.value || ''
  };
}

function renderSchoolAppsPage(params = {}) {
  params = params || {};
  const apps = getLibraryApps();
  const relations = getSchoolAppRelations();
  const filters = { schoolKeyword: params.schoolKeyword || '', appKeyword: params.appKeyword || '', type: params.type || '', status: params.status || '', start: params.start || '', end: params.end || '' };
  const allFiltered = relations.filter((relation) => {
    const app = apps.find((item) => item.id === relation.appId);
    const date = String(relation.publishedAt || '').slice(0, 10);
    return (!filters.schoolKeyword || relation.school.includes(filters.schoolKeyword))
      && (!filters.appKeyword || String(app?.name || '').toLowerCase().includes(filters.appKeyword.toLowerCase()))
      && (!filters.type || (app?.type === 'web' ? 'web' : 'apk') === filters.type)
      && (!filters.status || (app?.enabled === false ? 'disabled' : 'enabled') === filters.status)
      && (!filters.start || date >= filters.start)
      && (!filters.end || date <= filters.end);
  }).sort((a, b) => a.school.localeCompare(b.school) || String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
  const pageSize = [10, 20, 50].includes(Number(params.pageSize)) ? Number(params.pageSize) : 10;
  const totalPages = Math.max(1, Math.ceil(allFiltered.length / pageSize));
  const page = Math.min(Math.max(1, Number(params.page) || 1), totalPages);
  const filtered = allFiltered.slice((page - 1) * pageSize, page * pageSize);
  return `<div class="page third-party-app-page school-apps-page"><div class="page-header"><div><h2>关联管理</h2><p class="page-subtitle">一条记录对应一个学校和一个应用，版本和安装包统一在应用库维护。</p></div></div><div class="third-party-filters school-app-filters"><label><span>搜索学校</span><input class="input" id="school-filter-keyword" value="${esc(filters.schoolKeyword)}" placeholder="输入学校名称"></label><label><span>应用名称</span><input class="input" id="school-filter-app-keyword" value="${esc(filters.appKeyword)}" placeholder="输入应用名称"></label><label><span>应用类型</span><select class="select" id="school-filter-type"><option value="">全部类型</option><option value="apk" ${filters.type === 'apk' ? 'selected' : ''}>APK</option><option value="web" ${filters.type === 'web' ? 'selected' : ''}>Web</option></select></label><label><span>应用状态</span><select class="select" id="school-filter-status"><option value="">全部状态</option><option value="enabled" ${filters.status === 'enabled' ? 'selected' : ''}>已上架</option><option value="disabled" ${filters.status === 'disabled' ? 'selected' : ''}>已下架</option></select></label><label class="third-party-date-range"><span>关联时间</span><div><input class="input" id="school-filter-start" type="date" value="${esc(filters.start)}"><b>至</b><input class="input" id="school-filter-end" type="date" value="${esc(filters.end)}"></div></label><div class="third-party-filter-actions"><button class="btn btn-primary btn-sm" onclick="applySchoolAppFilters()">查询</button><button class="btn btn-sm" onclick="resetSchoolAppFilters()">重置</button></div></div><div class="panel"><div class="third-party-list-toolbar"><button class="btn btn-primary" onclick="openSchoolAppRelationForm()">添加关联</button><button class="btn btn-danger" onclick="openBatchRemoveSchoolRelations()">批量取消关联</button></div><div class="table-wrap"><table class="third-party-table school-relation-table"><thead><tr><th class="relation-app-check"><input type="checkbox" id="school-relation-select-all" onchange="toggleAllVisibleSchoolRelations(this.checked)"></th><th>序号</th><th>学校名称</th><th>关联应用</th><th>应用版本</th><th>应用类型</th><th>应用状态</th><th>关联时间</th><th>操作</th></tr></thead><tbody>${filtered.length ? filtered.map((relation, index) => { const app = apps.find((item) => item.id === relation.appId); return `<tr><td class="relation-app-check"><input type="checkbox" name="school-relation-choice" value="${esc(relation.id)}" onchange="syncVisibleSchoolRelationSelectAll()"></td><td>${(page - 1) * pageSize + index + 1}</td><td><strong>${esc(relation.school)}</strong></td><td>${esc(app?.name || '应用已删除')}</td><td>${app?.type === 'web' ? '—' : esc(app?.version || '—')}</td><td>${app?.type === 'web' ? 'Web' : 'APK'}</td><td><span class="status-tag ${app?.enabled === false ? 'disabled' : 'enabled'}">${app?.enabled === false ? '已下架' : '已上架'}</span></td><td>${esc(relation.publishedAt || '—')}</td><td><button class="btn-link danger" onclick="openRemoveSchoolAppRelationConfirm('${relation.id}')">取消关联</button></td></tr>`; }).join('') : '<tr><td colspan="9" class="empty-state">没有符合条件的关联关系。</td></tr>'}</tbody></table></div>${renderThirdPartyPagination(allFiltered.length, page, pageSize, 'goSchoolAppPage', 'changeSchoolAppPageSize')}</div></div>`;
}
function applySchoolAppFilters() { navigate('school-apps', { ...getSchoolAppFilterParams(), page: 1, pageSize: 10 }); }
function resetSchoolAppFilters() { navigate('school-apps'); }
function goSchoolAppPage(page) { const size = Number(document.querySelector('.page-size-select')?.value) || 10; navigate('school-apps', { ...getSchoolAppFilterParams(), page, pageSize: size }); }
function changeSchoolAppPageSize(pageSize) { navigate('school-apps', { ...getSchoolAppFilterParams(), page: 1, pageSize: Number(pageSize) || 10 }); }

function getUnrelatedSchoolApps(school) {
  const relatedAppIds = new Set(getSchoolAppRelations().filter((relation) => relation.school === school).map((relation) => relation.appId));
  return getLibraryApps().filter((app) => app.enabled !== false && (!school || !relatedAppIds.has(app.id)));
}

function renderUnrelatedSchoolAppRows(school) {
  if (!school) return '<tr><td colspan="4" class="empty-state">请先选择学校。</td></tr>';
  const apps = getUnrelatedSchoolApps(school);
  return apps.length
    ? apps.map((app) => `<tr><td class="relation-app-check"><input type="checkbox" name="school-app-choice" value="${esc(app.id)}" onchange="syncSchoolRelationAppSelectAll()"></td><td>${esc(app.name)}</td><td>${app.type === 'web' ? '—' : esc(app.version || '—')}</td><td>${app.type === 'web' ? 'Web' : 'APK'}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty-state">该学校已关联全部可用应用。</td></tr>';
}

function refreshSchoolRelationAvailableApps() {
  const school = document.getElementById('school-app-school')?.value || '';
  const tbody = document.getElementById('school-app-choice-body');
  if (tbody) tbody.innerHTML = renderUnrelatedSchoolAppRows(school);
  const selectAll = document.getElementById('school-app-select-all');
  if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
}

function openSchoolAppRelationForm(preselectedSchool = "") {
  const body = `<div class="form-grid third-party-app-form-grid"><label class="form-item"><span>学校 <em>*</em></span><select class="select" id="school-app-school" onchange="refreshSchoolRelationAvailableApps()"><option value="">请选择学校</option>${THIRD_PARTY_SCHOOLS.map((school) => `<option value="${esc(school)}" ${preselectedSchool === school ? 'selected' : ''}>${esc(school)}</option>`).join('')}</select></label><div class="form-item third-party-school-picker"><span>应用（可多选） <em>*</em></span><div class="table-wrap relation-app-list"><table class="third-party-table"><thead><tr><th class="relation-app-check"><label><input type="checkbox" id="school-app-select-all" onchange="toggleAllSchoolRelationApps(this.checked)"> 全选</label></th><th>应用名称</th><th>应用版本</th><th>应用类型</th></tr></thead><tbody id="school-app-choice-body">${renderUnrelatedSchoolAppRows(preselectedSchool)}</tbody></table></div><small id="school-app-error" class="third-party-field-error"></small></div></div>`;
  openSimpleModal({ size: 'xl', title: '添加关联应用', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveSchoolAppRelations()">保存</button>` });
}

function toggleAllSchoolRelationApps(checked) {
  document.querySelectorAll('input[name="school-app-choice"]').forEach((input) => { input.checked = checked; });
}
function syncSchoolRelationAppSelectAll() {
  const choices = Array.from(document.querySelectorAll('input[name="school-app-choice"]'));
  const selectAll = document.getElementById('school-app-select-all');
  if (selectAll) {
    selectAll.checked = choices.length > 0 && choices.every((input) => input.checked);
    selectAll.indeterminate = choices.some((input) => input.checked) && !selectAll.checked;
  }
}

function saveSchoolAppRelations() {
  const school = document.getElementById('school-app-school')?.value;
  const appIds = Array.from(document.querySelectorAll('input[name="school-app-choice"]:checked')).map((input) => input.value);
  if (!school) return toast('请选择学校', 'warning');
  if (!appIds.length) return toast('请选择至少一个应用', 'warning');
  const relations = getSchoolAppRelations();
  appIds.forEach((appId) => { const existing = relations.find((relation) => relation.school === school && relation.appId === appId); if (existing) { existing.status = 'enabled'; existing.publishedAt = now(); } else relations.push({ id: genId(), school, appId, status: 'enabled', publishedAt: now() }); });
  saveData(data); closeModal(); toast('学校关联已保存', 'success'); navigate('school-apps');
}

function toggleSchoolAppRelation(id) { const relation = getSchoolAppRelations().find((item) => String(item.id) === String(id)); if (!relation) return; relation.status = relation.status === 'enabled' ? 'disabled' : 'enabled'; relation.publishedAt = now(); saveData(data); toast(relation.status === 'enabled' ? '已上架' : '已下架', 'success'); navigate('school-apps'); }
function openRemoveSchoolAppRelationConfirm(id) {
  const relation = getSchoolAppRelations().find((item) => String(item.id) === String(id));
  if (!relation) return;
  const app = getLibraryApps().find((item) => item.id === relation.appId);
  const body = `<div class="confirm-message"><p>确认取消以下关联关系？</p><p><strong>${esc(relation.school)}</strong> — ${esc(app?.name || '应用已删除')}</p><small class="muted">取消后，该学校的学生端将不再展示此应用。</small></div>`;
  openSimpleModal({ size: 'md', title: '取消关联', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-danger" onclick="removeSchoolAppRelation('${relation.id}')">确认取消关联</button>` });
}
function removeSchoolAppRelation(id) { data.schoolApps = getSchoolAppRelations().filter((relation) => String(relation.id) !== String(id)); saveData(data); toast('学校关联已移除', 'success'); navigate('school-apps'); }

function toggleAllVisibleSchoolRelations(checked) {
  document.querySelectorAll('input[name="school-relation-choice"]').forEach((input) => { input.checked = checked; });
}

function syncVisibleSchoolRelationSelectAll() {
  const choices = Array.from(document.querySelectorAll('input[name="school-relation-choice"]'));
  const selectAll = document.getElementById('school-relation-select-all');
  if (selectAll) {
    selectAll.checked = choices.length > 0 && choices.every((input) => input.checked);
    selectAll.indeterminate = choices.some((input) => input.checked) && !selectAll.checked;
  }
}

function openBatchRemoveSchoolRelations() {
  const ids = Array.from(document.querySelectorAll('input[name="school-relation-choice"]:checked')).map((input) => input.value);
  if (!ids.length) return toast('请先勾选需要取消的关联记录', 'warning');
  const body = `<div class="confirm-message"><p>确认取消已选择的 <strong>${ids.length}</strong> 条关联关系吗？</p><small class="muted">取消后，对应学校的学生端将不再展示这些应用。</small></div>`;
  openSimpleModal({ size: 'md', title: '批量取消关联', body, footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-danger" onclick="removeBatchSchoolRelations('${ids.join(',')}')">确认取消关联</button>` });
}

function removeBatchSchoolRelations(idsText) {
  const selected = new Set(String(idsText || '').split(',').filter(Boolean));
  data.schoolApps = getSchoolAppRelations().filter((relation) => !selected.has(String(relation.id)));
  saveData(data);
  closeModal();
  toast(`已取消 ${selected.size} 条应用关联`, 'success');
  navigate('school-apps');
}

