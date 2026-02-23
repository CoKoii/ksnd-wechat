Page({
  data: {
    list: [
      {
        title: "巡检任务",
        children: [
          { title: "巡检计划", icon: "icon-plan", path: "/task/plan" },
          { title: "任务调整", icon: "icon-adjust", path: "/task/adjust" },
          { title: "临时任务", icon: "icon-temp", path: "/task/temp" },
          { title: "整改工单", icon: "icon-rectify-order", path: "/task/rectify-order" },
          { title: "工单查询", icon: "icon-order-search", path: "/task/order-search" },
          { title: "发起整改", icon: "icon-start-rectify", path: "/task/start-rectify" },
        ],
      },
      {
        title: "基础配置",
        children: [
          { title: "人员管理", icon: "icon-user", path: "/config/user" },
          { title: "巡检类型", icon: "icon-type", path: "/config/type" },
          { title: "巡检内容", icon: "icon-content", path: "/config/content" },
          { title: "对象类型", icon: "icon-object", path: "/config/object" },
          { title: "档案", icon: "icon-archive", path: "/config/archive" },
          { title: "线路管理", icon: "icon-line", path: "/config/line" },
          { title: "B1绑定", icon: "icon-bind", path: "/config/bind-b1" },
          { title: "巡检点", icon: "icon-point", path: "/config/point" },
        ],
      },
      {
        title: "统计报表",
        children: [
          { title: "项目统计", icon: "icon-project-report", path: "/report/project" },
          { title: "任务统计", icon: "icon-task-report", path: "/report/task" },
          { title: "绩效统计", icon: "icon-performance", path: "/report/performance" },
          { title: "异常统计", icon: "icon-abnormal", path: "/report/abnormal" },
        ],
      },
    ],
  },
});
