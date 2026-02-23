const {
  STATUS_PENDING,
  STATUS_DONE,
  listCasualShootRecords,
  formatDateTime,
} = require("../../services/casualShoot/store");

const TAB_CONFIG = [
  { label: "未整改", status: STATUS_PENDING },
  { label: "已整改", status: STATUS_DONE },
];
const normalizeTaskId = (value) => String(value || "").trim();

const toSearchText = (record = {}) =>
  (Array.isArray(record.items)
    ? record.items.map((item) => (item && item.description) || "")
    : [])
    .join(" ")
    .toLowerCase();

const toListItem = (record = {}) => {
  const items = Array.isArray(record.items) ? record.items : [];
  const firstDescription =
    (items.find((item) => item && item.description) || {}).description || "--";
  const imageCount = items.reduce((sum, item) => {
    const images = (item && item.images) || [];
    return sum + (Array.isArray(images) ? images.length : 0);
  }, 0);

  return {
    ...record,
    firstDescription,
    itemCount: items.length,
    imageCount,
    createdAtText: formatDateTime(record.createdAt),
  };
};

Page({
  data: {
    activeTab: 0,
    tabs: TAB_CONFIG.map((item) => item.label),
    taskId: "",
    keyword: "",
    searchValue: "",
    list: [],
  },

  onLoad(options = {}) {
    this.setData({
      taskId: normalizeTaskId(options.taskId || options.task),
    });
    this.loadRecords();
  },

  onShow() {
    this.loadRecords();
  },

  loadRecords() {
    this.allRecords = listCasualShootRecords();
    this.applyFilters();
  },

  applyFilters() {
    const { activeTab, keyword } = this.data;
    const tab = TAB_CONFIG[activeTab] || TAB_CONFIG[0];
    const searchText = String(keyword || "").trim().toLowerCase();

    const list = (this.allRecords || [])
      .filter((item) => item.status === tab.status)
      .filter((item) => !searchText || toSearchText(item).includes(searchText))
      .map(toListItem);

    this.setData({ list });
  },

  onTabChange(e) {
    this.setData(
      {
        activeTab: Number(e.currentTarget.dataset.index) || 0,
      },
      () => this.applyFilters()
    );
  },

  onSearchInput(e) {
    const value = (e.detail && e.detail.value) || "";
    this.setData({ searchValue: value });
  },

  onSearchConfirm(e) {
    const value =
      (e && e.detail && e.detail.value !== undefined
        ? e.detail.value
        : this.data.searchValue) || "";
    const keyword = String(value).trim();
    this.setData(
      {
        keyword,
        searchValue: keyword,
      },
      () => this.applyFilters()
    );
  },

  onSearchTap() {
    this.onSearchConfirm({
      detail: {
        value: this.data.searchValue,
      },
    });
  },

  onSearchReset() {
    this.setData(
      {
        keyword: "",
        searchValue: "",
      },
      () => this.applyFilters()
    );
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;
    const taskId = normalizeTaskId(e.currentTarget.dataset.task || this.data.taskId);
    const query = [`id=${encodeURIComponent(id)}`];
    if (taskId) {
      query.push(`taskId=${encodeURIComponent(taskId)}`);
    }

    wx.navigateTo({
      url: `/pages/casualShootCreate/casualShootCreate?${query.join("&")}`,
    });
  },

  goToCreate() {
    const query = this.data.taskId
      ? `?taskId=${encodeURIComponent(this.data.taskId)}`
      : "";
    wx.navigateTo({
      url: `/pages/casualShootCreate/casualShootCreate${query}`,
    });
  },
});
