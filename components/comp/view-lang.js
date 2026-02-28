// components/comp/view-lang.js
const app = getApp()
Component({

  /**
   * 组件的属性列表
   */
  properties: {
    //使用语言 -en -zh
    lang:{
      type: String,
      value: ''
    },
    //已选中的初始值id
    key:{
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    label:''
  },

  lifetimes: {
    created() {
    },
    attached() {
      let lang = wx.getStorageSync("lang")
      if(this.properties.lang){//优先取组件传值，没有取缓存 再没有取中文
        lang = this.properties.lang
      }
      if(!lang){
        lang = 'zh'
      }
      const label = app.data.langs[lang][this.properties.key]
      console.log(lang,label,this.properties.key)
      if(label){
        this.setData({
          label: label
        })
      }
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {

  }
})