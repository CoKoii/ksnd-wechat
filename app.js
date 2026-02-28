const oldUtil = require("./utils/old/util");
const oldApi = require("./utils/old/api");
const oldBase64 = require("./utils/old/base64");
const oldUpload = require("./utils/old/upload");
const oldData = require("./utils/old/data");
const oldRequest = require("./utils/old/request");

App({
  onLaunch() {
    this.util = oldUtil;
    this.api = oldApi;
    this.base64 = oldBase64;
    this.upload = oldUpload;
    this.data = oldData;
    this.request = oldRequest;

    const token = wx.getStorageSync("token");
    const accessToken = wx.getStorageSync("access_token");
    if (token && !accessToken) {
      wx.setStorageSync("access_token", token);
    } else if (!token && accessToken) {
      wx.setStorageSync("token", accessToken);
    }
  },
  globalData: {
    serverHost: "https://ksnd.nexinfo.cn/ksndsrv/",
    fileHost: "https://erplus.oss-cn-shanghai.aliyuncs.com/",
    filePrefix: "?x-oss-process=image/resize,m_fill,h_100,w_200",
  },
});
