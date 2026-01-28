const { UI_TEXT, CHAT_CONFIG, UI_CONFIG } = require('./chat.constants');
const {
  createId,
  trimMessage,
  getScrollTargetId,
  toApiMessages,
  buildSystemPrompt,
  limitMessages,
  getSafeAreaInsets,
  buildTitleFromContent,
  formatTimeLabel,
} = require('./chat.utils');
const { fetchAssistantReplyStream } = require('./chat.service');
const { markdownToHtml } = require('./chat.markdown');
const { loadConversations, saveConversations } = require('./chat.storage');

const nextTick = (callback) => {
  if (typeof wx.nextTick === 'function') {
    wx.nextTick(callback);
    return;
  }
  setTimeout(callback, 0);
};

Page({
  conversationStore: [],
  activeConversationId: '',
  streamBuffer: '',
  streamTimer: null,

  data: {
    uiText: UI_TEXT,
    statusBarHeight: 0,
    safeAreaBottom: 0,
    navHeight: 0,
    navSideWidth: 96,
    contentHeight: 0,
    scrollSpacerHeight: 0,
    conversations: [],
    activeConversationId: '',
    navTitle: UI_TEXT.title,
    messages: [],
    inputValue: '',
    isSending: false,
    thinkEnabled: false,
    searchEnabled: false,
    scrollTargetId: '',
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
  },

  onShow() {
    this.updateLayout();
    wx.hideTabBar({ animation: false });
  },

  onHide() {
    wx.showTabBar({ animation: false });
  },

  onUnload() {
    this.clearStreamTimer();
  },

  updateLayout() {
    nextTick(() => {
      const systemInfo = wx.getSystemInfoSync();
      const windowHeight = systemInfo.windowHeight || systemInfo.screenHeight || 0;
      const query = wx.createSelectorQuery().in(this);
      const getRect = (rects, index) => (rects && rects[index]) || { height: 0 };
      const extraPadding = 16;
      query.select('.nav').boundingClientRect();
      query.select('.composer').boundingClientRect();
      query.exec((res) => {
        const navRect = getRect(res, 0);
        const composerRect = getRect(res, 1);
        const contentHeight = Math.max(windowHeight - navRect.height - composerRect.height, 0);
        const scrollSpacerHeight =
          Math.max(composerRect.height, this.data.safeAreaBottom) + extraPadding;
        this.setData({ contentHeight, scrollSpacerHeight });
      });
    });
  },

  setNavMetrics() {
    const systemInfo = wx.getSystemInfoSync();
    const menuButton = wx.getMenuButtonBoundingClientRect
      ? wx.getMenuButtonBoundingClientRect()
      : null;
    const statusBarHeight = this.data.statusBarHeight || systemInfo.statusBarHeight || 0;
    let navHeight = statusBarHeight + 44;
    let navSideWidth = 96;
    if (menuButton) {
      const topGap = Math.max(menuButton.top - statusBarHeight, 0);
      const rightGap = Math.max((systemInfo.windowWidth || 0) - menuButton.right, 0);
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
    this.syncConversationView({ scrollToBottom: false });
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
      messages: (conversation.messages || []).map((message) => ({
        ...message,
        pending: false,
        html: message.html || markdownToHtml(message.content || ''),
      })),
    }));
  },

  sortConversations() {
    this.conversationStore.sort((a, b) => b.updatedAt - a.updatedAt);
  },

  syncConversationView({ scrollToBottom } = {}) {
    const activeConversation =
      this.conversationStore.find((item) => item.id === this.activeConversationId) ||
      this.conversationStore[0];

    if (activeConversation) {
      this.activeConversationId = activeConversation.id;
    }

    const toDisplayTitle = (title) =>
      buildTitleFromContent(title || UI_TEXT.title, UI_CONFIG.titleMaxLength) || UI_TEXT.title;
    const conversations = this.conversationStore.map((item) => ({
      id: item.id,
      title: toDisplayTitle(item.title),
      updatedAtText: formatTimeLabel(item.updatedAt),
    }));

    this.setData({
      conversations,
      activeConversationId: this.activeConversationId,
      messages: activeConversation ? activeConversation.messages : [],
      navTitle: activeConversation ? toDisplayTitle(activeConversation.title) : UI_TEXT.title,
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
    wx.switchTab({ url: '/pages/home/home' });
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
    this.syncConversationView({ scrollToBottom: true });
  },

  onNewChat() {
    const conversation = this.createConversation();
    this.conversationStore.unshift(conversation);
    this.activeConversationId = conversation.id;
    this.sortConversations();
    this.closeSidebar();
    this.syncConversationView({ scrollToBottom: true });
  },

  onInput(event) {
    this.setData({ inputValue: event.detail.value });
  },

  onConfirm() {
    this.handleSend();
  },

  onAttachTap() {
    wx.showToast({ title: '附件功能待接入', icon: 'none' });
  },

  onVoiceTap() {
    wx.showToast({ title: '语音功能待接入', icon: 'none' });
  },

  toggleThink() {
    this.setData({ thinkEnabled: !this.data.thinkEnabled });
  },

  toggleSearch() {
    this.setData({ searchEnabled: !this.data.searchEnabled });
  },

  buildMessage(role, content, options = {}) {
    return {
      id: createId(),
      role,
      content,
      html: markdownToHtml(content),
      pending: options.pending || false,
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

  clearStreamTimer() {
    if (!this.streamTimer) return;
    clearTimeout(this.streamTimer);
    this.streamTimer = null;
  },

  flushStreamBuffer(conversationId, assistantId, isFinal) {
    if (!this.streamBuffer && !isFinal) return;
    const delta = this.streamBuffer;
    this.streamBuffer = '';
    this.appendAssistantDelta(conversationId, assistantId, delta || '', isFinal);
  },

  scheduleStreamFlush(conversationId, assistantId) {
    if (this.streamTimer) return;
    this.streamTimer = setTimeout(() => {
      this.streamTimer = null;
      this.flushStreamBuffer(conversationId, assistantId, false);
    }, UI_CONFIG.streamThrottleMs);
  },

  appendAssistantDelta(conversationId, assistantId, delta, isFinal) {
    const conversation = this.getConversationById(conversationId);
    if (!conversation) return;
    const message = conversation.messages.find((item) => item.id === assistantId);
    if (!message) return;
    const nextContent = `${message.content || ''}${delta || ''}`;
    message.content = nextContent;
    message.html = markdownToHtml(nextContent);
    if (isFinal) {
      message.pending = false;
    }
    this.updateConversation(conversation, false);
    if (conversationId === this.activeConversationId) {
      this.queueScrollToBottom(`msg-${assistantId}`);
    }
  },

  updateConversationTitleIfNeeded(conversation, assistantId) {
    if (!conversation || conversation.title !== UI_TEXT.title) return;
    const message = conversation.messages.find((item) => item.id === assistantId);
    if (!message) return;
    const title = buildTitleFromContent(message.content, UI_CONFIG.titleMaxLength);
    if (!title) return;
    conversation.title = title;
    this.updateConversation(conversation, false);
  },

  async handleSend() {
    const content = trimMessage(this.data.inputValue);
    if (!content || this.data.isSending) return;

    const conversation = this.getActiveConversation();
    if (!conversation) return;

    this.closeSidebar();

    const userMessage = this.buildMessage('user', content);
    const assistantMessage = this.buildMessage('assistant', '', { pending: true });

    const nextMessages = limitMessages(
      [...conversation.messages, userMessage, assistantMessage],
      UI_CONFIG.maxMessages,
    );

    conversation.messages = nextMessages;
    this.updateConversation(conversation, true);

    this.setData({
      inputValue: '',
      isSending: true,
    });

    this.queueScrollToBottom(`msg-${assistantMessage.id}`);

    const systemPrompt = buildSystemPrompt(CHAT_CONFIG.systemPrompt, {
      searchEnabled: this.data.searchEnabled,
    });
    const apiMessages = toApiMessages(nextMessages, systemPrompt);
    const conversationId = conversation.id;

    try {
      await fetchAssistantReplyStream({
        messages: apiMessages,
        onDelta: (delta) => {
          if (!delta || !delta.content) return;
          this.streamBuffer += delta.content;
          this.scheduleStreamFlush(conversationId, assistantMessage.id);
        },
      });

      this.flushStreamBuffer(conversationId, assistantMessage.id, true);

      const finalConversation = this.getConversationById(conversationId);
      this.updateConversationTitleIfNeeded(finalConversation, assistantMessage.id);
    } catch (error) {
      const fallback = UI_TEXT.errorFallback;
      this.appendAssistantDelta(conversationId, assistantMessage.id, fallback, true);
    } finally {
      this.setData({ isSending: false });
    }
  },
});
