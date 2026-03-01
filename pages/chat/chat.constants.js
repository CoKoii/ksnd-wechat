const UI_TEXT = {
  title: "新对话",
  sidebarTitle: "历史对话",
  sidebarEmpty: "暂无历史对话",
  placeholder: "请输入一段隐患描述",
  emptyTitle: "今天有什么可以帮到你?",
  uploadHint: "上传图片（限 1 张）",
  inputLimitTip: "发消息限制为 1 张图片 + 1 段文字",
  send: "发送",
  requireImage: "请先上传 1 张图片",
  requireText: "请输入一段文字",
  imagePickFailed: "图片选择失败",
  imageUploadFailed: "图片上传失败",
  errorFallback: "请求失败，请稍后再试。",
};

const CHAT_CONFIG = {
  hazardPath: "/api/safe/ai/notes",
  timeout: 60000,
};

const UI_CONFIG = {
  maxMessages: 50,
  maxConversations: 30,
  titleMaxLength: 12,
};

const STORAGE_KEYS = {
  conversations: "chat_conversations_v1",
};

module.exports = {
  UI_TEXT,
  CHAT_CONFIG,
  UI_CONFIG,
  STORAGE_KEYS,
};
