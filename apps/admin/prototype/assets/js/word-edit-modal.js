/* 每日一词 · 编辑单词弹窗 */

let wordEditContext = null;

function openWordEditModal(grade, wordId) {
  const words = data.wordLists[grade] || [];
  const word = words.find(w => w.id === +wordId);
  if (!word) return;
  wordEditContext = { grade, wordId: +wordId };
  renderWordEditModal(word);
  document.getElementById('modal-overlay').hidden = false;
}

function renderWordEditModal(word) {
  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = '编辑';
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }

  modal?.classList.remove('modal-xl');
  modal?.classList.add('modal-md');

  document.getElementById('modal-body').innerHTML = `
    <div class="word-edit-modal-form">
      <div class="word-edit-field">
        <label class="form-label"><span class="required">*</span>单词</label>
        <input class="input" style="width:100%" value="${esc(word.word)}" id="word-edit-word">
      </div>
      <div class="word-edit-field">
        <label class="form-label"><span class="required">*</span>音标</label>
        <input class="input" style="width:100%" value="${esc(word.phonetic)}" id="word-edit-phonetic">
      </div>
      <div class="word-edit-field">
        <label class="form-label"><span class="required">*</span>释义</label>
        <textarea class="input word-edit-textarea" id="word-edit-definition">${esc(word.definition)}</textarea>
      </div>
      <div class="word-edit-field">
        <label class="form-label"><span class="required">*</span>例句</label>
        <textarea class="input word-edit-textarea" id="word-edit-example">${esc(word.example)}</textarea>
      </div>
      <div class="word-edit-field">
        <label class="form-label"><span class="required">*</span>例句释义</label>
        <textarea class="input word-edit-textarea" id="word-edit-example-cn">${esc(word.exampleCn)}</textarea>
      </div>
      <div class="word-edit-meta">
        <div class="word-edit-meta-row">
          <span class="word-edit-meta-label">最近生效时间</span>
          <span class="word-edit-meta-value">${esc(word.effectiveTime)}</span>
        </div>
        <div class="word-edit-meta-row">
          <span class="word-edit-meta-label">导入时间</span>
          <span class="word-edit-meta-value">${esc(word.importTime)}</span>
        </div>
      </div>
    </div>
  `;

  if (footer) {
    footer.style.display = '';
    footer.className = 'modal-footer modal-footer--end';
    footer.innerHTML = `
      <button type="button" class="btn" onclick="closeWordEditModal()">取消</button>
      <button type="button" class="btn btn-primary" onclick="saveWordEditModal()">保存</button>
    `;
  }
}

function resetWordEditModalUI() {
  wordEditContext = null;
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-md');
  modal?.classList.add('modal-xl');
  const footer = document.getElementById('modal-footer');
  if (footer) footer.className = 'modal-footer';
}

function closeWordEditModal() {
  resetWordEditModalUI();
  closeModal();
}

function saveWordEditModal() {
  if (!wordEditContext) return;
  const { grade, wordId } = wordEditContext;
  const word = data.wordLists[grade]?.find(w => w.id === wordId);
  if (!word) return;

  const wordVal = document.getElementById('word-edit-word')?.value?.trim();
  const phoneticVal = document.getElementById('word-edit-phonetic')?.value?.trim();
  const definitionVal = document.getElementById('word-edit-definition')?.value?.trim();
  const exampleVal = document.getElementById('word-edit-example')?.value?.trim();
  const exampleCnVal = document.getElementById('word-edit-example-cn')?.value?.trim();

  if (!wordVal || !phoneticVal || !definitionVal || !exampleVal || !exampleCnVal) {
    toast('请填写完整必填项', 'warning');
    return;
  }

  word.word = wordVal;
  word.phonetic = phoneticVal;
  word.definition = definitionVal;
  word.example = exampleVal;
  word.exampleCn = exampleCnVal;

  saveData(data);
  const savedGrade = grade;
  resetWordEditModalUI();
  document.getElementById('modal-overlay').hidden = true;
  toast('保存成功', 'success');
  navigate('word-edit', { grade: savedGrade });
}
