let data = loadData();
let currentParams = null;

function parseHash() {
  const hash = location.hash.slice(1) || 'home-config';
  const [route, paramStr] = hash.split('?');
  let params = null;
  if (paramStr) {
    try { params = JSON.parse(decodeURIComponent(paramStr)); } catch (e) { /* ignore */ }
  }
  return { route, params };
}

function navigate(route, params) {
  currentParams = params || null;
  const hash = params ? `${route}?${encodeURIComponent(JSON.stringify(params))}` : route;
  if (location.hash.slice(1) !== hash) {
    location.hash = hash;
    return;
  }
  renderApp(route, params);
}

function renderApp(route, params) {
  renderSiderMenu(route);
  renderBreadcrumb(route);
  renderTabs(route, params);
  document.getElementById('main-content').innerHTML = renderPage(route, params);
  if (route === 'channel-add' || route === 'channel-edit') {
    requestAnimationFrame(() => refreshChannelLayoutSelector());
  }
  if (typeof refreshReqPanelForRoute === 'function') {
    refreshReqPanelForRoute();
  }
}

window.addEventListener('hashchange', () => {
  const { route, params } = parseHash();
  currentParams = params;
  renderApp(route, params);
});

document.getElementById('menu-toggle')?.addEventListener('click', () => {
  document.querySelector('.sider').classList.toggle('collapsed');
});

if (typeof initReqNotes === 'function') {
  initReqNotes();
}

if (!location.hash) {
  location.hash = 'home-config';
} else {
  const { route, params } = parseHash();
  renderApp(route, params);
}
