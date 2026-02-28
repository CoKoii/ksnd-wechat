const util = require("./util.js")
// 请求头
const req = (options) => {
  return new Promise((resolve, reject) => {
    let url = options.url
    let token = wx.getStorageSync("access_token")
    // 检查请求是否完整
    if (url.indexOf("http") < 0) {
      url = getApp().globalData.serverHost + url;
    }
    wx.showLoading({
      title: '加载中'
    })
    // 默认使用post
    wx.request({
      url: url,
      method: options.method || 'POST',
      header: {
        'satoken': token
      },
      data: options.data || {},
      success: (res) => {
        setTimeout(() => {
          wx.hideLoading()
        }, 500)
        if (res.statusCode == 200) {
          if (res.data.code == 0) {//saResult返回code=200，msgPacket返回code=0
            resolve(res.data)
          } else {
            util.showWarning("响应数据异常！" + res.data.msg)
            reject(res.data)
          }
        } else if (res.statusCode >= 500) {
          util.showWarning("服务器异常！" + res.errMsg)
          reject("服务器异常！" + res.errMsg);
        }else if (res.statusCode === 401) {
          console.log('Token 无效')
          wx.login({
            success: function (wxres) {
              if (wxres.code) {
                wx.request({ //再次登录
                  url: getApp().globalData.serverHost + '/api/openid/get?code='+wxres.code,
                  success: function (res) {
                    console.log('Token刷新成功，重试发起请求',res)
                    token = res.data.data.tokenValue
                    wx.setStorageSync("access_token", token)
                    wx.request({
                      url: url,
                      method: options.method || 'POST',
                      header: {
                        'Authorization': 'Bearer ' + token
                      },
                      data: options.data || {},
                      success: (reRes) => {
                        console.log('重试请求成功:',reRes)
                        if (reRes.statusCode == 200) {
                          if (reRes.data.code == 0) {
                            resolve(reRes.data.data)
                          } else {
                            wx.showToast({title: "响应数据异常！" + reRes.data.msg})
                            reject(reRes.data)
                          }
                        }else{
                          wx.showToast({title: "响应状态异常！" + reRes.data.msg})
                          reject(reRes.data)
                        }
                      },
                      fail: (reErr) => {
                        console.log('重试请求失败:',reErr)
                        wx.showToast({title: '请求接口失败！'})
                        reject(reErr)
                      }
                    })
                  }
                })
              }
            }
          })
        } else if (res.statusCode >= 400 && res.statusCode < 500) {
          util.showWarning("没有找到内容" + res.errMsg)
          reject("没有找到内容" + res.errMsg);
        } else {
          util.showWarning("网络请求异常！" + res.errMsg)
          reject("网络请求异常！" + res.errMsg);
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({
          title: '请求接口失败！'
        })
        reject(err)
      },
      complete() {
        console.log()
      }
    })
  })
}

module.exports = {
  req,
}
