/* 内容查看弹窗 */

function openContentViewModal(id) {
  const content = data.contents.find(c => c.id === +id);
  if (!content) return;
  renderContentViewModal(content);
  document.getElementById('modal-overlay').hidden = false;
}

function closeModal() {
  if (runConfirmModalHook()) return;
  if (document.querySelector('.word-edit-modal-form') && typeof resetWordEditModalUI === 'function') {
    resetWordEditModalUI();
  }
  if (document.querySelector('.manual-add-content-modal') && typeof resetManualAddContentModalUI === 'function') {
    resetManualAddContentModalUI();
  }
  if (document.querySelector('.batch-tags-modal') && typeof resetBatchEditTagsModalUI === 'function') {
    resetBatchEditTagsModalUI();
  }
  if (document.querySelector('.add-tag-modal') && typeof resetAddTagModalUI === 'function') {
    resetAddTagModalUI();
  }
  if (document.querySelector('.add-cabinet-modal') && typeof resetAddCabinetModalUI === 'function') {
    resetAddCabinetModalUI();
  }
  if (document.querySelector('.edit-tablet-modal') && typeof resetEditTabletModalUI === 'function') {
    resetEditTabletModalUI();
  }
  if (document.querySelector('.time-control-rule-modal') && typeof resetTimeControlRuleModalUI === 'function') {
    resetTimeControlRuleModalUI();
  }
  if (document.querySelector('.photo-gallery-modal') && typeof resetReturnScreenPhotoGalleryUI === 'function') {
    resetReturnScreenPhotoGalleryUI();
  }
  document.getElementById('modal-overlay').hidden = true;
  const modal = document.getElementById('modal');
  modal?.classList.remove('modal-sm', 'modal-md');
  modal?.classList.add('modal-xl');
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');
  if (subtitle) subtitle.style.display = '';
  if (footer) footer.style.display = '';
}

function renderContentViewBody(c) {
  const paragraphs = [
    c.content,
    '生物中存在一种类似时钟的装置，称为"生物钟"。通过生物钟，生物可以感受外界的时间变化，从而安排自己可以预知的生活规律。',
    '当天空出现鱼肚白时，一束可见光混合着红光进入远鸡的眼部，这说明，鸡是不是也要分甲鸟，母鸡和家禽公鸡？事实上，公鸡无害于打鸣，它们是在向母鸡宣誓自己的主权范围，向其他公鸡宣告别侵略自己的领地，同时也在向母鸡证明自己的势力范围，提醒她们可以交配了。',
    '每天清晨家协会公鸡都会唱歌，让睡梦中的家人可以随着公鸡大合唱响亮，不管是寒冬还是炎热的夏季，公鸡都发挥着勇气歌唱，把起床号给那些晚睡的人。',
    '原来在古代，人们也通过饲养的公鸡来当闹钟，因此公鸡对于古人的生活也产生了很大的影响，堪称动物界的"活闹钟"。正因为这样，人们才会对公鸡格外偏爱，神话传说中的公鸡还有着特殊的含义。',
  ];
  let html = paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
  if (c.hasImage) {
    html += `
      <div class="content-view-img">
        <div class="content-view-img-placeholder"></div>
        <div class="content-view-img-cap">图中清远鸡正在打鸣，利用日出的第一缕阳光放射体内歌唱。</div>
      </div>
      <p>因此，如果把鸡关到东西不透的屋子里，它们的生物钟就会被打乱，这样就可能让它们在中午打鸣。</p>
      <div class="content-view-img">
        <div class="content-view-img-placeholder content-view-img-placeholder--2"></div>
        <div class="content-view-img-cap">每当黎明的曙光普现大地的时候，远方传来公鸡的啼鸣声……</div>
      </div>
      <p>因此，如果把鸡关到东西不透的屋子里，它们的生物钟就会被打乱，这样就可能让它们在中午打鸣。</p>
    `;
  } else if (c.hasVideo) {
    html += `<div class="content-view-video"><div class="video-thumb content-view-video-thumb">▶ 0:00</div></div>`;
  }
  return html;
}

function renderContentViewModal(c) {
  const subtitle = document.getElementById('modal-subtitle');
  const footer = document.getElementById('modal-footer');
  document.getElementById('modal-title').textContent = '查看';
  if (subtitle) {
    subtitle.textContent = '';
    subtitle.style.display = 'none';
  }
  if (footer) {
    footer.innerHTML = '';
    footer.style.display = 'none';
  }
  document.getElementById('modal-body').innerHTML = `
    <div class="content-view-modal">
      <div class="content-view-main">
        <div class="content-view-field">
          <label>标题</label>
          <div class="content-view-value">${esc(c.title)}</div>
        </div>
        <div class="content-view-field">
          <label>内容</label>
          <div class="content-view-body">${renderContentViewBody(c)}</div>
        </div>
        <div class="content-view-field">
          <label>出处</label>
          <div class="content-view-value">${esc(c.source)}</div>
        </div>
      </div>
      <div class="content-view-side">
        <div class="content-view-meta-item">
          <label>类型</label>
          <div>${esc(c.type)}</div>
        </div>
        <div class="content-view-meta-item">
          <label>频道</label>
          <div>${esc(c.channel)}</div>
        </div>
        <div class="content-view-meta-item">
          <label>状态</label>
          <div>${statusTag(c.status)}</div>
        </div>
        <div class="content-view-meta-item">
          <label>阅读量</label>
          <div>${c.views}</div>
        </div>
        <div class="content-view-meta-item">
          <label>点击率</label>
          <div>${c.ctr}</div>
        </div>
        <div class="content-view-meta-item">
          <label>阅读时长</label>
          <div>${c.duration}</div>
        </div>
      </div>
    </div>
  `;
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
