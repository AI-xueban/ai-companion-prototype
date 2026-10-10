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
  const enrollFailureAction = document.getElementById("enrollFailureAction");
  let enrollmentTimer = null;
  const faceStatus = document.getElementById("faceStatus");
  const faceDesc = document.getElementById("faceDesc");
  const faceRetry = document.getElementById("faceRetry");
  const loginChoice = document.getElementById("loginChoice");
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
  const simulateScan = document.getElementById("simulateScan");
  const simulateScanFail = document.getElementById("simulateScanFail");
  const simulateFaceSuccess = document.getElementById("simulateFaceSuccess");
  const simulateFirstEnroll = document.getElementById("simulateFirstEnroll");
  const simulateFaceFail = document.getElementById("simulateFaceFail");
  const simulateEnrollFail = document.getElementById("simulateEnrollFail");
  const simulateNotCharging = document.getElementById("simulateNotCharging");
  const simulateDoorOpen = document.getElementById("simulateDoorOpen");
  const simulateReturn = document.getElementById("simulateReturn");
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
  const faceProfiles = new Map();
  const faceEnrollmentLogs = [];
  const DEMO_NAV_SELECTOR =
    "#simulateScan, #simulateScanFail, #simulateFaceSuccess, #simulateFirstEnroll, #simulateFaceFail, #simulateEnrollFail, #simulateNotCharging, #simulateDoorOpen, #simulateReturn";

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

  function showPage(name, options = {}) {
    if (registrationLocked) return;
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
      resetFaceLogin();
      showLoginChoice();
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
    pickupPage.querySelector('[data-goto="home"]').hidden = false;
    faceBack.hidden = false;
    loginChoice.hidden = true;
    mustEnrollAfterPassword = false;
    authenticatedStudentId = "";
    enrollmentMode = "replace";
    faceLogin.hidden = false;
    passwordLogin.hidden = true;
    faceEnroll.hidden = true;
    faceStatus.textContent = "正在识别";
    faceStatus.className = "face-status is-recognizing";
    faceDesc.textContent = "请正对屏幕，保持面部处于识别框内";
    faceRetry.hidden = true;
    loginTip.hidden = true;
    studentId.value = "";
    studentPwd.value = "";
  }

  function showFaceSuccess() {
    loginChoice.hidden = true;
    faceLogin.hidden = false;
    passwordLogin.hidden = true;
    faceEnroll.hidden = true;
    faceStatus.textContent = "识别成功，正在登录";
    faceStatus.className = "face-status is-success";
    faceDesc.textContent = "已确认身份，即将进入可用设备列表";
    faceRetry.hidden = true;
    enrollmentTimer = window.setTimeout(() => showPage("devices"), 650);
  }

  function showFaceFail(mode = enrollmentMode) {
    loginChoice.hidden = true;
    mustEnrollAfterPassword = false;
    enrollmentMode = mode;
    faceLogin.hidden = false;
    passwordLogin.hidden = true;
    faceEnroll.hidden = true;
    faceStatus.textContent = "人脸库未找到匹配";
    faceStatus.className = "face-status is-failed";
    faceDesc.textContent = "请重试，尚未注册人脸可返回首页进行人脸注册";
    faceRetry.hidden = false;
  }

  function showPasswordLogin() {
    document.getElementById("passwordToFace").hidden = mustEnrollAfterPassword;
    loginChoice.hidden = true;
    faceLogin.hidden = true;
    passwordLogin.hidden = false;
    faceEnroll.hidden = true;
    passwordLoginDesc.textContent = mustEnrollAfterPassword
      ? "验证后开始人脸注册；原有人脸将删除，录入完成前不可退出"
      : "请输入编号和密码后查看可用设备";
    loginTip.hidden = true;
    hideKeypad();
  }

  function showFaceEnrollment() {
    loginChoice.hidden = true;
    enrollFailureAction.hidden = true;
    hideKeypad();
    faceLogin.hidden = true;
    passwordLogin.hidden = true;
    faceEnroll.hidden = false;
    enrollStatus.textContent = "录入人脸";
    enrollStatus.className = "face-status";
    enrollDesc.textContent = "";
    enrollStudentId.textContent = authenticatedStudentId || "—";
    enrollNotice.textContent = "请完成新人脸录入，完成前不可退出";
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

    enrollStatus.textContent = "录入成功";
    enrollStatus.className = "face-status is-success";
    enrollDesc.textContent = `人脸已绑定至编号 ${authenticatedStudentId}，即将返回首页`;
    faceEnrollStart.hidden = true;
    enrollmentTimer = window.setTimeout(() => {
      registrationLocked = false;
      authenticatedStudentId = "";
      mustEnrollAfterPassword = false;
      showPage("home");
    }, 700);
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

  function showLoginChoice() {
    clearTimeout(enrollmentTimer);
    hideKeypad();
    loginChoice.hidden = false;
    faceLogin.hidden = true;
    passwordLogin.hidden = true;
    faceEnroll.hidden = true;
  }
  function openRegistration() {
    if (registrationLocked) return;
    showPage("pickup");
    mustEnrollAfterPassword = true;
    showPasswordLogin();
    faceBack.hidden = true;
  }
  document.getElementById("faceRegister").addEventListener("click", openRegistration);
  document.getElementById("chooseFace").addEventListener("click", resetFaceLogin);
  document.getElementById("choosePassword").addEventListener("click", showPasswordLogin);
  document.getElementById("backToLoginChoice").addEventListener("click", showLoginChoice);
  faceBack.addEventListener("click", showLoginChoice);
  document.getElementById("passwordToFace").addEventListener("click", () => {
    hideKeypad();
    resetFaceLogin();
  });
  faceRetry.addEventListener("click", resetFaceLogin);
  faceEnrollStart.addEventListener("click", () => {
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

  simulateScan.addEventListener("click", (e) => {
    e.stopPropagation();
    openReturnFlow();
  });

  document.querySelector(".scan-guide-card").addEventListener("click", (e) => {
    e.stopPropagation();
    openReturnFlow();
  });

  simulateScanFail.addEventListener("click", (e) => {
    e.stopPropagation();
    showPage("store", { keepScanFail: true });
    scanFailTip.hidden = false;
  });

  simulateFaceSuccess.addEventListener("click", (e) => {
    if (registrationLocked) return;
    e.stopPropagation();
    showPage("pickup");
    showFaceSuccess();
  });

  simulateFirstEnroll.addEventListener("click", (e) => {
    e.stopPropagation();
    openRegistration();
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
    if (!registrationLocked || faceEnrollStart.hidden) return;
    clearTimeout(enrollmentTimer);
    const verifiedId = authenticatedStudentId || "20260001";
    mustEnrollAfterPassword = true;
    enrollmentMode = mode;
    authenticatedStudentId = verifiedId;
    showFaceEnrollment();
    faceEnrollStart.textContent = "重新录入";
    enrollFailureAction.hidden = true;
    enrollFailureAction.textContent = "使用已验证账号登录";
    enrollStatus.textContent = "录入失败";
    enrollStatus.className = "face-status is-failed";
    enrollDesc.textContent = "本次人脸未保存，请重新录入";
    enrollNotice.textContent = "请完成新人脸录入，完成前不可退出";
  }

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

  simulateReturn.addEventListener("click", (e) => {
    e.stopPropagation();
    ensureReturnScene();
    returnCheckState = "pass";
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
})();
