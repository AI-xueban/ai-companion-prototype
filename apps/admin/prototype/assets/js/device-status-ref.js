/* 设备状态对照 · 独立逻辑整理页（自包含，不依赖管理后台） */

function esc(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function deviceStatusTag(status, isOverdue) {
  if (status === 'overdue' || (status === 'borrowed' && !!isOverdue)) {
    return '<span class="tag tag-device-overdue">逾期</span>';
  }
  const map = {
    in_cabinet: '<span class="tag tag-device-in">在柜</span>',
    borrowed: '<span class="tag tag-device-out">借出中</span>',
    overdue: '<span class="tag tag-device-overdue">逾期未还</span>',
    maintenance: '<span class="tag tag-device-maint">检修中</span>',
    damaged: '<span class="tag tag-device-damaged">损坏</span>',
  };
  return map[status] || esc(status);
}

function doorStatusTag(status) {
  if (!status) return '<span style="color:var(--text-muted)">—</span>';
  if (status === 'closed') return '<span class="tag tag-green">门关</span>';
  if (status === 'open') return '<span class="tag tag-alert-pending">门开</span>';
  return esc(status);
}

function chargingStatusTag(charging) {
  if (charging === null || charging === undefined) return '<span style="color:var(--text-muted)">—</span>';
  return charging
    ? '<span class="tag tag-green">充电中</span>'
    : '<span class="tag tag-gray">未充电</span>';
}

function resolveSlotDisplayState(tablet) {
  if (!tablet || tablet.status === 'borrowed' || tablet.slotState == null) return null;
  if (tablet.slotState === 'maintenance') return 'maintenance';
  const isFull = Number(tablet.battery) >= 100;
  if (isFull && tablet.doorStatus === 'closed') return 'available';
  if (tablet.charging) return 'charging';
  if (tablet.doorStatus === 'open') return 'door_open';
  return 'idle';
}

function slotStateTag(tabletOrState) {
  const state = tabletOrState && typeof tabletOrState === 'object'
    ? resolveSlotDisplayState(tabletOrState)
    : tabletOrState;
  if (state == null) return '<span style="color:var(--text-muted)">—</span>';
  const map = {
    available: '<span class="tag tag-cyan">可借用</span>',
    idle: '<span class="tag tag-device-in">空闲</span>',
    charging: '<span class="tag tag-green">充电中</span>',
    maintenance: '<span class="tag tag-device-maint">检修中</span>',
    door_open: '<span class="tag tag-alert-pending">开门</span>',
  };
  return map[state] || '<span style="color:var(--text-muted)">—</span>';
}

const STATUS_REF_DOORS = [
  { value: 'closed', api: 'doorStatus=closed', label: '门关', desc: '门磁反馈关闭' },
  { value: 'open', api: 'doorStatus=open', label: '门开', desc: '门磁反馈打开' },
  { value: null, api: 'doorStatus=null', label: '—', desc: '借出中或无设备绑定' },
];

const STATUS_REF_CHARGING = [
  { value: true, api: 'charging=true', label: '充电中', desc: '充电模块检测到正在充电' },
  { value: false, api: 'charging=false', label: '未充电', desc: '未检测到充电' },
  { value: null, api: 'charging=null', label: '—', desc: '借出中或无设备绑定' },
];

const STATUS_REF_E3 = [
  { value: 'charging', api: 'slotState=charging', label: 'charging', desc: '归还成功后充电循环；未满时展示「充电中」' },
  { value: 'available', api: 'slotState=available', label: 'available', desc: '充满可借；展示层「可借用」（已充满+门关）' },
  { value: 'maintenance', api: 'slotState=maintenance', label: 'maintenance', desc: '检修禁借；格口状态固定「检修中」' },
  { value: null, api: 'slotState=null', label: '—', desc: '借出中或空仓' },
];

const STATUS_REF_DEVICE = [
  { value: 'in_cabinet', api: 'status=in_cabinet', label: '在柜', desc: '设备在本柜格口，可正常借还' },
  { value: 'borrowed', api: 'status=borrowed', label: '借出中', desc: '学生已借走，离柜使用中' },
  { value: 'borrowed_overdue', api: 'status=borrowed + isOverdue=true', label: '逾期', desc: '借出满 24h 未还，仅展示逾期标签' },
  { value: 'maintenance', api: 'status=maintenance', label: '检修中', desc: '损坏/检修，通常 E3=maintenance' },
];

const STATUS_REF_SLOT_DISPLAY = [
  { order: 1, condition: 'slotState=maintenance', display: '检修中', key: 'maintenance' },
  { order: 2, condition: '已充满且 doorStatus=closed', display: '可借用', key: 'available' },
  { order: 3, condition: 'charging=true（未命中可借用）', display: '充电中', key: 'charging' },
  { order: 4, condition: 'doorStatus=open 且未充电', display: '开门', key: 'door_open' },
  { order: 5, condition: 'doorStatus=closed 且未充满', display: '空闲', key: 'idle' },
  { order: '—', condition: '借出中 / 空仓', display: '—', key: null },
];

const STATUS_REF_MATRIX = [
  { door: 'closed', charging: true, full: true, slot: 'available' },
  { door: 'closed', charging: false, full: true, slot: 'available' },
  { door: 'closed', charging: true, full: false, slot: 'charging' },
  { door: 'open', charging: true, full: false, slot: 'charging' },
  { door: 'closed', charging: false, full: false, slot: 'idle' },
  { door: 'open', charging: false, full: false, slot: 'door_open' },
];

const STATUS_REF_SCENARIOS = [
  { name: '正常在柜可借（充满）', door: 'closed', charging: false, e3: 'available', status: 'in_cabinet', overdue: false, battery: 100, note: '已充满+门关→可借用' },
  { name: '充满仍插电可借', door: 'closed', charging: true, e3: 'available', status: 'in_cabinet', overdue: false, battery: 100, note: '已充满+门关→可借用（优先于充电中）' },
  { name: '归还成功充电中', door: 'closed', charging: true, e3: 'charging', status: 'in_cabinet', overdue: false, battery: 60, note: '未满+充电→充电中' },
  { name: '归还未关门（未插电）', door: 'open', charging: false, e3: 'charging', status: 'in_cabinet', overdue: false, battery: 60, note: '不充电不允许关门；告警=未关门' },
  { name: '归还未关门（已插电）', door: 'open', charging: true, e3: 'charging', status: 'in_cabinet', overdue: false, battery: 60, note: '格口=充电中；告警=未关门' },
  { name: '门开未插电', door: 'open', charging: false, e3: 'charging', status: 'in_cabinet', overdue: false, battery: 60, note: '格口=开门' },
  { name: '学生借出使用中', door: null, charging: null, e3: null, status: 'borrowed', overdue: false, note: '柜门/充电/格口均 —' },
  { name: '借出逾期', door: null, charging: null, e3: null, status: 'borrowed', overdue: true, note: '仅展示逾期标签' },
  { name: '损坏检修', door: 'closed', charging: false, e3: 'maintenance', status: 'maintenance', overdue: false, note: 'E3 优先→格口检修中' },
];

/** 全量合法组合：设备状态 → 柜门 → 格口状态 */
const STATUS_REF_FULL_COMBOS = [
  { branch: '借出中', status: 'borrowed', overdue: false, door: null, charging: null, e3: null, slotKey: null, note: '离柜，无格口感知' },
  { branch: '借出中', status: 'borrowed', overdue: true, door: null, charging: null, e3: null, slotKey: null, note: '离柜 + isOverdue' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'closed', charging: true, e3: 'charging', battery: 60, slotKey: 'charging', note: '未满归还充电中' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'open', charging: true, e3: 'charging', battery: 60, slotKey: 'charging', note: '门未关紧仍充电' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'closed', charging: true, e3: 'available', battery: 100, slotKey: 'available', note: '已充满+门关→可借用（仍插电）' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'closed', charging: false, e3: 'available', battery: 100, slotKey: 'available', note: '已充满+门关→可借用' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'closed', charging: false, e3: 'charging', battery: 80, slotKey: 'idle', note: '门关未满未充→空闲' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'open', charging: false, e3: 'charging', battery: 60, slotKey: 'door_open', note: '门开未充' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'closed', charging: false, e3: 'maintenance', slotKey: 'maintenance', note: 'E3 检修（设备 status 仍可在柜）' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'open', charging: false, e3: 'maintenance', slotKey: 'maintenance', note: '检修优先于门开' },
  { branch: '在柜', status: 'in_cabinet', overdue: false, door: 'closed', charging: true, e3: 'maintenance', slotKey: 'maintenance', note: '检修优先于充电' },
  { branch: '检修中', status: 'maintenance', overdue: false, door: 'closed', charging: false, e3: 'maintenance', slotKey: 'maintenance', note: '损坏检修典型态' },
  { branch: '检修中', status: 'maintenance', overdue: false, door: 'open', charging: false, e3: 'maintenance', slotKey: 'maintenance', note: '检修中开门运维' },
  { branch: '检修中', status: 'maintenance', overdue: false, door: 'closed', charging: true, e3: 'maintenance', slotKey: 'maintenance', note: '检修态覆盖充电展示' },
  { branch: '空仓', status: null, overdue: false, door: null, charging: null, e3: null, slotKey: 'empty', note: '格口网格「空闲」；无设备台账行' },
];

function statusRefChargingCell(row) {
  if (row.charging === null || row.charging === undefined) return chargingStatusTag(null);
  return chargingStatusTag(row.charging);
}

function statusRefComboRow(row) {
  const tablet = row.status
    ? statusRefMockTablet({
      door: row.door === null ? 'null' : row.door,
      charging: row.charging === null ? 'null' : String(row.charging),
      e3: row.e3 === null ? 'null' : row.e3,
      status: row.status,
      overdue: row.overdue,
      battery: row.battery,
    })
    : null;
  const slotHtml = row.slotKey === 'empty'
    ? '<span class="tag tag-gray">空仓</span>'
    : slotStateTag(tablet);
  return `<tr>
    <td>${esc(row.branch)}</td>
    <td>${row.status ? deviceStatusTag(row.status, row.overdue) : '<span style="color:var(--text-muted)">—</span>'}</td>
    <td>${row.door === null ? doorStatusTag(null) : doorStatusTag(row.door)}</td>
    <td>${statusRefChargingCell(row)}</td>
    <td>${slotHtml}</td>
    <td class="status-ref-note">${esc(row.note)}</td>
  </tr>`;
}

function renderStatusRefStateTree() {
  return `
    <div class="status-ref-section status-ref-tree-section">
      <div class="status-ref-section-head">
        <h3>全量状态树</h3>
        <span class="status-ref-section-hint">以设备状态为主干；柜门、格口状态为子节点</span>
      </div>
      <div class="status-ref-section-body">
        <div class="status-ref-tree-grid">
          <div class="status-ref-tree-panel">
            <div class="status-ref-tree-panel-title">总览状态树</div>
            <ul class="status-ref-tree">
              <li class="status-ref-tree-li">
                <div class="status-ref-tree-node status-ref-tree-node--root">设备状态 <code>status</code></div>
                <ul>
                  <li>
                    <div class="status-ref-tree-node">${deviceStatusTag('in_cabinet', false)} <span class="status-ref-tree-meta">在柜 · 有格口感知</span></div>
                    <ul>
                      <li>
                        <div class="status-ref-tree-node status-ref-tree-node--dim">柜门</div>
                        <ul class="status-ref-tree-leaves">
                          <li>${doorStatusTag('closed')} 门关</li>
                          <li>${doorStatusTag('open')} 门开</li>
                        </ul>
                      </li>
                      <li>
                        <div class="status-ref-tree-node status-ref-tree-node--dim">格口状态 <span class="status-ref-tree-meta">slotState≠null 时推导</span></div>
                        <ul class="status-ref-tree-leaves">
                          <li>${slotStateTag('maintenance')} <span class="status-ref-tree-priority">①</span> E3=maintenance</li>
                          <li>${slotStateTag('charging')} <span class="status-ref-tree-priority">②</span> charging=true（含充满仍插电）</li>
                          <li>${slotStateTag('door_open')} <span class="status-ref-tree-priority">③</span> 门开 + 未充</li>
                          <li>${slotStateTag('idle')} <span class="status-ref-tree-priority">④</span> 门关 + 未充</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                  <li>
                    <div class="status-ref-tree-node">${deviceStatusTag('borrowed', false)} <span class="status-ref-tree-meta">借出中 · 离柜</span></div>
                    <ul>
                      <li><div class="status-ref-tree-node status-ref-tree-node--dim">柜门</div><ul class="status-ref-tree-leaves"><li>${doorStatusTag(null)} 无展示</li></ul></li>
                      <li><div class="status-ref-tree-node status-ref-tree-node--dim">格口状态</div><ul class="status-ref-tree-leaves"><li>${slotStateTag(null)} 无展示</li></ul></li>
                      <li><div class="status-ref-tree-node status-ref-tree-node--dim">子态</div><ul class="status-ref-tree-leaves"><li>${deviceStatusTag('borrowed', false)} 正常借出</li><li>${deviceStatusTag('borrowed', true)} 满 24h 未还</li></ul></li>
                    </ul>
                  </li>
                  <li>
                    <div class="status-ref-tree-node">${deviceStatusTag('maintenance', false)} <span class="status-ref-tree-meta">检修中 · 仍在柜</span></div>
                    <ul>
                      <li><div class="status-ref-tree-node status-ref-tree-node--dim">柜门</div><ul class="status-ref-tree-leaves"><li>${doorStatusTag('closed')} 门关</li><li>${doorStatusTag('open')} 门开</li></ul></li>
                      <li><div class="status-ref-tree-node status-ref-tree-node--dim">格口状态</div><ul class="status-ref-tree-leaves"><li>${slotStateTag('maintenance')} E3=maintenance 时固定</li></ul></li>
                    </ul>
                  </li>
                  <li>
                    <div class="status-ref-tree-node"><span class="tag tag-gray">空仓</span> <span class="status-ref-tree-meta">格口无设备 · 仅网格卡片</span></div>
                    <ul>
                      <li><div class="status-ref-tree-node status-ref-tree-node--dim">柜门</div><ul class="status-ref-tree-leaves"><li>无设备台账行；门磁可仍有开/关（不展示在设备列表）</li></ul></li>
                      <li><div class="status-ref-tree-node status-ref-tree-node--dim">格口状态</div><ul class="status-ref-tree-leaves"><li><span class="tag tag-gray">空仓</span></li></ul></li>
                      <li><div class="status-ref-tree-node status-ref-tree-node--dim">设备状态</div><ul class="status-ref-tree-leaves"><li>无对应设备记录</li></ul></li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
          <div class="status-ref-tree-panel">
            <div class="status-ref-tree-panel-title">柜门 · 全部取值</div>
            <ul class="status-ref-tree status-ref-tree--flat">
              <li>${doorStatusTag('closed')} <code>doorStatus=closed</code> · 门磁关</li>
              <li>${doorStatusTag('open')} <code>doorStatus=open</code> · 门磁开</li>
              <li>${doorStatusTag(null)} <code>doorStatus=null</code> · 借出中 / 无设备台账</li>
            </ul>
            <div class="status-ref-tree-panel-title" style="margin-top:20px">充电状态 · 全部取值</div>
            <ul class="status-ref-tree status-ref-tree--flat">
              <li>${chargingStatusTag(true)} <code>charging=true</code> · 含充电中与充满仍插电</li>
              <li>${chargingStatusTag(false)} <code>charging=false</code> · 未充电</li>
              <li>${chargingStatusTag(null)} <code>charging=null</code> · 借出中 / 无设备台账</li>
            </ul>
            <div class="status-ref-tree-panel-title" style="margin-top:20px">格口状态 · 全部取值</div>
            <ul class="status-ref-tree status-ref-tree--flat">
              <li>${slotStateTag('maintenance')} <code>maintenance</code> · E3 检修优先</li>
              <li>${slotStateTag('charging')} <code>charging</code> · 正在充电</li>
              <li>${slotStateTag('door_open')} <code>door_open</code> · 门开未充</li>
              <li>${slotStateTag('idle')} <code>idle</code> · 门关未充</li>
              <li>${slotStateTag(null)} <code>null</code> · 借出 / slotState 为空</li>
              <li><span class="tag tag-gray">空仓</span> <code>empty</code> · 格口网格无设备</li>
            </ul>
            <div class="status-ref-tree-panel-title" style="margin-top:20px">设备状态 · 全部取值</div>
            <ul class="status-ref-tree status-ref-tree--flat">
              <li>${deviceStatusTag('in_cabinet', false)} <code>in_cabinet</code></li>
              <li>${deviceStatusTag('borrowed', false)} <code>borrowed</code></li>
              <li>${deviceStatusTag('borrowed', true)} <code>borrowed</code> + <code>isOverdue=true</code></li>
              <li>${deviceStatusTag('maintenance', false)} <code>maintenance</code></li>
            </ul>
          </div>
        </div>
        <div class="status-ref-tree-table-title">全部分支组合对照表</div>
        <div class="table-wrap">
          <table class="data-table status-ref-table">
            <thead><tr><th>分支</th><th>设备状态</th><th>柜门</th><th>充电状态</th><th>格口状态</th><th>说明</th></tr></thead>
            <tbody>${STATUS_REF_FULL_COMBOS.map(statusRefComboRow).join('')}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function statusRefMockTablet({ door, charging, e3, status, overdue, battery }) {
  const doorVal = door === 'null' ? null : door;
  const chargingVal = charging === 'null' ? null : charging === 'true' ? true : charging === 'false' ? false : null;
  const e3Val = e3 === 'null' ? null : e3;
  let batteryVal = battery;
  if (batteryVal == null) {
    if (e3Val === 'available') batteryVal = 100;
    else if (status === 'borrowed') batteryVal = null;
    else batteryVal = 60;
  }
  return {
    doorStatus: doorVal,
    charging: chargingVal,
    slotState: e3Val,
    status,
    isOverdue: !!overdue,
    battery: batteryVal,
  };
}

function statusRefListPreview(tablet) {
  return `
    <div class="status-ref-preview-row">
      <div class="status-ref-preview-cell"><span class="status-ref-preview-label">柜门</span>${doorStatusTag(tablet.doorStatus)}</div>
      <div class="status-ref-preview-cell"><span class="status-ref-preview-label">充电</span>${chargingStatusTag(tablet.charging)}</div>
      <div class="status-ref-preview-cell"><span class="status-ref-preview-label">格口状态</span>${slotStateTag(tablet)}</div>
      <div class="status-ref-preview-cell"><span class="status-ref-preview-label">设备状态</span>${deviceStatusTag(tablet.status, tablet.isOverdue)}</div>
    </div>
  `;
}

function statusRefEnumRow(item, tagHtml) {
  return `<tr>
    <td><code>${esc(item.api)}</code></td>
    <td>${tagHtml || esc(item.label)}</td>
    <td>${esc(item.desc)}</td>
  </tr>`;
}

function statusRefMatrixRow(row) {
  const tablet = statusRefMockTablet({
    door: row.door,
    charging: String(row.charging),
    e3: row.full ? 'available' : 'charging',
    status: 'in_cabinet',
    overdue: false,
    battery: row.full ? 100 : 60,
  });
  return `<tr>
    <td>${doorStatusTag(row.door)}</td>
    <td>${row.full ? '<span class="tag tag-cyan">已充满</span>' : '<span class="tag tag-gray">未满</span>'}</td>
    <td>${chargingStatusTag(row.charging)}</td>
    <td>${slotStateTag(tablet)}</td>
    <td><code>${esc(row.slot)}</code></td>
  </tr>`;
}

function statusRefScenarioRow(s, idx) {
  const tablet = statusRefMockTablet({
    door: s.door === null ? 'null' : s.door,
    charging: s.charging === null ? 'null' : String(s.charging),
    e3: s.e3 === null ? 'null' : s.e3,
    status: s.status,
    overdue: s.overdue,
    battery: s.battery,
  });
  return `<tr class="status-ref-scenario-row" data-scenario="${idx}">
    <td>${esc(s.name)}</td>
    <td>${doorStatusTag(tablet.doorStatus)}</td>
    <td>${chargingStatusTag(tablet.charging)}</td>
    <td>${slotStateTag(tablet)}</td>
    <td>${deviceStatusTag(tablet.status, tablet.isOverdue)}</td>
    <td class="status-ref-note">${esc(s.note)}</td>
  </tr>`;
}

function renderStatusRefSimulator() {
  return `
    <div class="status-ref-section status-ref-simulator" id="status-ref-simulator">
      <div class="status-ref-section-head">
        <h3>交互模拟</h3>
        <span class="status-ref-section-hint">调整底层字段，实时预览列表四列展示</span>
      </div>
      <div class="status-ref-section-body">
        <div class="status-ref-sim-controls">
          <label>柜门 E4
            <select id="status-ref-door" onchange="updateStatusRefSimulator()">
              <option value="closed">门关 closed</option>
              <option value="open">门开 open</option>
              <option value="null">— null</option>
            </select>
          </label>
          <label>充电 E5
            <select id="status-ref-charging" onchange="updateStatusRefSimulator()">
              <option value="true">充电中 true</option>
              <option value="false">未充电 false</option>
              <option value="null">— null</option>
            </select>
          </label>
          <label>格口业务 E3
            <select id="status-ref-e3" onchange="updateStatusRefSimulator()">
              <option value="charging">charging</option>
              <option value="available">available</option>
              <option value="maintenance">maintenance</option>
              <option value="null">— null</option>
            </select>
          </label>
          <label>设备 status
            <select id="status-ref-status" onchange="updateStatusRefSimulator()">
              <option value="in_cabinet">在柜 in_cabinet</option>
              <option value="borrowed">借出 borrowed</option>
              <option value="maintenance">检修 maintenance</option>
            </select>
          </label>
          <label class="status-ref-check">
            <input type="checkbox" id="status-ref-overdue" onchange="updateStatusRefSimulator()"> isOverdue
          </label>
        </div>
        <div class="status-ref-sim-presets">
          <span class="status-ref-presets-label">快捷场景：</span>
          ${STATUS_REF_SCENARIOS.map((s, i) => `<button type="button" class="btn status-ref-preset-btn" onclick="applyStatusRefPreset(${i})">${esc(s.name)}</button>`).join('')}
        </div>
        <div class="status-ref-sim-output" id="status-ref-sim-output"></div>
        <div class="status-ref-sim-code" id="status-ref-sim-code"></div>
      </div>
    </div>
  `;
}
function renderDeviceStatusRefPage() {
  return `
    <div class="status-ref-standalone">
      <header class="status-ref-header">
        <h1 class="status-ref-title">设备状态对照</h1>
        <p class="status-ref-page-desc">柜门、充电、格口状态、设备状态四层分工与对应关系（对齐需求文档 §4.6 / §4.9）</p>
      </header>
      <div class="status-ref-page">
    <div class="status-ref-section status-ref-overview">
      <div class="status-ref-section-body">
        <div class="status-ref-layer-grid">
          <div class="status-ref-layer">
            <div class="status-ref-layer-title">柜门 <code>doorStatus</code> E4</div>
            <div class="status-ref-layer-meta">门磁原样 · 2 态 + 空</div>
          </div>
          <div class="status-ref-layer-arrow">→</div>
          <div class="status-ref-layer">
            <div class="status-ref-layer-title">充电 <code>charging</code> E5</div>
            <div class="status-ref-layer-meta">充电模块原样 · 2 态 + 空</div>
          </div>
          <div class="status-ref-layer-arrow">→</div>
          <div class="status-ref-layer status-ref-layer-highlight">
            <div class="status-ref-layer-title">格口状态（展示）</div>
            <div class="status-ref-layer-meta">由 E3 + 门 + 充电推导 · 4 态</div>
          </div>
          <div class="status-ref-layer-sep"></div>
          <div class="status-ref-layer">
            <div class="status-ref-layer-title">设备状态 <code>status</code></div>
            <div class="status-ref-layer-meta">生命周期主态 · 独立维度</div>
          </div>
        </div>
        <p class="status-ref-tip">借出中（<code>status=borrowed</code>）时：柜门、充电、格口状态均展示 <strong>—</strong>。归还未关门走告警通道，不写入格口状态文案。</p>
      </div>
    </div>

    ${renderStatusRefStateTree()}

    ${renderStatusRefSimulator()}

    <div class="status-ref-grid-2">
      <div class="status-ref-section">
        <div class="status-ref-section-head"><h3>柜门 doorStatus（E4）</h3></div>
        <div class="status-ref-section-body table-wrap">
          <table class="data-table status-ref-table">
            <thead><tr><th>接口取值</th><th>列表展示</th><th>说明</th></tr></thead>
            <tbody>
              ${STATUS_REF_DOORS.map(d => statusRefEnumRow(d, doorStatusTag(d.value))).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="status-ref-section">
        <div class="status-ref-section-head"><h3>充电 charging（E5）</h3></div>
        <div class="status-ref-section-body table-wrap">
          <table class="data-table status-ref-table">
            <thead><tr><th>接口取值</th><th>列表展示</th><th>说明</th></tr></thead>
            <tbody>
              ${STATUS_REF_CHARGING.map(c => statusRefEnumRow(c, chargingStatusTag(c.value))).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="status-ref-section">
      <div class="status-ref-section-head">
        <h3>格口业务态 slotState（E3）</h3>
        <span class="status-ref-section-hint">不直接作为「格口状态」列文案（maintenance 除外）</span>
      </div>
      <div class="status-ref-section-body table-wrap">
        <table class="data-table status-ref-table">
          <thead><tr><th>接口取值</th><th>枚举</th><th>说明</th></tr></thead>
          <tbody>
            ${STATUS_REF_E3.map(e => statusRefEnumRow(e, `<code>${esc(e.label)}</code>`)).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="status-ref-section">
      <div class="status-ref-section-head">
        <h3>格口状态展示规则</h3>
        <span class="status-ref-section-hint">判定顺序自上而下，命中即停</span>
      </div>
      <div class="status-ref-section-body table-wrap">
        <table class="data-table status-ref-table">
          <thead><tr><th>顺序</th><th>条件</th><th>展示</th><th>展示 key</th></tr></thead>
          <tbody>
            ${STATUS_REF_SLOT_DISPLAY.map(r => {
              let previewTablet;
              if (!r.key) {
                previewTablet = statusRefMockTablet({ door: 'null', charging: 'null', e3: 'null', status: 'borrowed', overdue: false });
              } else if (r.key === 'maintenance') {
                previewTablet = statusRefMockTablet({ door: 'closed', charging: 'false', e3: 'maintenance', status: 'in_cabinet', overdue: false });
              } else if (r.key === 'charging') {
                previewTablet = statusRefMockTablet({ door: 'closed', charging: 'true', e3: 'charging', status: 'in_cabinet', overdue: false });
              } else if (r.key === 'door_open') {
                previewTablet = statusRefMockTablet({ door: 'open', charging: 'false', e3: 'charging', status: 'in_cabinet', overdue: false });
              } else {
                previewTablet = statusRefMockTablet({ door: 'closed', charging: 'false', e3: 'available', status: 'in_cabinet', overdue: false });
              }
              const preview = slotStateTag(previewTablet);
              return `<tr>
                <td>${esc(String(r.order))}</td>
                <td>${esc(r.condition)}</td>
                <td>${preview}</td>
                <td><code>${esc(r.key || '—')}</code></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="status-ref-section">
      <div class="status-ref-section-head">
        <h3>门 × 已充满 × 充电 → 格口状态</h3>
        <span class="status-ref-section-hint">检修中（E3=maintenance）优先，下表不含检修；已充满+门关=可借用</span>
      </div>
      <div class="status-ref-section-body table-wrap">
        <table class="data-table status-ref-table">
          <thead><tr><th>柜门</th><th>电量</th><th>充电</th><th>格口状态</th><th>resolve key</th></tr></thead>
          <tbody>${STATUS_REF_MATRIX.map(statusRefMatrixRow).join('')}</tbody>
        </table>
      </div>
    </div>

    <div class="status-ref-section">
      <div class="status-ref-section-head"><h3>设备状态 status</h3></div>
      <div class="status-ref-section-body table-wrap">
        <table class="data-table status-ref-table">
          <thead><tr><th>接口取值</th><th>列表展示</th><th>说明</th></tr></thead>
          <tbody>
            ${STATUS_REF_DEVICE.map(d => {
              const tablet = d.value === 'borrowed_overdue'
                ? { status: 'borrowed', isOverdue: true }
                : { status: d.value, isOverdue: false };
              return statusRefEnumRow(d, deviceStatusTag(tablet.status, tablet.isOverdue));
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="status-ref-section">
      <div class="status-ref-section-head">
        <h3>典型场景对照</h3>
        <span class="status-ref-section-hint">点击行或上方快捷按钮载入模拟器</span>
      </div>
      <div class="status-ref-section-body table-wrap">
        <table class="data-table status-ref-table status-ref-scenario-table">
          <thead><tr><th>场景</th><th>柜门</th><th>充电</th><th>格口状态</th><th>设备状态</th><th>备注</th></tr></thead>
          <tbody>${STATUS_REF_SCENARIOS.map(statusRefScenarioRow).join('')}</tbody>
        </table>
      </div>
    </div>
      </div>
    </div>
  `;
}

function updateStatusRefSimulator() {
  const door = document.getElementById('status-ref-door')?.value ?? 'closed';
  const charging = document.getElementById('status-ref-charging')?.value ?? 'false';
  const e3 = document.getElementById('status-ref-e3')?.value ?? 'charging';
  const status = document.getElementById('status-ref-status')?.value ?? 'in_cabinet';
  const overdue = document.getElementById('status-ref-overdue')?.checked ?? false;
  const tablet = statusRefMockTablet({ door, charging, e3, status, overdue });
  const resolved = resolveSlotDisplayState(tablet);

  const output = document.getElementById('status-ref-sim-output');
  const code = document.getElementById('status-ref-sim-code');
  if (output) output.innerHTML = statusRefListPreview(tablet);
  if (code) {
    code.innerHTML = `
      <div class="status-ref-code-line"><strong>输入：</strong><code>doorStatus=${esc(String(tablet.doorStatus))}</code> · <code>charging=${esc(String(tablet.charging))}</code> · <code>slotState=${esc(String(tablet.slotState))}</code> · <code>status=${esc(tablet.status)}</code>${tablet.isOverdue ? ' · <code>isOverdue=true</code>' : ''}</div>
      <div class="status-ref-code-line"><strong>推导：</strong><code>resolveSlotDisplayState() → ${esc(String(resolved ?? 'null'))}</code></div>
    `;
  }
}

function applyStatusRefPreset(idx) {
  const s = STATUS_REF_SCENARIOS[idx];
  if (!s) return;
  const doorEl = document.getElementById('status-ref-door');
  const chargingEl = document.getElementById('status-ref-charging');
  const e3El = document.getElementById('status-ref-e3');
  const statusEl = document.getElementById('status-ref-status');
  const overdueEl = document.getElementById('status-ref-overdue');
  if (doorEl) doorEl.value = s.door === null ? 'null' : s.door;
  if (chargingEl) chargingEl.value = s.charging === null ? 'null' : String(s.charging);
  if (e3El) e3El.value = s.e3 === null ? 'null' : s.e3;
  if (statusEl) statusEl.value = s.status;
  if (overdueEl) overdueEl.checked = !!s.overdue;
  updateStatusRefSimulator();
  document.getElementById('status-ref-simulator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initDeviceStatusRefPage() {
  updateStatusRefSimulator();
  document.querySelectorAll('.status-ref-scenario-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = Number(row.dataset.scenario);
      if (!Number.isNaN(idx)) applyStatusRefPreset(idx);
    });
  });
}

window.updateStatusRefSimulator = updateStatusRefSimulator;
window.applyStatusRefPreset = applyStatusRefPreset;

function mountDeviceStatusRefPage(container) {
  const el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;
  el.innerHTML = renderDeviceStatusRefPage();
  initDeviceStatusRefPage();
}

document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('status-ref-root');
  if (root) mountDeviceStatusRefPage(root);
});
