const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: '',
    auth: 0,
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
    console.log("init userInfo:",userInfo)
    this.setData({
      userRoles: userInfo.userRoles,
      userType: userInfo.userType,
    })
    if(options.id){
      this.setData({
        id: options.id
      })
    }else{
      wx.showToast({title: 'id无效'})
    }
    this.init()
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
  init(){
    const param = {}
    const that = this
    param.id=this.data.id
    app.api.reqRptGet(param).then(res=>{
      const form = app.util.paramNull2Empty(res)
      form.checkTime = app.util.formatDateS(form.checkTime)
      form.loadFiles = false
      that.setData({
        dataForm:form
      })
      //附件图片单独处理
      if(!form.loadFiles){
        that.getFiles(form,'dangerPics')
        that.getFiles(form,'improvePics')
        that.getFiles(form,'finalPics')
      }
      that.setData({
        dataForm:form
      })
      console.log('loadfiles',form)
    }).catch(e=>{
      console.log('request error:', e)
    })
  },
  formInputChange(e) {
    const field = e.target.dataset.field
    const datafield = 'dataForm.' + field
    this.setData({
        [datafield]: e.detail.value
    })
  },
  formRadioChange(e){
    const field = e.target.dataset.field
    const datafield = 'dataForm.' + field
    this.setData({
        [datafield]: e.detail.value
    })
  },
  getFiles(data,field){
    //附件处理
    const that = this
    const fileStr = data[field]
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
            const files=that.data.dataForm[field+'_files']
            files.push(fileItem)
            that.setData({
              ['dataForm.'+field+'_files']:files,
              ['dataForm.'+field+'_pictures']:that.data.dataForm[field+'_pictures'].concat(path)
            })
          })
        }else{
          that.setData({
            ['dataForm.'+field+'_files']:that.data.dataForm[field+'_files'].push(fileItem)
          })
        }
      }
    }
    data.loadFiles = true
  },
  previewImage: function (e) {
    const {field,link} = e.currentTarget.dataset
    wx.previewImage({
      current: link, // 当前显示图片的http链接
      urls: this.data.dataForm[field+'_pictures'] // 需要预览的图片http链接列表
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
  //选择图片并执行上传
  chooseImage: function (e) {
    const that = this
    const data = this.data.dataForm
    const {field} = e.currentTarget.dataset
    if(!data[field+'_files']){
      data[field+'_files'] = []
    }
    if(!data[field+'_pictures']){
      data[field+'_pictures'] = []
    }
    wx.chooseMedia({
      mediaType: ['image'],
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        for (let i = 0; i < res.tempFiles.length; i++) {
          const tmpPath = res.tempFiles[i].tempFilePath
          wx.showLoading({
            title: '上传中' + (i + 1) + '/' + res.tempFiles.length,
            mask: true
          })
          app.upload(tmpPath, 'wxupload',
            function (result) {
              console.log("upload res:",result)
              const fileItem=app.util.getFileInfo(result.url)
              fileItem.link = tmpPath
              if(fileItem.type==='image'){
                data[field+'_files'].push(fileItem)
                data[field+'_pictures'].push(tmpPath)
              }else{
                data[field+'_files'].push(fileItem)
              }
              that.setData({
                dataForm:data
              })
              console.log('after data:',data)
              wx.hideLoading();
            },
            function (error) {
              console.log("======上传失败======", error);
              wx.hideLoading()
            }
          )
        }
      }
    })
  },
  onSubmit(e){
    const that = this
    const param = this.data.dataForm
    if(this.userType==='10001006'){//第三方的整改同时执行复核操作
      param.improveDanger= 1
    }
   //处理附件
    let fileStr = ''
    for(let file of this.data.dataForm.finalPics_files){
      fileStr += file.file+','
    }
    param.finalPics=fileStr.replace(/,$/gi,"")
    console.log('submit',param)
    app.api.reqRptFinal(param).then(res=>{
      console.log('reqRptFinal',res)
      if(res.cnt==1){
        wx.showToast({title: "提交成功"})
        setTimeout(() => {
          that.goBack()
        }, 2000)
      }
    }).catch(e=>{
      console.log('request error:', e)
    })
  },
  goBack(){
    wx.navigateBack({
      delta: 1
    })
  }
})