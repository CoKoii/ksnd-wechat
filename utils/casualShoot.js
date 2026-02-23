const CASUAL_SHOOT_STORAGE_KEY = "casualShootRecordsV1";

const STATUS_PENDING = "pending";
const STATUS_DONE = "done";

const normalizeText = (value) => String(value || "").trim();

const safeGetStorage = (key) => {
  try {
    return wx.getStorageSync(key);
  } catch (error) {
    return "";
  }
};

const safeSetStorage = (key, value) => {
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    // ignore storage write failures
  }
};

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`.toUpperCase();

const normalizeImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images
    .map((image) => {
      if (!image) return "";
      if (typeof image === "string") return normalizeText(image);
      return normalizeText(image.url || image.path);
    })
    .filter(Boolean);
};

const normalizeItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => ({
      description: normalizeText(item && item.description),
      images: normalizeImages(item && item.images),
    }))
    .filter((item) => item.description || item.images.length);
};

const normalizeStatus = (status) =>
  status === STATUS_DONE ? STATUS_DONE : STATUS_PENDING;

const normalizeTimestamp = (value) => {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  return Date.now();
};

const normalizeRecord = (record) => {
  const createdAt = normalizeTimestamp(record && record.createdAt);
  return {
    id: normalizeText(record && record.id) || createId(),
    status: normalizeStatus(record && record.status),
    items: normalizeItems(record && record.items),
    createdAt,
    updatedAt: normalizeTimestamp((record && record.updatedAt) || createdAt),
  };
};

const readRecords = () => {
  const raw = safeGetStorage(CASUAL_SHOOT_STORAGE_KEY);
  const list = Array.isArray(raw) ? raw : [];
  return list.map(normalizeRecord).filter((item) => item.items.length > 0);
};

const writeRecords = (records) => {
  safeSetStorage(CASUAL_SHOOT_STORAGE_KEY, records.map(normalizeRecord));
};

const sortByCreatedAtDesc = (records) =>
  records.slice().sort((a, b) => b.createdAt - a.createdAt);

const listCasualShootRecords = () => sortByCreatedAtDesc(readRecords());

const getCasualShootRecordById = (id) => {
  const targetId = normalizeText(id);
  if (!targetId) return null;
  return readRecords().find((item) => item.id === targetId) || null;
};

const createCasualShootRecord = (payload = {}) => {
  const items = normalizeItems(payload.items);
  if (!items.length) return null;

  const now = Date.now();
  const record = normalizeRecord({
    id: createId(),
    status: STATUS_PENDING,
    items,
    createdAt: now,
    updatedAt: now,
  });

  const records = readRecords();
  records.unshift(record);
  writeRecords(records);
  return record;
};

const updateCasualShootRecord = (id, payload = {}) => {
  const targetId = normalizeText(id);
  if (!targetId) return null;

  const records = readRecords();
  const index = records.findIndex((item) => item.id === targetId);
  if (index < 0) return null;

  const current = records[index];
  const nextItems =
    payload.items === undefined ? current.items : normalizeItems(payload.items);
  if (!nextItems.length) return null;

  records[index] = normalizeRecord({
    ...current,
    items: nextItems,
    updatedAt: Date.now(),
  });
  writeRecords(records);
  return records[index];
};

const updateCasualShootRecordStatus = (id, status) => {
  const targetId = normalizeText(id);
  const nextStatus = normalizeStatus(status);
  if (!targetId) return null;

  const records = readRecords();
  const index = records.findIndex((item) => item.id === targetId);
  if (index < 0) return null;

  records[index] = normalizeRecord({
    ...records[index],
    status: nextStatus,
    updatedAt: Date.now(),
  });
  writeRecords(records);
  return records[index];
};

const pad2 = (value) => String(value).padStart(2, "0");

const formatDateTime = (value) => {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "--";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--";
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

module.exports = {
  STATUS_PENDING,
  STATUS_DONE,
  listCasualShootRecords,
  getCasualShootRecordById,
  createCasualShootRecord,
  updateCasualShootRecord,
  updateCasualShootRecordStatus,
  formatDateTime,
};
