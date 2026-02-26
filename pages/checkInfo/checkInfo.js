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
  isAbsoluteImageUrl,
  withCasualShootPreviewPlaceholders,
  hydrateCasualShootListPreviewImages,
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
  sortCheckItemsForDetail,
  buildSubmitPayload,
} = require("./utils");

const showToast = (title) => wx.showToast({ title, icon: "none" });
const SIGNATURE_FIELD_CONFIG = {
  inspector: {
    field: "inspector",
    pathKey: "signatureImagePath",
    urlKey: "signatureImageUrl",
    detailKeys: ["cssign", "cksign", "checker"],
    requiredText: "请完成巡检人员签名",
    uploadNamePrefix: "inspector-signature",
  },
  company: {
    field: "company",
    pathKey: "companySignatureImagePath",
    urlKey: "companySignatureImageUrl",
    detailKeys: ["cosign", "csign", "companysign"],
    requiredText: "请完成企业签名",
    uploadNamePrefix: "company-signature",
  },
};

const normalizeSignaturePath = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  const looksLikePath =
    /^(https?:\/\/|wxfile:\/\/|data:)/i.test(text) || /[\\/]/.test(text);
  return looksLikePath ? text : "";
};

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
    signatureImagePath: null,
    signatureImageUrl: null,
    companySignatureImagePath: null,
    companySignatureImageUrl: null,
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
    if (this._skipNextShowReload) {
      this._skipNextShowReload = false;
      return;
    }
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
      const rawCheckItems = buildCheckItems(detail.fields, detail.vals);
      const checkItems = readonly
        ? sortCheckItemsForDetail(rawCheckItems)
        : rawCheckItems;
      const images = toUploaderFiles(detail.ckpics);

      const inspectorSignaturePath = this.getSignaturePathFromDetail(
        detail,
        "inspector",
      );
      const companySignaturePath = this.getSignaturePathFromDetail(
        detail,
        "company",
      );
      const signatureImageUrl = readonly && isAbsoluteImageUrl(inspectorSignaturePath)
        ? inspectorSignaturePath
        : null;
      const companySignatureImageUrl =
        readonly && isAbsoluteImageUrl(companySignaturePath)
          ? companySignaturePath
        : null;

      this.setData({
        taskDetail: {
          ...detail,
          publisher: detail.pjname || detail.creator_fk || NO_VALUE,
          requiredDate: formatDate(detail.cktime || detail.create_time),
        },
        readonly,
        checkResult: toCheckResult(detail.ckrs),
        checkItems,
        signatureImageUrl: signatureImageUrl,
        signatureImagePath: null,
        companySignatureImageUrl: companySignatureImageUrl,
        companySignatureImagePath: null,
        description: detail.ckdesc || "",
        images,
        ...createEmptyAbnormalState(),
      });
      if (readonly) {
        this.hydrateSignaturePreview(inspectorSignaturePath, "signatureImageUrl");
        this.hydrateSignaturePreview(
          companySignaturePath,
          "companySignatureImageUrl",
        );
      }
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
          const path = String(
            (file && file.path) || (file && file.url) || "",
          ).trim();
          const url = String((file && file.url) || "").trim();
          return {
            ...file,
            path,
            url: isAbsoluteImageUrl(url) ? url : "",
          };
        }
      }),
    );
    return resolved.filter((item) => item && item.path);
  },

  async hydrateDetailImagePreviews(checkItems = [], images = []) {
    try {
      const [resolvedImages, resolvedCheckItemsImages] = await Promise.all([
        this.resolveUploaderFilesPreview(images),
        Promise.all(
          (Array.isArray(checkItems) ? checkItems : []).map((item) =>
            this.resolveUploaderFilesPreview(item.images || []),
          ),
        ),
      ]);

      const nextCheckItems = (Array.isArray(checkItems) ? checkItems : []).map(
        (item, index) => ({
          ...item,
          images: resolvedCheckItemsImages[index] || [],
        }),
      );

      this.setData({
        images: resolvedImages,
        checkItems: nextCheckItems,
      });
    } catch (error) {
      // ignore preview hydration failures
    }
  },

  async hydrateSignaturePreview(signaturePath, targetField = "signatureImageUrl") {
    const rawPath = String(signaturePath || "").trim();
    if (!rawPath || isAbsoluteImageUrl(rawPath)) return;

    try {
      const previewUrl = await resolveImagePreview(rawPath);
      if (!previewUrl) return;
      if (this.data.readonly !== true) return;
      this.setData({ [targetField]: previewUrl });
    } catch (error) {
      // ignore signature preview hydration failures
    }
  },

  getSignatureFieldConfig(field) {
    const target = String(field || "").trim();
    return SIGNATURE_FIELD_CONFIG[target] || SIGNATURE_FIELD_CONFIG.inspector;
  },

  getSignaturePathFromDetail(detail, field) {
    const config = this.getSignatureFieldConfig(field);
    const source = detail && typeof detail === "object" ? detail : {};
    const keys = Array.isArray(config.detailKeys) ? config.detailKeys : [];

    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const candidate = normalizeSignaturePath(source[key]);
      if (candidate) return candidate;
    }
    return "";
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
      this.setData({
        casualShootList: withCasualShootPreviewPlaceholders(casualShootList),
      });
      try {
        const hydratedList = await hydrateCasualShootListPreviewImages(
          casualShootList,
          {
            resolvePreview: resolveImagePreview,
          },
        );
        this.setData({ casualShootList: hydratedList });
      } catch (error) {
        // ignore preview hydration failures for list thumbnails
      }
    } catch (error) {
      this.setData({ casualShootList: [] });
      showToast((error && error.message) || "随手拍加载失败");
    } finally {
      this.setData({ casualShootLoading: false });
    }
  },

  onCasualShootRecordTap(e) {
    const detail = (e && e.detail) || {};
    const issueId = normalizeText(detail.id || (detail.item && detail.item.id));
    if (!issueId) return;
    wx.navigateTo({
      url: `/pages/casualShootCreate/casualShootCreate?id=${encodeURIComponent(issueId)}`,
    });
  },

  onCasualShootPreviewOpen() {
    this._skipNextShowReload = true;
  },

  onCasualShootPreviewFail() {
    this._skipNextShowReload = false;
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
    const action = String(e.currentTarget.dataset.action || "").trim();
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

  goToSignature(e) {
    if (this.data.readonly) return;
    const { pathKey, urlKey } = this.getSignatureFieldConfig(
      e && e.currentTarget && e.currentTarget.dataset
        ? e.currentTarget.dataset.field
        : "",
    );
    wx.navigateTo({
      url: "/pages/signature/signature",
      success: (res) => {
        // 从签名页返回时不刷新随手拍列表，避免无关接口请求
        this._skipNextShowReload = true;
        const eventChannel = res && res.eventChannel;
        if (!eventChannel) return;
        eventChannel.on("signatureSaved", ({ imagePath } = {}) => {
          const nextPath = String(imagePath || "").trim();
          if (!nextPath) return;
          this.setData({
            [pathKey]: nextPath,
            [urlKey]: null,
          });
        });
      },
    });
  },

  async resolveSubmitSignaturePath(localPath, fileName) {
    if (!localPath) return "";

    const { uploaded, failedCount } = await uploadUploaderFiles(
      {
        path: localPath,
        name: fileName,
      },
      {
        showLoading: false,
      },
    );
    if (failedCount > 0 || !uploaded.length) {
      throw new Error("签名图片上传失败");
    }

    const uploadedPath = String((uploaded[0] && uploaded[0].path) || "").trim();
    if (!uploadedPath) {
      throw new Error("签名图片上传失败");
    }
    return uploadedPath;
  },

  getSubmitSignatureLocalPath(field) {
    const { pathKey } = this.getSignatureFieldConfig(field);
    return String(this.data[pathKey] || "").trim();
  },

  validateSubmitSignatures() {
    const inspectorConfig = this.getSignatureFieldConfig("inspector");
    const companyConfig = this.getSignatureFieldConfig("company");
    if (!this.getSubmitSignatureLocalPath(inspectorConfig.field)) {
      throw new Error(inspectorConfig.requiredText);
    }
    if (!this.getSubmitSignatureLocalPath(companyConfig.field)) {
      throw new Error(companyConfig.requiredText);
    }
  },

  async uploadSubmitSignatures() {
    const inspectorConfig = this.getSignatureFieldConfig("inspector");
    const companyConfig = this.getSignatureFieldConfig("company");
    const inspectorLocalPath = this.getSubmitSignatureLocalPath(
      inspectorConfig.field,
    );
    const companyLocalPath = this.getSubmitSignatureLocalPath(
      companyConfig.field,
    );
    const timestamp = Date.now();

    wx.showLoading({
      title: "签名上传中",
      mask: true,
    });
    try {
      const [inspector, companySign] = await Promise.all([
        this.resolveSubmitSignaturePath(
          inspectorLocalPath,
          `${inspectorConfig.uploadNamePrefix}-${timestamp}.png`,
        ),
        this.resolveSubmitSignaturePath(
          companyLocalPath,
          `${companyConfig.uploadNamePrefix}-${timestamp}.png`,
        ),
      ]);

      return { inspector, companySign };
    } finally {
      wx.hideLoading();
    }
  },

  async onSubmit() {
    const {
      taskDetail,
      checkResult,
      checkItems,
      description,
      images,
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
    try {
      this.validateSubmitSignatures();
    } catch (error) {
      return showToast((error && error.message) || "请完成签名");
    }

    this.setData({ submitting: true });
    try {
      const { inspector: signatureUrl, companySign: companySignatureUrl } =
        await this.uploadSubmitSignatures();

      const payload = buildSubmitPayload({
        taskDetail,
        checkResult,
        checkItems,
        description,
        images,
        inspector: signatureUrl,
        companySign: companySignatureUrl,
      });

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
