/* Review scenarios for control pages. */
window.controlPageDemo = (() => {
  const groups = {
    '操作期间权限变化': [
      ['lockStarted', '操作时管理员开启临时锁屏', '锁屏页弹出通知，点弹窗外或“知道了”后禁止操作。'],
      ['borrowTemporaryStarted', '操作时学校开启临时禁借', '进入班主任借用页查看通知；点“知道了”后学生借用设置变为只读。'],
      ['borrowTimesChanged', '查看时学校修改借用时间', '进入班主任借用页查看更新通知；可暂不查看，或点“立即查看”查看新时间。']
    ],
    '保存与数据变化': [
      ['changed', '其他老师已修改', '进入编辑页，点“保存”查看规则已被修改的提示。'],
      ['removed', '操作对象已变化', '进入编辑页，点“保存”查看所选学生信息变化的提示。']
    ]
  };
  const choices = Object.entries(groups).flatMap(([group, rows]) => rows.map(([id, label, hint]) => ({id, label, hint, group})));
  let active = '', savedNodes = null, emptyClassName = '';
  const screens = {
    lockStarted: ['锁屏', '临时锁屏管控中', '学校管理员已开启临时锁屏，老师暂不可修改锁屏。'],
    borrowTemporaryStarted: ['柜机借用管控', '学校已开启临时禁借', '现在不能修改本班借用状态。'],
    borrowTimesChanged: ['柜机借用管控', '借用时间已更新', '是否立即查看学校最新借用时间？'],
    changed: ['保存设置', '其他老师已修改设置', '本次修改未保存，请刷新后重新操作。'],
    removed: ['保存设置', '所选学生信息有变化', '本次修改未保存，请刷新后重新选择学生。'],
  };
  function render(feedback = '') {
    if (['adminNoGrades', 'adminNoClasses'].includes(active) && window.parity?.renderEmptyAdminDemo) {
      window.parity.renderEmptyAdminDemo(active);
      app.querySelector('.screen')?.setAttribute('data-control-demo', active);
      return;
    }
    if (active === 'borrowTemporaryStarted' || active === 'borrowTimesChanged') {
      window.borrowing?.demoStart(active === 'borrowTemporaryStarted' ? 'temporary' : 'times');
      app.querySelector('.screen')?.setAttribute('data-control-demo', active);
      return;
    }
    if (active === 'noStudents' && window.parity?.showEmptyClassDemo) {
      window.parity.showEmptyClassDemo(); return;
    }
    const [title, message, description] = screens[active];
    const contextual = ['lockStarted', 'saveFailed', 'changed', 'removed', 'classRevoked', 'accountRemoved'].includes(active);
    if (contextual && window.parity?.renderDemoPage) {
      window.parity.renderDemoPage(active);
      app.querySelector('.screen')?.setAttribute('data-control-demo', active);
      if (active === 'lockStarted') {
        document.getElementById('control-overlay').innerHTML = `<div class="logout-confirm-shade" onclick="if(event.target===this)controlPageDemo.dismiss()"><section class="logout-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="control-demo-lock-title"><h2 id="control-demo-lock-title">学校管理员已开启临时锁屏</h2><p>暂时不能修改锁屏状态。</p><button class="teacher-primary" onclick="controlPageDemo.dismiss()">知道了</button></section></div>`;
        return;
      }
      if (['classRevoked', 'accountRemoved'].includes(active)) {
        document.getElementById('control-overlay').innerHTML = `<div class="logout-confirm-shade"><section class="logout-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="control-demo-dialog-title"><h2 id="control-demo-dialog-title">${message}</h2><p>${description}</p><button class="teacher-primary" onclick="controlPageDemo.dismiss()">知道了</button></section></div>`;
      }
      return;
    }
    // Match the teacher workbench's existing availability/empty-page layout.
    const mark = active === 'noClasses' ? '班' : active === 'noStudents' ? '生' : '!';
    app.innerHTML = `<main class="screen teacher-screen" data-control-demo="${active}">${header(title, false)}<section class="teacher-main" id="teacher-tab-panel" role="tabpanel"><div class="teacher-hero"><div class="teacher-mark" aria-hidden="true">${mark}</div><h1>${message}</h1><p>${description}</p></div><div class="teacher-actions"><button class="teacher-primary" onclick="controlPageDemo.retry()">${active === 'loadFailed' || active === 'saveFailed' ? '重试' : '刷新'}</button><p class="teacher-security-copy" role="status" aria-live="polite">${feedback}</p></div></section>${active === 'accountRemoved' ? '' : teacherTabBar()}</main>`;
  }
  // These pages use a copied model. Never let their controls submit real changes.
  if (typeof document !== 'undefined') document.addEventListener('click', event => {
    if (!active || !app.contains(event.target) || active === 'noStudents') return;
    const button = event.target.closest('button');
    if (!button) return;
    if (button.closest('.teacher-tabbar')) { window.controlPageDemo.restore(); return; }
    if ((button.getAttribute('onclick') || '').includes('controlPageDemo.')) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (['saveFailed', 'changed', 'removed'].includes(active)) {
      const action = button.getAttribute('onclick') || '';
      if (/\bparity\.saveEditor\s*\(/.test(action)) window.controlPageDemo.retry();
      else if (/\bparity\.(cancelEditor|back)\s*\(/.test(action)) window.pageDemoTools.restore();
    }
  }, true);
  return {
    context() {
      if (typeof stage === 'undefined' || stage !== 'teacherDesk' || typeof teacherTab === 'undefined' || teacherTab !== 'control') return null;
      return {key: 'control', title: '管控', choices, active, label: choices.find(item => item.id === active)?.label || ''};
    },
    select(id) {
      if (!choices.some(item=>item.id===id)) return;
      if (['borrowTemporaryStarted','borrowTimesChanged'].includes(active)) window.borrowing?.demoRestore();
      if (!savedNodes) savedNodes = Array.from(app.childNodes);
      emptyClassName = id === 'noStudents' && typeof selectedTeacherClass !== 'undefined' ? selectedTeacherClass : '';
      active = id; render();
    },
    emptyClass() { return active === 'noStudents' ? emptyClassName : ''; },
    dismiss() {
      if (active === 'borrowTemporaryStarted' || active === 'borrowTimesChanged') {
        window.borrowing?.demoAcknowledge();
        window.pageDemoTools?.sync();
        return;
      }
      if (active === 'lockStarted') {
        try {
          window.parity.acknowledgeTemporaryLock();
          active = ''; savedNodes = null;
          window.pageDemoTools?.sync();
        } catch { controlToast('锁屏状态更新失败，请重试'); }
        return;
      }
      if (active === 'classRevoked') {
        active = 'noClasses';
        render();
        window.pageDemoTools?.sync();
        return;
      }
      const overlay = document.getElementById('control-overlay'); if(overlay) overlay.innerHTML = '';
    },
    defer() {
      if (active !== 'borrowTimesChanged') return;
      window.borrowing?.demoDefer();
      window.pageDemoTools?.sync();
    },
    retry() { if(active) {
      if (window.parity?.renderDemoPage && ['saveFailed', 'changed', 'removed'].includes(active)) {
        if (active !== 'saveFailed') window.parity.renderDemoPage(active, true);
        controlToast({saveFailed: '保存失败，请重试', changed: '规则已更新，请刷新后重试', removed: '所选学生信息有变化，请刷新后重新选择'}[active]);
      } else render('当前异常仍未解除，请稍后重试。');
      window.pageDemoTools?.sync();
    } },
    isActive() { return Boolean(active); },
    restore() {
      if (active === 'borrowTemporaryStarted' || active === 'borrowTimesChanged') window.borrowing?.demoRestore();
      if (active === 'noStudents' && window.parity?.showEmptyClassDemo) {
        active = ''; emptyClassName = ''; savedNodes = null;
        window.parity.showEmptyClassDemo(); return;
      }
      active = '';
      if (savedNodes) { app.replaceChildren(...savedNodes); savedNodes = null; }
    }
  };
})();
