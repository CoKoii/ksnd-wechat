Component({
  options: {
    styleIsolation: "apply-shared",
  },
  properties: {},
  data: {
    todoList: [
      {
        id: 1,
        name: "巡检任务",
        badge: "超时3单",
        count: 4,
        completed: 0,
        type: "剩余工单",
      },
      {
        id: 2,
        name: "设备维护",
        badge: "待处理2单",
        count: 3,
        completed: 1,
        type: "剩余工单",
      },
      {
        id: 3,
        name: "安全检查",
        badge: "正常",
        count: 1,
        completed: 5,
        type: "剩余工单",
      },
    ],
  },
  methods: {
    goToTodoList() {
      wx.navigateTo({
        url: "/pages/todoList/todoList",
      });
    },
    goToDetail(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/checkInfo/checkInfo?id=${id}`,
      });
    },
  },
});
