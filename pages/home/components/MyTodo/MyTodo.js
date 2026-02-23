Component({
  options: {
    styleIsolation: "apply-shared",
  },
  properties: {},
  data: {},
  methods: {
    goToTodoList() {
      wx.navigateTo({ url: "/pages/todoList/todoList" });
    },
    goToCasualShootList() {
      wx.navigateTo({ url: "/pages/casualShootList/casualShootList" });
    },
  },
});
