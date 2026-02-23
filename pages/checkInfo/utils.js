const { BASE_URL } = require("../../utils/http");

const NO_VALUE = "--";
const COMPLETED_STATE = "10018090";

const createEmptyAbnormalState = () => ({
  showAbnormalDialog: false,
  currentAbnormalItem: null,
  tempDescription: "",
  tempImages: [],
});

const getEventValue = (e) =>
  (e &&
    e.detail &&
    (e.detail.value !== undefined ? e.detail.value : e.detail)) ||
  "";

const editable = (handler) =>
  function (...args) {
    if (this.data.readonly) return;
    return handler.apply(this, args);
  };

const formatDate = (value) => {
  const date = String(value || "")
    .trim()
    .split(" ")[0];
  return date || NO_VALUE;
};

const toCheckResult = (value) => {
  if (value === null || value === undefined || value === "") return "";
  return String(value) === "1" ? "normal" : "abnormal";
};

const toItemStatus = (value) => {
  if (value === null || value === undefined || value === "") return null;
  return String(value) === "1";
};

const normalizeImageUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:\/\/|wxfile:\/\/|data:)/i.test(url)) return url;

  const base = String(BASE_URL || "").replace(/\/+$/, "");
  const path = url.replace(/^\/+/, "").replace(/^ksndsrv\/+/i, "");
  return base ? `${base}/${path}` : path;
};

const toRawImageValue = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.url || item.path || "";
};

const toImageUrls = (value) => {
  const source = Array.isArray(value) ? value : String(value || "").split(",");
  return source
    .map(toRawImageValue)
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .map(normalizeImageUrl)
    .filter(Boolean);
};

const toUploaderFiles = (value) =>
  toImageUrls(value).map((url, index) => ({
    url,
    name: `image-${index + 1}`,
  }));

const toCsv = (value) => toImageUrls(value).join(",");

const buildCheckItems = (fields = [], vals = []) => {
  const latestVals = (Array.isArray(vals) && vals[0]) || {};
  return (Array.isArray(fields) ? fields : [])
    .slice()
    .sort((a, b) => Number(a.snum || 0) - Number(b.snum || 0))
    .map((field, index) => {
      const seq = index + 1;
      return {
        id: field.id || String(seq),
        name: field.name || `检查项${seq}`,
        status: toItemStatus(latestVals[`value${seq}`]),
        description: String(latestVals[`memo${seq}`] || ""),
        images: toImageUrls(latestVals[`file${seq}`]),
      };
    });
};

const buildSubmitPayload = ({
  taskDetail,
  checkResult,
  checkItems,
  description,
  images,
  inspector,
}) => {
  const payload = {
    task: taskDetail.id || "",
    table: taskDetail.table || "",
    ckrs: checkResult === "normal" ? "1" : "0",
    ckdesc: String(description || "").trim(),
    ckpics: toCsv(images),
    cssign: String(inspector || "").trim(),
  };

  checkItems.forEach((item, index) => {
    const seq = index + 1;
    payload[`value${seq}`] = item.status ? "1" : "0";
    payload[`memo${seq}`] = String(item.description || "").trim();
    payload[`file${seq}`] = toCsv(item.images);
  });

  return payload;
};

module.exports = {
  NO_VALUE,
  COMPLETED_STATE,
  createEmptyAbnormalState,
  getEventValue,
  editable,
  formatDate,
  toCheckResult,
  toImageUrls,
  toUploaderFiles,
  buildCheckItems,
  buildSubmitPayload,
};
