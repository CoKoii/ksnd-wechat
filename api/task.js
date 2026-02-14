const { request } = require("../utils/http");

const getTaskList = async (data) =>
  request("/api/tm/task/list", {
    method: "POST",
    data: data || {},
  });

module.exports = {
  getTaskList,
};
