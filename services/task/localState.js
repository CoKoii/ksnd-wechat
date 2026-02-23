const CHECKER_ID_KEY = "checkerId";
const LEGACY_LOGIN_ID_KEY = "loginId";
const TODO_LIST_RELOAD_KEY = "todoListNeedReload";

const toStorageText = (value) => {
  if (value === undefined || value === null || value === "") return "";
  return String(value);
};

const persistCheckerId = (value) => {
  const checkerId = toStorageText(value);
  if (!checkerId) return "";
  wx.setStorageSync(CHECKER_ID_KEY, checkerId);
  wx.setStorageSync(LEGACY_LOGIN_ID_KEY, checkerId);
  return checkerId;
};

const getPersistedCheckerId = () => {
  const legacyId = toStorageText(wx.getStorageSync(LEGACY_LOGIN_ID_KEY));
  if (legacyId) {
    wx.setStorageSync(CHECKER_ID_KEY, legacyId);
    return legacyId;
  }

  const checkerId = toStorageText(wx.getStorageSync(CHECKER_ID_KEY));
  if (checkerId) {
    wx.setStorageSync(LEGACY_LOGIN_ID_KEY, checkerId);
  }
  return checkerId;
};

const markTodoListNeedReload = () => {
  wx.setStorageSync(TODO_LIST_RELOAD_KEY, "1");
};

const shouldReloadTodoList = () =>
  toStorageText(wx.getStorageSync(TODO_LIST_RELOAD_KEY)) === "1";

const clearTodoListReloadFlag = () => {
  wx.setStorageSync(TODO_LIST_RELOAD_KEY, "");
};

module.exports = {
  persistCheckerId,
  getPersistedCheckerId,
  markTodoListNeedReload,
  shouldReloadTodoList,
  clearTodoListReloadFlag,
};
