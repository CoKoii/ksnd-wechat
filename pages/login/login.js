const { login } = require("../../api/auth");
const { getToken, setToken } = require("../../utils/http");
const { persistCheckerId } = require("../../services/task/localState");
const {
  normalizeForm,
  isFormValid,
  parseLoginResponse,
  navigateHome,
} = require("./utils");

Page({
  data: {
    form: {
      uname: "fstadm",
      pwd: "ksLD25002@",
    },
    submitting: false,
  },

  onShow() {
    if (getToken()) {
      navigateHome();
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

    const normalizedForm = normalizeForm(form);
    if (!isFormValid(normalizedForm)) {
      wx.showToast({
        title: "请输入账号和密码",
        icon: "none",
      });
      return;
    }

    this.setData({ submitting: true });
    try {
      const res = await login(normalizedForm);
      const result = parseLoginResponse(res);
      if (result.ok) {
        setToken(result.token);
        if (result.loginId) {
          persistCheckerId(result.loginId);
        }
        wx.showToast({
          title: "登录成功",
          icon: "success",
        });
        navigateHome();
        return;
      }

      wx.showToast({
        title: result.message,
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
});
