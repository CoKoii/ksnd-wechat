// pages/checkInfo/checkInfo.js
Page({
  data: {
    id: null,
    checkResult: "normal",
    checkItems: [
      { id: 1, name: "外观完整，无破损", status: null },
      { id: 2, name: "配件齐全", status: null },
      { id: 3, name: "功能运行正常", status: null },
      { id: 4, name: "设备所在位置是否正确", status: null },
    ],
    description: "",
    images: [],
    inspector: "",
    showAbnormalDialog: false,
    currentAbnormalItem: null,
    tempDescription: "",
    tempImages: [],
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadDetailData(options.id);
    }
  },

  loadDetailData(id) {
    console.log("加载详情数据，ID:", id);
    // TODO: 从服务器加载数据
  },

  onCheckResultChange(e) {
    this.setData({ checkResult: e.detail });
  },

  onCheckItemNormal(e) {
    const { index } = e.currentTarget.dataset;
    const { checkItems } = this.data;
    checkItems[index] = {
      ...checkItems[index],
      status: true,
      description: "",
      images: [],
    };
    this.setData({ checkItems });
  },

  onCheckItemAbnormal(e) {
    const { index } = e.currentTarget.dataset;
    const item = this.data.checkItems[index];
    this.setData({
      currentAbnormalItem: index,
      tempDescription: item.description || "",
      tempImages: item.images || [],
      showAbnormalDialog: true,
    });
  },

  onAbnormalDescChange(e) {
    this.setData({ tempDescription: e.detail.value || e.detail });
  },

  handleImageUpload(file, targetField) {
    const files = Array.isArray(file) ? file : [file];
    const newImages = files.map((f) => ({ url: f.url || f.path }));
    const currentImages = this.data[targetField];
    this.setData({ [targetField]: [...currentImages, ...newImages] });
  },

  onUploadAbnormalImage(e) {
    this.handleImageUpload(e.detail.file, "tempImages");
  },

  onDeleteAbnormalImage(e) {
    const tempImages = this.data.tempImages.filter(
      (_, i) => i !== e.detail.index
    );
    this.setData({ tempImages });
  },

  onCancelAbnormal() {
    this.setData({
      showAbnormalDialog: false,
      currentAbnormalItem: null,
      tempDescription: "",
      tempImages: [],
    });
  },

  onConfirmAbnormal() {
    const { currentAbnormalItem, tempDescription, tempImages, checkItems } =
      this.data;

    if (!tempDescription.trim()) {
      wx.showToast({ title: "请填写异常说明", icon: "none" });
      return;
    }

    checkItems[currentAbnormalItem] = {
      ...checkItems[currentAbnormalItem],
      status: false,
      description: tempDescription,
      images: tempImages.map((img) => img.url),
    };

    this.setData({
      checkItems,
      showAbnormalDialog: false,
      currentAbnormalItem: null,
      tempDescription: "",
      tempImages: [],
    });
  },

  onDescriptionChange(e) {
    this.setData({ description: e.detail.value });
  },

  onUploadImage(e) {
    this.handleImageUpload(e.detail.file, "images");
  },

  onDeleteImage(e) {
    const images = this.data.images.filter((_, i) => i !== e.detail.index);
    this.setData({ images });
  },

  onInspectorChange(e) {
    this.setData({ inspector: e.detail.value });
  },

  onSubmit() {
    const { checkResult, checkItems, description, images, inspector } =
      this.data;

    // 验证检查项
    if (checkItems.some((item) => item.status === null)) {
      wx.showToast({ title: "请完成所有检查项", icon: "none" });
      return;
    }

    // 验证巡检人员
    if (!inspector.trim()) {
      wx.showToast({ title: "请输入巡检人员姓名", icon: "none" });
      return;
    }

    // 提交数据
    console.log("提交巡检结果:", {
      checkResult,
      checkItems,
      description,
      images,
      inspector,
    });

    wx.showToast({ title: "提交成功", icon: "success" });
    setTimeout(() => wx.navigateBack(), 1500);
  },
});
