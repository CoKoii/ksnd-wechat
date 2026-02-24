const { get, post } = require("../utils/http");

const toText = (value) => String(value ?? "").trim();

const login = (data = {}) =>
  post("/auth/login", data, {
    withAuth: false,
  });

const getUserByUid = (uid = "") =>
  get("/auth/user", {
    uid: toText(uid),
  });

module.exports = {
  login,
  getUserByUid,
};
