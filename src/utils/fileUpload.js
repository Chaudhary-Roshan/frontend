import api from './api';

/**
 * Converts a browser File/Blob to a Base64 Data URL for instant offline preview/storage.
 */
export const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Uploads a single file to the backend `/api/upload/` endpoint.
 * Gracefully falls back to Base64 DataURL if server upload encounters an issue.
 */
export const uploadFileToServer = async (file, folder = '') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) formData.append('folder', folder);
    const res = await api.post('upload/', formData);
    if (res.data?.url) {
      return res.data.url;
    }
  } catch (err) {
    console.warn("Backend /api/upload/ failed, using local Data URL fallback:", err);
  }
  // Safe fallback to base64 data url
  return await readFileAsDataURL(file);
};

/**
 * Uploads multiple files in bulk to the backend `/api/upload/` endpoint.
 * Supports passing a dedicated folder name to organize assets on server.
 */
export const uploadFilesToServer = async (fileList, folder = '') => {
  const filesArray = Array.from(fileList);
  try {
    const formData = new FormData();
    filesArray.forEach((f) => formData.append('files', f));
    if (folder) formData.append('folder', folder);
    const res = await api.post('upload/', formData);
    if (res.data?.urls && res.data.urls.length > 0) {
      return res.data.urls;
    }
  } catch (err) {
    console.warn("Bulk upload to server failed, falling back to local Data URLs:", err);
  }
  // Fallback: convert each file to base64 Data URL
  return await Promise.all(filesArray.map(f => readFileAsDataURL(f)));
};
