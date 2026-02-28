const uploadFile = function(filePath,partition, successc, failc) {
    if (!filePath || filePath.length < 9) {
        wx.showModal({
            title: '文件错误',
            content: '请重试',
            showCancel: false,
        })
        return;
    }
    let token = wx.getStorageSync('access_token')
    wx.uploadFile({
        url: getApp().globalData.serverHost + '/ksnd/api/oss/upload?partition='+partition,
        filePath: filePath,
        name: 'file', //必须填file
        header: {
          'satoken': token
        },
        success: function(res) {
            if (res.statusCode != 200) {
                failc(new Error('上传错误:' + JSON.stringify(res)))
                return;
            }
            successc(JSON.parse(res.data));
        },
        fail: function(err) {
            err.wxaddinfo = aliyunServerURL;
            failc(err);
        },
    }) 
}
module.exports = uploadFile