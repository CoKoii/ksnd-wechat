const PROJECT_ID_KEY = "selectedProjectId";

const toStorageText = (value) => {
  if (value === undefined || value === null || value === "") return "";
  return String(value).trim();
};

const persistProjectId = (value) => {
  const projectId = toStorageText(value);
  wx.setStorageSync(PROJECT_ID_KEY, projectId);
  return projectId;
};

const getPersistedProjectId = () => toStorageText(wx.getStorageSync(PROJECT_ID_KEY));

module.exports = {
  persistProjectId,
  getPersistedProjectId,
};
