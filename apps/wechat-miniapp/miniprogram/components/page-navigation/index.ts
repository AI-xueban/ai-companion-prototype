Component({
  properties: { title: { type: String, value: '' }, back: { type: Boolean, value: false }, home: { type: Boolean, value: false }, homeLabel: { type: String, value: '回到模块首页' } },
  data: { statusHeight: 20, barHeight: 44, sideWidth: 96 },
  lifetimes: {
    attached() {
      const info = wx.getWindowInfo();
      const capsule = wx.getMenuButtonBoundingClientRect();
      const statusHeight = info.statusBarHeight || 20;
      const barHeight = capsule.height > 0 ? Math.max(44, (capsule.top - statusHeight) * 2 + capsule.height) : 44;
      const sideWidth = capsule.width > 0 ? info.windowWidth - capsule.left + 8 : 96;
      this.setData({ statusHeight, barHeight, sideWidth });
    },
  },
  methods: { navigateBack() { this.triggerEvent('back'); }, navigateHome() { this.triggerEvent('home'); } },
});
