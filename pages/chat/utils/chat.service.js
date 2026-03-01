const { requestHazardAnalyze } = require("./chat.api");

const normalizeText = (value) => String(value == null ? "" : value).trim();

const pickText = (...values) => {
  for (let i = 0; i < values.length; i += 1) {
    const t = normalizeText(values[i]);
    if (t) return t;
  }
  return "";
};

const tryParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
};

const safeParseJson = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  const text = normalizeText(value);
  if (!text) return null;

  const direct = tryParseJson(text);
  if (direct) return direct;

  const fenced = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  if (fenced !== text) {
    const r = tryParseJson(fenced);
    if (r) return r;
  }

  const s = text.indexOf("{"),
    e = text.lastIndexOf("}");
  if (s >= 0 && e > s) {
    const r = tryParseJson(text.slice(s, e + 1));
    if (r) return r;
  }
  return null;
};

const sanitizeUrl = (url) =>
  normalizeText(url).replace(/[)\]}>,。；;，,]+$/g, "");

const ABS_URL_RE = /https?:\/\/[^\s"'<>；，,;]+/gi;
const REL_UPLOAD_RE = /\/uploads\/[^\s"'<>；，,;]+/gi;
const IMAGE_EXT_RE = /\.(jpg|jpeg|png|webp|gif|bmp|svg)(?:$|\?)/i;

const isImageUrl = (url) => {
  const v = sanitizeUrl(url);
  if (!v) return false;
  if (/^\/uploads\//i.test(v)) return true;
  if (/^https?:\/\//i.test(v) && IMAGE_EXT_RE.test(v)) return true;
  return false;
};

const extractUrlsFromText = (text) => {
  const src = normalizeText(text);
  if (!src) return [];

  ABS_URL_RE.lastIndex = 0;
  REL_UPLOAD_RE.lastIndex = 0;
  const abs = (src.match(ABS_URL_RE) || []).map(sanitizeUrl);
  const rel = (src.match(REL_UPLOAD_RE) || []).map(sanitizeUrl);
  ABS_URL_RE.lastIndex = 0;
  REL_UPLOAD_RE.lastIndex = 0;

  const filteredRel = rel.filter((r) => !abs.some((a) => a.includes(r)));
  const all = [...abs, ...filteredRel];

  const seen = new Set();
  return all.filter((u) => {
    if (seen.has(u) || !isImageUrl(u)) return false;
    seen.add(u);
    return true;
  });
};

const uniqImageItems = (list) => {
  const map = new Map();
  list.forEach((item) => {
    const url = sanitizeUrl(item && item.url);
    if (!url || map.has(url)) return;
    map.set(url, { url, label: normalizeText(item.label) || "法规图示" });
  });
  return [...map.values()];
};

const IMAGE_LINE_RE =
  /^(正确图示|不正当图示|法律图片|图示|参考图|示例图)\s*[：:]\s*(.*)$/;
const IMAGE_LABEL_MAP = {
  正确图示: "正确图示",
  不正当图示: "不正当图示",
  法律图片: "法规图示",
  图示: "法规图示",
  参考图: "参考图",
  示例图: "示例图",
};

const extractImagesFromRegulation = (text) => {
  const items = [];
  normalizeText(text)
    .split("\n")
    .forEach((rawLine) => {
      const line = normalizeText(rawLine);
      if (!line) return;
      const m = line.match(IMAGE_LINE_RE);
      if (!m || !m[2]) return;
      const label = IMAGE_LABEL_MAP[m[1]] || m[1];
      extractUrlsFromText(m[2]).forEach((url) => items.push({ url, label }));
    });
  return items;
};

const stripImageLines = (text) => {
  return normalizeText(text)
    .split("\n")
    .map(normalizeText)
    .filter((line) => {
      if (!line) return false;
      ABS_URL_RE.lastIndex = 0;
      REL_UPLOAD_RE.lastIndex = 0;
      const hasUrl = ABS_URL_RE.test(line) || REL_UPLOAD_RE.test(line);
      ABS_URL_RE.lastIndex = 0;
      REL_UPLOAD_RE.lastIndex = 0;
      if (hasUrl) return false;
      if (IMAGE_LINE_RE.test(line)) return false;
      return true;
    })
    .join("\n")
    .trim();
};

const toRawTextList = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) =>
      item && typeof item === "object"
        ? JSON.stringify(item)
        : normalizeText(item),
    )
    .filter(Boolean);
};

const emptyResult = () => ({
  deviceType: "",
  hazardDetail: "",
  regulations: [],
  location: "",
  imageAnalysis: "",
  imageItem: "",
  referenceImages: [],
});

const parseResponseData = (response = {}) => {
  const code = normalizeText(response.code).toUpperCase();
  if (
    response.success === false ||
    (code && code !== "0" && code !== "SUCCESS")
  ) {
    throw new Error(pickText(response.msg, response.message, "分析失败"));
  }

  let data = response.data != null ? response.data : response;
  if (typeof data === "string") {
    const parsed = safeParseJson(data);
    if (parsed && typeof parsed === "object") data = parsed;
    else return { ...emptyResult(), hazardDetail: normalizeText(data) };
  }
  if (!data || typeof data !== "object") return emptyResult();

  const markdownObj = safeParseJson(data.markdown) || {};
  const finalReport =
    data.final_report || data.finalReport || markdownObj.final_report || {};
  const visualEvidence =
    data.visual_evidence ||
    data.visualEvidence ||
    markdownObj.visual_evidence ||
    {};

  const rawRegulationTexts = [
    ...toRawTextList(data.regulations || data.regulation),
    ...toRawTextList(finalReport.regulations || finalReport.regulation),
  ];

  const allImages = [];
  rawRegulationTexts.forEach((text) => {
    extractImagesFromRegulation(text).forEach((item) => allImages.push(item));
  });
  const referenceImages = uniqImageItems(allImages);

  const seen = new Set();
  const regulations = rawRegulationTexts.map(stripImageLines).filter((t) => {
    if (!t || seen.has(t)) return false;
    seen.add(t);
    return true;
  });

  return {
    deviceType: pickText(
      data.item,
      finalReport.item,
      data.deviceType,
      visualEvidence.image_item,
    ),
    hazardDetail: pickText(
      data.description,
      finalReport.description,
      finalReport.name,
      data.detail,
    ),
    regulations,
    location: pickText(
      data.location,
      finalReport.location,
      visualEvidence.image_location,
    ),
    imageAnalysis: pickText(
      data.imageDesc,
      visualEvidence.image_description,
      data.imageAnalysis,
    ),
    imageItem: pickText(data.imageItem, visualEvidence.image_item),
    referenceImages,
  };
};

const fetchHazardAnalyzeReply = async ({ objname, notes }) => {
  const response = await requestHazardAnalyze({
    objname: normalizeText(objname),
    notes: normalizeText(notes),
  });
  return parseResponseData(response);
};

module.exports = { fetchHazardAnalyzeReply };
