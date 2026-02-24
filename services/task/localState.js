const LOGIN_ID_KEY = "loginId";
const TODO_LIST_RELOAD_KEY = "todoListNeedReload";

const toStorageText = (value) => {
  if (value == null || value === "") return "";
  return String(value);
};
const getStorageText = (key) => toStorageText(wx.getStorageSync(key));
const setStorageText = (key, value) => wx.setStorageSync(key, toStorageText(value));

const persistLoginId = (value) => {
  const loginId = toStorageText(value);
  if (!loginId) return "";
  setStorageText(LOGIN_ID_KEY, loginId);
  return loginId;
};

const getPersistedLoginId = () => getStorageText(LOGIN_ID_KEY);
const clearPersistedLoginId = () => wx.removeStorageSync(LOGIN_ID_KEY);

const markTodoListNeedReload = () => {
  setStorageText(TODO_LIST_RELOAD_KEY, "1");
};

const shouldReloadTodoList = () =>
  getStorageText(TODO_LIST_RELOAD_KEY) === "1";

const clearTodoListReloadFlag = () => {
  setStorageText(TODO_LIST_RELOAD_KEY, "");
};

module.exports = {
  persistLoginId,
  getPersistedLoginId,
  clearPersistedLoginId,
  markTodoListNeedReload,
  shouldReloadTodoList,
  clearTodoListReloadFlag,
};
