/* 标签管理 · 新增/编辑标签弹窗 */

let addTagEditId = null;

function openAddTagModal() {
  addTagEditId = null;
  renderAddTagModal();
  document.getElementById('modal-overlay').hidden = false;
}

function openEditTagModal(tagId) {
  const tag = data.tags.find(t => t.id === +tagId);
  if (!tag) return;
  addTagEditId = tag.id;
  renderAddTagModal(tag);
  document.getElementById('modal-overlay').hidden = false;
}

function renderAddTagModal(editing) {
  const isEdit = editing != null;
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');
  const labelText = isEdit ? '编辑标签' : '新增标签';

  document.getElementById('modal-title').textContent = labelText;
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }

  modal?.classList.remove('modal-xl', 'modal-sm');
  modal?.classList.add('modal-md');

  document.getElementById('modal-body').innerHTML = `
    <div class="add-tag-modal">
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>${labelText}</label>
        <input class="input add-tag-input" placeholder="请输入" id="add-tag-name" value="${isEdit ? esc(editing.name) : ''}">
      </div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer modal-footer--center';
    footer.innerHTML = `
      <button type="button" class="btn" onclick="closeAddTagModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="saveAddTagModal()">保存</button>
    `;
  }

  document.getElementById('add-tag-name')?.focus();
}

function getNextTagId() {
  const ids = data.tags.map(t => t.id);
  return ids.length ? Math.max(...ids) + 1 : 1;
}

function saveAddTagModal() {
  const name = document.getElementById('add-tag-name')?.value?.trim();
  if (!name) {
    toast('请填写标签名称', 'warning');
    return;
  }
  const duplicate = data.tags.find(t => t.name === name && t.id !== addTagEditId);
  if (duplicate) {
    toast('标签名称已存在', 'warning');
    return;
  }

  if (addTagEditId != null) {
    const tag = data.tags.find(t => t.id === addTagEditId);
    if (!tag) return;
    const oldName = tag.name;
    tag.name = name;
    tag.updatedAt = now();
    if (oldName !== name) {
      data.contents.forEach(c => {
        if (Array.isArray(c.tags)) {
          c.tags = c.tags.map(t => (t === oldName ? name : t));
        }
      });
    }
  } else {
    const time = now();
    data.tags.push({
      id: getNextTagId(),
      name,
      contentCount: 0,
      status: 'enabled',
      createdAt: time,
      updatedAt: time,
    });
  }

  saveData(data);
  closeAddTagModal();
  toast('保存成功', 'success');
  navigate('tag');
}

function resetAddTagModalUI() {
  addTagEditId = null;
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-md', 'modal-sm');
  modal?.classList.add('modal-xl');
  const footer = document.getElementById('modal-footer');
  if (footer) footer.className = 'modal-footer';
}

function closeAddTagModal() {
  resetAddTagModalUI();
  closeModal();
}
