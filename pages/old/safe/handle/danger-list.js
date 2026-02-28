const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    activeTab: 0,
    tablist: [
      {
        value: "未整改"
      },
      {
        value: "已整改"
      },
      {
        value: "复核合格"
      },
      {
        value: "复核不合格"
      },
      {
        value: "待再次复核"
      }
    ],
    range:'shop',
    upid: '',
    auth: 0,
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
        },
        dataList: []
      },
      {
        param:{
          pno:1,
          psize: 10,
          totalPage: 0,
          itemRs: 'N',
          finalRs:'Y',
        },
        dataList: []
      },
      {
        param:{
          pno:1,
          psize: 10,
          totalPage: 0,
          finalN: '1'
        },
        dataList: []
      },
      {
        param:{
          pno:1,
          psize: 10,
          totalPage: 0,
          finalNtoFinal: '1'
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
    // if(userInfo.userType=='10001004'){//项目安全员允许整改
    //   this.setData({
    //     showImproveBtn: true
    //   })
    // }
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
    if(options.auth){
      this.setData({
        auth: options.auth
      })
    }
    if(options.range){
      this.setData({
        range: options.range
      })
    }
    if(options.res){
      let activetab = 0
      if(options.res=='checkN'){
        activetab = 0
      }else if(options.res=='checkY'){
        activetab = 1
      }else if(options.res=='finalY'){
        activetab = 2
      }else if(options.res=='finalN'){
        activetab = 3
      }else if(options.res=='finalNtoFinal'){
        activetab = 4
      }
      this.setData({
        activeTab: activetab
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
    if(this.data.upid){
      this.setData({
        ['datas[0].param.pno']: 1,
        ['datas[0].dataList']: [],
        ['datas[1].param.pno']: 1,
        ['datas[1].dataList']: [],
        ['datas[2].param.pno']: 1,
        ['datas[2].dataList']: [],
        ['datas[3].param.pno']: 1,
        ['datas[3].dataList']: [],
        ['datas[4].param.pno']: 1,
        ['datas[4].dataList']: [],
      });
      this.getList(0)
      this.getList(1)
      this.getList(2)
      this.getList(3)
      this.getList(4)
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
    console.log("onPullDownRefresh")
    const index = this.data.activeTab
    this.setData({
      ['datas['+index+'].param.pno']: 1,
      ['datas['+index+'].dataList']: []
    });
    this.getList(index)
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
    this.getList(index)
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
      //this.getList()
      resolve(null);
    })
  },
  getList(tabIndex){
    console.log('getList:',tabIndex)
    const that = this
    // if(!tabIndex){
    //   tabIndex = this.data.activeTab
    // }
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
    if(this.data.auth){
      param.auth = this.data.auth
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
        newList[i].loadFiles = false
        dataList.push(newList[i])
      }
      that.setData({
        ['datas['+tabIndex+'].param.totalPage']:res.pcnt,
        ['datas['+tabIndex+'].dataList']:dataList
      })
      wx.stopPullDownRefresh()
      //附件图片单独处理
      // for(let i=0;i<dataList.length;i++){
      //   if(!dataList[i].loadFiles){
      //     that.getFiles(dataList[i],'dangerPics')
      //     that.getFiles(dataList[i],'improvePics')
      //     that.getFiles(dataList[i],'finalPics')
      //   }
      // }
      // that.setData({
      //   ['datas['+tabIndex+'].dataList']:dataList
      // })
      // console.log('loadfiles',this.data.datas[tabIndex].dataList)
    }).catch(e=>{
      console.log('request error:', e)
    })
  },
  getFiles(data,field){
    //附件处理
    const fileStr = data[field]
    console.log('getFiles:',fileStr)
    if(fileStr){
      data[field+'_files'] = []
      data[field+'_pictures'] = []
      const fileArr = fileStr.split(',')
      for(let i=0;i<fileArr.length;i++){
        const fileItem=app.util.getFileInfo(fileArr[i])
        if(fileItem.type==='image'){
          app.api.reqFileShow(fileArr[i]).then(res=>{
            const path = res.data
            fileItem.link=path
            data[field+'_files'].push(fileItem)
            data[field+'_pictures'].push(path)
            console.log('reqFileShow',data)
          })
        }else{
          data[field+'_files'].push(fileItem)
        }
      }
    }
    data.loadFiles = true
  },
  previewImage: function (e) {
    const tabIndex = this.data.activeTab
    const {index,field} = e.currentTarget.dataset
    console.log("previewImage",role)
    wx.previewImage({
      current: e.currentTarget.id, // 当前显示图片的http链接
      urls: this.data.datas[tabIndex].dataList[index][field+'_pictures'] // 需要预览的图片http链接列表
    })
  },
  downloadFile: function (e) {
    const link = e.currentTarget.dataset.link
    const filepath = e.currentTarget.dataset.file
    if(link){//本地文件
      wx.openDocument({
        filePath: link,
        showMenu: true,
        success:function(openRes){
          console.log("======openDocument success======", openRes)
        },
        fail:function(openError){//预览失败可转发
          console.log("======openDocument fail======", openError)
          wx.shareFileMessage({
            filePath:  link,
            success(shareRes) {
              console.log('share success:',shareRes)
            },
            fail(shareError){
              console.log('share error:',shareError)
            }
          })
        },
        complete:function(status){
          console.log("======openDocument complete======", status);
        }
      })
    }else{
      console.log("downloadFile link:", link,filepath)
      app.api.reqFileShow(filepath).then(fileLink=>{
        wx.downloadFile({
          url: fileLink,
          success(dlRes){
            console.log('dlRes',dlRes)
            const tmpLink = dlRes.tempFilePath
            wx.openDocument({
              filePath: tmpLink,
              showMenu: true,
              success:function(openRes){
                console.log("======openDocument success======", openRes)
              },
              fail:function(openError){//预览失败可转发
                console.log("======openDocument fail======", openError)
                wx.shareFileMessage({
                  filePath:  tmpLink,
                  success(shareRes) {
                    console.log('share success:',shareRes)
                  },
                  fail(shareError){
                    console.log('share error:',shareError)
                  }
                })
              },
              complete:function(status){
                console.log("======openDocument complete======", status);
              }
            })
          },
          fail(dlError){
            console.log('dlError',dlError)
          }
        })
      })
    }
  },
  onImprove(e){
    console.log('onHandle:',e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    let path = '/pages/old/safe/handle/danger-improve?id=' + id + '&auth=' + auth
    wx.navigateTo({
      url:path
    })
  },
  onFinal(e){
    console.log('onHandle:',e.currentTarget.dataset)
    const {id,auth} = e.currentTarget.dataset
    let path = '/pages/old/safe/handle/danger-final?id=' + id + '&auth=' + auth
    wx.navigateTo({
      url:path
    })
  },
})