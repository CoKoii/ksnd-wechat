const { getCasualShootList } = require("../../api/casualShoot");
const { resolveImagePreview } = require("../../services/file/image");
const { getPersistedProjectId } = require("../../services/project/localState");
const {
  CASUAL_SHOOT_TAB_CONFIG,
  normalizeProjectId,
  normalizeTaskId,
  withCasualShootPreviewPlaceholders,
  hydrateCasualShootListPreviewImages,
  parseCasualShootListResponse,
  toCasualShootListItem,
} = require("../../utils/casualShoot");

const TAB_CONFIG = CASUAL_SHOOT_TAB_CONFIG;
const getSearchKeyword = (event, fallbackValue = "") => {
  const value =
    event && event.detail && event.detail.value !== undefined
      ? event.detail.value
      : fallbackValue;
  return String(value || "").trim();
};

Page({
  data: {
    activeTab: 0,
    tabs: TAB_CONFIG.map((item) => item.label),
    projectId: "",
    taskId: "",
    keyword: "",
    searchValue: "",
    list: [],
    loading: false,
  },

  onLoad(options = {}) {
    const projectId = normalizeProjectId(
      options.project || getPersistedProjectId(),
    );
    const taskId = normalizeTaskId(options.taskId || options.task);
    this.setData({ projectId, taskId });
  },

  onShow() {
    if (this._skipNextShowReload) {
      this._skipNextShowReload = false;
      return;
    }

    const latestProjectId = normalizeProjectId(getPersistedProjectId());
    if (latestProjectId === this.data.projectId) {
      this.loadRecords();
      return;
    }
    this.setData(
      {
        projectId: latestProjectId,
      },
      () => this.loadRecords(),
    );
  },

  async loadRecords() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const { activeTab, keyword, projectId, taskId } = this.data;
      const tab = TAB_CONFIG[activeTab] || TAB_CONFIG[0];
      const params = {
        state: tab.state,
        name: keyword || "",
        project: projectId || "",
      };
      if (taskId) params.task = taskId;
      const response = await getCasualShootList({
        params,
      });
      const rawList = parseCasualShootListResponse(response).map(
        toCasualShootListItem,
      );
      this.setData({
        list: withCasualShootPreviewPlaceholders(rawList),
      });
      try {
        const hydratedList = await hydrateCasualShootListPreviewImages(rawList, {
          resolvePreview: resolveImagePreview,
        });
        this.setData({ list: hydratedList });
      } catch (error) {
        // ignore preview hydration failures for list thumbnails
      }
    } catch (error) {
      this.setData({ list: [] });
      wx.showToast({
        title: (error && error.message) || "加载失败",
        icon: "none",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  applySearch(keyword) {
    this.setData(
      {
        keyword,
        searchValue: keyword,
      },
      () => this.loadRecords(),
    );
  },

  onTabChange(e) {
    this.setData(
      {
        activeTab: Number(e.currentTarget.dataset.index) || 0,
      },
      () => this.loadRecords(),
    );
  },

  onSearchInput(e) {
    const value = (e.detail && e.detail.value) || "";
    this.setData({ searchValue: value });
  },

  onSearchConfirm(e) {
    this.applySearch(getSearchKeyword(e, this.data.searchValue));
  },

  onSearchTap() {
    this.applySearch(getSearchKeyword(null, this.data.searchValue));
  },

  onSearchReset() {
    this.setData(
      {
        keyword: "",
        searchValue: "",
      },
      () => this.loadRecords(),
    );
  },

  onPreviewRecordImage(e) {
    const recordIndex = Number(e.currentTarget.dataset.recordIndex);
    const imageIndex = Number(e.currentTarget.dataset.imageIndex);
    if (Number.isNaN(recordIndex) || Number.isNaN(imageIndex)) return;

    const record = (this.data.list || [])[recordIndex] || {};
    const previewImages = Array.isArray(record.previewImages)
      ? record.previewImages
      : [];
    const urls = previewImages
      .map((img) => String((img && img.url) || "").trim())
      .filter(Boolean);
    if (!urls.length) return;

    this._skipNextShowReload = true;
    wx.previewImage({
      current: urls[imageIndex] || urls[0],
      urls,
      fail: () => {
        this._skipNextShowReload = false;
      },
    });
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: `/pages/casualShootCreate/casualShootCreate?id=${encodeURIComponent(id)}`,
    });
  },

  goToCreate() {
    const taskId = normalizeTaskId(this.data.taskId);
    wx.navigateTo({
      url: taskId
        ? `/pages/casualShootCreate/casualShootCreate?taskId=${encodeURIComponent(taskId)}`
        : "/pages/casualShootCreate/casualShootCreate",
    });
  },
});
