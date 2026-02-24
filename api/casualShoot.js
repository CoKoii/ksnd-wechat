const { get, post } = require("../utils/http");

const toText = (value) => (value == null || value === "" ? "" : String(value));

const saveCasualShootBatch = (data = {}) =>
  post("/api/safe/im/issue/saveBatch", data);

const getCasualShootList = (data = {}) => post("/api/safe/im/issue/list", data);

const getCasualShootDetail = (id) =>
  get("/api/safe/im/issue/get", {
    id: toText(id),
  });

module.exports = {
  saveCasualShootBatch,
  getCasualShootList,
  getCasualShootDetail,
};
