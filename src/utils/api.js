import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/',
});

const attachAuthToken = (config) => {
  const token = localStorage.getItem('access_token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

api.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));
axios.interceptors.request.use(attachAuthToken, (error) => Promise.reject(error));

export default api;
