const { getTaskDetail, saveTaskForm } = require("../../api/task");
const { uploadImage, resolveImagePreview } = require("../../services/file/image");
const { markTodoListNeedReload } = require("../../services/task/localState");
const {
  NO_VALUE,
  COMPLETED_STATE,
  createEmptyAbnormalState,
  getEventValue,
  editable,
  formatDate,
  toCheckResult,
  toUploaderFiles,
  buildCheckItems,
  buildSubmitPayload,
} = require("./utils");

const showToast = (title) => wx.showToast({ title, icon: "none" });
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const isValidImageType = (path = "") => /\.(jpe?g|png)$/i.test(String(path || ""));
const isValidImageSize = (size) => !size || Number(size) <= MAX_IMAGE_SIZE;
const isAbsoluteImageUrl = (value = "") =>
  /^(https?:\/\/|wxfile:\/\/|data:)/i.test(String(value || "").trim());

Page({
  data: {
    id: null,
    taskDetail: null,
    readonly: false,
    submitting: false,
    checkResult: "",
    checkItems: [],
    description: "",
    images: [],
    inspector: "",
    ...createEmptyAbnormalState(),
  },

  onLoad(options) {
    if (!options.id) return showToast("缺少任务ID");
    this.setData({ id: options.id });
    this.loadDetailData(options.id);
  },

  async loadDetailData(id) {
    try {
      const res = await getTaskDetail(id);
      if (String((res && res.code) || "") !== "0") {
        throw new Error((res && res.msg) || "加载详情失败");
      }

      const detail = (res && res.data) || {};
      const readonly = String(detail.state || "") === COMPLETED_STATE;
      const checkItems = buildCheckItems(detail.fields, detail.vals);
      const images = toUploaderFiles(detail.ckpics);
      this.setData({
        taskDetail: {
          ...detail,
          publisher: detail.pjname || detail.creator_fk || NO_VALUE,
          requiredDate: formatDate(detail.cktime || detail.create_time),
        },
        readonly,
        checkResult: toCheckResult(detail.ckrs),
        checkItems,
        inspector: detail.cssign || detail.cksign || detail.checker || "",
        description: detail.ckdesc || "",
        images,
        ...createEmptyAbnormalState(),
      });
      this.hydrateDetailImagePreviews(checkItems, images);
    } catch (error) {
      showToast((error && error.message) || "加载详情失败");
    }
  },

  async resolveUploaderFilePreview(file = {}) {
    const path = String(file.path || file.url || "").trim();
    if (!path) return null;

    const previewUrl = await resolveImagePreview(path);
    const safeFallbackUrl = isAbsoluteImageUrl(path) ? path : "";
    return {
      ...file,
      path,
      url: previewUrl || safeFallbackUrl,
    };
  },

  async resolveUploaderFilesPreview(files = []) {
    const list = Array.isArray(files) ? files : [];
    const resolved = await Promise.all(
      list.map(async (file) => {
        try {
          return await this.resolveUploaderFilePreview(file);
        } catch (error) {
          const path = String((file && file.path) || (file && file.url) || "").trim();
          const url = String((file && file.url) || "").trim();
          return {
            ...file,
            path,
            url: isAbsoluteImageUrl(url) ? url : "",
          };
        }
      })
    );
    return resolved.filter((item) => item && item.path);
  },

  async hydrateDetailImagePreviews(checkItems = [], images = []) {
    try {
      const [resolvedImages, resolvedCheckItemsImages] = await Promise.all([
        this.resolveUploaderFilesPreview(images),
        Promise.all(
          (Array.isArray(checkItems) ? checkItems : []).map((item) =>
            this.resolveUploaderFilesPreview(item.images || [])
          )
        ),
      ]);

      const nextCheckItems = (Array.isArray(checkItems) ? checkItems : []).map(
        (item, index) => ({
          ...item,
          images: resolvedCheckItemsImages[index] || [],
        })
      );

      this.setData({
        images: resolvedImages,
        checkItems: nextCheckItems,
      });
    } catch (error) {
      // ignore preview hydration failures
    }
  },

  goToCasualShootList() {
    const taskId = String((this.data.taskDetail && this.data.taskDetail.id) || "").trim();
    const query = taskId ? `?taskId=${encodeURIComponent(taskId)}` : "";
    wx.navigateTo({
      url: `/pages/casualShootList/casualShootList${query}`,
    });
  },

  onCheckResultChange: editable(function (e) {
    this.setData({ checkResult: e.detail });
  }),

  onReadonlyResultTap() {},

  setCheckItem(index, patch) {
    const checkItems = this.data.checkItems.slice();
    checkItems[index] = {
      ...checkItems[index],
      ...patch,
    };
    this.setData({ checkItems });
  },

  openAbnormalDialog(index, item = {}) {
    this.setData({
      ...createEmptyAbnormalState(),
      currentAbnormalItem: index,
      tempDescription: item.description || "",
      tempImages: toUploaderFiles(item.images),
      showAbnormalDialog: true,
    });
  },

  onCheckItemNormal: editable(function (e) {
    this.setCheckItem(Number(e.currentTarget.dataset.index), {
      status: true,
      description: "",
      images: [],
    });
  }),

  onCheckItemAbnormal: editable(function (e) {
    const index = Number(e.currentTarget.dataset.index);
    this.openAbnormalDialog(index, this.data.checkItems[index]);
  }),

  onAbnormalDescChange: editable(function (e) {
    this.setData({ tempDescription: getEventValue(e) });
  }),

  async appendUploaderFiles(targetField, file) {
    const incoming = Array.isArray(file) ? file : [file];
    if (!incoming.length) return;

    wx.showLoading({
      title: "图片上传中",
      mask: true,
    });

    let failedCount = 0;
    const uploaded = [];
    for (const item of incoming) {
      const localPath = String((item && (item.url || item.path)) || "").trim();
      if (!localPath) continue;
      if (!isValidImageType(localPath)) {
        failedCount += 1;
        continue;
      }
      if (!isValidImageSize(item && item.size)) {
        failedCount += 1;
        continue;
      }

      try {
        const result = await uploadImage(localPath);
        const serverPath = String((result && result.path) || "").trim();
        if (!serverPath) {
          failedCount += 1;
          continue;
        }
        uploaded.push({
          path: serverPath,
          url: localPath,
          name: item.name || `image-${Date.now()}`,
        });
      } catch (error) {
        failedCount += 1;
      }
    }

    wx.hideLoading();

    if (uploaded.length) {
      this.setData({ [targetField]: [...this.data[targetField], ...uploaded] });
    }
    if (failedCount > 0) {
      showToast("部分图片上传失败，仅支持JPG/PNG且小于2MB");
    }
  },

  removeUploaderFile(targetField, index) {
    this.setData({
      [targetField]: this.data[targetField].filter((_, i) => i !== index),
    });
  },

  onUploadAbnormalImage: editable(async function (e) {
    await this.appendUploaderFiles("tempImages", e.detail.file);
  }),

  onDeleteAbnormalImage: editable(function (e) {
    this.removeUploaderFile("tempImages", e.detail.index);
  }),

  onCancelAbnormal() {
    this.setData(createEmptyAbnormalState());
  },

  onConfirmAbnormal: editable(function () {
    const { currentAbnormalItem, tempDescription, tempImages } = this.data;
    const descriptionText = String(tempDescription || "").trim();
    if (!descriptionText) {
      return showToast("请填写异常说明");
    }

    this.setCheckItem(currentAbnormalItem, {
      status: false,
      description: descriptionText,
      images: toUploaderFiles(tempImages),
    });

    this.setData(createEmptyAbnormalState());
  }),

  onDescriptionChange: editable(function (e) {
    this.setData({ description: getEventValue(e) });
  }),

  onUploadImage: editable(async function (e) {
    await this.appendUploaderFiles("images", e.detail.file);
  }),

  onDeleteImage: editable(function (e) {
    this.removeUploaderFile("images", e.detail.index);
  }),

  onInspectorChange: editable(function (e) {
    this.setData({ inspector: getEventValue(e) });
  }),

  async onSubmit() {
    const {
      taskDetail,
      checkResult,
      checkItems,
      description,
      images,
      inspector,
      submitting,
      readonly,
    } = this.data;
    if (submitting) return;
    if (readonly) return showToast("该任务已完成，无法提交");

    if (!taskDetail || !taskDetail.id || !taskDetail.table) {
      return showToast("任务信息不完整");
    }
    if (!checkResult) return showToast("请选择巡检结果");
    if (checkItems.some((item) => item.status === null)) {
      return showToast("请完成所有检查项");
    }
    if (!String(inspector || "").trim()) return showToast("请输入巡检人员姓名");

    const payload = buildSubmitPayload({
      taskDetail,
      checkResult,
      checkItems,
      description,
      images,
      inspector,
    });

    this.setData({ submitting: true });
    try {
      const res = await saveTaskForm(payload);
      if (String((res && res.code) || "") !== "0") {
        throw new Error((res && res.msg) || "提交失败");
      }
      markTodoListNeedReload();
      wx.showToast({ title: "提交成功", icon: "success" });
      setTimeout(() => wx.navigateBack(), 1200);
    } catch (error) {
      showToast((error && error.message) || "提交失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
