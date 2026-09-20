/* 通用确认弹窗 */

let confirmModalHook = null;

function showConfirmModal(options = {}) {
  const {
    title = '提示',
    message = '',
    hint = '',
    confirmText = '确认',
    cancelText = '取消',
    onConfirm,
    onCancel,
  } = options;

  const modal = document.getElementById('modal');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');

  document.getElementById('modal-title').textContent = title;
  if (subtitle) subtitle.style.display = 'none';

  document.getElementById('modal-body').innerHTML = `
    <div class="confirm-modal-body">
      ${options.htmlMessage ? `<div class="confirm-modal-message">${message}</div>` : `<p class="confirm-modal-message">${esc(message)}</p>`}
      ${hint ? `<p class="confirm-modal-hint">${esc(hint)}</p>` : ''}
    </div>
  `;

  const messageEl = document.querySelector('.confirm-modal-message');
  if (messageEl && typeof message === 'string' && message.includes('\n')) {
    messageEl.classList.add('confirm-modal-message--multiline');
  }

  if (footer) {
    footer.style.display = '';
    footer.innerHTML = `
      <button type="button" class="btn" id="confirm-cancel-btn">${esc(cancelText)}</button>
      <button type="button" class="btn btn-primary" id="confirm-ok-btn">${esc(confirmText)}</button>
    `;
  }

  modal?.classList.remove('modal-xl');
  modal?.classList.add('modal-sm');

  const finish = (confirmed) => {
    modal?.classList.remove('modal-sm');
    modal?.classList.add('modal-xl');
    confirmModalHook = null;
    closeModal();
    if (confirmed) onConfirm?.();
    else onCancel?.();
  };

  confirmModalHook = () => finish(false);

  document.getElementById('confirm-cancel-btn')?.addEventListener('click', () => finish(false));
  document.getElementById('confirm-ok-btn')?.addEventListener('click', () => finish(true));
  document.getElementById('modal-overlay').hidden = false;
}

function runConfirmModalHook() {
  if (typeof confirmModalHook === 'function') {
    const hook = confirmModalHook;
    confirmModalHook = null;
    hook();
    return true;
  }
  return false;
}
