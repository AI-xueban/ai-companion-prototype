/* 柜机广告轮播 · 融入柜机管理（1080×600） */

let carouselEditDraft = null; // { mode:'single'|'batch', cabinetId?, cabinetIds?, items }
let carouselPreviewIndex = 0;

function ensureCabinetCarousels() {
  if (!data.cabinetCarousels || typeof data.cabinetCarousels !== 'object') {
    data.cabinetCarousels = {};
  }
}

function getCabinetCarousel(cabinetId) {
  ensureCabinetCarousels();
  return data.cabinetCarousels[cabinetId] || { items: [], updatedAt: null };
}

function getCarouselItems(cabinetId) {
  return [...(getCabinetCarousel(cabinetId).items || [])];
}

function summarizeCarouselItems(items) {
  const list = items || [];
  if (!list.length) return '未配置';
  return `${list.length} 图`;
}

function carouselConfigStatusTag(configured) {
  return configured
    ? '<span class="tag tag-green">已配置</span>'
    : '<span class="tag tag-gray">未配置</span>';
}

/* —— 柜机列表多选 —— */
function getSelectedCabinetIds() {
  return Array.from(document.querySelectorAll('.cabinet-pick-checkbox:checked')).map(cb => cb.dataset.id);
}

function syncCabinetSelectAllState() {
  const all = document.querySelectorAll('.cabinet-pick-checkbox');
  const checked = document.querySelectorAll('.cabinet-pick-checkbox:checked');
  const selectAll = document.getElementById('cabinet-select-all');
  if (selectAll) {
    selectAll.checked = all.length > 0 && checked.length === all.length;
    selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
  }
  const countEl = document.getElementById('cabinet-selected-count');
  if (countEl) countEl.textContent = String(checked.length);
}

function toggleCabinetSelectAll(checked) {
  document.querySelectorAll('.cabinet-pick-checkbox').forEach(cb => { cb.checked = checked; });
  syncCabinetSelectAllState();
}

function openBatchCarouselConfig() {
  const ids = getSelectedCabinetIds();
  if (!ids.length) {
    toast('请先勾选需要批量配置的柜机', 'warning');
    return;
  }
  openTab('cabinet-carousel-batch', '批量配置轮播', { ids });
}

const CAROUSEL_DURATION_OPTIONS = [3, 5, 8, 10, 15];

/** 全局图片轮播时长配置（全部柜机共用，不可按柜单独设置） */
function openCarouselDurationModal() {
  const current = getCabinetCarouselImageDuration();
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = '轮播时长配置';
  if (subtitle) {
    subtitle.style.display = '';
    subtitle.textContent = '对全部柜机的图片素材生效，不可按柜单独设置';
  }

  modal?.classList.remove('modal-xl', 'modal-sm');
  modal?.classList.add('modal-md');

  document.getElementById('modal-body').innerHTML = `
    <div class="add-tag-modal">
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>图片停留时长</label>
        <select class="select add-tag-input" id="cc-global-duration" style="width:100%">
          ${CAROUSEL_DURATION_OPTIONS.map(s => `<option value="${s}" ${current === s ? 'selected' : ''}>${s} 秒</option>`).join('')}
        </select>
      </div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer modal-footer--center';
    footer.innerHTML = `
      <button type="button" class="btn" id="cc-duration-cancel">取消</button>
      <button type="button" class="btn btn-primary" id="cc-duration-ok">保存</button>
    `;
  }

  document.getElementById('modal-overlay').hidden = false;

  document.getElementById('cc-duration-cancel')?.addEventListener('click', () => {
    modal?.classList.remove('modal-md');
    closeModal();
  });
  document.getElementById('cc-duration-ok')?.addEventListener('click', () => {
    const sec = Number(document.getElementById('cc-global-duration')?.value || 5);
    data.cabinetCarouselImageDurationSec = CAROUSEL_DURATION_OPTIONS.includes(sec) ? sec : 5;
    saveData(data);
    modal?.classList.remove('modal-md');
    closeModal();
    toast(`已设置全部图片停留 ${data.cabinetCarouselImageDurationSec} 秒`, 'success');
    openTab('cabinet');
  });
}

function renderCarouselThumbStrip(items) {
  if (!items?.length) {
    return '<span class="carousel-thumb-empty">暂无素材</span>';
  }
  return `<div class="carousel-thumb-strip">
    ${items.slice(0, 4).map(it => `
      <div class="carousel-thumb-mini" title="${esc(it.name)}">
        <img src="${it.url}" alt="">
      </div>
    `).join('')}
    ${items.length > 4 ? `<span class="carousel-thumb-more">+${items.length - 4}</span>` : ''}
  </div>`;
}

/** 柜机详情页 · 广告轮播区块 */
function renderCabinetCarouselSection(cab) {
  const conf = getCabinetCarousel(cab.id);
  const items = conf.items || [];
  const configured = items.length > 0;
  const first = items[0];
  const imageDuration = getCabinetCarouselImageDuration();
  return `
    <div class="form-section-title" style="margin-top:24px">广告轮播（${CABINET_AD_SIZE.width}×${CABINET_AD_SIZE.height}）</div>
    <p class="form-hint" style="margin:0 0 12px">为本柜机广告区下发图片；不同柜机可配置不同素材。当前：${configured ? esc(summarizeCarouselItems(items)) + `（${items.length}条）` : '未配置'} · 图片停留 ${imageDuration} 秒（全局） · 更新：${conf.updatedAt || '—'}</p>
    <div class="toolbar" style="margin-bottom:12px">
      <div class="toolbar-left">
        <button type="button" class="btn" onclick="openCarouselPreviewModal('${cab.id}')">查看轮播</button>
        <button type="button" class="btn btn-primary" onclick="openTab('cabinet-carousel','配置轮播',{id:'${cab.id}'})">配置轮播</button>
        ${configured ? `<button type="button" class="btn" onclick="confirmClearCabinetCarousel('${cab.id}')">清空轮播</button>` : ''}
      </div>
    </div>
    ${configured ? `
      <div class="carousel-ad-preview-wrap" style="margin-bottom:8px">
        <div class="carousel-ad-preview" style="max-width:480px">
          <img class="carousel-ad-preview-media" src="${first.url}" alt="${esc(first.name)}">
          <div class="carousel-ad-preview-caption">${esc(first.name)}${items.length > 1 ? `（共 ${items.length} 则）` : ''}</div>
        </div>
      </div>
      ${renderCarouselThumbStrip(items)}
    ` : `<div class="carousel-detail-empty">暂无轮播素材，点击「配置轮播」添加</div>`}
  `;
}

function initCarouselEditDraft(cabinetId) {
  const items = getCarouselItems(cabinetId).map(it => ({ ...it }));
  carouselEditDraft = { mode: 'single', cabinetId, cabinetIds: null, items };
  carouselPreviewIndex = 0;
}

function initBatchCarouselEditDraft(cabinetIds) {
  carouselEditDraft = { mode: 'batch', cabinetId: null, cabinetIds: [...cabinetIds], items: [] };
  carouselPreviewIndex = 0;
}

function isBatchCarouselDraft() {
  return carouselEditDraft?.mode === 'batch';
}

function normalizeBatchIds(params) {
  const raw = params?.ids;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === 'string' && raw) return [raw];
  return [];
}

function sameIdList(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

function renderCarouselConfigEditPage(params) {
  const batchIds = normalizeBatchIds(params);
  const isBatch = Array.isArray(params?.ids);

  if (isBatch) {
    const cabs = batchIds.map(id => data.cabinets.find(c => c.id === id)).filter(Boolean);
    if (!cabs.length) {
      return `<div class="page-card"><div class="page-card-title">批量配置轮播</div><p class="form-hint">未找到所选柜机，请返回列表勾选后重试</p><div class="form-footer"><button class="btn" onclick="openTab('cabinet')">返回列表</button></div></div>`;
    }
    if (!carouselEditDraft || carouselEditDraft.mode !== 'batch' || !sameIdList(carouselEditDraft.cabinetIds, batchIds)) {
      initBatchCarouselEditDraft(batchIds);
    }
    return renderCarouselEditForm({
      isBatch: true,
      title: `批量配置轮播 · 已选 ${cabs.length} 台`,
      hint: `已选 ${cabs.length} 台：${cabs.map(c => esc(c.name)).join('、')}。保存后将覆盖其原有轮播内容。`,
      clearTargetId: null,
    });
  }

  const cab = data.cabinets.find(c => c.id === params?.id) || data.cabinets[0];
  if (!cab) {
    return `<div class="page-card"><div class="page-card-title">配置轮播</div><p class="form-hint">未找到柜机</p></div>`;
  }

  if (!carouselEditDraft || carouselEditDraft.mode !== 'single' || carouselEditDraft.cabinetId !== cab.id) {
    initCarouselEditDraft(cab.id);
  }

  return renderCarouselEditForm({
    isBatch: false,
    title: `配置轮播 · ${esc(cab.name)}`,
    hint: '',
    clearTargetId: cab.id,
  });
}

function renderCarouselEditForm({ isBatch, title, hint, clearTargetId }) {
  const items = carouselEditDraft?.items || [];
  if (carouselPreviewIndex >= items.length) carouselPreviewIndex = Math.max(0, items.length - 1);
  const active = items[carouselPreviewIndex];
  const imageDuration = getCabinetCarouselImageDuration();

  return `
    <div class="page-card form-page">
      <div class="page-card-title">${title}</div>
      ${hint ? `<p class="form-hint" style="margin:0 0 16px">${hint}</p>` : ''}

      <div class="form-section">
        <div class="form-section-title">柜机端预览</div>
        <div class="carousel-ad-preview-wrap">
          <div class="carousel-ad-preview" id="carousel-ad-preview">
            ${items.length ? `
              <img class="carousel-ad-preview-media" src="${active.url}" alt="${esc(active.name)}">
              <div class="carousel-ad-preview-caption">${esc(active.name)}</div>
            ` : `
              <div class="carousel-ad-preview-empty">
                <div>${isBatch ? '批量配置默认无素材' : '暂无轮播素材'}</div>
              </div>
            `}
          </div>
          ${items.length > 1 ? `
            <div class="carousel-ad-preview-nav">
              <button type="button" class="btn" onclick="shiftCarouselPreview(-1)">上一则</button>
              <span class="form-hint" style="margin:0">${carouselPreviewIndex + 1} / ${items.length}</span>
              <button type="button" class="btn" onclick="shiftCarouselPreview(1)">下一则</button>
            </div>
            <div class="carousel-ad-dots">
              ${items.map((_, i) => `<button type="button" class="carousel-ad-dot ${i === carouselPreviewIndex ? 'active' : ''}" onclick="setCarouselPreviewIndex(${i})" aria-label="第${i + 1}则"></button>`).join('')}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="form-section">
        <div class="form-section-title">轮播素材列表（上限${CABINET_CAROUSEL_LIMIT}条）</div>
        <div class="toolbar" style="margin-bottom:12px">
          <div class="toolbar-left">
            <button type="button" class="btn btn-primary" ${items.length >= CABINET_CAROUSEL_LIMIT ? 'disabled' : ''} onclick="openAddCarouselItemModal()">+ 添加图片</button>
            ${items.length >= CABINET_CAROUSEL_LIMIT ? '<span class="form-hint" style="margin:0">已达上限</span>' : ''}
          </div>
          <div class="toolbar-right">
            <span class="form-hint" style="margin:0">当前 ${items.length} / ${CABINET_CAROUSEL_LIMIT}</span>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th style="width:48px">排序</th><th>素材名称</th><th>操作</th>
            </tr></thead>
            <tbody id="carousel-edit-tbody">
              ${items.length ? items.map((it, i) => `
                <tr class="${i === carouselPreviewIndex ? 'carousel-row-active' : ''}">
                  <td>
                    <div class="carousel-sort-btns">
                      <button type="button" class="btn-link" ${i === 0 ? 'disabled' : ''} onclick="moveCarouselItem(${i},-1)">↑</button>
                      <button type="button" class="btn-link" ${i === items.length - 1 ? 'disabled' : ''} onclick="moveCarouselItem(${i},1)">↓</button>
                    </div>
                  </td>
                  <td><span class="link" onclick="setCarouselPreviewIndex(${i})">${esc(it.name)}</span></td>
                  <td>
                    <button class="btn-link" onclick="confirmRemoveCarouselItem(${i})">删除</button>
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--text-muted)">暂无素材，请添加图片</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="form-footer">
        <button type="button" class="btn" onclick="cancelCarouselEdit()">取消</button>
        ${items.length ? `<button type="button" class="btn" onclick="${isBatch ? 'clearBatchCarouselDraft()' : `confirmClearCabinetCarousel('${clearTargetId}', true)`}">清空全部</button>` : ''}
        <button type="button" class="btn btn-primary" onclick="${isBatch ? 'confirmSaveBatchCabinetCarousel()' : `saveCabinetCarousel('${clearTargetId}')`}">${isBatch ? '保存并批量下发' : '保存并下发'}</button>
      </div>
    </div>
  `;
}

function shiftCarouselPreview(delta) {
  if (!carouselEditDraft?.items?.length) return;
  const n = carouselEditDraft.items.length;
  carouselPreviewIndex = (carouselPreviewIndex + delta + n) % n;
  refreshCarouselEditPage();
}

function setCarouselPreviewIndex(i) {
  carouselPreviewIndex = i;
  refreshCarouselEditPage();
}

function refreshCarouselEditPage() {
  if (!carouselEditDraft) return;
  if (isBatchCarouselDraft()) {
    navigate('cabinet-carousel-batch', { ids: carouselEditDraft.cabinetIds });
    return;
  }
  navigate('cabinet-carousel', { id: carouselEditDraft.cabinetId });
}

function moveCarouselItem(index, delta) {
  const items = carouselEditDraft?.items;
  if (!items) return;
  const next = index + delta;
  if (next < 0 || next >= items.length) return;
  const tmp = items[index];
  items[index] = items[next];
  items[next] = tmp;
  if (carouselPreviewIndex === index) carouselPreviewIndex = next;
  else if (carouselPreviewIndex === next) carouselPreviewIndex = index;
  refreshCarouselEditPage();
}

function confirmRemoveCarouselItem(index) {
  const item = carouselEditDraft?.items?.[index];
  if (!item) return;
  showConfirmModal({
    message: `确认删除素材「${item.name}」？`,
    hint: '删除后需点击「保存并下发」才会同步到柜机',
    onConfirm: () => {
      carouselEditDraft.items.splice(index, 1);
      if (carouselPreviewIndex >= carouselEditDraft.items.length) {
        carouselPreviewIndex = Math.max(0, carouselEditDraft.items.length - 1);
      }
      toast('已从列表移除', 'success');
      refreshCarouselEditPage();
    },
  });
}

function clearBatchCarouselDraft() {
  if (!isBatchCarouselDraft()) return;
  carouselEditDraft.items = [];
  carouselPreviewIndex = 0;
  toast('已清空列表，请保存后下发', 'success');
  refreshCarouselEditPage();
}

function cancelCarouselEdit() {
  carouselEditDraft = null;
  openTab('cabinet');
}

function buildCarouselItemsForSave() {
  return (carouselEditDraft?.items || []).map((it, i) => ({
    id: it.id,
    type: 'image',
    name: it.name,
    url: it.url,
    sort: i + 1,
  }));
}

function saveCabinetCarousel(cabinetId) {
  ensureCabinetCarousels();
  const items = buildCarouselItemsForSave();
  if (items.length) {
    data.cabinetCarousels[cabinetId] = { items, updatedAt: now() };
  } else {
    delete data.cabinetCarousels[cabinetId];
  }
  saveData(data);
  carouselEditDraft = null;
  toast(items.length ? '已保存并下发到柜机' : '已清空该柜机轮播', 'success');
  openTab('cabinet');
}

function confirmSaveBatchCabinetCarousel() {
  if (!isBatchCarouselDraft()) return;
  const ids = carouselEditDraft.cabinetIds || [];
  const items = buildCarouselItemsForSave();
  const names = ids.map(id => data.cabinets.find(c => c.id === id)?.name || id);
  showConfirmModal({
    message: items.length
      ? `确认将 ${items.length} 条素材批量下发到 ${ids.length} 台柜机？`
      : `确认清空所选 ${ids.length} 台柜机的轮播内容？`,
    hint: `将覆盖「${names.join('」「')}」原先的全部轮播内容`,
    onConfirm: () => {
      ensureCabinetCarousels();
      const stamp = now();
      ids.forEach(id => {
        if (items.length) {
          data.cabinetCarousels[id] = {
            items: items.map(it => ({ ...it, id: `cc-${genId()}` })),
            updatedAt: stamp,
          };
        } else {
          delete data.cabinetCarousels[id];
        }
      });
      saveData(data);
      carouselEditDraft = null;
      toast(items.length
        ? `已批量下发到 ${ids.length} 台柜机`
        : `已清空 ${ids.length} 台柜机轮播`, 'success');
      openTab('cabinet');
    },
  });
}

function confirmClearCabinetCarousel(cabinetId, fromEdit = false) {
  const cab = data.cabinets.find(c => c.id === cabinetId);
  showConfirmModal({
    message: `确认清空「${cab?.name || cabinetId}」的全部轮播素材？`,
    hint: fromEdit
      ? '将清空当前编辑列表，需再点击「保存并下发」才会同步到柜机'
      : '清空后柜机广告区将不再播放内容，可随时重新配置',
    onConfirm: () => {
      if (fromEdit) {
        carouselEditDraft = { mode: 'single', cabinetId, cabinetIds: null, items: [] };
        carouselPreviewIndex = 0;
        toast('已清空列表，请保存后下发', 'success');
        refreshCarouselEditPage();
        return;
      }
      ensureCabinetCarousels();
      delete data.cabinetCarousels[cabinetId];
      saveData(data);
      toast('已清空该柜机轮播', 'success');
      const { route } = typeof parseHash === 'function' ? parseHash() : { route: 'cabinet' };
      if (route === 'cabinet-detail') {
        navigate('cabinet-detail', { id: cabinetId });
      } else {
        openTab('cabinet');
      }
    },
  });
}

/* —— 添加图片：本地上传 —— */
let carouselUploadPending = null; // { name, url }

function openAddCarouselItemModal() {
  if (!carouselEditDraft) return;
  if (carouselEditDraft.items.length >= CABINET_CAROUSEL_LIMIT) {
    toast(`单柜最多 ${CABINET_CAROUSEL_LIMIT} 条素材`, 'warning');
    return;
  }

  carouselUploadPending = null;
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = '添加图片';
  if (subtitle) {
    subtitle.style.display = '';
    subtitle.textContent = `建议尺寸 ${CABINET_AD_SIZE.width}×${CABINET_AD_SIZE.height}，支持 jpg / png / webp`;
  }

  document.getElementById('modal-body').innerHTML = `
    <div class="form-section" style="margin:0">
      <div class="form-row">
        <div class="form-item full">
          <label class="form-label"><span class="required">*</span>上传图片</label>
          <div class="carousel-upload-dropzone" id="cc-upload-dropzone">
            <div class="carousel-upload-empty" id="cc-upload-empty">
              <div class="batch-import-dropzone-icon">🖼</div>
              <p class="batch-import-dropzone-text">拖动或点击上传图片</p>
              <p class="form-hint" style="margin:8px 0 0">单次选择 1 张图片</p>
            </div>
            <div class="carousel-upload-preview" id="cc-upload-preview" hidden>
              <img id="cc-upload-preview-img" alt="预览">
              <div class="carousel-upload-meta">
                <span id="cc-upload-preview-name"></span>
                <button type="button" class="btn-link" id="cc-upload-remove">重新选择</button>
              </div>
            </div>
          </div>
          <input type="file" id="cc-upload-input" hidden accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif">
        </div>
      </div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer modal-footer--center';
    footer.innerHTML = `
      <button type="button" class="btn" id="cc-add-cancel">取消</button>
      <button type="button" class="btn btn-primary" id="cc-add-ok">添加</button>
    `;
  }

  modal?.classList.remove('modal-xl', 'modal-sm');
  modal?.classList.add('modal-md');
  document.getElementById('modal-overlay').hidden = false;

  const dropzone = document.getElementById('cc-upload-dropzone');
  const fileInput = document.getElementById('cc-upload-input');

  const pickFile = () => fileInput?.click();
  dropzone?.addEventListener('click', (e) => {
    if (e.target.closest('#cc-upload-remove')) return;
    pickFile();
  });
  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('carousel-upload-dropzone--active');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('carousel-upload-dropzone--active');
  });
  dropzone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('carousel-upload-dropzone--active');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleCarouselUploadFile(file);
  });
  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) handleCarouselUploadFile(file);
  });

  document.getElementById('cc-upload-remove')?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearCarouselUploadPending();
  });
  document.getElementById('cc-add-cancel')?.addEventListener('click', () => {
    clearCarouselUploadPending();
    modal?.classList.remove('modal-md');
    closeModal();
  });
  document.getElementById('cc-add-ok')?.addEventListener('click', () => {
    if (!carouselUploadPending?.url) {
      toast('请先上传图片', 'warning');
      return;
    }
    if (carouselEditDraft.items.length >= CABINET_CAROUSEL_LIMIT) {
      toast(`单柜最多 ${CABINET_CAROUSEL_LIMIT} 条素材`, 'warning');
      return;
    }
    carouselEditDraft.items.push({
      id: `cc-${genId()}`,
      type: 'image',
      name: carouselUploadPending.name,
      url: carouselUploadPending.url,
    });
    carouselPreviewIndex = carouselEditDraft.items.length - 1;
    clearCarouselUploadPending();
    modal?.classList.remove('modal-md');
    closeModal();
    toast('已添加图片', 'success');
    refreshCarouselEditPage();
  });
}

function handleCarouselUploadFile(file) {
  if (!file.type.startsWith('image/')) {
    toast('请上传图片文件', 'warning');
    return;
  }
  const maxMb = 10;
  if (file.size > maxMb * 1024 * 1024) {
    toast(`图片大小不能超过 ${maxMb}MB`, 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    carouselUploadPending = { name: file.name, url: reader.result };
    refreshCarouselUploadUI();
  };
  reader.onerror = () => toast('图片读取失败', 'error');
  reader.readAsDataURL(file);
}

function clearCarouselUploadPending() {
  carouselUploadPending = null;
  refreshCarouselUploadUI();
}

function refreshCarouselUploadUI() {
  const empty = document.getElementById('cc-upload-empty');
  const preview = document.getElementById('cc-upload-preview');
  const img = document.getElementById('cc-upload-preview-img');
  const nameEl = document.getElementById('cc-upload-preview-name');
  if (!empty || !preview) return;
  if (carouselUploadPending?.url) {
    empty.hidden = true;
    preview.hidden = false;
    if (img) img.src = carouselUploadPending.url;
    if (nameEl) nameEl.textContent = carouselUploadPending.name || '已选图片';
  } else {
    empty.hidden = false;
    preview.hidden = true;
    if (img) img.removeAttribute('src');
    if (nameEl) nameEl.textContent = '';
  }
}

/* —— 「查看轮播」预览弹窗（列表仅序号、素材名称） —— */
function openCarouselPreviewModal(cabinetId) {
  const cab = data.cabinets.find(c => c.id === cabinetId);
  const items = getCarouselItems(cabinetId);
  const imageDuration = getCabinetCarouselImageDuration();
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = `轮播预览 · ${cab?.name || cabinetId}`;
  if (subtitle) {
    subtitle.style.display = '';
    subtitle.textContent = `广告区 ${CABINET_AD_SIZE.width}×${CABINET_AD_SIZE.height} · ${summarizeCarouselItems(items)} · 图片停留 ${imageDuration} 秒`;
  }

  let idx = 0;
  const renderBody = () => {
    const it = items[idx];
    document.getElementById('modal-body').innerHTML = items.length ? `
      <div class="carousel-ad-preview-wrap">
        <div class="carousel-ad-preview">
          <img class="carousel-ad-preview-media" src="${it.url}" alt="${esc(it.name)}">
          <div class="carousel-ad-preview-caption">${esc(it.name)}</div>
        </div>
        ${items.length > 1 ? `
          <div class="carousel-ad-preview-nav">
            <button type="button" class="btn" id="cc-view-prev">上一则</button>
            <span class="form-hint" style="margin:0">${idx + 1} / ${items.length}</span>
            <button type="button" class="btn" id="cc-view-next">下一则</button>
          </div>
        ` : ''}
        <div class="table-wrap" style="margin-top:16px">
          <table class="data-table">
            <thead><tr><th>序号</th><th>素材名称</th></tr></thead>
            <tbody>
              ${items.map((row, i) => `
                <tr class="${i === idx ? 'carousel-row-active' : ''}">
                  <td>${i + 1}</td>
                  <td>${esc(row.name)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : `<p class="form-hint" style="text-align:center;padding:32px 0">该柜机尚未配置轮播素材</p>`;

    document.getElementById('cc-view-prev')?.addEventListener('click', () => {
      idx = (idx - 1 + items.length) % items.length;
      renderBody();
    });
    document.getElementById('cc-view-next')?.addEventListener('click', () => {
      idx = (idx + 1) % items.length;
      renderBody();
    });
  };

  renderBody();

  if (footer) {
    footer.style.display = '';
    footer.innerHTML = `
      <button type="button" class="btn" id="cc-view-close">关闭</button>
      <button type="button" class="btn btn-primary" id="cc-view-edit">去配置</button>
    `;
  }

  modal?.classList.remove('modal-sm');
  modal?.classList.add('modal-xl');
  document.getElementById('modal-overlay').hidden = false;

  document.getElementById('cc-view-close')?.addEventListener('click', () => closeModal());
  document.getElementById('cc-view-edit')?.addEventListener('click', () => {
    closeModal();
    openTab('cabinet-carousel', '配置轮播', { id: cabinetId });
  });
}
