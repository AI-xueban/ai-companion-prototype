const DEMO_STUDENT = {
  name: "林小满",
  school: "罗湖实验学校",
  className: "五年级 2 班"
};

Page({
  data: { student: DEMO_STUDENT, maskedCode: "" },
  onLoad(query: Record<string, string | undefined>) {
    const code = query.studentCode || "";
    this.setData({ maskedCode: `${code.slice(0, 3)}****${code.slice(-2)}` });
  },
  handleSubmit() {
    wx.navigateTo({ url: "/pages/guardian/pending/index" });
  },
  handleModify() {
    wx.navigateBack();
  }
})
