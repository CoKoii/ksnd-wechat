const {
  STATUS_PENDING,
  STATUS_DONE,
  getCasualShootRecordById,
  createCasualShootRecord,
  updateCasualShootRecord,
  formatDateTime,
} = require("../../services/casualShoot/store");
const { saveCasualShootBatch } = require("../../api/casualShoot");

const showToast = (title) => wx.showToast({ title, icon: "none" });
const ISSUE_STATE_PENDING = 10018010;
const ISSUE_SOURCE_NO_TASK = 10021010;
const ISSUE_SOURCE_WITH_TASK = 10021020;
const normalizeTaskId = (value) => String(value || "").trim();
const toIssueSource = (taskId) =>
  taskId ? ISSUE_SOURCE_WITH_TASK : ISSUE_SOURCE_NO_TASK;

const normalizeImageValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return String(value).trim();
  return String(value.url || value.path || "").trim();
};

const createSectionKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptySection = () => ({
  key: createSectionKey(),
  description: "",
  images: [],
});

const toStatus = (status) =>
  status === STATUS_DONE ? STATUS_DONE : STATUS_PENDING;

const toRecordMeta = (record = {}) => {
  const status = toStatus(record.status);
  return {
    statusText: status === STATUS_DONE ? "已整改" : "未整改",
    statusClass: status === STATUS_DONE ? "is-done" : "is-pending",
    createdAtText: formatDateTime(record.createdAt),
    updatedAtText: formatDateTime(record.updatedAt),
  };
};

const toSections = (items = []) => {
  const list = (Array.isArray(items) ? items : [])
    .map((item) => ({
      key: createSectionKey(),
      description: String((item && item.description) || ""),
      images: (Array.isArray(item && item.images) ? item.images : [])
        .map(normalizeImageValue)
        .filter(Boolean)
        .map((url) => ({ url })),
    }))
    .filter((item) => item.description || item.images.length);
  return list.length ? list : [createEmptySection()];
};

Page({
  data: {
    id: "",
    taskId: "",
    isEdit: false,
    recordMeta: null,
    sections: [createEmptySection()],
    submitting: false,
    submitText: "提交",
  },

  onLoad(options = {}) {
    const id = String(options.id || "").trim();
    const taskId = normalizeTaskId(options.taskId || options.task);
    const isEdit = Boolean(id);

    this.setData({
      id,
      taskId,
      isEdit,
      submitText: isEdit ? "保存" : "提交",
    });

    wx.setNavigationBarTitle({
      title: isEdit ? "随手拍详情" : "新增随手拍",
    });

    if (isEdit) {
      this.loadRecord();
    }
  },

  loadRecord() {
    const record = getCasualShootRecordById(this.data.id);
    if (!record) {
      this.setData({
        recordMeta: null,
        sections: [createEmptySection()],
      });
      showToast("记录不存在或已删除");
      return;
    }

    this.setData({
      recordMeta: toRecordMeta(record),
      sections: toSections(record.items),
      taskId: normalizeTaskId(this.data.taskId || record.task),
    });
  },

  updateSection(index, patch) {
    const sections = this.data.sections.slice();
    sections[index] = {
      ...sections[index],
      ...patch,
    };
    this.setData({ sections });
  },

  onDescriptionInput(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;
    const value = (e.detail && e.detail.value) || "";
    this.updateSection(index, { description: value });
  },

  onUploadImages(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;

    const incoming = Array.isArray(e.detail.file) ? e.detail.file : [e.detail.file];
    const files = incoming
      .map((item) => normalizeImageValue(item))
      .filter(Boolean)
      .map((url) => ({ url }));
    if (!files.length) return;

    const target = this.data.sections[index] || createEmptySection();
    this.updateSection(index, {
      images: [...target.images, ...files],
    });
  },

  onDeleteImage(e) {
    const index = Number(e.currentTarget.dataset.index);
    const imageIndex = Number(e.detail.index);
    if (Number.isNaN(index) || Number.isNaN(imageIndex)) return;

    const target = this.data.sections[index] || {};
    const images = (target.images || []).filter((_, i) => i !== imageIndex);
    this.updateSection(index, { images });
  },

  onAddSection() {
    this.setData({
      sections: [...this.data.sections, createEmptySection()],
    });
  },

  onRemoveSection(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;
    if (this.data.sections.length <= 1) return showToast("至少保留一项");

    wx.showModal({
      title: "删除确认",
      content: "确定删除这一项吗？",
      success: (res) => {
        if (!res.confirm) return;
        const sections = this.data.sections.filter((_, i) => i !== index);
        this.setData({ sections });
      },
    });
  },

  buildSubmitItems() {
    return this.data.sections
      .map((section) => ({
        description: String(section.description || "").trim(),
        images: (section.images || []).map(normalizeImageValue).filter(Boolean),
      }))
      .filter((item) => item.description || item.images.length);
  },

  buildSubmitPayload(items = []) {
    const taskId = normalizeTaskId(this.data.taskId);
    const source = toIssueSource(taskId);

    return {
      taskId,
      source,
      payload: {
        list: items.map((item) => ({
          task: taskId || "",
          name: item.description,
          files: item.images.join(","),
          state: ISSUE_STATE_PENDING,
          source,
        })),
      },
    };
  },

  async onSubmit() {
    if (this.data.submitting) return;

    const items = this.buildSubmitItems();
    if (!items.length) return showToast("请至少填写一项描述");
    if (items.some((item) => !item.description)) {
      return showToast("每一项都需要描述");
    }

    this.setData({ submitting: true });
    try {
      const submitData = this.buildSubmitPayload(items);
      const res = await saveCasualShootBatch(submitData.payload);
      if (String((res && res.code) || "") !== "0") {
        throw new Error((res && res.msg) || "提交失败");
      }

      if (this.data.isEdit) {
        updateCasualShootRecord(this.data.id, {
          items,
          task: submitData.taskId,
          source: submitData.source,
        });
        wx.showToast({ title: "保存成功", icon: "success" });
        this.loadRecord();
      } else {
        createCasualShootRecord({
          items,
          task: submitData.taskId,
          source: submitData.source,
        });
        wx.showToast({ title: "提交成功", icon: "success" });
        setTimeout(() => wx.navigateBack(), 900);
      }
    } catch (error) {
      showToast((error && error.message) || "操作失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
