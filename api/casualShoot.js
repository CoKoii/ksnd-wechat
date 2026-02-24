const { request } = require("../utils/http");

const saveCasualShootBatch = async (data) =>
  request("/api/safe/im/issue/saveBatch", {
    method: "POST",
    data: data || {},
  });

const getCasualShootList = async (data) =>
  request("/api/safe/im/issue/list", {
    method: "POST",
    data: data || {},
  });

module.exports = {
  saveCasualShootBatch,
  getCasualShootList,
};
