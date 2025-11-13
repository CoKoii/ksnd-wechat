// pages/todoList/todoList.js
Page({
  data: {
    activeTab: 0,
    tabs: ["待进行", "进行中", "已超时", "已完成"],
    todoList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false,
  },

  onLoad(options) {
    this.loadTodoList();
  },

  onTabChange(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      activeTab: index,
      todoList: [],
      page: 1,
      hasMore: true,
    });
    this.loadTodoList();
  },

  loadTodoList() {
    if (this.data.loading || !this.data.hasMore) {
      return;
    }

    this.setData({ loading: true });

    setTimeout(() => {
      const newData = this.generateMockData(this.data.page, this.data.pageSize);

      this.setData({
        todoList: [...this.data.todoList, ...newData],
        page: this.data.page + 1,
        loading: false,
        hasMore: newData.length === this.data.pageSize,
      });
    }, 500);
  },

  generateMockData(page, pageSize) {
    const data = [];
    const statusMap = ["待进行", "进行中", "已超时", "已完成"];
    const taskNames = [
      "巡逻大通河",
      "设备维护任务",
      "安全检查",
      "日常巡检",
      "故障维修",
    ];
    const sources = ["通道监测", "设备巡检", "安全管理"];
    const types = ["事件处理", "日常巡检", "设备维护"];
    const locations = ["大通河北岸", "南区设备间", "东区监控室", "西区配电房"];

    const start = (page - 1) * pageSize;
    const maxItems = 30;

    if (start >= maxItems) {
      return [];
    }

    const itemsToGenerate = Math.min(pageSize, maxItems - start);

    for (let i = 0; i < itemsToGenerate; i++) {
      const index = start + i;
      const status = statusMap[this.data.activeTab];

      data.push({
        id: index,
        title: taskNames[index % taskNames.length],
        status: status,
        badge: status === "已超时" ? "紧急" : "",
        location: locations[index % locations.length],
        source: sources[index % sources.length],
        taskSource: sources[index % sources.length],
        taskType: types[index % types.length],
        issuer: "刘大可",
        deadline: "2019-04-09",
        publishDate: "2019-03-30",
      });
    }

    return data;
  },

  onReachBottom() {
    this.loadTodoList();
  },

  onPullDownRefresh() {
    this.setData({
      todoList: [],
      page: 1,
      hasMore: true,
    });
    this.loadTodoList();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/checkInfo/checkInfo?id=${id}`,
    });
  },
});
