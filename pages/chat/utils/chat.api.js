// 图文隐患分析接口
const { CHAT_CONFIG } = require('../chat.constants');
const { post } = require('../../../utils/http');

const normalizeText = (value) => String(value == null ? '' : value).trim();
const encode = (value) => encodeURIComponent(normalizeText(value));

const buildHazardRequestPath = (path, payload = {}) => {
  const basePath = normalizeText(path);
  const objname = normalizeText(payload.objname);
  const notes = normalizeText(payload.notes);
  const query = [];

  if (objname) {
    query.push(`objname=${encode(objname)}`);
  }
  query.push(`notes=${encode(notes)}`);

  if (!query.length) return basePath;
  return `${basePath}${basePath.includes('?') ? '&' : '?'}${query.join('&')}`;
};

const requestHazardAnalyze = (payload = {}) => {
  const path = normalizeText(CHAT_CONFIG.hazardPath);
  if (!path) {
    return Promise.reject(new Error('hazardPath 未配置'));
  }

  const requestPath = buildHazardRequestPath(path, payload);
  return post(requestPath, {}, {
    timeout: CHAT_CONFIG.timeout,
  });
};

module.exports = {
  requestHazardAnalyze,
};
