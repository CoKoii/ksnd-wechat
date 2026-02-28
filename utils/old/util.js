// var QQMapWX = require('./qqmap-wx-jssdk.js');

const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatDate = (date, fmt) => {
  if (isNull(fmt)) fmt = "yyyy-MM-dd"
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  }
  for (let k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      let str = o[k] + ''
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : ('00' + str).substr(str.length))
    }
  }
  return fmt
}

const formatDateS = (dates, fmt) => {
  if (isNull(fmt)) fmt = "yyyy-MM-dd"
  if (isNull(dates)) return ""
  let sp = dates.split(".")
  let s = sp[0].replace("T", " ")
  let date = new Date(Date.parse(s.replace(/-/g, "/")))
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
  }
  let o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds()
  }
  for (let k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      let str = o[k] + ''
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? str : ('00' + str).substr(str.length))
    }
  }
  return fmt
}

const compareDate = (d1, d2) => {
  if (d1.getTime() == d2.getTime()) {
    return 0;
  } else if(d1.getTime() > d2.getTime()){
    return 1;
  } else {
    return -1;
  }
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/*
* 参数说明：
* number：要格式化的数字
* decimals：保留几位小数
* dec_point：小数点符号
* thousands_sep：千分位符号
* */
const numberFormat = (number, decimals, dec_point, thousands_sep) => {
  number = (number + '').replace(/[^0-9+-Ee.]/g, '');
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 2 : Math.abs(decimals),
    sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
    dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
    s = '',
    toFixedFix = function (n, prec) {
      var k = Math.pow(10, prec);
      return '' + Math.ceil(n * k) / k;
    };

  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
  var re = /(-?\d+)(\d{3})/;
  while (re.test(s[0])) {
    s[0] = s[0].replace(re, "$1" + sep + "$2");
  }

  if ((s[1] || '').length < prec) {
    s[1] = s[1] || '';
    s[1] += new Array(prec - s[1].length + 1).join('0');
  }
  return s.join(dec);
}

const moneyFormat = (number) => {
  return numberFormat(number, 2, '.', ',')
}

const moneyParse = (moneyStr) => {
  return Number(moneyStr.replace(/,/g, ''));
}

const maskName = (str) => {
  if(!str){
    return ''
  }
  if (str.length <= 2) {
    return str.charAt(0) + '**'
  }
  return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1)
}

const maskPhone = (str) => {
  if(!str){
    return ''
  }
  if (str.length < 7) {
      return str
  }
  return str.substring(0, 3) + '****' + str.substring(7)
}

//跳转
const goto = path => {
  wx.navigateTo({
    url: path,
    fail: function (e) {
      console.log(e)
      showWarning("跳转失败：" + e)
    }
  })
}

//弹窗提示
const showWarning = (title, m) => {
  let duration = 1500
  if(m) {
    duration = m
  }
  wx.showToast({
    icon: 'none',
    title: title,
    duration: duration
  })
}

const checkDataNull = (data, msg) => {
  if (isNull(data)) {
    showWarning(msg)
    return true
  } else return false
}

//是否为空
const isNull = str => {
  if (str == undefined || str == null || str == 'undefined' || str == '' || str == 'null' || str == '[]' || str == '{}') {
    return true
  } else {
    // 去除所有空格
    // let s = str.replace(/\s+/g, '');
    // if (s.length > 0) {
    //   return true
    // }
    return false;
  }
}

/**
 * 返回 带参数
 * @param {*} data 
 */
const goBack = data => {
  wx.navigateBack({
    delta: 1
  })
  let pages = getCurrentPages();
  let prevPage = pages[pages.length - 2]; //上一个页面
  //直接调用上一个页面的setData()方法，把数据存到上一个页面中去
  prevPage.setData(data)
}

//是否为方法
const isFunction = fc => {
  if (typeof (fc) == "function") return true
  else return false
}

/**
 * html 替换
 * @param {*} html 
 */
const text = (html) => {
  html = html.replace(/(\n)/g, "");
  html = html.replace(/(\t)/g, "");
  html = html.replace(/(\r)/g, "");
  html = html.replace(/<\/?[^>]*>/g, "");
  html = html.replace(/\s*/g, "");
  return html;
}

const getFileInfo=(path)=>{
    let parts = path.split('/')
    let fileNameWithExtension = parts[parts.length - 1]
    let fileName = fileNameWithExtension.split('.')
    let nameWithoutExtension = fileName[0]
    let extension = fileName.length > 1 ? fileName[fileName.length - 1] : ''
    let type='file'
    if (extension != "") {
      extension = extension.toLocaleLowerCase();
      const imglist = ['png', 'jpg', 'jpeg', 'bmp', 'gif']
      let result = imglist.find(function (item) {
        return item === extension
      })
      if(result){
        type = 'image'
      }
    }
    //文件名截取20位即可
    let name=fileNameWithExtension
    if(name.length>20){
      name='*_'+name.substring(name.length - 20);
    }
    const file={}
    file.file = path
    file.name = name
    file.fname = fileNameWithExtension
    file.suffix = extension
    file.type = type
    return file
}
/**
 * 对象参数去空
 * @param {*} params 
 */
const requestParamHandler = (params) => {
	if (typeof params == "object") {
    if(params instanceof Array){
      const arr = [];
      const list = params;
      for (let listElement of list) {
        const abj = requestParamHandler(listElement);
        abj && arr.push(abj);
      }
      params = arr;
    }else{
      for (let key of Object.keys(params)) {
        if (params[key] == null || params[key] == undefined || params[key] == 'NULL') {
          delete params[key];
        }
        if (params[key] instanceof Array) {
          const arr = [];
          const list = params[key];
          for (let listElement of list) {
            const abj = requestParamHandler(listElement);
            abj && arr.push(abj);
          }
          params[key] = arr;
        }
      }
    }
	}else{
    console.log('requestParamHandler is not object:')
  }
	return params;
};

/**
 * 
 * @param {*} callback 
 * @returns {address: address,
                      latitude: res.latitude,
                      longitude: res.longitude}
 */
const getLocationAddress = (callback) => {
  // let qqmapsdk = new QQMapWX({
  //   key: 'LU2BZ-ZJ76P-3GGD4-LJ5GY-WK46K-AOBXW' // 必填
  // })
  wx.getSetting({
    success(res) {
      if (!res.authSetting['scope.record']) {
        wx.authorize({
          scope: 'scope.userLocation',
          success() {
            wx.getLocation({
              type: 'gcj02',
              // type: 'wgs84', 江苏省苏州市昆山市玉山镇前进中路13号东北约86米
              success(res) {
                //2、根据坐标获取当前位置名称，显示在顶部:腾讯地图逆地址解析
              console.log('gcj02********');
                wx.request({
                  url:'http://api.tianditu.gov.cn/geocoder',
                  data: {
                    postStr: JSON.stringify({'lon': res.longitude,'lat':res.latitude,'ver':1}),
                    type: 'geocode',
                    // tk:'2826428fe95fecce4433373ebf0d9945'
                    tk: '4de33acd81692ad30c6ec9d94df8e461'
                  },
                    //逆地理编码接口参数  
                    success: function (res2){
                      var address = res2.data.result.formatted_address
                      console.log(address)
                      let rs = {
                        address: address,
                        latitude: res.latitude,
                        longitude: res.longitude
                      }
                      console.log('ll********',rs)
                      callback(rs)
                      
                    },
                    fail: function (res){
                      console.log('err',res.errMsg);
                    }
                  })
                      
                // qqmapsdk.reverseGeocoder({
                //   location: {
                //     latitude: res.latitude,
                //     longitude: res.longitude
                //   },
                //   success: function (addressRes) {
                //     var address = addressRes.result.formatted_addresses.recommend
                //     console.log(address)
                //     let rs = {
                //       address: address,
                //       latitude: res.latitude,
                //       longitude: res.longitude
                //     }
                //     callback(rs)
                //   },
                //   fail: function (err) {
                //     callback("")
                //   }
                // })
              },
              fail(err) {
                callback("")
              }
            })
          },
          fail() {
            callback("")
          }
        })
      }
    }
  })
}

module.exports = {
  formatDate: formatDate,
  formatDateS: formatDateS,
  formatTime: formatTime,
  formatNumber: formatNumber,
  numberFormat: numberFormat,
  moneyFormat: moneyFormat,
  moneyParse: moneyParse,
  goto: goto,
  showWarning: showWarning,
  checkDataNull: checkDataNull,
  isNull: isNull,
  goBack: goBack,
  isFunction: isFunction,
  text: text,
  getLocationAddress: getLocationAddress,
  compareDate: compareDate,
  paramNull2Empty: requestParamHandler,
  getFileInfo: getFileInfo,
  maskPhone: maskPhone,
  maskName: maskName
}
