const createId = () => `msg_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const normalizeText = (value = '') => value.replace(/\s+/g, ' ').trim();
const trimMessage = (value = '') => normalizeText(value);

const getScrollTargetId = (messages = []) => {
  if (!messages.length) return '';
  return `msg-${messages[messages.length - 1].id}`;
};

const toApiMessages = (messages = [], systemPrompt = '') => {
  const chatMessages = messages
    .filter((message) => message && message.role && message.content)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  if (systemPrompt) {
    return [{ role: 'system', content: systemPrompt }, ...chatMessages];
  }

  return chatMessages;
};

const buildSystemPrompt = (basePrompt = '', options = {}) => {
  const prompts = [];
  if (basePrompt) prompts.push(basePrompt);
  if (options.searchEnabled) {
    prompts.push('用户已开启搜索模式，若无法联网请说明并尽量基于已有知识回答。');
  }
  return prompts.join('\n');
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

const decodeUtf8 = (bytes) => {
  let result = '';
  let i = 0;
  while (i < bytes.length) {
    const byte1 = bytes[i];
    if (byte1 < 0x80) {
      result += String.fromCharCode(byte1);
      i += 1;
      continue;
    }
    if (byte1 >= 0xc0 && byte1 < 0xe0) {
      if (i + 1 >= bytes.length) break;
      const byte2 = bytes[i + 1];
      if ((byte2 & 0xc0) !== 0x80) {
        i += 1;
        continue;
      }
      const code = ((byte1 & 0x1f) << 6) | (byte2 & 0x3f);
      result += String.fromCharCode(code);
      i += 2;
      continue;
    }
    if (byte1 >= 0xe0 && byte1 < 0xf0) {
      if (i + 2 >= bytes.length) break;
      const byte2 = bytes[i + 1];
      const byte3 = bytes[i + 2];
      if ((byte2 & 0xc0) !== 0x80 || (byte3 & 0xc0) !== 0x80) {
        i += 1;
        continue;
      }
      const code = ((byte1 & 0x0f) << 12) | ((byte2 & 0x3f) << 6) | (byte3 & 0x3f);
      result += String.fromCharCode(code);
      i += 3;
      continue;
    }
    if (byte1 >= 0xf0 && byte1 < 0xf8) {
      if (i + 3 >= bytes.length) break;
      const byte2 = bytes[i + 1];
      const byte3 = bytes[i + 2];
      const byte4 = bytes[i + 3];
      if (
        (byte2 & 0xc0) !== 0x80 ||
        (byte3 & 0xc0) !== 0x80 ||
        (byte4 & 0xc0) !== 0x80
      ) {
        i += 1;
        continue;
      }
      let codePoint =
        ((byte1 & 0x07) << 18) |
        ((byte2 & 0x3f) << 12) |
        ((byte3 & 0x3f) << 6) |
        (byte4 & 0x3f);
      codePoint -= 0x10000;
      result += String.fromCharCode((codePoint >> 10) + 0xd800, (codePoint & 0x3ff) + 0xdc00);
      i += 4;
      continue;
    }
    i += 1;
  }
  return { text: result, index: i };
};

const createUtf8Decoder = () => {
  let leftover = new Uint8Array(0);
  return (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    let bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data);
    if (leftover.length) {
      const merged = new Uint8Array(leftover.length + bytes.length);
      merged.set(leftover);
      merged.set(bytes, leftover.length);
      bytes = merged;
      leftover = new Uint8Array(0);
    }
    const { text, index } = decodeUtf8(bytes);
    if (index < bytes.length) {
      leftover = bytes.slice(index);
    }
    return text;
  };
};

const limitMessages = (messages = [], maxMessages = 50) => {
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
};

const getSafeAreaInsets = () => {
  const systemInfo = wx.getSystemInfoSync();
  const safeArea = systemInfo.safeArea || { bottom: systemInfo.screenHeight };
  const safeAreaBottom = Math.max(systemInfo.screenHeight - safeArea.bottom, 0);
  return {
    statusBarHeight: systemInfo.statusBarHeight || 0,
    safeAreaBottom,
  };
};

module.exports = {
  createId,
  trimMessage,
  getScrollTargetId,
  toApiMessages,
  buildSystemPrompt,
  buildTitleFromContent,
  formatTimeLabel,
  createUtf8Decoder,
  limitMessages,
  getSafeAreaInsets,
};
