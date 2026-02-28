const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isLogin:false,
    upid: '',
    action:'',
    finalUid:'',
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
    if(options.action){
      this.setData({
        action: options.action
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
    param.psize = this.data.pageSize
    param.pno = this.data.currentPage
    param.stext = this.data.stext
    if(this.data.action){
      param.action = this.data.action
    }
    console.log('reqRptShops param:',param)
    app.api.reqRptShops(param).then(res=>{
      console.log('reqRptShops res:',res)
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
    const {id} = e.currentTarget.dataset
    const action  = this.data.action
    let path =''
    if(action==1 || action ==2){
      path = '/pages/old/safe/query/danger?upid=' + id + '&action=' + this.data.action
    }else if(action==99){
      path = '/pages/old/safe/query/count?upid=' + id + '&action=' + this.data.action
    }
    console.log('onHandle path:',path)
    wx.navigateTo({
      url:path
    })
  },
})