/* 平板设备 · 编辑弹窗 */

let editTabletId = null;

function openEditTabletModal(tabletId) {
  const tablet = data.tablets.find(t => t.id === tabletId);
  if (!tablet) return;
  editTabletId = tablet.id;
  renderEditTabletModal(tablet);
  document.getElementById('modal-overlay').hidden = false;
}

function renderCabinetSlotOptions(cabinetId, selectedSlot) {
  const cab = data.cabinets.find(c => c.id === cabinetId);
  if (!cab) return '<option value="">请选择柜机</option>';
  return Array.from({ length: cab.totalSlots }, (_, i) => i + 1).map(n =>
    `<option value="${n}"${n === selectedSlot ? ' selected' : ''}>#${n}</option>`
  ).join('');
}

function onEditTabletCabinetChange() {
  const cabinetId = document.getElementById('edit-tablet-cabinet')?.value;
  const slotSelect = document.getElementById('edit-tablet-slot');
  if (!slotSelect) return;
  const cab = data.cabinets.find(c => c.id === cabinetId);
  if (!cab) {
    slotSelect.innerHTML = '<option value="">—</option>';
    return;
  }
  slotSelect.innerHTML = renderCabinetSlotOptions(cabinetId, 1);
}

function renderEditTabletModal(tablet) {
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = '编辑设备';
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }

  modal?.classList.remove('modal-xl', 'modal-sm');
  modal?.classList.add('modal-md');

  document.getElementById('modal-body').innerHTML = `
    <div class="edit-tablet-modal device-form-modal">
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>SN 序列号</label>
        <input class="input add-tag-input" id="edit-tablet-sn" value="${esc(tablet.sn)}">
      </div>
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>型号</label>
        <input class="input add-tag-input" id="edit-tablet-model" value="${esc(tablet.model)}">
      </div>
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>所属柜机</label>
        <select class="select add-tag-input" id="edit-tablet-cabinet" style="width:100%" onchange="onEditTabletCabinetChange()">
          ${data.cabinets.map(c => `<option value="${c.id}"${c.id === tablet.cabinetId ? ' selected' : ''}>${esc(c.name)}（${esc(c.id)}）</option>`).join('')}
        </select>
      </div>
      <div class="add-tag-field">
        <label class="add-tag-label"><span class="required">*</span>仓位</label>
        <select class="select add-tag-input" id="edit-tablet-slot" style="width:100%">
          ${renderCabinetSlotOptions(tablet.cabinetId, tablet.slotNo)}
        </select>
      </div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer modal-footer--center';
    footer.innerHTML = `
      <button type="button" class="btn" onclick="closeEditTabletModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="saveEditTabletModal()">保存</button>
    `;
  }
}

function recalcCabinetUsedSlots() {
  data.cabinets.forEach(cab => {
    cab.usedSlots = data.tablets.filter(t => t.cabinetId === cab.id).length;
  });
}

function saveEditTabletModal() {
  const tablet = data.tablets.find(t => t.id === editTabletId);
  if (!tablet) return;

  const sn = document.getElementById('edit-tablet-sn')?.value?.trim();
  const model = document.getElementById('edit-tablet-model')?.value?.trim();
  const cabinetId = document.getElementById('edit-tablet-cabinet')?.value;
  const slotNo = parseInt(document.getElementById('edit-tablet-slot')?.value, 10);

  if (!sn) {
    toast('请填写 SN 序列号', 'warning');
    return;
  }
  if (!model) {
    toast('请填写型号', 'warning');
    return;
  }
  if (!cabinetId) {
    toast('请选择所属柜机', 'warning');
    return;
  }
  if (!slotNo || Number.isNaN(slotNo)) {
    toast('请选择仓位', 'warning');
    return;
  }

  const duplicateSn = data.tablets.find(t => t.sn === sn && t.id !== tablet.id);
  if (duplicateSn) {
    toast('SN 已存在', 'warning');
    return;
  }

  const cab = data.cabinets.find(c => c.id === cabinetId);
  if (slotNo < 1 || slotNo > cab.totalSlots) {
    toast('仓位超出柜机格口范围', 'warning');
    return;
  }

  const slotTaken = data.tablets.find(t =>
    t.id !== tablet.id && t.cabinetId === cabinetId && t.slotNo === slotNo
  );
  if (slotTaken) {
    toast(`仓位 #${slotNo} 已被设备 ${slotTaken.id} 占用`, 'warning');
    return;
  }

  tablet.sn = sn;
  tablet.model = model;
  tablet.cabinetId = cabinetId;
  tablet.slotNo = slotNo;

  data.usageRecords.forEach(r => {
    if (r.tabletId === tablet.id) r.sn = sn;
  });

  recalcCabinetUsedSlots();
  saveData(data);
  closeEditTabletModal();
  toast('保存成功', 'success');
  navigate('tablet');
}

function resetEditTabletModalUI() {
  editTabletId = null;
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-md', 'modal-sm');
  modal?.classList.add('modal-xl');
  const footer = document.getElementById('modal-footer');
  if (footer) footer.className = 'modal-footer';
}

function closeEditTabletModal() {
  resetEditTabletModalUI();
  closeModal();
}
