const { request } = require("../utils/http");

const getTaskList = async (data) =>
  request("/api/tm/task/list", {
    method: "POST",
    data: data || {},
  });

const getTaskDetail = async (id) =>
  request(`/api/tm/task/get?id=${encodeURIComponent(id)}`, {
    method: "GET",
  });

module.exports = {
  getTaskList,
  getTaskDetail,
};
