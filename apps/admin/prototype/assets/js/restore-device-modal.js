/* 平板设备 · 设备还原弹窗 */

let deviceRestoreValidSns = [];

function parseDeviceRestoreSnList(text) {
  return [...new Set(String(text || '').split(/[\s,;，；\n]+/).map(s => s.trim()).filter(Boolean))];
}

function isEligibleScratchRestoreTablet(tablet) {
  if (!tablet) return false;
  if (resolveTabletDeviceState(tablet) !== 'abnormal') return false;
  if (!isTabletScratchDamaged(tablet)) return false;
  return tabletDeviceStatusNote(tablet).includes('设备擦伤');
}

function openRestoreDeviceModal() {
  deviceRestoreValidSns = [];
  renderRestoreDeviceModal();
  document.getElementById('modal-overlay').hidden = false;
}

function renderRestoreDeviceModal() {
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = '设备还原';
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }

  modal?.classList.remove('modal-xl', 'modal-sm');
  modal?.classList.add('modal-md');

  document.getElementById('modal-body').innerHTML = `
    <div class="restore-device-modal">
      <div class="add-tag-field">
        <label class="add-tag-label">设备 SN</label>
        <textarea class="input restore-device-sn-input" id="device-restore-sn-input" rows="4" placeholder="请输入设备 SN，多个 SN 可用换行、逗号或分号分隔"></textarea>
        <p class="form-hint">仅支持将「异常 · 设备擦伤」状态的设备还原为正常</p>
      </div>
      <div class="restore-device-check-row">
        <button type="button" class="btn btn-primary" onclick="checkDeviceRestore()">检测</button>
      </div>
      <div id="device-restore-check-msg" class="restore-device-check-msg"></div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer';
    footer.innerHTML = `
      <button type="button" class="btn" onclick="closeRestoreDeviceModal()">取消</button>
      <button type="button" class="btn btn-primary" id="device-restore-submit-btn" disabled onclick="submitDeviceRestore()">一键还原</button>
    `;
  }

  setDeviceRestoreSubmitEnabled(false);
  document.getElementById('device-restore-sn-input')?.addEventListener('input', onDeviceRestoreSnInputChange);
}

function onDeviceRestoreSnInputChange() {
  deviceRestoreValidSns = [];
  updateDeviceRestoreCheckMessage('');
  setDeviceRestoreSubmitEnabled(false);
}

function updateDeviceRestoreCheckMessage(html) {
  const msgEl = document.getElementById('device-restore-check-msg');
  if (msgEl) msgEl.innerHTML = html;
}

function setDeviceRestoreSubmitEnabled(enabled) {
  const btn = document.getElementById('device-restore-submit-btn');
  if (btn) btn.disabled = !enabled;
}

function checkDeviceRestore() {
  const sns = parseDeviceRestoreSnList(document.getElementById('device-restore-sn-input')?.value);
  if (!sns.length) {
    deviceRestoreValidSns = [];
    updateDeviceRestoreCheckMessage('<div class="import-result-fail">请输入设备 SN</div>');
    setDeviceRestoreSubmitEnabled(false);
    return;
  }

  const invalid = [];
  const valid = [];

  sns.forEach(sn => {
    const tablet = data.tablets.find(t => t.sn === sn);
    if (!tablet || !isEligibleScratchRestoreTablet(tablet)) invalid.push(sn);
    else valid.push(sn);
  });

  if (invalid.length) {
    deviceRestoreValidSns = [];
    updateDeviceRestoreCheckMessage(
      `<div class="import-result-fail">查询异常，${invalid.map(s => esc(s)).join('；')}非异常（设备擦伤）状态，请删除后重试！</div>`
    );
    setDeviceRestoreSubmitEnabled(false);
    return;
  }

  deviceRestoreValidSns = valid;
  updateDeviceRestoreCheckMessage('<div class="restore-device-check-success">查询成功，可将设备还原成正常状态！</div>');
  setDeviceRestoreSubmitEnabled(true);
}

function restoreTabletScratchDamage(tablet) {
  tablet.condition = 'normal';
  if (tablet.status === 'maintenance') tablet.status = 'in_cabinet';
  if (tablet.slotState === 'maintenance' || tablet.slotState === 'abnormal') tablet.slotState = 'used';
  (data.deviceAlerts || []).forEach(alert => {
    if (alert.tabletId === tablet.id && alert.status === 'pending' && alert.type === 'damage') {
      alert.status = 'resolved';
    }
  });
}

function submitDeviceRestore() {
  const submitBtn = document.getElementById('device-restore-submit-btn');
  if (submitBtn?.disabled || !deviceRestoreValidSns.length) {
    toast('请先检测并确认可还原的设备', 'warning');
    return;
  }

  const tablets = deviceRestoreValidSns
    .map(sn => data.tablets.find(t => t.sn === sn))
    .filter(t => t && isEligibleScratchRestoreTablet(t));

  if (!tablets.length) {
    toast('设备状态已变化，请重新检测', 'warning');
    checkDeviceRestore();
    return;
  }

  tablets.forEach(restoreTabletScratchDamage);
  saveData(data);
  toast(`已成功还原 ${tablets.length} 台设备`, 'success');
  closeRestoreDeviceModal();
  navigate('tablet');
}

function closeRestoreDeviceModal() {
  deviceRestoreValidSns = [];
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-md');
  modal?.classList.add('modal-xl');
  closeModal();
}
