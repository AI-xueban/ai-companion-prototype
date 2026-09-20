/* 金币运营 · 捐赠与爱心池 */

const LOVE_COIN_RATE = 100;

const MALL_TABS = [
  { key: 'donations', label: '捐赠记录' },
  { key: 'past', label: '往期项目' },
  { key: 'ledger', label: '爱心池台账' },
  { key: 'monthly', label: '月报与公示' },
];

const CURRENT_PROJECT_STATUS = {
  preparing: { label: '筹备中', tag: 'tag-green' },
  raising: { label: '募集中', tag: 'tag-green' },
  executing: { label: '执行中', tag: 'tag-blue' },
  done: { label: '已完成', tag: 'tag-gray' },
  closed: { label: '已结项', tag: 'tag-gray' },
};

const LOVE_PROJECT_LIMIT = 6;

const LOVE_PROJECT_GROUPS = [
  { key: 'ongoing', label: '进行中' },
  { key: 'done', label: '已完成' },
  { key: 'closed', label: '已结项' },
];

const LOVE_PROJECT_STATUS = {
  ongoing: { label: '进行中', tag: 'tag-green' },
  done: { label: '已完成', tag: 'tag-gray' },
  cancelled: { label: '已取消', tag: 'tag-red' },
};

const LOVE_PROJECT_IMAGE_MAX_MB = 10;
const LOVE_PROJECT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';
const LOVE_PROJECT_MEDIA_MAX = 9;
const LOVE_PROJECT_MEDIA_ACCEPT = `${LOVE_PROJECT_IMAGE_ACCEPT},video/mp4,video/quicktime,.mp4,.mov`;

let loveProjectImageState = { url: '', name: '' };
let loveProjectMediaState = [];
let mallStageOutcomeImages = [];
let mallPublishingStageId = '';
let mallLedgerPeriod = 'month';

function resolveLoveProjectStatus(status) {
  if (status === 'done') return 'done';
  if (status === 'cancelled') return 'cancelled';
  return 'ongoing';
}

let mallPageState = {
  tab: 'donations',
  projectGroup: 'ongoing',
  keyword: '',
  timeRange: 'all',
  donationQueried: false,
  donationAllProjects: true,
  donationProjects: [],
  page: 1,
  pageSize: 10,
};

let pastProjectState = {
  keyword: '',
  timeRange: 'all',
  page: 1,
  pageSize: 10,
};

function coinsToLove(coins) {
  return Math.round((Number(coins) || 0) / LOVE_COIN_RATE * 100) / 100;
}

function formatMallNum(n, digits = 0) {
  const num = Number(n) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatYuan(n) {
  const num = Number(n) || 0;
  const digits = num % 1 === 0 ? 0 : (Math.round(num * 10) === num * 10 ? 1 : 2);
  return `¥${formatMallNum(num, digits)}`;
}

function mallTodayYmd() {
  const d = new Date();
  const p = x => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function mallInTimeRange(datetime, range) {
  if (!range || range === 'all') return true;
  const ymd = String(datetime || '').slice(0, 10);
  if (!ymd) return false;
  const today = mallTodayYmd();
  if (range === 'today') return ymd === today;
  const start = new Date(`${today}T00:00:00`);
  if (range === '7d') {
    start.setDate(start.getDate() - 6);
    return ymd >= start.toISOString().slice(0, 10);
  }
  if (range === '30d') {
    start.setDate(start.getDate() - 29);
    return ymd >= start.toISOString().slice(0, 10);
  }
  if (range === 'month') return ymd.slice(0, 7) === today.slice(0, 7);
  return true;
}

function getMallDonations() {
  return data.donations || [];
}

function getMallSummary() {
  const list = getMallDonations();
  const today = mallTodayYmd();
  const totalCoins = list.reduce((s, r) => s + (r.coins || 0), 0);
  const todayList = list.filter(r => String(r.donatedAt || '').slice(0, 10) === today);
  const todayCoins = todayList.reduce((s, r) => s + (r.coins || 0), 0);
  const loveCoins = coinsToLove(totalCoins);
  const matchingYuan = loveCoins * (data.lovePoolMatchingRate ?? 1);
  return {
    poolYuan: loveCoins,
    totalCoins,
    matchingYuan,
    todayCoins,
    todayCount: todayList.length,
    loveCoins,
  };
}

function getClosedStages() {
  return getCurrentLoveProject().history || [];
}

function getNextClosedStageId() {
  const nums = getClosedStages().map(p => Number(String(p.id || '').replace(/\D/g, '')) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `STG-${String(next).padStart(3, '0')}`;
}

function getClosedStageDonations(stage) {
  if (!stage) return [];
  return getMallDonations().filter(r =>
    (stage.id && r.fundedStageId === stage.id) ||
    (stage.name && r.fundedProject === stage.name)
  );
}

function filterPastProjects() {
  const kw = (pastProjectState.keyword || '').trim().toLowerCase();
  return getClosedStages().filter(r => {
    if (kw) {
      const hit = [r.id, r.name, r.period].some(v => String(v || '').toLowerCase().includes(kw));
      if (!hit) return false;
    }
    return mallInTimeRange(r.closedAt, pastProjectState.timeRange);
  });
}

function getCurrentLoveProject() {
  return data.loveProject || {};
}

function getCurrentProjectRaised() {
  const p = getCurrentLoveProject();
  if (p.raisedCoins != null && p.raisedCoins !== '') return Number(p.raisedCoins) || 0;
  return getMallDonations().reduce((s, r) => s + (r.coins || 0), 0);
}

function formatLoveDateRange(start, end) {
  const a = String(start || '').slice(0, 10);
  const b = String(end || '').slice(0, 10);
  if (a && b) return `${a}~${b}`;
  return a || b || '—';
}

function resolveCurrentProjectStatus(status) {
  if (CURRENT_PROJECT_STATUS[status]) return status;
  if (status === 'ongoing') return 'raising';
  return 'preparing';
}

function filterMallDonations() {
  const kw = (mallPageState.keyword || '').trim().toLowerCase();
  const selectedProjects = mallPageState.donationAllProjects
    ? null
    : new Set(mallPageState.donationProjects || []);
  return getMallDonations().filter(r => {
    if (kw) {
      const hit = [r.id, r.studentName, r.studentId].some(v => String(v || '').toLowerCase().includes(kw));
      if (!hit) return false;
    }
    if (selectedProjects && !selectedProjects.has(String(r.fundedProject || ''))) return false;
    return mallInTimeRange(r.donatedAt, mallPageState.timeRange);
  });
}

function exportMallCsv(filename, headers, rows) {
  if (!rows.length) {
    toast('当前筛选条件下暂无可导出的数据', 'warning');
    return;
  }
  const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const content = '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast(`已导出 ${rows.length} 条记录`);
}

function exportMallDonationCsv() {
  const rows = filterMallDonations().map(r => [
    r.id, r.studentId, r.school, r.className, formatMallNum(r.coins),
    formatYuan(coinsToLove(r.coins)), formatMallNum(r.balanceAfter), r.fundedProject || '—', r.donatedAt,
  ]);
  exportMallCsv(`捐赠记录_${new Date().toISOString().slice(0, 10)}.csv`, [
    '捐赠编号', '学生', '学校', '班级', '捐赠金币', '折合爱心值', '捐赠后金币余额', '被资助项目', '捐赠时间',
  ], rows);
}

function exportMallExchangeCsv() {
  const rows = filterMallExchanges().map(r => [
    r.id, r.studentId, r.school, r.className, formatMallNum(r.coins),
    formatMallNum(r.loveValue ?? coinsToLove(r.coins), (r.loveValue ?? coinsToLove(r.coins)) % 1 ? 2 : 0),
    r.exchangedAt,
  ]);
  exportMallCsv(`爱心值兑换_${new Date().toISOString().slice(0, 10)}.csv`, [
    '兑换编号', '学号', '学校', '班级', '消耗金币', '获得爱心值', '兑换时间',
  ], rows);
}

function exportPastProjectCsv() {
  const rows = filterPastProjects().map(r => {
    const raised = Number(r.raisedCoins) || 0;
    return [
      r.id || '—', r.name || '—', r.period || formatLovePeriod(r.periodStart, r.periodEnd),
      formatMallNum(raised), formatYuan(coinsToLove(raised)), formatMallNum(r.targetCoins), '已结项',
      r.published ? '已公示' : '未公示',
      getClosedStageDonations(r).length, r.closedAt || '—',
    ];
  });
  exportMallCsv(`往期项目_${new Date().toISOString().slice(0, 10)}.csv`, [
    '结项编号', '项目名称', '阶段周期', '捐赠金币', '折合人民币', '募集上限', '状态', '公示状态', '捐赠笔数', '结项时间',
  ], rows);
}

function exportMallPublicityCsv() {
  const rows = getMallMonthlyRows().map(r => [
    mallMonthlyTitle(r), mallMonthlyPeriod(r.month), r.status === 'published' ? '已发布' : '草稿',
    r.publishedAt ? r.publishedAt.slice(0, 10) : '—', formatMallNum(r.donateCoins), formatMallNum(r.participants),
  ]);
  exportMallCsv('爱心月报_' + mallTodayYmd() + '.csv',
    ['月报标题', '统计周期', '状态', '发布时间', '捐赠金币', '参与人数'], rows);
}

function exportMallLedgerCsv() {
  const rows = filterMallLedger().map(r => [
    r.createdAt || '—', r.type === 'donate' ? '学生捐赠' : '项目支出',
    mallLedgerDescription(r), formatYuan(r.balanceYuan),
  ]);
  exportMallCsv('爱心池台账_' + mallTodayYmd() + '.csv', ['时间', '类型', '说明', '池子余额'], rows);
}

function renderMallExportBtn(onclick) {
  return `
    <button type="button" class="mall-export-btn" onclick="${onclick}" title="导出 Excel" aria-label="导出 Excel">
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <path d="M8 2.5v7.2M5.2 7.2 8 10l2.8-2.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M3 12.8h10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
    </button>
  `;
}

function renderMallListTools(leftHtml, exportOnclick) {
  return `
    <div class="mall-list-tools">
      <div class="mall-list-tools-left">${leftHtml || ''}</div>
      ${renderMallExportBtn(exportOnclick)}
    </div>
  `;
}

function filterMallLedger() {
  const kw = (mallPageState.keyword || '').trim().toLowerCase();
  return getMallLedgerRows().filter(r => {
    if (mallPageState.ledgerType && mallPageState.ledgerType !== 'all' && r.type !== mallPageState.ledgerType) return false;
    if (kw) {
      const hit = [r.id, r.summary, r.type].some(v => String(v || '').toLowerCase().includes(kw));
      if (!hit) return false;
    }
    return mallInTimeRange(r.createdAt, mallPageState.timeRange);
  });
}

function getMallLedgerRows() {
  return (data.loveLedger || []).filter(r => r.type === 'donate' || r.type === 'payout')
    .slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function getMallExchanges() {
  return data.loveExchanges || [];
}

function filterMallExchanges() {
  const kw = (mallPageState.keyword || '').trim().toLowerCase();
  return getMallExchanges().filter(r => {
    if (kw) {
      const hit = [r.id, r.studentId, r.studentName].some(v => String(v || '').toLowerCase().includes(kw));
      if (!hit) return false;
    }
    return mallInTimeRange(r.exchangedAt, mallPageState.timeRange);
  });
}

function paginateMall(list) {
  const { page, pageSize } = mallPageState;
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(Math.max(1, page), pages);
  const start = (cur - 1) * pageSize;
  return { total, pages, page: cur, rows: list.slice(start, start + pageSize) };
}

function paginateSlice(list, page, pageSize) {
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(Math.max(1, page), pages);
  const start = (cur - 1) * pageSize;
  return { total, pages, page: cur, rows: list.slice(start, start + pageSize) };
}

function pageWindow(page, pages, max = 7) {
  if (pages <= max) return Array.from({ length: pages }, (_, i) => i + 1);
  let start = Math.max(1, page - Math.floor(max / 2));
  let end = start + max - 1;
  if (end > pages) {
    end = pages;
    start = Math.max(1, end - max + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function renderMallPagination(total) {
  const pages = Math.max(1, Math.ceil(total / mallPageState.pageSize));
  const page = Math.min(mallPageState.page, pages);
  const nums = [];
  for (let i = 1; i <= pages && i <= 7; i++) nums.push(i);
  return `
    <div class="mall-table-footer">
      <span class="mall-total">共 ${total} 条</span>
      <div class="pagination">
        <span class="page-btn ${page <= 1 ? 'disabled' : ''}" ${page > 1 ? `onclick="mallGotoPage(${page - 1})"` : ''}>‹</span>
        ${nums.map(n => `<span class="page-btn ${n === page ? 'active' : ''}" onclick="mallGotoPage(${n})">${n}</span>`).join('')}
        <span class="page-btn ${page >= pages ? 'disabled' : ''}" ${page < pages ? `onclick="mallGotoPage(${page + 1})"` : ''}>›</span>
      </div>
    </div>
  `;
}

function mallGotoPage(page) {
  mallPageState.page = page;
  navigate('mall', { keepFilter: true });
}

function switchMallTab(tab) {
  mallPageState.tab = tab;
  mallPageState.page = 1;
  navigate('mall', { keepFilter: true });
}

function applyMallFilter() {
  mallPageState.keyword = (document.getElementById('mall-filter-kw')?.value || '').trim();
  mallPageState.timeRange = document.getElementById('mall-filter-time')?.value || 'all';
  if (mallPageState.tab === 'ledger') mallPageState.ledgerType = document.getElementById('mall-ledger-type')?.value || 'all';
  if (mallPageState.tab === 'donations') {
    const allProjects = Boolean(document.getElementById('mall-project-all')?.checked);
    mallPageState.donationAllProjects = allProjects;
    mallPageState.donationProjects = allProjects
      ? []
      : Array.from(document.querySelectorAll('.mall-project-option:checked')).map(el => el.value);
  }
  mallPageState.page = 1;
  navigate('mall', { keepFilter: true });
}

function resetMallFilter() {
  mallPageState.keyword = '';
  mallPageState.timeRange = 'all';
  if (mallPageState.tab === 'ledger') mallPageState.ledgerType = 'all';
  if (mallPageState.tab === 'donations') {
    mallPageState.donationAllProjects = true;
    mallPageState.donationProjects = [];
  }
  mallPageState.page = 1;
  navigate('mall', { keepFilter: true });
}

function getMallDonationProjectNames() {
  const names = new Set();
  const current = String(getCurrentLoveProject()?.name || '').trim();
  if (current) names.add(current);
  (data.loveProject?.history || []).forEach(s => {
    const name = String(s.name || '').trim();
    if (name) names.add(name);
  });
  getMallDonations().forEach(r => {
    const name = String(r.fundedProject || '').trim();
    if (name) names.add(name);
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function filterMallProjectOptions(value) {
  const kw = String(value || '').trim().toLowerCase();
  document.querySelectorAll('.mall-project-option-row').forEach(row => {
    row.hidden = Boolean(kw) && !String(row.dataset.name || '').toLowerCase().includes(kw);
  });
}

function toggleMallAllProjects(checked) {
  document.querySelectorAll('.mall-project-option').forEach(el => {
    el.checked = checked;
    el.disabled = checked;
  });
  updateMallProjectPickerLabel();
}

function syncMallAllProjects() {
  const all = document.getElementById('mall-project-all');
  if (all) all.checked = false;
  document.querySelectorAll('.mall-project-option').forEach(el => { el.disabled = false; });
  updateMallProjectPickerLabel();
}

function updateMallProjectPickerLabel() {
  const label = document.getElementById('mall-project-picker-label');
  if (!label) return;
  if (document.getElementById('mall-project-all')?.checked) {
    label.textContent = '全部项目';
    return;
  }
  const selected = document.querySelectorAll('.mall-project-option:checked').length;
  label.textContent = selected ? `已选 ${selected} 个项目` : '请选择项目';
}

function renderMallStatCards(summary) {
  return `
    <div class="mall-stat-row">
      <div class="mall-stat-card">
        <div class="label">当前爱心池总额</div>
        <div class="value">${formatYuan(summary.poolYuan)}</div>
        <div class="sub">当前项目总额</div>
      </div>
      <div class="mall-stat-card">
        <div class="label">累计捐赠金币</div>
        <div class="value">${formatMallNum(summary.totalCoins)}</div>
      </div>
      <div class="mall-stat-card">
        <div class="label">平台配套资助</div>
        <div class="value">${formatYuan(summary.matchingYuan)}</div>
        <div class="sub">通晤纪累计投入</div>
      </div>
      <div class="mall-stat-card">
        <div class="label">今日捐赠金币</div>
        <div class="value">${formatMallNum(summary.todayCoins)}</div>
        <div class="sub">${summary.todayCount} 人次</div>
      </div>
    </div>
  `;
}

function formatCurrentProjectPeriodText(p = {}) {
  if (p.period) return p.period;
  return formatLovePeriod(p.periodStart, p.periodEnd) || formatLoveDateRange(p.periodStart, p.periodEnd);
}

function renderMallProjectBanner() {
  const p = getCurrentLoveProject();
  const raised = getCurrentProjectRaised();
  const target = Number(p.targetCoins) || 0;
  const remain = Math.max(0, target - raised);
  const pct = target ? Math.min(100, Math.round(raised / target * 100)) : 0;
  const barPct = raised > 0 ? Math.max(pct, 0.4) : 0;
  const statusKey = resolveCurrentProjectStatus(p.status);
  const st = CURRENT_PROJECT_STATUS[statusKey];
  const period = p.period || formatLoveDateRange(p.periodStart, p.periodEnd);
  return `
    <div class="mall-project-banner">
      <div class="mall-project-top">
        <div>
          <div class="mall-project-kicker">当前爱心项目</div>
          <div class="mall-banner-name">${esc(p.name || '—')}</div>
          <div class="mall-project-meta">
            <span>${esc(period)}</span>
            <span class="tag ${st.tag}">${st.label}</span>
          </div>
          <div class="mall-project-raised">已筹 ${formatMallNum(raised)} / ${formatMallNum(target)} 金币</div>
        </div>
        <div class="mall-banner-actions">
          <button type="button" class="btn" onclick="openMallAdjustLimitModal()">调整上限</button>
          <button type="button" class="btn btn-love" onclick="confirmMallNextStage()">结项并开下阶段</button>
        </div>
      </div>
      <div class="mall-progress-row">
        <div class="mall-progress-track"><div class="mall-progress-bar" style="width:${barPct}%"></div></div>
        <div class="mall-progress-text">剩余 ${formatMallNum(remain)} 金币 · ${pct}%</div>
      </div>
    </div>
  `;
}

function toMallMonth(value) {
  const match = String(value || '').match(/(\d{4})(?:年\s*|[-/.])(\d{1,2})/);
  if (!match) return '';
  return `${match[1]}-${String(match[2]).padStart(2, '0')}`;
}

function parseMallPeriodInput(text) {
  const raw = String(text || '').trim();
  const yearMonths = Array.from(raw.matchAll(/(\d{4})\s*(?:年\s*|[-/.])\s*(\d{1,2})/g))
    .map(m => `${m[1]}-${String(Number(m[2])).padStart(2, '0')}`);
  if (yearMonths.length >= 2) return { start: yearMonths[0], end: yearMonths[1] };
  if (yearMonths.length === 1) {
    const sep = raw.search(/[—\-–至~～]/);
    const after = sep >= 0 ? raw.slice(sep) : '';
    const monthOnly = after.match(/(\d{1,2})\s*月/);
    if (monthOnly) {
      const year = yearMonths[0].slice(0, 4);
      return { start: yearMonths[0], end: `${year}-${String(Number(monthOnly[1])).padStart(2, '0')}` };
    }
    return { start: yearMonths[0], end: yearMonths[0] };
  }
  return { start: '', end: '' };
}

function getMallProjectMonthRange(project = {}) {
  const start = toMallMonth(project.periodStart);
  const end = toMallMonth(project.periodEnd);
  if (start && end) return { start, end };
  const matches = Array.from(String(project.period || '').matchAll(/(\d{4})(?:年\s*|[-/.])(\d{1,2})/g))
    .map(match => `${match[1]}-${String(match[2]).padStart(2, '0')}`);
  const fallback = mallTodayYmd().slice(0, 7);
  return { start: start || matches[0] || fallback, end: end || matches[1] || matches[0] || fallback };
}

function openMallAdjustLimitModal() {
  const project = getCurrentLoveProject();
  const current = project.targetCoins || 0;
  const raised = getCurrentProjectRaised();
  fillMallModal({
    title: '调整筹款上限',
    size: 'md',
    footerEnd: true,
    body: `
      <div class="mall-limit-modal">
        <p class="mall-limit-lead">当前阶段（项目名称：${esc(project.name || '—')}）已募 ${formatMallNum(raised)} 金币；上限不得低于已募数量。</p>
        <div class="form-item full">
          <label class="form-label">当前上限</label>
          <div class="mall-input-addon">
            <input class="input" type="text" value="${formatMallNum(current)}" disabled>
            <span class="mall-input-addon-text">金币</span>
          </div>
        </div>
        <div class="form-item full">
          <label class="form-label">新上限</label>
          <div class="mall-input-addon">
            <input class="input" id="mall-limit-input" type="number" min="1" step="1000" placeholder="请输入新的筹款上限">
            <span class="mall-input-addon-text">金币</span>
          </div>
        </div>
      </div>
    `,
    footer: `
      <button type="button" class="btn" onclick="closeModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="saveMallAdjustLimit()">保存</button>
    `,
  });
}

function saveMallAdjustLimit() {
  const raised = getCurrentProjectRaised();
  const next = Number(document.getElementById('mall-limit-input')?.value);
  if (!next || next <= 0) {
    toast('请输入新的筹款上限', 'warning');
    return;
  }
  if (next < raised) {
    toast(`上限不得低于已募 ${formatMallNum(raised)} 金币`, 'warning');
    return;
  }
  if (!data.loveProject) data.loveProject = {};
  data.loveProject.targetCoins = Math.round(next);
  saveData(data);
  closeModal();
  toast('筹款上限已调整');
  navigate('mall', { keepFilter: true });
}

function renderMallStageOutcomeImages() {
  const full = mallStageOutcomeImages.length >= LOVE_PROJECT_MEDIA_MAX;
  return `
    <div class="lpj-media-list" id="mall-stage-outcome-list">
      ${mallStageOutcomeImages.map(item => `
        <div class="lpj-media-item">
          <img class="lpj-media-thumb" src="${item.url}" alt="${esc(item.name || '成果图片')}">
          <div class="lpj-media-name">${esc(item.name || '成果图片')}</div>
          <button type="button" class="btn-link danger" onclick="removeMallStageOutcomeImage('${item.id}')">删除</button>
        </div>
      `).join('')}
      ${full ? '' : `
        <button type="button" class="lpj-media-add" onclick="document.getElementById('mall-stage-outcome-input')?.click()">
          <span>+</span>
          <span>上传成果图片</span>
        </button>
      `}
    </div>
    <input type="file" id="mall-stage-outcome-input" hidden accept="${LOVE_PROJECT_IMAGE_ACCEPT}" multiple>
  `;
}

function refreshMallStageOutcomeImages() {
  const wrap = document.getElementById('mall-stage-outcome-images');
  if (!wrap) return;
  wrap.innerHTML = renderMallStageOutcomeImages();
  bindMallStageOutcomeUpload();
}

function handleMallStageOutcomeFiles(fileList) {
  const files = Array.from(fileList || []);
  const room = LOVE_PROJECT_MEDIA_MAX - mallStageOutcomeImages.length;
  if (room <= 0) {
    toast(`最多上传 ${LOVE_PROJECT_MEDIA_MAX} 张成果图片`, 'warning');
    return;
  }
  files.slice(0, room).forEach(file => {
    if (!file.type.startsWith('image/')) {
      toast('请上传图片文件', 'warning');
      return;
    }
    if (file.size > LOVE_PROJECT_IMAGE_MAX_MB * 1024 * 1024) {
      toast(`${file.name} 超过 ${LOVE_PROJECT_IMAGE_MAX_MB}MB`, 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      mallStageOutcomeImages.push({
        id: `stage-outcome-${genId()}`,
        type: 'image',
        name: file.name,
        url: reader.result,
      });
      refreshMallStageOutcomeImages();
    };
    reader.onerror = () => toast('图片读取失败', 'error');
    reader.readAsDataURL(file);
  });
}

function removeMallStageOutcomeImage(id) {
  mallStageOutcomeImages = mallStageOutcomeImages.filter(item => item.id !== id);
  refreshMallStageOutcomeImages();
}

function bindMallStageOutcomeUpload() {
  const input = document.getElementById('mall-stage-outcome-input');
  if (!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  input.addEventListener('change', () => {
    handleMallStageOutcomeFiles(input.files);
    input.value = '';
  });
}

function confirmMallNextStage() {
  const p = getCurrentLoveProject();
  const raised = getCurrentProjectRaised();
  const target = Number(p.targetCoins) || 0;
  const remain = Math.max(0, target - raised);
  const filled = target > 0 && raised >= target;
  const periodText = formatCurrentProjectPeriodText(p);
  fillMallModal({
    title: '确认结项并开启下一阶段',
    size: 'md',
    footerEnd: true,
    body: `
      <div class="mall-close-stage">
        <p class="mall-close-stage-lead">确认后，当前筹款阶段将<span class="mall-close-hl">立即结项</span>，学生端将无法继续向本期捐赠；系统将自动开启一个新阶段（已募从 0 开始）。</p>
        <div class="mall-close-card">
          <div class="mall-close-card-kicker">即将结项</div>
          <div class="mall-close-card-name">项目名称：${esc(p.name || '—')}</div>
          <div class="mall-close-card-meta">${esc(periodText)} · 已募 ${formatMallNum(raised)} / ${formatMallNum(target)} 金币 · 剩余 ${formatMallNum(remain)} 金币${filled ? '已募满' : '未募满'}</div>
        </div>
        <div class="form-item full">
          <label class="form-label"><span class="required">*</span>新阶段名称</label>
          <input class="input" id="mall-next-name" placeholder="如：2026年Q3助学项目" style="width:100%;min-width:0">
        </div>
        <div class="form-item full">
          <label class="form-label"><span class="required">*</span>新阶段周期</label>
          <input class="input" id="mall-next-period" placeholder="如：2026年7月 — 9月" style="width:100%;min-width:0">
        </div>
        <div class="form-item full">
          <label class="form-label"><span class="required">*</span>新阶段上限</label>
          <div class="mall-input-addon">
            <input class="input" id="mall-next-limit" type="number" min="1" step="1000" placeholder="请输入新阶段筹款上限">
            <span class="mall-input-addon-text">金币</span>
          </div>
        </div>
        <div class="mall-close-notes">
          <p>结项后本期状态变为「已结项」，历史捐赠记录保留可查。</p>
          <p>发布月报时也会自动执行相同结项逻辑；请勿重复操作。</p>
        </div>
      </div>
    `,
    footer: `
      <button type="button" class="btn" onclick="closeModal()">取消</button>
      <button type="button" class="btn btn-love" onclick="submitMallNextStage()">确认结项</button>
    `,
  });
}

function submitMallNextStage() {
  const name = (document.getElementById('mall-next-name')?.value || '').trim();
  const period = (document.getElementById('mall-next-period')?.value || '').trim();
  const months = parseMallPeriodInput(period);
  const limit = Number(document.getElementById('mall-next-limit')?.value);
  if (!name) {
    toast('请填写新阶段名称', 'warning');
    return;
  }
  if (!period) {
    toast('请填写新阶段周期', 'warning');
    return;
  }
  if (months.start && months.end && months.end < months.start) {
    toast('结束月份不能早于开始月份', 'warning');
    return;
  }
  if (!limit || limit <= 0) {
    toast('请输入有效的新阶段上限', 'warning');
    return;
  }
  const current = getCurrentLoveProject();
  const raised = getCurrentProjectRaised();
  const stageId = getNextClosedStageId();
  if (!data.loveProject) data.loveProject = {};
  if (!Array.isArray(data.loveProject.history)) data.loveProject.history = [];
  data.loveProject.history.unshift({
    id: stageId,
    name: current.name || '',
    period: formatCurrentProjectPeriodText(current),
    periodStart: current.periodStart || '',
    periodEnd: current.periodEnd || '',
    raisedCoins: raised,
    targetCoins: Number(current.targetCoins) || 0,
    outcome: '',
    outcomeMedia: [],
    status: 'closed',
    published: false,
    publishedAt: null,
    closedAt: now(),
  });
  getMallDonations().forEach(r => {
    if (r.fundedStageId) return;
    r.fundedStageId = stageId;
    r.fundedProject = current.name || r.fundedProject || '';
  });
  Object.assign(data.loveProject, {
    name,
    period,
    periodStart: months.start ? monthToDate(months.start, false) : '',
    periodEnd: months.end ? monthToDate(months.end, true) : '',
    targetCoins: Math.round(limit),
    raisedCoins: 0,
    status: 'raising',
  });
  saveData(data);
  closeModal();
  toast('已结项，可在往期项目中上传项目成果');
  mallPageState.tab = 'past';
  mallPageState.page = 1;
  pastProjectState.page = 1;
  navigate('mall', { keepFilter: true });
}

function getLoveProjects() {
  return data.loveProjects || [];
}

function getActiveLoveProjects() {
  return getLoveProjects().filter(p => resolveLoveProjectStatus(p.status) !== 'cancelled');
}

function switchLoveProjectGroup(group) {
  mallPageState.projectGroup = group;
  navigate('mall', { keepFilter: true });
}

function formatLovePeriod(start, end) {
  const fmt = (ymd) => {
    if (!ymd) return '';
    const [y, m] = String(ymd).split('-');
    if (!y || !m) return ymd;
    return `${y}年${Number(m)}月`;
  };
  const a = fmt(start);
  const b = fmt(end);
  if (a && b) return a === b ? a : `${a}-${b}`;
  return a || b || '—';
}

function loveProjectRaised(p) {
  return Math.round((Number(p?.raisedYuan) || 0) * 100) / 100;
}

function getLoveProjectMedia(p) {
  return Array.isArray(p?.outcomeMedia) ? p.outcomeMedia : [];
}

function getNextLoveProjectId() {
  const nums = getLoveProjects().map(p => Number(String(p.id || '').replace(/\D/g, '')) || 0);
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `LPJ-${String(next).padStart(3, '0')}`;
}

function renderLoveProjectList() {
  const group = LOVE_PROJECT_GROUPS.some(g => g.key === mallPageState.projectGroup)
    ? mallPageState.projectGroup
    : 'ongoing';
  const all = getLoveProjects();
  const active = getActiveLoveProjects();
  const list = all.filter(p => resolveLoveProjectStatus(p.status) === group);
  const full = active.length >= LOVE_PROJECT_LIMIT;
  const emptyText = group === 'ongoing' ? '暂无进行中项目' : '暂无已完成项目';
  const empty = `<tr><td colspan="5" class="mall-empty">${emptyText}</td></tr>`;
  const counts = {
    ongoing: all.filter(p => resolveLoveProjectStatus(p.status) === 'ongoing').length,
    done: all.filter(p => resolveLoveProjectStatus(p.status) === 'done').length,
    closed: getClosedStages().length,
  };
  return `
    <div class="mall-project-block">
      <div class="mall-panel-head">
        <div>
          <div class="mall-panel-title">项目</div>
          <div class="mall-panel-hint">${group === 'closed' ? '已结项的筹款阶段，历史捐赠记录可查。' : `爱心项目 ${active.length} / ${LOVE_PROJECT_LIMIT} 个；点击“查看”可看介绍、图片与成果。`}</div>
        </div>
        ${group === 'closed' ? '' : `<button type="button" class="btn btn-primary" ${full ? 'disabled' : ''} onclick="openLoveProjectModal()">+ 新增项目</button>`}
      </div>
      <div class="mall-project-tabs">
        ${LOVE_PROJECT_GROUPS.map(g => `
          <button type="button" class="mall-project-tab ${group === g.key ? 'active' : ''}" onclick="switchLoveProjectGroup('${g.key}')">${g.label}（${counts[g.key]}）</button>
        `).join('')}
      </div>
      ${group === 'closed' ? renderPastProjectTable() : `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>项目名称</th>
            <th>受益学校</th>
            <th>项目时间</th>
            <th>已筹金额</th>
            <th>操作</th>
          </tr></thead>
          <tbody>
            ${list.length ? list.map(p => {
              const raised = loveProjectRaised(p);
              const ongoing = resolveLoveProjectStatus(p.status) === 'ongoing';
              return `
                <tr>
                  <td><div class="mall-project-name">${esc(p.name)}</div></td>
                  <td>${esc(p.school || '—')}</td>
                  <td>${esc(formatLovePeriod(p.periodStart, p.periodEnd))}</td>
                  <td>${formatYuan(raised)}</td>
                  <td><div class="mall-project-actions">
                    <button class="btn-link" onclick="viewLoveProject('${p.id}')">查看</button>
                    <button class="btn-link" onclick="openLoveProjectModal('${p.id}')">编辑</button>
                    ${ongoing ? `<button class="btn-link" onclick="openMarkLoveProjectDoneModal('${p.id}')">标记完成</button>` : ''}
                  </div></td>
                </tr>
              `;
            }).join('') : empty}
          </tbody>
        </table>
      </div>
      `}
    </div>
  `;
}

function loveYearMonthSelects(prefix, ymd) {
  const nowY = new Date().getFullYear();
  const y = Number((ymd || '').slice(0, 4)) || nowY;
  const m = (ymd || '').slice(5, 7) || '01';
  const years = [];
  for (let i = nowY - 6; i <= nowY + 4; i++) years.push(i);
  if (!years.includes(y)) years.unshift(y);
  const yearOpts = years.map(n => `<option value="${n}"${n === y ? ' selected' : ''}>${n}</option>`).join('');
  const monthOpts = Array.from({ length: 12 }, (_, i) => {
    const v = String(i + 1).padStart(2, '0');
    return `<option value="${v}"${m === v ? ' selected' : ''}>${v}</option>`;
  }).join('');
  return `
    <div class="mall-ym-pick">
      <select class="select" id="${prefix}-year" aria-label="年">${yearOpts}</select>
      <span>年</span>
      <select class="select" id="${prefix}-month" aria-label="月">${monthOpts}</select>
      <span>月</span>
    </div>
  `;
}

function loveProjectFormFields(p = {}) {
  const statusOpts = [
    { v: 'ongoing', l: '进行中' },
    { v: 'done', l: '已完成' },
  ];
  const status = resolveLoveProjectStatus(p.status);
  const visible = p.studentVisible !== false;
  const raised = p.raisedYuan ?? '';
  return `
    <div class="form-row">
      <div class="form-item full">
        <label class="form-label"><span class="required">*</span>项目名称</label>
        <input class="input" id="lpj-name" placeholder="请输入项目名称" value="${esc(p.name || '')}" style="width:100%;min-width:0">
      </div>
    </div>
    <div class="form-row">
      <div class="form-item full">
        <label class="form-label">受益学校</label>
        <input class="input" id="lpj-school" placeholder="请输入学校或地区" value="${esc(p.school || '')}" style="width:100%;min-width:0">
      </div>
    </div>
    <div class="form-row">
      <div class="form-item full">
        <label class="form-label">项目介绍</label>
        <textarea class="textarea" id="lpj-desc" placeholder="请输入项目介绍" style="min-width:0">${esc(p.desc || '')}</textarea>
      </div>
    </div>
    <div class="form-row">
      <div class="form-item full">
        <label class="form-label">项目图片</label>
        ${renderLoveProjectImageUpload()}
        <p class="form-hint">学生端封面。支持 jpg / png / webp / gif，单张不超过 ${LOVE_PROJECT_IMAGE_MAX_MB}MB。</p>
      </div>
    </div>
    <div class="form-row">
      <div class="form-item">
        <label class="form-label"><span class="required">*</span>开始时间</label>
        ${loveYearMonthSelects('lpj-start', p.periodStart)}
      </div>
      <div class="form-item">
        <label class="form-label"><span class="required">*</span>结束时间</label>
        ${loveYearMonthSelects('lpj-end', p.periodEnd)}
      </div>
    </div>
    <div class="form-row">
      <div class="form-item">
        <label class="form-label">已筹金额</label>
        <input class="input" id="lpj-raised" type="number" min="0" step="1" value="${raised}" placeholder="学生端展示，无上限" style="width:100%;min-width:0">
        <p class="form-hint">单位元。无上限。<button type="button" class="btn-link" onclick="fillLoveProjectRaisedFromPool()">填入爱心池累计</button></p>
      </div>
      <div class="form-item">
        <label class="form-label"><span class="required">*</span>状态</label>
        <select class="select" id="lpj-status" style="width:100%;min-width:0">
          ${statusOpts.map(o => `<option value="${o.v}"${status === o.v ? ' selected' : ''}>${o.l}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-item full">
        <label class="form-label">学生端可见</label>
        <label class="lpj-check">
          <input type="checkbox" id="lpj-visible"${visible ? ' checked' : ''}>
          <span>进行中展示介绍、封面和已筹金额；已完成展示成果照片或视频</span>
        </label>
      </div>
    </div>
    <div class="form-row">
      <div class="form-item full">
        <label class="form-label">成果照片 / 视频</label>
        ${renderLoveProjectMediaUpload()}
        <p class="form-hint">已完成项目在学生端展示。支持图片与 mp4 / mov，最多 ${LOVE_PROJECT_MEDIA_MAX} 个，单个不超过 ${LOVE_PROJECT_IMAGE_MAX_MB}MB。</p>
      </div>
    </div>
    <div class="form-row">
      <div class="form-item full">
        <label class="form-label">完成说明</label>
        <textarea class="textarea" id="lpj-outcome" placeholder="例如：已为学校安装 20 台空调" style="min-width:0">${esc(p.outcome || '')}</textarea>
      </div>
    </div>
  `;
}

function monthToDate(month, end) {
  if (!month) return '';
  if (end) {
    const [y, m] = month.split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return `${month}-${String(last).padStart(2, '0')}`;
  }
  return `${month}-01`;
}

function readLoveProjectForm(existing) {
  const name = (document.getElementById('lpj-name')?.value || '').trim();
  const school = (document.getElementById('lpj-school')?.value || '').trim();
  const desc = (document.getElementById('lpj-desc')?.value || '').trim();
  const startM = [document.getElementById('lpj-start-year')?.value, document.getElementById('lpj-start-month')?.value].filter(Boolean).join('-');
  const endM = [document.getElementById('lpj-end-year')?.value, document.getElementById('lpj-end-month')?.value].filter(Boolean).join('-');
  const raisedRaw = document.getElementById('lpj-raised')?.value;
  const raisedYuan = raisedRaw === '' || raisedRaw == null ? 0 : Number(raisedRaw);
  const status = resolveLoveProjectStatus(document.getElementById('lpj-status')?.value || 'ongoing');
  const studentVisible = !!document.getElementById('lpj-visible')?.checked;
  const outcome = (document.getElementById('lpj-outcome')?.value || '').trim();
  if (!name) {
    toast('请填写项目名称', 'warning');
    return null;
  }
  if (!startM || !endM) {
    toast('请选择项目时间', 'warning');
    return null;
  }
  if (endM < startM) {
    toast('结束时间不能早于开始时间', 'warning');
    return null;
  }
  if (Number.isNaN(raisedYuan) || raisedYuan < 0) {
    toast('请输入有效已筹金额', 'warning');
    return null;
  }
  return {
    name,
    school,
    desc,
    periodStart: monthToDate(startM, false),
    periodEnd: monthToDate(endM, true),
    raisedYuan: Math.round(raisedYuan * 100) / 100,
    status,
    studentVisible,
    outcome,
    imageUrl: loveProjectImageState.url || '',
    imageName: loveProjectImageState.name || '',
    outcomeMedia: loveProjectMediaState.map(m => ({ ...m })),
  };
}

function initLoveProjectImageState(p) {
  loveProjectImageState = {
    url: p?.imageUrl || '',
    name: p?.imageName || '',
  };
}

function renderLoveProjectImageUpload() {
  const has = !!loveProjectImageState.url;
  return `
    <div class="lpj-cover-row">
      <div class="lpj-image-dropzone" id="lpj-image-dropzone">
        <div class="lpj-image-empty" id="lpj-image-empty"${has ? ' hidden' : ''}>
          <span>+</span>
          <span>上传封面</span>
        </div>
        <div class="lpj-image-preview" id="lpj-image-preview"${has ? '' : ' hidden'}>
          <img class="lpj-media-thumb" id="lpj-image-preview-img" alt="项目图片预览"${has ? ` src="${loveProjectImageState.url}"` : ''}>
          <div class="lpj-media-name" id="lpj-image-preview-name">${esc(loveProjectImageState.name || (has ? '已上传图片' : ''))}</div>
          <span class="lpj-image-actions">
            <button type="button" class="btn-link" id="lpj-image-reselect">更换</button>
            <button type="button" class="btn-link danger" id="lpj-image-remove">删除</button>
          </span>
        </div>
        <input type="file" id="lpj-image-input" hidden accept="${LOVE_PROJECT_IMAGE_ACCEPT}">
      </div>
    </div>
  `;
}

function refreshLoveProjectImageUI() {
  const empty = document.getElementById('lpj-image-empty');
  const preview = document.getElementById('lpj-image-preview');
  const img = document.getElementById('lpj-image-preview-img');
  const nameEl = document.getElementById('lpj-image-preview-name');
  if (!empty || !preview) return;
  if (loveProjectImageState.url) {
    empty.hidden = true;
    preview.hidden = false;
    if (img) img.src = loveProjectImageState.url;
    if (nameEl) nameEl.textContent = loveProjectImageState.name || '已上传图片';
  } else {
    empty.hidden = false;
    preview.hidden = true;
    if (img) img.removeAttribute('src');
    if (nameEl) nameEl.textContent = '';
  }
}

function handleLoveProjectImageFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('请上传图片文件', 'warning');
    return;
  }
  if (file.size > LOVE_PROJECT_IMAGE_MAX_MB * 1024 * 1024) {
    toast(`图片大小不能超过 ${LOVE_PROJECT_IMAGE_MAX_MB}MB`, 'warning');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    loveProjectImageState = { name: file.name, url: reader.result };
    refreshLoveProjectImageUI();
    toast('图片已上传', 'success');
  };
  reader.onerror = () => toast('图片读取失败', 'error');
  reader.readAsDataURL(file);
}

function clearLoveProjectImage() {
  loveProjectImageState = { url: '', name: '' };
  refreshLoveProjectImageUI();
}

function bindLoveProjectImageUpload() {
  const dropzone = document.getElementById('lpj-image-dropzone');
  const fileInput = document.getElementById('lpj-image-input');
  if (!dropzone || !fileInput) return;

  const pickFile = () => fileInput.click();
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('#lpj-image-remove, #lpj-image-reselect')) return;
    pickFile();
  });
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('lpj-image-dropzone--active');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('lpj-image-dropzone--active');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('lpj-image-dropzone--active');
    const file = e.dataTransfer?.files?.[0];
    if (file) handleLoveProjectImageFile(file);
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (file) handleLoveProjectImageFile(file);
  });
  document.getElementById('lpj-image-reselect')?.addEventListener('click', (e) => {
    e.stopPropagation();
    pickFile();
  });
  document.getElementById('lpj-image-remove')?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearLoveProjectImage();
  });
}

function fillLoveProjectRaisedFromPool() {
  const el = document.getElementById('lpj-raised');
  if (!el) return;
  el.value = getMallSummary().loveCoins;
}

function initLoveProjectMediaState(p) {
  loveProjectMediaState = getLoveProjectMedia(p).map(m => ({ ...m }));
}

function renderLoveProjectMediaItem(item) {
  const isVideo = item.type === 'video';
  const poster = isVideo && !(item.url || '').startsWith('data:video');
  return `
    <div class="lpj-media-item">
      ${isVideo && !poster
        ? `<video class="lpj-media-thumb" src="${item.url}" muted></video>`
        : `<img class="lpj-media-thumb" src="${item.url}" alt="${esc(item.name || '')}">`}
      ${isVideo ? '<span class="lpj-media-badge">视频</span>' : ''}
      <div class="lpj-media-name">${esc(item.name || (isVideo ? '视频' : '图片'))}</div>
      <button type="button" class="btn-link danger" onclick="removeLoveProjectMedia('${item.id}')">删除</button>
    </div>
  `;
}

function renderLoveProjectMediaInner() {
  const full = loveProjectMediaState.length >= LOVE_PROJECT_MEDIA_MAX;
  return `
    <div class="lpj-media-list" id="lpj-media-list">
      ${loveProjectMediaState.map(renderLoveProjectMediaItem).join('')}
      ${full ? '' : `
        <button type="button" class="lpj-media-add" id="lpj-media-add" onclick="document.getElementById('lpj-media-input')?.click()">
          <span>+</span>
          <span>添加照片或视频</span>
        </button>
      `}
    </div>
    <input type="file" id="lpj-media-input" hidden accept="${LOVE_PROJECT_MEDIA_ACCEPT}" multiple>
  `;
}

function renderLoveProjectMediaUpload() {
  return `<div id="lpj-media-wrap">${renderLoveProjectMediaInner()}</div>`;
}

function refreshLoveProjectMediaUI() {
  const wrap = document.getElementById('lpj-media-wrap');
  if (!wrap) return;
  wrap.innerHTML = renderLoveProjectMediaInner();
  bindLoveProjectMediaUpload();
}

function handleLoveProjectMediaFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const room = LOVE_PROJECT_MEDIA_MAX - loveProjectMediaState.length;
  if (room <= 0) {
    toast(`最多上传 ${LOVE_PROJECT_MEDIA_MAX} 个成果文件`, 'warning');
    return;
  }
  files.slice(0, room).forEach(file => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      toast('请上传图片或视频', 'warning');
      return;
    }
    if (file.size > LOVE_PROJECT_IMAGE_MAX_MB * 1024 * 1024) {
      toast(`${file.name} 超过 ${LOVE_PROJECT_IMAGE_MAX_MB}MB`, 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      loveProjectMediaState.push({
        id: `om-${genId()}`,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        url: reader.result,
      });
      refreshLoveProjectMediaUI();
    };
    reader.onerror = () => toast('文件读取失败', 'error');
    reader.readAsDataURL(file);
  });
}

function removeLoveProjectMedia(id) {
  loveProjectMediaState = loveProjectMediaState.filter(m => m.id !== id);
  refreshLoveProjectMediaUI();
}

function bindLoveProjectMediaUpload() {
  const input = document.getElementById('lpj-media-input');
  if (!input || input.dataset.bound) return;
  input.dataset.bound = '1';
  input.addEventListener('change', () => {
    handleLoveProjectMediaFiles(input.files);
    input.value = '';
  });
}

function renderLoveProjectMediaGallery(media) {
  const list = media || [];
  if (!list.length) return '<div class="mall-empty">暂无成果照片或视频</div>';
  return `
    <div class="lpj-media-gallery">
      ${list.map(item => {
        const isVideo = item.type === 'video';
        const realVideo = isVideo && (item.url || '').startsWith('data:video');
        return `
          <div class="lpj-media-item">
            ${realVideo
              ? `<video class="lpj-media-thumb" src="${item.url}" controls></video>`
              : `<img class="lpj-media-thumb" src="${item.url}" alt="${esc(item.name || '')}">`}
            ${isVideo ? '<span class="lpj-media-badge">视频</span>' : ''}
            <div class="lpj-media-name">${esc(item.name || '')}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function openLoveProjectModal(id) {
  const editing = id ? getLoveProjects().find(p => p.id === id) : null;
  if (id && !editing) return;
  if (editing && resolveLoveProjectStatus(editing.status) === 'cancelled') {
    viewLoveProject(id);
    return;
  }
  if (!editing && getActiveLoveProjects().length >= LOVE_PROJECT_LIMIT) {
    toast(`最多创建 ${LOVE_PROJECT_LIMIT} 个爱心项目`, 'warning');
    return;
  }
  initLoveProjectImageState(editing || {});
  initLoveProjectMediaState(editing || {});
  fillMallModal({
    title: editing ? '编辑爱心项目' : '新增爱心项目',
    subtitle: editing ? editing.id : `还可创建 ${LOVE_PROJECT_LIMIT - getActiveLoveProjects().length} 个`,
    size: 'md',
    body: `<div class="love-project-form">${loveProjectFormFields(editing || {})}</div>`,
    footer: `
      <button type="button" class="btn" onclick="closeModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="saveLoveProject(${editing ? `'${editing.id}'` : 'null'})">保存</button>
    `,
  });
  bindLoveProjectImageUpload();
  bindLoveProjectMediaUpload();
}

function saveLoveProject(id) {
  const existing = id ? getLoveProjects().find(p => p.id === id) : null;
  const form = readLoveProjectForm(existing);
  if (!form) return;
  if (!data.loveProjects) data.loveProjects = [];
  if (existing) {
    Object.assign(existing, form, { updatedAt: now() });
    toast('项目已更新');
  } else {
    if (getActiveLoveProjects().length >= LOVE_PROJECT_LIMIT) {
      toast(`最多创建 ${LOVE_PROJECT_LIMIT} 个爱心项目`, 'warning');
      return;
    }
    data.loveProjects.unshift({
      id: getNextLoveProjectId(),
      updatedAt: now(),
      ...form,
    });
    toast('项目已创建');
  }
  saveData(data);
  closeModal();
  navigate('mall', { keepFilter: true });
}

function viewLoveProject(id) {
  const p = getLoveProjects().find(x => x.id === id);
  if (!p) return;
  const status = resolveLoveProjectStatus(p.status);
  const st = LOVE_PROJECT_STATUS[status];
  const raised = loveProjectRaised(p);
  const media = getLoveProjectMedia(p);
  fillMallModal({
    title: '爱心项目详情',
    subtitle: p.id,
    size: 'md',
    body: `
      ${p.imageUrl ? `<div class="lpj-media-gallery lpj-detail-cover"><div class="lpj-media-item"><img class="lpj-media-thumb" src="${p.imageUrl}" alt="${esc(p.imageName || '项目图片')}"></div></div>` : ''}
      <div class="detail-grid">
        <div class="detail-item"><label>项目名称</label><span>${esc(p.name)}</span></div>
        <div class="detail-item"><label>受益学校</label><span>${esc(p.school || '—')}</span></div>
        <div class="detail-item"><label>项目介绍</label><span>${esc(p.desc || '—')}</span></div>
        <div class="detail-item"><label>项目图片</label><span>${p.imageUrl ? esc(p.imageName || '已上传') : '未上传'}</span></div>
        <div class="detail-item"><label>项目时间</label><span>${esc(formatLovePeriod(p.periodStart, p.periodEnd))}</span></div>
        <div class="detail-item"><label>状态</label><span class="tag ${st.tag}">${st.label}</span></div>
        <div class="detail-item"><label>学生端可见</label><span>${p.studentVisible === false ? '否' : '是'}</span></div>
        <div class="detail-item"><label>已筹金额</label><span>${formatYuan(raised)}</span></div>
        <div class="detail-item"><label>完成说明</label><span>${esc(p.outcome || '—')}</span></div>
        <div class="detail-item"><label>更新时间</label><span>${esc(p.updatedAt || '—')}</span></div>
      </div>
      <div class="lpj-payout-history">
        <div class="lpj-payout-history-title">成果照片 / 视频</div>
        ${renderLoveProjectMediaGallery(media)}
      </div>
    `,
    footer: `
      <button type="button" class="btn" onclick="closeModal()">关闭</button>
      ${status === 'cancelled'
        ? `<button type="button" class="btn btn-primary" onclick="restoreLoveProject('${p.id}')">恢复</button>`
        : `${status === 'ongoing' ? `<button type="button" class="btn" onclick="openMarkLoveProjectDoneModal('${p.id}')">标记完成</button>` : ''}
           <button type="button" class="btn btn-primary" onclick="openLoveProjectModal('${p.id}')">编辑</button>`}
    `,
  });
}

function cancelLoveProject(id) {
  const p = getLoveProjects().find(x => x.id === id);
  if (!p) return;
  if (resolveLoveProjectStatus(p.status) === 'cancelled') return;
  showConfirmModal({
    title: '取消爱心项目',
    message: `确认取消「${p.name}」？取消后可在「已取消」中恢复。`,
    confirmText: '确认取消',
    cancelText: '返回',
    onConfirm: () => {
      p.prevStatus = resolveLoveProjectStatus(p.status);
      p.status = 'cancelled';
      p.cancelledAt = now();
      p.updatedAt = now();
      saveData(data);
      toast('已取消');
      mallPageState.projectGroup = 'cancelled';
      navigate('mall', { keepFilter: true });
    },
  });
}

function restoreLoveProject(id) {
  const p = getLoveProjects().find(x => x.id === id);
  if (!p || resolveLoveProjectStatus(p.status) !== 'cancelled') return;
  if (getActiveLoveProjects().length >= LOVE_PROJECT_LIMIT) {
    toast(`爱心项目已满 ${LOVE_PROJECT_LIMIT} 个，请先取消其他项目后再恢复`, 'warning');
    return;
  }
  const next = p.prevStatus === 'done' ? 'done' : 'ongoing';
  p.status = next;
  p.prevStatus = null;
  p.cancelledAt = null;
  p.updatedAt = now();
  saveData(data);
  closeModal();
  toast('已恢复');
  mallPageState.projectGroup = next;
  navigate('mall', { keepFilter: true });
}

function openMarkLoveProjectDoneModal(id) {
  const p = getLoveProjects().find(x => x.id === id);
  if (!p) return;
  if (resolveLoveProjectStatus(p.status) !== 'ongoing') return;
  const mediaCount = getLoveProjectMedia(p).length;
  showConfirmModal({
    title: '标记完成',
    message: `确认将「${p.name}」标记为已完成？`,
    hint: mediaCount
      ? `已有 ${mediaCount} 个成果照片/视频，学生端完成后将展示。`
      : '建议先在编辑中上传成果照片或视频，学生端完成后会展示。也可现在完成，稍后补传。',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: () => submitMarkLoveProjectDone(id),
  });
}

function submitMarkLoveProjectDone(id) {
  const p = getLoveProjects().find(x => x.id === id);
  if (!p || resolveLoveProjectStatus(p.status) !== 'ongoing') return;
  p.status = 'done';
  p.updatedAt = now();
  saveData(data);
  toast('已标记完成');
  mallPageState.projectGroup = 'done';
  navigate('mall', { keepFilter: true });
}

function renderMallTabs() {
  return `
    <div class="mall-tabs">
      ${MALL_TABS.map(t => `
        <button type="button" class="mall-tab ${mallPageState.tab === t.key ? 'active' : ''}" onclick="switchMallTab('${t.key}')">${t.label}</button>
      `).join('')}
    </div>
  `;
}

function renderMallDonationFilterBar() {
  const timeOpts = [
    { v: 'all', l: '全部' },
    { v: 'today', l: '今日' },
    { v: '7d', l: '近7天' },
    { v: '30d', l: '近30天' },
    { v: 'month', l: '本月' },
  ];
  const projects = getMallDonationProjectNames();
  const selected = new Set(mallPageState.donationProjects || []);
  const allChecked = mallPageState.donationAllProjects !== false;
  const pickerLabel = allChecked ? '全部项目' : (selected.size ? `已选 ${selected.size} 个项目` : '请选择项目');
  return `
    <div class="filter-form mall-filter mall-donation-filter">
      <div class="filter-item mall-project-filter-item">
        <label>项目名称</label>
        <details class="mall-project-picker">
          <summary id="mall-project-picker-label">${pickerLabel}</summary>
          <div class="mall-project-picker-menu">
            <input class="input mall-project-search" placeholder="输入项目名称搜索" oninput="filterMallProjectOptions(this.value)">
            <label class="mall-project-check mall-project-check-all">
              <input type="checkbox" id="mall-project-all" ${allChecked ? 'checked' : ''} onchange="toggleMallAllProjects(this.checked)">
              <span>全部项目</span>
            </label>
            <div class="mall-project-option-list">
              ${projects.length ? projects.map(name => `
                <label class="mall-project-check mall-project-option-row" data-name="${esc(name)}">
                  <input type="checkbox" class="mall-project-option" value="${esc(name)}" ${selected.has(name) ? 'checked' : ''} ${allChecked ? 'disabled' : ''} onchange="syncMallAllProjects()">
                  <span>${esc(name)}</span>
                </label>
              `).join('') : '<div class="mall-project-option-empty">暂无项目</div>'}
            </div>
          </div>
        </details>
      </div>
      <div class="filter-item">
        <label>学生 / 捐赠编号</label>
        <input class="input" id="mall-filter-kw" placeholder="请输入学生或捐赠编号" value="${esc(mallPageState.keyword)}" onkeydown="if(event.key==='Enter')applyMallFilter()">
      </div>
      <div class="filter-item">
        <label>时间范围</label>
        <select class="select" id="mall-filter-time">
          ${timeOpts.map(o => `<option value="${o.v}"${mallPageState.timeRange === o.v ? ' selected' : ''}>${o.l}</option>`).join('')}
        </select>
      </div>
      <div class="filter-actions">
        <button type="button" class="btn btn-primary" onclick="applyMallFilter()">查询</button>
        <button type="button" class="btn" onclick="resetMallFilter()">重置</button>
      </div>
    </div>
  `;
}

function renderMallFilterBar(placeholder) {
  const timeOpts = [
    { v: 'all', l: '全部' },
    { v: 'today', l: '今日' },
    { v: '7d', l: '近7天' },
    { v: '30d', l: '近30天' },
    { v: 'month', l: '本月' },
  ];
  const kwLabel = mallPageState.tab === 'ledger' ? '流水号 / 摘要'
    : mallPageState.tab === 'monthly' ? '月份'
    : '学生 / 捐赠编号';
  const hideTime = mallPageState.tab === 'monthly';
  return `
    <div class="filter-form mall-filter">
      <div class="filter-item">
        <label>${kwLabel}</label>
        <input class="input" id="mall-filter-kw" placeholder="${esc(placeholder)}" value="${esc(mallPageState.keyword)}" onkeydown="if(event.key==='Enter')applyMallFilter()">
      </div>
      ${hideTime ? '' : `
      <div class="filter-item">
        <label>时间范围</label>
        <select class="select" id="mall-filter-time">
          ${timeOpts.map(o => `<option value="${o.v}"${mallPageState.timeRange === o.v ? ' selected' : ''}>${o.l}</option>`).join('')}
        </select>
      </div>`}
      <div class="filter-actions">
        <button type="button" class="btn btn-primary" onclick="applyMallFilter()">查询</button>
        <button type="button" class="btn" onclick="resetMallFilter()">重置</button>
      </div>
    </div>
  `;
}

function renderMallDonationTable() {
  const { total, rows } = paginateMall(filterMallDonations());
  const empty = `<tr><td colspan="10" class="mall-empty">暂无数据</td></tr>`;
  return `
    ${renderMallDonationFilterBar()}
    ${renderMallListTools(`
      <button type="button" class="btn" onclick="openMallSchoolSummaryModal()">
        <span class="mall-chart-icon">▮</span> 按学校汇总
      </button>
    `, 'exportMallDonationCsv()')}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>捐赠编号</th><th>学生</th><th>学校</th><th>班级</th>
          <th>捐赠金币</th><th>折合爱心值</th><th>捐赠后金币余额</th>
          <th>被资助项目</th><th>捐赠时间</th><th>操作</th>
        </tr></thead>
        <tbody>
          ${rows.length ? rows.map(r => `
            <tr>
              <td>${esc(r.id)}</td>
              <td>${esc(r.studentId)}</td>
              <td>${esc(r.school)}</td>
              <td>${esc(r.className)}</td>
              <td>${formatMallNum(r.coins)}</td>
              <td>${formatYuan(coinsToLove(r.coins))}</td>
              <td>${formatMallNum(r.balanceAfter)}</td>
              <td>${esc(r.fundedProject || '—')}</td>
              <td>${esc(r.donatedAt)}</td>
              <td><button class="btn-link" onclick="openMallDonationDetail('${r.id}')">查看详情</button></td>
            </tr>
          `).join('') : empty}
        </tbody>
      </table>
    </div>
    ${renderMallPagination(total)}
  `;
}

function renderMallExchangeTable() {
  const { total, rows } = paginateMall(filterMallExchanges());
  const empty = `<tr><td colspan="8" class="mall-empty">暂无数据</td></tr>`;
  return `
    ${renderMallFilterBar('请输入学号或兑换编号')}
    ${renderMallListTools('', 'exportMallExchangeCsv()')}
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr>
          <th>兑换编号</th><th>学号</th><th>学校</th><th>班级</th>
          <th>消耗金币</th><th>获得爱心值</th><th>兑换时间</th><th>操作</th>
        </tr></thead>
        <tbody>
          ${rows.length ? rows.map(r => `
            <tr>
              <td>${esc(r.id)}</td>
              <td>${esc(r.studentId)}</td>
              <td>${esc(r.school)}</td>
              <td>${esc(r.className)}</td>
              <td>${formatMallNum(r.coins)}</td>
              <td>${formatMallNum(r.loveValue ?? coinsToLove(r.coins), (r.loveValue ?? coinsToLove(r.coins)) % 1 ? 2 : 0)}</td>
              <td>${esc(r.exchangedAt)}</td>
              <td><button class="btn-link" onclick="openMallExchangeDetail('${r.id}')">查看详情</button></td>
            </tr>
          `).join('') : empty}
        </tbody>
      </table>
    </div>
    ${renderMallPagination(total)}
  `;
}

function paginatePastProjects(list) {
  const { page, pageSize } = pastProjectState;
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const cur = Math.min(Math.max(1, page), pages);
  const start = (cur - 1) * pageSize;
  return { total, pages, page: cur, rows: list.slice(start, start + pageSize) };
}

function renderPastProjectPagination(total) {
  const pages = Math.max(1, Math.ceil(total / pastProjectState.pageSize));
  const page = Math.min(pastProjectState.page, pages);
  const nums = pageWindow(page, pages);
  return `
    <div class="mall-table-footer">
      <span class="mall-total">共 ${total} 条</span>
      <div class="pagination">
        <span class="page-btn ${page <= 1 ? 'disabled' : ''}" ${page > 1 ? `onclick="pastProjectGotoPage(${page - 1})"` : ''}>‹</span>
        ${nums.map(n => `<span class="page-btn ${n === page ? 'active' : ''}" onclick="pastProjectGotoPage(${n})">${n}</span>`).join('')}
        <span class="page-btn ${page >= pages ? 'disabled' : ''}" ${page < pages ? `onclick="pastProjectGotoPage(${page + 1})"` : ''}>›</span>
      </div>
    </div>
  `;
}

function pastProjectGotoPage(page) {
  pastProjectState.page = page;
  navigate('mall', { keepFilter: true });
}

function applyPastProjectFilter() {
  pastProjectState.keyword = (document.getElementById('past-filter-kw')?.value || '').trim();
  pastProjectState.timeRange = document.getElementById('past-filter-time')?.value || 'all';
  pastProjectState.page = 1;
  navigate('mall', { keepFilter: true });
}

function resetPastProjectFilter() {
  pastProjectState.keyword = '';
  pastProjectState.timeRange = 'all';
  pastProjectState.page = 1;
  navigate('mall', { keepFilter: true });
}

function renderPastProjectTable() {
  const { total, rows } = paginatePastProjects(filterPastProjects());
  const empty = `<tr><td colspan="11" class="mall-empty">暂无已结项项目</td></tr>`;
  const timeOpts = [
    { v: 'all', l: '全部' },
    { v: 'today', l: '今日' },
    { v: '7d', l: '近7天' },
    { v: '30d', l: '近30天' },
    { v: 'month', l: '本月' },
  ];
  return `
    <div class="mall-past-block">
      <div class="filter-form mall-filter">
        <div class="filter-item">
          <label>项目名称</label>
          <input class="input" id="past-filter-kw" placeholder="请输入项目名称或编号" value="${esc(pastProjectState.keyword)}" onkeydown="if(event.key==='Enter')applyPastProjectFilter()">
        </div>
        <div class="filter-item">
          <label>结项时间</label>
          <select class="select" id="past-filter-time">
            ${timeOpts.map(o => `<option value="${o.v}"${pastProjectState.timeRange === o.v ? ' selected' : ''}>${o.l}</option>`).join('')}
          </select>
        </div>
        <div class="filter-actions">
          <button type="button" class="btn btn-primary" onclick="applyPastProjectFilter()">查询</button>
          <button type="button" class="btn" onclick="resetPastProjectFilter()">重置</button>
        </div>
      </div>
      ${renderMallListTools('', 'exportPastProjectCsv()')}
      <div class="table-wrap">
        <table class="data-table mall-past-table">
          <thead><tr>
            <th>结项编号</th><th>项目名称</th><th>阶段周期</th>
            <th>捐赠金币</th><th>折合人民币</th><th>募集上限</th>
            <th>状态</th><th>公示状态</th><th>捐赠笔数</th><th>结项时间</th><th>操作</th>
          </tr></thead>
          <tbody>
            ${rows.length ? rows.map(r => {
              const raised = Number(r.raisedCoins) || 0;
              const target = Number(r.targetCoins) || 0;
              const donationCount = getClosedStageDonations(r).length;
              const published = !!r.published;
              return `
                <tr>
                  <td>${esc(r.id || '—')}</td>
                  <td><div class="mall-project-name">${esc(r.name || '—')}</div></td>
                  <td>${esc(r.period || formatLovePeriod(r.periodStart, r.periodEnd))}</td>
                  <td>${formatMallNum(raised)}</td>
                  <td>${formatYuan(coinsToLove(raised))}</td>
                  <td>${formatMallNum(target)}</td>
                  <td><span class="tag tag-gray">已结项</span></td>
                  <td>${published ? '<span class="tag tag-green">已公示</span>' : '<span class="tag tag-gray">未公示</span>'}</td>
                  <td>${donationCount}</td>
                  <td>${esc(r.closedAt || '—')}</td>
                  <td><div class="mall-project-actions">
                    <button type="button" class="btn-link" onclick="openMallClosedDetail('${r.id}')">查看详情</button>
                    <button type="button" class="btn-link" onclick="editPastProject('${r.id}')">上传项目成果</button>
                    ${published
                      ? `<button type="button" class="btn-link" onclick="unpublishPastProject('${r.id}')">取消公示</button>`
                      : `<button type="button" class="btn-link" onclick="publishPastProject('${r.id}')">公示</button>`}
                  </div></td>
                </tr>
              `;
            }).join('') : empty}
          </tbody>
        </table>
      </div>
      ${renderPastProjectPagination(total)}
    </div>
  `;
}

function renderMallClosedOutcomeImages(images) {
  const list = Array.isArray(images) ? images : [];
  if (!list.length) return '<div class="mall-empty">暂无成果图片</div>';
  return `
    <div class="lpj-media-gallery">
      ${list.map(item => `
        <div class="lpj-media-item">
          <img class="lpj-media-thumb" src="${item.url}" alt="${esc(item.name || '成果图片')}">
          <div class="lpj-media-name">${esc(item.name || '成果图片')}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function openMallClosedDetail(id) {
  const r = getClosedStages().find(x => x.id === id);
  if (!r) return;
  const raised = Number(r.raisedCoins) || 0;
  const target = Number(r.targetCoins) || 0;
  const donationCount = getClosedStageDonations(r).length;
  fillMallModal({
    title: '往期项目详情',
    subtitle: r.id,
    size: 'md',
    footerEnd: true,
    body: `
      <div class="detail-grid">
        <div class="detail-item"><label>结项编号</label><span>${esc(r.id || '—')}</span></div>
        <div class="detail-item"><label>项目名称</label><span>${esc(r.name || '—')}</span></div>
        <div class="detail-item"><label>阶段周期</label><span>${esc(r.period || formatLovePeriod(r.periodStart, r.periodEnd))}</span></div>
        <div class="detail-item"><label>捐赠金币</label><span>${formatMallNum(raised)}</span></div>
        <div class="detail-item"><label>折合人民币</label><span>${formatYuan(coinsToLove(raised))}</span></div>
        <div class="detail-item"><label>募集上限</label><span>${formatMallNum(target)}</span></div>
        <div class="detail-item"><label>状态</label><span class="tag tag-gray">已结项</span></div>
        <div class="detail-item"><label>公示状态</label><span>${r.published ? '<span class="tag tag-green">已公示</span>' : '<span class="tag tag-gray">未公示</span>'}</span></div>
        <div class="detail-item"><label>公示时间</label><span>${esc(r.publishedAt || '—')}</span></div>
        <div class="detail-item"><label>捐赠笔数</label><span>${donationCount}</span></div>
        <div class="detail-item"><label>结项时间</label><span>${esc(r.closedAt || '—')}</span></div>
      </div>
      <div class="lpj-payout-history">
        <div class="lpj-payout-history-title">成果图片</div>
        ${renderMallClosedOutcomeImages(r.outcomeMedia)}
      </div>
      <div class="lpj-payout-history">
        <div class="lpj-payout-history-title">文字说明</div>
        <div class="mall-outcome-text">${esc(r.outcome || '暂无文字说明')}</div>
      </div>
    `,
    footer: `<button type="button" class="btn" onclick="closeModal()">关闭</button>`,
  });
}

function renderMallPublicityFields(r = {}) {
  return `
        <div class="mall-stage-outcome-section">
          <div class="mall-stage-section-title">项目成果</div>
          <div class="form-item full">
            <label class="form-label">成果图片</label>
            <div id="mall-stage-outcome-images">${renderMallStageOutcomeImages()}</div>
            <p class="form-hint">支持 jpg / png / webp / gif，最多 ${LOVE_PROJECT_MEDIA_MAX} 张，单张不超过 ${LOVE_PROJECT_IMAGE_MAX_MB}MB。</p>
          </div>
          <div class="form-item full">
            <label class="form-label">文字说明</label>
            <textarea class="textarea" id="mall-stage-outcome-text" placeholder="请输入项目完成情况、成果说明等" style="min-width:0">${esc(r.outcome || '')}</textarea>
          </div>
        </div>
  `;
}

function editPastProject(id) {
  const r = getClosedStages().find(x => x.id === id);
  if (!r) return;
  mallPublishingStageId = id;
  mallStageOutcomeImages = (Array.isArray(r.outcomeMedia) ? r.outcomeMedia : []).map(item => ({ ...item }));
  const raised = Number(r.raisedCoins) || 0;
  const target = Number(r.targetCoins) || 0;
  fillMallModal({
    title: '编辑',
    size: 'md',
    footerEnd: true,
    body: `
      <div class="mall-close-stage">
        <p class="mall-close-stage-lead">上传项目成果图片并填写文字说明。默认不公示，学生端不会展示该往期项目。</p>
        <div class="mall-close-card">
          <div class="mall-close-card-kicker">往期项目</div>
          <div class="mall-close-card-name">${esc(r.name || r.id || '—')}</div>
          <div class="mall-close-card-meta">${esc(r.period || formatLovePeriod(r.periodStart, r.periodEnd))} · 已募 ${formatMallNum(raised)} / ${formatMallNum(target)} 金币</div>
        </div>
        ${renderMallPublicityFields({ ...r, published: !!r.published })}
      </div>
    `,
    footer: `
      <button type="button" class="btn" onclick="closeModal()">取消</button>
      <button type="button" class="btn btn-love" onclick="submitPublishPastProject()">保存</button>
    `,
  });
  bindMallStageOutcomeUpload();
}

function publishPastProject(id) {
  const r = getClosedStages().find(x => x.id === id);
  if (!r) return;
  showConfirmModal({
    title: '公示',
    message: `确认将「${r.name || r.id}」对学生端公示？公示后学生端才会展示该项目。`,
    confirmText: '确认公示',
    onConfirm: () => {
      r.published = true;
      r.publishedAt = now();
      saveData(data);
      toast('已公示，学生端将展示该项目');
      navigate('mall', { keepFilter: true });
    },
  });
}

function submitPublishPastProject() {
  const r = getClosedStages().find(x => x.id === mallPublishingStageId);
  if (!r) return;
  r.outcome = (document.getElementById('mall-stage-outcome-text')?.value || '').trim();
  r.outcomeMedia = mallStageOutcomeImages.map(item => ({ ...item }));
  saveData(data);
  closeModal();
  toast('项目成果已保存');
  navigate('mall', { keepFilter: true });
}

function unpublishPastProject(id) {
  const r = getClosedStages().find(x => x.id === id);
  if (!r) return;
  showConfirmModal({
    title: '取消公示',
    message: `确认取消「${r.name || r.id}」的学生端公示？学生端将不再展示该项目。`,
    confirmText: '取消公示',
    onConfirm: () => {
      r.published = false;
      r.publishedAt = null;
      saveData(data);
      toast('已取消公示');
      navigate('mall', { keepFilter: true });
    },
  });
}

function renderMallProjectsTab() {
  return renderPastProjectTable();
}

function renderMallPublicityTab() {
  return renderMallMonthlyTable();
}

function ledgerTypeLabel(type) {
  return type === 'donate' ? '<span class="tag tag-red">学生捐赠</span>' : '<span class="tag tag-blue">项目支出</span>';
}

function mallLedgerDescription(r) {
  if (r.type !== 'donate') return r.summary || '公益项目支出';
  const donation = getMallDonations().find(d => r.donationId === d.id || String(r.summary || '').includes(d.id));
  const userId = r.userId || donation?.userId || donation?.studentId;
  return userId ? '学生捐赠（用户ID: ' + userId + '）' : (r.summary || '学生捐赠');
}

function changeMallLedgerPeriod(period) {
  mallLedgerPeriod = period;
  navigate('mall', { keepFilter: true });
}

function getMallLedgerSummary() {
  const today = mallTodayYmd();
  const currentMonth = today.slice(0, 7);
  const d = new Date(Number(currentMonth.slice(0, 4)), Number(currentMonth.slice(5)) - 2, 1);
  const previousMonth = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const month = mallLedgerPeriod === 'lastMonth' ? previousMonth : currentMonth;
  const all = getMallLedgerRows().slice().reverse();
  const before = mallLedgerPeriod === 'all' ? [] : all.filter(r => String(r.createdAt).slice(0, 7) < month);
  const rows = mallLedgerPeriod === 'all' ? all : all.filter(r => String(r.createdAt).slice(0, 7) === month);
  const first = all[0];
  const initial = first ? Number(first.balanceYuan || 0) - (first.type === 'payout' ? -Math.abs(first.amountYuan || 0) : Number(first.amountYuan || coinsToLove(first.coins))) : 0;
  const opening = before.length ? Number(before[before.length - 1].balanceYuan || 0) : initial;
  const incoming = rows.filter(r => r.type === 'donate').reduce((s, r) => s + Number(r.amountYuan || coinsToLove(r.coins)), 0);
  const expense = rows.filter(r => r.type === 'payout').reduce((s, r) => s + Math.abs(Number(r.amountYuan) || 0), 0);
  return { opening, incoming, expense, ending: opening + incoming - expense };
}

function renderMallLedgerTable() {
  const { total, rows } = paginateMall(filterMallLedger());
  const summary = getMallLedgerSummary();
  const periods = { month: '本月', lastMonth: '上月', all: '全部' };
  const times = { all: '全部', today: '今日', '7d': '近7天', '30d': '近30天', month: '本月' };
  return `
    <section class="mall-ledger-summary">
      <div class="mall-reference-heading">
        <div><h3>周期汇总 · ${periods[mallLedgerPeriod]}</h3><p>学生捐赠金币汇入 + 公益项目支出</p></div>
        <select class="select" aria-label="汇总周期" onchange="changeMallLedgerPeriod(this.value)">
          ${Object.entries(periods).map(([v, label]) => `<option value="${v}"${v === mallLedgerPeriod ? ' selected' : ''}>${label}</option>`).join('')}
        </select>
      </div>
      <div class="mall-stat-row">
        <div class="mall-stat-card"><div class="label">期初余额</div><div class="value">${formatYuan(summary.opening)}</div></div>
        <div class="mall-stat-card mall-ledger-income"><div class="label">学生捐赠汇入</div><div class="value">${formatYuan(summary.incoming)}</div><div class="sub">学习金币折算</div></div>
        <div class="mall-stat-card"><div class="label">项目支出</div><div class="value">${formatYuan(summary.expense)}</div></div>
        <div class="mall-stat-card"><div class="label">期末余额</div><div class="value">${formatYuan(summary.ending)}</div></div>
      </div>
    </section>
    <div class="mall-ledger-filters">
      <div class="filter-item"><label>编号 / 说明</label><input class="input" id="mall-filter-kw" placeholder="请输入关键词" value="${esc(mallPageState.keyword)}" onkeydown="if(event.key==='Enter')applyMallFilter()"></div>
      <div class="filter-item"><label>类型</label><select class="select" id="mall-ledger-type">
        ${[['all', '全部'], ['donate', '学生捐赠'], ['payout', '项目支出']].map(([v, label]) => `<option value="${v}"${v === (mallPageState.ledgerType || 'all') ? ' selected' : ''}>${label}</option>`).join('')}
      </select></div>
      <div class="filter-item"><label>时间范围</label><select class="select" id="mall-filter-time">
        ${Object.entries(times).map(([v, label]) => `<option value="${v}"${v === mallPageState.timeRange ? ' selected' : ''}>${label}</option>`).join('')}
      </select></div>
      <div class="mall-ledger-query"><button class="btn btn-primary" onclick="applyMallFilter()">⌕ 查询</button><button class="btn" onclick="resetMallFilter()">重置</button></div>
    </div>
    <details class="mall-ledger-help"><summary>筛选项说明（爱心池台账 · 共 2 类）</summary><p>学生捐赠：学习金币折算后汇入爱心池。项目支出：公益项目实际支出。池子余额展示该笔流水完成后的余额。</p></details>
    <div class="mall-reference-tools"><button class="btn btn-primary" onclick="exportMallLedgerCsv()">↓ 导出台账</button><span class="mall-total">共 ${total} 条</span></div>
    <div class="table-wrap"><table class="data-table mall-ledger-table">
      <thead><tr><th>时间</th><th>类型</th><th>说明</th><th>池子余额</th></tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr><td>${esc(r.createdAt || '—')}</td><td>${ledgerTypeLabel(r.type)}</td><td>${esc(mallLedgerDescription(r))}</td><td>${formatYuan(r.balanceYuan)}</td></tr>`).join('') : '<tr><td colspan="4" class="mall-empty">暂无数据</td></tr>'}</tbody>
    </table></div>
    ${renderMallPagination(total)}
  `;
}

function renderMallMonthlyTable() {
  ensureMallMonthlyRecords();
  const { total, rows } = paginateMall(getMallMonthlyRows());
  return `
    <div class="mall-reference-heading mall-monthly-heading"><div><h3>爱心月报</h3><p>成果反馈 v1 暂不建设，待公益项目敲定后再开放</p></div></div>
    <div class="mall-reference-tools"><span class="mall-total">共 ${total} 条</span></div>
    <div class="table-wrap"><table class="data-table mall-monthly-table">
      <thead><tr><th>月报标题</th><th>统计周期</th><th>状态</th><th>发布时间</th><th>捐赠金币</th><th>参与人数</th><th>操作</th></tr></thead>
      <tbody>${rows.length ? rows.map(r => `<tr>
        <td>${esc(mallMonthlyTitle(r))}</td><td>${esc(mallMonthlyPeriod(r.month))}</td>
        <td>${r.status === 'published' ? '<span class="tag tag-green">已发布</span>' : '<span class="tag tag-gray">草稿</span>'}</td>
        <td>${r.publishedAt ? esc(r.publishedAt.slice(0, 10)) : '—'}</td><td>${formatMallNum(r.donateCoins)}</td><td>${formatMallNum(r.participants)}</td>
        <td><div class="mall-project-actions"><button class="btn-link" onclick="editMallMonthly('${r.id}')">编辑</button><button class="btn-link" onclick="previewMallMonthly('${r.id}')">预览</button><button class="btn-link" onclick="publishMallMonthly('${r.id}')">发布</button></div></td>
      </tr>`).join('') : '<tr><td colspan="7" class="mall-empty">暂无月报记录</td></tr>'}</tbody>
    </table></div>
    ${renderMallPagination(total)}
  `;
}

function mallMonthlyTitle(r) {
  return r.title || Number(String(r.month).slice(5, 7)) + '月';
}

function mallMonthlyPeriod(month) {
  const year = Number(String(month).slice(0, 4));
  const m = Number(String(month).slice(5, 7));
  const lastDay = new Date(year, m, 0).getDate();
  return month + '-01 — ' + month + '-' + String(lastDay).padStart(2, '0');
}

function getMallMonthlyRows() {
  return (data.loveMonthlyReports || []).slice().sort((a, b) => String(b.month).localeCompare(String(a.month)));
}

function ensureMallMonthlyRecords() {
  if (!Array.isArray(data.loveMonthlyReports)) data.loveMonthlyReports = [];
  const current = mallTodayYmd().slice(0, 7);
  const months = [...getMallDonations().map(r => String(r.donatedAt).slice(0, 7)), ...data.loveMonthlyReports.map(r => r.month)]
    .filter(m => /^\d{4}-\d{2}$/.test(m) && m < current).sort();
  if (!months.length) return;
  const [year, month] = months[0].split('-').map(Number);
  const cursor = new Date(year, month - 1, 1);
  let changed = false;
  while (true) {
    const key = cursor.getFullYear() + '-' + String(cursor.getMonth() + 1).padStart(2, '0');
    if (key >= current) break;
    if (!data.loveMonthlyReports.some(r => r.month === key)) {
      const donations = getMallDonations().filter(r => String(r.donatedAt).slice(0, 7) === key);
      data.loveMonthlyReports.push({
        id: 'MR-' + key.replace('-', ''), month: key,
        donateCoins: donations.reduce((s, r) => s + (Number(r.coins) || 0), 0),
        participants: new Set(donations.map(r => r.userId || r.studentId).filter(Boolean)).size,
        status: 'draft', publishedAt: null,
      });
      changed = true;
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  if (changed) saveData(data);
}

function editMallMonthly(id) {
  const r = (data.loveMonthlyReports || []).find(x => x.id === id);
  if (!r) return;
  fillMallModal({
    title: '编辑爱心月报', size: 'md',
    body: `<div class="form-item full"><label class="form-label">月报标题</label><input class="input" id="mall-monthly-title" value="${esc(mallMonthlyTitle(r))}" style="width:100%"></div>
      <p class="mall-sub">统计周期：${esc(mallMonthlyPeriod(r.month))}</p><p class="mall-sub">捐赠金币：${formatMallNum(r.donateCoins)} · 参与人数：${formatMallNum(r.participants)}</p><p class="mall-sub">统计数据由系统生成，不按项目拆分。</p>`,
    footer: `<button class="btn" onclick="closeModal()">取消</button><button class="btn btn-primary" onclick="saveMallMonthlyTitle('${r.id}')">保存</button>`,
  });
}

function saveMallMonthlyTitle(id) {
  const r = (data.loveMonthlyReports || []).find(x => x.id === id);
  if (!r) return;
  const title = (document.getElementById('mall-monthly-title')?.value || '').trim();
  if (!title) { toast('请输入月报标题', 'warning'); return; }
  r.title = title;
  saveData(data);
  closeModal();
  toast('月报已保存');
  navigate('mall', { keepFilter: true });
}

function fillMallModal({ title, subtitle = '', body, footer, size = 'sm', footerEnd = false }) {
  const modal = document.getElementById('modal');
  const sub = document.getElementById('modal-subtitle');
  document.getElementById('modal-title').textContent = title;
  if (sub) {
    if (subtitle) {
      sub.style.display = '';
      sub.textContent = subtitle;
    } else {
      sub.style.display = 'none';
    }
  }
  document.getElementById('modal-body').innerHTML = body;
  const foot = document.getElementById('modal-footer');
  if (foot) {
    foot.style.display = footer ? '' : 'none';
    foot.classList.toggle('modal-footer--end', !!footerEnd);
    foot.innerHTML = footer || '';
  }
  modal?.classList.remove('modal-xl', 'modal-sm', 'modal-md');
  modal?.classList.add(size === 'xl' ? 'modal-xl' : size === 'md' ? 'modal-md' : 'modal-sm');
  document.getElementById('modal-overlay').hidden = false;
}

function openMallDonationDetail(id) {
  const r = getMallDonations().find(x => x.id === id);
  if (!r) return;
  fillMallModal({
    title: '捐赠详情',
    subtitle: r.id,
    body: `
      <div class="detail-grid">
        <div class="detail-item"><label>捐赠编号</label><span>${esc(r.id)}</span></div>
        <div class="detail-item"><label>学生</label><span>${esc(r.studentId)}${r.studentName ? `（${esc(r.studentName)}）` : ''}</span></div>
        <div class="detail-item"><label>学校</label><span>${esc(r.school)}</span></div>
        <div class="detail-item"><label>班级</label><span>${esc(r.className)}</span></div>
        <div class="detail-item"><label>捐赠金币</label><span>${formatMallNum(r.coins)}</span></div>
        <div class="detail-item"><label>折合爱心值</label><span>${formatYuan(coinsToLove(r.coins))}</span></div>
        <div class="detail-item"><label>捐赠后金币余额</label><span>${formatMallNum(r.balanceAfter)}</span></div>
        <div class="detail-item"><label>被资助项目</label><span>${esc(r.fundedProject || '—')}</span></div>
        <div class="detail-item"><label>捐赠时间</label><span>${esc(r.donatedAt)}</span></div>
      </div>
    `,
    footer: `<button type="button" class="btn" onclick="closeModal()">关闭</button>`,
  });
}

function openMallExchangeDetail(id) {
  const r = getMallExchanges().find(x => x.id === id);
  if (!r) return;
  const loveValue = r.loveValue ?? coinsToLove(r.coins);
  fillMallModal({
    title: '兑换详情',
    subtitle: r.id,
    body: `
      <div class="detail-grid">
        <div class="detail-item"><label>兑换编号</label><span>${esc(r.id)}</span></div>
        <div class="detail-item"><label>学号</label><span>${esc(r.studentId)}${r.studentName ? `（${esc(r.studentName)}）` : ''}</span></div>
        <div class="detail-item"><label>学校</label><span>${esc(r.school)}</span></div>
        <div class="detail-item"><label>班级</label><span>${esc(r.className)}</span></div>
        <div class="detail-item"><label>消耗金币</label><span>${formatMallNum(r.coins)}</span></div>
        <div class="detail-item"><label>获得爱心值</label><span>${formatMallNum(loveValue, loveValue % 1 ? 2 : 0)}</span></div>
        <div class="detail-item"><label>兑换时间</label><span>${esc(r.exchangedAt)}</span></div>
      </div>
    `,
    footer: `<button type="button" class="btn" onclick="closeModal()">关闭</button>`,
  });
}

function openMallLedgerDetail(id) {
  const r = (data.loveLedger || []).find(x => x.id === id);
  if (!r) return;
  fillMallModal({
    title: '台账详情',
    subtitle: r.id,
    body: `
      <div class="detail-grid">
        <div class="detail-item"><label>流水号</label><span>${esc(r.id)}</span></div>
        <div class="detail-item"><label>类型</label><span>${ledgerTypeLabel(r.type)}</span></div>
        <div class="detail-item"><label>摘要</label><span>${esc(r.summary)}</span></div>
        <div class="detail-item"><label>金币变动</label><span>${r.coins ? `+${formatMallNum(r.coins)}` : '—'}</span></div>
        <div class="detail-item"><label>金额</label><span>${formatYuan(r.amountYuan)}</span></div>
        <div class="detail-item"><label>池内余额</label><span>${formatYuan(r.balanceYuan)}</span></div>
        <div class="detail-item"><label>时间</label><span>${esc(r.createdAt)}</span></div>
      </div>
    `,
    footer: `<button type="button" class="btn" onclick="closeModal()">关闭</button>`,
  });
}

function openMallSchoolSummaryModal() {
  const map = {};
  filterMallDonations().forEach(r => {
    const key = r.school || '未知学校';
    if (!map[key]) map[key] = { school: key, count: 0, coins: 0 };
    map[key].count += 1;
    map[key].coins += r.coins || 0;
  });
  const rows = Object.values(map).sort((a, b) => b.coins - a.coins);
  fillMallModal({
    title: '按学校汇总',
    subtitle: '当前筛选条件下的捐赠汇总',
    size: 'xl',
    body: `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>学校</th><th>捐赠人次</th><th>捐赠金币</th><th>折合爱心值</th></tr></thead>
          <tbody>
            ${rows.length ? rows.map(r => `
              <tr>
                <td>${esc(r.school)}</td>
                <td>${r.count}</td>
                <td>${formatMallNum(r.coins)}</td>
                <td>${formatYuan(coinsToLove(r.coins))}</td>
              </tr>
            `).join('') : '<tr><td colspan="4" class="mall-empty">暂无数据</td></tr>'}
          </tbody>
        </table>
      </div>
    `,
    footer: `<button type="button" class="btn" onclick="closeModal()">关闭</button>`,
  });
}

function previewMallMonthly(id) {
  const r = (data.loveMonthlyReports || []).find(x => x.id === id);
  if (!r) return;
  fillMallModal({
    title: mallMonthlyTitle(r) + ' · 爱心月报预览', size: 'md',
    subtitle: mallMonthlyPeriod(r.month),
    body: `<div class="mall-report-preview"><div class="mall-report-title">本月捐赠与参与数据</div>
      <div class="mall-stat-row mall-monthly-preview">
        <div class="mall-stat-card"><div class="label">捐赠金币</div><div class="value">${formatMallNum(r.donateCoins)}</div></div>
        <div class="mall-stat-card"><div class="label">参与人数</div><div class="value">${formatMallNum(r.participants)}</div></div>
      </div></div>`,
    footer: '<button class="btn" onclick="closeModal()">关闭</button>',
  });
}

function publishMallMonthly(id) {
  const r = (data.loveMonthlyReports || []).find(x => x.id === id);
  if (!r) return;
  if (r.status === 'published') { toast('该月报已发布'); return; }
  showConfirmModal({
    title: '发布月报', message: '确认将「' + mallMonthlyTitle(r) + '」发布至学生端爱心公告栏？',
    confirmText: '确认发布',
    onConfirm: () => {
      r.status = 'published'; r.publishedAt = now();
      saveData(data); toast('已发布'); navigate('mall', { keepFilter: true });
    },
  });
}

function unpublishMallMonthly(id) {
  const r = (data.loveMonthlyReports || []).find(x => x.id === id);
  if (!r) return;
  showConfirmModal({
    title: '撤回公示',
    message: `确认撤回 ${r.month} 月报？学生端将不再展示该月公示。`,
    confirmText: '确认撤回',
    onConfirm: () => {
      r.status = 'draft';
      r.publishedAt = null;
      saveData(data);
      toast('已撤回');
      navigate('mall', { keepFilter: true });
    },
  });
}

function renderMallPage(params) {
  if (!params?.keepFilter) {
    const tabMap = { exchange: 'ledger', publicity: 'monthly', projects: 'past', closed: 'past', trash: 'donations' };
    mallPageState = {
      tab: tabMap[mallPageState.tab] || mallPageState.tab || 'donations',
      projectGroup: mallPageState.projectGroup === 'raising' ? 'ongoing' : (mallPageState.projectGroup || 'ongoing'),
      keyword: '',
      timeRange: 'all',
      donationQueried: true,
      donationAllProjects: true,
      donationProjects: [],
      page: 1,
      pageSize: 10,
    };
    pastProjectState = { keyword: '', timeRange: 'all', page: 1, pageSize: 10 };
  }
  const summary = getMallSummary();
  let body = '';
  if (mallPageState.tab === 'ledger') body = renderMallLedgerTable();
  else if (mallPageState.tab === 'past') body = renderPastProjectTable();
  else if (mallPageState.tab === 'monthly') body = renderMallMonthlyTable();
  else body = renderMallDonationTable();

  return `
    <div class="mall-page">
      <div class="mall-page-title">捐赠与爱心池</div>
      ${renderMallStatCards(summary)}
      ${renderMallProjectBanner()}
      <div class="mall-panel">
        ${renderMallTabs()}
        ${body}
      </div>
    </div>
  `;
}
