// components/Tabs/Tabs.js
Component({
  properties: {
    tabs: {
      // 类型
      type: Array,
      // 默认值
      value: []
    },
    active: {
      // 类型
      type: Number,
      // 默认值
      value: 0
    }
  },
 
  data: {  },

  methods: {
    handleItemTap (e) {
      const { index } = e.currentTarget.dataset;
      this.setData({
        active: index
      })
      this.triggerEvent("tabSwitch", { index: index });
    }
  }
})