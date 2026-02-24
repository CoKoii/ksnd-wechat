const { post } = require("../utils/http");

const getProjectTree = (params = {}) =>
  post("/ksnd/safe/basis/list/project", params);

module.exports = {
  getProjectTree,
};
