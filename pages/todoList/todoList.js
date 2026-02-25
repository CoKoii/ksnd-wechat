// pages/todoList/todoList.js
const { getTaskList } = require("../../api/task");
const { getPersistedProjectId } = require("../../services/project/localState");
const {
  getPersistedLoginId,
  shouldReloadTodoList,
  clearTodoListReloadFlag,
} = require("../../services/task/localState");
const {
  parseTaskListResponse,
  calcHasMore,
  formatDateToYmd,
  pickPublishDateValue,
} = require("./utils");

const TAB_CONFIG = [
  { label: "待检查", state: 10018010 },
  // { label: "进行中", state: 10018020 },
  // { label: "已超时", state: undefined },
  { label: "已检查", state: 10018090 },
];

const getStateByTab = (tabIndex) => {
  const tab = TAB_CONFIG[tabIndex];
  return tab ? tab.state : undefined;
};
const pickNextValue = (value, fallback) =>
  value === undefined ? fallback : value;
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
    keyword: "",
    searchValue: "",
    todoList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
  },

  onLoad() {
    this.loadTodoList();
  },

  onShow() {
    if (!shouldReloadTodoList()) return;
    clearTodoListReloadFlag();
    this.resetList();
    this.loadTodoList();
  },

  resetList(options = {}) {
    this.setData({
      activeTab: pickNextValue(options.activeTab, this.data.activeTab),
      keyword: pickNextValue(options.keyword, this.data.keyword),
      searchValue: pickNextValue(options.searchValue, this.data.searchValue),
      todoList: [],
      page: 1,
      hasMore: true,
    });
  },

  applySearch(keyword) {
    this.resetList({
      keyword,
      searchValue: keyword,
    });
    this.loadTodoList();
  },

  onTabChange(e) {
    this.resetList({
      activeTab: Number(e.currentTarget.dataset.index),
    });
    this.loadTodoList();
  },

  onSearchInput(e) {
    const value = (e.detail && e.detail.value) || "";
    this.setData({
      searchValue: value,
    });
  },

  onSearchConfirm(e) {
    this.applySearch(getSearchKeyword(e, this.data.searchValue));
  },

  onSearchTap() {
    this.applySearch(getSearchKeyword(null, this.data.searchValue));
  },

  onSearchReset() {
    this.resetList({
      keyword: "",
      searchValue: "",
    });
    this.loadTodoList();
  },

  async loadTodoList() {
    const {
      activeTab,
      page,
      pageSize,
      loading,
      hasMore,
      todoList,
      keyword,
    } = this.data;
    if (loading || !hasMore) return;

    const state = getStateByTab(activeTab);
    if (state === undefined || state === null) {
      this.setData({ todoList: [], hasMore: false, loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const checker = getPersistedLoginId();
      const project = getPersistedProjectId();
      const res = await getTaskList({
        pno: page,
        psize: pageSize,
        params: {
          state,
          checker,
          project: project || "",
          name: keyword || "",
        },
      });
      const { list: nextList, total, pageCount } = parseTaskListResponse(res);
      const normalizedList = nextList.map((item) => ({
        ...item,
        publishDate: formatDateToYmd(pickPublishDateValue(item)),
      }));
      const mergedList =
        page === 1 ? normalizedList : todoList.concat(normalizedList);
      const nextHasMore = calcHasMore({
        mergedLength: mergedList.length,
        listLength: normalizedList.length,
        page,
        pageSize,
        total,
        pageCount,
      });

      this.setData({
        todoList: mergedList,
        page: page + 1,
        hasMore: nextHasMore,
      });
    } catch (error) {
      if (page === 1) this.setData({ todoList: [] });
      this.setData({ hasMore: false });
      wx.showToast({
        title: (error && error.message) || "加载失败",
        icon: "none",
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  onReachBottom() {
    this.loadTodoList();
  },

  async onPullDownRefresh() {
    this.resetList();
    await this.loadTodoList();
    wx.stopPullDownRefresh();
  },

  goToDetail(e) {
    wx.navigateTo({
      url: `/pages/checkInfo/checkInfo?id=${e.currentTarget.dataset.id}`,
    });
  },
});
