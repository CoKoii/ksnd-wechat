const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    upid: '',
    auth: 0,
    userRoles: [],
    userType: '',
    dataList: [],
    totalPage: 0,
    currentPage: 1,
    pageSize: 10,
    stext: '',
    query: {
      page:'',
      pageSize: '',
      stext: ''
    },

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const userInfo = wx.getStorageSync("userInfo")
    if(!userInfo.userType){
      app.util.goto('/pages/old/safe/mine/welcome')
    }
    this.setData({
      userRoles: userInfo.userRoles,
      userType: userInfo.userType,
    })
    console.log("init userInfo:",userInfo)
    if(options.upid){
      this.setData({
        upid: options.upid
      })
    }
    if(options.auth){
      this.setData({
        auth: options.auth
      })
    }
    this.getList()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if(this.data.upid){
      this.getList()
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
  getList(){
    const param={}
    param.range = 'projects'
    if(this.data.upid){
      param.upId = this.data.upid
    }
    if(this.data.auth){
      param.auth = this.data.auth
    }
    console.log('reqRptCatalog param:',param)
    app.api.reqRptCatalog(param).then(res=>{
      console.log('reqRptCatalog res:',res)
      let dataList=this.data.dataList
      const newList = app.util.paramNull2Empty(res.data)
      for(let item of newList){//项目管理员仅展示管理的项目
        if(this.data.userType=='10001004'){
          if(item.auth == 1){
            dataList.push(item)
          }
        }else{
          dataList.push(item)
        }
      }
      console.log('reqRptCatalog res',res)
      this.setData({
        totalPage:res.pcnt,
        dataList:dataList
      })
    }).catch(e=>{
      console.log('request error:', e)
    })
  },
  onHandle(e){
    console.log('onHandle:',e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    wx.navigateTo({
      url:'/pages/old/safe/catalog/shop?upid='+id+'&auth='+auth
    })
  },
  onCheckN(e){
    console.log('oncheckN:', e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    wx.navigateTo({
      url:'/pages/old/safe/handle/danger-list?range=project&res=checkN&upid='+id+'&auth='+auth
    })
  },
  onCheckY(e){
    console.log('onCheckY:', e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    wx.navigateTo({
      url:'/pages/old/safe/handle/danger-list?range=project&res=checkY&upid='+id+'&auth='+auth
    })
  },
  onFinalY(e){
    console.log('onFinalY:', e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    wx.navigateTo({
      url:'/pages/old/safe/handle/danger-list?range=project&res=finalY&upid='+id+'&auth='+auth
    })
  },
  onFinalN(e){
    console.log('onFinalN:', e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    wx.navigateTo({
      url:'/pages/old/safe/handle/danger-list?range=project&res=finalN&upid='+id+'&auth='+auth
    })
  },
  onFinalNtoFinal(e){
    console.log('onFinalNtoFinal:', e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    wx.navigateTo({
      url:'/pages/old/safe/handle/danger-list?range=project&res=finalNtoFinal&upid='+id+'&auth='+auth
    })
  },
})