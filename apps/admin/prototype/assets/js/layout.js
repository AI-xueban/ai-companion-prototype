const MENU = [
  { key: 'home', label: '首页', icon: '🏠', route: null },
  { key: 'school', label: '学校信息管理', icon: '🏫', route: null },
  { key: 'user', label: '用户管理', icon: '👤', route: null },
  {
    key: 'device-mgmt', label: '设备管理', icon: '📱', expanded: true,
    children: [
      { key: 'device-overview', label: '概览', route: 'device-overview' },
      { key: 'cabinet', label: '柜机管理', route: 'cabinet' },
      { key: 'tablet', label: '平板设备', route: 'tablet' },
      { key: 'device-usage', label: '使用记录', route: 'device-usage' },
      { key: 'device-alert', label: '状态告警', route: 'device-alert' },
    ]
  },
  {
    key: 'content-op', label: '内容运营', icon: '📋', expanded: true,
    children: [
      {
        key: 'wanxiang', label: '万象视界管理', expanded: true,
        children: [
          { key: 'home-config', label: '首页配置', route: 'home-config' },
          { key: 'hot-recommend', label: '热门推荐', route: 'hot-recommend' },
          { key: 'content', label: '内容管理', route: 'content' },
          { key: 'channel', label: '频道管理', route: 'channel' },
          { key: 'tag', label: '标签管理', route: 'tag' },
          { key: 'daily-word', label: '每日一词', route: 'daily-word' },
        ]
      }
    ]
  },
  {
    key: 'coin-op', label: '金币运营', icon: '🪙', expanded: true,
    children: [
      { key: 'coin-income', label: '金币入账', route: null },
      { key: 'coin-exchange', label: '商店/许愿池兑换', route: null },
      { key: 'mall', label: '捐赠与爱心池', route: 'mall' },
      { key: 'donate-rule', label: '捐赠规则', route: null },
    ]
  },

  { key: 'system', label: '系统配置', icon: '⚙️', route: null },
  { key: 'audit', label: '操作审计日志', icon: '📝', route: null },
];

const ROUTE_META = {
  'mall': { title: '捐赠与爱心池', breadcrumb: ['金币运营', '捐赠与爱心池'] },
  'home-config': { title: '首页配置', breadcrumb: ['内容运营', '万象视界管理', '首页配置'] },
  'hot-recommend': { title: '热门推荐', breadcrumb: ['内容运营', '万象视界管理', '热门推荐'] },
  'layout-template': { title: '排版模板', breadcrumb: ['内容运营', '万象视界管理', '首页配置', '排版模板'] },
  'section-add': { title: '新增板块', breadcrumb: ['内容运营', '万象视界管理', '首页配置'] },
  'section-edit': { title: '编辑板块', breadcrumb: ['内容运营', '万象视界管理', '首页配置'] },
  'content': { title: '内容管理', breadcrumb: ['内容运营', '万象视界管理', '内容管理'] },
  'channel': { title: '频道管理', breadcrumb: ['内容运营', '万象视界管理', '频道管理'] },
  'channel-add': { title: '新增频道', breadcrumb: ['内容运营', '万象视界管理', '频道管理'] },
  'channel-edit': { title: '频道编辑', breadcrumb: ['内容运营', '万象视界管理', '频道管理'] },
  'tag': { title: '标签管理', breadcrumb: ['内容运营', '万象视界管理', '标签管理'] },
  'daily-word': { title: '每日一词', breadcrumb: ['内容运营', '万象视界管理', '每日一词'] },
  'word-edit': { title: '编辑词表', breadcrumb: ['内容运营', '万象视界管理', '每日一词', '编辑词表'] },
  'device-overview': { title: '设备概览', breadcrumb: ['设备管理', '概览'] },
  'cabinet': { title: '柜机管理', breadcrumb: ['设备管理', '柜机管理'] },
  'cabinet-detail': { title: '柜机详情', breadcrumb: ['设备管理', '柜机管理', '详情'] },
  'cabinet-carousel': { title: '配置轮播', breadcrumb: ['设备管理', '柜机管理', '配置轮播'] },
  'cabinet-carousel-batch': { title: '批量配置轮播', breadcrumb: ['设备管理', '柜机管理', '批量配置轮播'] },
  'tablet': { title: '平板设备', breadcrumb: ['设备管理', '平板设备'] },
  'tablet-detail': { title: '设备详情', breadcrumb: ['设备管理', '平板设备', '详情'] },
  'device-usage': { title: '使用记录', breadcrumb: ['设备管理', '使用记录'] },
  'device-usage-detail': { title: '使用记录详情', breadcrumb: ['设备管理', '使用记录', '详情'] },
  'device-alert': { title: '状态告警', breadcrumb: ['设备管理', '状态告警'] },

};

function renderSiderMenu(activeRoute) {
  const el = document.getElementById('sider-menu');
  el.innerHTML = MENU.map(item => renderMenuItem(item, activeRoute, 0)).join('');
}

function isMenuRouteActive(itemRoute, activeRoute) {
  const detailMap = {
    'home-config': ['section-add', 'section-edit', 'layout-template'],
    'channel': ['channel-add', 'channel-edit'],
    'daily-word': ['word-edit'],
    'cabinet': ['cabinet-detail', 'cabinet-carousel', 'cabinet-carousel-batch'],
    'tablet': ['tablet-detail'],
    'device-usage': ['device-usage-detail'],
  };
  if (itemRoute === activeRoute) return true;
  return (detailMap[itemRoute] || []).includes(activeRoute);
}

function isMenuGroupActive(item, activeRoute) {
  if (item.children) return item.children.some(c => isMenuGroupActive(c, activeRoute));
  return isMenuRouteActive(item.route, activeRoute);
}

function renderMenuItem(item, activeRoute, depth) {
  if (item.children) {
    const groupActive = isMenuGroupActive(item, activeRoute);
    const childHtml = item.children.map(c => renderMenuItem(c, activeRoute, depth + 1)).join('');
    return `<div class="menu-group">
      <div class="menu-item ${groupActive ? 'open' : ''}" style="padding-left:${16 + depth * 8}px">
        <span class="menu-item-icon">${item.icon || ''}</span>
        ${esc(item.label)}
        <span class="menu-expand">${item.expanded ? '▴' : '▸'}</span>
      </div>
      ${childHtml}
    </div>`;
  }
  const active = isMenuRouteActive(item.route, activeRoute);
  return `<a class="menu-sub-item ${active ? 'active' : ''}" href="#${item.route || ''}" data-route="${item.route || ''}" style="padding-left:${40 + depth * 8}px" onclick="return handleMenuClick(event,'${item.route || ''}')">${esc(item.label)}</a>`;
}

function handleMenuClick(e, route) {
  if (!route) { e.preventDefault(); toast('该模块为原型占位', 'warning'); return false; }
  openTab(route);
  return true;
}

function renderBreadcrumb(route) {
  const meta = ROUTE_META[route] || ROUTE_META['home-config'];
  const el = document.getElementById('breadcrumb');
  el.innerHTML = meta.breadcrumb.map((b, i) =>
    i < meta.breadcrumb.length - 1 ? `${esc(b)} <span>/</span>` : esc(b)
  ).join(' ');
}

let openTabs = [{ id: 'home-config', route: 'home-config', title: '首页配置', params: null }];
let tabSeq = 1;

function openTab(route, title, params, forceNew = false) {
  const meta = ROUTE_META[route];
  const tabTitle = title || meta?.title || route;
  let tab;
  if (forceNew) {
    const tabId = `${route}-${tabSeq++}`;
    const tabParams = { ...(params || {}), _tabId: tabId };
    tab = { id: tabId, route, title: tabTitle, params: tabParams };
    openTabs.push(tab);
  } else {
    tab = openTabs.find(t =>
      t.route === route &&
      JSON.stringify(t.params || null) === JSON.stringify(params || null)
    );
    if (!tab) {
      tab = { id: route, route, title: tabTitle, params: params || null };
      openTabs.push(tab);
    }
  }
  const hash = tab.params ? `${route}?${encodeURIComponent(JSON.stringify(tab.params))}` : route;
  location.hash = hash;
}

function closeTab(tabId, e) {
  if (e) e.stopPropagation();
  if (openTabs.length <= 1) return;
  const current = parseHash();
  const activeTabId = current.params?._tabId ||
    openTabs.find(t => t.route === current.route && JSON.stringify(t.params || null) === JSON.stringify(current.params || null))?.id ||
    current.route;
  openTabs = openTabs.filter(t => t.id !== tabId);
  if (tabId === activeTabId) {
    const last = openTabs[openTabs.length - 1];
    navigate(last.route, last.params);
  } else {
    renderTabs(current.route, current.params);
  }
}

function renderTabs(activeRoute, activeParams) {
  const base = activeRoute.split('?')[0];
  const activeTabId = activeParams?._tabId ||
    openTabs.find(t => t.route === base && JSON.stringify(t.params || null) === JSON.stringify(activeParams || null))?.id ||
    base;
  const el = document.getElementById('tabs-bar');
  el.innerHTML = openTabs.map(tab => {
    const active = tab.id === activeTabId;
    const paramsJson = tab.params ? JSON.stringify(tab.params).replace(/"/g, '&quot;') : 'null';
    return `<div class="page-tab ${active ? 'active' : ''}" onclick="navigate('${tab.route}',${tab.params ? paramsJson : 'null'})">
      ${esc(tab.title)}
      ${openTabs.length > 1 ? `<span class="page-tab-close" onclick="closeTab('${tab.id}', event)">×</span>` : ''}
    </div>`;
  }).join('');
}

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

function renderContentCoverTd(content) {
  if (content?.coverUrl) {
    return `<td class="content-cover-cell"><img class="content-cover-thumb" src="${content.coverUrl}" alt="封面"></td>`;
  }
  return `<td class="content-cover-cell"><span class="content-cover-empty">—</span></td>`;
}

function renderContentTableRows(items, actions) {
  return items.map((c, i) => `
    <tr>
      ${actions?.showCheckbox ? `<td><input type="checkbox" class="content-pick-checkbox" data-id="${c.id}" onchange="syncContentSelectAllState()"></td>` : ''}
      ${actions?.showSort ? `<td><span class="drag-handle">⠿</span> ${i + 1}</td>` : ''}
      ${actions?.showIndex ? `<td>${i + 1}</td>` : ''}
      ${actions?.showId !== false ? `<td>${c.id}</td>` : ''}
      ${actions?.titleHtml ? `<td>${actions.titleHtml(c)}</td>` : `<td><span class="link">${esc(c.title)}</span></td>`}
      ${actions?.showCover ? renderContentCoverTd(c) : ''}
      ${actions?.showContent !== false ? `<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.content)}</td>` : ''}
      ${actions?.showSource !== false ? `<td>${esc(c.source)}</td>` : ''}
      ${actions?.showImage ? `<td>${c.hasImage ? '<div class="thumb-icon">🖼</div>' : '—'}</td>` : ''}
      ${actions?.showVideo ? `<td>${c.hasVideo ? '<div class="video-thumb">0:00</div>' : '—'}</td>` : ''}
      ${actions?.showViews ? `<td>${c.views}${actions.sortable ? ' ↕' : ''}</td>` : ''}
      ${actions?.showCtr ? `<td>${c.ctr}${actions.sortable ? ' ↕' : ''}</td>` : ''}
      ${actions?.showDuration ? `<td>${c.duration}${actions.sortable ? ' ↕' : ''}</td>` : ''}
      ${actions?.showType !== false ? `<td>${esc(c.type)}</td>` : ''}
      ${actions?.showChannel !== false ? `<td>${esc(c.channel)}</td>` : ''}
      ${actions?.showTags ? `<td>${(c.tags || []).join('; ')}</td>` : ''}
      ${actions?.showStatus ? `<td>${statusTag(c.status)}</td>` : ''}
      ${actions?.showImportTime !== false ? `<td>${c.importTime}${actions.sortable ? ' ↕' : ''}</td>` : ''}
      ${actions?.showAction !== false ? `<td>${actions?.actionHtml ? actions.actionHtml(c) : `<button class="btn-link" onclick="toast('移除成功')">移除</button>`}</td>` : ''}
    </tr>
  `).join('');
}
