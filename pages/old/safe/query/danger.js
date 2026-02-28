const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 2,
    upid: '',
    range:'shop',
    action: '',
    pageTitle: '',
    userRoles: [],
    userType: '',
    totalPage: 0,
    currentPage: 1,
    pageSize: 10,
    stext: '',
    datas: [
      {
        param:{
          pno:1,
          psize: 10,
          totalPage: 0,
          itemRs: 'N',
          isImprove: 0,
          isFinal: 0,
        },
        dataList: []
      },
      {
        param:{
          pno:1,
          psize: 10,
          totalPage: 0,
          itemRs: 'N',
          isImprove: 1,
          isFinal: 0,
        },
        dataList: []
      },
      {
        param:{
          pno:1,
          psize: 10,
          totalPage: 0,
          itemRs: 'N'
        },
        dataList: []
      },
    ],
    showImproveBtn:true,
    showFinalBtn:false
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
      doSearch: this.doSearch.bind(this),
      userRoles: userInfo.userRoles,
      userType: userInfo.userType,
    })
    if(options.upid){
      this.setData({
        upid: options.upid
      })
    }    
    if(options.range){
      this.setData({
        range: options.range
      })
    }
    if(options.action){
      const action = options.action
      let pageTitle = ''
      if(action == 1){
        pageTitle = '已整改隐患列表'
      }else if(action == 2 ){
        pageTitle = '已复核隐患列表'
      }
      this.setData({
        action: options.action,
        pageTitle: pageTitle
      })
      if (pageTitle) {
        wx.setNavigationBarTitle({
          title: pageTitle
        })
      }
    }
    this.getList(2)
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
    const index = this.data.activeTab
    this.setData({
      ['datas['+index+'].param.pno']: 1,
      ['datas['+index+'].dataList']: []
    });
    this.getList()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    const index = this.data.activeTab
    let currentPage = this.data.datas[index].param.pno
    const totalPage = this.data.datas[index].param.totalPage
    if(currentPage>=totalPage){
      wx.showToast({title: '已经是最后一页~'})
      return false
    }
    currentPage++
    this.setData({
      ['datas['+index+'].param.pno']: currentPage,
    });
    this.getList()
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
  getTabsItemChange (e) {
    console.log("getTabsItemChange:",e.detail)
    this.setData({
      activeTab: e.detail.index
    })
  },
  doSearch: function (stext) {
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
  getList(tabIndex){
    const that = this
    if(!tabIndex){
      tabIndex = this.data.activeTab
    }
    const param=this.data.datas[tabIndex].param
    param.stext = this.data.stext
    if(this.data.stext){
      param.stext = this.data.stext
    }
    if(this.data.upid){
      if(this.data.range=='project'){
        param.project = this.data.upid
      }else if(this.data.range=='grid'){
        param.grid = this.data.upid
      }else if(this.data.range=='region'){
        param.region = this.data.upid
      }else if(this.data.range=='shop'){
        param.shop = this.data.upid
      }
    }
    if(this.data.action){
      param.action = this.data.action
    }
    console.log('reqRptCatalog param:',param)
    app.api.reqRptList(param).then(res=>{
      console.log('reqRptCatalog res:',res)
      let dataList=that.data.datas[tabIndex].dataList
      const newList = app.util.paramNull2Empty(res.data)
      for(let i=0;i<newList.length;i++){
        let id2 = newList[i].id2
        if(id2 && id2.length>3){//处理id过长被截断的问题
          let index = id2.indexOf("ID_")
          let result = id2.substring(index + 3)
          newList[i].id = result
        }
        newList[i].checkTime = app.util.formatDateS(newList[i].checkTime)
        dataList.push(newList[i])
      }
      that.setData({
        ['datas['+tabIndex+'].param.totalPage']:res.pcnt,
        ['datas['+tabIndex+'].dataList']:dataList
      })
      wx.stopPullDownRefresh()
      console.log('loadfiles',this.data.datas[tabIndex].dataList)
    }).catch(e=>{
      console.log('request error:', e)
    })
  },
  onHandle(e){
    console.log('onHandle:',e.currentTarget.dataset)
    const {id} = e.currentTarget.dataset
    const action  = this.data.action
    let path = '/pages/old/safe/query/detail?id=' + id + '&action=' + action
    wx.navigateTo({
      url:path
    })
  }
})
