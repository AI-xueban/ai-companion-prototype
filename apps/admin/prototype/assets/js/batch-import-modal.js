/* 批量导入弹窗 */

let batchImportFiles = [];
let batchImportTitle = '批量导入';

function openBatchImportModal(title = '批量导入') {
  batchImportFiles = [];
  batchImportTitle = title;
  renderBatchImportModal();
  document.getElementById('modal-overlay').hidden = false;
}

function analyzeImportFileByIndex(index) {
  if (index === 2) {
    return { parseStatus: 'fail' };
  }
  if (index === 1) {
    return {
      parseStatus: 'success',
      simulateImportFail: true,
      importFailReason: '第3行标题不能为空',
    };
  }
  return { parseStatus: 'success', simulateImportFail: false, importFailReason: '' };
}

function handleBatchImportFiles(fileList) {
  if (!fileList?.length) return;
  Array.from(fileList).forEach(file => {
    const index = batchImportFiles.length;
    const analysis = analyzeImportFileByIndex(index);
    batchImportFiles.push({
      id: genId(),
      fileName: file.name,
      parseStatus: analysis.parseStatus,
      importStatus: null,
      note: '',
      cabinetId: document.getElementById('batch-import-cabinet-select')?.value || '',
      cabinetName: document.getElementById('batch-import-cabinet-select')?.selectedOptions?.[0]?.textContent || '',
      simulateImportFail: analysis.simulateImportFail,
      importFailReason: analysis.importFailReason || '',
    });
  });
  refreshBatchImportList();
}

function triggerBatchImportUpload() {
  document.getElementById('batch-import-file-input')?.click();
}

function runBatchImport(recordId) {
  const record = batchImportFiles.find(f => f.id === recordId);
  if (!record || record.parseStatus !== 'success' || record.importStatus) return;

  if (record.simulateImportFail) {
    record.importStatus = 'fail';
    record.note = record.importFailReason || '导入失败，请检查文件内容';
    toast('导入失败', 'error');
  } else {
    record.importStatus = 'success';
    toast('导入成功', 'success');
  }
  refreshBatchImportList();
}

function renderBatchImportRow(record) {
  const { fileName, parseStatus, importStatus, note, id } = record;

  if (parseStatus === 'fail') {
    return `
      <tr>
        <td>${esc(fileName)}</td>
        <td><span class="import-result-fail">上传失败请重新上传正确的文件</span></td>
        <td>--</td>
        <td>--</td>
      </tr>
    `;
  }

  let noteCell = '--';
  let actionCell = `<button class="btn-link" onclick="runBatchImport('${id}')">导入</button>`;

  if (importStatus === 'success') {
    actionCell = '<span class="import-action-success">导入成功</span>';
  } else if (importStatus === 'fail') {
    noteCell = `<span class="import-result-fail">${esc(note)}</span>`;
    actionCell = '<span class="import-result-fail">导入失败</span>';
  }

  return `
    <tr>
      <td>${esc(fileName)}</td>
      <td>上传完成</td>
      <td>${noteCell}</td>
      <td>${actionCell}</td>
    </tr>
  `;
}

function renderBatchImportList() {
  if (!batchImportFiles.length) {
    return '<div class="batch-import-empty">暂无上传记录</div>';
  }
  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>文件名</th><th>上传结果</th><th>说明</th><th>操作</th></tr></thead>
        <tbody>${batchImportFiles.map(renderBatchImportRow).join('')}</tbody>
      </table>
    </div>
  `;
}

function refreshBatchImportList() {
  const listEl = document.getElementById('batch-import-list');
  if (listEl) listEl.innerHTML = renderBatchImportList();
}

function renderBatchImportModal() {
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');
  document.getElementById('modal-title').textContent = batchImportTitle;
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }
  document.getElementById('modal-body').innerHTML = `
    <div class="batch-import-modal">
      <div class="batch-import-list" id="batch-import-list">${renderBatchImportList()}</div>
      <div class="batch-import-upload">
        <div class="batch-import-cabinet-row">
          <div class="batch-import-cabinet-field">
            <label class="form-label"><span class="required">*</span>所属柜机</label>
            <select class="select" id="batch-import-cabinet-select" style="width:100%">
              <option value="">请选择</option>
              ${data.cabinets.map(c => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
            </select>
          </div>
          <div class="batch-import-cabinet-summary">入柜设备 0 台，离柜数量 0 台</div>
        </div>
        <div class="batch-import-dropzone" id="batch-import-dropzone">
          <div class="batch-import-dropzone-icon">📄</div>
          <p class="batch-import-dropzone-text">拖动或点击上传文件</p>
        </div>
        <input type="file" id="batch-import-file-input" hidden multiple accept=".xlsx,.xls,.csv">
        <button type="button" class="btn btn-primary batch-import-template-btn" onclick="toast('模板下载（原型演示）')">模板下载</button>
      </div>
    </div>
  `;
  if (footer) {
    footer.style.display = '';
    footer.innerHTML = `
      <button type="button" class="btn" onclick="closeModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="closeModal()">确定</button>
    `;
  }

  const dropzone = document.getElementById('batch-import-dropzone');
  const fileInput = document.getElementById('batch-import-file-input');
  dropzone?.addEventListener('click', triggerBatchImportUpload);
  fileInput?.addEventListener('change', e => {
    handleBatchImportFiles(e.target.files);
    e.target.value = '';
  });
  dropzone?.addEventListener('dragover', e => {
    e.preventDefault();
    dropzone.classList.add('batch-import-dropzone--active');
  });
  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('batch-import-dropzone--active');
  });
  dropzone?.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('batch-import-dropzone--active');
    handleBatchImportFiles(e.dataTransfer.files);
  });
}
