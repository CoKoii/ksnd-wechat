// 会话本地存储读写
const { STORAGE_KEYS, UI_CONFIG } = require('../chat.constants');

// 仅保存必要字段，避免膨胀
const sanitizeMessages = (messages = []) =>
  messages.map((message) => ({
    id: message.id,
    role: message.role,
    content: message.content,
    imageUrl: message.imageUrl || '',
    imagePath: message.imagePath || '',
    structured: message.structured || null,
  }));

const sanitizeConversations = (conversations = []) =>
  conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    messages: sanitizeMessages(conversation.messages || []),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  }));
const readConversationStorage = () => wx.getStorageSync(STORAGE_KEYS.conversations);
const writeConversationStorage = (value) =>
  wx.setStorageSync(STORAGE_KEYS.conversations, value);

const loadConversations = () => {
  try {
    const data = readConversationStorage();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
};

const saveConversations = (conversations = []) => {
  const trimmed = conversations.slice(0, UI_CONFIG.maxConversations);
  writeConversationStorage(sanitizeConversations(trimmed));
};

module.exports = {
  loadConversations,
  saveConversations,
};
