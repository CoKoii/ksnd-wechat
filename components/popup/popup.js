// components/select/common/popup.js
// 使用说明 
// 属性 bindselectItem="methodName" 绑定调用方的methodName方法 返回e.detail为选中的对象数据
const app = getApp()
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
    //数据列表 可传入或者远程搜索生成
    dataList:{
      type: Array,
      value: []
    },
    //已选中的初始值id
    dataValue:{
      type: String,
      value: ''
    },
    //远程搜索请求地址
    //如此字段为空，则不执行远程搜索，展示选项完全依赖于dataList，请保证传入数据包含字段（id,name,number）
    searchUrl: {
      type: String,
      value: ''
    },
    //远程搜索框的值对应的后端参数字段 
    //如远程后端接受查找为 param.userName字段，则searchField为userName
    searchField: {
      type: String,
      value: ''
    },
    //远程搜索参数 如页码等
    searchParams: {
      type: String,
      value: ''
    },
    //结果映射 将后端返回值映射为id name number的规范数据
    //如查找用户返回字段userId，userName，userNumber  可设置映射{id:'userId',name:'userName',number:'userNumber'}
    resMap: {
      type: Object,
      value: {id:'id',name:'name',number:'number'}
    },
    //搜索弹出框标题
    name: {
      type: String,
      value: '请选择'
    }
  },
  /**
   * 组件的初始数据
   */
  data: {
    inputShow: false,
    inputVal: "",
    loading: false,
    selectValue:'',
    dialogBtns:[
      {
        className:'flow-btn-primary',
        text:'确定',
        value:0
      },{
        className:'flow-btn-normal',
        text:'取消',
        value:1
      }
    ],
  },

  lifetimes: {
    created() {
    },
    show(){
    }
  },
  /**
   * 组件的方法列表
   */
  methods: {
    //选中选项 触发事件
    selectItem: function (e) {
      let it = e.currentTarget.dataset.item
      this.setData({inputVal: "",inputShow: false,isShow: false,dataList: []});
      this.triggerEvent('selectItem', it)
    },
    showInput: function () {
      this.setData({inputShow: true});
    },
    hideInput: function () {
      this.setData({inputVal: "",inputShow: false,dataList: []});
    },
    clearInput: function () {
      this.setData({inputVal: "",dataList: []});
    },
    inputTyping: function (e) {
      this.setData({loading: true,inputVal: e.detail.value})
      const param={...this.properties.searchParams}
      if(this.properties.searchField && e.detail.value){
        param[this.properties.searchField] = e.detail.value
      }
      app.request.req({
        method:'get',
        url: this.properties.searchUrl,
        data:param
      }).then(res=>{
        if(res.data instanceof Array && res.data.length>0){
          const resList=[]
          for(let i=0;i<res.data.length;i++){
            const it = {...res.data[i]}
            it.id=res.data[i][this.properties.resMap.id]
            it.name=res.data[i][this.properties.resMap.name]
            it.number=res.data[i][this.properties.resMap.number]
            resList.push(it)
          }
          this.setData({loading: false, dataList: resList})
        }else{
          console.log('search no data')
          this.setData({
            loading: false, 
            dataList: [],
            selectValue: {value: e.detail.value}
          });
        }
      }).catch(err=>{
        this.setData({loading: false})
      })
    },
    radioChange: function(e) {
      const checkValue = e.detail.value;
      this.properties.dataList.map(item => {
        if (item.id === checkValue) {
          item.checked = true;
          this.setData({
            selectValue: item,
            dataValue: item.id
          });
        } else {
          item.checked = false;
        }
        return item;
      })
    },
    onDialogBtnTab(e){
      const index = e.detail.index
      if(index==0){
        this.setData({
          isShow: false,
          inputShow: false,
          dataValue: this.data.selectValue.id,
          dataList: []
        });
        this.triggerEvent('selectItem', this.data.selectValue)
      }else if(index==1){
        this.setData({isShow: false});
      }
    },
  }
})
