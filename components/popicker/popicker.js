// components/popicker/popicker.js
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    //控制组件显示
    isShow: {
      type: Boolean,
      value: false
    },
    //数据列表
    dataList:{
      type: Array,
      value: []
    },
    //已选中的初始值id
    dataValue:{
      type: String,
      value: ''
    }
  },

  data: {
    selectValue: ''
  },

  methods: {
    selectChange(e) {
      const index = e.detail.value[0]
      if(index >= 0){
        this.setData({
          selectValue: this.properties.dataList[index]
        })
      }else{
        this.setData({
          selectValue: {id:'',name:''}
        })
      }
    },
    onCancel(e){
      this.setData({
        isShow: false,
        selectValue: {id:'',name:''},
        value:[0]
      })
      //this.triggerEvent('selectItem', this.data.selectValue)
    },
    onConfirm(e){
      this.setData({
        isShow: false
      })
      this.triggerEvent('selectItem', this.data.selectValue)
    },
  }
})