const { login } = require("../../api/auth");
const { getToken, setToken } = require("../../utils/http");

const HOME_TAB_PATH = "/pages/home/home";

Page({
  data: {
    form: {
      uname: "",
      pwd: "",
    },
    submitting: false,
  },

  onShow() {
    if (getToken()) {
      this.goHome();
    }
  },

  onInput(event) {
    const { field } = event.currentTarget.dataset;
    const value = event.detail.value || "";
    this.setData({
      [`form.${field}`]: value,
    });
  },

  async onSubmit() {
    const { submitting, form } = this.data;
    if (submitting) return;

    const uname = String(form.uname || "").trim();
    const pwd = String(form.pwd || "").trim();
    if (!uname || !pwd) {
      wx.showToast({
        title: "请输入账号和密码",
        icon: "none",
      });
      return;
    }

    this.setData({ submitting: true });
    try {
      const res = await login({ uname, pwd });
      const token = res && res.data ? res.data.tokenValue : "";
      if (res && res.msg === "ok" && token) {
        setToken(token);
        if (res.data.loginId) {
          wx.setStorageSync("loginId", res.data.loginId);
        }
        wx.showToast({
          title: "登录成功",
          icon: "success",
        });
        this.goHome();
        return;
      }

      wx.showToast({
        title: (res && res.msg) || "登录失败",
        icon: "none",
      });
    } catch (error) {
      wx.showToast({
        title: (error && error.message) || "登录失败",
        icon: "none",
      });
    } finally {
      this.setData({ submitting: false });
    }
  },

  goHome() {
    wx.switchTab({
      url: HOME_TAB_PATH,
      fail: () => {
        wx.reLaunch({ url: HOME_TAB_PATH });
      },
    });
  },
});
