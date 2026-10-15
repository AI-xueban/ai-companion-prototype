Page({
  data: { studentCode: "", errorMessage: "", submitting: false },
  handleCodeInput(event: WechatMiniprogram.Input) {
    this.setData({ studentCode: event.detail.value.replace(/\D/g, ""), errorMessage: "" });
  },
  handleNext() {
    const code = this.data.studentCode.trim();
    if (!code) {
      this.setData({ errorMessage: "请输入学生编号" });
      return;
    }
    if (!/^\d{6,20}$/.test(code)) {
      this.setData({ errorMessage: "学生编号应为 6–20 位数字" });
      return;
    }
    wx.navigateTo({ url: `/pages/guardian/confirm/index?studentCode=${code}` });
  }
})
