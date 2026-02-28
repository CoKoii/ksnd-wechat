const TODO_ENTRIES = [
  {
    key: "todo-task",
    title: "我的任务",
    desc: "查看并处理当前待办任务",
    action: "todoList",
  },
  {
    key: "casual-shoot",
    title: "随手拍",
    desc: "进入随手拍列表",
    action: "casualShootList",
  },
  {
    key: "safe-data",
    title: "安全隐患数据",
    desc: "进入安全隐患数据列表",
    action: "goSafeData",
  },
  {
    key: "improve-record",
    title: "整改记录",
    desc: "查看隐患整改记录",
    action: "goImproveRecord",
  },
];

const NAVIGATE_ACTIONS = {
  todoList: "/pages/todoList/todoList",
  casualShootList: "/pages/casualShootList/casualShootList",
};

const EVENT_ACTIONS = {
  goSafeData: "goSafeData",
  goImproveRecord: "goImproveRecord",
};

Component({
  options: {
    styleIsolation: "apply-shared",
  },
  data: {
    entries: TODO_ENTRIES,
  },
  methods: {
    onEntryTap(event) {
      const action = String(event.currentTarget.dataset.action || "");
      const pagePath = NAVIGATE_ACTIONS[action];
      if (pagePath) {
        wx.navigateTo({ url: pagePath });
        return;
      }

      const eventName = EVENT_ACTIONS[action];
      if (eventName) {
        this.triggerEvent(eventName);
      }
    },
  },
});
