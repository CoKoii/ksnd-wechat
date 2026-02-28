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
    console.log("init userInfo:",userInfo)
    this.setData({
      userRoles: userInfo.userRoles,
      userType: userInfo.userType,
    })
    if(options.upid){
      this.setData({
        projectId: options.upid
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
    param.range = 'regions'
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
      for(let i=0;i<newList.length;i++){
        dataList.push(newList[i])
      }
      console.log('reqOrderList res',res)
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
      url:'/pages/old/safe/catalog/grid?upid='+id+'&auth='+auth
    })
  },
  onCheckN(e){
    console.log('oncheckN:', e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    wx.navigateTo({
      url:'/pages/old/safe/handle/danger-list?range=region&upid='+id+'&auth='+auth
    })
  },
})