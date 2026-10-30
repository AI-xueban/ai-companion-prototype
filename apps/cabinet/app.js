(() => {
  const DESIGN_W = 1080;
  const DESIGN_H = 1920;
  const PAGE_SIZE = 20;
  const TOAST_MS = 5000;
  const TOAST_SECONDS = 5;

  const ALL_DEVICES = [
    { id: "AQL00P6377400661", slot: "3" },
    { id: "AQL00P6377400662", slot: "5" },
    { id: "AQL00P6377400664", slot: "6" },
    { id: "AQL00P6377400667", slot: "8" },
    { id: "AQL00P6377400671", slot: "9" },
    { id: "AQL00P6377400675", slot: "11" },
    { id: "AQL00P6377400680", slot: "12" },
    { id: "AQL00P6377400688", slot: "15" },
  ];

  const screenFrame = document.getElementById("screenFrame");
  const screenShell = document.getElementById("screenShell");
  const scaleLabel = document.getElementById("scaleLabel");
  const clock = document.getElementById("clock");
  const pageNav = document.getElementById("pageNav");
  const loginForm = document.getElementById("loginForm");
  const loginTip = document.getElementById("loginTip");
  const studentId = document.getElementById("studentId");
  const studentPwd = document.getElementById("studentPwd");
  const numKeypad = document.getElementById("numKeypad");
  const pickupPage = document.querySelector(".page-pickup");
  const faceLogin = document.getElementById("faceLogin");
  const passwordLogin = document.getElementById("passwordLogin");
  const passwordLoginDesc = document.getElementById("passwordLoginDesc");
  const faceEnroll = document.getElementById("faceEnroll");
  const enrollStatus = document.getElementById("enrollStatus");
  const enrollDesc = document.getElementById("enrollDesc");
  const enrollStudentId = document.getElementById("enrollStudentId");
  const enrollNotice = document.getElementById("enrollNotice");
  const faceEnrollStart = document.getElementById("faceEnrollStart");
  const faceEnrollBack = document.getElementById("faceEnrollBack");
  const enrollFailureAction = document.getElementById("enrollFailureAction");
  let enrollmentTimer = null;
  const faceStatus = document.getElementById("faceStatus");
  const faceDesc = document.getElementById("faceDesc");
  let recognitionTimer = null;
  const faceStart = document.getElementById("faceStart");
  const faceToPassword = document.getElementById("faceToPassword");
  const faceRetry = document.getElementById("faceRetry");
  const faceConfirmModal = document.getElementById("faceConfirmModal");
  const recognizedStudentId = document.getElementById("recognizedStudentId");
  const faceConfirmRetry = document.getElementById("faceConfirmRetry");
  const faceConfirmLogin = document.getElementById("faceConfirmLogin");
  const faceBack = document.getElementById("faceBack");
  const deviceTableBody = document.getElementById("deviceTableBody");
  const deviceEmpty = document.getElementById("deviceEmpty");
  const deviceSearchInput = document.getElementById("deviceSearchInput");
  const deviceSearchBtn = document.getElementById("deviceSearchBtn");
  const pagerInfo = document.getElementById("pagerInfo");
  const devicePager = document.getElementById("devicePager");
  const successToast = document.getElementById("successToast");
  const toastClose = document.getElementById("toastClose");
  const toastTitle = document.getElementById("toastTitle");
  const toastDesc = document.querySelector(".toast-desc");
  const toastDeviceId = document.getElementById("toastDeviceId");
  const toastSlot = document.getElementById("toastSlot");
  const toastMetaLabel1 = document.getElementById("toastMetaLabel1");
  const toastMetaLabel2 = document.getElementById("toastMetaLabel2");
  const toastCountdown = document.getElementById("toastCountdown");
  const simulateScanFail = document.getElementById("simulateScanFail");
  const simulateFaceFail = document.getElementById("simulateFaceFail");
  const simulateEnrollFail = document.getElementById("simulateEnrollFail");
  const simulateNotCharging = document.getElementById("simulateNotCharging");
  const simulateDoorOpen = document.getElementById("simulateDoorOpen");
  const simulateBorrowControl = document.getElementById("simulateBorrowControl");
  const borrowControlModal = document.getElementById("borrowControlModal");
  const borrowControlAcknowledge = document.getElementById("borrowControlAcknowledge");
  const scanFailTip = document.getElementById("scanFailTip");
  const returnSlotNum = document.getElementById("returnSlotNum");
  const borrowConfirmModal = document.getElementById("borrowConfirmModal");
  const borrowCancel = document.getElementById("borrowCancel");
  const borrowConfirm = document.getElementById("borrowConfirm");
  const returnConfirmModal = document.getElementById("returnConfirmModal");
  const returnCancel = document.getElementById("returnCancel");
  const returnConfirm = document.getElementById("returnConfirm");
  const returnCheckTip = document.getElementById("returnCheckTip");
  const returnReopenTip = document.getElementById("returnReopenTip");
  const screenEl = document.getElementById("screen");
  const feedbackOpenBtn = document.getElementById("feedbackOpenBtn");
  const feedbackModal = document.getElementById("feedbackModal");
  const feedbackClose = document.getElementById("feedbackClose");
  const feedbackSlotGrid = document.getElementById("feedbackSlotGrid");
  const feedbackIssueList = document.getElementById("feedbackIssueList");
  const feedbackTip = document.getElementById("feedbackTip");
  const feedbackSubmit = document.getElementById("feedbackSubmit");

  const FEEDBACK_SLOT_COUNT = 16;

  let filteredDevices = [...ALL_DEVICES];
  let currentPage = 1;
  let toastTimer = null;
  let toastTick = null;
  let pendingSlot = "7";
  let pendingDeviceId = "AQL00P6377400667";
  let pendingBorrow = null;
  let returnCheckState = "pass";
  let selectedFeedbackSlot = "";
  let selectedFeedbackIssue = "";
  let keypadTarget = null;
  let mustEnrollAfterPassword = false;
  let registrationLocked = false;
  let authenticatedStudentId = "";
  let enrollmentMode = "replace";
  let borrowControlTimer = null;
  const faceProfiles = new Map();
  const faceEnrollmentLogs = [];
  const DEMO_NAV_SELECTOR =
    "#simulateBorrowControl, #simulateBorrowDateControl, #simulateBorrowStudentControl, #simulateScanFail, #simulateFaceFail, #simulateEnrollFail, #simulateNotCharging, #simulateDoorOpen";

  function fitScreen() {
    const stage = document.querySelector(".stage");
    const style = getComputedStyle(stage);
    const padX =
      (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const padY =
      (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const availW = Math.max(stage.clientWidth - padX - 24, 80);
    const availH = Math.max(stage.clientHeight - padY - 24, 80);
    const scale = Math.min(availW / DESIGN_W, availH / DESIGN_H);

    screenShell.style.transform = `scale(${scale})`;
    screenFrame.style.width = `${DESIGN_W * scale}px`;
    screenFrame.style.height = `${DESIGN_H * scale}px`;
    scaleLabel.textContent = `${Math.round(scale * 100)}%`;
  }

  function updateClock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    clock.textContent = `${hh}:${mm}`;
  }


  // Prototype-only administrator session; no SMS or hardware requests are sent.
  const adminPhone = document.getElementById('adminPhone');
  const adminCode = document.getElementById('adminCode');
  const adminTip = document.getElementById('adminLoginTip');
  const adminSend = document.getElementById('adminSendCode');
  let adminSession = false, adminSentPhone = '', adminSentAt = 0, adminCountdown = null;
  function adminMessage(message) { adminTip.hidden = false; adminTip.textContent = message; }
  function resetAdminLogin() {
    adminSession = false; adminPhone.value = ''; adminCode.value = ''; adminSentPhone = ''; adminSentAt = 0;
    clearInterval(adminCountdown); adminSend.disabled = false; adminSend.textContent = '获取验证码'; adminTip.hidden = true;

  }

  adminSend.addEventListener('click', () => {
    if (!/^1[3-9]\d{9}$/.test(adminPhone.value)) return adminMessage('请输入正确的11位手机号');
    adminSentPhone = adminPhone.value; adminSentAt = Date.now();
    adminMessage('原型演示：验证码为 123456，5分钟内有效（未发送真实短信）');
    let remaining = 60; adminSend.disabled = true; adminSend.textContent = remaining+'秒后重发';
    clearInterval(adminCountdown); adminCountdown = setInterval(() => { remaining--; adminSend.textContent = remaining+'秒后重发'; if(remaining<=0) {clearInterval(adminCountdown); adminSend.disabled=false; adminSend.textContent='重新获取';} },1000);
  });
  document.getElementById('adminLoginForm').addEventListener('submit', e => {
    e.preventDefault();
    if (!/^1[3-9]\d{9}$/.test(adminPhone.value)) return adminMessage('请输入正确的11位手机号');
    if (adminSentPhone !== adminPhone.value || !adminSentAt) return adminMessage('请先为当前手机号获取验证码');
    if (adminCode.value !== '123456' || Date.now()-adminSentAt>300000) return adminMessage('验证码错误或已失效，请重新获取');
    adminSession=true; adminSentAt=0;
    document.getElementById('adminAccount').textContent=adminPhone.value.slice(0,3)+'****'+adminPhone.value.slice(-4);
    document.getElementById('adminFeatureNote').textContent=''; showPage('admin-manage');
  });
  document.getElementById('adminLogout').addEventListener('click', () => {resetAdminLogin(); showPage('home');});
  document.querySelector('.admin-menu').addEventListener('click', e => {
    const item=e.target.closest('[data-admin-feature]');
    if(!item || !adminSession) return;
    document.getElementById('adminFeatureNote').textContent=item.dataset.adminFeature+'：登录后进入柜机现有功能页面，沿用原有操作流程。';
  });

  function showPage(name, options = {}) {
    if (registrationLocked) return;
    if (name === "admin-manage" && !adminSession) name = "admin-login";
    if (name === "admin-login" || (name !== "admin-manage" && screenEl.dataset.page === "admin-login") || (adminSession && name !== "admin-manage")) resetAdminLogin();
    clearTimeout(enrollmentTimer);
    enrollFailureAction.hidden = true;
    document.querySelectorAll(".page").forEach((page) => {
      page.classList.toggle("is-visible", page.dataset.page === name);
    });
    pageNav.querySelectorAll(".nav-btn[data-page]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.page === name);
    });
    screenEl.dataset.page = name;

    if (name === "pickup") {
      mustEnrollAfterPassword = false;
      resetFaceLogin();
      hideKeypad();
    } else {
      hideKeypad();
    }

    if (name === "devices") {
      deviceSearchInput.value = "";
      filteredDevices = [...ALL_DEVICES];
      currentPage = 1;
      renderDeviceTable();
    }

    if (name === "store") {
      if (!options.keepScanFail) scanFailTip.hidden = true;
    } else {
      scanFailTip.hidden = true;
    }

    if (!options.keepReturnModal) closeReturnConfirm();

    if (name !== "devices") closeBorrowConfirm();
  }

  function resetFaceLogin() {
    faceLogin.classList.remove("is-processing");
    clearTimeout(recognitionTimer);
    faceStart.hidden = false;
    faceToPassword.hidden = false;
    faceConfirmModal.hidden = true;
    pickupPage.querySelector('[data-goto="home"]').hidden = false;
    faceBack.hidden = false;
    mustEnrollAfterPassword = false;
    authenticatedStudentId = "";
    enrollmentMode = "replace";
    faceLogin.hidden = false;
    passwordLogin.hidden = true;
    faceEnroll.hidden = true;
    faceStatus.textContent = "人脸识别登录";
    faceStatus.className = "face-status is-recognizing";
    faceDesc.textContent = "请本人站到屏幕前，点击开始人脸识别";
    faceRetry.hidden = true;
    loginTip.hidden = true;
    studentId.value = "";
    studentPwd.value = "";
  }

  function showFaceSuccess() {
    faceLogin.classList.remove("is-processing");
    faceLogin.hidden = false;
    passwordLogin.hidden = true;
    faceEnroll.hidden = true;
    faceStatus.textContent = "识别成功";
    faceStatus.className = "face-status is-success";
    faceDesc.textContent = "请确认识别到的编号";
    faceRetry.hidden = true;
    recognizedStudentId.textContent = "2026001";
    faceConfirmModal.hidden = false;
  }

  function showFaceFail(mode = enrollmentMode) {
    faceLogin.classList.remove("is-processing");
    clearTimeout(recognitionTimer);
    faceStart.hidden = true;
    faceToPassword.hidden = false;
    mustEnrollAfterPassword = false;
    enrollmentMode = mode;
    faceLogin.hidden = false;
    passwordLogin.hidden = true;
    faceEnroll.hidden = true;
    faceStatus.textContent = "未找到匹配人脸";
    faceStatus.className = "face-status is-failed";
    faceDesc.textContent = "请重新识别，或使用编号密码登录";
    faceRetry.hidden = false;
  }

  function showPasswordLogin() {
    faceLogin.classList.remove("is-processing");
    clearTimeout(recognitionTimer);
    document.getElementById("passwordToFace").hidden = mustEnrollAfterPassword;
    faceLogin.hidden = true;
    passwordLogin.hidden = false;
    faceEnroll.hidden = true;
    passwordLoginDesc.textContent = mustEnrollAfterPassword
      ? "验证后开始人脸注册；开始录入后不可退出"
      : "请输入编号和密码后查看可用设备";
    loginTip.hidden = true;
    hideKeypad();
  }

  function showFaceEnrollment() {
    faceEnrollBack.hidden = false;
    enrollFailureAction.hidden = true;
    hideKeypad();
    faceLogin.hidden = true;
    passwordLogin.hidden = true;
    faceEnroll.hidden = false;
    enrollStatus.textContent = "录入人脸";
    enrollStatus.className = "face-status";
    enrollDesc.textContent = "";
    enrollStudentId.textContent = authenticatedStudentId || "—";
    enrollNotice.textContent = "请正对屏幕，开始录入后不可退出";
    faceEnrollStart.hidden = false;
    faceEnrollStart.disabled = false;
    faceEnrollStart.textContent = "开始录入";
  }

  function completeFaceEnrollment() {
    const now = new Date();
    const newProfile = {
      updatedAt: now.toISOString(),
      source: enrollmentMode === "first" ? "first-enrollment" : "face-replacement",
      videoRef: `local://A03/${authenticatedStudentId}/${now.getTime()}.mp4`,
    };

    // 注册开始时旧人脸已删除，此处保存新记录（原型模拟）。
    faceProfiles.set(authenticatedStudentId, newProfile);
    faceEnrollmentLogs.push({
      studentId: authenticatedStudentId,
      cabinetId: "A03",
      operatedAt: now.toISOString(),
      videoRef: newProfile.videoRef,
      operation: enrollmentMode === "first" ? "首次录入" : "覆盖原有人脸",
    });

    faceEnrollStart.hidden = true;
    const enrollmentToast = document.getElementById("enrollmentToast");
    enrollmentToast.hidden = false;
    enrollmentTimer = window.setTimeout(() => {
      enrollmentToast.hidden = true;
      registrationLocked = false;
      authenticatedStudentId = "";
      mustEnrollAfterPassword = false;
      showPage("pickup");
    }, 1500);
  }

  function prepareOriginalSlotData() {
    const device = ALL_DEVICES[Math.floor(Math.random() * ALL_DEVICES.length)];
    pendingSlot = device.slot;
    pendingDeviceId = device.id;
    if (returnSlotNum) returnSlotNum.textContent = pendingSlot;
  }

  function hideReturnCheckTip() {
    returnCheckTip.hidden = true;
    returnCheckTip.textContent = "";
    returnReopenTip.hidden = true;
  }

  function showReturnCheckTip(text) {
    returnCheckTip.textContent = text;
    returnCheckTip.hidden = false;
  }

  function openBorrowConfirm() {
    borrowConfirmModal.hidden = false;
  }

  function closeBorrowConfirm() {
    borrowConfirmModal.hidden = true;
  }

  function closeBorrowControl() {
    clearTimeout(borrowControlTimer);
    borrowControlTimer = null;
    borrowControlModal.hidden = true;
  }

  function openBorrowControl(kind = "time") {
    clearTimeout(borrowControlTimer);
    showPage("home");
    const messages = {
      time: '现在还不能借用哦，请在<br /><strong>周一到周五 08:10–12:10、14:00–16:30</strong><br />时间内再来借吧',
      date: '以下日期范围内暂不可借用<br /><strong>2026-10-24 至 2026-10-24</strong><br />请在上述日期范围以外再来借用',
      student: '当前学生编号不可借用<br />如有疑问，请联系管理员'
    };
    borrowControlModal.querySelector('.borrow-control-message').innerHTML = messages[kind];
    borrowControlModal.hidden = false;
    borrowControlTimer = window.setTimeout(closeBorrowControl, 60 * 1000);
  }

  function openReturnConfirm() {
    returnConfirmModal.hidden = false;
  }

  function closeReturnConfirm() {
    returnConfirmModal.hidden = true;
  }

  function openReturnFlow() {
    prepareOriginalSlotData();
    returnCheckState = "pass";
    hideReturnCheckTip();
    scanFailTip.hidden = true;
    showPage("store", { keepReturnModal: true });
    openReturnConfirm();
  }

  function ensureReturnScene() {
    if (screenEl.dataset.page !== "store") {
      prepareOriginalSlotData();
      showPage("store", { keepReturnModal: true });
    }
    if (returnSlotNum) returnSlotNum.textContent = pendingSlot;
    openReturnConfirm();
  }

  function applyReturnCheck() {
    if (returnCheckState === "not_charging") {
      showReturnCheckTip("设备没充电");
      returnReopenTip.hidden = false;
      openReturnConfirm();
      return;
    }
    if (returnCheckState === "door_open") {
      showReturnCheckTip("门没关");
      returnReopenTip.hidden = true;
      openReturnConfirm();
      return;
    }
    triggerReturnSuccess();
  }

  function triggerReturnSuccess() {
    closeReturnConfirm();
    hideReturnCheckTip();
    openSuccessToast({
      title: "设备归还成功",
      desc: "谢谢你，平板回家啦",
      deviceLabel: pendingDeviceId,
      slotLabel: pendingSlot,
    });
  }

  function cancelReturn() {
    closeReturnConfirm();
    hideReturnCheckTip();
    openSuccessToast({
      title: "已取消归还",
      desc: "柜门已再次打开，设备仍为借出中",
      deviceLabel: pendingDeviceId,
      slotLabel: pendingSlot,
    });
  }

  function totalPages() {
    return Math.max(1, Math.ceil(filteredDevices.length / PAGE_SIZE));
  }

  function renderDeviceTable() {
    const pages = totalPages();
    currentPage = Math.min(Math.max(1, currentPage), pages);
    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = filteredDevices.slice(start, start + PAGE_SIZE);

    deviceTableBody.innerHTML = rows
      .map((device, i) => {
        const index = start + i + 1;
        return `
          <tr>
            <td class="col-index">${index}</td>
            <td class="col-id">${device.id}</td>
            <td class="col-slot">${device.slot}</td>
            <td class="col-action">
              <button
                type="button"
                class="take-btn"
                data-take-id="${device.id}"
                data-take-slot="${device.slot}"
              >取用</button>
            </td>
          </tr>
        `;
      })
      .join("");

    deviceEmpty.hidden = rows.length > 0;
    pagerInfo.textContent = `${currentPage}/${pages}页`;

    devicePager.querySelectorAll("button").forEach((btn) => {
      const action = btn.dataset.pageAction;
      if (action === "prev") btn.disabled = currentPage <= 1;
      if (action === "next") btn.disabled = currentPage >= pages;
    });
  }

  function searchDevices() {
    const keyword = deviceSearchInput.value.trim().toLowerCase();
    filteredDevices = keyword
      ? ALL_DEVICES.filter((d) => d.id.toLowerCase().includes(keyword))
      : [...ALL_DEVICES];
    currentPage = 1;
    renderDeviceTable();
  }

  function clearToastTimers() {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    if (toastTick) {
      clearInterval(toastTick);
      toastTick = null;
    }
  }

  function openSuccessToast({ title, desc, deviceLabel, slotLabel, issueLabel }) {
    toastTitle.textContent = title;
    toastDesc.textContent = desc;

    if (issueLabel) {
      toastMetaLabel1.textContent = "格口";
      toastMetaLabel2.textContent = "问题";
      toastDeviceId.textContent = `第 ${slotLabel} 格`;
      toastSlot.textContent = issueLabel;
    } else {
      toastMetaLabel1.textContent = "平板编号";
      toastMetaLabel2.textContent = "第几格";
      toastDeviceId.textContent = deviceLabel;
      toastSlot.textContent = slotLabel;
    }

    successToast.hidden = false;

    clearToastTimers();
    let left = TOAST_SECONDS;
    toastCountdown.textContent = `${left}s`;
    toastTick = setInterval(() => {
      left -= 1;
      if (left <= 0) {
        toastCountdown.textContent = "0s";
        return;
      }
      toastCountdown.textContent = `${left}s`;
    }, 1000);
    toastTimer = setTimeout(() => closeSuccessToast(), TOAST_MS);
  }

  function closeSuccessToast() {
    clearToastTimers();
    successToast.hidden = true;
    showPage("home");
  }

  function confirmBorrow(deviceId, slot) {
    pendingBorrow = null;
    closeBorrowConfirm();
    openSuccessToast({
      title: "取出来啦",
      desc: "柜门开了，把平板拿走吧",
      deviceLabel: deviceId,
      slotLabel: slot,
    });
  }

  function initBanner() {
    const slides = Array.from(document.querySelectorAll(".banner-slide"));
    const dots = Array.from(document.querySelectorAll(".banner-dot"));
    const banner = document.getElementById("homeBanner");
    if (!slides.length || !banner) return;

    let index = 0;
    let timer = null;

    function goTo(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    }

    function start() {
      stop();
      timer = setInterval(() => goTo(index + 1), 4000);
    }

    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    dots.forEach((dot) => {
      dot.addEventListener("click", () => {
        goTo(Number(dot.dataset.index));
        start();
      });
    });

    banner.addEventListener("mouseenter", stop);
    banner.addEventListener("mouseleave", start);
    start();
  }

  function updateFeedbackSubmitState() {
    const ready = Boolean(selectedFeedbackSlot && selectedFeedbackIssue);
    feedbackSubmit.disabled = !ready;
    feedbackTip.hidden = ready;
  }

  function resetFeedbackForm() {
    selectedFeedbackSlot = "";
    selectedFeedbackIssue = "";
    feedbackSlotGrid.querySelectorAll(".slot-option").forEach((btn) => {
      btn.classList.remove("is-selected");
    });
    feedbackIssueList.querySelectorAll(".issue-option").forEach((btn) => {
      btn.classList.remove("is-selected");
    });
    updateFeedbackSubmitState();
  }

  function openFeedbackModal() {
    resetFeedbackForm();
    feedbackModal.hidden = false;
  }

  function closeFeedbackModal() {
    feedbackModal.hidden = true;
    resetFeedbackForm();
  }

  function initFeedback() {
    if (!feedbackSlotGrid || !feedbackOpenBtn) return;

    feedbackSlotGrid.innerHTML = "";
    for (let i = 1; i <= FEEDBACK_SLOT_COUNT; i += 1) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot-option";
      btn.dataset.slot = String(i);
      btn.textContent = String(i);
      feedbackSlotGrid.appendChild(btn);
    }

    feedbackOpenBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openFeedbackModal();
    });

    feedbackClose.addEventListener("click", closeFeedbackModal);
    feedbackModal.addEventListener("click", (e) => {
      if (e.target === feedbackModal) closeFeedbackModal();
    });

    feedbackSlotGrid.addEventListener("click", (e) => {
      const btn = e.target.closest(".slot-option");
      if (!btn) return;
      selectedFeedbackSlot = btn.dataset.slot;
      feedbackSlotGrid.querySelectorAll(".slot-option").forEach((item) => {
        item.classList.toggle("is-selected", item === btn);
      });
      updateFeedbackSubmitState();
    });

    feedbackIssueList.addEventListener("click", (e) => {
      const btn = e.target.closest(".issue-option");
      if (!btn) return;
      selectedFeedbackIssue = btn.dataset.issue;
      feedbackIssueList.querySelectorAll(".issue-option").forEach((item) => {
        item.classList.toggle("is-selected", item === btn);
      });
      updateFeedbackSubmitState();
    });

    feedbackSubmit.addEventListener("click", () => {
      if (!selectedFeedbackSlot || !selectedFeedbackIssue) {
        feedbackTip.hidden = false;
        return;
      }
      const slot = selectedFeedbackSlot;
      const issue = selectedFeedbackIssue;
      closeFeedbackModal();
      openSuccessToast({
        title: "反馈已提交",
        desc: "感谢您的反馈，工作人员会尽快处理！",
        slotLabel: slot,
        issueLabel: issue,
      });
    });
  }

  function showKeypad(input) {
    keypadTarget = input;
    studentId.classList.toggle("is-keypad-focus", input === studentId);
    studentPwd.classList.toggle("is-keypad-focus", input === studentPwd);
    numKeypad.hidden = false;
    pickupPage.classList.add("has-keypad");
  }

  function hideKeypad() {
    keypadTarget = null;
    studentId.classList.remove("is-keypad-focus");
    studentPwd.classList.remove("is-keypad-focus");
    numKeypad.hidden = true;
    pickupPage.classList.remove("has-keypad");
  }

  function appendKey(digit) {
    if (!keypadTarget) return;
    if (keypadTarget.value.length >= 20) return;
    keypadTarget.value += digit;
  }

  [studentId, studentPwd].forEach((input) => {
    input.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      showKeypad(input);
    });
  });

  numKeypad.addEventListener("click", (e) => {
    const keyBtn = e.target.closest("[data-key]");
    if (!keyBtn) return;
    const key = keyBtn.dataset.key;
    if (key === "backspace") {
      if (keypadTarget) keypadTarget.value = keypadTarget.value.slice(0, -1);
      return;
    }
    if (key === "done") {
      hideKeypad();
      return;
    }
    appendKey(key);
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = studentId.value.trim();
    const pwd = studentPwd.value.trim();
    if (!id || !pwd) {
      loginTip.hidden = false;
      loginTip.textContent = "请填写编号和密码";
      return;
    }
    loginTip.hidden = true;
    if (mustEnrollAfterPassword) {
      authenticatedStudentId = id;
      faceProfiles.delete(id);
      registrationLocked = true;
      pickupPage.querySelector('[data-goto="home"]').hidden = true;
      showFaceEnrollment();
      return;
    }
    showPage("devices");
  });

  function openRegistration() {
    if (registrationLocked) return;
    showPage("pickup");
    mustEnrollAfterPassword = true;
    showPasswordLogin();
    faceBack.hidden = true;
  }
  document.getElementById("faceRegister").addEventListener("click", openRegistration);
  document.getElementById("toggleFaceRegister").addEventListener("click", (event) => {
    const entry = document.getElementById("faceRegister");
    entry.hidden = !entry.hidden;
    event.currentTarget.setAttribute("aria-pressed", String(!entry.hidden));
    event.currentTarget.textContent = entry.hidden ? "显示人脸注册入口" : "隐藏人脸注册入口";
  });
  document.getElementById("backToLoginChoice").addEventListener("click", () => showPage("home"));
  faceBack.addEventListener("click", () => showPage("home"));
  document.getElementById("passwordToFace").addEventListener("click", () => {
    hideKeypad();
    resetFaceLogin();
  });
  function startRecognition() {
    faceLogin.classList.add("is-processing");
    clearTimeout(recognitionTimer);
    faceStart.hidden = true;
    faceToPassword.hidden = true;
    faceRetry.hidden = true;
    faceStatus.textContent = "正在识别";
    faceDesc.textContent = "请将面部置于正方形框内，并确保框内只有本人";
    recognitionTimer = window.setTimeout(showFaceSuccess, 1000);
  }
  faceStart.addEventListener("click", startRecognition);
  faceToPassword.addEventListener("click", showPasswordLogin);
  faceRetry.addEventListener("click", startRecognition);
  faceConfirmRetry.addEventListener("click", () => {
    faceConfirmModal.hidden = true;
    authenticatedStudentId = "";
    resetFaceLogin();
  });
  faceConfirmLogin.addEventListener("click", () => {
    authenticatedStudentId = recognizedStudentId.textContent;
    faceConfirmModal.hidden = true;
    showPage("devices");
  });
  faceEnrollBack.addEventListener("click", () => {
    clearTimeout(enrollmentTimer);
    registrationLocked = false;
    showPasswordLogin();
  });

  faceEnrollStart.addEventListener("click", () => {
    faceEnrollBack.hidden = true;
    enrollFailureAction.hidden = true;
    faceEnrollStart.disabled = true;
    faceEnrollStart.textContent = "正在录入…";
    enrollStatus.textContent = "请缓慢左右转头";
    enrollDesc.textContent = "保持面部在识别框内";
    enrollmentTimer = window.setTimeout(completeFaceEnrollment, 1200);
  });

  enrollFailureAction.addEventListener("click", () => {
    showPage(enrollmentMode === "first" ? "home" : "devices");
    authenticatedStudentId = "";
  });

  deviceSearchBtn.addEventListener("click", searchDevices);
  deviceSearchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchDevices();
    }
  });

  devicePager.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page-action]");
    if (!btn || btn.disabled) return;
    const action = btn.dataset.pageAction;
    if (action === "prev") currentPage -= 1;
    if (action === "next") currentPage += 1;
    renderDeviceTable();
  });

  deviceTableBody.addEventListener("click", (e) => {
    const takeBtn = e.target.closest("[data-take-id]");
    if (!takeBtn) return;
    pendingBorrow = {
      id: takeBtn.dataset.takeId,
      slot: takeBtn.dataset.takeSlot,
    };
    openBorrowConfirm();
  });

  borrowCancel.addEventListener("click", () => {
    pendingBorrow = null;
    closeBorrowConfirm();
  });

  borrowConfirm.addEventListener("click", () => {
    if (!pendingBorrow) {
      closeBorrowConfirm();
      return;
    }
    confirmBorrow(pendingBorrow.id, pendingBorrow.slot);
  });

  borrowConfirmModal.addEventListener("click", (e) => {
    if (e.target === borrowConfirmModal) {
      pendingBorrow = null;
      closeBorrowConfirm();
    }
  });

  returnCancel.addEventListener("click", cancelReturn);
  returnConfirm.addEventListener("click", applyReturnCheck);
  returnConfirmModal.addEventListener("click", (e) => {
    if (e.target === returnConfirmModal) return;
  });

  toastClose.addEventListener("click", closeSuccessToast);
  successToast.addEventListener("click", (e) => {
    if (e.target === successToast) closeSuccessToast();
  });

  simulateBorrowControl.addEventListener("click", (e) => {
    e.stopPropagation();
    openBorrowControl();
  });

  document.getElementById("simulateBorrowDateControl").addEventListener("click", (e) => {
    e.stopPropagation();
    openBorrowControl("date");
  });
  document.getElementById("simulateBorrowStudentControl").addEventListener("click", (e) => {
    e.stopPropagation();
    openBorrowControl("student");
  });

  borrowControlAcknowledge.addEventListener("click", closeBorrowControl);

  document.querySelector(".scan-guide-card").addEventListener("click", (e) => {
    e.stopPropagation();
    openReturnFlow();
  });

  simulateScanFail.addEventListener("click", (e) => {
    e.stopPropagation();
    showPage("store", { keepScanFail: true });
    scanFailTip.hidden = false;
  });

  simulateFaceFail.addEventListener("click", (e) => {
    if (registrationLocked) return;
    e.stopPropagation();
    showPage("pickup");
    showFaceFail("replace");
  });

  simulateEnrollFail.addEventListener("click", (e) => {
    e.stopPropagation();
    previewEnrollmentFailure("replace");
  });

  function previewEnrollmentFailure(mode) {
    clearTimeout(enrollmentTimer);
    document.getElementById("enrollmentToast").hidden = true;
    const verifiedId = authenticatedStudentId || "2026001";
    registrationLocked = false;
    showPage("pickup");
    mustEnrollAfterPassword = true;
    enrollmentMode = mode;
    authenticatedStudentId = verifiedId;
    registrationLocked = true;
    showFaceEnrollment();
    faceEnrollStart.textContent = "重新录入";
    enrollStatus.textContent = "录入人脸";
    enrollDesc.textContent = "";
    document.getElementById("enrollmentFailureModal").hidden = false;
  }

  document.getElementById("enrollmentFailureRetry").addEventListener("click", () => {
    document.getElementById("enrollmentFailureModal").hidden = true;
    showFaceEnrollment();
    faceEnrollStart.click();
  });
  document.getElementById("enrollmentFailureHome").addEventListener("click", () => {
    document.getElementById("enrollmentFailureModal").hidden = true;
    clearTimeout(enrollmentTimer);
    registrationLocked = false;
    authenticatedStudentId = "";
    mustEnrollAfterPassword = false;
    showPage("home");
  });
  simulateNotCharging.addEventListener("click", (e) => {
    e.stopPropagation();
    ensureReturnScene();
    returnCheckState = "not_charging";
    applyReturnCheck();
  });

  simulateDoorOpen.addEventListener("click", (e) => {
    e.stopPropagation();
    ensureReturnScene();
    returnCheckState = "door_open";
    applyReturnCheck();
  });

  document.body.addEventListener("click", (e) => {
    if (e.target.closest(DEMO_NAV_SELECTOR)) return;

    const goto = e.target.closest("[data-goto]");
    if (goto) {
      showPage(goto.dataset.goto);
      return;
    }

    const nav = e.target.closest(".nav-btn[data-page]");
    if (nav) {
      showPage(nav.dataset.page);
    }
  });

  window.addEventListener("resize", fitScreen);
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(fitScreen).observe(document.querySelector(".stage"));
  }
  fitScreen();
  updateClock();
  setInterval(updateClock, 1000 * 15);
  initBanner();
  initFeedback();

  // Prototype only. Production installation is owned by the third-party system installer.
  const upgradeKey = 'cabinet-manual-upgrade-v1';
  const installedVersionKey = 'cabinet-actual-installed-version-v1';
  const cachedApkKey = 'cabinet-cached-upgrade-apk-v1';
  let upgrade = { installed: '1.3.0', pending: null, downloaded: false, downloadedApk: null, installingPackage: null };
  try { const saved = JSON.parse(localStorage.getItem(upgradeKey)); if (saved?.installed) upgrade = saved; } catch {}
  let downloadTimer = null, downloadProgress = 0, networkOffline = false, installing = false, messageTimer;
  let upgradeDialogStage = '';
  const upgradePanel = document.createElement('div');
  upgradePanel.className = 'upgrade-system-mask'; upgradePanel.hidden = true;
  upgradePanel.innerHTML = '<div class="upgrade-system-card" role="dialog" aria-modal="true" aria-labelledby="upgradeInstallTitle"><small id="upgradeDialogType"></small><h3 id="upgradeInstallTitle"></h3><p id="upgradeInstallStatus"></p><div><button id="upgradeInstallCancel">取消</button><button id="upgradeInstallConfirm">安装</button></div></div>';
  screenEl.appendChild(upgradePanel);
  const upgradeToast = document.createElement('div');
  upgradeToast.className = 'upgrade-toast'; upgradeToast.hidden = true; upgradeToast.setAttribute('role','status'); screenEl.appendChild(upgradeToast);
  function upgradeMessage(text) {
    clearTimeout(messageTimer); upgradeToast.textContent = text; upgradeToast.hidden = false;
    messageTimer = setTimeout(() => upgradeToast.hidden = true, 3000);
  }
  function nextDemoVersion(version) {
    const parts = String(version).split('.').map(Number);
    while (parts.length < 3) parts.push(0);
    parts[2] += 1;
    return parts.join('.');
  }
  function isNewerDemoVersion(candidate, current) {
    const newer = String(candidate).split('.').map(Number);
    const older = String(current).split('.').map(Number);
    if ([...newer, ...older].some(part => !Number.isInteger(part))) return false;
    for (let index = 0; index < Math.max(newer.length, older.length); index++) {
      if ((newer[index] || 0) !== (older[index] || 0)) return (newer[index] || 0) > (older[index] || 0);
    }
    return false;
  }
  function reconcileUpgradeState() {
    // On restart, the installed version and the locally cached file take precedence over the UI snapshot.
    upgrade.installed = localStorage.getItem(installedVersionKey) || upgrade.installed;
    upgrade.installingPackage = null;
    if (upgrade.pending && !isNewerDemoVersion(upgrade.pending.version, upgrade.installed)) upgrade.pending = null;
    if (!upgrade.pending || localStorage.getItem(cachedApkKey) !== upgrade.pending.name) {
      upgrade.downloaded = false;
      upgrade.downloadedApk = null;
      localStorage.removeItem(cachedApkKey);
    }
  }
  reconcileUpgradeState();
  function receiveLatestUpgrade(nextPackage) {
    if (!isNewerDemoVersion(nextPackage.version, upgrade.installed) ||
        (upgrade.pending && !isNewerDemoVersion(nextPackage.version, upgrade.pending.version))) return false;
    if (downloadTimer) { clearInterval(downloadTimer); downloadTimer = null; }
    downloadProgress = 0;
    if (!installing) { upgradePanel.hidden = true; upgradeDialogStage = ''; }
    // The prototype stores no APK bytes. Clearing this reference represents deleting the old cached APK.
    upgrade.downloaded = false;
    upgrade.downloadedApk = null;
    if (!installing) localStorage.removeItem(cachedApkKey);
    upgrade.pending = nextPackage;
    renderUpgrade();
    return true;
  }
  function renderUpgrade() {
    document.getElementById('cabinetVersion').textContent = 'V' + upgrade.installed;
    document.getElementById('cabinetUpdateBadge').hidden = !upgrade.pending;
    document.getElementById('adminUpdateDot').hidden = !upgrade.pending;
    document.getElementById('adminUpdateLabel').textContent = '版本更新';
    document.getElementById('adminUpdateVersion').textContent = upgrade.pending
      ? '可升级版本 V' + upgrade.pending.version
      : '当前版本 V' + upgrade.installed;
    document.getElementById('adminVersionUpdate').disabled = !!downloadTimer || installing;
    const progress = document.getElementById('adminDownloadProgress');
    progress.hidden = !downloadTimer;
    document.getElementById('adminDownloadName').textContent = upgrade.pending ? '正在下载 ' + upgrade.pending.name : '';
    document.getElementById('adminDownloadPercent').textContent = downloadProgress + '%';
    document.getElementById('adminDownloadBar').value = downloadProgress;
    localStorage.setItem(upgradeKey, JSON.stringify(upgrade));
  }
  document.getElementById('cabinetVersionEntry').addEventListener('click', () => upgradeMessage('请登录管理员账号进行版本更新'));
  function showUpgradeDialog(stage) {
    if (!adminSession || !upgrade.pending) return;
    upgradeDialogStage = stage;
    document.getElementById('upgradeDialogType').textContent = stage === 'download' ? '版本下载确认' : '系统安装确认';
    document.getElementById('upgradeInstallTitle').textContent = stage === 'download' ? '是否下载（'+upgrade.pending.name+'）？' : '是否安装（'+upgrade.pending.name+'）？';
    document.getElementById('upgradeInstallStatus').textContent = '';
    document.getElementById('upgradeInstallCancel').disabled = false;
    document.getElementById('upgradeInstallCancel').hidden = false;
    document.getElementById('upgradeInstallConfirm').disabled = false;
    document.getElementById('upgradeInstallConfirm').textContent = stage === 'download' ? '下载' : '安装';
    upgradePanel.hidden = false;
  }
  function showInstall() { showUpgradeDialog('install'); }
  function showDownload() { showUpgradeDialog('download'); }
  function showInstallComplete(version) {
    upgradeDialogStage = 'complete';
    document.getElementById('upgradeDialogType').textContent = '版本更新';
    document.getElementById('upgradeInstallTitle').textContent = '安装完成';
    document.getElementById('upgradeInstallStatus').textContent = '当前版本 V' + version;
    document.getElementById('upgradeInstallCancel').hidden = true;
    document.getElementById('upgradeInstallConfirm').disabled = false;
    document.getElementById('upgradeInstallConfirm').textContent = '知道了';
    upgradePanel.hidden = false;
  }
  function interruptDownload() {
    if (!downloadTimer) return;
    clearInterval(downloadTimer); downloadTimer = null; downloadProgress = 0; upgrade.downloaded = false; upgrade.downloadedApk = null;
    localStorage.removeItem(cachedApkKey);
    renderUpgrade(); upgradeMessage('下载中断，请联网后重新下载');
    document.getElementById('adminFeatureNote').textContent = '下载中断，请联网后点击版本更新重新下载。';
  }
  document.getElementById('adminVersionUpdate').addEventListener('click', () => {
    if (!adminSession || installing || downloadTimer) return;
    if (!upgrade.pending) return upgradeMessage('当前已是最新版本');
    if (upgrade.downloaded) return showInstall();
    if (networkOffline || !navigator.onLine) return upgradeMessage('网络未连接，请联网后重新下载');
    showDownload();
  });
  function startUpgradeDownload() {
    if (!adminSession || !upgrade.pending || downloadTimer) return;
    if (networkOffline || !navigator.onLine) return upgradeMessage('网络未连接，请联网后重新下载');
    downloadProgress = 0;
    document.getElementById('adminFeatureNote').textContent = '正在下载 '+upgrade.pending.name;
    downloadTimer = setInterval(() => {
      if (!adminSession || networkOffline || !navigator.onLine) return interruptDownload();
      downloadProgress += 10;
      if (downloadProgress >= 100) {
        clearInterval(downloadTimer); downloadProgress = 100;
        downloadTimer = setTimeout(() => {
          if (!adminSession || networkOffline || !navigator.onLine) return interruptDownload();
          downloadTimer = null; upgrade.downloaded = true; upgrade.downloadedApk = upgrade.pending.name;
          localStorage.setItem(cachedApkKey, upgrade.pending.name);
          document.getElementById('adminFeatureNote').textContent = '下载完成，等待安装。';
          renderUpgrade(); showInstall();
        }, 500);
        renderUpgrade();
      } else renderUpgrade();
    }, 600);
    renderUpgrade();
  }
  document.getElementById('upgradeInstallCancel').addEventListener('click', () => {
    upgradePanel.hidden = true;
    if (upgradeDialogStage === 'install') upgradeMessage('已取消安装，可点击版本更新继续安装');
  });
  document.getElementById('upgradeInstallConfirm').addEventListener('click', () => {
    if (upgradeDialogStage === 'complete') { upgradePanel.hidden = true; return; }
    if (upgradeDialogStage === 'download') { upgradePanel.hidden = true; startUpgradeDownload(); return; }
    if (!adminSession || !upgrade.pending || installing) return;
    const installingPackage = { ...upgrade.pending };
    installing = true;
    upgrade.installingPackage = installingPackage;
    document.getElementById('upgradeInstallCancel').disabled = true;
    document.getElementById('upgradeInstallConfirm').disabled = true;
    document.getElementById('upgradeInstallStatus').textContent = '正在安装…';
    renderUpgrade();
    setTimeout(() => {
      // The system installation finishes first; then read the actual version and evaluate any newer target.
      localStorage.setItem(installedVersionKey, installingPackage.version);
      upgrade.installed = localStorage.getItem(installedVersionKey);
      if (upgrade.pending?.version === installingPackage.version) upgrade.pending = null;
      upgrade.downloaded = false; upgrade.downloadedApk = null; upgrade.installingPackage = null; installing = false;
      localStorage.removeItem(cachedApkKey);
      upgradePanel.hidden = true; renderUpgrade();
      document.getElementById('adminFeatureNote').textContent = upgrade.pending
        ? '当前版本 V' + upgrade.installed + '；最新版本 V' + upgrade.pending.version + ' 待下载。'
        : '当前版本 V' + upgrade.installed;
      showInstallComplete(upgrade.installed);
    }, 1800);
  });
  window.addEventListener('offline', interruptDownload);
  document.getElementById('upgradeNetwork').addEventListener('click', e => {
    networkOffline = !networkOffline; e.target.textContent = networkOffline ? '模拟恢复联网' : '模拟下载断网';
    if (networkOffline) interruptDownload();
    else upgradeMessage('网络已恢复，请重新下载');
  });
  document.getElementById('simulateCabinetUpgrade').addEventListener('click', () => {
    if (registrationLocked || downloadTimer || installing) return;
    if (!upgrade.pending) {
      const version = nextDemoVersion(upgrade.installed);
      receiveLatestUpgrade({ version, name: 'cabinet-'+version+'.apk' });
    }
    upgradeMessage('收到新版本，请管理员下载安装');
  });
  document.getElementById('simulateNewerCabinetUpgrade').addEventListener('click', () => {
    if (registrationLocked) return;
    if (installing) {
      const version = nextDemoVersion(upgrade.pending.version);
      if (!receiveLatestUpgrade({ version, name: 'cabinet-'+version+'.apk' })) return;
      upgradeMessage('旧版继续安装；完成后可下载最新版本 V' + version);
      return;
    }
    const oldPackage = upgrade.pending || (() => {
      const version = nextDemoVersion(upgrade.installed);
      return { version, name: 'cabinet-'+version+'.apk' };
    })();
    // Stage an already-downloaded old package, then dispatch a higher version in one demo action.
    upgrade.pending = oldPackage;
    upgrade.downloaded = true;
    upgrade.downloadedApk = oldPackage.name;
    const version = nextDemoVersion(oldPackage.version);
    if (!receiveLatestUpgrade({ version, name: 'cabinet-'+version+'.apk' })) return;
    document.getElementById('adminFeatureNote').textContent = '旧版APK已清除；请下载最新版本 V' + version;
    upgradeMessage('旧版APK已清除，最新版本 V' + version + ' 需重新下载');
  });
  renderUpgrade();
})();
