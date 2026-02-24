const { BASIC_HOME_PATH } = require("../../utils/util");

const normalizeForm = (form = {}) => ({
  uname: String(form.uname || "").trim(),
  pwd: String(form.pwd || "").trim(),
});

const isFormValid = (form = {}) => Boolean(form.uname && form.pwd);

const toIdString = (value) => {
  if (value == null || value === "") return "";
  return String(value);
};

const parseLoginResponse = (response = {}) => {
  const data = response.data || {};
  const loginId = toIdString(data.loginId);
  return {
    ok: response.msg === "ok" && Boolean(data.tokenValue),
    token: data.tokenValue || "",
    loginId,
    message: response.msg || "登录失败",
  };
};

const navigateHome = () => {
  wx.switchTab({ url: BASIC_HOME_PATH });
};

module.exports = {
  normalizeForm,
  isFormValid,
  parseLoginResponse,
  navigateHome,
};
