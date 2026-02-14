const TAB_STATE_MAP = [10018010, 10018020, undefined, 10018090];

const getStateByTab = (tabIndex) => TAB_STATE_MAP[tabIndex];

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

module.exports = {
  getStateByTab,
  parseTaskListResponse,
  calcHasMore,
};
