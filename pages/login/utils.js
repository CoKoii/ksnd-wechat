const HOME_TAB_PATH = "/pages/home/home";

const normalizeForm = (form = {}) => ({
  uname: String(form.uname || "").trim(),
  pwd: String(form.pwd || "").trim(),
});

const isFormValid = (form = {}) => Boolean(form.uname && form.pwd);

const parseLoginResponse = (response = {}) => {
  const data = response.data || {};
  return {
    ok: response.msg === "ok" && Boolean(data.tokenValue),
    token: data.tokenValue || "",
    loginId: data.loginId || "",
    message: response.msg || "登录失败",
  };
};

const goHome = () => {
  wx.switchTab({
    url: HOME_TAB_PATH,
    fail: () => {
      wx.reLaunch({ url: HOME_TAB_PATH });
    },
  });
};

module.exports = {
  normalizeForm,
  isFormValid,
  parseLoginResponse,
  goHome,
};
