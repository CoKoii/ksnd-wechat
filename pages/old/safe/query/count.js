const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    upid: '',
    action: '',
    userRoles: [],
    userType: '',
    dataForm:{}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const userInfo = wx.getStorageSync("userInfo")
    if(!userInfo.userType){
      app.util.goto('/pages/old/safe/mine/welcome')
    }
    if(userInfo.userType=='10001006'){//第三方允许复核
      this.setData({
        showFinalBtn: true
      })
    }
    console.log("init userInfo:",userInfo)
    this.setData({
      userRoles: userInfo.userRoles,
      userType: userInfo.userType,
    })
    if(options.upid){
      this.setData({
        upid: options.upid
      })
    }
    this.fetch()
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
    console.log("onPullDownRefresh")
    this.fetch()
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
  fetch(){
    const that = this
    const param={}
    param.shop = this.data.upid
    app.api.reqRptCount(param).then(res=>{
      console.log('reqRptCount res:',res)
      that.setData({
        dataForm:res.data[0],
      })
      wx.stopPullDownRefresh()
    }).catch(e=>{
      console.log('request error:', e)
    })
  }
})