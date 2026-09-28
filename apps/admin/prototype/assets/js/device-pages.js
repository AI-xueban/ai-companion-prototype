/* 设备管理 · 学习平板借租柜 */

function getTabletPendingAlerts(tabletId) {
  return (data.deviceAlerts || []).filter(a => a.tabletId === tabletId && a.status !== 'resolved');
}

function isTabletScratchDamaged(tablet) {
  return tablet?.condition === 'damaged' || tablet?.condition === 'scratch';
}

function isTabletDoorOpenAbnormal(tablet) {
  return tablet?.status === 'in_cabinet' && tablet?.doorStatus === 'open';
}

function isTabletAbnormal(tablet) {
  if (!tablet) return false;
  if (isTabletScratchDamaged(tablet)) return true;
  if (tablet.isOverdue) return true;
  if (isTabletDoorOpenAbnormal(tablet)) return true;
  if (getTabletPendingAlerts(tablet.id).some(a => !['return_door_open', 'return_not_charging'].includes(a.type))) return true;
  return false;
}

function resolveTabletDeviceState(tablet) {
  if (!tablet) return null;
  if (isTabletAbnormal(tablet)) return 'abnormal';
  if (tablet.status === 'borrowed') return 'borrowed';
  if (tablet.status === 'in_cabinet') return 'charging';
  return 'borrowed';
}

function getTabletDeviceStatusLabel(tablet) {
  const labels = { charging: '充电中', borrowed: '已借出', abnormal: '异常' };
  return labels[resolveTabletDeviceState(tablet)] || '已借出';
}

function tabletDeviceStatusTag(tablet) {
  if (!tablet) return '';
  const map = {
    charging: '<span class="tag tag-green">充电中</span>',
    borrowed: '<span class="tag tag-device-out">已借出</span>',
    abnormal: '<span class="tag tag-alert-pending">异常</span>',
  };
  return map[resolveTabletDeviceState(tablet)] || esc(resolveTabletDeviceState(tablet));
}

function tabletDeviceStatusNote(tablet) {
  if (!tablet) return '—';
  if (resolveTabletDeviceState(tablet) === 'abnormal') {
    const notes = [];
    if (isTabletScratchDamaged(tablet)) notes.push('设备擦伤');
    if (tablet.isOverdue) notes.push('借出满24小时未归还');
    if (isTabletDoorOpenAbnormal(tablet)) notes.push('未关门');
    getTabletPendingAlerts(tablet.id).forEach(a => {
      const text = alertContentText(a);
      if (text && !notes.includes(text)) notes.push(text);
    });
    return notes.length ? notes.join('；') : '—';
  }
  if (tablet.status === 'borrowed') {
    const record = data.usageRecords.find(r => r.tabletId === tablet.id && r.status === 'borrowed' && r.returnAttempt);
    const issue = record?.returnAttempt?.issue;
    if (issue === 'door_open') return '归还未关门';
    if (issue === 'not_charging') return '归还未充电';
    if (issue === 'misplaced') return '疑似误放';
    if (record?.returnAttempt?.status === 'cancelled') return '归还已取消';
  }
  return '—';
}

function isReturnCloseFinalNormal(record) {
  const pd = record?.placementDetection;
  if (pd) return pd.doorStatus === 'closed' && pd.charging === true;
  return !!record?.returnAt;
}

function isUsageRecordOverdue(r) {
  return !!r?.overdue;
}

function isUsageRecordReturnAbnormal(r) {
  if (!r) return false;
  const issue = r.returnAttempt?.issue;
  if (issue && issue !== 'door_open') return true;
  if (r.returnAttempt?.status === 'cancelled') return true;
  const ai = r.returnInspection?.aiResult;
  if (ai && ai !== 'normal') return true;
  if (r.alertId) return true;
  if (r.returnAt && !isReturnCloseFinalNormal(r)) return true;
  if (r.returnAlertIds?.length && !isReturnCloseFinalNormal(r)) return true;
  return false;
}

function isUsageRecordDoorOpen(r) {
  if (!r) return false;
  // 归还流程中门未关；借出后门开未取由取消借用分支覆盖，此处仅处理归还门未关
  if (r.returnAttempt?.status === 'pending' && r.returnAttempt?.issue === 'door_open') return true;
  return false;
}

function resolveUsageRecordState(r) {
  if (r?.status === 'cancelled') return 'cancelled';
  if (r.returnAt || r.status === 'returned') {
    return isUsageRecordReturnAbnormal(r) ? 'return_abnormal' : 'returned';
  }
  if (isUsageRecordOverdue(r)) return 'overdue';
  if (isUsageRecordDoorOpen(r)) return 'door_open';
  if (isUsageRecordReturnAbnormal(r)) return 'return_abnormal';
  return 'borrowed';
}

function usageRecordStateTag(r) {
  const map = {
    door_open: '<span class="tag tag-alert-pending">开门中</span>',
    returned: '<span class="tag tag-device-in">已归还</span>',
    borrowed: '<span class="tag tag-device-out">借出中</span>',
    return_abnormal: '<span class="tag tag-alert-pending">归还异常</span>',
    overdue: '<span class="tag tag-device-damaged">已逾期</span>',
    cancelled: '<span class="tag tag-gray">取消借用</span>',
  };
  return map[resolveUsageRecordState(r)] || esc(resolveUsageRecordState(r));
}

function cancelReasonNote(r) {
  if (r?.cancelReason === 'charger_connected') return '未取出设备';
  if (r?.status === 'cancelled' || r?.cancelReason) return '取消借用';
  return '取消借用';
}

function usageRecordStateNote(r) {
  if (resolveUsageRecordState(r) === 'cancelled') return cancelReasonNote(r);
  const notes = [];
  if (r.returnAttempt?.status === 'cancelled') notes.push('归还已取消，设备仍借出');
  if (r.returnAttempt?.issue === 'door_open') notes.push('柜门未关，待重试');
  if (r.returnAttempt?.issue === 'not_charging') notes.push('设备未充电，待重试');
  if (r.returnAttempt?.issue === 'misplaced') notes.push('疑似误放，设备仍借出');
  if (r.overdue) notes.push('借出满24小时未归还');
  if (r.returnInspection?.aiResult === 'scratch') {
    notes.push(r.returnInspection.detail || '外观对比发现擦伤');
  } else if (r.returnInspection?.aiResult === 'crack') {
    notes.push(r.returnInspection.detail || '外观对比发现划痕/破裂');
  }
  if (!notes.length && !isReturnCloseFinalNormal(r) && r.returnAlertIds?.length) {
    r.returnAlertIds.forEach(id => {
      const alert = data.deviceAlerts.find(a => a.id === id);
      if (alert) notes.push(alertContentText(alert));
    });
  }
  return notes.length ? notes.join('；') : '—';
}

function alertStatusTag(status) {
  const map = {
    pending: '<span class="tag tag-alert-pending">待处理</span>',
    resolved: '<span class="tag tag-alert-resolved">已解决</span>',
  };
  return map[status] || esc(status);
}

function aiResultTag(result) {
  if (result === 'normal') return '<span class="tag tag-green">正常</span>';
  if (result === 'scratch') return '<span class="tag tag-alert-pending">擦伤</span>';
  if (result === 'crack') return '<span class="tag tag-device-damaged">划痕/破裂</span>';
  return esc(result);
}

function renderPhotoCard(photo, type = 'device', labelOverride) {
  if (!photo) return '<span style="color:var(--text-muted)">—</span>';
  const icon = type === 'student' ? '👤' : type === 'damaged' ? '⚠️' : '📱';
  const cls = type === 'student' ? 'student' : type === 'damaged' ? 'damaged' : 'device';
  const title = labelOverride || photo.label || '照片';
  return `
    <div class="photo-card" onclick="toast('查看照片：${esc(title)}')" style="cursor:pointer">
      <div class="photo-card-thumb ${cls}">${icon}</div>
      <div class="photo-card-body">
        <div class="title">${esc(title)}</div>
        <div class="time">${photo.capturedAt || '—'}</div>
        ${photo.aiResult ? `<div style="margin-top:4px">${aiResultTag(photo.aiResult)}</div>` : ''}
      </div>
    </div>`;
}

function getReturnScreenPhotos(record) {
  if (!record) return [];
  if (Array.isArray(record.returnScreenPhotos) && record.returnScreenPhotos.length) {
    return record.returnScreenPhotos;
  }
  if (record.returnScreenPhoto) return [record.returnScreenPhoto];
  return [];
}

function getReturnScreenPhotoPrimary(record) {
  const photos = getReturnScreenPhotos(record);
  return photos[photos.length - 1] || null;
}

function renderReturnScreenPhotoGalleryButton(record) {
  const photos = getReturnScreenPhotos(record);
  if (!photos.length) return '<span style="color:var(--text-muted)">—</span>';
  return `<button type="button" class="btn dev-timeline-photo-btn" onclick="openReturnScreenPhotoGallery('${esc(record.id)}')">查看本次归还扫码屏拍照</button>`;
}

function openReturnScreenPhotoGallery(usageRecordId) {
  const record = data.usageRecords.find(r => r.id === usageRecordId);
  const photos = getReturnScreenPhotos(record);
  if (!photos.length) {
    toast('暂无归还扫码屏拍照', 'warning');
    return;
  }

  const initialPhoto = getTabletInitialPhoto(record.tabletId);
  let activeIndex = 0;
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = '本次归还扫码屏拍照';
  if (subtitle) {
    subtitle.style.display = '';
    subtitle.textContent = '上：初始入柜照 · 下：本次归还扫码连拍（可切换查看）';
  }

  const renderCarouselSlide = () => {
    const photo = photos[activeIndex];
    return `
      <div class="photo-gallery-carousel-slide">
        <div class="photo-gallery-carousel-thumb device">
          <span class="photo-gallery-carousel-icon">📱</span>
        </div>
        <div class="photo-gallery-carousel-meta">
          <span class="photo-gallery-carousel-index">图 ${activeIndex + 1} / ${photos.length}</span>
          <span class="photo-gallery-carousel-time">${esc(photo?.capturedAt || '—')}</span>
        </div>
      </div>`;
  };

  const renderBody = () => `
    <div class="photo-gallery-modal">
      <div class="photo-gallery-baseline">
        <div class="photo-gallery-section-label">初始入柜照</div>
        <div class="photo-gallery-baseline-view">
          <div class="photo-gallery-baseline-thumb device">
            <span class="photo-gallery-baseline-icon">📱</span>
          </div>
          <div class="photo-gallery-baseline-meta">
            <div class="photo-gallery-baseline-title">设备首次入柜屏幕照</div>
            <div class="photo-gallery-baseline-time">${esc(initialPhoto?.capturedAt || '—')}</div>
          </div>
        </div>
      </div>
      <div class="photo-gallery-carousel-section">
        <div class="photo-gallery-section-label">本次归还扫码屏拍照</div>
        <div class="photo-gallery-carousel">
          <button type="button" class="photo-gallery-arrow photo-gallery-arrow--prev" id="photo-gallery-prev" aria-label="上一张" ${photos.length < 2 ? 'disabled' : ''}>‹</button>
          <div id="photo-gallery-carousel-wrap">${renderCarouselSlide()}</div>
          <button type="button" class="photo-gallery-arrow photo-gallery-arrow--next" id="photo-gallery-next" aria-label="下一张" ${photos.length < 2 ? 'disabled' : ''}>›</button>
        </div>
      </div>
    </div>`;

  const refresh = () => {
    const wrap = document.getElementById('photo-gallery-carousel-wrap');
    if (wrap) wrap.innerHTML = renderCarouselSlide();
  };

  const shift = (delta) => {
    if (photos.length < 2) return;
    activeIndex = (activeIndex + delta + photos.length) % photos.length;
    refresh();
  };

  document.getElementById('modal-body').innerHTML = renderBody();

  modal?.classList.remove('modal-sm');
  modal?.classList.add('modal-md', 'modal-photo-gallery');

  if (footer) {
    footer.style.display = '';
    footer.innerHTML = `<button type="button" class="btn" id="photo-gallery-close">关闭</button>`;
  }

  const finish = () => {
    resetReturnScreenPhotoGalleryUI();
    if (subtitle) subtitle.style.display = 'none';
    closeModal();
  };

  document.getElementById('photo-gallery-close')?.addEventListener('click', finish);
  document.getElementById('photo-gallery-prev')?.addEventListener('click', () => shift(-1));
  document.getElementById('photo-gallery-next')?.addEventListener('click', () => shift(1));

  document.getElementById('modal-overlay').hidden = false;
}

function resetReturnScreenPhotoGalleryUI() {
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-md', 'modal-photo-gallery');
  modal?.classList.add('modal-xl');
}

function getCabinetName(id) {
  return data.cabinets.find(c => c.id === id)?.name || id;
}

function formatTabletIdDisplay(id) {
  if (!id || id === '—') return id || '—';
  return String(id).replace(/^TAB-/i, '');
}

function cabinetOnlineTag(online) {
  return online
    ? '<span class="tag tag-green">在线</span>'
    : '<span class="tag tag-device-damaged">离线</span>';
}

function getTabletCurrentCabinetId(tablet) {
  if (tablet.status === 'in_cabinet' || tablet.status === 'maintenance') {
    return tablet.currentCabinetId || tablet.cabinetId;
  }
  return null;
}

function getCabinetTablets(cabinetId) {
  return data.tablets.filter(t => getTabletCurrentCabinetId(t) === cabinetId);
}

function getCabinetBoundTabletCount(cabinetId) {
  return data.tablets.filter(t => t.cabinetId === cabinetId).length;
}

function getCabinetAlerts(cabinetId) {
  const tabletIds = getCabinetTablets(cabinetId).map(t => t.id);
  return data.deviceAlerts.filter(a =>
    (a.type === 'cabinet_offline' && (a.cabinetId === cabinetId || a.message?.includes(cabinetId))) ||
    (a.tabletId && tabletIds.includes(a.tabletId))
  );
}

function getCabinetSlotList(cabinet) {
  // 格口是否使用只看是否已绑定平板，不受平板当前借出、充电或柜门状态影响。
  const tablets = data.tablets.filter(t => t.cabinetId === cabinet.id);
  const slots = [];
  for (let i = 1; i <= cabinet.totalSlots; i++) {
    slots.push({ slotNo: i, tablet: tablets.find(t => t.slotNo === i) || null });
  }
  return slots;
}

function resolveSlotDisplayState(tablet) {
  // 格口状态只看是否已绑定平板：已绑定=已激活，未绑定=未激活；异常体现在设备状态。
  return tablet ? 'used' : 'unused';
}

function getCabinetSlotCardClass(tablet) {
  if (!tablet) return 'empty';
  return 'slot-used';
}

function renderCabinetSlotStateLegend() {
  return `
    <div class="cabinet-slot-legend">
      <span class="cabinet-slot-legend-item"><span class="cabinet-slot-legend-swatch slot-used"></span>已激活</span>
      <span class="cabinet-slot-legend-item"><span class="cabinet-slot-legend-swatch empty"></span>未激活</span>
    </div>
    <p class="form-hint" style="margin:8px 0 12px">已绑定平板的格口为“已激活”；未绑定平板为“未激活”；设备或格口损坏时格口仍为已激活，异常在设备状态中体现。</p>`;
}

function renderCabinetSlotGrid(cabinet, options = {}) {
  const { showLegend = false } = options;
  const slots = getCabinetSlotList(cabinet);
  return `
    ${showLegend ? renderCabinetSlotStateLegend() : ''}
    <div class="cabinet-slot-grid">
      ${slots.map(s => {
        const cardClass = getCabinetSlotCardClass(s.tablet);
        return `
        <div class="cabinet-slot-card ${cardClass}">
          <div class="cabinet-slot-head">
            <span class="cabinet-slot-no">#${s.slotNo}</span>
            ${slotStateTag(s.tablet)}
          </div>
          ${s.tablet ? `
            <div class="cabinet-slot-body">
              <div class="cabinet-slot-device">${esc(formatTabletIdDisplay(s.tablet.id))}</div>
              <div class="cabinet-slot-meta">柜门 ${doorStatusTag(s.tablet.doorStatus)}</div>
              <div class="cabinet-slot-meta">设备 ${tabletDeviceStatusTag(s.tablet)}</div>
              <div class="cabinet-slot-actions">
                <button class="btn-link" style="font-size:12px" onclick="openTab('tablet-detail','设备详情',{id:'${s.tablet.id}'})">设备详情</button>
              </div>
            </div>
          ` : `
            <div class="cabinet-slot-empty">暂无设备</div>
          `}
        </div>`;
      }).join('')}
    </div>`;
}

function openRemoteDoorModal(cabinetId, presetSlotNo) {
  const cab = data.cabinets.find(c => c.id === cabinetId);
  if (!cab) return;
  if (!cab.online) {
    toast('柜机离线，无法远程开门', 'warning');
    return;
  }

  const slots = getCabinetSlotList(cab);
  let selectedSlot = presetSlotNo || null;

  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = '远程开门';
  if (subtitle) {
    subtitle.style.display = '';
    subtitle.textContent = `${cab.name}（${cab.id}）· 请选择格口后确认下发 Q8 指令`;
  }

  const renderPicker = () => slots.map(s => {
    const selected = selectedSlot === s.slotNo;
    const meta = s.tablet
      ? `${doorStatusTag(s.tablet.doorStatus)} ${slotStateTag(s.tablet)}`
      : '<span class="tag tag-gray">未激活</span>';
    return `
      <button type="button" class="remote-door-slot ${selected ? 'selected' : ''} ${getCabinetSlotCardClass(s.tablet)}" data-slot="${s.slotNo}" onclick="selectRemoteDoorSlot(${s.slotNo})">
        <span class="remote-door-slot-no">#${s.slotNo}</span>
        <span class="remote-door-slot-info">${s.tablet ? esc(formatTabletIdDisplay(s.tablet.id)) : '未激活'}</span>
        <span class="remote-door-slot-meta">${meta}</span>
      </button>`;
  }).join('');

  const renderBody = () => `
    <div class="remote-door-modal">
      <p class="remote-door-tip">点击选择要打开的格口（共 ${cab.totalSlots} 个）</p>
      <div class="remote-door-slot-grid" id="remote-door-slot-grid">${renderPicker()}</div>
      <p class="remote-door-selected" id="remote-door-selected-label">
        ${selectedSlot ? `已选：<strong>#${selectedSlot}</strong>` : '尚未选择格口'}
      </p>
    </div>`;

  document.getElementById('modal-body').innerHTML = renderBody();

  window.selectRemoteDoorSlot = (slotNo) => {
    selectedSlot = slotNo;
    document.querySelectorAll('.remote-door-slot').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.slot) === slotNo);
    });
    const label = document.getElementById('remote-door-selected-label');
    if (label) label.innerHTML = `已选：<strong>#${slotNo}</strong>`;
  };

  if (presetSlotNo) selectRemoteDoorSlot(presetSlotNo);

  modal?.classList.remove('modal-xl');
  modal?.classList.add('modal-md');

  if (footer) {
    footer.style.display = '';
    footer.innerHTML = `
      <button type="button" class="btn" id="remote-door-cancel">取消</button>
      <button type="button" class="btn btn-primary" id="remote-door-confirm">确认开门</button>
    `;
  }

  const finish = () => {
    modal?.classList.remove('modal-md');
    modal?.classList.add('modal-xl');
    if (subtitle) subtitle.style.display = 'none';
    delete window.selectRemoteDoorSlot;
    closeModal();
  };

  document.getElementById('remote-door-cancel')?.addEventListener('click', finish);
  document.getElementById('remote-door-confirm')?.addEventListener('click', () => {
    if (!selectedSlot) {
      toast('请先选择格口', 'warning');
      return;
    }
    const slot = slots.find(s => s.slotNo === selectedSlot);
    const sendOpen = () => toast(`已向 ${cab.name} 格口 #${selectedSlot} 下发开门指令`, 'success');
    if (resolveTabletDeviceState(slot?.tablet) === 'abnormal') {
      finish();
      showConfirmModal({
        title: '提示',
        message: `格口 #${selectedSlot} 当前异常，确认远程开门？`,
        confirmText: '确认开门',
        onConfirm: sendOpen,
      });
      return;
    }
    finish();
    sendOpen();
  });

  document.getElementById('modal-overlay').hidden = false;
}

function doorStatusTag(status) {
  if (!status) return '<span style="color:var(--text-muted)">—</span>';
  if (status === 'closed') return '<span class="tag tag-green">关闭</span>';
  if (status === 'open') return '<span class="tag tag-alert-pending">打开</span>';
  return esc(status);
}

function slotStateTag(tabletOrState) {
  const state = tabletOrState && typeof tabletOrState === 'object'
    ? resolveSlotDisplayState(tabletOrState)
    : (tabletOrState ?? 'unused');
  const map = {
    used: '<span class="tag tag-cyan">已激活</span>',
    unused: '<span class="tag tag-gray">未激活</span>',
  };
  return map[state] || '<span style="color:var(--text-muted)">—</span>';
}

function alertTypeLabel(type) {
  const map = {
    damage: '外观损坏',
    overdue: '逾期提醒',
    cabinet_offline: '柜机离线',
    return_door_open: '未关门',
    return_not_charging: '未充电',
    manual_feedback: '人工问题反馈',
  };
  return map[type] || esc(type);
}

/** 告警内容：按类型统一简短描述；人工问题反馈展示具体问题文案 */
function alertContentText(a) {
  if (a.type === 'manual_feedback') return a.message || '—';
  const map = {
    damage: '外观对比发现损坏',
    overdue: '借出满24小时未归还',
    cabinet_offline: '柜机心跳超时',
    return_door_open: '未关门',
    return_not_charging: '未充电',
  };
  return map[a.type] || a.message || '—';
}

function resolveAlertSlotNo(alert) {
  if (alert.slotNo != null && alert.slotNo !== '') return alert.slotNo;
  if (!alert.tabletId || alert.tabletId === '—') return null;
  const tablet = data.tablets.find(t => t.id === alert.tabletId);
  return tablet?.slotNo ?? null;
}

function formatAlertSlot(alert) {
  const slot = resolveAlertSlotNo(alert);
  return slot != null ? `#${slot}` : '—';
}

const ALERT_TYPE_FILTER_MAP = {
  '外观损坏': 'damage',
  '逾期提醒': 'overdue',
  '未关门': 'return_door_open',
  '未充电': 'return_not_charging',
  '柜机离线': 'cabinet_offline',
  '人工问题反馈': 'manual_feedback',
};

let usageFilterState = null;
let alertFilterState = null;
let tabletFilterState = null;

function formatYmd(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function formatYm(d = new Date()) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}`;
}

function parseRecordYmd(datetimeStr) {
  if (!datetimeStr || datetimeStr === '—') return '';
  return String(datetimeStr).slice(0, 10);
}

function isYmdInRange(ymd, start, end) {
  if (!ymd) return false;
  if (start && ymd < start) return false;
  if (end && ymd > end) return false;
  return true;
}

function parseRecordYm(datetimeStr) {
  if (!datetimeStr || datetimeStr === '—') return '';
  return String(datetimeStr).slice(0, 7);
}

function formatMonthLabel(ym) {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || '';
  const [y, m] = ym.split('-');
  return `${y}年${parseInt(m, 10)}月`;
}

function getAlertMonthOptions() {
  const set = new Set();
  data.deviceAlerts.forEach(a => {
    const ym = parseRecordYm(a.createdAt);
    if (ym) set.add(ym);
  });
  const now = new Date();
  set.add(formatYm(now));
  for (let i = 0; i < 11; i++) {
    set.add(formatYm(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return [...set].sort().reverse();
}

function renderAlertMonthSelect(selectedYm) {
  const options = getAlertMonthOptions();
  if (selectedYm && !options.includes(selectedYm)) options.unshift(selectedYm);
  return options.map(ym =>
    `<option value="${ym}"${ym === selectedYm ? ' selected' : ''}>${esc(formatMonthLabel(ym))}</option>`
  ).join('');
}

function getDefaultUsageFilter() {
  return {
    student: '',
    sn: '',
    cabinetId: '',
    status: '全部',
    borrowStart: '',
    borrowEnd: '',
    returnStart: '',
    returnEnd: '',
    page: 1,
    pageSize: 10,
  };
}

function getDefaultAlertFilter() {
  return {
    type: '全部',
    status: '全部',
    sn: '',
    cabinetId: '',
    month: formatYm(new Date()),
  };
}

function getDefaultTabletFilter() {
  return {
    id: '',
    sn: '',
    cabinetId: '',
    cabinetName: '',
    status: '全部',
  };
}

function filterTablets(tablets, filter) {
  const idKey = (filter.id || '').trim().toLowerCase();
  const snKey = (filter.sn || '').trim().toLowerCase();
  const cabinetIdKey = (filter.cabinetId || '').trim().toLowerCase();
  return tablets.filter(tablet => {
    if (idKey && !String(tablet.id || '').toLowerCase().includes(idKey)) return false;
    if (snKey && !String(tablet.sn || '').toLowerCase().includes(snKey)) return false;
    if (cabinetIdKey && !String(tablet.cabinetId || '').toLowerCase().includes(cabinetIdKey)) return false;
    if (filter.cabinetName && !String(getCabinetName(tablet.cabinetId)).toLowerCase().includes(filter.cabinetName.trim().toLowerCase())) return false;
    if (filter.status !== '全部' && getTabletDeviceStatusLabel(tablet) !== filter.status) return false;
    return true;
  });
}

function readTabletFilterFromForm() {
  return {
    id: document.getElementById('tablet-filter-id')?.value || '',
    sn: document.getElementById('tablet-filter-sn')?.value || '',
    cabinetId: document.getElementById('tablet-filter-cabinet-id')?.value || '',
    cabinetName: document.getElementById('tablet-filter-cabinet-name')?.value || '',
    status: document.getElementById('tablet-filter-status')?.value || '全部',
  };
}

function applyTabletFilter() {
  tabletFilterState = readTabletFilterFromForm();
  navigate('tablet', { keepFilter: true });
}

function resetTabletFilter() {
  tabletFilterState = getDefaultTabletFilter();
  navigate('tablet', { keepFilter: true });
}

function getUsageRecordStatusLabel(r) {
  const labels = { door_open: '开门中', returned: '已归还', borrowed: '借出中', return_abnormal: '归还异常', overdue: '已逾期', cancelled: '取消借用' };
  return labels[resolveUsageRecordState(r)] || '借出中';
}

function filterUsageRecords(records, filter) {
  const studentKey = (filter.student || '').trim().toLowerCase();
  const snKey = (filter.sn || '').trim().toLowerCase();
  const cabinetKey = (filter.cabinetId || '').trim().toLowerCase();
  return records.filter(r => {
    if (studentKey) {
      const hay = `${r.studentId || ''} ${r.studentName || ''}`.toLowerCase();
      if (!hay.includes(studentKey)) return false;
    }
    if (snKey && !String(r.sn || '').toLowerCase().includes(snKey)) return false;
    if (cabinetKey) {
      const cabinetId = data.tablets.find(t => t.id === r.tabletId)?.cabinetId || r.cabinetBorrow || '';
      if (!String(cabinetId).toLowerCase().includes(cabinetKey)) return false;
    }
    if (filter.status !== '全部') {
      if (getUsageRecordStatusLabel(r) !== filter.status) return false;
    }
    const borrowYmd = parseRecordYmd(r.borrowAt);
    if (!isYmdInRange(borrowYmd, filter.borrowStart, filter.borrowEnd)) return false;
    if (filter.returnStart || filter.returnEnd) {
      const returnYmd = parseRecordYmd(r.returnAt || r.cancelledAt);
      if (!isYmdInRange(returnYmd, filter.returnStart, filter.returnEnd)) return false;
    }
    return true;
  });
}

function filterDeviceAlerts(alerts, filter) {
  const snKey = (filter.sn || '').trim().toLowerCase();
  const cabinetKey = (filter.cabinetId || '').trim().toLowerCase();
  return alerts.filter(a => {
    if (filter.type !== '全部') {
      if (filter.type === '未关门') {
        if (a.type !== 'return_door_open') return false;
      } else {
        const typeCode = ALERT_TYPE_FILTER_MAP[filter.type];
        if (typeCode && a.type !== typeCode) return false;
      }
    }
    if (filter.status === '待处理' && a.status !== 'pending') return false;
    if (filter.status === '已解决' && a.status !== 'resolved') return false;
    if (snKey) {
      const sn = a.sn || data.tablets.find(t => t.id === a.tabletId)?.sn || '';
      if (!String(sn).toLowerCase().includes(snKey)) return false;
    }
    if (cabinetKey) {
      const cabinetId = a.cabinetId || data.tablets.find(t => t.id === a.tabletId)?.cabinetId || '';
      if (!String(cabinetId).toLowerCase().includes(cabinetKey)) return false;
    }
    if (filter.month) {
      const createdYm = parseRecordYm(a.createdAt);
      if (createdYm !== filter.month) return false;
    }
    return true;
  });
}

function readUsageFilterFromForm() {
  return {
    student: document.getElementById('usage-filter-student')?.value || '',
    sn: document.getElementById('usage-filter-sn')?.value || '',
    cabinetId: document.getElementById('usage-filter-cabinet-id')?.value || '',
    status: document.getElementById('usage-filter-status')?.value || '全部',
    borrowStart: document.getElementById('usage-filter-borrow-start')?.value || '',
    borrowEnd: document.getElementById('usage-filter-borrow-end')?.value || '',
    returnStart: document.getElementById('usage-filter-return-start')?.value || '',
    returnEnd: document.getElementById('usage-filter-return-end')?.value || '',
    page: 1,
    pageSize: usageFilterState?.pageSize || 10,
  };
}

function readAlertFilterFromForm() {
  return {
    type: document.getElementById('alert-filter-type')?.value || '全部',
    status: document.getElementById('alert-filter-status')?.value || '全部',
    sn: document.getElementById('alert-filter-sn')?.value || '',
    cabinetId: document.getElementById('alert-filter-cabinet-id')?.value || '',
    month: document.getElementById('alert-filter-month')?.value || formatYm(new Date()),
  };
}

function applyUsageFilter() {
  usageFilterState = readUsageFilterFromForm();
  navigate('device-usage', { keepFilter: true });
}

function resetUsageFilter() {
  usageFilterState = getDefaultUsageFilter();
  navigate('device-usage', { keepFilter: true });
}

function goToUsagePage(page) {
  if (!usageFilterState) usageFilterState = getDefaultUsageFilter();
  const pageSize = usageFilterState.pageSize || 10;
  const filtered = filterUsageRecords(data.usageRecords, usageFilterState);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const next = Math.min(Math.max(1, Number(page) || 1), totalPages);
  usageFilterState = { ...usageFilterState, page: next };
  navigate('device-usage', { keepFilter: true });
}

function renderUsagePagination(total, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), totalPages);
  const prevDisabled = current <= 1;
  const nextDisabled = current >= totalPages;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) pages.push(i);
  return `
    <div class="pagination pagination--with-size">
      <span class="page-btn${prevDisabled ? ' disabled' : ''}" ${prevDisabled ? '' : `onclick="goToUsagePage(${current - 1})" role="button" tabindex="0"`}>‹</span>
      ${pages.map(p =>
        `<span class="page-btn${p === current ? ' active' : ''}" ${p === current ? '' : `onclick="goToUsagePage(${p})" role="button" tabindex="0"`}>${p}</span>`
      ).join('')}
      <span class="page-btn${nextDisabled ? ' disabled' : ''}" ${nextDisabled ? '' : `onclick="goToUsagePage(${current + 1})" role="button" tabindex="0"`}>›</span>
      <span class="page-size-picker">每页 ${pageSize} 条</span>
      <span class="page-jump">共 ${total} 条 · 第 ${current}/${totalPages} 页</span>
    </div>`;
}

function applyAlertFilter() {
  alertFilterState = readAlertFilterFromForm();
  navigate('device-alert', { keepFilter: true });
}

function resetAlertFilter() {
  alertFilterState = getDefaultAlertFilter();
  navigate('device-alert', { keepFilter: true });
}

function renderUsageTableRows(records) {
  if (!records.length) {
    return '<tr><td colspan="12" style="text-align:center;color:var(--text-muted);padding:32px">暂无符合条件的使用记录</td></tr>';
  }
  return records.map(r => `
    <tr>
      <td>${esc(r.id)}</td>
      <td>${esc(r.sn || '—')}</td>
      <td>${data.tablets.find(t => t.id === r.tabletId)?.slotNo != null ? `#${esc(String(data.tablets.find(t => t.id === r.tabletId).slotNo))}` : `#${esc(String(r.slotBorrow || '—'))}`}</td>
      <td>${esc(data.tablets.find(t => t.id === r.tabletId)?.cabinetId || r.cabinetBorrow || '—')}</td>
      <td>${esc(r.studentId || '—')}</td>
      <td>${esc(r.studentName)}</td>
      <td>${esc(r.grade || '—')}</td>
      <td>${usageRecordStateTag(r)}</td>
      <td class="status-ref-note">${esc(usageRecordStateNote(r))}</td>
      <td>${r.borrowAt}</td>
      <td>${r.returnAt || r.cancelledAt || '—'}</td>
      <td><button class="btn-link" onclick="openTab('device-usage-detail','使用记录详情',{id:'${r.id}'})">详情</button></td>
    </tr>
  `).join('');
}

function renderAlertTableRows(alerts) {
  if (!alerts.length) {
    return '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:32px">暂无符合条件的告警</td></tr>';
  }
  return alerts.map(a => `
    <tr>
      <td>${esc(a.id)}</td>
      <td>${alertTypeLabel(a.type)}</td>
      <td>${esc(a.sn || '—')}</td>
      <td>${esc(formatAlertSlot(a))}</td>
      <td>${esc(a.cabinetId || data.tablets.find(t => t.id === a.tabletId)?.cabinetId || '—')}</td>
      <td style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(alertContentText(a))}</td>
      <td>${alertStatusTag(a.status)}</td>
      <td>${a.createdAt}</td>
      <td>${a.status === 'resolved' ? '<span style="color:var(--text-muted)">已处理</span>' : '<button class="btn-link" onclick="toast(\'已标记处理\',\'success\')">处理</button>'}</td>
    </tr>
  `).join('');
}

function renderPlacementScenariosGuide() {
  return `
    <div class="placement-guide">
      <div class="form-section-title">放置与检测 · 归还流程说明</div>
      <p class="placement-guide-note">扫码拍照后打开绑定格口。仅当<strong>放入设备 + 充电 + 关门 + 确认归还</strong>同时满足时归还成功。</p>
      <div class="placement-scenarios">
        <div class="placement-scenario placement-scenario--ok">
          <div class="placement-scenario-head"><strong>归还成功</strong><span class="tag tag-green">已充电 + 关闭</span></div>
          <p class="placement-scenario-text">确认归还后完成入柜并进入充电循环。</p>
        </div>
        <div class="placement-scenario placement-scenario--warn">
          <div class="placement-scenario-head"><strong>归还未完成</strong><span class="tag tag-alert-pending">未关门 / 未充电</span></div>
          <p class="placement-scenario-text">提示用户重试或取消；取消后柜门重新打开，设备仍借出。</p>
        </div>
      </div>
    </div>`;
}

function formatRecordTimeOffset(datetimeStr, offsetSec = 0) {
  if (!datetimeStr || datetimeStr === '—') return '—';
  const d = new Date(String(datetimeStr).trim().replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return datetimeStr;
  d.setSeconds(d.getSeconds() + offsetSec);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function renderBorrowTimelineItems(record) {
  const borrowDesc = record.status === 'cancelled'
    ? '确认借取，柜门打开；设备未拔充电器'
    : '确认借取，柜门打开；设备已取出';
  return `
        <div class="dev-timeline-item">
          <div class="dev-timeline-time">${formatRecordTimeOffset(record.borrowAt, -8)}</div>
          <div class="dev-timeline-title">编号密码验证</div>
          <div class="dev-timeline-desc">学生提交编号与密码</div>
        </div>
        <div class="dev-timeline-item">
          <div class="dev-timeline-time">${record.borrowAt}</div>
          <div class="dev-timeline-title">设备借出</div>
          <div class="dev-timeline-desc">${borrowDesc}</div>
        </div>`;
}

function renderCancelBorrowTimelineItem(record) {
  const steps = record.cancelDetection?.steps || [];
  const last = steps[steps.length - 1];
  const desc = '设备未拔充电器，关门后取消借用 <span class="tag tag-gray">取消借用</span>';
  const stepHtml = steps.length
    ? `<div class="dev-timeline-desc" style="margin-top:8px">${steps.map(s =>
      `<div style="margin-top:4px;color:var(--text-muted);font-size:12px">${esc(s.time)} · ${esc(s.action)}</div>`
    ).join('')}</div>`
    : '';
  return `
        <div class="dev-timeline-item">
          <div class="dev-timeline-time">${record.cancelledAt || last?.time || '—'}</div>
          <div class="dev-timeline-title">取消借用</div>
          <div class="dev-timeline-desc">${desc}</div>
          ${stepHtml}
        </div>`;
}

function returnPlacementTimelineDesc(record) {
  if (isReturnCloseFinalNormal(record)) {
    return '扫码自动拍照后打开绑定格口；设备充电、关门并确认归还 <span class="tag tag-green">归还成功</span>';
  }
  return '归还未完成 <span class="tag tag-alert-pending">待重试</span>';
}

function renderReturnPlacementTimelineItem(record) {
  return `
        <div class="dev-timeline-item${isReturnCloseAbnormal(record) ? ' warn' : ''}">
          <div class="dev-timeline-time">${record.returnAt}</div>
          <div class="dev-timeline-title">扫码拍照 · 归还确认</div>
          <div class="dev-timeline-desc">${returnPlacementTimelineDesc(record)}</div>
        </div>`;
}

function renderAppearanceCompareTimelineItem(record) {
  if (isReturnCloseAbnormal(record)) return '';
  return `
        <div class="dev-timeline-item ${record.returnInspection?.aiResult !== 'normal' ? 'danger' : ''}">
          <div class="dev-timeline-time">${record.returnInspection?.capturedAt || record.returnAt}</div>
          <div class="dev-timeline-title">外观对比判定</div>
          <div class="dev-timeline-desc">后台对比屏幕外观 ${record.returnInspection ? aiResultTag(record.returnInspection.aiResult) : ''}</div>
          ${renderAppearanceComparePhotoSection(record)}
        </div>`;
}

function isReturnCloseAbnormal(record) {
  return !isReturnCloseFinalNormal(record);
}

function renderPendingReturnTimelineItem(record) {
  const overdue = record.overdue;
  const attempt = record.returnAttempt;
  const stateTag = usageRecordStateTag(record);
  if (attempt) {
    const issueText = {
      door_open: '柜门未关',
      not_charging: '设备未充电',
      misplaced: '疑似误放设备',
    }[attempt.issue] || '归还已取消';
    const desc = attempt.status === 'cancelled'
      ? '已取消归还，柜门重新打开；设备仍已借出'
      : `${issueText}，设备仍已借出，可在柜机端重试或取消归还`;
    return `
        <div class="dev-timeline-item warn">
          <div class="dev-timeline-time">${attempt.at || '—'}</div>
          <div class="dev-timeline-title">归还流程未完成</div>
          <div class="dev-timeline-desc">${desc} ${stateTag}</div>
        </div>`;
  }
  const title = overdue ? '已逾期' : '借出中';
  return `
        <div class="dev-timeline-item warn">
          <div class="dev-timeline-time">${overdue ? (record.forceLogoutAt || '—') : '—'}</div>
          <div class="dev-timeline-title">${title}</div>
          <div class="dev-timeline-desc">${overdue ? '借出满 24 小时未归还' : '等待学生归还'} ${stateTag}</div>
        </div>`;
}

function renderAppearanceComparePhotoSection(record) {
  return `
    <div class="dev-timeline-photo-action">
      ${renderReturnScreenPhotoGalleryButton(record)}
    </div>`;
}

function getTabletInitialPhoto(tabletId) {
  return data.tablets.find(t => t.id === tabletId)?.initialScreenPhoto || null;
}

function renderAppearanceGuide() {
  return `
    <div class="placement-guide appearance-guide">
      <div class="form-section-title">外观检测 · 扫码拍照对比规则</div>
      <p class="placement-guide-note">入柜拍<strong>初始屏幕照</strong>作基准；归还扫码拍摄外观照，与<strong>上次入柜基准照</strong>做屏幕损伤 AI 对比。</p>
      <div class="placement-scenarios">
        <div class="placement-scenario placement-scenario--ok">
          <div class="placement-scenario-head"><strong>首次归还</strong><span class="tag tag-green">对比初始照</span></div>
          <p class="placement-scenario-text">与初始入柜屏幕照对比。</p>
        </div>
        <div class="placement-scenario placement-scenario--ok">
          <div class="placement-scenario-head"><strong>后续归还</strong><span class="tag tag-green">对比上次归还照</span></div>
          <p class="placement-scenario-text">与上一位用户归还时的照片对比。</p>
        </div>
      </div>
    </div>`;
}

function renderDeviceOverviewPage() {
  const tablets = data.tablets;
  const inCabinet = tablets.filter(t => t.status === 'in_cabinet').length;
  const outCabinet = tablets.filter(t => t.status !== 'in_cabinet').length;
  const overdue = tablets.filter(t => t.isOverdue).length;
  const cabinetsOnline = data.cabinets.filter(c => c.online).length;
  const pendingAlerts = data.deviceAlerts.filter(a => a.status !== 'resolved').length;

  return `
    <div class="page-card">
      <div class="page-card-title">设备概览</div>
      <div class="dev-stat-row">
        <div class="dev-stat-card ok" style="cursor:pointer" onclick="openTab('cabinet')" title="查看柜机管理"><div class="label">柜机在线</div><div class="value">${cabinetsOnline}/${data.cabinets.length}</div><div class="sub">借租柜运行状态 · 点击查看</div></div>
        <div class="dev-stat-card"><div class="label">平板总数</div><div class="value">${tablets.length}</div><div class="sub">已注册设备</div></div>
        <div class="dev-stat-card ok"><div class="label">在柜</div><div class="value">${inCabinet}</div><div class="sub">当前可借出</div></div>
        <div class="dev-stat-card"><div class="label">离柜</div><div class="value">${outCabinet}</div><div class="sub">不在任何柜机</div></div>
        <div class="dev-stat-card warn"><div class="label">逾期提醒</div><div class="value">${overdue}</div><div class="sub">借出24h未还</div></div>
        <div class="dev-stat-card danger"><div class="label">待处理告警</div><div class="value">${pendingAlerts}</div><div class="sub">含损坏/逾期</div></div>
      </div>
      ${renderAppearanceGuide()}
      ${renderPlacementScenariosGuide()}
      <div class="form-section-title">最近使用记录</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>记录ID</th><th>设备SN</th><th>格口号</th><th>所属柜机ID</th><th>学生</th><th>借出时间</th><th>状态</th><th>说明</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${data.usageRecords.slice(0, 5).map(r => `
              <tr>
                <td>${esc(r.id)}</td>
                <td>${esc(r.sn || '—')}</td>
                <td>${data.tablets.find(t => t.id === r.tabletId)?.slotNo != null ? `#${esc(String(data.tablets.find(t => t.id === r.tabletId).slotNo))}` : `#${esc(String(r.slotBorrow || '—'))}`}</td>
                <td>${esc(data.tablets.find(t => t.id === r.tabletId)?.cabinetId || r.cabinetBorrow || '—')}</td>
                <td>${esc(r.studentName)} (${esc(r.studentId)})</td>
                <td>${r.borrowAt}</td>
                <td>${usageRecordStateTag(r)}</td>
                <td class="status-ref-note">${esc(usageRecordStateNote(r))}</td>
                <td><button class="btn-link" onclick="openTab('device-usage-detail','使用记录详情',{id:'${r.id}'})">详情</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderCabinetPage() {
  return `
    <div class="page-card">
      <div class="page-card-title">柜机管理</div>
      <p class="form-hint" style="margin:0 0 16px" data-req-title="广告轮播" data-req-body="各柜机广告区可下发独立图片轮播，展示尺寸 1080×600，单柜上限 3 条。支持单柜配置与多选批量配置（保存后覆盖所选柜机原有内容；空列表即清空）。图片停留全柜统一 5 秒，后台无时长入口。本期仅图片，不支持视频。详情页不展示轮播。" data-req-doc="设备管理需求文档 §4.16 / §5.6">柜机台账与广告轮播（${CABINET_AD_SIZE.width}×${CABINET_AD_SIZE.height}）统一在此管理：可单柜配置，或勾选多台后「批量配置轮播内容」（保存后覆盖原内容）。</p>
      <div class="filter-form">
        <div class="filter-item"><label>柜机名称</label><input class="input" placeholder="请输入"></div>
        <div class="filter-item"><label>在线状态</label><select class="select"><option>全部</option><option>在线</option><option>离线</option></select></div>
        <div class="filter-item"><label>安装位置</label><input class="input" placeholder="请输入"></div>
        <div class="filter-item"><label>广告轮播</label><select class="select"><option>全部</option><option>已配置</option><option>未配置</option></select></div>
        <div class="filter-actions"><button class="btn">重置</button><button class="btn btn-primary">搜索</button></div>
      </div>
      <div class="toolbar" style="margin-bottom:16px">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="openAddCabinetModal()">添加柜机</button>
          <button class="btn" onclick="openBatchCarouselConfig()">批量配置轮播内容</button>
        </div>
        <div class="toolbar-right status-text">已选 <span id="cabinet-selected-count">0</span> 台</div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th style="width:40px"><input type="checkbox" id="cabinet-select-all" onchange="toggleCabinetSelectAll(this.checked)" title="全选"></th>
            <th>序号</th><th>柜机 ID</th><th>柜机名称</th><th>安装位置</th><th>格口</th><th>在线状态</th><th>轮播素材</th><th>最近心跳</th><th>绑定手机号</th><th>负责人</th><th>负责人联系方式</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${data.cabinets.map((c, i) => {
              const conf = typeof getCabinetCarousel === 'function' ? getCabinetCarousel(c.id) : { items: [], updatedAt: null };
              const items = conf.items || [];
              return `
              <tr>
                <td><input type="checkbox" class="cabinet-pick-checkbox" data-id="${c.id}" onchange="syncCabinetSelectAllState()"></td>
                <td>${i + 1}</td>
                <td>${esc(c.id)}</td>
                <td>${esc(c.name)}</td>
                <td>${esc(c.location)}</td>
                <td>${getCabinetBoundTabletCount(c.id)}/${c.totalSlots}</td>
                <td>${cabinetOnlineTag(c.online)}</td>
                <td>${typeof renderCarouselThumbStrip === 'function' ? renderCarouselThumbStrip(items) : '—'}</td>
                <td>${c.lastHeartbeat}</td>
                <td>${esc(c.boundPhone || '—')}</td>
                <td>${esc(c.manager)}</td>
                <td>${esc(c.managerContact || '—')}</td>
                <td>
                  <button class="btn-link" onclick="openEditCabinetModal('${c.id}')">编辑</button>
                  <button class="btn-link" onclick="openTab('cabinet-detail','柜机详情',{id:'${c.id}'})">查看详情</button>
                  <button class="btn-link" onclick="openCarouselPreviewModal('${c.id}')">查看轮播</button>
                  <button class="btn-link" onclick="openTab('cabinet-carousel','配置轮播',{id:'${c.id}'})">配置轮播</button>
                </td>
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderCabinetDetailPage(params) {
  const cab = data.cabinets.find(c => c.id === params?.id) || data.cabinets[0];
  const tablets = data.tablets.filter(t => t.cabinetId === cab.id);
  const alerts = getCabinetAlerts(cab.id).slice(0, 5);
  return `
    <div class="page-card">
      <div class="page-card-title">柜机详情 · ${esc(cab.name)}</div>
      <div class="detail-grid">
        <div class="detail-item"><label>柜机 ID</label><span>${esc(cab.id)}</span></div>
        <div class="detail-item"><label>柜机名称</label><span>${esc(cab.name)}</span></div>
        <div class="detail-item"><label>安装位置</label><span>${esc(cab.location)}</span></div>
        <div class="detail-item"><label>格口</label><span>${getCabinetBoundTabletCount(cab.id)} / ${cab.totalSlots} 已激活</span></div>
        <div class="detail-item"><label>在线状态</label><span>${cabinetOnlineTag(cab.online)}</span></div>
        <div class="detail-item"><label>最近心跳</label><span>${cab.lastHeartbeat}</span></div>
        <div class="detail-item"><label>绑定手机号</label><span>${esc(cab.boundPhone || '—')}</span></div>
        <div class="detail-item"><label>负责人</label><span>${esc(cab.manager)}</span></div>
        <div class="detail-item"><label>负责人联系方式</label><span>${esc(cab.managerContact || '—')}</span></div>
      </div>
      <div class="form-section-title">格口概览</div>
      <div class="toolbar" style="margin-bottom:12px">
        <div class="toolbar-left">
          <button class="btn" onclick="toast('已下发远程重启指令','success')">远程重启</button>
          <button class="btn" onclick="openRemoteDoorModal('${cab.id}')">远程开门</button>
        </div>
      </div>
      ${renderCabinetSlotGrid(cab, { showLegend: true })}
      <div class="form-section-title">绑定本柜机设备（${tablets.length} 台）</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>序号</th><th>设备ID</th><th>SN</th><th>仓位</th><th>柜门</th><th>格口状态</th><th>设备状态</th><th>说明</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${tablets.length ? tablets.map((t, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${esc(formatTabletIdDisplay(t.id))}</td>
                <td>${esc(t.sn)}</td>
                <td>#${t.slotNo}</td>
                <td>${doorStatusTag(t.doorStatus)}</td>
                <td>${slotStateTag(t)}</td>
                <td>${tabletDeviceStatusTag(t)}</td>
                <td class="status-ref-note">${esc(tabletDeviceStatusNote(t))}</td>
                <td><button class="btn-link" onclick="openTab('tablet-detail','设备详情',{id:'${t.id}'})">详情</button></td>
              </tr>
            `).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">暂无绑定设备</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="form-section-title">最近告警</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>告警ID</th><th>类型</th><th>告警内容</th><th>状态</th><th>产生时间</th></tr></thead>
          <tbody>
            ${alerts.length ? alerts.map(a => `
              <tr>
                <td>${esc(a.id)}</td>
                <td>${alertTypeLabel(a.type)}</td>
                <td>${esc(alertContentText(a))}</td>
                <td>${alertStatusTag(a.status)}</td>
                <td>${a.createdAt}</td>
              </tr>
            `).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">暂无告警</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="form-footer"><button class="btn" onclick="openTab('cabinet')">返回列表</button></div>
    </div>`;
}

function renderTabletPage(params) {
  if (!params?.keepFilter || tabletFilterState === null) {
    tabletFilterState = getDefaultTabletFilter();
  }
  const f = tabletFilterState;
  const tablets = filterTablets(data.tablets, f);
  const totalCount = tablets.length;
  return `
    <div class="page-card">
      <div class="page-card-title">平板设备</div>
      <div class="filter-form">
        <div class="filter-item"><label>设备ID</label><input class="input" id="tablet-filter-id" placeholder="请输入" value="${esc(f.id)}"></div>
        <div class="filter-item"><label>设备SN</label><input class="input" id="tablet-filter-sn" placeholder="请输入" value="${esc(f.sn)}"></div>
        <div class="filter-item"><label>柜机ID</label><input class="input" id="tablet-filter-cabinet-id" placeholder="请输入" value="${esc(f.cabinetId)}"></div>
        <div class="filter-item"><label>柜机名称</label><input class="input" id="tablet-filter-cabinet-name" placeholder="请输入" value="${esc(f.cabinetName)}"></div>
        <div class="filter-item"><label>设备状态</label><select class="select" id="tablet-filter-status"><option${f.status === '全部' ? ' selected' : ''}>全部</option><option${f.status === '充电中' ? ' selected' : ''}>充电中</option><option${f.status === '已借出' ? ' selected' : ''}>已借出</option><option${f.status === '异常' ? ' selected' : ''}>异常</option></select></div>
        <div class="filter-actions"><button type="button" class="btn" onclick="resetTabletFilter()">重置</button><button type="button" class="btn btn-primary" onclick="applyTabletFilter()">搜索</button></div>
      </div>
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" onclick="openBatchImportModal('导入设备')">导入设备</button>
          <button class="btn" onclick="openRestoreDeviceModal()">设备还原</button>
        </div>
        <div class="toolbar-right status-text">总计：${totalCount}</div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>设备ID</th><th>设备SN</th><th>型号</th><th>柜机ID</th><th>柜机名称</th><th>格口号</th><th>柜门</th><th>格口状态</th><th>设备状态</th><th>说明</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${tablets.length ? tablets.map(t => `
              <tr>
                <td>${esc(formatTabletIdDisplay(t.id))}</td>
                <td>${esc(t.sn)}</td>
                <td>${esc(t.model)}</td>
                <td>${esc(t.cabinetId || '—')}</td>
                <td>${esc(getCabinetName(t.cabinetId))}</td>
                <td>${t.slotNo != null ? `#${esc(String(t.slotNo))}` : '—'}</td>
                <td>${doorStatusTag(t.doorStatus)}</td>
                <td>${slotStateTag(t)}</td>
                <td>${tabletDeviceStatusTag(t)}</td>
                <td class="status-ref-note">${esc(tabletDeviceStatusNote(t))}</td>
                <td>
                  <button class="btn-link" onclick="openTab('tablet-detail','设备详情',{id:'${t.id}'})">详情</button>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:32px">暂无符合条件的设备</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="pagination pagination--with-size">
        <span class="page-btn disabled">‹</span>
        <span class="page-btn active">1</span>
        <span class="page-btn">2</span>
        <span class="page-btn">3</span>
        <span class="page-btn">4</span>
        <span class="page-btn">5</span>
        <span class="page-btn">›</span>
        <span class="page-size-picker">每页
          <select class="select page-size-select" aria-label="每页条数">
            <option selected>10 条</option>
            <option>20 条</option>
            <option>50 条</option>
          </select>
        </span>
        <span class="page-jump">跳至 <input class="input sm" value="1"> 页</span>
      </div>
    </div>`;
}

function renderTabletDetailPage(params) {
  const tab = data.tablets.find(t => t.id === params?.id) || data.tablets[0];
  const usages = data.usageRecords.filter(u => u.tabletId === tab.id).slice(0, 5);
  return `
    <div class="page-card">
      <div class="page-card-title">设备详情 · ${esc(formatTabletIdDisplay(tab.id))}</div>
      <div class="detail-grid">
        <div class="detail-item"><label>设备ID</label><span>${esc(formatTabletIdDisplay(tab.id))}</span></div>
        <div class="detail-item"><label>SN 序列号</label><span>${esc(tab.sn)}</span></div>
        <div class="detail-item"><label>设备型号</label><span>${esc(tab.model)}</span></div>
        <div class="detail-item"><label>屏保二维码</label><span><code>${esc(tab.qrCode)}</code> <span style="font-size:12px;color:var(--text-muted)">（归还时柜机拍摄该码画面并识别）</span></span></div>
        <div class="detail-item"><label>所属柜机</label><span>${esc(getCabinetName(tab.cabinetId))}</span></div>
        <div class="detail-item"><label>仓位</label><span>#${tab.slotNo}</span></div>
        <div class="detail-item"><label>柜门状态</label><span>${doorStatusTag(tab.doorStatus)} <span style="font-size:12px;color:var(--text-muted)">（借租柜接口）</span></span></div>
        <div class="detail-item"><label>格口状态</label><span>${slotStateTag(tab)}</span></div>
        <div class="detail-item"><label>设备状态</label><span>${tabletDeviceStatusTag(tab)}</span></div>
        ${tabletDeviceStatusNote(tab) !== '—' ? `<div class="detail-item"><label>说明</label><span>${esc(tabletDeviceStatusNote(tab))}</span></div>` : ''}
        <div class="detail-item"><label>当前归属柜机</label><span>${tab.status === 'in_cabinet' ? esc(getCabinetName(tab.currentCabinetId || tab.cabinetId)) : '离柜中'}</span></div>
        <div class="detail-item"><label>最后外观检测</label><span>${tab.lastInspection}</span></div>
        ${tab.currentStudentId ? `<div class="detail-item"><label>当前借用人</label><span>${esc(tab.currentStudentName)} (${esc(tab.currentStudentId)})</span></div>` : ''}
      </div>
      ${tab.initialScreenPhoto ? `
        <div class="form-section-title">初始入柜屏幕照</div>
        <div class="photo-grid" style="margin-bottom:24px">${renderPhotoCard(tab.initialScreenPhoto, 'device')}</div>
      ` : ''}
      <div class="form-section-title">使用记录</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>记录ID</th><th>编号</th><th>学生</th><th>班级</th><th>借出</th><th>归还</th><th>状态</th><th>说明</th><th>操作</th></tr></thead>
          <tbody>
            ${usages.length ? usages.map(u => `
              <tr>
                <td>${esc(u.id)}</td>
                <td>${esc(u.studentId || '—')}</td>
                <td>${esc(u.studentName)}</td>
                <td>${esc(u.grade || '—')}</td>
                <td>${u.borrowAt}</td>
                <td>${u.returnAt || u.cancelledAt || '—'}</td>
                <td>${usageRecordStateTag(u)}</td>
                <td class="status-ref-note">${esc(usageRecordStateNote(u))}</td>
                <td><button class="btn-link" onclick="openTab('device-usage-detail','使用记录详情',{id:'${u.id}'})">详情</button></td>
              </tr>
            `).join('') : '<tr><td colspan="9" style="text-align:center;color:var(--text-muted)">暂无使用记录</td></tr>'}
          </tbody>
        </table>
      </div>
      <div class="form-footer"><button class="btn" onclick="openTab('tablet')">返回列表</button></div>
    </div>`;
}

function renderDeviceUsagePage(params) {
  if (!params?.keepFilter || usageFilterState === null) {
    usageFilterState = getDefaultUsageFilter();
  }
  const f = usageFilterState;
  const pageSize = f.pageSize || 10;
  const filtered = filterUsageRecords(data.usageRecords, f);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, f.page || 1), totalPages);
  if (page !== f.page) usageFilterState = { ...f, page };
  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);
  return `
    <div class="page-card">
      <div class="page-card-title">使用记录</div>
      <div class="filter-form">
        <div class="filter-item"><label>编号 / 姓名</label><input class="input" id="usage-filter-student" placeholder="请输入" value="${esc(f.student)}"></div>
        <div class="filter-item"><label>设备 SN</label><input class="input" id="usage-filter-sn" placeholder="请输入" value="${esc(f.sn)}"></div>
        <div class="filter-item"><label>所属柜机ID</label><input class="input" id="usage-filter-cabinet-id" placeholder="请输入" value="${esc(f.cabinetId)}"></div>
        <div class="filter-item"><label>记录状态</label><select class="select" id="usage-filter-status"><option${f.status === '全部' ? ' selected' : ''}>全部</option><option${f.status === '开门中' ? ' selected' : ''}>开门中</option><option${f.status === '已归还' ? ' selected' : ''}>已归还</option><option${f.status === '借出中' ? ' selected' : ''}>借出中</option><option${f.status === '归还异常' ? ' selected' : ''}>归还异常</option><option${f.status === '已逾期' ? ' selected' : ''}>已逾期</option><option${f.status === '取消借用' ? ' selected' : ''}>取消借用</option></select></div>
        <div class="filter-item"><label>借出时间</label><div class="date-range"><input class="input" type="date" id="usage-filter-borrow-start" value="${esc(f.borrowStart)}"><span>至</span><input class="input" type="date" id="usage-filter-borrow-end" value="${esc(f.borrowEnd)}"></div></div>
        <div class="filter-item"><label>归还时间</label><div class="date-range"><input class="input" type="date" id="usage-filter-return-start" value="${esc(f.returnStart)}"><span>至</span><input class="input" type="date" id="usage-filter-return-end" value="${esc(f.returnEnd)}"></div></div>
        <div class="filter-actions"><button type="button" class="btn" onclick="resetUsageFilter()">重置</button><button type="button" class="btn btn-primary" onclick="applyUsageFilter()">搜索</button></div>
      </div>
      <p class="form-hint" style="margin:0 0 12px">模拟数据默认展示全部使用记录，共 ${filtered.length} 条（含开门中 / 已归还 / 借出中 / 归还异常 / 已逾期 / 取消借用）；每页 ${pageSize} 条${f.borrowStart || f.borrowEnd ? `；借出 ${esc(f.borrowStart || '不限')} 至 ${esc(f.borrowEnd || '不限')}` : ''}${f.returnStart || f.returnEnd ? `；归还 ${esc(f.returnStart || '不限')} 至 ${esc(f.returnEnd || '不限')}` : ''}</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>记录ID</th><th>设备SN</th><th>格口号</th><th>所属柜机ID</th><th>编号</th><th>学生</th><th>班级</th><th>状态</th><th>说明</th><th>借出时间</th><th>归还时间</th><th>操作</th>
          </tr></thead>
          <tbody>${renderUsageTableRows(pageRows)}</tbody>
        </table>
      </div>
      ${renderUsagePagination(filtered.length, page, pageSize)}
    </div>`;
}

function renderDeviceUsageDetailPage(params) {
  const r = data.usageRecords.find(u => u.id === params?.id) || data.usageRecords[0];
  return `
    <div class="page-card">
      <div class="page-card-title">使用记录详情</div>
      <div class="detail-grid">
        <div class="detail-item"><label>记录ID</label><span>${esc(r.id)}</span></div>
        <div class="detail-item"><label>设备</label><span>${esc(formatTabletIdDisplay(r.tabletId))} / ${esc(r.sn)}</span></div>
        <div class="detail-item"><label>借用人</label><span>${esc(r.studentName)}（${esc(r.studentId)}）${esc(r.grade)}</span></div>
        <div class="detail-item"><label>借出</label><span>${esc(r.cabinetBorrow)} 仓位 #${r.slotBorrow} · ${r.borrowAt}</span></div>
        <div class="detail-item"><label>${r.status === 'cancelled' ? '取消' : '归还'}</label><span>${
          r.status === 'cancelled'
            ? `${esc(r.cabinetReturn || r.cabinetBorrow)} 仓位 #${r.slotReturn || r.slotBorrow} · ${r.cancelledAt || '—'}`
            : (r.returnAt ? `${esc(r.cabinetReturn)} 仓位 #${r.slotReturn} · ${r.returnAt}` : '未归还')
        }</span></div>
        <div class="detail-item"><label>状态</label><span>${usageRecordStateTag(r)}</span></div>
        ${usageRecordStateNote(r) !== '—' ? `<div class="detail-item"><label>说明</label><span>${esc(usageRecordStateNote(r))}</span></div>` : ''}
        ${r.preAlertAt ? `<div class="detail-item"><label>学生端提前告警</label><span>${r.preAlertAt} <span style="font-size:12px;color:var(--text-muted)">（借出后23h50m）</span></span></div>` : ''}
        ${r.forceLogoutAt ? `<div class="detail-item"><label>强制退出登录</label><span>${r.forceLogoutAt} <span style="font-size:12px;color:var(--text-muted)">（借出满24h）</span></span></div>` : ''}
        ${r.alertId ? `<div class="detail-item"><label>关联告警</label><span><button class="btn-link" onclick="openTab('device-alert','状态告警')">${esc(r.alertId)}</button></span></div>` : ''}
        ${r.returnAlertIds?.length ? `<div class="detail-item"><label>归还异常告警</label><span>${r.returnAlertIds.map(id => `<button class="btn-link" onclick="openTab('device-alert','状态告警')">${esc(id)}</button>`).join(' ')}</span></div>` : ''}
      </div>
      <div class="form-section-title">全流程时间线</div>
      <div class="dev-timeline" style="margin-bottom:24px">
        ${renderBorrowTimelineItems(r)}
        ${r.status === 'cancelled'
          ? renderCancelBorrowTimelineItem(r)
          : (r.returnAt ? `
        ${renderReturnPlacementTimelineItem(r)}
        ${renderAppearanceCompareTimelineItem(r)}` : renderPendingReturnTimelineItem(r))}
      </div>
      <div class="form-footer"><button class="btn" onclick="openTab('device-usage')">返回列表</button></div>
    </div>`;
}

function renderDeviceAlertPage(params) {
  if (!params?.keepFilter || alertFilterState === null) {
    alertFilterState = getDefaultAlertFilter();
  }
  const f = alertFilterState;
  const filtered = filterDeviceAlerts(data.deviceAlerts, f);
  return `
    <div class="page-card">
      <div class="page-card-title">状态告警</div>
      <div class="filter-form">
        <div class="filter-item"><label>设备SN</label><input class="input" id="alert-filter-sn" placeholder="请输入" value="${esc(f.sn)}"></div>
        <div class="filter-item"><label>所属柜机ID</label><input class="input" id="alert-filter-cabinet-id" placeholder="请输入" value="${esc(f.cabinetId)}"></div>
        <div class="filter-item"><label>告警类型</label><select class="select" id="alert-filter-type"><option${f.type === '全部' ? ' selected' : ''}>全部</option><option${f.type === '外观损坏' ? ' selected' : ''}>外观损坏</option><option${f.type === '逾期提醒' ? ' selected' : ''}>逾期提醒</option><option${f.type === '未关门' ? ' selected' : ''}>未关门</option><option${f.type === '未充电' ? ' selected' : ''}>未充电</option><option${f.type === '柜机离线' ? ' selected' : ''}>柜机离线</option><option${f.type === '人工问题反馈' ? ' selected' : ''}>人工问题反馈</option></select></div>
        <div class="filter-item"><label>处理状态</label><select class="select" id="alert-filter-status"><option${f.status === '全部' ? ' selected' : ''}>全部</option><option${f.status === '待处理' ? ' selected' : ''}>待处理</option><option${f.status === '已解决' ? ' selected' : ''}>已解决</option></select></div>
        <div class="filter-item"><label>产生时间</label><select class="select" id="alert-filter-month">${renderAlertMonthSelect(f.month)}</select></div>
        <div class="filter-actions"><button type="button" class="btn" onclick="resetAlertFilter()">重置</button><button type="button" class="btn btn-primary" onclick="applyAlertFilter()">搜索</button></div>
      </div>
      <p class="form-hint" style="margin:0 0 12px">按月份查询，当前 ${esc(formatMonthLabel(f.month))}，共 ${filtered.length} 条</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>告警ID</th><th>类型</th><th>设备SN</th><th>格口</th><th>所属柜机ID</th><th>告警内容</th><th>状态</th><th>产生时间</th><th>操作</th>
          </tr></thead>
          <tbody>${renderAlertTableRows(filtered)}</tbody>
        </table>
      </div>
    </div>`;
}
