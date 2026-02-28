const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        t:'',
        canIUse: wx.canIUse('button.open-type.getUserInfo'),
        phoneLogin: false,
        itemChecked: false
    },
    onGetUserProfile: function (e) {
      if(!this.data.itemChecked){
        wx.showToast({
          title: '请先阅读并确认勾选用户使用协议与隐私协议',
          icon: 'none'
        })
        return
      }
    },
    onCheckItem(e){
      let checked = this.data.itemChecked
      this.setData({
        itemChecked:!checked,
      })
    },
    onUserItem1(){
      console.log('onUserItem1')
    },
    onUserItem2(){
      console.log('onUserItem2')
    },
    getPhoneNumber (e) {
      console.log("getPhoneNumber:",e.detail)
      const authCode = e.detail.code
      if(!authCode){
        wx.showToast({
          title: '获取手机号失败，请重新授权',
          icon: 'none'
        })
        return
      }
      const params = wx.getStorageSync("wxInfo")
      if(params){
        params.authCode = authCode
        //params.phone = "15850765617"
        wx.request({ //读取服务端用户信息
          url: getApp().globalData.serverHost + '/auth/wxPhonelogin',
          data:params,
          method: "post",
          success: function (response) {
            const res = response.data.data
            console.log("phone auth res:",res)
            if(res.status==1 || res.status==2){ //已有用户或者新用户 直接获取用户信息与登录信息
              const userInfo={}
              const token = res.token.tokenValue
              wx.setStorageSync("access_token", token)
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
              wx.switchTab({
                url: '/pages/old/safe/main/index',
              })
            }else{
              app.util.showWarning('出错：'+res.msg)
            }
          },
          fail: function (err) {
            console.log("authCode err:",err)
          }
        })
      }else{
        app.util.showWarning('login error:当前小程序不支持快速获取手机号')
      }
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
      console.log('welcome')
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },
    onUserItem(e){
      wx.navigateTo({
        url:'/pages/old/safe/mine/userItem'
      })
    },
    onPrivacyItem(e){
      wx.navigateTo({
        url:'/pages/old/safe/mine/privacyItem'
      })
    },

    goBack(){
      wx.navigateBack({
        delta: 1
      })
    }
})