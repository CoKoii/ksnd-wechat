// pages/gwcustom/mine/index.js
const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isLogin:false,
    userCode:'',
    userName: '',
    phone: '',
    roles: '',
    role: '',
    userType: '',
    userTypeName: '',
    avatarUrl: defaultAvatarUrl,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {


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
    const that = this
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1 // 控制哪一项是选中状态
      })
    }
    const userInfo = wx.getStorageSync("userInfo")
    console.log('userInfo:',userInfo)
    if(userInfo){
      const userTypeList = app.data.userTypeList
      console.log('userTypeList:',userTypeList)
      for(let item of userTypeList){
        if(item.id==userInfo.userType){
          this.setData({
            userTypeName: item.label
          })
        }
      }
      this.setData({
        isLogin:true,
        userCode:userInfo.userCode,
        userName: userInfo.userName,
        phone: userInfo.phone,
        roles: userInfo.userRoles,
        role: userInfo.role,
        userType: userInfo.userType,
        //avatarUrl:userInfo.avatar
      })
      //读取头像
      app.api.reqFileShow(userInfo.avatar).then(res=>{
        const path = res.data
        that.setData({
          avatarUrl:path
        })
      })
    }else{
      this.setData({
        isLogin:false
      })
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
  onSwitchUser(){
    const roles = []
    const roleList = []
    const data={}
    data.wid = wx.getStorageSync("userInfo").wid
    app.api.reqUserAccounts(data).then(res =>{
      for(let i = 0;i<res.length;i++){
        roles.push(res[i].realName)
        roleList.push(res[i])
      }
      wx.showActionSheet({
        itemList: roles,
        success: (res) => {
          const selectedItem = roleList[res.tapIndex]
          const nowUserId = wx.getStorageSync("userInfo").userId
          console.log('showActionSheet',selectedItem,res.tapIndex)
          if(selectedItem.accountId !== nowUserId){//非当前登录账户可切换
            const param = {}
            param.uid = selectedItem.accountId
            app.api.reqUserSwitch(param).then(res =>{
              wx.showToast({title: "切换账号成功，稍后将重新登录"})
              setTimeout(function(){
                wx.redirectTo({ url: '/pages/old/safe/mine/welcome'})
              },3000)
            }).catch(err=>{
              console.log('reqUserSwitch error:',err)
            })
          }     
        },
        fail: (res) => {
            console.log(res.errMsg)
        }
      })
    }).catch(err=>{
      console.log('reqUserAccounts error:',err)
    })
  },
  onLogout(){
    const that = this
    wx.showModal({
      title:'操作确认',
      content: '确定退出当前账户么？',
      success: res => {
        if (res.confirm) {
          that.setData({
            isLogin:false,
            userCode:'',
            userName: '',
            phone: '',
            roles: '',
            role: '',
            userType: '',
            avatarUrl:''
          })
          wx.showToast({title: "退出成功"})
          wx.setStorageSync("userInfo", '')
          // setTimeout(function(){
          //   wx.switchTab({
          //     url: '/pages/old/safe/main/index',
          //   })
          // },3000)
        } else {
          console.log('cancel')
        }
      }
    })
  },
  onUnBindUser(){
    const that = this
    wx.showModal({
      title:'操作确认',
      content: '确定退出当前账户么？',
      success: res => {
        if (res.confirm) {
          const data = {}
          data.uid = wx.getStorageSync("userInfo").userId
          data.wid = wx.getStorageSync("userInfo").wid
          app.api.reqUserUnBind(data).then(res =>{
            wx.showToast({title: "退出成功"})
          }).catch(err=>{
            console.log('reqUserUnBind error:',err)
          })
          that.setData({
            isLogin:false,
            userCode:'',
            userName: '',
            phone: '',
            roles: '',
            role: '',
            userType: '',
            avatarUrl:''
          })
          wx.setStorageSync("userInfo", '')
          wx.setStorageSync("access_token", '')
        } else {
          console.log('cancel')
        }
      }
    })
  },
  onLogin(){
    wx.navigateTo({
      url:'/pages/old/safe/mine/welcome'
    })
  },
  onTest(){
    const data = {}
    data.uid = wx.getStorageSync("userInfo").userId
    data.wid = wx.getStorageSync("userInfo").wid
    app.api.reqTest(data).then(res =>{
      console.log("reqTest:",res)
    }).catch(err=>{
      console.log('reqUserUnBind error:',err)
    })
  },
  onList(){
    const data = {}
    data.uid = wx.getStorageSync("userInfo").userId
    console.log('user:', wx.getStorageSync("userInfo"))
    data.wid = wx.getStorageSync("userInfo").wid
    data.range = 'shops'
    data.upId = ''
    data.auth = '0'
    data.pno = '1'
    data.psize = '30'
    data.stext = '肯德基 万象汇外街'
    app.api.reqRptCatalog(data).then(res =>{
      console.log("reqTest:",res)
    }).catch(err=>{
      console.log('reqUserUnBind error:',err)
    })
  },
  onAlterAvatar(e) {
    const that = this
    console.log('---onAlterAvatar detail:',e.detail)
    const { avatarUrl } = e.detail 
    // this.setData({
    //   avatarUrl:avatarUrl,
    // })
    console.log('avatarUrl',avatarUrl)
    //上传图片 并更新头像
    app.upload(avatarUrl, 'wxavatar',
      function (result) {
        console.log("upload res:",result)
        const fileItem=app.util.getFileInfo(result.url)
        fileItem.link = avatarUrl
        if(fileItem.type==='image'){//更新头像
          app.api.reqUserUpdAvatar(result.url).then(updres =>{
            console.log("reqUserUpdNickname updres:",updres)
            //更新缓存
            const user = wx.getStorageSync("userInfo")
            user.avatar = result.url
            wx.setStorageSync('userInfo', user)
            app.api.reqFileShow(result.url).then(res=>{
              that.setData({
                avatarUrl:res.data,
              })
            })
            wx.showToast({title: "头像更新成功"})
          })
        }
        wx.hideLoading();
      },
      function (error) {
        console.log("======上传失败======", error);
        wx.hideLoading()
      }
    )
  },
  onAlterName(e){
    const oldName = this.data.userName
    const {value} = e.detail
    if(oldName==value){
      return
    }
    console.log('nickName',value)
    this.setData({
      userName:value
    })
    //更新用户信息
    app.api.reqUserUpdNickname(value).then(res =>{
      console.log("reqUserUpdNickname:",res)
      const user = wx.getStorageSync("userInfo")
      user.userName = value
      wx.setStorageSync('userInfo', user)
      wx.showToast({title: "昵称更新成功"})
    })
  }
})