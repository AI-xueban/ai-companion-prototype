import { requestWechatLoginCode } from "../../../services/auth";

Page({
  data: { loading: false },
  async handleGuardianLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      await requestWechatLoginCode();
      wx.navigateTo({ url: "/pages/guardian/bind/index" });
    } catch (error) {
      wx.showToast({ title: error instanceof Error ? error.message : "微信登录失败，请重试", icon: "none" });
    } finally {
      this.setData({ loading: false });
    }
  }
})
