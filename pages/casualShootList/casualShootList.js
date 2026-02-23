const normalizeTaskId = (value) => String(value || "").trim();
const STATUS_PENDING = 10018010;
const STATUS_DONE = 10018090;

const TAB_CONFIG = [
  { label: "未整改", state: STATUS_PENDING },
  { label: "已整改", state: STATUS_DONE },
];

const toSearchText = (record = {}) =>
  String(record.name || record.description || "")
    .trim()
    .toLowerCase();

const normalizeDateText = (value) => {
  if (value === undefined || value === null || value === "") return "--";
  return String(value);
};

const toListItem = (record = {}) => {
  const files = String(record.files || "")
    .split(",")
    .map((item) => String(item || "").trim())
    .filter(Boolean);

  return {
    ...record,
    firstDescription: record.name || record.description || "--",
    itemCount: Number(record.itemCount) || 1,
    imageCount: files.length,
    createdAtText: normalizeDateText(
      record.createdAt || record.create_time || record.createTime
    ),
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
    loading: false,
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

  async loadRecords() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      // 本地存储已移除。列表接口接入前先保留页面结构与交互。
      this.allRecords = [];
      this.applyFilters();
    } finally {
      this.setData({ loading: false });
    }
  },

  applyFilters() {
    const { activeTab, keyword } = this.data;
    const tab = TAB_CONFIG[activeTab] || TAB_CONFIG[0];
    const searchText = String(keyword || "").trim().toLowerCase();

    const list = (this.allRecords || [])
      .filter((item) => Number(item.state || 0) === tab.state)
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
