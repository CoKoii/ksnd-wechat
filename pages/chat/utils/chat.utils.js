// 聊天通用工具：ID、文本清洗、格式化等
const createId = () => `msg_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();
const trimMessage = (value = '') => normalizeText(value);

const getScrollTargetId = (messages = []) => {
  if (!messages.length) return '';
  return `msg-${messages[messages.length - 1].id}`;
};

const stripMarkdown = (value = '') => {
  if (!value) return '';
  let text = value;
  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/^\s{0,3}#{1,6}\s+/gm, '');
  text = text.replace(/^\s*>\s?/gm, '');
  text = text.replace(/^\s*([-*+]|\d+\.)\s+/gm, '');
  text = text.replace(/[*_~]+/g, '');
  return text;
};

const buildTitleFromContent = (content = '', maxLength = 12) => {
  const text = normalizeText(stripMarkdown(content));
  if (!text) return '';
  return text.slice(0, maxLength);
};

const pad2 = (value) => `${value}`.padStart(2, '0');
const formatTimeLabel = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}`;
};

const limitMessages = (messages = [], maxMessages = 50) => {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
};

const getWindowInfoSafe = () => {
  if (typeof wx.getWindowInfo === 'function') {
    return wx.getWindowInfo();
  }
  return wx.getSystemInfoSync();
};

const getSafeAreaInsets = () => {
  const windowInfo = getWindowInfoSafe();
  const safeArea = windowInfo.safeArea || { bottom: windowInfo.screenHeight };
  const safeAreaBottom = Math.max(windowInfo.screenHeight - safeArea.bottom, 0);
  return {
    statusBarHeight: windowInfo.statusBarHeight || 0,
    safeAreaBottom,
  };
};

module.exports = {
  createId,
  trimMessage,
  getScrollTargetId,
  buildTitleFromContent,
  formatTimeLabel,
  limitMessages,
  getWindowInfoSafe,
  getSafeAreaInsets,
};
