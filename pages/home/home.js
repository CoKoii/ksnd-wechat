Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    communityOptions: ["招商花园", "招商雍华府", "招商海德园"],
    selectedCommunityIndex: 0,
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

  onCommunityChange(event) {
    const { value } = event.detail || {};
    this.setData({
      selectedCommunityIndex: Number(value) || 0,
    });
  },
});
