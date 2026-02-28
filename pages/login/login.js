const { BASE_URL, setToken } = require("../../utils/http");
const { persistLoginId } = require("../../services/task/localState");

const toText = (value) => String(value || "").trim();

Page({
  data: {
    itemChecked: false,
    submitting: false,
  },

  onLoad() {
    this.prepareWxInfo();
  },

  onCheckItem() {
    this.setData({
      itemChecked: !this.data.itemChecked,
    });
  },

  async prepareWxInfo() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: ({ code }) => {
          if (!code) {
            reject(new Error("获取微信授权码失败"));
            return;
          }
          wx.request({
            url: `${BASE_URL}/auth/wxlogin`,
            method: "POST",
            data: {
              wxCode: code,
            },
            success: (res) => {
              const data = (res && res.data && res.data.data) || {};
              if (!data || !data.wid) {
                reject(new Error("获取微信身份失败"));
                return;
              }
              wx.setStorageSync("wxInfo", {
                wid: data.wid,
              });
              resolve(data);
            },
            fail: (error) => {
              reject(
                new Error((error && error.errMsg) || "微信身份初始化失败"),
              );
            },
          });
        },
        fail: (error) => {
          reject(new Error((error && error.errMsg) || "微信登录失败"));
        },
      });
    });
  },

  async onPhoneLoginTap() {
    if (!this.data.itemChecked) {
      wx.showToast({
        title: "请先阅读并勾选协议",
        icon: "none",
      });
      return;
    }
    wx.showToast({
      title: "请点击下方授权按钮登录",
      icon: "none",
    });
  },

  async getPhoneNumber(event) {
    if (!this.data.itemChecked) {
      wx.showToast({
        title: "请先阅读并勾选协议",
        icon: "none",
      });
      return;
    }
    if (this.data.submitting) return;

    const authCode = toText(
      event && event.detail && (event.detail.code || event.detail.authCode),
    );
    if (!authCode) {
      wx.showToast({
        title: "获取手机号失败，请重试",
        icon: "none",
      });
      return;
    }

    let wxInfo = wx.getStorageSync("wxInfo");
    if (!wxInfo || !wxInfo.wid) {
      try {
        await this.prepareWxInfo();
      } catch (error) {
        wx.showToast({
          title: error.message || "登录初始化失败",
          icon: "none",
        });
        return;
      }
      wxInfo = wx.getStorageSync("wxInfo");
    }
    if (!wxInfo || !wxInfo.wid) {
      wx.showToast({
        title: "微信身份无效，请重试",
        icon: "none",
      });
      return;
    }

    this.setData({ submitting: true });
    wx.request({
      url: `${BASE_URL}/auth/wxPhonelogin`,
      method: "POST",
      data: {
        wid: wxInfo.wid,
        authCode,
      },
      success: (response) => {
        const res = (response && response.data && response.data.data) || {};
        const token = toText(res && res.token && res.token.tokenValue);
        if ((res.status === 1 || res.status === 2) && token) {
          const userInfo = {
            userId: res.id,
            wid: res.wid || wxInfo.wid,
            userCode: res.name,
            userName: res.nickname,
            realName: res.realname,
            phone: res.phone,
            userType: res.type,
            userRoles: res.roles || [],
            userRole: (res.roles && res.roles[0]) || "",
            avatar: res.avatar,
            menuType: "2",
          };
          setToken(token);
          wx.setStorageSync("access_token", token);
          wx.setStorageSync("userInfo", userInfo);
          if (userInfo.userId) {
            persistLoginId(userInfo.userId);
          }

          wx.showToast({
            title: "登录成功",
            icon: "success",
          });
          wx.switchTab({
            url: "/pages/home/home",
          });
          return;
        }
        wx.showToast({
          title: toText(res.msg) || "手机号登录失败",
          icon: "none",
        });
      },
      fail: (error) => {
        wx.showToast({
          title: (error && error.errMsg) || "登录失败",
          icon: "none",
        });
      },
      complete: () => {
        this.setData({ submitting: false });
      },
    });
  },

  onUserProtocol() {
    wx.navigateTo({
      url: "/pages/old/safe/mine/userItem",
    });
  },

  onPrivacyProtocol() {
    wx.navigateTo({
      url: "/pages/old/safe/mine/privacyItem",
    });
  },
});
