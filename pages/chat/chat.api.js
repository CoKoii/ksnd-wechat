const { CHAT_CONFIG } = require('./chat.constants');
const { decodeChunk, createUtf8Decoder } = require('./chat.utils');

const requestChatCompletion = (payload = {}) =>
  new Promise((resolve, reject) => {
    wx.request({
      url: `${CHAT_CONFIG.baseUrl}${CHAT_CONFIG.chatPath}`,
      method: 'POST',
      data: payload,
      timeout: CHAT_CONFIG.timeout,
      header: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CHAT_CONFIG.apiKey}`,
      },
      success: (res) => {
        const { statusCode, data } = res || {};
        if (statusCode >= 200 && statusCode < 300 && data) {
          resolve(data);
          return;
        }
        const message = (data && data.error && data.error.message) || `HTTP ${statusCode}`;
        reject(new Error(message));
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
    const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;
    const utf8Decoder = decoder ? null : createUtf8Decoder();
    const parser = createStreamParser((event) => {
      if (event.done) {
        if (!resolved) {
          resolved = true;
          resolve();
        }
        return;
      }
      if (event.error) return;
      if (event.data && typeof onDelta === 'function') {
        onDelta(event.data);
      }
    });

    const requestTask = wx.request({
      url: `${CHAT_CONFIG.baseUrl}${CHAT_CONFIG.chatPath}`,
      method: 'POST',
      data: payload,
      timeout: CHAT_CONFIG.timeout,
      enableChunked: true,
      responseType: 'arraybuffer',
      header: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer ${CHAT_CONFIG.apiKey}`,
      },
      success: () => {
        if (decoder) {
          const tail = decoder.decode();
          if (tail) parser(tail);
        }
        if (!resolved) {
          resolved = true;
          resolve();
        }
      },
      fail: (error) => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      },
    });

    if (requestTask && requestTask.onChunkReceived) {
      requestTask.onChunkReceived((res) => {
        const chunkText = decoder
          ? decoder.decode(res.data, { stream: true })
          : utf8Decoder
            ? utf8Decoder(res.data)
            : decodeChunk(res.data);
        parser(chunkText);
      });
      return;
    }

    requestChatCompletion({ ...payload, stream: false })
      .then((data) => {
        if (typeof onDelta === 'function') {
          onDelta(data);
        }
        resolve();
      })
      .catch(reject);
  });

module.exports = {
  requestChatCompletion,
  requestChatCompletionStream,
};
