const { getTaskDetail, saveTaskForm } = require("../../api/task");
const { getCasualShootList } = require("../../api/casualShoot");
const {
  uploadUploaderFiles,
  resolveImagePreview,
} = require("../../services/file/image");
const { markTodoListNeedReload } = require("../../services/task/localState");
const { getPersistedProjectId } = require("../../services/project/localState");
const {
  normalizeText,
  normalizeProjectId,
  normalizeTaskId,
  parseCasualShootListResponse,
  toCasualShootListItem,
} = require("../../utils/casualShoot");
const {
  NO_VALUE,
  COMPLETED_STATE,
  CHECK_ITEM_IGNORE,
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
    casualShootList: [],
    casualShootLoading: false,
    ...createEmptyAbnormalState(),
  },

  onLoad(options) {
    if (!options.id) return showToast("缺少任务ID");
    const taskId = normalizeTaskId(options.id);
    this.setData({ id: taskId });
    this.loadDetailData(taskId);
  },

  onShow() {
    this.loadCasualShootList();
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

  goToCasualShootCreate() {
    const taskId = normalizeTaskId(this.data.id);
    wx.navigateTo({
      url: taskId
        ? `/pages/casualShootCreate/casualShootCreate?taskId=${encodeURIComponent(taskId)}`
        : "/pages/casualShootCreate/casualShootCreate",
    });
  },

  async loadCasualShootList() {
    if (this.data.casualShootLoading) return;

    const taskId = normalizeTaskId(this.data.id);
    if (!taskId) {
      this.setData({ casualShootList: [] });
      return;
    }

    const projectId = normalizeProjectId(getPersistedProjectId());

    this.setData({ casualShootLoading: true });
    try {
      const response = await getCasualShootList({
        params: {
          project: projectId || "",
          task: taskId,
        },
      });
      const casualShootList = parseCasualShootListResponse(response)
        .map(toCasualShootListItem)
        .sort((a, b) => b.sortTimestamp - a.sortTimestamp);
      this.setData({ casualShootList });
    } catch (error) {
      this.setData({ casualShootList: [] });
      showToast((error && error.message) || "随手拍加载失败");
    } finally {
      this.setData({ casualShootLoading: false });
    }
  },

  goToCasualShootDetail(e) {
    const issueId = normalizeText(e.currentTarget.dataset.id);
    if (!issueId) return;
    wx.navigateTo({
      url: `/pages/casualShootCreate/casualShootCreate?id=${encodeURIComponent(issueId)}`,
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

  onCheckItemAction: editable(function (e) {
    const index = Number(e.currentTarget.dataset.index);
    const action = String((e.currentTarget.dataset.action || "")).trim();
    if (Number.isNaN(index) || !action) return;

    if (action === "normal") {
      this.setCheckItem(index, {
        status: true,
        description: "",
        images: [],
      });
      return;
    }

    if (action === "abnormal") {
      this.openAbnormalDialog(index, this.data.checkItems[index]);
      return;
    }

    if (action === "ignore") {
      this.setCheckItem(index, {
        status: CHECK_ITEM_IGNORE,
        description: "",
        images: [],
      });
    }
  }),

  onAbnormalDescChange: editable(function (e) {
    this.setData({ tempDescription: getEventValue(e) });
  }),

  async appendUploaderFiles(targetField, file) {
    const { uploaded, failedCount } = await uploadUploaderFiles(file);

    if (uploaded.length) {
      this.setData({ [targetField]: [...this.data[targetField], ...uploaded] });
    }
    if (failedCount > 0) {
      showToast("部分图片上传失败");
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
