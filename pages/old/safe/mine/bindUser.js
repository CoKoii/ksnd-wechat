// pages/main/welcome/bindUser.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    t:'',
    phone: '', //手机号码
    userType: '10000602', //用户类型
    vcode: '', //验证码
    wid: '', //微信id
    number: '', //工号
    alocation: '',
    password: '',
    userTypeItems: [],
    isBusy: false,
    canClick: true, //
    timer: null,
    time: 60, //按钮倒计时 60
    sendMg: '',
    showPwd: false
  },
  getCountDown(that) {
    that.data.timer = setInterval(function(){
      let time = parseInt(that.data.time) - 1;
      if(time <= 0){
        clearInterval(that.data.timer)
        that.setData({
          time: 60,
          canClick: true,
          sendMg: that.data.t['ObtainVCode']
        })
      }
      that.setData({
        time: time,
        canClick: false,
        sendMg: that.data.t['VCodeTip1']+ time + "S" + that.data.t['VCodeTip2']
      })
    }, 1000);
  },
  inputChange(e) {
    let field = e.currentTarget.dataset.field
    this.setData({
      [field]: e.detail.value
    })
    // const {field} = e.currentTarget.dataset
    // this.setData({
    //     [`formData.${field}`]: e.detail.value
    // })
  },
  userTypeChange(e) {
    console.log('radio发生change事件，携带value值为：', e.detail.value)
    const userTypeItems = this.data.userTypeItems
    let userType = ""
    for (let i = 0, len = userTypeItems.length; i < len; ++i) {
      userTypeItems[i].checked = userTypeItems[i].id === e.detail.value
      if (userTypeItems[i].id === e.detail.value) {
        userType = userTypeItems[i].id
      }
    }
    this.setData({
     userTypeItems: userTypeItems,
     userType: userType
    })
  },
  onBindUser() {
    let self = this
    let wid = wx.getStorageSync("wid")
    let access_token = wx.getStorageSync("access_token")
    if (app.util.isNull(this.data.phone)||!/1[3-9]\d{9}$/.test(this.data.phone)) {
      app.util.showWarning(this.data.t['pleaseEnter'] +' '+this.data.t['valid']+ this.data.t['phoneNumber'])
      return
    }
    if (app.util.isNull(this.data.vcode)) {
      app.util.showWarning(this.data.t['pleaseEnter'] +' '+ this.data.t['verificationCode'])
      return
    }
    if (app.util.isNull(this.data.number)) {
      app.util.showWarning(this.data.t['pleaseEnter'] +' '+ this.data.t['userName'])
      return
    }
    if (app.util.isNull(wid)) {
      app.util.showWarning("wid "+this.data.t['notExist'])
      return
    }
    if (app.util.isNull(access_token)) {
      app.util.showWarning("token " +this.data.t['invalid'])
      return
    }
    if (!this.data.isBusy) {
      wx.request({
        url: getApp().globalData.serverHost + '/api/bindUser/byWid',
        method: 'post',
        header: {
          'Authorization': 'Bearer ' + access_token
        },
        data: {
          number: this.data.number,
          wid: wid,
          phone: this.data.phone,
          type: this.data.userType,
          vcode: this.data.vcode
        },
        success: function (res) {
          console.log('bind res:',res.data)
          if(!res.data.data){
            app.util.showWarning(res.data.errmsg)
          }
          if(res.data.data===1){
            app.util.showWarning("绑定成功！")
            //绑定成功获取token
            wx.login({
              success: function (wxres) {
                if (wxres.code) {
                  wx.request({ //读取服务端用户信息
                    url: getApp().globalData.serverHost + '/api/openid/get?code='+wxres.code,
                    method: "post",
                    success: function (res) {
                      console.log('wxcode get userInfo：',res)
                      if(res.data.data){//已有用户 直接获取用户信息与登录信息
                        const token = res.data.data.tokenValue
                        wx.setStorageSync("access_token", token)
                        const info=res.data.data.account
                        const userInfo={}
                        userInfo.wid = info.wid
                        userInfo.userId=info.accountId
                        userInfo.userName=info.realName
                        userInfo.phone=info.phone
                        userInfo.userType=info.accountType
                        userInfo.userRoles=info.roles
                        userInfo.userRole=info.roles[0]
                        if(info.personnel){
                          userInfo.empId=info.personnel.id
                          userInfo.empCode=info.personnel.number
                          userInfo.empName=info.personnel.name
                          userInfo.typeName=info.personnel.typeName
                          userInfo.custId=info.personnel.customer
                          userInfo.email=info.personnel.mail
                          userInfo.address=info.personnel.address
                        }else{
                          wx.showToast({title: "获取personnel信息失败"})
                        }
                        wx.setStorageSync("userInfo", userInfo)
                        wx.switchTab({
                          url: '/pages/old/safe/main/index',
                        })
                      }else{
                        app.util.showWarning("读取用户信息无效 请重新进入绑定！")
                        app.util.goto('/pages/old/safe/mine/bindUser')
                      }
                    },
                    fail: function (err) {
                      console.log("openid err:",err)
                      //app.util.goBack({ refreshFlag: 1 })
                    }
                  })
                }else{
                  app.util.showWarning("获取微信授权失败！")
                }
              }
            })
          }
        },
        fail: function (err) {
          app.util.showWarning(err)
        }
      })
    }
  },
  getVCode() {
    const that=this
    const form=this.data
    if(form.canClick) {
      if (app.util.isNull(form.number)||app.util.isNull(form.password)) {
        app.util.showWarning("请输入用户名和密码")
        return
      }
      if (app.util.isNull(form.phone)||!/1[3-9]\d{9}$/.test(form.phone)) {
        app.util.showWarning("请输入有效的手机号码")
        return
      }
      //执行登录，获取access_token
      wx.request({ //读取服务端用户信息
        url: getApp().globalData.serverHost + '/api/login',
        data: {
          uname: form.number,
          psw: form.password
        },
        method: "post",
        success: function (res) {
          if(!res.data.data){
            app.util.showWarning("用户名或密码不正确")
            return
          }
          console.log("login token:",res.data.data.tokenValue)
          let access_token = res.data.data.tokenValue
          wx.setStorageSync("access_token", access_token)
          //获取验证码
          wx.request({
            url: getApp().globalData.serverHost + '/api/vcode?phone=' + form.phone,
            method: "get",
            success: function (res) {
              let time = parseInt(that.data.time) - 1;
              that.setData({
                time: time,
                canClick: false,
                sendMg: "剩余" + time + "S"
              })
              that.data.timer = setInterval(function(){
                let time = parseInt(that.data.time) - 1;
                if(time <= 0){
                  that.setData({
                    time: 60,
                    canClick: true,
                    sendMg: "获取验证码"
                  })
                  clearInterval(that.data.timer)
                }else{
                  that.setData({
                    time: time,
                    canClick: false,
                    sendMg: "剩余" + time + "S"
                  })
                }
              }, 1000);
              that.setData({
                isBusy: false
              })
            },
            fail: function (err) {
              that.setData({
                isBusy: false
              })
            }
          })
        },
        fail: function (err) {
          console.log("login err:",err)
          //app.util.goBack({ refreshFlag: 1 })
        }
      })
    }
  },
  onTogglePwdShow(){
    //保存密码重新赋值 
    const pwd = this.data.password
    console.log('onTogglePwdShow',pwd)
    this.setData({
      showPwd:!this.data.showPwd,
      password: pwd
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //多语言设定
    let langSet = wx.getStorageSync("langSet")
    if(!langSet){
      langSet = app.data.langs.zh
    }
    this.setData({
      t:langSet
    })
    const wid = wx.getStorageSync("wid")
    if(!wid){
      app.util.goto('/pages/old/safe/mine/welcome')
    }
    const item=[{ id: "10000601", name: this.data.t['employee']},
                { id: "10000602", name: this.data.t['customer'], checked: true}
              ]
    this.setData({
      userTypeItems: item,
      sendMg: this.data.t['ObtainVCode']
    })
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

  }
})