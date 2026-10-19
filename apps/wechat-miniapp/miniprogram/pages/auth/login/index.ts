import { bindDemoTeacherWechat, createDemoLoginResult, createDemoTeacherPasswordResult, createDemoTeacherSmsResult, getDemoTeacherWechatBinding, requestWechatLoginCode, setDemoTeacherManualLogout, wasDemoTeacherManualLogout } from "../../../services/auth";
import { homePathFor } from "../../../permissions/access";
import { getSession, saveSession } from "../../../stores/session";
import type { UserRole } from "../../../types/identity";
import { DEMO_GUARDIAN_CHILD_IDS, getDemoStudent } from "../../../services/schoolDemoRoster";

type LoginStage = "role" | "guardian-bind" | "teacher-login" | "teacher-bind";
type TeacherLoginMode = "sms" | "password";

const CHILDREN = DEMO_GUARDIAN_CHILD_IDS.map(id => {
  const student = getDemoStudent(id)!;
  return { id, name: student.name, initial: student.name.slice(0, 1), meta: student.className };
});
let teacherCodeCountdownUntil = 0;
let teacherCodeTimer: ReturnType<typeof setInterval> | null = null;

Page({
  data: {
    stage: "role" as LoginStage,
    selectedChildId: DEMO_GUARDIAN_CHILD_IDS[0],
    children: CHILDREN,
    agreed: false,
    isSubmitting: false,
    teacherPhone: "",
    teacherLoginMode: "sms" as TeacherLoginMode,
    teacherCode: "",
    teacherCodeSent: false,
    teacherCodeCountdown: 0,
    teacherPassword: "",
  },

  async onLoad() {
    // 主动退出优先于本地会话和微信绑定状态，避免再次打开时自动进入工作台。
    if (wasDemoTeacherManualLogout()) {
      this.setData({ stage: "teacher-login" });
      return;
    }
    const session = getSession();
    if (session?.profile.roles.includes("teacher") && session.expiresAt && session.expiresAt > Date.now()) {
      wx.reLaunch({ url: homePathFor(session.profile) });
      return;
    }
    if (session?.profile.roles.includes("guardian")) return;
    if (getDemoTeacherWechatBinding() !== "teacher-demo-001") {
      if (session?.profile.roles.includes("teacher")) this.setData({ stage: "teacher-login" });
      return;
    }
    try {
      // 仅在演示账号已绑定当前微信时尝试恢复过期的业务会话。
      // 原型续登：正式环境须把 code 交给后端，核对 openid、绑定关系、账号状态和权限后再签发新 token。
      await requestWechatLoginCode();
      const renewedSession = createDemoLoginResult("teacher");
      saveSession(renewedSession);
      wx.reLaunch({ url: homePathFor(renewedSession.profile) });
    } catch {
      // 静默续登失败时保留教师登录入口。
      this.setData({ stage: "teacher-login" });
    }
  },

  onUnload() {
    if (teacherCodeTimer) clearInterval(teacherCodeTimer);
    teacherCodeTimer = null;
    teacherCodeCountdownUntil = 0;
  },

  updateTeacherCodeCountdown() {
    const remaining = Math.max(0, Math.ceil((teacherCodeCountdownUntil - Date.now()) / 1000));
    this.setData({ teacherCodeCountdown: remaining });
    if (!remaining && teacherCodeTimer) {
      clearInterval(teacherCodeTimer);
      teacherCodeTimer = null;
    }
  },

  resetTeacherCodeCountdown() {
    teacherCodeCountdownUntil = 0;
    if (teacherCodeTimer) clearInterval(teacherCodeTimer);
    teacherCodeTimer = null;
    this.setData({ teacherCodeCountdown: 0 });
  },

  selectRole(event: WechatMiniprogram.BaseEvent) {
    const role = event.currentTarget.dataset.role as UserRole;
    this.setData({ stage: role === "guardian" ? "guardian-bind" : "teacher-login" });
  },

  backToRole() {
    this.resetTeacherCodeCountdown();
    this.setData({ stage: "role", isSubmitting: false, teacherCode: "", teacherCodeSent: false, teacherPassword: "" });
  },

  selectChild(event: WechatMiniprogram.BaseEvent) {
    this.setData({ selectedChildId: event.currentTarget.dataset.id });
  },

  changeAgreement(event: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ agreed: event.detail.value.includes("agreed") });
  },

  changeTeacherPhone(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    if (event.detail.value.trim() !== this.data.teacherPhone) this.resetTeacherCodeCountdown();
    this.setData({ teacherPhone: event.detail.value.trim(), teacherCodeSent: false, teacherCode: "", teacherPassword: "" });
  },

  switchTeacherLoginMode(event: WechatMiniprogram.BaseEvent) {
    const mode = event.currentTarget.dataset.mode as TeacherLoginMode;
    if (mode !== "sms" && mode !== "password") return;
    this.setData({ teacherLoginMode: mode, teacherPassword: "" });
  },

  changeTeacherCode(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ teacherCode: event.detail.value.trim() });
  },

  changeTeacherPassword(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ teacherPassword: event.detail.value });
  },

  requestTeacherCode() {
    if (this.data.teacherCodeCountdown > 0) return;
    if (!/^1\d{10}$/.test(this.data.teacherPhone)) {
      wx.showToast({ title: "请输入有效的 11 位手机号", icon: "none" });
      return;
    }
    if (this.data.teacherPhone !== "13800138000") {
      wx.showToast({ title: "未找到该手机号对应的教师账号", icon: "none" });
      return;
    }
    teacherCodeCountdownUntil = Date.now() + 60000;
    this.setData({ teacherCodeSent: true });
    this.updateTeacherCodeCountdown();
    if (teacherCodeTimer) clearInterval(teacherCodeTimer);
    teacherCodeTimer = setInterval(() => this.updateTeacherCodeCountdown(), 1000);
    wx.showToast({ title: "演示验证码：123456", icon: "none" });
  },

  async completeGuardianBinding() {
    if (!this.data.agreed) {
      wx.showToast({ title: "请先阅读并同意授权说明", icon: "none" });
      return;
    }

    this.setData({ isSubmitting: true });
    try {
      // 真正接入时：把 code 发给后端，由后端校验微信身份与亲子绑定关系。
      await requestWechatLoginCode();
      const session = createDemoLoginResult("guardian", this.data.selectedChildId);
      saveSession(session);
      wx.reLaunch({ url: homePathFor(session.profile) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "微信授权未完成，请重试";
      wx.showToast({ title: message, icon: "none" });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  completeTeacherVerification() {
    if (!/^1\d{10}$/.test(this.data.teacherPhone)) {
      wx.showToast({ title: "请输入有效的 11 位手机号", icon: "none" });
      return;
    }
    if (this.data.teacherLoginMode === "sms" && !this.data.teacherCodeSent) {
      wx.showToast({ title: "请先获取验证码", icon: "none" });
      return;
    }
    this.setData({ isSubmitting: true });
    try {
      const session = this.data.teacherLoginMode === "sms"
        ? createDemoTeacherSmsResult(this.data.teacherPhone, this.data.teacherCode)
        : createDemoTeacherPasswordResult(this.data.teacherPhone, this.data.teacherPassword);
      saveSession(session);
      setDemoTeacherManualLogout(false);
      if (getDemoTeacherWechatBinding() === session.profile.userId) {
        wx.reLaunch({ url: homePathFor(session.profile) });
      } else {
        this.setData({ stage: "teacher-bind" });
      }
    } catch (error) {
      wx.showToast({ title: error instanceof Error ? error.message : "登录失败，请重试", icon: "none" });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  async bindTeacherWechat() {
    this.setData({ isSubmitting: true });
    try {
      await requestWechatLoginCode();
      bindDemoTeacherWechat("teacher-demo-001");
      wx.showToast({ title: "演示绑定成功", icon: "success" });
      wx.reLaunch({ url: "/pages/teacher/home/index" });
    } catch (error) {
      wx.showToast({ title: error instanceof Error ? error.message : "绑定未完成，请重试", icon: "none" });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },

  skipTeacherWechatBinding() {
    wx.reLaunch({ url: "/pages/teacher/home/index" });
  },

  async teacherWechatQuickLogin() {
    this.setData({ isSubmitting: true });
    try {
      await requestWechatLoginCode();
      if (getDemoTeacherWechatBinding() !== "teacher-demo-001") {
        wx.showModal({ title: "当前微信尚未绑定", content: "请先使用教师账号登录，登录后可绑定当前微信。", showCancel: false });
        return;
      }
      const session = createDemoLoginResult("teacher");
      saveSession(session);
      setDemoTeacherManualLogout(false);
      wx.reLaunch({ url: homePathFor(session.profile) });
    } catch (error) {
      wx.showToast({ title: error instanceof Error ? error.message : "微信登录未完成，请重试", icon: "none" });
    } finally {
      this.setData({ isSubmitting: false });
    }
  },
})
