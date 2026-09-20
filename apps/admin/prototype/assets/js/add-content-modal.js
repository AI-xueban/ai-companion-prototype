/* 手动选取 · 添加内容弹窗 */

let sectionManualIds = [];
let pickerTempIds = [];
let channelManualIds = [];
let channelPickerTempIds = [];
let channelLinkedTitleFilter = '';
let hotRecommendManualIds = [];
let contentPickerContext = 'section'; // 'section' | 'hot'

function getEnabledContents() {
  return data.contents.filter(c => c.status === 'enabled');
}

function getManualLinkedContents() {
  return sectionManualIds
    .map(id => data.contents.find(c => c.id === id))
    .filter(Boolean);
}

function getHotRecommendLinkedContents() {
  return hotRecommendManualIds
    .map(id => data.contents.find(c => c.id === id))
    .filter(Boolean);
}

function getChannelManualLinkedContents() {
  return channelManualIds
    .map(id => data.contents.find(c => c.id === id))
    .filter(Boolean);
}

function renderManualLinkedRows(linked, options = {}) {
  const removeFn = options.removeFn || 'removeManualLinked';
  return renderContentTableRows(linked, {
    showSort: true, showId: false, showImage: true, showVideo: true,
    showViews: true, showCtr: true, showDuration: true,
    showTags: false, showStatus: false,
    actionHtml: c => `<button class="btn-link danger" onclick="${removeFn}(${c.id})">移除</button>`,
  });
}

function renderManualLinkedPanel(linked) {
  if (!linked.length) {
    return `<div class="content-box"><span>暂无关联内容，<button class="btn-link" onclick="openAddContentModal('section')">点击添加</button></span></div>`;
  }
  return `
    <div class="content-box has-data">
      <div class="box-header">
        <button class="btn btn-primary btn-sm" style="height:28px" onclick="openAddContentModal('section')">添加内容</button>
        <div class="box-header-info">上限 ${CONTENT_LIMIT} 条，已选 <span id="manual-pick-count">${linked.length}</span> 条 &nbsp; <button class="btn-link" onclick="clearManualLinked()">清空</button></div>
      </div>
      <div class="form-hint" style="padding:8px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0">说明：拖拽调整顺序</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>排序</th><th>标题</th><th>内容</th><th>出处</th><th>配图</th><th>视频</th><th>阅读量</th><th>点击率</th><th>阅读时长</th><th>类型</th><th>频道</th><th>导入时间</th><th>操作</th></tr></thead>
          <tbody id="manual-linked-tbody">${renderManualLinkedRows(linked)}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderHotRecommendLinkedPanel(linked) {
  if (!linked.length) {
    return `<div class="content-box"><span>暂无关联内容，<button class="btn-link" onclick="openAddContentModal('hot')">点击添加</button></span></div>`;
  }
  return `
    <div class="content-box has-data">
      <div class="box-header">
        <button class="btn btn-primary btn-sm" style="height:28px" onclick="openAddContentModal('hot')">添加内容</button>
        <div class="box-header-info">上限 ${CONTENT_LIMIT} 条，已选 <span id="hot-manual-pick-count">${linked.length}</span> 条 &nbsp; <button class="btn-link" onclick="clearHotRecommendLinked()">清空</button></div>
      </div>
      <div class="form-hint" style="padding:8px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0">说明：拖拽调整轮播顺序</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>排序</th><th>标题</th><th>内容</th><th>出处</th><th>配图</th><th>视频</th><th>阅读量</th><th>点击率</th><th>阅读时长</th><th>类型</th><th>频道</th><th>导入时间</th><th>操作</th></tr></thead>
          <tbody id="hot-manual-linked-tbody">${renderManualLinkedRows(linked, { removeFn: 'removeHotRecommendLinked' })}</tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddContentModal(context = 'section') {
  contentPickerContext = context === 'hot' ? 'hot' : 'section';
  pickerTempIds = contentPickerContext === 'hot' ? [...hotRecommendManualIds] : [...sectionManualIds];
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');
  if (subtitle) subtitle.style.display = '';
  if (footer) footer.style.display = '';
  renderAddContentModal();
  document.getElementById('modal-overlay').hidden = false;
}

function closeAddContentModal() {
  closeModal();
}

function renderAddContentModal() {
  const list = getEnabledContents();
  document.getElementById('modal-title').textContent = '添加内容';
  document.getElementById('modal-subtitle').textContent = '仅显示已启用内容';
  document.getElementById('modal-body').innerHTML = `
    <div class="filter-form">
      <div class="filter-item"><label>标题</label><input class="input" placeholder="请输入"></div>
      <div class="filter-item"><label>频道</label><select class="select"><option>全部</option>${data.channels.map(c => `<option>${esc(c.name)}</option>`).join('')}</select></div>
      <div class="filter-item"><label>类型</label><select class="select"><option>全部</option><option>图文</option><option>视频</option></select></div>
      <div class="filter-item"><label>导入时间</label><div class="date-range"><input class="input" placeholder="请选择时间"><span>至</span><input class="input" placeholder="请选择时间"></div></div>
      <div class="filter-actions"><button class="btn">重置</button><button class="btn btn-primary">搜索</button></div>
    </div>
    <div class="modal-pick-info">上限 <strong>${CONTENT_LIMIT}</strong> 条，已选 <strong id="picker-count">${pickerTempIds.length}</strong> 条</div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>ID</th><th>标题</th><th>内容</th><th>出处</th><th>配图</th><th>视频</th>
          <th>阅读量</th><th>点击率</th><th>阅读时长</th><th>类型</th><th>频道</th><th>导入时间</th><th>操作</th>
        </tr></thead>
        <tbody>${renderPickerTableRows(list)}</tbody>
      </table>
    </div>
    ${renderPagination(3)}
  `;
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn" onclick="closeAddContentModal()">取消</button>
    <button class="btn btn-primary" onclick="confirmAddContentModal()">确定</button>
  `;
}

function renderPickerTableRows(items, options = {}) {
  const hideChannel = options.hideChannel;
  const pickedIds = hideChannel ? channelPickerTempIds : pickerTempIds;
  const toggleFn = hideChannel ? 'toggleChannelPickContent' : 'togglePickContent';
  return items.map(c => {
    const picked = pickedIds.includes(c.id);
    return `
      <tr>
        <td>${c.id}</td>
        <td><span class="link">${esc(c.title)}</span></td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.content)}</td>
        <td>${esc(c.source)}</td>
        <td>${c.hasImage ? '<div class="thumb-icon">🖼</div>' : '—'}</td>
        <td>${c.hasVideo ? '<div class="video-thumb">0:00</div>' : '—'}</td>
        <td>${c.views}</td>
        <td>${c.ctr}</td>
        <td>${c.duration}</td>
        <td>${esc(c.type)}</td>
        ${hideChannel ? '' : `<td>${esc(c.channel)}</td>`}
        <td>${c.importTime}</td>
        <td><button class="btn-link" onclick="${toggleFn}(${c.id})">${picked ? '取消添加' : '添加'}</button></td>
      </tr>
    `;
  }).join('');
}

function togglePickContent(id) {
  const idx = pickerTempIds.indexOf(id);
  if (idx >= 0) {
    pickerTempIds.splice(idx, 1);
  } else {
    if (pickerTempIds.length >= CONTENT_LIMIT) {
      toast(`最多选择 ${CONTENT_LIMIT} 条内容`, 'warning');
      return;
    }
    pickerTempIds.push(id);
  }
  renderAddContentModal();
}

function confirmAddContentModal() {
  if (contentPickerContext === 'hot') {
    hotRecommendManualIds = [...pickerTempIds];
    closeAddContentModal();
    refreshHotRecommendLinkedTable();
    toast(`已选择 ${hotRecommendManualIds.length} 条内容`);
    return;
  }
  sectionManualIds = [...pickerTempIds];
  closeAddContentModal();
  refreshManualLinkedTable();
  toast(`已选择 ${sectionManualIds.length} 条内容`);
}

function refreshManualLinkedTable() {
  const panel = document.getElementById('manual-linked-panel');
  const linked = getManualLinkedContents();
  if (panel) {
    panel.innerHTML = renderManualLinkedPanel(linked);
  }
  if (typeof refreshLayoutSelectors === 'function') refreshLayoutSelectors();
}

function refreshHotRecommendLinkedTable() {
  const panel = document.getElementById('hot-manual-linked-panel');
  if (panel) {
    panel.innerHTML = renderHotRecommendLinkedPanel(getHotRecommendLinkedContents());
  }
}

function removeManualLinked(id) {
  sectionManualIds = sectionManualIds.filter(x => x !== id);
  refreshManualLinkedTable();
  toast('已移除');
}

function clearManualLinked() {
  sectionManualIds = [];
  refreshManualLinkedTable();
  toast('已清空关联内容');
}

function removeHotRecommendLinked(id) {
  hotRecommendManualIds = hotRecommendManualIds.filter(x => x !== id);
  refreshHotRecommendLinkedTable();
  toast('已移除');
}

function clearHotRecommendLinked() {
  hotRecommendManualIds = [];
  refreshHotRecommendLinkedTable();
  toast('已清空关联内容');
}

function filterChannelLinkedByTitle(linked, keyword) {
  const key = (keyword || '').trim().toLowerCase();
  if (!key) return linked;
  return linked.filter(c => (c.title || '').toLowerCase().includes(key));
}

function applyChannelLinkedSearch() {
  channelLinkedTitleFilter = document.getElementById('channel-linked-title-search')?.value || '';
  refreshChannelLinkedTable();
}

function resetChannelLinkedSearch() {
  channelLinkedTitleFilter = '';
  refreshChannelLinkedTable();
}

function renderChannelLinkedRows(linked) {
  if (!linked.length) {
    return '<tr><td colspan="12" style="text-align:center;color:var(--text-muted);padding:24px">暂无匹配内容</td></tr>';
  }
  return renderContentTableRows(linked, {
    showSort: true, showId: false, showImage: true, showVideo: true,
    showViews: true, showCtr: true, showDuration: true,
    showChannel: false, showTags: false, showStatus: false,
    actionHtml: c => `<button class="btn-link danger" onclick="removeChannelLinked(${c.id})">移除</button>`,
  });
}

function renderChannelLinkedPanel(linked) {
  if (!linked.length) {
    channelLinkedTitleFilter = '';
    return `<div class="content-box"><span>暂无关联内容，<button class="btn-link" onclick="openChannelAddContentModal()">点击添加</button></span></div>`;
  }
  const filtered = filterChannelLinkedByTitle(linked, channelLinkedTitleFilter);
  return `
    <div class="content-box has-data">
      <div class="box-header">
        <button class="btn btn-primary btn-sm" style="height:28px" onclick="openChannelAddContentModal()">添加内容</button>
        <div class="box-header-info">已选 <span id="channel-pick-count">${linked.length}</span> 条 &nbsp; <button class="btn-link" onclick="clearChannelLinked()">清空</button></div>
      </div>
      <div class="channel-linked-search">
        <label class="channel-linked-search-label">标题</label>
        <input class="input channel-linked-search-input" id="channel-linked-title-search" placeholder="请输入标题关键词" value="${esc(channelLinkedTitleFilter)}">
        <button type="button" class="btn btn-primary btn-sm" onclick="applyChannelLinkedSearch()">搜索</button>
        <button type="button" class="btn btn-sm" onclick="resetChannelLinkedSearch()">重置</button>
      </div>
      <div class="form-hint" style="padding:8px 16px;background:#fafafa;border-bottom:1px solid #f0f0f0">说明：拖拽调整顺序${channelLinkedTitleFilter.trim() ? ` · 当前筛选显示 ${filtered.length} / ${linked.length} 条` : ''}</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>排序</th><th>标题</th><th>内容</th><th>出处</th><th>配图</th><th>视频</th><th>阅读量</th><th>点击率</th><th>阅读时长</th><th>类型</th><th>导入时间</th><th>操作</th></tr></thead>
          <tbody id="channel-linked-tbody">${renderChannelLinkedRows(filtered)}</tbody>
        </table>
      </div>
      ${renderPagination(1)}
    </div>
  `;
}

function openChannelAddContentModal() {
  const typeLabel = getChannelPickerTypeLabel();
  channelPickerTempIds = channelManualIds.filter(id => {
    const c = data.contents.find(x => x.id === id);
    return c && c.type === typeLabel;
  });
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');
  if (subtitle) subtitle.style.display = '';
  if (footer) footer.style.display = '';
  renderChannelAddContentModal();
  document.getElementById('modal-overlay').hidden = false;
}

function closeChannelAddContentModal() {
  closeModal();
}

function getChannelPickerTypeLabel() {
  return typeof isChannelVideoType === 'function' && isChannelVideoType() ? '视频' : '图文';
}

function getChannelPickerList() {
  const typeLabel = getChannelPickerTypeLabel();
  return getEnabledContents().filter(c => c.type === typeLabel);
}

function renderChannelPickerTableRows(items) {
  return items.map((c, i) => {
    const checked = channelPickerTempIds.includes(c.id);
    return `
      <tr>
        <td><input type="checkbox" class="channel-picker-checkbox" data-id="${c.id}" ${checked ? 'checked' : ''} onchange="toggleChannelPickerCheckbox(${c.id}, this.checked)"></td>
        <td>${i + 1}</td>
        <td><span class="link">${esc(c.title)}</span></td>
        <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.content)}</td>
        <td>${esc(c.source)}</td>
        <td>${c.hasImage ? '<div class="thumb-icon">🖼</div>' : '—'}</td>
        <td>${c.hasVideo ? '<div class="video-thumb">0:00</div>' : '—'}</td>
        <td>${c.views}</td>
        <td>${c.ctr}</td>
        <td>${c.duration}</td>
        <td>${esc(c.type)}</td>
        <td>${c.importTime}</td>
      </tr>
    `;
  }).join('');
}

function toggleChannelPickerCheckbox(id, checked) {
  if (checked) {
    if (!channelPickerTempIds.includes(id)) channelPickerTempIds.push(id);
  } else {
    channelPickerTempIds = channelPickerTempIds.filter(x => x !== id);
  }
  const countEl = document.getElementById('channel-picker-count');
  if (countEl) countEl.textContent = channelPickerTempIds.length;
  syncChannelPickerSelectAllState();
}

function toggleChannelPickerSelectAll(checked) {
  const list = getChannelPickerList();
  const visibleIds = list.map(c => c.id);
  if (checked) {
    visibleIds.forEach(id => {
      if (!channelPickerTempIds.includes(id)) channelPickerTempIds.push(id);
    });
  } else {
    channelPickerTempIds = channelPickerTempIds.filter(id => !visibleIds.includes(id));
  }
  renderChannelAddContentModal();
}

function syncChannelPickerSelectAllState() {
  const all = document.querySelectorAll('.channel-picker-checkbox');
  const checked = document.querySelectorAll('.channel-picker-checkbox:checked');
  const master = document.getElementById('channel-picker-select-all');
  if (!master || !all.length) return;
  master.checked = checked.length === all.length;
  master.indeterminate = checked.length > 0 && checked.length < all.length;
}

function renderChannelAddContentModal() {
  const typeLabel = getChannelPickerTypeLabel();
  const list = getChannelPickerList();
  document.getElementById('modal-title').textContent = '添加内容';
  document.getElementById('modal-subtitle').textContent = `仅显示已启用的${typeLabel}内容`;
  document.getElementById('modal-body').innerHTML = `
    <div class="filter-form">
      <div class="filter-item"><label>标题</label><input class="input" placeholder="请输入"></div>
      <div class="filter-item"><label>导入时间</label><div class="date-range"><input class="input" placeholder="请选择时间"><span>至</span><input class="input" placeholder="请选择时间"></div></div>
      <div class="filter-actions"><button class="btn">重置</button><button class="btn btn-primary">搜索</button></div>
    </div>
    <div class="modal-pick-info">已选 <strong id="channel-picker-count">${channelPickerTempIds.length}</strong> 条</div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th><input type="checkbox" id="channel-picker-select-all" onchange="toggleChannelPickerSelectAll(this.checked)"></th>
          <th>序号</th><th>标题</th><th>内容</th><th>出处</th><th>配图</th><th>视频</th>
          <th>阅读量</th><th>点击率</th><th>阅读时长</th><th>类型</th><th>导入时间</th>
        </tr></thead>
        <tbody>${renderChannelPickerTableRows(list)}</tbody>
      </table>
    </div>
    ${renderPagination(3)}
  `;
  document.getElementById('modal-footer').innerHTML = `
    <button class="btn" onclick="closeChannelAddContentModal()">取消</button>
    <button class="btn btn-primary" onclick="confirmChannelAddContentModal()">确定</button>
  `;
  syncChannelPickerSelectAllState();
}

function confirmChannelAddContentModal() {
  channelManualIds = [...channelPickerTempIds];
  closeChannelAddContentModal();
  refreshChannelLinkedTable();
  toast(`已选择 ${channelManualIds.length} 条内容`);
}

function refreshChannelLinkedTable() {
  const panel = document.getElementById('channel-linked-panel');
  const linked = getChannelManualLinkedContents();
  if (panel) {
    panel.innerHTML = renderChannelLinkedPanel(linked);
  }
  if (typeof refreshChannelLayoutSelector === 'function') {
    refreshChannelLayoutSelector();
  }
}

function removeChannelLinked(id) {
  channelManualIds = channelManualIds.filter(x => x !== id);
  refreshChannelLinkedTable();
  toast('已移除');
}

function clearChannelLinked() {
  channelManualIds = [];
  channelLinkedTitleFilter = '';
  refreshChannelLinkedTable();
  toast('已清空关联内容');
}
