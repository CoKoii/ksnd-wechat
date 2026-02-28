const request = require("./request.js")

module.exports = {
  numberGet: (data) => {
    return request.req({
      url: '/api/sys/sequence/getOrderNumber',
      data
    })
  },
  reqSysCodeSet: (data) => {
    return request.req({
      url: '/api/sys/code',
      data
    })
  },
  reqUserInfoGet: () => {
    return request.req({
      url: '/api/userinfo/get',
      method:'get'
    })
  },
  reqAuthMap: (data) =>{
    return request.req({
      url: '/api/safe/authMap',
      method:'post',
      data:data
    })
  },
  reqRptList: (data) =>{
    return request.req({
      url: '/api/safe/list',
      method:'post',
      data:data
    })
  },
  reqRptGet: (data) =>{
    return request.req({
      url: '/api/safe/get',
      method:'post',
      data:data
    })
  },
  reqRptCatalog: (data) =>{
    return request.req({
      url: '/api/safe/catalog',
      method:'post',
      data:data
    })
  },
  reqRptImprove: (data) =>{
    return request.req({
      url: '/api/safe/improve',
      method:'post',
      data:data
    })
  },
  reqRptFinal: (data) =>{
    return request.req({
      url: '/api/safe/final',
      method:'post',
      data:data
    })
  },
  reqRptCount: (data) =>{
    return request.req({
      url: '/api/safe/getRptCount',
      method:'post',
      data:data
    })
  },
  reqRptShops: (data) =>{
    return request.req({
      url: '/api/safe/getRptShops',
      method:'post',
      data:data
    })
  },
  reqUserBind: (data) =>{
    return request.req({
      url: '/sys/user/bind',
      data
    })
  },
  reqUserAccounts: (data) =>{
    return request.req({
      url: '/api/infoByWid/'+data.wid,
      method:'get',
    })
  },
  reqUserSwitch: (param) =>{
    return request.req({
      url: '/api/account/switch?uid='+param.uid
    })
  },
  reqUserUnBind: (data) =>{
    return request.req({
      url: '/auth/wxUnbind',
      method:'post',
      data
    })
  },
  reqUserUpdAvatar: (url) =>{
    const data ={}
    data.url = url
    return request.req({
      url: '/auth/updAvatar',
      method:'post',
      data
    })
  },
  reqUserUpdNickname: (nickname) =>{
    const data ={}
    data.nickname = nickname
    return request.req({
      url: '/auth/updNickname',
      method:'post',
      data
    })
  },
  reqWfSignal: (data) =>{
    return request.req({
      url: '/api/wf/signal',
      data
    })
  },
  reqWfList: (data) =>{
    return request.req({
      url: '/api/wf/list',
      method:'get',
      data
    })
  },
  reqWfShow: (data) =>{
    return request.req({
      url: '/api/wf/show',
      method:'get',
      data
    })
  }, 
  reqWfLog: (data) =>{
    return request.req({
      url: '/api/wf/listg',
      method:'get',
      data
    })
  },
  reqFileDownload: (path) =>{
    const data = {}
    return request.req({
      url: '/ksnd/api/oss/download?objname='+path,
      method:'post',
      data:data
    })
  },
  reqFileShow: (path) =>{
    const filePath = String(path || '')
    if(!filePath){
      return Promise.resolve({ data: '' })
    }
    if(filePath.startsWith("/yuankong/guozi")){
      const url = getApp().globalData.serverHost + '/ksnd/api/proxy/download?objname='+filePath
      return new Promise((resolve, reject) => {
        wx.downloadFile({
          header: {
            'satoken': wx.getStorageSync("access_token")
          },
          url: url,
          success: function(res){
            if (res.statusCode === 200) {
              res.data = res.tempFilePath
              resolve(res)
            }else{
              reject(res)
            }
          },
          fail: function(error){
            reject(error)
          }
        });
      });
    }else{
      return new Promise((resolve, reject) => {
        request.req({
          url: '/ksnd/api/oss/show?objname='+filePath,
          method:'get'
        }).then(res=>{
          resolve(res)
        }).catch(error=>{
          reject(error)
        })
      })
    }

  },
}
