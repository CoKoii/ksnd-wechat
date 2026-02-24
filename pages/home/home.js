const { getProjectTree } = require("../../api/project");
const { getUserByUid } = require("../../api/auth");
const {
  persistProjectId,
  getPersistedProjectId,
} = require("../../services/project/localState");
const { getPersistedLoginId } = require("../../services/task/localState");

const toText = (value) => String(value || "").trim();
const SUCCESS_CODE = "0";
const pickUserName = (response = {}) =>
  toText(response.data && response.data.realname);
const getKeywordFromEvent = (event, fallbackValue = "") => {
  const value =
    event && event.detail && event.detail.value !== undefined
      ? event.detail.value
      : fallbackValue;
  return toText(value);
};

const pickProjectName = (item = {}) =>
  toText(item.name || item.pjname || item.label || item.title || item.mc);

const extractProjectList = (response = {}) => {
  const payload = response && response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload && payload.data)) return payload.data;
  if (Array.isArray(payload && payload.list)) return payload.list;
  if (Array.isArray(payload && payload.rows)) return payload.rows;
  return [];
};

const normalizeProjectList = (list = []) =>
  (Array.isArray(list) ? list : [])
    .map((item, index) => {
      const name = pickProjectName(item);
      if (!name) return null;

      const rawId = toText(item && item.id);
      const id = rawId || `project-${index}`;
      return {
        id,
        name,
      };
    })
    .filter(Boolean);

const pickSelectedProject = (projectOptions = [], selectedProjectId = "") => {
  if (!projectOptions.length) {
    return {
      selectedProjectId: "",
      selectedProjectName: "",
    };
  }

  const currentId = toText(selectedProjectId);
  const selected =
    projectOptions.find((item) => item.id === currentId) || projectOptions[0];
  return {
    selectedProjectId: selected.id,
    selectedProjectName: selected.name,
  };
};

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    projectOptions: [],
    selectedProjectId: "",
    selectedProjectName: "",
    welcomeName: "",
    projectKeyword: "",
    showProjectPanel: false,
    loadingProjectTree: false,
  },

  onLoad() {
    const persistedProjectId = getPersistedProjectId();
    const windowInfo = wx.getWindowInfo();
    const statusBarHeight = windowInfo.statusBarHeight;
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight =
      menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;

    this.setData({
      statusBarHeight,
      navBarHeight,
      selectedProjectId: persistedProjectId,
    });

    this.loadUserProfile();
    this.loadProjectTree();
  },

  async loadUserProfile() {
    const uid = toText(getPersistedLoginId());
    if (!uid) return;

    try {
      const response = await getUserByUid(uid);
      const welcomeName = pickUserName(response);
      if (welcomeName) {
        this.setData({ welcomeName });
      }
      console.log("[home] /auth/user response:", {
        uid,
        response,
      });
    } catch (error) {
      console.error("[home] /auth/user request failed:", {
        uid,
        error,
      });
    }
  },

  async loadProjectTree(keyword = "") {
    const name = toText(keyword);
    this.setData({ loadingProjectTree: true });

    try {
      const response = await getProjectTree(name ? { name } : {});

      if (String((response && response.code) || "") !== SUCCESS_CODE) {
        throw new Error((response && response.msg) || "场所加载失败");
      }

      const projectList = extractProjectList(response);
      const projectOptions = normalizeProjectList(projectList);
      const selectedPatch = pickSelectedProject(
        projectOptions,
        this.data.selectedProjectId,
      );

      this.setData({
        projectOptions,
        ...selectedPatch,
      });

      if (!name && selectedPatch.selectedProjectId) {
        persistProjectId(selectedPatch.selectedProjectId);
      }

      if (!projectOptions.length) {
        if (name) {
          wx.showToast({
            title: "未找到匹配场所",
            icon: "none",
          });
        }
        return;
      }
    } catch (error) {
      console.error("[home] project tree request failed:", error);
      wx.showToast({
        title: (error && error.message) || "场所加载失败",
        icon: "none",
      });
    } finally {
      this.setData({ loadingProjectTree: false });
    }
  },

  searchProject(keyword = "") {
    const value = toText(keyword);
    this.setData(
      {
        projectKeyword: value,
      },
      () => this.loadProjectTree(value),
    );
  },

  onProjectKeywordInput(event) {
    const value = getKeywordFromEvent(event);
    this.setData({ projectKeyword: value });
  },

  onProjectSearchConfirm(event) {
    this.searchProject(getKeywordFromEvent(event, this.data.projectKeyword));
  },

  onProjectSearchTap() {
    this.searchProject(this.data.projectKeyword);
  },

  onProjectSearchReset() {
    this.searchProject("");
  },

  onProjectPanelToggle() {
    const nextOpen = !this.data.showProjectPanel;
    this.setData({
      showProjectPanel: nextOpen,
    });

    if (
      nextOpen &&
      !this.data.projectOptions.length &&
      !this.data.loadingProjectTree
    ) {
      this.loadProjectTree(this.data.projectKeyword);
    }
  },

  onProjectPanelClose() {
    if (!this.data.showProjectPanel) return;
    this.setData({
      showProjectPanel: false,
    });
  },

  onProjectPanelTap() {},

  onProjectSelect(event) {
    const index = Number(event.currentTarget.dataset.index);
    const selected = this.data.projectOptions[index];
    if (!selected) return;

    persistProjectId(selected.id);
    this.setData({
      selectedProjectId: selected.id,
      selectedProjectName: selected.name,
      showProjectPanel: false,
    });
  },
});
