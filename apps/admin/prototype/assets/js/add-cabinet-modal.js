/* 柜机管理 · 添加/编辑柜机弹窗 */

let editCabinetId = null;

function openAddCabinetModal() {
  editCabinetId = null;
  renderCabinetFormModal();
  document.getElementById('modal-overlay').hidden = false;
}

function openEditCabinetModal(cabinetId) {
  const cab = data.cabinets.find(c => c.id === cabinetId);
  if (!cab) return;
  editCabinetId = cab.id;
  renderCabinetFormModal(cab);
  document.getElementById('modal-overlay').hidden = false;
}

function renderCabinetFormModal(cabinet) {
  const isEdit = !!cabinet;
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = isEdit ? '编辑柜机' : '添加柜机';
  if (subtitle) {
    subtitle.textContent = isEdit
      ? '在线状态、最近心跳由供应商上报，仅可查看'
      : '';
    subtitle.style.display = isEdit ? '' : 'none';
  }

  modal?.classList.remove('modal-xl', 'modal-sm');
  modal?.classList.add('modal-md');

  const readonlyBlock = isEdit ? `
    <div class="device-form-readonly">
      <div class="device-form-readonly-item"><label>柜机 ID</label><span>${esc(cabinet.id)}</span></div>
      <div class="device-form-readonly-item"><label>格口数量</label><span>${cabinet.totalSlots}（已占用 ${cabinet.usedSlots}）</span></div>
      <div class="device-form-readonly-item"><label>在线状态</label><span>${cabinet.online ? '<span class="tag tag-green">在线</span>' : '<span class="tag tag-red">离线</span>'}</span></div>
      <div class="device-form-readonly-item"><label>最近心跳</label><span>${esc(cabinet.lastHeartbeat)}</span></div>
    </div>
  ` : '';

  document.getElementById('modal-body').innerHTML = `
    <div class="add-cabinet-modal device-form-modal">
      ${readonlyBlock}
      ${isEdit ? '' : `
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>柜机 ID</label>
        <input class="input add-tag-input" id="add-cabinet-id" placeholder="如 CAB-004" value="${esc(getNextCabinetId())}">
      </div>`}
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>柜机名称</label>
        <input class="input add-tag-input" id="add-cabinet-name" placeholder="请输入" value="${isEdit ? esc(cabinet.name) : ''}">
      </div>
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>安装位置</label>
        <input class="input add-tag-input" id="add-cabinet-location" placeholder="请输入" value="${isEdit ? esc(cabinet.location) : ''}">
      </div>
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>绑定手机号</label>
        <input class="input add-tag-input" id="add-cabinet-bound-phone" type="tel" maxlength="11" placeholder="请输入 11 位手机号" value="${isEdit && cabinet.boundPhone && cabinet.boundPhone !== '—' ? esc(cabinet.boundPhone) : ''}">
      </div>
      <div class="add-tag-field">
        <label class="add-tag-label">负责人</label>
        <input class="input add-tag-input" id="add-cabinet-manager" placeholder="请输入（选填）" value="${isEdit && cabinet.manager !== '—' ? esc(cabinet.manager) : ''}">
      </div>
      <div class="add-tag-field">
        <label class="add-tag-label">负责人联系方式</label>
        <input class="input add-tag-input" id="add-cabinet-manager-contact" placeholder="请输入手机号（选填）" value="${isEdit && cabinet.managerContact && cabinet.managerContact !== '—' ? esc(cabinet.managerContact) : ''}">
      </div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer modal-footer--center';
    footer.innerHTML = `
      <button type="button" class="btn" onclick="closeAddCabinetModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="saveCabinetFormModal()">确定</button>
    `;
  }

  document.getElementById(isEdit ? 'add-cabinet-name' : 'add-cabinet-id')?.focus();
}

function renderAddCabinetModal() {
  renderCabinetFormModal();
}

function getNextCabinetId() {
  const nums = data.cabinets.map(c => {
    const m = String(c.id).match(/CAB-(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `CAB-${String(next).padStart(3, '0')}`;
}

function saveCabinetFormModal() {
  const cabinetId = document.getElementById('add-cabinet-id')?.value?.trim();
  const name = document.getElementById('add-cabinet-name')?.value?.trim();
  const location = document.getElementById('add-cabinet-location')?.value?.trim();
  const boundPhone = document.getElementById('add-cabinet-bound-phone')?.value?.trim();
  const manager = document.getElementById('add-cabinet-manager')?.value?.trim();
  const managerContact = document.getElementById('add-cabinet-manager-contact')?.value?.trim();

  if (!name) {
    toast('请填写柜机名称', 'warning');
    return;
  }
  if (!location) {
    toast('请填写安装位置', 'warning');
    return;
  }
  if (!boundPhone) {
    toast('请填写绑定手机号', 'warning');
    return;
  }
  if (!/^1\d{10}$/.test(boundPhone)) {
    toast('绑定手机号格式不正确，请输入 11 位手机号', 'warning');
    return;
  }

  if (editCabinetId) {
    const cab = data.cabinets.find(c => c.id === editCabinetId);
    if (!cab) return;
    const duplicate = data.cabinets.find(c => c.name === name && c.id !== editCabinetId);
    if (duplicate) {
      toast('柜机名称已存在', 'warning');
      return;
    }
    cab.name = name;
    cab.location = location;
    cab.boundPhone = boundPhone;
    cab.manager = manager || '—';
    cab.managerContact = managerContact || '—';
    saveData(data);
    closeAddCabinetModal();
    toast('保存成功', 'success');
    navigate('cabinet');
    return;
  }

  const duplicate = data.cabinets.find(c => c.name === name);
  if (duplicate) {
    toast('柜机名称已存在', 'warning');
    return;
  }
  if (!cabinetId) {
    toast('请填写柜机 ID', 'warning');
    return;
  }
  if (data.cabinets.some(c => c.id === cabinetId)) {
    toast('柜机 ID 已存在', 'warning');
    return;
  }

  data.cabinets.push({
    id: cabinetId,
    name,
    location,
    totalSlots: 0,
    usedSlots: 0,
    online: false,
    lastHeartbeat: '—',
    boundPhone: boundPhone,
    manager: manager || '—',
    managerContact: managerContact || '—',
  });
  saveData(data);
  closeAddCabinetModal();
  toast('添加成功', 'success');
  navigate('cabinet');
}

function saveAddCabinetModal() {
  saveCabinetFormModal();
}

function resetAddCabinetModalUI() {
  editCabinetId = null;
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-md', 'modal-sm');
  modal?.classList.add('modal-xl');
  const footer = document.getElementById('modal-footer');
  if (footer) footer.className = 'modal-footer';
}

function closeAddCabinetModal() {
  resetAddCabinetModalUI();
  closeModal();
}
