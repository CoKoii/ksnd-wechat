const { post } = require("../utils/http");

const login = async (data = {}) =>
  post("/auth/login", data, {
    withAuth: false,
  });

module.exports = {
  login,
};
