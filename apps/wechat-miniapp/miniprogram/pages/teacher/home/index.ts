import { hasRole } from "../../../permissions/access";
import { clearSession, getSession } from "../../../stores/session";
import { getDemoTeacherWechatBinding, setDemoTeacherManualLogout, unbindDemoTeacherWechat } from "../../../services/auth";

const CLASSES = [
  { id: "class-g5-2", name: "五年级 2 班", subject: "数学", students: 42, isHeadTeacher: true },
  { id: "class-g5-3", name: "五年级 3 班", subject: "数学", students: 40, isHeadTeacher: false },
];

Page({
  data: {
    teacherName: "",
    schoolName: "罗湖实验学校",
    classes: CLASSES,
    selectedClassId: CLASSES[0].id,
    selectedClass: CLASSES[0],
    securityOpen: false,
    wechatBound: false,
    reauthPassword: "",
  },

  onLoad() {
    // 进入教师页时同时检查角色和会话有效期，不能只依赖本地保存的角色。
    const session = getSession();
    const profile = session?.profile;
    if (!hasRole(profile, "teacher") || !session?.expiresAt || session.expiresAt <= Date.now()) {
      wx.reLaunch({ url: "/pages/auth/login/index" });
      return;
    }
    this.setData({ teacherName: profile?.displayName || "教师" });
  },

  openSecurity() {
    this.setData({ securityOpen: true, wechatBound: getDemoTeacherWechatBinding() === "teacher-demo-001", reauthPassword: "" });
  },

  closeSecurity() {
    this.setData({ securityOpen: false, reauthPassword: "" });
  },

  changeReauthPassword(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ reauthPassword: event.detail.value });
  },

  confirmUnbind() {
    try {
      unbindDemoTeacherWechat("teacher-demo-001", this.data.reauthPassword);
      this.setData({ wechatBound: false, reauthPassword: "" });
      wx.showToast({ title: "已解绑当前微信", icon: "success" });
    } catch (error) {
      wx.showToast({ title: error instanceof Error ? error.message : "解绑失败，请重试", icon: "none" });
    }
  },

  selectClass(event: WechatMiniprogram.BaseEvent) {
    const selectedClass = CLASSES.find((item) => item.id === event.currentTarget.dataset.id);
    if (selectedClass) this.setData({ selectedClassId: selectedClass.id, selectedClass });
  },

  openModule(event: WechatMiniprogram.BaseEvent) {
    const moduleName = event.currentTarget.dataset.name as string;
    wx.showToast({ title: `${moduleName}页面待接入`, icon: "none" });
  },

  logout() {
    setDemoTeacherManualLogout(true);
    clearSession();
    wx.reLaunch({ url: "/pages/auth/login/index" });
  },
});
