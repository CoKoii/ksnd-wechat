// pages/checkInfo/checkInfo.js
const { getTaskDetail, saveTaskForm } = require("../../api/task");
const { BASE_URL } = require("../../utils/http");

const NO_VALUE = "--";
const COMPLETED_STATE = "10018090";

const showToast = (title) => wx.showToast({ title, icon: "none" });
const createEmptyAbnormalState = () => ({
  showAbnormalDialog: false,
  currentAbnormalItem: null,
  tempDescription: "",
  tempImages: [],
});
const getEventValue = (e) =>
  (e && e.detail && (e.detail.value !== undefined ? e.detail.value : e.detail)) ||
  "";
const editable =
  (handler) =>
  function (...args) {
    if (this.data.readonly) return;
    return handler.apply(this, args);
  };

const formatDate = (value) => {
  const date = String(value || "")
    .trim()
    .split(" ")[0];
  return date || NO_VALUE;
};

const toCheckResult = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value) === "1" ? "normal" : "abnormal";
};

const toItemStatus = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value) === "1";
};

const normalizeImageUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:\/\/|wxfile:\/\/|data:)/i.test(url)) return url;

  const base = String(BASE_URL || "").replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "").replace(/^ksndsrv\/+/i, "");
  return base ? `${base}/${path}` : path;
};

const toRawImageValue = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.url || item.path || "";
};

const toImageUrls = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return source
    .map(toRawImageValue)
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map(normalizeImageUrl)
    .filter(Boolean);
};

const toUploaderFiles = (value) =>
  toImageUrls(value).map((url, index) => ({
    url,
    name: `image-${index + 1}`,
  }));

const toCsv = (value) => toImageUrls(value).join(",");

const buildCheckItems = (fields = [], vals = []) => {
  const latestVals = (Array.isArray(vals) && vals[0]) || {};
  return (Array.isArray(fields) ? fields : [])
    .slice()
    .sort((a, b) => Number(a.snum || 0) - Number(b.snum || 0))
    .map((field, index) => {
      const seq = index + 1;
      return {
        id: field.id || String(seq),
        name: field.name || `检查项${seq}`,
        status: toItemStatus(latestVals[`value${seq}`]),
        description: String(latestVals[`memo${seq}`] || ""),
        images: toImageUrls(latestVals[`file${seq}`]),
      };
    });
};

const buildSubmitPayload = ({
  taskDetail,
  checkResult,
  checkItems,
  description,
  images,
  inspector,
}) => {
  const payload = {
    task: taskDetail.id || "",
    table: taskDetail.table || "",
    ckrs: checkResult === "normal" ? "1" : "0",
    ckdesc: String(description || "").trim(),
    ckpics: toCsv(images),
    cssign: String(inspector || "").trim(),
  };

  checkItems.forEach((item, index) => {
    const seq = index + 1;
    payload[`value${seq}`] = item.status ? "1" : "0";
    payload[`memo${seq}`] = String(item.description || "").trim();
    payload[`file${seq}`] = toCsv(item.images);
  });

  return payload;
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
      this.setData({
        taskDetail: {
          ...detail,
          publisher: detail.pjname || detail.creator_fk || NO_VALUE,
          requiredDate: formatDate(detail.cktime || detail.create_time),
        },
        readonly,
        checkResult: toCheckResult(detail.ckrs),
        checkItems: buildCheckItems(detail.fields, detail.vals),
        inspector: detail.cssign || detail.cksign || detail.checker || "",
        description: detail.ckdesc || "",
        images: toUploaderFiles(detail.ckpics),
        ...createEmptyAbnormalState(),
      });
    } catch (error) {
      showToast((error && error.message) || "加载详情失败");
    }
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

  appendUploaderFiles(targetField, file) {
    const incoming = Array.isArray(file) ? file : [file];
    const next = incoming.map((item) => ({ url: item.url || item.path }));
    this.setData({ [targetField]: [...this.data[targetField], ...next] });
  },

  removeUploaderFile(targetField, index) {
    this.setData({
      [targetField]: this.data[targetField].filter((_, i) => i !== index),
    });
  },

  onUploadAbnormalImage: editable(function (e) {
    this.appendUploaderFiles("tempImages", e.detail.file);
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
      images: toImageUrls(tempImages),
    });

    this.setData(createEmptyAbnormalState());
  }),

  onDescriptionChange: editable(function (e) {
    this.setData({ description: getEventValue(e) });
  }),

  onUploadImage: editable(function (e) {
    this.appendUploaderFiles("images", e.detail.file);
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

    if (!checkItems.length) return showToast("暂无检查项");
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
      wx.showToast({ title: "提交成功", icon: "success" });
      setTimeout(() => wx.navigateBack(), 1200);
    } catch (error) {
      showToast((error && error.message) || "提交失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
