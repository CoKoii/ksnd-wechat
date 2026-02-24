const { request } = require("../utils/http");

const getProjectTree = async (params = {}) =>
  request("/ksnd/safe/basis/list/project", {
    method: "POST",
    data: params || {},
  });

module.exports = {
  getProjectTree,
};
