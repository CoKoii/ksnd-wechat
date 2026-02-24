const parseTaskListResponse = (response = {}) => {
  if (String(response.code) !== "0") {
    throw new Error(response.msg || "加载失败");
  }

  const payload = response.data || {};
  return {
    list: Array.isArray(payload.data) ? payload.data : [],
    total: Number(payload.tcnt),
    pageCount: Number(payload.pcnt),
  };
};

const calcHasMore = ({ mergedLength, listLength, page, pageSize, total, pageCount }) => {
  if (Number.isFinite(total)) return mergedLength < total;
  if (Number.isFinite(pageCount)) return page < pageCount;
  return listLength === pageSize;
};
const hasValue = (value) => value != null && value !== "";
const toYmdFromDate = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDateToYmd = (value) => {
  if (!hasValue(value)) return "";

  if (typeof value === "number" && Number.isFinite(value)) {
    const timestamp = value > 1e12 ? value : value * 1000;
    return toYmdFromDate(new Date(timestamp));
  }

  const text = String(value).trim();
  if (!text) return "";

  // 兼容 10 位/13 位时间戳字符串
  if (/^\d{10,13}$/.test(text)) {
    const numeric = Number(text);
    const timestamp = text.length === 13 ? numeric : numeric * 1000;
    return toYmdFromDate(new Date(timestamp));
  }

  // 兼容 2026-02-14 / 2026/2/14 / 2026.2.14 / 2026年2月14日
  const match = text.match(/^(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const normalized = text.replace(/\//g, "-");
  const ymd = toYmdFromDate(new Date(normalized));
  if (ymd) return ymd;

  return "";
};

const pickTaskDateValue = (item = {}) => {
  const preferred = [
    item.create_time,
    item.cktime,
    item.createTime,
    item.createDate,
    item.require_time,
    item.requireDate,
    item.deadline,
    item.plan_time,
    item.planDate,
  ];
  const fixedValue = preferred.find((value) => hasValue(value));
  if (fixedValue !== undefined) return fixedValue;

  const dynamicKey = Object.keys(item).find(
    (key) =>
      /(time|date|day|rq)/i.test(key) &&
      hasValue(item[key])
  );
  return dynamicKey ? item[dynamicKey] : "";
};

module.exports = {
  parseTaskListResponse,
  calcHasMore,
  formatDateToYmd,
  pickTaskDateValue,
};
