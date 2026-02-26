const showToast = (title) => wx.showToast({ title, icon: "none" });

Page({
  data: {
    isDrawingPath: false,
    isEmpty: true,
    lastX: 0,
    lastY: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    canvasTop: 0,
    canvasLeft: 0,
  },

  onLoad() {
    wx.stopPullDownRefresh();
  },

  onReady() {
    this.initCanvas();
  },

  onUnload() {
    this.ctx = null;
  },

  initCanvas() {
    const query = this.createSelectorQuery();
    query
      .select("#signature-canvas")
      .boundingClientRect((rect) => {
        if (rect) {
          this.setData({
            canvasWidth: rect.width,
            canvasHeight: rect.height,
            canvasTop: rect.top,
            canvasLeft: rect.left,
          });

          this.ctx = wx.createCanvasContext("signature-canvas");
          this.setupPenStyle();
          this.clearCanvas();
        }
      })
      .exec();
  },

  setupPenStyle() {
    if (!this.ctx) return;
    this.ctx.setLineCap("round");
    this.ctx.setLineJoin("round");
    this.ctx.setLineWidth(3);
    this.ctx.setStrokeStyle("#000");
  },

  getTouchPoint(touch) {
    const { canvasTop, canvasLeft } = this.data;
    const rawX =
      touch && touch.clientX != null ? touch.clientX : touch && touch.x;
    const rawY =
      touch && touch.clientY != null ? touch.clientY : touch && touch.y;
    return {
      x: Number(rawX || 0) - canvasLeft,
      y: Number(rawY || 0) - canvasTop,
    };
  },

  clearCanvas() {
    if (!this.ctx) return;
    const { canvasWidth, canvasHeight } = this.data;

    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.draw();
    this.setupPenStyle();
  },

  onTouchStart(e) {
    if (!e.touches.length) return;
    this.setupPenStyle();

    const { x, y } = this.getTouchPoint(e.touches[0]);

    this.setData({
      lastX: x,
      lastY: y,
      isDrawingPath: true,
      isEmpty: false,
    });
  },

  onTouchMove(e) {
    if (!this.data.isDrawingPath || !this.ctx || !e.touches.length) return;
    this.setupPenStyle();

    const { lastX, lastY } = this.data;
    const { x: currentX, y: currentY } = this.getTouchPoint(e.touches[0]);

    this.ctx.beginPath();
    this.ctx.moveTo(lastX, lastY);
    this.ctx.lineTo(currentX, currentY);
    this.ctx.stroke();
    this.ctx.draw(true);

    this.setData({
      lastX: currentX,
      lastY: currentY,
    });
  },

  onTouchEnd() {
    this.setData({
      isDrawingPath: false,
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onClear() {
    this.clearCanvas();
    this.setData({ isEmpty: true });
  },

  onSave() {
    if (this.data.isEmpty) {
      return showToast("请先签名");
    }

    const { canvasWidth, canvasHeight } = this.data;

    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      destWidth: canvasWidth,
      destHeight: canvasHeight,
      canvasId: "signature-canvas",
      success: (res) => {
        const imagePath = String((res && res.tempFilePath) || "").trim();
        if (!imagePath) {
          return showToast("保存签名失败");
        }

        const eventChannel = this.getOpenerEventChannel();
        if (!eventChannel) {
          return showToast("签名回传失败");
        }
        eventChannel.emit("signatureSaved", { imagePath });

        wx.navigateBack();
      },
      fail: () => {
        showToast("保存签名失败");
      },
    });
  },
});
