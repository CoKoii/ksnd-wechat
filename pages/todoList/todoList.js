// pages/todoList/todoList.js
const { getTaskList } = require("../../api/task");
const {
  parseTaskListResponse,
  calcHasMore,
  formatDateToYmd,
  pickTaskDateValue,
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

Page({
  data: {
    activeTab: 0,
    tabs: TAB_CONFIG.map((item) => item.label),
    todoList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
  },

  onLoad() {
    this.loadTodoList();
  },

  resetList(activeTab = this.data.activeTab) {
    this.setData({
      activeTab,
      todoList: [],
      page: 1,
      hasMore: true,
    });
  },

  onTabChange(e) {
    this.resetList(Number(e.currentTarget.dataset.index));
    this.loadTodoList();
  },

  async loadTodoList() {
    const { activeTab, page, pageSize, loading, hasMore, todoList } = this.data;
    if (loading || !hasMore) return;

    const state = getStateByTab(activeTab);
    if (state === undefined || state === null) {
      this.setData({ todoList: [], hasMore: false, loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await getTaskList({ pageNum: page, pageSize, state });
      const { list: nextList, total, pageCount } = parseTaskListResponse(res);
      const normalizedList = nextList.map((item) => ({
        ...item,
        createDate: formatDateToYmd(pickTaskDateValue(item)),
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
