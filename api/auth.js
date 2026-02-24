const { post } = require("../utils/http");

const login = (data = {}) =>
  post("/auth/login", data, {
    withAuth: false,
  });

module.exports = {
  login,
};
