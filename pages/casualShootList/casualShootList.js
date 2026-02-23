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
  const status = record.status === STATUS_DONE ? STATUS_DONE : STATUS_PENDING;

  return {
    ...record,
    firstDescription,
    itemCount: items.length,
    imageCount,
    createdAtText: formatDateTime(record.createdAt),
    statusText: status === STATUS_DONE ? "已整改" : "未整改",
    statusClass: status === STATUS_DONE ? "is-done" : "is-pending",
  };
};

Page({
  data: {
    activeTab: 0,
    tabs: TAB_CONFIG.map((item) => item.label),
    keyword: "",
    searchValue: "",
    list: [],
  },

  onLoad() {
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
    wx.navigateTo({
      url: `/pages/casualShootCreate/casualShootCreate?id=${encodeURIComponent(id)}`,
    });
  },

  goToCreate() {
    wx.navigateTo({
      url: "/pages/casualShootCreate/casualShootCreate",
    });
  },
});
