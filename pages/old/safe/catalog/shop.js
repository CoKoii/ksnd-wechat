const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLogin:false,
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
      cpoOrderNumber: '',
      sapNumber: '',
      status: '',
      customerFk: '',
      emp: '',
      roles: []
    },

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      doSearch: this.doSearch.bind(this),
    })
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
    const userInfo = wx.getStorageSync("userInfo")
    if(userInfo){
      this.setData({
        isLogin:true,
        userType: userInfo.userType,
      })
    }else{
      this.setData({
        isLogin:false
      })
    }
    this.setData({
      currentPage: 1,
      dataList: []
    });
    this.getList()
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
    this.setData({
      currentPage: 1,
      dataList: []
    });
    this.getList()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    let currentPage = this.data.currentPage
    const totalPage = this.data.totalPage
    if(currentPage>=totalPage){
      wx.showToast({title: '已经是最后一页~'})
      return false
    }
    currentPage++
    this.setData({
      currentPage: currentPage,
    });
    this.getList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
  doSearch: function (stext) {
    console.log('doSearch')
    if(!this.data.isLogin){
      wx.navigateTo({
        url:'/pages/old/safe/mine/welcome'
      })
    }
    return new Promise((resolve, reject) => {
      this.setData({
        dataList:[],
        currentPage: 1,
        stext:stext
      })
      this.getList()
      resolve(null);
    })
  },
  getList(){
    if(!this.data.isLogin){
      return
    }
    const param={}
    param.range = 'shops'
    param.psize = this.data.pageSize
    param.pno = this.data.currentPage
    param.stext = this.data.stext
    param.itemRs = 'N'
    if(this.data.upid){
      param.project = this.data.upid
    }
    if(this.data.auth){
      param.auth = this.data.auth
    }else if(this.data.userType=='10001005'){//商铺管理员 默认展示管理商铺
      if(!this.data.stext){
        param.authShop = 1
      }
    }else{//普通用户 无输入查询不显示内容
      // if(!this.data.stext){
      //   return
      // }
      //wx.showToast({title: '无权访问'})
      return
    }
    console.log('reqRptCatalog param:',param)
    app.api.reqRptCatalog(param).then(res=>{
      console.log('reqRptCatalog res:',res)
      let dataList=this.data.dataList
      const newList = app.util.paramNull2Empty(res.data)
      for(let item of newList){
        item.linkman = app.util.maskName(item.linkman)
        item.phone = app.util.maskPhone(item.phone)
        dataList.push(item)
      }
      console.log('reqOrderList res',res)
      this.setData({
        totalPage:res.pcnt,
        dataList:dataList
      })
      wx.stopPullDownRefresh()
    }).catch(e=>{
      console.log('request error:', e)
    })
  },
  onHandle(e){
    const {id,auth} = e.currentTarget.dataset
    let path = '/pages/old/safe/handle/danger-list?upid=' + id + '&auth=' + auth
    console.log('onHandle path:',path)
    wx.navigateTo({
      url:path
    })
  },
})