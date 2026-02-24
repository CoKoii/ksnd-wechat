const { get, post } = require("../utils/http");

const toText = (value) => (value == null || value === "" ? "" : String(value));

const getTaskList = (data = {}) => post("/api/tm/task/list", data);

const getTaskDetail = (id) =>
  get("/api/tm/task/get", {
    id: toText(id),
  });

const saveTaskForm = (data = {}) => post("/api/ct/form/save", data);

module.exports = {
  getTaskList,
  getTaskDetail,
  saveTaskForm,
};
