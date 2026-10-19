// Company-wide dashboard prototype. All records below are deterministic demo facts.
// Production must replace authentication and aggregates with server-side services.
(function () {
  const DEMO_ACCOUNT = 'admin@demo';
  const DEMO_PASSWORD = '12345678';
  const REGIONS = ['深圳', '广州', '东莞', '佛山'];
  const fmt = value => Number(value).toLocaleString('zh-CN');
  const rate = (part, whole) => whole ? `${(part / whole * 100).toFixed(1)}%` : '—';
  const split = (total, count, index) => Math.floor(total / count) + (index < total % count ? 1 : 0);
  const schoolNames = ['向阳实验小学', '育才小学', '南山中心小学', '博文小学', '星河小学', '明德小学', '创新小学', '海滨小学', '向阳实验初中', '育才初中', '南山外国语学校', '博文中学', '星河中学', '明德中学', '创新中学', '海滨中学', '启航中学', '卓越中学', '新城中学', '远航中学', '文华中学', '青云中学', '东湖中学', '桂城中学'];
  const schools = schoolNames.map((name, index) => {
    const primary = index < 8;
    const stageIndex = primary ? index : index - 8;
    const count = primary ? 8 : 16;
    return {
      id: `school-${index + 1}`, name, region: REGIONS[index % 4], stage: primary ? '小学' : '初中',
      students: split(primary ? 6400 : 12240, count, stageIndex),
      learners30: split(primary ? 4480 : 8008, count, stageIndex),
      teachers: split(primary ? 500 : 786, count, stageIndex),
      parents: split(primary ? 7300 : 14060, count, stageIndex),
      borrows30: split(8260, 24, index),
      borrowers30: split(6930, 24, index),
      returns30: split(8105, 24, index),
      screenMinutes30: split(224460, 24, index)
    };
  });
  const state = { phase: 'login', mode: null, period: 30, region: 'all', school: 'all', presentation: false, pending: null };
  let workbenchDirty = false;
  window.companyResetWorkbenchDirty = () => { workbenchDirty = false; };
  const root = () => document.getElementById('dashboard-root');
  const authRoot = () => document.getElementById('auth-root');
  const verifyRoot = () => document.getElementById('mode-verify-root');
  const sum = (rows, key) => rows.reduce((total, row) => total + (row[key] || 0), 0);
  const schoolLearners = row => state.period === 30 ? row.learners30 : Math.round(row.learners30 * periodFactor());
  const selectedSchools = () => schools.filter(s => (state.region === 'all' || s.region === state.region) && (state.school === 'all' || s.id === state.school));
  const periodFactor = () => state.period === 7 ? .56 : 1;
  const getFacts = () => {
    const rows = selectedSchools();
    const students = sum(rows, 'students');
    const learners = rows.reduce((n, s) => n + schoolLearners(s), 0);
    const borrows = state.period === 30 ? sum(rows, 'borrows30') : Math.round(sum(rows, 'borrows30') * .27);
    const borrowers = state.period === 30 ? sum(rows, 'borrowers30') : Math.min(borrows, Math.round(sum(rows, 'borrowers30') * .30));
    const returns = state.period === 30 ? sum(rows, 'returns30') : Math.round(sum(rows, 'returns30') * .27);
    const screenMinutes = state.period === 30 ? sum(rows, 'screenMinutes30') : Math.round(sum(rows, 'screenMinutes30') * .27);
    return { rows, students, learners, teachers: sum(rows, 'teachers'), parents: sum(rows, 'parents'), borrows, borrowers, returns, screenMinutes };
  };
  const allocate = (total, shares) => {
    const values = shares.map(share => Math.round(total * share));
    values[values.length - 1] = total - values.slice(0, -1).reduce((a, b) => a + b, 0);
    return values;
  };
  const metric = (title, value, unit, note, hint) => `<article class="company-kpi" title="${hint || note}"><div class="company-kpi-title">${title}<span class="company-help" aria-label="${hint || note}">?</span></div><div class="company-kpi-value">${value}<small>${unit}</small></div><div class="company-kpi-note">${note}</div></article>`;
  const bar = (label, count, denominator, suffix = '人') => `<div class="company-bar-row"><span>${label}</span><div class="company-bar-track"><i style="width:${denominator ? Math.min(count / denominator * 100, 100) : 0}%"></i></div><strong>${fmt(count)} ${suffix} <em>${rate(count, denominator)}</em></strong></div>`;
  const chart = facts => {
    const shares = state.period === 30 ? [.420, .458, .477, .494, .518, .542] : [.272, .294, .309, .326, .340, .351, .363];
    const labels = state.period === 30 ? ['9/19–23', '9/24–28', '9/29–10/3', '10/4–8', '10/9–13', '10/14–18'] : ['10/12', '10/13', '10/14', '10/15', '10/16', '10/17', '10/18'];
    const width = 800, left = 42, right = 778, top = 18, bottom = 150;
    const points = shares.map((share, index) => {
      const count = facts.rows.reduce((total, row) => {
        const schoolIndex = Number(row.id.slice(7));
        const variation = ((schoolIndex % 5) - 2) * .004;
        const stageAdjustment = row.stage === '小学' ? .015 : -.008;
        return total + Math.min(schoolLearners(row), Math.round(row.students * (share + variation + stageAdjustment)));
      }, 0);
      const value = facts.students ? count / facts.students * 100 : 0;
      return { x: left + (right - left) * index / (shares.length - 1), y: bottom - value / 80 * (bottom - top), value };
    });
    const path = points.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${width} 190" role="img" aria-label="${state.period === 30 ? '六个连续五天区间' : '近七天每日'}的学习参与率趋势">
      ${[20, 40, 60, 80].map(v => { const y = bottom - v / 80 * (bottom - top); return `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" stroke="#e5e9ec"/><text x="0" y="${y + 4}" fill="#738998" font-size="11">${v}%</text>`; }).join('')}
      <path d="${path}" fill="none" stroke="#ad8250" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#fff" stroke="#ad8250" stroke-width="3"><title>${labels[i]}：${p.value.toFixed(1)}%</title></circle><text x="${p.x}" y="176" text-anchor="middle" fill="#738998" font-size="10">${labels[i]}</text>`).join('')}
      <text x="${right - 5}" y="${Math.max(points[points.length - 1].y - 13, 15)}" text-anchor="end" fill="#91683a" font-size="13" font-weight="700">${points[points.length - 1].value.toFixed(1)}%</text></svg>`;
  };
  const renderDashboard = () => {
    const f = getFacts();
    const primary = f.rows.filter(s => s.stage === '小学');
    const middle = f.rows.filter(s => s.stage === '初中');
    const stageRows = [primary, middle].map((rows, index) => {
      const eligible = sum(rows, 'students');
      const learning = rows.reduce((n, s) => n + schoolLearners(s), 0);
      return `<tr><th scope="row">${index ? '初中' : '小学'}</th><td>${rows.length} 所</td><td>${fmt(eligible)} 人</td><td>${fmt(learning)} 人</td><td class="company-table-rate">${rate(learning, eligible)}</td></tr>`;
    }).join('');
    const featureShares = [.778, .674, .527, .381];
    const features = ['同步微课', '自主练习', 'AI 解题', '错题订正'].map((name, i) => {
      const count = f.rows.reduce((total, row) => {
        const stageAdjustment = row.stage === '小学' ? [.015, -.010, -.025, .008][i] : [-.010, .006, .015, -.004][i];
        return total + Math.round(schoolLearners(row) * (featureShares[i] + stageAdjustment));
      }, 0);
      return bar(name, count, f.learners);
    }).join('');
    const depth = f.rows.reduce((totals, row) => {
      const shares = row.stage === '小学' ? [.13, .46, .41] : [.164, .452, .384];
      const counts = allocate(schoolLearners(row), shares);
      return totals.map((count, i) => count + counts[i]);
    }, [0, 0, 0]);
    const regionOptions = REGIONS.map(r => `<option value="${r}" ${state.region === r ? 'selected' : ''}>${r}</option>`).join('');
    const schoolOptions = schools.filter(s => state.region === 'all' || s.region === state.region).map(s => `<option value="${s.id}" ${state.school === s.id ? 'selected' : ''}>${s.name}</option>`).join('');
    const taskDue = Math.round(f.learners * .881); const taskDone = Math.round(taskDue * .792);
    const gradingDue = Math.round(f.learners * 1.201); const gradingValid = Math.round(gradingDue * .864);
    root().innerHTML = `<div class="company-dashboard ${state.presentation ? 'company-presentation' : ''}">
      <header class="company-topbar"><div class="company-brand"><span class="company-logo">✦</span>AI学伴管理后台 <span class="company-mode-label">数据看板模式 · 只读</span></div><div class="company-top-actions"><span>演示数据</span><button type="button" id="company-mode-switch">进入管理工作台 →</button><button type="button" id="company-logout">退出登录</button></div></header>
      <main class="company-content"><div class="company-heading"><div><div class="company-eyebrow">PRODUCT PERFORMANCE / 产品表现</div><h1>AI学伴 · 产品数据总览</h1><p>从学校落地到学生参与，查看产品覆盖范围与教学应用情况</p></div><div class="company-filters"><label>周期 <select id="company-period"><option value="30" ${state.period === 30 ? 'selected' : ''}>近 30 天</option><option value="7" ${state.period === 7 ? 'selected' : ''}>近 7 天</option></select></label><label>地区 <select id="company-region"><option value="all">全部地区</option>${regionOptions}</select></label><label>学校 <select id="company-school"><option value="all">全部学校</option>${schoolOptions}</select></label><button type="button" id="company-preview">${state.presentation ? '退出展示预览' : '对外展示预览'}</button></div></div>
      <div class="company-notice"><strong>● 演示数据</strong> 学校与数值均为模拟数据，仅用于验证页面结构、筛选和统计口径；对外可展示学校名称和单校汇总，不展示学生姓名、原始作业或其他个人数据。<span>${state.period === 30 ? '9月19日—10月18日' : '10月12日—10月18日'} · 截至 10月18日 24:00</span></div>
      <div class="company-overview"><section class="company-overview-group"><div class="company-group-title"><b>01 服务规模</b><span>截至周期末仍有效的学校及师生家长关系</span></div><div class="company-kpis">${metric('已上线学校', fmt(f.rows.length), '所', '周期末已开放学生使用的学校')}${metric('教师人数', fmt(f.teachers), '人', '周期末有效教师关系按教师 ID 去重')}${metric('家长人数', fmt(f.parents), '人', '周期末有效绑定关系按家长 ID 去重')}</div></section><section class="company-overview-group company-learning-group"><div class="company-group-title"><b>02 学生学习参与</b><span>适用学生 → 本期学习学生 → 学习覆盖率</span></div><div class="company-kpis">${metric('适用学生', fmt(f.students), '人', '周期末有效学生关系按学生 ID 去重')}${metric(`近 ${state.period} 天学习学生`, fmt(f.learners), '人', '本期至少一次有效学习活动')}${metric('学习覆盖率', rate(f.learners, f.students).replace('%', ''), '%', `${fmt(f.learners)} ÷ ${fmt(f.students)}`, '本期学习学生 ÷ 适用学生')}</div></section></div>
      <div class="company-panel-grid"><section class="company-panel"><div class="company-panel-head"><div><h2>学习参与趋势</h2><p>${state.period === 30 ? '6 个连续 5 天区间' : '近 7 天每日'}；每段按本段去重，不能将各段人数相加</p></div><span class="company-tag">${state.period === 30 ? '每 5 天' : '每日'}覆盖率</span></div><div class="company-chart">${chart(f)}</div></section><section class="company-panel"><div class="company-panel-head"><div><h2>分学段学习参与</h2><p>同一批已上线学校，按当前筛选范围汇总</p></div><span class="company-tag">小学 + 初中</span></div><table class="company-stage-table"><thead><tr><th>学段</th><th>学校</th><th>适用学生</th><th>学习学生</th><th>覆盖率</th></tr></thead><tbody>${stageRows}</tbody></table><p class="company-panel-note">总体学习覆盖率 ${rate(f.learners, f.students)}＝${fmt(f.learners)} ÷ ${fmt(f.students)}；按人数汇总，不平均学段百分比。</p></section></div>
      <div class="company-panel-grid"><section class="company-panel"><div class="company-panel-head"><div><h2>教学功能参与</h2><p>占比分母统一为本期学习学生 ${fmt(f.learners)} 人</p></div><span class="company-tag">人数 / 占比</span></div><div class="company-bars">${features}</div><p class="company-panel-note">同一学生可参与多项，人数及占比不可相加；普通问答不计入学习功能参与。</p></section><section class="company-panel"><div class="company-panel-head"><div><h2>学习天数分布</h2><p>本期有有效学习活动的学生</p></div><span class="company-tag">互斥分组</span></div><div class="company-depth-total"><b>${fmt(f.learners)}</b> 人，以下三组相加等于本期学习学生数</div><div class="company-bars company-depth-bars">${bar('学习 1 天', depth[0], f.learners)}${bar('学习 2–4 天', depth[1], f.learners)}${bar('学习 5 天及以上', depth[2], f.learners)}</div><p class="company-panel-note">一天内至少一次有效学习活动算 1 天；借设备和普通问答不计入。</p></section></div>
      <section class="company-panel company-short-panel"><div class="company-panel-head"><div><h2>作业与批改</h2><p>当前周期已截止任务；作业完成与图片题批改分别计算</p></div><span class="company-tag">不同分母，不与学习人数混算</span></div><div class="company-short-grid"><div><b>${rate(taskDone, taskDue)}</b><span><strong>作业整份完成率</strong>已完成 ${fmt(taskDone)} ÷ 应交 ${fmt(taskDue)} 人次</span></div><div><b>${rate(gradingValid, gradingDue)}</b><span><strong>有效批改覆盖率</strong>有效批改 ${fmt(gradingValid)} ÷ 应批改 ${fmt(gradingDue)} 图片题次</span></div></div></section>
      <section class="company-panel company-short-panel"><div class="company-panel-head"><div><h2>平板租借与使用</h2><p>当前学校范围 · 当前周期汇总</p></div><span class="company-tag">设备事实，不计入学习参与率</span></div><div class="company-device-grid"><div><span>租借次数</span><b>${fmt(f.borrows)} <small>次</small></b><em>成功借出记录笔数</em></div><div><span>租借学生数</span><b>${fmt(f.borrowers)} <small>人</small></b><em>当前周期按学生去重</em></div><div><span>借后亮屏总时长</span><b>${fmt(Math.round(f.screenMinutes / 60))} <small>小时</small></b><em>仅统计借用期间可核验的亮屏时间</em></div><div><span>归还次数</span><b>${fmt(f.returns)} <small>次</small></b><em>按归还发生日期统计</em></div></div></section>
      <footer class="company-footer">数据口径：学习人数只计同步微课、自主练习、AI 解题和错题订正的有效活动。原型数值为演示聚合，不代表真实跨校同步。</footer></main></div>`;
    root().querySelector('#company-period').addEventListener('change', e => { state.period = Number(e.target.value); renderDashboard(); });
    root().querySelector('#company-region').addEventListener('change', e => { state.region = e.target.value; state.school = 'all'; renderDashboard(); });
    root().querySelector('#company-school').addEventListener('change', e => { state.school = e.target.value; renderDashboard(); });
    root().querySelector('#company-preview').addEventListener('click', () => { state.presentation = !state.presentation; renderDashboard(); });
    root().querySelector('#company-mode-switch').addEventListener('click', () => requestSwitch('workbench'));
    root().querySelector('#company-logout').addEventListener('click', logout);
  };
  const renderAuth = () => {
    authRoot().innerHTML = state.phase === 'login' ? `<div class="company-auth"><div class="company-auth-card"><div class="company-auth-brand"><span class="company-logo">✦</span> AI学伴管理后台</div><h1>管理员登录</h1><p>登录后选择数据看板或管理工作台</p><form id="company-login-form"><label>账号<input id="company-account" autocomplete="username" value="${DEMO_ACCOUNT}" required></label><label>密码<input id="company-password" type="password" autocomplete="current-password" placeholder="请输入密码" required></label><div class="company-auth-error" id="company-login-error" role="alert"></div><button type="submit">登录</button></form><small>原型演示账号：${DEMO_ACCOUNT}　密码：${DEMO_PASSWORD}</small></div></div>` : `<div class="company-auth"><div class="company-choice-card"><div class="company-auth-brand"><span class="company-logo">✦</span> AI学伴管理后台</div><p class="company-eyebrow">欢迎回来，超级管理员</p><h1>选择本次进入的模式</h1><p>当前登录已完成身份验证，选择模式后直接进入。</p><div class="company-choices"><button type="button" data-mode="dashboard"><span>▣</span><strong>数据看板</strong><small>查看跨校产品数据、教学应用与设备使用情况。只读浏览，全屏展示。</small><em>进入数据看板 →</em></button><button type="button" data-mode="workbench"><span>▤</span><strong>管理工作台</strong><small>进入原有学校、设备、内容和应用管理页面。</small><em>进入管理工作台 →</em></button></div><p class="company-choice-note">首次选择沿用本次登录验证；此后双向切换均需复验当前账号密码。</p></div></div>`;
    if (state.phase === 'login') {
      authRoot().querySelector('form').addEventListener('submit', e => {
        e.preventDefault();
        const account = authRoot().querySelector('#company-account').value.trim();
        const password = authRoot().querySelector('#company-password').value;
        authRoot().querySelector('#company-password').value = '';
        if (account !== DEMO_ACCOUNT || password !== DEMO_PASSWORD) { authRoot().querySelector('#company-login-error').textContent = '账号或密码错误，请重试'; return; }
        state.phase = 'choice'; showPhase();
      });
    } else authRoot().querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => enterMode(button.dataset.mode)));
  };
  const showPhase = () => {
    document.body.classList.toggle('company-auth-active', state.phase !== 'active');
    document.body.classList.toggle('company-dashboard-active', state.mode === 'dashboard' && state.phase === 'active');
    authRoot().hidden = state.phase === 'active';
    root().hidden = state.mode !== 'dashboard' || state.phase !== 'active';
    if (state.phase !== 'active') renderAuth();
    if (state.mode === 'dashboard' && state.phase === 'active') renderDashboard();
  };
  const enterMode = mode => { state.phase = 'active'; state.mode = mode; state.pending = null; state.presentation = false; workbenchDirty = false; showPhase(); };
  const closeVerify = () => { state.pending = null; verifyRoot().innerHTML = ''; };
  const requestSwitch = mode => {
    if (state.phase !== 'active' || state.mode === mode) return;
    if (state.mode === 'workbench') {
      if (workbenchDirty && !window.confirm('当前页面有未保存的输入。请确认已保存或愿意离开，再继续切换模式。')) return;
    }
    state.pending = mode;
    verifyRoot().innerHTML = `<div class="company-verify-overlay" role="presentation"><div class="company-verify-dialog" role="dialog" aria-modal="true" aria-labelledby="company-verify-title"><button type="button" class="company-verify-close" id="company-verify-close" aria-label="关闭">×</button><h2 id="company-verify-title">验证身份后切换</h2><p>将从「${state.mode === 'dashboard' ? '数据看板' : '管理工作台'}」进入「${mode === 'dashboard' ? '数据看板' : '管理工作台'}」。请输入当前管理员账号密码。</p><form id="company-verify-form"><label>当前账号密码<input id="company-verify-password" type="password" autocomplete="current-password" required></label><div class="company-auth-error" id="company-verify-error" role="alert"></div><div class="company-verify-actions"><button type="button" id="company-verify-cancel">取消</button><button type="submit">验证并切换</button></div></form></div></div>`;
    verifyRoot().querySelector('#company-verify-close').addEventListener('click', closeVerify);
    verifyRoot().querySelector('#company-verify-cancel').addEventListener('click', closeVerify);
    verifyRoot().querySelector('.company-verify-overlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeVerify(); });
    verifyRoot().querySelector('form').addEventListener('submit', e => {
      e.preventDefault();
      const field = verifyRoot().querySelector('#company-verify-password');
      const valid = field.value === DEMO_PASSWORD;
      field.value = '';
      if (!valid) { verifyRoot().querySelector('#company-verify-error').textContent = '密码错误，请重试'; field.focus(); return; }
      const target = state.pending; closeVerify(); enterMode(target);
    });
    verifyRoot().querySelector('#company-verify-password').focus();
  };
  const logout = () => { closeVerify(); state.phase = 'login'; state.mode = null; state.region = 'all'; state.school = 'all'; state.period = 30; workbenchDirty = false; showPhase(); };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && state.pending) closeVerify(); });
  document.addEventListener('input', e => { if (state.mode === 'workbench' && e.target.closest('#main-content')) workbenchDirty = true; });
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('workbench-switch').addEventListener('click', () => requestSwitch('dashboard'));
    document.querySelector('.header-user').insertAdjacentHTML('afterend', '<button type="button" class="company-workbench-logout" id="workbench-logout">退出登录</button>');
    document.getElementById('workbench-logout').addEventListener('click', logout);
    showPhase();
  });
})();
