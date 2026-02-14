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

const saveTaskForm = async (data) =>
  request("/api/ct/form/save", {
    method: "POST",
    data: data || {},
  });

module.exports = {
  getTaskList,
  getTaskDetail,
  saveTaskForm,
};
