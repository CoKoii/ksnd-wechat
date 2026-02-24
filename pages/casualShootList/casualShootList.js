const { getCasualShootList } = require("../../api/casualShoot");
const { getPersistedProjectId } = require("../../services/project/localState");

const normalizeProjectId = (value) => String(value || "").trim();
const STATUS_PENDING = 10018010;
const STATUS_DONE = 10018090;

const TAB_CONFIG = [
  { label: "未整改", state: STATUS_PENDING },
  { label: "已整改", state: STATUS_DONE },
];

const normalizeDateText = (value) => {
  if (value === undefined || value === null || value === "") return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.replace("T", " ").replace(/Z$/i, "");
};

const pad2 = (value) => String(value).padStart(2, "0");

const toDateTimestamp = (value) => {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }

  const text = normalizeDateText(value);
  if (!text) return 0;

  if (/^\d{10,13}$/.test(text)) {
    const numeric = Number(text);
    return text.length === 13 ? numeric : numeric * 1000;
  }

  const normalized = text
    .replace(/[./]/g, "-")
    .replace(/[年月]/g, "-")
    .replace(/日/g, "")
    .replace(/\s+/g, " ");
  const match = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
  );
  if (!match) return 0;

  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime();
};

const toDateTimeText = (value) => {
  const timestamp = toDateTimestamp(value);
  if (!timestamp) return "--";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--";

  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const parseFiles = (value) =>
  String(value || "")
    .split(",")
    .map((item) => String(item || "").trim())
    .filter(Boolean);

const toStateMeta = (value) => {
  const state = Number(value);
  if (state === STATUS_PENDING) {
    return {
      stateValue: STATUS_PENDING,
      stateText: "未整改",
      stateClass: "is-pending",
    };
  }
  if (state === STATUS_DONE) {
    return {
      stateValue: STATUS_DONE,
      stateText: "已整改",
      stateClass: "is-done",
    };
  }
  return {
    stateValue: NaN,
    stateText: "未知状态",
    stateClass: "is-unknown",
  };
};

const parseIssueListResponse = (response = {}) => {
  if (String(response.code) !== "0") {
    throw new Error(response.msg || "加载失败");
  }

  const payload = response.data || {};
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.list)) return payload.list;
  if (Array.isArray(payload.rows)) return payload.rows;
  return [];
};

const toListItem = (record = {}) => {
  const files = parseFiles(record.files);
  const stateMeta = toStateMeta(record.state);
  const createdAtRaw = record.create_time;
  const updatedAtRaw = record.update_time;
  const createdAtTimestamp = toDateTimestamp(createdAtRaw);
  const updatedAtTimestamp = toDateTimestamp(updatedAtRaw);
  const displayTimestamp = createdAtTimestamp || updatedAtTimestamp;

  return {
    ...record,
    ...stateMeta,
    firstDescription: record.name || "--",
    imageCount: files.length,
    createdAtText: toDateTimeText(createdAtRaw),
    updatedAtText: toDateTimeText(updatedAtRaw),
    sortTimestamp: displayTimestamp || 0,
  };
};

Page({
  data: {
    activeTab: 0,
    tabs: TAB_CONFIG.map((item) => item.label),
    projectId: "",
    keyword: "",
    searchValue: "",
    list: [],
    loading: false,
  },

  onLoad(options = {}) {
    const projectId = normalizeProjectId(
      options.project || getPersistedProjectId(),
    );
    this.setData({
      projectId,
    });
  },

  onShow() {
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
      const { activeTab, keyword, projectId } = this.data;
      const tab = TAB_CONFIG[activeTab] || TAB_CONFIG[0];
      const response = await getCasualShootList({
        params: {
          state: tab.state,
          name: keyword || "",
          project: projectId || "",
        },
      });
      this.allRecords = parseIssueListResponse(response);
      this.applyFilters();
    } catch (error) {
      this.allRecords = [];
      this.applyFilters();
      wx.showToast({
        title: (error && error.message) || "加载失败",
        icon: "none",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  applyFilters() {
    const list = (this.allRecords || []).map(toListItem);

    this.setData({ list });
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
      () => this.loadRecords(),
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
      () => this.loadRecords(),
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
