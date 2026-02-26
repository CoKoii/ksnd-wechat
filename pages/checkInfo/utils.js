const NO_VALUE = "--";
const COMPLETED_STATE = "10018090";
const CHECK_ITEM_IGNORE = "ignore";
const CHECK_ITEM_SORT_WEIGHT = {
  ABNORMAL: 0,
  NORMAL: 1,
  PENDING: 2,
  IGNORE: 3,
};

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
  if (value == null || value === "") return "";
  return String(value) === "1" ? "normal" : "abnormal";
};

const toItemStatus = (value) => {
  if (value == null || value === "") return null;
  const text = String(value);
  if (text === "1") return true;
  if (text === "2") return CHECK_ITEM_IGNORE;
  return false;
};

const toRawImageValue = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  return item.path || item.url || "";
};
const toImageSourceList = (value) =>
  Array.isArray(value) ? value : String(value || "").split(",");

const toImageValues = (value) => {
  return toImageSourceList(value)
    .map(toRawImageValue)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
};

const toUploaderFiles = (value) => {
  return toImageSourceList(value)
    .map((item, index) => {
      const path = String(toRawImageValue(item) || "").trim();
      if (!path) return null;

      const previewUrl = item && typeof item === "object" ? String(item.url || "").trim() : "";
      const safePreviewUrl = /^(https?:\/\/|wxfile:\/\/|data:)/i.test(previewUrl) ? previewUrl : "";

      return {
        path,
        url: safePreviewUrl,
        name: `image-${index + 1}`,
      };
    })
    .filter(Boolean);
};

const toCsv = (value) => toImageValues(value).join(",");

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
        images: toUploaderFiles(latestVals[`file${seq}`]),
      };
    });
};

const getCheckItemSortWeight = (status) => {
  if (status === false) return CHECK_ITEM_SORT_WEIGHT.ABNORMAL;
  if (status === true) return CHECK_ITEM_SORT_WEIGHT.NORMAL;
  if (status === CHECK_ITEM_IGNORE) return CHECK_ITEM_SORT_WEIGHT.IGNORE;
  return CHECK_ITEM_SORT_WEIGHT.PENDING;
};

const sortCheckItemsForDetail = (checkItems = []) => {
  const list = Array.isArray(checkItems) ? checkItems : [];
  return list
    .map((item, index) => ({
      item,
      index,
      weight: getCheckItemSortWeight(item && item.status),
    }))
    .sort((a, b) => a.weight - b.weight || a.index - b.index)
    .map((entry) => entry.item);
};

const buildSubmitPayload = ({
  taskDetail,
  checkResult,
  checkItems,
  description,
  images,
  inspector,
  companySign,
}) => {
  const payload = {
    task: taskDetail.id || "",
    table: taskDetail.table || "",
    ckrs: checkResult === "normal" ? "1" : "0",
    ckdesc: String(description || "").trim(),
    ckpics: toCsv(images),
    cksign: String(inspector || "").trim(),
    cosign: String(companySign || "").trim(),
  };

  checkItems.forEach((item, index) => {
    const seq = index + 1;
    if (item.status === CHECK_ITEM_IGNORE) {
      payload[`value${seq}`] = "2";
      payload[`memo${seq}`] = "";
      payload[`file${seq}`] = "";
      return;
    }

    payload[`value${seq}`] = item.status ? "1" : "0";
    payload[`memo${seq}`] = String(item.description || "").trim();
    payload[`file${seq}`] = toCsv(item.images);
  });

  return payload;
};

module.exports = {
  NO_VALUE,
  COMPLETED_STATE,
  CHECK_ITEM_IGNORE,
  createEmptyAbnormalState,
  getEventValue,
  editable,
  formatDate,
  toCheckResult,
  toImageValues,
  toUploaderFiles,
  buildCheckItems,
  sortCheckItemsForDetail,
  buildSubmitPayload,
};
