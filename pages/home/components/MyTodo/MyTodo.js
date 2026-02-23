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
  },
});
