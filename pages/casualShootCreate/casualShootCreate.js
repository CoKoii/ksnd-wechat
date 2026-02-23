const { saveCasualShootBatch } = require("../../api/casualShoot");
const { uploadImage } = require("../../services/file/image");

const showToast = (title) => wx.showToast({ title, icon: "none" });
const ISSUE_STATE_PENDING = 10018010;
const ISSUE_SOURCE_NO_TASK = 10021010;
const ISSUE_SOURCE_WITH_TASK = 10021020;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const normalizeTaskId = (value) => String(value || "").trim();
const toIssueSource = (taskId) =>
  taskId ? ISSUE_SOURCE_WITH_TASK : ISSUE_SOURCE_NO_TASK;
const isValidImageType = (path = "") => /\.(jpe?g|png)$/i.test(String(path || ""));
const isValidImageSize = (size) => !size || Number(size) <= MAX_IMAGE_SIZE;

const normalizeImageValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return String(value).trim();
  return String(value.path || value.url || "").trim();
};

const createSectionKey = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createEmptySection = () => ({
  key: createSectionKey(),
  description: "",
  images: [],
});

Page({
  data: {
    taskId: "",
    sections: [createEmptySection()],
    submitting: false,
  },

  onLoad(options = {}) {
    const taskId = normalizeTaskId(options.taskId || options.task);
    this.setData({
      taskId,
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

  async onUploadImages(e) {
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;

    const incoming = Array.isArray(e.detail.file) ? e.detail.file : [e.detail.file];
    if (!incoming.length) return;

    wx.showLoading({
      title: "图片上传中",
      mask: true,
    });

    const files = [];
    let failedCount = 0;
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
        const path = String((result && result.path) || "").trim();
        if (!path) {
          failedCount += 1;
          continue;
        }
        files.push({
          path,
          url: localPath,
        });
      } catch (error) {
        failedCount += 1;
      }
    }

    wx.hideLoading();
    if (!files.length && failedCount <= 0) return;

    const target = this.data.sections[index] || createEmptySection();
    if (files.length) {
      this.updateSection(index, {
        images: [...target.images, ...files],
      });
    }
    if (failedCount > 0) {
      showToast("部分图片上传失败，仅支持JPG/PNG且小于2MB");
    }
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
      wx.showToast({ title: "提交成功", icon: "success" });
      setTimeout(() => wx.navigateBack(), 900);
    } catch (error) {
      showToast((error && error.message) || "操作失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
