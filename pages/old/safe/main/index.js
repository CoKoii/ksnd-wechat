// pages/gwcustom/main/index.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLogin:false,
    userRole: '',
    userType: '',
    authMap:null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUserInfo()
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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0 // 控制哪一项是选中状态
      })
    }
    const userInfo = wx.getStorageSync("userInfo")
    console.log('userInfo:',userInfo)
    if(userInfo){
      this.setData({
        isLogin:true
      })
    }else{
      this.setData({
        isLogin:false
      })
    }
    this.init()
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
  init:function(){
    const that = this
    if(!this.data.isLogin){
      console.log('is not Login:')
      return
    }
    if(this.data.authMap){
      console.log('this.AuthMap has load:',this.data.authMap)
      return
    }
    app.api.reqAuthMap().then(res=>{
      console.log('reqAuthMap res:',res)
      that.setData({
        authMap:res.authMap
      })
    })
  },
  onHandleDanger(e){
    let urlPath = ''
    const userData = wx.getStorageSync("userInfo")
    const userType = userData.userType
    console.log('this.AuthMap:',this.authMap)
    if(userType==='10001002' || userType==='10001006'){
      urlPath='/pages/old/safe/catalog/region'
    }else if(userType==='10001003' && this.data.authMap.grids && this.data.authMap.grids.length>0){
      urlPath='/pages/old/safe/catalog/grid'
    }else  if(userType==='10001004' && this.data.authMap.projects && this.data.authMap.projects.length>0){
      urlPath='/pages/old/safe/catalog/project'
    }else{
      urlPath='/pages/old/safe/catalog/shop'
    }
    //urlPath='/pages/old/safe/catalog/region'
    wx.navigateTo({
      url:urlPath
    })
  },
  onImproveRecord(e){
    wx.navigateTo({
      //url:'/pages/old/safe/query/shop?action=1'
      url:'/pages/old/safe/query/danger?action=1'
    })
  },
  onFinalRecord(e){
    wx.navigateTo({
      url:'/pages/old/safe/query/shop?action=2'
    })
  },
  onShopCount(e){
    wx.navigateTo({
      url:'/pages/old/safe/query/shop?action=99'
    })
  },
  getUserInfo: function () {
    const that = this
    wx.login({
      success: function (wxres) {
        if (wxres.code) {
          console.log('wx.login',wxres)
          wx.request({ //读取服务端用户信息
            url: getApp().globalData.serverHost + '/auth/wxlogin',
            data:{
              "wxCode":wxres.code
            },
            method: "post",
            success: function (response) {
              const res = response.data.data
              console.log("openid res:",res)
              const wxInfo = {}
              wxInfo.wid = res.wid
              wx.setStorageSync("wxInfo", wxInfo)
              if(res.status==1){ //已有用户 直接获取用户信息与登录信息
                const token = res.token.tokenValue
                wx.setStorageSync("access_token", token)
                const userInfo={}
                userInfo.userId=res.id
                userInfo.userCode=res.name
                userInfo.userName=res.nickname
                userInfo.realName=res.realname
                userInfo.phone=res.phone
                userInfo.userType=res.type
                userInfo.userRoles=res.roles
                userInfo.userRole=res.roles[0]
                userInfo.avatar=res.avatar
                userInfo.menuType="2"
                wx.setStorageSync("userInfo", userInfo)
                that.setData({
                  isLogin:true
                })
                that.init()
              }
            }
          })
        }
      }
    })
  }
})