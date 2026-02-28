// component/svg.js
const fs = wx.getFileSystemManager()

const app = getApp()
Component({
  properties: {
  // svg图片路径
    src: {
      type: String,
      value: ''
    },
    // svg颜色
    color: {
      type: String,
      value: ''
    },
    size: {
      type: String,
      value: '60rpx'
    },
    shiftx: {
      type: String,
      value: '0rpx'
    },
    shifty: {
      type: String,
      value: '0rpx'
    }
  },

  observers: {
    'src,color': function (src, color) {
      this.getSvgFile(src, color)
    }
  },
  data: {
    svgData: ''
  },
  methods: {
    getSvgFile(src, color) {
      let that = this;
      fs.readFile({
        filePath: src,
        encoding: 'ascii',// UTF-8 base64 ascii
        position: 0,
        success(res) {
          let sourceFile = res.data;
          let colorFile = that.changeColor(sourceFile, color);
          let svgBase64File = app.base64.base64_encode(colorFile)
          that.setData({
            svgData: 'data:image/svg+xml;base64,' + svgBase64File
          })
        },
        fail(res) {
          console.error('readFile error',src,res)
        }
      })
    },

    changeColor(sourceFile, color) {
      let newSvg;
      if (/fill=".*?"/.test(sourceFile)) {
        newSvg = sourceFile.replace(/fill=".*?"/g, `fill="${color}"`);  // SVG有默认色
      } else {
        newSvg = sourceFile.replace(/<svg /g, `<svg fill="${color}" `); // 无默认色
      }
      return newSvg
    }
  }
})
