Component({
  options: {
    styleIsolation: "apply-shared",
  },
  methods: {
    goToTodoList() {
      wx.navigateTo({ url: "/pages/todoList/todoList" });
    },
    goToCasualShootList() {
      wx.navigateTo({ url: "/pages/casualShootList/casualShootList" });
    },
  },
});
