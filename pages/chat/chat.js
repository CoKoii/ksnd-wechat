// 聊天页面主逻辑
const { UI_TEXT, UI_CONFIG } = require("./chat.constants");
const {
  createId,
  trimMessage,
  getScrollTargetId,
  limitMessages,
  getWindowInfoSafe,
  getSafeAreaInsets,
  buildTitleFromContent,
  formatTimeLabel,
} = require("./utils/chat.utils");
const { fetchHazardAnalyzeReply } = require("./utils/chat.service");
const { markdownToHtml } = require("./utils/chat.markdown");
const {
  loadConversations,
  saveConversations,
} = require("./utils/chat.storage");
const {
  uploadImage,
  resolveImageShowUrl,
} = require("../../services/file/image");
const { BASE_URL } = require("../../utils/http");
const { BASIC_HOME_PATH } = require("../../utils/util");

const nextTick = (callback) => {
  if (typeof wx.nextTick === "function") {
    wx.nextTick(callback);
    return;
  }
  setTimeout(callback, 0);
};

const normalizeText = (value) => String(value == null ? "" : value).trim();
const isAbsoluteImageUrl = (value) =>
  /^https?:\/\//i.test(normalizeText(value));
const isUploadObjname = (value) => /^\/uploads\//i.test(normalizeText(value));
const toBaseAbsoluteUrl = (value) => {
  const path = normalizeText(value);
  if (!path) return "";
  if (isAbsoluteImageUrl(path)) return path;
  if (!/^\/uploads\//i.test(path)) return "";
  const base = normalizeText(BASE_URL).replace(/\/+$/, "");
  if (!base) return "";
  const host = base.replace(/\/ksndsrv$/i, "");
  return `${host}${path}`;
};

const normalizeRegulations = (value) => {
  if (!Array.isArray(value)) {
    const text = normalizeText(value);
    return text ? [text] : [];
  }
  return value.map((item) => normalizeText(item)).filter(Boolean);
};

const normalizeReferenceImages = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (item && typeof item === "object") {
        const url = normalizeText(item.url);
        const label = normalizeText(item.label) || `图示${index + 1}`;
        return { url, label };
      }
      const url = normalizeText(item);
      return {
        url,
        label: `图示${index + 1}`,
      };
    })
    .filter((item) => item.url);
};

const normalizeStructured = (structured) => {
  if (!structured || typeof structured !== "object") return null;
  return {
    deviceType: normalizeText(structured.deviceType),
    hazardDetail: normalizeText(structured.hazardDetail),
    regulations: normalizeRegulations(structured.regulations),
    location: normalizeText(structured.location),
    imageAnalysis: normalizeText(structured.imageAnalysis),
    imageItem: normalizeText(structured.imageItem),
    referenceImages: normalizeReferenceImages(structured.referenceImages),
  };
};

const buildStructuredSummary = (structured) => {
  const info = normalizeStructured(structured);
  if (!info) return "";
  return (
    normalizeText(info.hazardDetail) ||
    normalizeText(info.deviceType) ||
    normalizeText(info.imageAnalysis) ||
    UI_TEXT.errorFallback
  );
};

const chooseSingleImage = () =>
  new Promise((resolve, reject) => {
    const onSuccess = (filePath) => resolve(normalizeText(filePath));

    if (typeof wx.chooseMedia === "function") {
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        sizeType: ["compressed"],
        success: (res) => {
          const tempFiles = (res && res.tempFiles) || [];
          const picked = tempFiles[0] || {};
          onSuccess(picked.tempFilePath || picked.path || "");
        },
        fail: reject,
      });
      return;
    }

    wx.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const list = (res && res.tempFilePaths) || [];
        onSuccess(list[0] || "");
      },
      fail: reject,
    });
  });

const isUserCancel = (error) =>
  /cancel/i.test(normalizeText(error && (error.errMsg || error.message)));
const safeHideLoading = () => {
  try {
    wx.hideLoading();
  } catch (error) {
    // ignore
  }
};

Page({
  conversationStore: [],
  activeConversationId: "",

  data: {
    uiText: UI_TEXT,
    statusBarHeight: 0,
    safeAreaBottom: 0,
    navHeight: 0,
    navSideWidth: 96,
    contentHeight: 0,
    scrollSpacerHeight: 0,
    conversations: [],
    activeConversationId: "",
    navTitle: UI_TEXT.title,
    messages: [],
    inputValue: "",
    selectedImage: {
      localPath: "",
      url: "",
    },
    isSending: false,
    scrollTargetId: "",
    scrollTop: 0,
    sidebarOpen: false,
  },

  onLoad() {
    const { statusBarHeight, safeAreaBottom } = getSafeAreaInsets();
    this.setData({ statusBarHeight, safeAreaBottom });
    this.setNavMetrics();
    this.initConversations();
  },

  onReady() {
    this.updateLayout();
    this.queueScrollToBottom();
  },

  onShow() {
    this.updateLayout();
    wx.hideTabBar({ animation: false });
  },

  onHide() {
    wx.showTabBar({ animation: false });
  },

  updateLayout() {
    nextTick(() => {
      const windowInfo = getWindowInfoSafe();
      const windowHeight =
        windowInfo.windowHeight || windowInfo.screenHeight || 0;
      const query = wx.createSelectorQuery().in(this);
      const getRect = (rects, index) =>
        (rects && rects[index]) || { height: 0 };
      const extraPadding = 16;
      query.select(".nav").boundingClientRect();
      query.select(".composer").boundingClientRect();
      query.exec((res) => {
        const navRect = getRect(res, 0);
        const composerRect = getRect(res, 1);
        const contentHeight = Math.max(
          windowHeight - navRect.height - composerRect.height,
          0,
        );
        const scrollSpacerHeight =
          Math.max(composerRect.height, this.data.safeAreaBottom) +
          extraPadding;
        this.setData({ contentHeight, scrollSpacerHeight });
      });
    });
  },

  setNavMetrics() {
    const windowInfo = getWindowInfoSafe();
    const menuButton = wx.getMenuButtonBoundingClientRect
      ? wx.getMenuButtonBoundingClientRect()
      : null;
    const statusBarHeight =
      this.data.statusBarHeight || windowInfo.statusBarHeight || 0;
    let navHeight = statusBarHeight + 44;
    let navSideWidth = 96;
    if (menuButton) {
      const topGap = Math.max(menuButton.top - statusBarHeight, 0);
      const rightGap = Math.max(
        (windowInfo.windowWidth || 0) - menuButton.right,
        0,
      );
      navHeight = statusBarHeight + menuButton.height + topGap * 2;
      navSideWidth = menuButton.width + rightGap;
    }

    this.setData({ navHeight, navSideWidth });
  },

  initConversations() {
    const stored = loadConversations();
    if (stored.length) {
      this.conversationStore = this.hydrateConversations(stored);
      this.sortConversations();
      this.activeConversationId = this.conversationStore[0].id;
    } else {
      const conversation = this.createConversation();
      this.conversationStore = [conversation];
      this.activeConversationId = conversation.id;
    }
    this.syncConversationView({ scrollToBottom: true });
  },

  createConversation() {
    const now = Date.now();
    return {
      id: createId(),
      title: UI_TEXT.title,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
  },

  hydrateConversations(conversations) {
    return conversations.map((conversation) => ({
      ...conversation,
      messages: (conversation.messages || []).map((message) => {
        const content = normalizeText(message.content);
        return {
          ...message,
          content,
          imageUrl: normalizeText(message.imageUrl),
          imagePath: normalizeText(message.imagePath),
          structured: normalizeStructured(message.structured),
          pending: false,
          html: markdownToHtml(content),
        };
      }),
    }));
  },

  sortConversations() {
    this.conversationStore.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  syncConversationView({ scrollToBottom } = {}) {
    const activeConversation =
      this.conversationStore.find(
        (item) => item.id === this.activeConversationId,
      ) || this.conversationStore[0];

    if (activeConversation) {
      this.activeConversationId = activeConversation.id;
    }

    const toDisplayTitle = (title) =>
      buildTitleFromContent(title || UI_TEXT.title, UI_CONFIG.titleMaxLength) ||
      UI_TEXT.title;
    const conversations = this.conversationStore.map((item) => ({
      id: item.id,
      title: toDisplayTitle(item.title),
      updatedAtText: formatTimeLabel(item.updatedAt),
    }));

    this.setData({
      conversations,
      activeConversationId: this.activeConversationId,
      messages: activeConversation ? activeConversation.messages : [],
      navTitle: activeConversation
        ? toDisplayTitle(activeConversation.title)
        : UI_TEXT.title,
    });

    saveConversations(this.conversationStore);

    if (scrollToBottom) {
      nextTick(() => this.queueScrollToBottom());
    }
  },

  getConversationById(id) {
    return this.conversationStore.find((item) => item.id === id);
  },

  getActiveConversation() {
    return this.getConversationById(this.activeConversationId);
  },

  onBack() {
    const pages = getCurrentPages();
    if (pages && pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: BASIC_HOME_PATH });
  },

  openSidebar() {
    this.setData({ sidebarOpen: true });
  },

  closeSidebar() {
    this.setData({ sidebarOpen: false });
  },

  onSelectConversation(event) {
    const { id } = event.currentTarget.dataset || {};
    if (!id) return;
    this.activeConversationId = id;
    this.closeSidebar();
    this.setData({
      inputValue: "",
      selectedImage: {
        localPath: "",
        url: "",
      },
    });
    this.syncConversationView({ scrollToBottom: true });
  },

  onNewChat() {
    const conversation = this.createConversation();
    this.conversationStore.unshift(conversation);
    this.activeConversationId = conversation.id;
    this.sortConversations();
    this.closeSidebar();
    this.setData({
      inputValue: "",
      selectedImage: {
        localPath: "",
        url: "",
      },
    });
    this.syncConversationView({ scrollToBottom: true });
  },

  onInput(event) {
    this.setData({ inputValue: event.detail.value });
  },

  onConfirm() {
    this.handleSend();
  },

  onSendTap() {
    this.handleSend();
  },

  async onAttachTap() {
    if (this.data.isSending) return;
    try {
      const filePath = await chooseSingleImage();
      if (!filePath) return;
      this.setData({
        selectedImage: {
          localPath: filePath,
          url: filePath,
        },
      });
      this.updateLayout();
    } catch (error) {
      if (isUserCancel(error)) return;
      wx.showToast({ title: UI_TEXT.imagePickFailed, icon: "none" });
    }
  },

  onRemoveSelectedImage() {
    if (this.data.isSending) return;
    this.setData({
      selectedImage: {
        localPath: "",
        url: "",
      },
    });
    this.updateLayout();
  },

  previewImage(url) {
    const current = normalizeText(url);
    if (!current) return;
    wx.previewImage({
      current,
      urls: [current],
    });
  },

  onPreviewSelectedImage() {
    const selectedImage = this.data.selectedImage || {};
    this.previewImage(selectedImage.url || selectedImage.localPath);
  },

  onPreviewMessageImage(event) {
    const dataset = (event.currentTarget && event.currentTarget.dataset) || {};
    this.previewImage(dataset.url);
  },

  buildMessage(role, content, options = {}) {
    const normalizedContent = normalizeText(content);
    return {
      id: createId(),
      role,
      content: normalizedContent,
      html: markdownToHtml(normalizedContent),
      pending: options.pending || false,
      imageUrl: normalizeText(options.imageUrl),
      imagePath: normalizeText(options.imagePath),
      structured: normalizeStructured(options.structured),
    };
  },

  updateConversation(conversation, scrollToBottom) {
    conversation.updatedAt = Date.now();
    this.sortConversations();
    this.syncConversationView({ scrollToBottom });
  },

  queueScrollToBottom(targetId) {
    nextTick(() => {
      const fallbackId = targetId || getScrollTargetId(this.data.messages);
      const nextTop = this.data.scrollTop + 9999;
      this.setData({
        scrollTop: nextTop,
        scrollTargetId: fallbackId,
      });
    });
  },

  updateConversationTitleIfNeeded(conversation, assistantId) {
    if (!conversation || conversation.title !== UI_TEXT.title) return;
    const message = conversation.messages.find(
      (item) => item.id === assistantId,
    );
    if (!message) return;
    const title = buildTitleFromContent(
      message.content,
      UI_CONFIG.titleMaxLength,
    );
    if (!title) return;
    conversation.title = title;
    this.updateConversation(conversation, false);
  },

  applyAssistantResult(conversationId, assistantId, structured) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return;
    const message = conversation.messages.find(
      (item) => item.id === assistantId,
    );
    if (!message) return;

    const normalizedStructured = normalizeStructured(structured);
    const summary = buildStructuredSummary(normalizedStructured);

    message.content = summary || UI_TEXT.errorFallback;
    message.html = markdownToHtml(message.content);
    message.structured = normalizedStructured;
    message.pending = false;

    this.updateConversation(conversation, false);
    if (conversationId === this.activeConversationId) {
      this.queueScrollToBottom(`msg-${assistantId}`);
    }
  },

  async hydrateStructuredReferenceImages(structured) {
    const normalized = normalizeStructured(structured);
    if (!normalized || !normalized.referenceImages.length) return normalized;

    const resolved = await Promise.all(
      normalized.referenceImages.map(async (item) => {
        const rawUrl = normalizeText(item && item.url);
        if (!rawUrl) return null;
        const label = normalizeText(item && item.label);

        try {
          if (isAbsoluteImageUrl(rawUrl)) {
            return {
              label,
              url: rawUrl,
            };
          }

          if (isUploadObjname(rawUrl)) {
            const previewUrl = await resolveImageShowUrl(rawUrl);
            return {
              label,
              url:
                normalizeText(previewUrl) ||
                toBaseAbsoluteUrl(rawUrl) ||
                rawUrl,
            };
          }

          return {
            label,
            url: rawUrl,
          };
        } catch (error) {
          return {
            label,
            url: rawUrl,
          };
        }
      }),
    );

    const deduped = [];
    const seen = {};
    resolved.forEach((item) => {
      const url = normalizeText(item && item.url);
      if (!url || seen[url]) return;
      seen[url] = true;
      deduped.push({
        label: normalizeText(item && item.label),
        url,
      });
    });

    return {
      ...normalized,
      referenceImages: deduped,
    };
  },

  applyAssistantError(conversationId, assistantId, error) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return;
    const message = conversation.messages.find(
      (item) => item.id === assistantId,
    );
    if (!message) return;

    const fallback =
      normalizeText((error && error.message) || UI_TEXT.errorFallback) ||
      UI_TEXT.errorFallback;
    message.content = fallback;
    message.html = markdownToHtml(fallback);
    message.structured = null;
    message.pending = false;
    this.updateConversation(conversation, false);

    if (conversationId === this.activeConversationId) {
      this.queueScrollToBottom(`msg-${assistantId}`);
    }
  },

  async handleSend() {
    if (this.data.isSending) return;

    const content = trimMessage(this.data.inputValue);
    const selectedImage = this.data.selectedImage || {};
    const localImagePath = normalizeText(
      selectedImage.localPath || selectedImage.url,
    );

    if (!content) {
      wx.showToast({ title: UI_TEXT.requireText, icon: "none" });
      return;
    }

    if (!localImagePath) {
      wx.showToast({ title: UI_TEXT.requireImage, icon: "none" });
      return;
    }

    const conversation = this.getActiveConversation();
    if (!conversation) return;

    this.closeSidebar();
    this.setData({ isSending: true });

    let assistantMessage = null;
    const conversationId = conversation.id;

    try {
      wx.showLoading({ title: "图片上传中", mask: true });
      const uploadResult = await uploadImage(localImagePath);
      const imagePath = normalizeText(uploadResult && uploadResult.path);
      safeHideLoading();

      if (!imagePath) {
        throw new Error(UI_TEXT.imageUploadFailed);
      }

      const userMessage = this.buildMessage("user", content, {
        imageUrl: localImagePath,
        imagePath,
      });
      assistantMessage = this.buildMessage("assistant", "", { pending: true });

      const nextMessages = limitMessages(
        [...conversation.messages, userMessage, assistantMessage],
        UI_CONFIG.maxMessages,
      );

      conversation.messages = nextMessages;
      this.updateConversation(conversation, true);
      this.setData({
        inputValue: "",
        selectedImage: {
          localPath: "",
          url: "",
        },
      });
      this.updateLayout();
      this.queueScrollToBottom(`msg-${assistantMessage.id}`);

      wx.showLoading({ title: "AI 分析中", mask: true });
      const structured = await fetchHazardAnalyzeReply({
        objname: imagePath,
        notes: content,
      });
      safeHideLoading();

      const hydratedStructured =
        await this.hydrateStructuredReferenceImages(structured);
      this.applyAssistantResult(
        conversationId,
        assistantMessage.id,
        hydratedStructured,
      );

      const finalConversation = this.getConversationById(conversationId);
      this.updateConversationTitleIfNeeded(
        finalConversation,
        assistantMessage.id,
      );
    } catch (error) {
      safeHideLoading();
      if (assistantMessage) {
        this.applyAssistantError(conversationId, assistantMessage.id, error);
      } else {
        const message =
          normalizeText((error && error.message) || UI_TEXT.errorFallback) ||
          UI_TEXT.errorFallback;
        wx.showToast({ title: message, icon: "none" });
      }
    } finally {
      this.setData({ isSending: false });
    }
  },
});
