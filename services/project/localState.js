const PROJECT_ID_KEY = "selectedProjectId";

const toStorageText = (value) => {
  if (value == null || value === "") return "";
  return String(value).trim();
};
const getStorageText = (key) => toStorageText(wx.getStorageSync(key));
const setStorageText = (key, value) => wx.setStorageSync(key, toStorageText(value));

const persistProjectId = (value) => {
  const projectId = toStorageText(value);
  setStorageText(PROJECT_ID_KEY, projectId);
  return projectId;
};

const getPersistedProjectId = () => getStorageText(PROJECT_ID_KEY);

module.exports = {
  persistProjectId,
  getPersistedProjectId,
};
