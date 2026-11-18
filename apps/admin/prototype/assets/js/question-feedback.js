function renderQuestionFeedbackPage() {
  return `<section class="qfb-page">
    <h1>题目反馈</h1><p>查看学生提交的问题，按题目、类型或时间查询。</p>
    <div id="qfb-list" class="qfb-card">
      <form class="qfb-filters">
        <label>题目搜索<input name="search" placeholder="题目 ID、原题 ID 或题干"></label>
        <label>反馈类型<select name="type"><option value="">全部类型</option></select></label>
        <label>开始日期<input type="date" name="from"></label>
        <label>结束日期<input type="date" name="to"></label>
        <button class="qfb-primary">查询</button><button type="reset">重置</button>
        <button type="button" id="qfb-refresh">刷新</button>
        <button type="button" class="qfb-export" id="qfb-export-csv">导出当前结果 CSV</button>
        <button type="button" class="qfb-export" id="qfb-export-json">导出完整 JSON</button>
      </form>
      <h2>反馈记录 <small id="qfb-count"></small></h2>
      <div class="qfb-table"><table><thead><tr><th>提交时间</th><th>反馈类型</th><th>关联题目</th><th>学科</th><th>来源场景</th><th>操作</th></tr></thead><tbody></tbody></table></div>
      <p id="qfb-status" role="status"></p>
    </div>
    <div id="qfb-detail" hidden></div>
  </section>`;
}

function initQuestionFeedbackPage() {
  const list = document.getElementById('qfb-list');
  const detail = document.getElementById('qfb-detail');
  const form = list.querySelector('form');
  const status = list.querySelector('#qfb-status');
  const rows = list.querySelector('tbody');
  const subjects = { math: '数学', chinese: '语文', english: '英语' };
  const types = { single_choice: '单选题', multiple_choice: '多选题', true_false: '判断题', fill_in_blank: '填空题' };
  const scenes = { practice: '精准练习 · 答题中', review: '精准练习 · 结果回看' };
  const endpoint = '/api/question-feedback';
  let reports = [];
  let visibleReports = [];

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function valueText(value) {
    if (value === undefined || value === null || value === '') return '—';
    if (Array.isArray(value) && value.every(item => typeof item !== 'object')) return value.join('、') || '—';
    return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  }

  function feedbackLabels(report) {
    if (Array.isArray(report.reasonLabels) && report.reasonLabels.length) return report.reasonLabels;
    return typeof report.reasonLabel === 'string' ? report.reasonLabel.split('、').filter(Boolean) : [];
  }

  function feedbackReasons(report) {
    if (Array.isArray(report.reasons) && report.reasons.length) return report.reasons;
    return report.reason ? [report.reason] : [];
  }

  function serialized(value) {
    return value === undefined || value === null ? '' : typeof value === 'string' ? value : JSON.stringify(value);
  }

  function csvCell(value) {
    let text = serialized(value);
    if (/^[\t\r ]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function downloadFile(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = element('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportCsv() {
    renderRows();
    if (!visibleReports.length) return;
    const headers = [
      '反馈编号', '提交时间', '反馈类型', '原因编码', '文字说明', '手写原图', '反馈场景',
      '题目 ID', '题库原题 ID', '题库来源', '学科', '题型', '知识点', '题干快照',
      '题目详情 JSON', '全部取题参数 JSON', '学生作答', '参考答案', '批改结果',
    ];
    const rows = visibleReports.map((report) => [
      report.id, report.createdAt, feedbackLabels(report).join('、'), feedbackReasons(report).join('、'), report.description,
      report.handwriting ? '原图数据请见完整 JSON 导出' : '', scenes[report.scene] || report.scene,
      report.questionId, report.externalQuestionId, report.source, subjects[report.subject] || report.subject,
      types[report.questionType] || report.questionType, report.knowledgePoints, report.stemSnapshot,
      report.questionSnapshot, report.practiceRequest, report.userAnswer, report.systemCorrectAnswer,
      report.systemJudgment,
    ]);
    const content = '\ufeff' + [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    downloadFile('题目反馈-' + new Date().toISOString().slice(0, 10) + '.csv', content, 'text/csv;charset=utf-8');
  }

  function exportJson() {
    renderRows();
    if (!visibleReports.length) return;
    const content = JSON.stringify({
      exportedAt: new Date().toISOString(),
      count: visibleReports.length,
      filters: Object.fromEntries(new FormData(form).entries()),
      reports: visibleReports,
    }, null, 2);
    downloadFile('题目反馈完整数据-' + new Date().toISOString().slice(0, 10) + '.json', content, 'application/json;charset=utf-8');
  }

  function fields(entries) {
    const grid = element('dl');
    for (const [label, value] of entries) grid.append(element('dt', label), element('dd', valueText(value)));
    return grid;
  }

  function card(title, ...children) {
    const panel = element('section', undefined, 'qfb-card');
    panel.append(element('h2', title), ...children);
    return panel;
  }

  function image(url, alt) {
    if (typeof url !== 'string' || !/^(https?:\/\/|data:image\/(?:png|jpeg|webp);base64,)/i.test(url)) return null;
    const img = element('img');
    img.alt = alt;
    img.src = url;
    return img;
  }

  function showDetail(report) {
    const question = report.questionSnapshot || {};
    const request = report.practiceRequest || {};
    const back = element('button', '‹ 返回列表', 'qfb-link');
    back.onclick = () => { detail.hidden = true; list.hidden = false; };
    const ink = element('div', undefined, 'qfb-ink');
    ink.append(element('h3', '手写原图'), image(report.handwriting, '学生手写说明') || element('p', '未填写手写说明'));
    if (report.description) ink.append(element('h3', '文字说明'), element('p', report.description));
    const feedback = element('div', undefined, 'qfb-detail-grid');
    feedback.append(fields([
      ['反馈编号', report.id], ['反馈类型', feedbackLabels(report)], ['提交时间', new Date(report.createdAt).toLocaleString('zh-CN')],
      ['反馈场景', scenes[report.scene] || report.scene], ['当前题号', request.questionPosition],
    ]), ink);
    const snapshot = card('题目快照', fields([
      ['题目 ID', report.questionId], ['题库原题 ID', report.externalQuestionId], ['题库来源', report.source],
      ['学科 / 题型', [subjects[report.subject] || report.subject, types[report.questionType] || report.questionType].join(' / ')],
      ['知识点', report.knowledgePoints], ['题目难度', question.difficulty], ['题干', question.stem || report.stemSnapshot],
    ]));
    for (const url of Array.isArray(question.images) ? question.images : []) {
      const img = image(url, '题目配图');
      if (img) snapshot.append(img);
    }
    snapshot.append(fields([
      ['选项', Array.isArray(question.options) ? question.options.map((item, i) => String.fromCharCode(65 + i) + '. ' + item).join('\n') : undefined],
      ['小题', question.subQuestions], ['参考答案', report.systemCorrectAnswer], ['解析', question.explanation],
      ['学生作答', report.userAnswer], ['批改结果', ({ correct: '正确', wrong: '错误', partial: '部分正确' })[report.systemJudgment] || '未批改'],
    ]));
    const raw = element('details');
    raw.append(element('summary', '查看完整取题上下文'), element('pre', valueText(request)));
    const parameters = card('当次取题调用参数', fields([
      ['本地取题请求 ID', request.requestId], ['练习会话 ID', request.sessionId],
      ['学科 / 年级 / 学期', [request.subject, request.grade, request.term].filter(Boolean).join(' / ')],
      ['教材版本', request.textbookEdition], ['所选知识点 ID', request.selectedIds],
      ['练习场景', request.scenarioLabel || request.scenario], ['题型配置', request.questionTypeCounts],
      ['请求难度', request.difficulty], ['请求题量', request.questionCount],
      ['返回题目 ID', request.returnedQuestionIds],
    ]), raw);
    const columns = element('div', undefined, 'qfb-detail-grid');
    columns.append(snapshot, parameters);
    detail.replaceChildren(back, element('h2', '反馈详情'), card('学生反馈', feedback), columns);
    list.hidden = true;
    detail.hidden = false;
    detail.scrollIntoView({ block: 'start' });
  }

  function renderRows() {
    const values = new FormData(form);
    const query = String(values.get('search')).trim().toLowerCase();
    const from = values.get('from');
    const to = values.get('to');
    const type = values.get('type');
    visibleReports = reports.filter(report => {
      const time = new Date(report.createdAt);
      const day = time.toLocaleDateString('sv-SE');
      return (!type || feedbackLabels(report).includes(type)) && (!from || day >= from) && (!to || day <= to) &&
        (!query || [report.questionId, report.externalQuestionId, report.questionSnapshot?.stem].some(value => String(value || '').toLowerCase().includes(query)));
    });
    rows.replaceChildren(...visibleReports.map(report => {
      const row = element('tr');
      const title = element('td');
      title.append(element('strong', report.stemSnapshot || report.questionId), element('small', report.questionId));
      const action = element('td');
      const button = element('button', '查看详情', 'qfb-link');
      button.onclick = () => showDetail(report);
      action.append(button);
      const reason = element('td');
      reason.className = 'qfb-reasons';
      for (const label of feedbackLabels(report)) reason.append(element('span', label, 'qfb-badge'));
      row.append(element('td', new Date(report.createdAt).toLocaleString('zh-CN')), reason, title,
        element('td', subjects[report.subject] || report.subject), element('td', scenes[report.scene] || report.scene), action);
      return row;
    }));
    list.querySelector('#qfb-count').textContent = '共 ' + visibleReports.length + ' 条';
    status.textContent = visibleReports.length ? '' : '暂无符合条件的反馈记录。';
    list.querySelector('#qfb-export-csv').disabled = !visibleReports.length;
    list.querySelector('#qfb-export-json').disabled = !visibleReports.length;
  }

  async function refresh() {
    status.textContent = '正在加载反馈…';
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw Error('Feedback unavailable');
      reports = await response.json();
      const select = form.elements.type;
      const selected = select.value;
      const labels = [...new Set(reports.flatMap(feedbackLabels))];
      select.replaceChildren(new Option('全部类型', ''), ...labels.map(label => new Option(label, label)));
      select.value = selected;
      renderRows();
    } catch {
      status.textContent = '无法加载反馈，请确认管理后台预览服务已启动后刷新。';
    }
  }

  form.onsubmit = event => { event.preventDefault(); renderRows(); };
  form.onreset = () => setTimeout(renderRows, 0);
  list.querySelector('#qfb-refresh').onclick = refresh;
  list.querySelector('#qfb-export-csv').onclick = exportCsv;
  list.querySelector('#qfb-export-json').onclick = exportJson;
  refresh();
}
