/* 排版模板预览组件 */

const IMAGE_LAYOUT_CATALOG = [
  { id: 'row-1', name: '左文右图', desc: '左侧正文 + 右侧配图，多条纵向排列', counts: [1, 2, 3] },
  { id: 'grid-2', name: '双列卡片', desc: '两条内容并排，上图下文', counts: [2] },
  { id: 'carousel', name: '轮播展示', desc: '内容轮播，左图右文 + 指示点', counts: [3, 4, 5] },
];

const VIDEO_LAYOUT_CATALOG = [
  { id: 'video-row-1', count: 1, name: '左文右视频', desc: '单条内容，左侧正文 + 右侧视频封面' },
  { id: 'video-grid-2', count: 2, name: '双列视频卡', desc: '两条视频并排，封面 + 标题摘要' },
  { id: 'video-cols-3', count: 3, name: '三列视频', desc: '三条视频横排，封面 + 标题' },
  { id: 'video-cols-4', count: 4, name: '四列视频', desc: '四条视频横排紧凑展示' },
  { id: 'video-cols-5', count: 5, name: '五列视频', desc: '五条视频横排紧凑展示' },
];

/* 频道管理 · 视频排版：按关联条数精确匹配唯一排版（1→左文右视频 … 5→五列），不会多出行 */
const CHANNEL_IMAGE_LAYOUTS = [
  { id: 'row-1', name: '左文右图', colsPerRow: 1, desc: '不限内容数量，每条独占一行纵向排列' },
  { id: 'grid-2', name: '双列卡片', colsPerRow: 2, desc: '不限内容数量，每行 2 条，放满自动换行' },
];

const CHANNEL_VIDEO_LAYOUTS = [
  { id: 'video-row-1', name: '左文右视频', colsPerRow: 1, exactCount: 1, desc: '恰好 1 条视频时可选' },
  { id: 'video-grid-2', name: '双列视频卡', colsPerRow: 2, exactCount: 2, desc: '恰好 2 条视频时可选；一排双列展示' },
  { id: 'video-cols-3', name: '三列视频', colsPerRow: 3, exactCount: 3, desc: '恰好 3 条视频时可选；一排三列展示' },
  { id: 'video-cols-4', name: '四列视频', colsPerRow: 4, exactCount: 4, desc: '恰好 4 条视频时可选；一排四列展示' },
  { id: 'video-cols-5', name: '五列视频', colsPerRow: 5, exactCounts: [5, 6, 7, 8, 9, 10], desc: '5～10 条视频单行展示，超出可横向滚动' },
];

function getLinkedContentsFromForm() {
  const autoRules = document.getElementById('auto-rules');
  if (autoRules && autoRules.style.display !== 'none') {
    const limit = parseInt(document.getElementById('auto-display-limit')?.value || '1', 10);
    return data.contents.filter(c => c.status === 'enabled').slice(0, limit);
  }
  return getManualLinkedContents();
}

function getPreviewItems(items, mediaType, count) {
  const isVideo = mediaType === 'video';
  const filtered = (items || []).filter(c => isVideo ? c.type === '视频' : c.type === '图文');
  if (filtered.length > 0) return filtered.slice(0, CONTENT_LIMIT);
  const pool = data.contents.filter(c =>
    c.status === 'enabled' && (isVideo ? c.type === '视频' : c.type === '图文')
  );
  const need = Math.max(count, 1);
  return pool.slice(0, need);
}

function getImageContentCount() {
  const items = getLinkedContentsFromForm().filter(c => c.type === '图文');
  return Math.max(items.length, 1);
}

function getVideoContentCount() {
  return getLinkedContentsFromForm().filter(c => c.type === '视频').length;
}

function getAvailableImageLayouts(contentCount) {
  const count = Math.min(Math.max(contentCount, 1), CONTENT_LIMIT);
  return IMAGE_LAYOUT_CATALOG.filter(l => l.counts.includes(count));
}

function getAvailableVideoLayouts(videoCount) {
  if (videoCount < 1) return [];
  const count = Math.min(videoCount, CONTENT_LIMIT);
  return VIDEO_LAYOUT_CATALOG.filter(l => l.count === count);
}

function getChannelLinkedContents(channelId) {
  if (!channelId) return [];
  return data.contents.filter(c => c.channelId === +channelId);
}

function getChannelFormLinkedContents() {
  if (document.getElementById('channel-linked-panel') && typeof getChannelManualLinkedContents === 'function') {
    return getChannelManualLinkedContents();
  }
  const channelId = document.querySelector('.form-page[data-channel-id]')?.dataset.channelId;
  return getChannelLinkedContents(channelId);
}

function getChannelContentCount(mediaType) {
  const isVideo = mediaType === 'video';
  const limit = isChannelSubchannel()
    ? Number(document.getElementById('channel-display-limit')?.value || 0)
    : getChannelFormLinkedContents().length;
  return getChannelFormLinkedContents()
    .slice(0, limit)
    .filter(c => isVideo ? c.type === '视频' : c.type === '图文')
    .length;
}

function getAvailableChannelVideoLayouts(contentCount) {
  const n = Math.min(Math.max(contentCount, 0), 10);
  if (!n) return [];
  return CHANNEL_VIDEO_LAYOUTS.filter(l => l.exactCount === n || l.exactCounts?.includes(n));
}

function getChannelVideoLayoutHint(contentCount) {
  if (!contentCount) {
    return '选择展示条数后匹配排版：1 条左文右视频，2 条双列，3/4/5 条分别为三/四/五列，6～10 条每行五列。';
  }
  const layouts = getAvailableChannelVideoLayouts(contentCount);
  if (!layouts.length) {
    return '请选择展示条数后再选排版';
  }
  return `当前展示 ${contentCount} 条视频，对应排版：${layouts.map(l => l.name).join('、')}`;
}

function chunkChannelItems(items, size) {
  if (!items.length) return [[]];
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

function getChannelPreviewItems(items, mediaType, colsPerRow, displayCount = colsPerRow) {
  const isVideo = mediaType === 'video';
  const filtered = (items || []).filter(c => isVideo ? c.type === '视频' : c.type === '图文');
  if (filtered.length) {
    return filtered.slice(0, displayCount);
  }
  const demoCount = Math.min(Math.max(displayCount || colsPerRow || 1, 1), 10);
  return getPreviewItems([], mediaType, demoCount);
}

function renderChannelImageLayout(styleId, items, channelName) {
  const layout = CHANNEL_IMAGE_LAYOUTS.find(l => l.id === styleId) || CHANNEL_IMAGE_LAYOUTS[0];
  const picked = getChannelPreviewItems(items, 'image', layout.colsPerRow);
  const head = renderBlockHead(false, 0, channelName, '频道内容');
  if (styleId === 'grid-2') {
    const rows = chunkChannelItems(picked, 2);
    return head + `<div class="lt-channel-rows">${rows.map(row =>
      `<div class="lt-grid-2">${row.map(it => renderGrid2Card(false, it)).join('')}</div>`
    ).join('')}</div>`;
  }
  return head + `<div class="lt-stack">${picked.map(it => renderRow1TextMedia(false, it)).join('')}</div>`;
}

function renderChannelVideoLayout(styleId, items, channelName) {
  const layout = CHANNEL_VIDEO_LAYOUTS.find(l => l.id === styleId) || CHANNEL_VIDEO_LAYOUTS[0];
  const displayCount = getChannelContentCount('video');
  const picked = getChannelPreviewItems(items, 'video', layout.colsPerRow, displayCount);
  const head = renderBlockHead(false, 0, channelName, '频道内容');
  if (styleId === 'video-row-1') {
    return head + `<div class="lt-stack">${picked.map(it => renderRow1TextMedia(true, it)).join('')}</div>`;
  }
  if (styleId === 'video-grid-2') {
    return `<div class="lt-video-2">${head}<div class="lt-grid-2">${picked.map(it => renderGrid2Card(true, it)).join('')}</div></div>`;
  }
  const cols = layout.colsPerRow;
  const compact = cols >= 4;
  const colClass = displayCount > 5 ? 'cols-10' : cols === 3 ? 'cols-3' : cols === 4 ? 'cols-4' : 'cols-5';
  return head + `<div class="lt-video-row ${colClass}">${picked.map(it => renderVideoColumnCard(compact, it)).join('')}</div>`;
}

function renderChannelImageLayoutSelector(selectedStyleId, items, channelName) {
  const selected = selectedStyleId || 'row-1';
  return `<div class="layout-selector" id="channel-image-layout-selector" data-selected="${selected}">
    ${CHANNEL_IMAGE_LAYOUTS.map(l => `
      <div class="layout-option ${selected === l.id ? 'active' : ''}"
           data-style="${l.id}"
           onclick="selectChannelImageLayout('${l.id}')"
           title="${esc(l.name)}">
        <div class="layout-preview-live"><div class="lt-preview lt-preview-live">${renderChannelImageLayout(l.id, items, channelName)}</div></div>
        <div class="layout-option-label">${esc(l.name)}</div>
      </div>
    `).join('')}
  </div>`;
}

function renderChannelVideoLayoutSelector(selectedStyleId, items, channelName, contentCount) {
  const layouts = getAvailableChannelVideoLayouts(contentCount);
  if (!layouts.length) return '';
  const selected = layouts.find(l => l.id === selectedStyleId)?.id || layouts[0]?.id || 'video-row-1';
  return `<div class="layout-selector" id="channel-video-layout-selector" data-selected="${selected}">
    ${layouts.map(l => `
      <div class="layout-option ${selected === l.id ? 'active' : ''}"
           data-style="${l.id}"
           onclick="selectChannelVideoLayout('${l.id}')"
           title="${esc(l.name)}">
        <div class="layout-preview-live"><div class="lt-preview lt-preview-live">${renderChannelVideoLayout(l.id, items, channelName)}</div></div>
        <div class="layout-option-label">${esc(l.name)}</div>
      </div>
    `).join('')}
  </div>`;
}

function selectChannelImageLayout(styleId) {
  const el = document.getElementById('channel-image-layout-selector');
  if (!el) return;
  el.dataset.selected = styleId;
  el.querySelectorAll('.layout-option').forEach(o => {
    o.classList.toggle('active', o.dataset.style === styleId);
  });
}

function selectChannelVideoLayout(styleId) {
  const el = document.getElementById('channel-video-layout-selector');
  if (!el) return;
  el.dataset.selected = styleId;
  el.querySelectorAll('.layout-option').forEach(o => {
    o.classList.toggle('active', o.dataset.style === styleId);
  });
}

function isChannelVideoType() {
  return document.querySelector('input[name="chType"][value="video"]')?.checked;
}

function getChannelFormName() {
  return document.getElementById('channel-name-input')?.value?.trim() || '频道名称';
}

function isChannelSubchannel() {
  return Boolean(document.getElementById('channel-parent-select')?.value);
}

function toggleChannelParent() {
  const displayLimitRow = document.getElementById('channel-display-limit-row');
  if (displayLimitRow) displayLimitRow.style.display = isChannelSubchannel() ? '' : 'none';
  refreshChannelLayoutSelector();
}

function toggleChannelContentType() {
  const isVideo = isChannelVideoType();
  const typeLabel = isVideo ? '视频' : '图文';
  channelManualIds = channelManualIds.filter(id => {
    const c = data.contents.find(x => x.id === id);
    return c && c.type === typeLabel;
  });
  refreshChannelLinkedTable();
  const imageWrap = document.getElementById('channel-image-layout-wrap');
  const videoWrap = document.getElementById('channel-video-layout-wrap');
  if (imageWrap) imageWrap.style.display = isVideo ? 'none' : '';
  if (videoWrap) videoWrap.style.display = isVideo ? '' : 'none';
  refreshChannelLayoutSelector();
}

function syncChannelDisplayLimit() {
  const select = document.getElementById('channel-display-limit');
  if (!select) return 0;
  if (!isChannelSubchannel()) return getChannelFormLinkedContents().length;
  const max = Math.min(getChannelFormLinkedContents().length, 10);
  const current = Math.min(Math.max(Number(select.value) || 1, 1), max || 0);
  select.disabled = !max;
  select.innerHTML = max
    ? Array.from({ length: max }, (_, i) => `<option value="${i + 1}">前 ${i + 1} 条</option>`).join('')
    : '<option value="0">暂无可展示内容</option>';
  select.value = String(current);
  return current;
}

function refreshChannelLayoutSelector() {
  const displayLimit = isChannelSubchannel()
    ? syncChannelDisplayLimit()
    : getChannelFormLinkedContents().length;
  const items = getChannelFormLinkedContents().slice(0, displayLimit);
  const channelName = getChannelFormName();
  const imageWrap = document.getElementById('channel-image-layout-selector-wrap');
  if (imageWrap) {
    const prev = document.getElementById('channel-image-layout-selector')?.dataset.selected;
    imageWrap.innerHTML = renderChannelImageLayoutSelector(prev, items, channelName);
  }
  const videoWrap = document.getElementById('channel-video-layout-selector-wrap');
  if (videoWrap) {
    const count = getChannelContentCount('video');
    const prev = document.getElementById('channel-video-layout-selector')?.dataset.selected;
    const available = getAvailableChannelVideoLayouts(count);
    const selected = available.find(l => l.id === prev)?.id || available[0]?.id;
    videoWrap.innerHTML = renderChannelVideoLayoutSelector(selected, items, channelName, count);
    const hint = document.getElementById('channel-video-layout-hint');
    if (hint) hint.textContent = getChannelVideoLayoutHint(count);
  }
}

function renderDots(count, active = 0) {
  return `<div class="lt-dots">${Array.from({ length: count }, (_, i) =>
    `<span class="lt-dot ${i === active ? 'active' : ''}"></span>`
  ).join('')}</div>`;
}

function renderBlockHead(showDots, dotCount, sectionName, sectionSub) {
  return `<div class="lt-block-head-row">
    <div class="lt-block-head">
      <div class="lt-block-title">${esc(sectionName || '板块名称')}</div>
      <div class="lt-block-sub">${esc(sectionSub || '副标题')}</div>
    </div>
    ${showDots ? renderDots(dotCount, 0) : ''}
  </div>`;
}

function getCardMeta(item) {
  const views = item?.views ?? '—';
  const likes = item?.likes ?? (typeof item?.views === 'number' ? Math.round(item.views * 0.08) : '—');
  const publishLabel = item?.importTime ? item.importTime.slice(0, 10) : '发布时间';
  return { views, likes, publishLabel };
}

function renderCardFoot(item) {
  const { views, likes, publishLabel } = getCardMeta(item);
  return `<div class="lt-item-foot">
    <span>${esc(String(publishLabel))}</span>
    <span class="lt-item-foot-stats">
      <span>阅读量 ${views}</span>
      <span>点赞数 ${likes}</span>
    </span>
  </div>`;
}

function renderRow1TextMedia(isVideo, item) {
  const title = item ? esc(item.title) : '内容标题';
  const body = item ? esc(item.content) : '正文内容正文内容正文内容正文内容正文内容…';
  const source = item ? esc(item.source) : '出处';
  const duration = item ? item.duration : (isVideo ? '视频时长' : '阅读时长');
  const mediaInner = isVideo
    ? `<span class="lt-play">▶</span>`
    : `<span class="lt-img-label">🖼 图片<br>（默认第一张）</span>`;
  return `<div class="lt-row-1">
    <div class="lt-row-1-text">
      <div class="lt-row-1-top">
        <span class="lt-row-1-title">${title}</span>
      </div>
      <div class="lt-row-1-body">${body}</div>
      ${renderCardFoot(item)}
    </div>
    <div class="lt-row-1-media">
      <span class="lt-badge-tr">${duration}</span>
      <span class="lt-badge-bl">${source}</span>
      ${mediaInner}
    </div>
  </div>`;
}

function renderGrid2Card(isVideo, item) {
  const title = item ? esc(item.title) : '内容标题';
  const body = item ? esc(item.content) : '正文内容正文内容正文内容…';
  const source = item ? esc(item.source) : '出处';
  const duration = item ? item.duration : (isVideo ? '视频时长' : '阅读时长');
  const mediaInner = isVideo
    ? `<span class="lt-play">▶</span>`
    : `<span class="lt-img-label">🖼 图片<br>（默认第一张）</span>`;
  return `<div class="lt-card-item">
    <div class="lt-card-media">
      <span class="lt-badge-tr">${duration}</span>
      <span class="lt-badge-bl">${source}</span>
      ${mediaInner}
    </div>
    <div class="lt-card-body-inner">
      <div class="lt-item-title">${title}</div>
      <div class="lt-item-body">${body}</div>
      ${renderCardFoot(item)}
    </div>
  </div>`;
}

function renderCarouselCard(isVideo, item) {
  const title = item ? esc(item.title) : '内容标题';
  const body = item ? esc(item.content) : '正文内容正文内容正文内容正文内容…';
  const source = item ? esc(item.source) : '出处';
  const duration = item ? item.duration : (isVideo ? '视频时长' : '阅读时长');
  const { views, likes, publishLabel } = getCardMeta(item);
  return `<div class="lt-carousel-card">
    <div class="lt-carousel-media">
      <span class="lt-badge-tr">${duration}</span>
      <span class="lt-badge-bl">${source}</span>
      ${isVideo ? '<span class="lt-play">▶</span>' : '<span class="lt-img-label" style="font-size:9px">🖼 图片<br>（默认第一张）</span>'}
    </div>
    <div class="lt-carousel-text">
      <div class="lt-carousel-top">
        <span class="lt-title-mini">${title}</span>
      </div>
      <div class="lt-carousel-body">${body}</div>
      <div class="lt-carousel-foot">
        <span>${esc(String(publishLabel))}</span>
        <span class="lt-carousel-foot-stats">
          <span>阅读量 ${views}</span>
          <span>点赞数 ${likes}</span>
        </span>
      </div>
    </div>
  </div>`;
}

function renderVideoColumnCard(compact, item) {
  const title = item ? esc(item.title) : '内容标题';
  const body = item ? esc(item.content) : '正文内容正文内容…';
  const source = item ? esc(item.source) : '出处';
  const duration = item ? item.duration : '视频时长';
  const { views, likes, publishLabel } = getCardMeta(item);
  return `<div class="lt-video-card-wrap ${compact ? 'compact' : ''}">
    <div class="lt-video-card ${compact ? 'tall' : ''}">
      <span class="lt-badge-tr">${duration}</span>
      <span class="lt-play">▶</span>
      <span class="lt-badge-bl">${source}${compact ? `<span class="lt-sub-line">${title}</span>` : ''}</span>
    </div>
    ${compact ? '' : `<div class="lt-video-card-body">
      <div class="lt-video-card-title">${title}</div>
      <div class="lt-video-card-desc">${body}</div>
      <div class="lt-item-foot">
        <span>${esc(String(publishLabel))}</span>
        <span class="lt-item-foot-stats">
          <span>阅读量 ${views}</span>
          <span>点赞数 ${likes}</span>
        </span>
      </div>
    </div>`}
  </div>`;
}

function pickItems(items, count) {
  const list = items && items.length ? items : getPreviewItems([], 'image', count);
  return Array.from({ length: count }, (_, i) => list[i] || list[0]).filter(Boolean);
}

function renderImageTemplateByStyle(styleId, count, items, sectionName, sectionSub) {
  const picked = pickItems(items, count);
  const head = renderBlockHead(styleId === 'carousel', count, sectionName, sectionSub);
  if (styleId === 'row-1') {
    return head + `<div class="lt-stack">${picked.map(it => renderRow1TextMedia(false, it)).join('')}</div>`;
  }
  if (styleId === 'grid-2') {
    return head + `<div class="lt-grid-2">${picked.slice(0, 2).map(it => renderGrid2Card(false, it)).join('')}</div>`;
  }
  return head + renderCarouselCard(false, picked[0]);
}

function renderVideoTemplateByStyle(styleId, count, items, sectionName, sectionSub) {
  const picked = getPreviewItems(items, 'video', count);
  const head = renderBlockHead(false, 0, sectionName, sectionSub);
  if (count === 1 || styleId === 'video-row-1') {
    return head + renderRow1TextMedia(true, picked[0]);
  }
  if (count === 2 || styleId === 'video-grid-2') {
    return `<div class="lt-video-2">${head}<div class="lt-grid-2">${picked.slice(0, 2).map(it => renderGrid2Card(true, it)).join('')}</div></div>`;
  }
  const cols = count === 3 ? 'cols-3' : count === 4 ? 'cols-4' : 'cols-5';
  const compact = count >= 4;
  return head +
    `<div class="lt-video-row ${cols}">${Array.from({ length: count }, (_, i) => renderVideoColumnCard(compact, picked[i])).join('')}</div>`;
}

function renderLayoutPreview(type, count, styleId, items, sectionName, sectionSub, live = false) {
  const cls = live ? 'lt-preview lt-preview-live' : 'lt-preview';
  const html = type === 'image'
    ? renderImageTemplateByStyle(styleId || getAvailableImageLayouts(count)[0]?.id || 'row-1', count, items, sectionName, sectionSub)
    : renderVideoTemplateByStyle(styleId || getAvailableVideoLayouts(count)[0]?.id, count, items, sectionName, sectionSub);
  return `<div class="${cls}">${html}</div>`;
}

function renderLayoutTemplatePage(activeType) {
  const type = activeType || 'image';
  const title = type === 'image' ? '图文排版模板' : '视频排版模板';

  if (type === 'image') {
    return `
      <div class="page-card">
        <div class="page-card-title">${title}</div>
        <p style="font-size:13px;color:var(--text-secondary);margin:-8px 0 16px">
          按内容条数展示可选排版。在「新增/编辑板块 → 排版方式」中可直接预览已选内容的展示效果。
        </p>
        <div class="lt-catalog-vertical">
          ${IMAGE_LAYOUT_CATALOG.map(l => `
            <div class="lt-card">
              <div class="lt-card-head">
                <strong>${esc(l.name)}</strong>
                <span class="lt-tag-type">适用 ${l.counts.join(' / ')} 条</span>
              </div>
              <div class="lt-card-body">
                <div class="lt-style-previews">
                  ${l.counts.map(c => `
                    <div class="lt-style-preview-item">
                      <div class="lt-style-preview-label">${c} 条</div>
                      ${renderLayoutPreview('image', c, l.id, getPreviewItems([], 'image', c), null, null, true)}
                    </div>
                  `).join('')}
                </div>
                <p class="lt-card-desc">${esc(l.desc)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  return `
    <div class="page-card">
      <div class="page-card-title">${title}</div>
      <p style="font-size:13px;color:var(--text-secondary);margin:-8px 0 16px">
        按视频内容条数展示对应排版。需关联对应数量的视频内容后，方可在板块表单中选择。
      </p>
      <div class="lt-grid">
        ${VIDEO_LAYOUT_CATALOG.map(l => `
          <div class="lt-card">
            <div class="lt-card-head">
              <strong>${l.count} 条 · ${esc(l.name)}</strong>
              <span class="lt-tag-type">视频</span>
            </div>
            <div class="lt-card-body">
              ${renderLayoutPreview('video', l.count, l.id, getPreviewItems([], 'video', l.count), null, null, true)}
              <p style="font-size:12px;color:var(--text-muted);margin-top:12px">${esc(l.desc)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderImageLayoutSelector(contentCount, selectedStyleId, items, sectionName, sectionSub) {
  const count = Math.max(contentCount, 1);
  const layouts = getAvailableImageLayouts(count);
  const previewItems = getPreviewItems(items, 'image', count);
  const selected = layouts.find(l => l.id === selectedStyleId)?.id || layouts[0]?.id || 'row-1';
  return `<div class="layout-selector" id="image-layout-selector" data-selected="${selected}">
    ${layouts.map(l => `
      <div class="layout-option ${selected === l.id ? 'active' : ''}"
           data-style="${l.id}"
           onclick="selectImageLayout('${l.id}')"
           title="${esc(l.name)}">
        <div class="layout-preview-live">${renderLayoutPreview('image', count, l.id, previewItems, sectionName, sectionSub, true)}</div>
        <div class="layout-option-label">${esc(l.name)}</div>
      </div>
    `).join('')}
  </div>`;
}

function renderVideoLayoutSelector(videoCount, selectedStyleId, items, sectionName, sectionSub) {
  const layouts = getAvailableVideoLayouts(videoCount);
  if (!layouts.length) return '';
  const previewItems = getPreviewItems(items, 'video', videoCount);
  const selected = layouts.find(l => l.id === selectedStyleId)?.id || layouts[0].id;
  return `<div class="layout-selector" id="video-layout-selector" data-selected="${selected}">
    ${layouts.map(l => `
      <div class="layout-option ${selected === l.id ? 'active' : ''}"
           data-style="${l.id}"
           onclick="selectVideoLayout('${l.id}')"
           title="${esc(l.name)}">
        <div class="layout-preview-live">${renderLayoutPreview('video', l.count, l.id, previewItems, sectionName, sectionSub, true)}</div>
        <div class="layout-option-label">${esc(l.name)}</div>
      </div>
    `).join('')}
  </div>`;
}

function selectImageLayout(styleId) {
  const el = document.getElementById('image-layout-selector');
  if (!el) return;
  el.dataset.selected = styleId;
  el.querySelectorAll('.layout-option').forEach(o => {
    o.classList.toggle('active', o.dataset.style === styleId);
  });
}

function selectVideoLayout(styleId) {
  const el = document.getElementById('video-layout-selector');
  if (!el) return;
  el.dataset.selected = styleId;
  el.querySelectorAll('.layout-option').forEach(o => {
    o.classList.toggle('active', o.dataset.style === styleId);
  });
}

function refreshLayoutSelectors() {
  refreshImageLayoutSelector();
  refreshVideoLayoutSelector();
}

function refreshImageLayoutSelector() {
  const wrap = document.getElementById('image-layout-selector-wrap');
  if (!wrap) return;
  const count = getImageContentCount();
  const prev = document.getElementById('image-layout-selector')?.dataset.selected;
  const available = getAvailableImageLayouts(count);
  const selected = available.find(l => l.id === prev)?.id || available[0]?.id;
  const items = getLinkedContentsFromForm().filter(c => c.type === '图文');
  const nameInput = document.querySelector('.form-page .form-item input.input');
  const subInput = document.querySelectorAll('.form-page .form-item input.input')[1];
  wrap.innerHTML = renderImageLayoutSelector(count, selected, items, nameInput?.value, subInput?.value);
  const hint = document.getElementById('image-layout-hint');
  if (hint) hint.textContent = `当前 ${items.length || count} 条图文内容，可选排版见上方预览`;
}

function refreshVideoLayoutSelector() {
  const wrap = document.getElementById('video-layout-selector-wrap');
  if (!wrap) return;
  const count = getVideoContentCount();
  const empty = document.getElementById('video-layout-empty');
  if (count < 1) {
    wrap.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';
  const prev = document.getElementById('video-layout-selector')?.dataset.selected;
  const available = getAvailableVideoLayouts(count);
  const selected = available.find(l => l.id === prev)?.id || available[0]?.id;
  const items = getLinkedContentsFromForm().filter(c => c.type === '视频');
  const nameInput = document.querySelector('.form-page .form-item input.input');
  const subInput = document.querySelectorAll('.form-page .form-item input.input')[1];
  wrap.innerHTML = renderVideoLayoutSelector(count, selected, items, nameInput?.value, subInput?.value);
  const hint = document.getElementById('video-layout-hint');
  if (hint) hint.textContent = `当前 ${count} 条视频内容，可选排版见上方预览`;
}

function renderLayoutSelector(type, contentCount, selectedStyleId, items, sectionName, sectionSub) {
  if (type === 'image') {
    return renderImageLayoutSelector(contentCount, selectedStyleId, items, sectionName, sectionSub);
  }
  return renderVideoLayoutSelector(contentCount, selectedStyleId, items, sectionName, sectionSub);
}
