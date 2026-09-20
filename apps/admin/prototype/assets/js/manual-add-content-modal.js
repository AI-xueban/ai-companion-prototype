/* 内容管理 · 手动添加内容弹窗 */

let manualAddEditId = null;
let manualAddCoverUploaded = false;
let manualAddCoverName = '';
let manualAddCoverUrl = '';

function revokeManualAddCoverUrl() {
  if (manualAddCoverUrl && manualAddCoverUrl.startsWith('blob:')) {
    URL.revokeObjectURL(manualAddCoverUrl);
  }
  manualAddCoverUrl = '';
}

function openManualAddContentModal(contentId) {
  manualAddEditId = contentId ? +contentId : null;
  const editing = manualAddEditId != null ? data.contents.find(c => c.id === manualAddEditId) : null;
  revokeManualAddCoverUrl();
  manualAddCoverUrl = editing?.coverUrl || '';
  manualAddCoverUploaded = !!manualAddCoverUrl;
  manualAddCoverName = editing?.coverName || '';
  renderManualAddContentModal();
  document.getElementById('modal-overlay').hidden = false;
}

function renderManualAddContentModal() {
  const editing = manualAddEditId != null ? data.contents.find(c => c.id === manualAddEditId) : null;
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');
  const selectedTag = editing?.tags?.[0] || '默认原标签';
  const tagOptions = data.tags
    .filter(t => t.status === 'enabled')
    .map(t => `<option value="${esc(t.name)}"${selectedTag === t.name ? ' selected' : ''}>${esc(t.name)}</option>`)
    .join('');

  document.getElementById('modal-title').textContent = editing ? '编辑内容' : '添加内容';
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }

  modal?.classList.remove('modal-sm', 'modal-md');
  modal?.classList.add('modal-xl');

  document.getElementById('modal-body').innerHTML = `
    <div class="manual-add-content-modal">
      <div class="manual-add-main">
        <div class="manual-add-field">
          <label class="form-label"><span class="required">*</span>标题</label>
          <input class="input" style="width:100%" placeholder="请输入" id="manual-add-title" value="${editing ? esc(editing.title) : ''}">
        </div>
        <div class="manual-add-field">
          <label class="form-label"><span class="required">*</span>封面</label>
          <div class="manual-add-cover" id="manual-add-cover-wrap">${renderManualAddCoverWrapInner()}</div>
        </div>
        <div class="manual-add-field">
          <label class="form-label"><span class="required">*</span>内容</label>
          <div class="rte-upload-bar">
            <button type="button" class="btn btn-sm rte-upload-btn" onclick="manualAddUploadImage()">
              <span class="rte-upload-icon">↑</span> 上传图片
            </button>
            <button type="button" class="btn btn-sm rte-upload-btn" onclick="manualAddUploadVideo()">
              <span class="rte-upload-icon">↑</span> 上传视频
            </button>
          </div>
          <div class="rte-editor">
            <div class="rte-toolbar">
              <div class="rte-toolbar-row">
                <select class="rte-select" onchange="rteCommand('formatBlock', this.value); this.selectedIndex = 0;">
                  <option value="">段落</option>
                  <option value="h1">标题 1</option>
                  <option value="h2">标题 2</option>
                  <option value="p">正文</option>
                </select>
                <button type="button" class="rte-btn" title="加粗" onclick="rteCommand('bold')"><b>B</b></button>
                <button type="button" class="rte-btn" title="斜体" onclick="rteCommand('italic')"><i>I</i></button>
                <button type="button" class="rte-btn" title="无序列表" onclick="rteCommand('insertUnorderedList')">≡</button>
                <button type="button" class="rte-btn" title="有序列表" onclick="rteCommand('insertOrderedList')">≣</button>
                <button type="button" class="rte-btn" title="引用" onclick="rteCommand('formatBlock', 'blockquote')">❝</button>
                <button type="button" class="rte-btn" title="左对齐" onclick="rteCommand('justifyLeft')">☰</button>
                <button type="button" class="rte-btn" title="居中" onclick="rteCommand('justifyCenter')">☰</button>
                <button type="button" class="rte-btn" title="右对齐" onclick="rteCommand('justifyRight')">☰</button>
                <button type="button" class="rte-btn" title="链接" onclick="rteInsertLink()">🔗</button>
                <button type="button" class="rte-btn" title="全屏" onclick="toast('全屏（原型演示）')">⛶</button>
                <button type="button" class="rte-btn" title="源码" onclick="toast('源码（原型演示）')">&lt;/&gt;</button>
              </div>
              <div class="rte-toolbar-row">
                <button type="button" class="rte-btn" title="删除线" onclick="rteCommand('strikeThrough')"><s>S</s></button>
                <button type="button" class="rte-btn" title="下划线" onclick="rteCommand('underline')"><u>U</u></button>
                <button type="button" class="rte-btn" title="清除格式" onclick="rteCommand('removeFormat')">⌫</button>
                <button type="button" class="rte-btn" title="减少缩进" onclick="rteCommand('outdent')">⇤</button>
                <button type="button" class="rte-btn" title="增加缩进" onclick="rteCommand('indent')">⇥</button>
                <button type="button" class="rte-btn" title="撤销" onclick="rteCommand('undo')">↶</button>
                <button type="button" class="rte-btn" title="重做" onclick="rteCommand('redo')">↷</button>
                <button type="button" class="rte-btn" title="帮助" onclick="toast('富文本编辑器（原型演示）')">?</button>
              </div>
            </div>
            <div class="rte-body" id="manual-add-editor" contenteditable="true">${editing ? getManualAddEditorHtmlFromContent(editing) : getManualAddEditorDefaultHtml()}</div>
          </div>
        </div>
        <div class="manual-add-field">
          <label class="form-label"><span class="required">*</span>出处</label>
          <input class="input" style="width:100%" placeholder="请输入" id="manual-add-source" value="${editing ? esc(editing.source) : ''}">
        </div>
      </div>
      <div class="manual-add-side">
        <div class="manual-add-side-field">
          <label class="form-label">标签</label>
          <select class="select" style="width:100%" id="manual-add-tag">
            <option value="默认原标签"${selectedTag === '默认原标签' || selectedTag === '标签1' ? ' selected' : ''}>默认原标签</option>
            ${tagOptions}
          </select>
        </div>
      </div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer modal-footer--end';
    footer.innerHTML = `
      <button type="button" class="btn" onclick="closeManualAddContentModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="saveManualAddContent('draft')">保存到草稿</button>
      <button type="button" class="btn btn-primary" onclick="saveManualAddContent('enabled')">发布</button>
    `;
  }
}

function getManualAddEditorHtmlFromContent(c) {
  let html = `<p>${esc(c.content)}</p>`;
  if (c.hasImage) {
    html += `
      <div class="rte-img-block">
        <div class="rte-img-placeholder"></div>
        <div class="rte-img-cap">配图说明</div>
      </div>
    `;
  }
  if (c.hasVideo) {
    html += `<div class="rte-video-block"><div class="rte-video-thumb">▶ 0:00</div></div>`;
  }
  return html.trim();
}

function getManualAddEditorDefaultHtml() {
  return `
    <p>生物中存在一种类似时钟的装置，称为"生物钟"。通过生物钟，生物可以感受外界的时间变化，从而安排自己可以预知的生活规律。</p>
    <p>当天空出现鱼肚白时，一束可见光混合着红光进入远鸡的眼部，这说明，鸡是不是也要分甲鸟，母鸡和家禽公鸡？事实上，公鸡无害于打鸣，它们是在向母鸡宣誓自己的主权范围，向其他公鸡宣告别侵略自己的领地，同时也在向母鸡证明自己的势力范围，提醒她们可以交配了。</p>
    <p>每天清晨家协会公鸡都会唱歌，让睡梦中的家人可以随着公鸡大合唱响亮，不管是寒冬还是炎热的夏季，公鸡都发挥着勇气歌唱，把起床号给那些晚睡的人。</p>
    <p>原来在古代，人们也通过饲养的公鸡来当闹钟，因此公鸡对于古人的生活也产生了很大的影响，堪称动物界的"活闹钟"。正因为这样，人们才会对公鸡格外偏爱，神话传说中的公鸡还有着特殊的含义。</p>
    <div class="rte-img-block">
      <div class="rte-img-placeholder"></div>
      <div class="rte-img-cap">图中清远鸡正在打鸣，利用日出的第一缕阳光放射体内歌唱。</div>
    </div>
    <p>因此，如果把鸡关到东西不透的屋子里，它们的生物钟就会被打乱，这样就可能让它们在中午打鸣。</p>
  `.trim();
}

function rteCommand(cmd, value) {
  document.getElementById('manual-add-editor')?.focus();
  document.execCommand(cmd, false, value || null);
}

function rteInsertLink() {
  const url = prompt('请输入链接地址', 'https://');
  if (url) rteCommand('createLink', url);
}

function manualAddUploadCover() {
  document.getElementById('manual-add-cover-input')?.click();
}

function handleManualAddCoverFile(input) {
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    toast('请上传图片文件', 'warning');
    return;
  }
  revokeManualAddCoverUrl();
  const reader = new FileReader();
  reader.onload = () => {
    manualAddCoverUploaded = true;
    manualAddCoverName = file.name;
    manualAddCoverUrl = reader.result;
    refreshManualAddCoverUI();
    toast('封面上传成功', 'success');
  };
  reader.onerror = () => toast('封面读取失败', 'error');
  reader.readAsDataURL(file);
}

function removeManualAddCover() {
  revokeManualAddCoverUrl();
  manualAddCoverUploaded = false;
  manualAddCoverName = '';
  refreshManualAddCoverUI();
}

function renderManualAddCoverUploadButton() {
  return `
    <button type="button" class="btn btn-sm rte-upload-btn" id="manual-add-cover-upload-btn" onclick="manualAddUploadCover()">
      <span class="rte-upload-icon">↑</span> 上传封面
    </button>
  `;
}

function renderManualAddCoverFileInput() {
  return `<input type="file" id="manual-add-cover-input" hidden accept="image/*" onchange="handleManualAddCoverFile(this)">`;
}

function renderManualAddCoverWrapInner() {
  if (manualAddCoverUploaded && manualAddCoverUrl) {
    return `${renderManualAddCoverPreview()}${renderManualAddCoverFileInput()}`;
  }
  return `${renderManualAddCoverUploadButton()}${renderManualAddCoverFileInput()}`;
}

function renderManualAddCoverPreview() {
  if (!manualAddCoverUrl) return '';
  return `
    <div class="manual-add-cover-preview" id="manual-add-cover-preview">
      <div class="manual-add-cover-image-wrap">
        <img class="manual-add-cover-image" src="${manualAddCoverUrl}" alt="封面预览">
      </div>
      <div class="manual-add-cover-meta">
        <span class="manual-add-cover-name">${esc(manualAddCoverName || '封面图片')}</span>
        <button type="button" class="btn-link" onclick="removeManualAddCover()">删除</button>
      </div>
    </div>
  `;
}

function refreshManualAddCoverUI() {
  const wrap = document.getElementById('manual-add-cover-wrap');
  if (!wrap) return;
  wrap.innerHTML = renderManualAddCoverWrapInner();
}

function manualAddUploadImage() {
  toast('上传图片（原型演示）');
  const editor = document.getElementById('manual-add-editor');
  if (!editor) return;
  editor.insertAdjacentHTML('beforeend', `
    <div class="rte-img-block">
      <div class="rte-img-placeholder"></div>
      <div class="rte-img-cap">上传的图片说明</div>
    </div>
  `);
}

function manualAddUploadVideo() {
  toast('上传视频（原型演示）');
  const editor = document.getElementById('manual-add-editor');
  if (!editor) return;
  editor.insertAdjacentHTML('beforeend', `
    <div class="rte-video-block"><div class="rte-video-thumb">▶ 0:00</div></div>
  `);
}

function getNextContentId() {
  const ids = data.contents.map(c => c.id);
  return ids.length ? Math.max(...ids) + 1 : 101;
}

function getManualAddFormValues() {
  const title = document.getElementById('manual-add-title')?.value?.trim() || '';
  const source = document.getElementById('manual-add-source')?.value?.trim() || '';
  const tag = document.getElementById('manual-add-tag')?.value || '';
  const editor = document.getElementById('manual-add-editor');
  const contentText = editor?.innerText?.trim() || '';
  const hasImage = !!editor?.querySelector('.rte-img-block, .rte-img-placeholder');
  const hasVideo = !!editor?.querySelector('.rte-video-block, .rte-video-thumb');
  return { title, source, tag, contentText, hasImage, hasVideo };
}

function validateManualAddForm(values) {
  if (!values.title) {
    toast('请填写标题', 'warning');
    return false;
  }
  if (!manualAddCoverUploaded || !manualAddCoverUrl) {
    toast('请上传封面', 'warning');
    return false;
  }
  if (!values.contentText) {
    toast('请填写内容', 'warning');
    return false;
  }
  if (!values.source) {
    toast('请填写出处', 'warning');
    return false;
  }
  if (!values.tag) {
    toast('请选择标签', 'warning');
    return false;
  }
  return true;
}

function saveManualAddContent(status) {
  const values = getManualAddFormValues();
  if (!validateManualAddForm(values)) return;

  const tagName = values.tag === '默认原标签' ? '标签1' : values.tag;
  const payload = {
    title: values.title,
    content: values.contentText.slice(0, 80) + (values.contentText.length > 80 ? '…' : ''),
    source: values.source,
    type: values.hasVideo ? '视频' : '图文',
    tags: [tagName],
    status,
    hasImage: values.hasImage,
    hasVideo: values.hasVideo,
    hasCover: manualAddCoverUploaded,
    coverName: manualAddCoverName || '封面图片',
    coverUrl: manualAddCoverUrl,
  };

  if (manualAddEditId != null) {
    const item = data.contents.find(c => c.id === manualAddEditId);
    if (item) Object.assign(item, payload);
  } else {
    data.contents.unshift({
      id: getNextContentId(),
      ...payload,
      channel: '',
      channelId: null,
      views: 0,
      ctr: '0%',
      duration: '—',
      importTime: now(),
    });
  }

  saveData(data);
  closeManualAddContentModal();
  toast(status === 'enabled' ? '发布成功' : '已保存到草稿', 'success');
  navigate('content');
}

function resetManualAddContentModalUI() {
  manualAddEditId = null;
  revokeManualAddCoverUrl();
  manualAddCoverUploaded = false;
  manualAddCoverName = '';
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-sm', 'modal-md');
  modal?.classList.add('modal-xl');
  const footer = document.getElementById('modal-footer');
  if (footer) footer.className = 'modal-footer';
}

function closeManualAddContentModal() {
  resetManualAddContentModalUI();
  closeModal();
}
