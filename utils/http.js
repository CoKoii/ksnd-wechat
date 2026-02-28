const BASE_URL = "https://ksnd.nexinfo.cn/ksndsrv";
// const BASE_URL = "http://139.196.108.216/ksndsrv";
const TOKEN_KEY = "token";
const LOGIN_PAGE_PATH = "/pages/login/login";

let redirectingToLogin = false;

const getToken = () => {
  try {
    return wx.getStorageSync(TOKEN_KEY) || "";
  } catch (error) {
    return "";
  }
};

const setToken = (token = "") => {
  const value = String(token).trim();
  if (!value) return;
  wx.setStorageSync(TOKEN_KEY, value);
};

const clearToken = () => {
  wx.removeStorageSync(TOKEN_KEY);
};

const buildUrl = (url = "") => {
  if (/^https?:\/\//i.test(url)) return url;
  const base = BASE_URL.replace(/\/+$/, "");
  const path = String(url).replace(/^\/+/, "");
  return `${base}/${path}`;
};

const redirectToLogin = () => {
  if (redirectingToLogin) return;

  const pages = getCurrentPages();
  const currentRoute = pages.length ? `/${pages[pages.length - 1].route}` : "";
  if (currentRoute === LOGIN_PAGE_PATH) return;

  redirectingToLogin = true;
  wx.reLaunch({
    url: LOGIN_PAGE_PATH,
    complete: () => {
      redirectingToLogin = false;
    },
  });
};

const isUnauthorized = (statusCode, data) =>
  statusCode === 401 ||
  statusCode === 403 ||
  String((data && data.code) || "") === "401";

const toErrorMessage = (res) => {
  const data = res && res.data;
  if (data && typeof data === "object") {
    return data.msg || data.message || `请求失败(${res.statusCode})`;
  }
  return `请求失败(${res && res.statusCode ? res.statusCode : ""})`;
};

const request = (url, options = {}) =>
  new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error("request: url is required"));
      return;
    }

    const {
      method = "GET",
      data = {},
      header = {},
      withAuth = true,
      timeout = 15000,
    } = options;

    const requestHeader = {
      "content-type": "application/json",
      ...header,
    };

    if (withAuth && !requestHeader.satoken) {
      const token = getToken();
      if (token) requestHeader.satoken = token;
    }

    wx.request({
      url: buildUrl(url),
      method: String(method).toUpperCase(),
      data,
      timeout,
      header: requestHeader,
      success: (res) => {
        const statusCode = res && res.statusCode;
        const responseData = res && res.data;

        if (isUnauthorized(statusCode, responseData)) {
          clearToken();
          redirectToLogin();
          reject({
            statusCode,
            data: responseData,
            message: "登录已失效",
          });
          return;
        }

        if (statusCode >= 200 && statusCode < 300) {
          resolve(responseData);
          return;
        }

        reject({
          statusCode,
          data: responseData,
          message: toErrorMessage(res),
        });
      },
      fail: (error) => {
        reject({
          message: (error && error.errMsg) || "网络请求失败",
          error,
        });
      },
    });
  });

const get = (url, params = {}, options = {}) =>
  request(url, {
    ...options,
    method: "GET",
    data: params,
  });

const post = (url, data = {}, options = {}) =>
  request(url, {
    ...options,
    method: "POST",
    data,
  });

const put = (url, data = {}, options = {}) =>
  request(url, {
    ...options,
    method: "PUT",
    data,
  });

const del = (url, data = {}, options = {}) =>
  request(url, {
    ...options,
    method: "DELETE",
    data,
  });

module.exports = {
  BASE_URL,
  TOKEN_KEY,
  getToken,
  setToken,
  clearToken,
  request,
  get,
  post,
  put,
  del,
};
