import { createDemoLoginResult, requestWechatLoginCode } from "../../../services/auth";
import { homePathFor } from "../../../permissions/access";
import { saveSession } from "../../../stores/session";
import type { UserRole } from "../../../types/identity";

type LoginStage = "role" | "guardian-bind" | "teacher-verify";

const CHILDREN = [
  { id: "student-1001", name: "林小满", initial: "林", meta: "五年级 2 班" },
  { id: "student-1002", name: "林小川", initial: "林", meta: "二年级 1 班" },
];

Page({
  data: {
    stage: "role" as LoginStage,
    selectedChildId: "student-1001",
    children: CHILDREN,
    agreed: false,
    isSubmitting: false,
  },

  selectRole(event: WechatMiniprogram.BaseEvent) {
    const role = event.currentTarget.dataset.role as UserRole;
    this.setData({ stage: role === "guardian" ? "guardian-bind" : "teacher-verify" });
  },

  backToRole() {
    this.setData({ stage: "role", isSubmitting: false });
  },

  selectChild(event: WechatMiniprogram.BaseEvent) {
    this.setData({ selectedChildId: event.currentTarget.dataset.id });
  },

  changeAgreement(event: WechatMiniprogram.CustomEvent<{ value: string[] }>) {
    this.setData({ agreed: event.detail.value.includes("agreed") });
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
    this.setData({ isSubmitting: true });
    const session = createDemoLoginResult("teacher");
    saveSession(session);
    wx.reLaunch({ url: homePathFor(session.profile) });
  },
})
