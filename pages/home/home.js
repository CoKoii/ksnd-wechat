Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
  },

  onLoad() {
    const windowInfo = wx.getWindowInfo();
    const statusBarHeight = windowInfo.statusBarHeight;
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight =
      menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;

    this.setData({
      statusBarHeight,
      navBarHeight,
    });
  },
});
