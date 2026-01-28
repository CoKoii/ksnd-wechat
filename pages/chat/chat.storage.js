const { STORAGE_KEYS, UI_CONFIG } = require('./chat.constants');

const sanitizeMessages = (messages = []) =>
  messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
  }));

const sanitizeConversations = (conversations = []) =>
  conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    messages: sanitizeMessages(conversation.messages || []),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  }));

const loadConversations = () => {
  try {
    const data = wx.getStorageSync(STORAGE_KEYS.conversations);
    if (Array.isArray(data)) return data;
  } catch (error) {
    return [];
  }
  return [];
};

const saveConversations = (conversations = []) => {
  const trimmed = conversations.slice(0, UI_CONFIG.maxConversations);
  wx.setStorageSync(STORAGE_KEYS.conversations, sanitizeConversations(trimmed));
};

module.exports = {
  loadConversations,
  saveConversations,
};
