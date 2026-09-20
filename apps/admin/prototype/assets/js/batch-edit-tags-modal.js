/* 内容管理 · 批量修改标签弹窗 */

let batchEditTagsSelected = ['标签1', '标签2'];
let batchTagsDropdownOpen = false;

function openBatchEditTagsModal() {
  const count = getSelectedContentCount();
  if (count < 1) {
    toast('请先选择要修改的内容', 'warning');
    return;
  }
  batchEditTagsSelected = ['标签1', '标签2'];
  batchTagsDropdownOpen = false;
  renderBatchEditTagsModal(count);
  document.getElementById('modal-overlay').hidden = false;
}

function renderBatchEditTagsModal(count) {
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = '批量修改标签';
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }

  modal?.classList.remove('modal-xl', 'modal-sm');
  modal?.classList.add('modal-md');

  document.getElementById('modal-body').innerHTML = `
    <div class="batch-tags-modal">
      <p class="batch-tags-count">已选择${count}条内容</p>
      <div class="batch-tags-field">
        <label class="batch-tags-label">修改标签为</label>
        <div class="tag-multi-select${batchTagsDropdownOpen ? ' is-open' : ''}" id="batch-tags-select">
          <div class="tag-multi-select-control" onclick="toggleBatchTagsDropdown(event)">
            <div class="tag-multi-select-inner" id="batch-tags-chips">
              ${renderBatchTagsChips()}
            </div>
            <span class="tag-multi-select-arrow">▾</span>
          </div>
          <div class="tag-multi-select-dropdown" id="batch-tags-dropdown"${batchTagsDropdownOpen ? '' : ' hidden'}>
            ${renderBatchTagsDropdownOptions()}
          </div>
        </div>
      </div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer modal-footer--center';
    footer.innerHTML = `
      <button type="button" class="btn" onclick="closeBatchEditTagsModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="confirmBatchEditTags()">确定</button>
    `;
  }
}

function renderBatchTagsChips() {
  if (!batchEditTagsSelected.length) {
    return '<span class="tag-multi-select-placeholder">请选择标签</span>';
  }
  return batchEditTagsSelected.map(tag => `
    <span class="tag-chip">
      ${esc(tag)}
      <button type="button" class="tag-chip-remove" onclick="removeBatchEditTag('${String(tag).replace(/'/g, "\\'")}', event)" aria-label="移除">×</button>
    </span>
  `).join('');
}

function getBatchEditTagOptions() {
  return data.tags.filter(t => t.status === 'enabled').map(t => t.name);
}

function renderBatchTagsDropdownOptions() {
  const options = getBatchEditTagOptions().filter(name => !batchEditTagsSelected.includes(name));
  if (!options.length) {
    return '<div class="tag-multi-select-option tag-multi-select-option--empty">暂无可选标签</div>';
  }
  return options.map(name => `
    <button type="button" class="tag-multi-select-option" onclick="addBatchEditTag('${String(name).replace(/'/g, "\\'")}')">${esc(name)}</button>
  `).join('');
}

function toggleBatchTagsDropdown(event) {
  event?.stopPropagation();
  if (event?.target.closest('.tag-chip-remove')) return;
  batchTagsDropdownOpen = !batchTagsDropdownOpen;
  const select = document.getElementById('batch-tags-select');
  const dropdown = document.getElementById('batch-tags-dropdown');
  if (select) select.classList.toggle('is-open', batchTagsDropdownOpen);
  if (dropdown) dropdown.hidden = !batchTagsDropdownOpen;
}

function addBatchEditTag(name) {
  if (!batchEditTagsSelected.includes(name)) {
    batchEditTagsSelected.push(name);
  }
  batchTagsDropdownOpen = false;
  refreshBatchTagsChips();
}

function removeBatchEditTag(name, event) {
  event?.stopPropagation();
  batchEditTagsSelected = batchEditTagsSelected.filter(t => t !== name);
  refreshBatchTagsChips();
}

function refreshBatchTagsChips() {
  const chips = document.getElementById('batch-tags-chips');
  const dropdown = document.getElementById('batch-tags-dropdown');
  const select = document.getElementById('batch-tags-select');
  if (chips) chips.innerHTML = renderBatchTagsChips();
  if (dropdown) dropdown.innerHTML = renderBatchTagsDropdownOptions();
  if (select) select.classList.toggle('is-open', batchTagsDropdownOpen);
  if (dropdown) dropdown.hidden = !batchTagsDropdownOpen;
}

function confirmBatchEditTags() {
  if (!batchEditTagsSelected.length) {
    toast('请选择至少一个标签', 'warning');
    return;
  }
  const ids = new Set(getSelectedContentCheckboxes().map(cb => +cb.dataset.id));
  data.contents.forEach(c => {
    if (ids.has(c.id)) c.tags = [...batchEditTagsSelected];
  });
  saveData(data);
  closeBatchEditTagsModal();
  toast('修改成功', 'success');
  navigate('content');
}

function resetBatchEditTagsModalUI() {
  batchEditTagsSelected = [];
  batchTagsDropdownOpen = false;
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-md', 'modal-sm');
  modal?.classList.add('modal-xl');
  const footer = document.getElementById('modal-footer');
  if (footer) footer.className = 'modal-footer';
}

function closeBatchEditTagsModal() {
  resetBatchEditTagsModalUI();
  closeModal();
}

document.addEventListener('click', e => {
  if (!batchTagsDropdownOpen) return;
  if (e.target.closest('#batch-tags-select')) return;
  batchTagsDropdownOpen = false;
  document.getElementById('batch-tags-select')?.classList.remove('is-open');
  const dropdown = document.getElementById('batch-tags-dropdown');
  if (dropdown) dropdown.hidden = true;
});
