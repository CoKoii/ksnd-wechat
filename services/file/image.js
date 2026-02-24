const { BASE_URL, getToken } = require("../../utils/http");

const OSS_UPLOAD_PATH = "/ksnd/api/oss/upload";
const OSS_PROXY_DOWNLOAD_PATH = "/ksnd/api/proxy/download";

const normalizeText = (value) => String(value || "").trim();
const isAbsoluteUrl = (value) => /^(https?:\/\/|wxfile:\/\/|data:)/i.test(value);
const toUploaderInputFiles = (file) =>
  (Array.isArray(file) ? file : [file]).filter(Boolean);

const pickLocalFilePath = (file = {}) =>
  normalizeText((file && (file.url || file.path)) || "");

const buildUrl = (path = "") => {
  if (isAbsoluteUrl(path)) return path;
  const base = normalizeText(BASE_URL).replace(/\/+$/, "");
  const route = normalizeText(path).replace(/^\/+/, "");
  return `${base}/${route}`;
};

const safeParseJson = (text) => {
  if (!text || typeof text !== "string") return text || {};
  try {
    return JSON.parse(text);
  } catch (error) {
    return {};
  }
};

const pickUploadedPath = (res = {}) => {
  if (!res || typeof res !== "object") return "";
  if (normalizeText(res.url)) return normalizeText(res.url);
  const data = res.data || {};
  if (normalizeText(data.url)) return normalizeText(data.url);
  if (normalizeText(data.path)) return normalizeText(data.path);
  return "";
};

const uploadImage = (filePath) =>
  new Promise((resolve, reject) => {
    const localPath = normalizeText(filePath);
    if (!localPath) {
      reject(new Error("缺少图片路径"));
      return;
    }

    const token = getToken();
    const headers = token ? { satoken: token } : {};

    wx.uploadFile({
      url: buildUrl(OSS_UPLOAD_PATH),
      filePath: localPath,
      name: "file",
      header: headers,
      success: (res) => {
        const statusCode = Number(res && res.statusCode);
        const body = safeParseJson((res && res.data) || "");
        const msg = normalizeText(body.msg || body.message);
        const okByMsg = msg.toUpperCase() === "SUCCESS";
        const okByCode = String(body.code || "") === "0";
        const uploadedPath = pickUploadedPath(body);

        if (
          statusCode >= 200 &&
          statusCode < 300 &&
          uploadedPath &&
          (okByMsg || okByCode || !msg)
        ) {
          resolve({
            path: uploadedPath,
            url: localPath,
          });
          return;
        }

        reject(new Error(msg || "图片上传失败"));
      },
      fail: (error) => {
        reject(new Error((error && error.errMsg) || "图片上传失败"));
      },
    });
  });

const uploadUploaderFiles = async (file, options = {}) => {
  const files = toUploaderInputFiles(file);
  if (!files.length) {
    return {
      uploaded: [],
      failedCount: 0,
    };
  }

  const {
    showLoading = true,
    loadingTitle = "图片上传中",
  } = options;

  if (showLoading) {
    wx.showLoading({
      title: loadingTitle,
      mask: true,
    });
  }

  let failedCount = 0;
  const uploaded = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const item = files[index];
      const localPath = pickLocalFilePath(item);
      if (!localPath) continue;

      try {
        const result = await uploadImage(localPath);
        const serverPath = normalizeText(result && result.path);
        if (!serverPath) {
          failedCount += 1;
          continue;
        }

        uploaded.push({
          path: serverPath,
          url: localPath,
          name: normalizeText(item && item.name) || `image-${Date.now()}-${index + 1}`,
        });
      } catch (error) {
        failedCount += 1;
      }
    }
  } finally {
    if (showLoading) wx.hideLoading();
  }

  return {
    uploaded,
    failedCount,
  };
};

const getFileExt = (path = "") => {
  const match = normalizeText(path).match(/\.([a-zA-Z0-9]{1,8})(?:$|\?)/);
  return match ? match[1].toLowerCase() : "jpg";
};

const writeArrayBufferToFile = (arrayBuffer, ext = "jpg") =>
  new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/img_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    fs.writeFile({
      filePath,
      data: arrayBuffer,
      success: () => resolve(filePath),
      fail: (error) => reject(new Error((error && error.errMsg) || "图片写入失败")),
    });
  });

const downloadImageTempFile = (path) =>
  new Promise((resolve, reject) => {
    const objname = normalizeText(path);
    if (!objname) {
      reject(new Error("缺少图片路径"));
      return;
    }

    const token = getToken();
    const headers = token ? { satoken: token } : {};
    const query = `${OSS_PROXY_DOWNLOAD_PATH}?objname=${encodeURIComponent(objname)}`;

    wx.request({
      url: buildUrl(query),
      method: "POST",
      header: headers,
      responseType: "arraybuffer",
      success: async (res) => {
        try {
          const statusCode = Number(res && res.statusCode);
          if (!(statusCode >= 200 && statusCode < 300)) {
            throw new Error("图片下载失败");
          }

          const arrayBuffer = res && res.data;
          if (!arrayBuffer || !arrayBuffer.byteLength) {
            throw new Error("图片数据为空");
          }

          const tempFilePath = await writeArrayBufferToFile(
            arrayBuffer,
            getFileExt(objname)
          );
          resolve(tempFilePath);
        } catch (error) {
          reject(error instanceof Error ? error : new Error("图片下载失败"));
        }
      },
      fail: (error) => {
        reject(new Error((error && error.errMsg) || "图片下载失败"));
      },
    });
  });

const resolveImagePreview = async (path) => {
  const rawPath = normalizeText(path);
  if (!rawPath) return "";
  if (isAbsoluteUrl(rawPath)) return rawPath;

  try {
    return await downloadImageTempFile(rawPath);
  } catch (error) {
    console.error("resolveImagePreview failed:", rawPath, error);
    return "";
  }
};

const resolveImagePreviewByProxy = async (path) => {
  const rawPath = normalizeText(path);
  if (!rawPath) return "";

  try {
    return await downloadImageTempFile(rawPath);
  } catch (error) {
    console.error("resolveImagePreviewByProxy failed:", rawPath, error);
    return "";
  }
};

module.exports = {
  uploadImage,
  uploadUploaderFiles,
  resolveImagePreview,
  resolveImagePreviewByProxy,
};
