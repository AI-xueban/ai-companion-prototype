/* 各页面渲染 */

function getContentLinkedSections(contentId) {
  return data.sections.filter(s => (s.linkedContentIds || []).includes(contentId));
}

function getContentAssociationLabels(content) {
  const parts = [];
  if (content.channelId) {
    const channelName = content.channel || data.channels.find(c => c.id === content.channelId)?.name;
    if (channelName) parts.push(`「${channelName}」频道`);
  }
  getContentLinkedSections(content.id).forEach(s => parts.push(`「${s.name}」板块`));
  return parts;
}

function toggleContentStatus(contentId) {
  const content = data.contents.find(c => c.id === contentId);
  if (!content) return;

  if (content.status === 'enabled') {
    const labels = getContentAssociationLabels(content);
    if (labels.length) {
      showConfirmModal({
        title: '提示',
        message: `该内容已关联到${labels.join('、')}中，取消关联后可停用`,
        confirmText: '确定',
        cancelText: '取消',
      });
      return;
    }
    content.status = 'disabled';
    saveData(data);
    toast('已停用', 'success');
    navigate('content');
    return;
  }

  content.status = 'enabled';
  saveData(data);
  toast('已启用', 'success');
  navigate('content');
}

function renderContentListActionHtml(c) {
  if (c.status === 'draft') {
    return `<button class="btn-link" onclick="openManualAddContentModal(${c.id})">编辑</button>`;
  }

  const viewBtn = `<button class="btn-link" onclick="openContentViewModal(${c.id})">查看</button>`;
  const toggleBtn = `<button class="btn-link" onclick="toggleContentStatus(${c.id})">${c.status === 'enabled' ? '停用' : '启用'}</button>`;
  const editBtn = c.status === 'enabled' && c.channelId
    ? ''
    : `<button class="btn-link" onclick="openManualAddContentModal(${c.id})">编辑</button>`;

  return `${viewBtn}${toggleBtn}${editBtn}`;
}

let contentSortState = { field: null, mode: 0 };

function parseContentCtr(ctr) {
  return parseFloat(String(ctr).replace('%', '')) || 0;
}

function parseContentDurationMinutes(duration) {
  const m = String(duration || '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 0;
}

function getSortedContents() {
  if (!contentSortState.field || contentSortState.mode === 0) {
    return data.contents;
  }
  const { field, mode } = contentSortState;
  return [...data.contents].sort((a, b) => {
    let cmp = 0;
    if (field === 'views') cmp = a.views - b.views;
    else if (field === 'ctr') cmp = parseContentCtr(a.ctr) - parseContentCtr(b.ctr);
    else if (field === 'duration') cmp = parseContentDurationMinutes(a.duration) - parseContentDurationMinutes(b.duration);
    else if (field === 'importTime') cmp = String(a.importTime).localeCompare(String(b.importTime));

    if (field === 'views' || field === 'ctr') {
      return mode === 1 ? -cmp : cmp;
    }
    if (field === 'duration') {
      return mode === 1 ? cmp : -cmp;
    }
    if (field === 'importTime') {
      return mode === 1 ? -cmp : cmp;
    }
    return 0;
  });
}

function renderContentSortIcon(field) {
  if (contentSortState.field !== field || !contentSortState.mode) {
    return '<span class="sort-icon sort-icon--idle" title="点击排序">↕</span>';
  }
  const m = contentSortState.mode;
  if (field === 'views' || field === 'ctr') {
    return m === 1
      ? '<span class="sort-icon sort-icon--active" title="从高到低，点击切换">↓</span>'
      : '<span class="sort-icon sort-icon--active" title="从低到高，点击恢复默认">↑</span>';
  }
  if (field === 'duration') {
    return m === 1
      ? '<span class="sort-icon sort-icon--active" title="从短到长，点击切换">↑</span>'
      : '<span class="sort-icon sort-icon--active" title="从长到短，点击恢复默认">↓</span>';
  }
  if (field === 'importTime') {
    return m === 1
      ? '<span class="sort-icon sort-icon--active" title="从新到旧，点击切换">↓</span>'
      : '<span class="sort-icon sort-icon--active" title="从旧到新，点击恢复默认">↑</span>';
  }
  return '<span class="sort-icon sort-icon--idle">↕</span>';
}

function renderContentSortableTh(label, field) {
  return `<th class="th-sortable" onclick="toggleContentSort('${field}')"><span class="th-sort-label">${label}</span>${renderContentSortIcon(field)}</th>`;
}

function toggleContentSort(field) {
  if (contentSortState.field === field) {
    const next = contentSortState.mode + 1;
    if (next > 2) {
      contentSortState = { field: null, mode: 0 };
    } else {
      contentSortState.mode = next;
    }
  } else {
    contentSortState = { field, mode: 1 };
  }
  navigate('content', { keepSort: true });
}

function toggleSectionStatus(sectionId) {
  const section = data.sections.find(s => s.id === sectionId);
  if (!section) return;

  if (section.status === 'enabled') {
    section.status = 'disabled';
    section.publishedAt = null;
    section.updatedAt = now();
    saveData(data);
    toast('已停用', 'success');
    navigate('home-config');
    return;
  }

  if (section.status === 'disabled') {
    section.status = 'enabled';
    section.publishedAt = now();
    section.updatedAt = now();
    saveData(data);
    toast('已启用', 'success');
    navigate('home-config');
  }
}

/** 列表展示用：仅已启用且有值时显示实际发布时间，否则 — */
function formatPublishedAt(entity) {
  if (entity?.status !== 'enabled' || !entity.publishedAt) return '—';
  return entity.publishedAt;
}

function formatSectionPublishedAt(s) {
  return formatPublishedAt(s);
}

const SECTION_DISABLE_REQ =
  'data-req-title="停用板块" data-req-body="将板块置为已停用，学生端不展示。同时清空实际发布时间（publishedAt=null），列表显示「—」。" data-req-doc="万象视界需求文档 §5.4.5 / §7.1.2"';
const SECTION_ENABLE_REQ =
  'data-req-title="启用板块" data-req-body="再次上线并显示最新实际发布时间。列表点「启用」= 当前时刻；若需定时，请编辑后「保存并发布」并选指定时间。" data-req-doc="万象视界需求文档 §5.4.5 / §7.1.2"';
const PUBLISHED_AT_REQ =
  'data-req-title="实际发布时间" data-req-body="板块/频道共用规则：仅本实体、仅已启用有值。即时/列表启用=本次上线时刻；定时=指定时刻；停用清空为 null 显示「—」；再次启用后显示最新实际发布时间。" data-req-doc="万象视界需求文档 §5.4.5 / §7.1.1 / §7.4.1"';

function renderSectionActionHtml(s) {
  if (s.fixed) {
    if (s.status === 'enabled') {
      return `<button class="btn-link" ${SECTION_DISABLE_REQ} onclick="toggleSectionStatus(${s.id})">停用</button>`;
    }
    if (s.status === 'disabled') {
      return `<button class="btn-link" ${SECTION_ENABLE_REQ} onclick="toggleSectionStatus(${s.id})">启用</button>`;
    }
    return '';
  }
  if (s.status === 'draft') {
    return `<button class="btn-link" onclick="openTab('section-edit','编辑板块',{id:${s.id}})">编辑</button><button class="btn-link danger">删除</button>`;
  }
  if (s.status === 'enabled') {
    return `<button class="btn-link" ${SECTION_DISABLE_REQ} onclick="toggleSectionStatus(${s.id})">停用</button>`;
  }
  return `<button class="btn-link" ${SECTION_ENABLE_REQ} onclick="toggleSectionStatus(${s.id})">启用</button><button class="btn-link" onclick="openTab('section-edit','编辑板块',{id:${s.id}})">编辑</button><button class="btn-link danger">删除</button>`;
}

const CHANNEL_DISABLE_REQ =
  'data-req-title="停用频道" data-req-body="将频道置为已停用，学生端不展示。同时清空实际发布时间（publishedAt=null），列表显示「—」。规则同板块 §5.4.5。" data-req-doc="万象视界需求文档 §5.4.5 / §7.4.1"';
const CHANNEL_ENABLE_REQ =
  'data-req-title="启用频道" data-req-body="再次上线并显示最新实际发布时间。列表点「启用」= 当前时刻；若需定时，请编辑后「保存并发布」并选指定时间。规则同板块 §5.4.5。" data-req-doc="万象视界需求文档 §5.4.5 / §7.4.1"';

function toggleChannelStatus(channelId) {
  const channel = data.channels.find(c => c.id === channelId);
  if (!channel) return;

  if (channel.status === 'enabled') {
    channel.status = 'disabled';
    channel.publishedAt = null;
    channel.updatedAt = now();
    saveData(data);
    toast('已停用', 'success');
    navigate('channel', { keepFilter: true });
    return;
  }

  if (channel.status === 'disabled') {
    channel.status = 'enabled';
    channel.publishedAt = now();
    channel.updatedAt = now();
    saveData(data);
    toast('已启用', 'success');
    navigate('channel', { keepFilter: true });
  }
}

function renderChannelActionHtml(c) {
  if (c.status === 'draft') {
    const editBtn = c.noEdit ? '' : `<button class="btn-link" onclick="openTab('channel-edit','频道编辑',{id:${c.id}})">编辑</button>`;
    const deleteBtn = c.fixed ? '' : '<button class="btn-link danger">删除</button>';
    return `${editBtn}${deleteBtn}`;
  }
  if (c.status === 'enabled') {
    const del = c.fixed ? '' : '<button class="btn-link danger">删除</button>';
    return `<button class="btn-link" ${CHANNEL_DISABLE_REQ} onclick="toggleChannelStatus(${c.id})">停用</button>${del}`;
  }
  const editBtn = c.noEdit ? '' : `<button class="btn-link" onclick="openTab('channel-edit','频道编辑',{id:${c.id}})">编辑</button>`;
  const deleteBtn = c.fixed ? '' : '<button class="btn-link danger">删除</button>';
  return `<button class="btn-link" ${CHANNEL_ENABLE_REQ} onclick="toggleChannelStatus(${c.id})">启用</button>${editBtn}${deleteBtn}`;
}

let homeConfigFilterState = null;

function getDefaultHomeConfigFilter() {
  return { name: '', status: '全部', source: '全部', publishedStart: '', publishedEnd: '' };
}

function readHomeConfigFilterFromForm() {
  return {
    name: (document.getElementById('home-filter-name')?.value || '').trim(),
    status: document.getElementById('home-filter-status')?.value || '全部',
    source: document.getElementById('home-filter-source')?.value || '全部',
    publishedStart: document.getElementById('home-filter-pub-start')?.value || '',
    publishedEnd: document.getElementById('home-filter-pub-end')?.value || '',
  };
}

function sectionStatusLabel(status) {
  if (status === 'enabled') return '已启用';
  if (status === 'disabled') return '已停用';
  if (status === 'draft') return '草稿中';
  return status || '';
}

function filterHomeConfigSections(sections, f) {
  const nameKw = (f.name || '').trim().toLowerCase();
  const pubStart = f.publishedStart || '';
  const pubEnd = f.publishedEnd || '';
  return sections.filter(s => {
    if (nameKw && !(s.name || '').toLowerCase().includes(nameKw)) return false;
    if (f.status && f.status !== '全部' && sectionStatusLabel(s.status) !== f.status) return false;
    if (f.source && f.source !== '全部') {
      const isAuto = (s.sourceType || '') === 'auto' || String(s.source || '').startsWith('自动');
      if (f.source === '自动' && !isAuto) return false;
      if (f.source === '手动' && isAuto) return false;
    }
    if (pubStart || pubEnd) {
      if (s.status !== 'enabled') return false;
      const ymd = (s.publishedAt || '').slice(0, 10);
      if (!ymd) return false;
      if (pubStart && ymd < pubStart) return false;
      if (pubEnd && ymd > pubEnd) return false;
    }
    return true;
  });
}

function applyHomeConfigFilter() {
  homeConfigFilterState = readHomeConfigFilterFromForm();
  navigate('home-config', { keepFilter: true });
}

function resetHomeConfigFilter() {
  homeConfigFilterState = getDefaultHomeConfigFilter();
  navigate('home-config', { keepFilter: true });
}

function renderHomeConfigPage(params) {
  if (!params?.keepFilter || homeConfigFilterState === null) {
    homeConfigFilterState = getDefaultHomeConfigFilter();
  }
  const f = homeConfigFilterState;
  const sections = filterHomeConfigSections([...data.sections], f).sort((a, b) => a.sort - b.sort);
  const statusOpts = ['全部', '已启用', '已停用', '草稿中'];
  const sourceOpts = ['全部', '自动', '手动'];
  return `
    <div class="page-card page-card--home-config">
      <div class="page-card-title">首页配置</div>
      <div class="filter-form">
        <div class="filter-item"><label>板块名称</label><input class="input" id="home-filter-name" placeholder="请输入" value="${esc(f.name)}"></div>
        <div class="filter-item"><label>状态</label><select class="select" id="home-filter-status">${statusOpts.map(o => `<option${f.status === o ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
        <div class="filter-item"><label>来源</label><select class="select" id="home-filter-source">${sourceOpts.map(o => `<option${f.source === o ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
        <div class="filter-item" ${PUBLISHED_AT_REQ}><label>实际发布时间</label><div class="date-range"><input class="input" type="date" id="home-filter-pub-start" value="${esc(f.publishedStart)}"><span>至</span><input class="input" type="date" id="home-filter-pub-end" value="${esc(f.publishedEnd)}"></div></div>
        <div class="filter-actions">
          <button type="button" class="btn" onclick="resetHomeConfigFilter()">重置</button>
          <button type="button" class="btn btn-primary" onclick="applyHomeConfigFilter()">搜索</button>
        </div>
      </div>
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="openTab('section-add','新增板块')">+ 新增板块</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th style="width:40px"></th><th>序号</th><th>板块名称</th><th>副标题</th><th>类型</th><th>来源</th><th>内容数</th><th>状态</th><th ${PUBLISHED_AT_REQ}>实际发布时间</th><th>更新时间</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${sections.length ? sections.map((s, i) => `
              <tr${s.fixed ? ' class="section-row--fixed"' : ''}>
                <td>${s.fixed ? '' : '<span class="drag-handle">⠿</span>'}</td>
                <td>${i + 1}</td>
                <td>${esc(s.name)}</td>
                <td>${esc(s.subtitle)}</td>
                <td>${esc(s.type)}</td>
                <td>${esc(s.source)}</td>
                <td>${s.contentCount}</td>
                <td>${sectionStatusTag(s.status)}</td>
                <td ${PUBLISHED_AT_REQ}>${esc(formatSectionPublishedAt(s))}</td>
                <td>${s.updatedAt}</td>
                <td>${renderSectionActionHtml(s)}</td>
              </tr>
            `).join('') : '<tr><td colspan="11" style="text-align:center;color:var(--text-muted)">暂无符合条件的板块</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/* 各页面渲染 */

let sectionFormSession = null;
let channelFormSession = null;

function renderSectionFormPage(mode, params) {
  const isEdit = mode === 'edit';
  const section = isEdit ? data.sections.find(s => s.id === +params?.id) : null;
  const sourceType = section?.sourceType || 'auto';
  const sessionKey = `${mode}-${params?.id || 'new'}`;

  if (sectionFormSession !== sessionKey) {
    sectionFormSession = sessionKey;
    if (sourceType === 'manual') {
      sectionManualIds = isEdit && section?.linkedContentIds?.length
        ? [...section.linkedContentIds]
        : [];
    } else {
      sectionManualIds = [];
    }
  }

  const displayLimit = section?.displayLimit || 1;

  const linkedContents = sourceType === 'manual'
    ? getManualLinkedContents()
    : data.contents.filter(c => c.status === 'enabled').slice(0, displayLimit);

  const imageContents = linkedContents.filter(c => c.type === '图文');
  const videoContents = linkedContents.filter(c => c.type === '视频');
  const imageCount = Math.max(imageContents.length, 1);
  const sectionName = section?.name || '';
  const sectionSub = section?.subtitle === '—' ? '' : (section?.subtitle || '');

  return `
    <div class="page-card form-page">
      <div class="page-card-title">${isEdit ? '编辑板块' : '新增板块'}</div>

      <div class="form-section">
        <div class="form-section-title">基础配置</div>
        <div class="form-row">
          <div class="form-item">
            <label class="form-label"><span class="required">*</span>板块名称</label>
            <input class="input" style="width:100%" placeholder="模块名称" value="${esc(section?.name || '')}">
          </div>
          <div class="form-item">
            <label class="form-label">副标题</label>
            <input class="input" style="width:100%" placeholder="请输入（不超过20字）" value="${esc(section?.subtitle === '—' ? '' : section?.subtitle || '')}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-item">
            <label class="form-label"><span class="required">*</span>数据来源</label>
            <div class="radio-group">
              <label class="radio-item"><input type="radio" name="sourceType" value="auto" ${sourceType === 'auto' ? 'checked' : ''} onchange="toggleSectionSource('auto')"> 自动</label>
              <label class="radio-item"><input type="radio" name="sourceType" value="manual" ${sourceType === 'manual' ? 'checked' : ''} onchange="toggleSectionSource('manual')"> 手动</label>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section" id="auto-rules" style="${sourceType === 'manual' ? 'display:none' : ''}">
        <div class="form-section-title">内容获取规则（自动）</div>
        <div class="form-row">
          <div class="form-item full">
            <div class="form-inline-field">
              <label class="form-label inline"><span class="required">*</span>展示上限</label>
              <select id="auto-display-limit" class="select" style="width:120px" onchange="updateAutoPreviewList()">
                ${Array.from({ length: CONTENT_LIMIT }, (_, i) => i + 1).map(n => `<option value="${n}" ${displayLimit === n ? 'selected' : ''}>${n}条</option>`).join('')}
              </select>
              <span class="form-hint inline">至少选择1条内容</span>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-item">
            <label class="form-label">频道</label>
            <select class="select" style="width:100%"><option>全部</option>${data.channels.filter(c => !c.parentId).map(c => `<option>${esc(c.name)}</option>`).join('')}</select>
          </div>
          <div class="form-item">
            <label class="form-label"><span class="required">*</span>排序依据</label>
            <select class="select" style="width:100%"><option selected>导入时间</option><option>阅读量</option></select>
          </div>
        </div>
        <div class="form-section-title" style="margin-top:16px">已选取的内容列表</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>排序</th><th>标题</th><th>内容</th><th>出处</th><th>配图</th><th>视频</th><th>阅读量</th><th>点击率</th><th>阅读时长</th><th>类型</th><th>频道</th><th>导入时间</th></tr></thead>
            <tbody id="auto-preview-tbody">${renderContentTableRows(linkedContents, { showSort: true, showId: false, showImage: true, showVideo: true, showViews: true, showCtr: true, showDuration: true, showTags: false, showStatus: false, showAction: false })}</tbody>
          </table>
        </div>
      </div>

      <div class="form-section" id="manual-rules" style="${sourceType === 'auto' ? 'display:none' : ''}">
        <div class="form-section-title">关联列表</div>
        <div id="manual-linked-panel">${renderManualLinkedPanel(linkedContents)}</div>
      </div>

      <div class="form-section">
        <div class="form-section-title">排版方式</div>
        <div class="form-row">
          <div class="form-item full">
            <label class="form-label">图文类型</label>
            <div id="image-layout-selector-wrap">${renderLayoutSelector('image', imageCount, null, imageContents, sectionName, sectionSub)}</div>
            <p class="form-hint" id="image-layout-hint">当前 ${imageContents.length || imageCount} 条图文内容，可选排版见上方预览</p>
            <div class="form-hint"><button class="btn-link" onclick="openTab('layout-template','图文排版模板',{type:'image'}, true)">查看全部图文排版模板 →</button></div>
          </div>
          <div class="form-item full">
            <label class="form-label">视频类型</label>
            <div id="video-layout-selector-wrap">${videoContents.length ? renderLayoutSelector('video', videoContents.length, null, videoContents, sectionName, sectionSub) : ''}</div>
            <p class="form-hint" id="video-layout-empty" style="${videoContents.length ? 'display:none' : ''}">当前无视频内容，关联视频后可选择视频排版</p>
            <p class="form-hint" id="video-layout-hint" style="${videoContents.length ? '' : 'display:none'}">当前 ${videoContents.length} 条视频内容，可选排版见上方预览</p>
            <div class="form-hint"><button class="btn-link" onclick="openTab('layout-template','视频排版模板',{type:'video'}, true)">查看全部视频排版模板 →</button></div>
          </div>
        </div>
      </div>

      <div class="form-section" id="publish-section" data-req-title="发布与更新" data-req-body="保存并发布时写入实际发布时间：即时=保存时刻；指定时间=所选定时时刻。停用后再上线同样按本次即时/定时写入最新实际发布时间（见 §5.4.5）。" data-req-doc="万象视界需求文档 §5.4.5 / §7.1.3 E">
        <div class="form-section-title">发布与更新</div>
        <div class="form-row">
          <div class="form-item" data-req-title="发布时间" data-req-body="即时发布：实际发布时间=保存时刻；指定时间发布：实际发布时间=所选定时时刻（非点保存的时刻）。" data-req-doc="万象视界需求文档 §5.4.5 / §7.1.3 E">
            <label class="form-label"><span class="required">*</span>发布时间</label>
            <div class="radio-group">
              <label class="radio-item"><input type="radio" name="pubTime" value="instant" checked onchange="togglePublishTime()"> 即时发布</label>
              <label class="radio-item"><input type="radio" name="pubTime" value="scheduled" onchange="togglePublishTime()"> 指定时间发布</label>
            </div>
            <input type="datetime-local" step="1" class="input datetime-input" id="pub-time-input" style="margin-top:8px;display:none" value="${getCurrentDateTimeLocal()}">
          </div>
          <div class="form-item" id="auto-publish-freq" style="${sourceType === 'manual' ? 'display:none' : ''}">
            <label class="form-label"><span class="required">*</span>自动更新频率</label>
            <select class="select" style="width:100%">
              <option selected>每日0点刷新</option>
              <option>每周一刷新</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn" onclick="openTab('home-config')">取消</button>
        <button class="btn btn-primary" onclick="toast('已保存为草稿','success');openTab('home-config')">保存为草稿</button>
        <button class="btn btn-primary" onclick="confirmSaveAndPublishSection()">保存并发布</button>
      </div>
    </div>
  `;
}

function getCurrentDateTimeLocal() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function togglePublishTime() {
  const scheduled = document.querySelector('input[name="pubTime"][value="scheduled"]')?.checked;
  const input = document.getElementById('pub-time-input');
  if (!input) return;
  input.style.display = scheduled ? '' : 'none';
  if (scheduled) input.value = getCurrentDateTimeLocal();
}


function toggleSectionSource(type) {
  if (type === 'manual') {
    const autoRules = document.getElementById('auto-rules');
    if (autoRules && autoRules.style.display !== 'none') {
      showConfirmModal({
        message: '是否将自动选取的内容同步到手动？',
        onConfirm: () => {
          syncAutoToManual();
          applySectionSourceUI('manual');
        },
        onCancel: () => {
          document.querySelector('input[name="sourceType"][value="auto"]').checked = true;
          document.querySelector('input[name="sourceType"][value="manual"]').checked = false;
        },
      });
      return;
    }
  }
  applySectionSourceUI(type);
}

function syncAutoToManual() {
  const limit = parseInt(document.getElementById('auto-display-limit')?.value || '1', 10);
  sectionManualIds = data.contents
    .filter(c => c.status === 'enabled')
    .slice(0, limit)
    .map(c => c.id)
    .slice(0, CONTENT_LIMIT);
  refreshManualLinkedTable();
  toast('同步成功', 'success');
}

function applySectionSourceUI(type) {
  document.getElementById('auto-rules').style.display = type === 'auto' ? '' : 'none';
  document.getElementById('manual-rules').style.display = type === 'manual' ? '' : 'none';
  const freq = document.getElementById('auto-publish-freq');
  if (freq) freq.style.display = type === 'manual' ? 'none' : '';
  refreshLayoutSelectors();
}

function confirmSaveAndPublishSection() {
  showConfirmModal({
    message: '确认保存并发布该板块？',
    hint: '学生端将自动发布新版块',
    onConfirm: () => {
      toast('保存成功，将自动发布', 'success');
      openTab('home-config');
    },
  });
}

function updateAutoPreviewList() {
  const limit = parseInt(document.getElementById('auto-display-limit')?.value || '1', 10);
  const list = data.contents.filter(c => c.status === 'enabled').slice(0, limit);
  const tbody = document.getElementById('auto-preview-tbody');
  if (tbody) {
    tbody.innerHTML = renderContentTableRows(list, {
      showSort: true, showId: false, showImage: true, showVideo: true,
      showViews: true, showCtr: true, showDuration: true,
      showTags: false, showStatus: false, showAction: false,
    });
  }
  refreshLayoutSelectors();
}

function getSelectedContentCheckboxes() {
  return Array.from(document.querySelectorAll('.content-pick-checkbox:checked'));
}

function getSelectedContentCount() {
  return getSelectedContentCheckboxes().length;
}

function syncContentSelectAllState() {
  const all = document.querySelectorAll('.content-pick-checkbox');
  const checked = document.querySelectorAll('.content-pick-checkbox:checked');
  const master = document.getElementById('content-select-all');
  if (!master || !all.length) return;
  master.checked = checked.length === all.length;
  master.indeterminate = checked.length > 0 && checked.length < all.length;
}

function toggleContentSelectAll(checked) {
  document.querySelectorAll('.content-pick-checkbox').forEach(cb => { cb.checked = checked; });
  const master = document.getElementById('content-select-all');
  if (master) master.indeterminate = false;
}

function buildBatchDeleteAssociationMessage(selectedContents) {
  const channelGroups = new Map();
  const sectionGroups = new Map();

  selectedContents.forEach(content => {
    if (content.channelId) {
      const channelName = content.channel || data.channels.find(c => c.id === content.channelId)?.name;
      if (channelName) {
        if (!channelGroups.has(channelName)) channelGroups.set(channelName, []);
        channelGroups.get(channelName).push(content.title);
      }
    }

    getContentLinkedSections(content.id).forEach(section => {
      if (!sectionGroups.has(section.name)) sectionGroups.set(section.name, []);
      sectionGroups.get(section.name).push(content.title);
    });
  });

  const htmlLines = [];
  channelGroups.forEach((titles, channelName) => {
    htmlLines.push(`<div class="confirm-association-line">‘${esc(titles.join('’、‘'))}’已关联到<a href="#" class="confirm-association-link" data-route="channel" data-target-name="${esc(channelName)}">「${esc(channelName)}」频道</a>中</div>`);
  });
  sectionGroups.forEach((titles, sectionName) => {
    htmlLines.push(`<div class="confirm-association-line">‘${esc(titles.join('’、‘'))}’已关联到<a href="#" class="confirm-association-link" data-route="home-config" data-target-name="${esc(sectionName)}">「${esc(sectionName)}」板块</a>中</div>`);
  });

  if (!htmlLines.length) return { html: '', text: '' };
  return {
    html: `${htmlLines.join('')}<div class="confirm-association-footer">取消关联后可停用</div>`,
    text: `${channelGroups.size || sectionGroups.size ? '存在关联' : ''}`,
  };
}

function confirmBatchDeleteContents() {
  const selectedIds = getSelectedContentCheckboxes().map(cb => +cb.dataset.id);
  if (selectedIds.length < 1) {
    toast('请先选择要删除的内容', 'warning');
    return;
  }

  const selectedContents = data.contents.filter(c => selectedIds.includes(c.id));
  const associationMessage = buildBatchDeleteAssociationMessage(selectedContents);

  if (associationMessage.html) {
    showConfirmModal({
      title: '提示',
      message: associationMessage.html,
      htmlMessage: true,
      confirmText: '确定',
      cancelText: '取消',
    });
    setTimeout(bindAssociationLinks, 0);
    return;
  }

  showConfirmModal({
    message: `已选${selectedIds.length}条内容，是否确认删除？`,
    confirmText: '确认删除',
    onConfirm: () => {
      const ids = new Set(selectedIds);
      data.contents = data.contents.filter(c => !ids.has(c.id));
      saveData(data);
      toast('删除成功', 'success');
      navigate('content');
    },
  });
}

function bindAssociationLinks() {
  document.querySelectorAll('.confirm-association-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const route = link.dataset.route;
      const targetName = link.dataset.targetName;
      if (route === 'channel') {
        const channel = data.channels.find(c => c.name === targetName);
        openTab('channel', '频道管理');
        if (channel) {
          setTimeout(() => {
            const rows = Array.from(document.querySelectorAll('.data-table tbody tr'));
            const match = rows.find(row => row.textContent.includes(channel.name));
            match?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            match?.classList.add('table-row-highlight');
            setTimeout(() => match?.classList.remove('table-row-highlight'), 2000);
          }, 0);
        }
      } else if (route === 'home-config') {
        const section = data.sections.find(s => s.name === targetName);
        openTab('home-config', '首页配置');
        if (section) {
          setTimeout(() => {
            const rows = Array.from(document.querySelectorAll('.data-table tbody tr'));
            const match = rows.find(row => row.textContent.includes(section.name));
            match?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            match?.classList.add('table-row-highlight');
            setTimeout(() => match?.classList.remove('table-row-highlight'), 2000);
          }, 0);
        }
      }
    });
  });
}

function renderContentPage(params) {
  if (!params?.keepSort) {
    contentSortState = { field: null, mode: 0 };
  }
  const sortedContents = getSortedContents();
  return `
    <div class="page-card">
      <div class="page-card-title">内容管理</div>
      <div class="filter-form">
        <div class="filter-item"><label>标题</label><input class="input" placeholder="请输入"></div>
        <div class="filter-item"><label>类型</label><select class="select"><option>全部</option><option>图文</option><option>视频</option></select></div>
        <div class="filter-item"><label>频道</label><select class="select"><option>全部</option>${data.channels.map(c => `<option>${esc(c.name)}</option>`).join('')}</select></div>
        <div class="filter-item"><label>状态</label><select class="select"><option>全部</option><option>已启用</option><option>已停用</option><option>草稿中</option></select></div>
        <div class="filter-item"><label>标签</label><select class="select"><option>全部</option>${data.tags.map(t => `<option>${esc(t.name)}</option>`).join('')}</select></div>
        <div class="filter-item"><label>导入时间</label><div class="date-range"><input class="input" placeholder="请选择时间"><span>至</span><input class="input" placeholder="请选择时间"></div></div>
        <div class="filter-actions"><button class="btn">重置</button><button class="btn btn-primary">查询</button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="openBatchImportModal()">批量导入</button>
          <button class="btn btn-primary" onclick="openManualAddContentModal()">手动添加内容</button>
          <button class="btn btn-primary" onclick="openBatchEditTagsModal()">批量修改标签</button>
          <button class="btn" onclick="confirmBatchDeleteContents()">批量删除</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th><input type="checkbox" id="content-select-all" onchange="toggleContentSelectAll(this.checked)"></th><th>序号</th><th>标题</th><th>封面</th><th>内容</th><th>出处</th><th>配图</th><th>视频</th>
            ${renderContentSortableTh('阅读量', 'views')}${renderContentSortableTh('点击率', 'ctr')}${renderContentSortableTh('阅读时长', 'duration')}<th>类型</th><th>频道</th><th>标签</th><th>状态</th>${renderContentSortableTh('导入时间', 'importTime')}<th>操作</th>
          </tr></thead>
          <tbody>${renderContentTableRows(sortedContents, {
            showCheckbox: true, showIndex: true, showId: false, showCover: true, showImage: true, showVideo: true, showViews: true, showCtr: true,
            showDuration: true, showTags: true, showStatus: true,
            titleHtml: c => c.status === 'draft'
              ? esc(c.title)
              : `<span class="link" onclick="openContentViewModal(${c.id})">${esc(c.title)}</span>`,
            actionHtml: c => renderContentListActionHtml(c)
          })}</tbody>
        </table>
      </div>
      ${renderPagination(3)}
    </div>
  `;
}

let channelFilterState = null;

function getDefaultChannelFilter() {
  return { name: '', status: '全部', publishedStart: '', publishedEnd: '' };
}

function readChannelFilterFromForm() {
  return {
    name: (document.getElementById('channel-filter-name')?.value || '').trim(),
    status: document.getElementById('channel-filter-status')?.value || '全部',
    publishedStart: document.getElementById('channel-filter-pub-start')?.value || '',
    publishedEnd: document.getElementById('channel-filter-pub-end')?.value || '',
  };
}

function filterChannels(channels, f) {
  const nameKw = (f.name || '').trim().toLowerCase();
  const pubStart = f.publishedStart || '';
  const pubEnd = f.publishedEnd || '';
  return channels.filter(c => {
    if (nameKw && !(c.name || '').toLowerCase().includes(nameKw)) return false;
    if (f.status && f.status !== '全部' && sectionStatusLabel(c.status || 'enabled') !== f.status) return false;
    if (pubStart || pubEnd) {
      if (c.status !== 'enabled') return false;
      const ymd = (c.publishedAt || '').slice(0, 10);
      if (!ymd) return false;
      if (pubStart && ymd < pubStart) return false;
      if (pubEnd && ymd > pubEnd) return false;
    }
    return true;
  });
}

function applyChannelFilter() {
  channelFilterState = readChannelFilterFromForm();
  navigate('channel', { keepFilter: true });
}

function resetChannelFilter() {
  channelFilterState = getDefaultChannelFilter();
  navigate('channel', { keepFilter: true });
}

function renderChannelPage(params) {
  if (!params?.keepFilter || channelFilterState === null) {
    channelFilterState = getDefaultChannelFilter();
  }
  const f = channelFilterState;
  const channels = filterChannels([...data.channels], f).sort((a, b) => a.sort - b.sort);
  const statusOpts = ['全部', '已启用', '已停用', '草稿中'];
  return `
    <div class="page-card">
      <div class="page-card-title">频道管理</div>
      <div class="filter-form">
        <div class="filter-item"><label>频道名称</label><input class="input" id="channel-filter-name" placeholder="请输入" value="${esc(f.name)}"></div>
        <div class="filter-item"><label>状态</label><select class="select" id="channel-filter-status">${statusOpts.map(o => `<option${f.status === o ? ' selected' : ''}>${o}</option>`).join('')}</select></div>
        <div class="filter-item" ${PUBLISHED_AT_REQ}><label>实际发布时间</label><div class="date-range"><input class="input" type="date" id="channel-filter-pub-start" value="${esc(f.publishedStart)}"><span>至</span><input class="input" type="date" id="channel-filter-pub-end" value="${esc(f.publishedEnd)}"></div></div>
        <div class="filter-actions"><button type="button" class="btn" onclick="resetChannelFilter()">重置</button><button type="button" class="btn btn-primary" onclick="applyChannelFilter()">查询</button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="openTab('channel-add','新增频道')">+ 新增频道</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th style="width:40px"></th><th>序号</th><th>频道名称</th><th>父级</th><th>内容数</th><th>类型</th><th>状态</th><th ${PUBLISHED_AT_REQ}>实际发布时间</th><th>更新时间</th><th>操作</th></tr></thead>
          <tbody>
            ${channels.length ? channels.map((c, i) => `
              <tr${c.fixed ? ' class="channel-row--fixed"' : ''}>
                <td>${c.fixed ? '' : '<span class="drag-handle">⠿</span>'}</td>
                <td>${i + 1}</td>
                <td>${esc(c.name)}</td>
                <td>${esc(c.parentName)}</td>
                <td>${c.contentCount}</td>
                <td>${esc(c.type)}</td>
                <td>${sectionStatusTag(c.status || 'enabled')}</td>
                <td ${PUBLISHED_AT_REQ}>${esc(formatPublishedAt(c))}</td>
                <td>${c.updatedAt}</td>
                <td>${renderChannelActionHtml(c)}</td>
              </tr>
            `).join('') : '<tr><td colspan="10" style="text-align:center;color:var(--text-muted)">暂无符合条件的频道</td></tr>'}
          </tbody>
        </table>
      </div>
      ${renderPagination(3)}
    </div>
  `;
}

function renderChannelFormPage(mode, params) {
  const isEdit = mode === 'edit';
  const channel = isEdit ? getChannelById(data.channels, params?.id) : null;
  const sessionKey = `${mode}-${params?.id || 'new'}`;

  if (channelFormSession !== sessionKey) {
    channelFormSession = sessionKey;
    if (isEdit && channel) {
      channelManualIds = data.contents
        .filter(c => c.channelId === channel.id)
        .map(c => c.id);
    } else {
      channelManualIds = [];
    }
  }

  const linkedContents = getChannelManualLinkedContents();
  const hasParentChannel = Boolean(channel?.parentId);
  const maxDisplayLimit = hasParentChannel ? Math.min(linkedContents.length, 10) : 0;
  const displayLimit = hasParentChannel && maxDisplayLimit
    ? Math.min(channel?.displayLimit || maxDisplayLimit, maxDisplayLimit)
    : linkedContents.length;
  const displayedContents = hasParentChannel ? linkedContents.slice(0, displayLimit) : linkedContents;
  const channelType = channel?.type === '视频' ? 'video' : 'image';
  const videoCount = displayedContents.filter(c => c.type === '视频').length;
  const channelName = channel?.name || '频道名称';

  return `
    <div class="page-card form-page" data-channel-id="${channel?.id || ''}">
      <div class="page-card-title">${isEdit ? '频道编辑' : '新增频道'}</div>
      <div class="form-row">
        <div class="form-item">
          <label class="form-label"><span class="required">*</span>频道名称</label>
          <input class="input" id="channel-name-input" style="width:100%" placeholder="请输入" value="${esc(channel?.name || '')}" oninput="refreshChannelLayoutSelector()">
        </div>
        <div class="form-item">
          <label class="form-label">父级频道</label>
          <select class="select" id="channel-parent-select" style="width:100%" onchange="toggleChannelParent()">
            <option value="">无</option>
            ${data.channels.filter(c => !c.parentId).map(c => `<option value="${c.id}" ${channel?.parentId === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-item full">
          <label class="form-label"><span class="required">*</span>频道图标</label>
          <div class="channel-icon-versions">
            <div class="channel-icon-version" data-req-title="频道图标 · 嫦娥版" data-req-body="必填。嫦娥版频道入口图标。规格：24×24 / 16×16 / 32×32 px 的 SVG 或 PNG，大小不超过 10 KB。" data-req-doc="万象视界需求文档 §7.4.2">
              <div class="channel-icon-version-label">·嫦娥版</div>
              <div class="upload-box">+<span>上传</span></div>
              <div class="form-hint">上传 24×24 px、16×16、32×32 px 的 SVG 或 PNG 格式图片，大小不超过 10 KB</div>
            </div>
            <div class="channel-icon-version" data-req-title="频道图标 · 小晤版" data-req-body="必填。小晤版频道入口图标，与嫦娥版分开上传。规格：24×24 / 16×16 / 32×32 px 的 SVG 或 PNG，大小不超过 10 KB。" data-req-doc="万象视界需求文档 §7.4.2">
              <div class="channel-icon-version-label">·小晤版</div>
              <div class="upload-box">+<span>上传</span></div>
              <div class="form-hint">上传 24×24 px、16×16、32×32 px 的 SVG 或 PNG 格式图片，大小不超过 10 KB</div>
            </div>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-item">
          <label class="form-label"><span class="required">*</span>内容类型</label>
          <div class="radio-group">
            <label class="radio-item"><input type="radio" name="chType" value="image" ${channelType === 'image' ? 'checked' : ''} onchange="toggleChannelContentType()"> 图文</label>
            <label class="radio-item"><input type="radio" name="chType" value="video" ${channelType === 'video' ? 'checked' : ''} onchange="toggleChannelContentType()"> 视频</label>
          </div>
        </div>
      </div>
      <div class="form-row">
        <div class="form-item">
          <label class="form-label"><span class="required">*</span>排序方式</label>
          <select class="select" style="width:100%"><option selected>导入时间</option><option>阅读量</option></select>
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">关联列表</div>
        <div id="channel-linked-panel">${renderChannelLinkedPanel(linkedContents)}</div>
      </div>

      <div class="form-section">
        <div class="form-row" id="channel-display-limit-row" style="${hasParentChannel ? '' : 'display:none'}">
          <div class="form-item">
            <label class="form-label"><span class="required">*</span>展示条数</label>
            <select class="select" id="channel-display-limit" style="width:120px" onchange="refreshChannelLayoutSelector()" ${maxDisplayLimit ? '' : 'disabled'}>
              ${maxDisplayLimit
                ? Array.from({ length: maxDisplayLimit }, (_, i) => i + 1).map(n => `<option value="${n}" ${displayLimit === n ? 'selected' : ''}>前 ${n} 条</option>`).join('')
                : '<option value="0">暂无可展示内容</option>'}
            </select>
          </div>
        </div>
        <div class="form-section-title">排版方式</div>
        <div id="channel-image-layout-wrap" style="${channelType === 'video' ? 'display:none' : ''}">
          <div id="channel-image-layout-selector-wrap">${renderChannelImageLayoutSelector(channel?.imageLayoutId, displayedContents, channelName)}</div>
          <p class="form-hint">按展示条数预览，图文可选左文右图或双列卡片</p>
        </div>
        <div id="channel-video-layout-wrap" style="${channelType === 'video' ? '' : 'display:none'}">
          <div id="channel-video-layout-selector-wrap">${renderChannelVideoLayoutSelector(channel?.videoLayoutId, displayedContents, channelName, videoCount)}</div>
          <p class="form-hint" id="channel-video-layout-hint">${getChannelVideoLayoutHint(videoCount)}</p>
        </div>
      </div>

      <div class="form-section" id="channel-publish-section" data-req-title="发布与更新" data-req-body="频道保存并发布时写入实际发布时间：即时=保存时刻；指定时间=所选定时时刻。停用后再上线同样按本次即时/定时写入最新实际发布时间（规则同板块 §5.4.5）。" data-req-doc="万象视界需求文档 §5.4.5 / §7.4.2">
        <div class="form-section-title">发布与更新</div>
        <div class="form-row">
          <div class="form-item" data-req-title="发布时间" data-req-body="即时发布：实际发布时间=保存时刻；指定时间发布：实际发布时间=所选定时时刻（非点保存的时刻）。频道与板块规则一致。" data-req-doc="万象视界需求文档 §5.4.5 / §7.4.2">
            <label class="form-label"><span class="required">*</span>发布时间</label>
            <div class="radio-group">
              <label class="radio-item"><input type="radio" name="chPubTime" value="instant" checked onchange="toggleChannelPublishTime()"> 即时发布</label>
              <label class="radio-item"><input type="radio" name="chPubTime" value="scheduled" onchange="toggleChannelPublishTime()"> 指定时间发布</label>
            </div>
            <input type="datetime-local" step="1" class="input datetime-input" id="ch-pub-time-input" style="margin-top:8px;display:none" value="${getCurrentDateTimeLocal()}">
          </div>

        </div>
      </div>

      <div class="form-footer">
        <button class="btn" onclick="openTab('channel')">取消</button>
        <button class="btn btn-primary" onclick="toast('已保存为草稿','success');openTab('channel')">保存为草稿</button>
        <button class="btn btn-primary" onclick="toast('已保存并发布','success');openTab('channel')">保存并发布</button>
      </div>
    </div>
  `;
}

function renderTagPage() {
  return `
    <div class="page-card">
      <div class="page-card-title">标签管理</div>
      <div class="filter-form">
        <div class="filter-item"><label>标签名称</label><input class="input" placeholder="请输入"></div>
        <div class="filter-item"><label>创建时间</label><div class="date-range"><input class="input" placeholder="请选择时间"><span>至</span><input class="input" placeholder="请选择时间"></div></div>
        <div class="filter-actions"><button class="btn">重置</button><button class="btn btn-primary">搜索</button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar-left"><button class="btn btn-primary" onclick="openAddTagModal()">新增标签</button></div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>序号</th><th>标签名称</th><th>关联内容数</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead>
          <tbody>
            ${data.tags.map((t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><span class="tag tag-blue">${esc(t.name)}</span></td>
                <td>${t.contentCount}</td>
                <td>${sectionStatusTag(t.status)}</td>
                <td>${t.createdAt}</td>
                <td>
                  <button class="btn-link" onclick="openEditTagModal(${t.id})">编辑</button>
                  <button class="btn-link">${t.status === 'enabled' ? '停用' : '启用'}</button>
                  <button class="btn-link danger">删除</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${renderPagination(3)}
    </div>
  `;
}

function renderDailyWordPage() {
  return `
    <div class="page-card">
      <div class="page-card-title">每日一词</div>
      <div class="filter-form">
        <div class="filter-item"><label>年级</label><select class="select"><option>全部</option>${data.dailyWords.map(d => `<option>${esc(d.grade)}</option>`).join('')}</select></div>
        <div class="filter-item"><label>最新编辑时间</label><div class="date-range"><input class="input" placeholder="请选择时间"><span>至</span><input class="input" placeholder="请选择时间"></div></div>
        <div class="filter-actions"><button class="btn">重置</button><button class="btn btn-primary">搜索</button></div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>序号</th><th>年级</th><th>单词数</th><th>最新编辑时间</th><th>操作</th></tr></thead>
          <tbody>
            ${data.dailyWords.map((d, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${esc(d.grade)}</td>
                <td><span class="link" onclick="openTab('word-edit','编辑词表',{grade:'${d.grade}'})">${d.wordCount}</span></td>
                <td>${d.updatedAt}</td>
                <td><button class="btn-link" onclick="openTab('word-edit','编辑词表',{grade:'${d.grade}'})">${d.wordCount > 0 ? '编辑' : '新增'}</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ${renderPagination(3)}
    </div>
  `;
}

function getSelectedWordCheckboxes() {
  return Array.from(document.querySelectorAll('.word-pick-checkbox:checked'));
}

function getSelectedWordCount() {
  return getSelectedWordCheckboxes().length;
}

function syncWordSelectAllState() {
  const all = document.querySelectorAll('.word-pick-checkbox');
  const checked = document.querySelectorAll('.word-pick-checkbox:checked');
  const master = document.getElementById('word-select-all');
  if (!master || !all.length) return;
  master.checked = checked.length === all.length;
  master.indeterminate = checked.length > 0 && checked.length < all.length;
}

function toggleWordSelectAll(checked) {
  document.querySelectorAll('.word-pick-checkbox').forEach(cb => { cb.checked = checked; });
  const master = document.getElementById('word-select-all');
  if (master) master.indeterminate = false;
}

function confirmBatchDeleteWords(grade) {
  const count = getSelectedWordCount();
  if (count < 1) {
    toast('请先选择要删除的单词', 'warning');
    return;
  }
  showConfirmModal({
    message: `已选${count}个单词，确认删除？`,
    confirmText: '确认删除',
    onConfirm: () => {
      const ids = new Set(getSelectedWordCheckboxes().map(cb => +cb.dataset.id));
      data.wordLists[grade] = (data.wordLists[grade] || []).filter(w => !ids.has(w.id));
      const daily = data.dailyWords.find(d => d.grade === grade);
      if (daily) daily.wordCount = data.wordLists[grade].length;
      saveData(data);
      toast('删除成功', 'success');
      navigate('word-edit', { grade });
    },
  });
}

function renderWordEditPage(params) {
  const grade = params?.grade || '一年级';
  const words = data.wordLists[grade] || [];

  return `
    <div class="page-card">
      <div class="page-card-title">编辑词表 ${esc(grade)}</div>
      <div class="filter-form">
        <div class="filter-item"><label>单词</label><input class="input" placeholder="请输入"></div>
        <div class="filter-item"><label>状态</label><select class="select"><option>请选择</option></select></div>
        <div class="filter-item"><label>最近生效时间</label><div class="date-range"><input class="input" placeholder="请选择时间"><span>至</span><input class="input" placeholder="请选择时间"></div></div>
        <div class="filter-item"><label>导入时间</label><div class="date-range"><input class="input" placeholder="请选择时间"><span>至</span><input class="input" placeholder="请选择时间"></div></div>
        <div class="filter-actions"><button class="btn">重置</button><button class="btn btn-primary">搜索</button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="openBatchImportModal()">批量导入</button>
          <button class="btn" onclick="confirmBatchDeleteWords('${String(grade).replace(/'/g, "\\'")}')">批量删除</button>
        </div>
        <div class="toolbar-right status-text">共 ${words.length} 个单词</div>
      </div>
      ${words.length ? `
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th><input type="checkbox" id="word-select-all" onchange="toggleWordSelectAll(this.checked)"></th><th>序号</th><th>单词</th><th>音标</th><th>释义</th><th>例句</th><th>例句释义</th><th>最近生效时间</th><th>导入时间</th><th>操作</th>
            </tr></thead>
            <tbody>
              ${words.map((w, i) => `
                <tr>
                  <td><input type="checkbox" class="word-pick-checkbox" data-id="${w.id}" onchange="syncWordSelectAllState()"></td>
                  <td>${i + 1}</td>
                  <td>${esc(w.word)}</td>
                  <td>${esc(w.phonetic)}</td>
                  <td>${esc(w.definition)}</td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(w.example)}</td>
                  <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(w.exampleCn)}</td>
                  <td>${w.effectiveTime}</td>
                  <td>${w.importTime}</td>
                  <td><button type="button" class="btn-link" onclick="openWordEditModal('${String(grade).replace(/'/g, "\\'")}', ${w.id})">编辑</button><button type="button" class="btn-link danger">删除</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `<div class="empty-box">暂无内容，可批量导入</div>`}
      ${renderPagination(3)}
    </div>
  `;
}

let hotRecommendFormSession = null;

function getHotRecommendAutoPreview(hr) {
  const limit = Math.min(Math.max(+(hr.displayLimit || 1), 1), CONTENT_LIMIT);
  const channelFilter = hr.channelFilter || '全部';
  const sortBy = hr.sortBy || '导入时间';
  let list = data.contents.filter(c => c.status === 'enabled');
  if (channelFilter && channelFilter !== '全部') {
    const ch = data.channels.find(c => c.name === channelFilter);
    const ids = new Set();
    if (ch) {
      ids.add(ch.id);
      data.channels.filter(c => c.parentId === ch.id).forEach(c => ids.add(c.id));
    }
    list = list.filter(c => ids.has(c.channelId));
  }
  if (sortBy === '阅读量') {
    list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
  } else {
    list = [...list].sort((a, b) => String(b.importTime || '').localeCompare(String(a.importTime || '')));
  }
  return list.slice(0, limit);
}

function readHotRecommendFromForm(base) {
  const sourceType = document.querySelector('input[name="hotSourceType"]:checked')?.value || base.sourceType || 'auto';
  const displayLimit = parseInt(document.getElementById('hot-display-limit')?.value || base.displayLimit || '3', 10);
  const channelFilter = document.getElementById('hot-channel-filter')?.value || base.channelFilter || '全部';
  const sortBy = document.getElementById('hot-sort-by')?.value || base.sortBy || '导入时间';
  const autoFreq = document.getElementById('hot-auto-freq')?.value || base.autoFreq || '每日0点刷新';
  return {
    ...base,
    sourceType,
    displayLimit: Math.min(Math.max(displayLimit, 1), CONTENT_LIMIT),
    channelFilter,
    sortBy,
    autoFreq,
    linkedContentIds: sourceType === 'manual' ? [...hotRecommendManualIds] : (base.linkedContentIds || []),
    updatedAt: now(),
  };
}

function renderHotRecommendPage() {
  if (!data.hotRecommend) data.hotRecommend = getDefaultHotRecommend();
  const hr = data.hotRecommend;
  const sessionKey = 'hot-recommend';

  if (hotRecommendFormSession !== sessionKey) {
    hotRecommendFormSession = sessionKey;
    hotRecommendManualIds = hr.sourceType === 'manual' && hr.linkedContentIds?.length
      ? [...hr.linkedContentIds]
      : [];
  }

  const sourceType = hr.sourceType || 'auto';
  const displayLimit = hr.displayLimit || 3;
  const autoPreview = getHotRecommendAutoPreview(hr);
  const manualLinked = getHotRecommendLinkedContents();
  const previewLinked = sourceType === 'manual' ? manualLinked : autoPreview;
  const topChannels = data.channels.filter(c => !c.parentId);
  const publishedLabel = formatPublishedAt(hr);

  return `
    <div class="page-card form-page">
      <div class="page-card-title">热门推荐</div>
      <p class="form-hint" style="margin:0 0 16px">配置学生端首页热门轮播内容。轮播样式固定；仅配置内容来源与选取。当前状态：${sectionStatusTag(hr.status || 'draft')} · 实际发布时间：${esc(publishedLabel)}</p>

      <div class="form-section">
        <div class="form-section-title">数据来源</div>
        <div class="form-row">
          <div class="form-item" data-req-title="数据来源" data-req-body="自动：按规则从内容池拉取；手动：运营点选关联内容（上限 5 条）。切换自动→手动时可选择是否同步当前自动结果。" data-req-doc="万象视界需求文档 §5.12 / §7.8">
            <label class="form-label"><span class="required">*</span>数据来源</label>
            <div class="radio-group">
              <label class="radio-item"><input type="radio" name="hotSourceType" value="auto" ${sourceType === 'auto' ? 'checked' : ''} onchange="toggleHotRecommendSource('auto')"> 自动</label>
              <label class="radio-item"><input type="radio" name="hotSourceType" value="manual" ${sourceType === 'manual' ? 'checked' : ''} onchange="toggleHotRecommendSource('manual')"> 手动</label>
            </div>
          </div>
        </div>
      </div>

      <div class="form-section" id="hot-auto-rules" style="${sourceType === 'manual' ? 'display:none' : ''}">
        <div class="form-section-title">内容获取规则（自动）</div>
        <div class="form-row">
          <div class="form-item full">
            <div class="form-inline-field">
              <label class="form-label inline"><span class="required">*</span>展示上限</label>
              <select id="hot-display-limit" class="select" style="width:120px" onchange="updateHotRecommendAutoPreview()">
                ${Array.from({ length: CONTENT_LIMIT }, (_, i) => i + 1).map(n => `<option value="${n}" ${displayLimit === n ? 'selected' : ''}>${n}条</option>`).join('')}
              </select>
              <span class="form-hint inline">至少选择1条内容，最多 ${CONTENT_LIMIT} 条</span>
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-item">
            <label class="form-label">频道</label>
            <select class="select" id="hot-channel-filter" style="width:100%" onchange="updateHotRecommendAutoPreview()">
              <option ${hr.channelFilter === '全部' ? 'selected' : ''}>全部</option>
              ${topChannels.map(c => `<option ${hr.channelFilter === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-item">
            <label class="form-label"><span class="required">*</span>排序依据</label>
            <select class="select" id="hot-sort-by" style="width:100%" onchange="updateHotRecommendAutoPreview()">
              <option ${hr.sortBy === '导入时间' ? 'selected' : ''}>导入时间</option>
              <option ${hr.sortBy === '阅读量' ? 'selected' : ''}>阅读量</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label"><span class="required">*</span>自动更新频率</label>
            <select class="select" id="hot-auto-freq" style="width:100%">
              <option ${hr.autoFreq === '每日0点刷新' ? 'selected' : ''}>每日0点刷新</option>
              <option ${hr.autoFreq === '每周一刷新' ? 'selected' : ''}>每周一刷新</option>
            </select>
          </div>
        </div>
        <div class="form-section-title" style="margin-top:16px">已选取的内容列表</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>排序</th><th>标题</th><th>内容</th><th>出处</th><th>配图</th><th>视频</th><th>阅读量</th><th>点击率</th><th>阅读时长</th><th>类型</th><th>频道</th><th>导入时间</th></tr></thead>
            <tbody id="hot-auto-preview-tbody">${renderContentTableRows(previewLinked, { showSort: true, showId: false, showImage: true, showVideo: true, showViews: true, showCtr: true, showDuration: true, showTags: false, showStatus: false, showAction: false })}</tbody>
          </table>
        </div>
      </div>

      <div class="form-section" id="hot-manual-rules" style="${sourceType === 'auto' ? 'display:none' : ''}">
        <div class="form-section-title">关联列表</div>
        <div id="hot-manual-linked-panel">${renderHotRecommendLinkedPanel(manualLinked)}</div>
      </div>

      <div class="form-section" id="hot-publish-section" data-req-title="发布与更新" data-req-body="保存并发布时写入实际发布时间：即时=保存时刻；指定时间=所选定时时刻。规则同 §5.4.5。" data-req-doc="万象视界需求文档 §5.4.5 / §7.8">
        <div class="form-section-title">发布与更新</div>
        <div class="form-row">
          <div class="form-item">
            <label class="form-label"><span class="required">*</span>发布时间</label>
            <div class="radio-group">
              <label class="radio-item"><input type="radio" name="hotPubTime" value="instant" checked onchange="toggleHotPublishTime()"> 即时发布</label>
              <label class="radio-item"><input type="radio" name="hotPubTime" value="scheduled" onchange="toggleHotPublishTime()"> 指定时间发布</label>
            </div>
            <input type="datetime-local" step="1" class="input datetime-input" id="hot-pub-time-input" style="margin-top:8px;display:none" value="${getCurrentDateTimeLocal()}">
          </div>
        </div>
      </div>

      <div class="form-footer">
        <button class="btn" onclick="hotRecommendFormSession=null;navigate('hot-recommend')">取消</button>
        <button class="btn btn-primary" onclick="saveHotRecommendDraft()">保存为草稿</button>
        <button class="btn btn-primary" onclick="confirmSaveAndPublishHotRecommend()">保存并发布</button>
      </div>
    </div>
  `;
}

function toggleHotPublishTime() {
  const scheduled = document.querySelector('input[name="hotPubTime"][value="scheduled"]')?.checked;
  const input = document.getElementById('hot-pub-time-input');
  if (!input) return;
  input.style.display = scheduled ? '' : 'none';
  if (scheduled) input.value = getCurrentDateTimeLocal();
}

function toggleHotRecommendSource(type) {
  if (type === 'manual') {
    const autoRules = document.getElementById('hot-auto-rules');
    if (autoRules && autoRules.style.display !== 'none') {
      showConfirmModal({
        message: '是否将自动选取的内容同步到手动？',
        onConfirm: () => {
          syncHotAutoToManual();
          applyHotRecommendSourceUI('manual');
        },
        onCancel: () => {
          document.querySelector('input[name="hotSourceType"][value="auto"]').checked = true;
          document.querySelector('input[name="hotSourceType"][value="manual"]').checked = false;
        },
      });
      return;
    }
  }
  applyHotRecommendSourceUI(type);
}

function syncHotAutoToManual() {
  const draft = readHotRecommendFromForm(data.hotRecommend || getDefaultHotRecommend());
  hotRecommendManualIds = getHotRecommendAutoPreview(draft).map(c => c.id).slice(0, CONTENT_LIMIT);
  refreshHotRecommendLinkedTable();
  toast('同步成功', 'success');
}

function applyHotRecommendSourceUI(type) {
  const autoEl = document.getElementById('hot-auto-rules');
  const manualEl = document.getElementById('hot-manual-rules');
  if (autoEl) autoEl.style.display = type === 'auto' ? '' : 'none';
  if (manualEl) manualEl.style.display = type === 'manual' ? '' : 'none';
}

function updateHotRecommendAutoPreview() {
  const draft = readHotRecommendFromForm(data.hotRecommend || getDefaultHotRecommend());
  const list = getHotRecommendAutoPreview(draft);
  const tbody = document.getElementById('hot-auto-preview-tbody');
  if (tbody) {
    tbody.innerHTML = renderContentTableRows(list, {
      showSort: true, showId: false, showImage: true, showVideo: true,
      showViews: true, showCtr: true, showDuration: true,
      showTags: false, showStatus: false, showAction: false,
    });
  }
}

function saveHotRecommendDraft() {
  const next = readHotRecommendFromForm(data.hotRecommend || getDefaultHotRecommend());
  next.status = 'draft';
  next.publishedAt = null;
  data.hotRecommend = next;
  saveData(data);
  hotRecommendFormSession = null;
  toast('已保存为草稿', 'success');
  navigate('hot-recommend');
}

function confirmSaveAndPublishHotRecommend() {
  showConfirmModal({
    message: '确认保存并发布热门推荐？',
    hint: '学生端热门轮播将按最新配置展示',
    onConfirm: () => {
      const next = readHotRecommendFromForm(data.hotRecommend || getDefaultHotRecommend());
      const scheduled = document.querySelector('input[name="hotPubTime"][value="scheduled"]')?.checked;
      const scheduledVal = document.getElementById('hot-pub-time-input')?.value;
      next.status = 'enabled';
      if (scheduled && scheduledVal) {
        next.publishedAt = scheduledVal.replace('T', ' ');
      } else {
        next.publishedAt = now();
      }
      data.hotRecommend = next;
      saveData(data);
      hotRecommendFormSession = null;
      toast('保存成功，将自动发布', 'success');
      navigate('hot-recommend');
    },
  });
}

function renderPage(route, params) {
  switch (route) {
    case 'home-config': return renderHomeConfigPage(params);
    case 'cabinet-carousel': return renderCarouselConfigEditPage(params);
    case 'cabinet-carousel-batch': return renderCarouselConfigEditPage(params);
    case 'hot-recommend': return renderHotRecommendPage();
    case 'section-add': return renderSectionFormPage('add', params);
    case 'section-edit': return renderSectionFormPage('edit', params);
    case 'content': return renderContentPage(params);
    case 'channel': return renderChannelPage(params);
    case 'channel-add': return renderChannelFormPage('add', params);
    case 'channel-edit': return renderChannelFormPage('edit', params);
    case 'tag': return renderTagPage();
    case 'daily-word': return renderDailyWordPage();
    case 'word-edit': return renderWordEditPage(params);
    case 'layout-template': return renderLayoutTemplatePage(params?.type);
    case 'device-overview': return renderDeviceOverviewPage();
    case 'cabinet': return renderCabinetPage();
    case 'cabinet-detail': return renderCabinetDetailPage(params);
    case 'tablet': return renderTabletPage();
    case 'tablet-detail': return renderTabletDetailPage(params);
    case 'device-usage': return renderDeviceUsagePage(params);
    case 'device-usage-detail': return renderDeviceUsageDetailPage(params);
    case 'device-alert': return renderDeviceAlertPage(params);
    case 'mall': return renderMallPage(params);

    default: return renderHomeConfigPage(params);
  }
}
