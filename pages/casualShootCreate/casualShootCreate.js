const {
  saveCasualShootBatch,
  getCasualShootDetail,
} = require("../../api/casualShoot");
const {
  uploadUploaderFiles,
  resolveImagePreviewByProxy,
} = require("../../services/file/image");
const {
  normalizeText,
  normalizeTaskId,
  parseFiles,
} = require("../../utils/casualShoot");

const showToast = (title) => wx.showToast({ title, icon: "none" });
const ISSUE_STATE_PENDING = 10018010;
const ISSUE_SOURCE_NO_TASK = 10021010;
const ISSUE_SOURCE_WITH_TASK = 10021020;
const normalizeIssueId = (value) => normalizeText(value);
const toIssueSource = (taskId) =>
  taskId ? ISSUE_SOURCE_WITH_TASK : ISSUE_SOURCE_NO_TASK;

const normalizeImageValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return String(value).trim();
  return String(value.path || value.url || "").trim();
};

const toRawUploaderFiles = (value) =>
  parseFiles(value).map((path, index) => ({
    path,
    name: `image-${index + 1}`,
  }));

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
    issueId: "",
    readonly: false,
    sections: [createEmptySection()],
    submitting: false,
  },

  onLoad(options = {}) {
    const taskId = normalizeTaskId(options.taskId || options.task);
    const issueId = normalizeIssueId(options.id);
    const readonly = Boolean(issueId);
    this.setData({
      taskId,
      issueId,
      readonly,
    });
    wx.setNavigationBarTitle({
      title: readonly ? "随手拍详情" : "新增随手拍",
    });

    if (issueId) {
      this.loadIssueDetail(issueId);
    }
  },

  async loadIssueDetail(id) {
    try {
      const res = await getCasualShootDetail(id);
      if (String((res && res.code) || "") !== "0") {
        throw new Error((res && res.msg) || "加载详情失败");
      }

      const detail = (res && res.data) || {};
      const description = String(detail.name || "").trim();
      const rawImages = toRawUploaderFiles(detail.files);

      this.setData({
        taskId: normalizeTaskId(detail.task || this.data.taskId),
        sections: [
          {
            key: createSectionKey(),
            description,
            images: [],
          },
        ],
      });
      this.hydrateIssueImagePreviews(rawImages);
    } catch (error) {
      showToast((error && error.message) || "加载详情失败");
    }
  },

  async hydrateIssueImagePreviews(images = []) {
    const source = Array.isArray(images) ? images : [];
    if (!source.length) return;

    const resolved = await Promise.all(
      source.map(async (item, index) => {
        const path = String((item && item.path) || "").trim();
        if (!path) return null;

        const url = await resolveImagePreviewByProxy(path);
        if (!url) return null;

        return {
          path,
          url,
          name: (item && item.name) || `image-${index + 1}`,
        };
      }),
    );

    const validImages = resolved.filter(Boolean);
    this.updateSection(0, { images: validImages });
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
    if (this.data.readonly) return;
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;
    const value = (e.detail && e.detail.value) || "";
    this.updateSection(index, { description: value });
  },

  async onUploadImages(e) {
    if (this.data.readonly) return;
    const index = Number(e.currentTarget.dataset.index);
    if (Number.isNaN(index)) return;

    const { uploaded: files, failedCount } = await uploadUploaderFiles(e.detail.file);
    if (!files.length && failedCount <= 0) return;

    const target = this.data.sections[index] || createEmptySection();
    if (files.length) {
      this.updateSection(index, {
        images: [...target.images, ...files],
      });
    }
    if (failedCount > 0) {
      showToast("部分图片上传失败");
    }
  },

  onDeleteImage(e) {
    if (this.data.readonly) return;
    const index = Number(e.currentTarget.dataset.index);
    const imageIndex = Number(e.detail.index);
    if (Number.isNaN(index) || Number.isNaN(imageIndex)) return;

    const target = this.data.sections[index] || {};
    const images = (target.images || []).filter((_, i) => i !== imageIndex);
    this.updateSection(index, { images });
  },

  onAddSection() {
    if (this.data.readonly) return;
    this.setData({
      sections: [...this.data.sections, createEmptySection()],
    });
  },

  onRemoveSection(e) {
    if (this.data.readonly) return;
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
      list: items.map((item) => ({
        task: taskId || "",
        name: item.description,
        files: item.images.join(","),
        state: ISSUE_STATE_PENDING,
        source,
      })),
    };
  },

  async onSubmit() {
    if (this.data.readonly) return showToast("详情只读，无法提交");
    if (this.data.submitting) return;

    const items = this.buildSubmitItems();
    if (!items.length) return showToast("请至少填写一项描述");
    if (items.some((item) => !item.description)) {
      return showToast("每一项都需要描述");
    }

    this.setData({ submitting: true });
    try {
      const payload = this.buildSubmitPayload(items);
      const res = await saveCasualShootBatch(payload);
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
