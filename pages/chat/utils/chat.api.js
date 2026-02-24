// 聊天接口请求与流式解析
const { CHAT_CONFIG } = require('../chat.constants');
const { createUtf8Decoder } = require('./chat.utils');

const CHAT_URL = `${CHAT_CONFIG.baseUrl}${CHAT_CONFIG.chatPath}`;
const isSuccessStatus = (statusCode) => statusCode >= 200 && statusCode < 300;
const createAuthHeader = (extra = {}) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${CHAT_CONFIG.apiKey}`,
  ...extra,
});
const toRequestError = (statusCode, data) =>
  new Error((data && data.error && data.error.message) || `HTTP ${statusCode}`);

const requestChatCompletion = (payload = {}) =>
  new Promise((resolve, reject) => {
    wx.request({
      url: CHAT_URL,
      method: 'POST',
      data: payload,
      timeout: CHAT_CONFIG.timeout,
      header: createAuthHeader(),
      success: (res) => {
        const { statusCode, data } = res || {};
        if (isSuccessStatus(statusCode) && data) {
          resolve(data);
          return;
        }
        reject(toRequestError(statusCode, data));
      },
      fail: (error) => reject(error),
    });
  });

const createStreamParser = (onMessage) => {
  let buffer = '';
  return (chunkText = '') => {
    buffer += chunkText.replace(/\r\n/g, '\n');
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || '';
    parts.forEach((part) => {
      const lines = part.split('\n');
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) return;
        const data = trimmed.replace(/^data:\s*/, '');
        if (!data) return;
        if (data === '[DONE]') {
          onMessage({ done: true });
          return;
        }
        try {
          const json = JSON.parse(data);
          onMessage({ data: json });
        } catch (error) {
          onMessage({ error });
        }
      });
    });
  };
};

const requestChatCompletionStream = ({ payload, onDelta }) =>
  new Promise((resolve, reject) => {
    let resolved = false;
    const resolveOnce = (value) => {
      if (resolved) return;
      resolved = true;
      resolve(value);
    };
    const rejectOnce = (error) => {
      if (resolved) return;
      resolved = true;
      reject(error);
    };
    const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
    const utf8Decoder = decoder ? null : createUtf8Decoder();
    const parser = createStreamParser((event) => {
      if (event.done) {
        resolveOnce();
        return;
      }
      if (event.error) return;
      if (event.data && typeof onDelta === 'function') {
        onDelta(event.data);
      }
    });

    const requestTask = wx.request({
      url: CHAT_URL,
      method: 'POST',
      data: payload,
      timeout: CHAT_CONFIG.timeout,
      enableChunked: true,
      responseType: 'arraybuffer',
      header: createAuthHeader({
        Accept: 'text/event-stream',
      }),
      success: () => {
        if (decoder) {
          const tail = decoder.decode();
          if (tail) parser(tail);
        }
        resolveOnce();
      },
      fail: rejectOnce,
    });

    if (requestTask && requestTask.onChunkReceived) {
      requestTask.onChunkReceived((res) => {
        const chunkText = decoder
          ? decoder.decode(res.data, { stream: true })
          : utf8Decoder
            ? utf8Decoder(res.data)
            : '';
        parser(chunkText);
      });
      return;
    }

    requestChatCompletion({ ...payload, stream: false })
      .then((data) => {
        if (typeof onDelta === 'function') {
          onDelta(data);
        }
        resolveOnce();
      })
      .catch(rejectOnce);
  });

module.exports = {
  requestChatCompletion,
  requestChatCompletionStream,
};
