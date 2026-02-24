const CHECKER_ID_KEY = "checkerId";
const LEGACY_LOGIN_ID_KEY = "loginId";
const TODO_LIST_RELOAD_KEY = "todoListNeedReload";

const toStorageText = (value) => {
  if (value == null || value === "") return "";
  return String(value);
};
const getStorageText = (key) => toStorageText(wx.getStorageSync(key));
const setStorageText = (key, value) => wx.setStorageSync(key, toStorageText(value));

const persistCheckerId = (value) => {
  const checkerId = toStorageText(value);
  if (!checkerId) return "";
  setStorageText(CHECKER_ID_KEY, checkerId);
  setStorageText(LEGACY_LOGIN_ID_KEY, checkerId);
  return checkerId;
};

const getPersistedCheckerId = () => {
  const legacyId = getStorageText(LEGACY_LOGIN_ID_KEY);
  if (legacyId) {
    setStorageText(CHECKER_ID_KEY, legacyId);
    return legacyId;
  }

  const checkerId = getStorageText(CHECKER_ID_KEY);
  if (checkerId) {
    setStorageText(LEGACY_LOGIN_ID_KEY, checkerId);
  }
  return checkerId;
};

const markTodoListNeedReload = () => {
  setStorageText(TODO_LIST_RELOAD_KEY, "1");
};

const shouldReloadTodoList = () =>
  getStorageText(TODO_LIST_RELOAD_KEY) === "1";

const clearTodoListReloadFlag = () => {
  setStorageText(TODO_LIST_RELOAD_KEY, "");
};

module.exports = {
  persistCheckerId,
  getPersistedCheckerId,
  markTodoListNeedReload,
  shouldReloadTodoList,
  clearTodoListReloadFlag,
};
