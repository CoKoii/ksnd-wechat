const CASUAL_SHOOT_STATUS_PENDING = 10018010;
const CASUAL_SHOOT_STATUS_DONE = 10018090;
const CASUAL_SHOOT_PREVIEW_LIMIT = 3;

const CASUAL_SHOOT_TAB_CONFIG = [
  { label: "未整改", state: CASUAL_SHOOT_STATUS_PENDING },
  { label: "已整改", state: CASUAL_SHOOT_STATUS_DONE },
];

const normalizeText = (value) => (value == null ? "" : String(value).trim());
const normalizeProjectId = (value) => normalizeText(value);
const normalizeTaskId = (value) => normalizeText(value);

const hasValue = (value) => value != null && value !== "";
const normalizeDateText = (value) => {
  if (!hasValue(value)) return "";
  const text = String(value).trim();
  if (!text) return "";
  return text.replace("T", " ").replace(/Z$/i, "");
};
const pad2 = (value) => String(value).padStart(2, "0");

const toDateTimestamp = (value) => {
  if (!hasValue(value)) return 0;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1e12 ? value : value * 1000;
  }

  const text = normalizeDateText(value);
  if (!text) return 0;
  if (/^\d{10,13}$/.test(text)) {
    const numeric = Number(text);
    return text.length === 13 ? numeric : numeric * 1000;
  }

  const normalized = text
    .replace(/[./]/g, "-")
    .replace(/[年月]/g, "-")
    .replace(/日/g, "")
    .replace(/\s+/g, " ");
  const match = normalized.match(
    /^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/,
  );
  if (!match) return 0;

  const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ).getTime();
};

const toDateTimeText = (value) => {
  const timestamp = toDateTimestamp(value);
  if (!timestamp) return "--";

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--";
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

const parseFiles = (value) =>
  String(value || "")
    .split(",")
    .map((item) => String(item || "").trim())
    .filter(Boolean);

const isAbsoluteImageUrl = (value = "") =>
  /^(https?:\/\/|wxfile:\/\/|data:)/i.test(normalizeText(value));

const toCasualShootPreviewPaths = (item = {}, limit = CASUAL_SHOOT_PREVIEW_LIMIT) =>
  parseFiles(item.files).slice(0, Math.max(0, Number(limit) || 0));

const withCasualShootPreviewPlaceholders = (list = []) =>
  (Array.isArray(list) ? list : []).map((item) => ({
    ...item,
    previewImages: [],
  }));

const hydrateCasualShootListPreviewImages = async (list = [], options = {}) => {
  const source = Array.isArray(list) ? list : [];
  const { limit = CASUAL_SHOOT_PREVIEW_LIMIT, resolvePreview } = options;
  if (typeof resolvePreview !== "function") {
    return source.map((item) => ({
      ...item,
      previewImages: [],
    }));
  }

  const resolved = await Promise.all(
    source.map(async (item) => {
      const previewPaths = toCasualShootPreviewPaths(item, limit);
      const previewImages = await Promise.all(
        previewPaths.map(async (path, index) => {
          const rawPath = normalizeText(path);
          if (!rawPath) return null;
          try {
            const resolvedUrl = normalizeText(await resolvePreview(rawPath));
            const fallbackUrl = isAbsoluteImageUrl(rawPath) ? rawPath : "";
            const url = resolvedUrl || fallbackUrl;
            if (!url) return null;
            return {
              path: rawPath,
              url,
              name: `casual-shoot-${index + 1}`,
            };
          } catch (error) {
            if (!isAbsoluteImageUrl(rawPath)) return null;
            return {
              path: rawPath,
              url: rawPath,
              name: `casual-shoot-${index + 1}`,
            };
          }
        }),
      );
      return {
        ...item,
        previewImages: previewImages.filter(Boolean),
      };
    }),
  );

  return resolved;
};

const toCasualShootStateMeta = (value) => {
  const state = Number(value);
  if (state === CASUAL_SHOOT_STATUS_PENDING) {
    return {
      stateValue: CASUAL_SHOOT_STATUS_PENDING,
      stateText: "未整改",
      stateClass: "is-pending",
    };
  }
  if (state === CASUAL_SHOOT_STATUS_DONE) {
    return {
      stateValue: CASUAL_SHOOT_STATUS_DONE,
      stateText: "已整改",
      stateClass: "is-done",
    };
  }
  return {
    stateValue: NaN,
    stateText: "未知状态",
    stateClass: "is-unknown",
  };
};

const parseCasualShootListResponse = (response = {}) => {
  if (String(response.code) !== "0") {
    throw new Error(response.msg || "加载失败");
  }

  const payload = response.data || {};
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.list)) return payload.list;
  if (Array.isArray(payload.rows)) return payload.rows;
  return [];
};

const toCasualShootListItem = (record = {}) => {
  const stateMeta = toCasualShootStateMeta(record.state);
  const createdAtRaw = record.create_time;
  const updatedAtRaw = record.update_time;
  const createdAtTimestamp = toDateTimestamp(createdAtRaw);
  const updatedAtTimestamp = toDateTimestamp(updatedAtRaw);
  const displayTimestamp = createdAtTimestamp || updatedAtTimestamp;

  return {
    ...record,
    ...stateMeta,
    firstDescription: record.name || "--",
    createdAtText: toDateTimeText(createdAtRaw),
    updatedAtText: toDateTimeText(updatedAtRaw),
    sortTimestamp: displayTimestamp || 0,
  };
};

module.exports = {
  CASUAL_SHOOT_STATUS_PENDING,
  CASUAL_SHOOT_STATUS_DONE,
  CASUAL_SHOOT_TAB_CONFIG,
  normalizeText,
  normalizeProjectId,
  normalizeTaskId,
  parseFiles,
  isAbsoluteImageUrl,
  withCasualShootPreviewPlaceholders,
  hydrateCasualShootListPreviewImages,
  parseCasualShootListResponse,
  toCasualShootListItem,
};
