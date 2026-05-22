import axios from 'axios';

const normalizeBaseUrl = (url) => {
  if (!url) return url;
  return url.replace(/\/+$/, '');
};

const resolveApiBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }

  if (import.meta.env.PROD) {
    return '/api';
  }

  return 'http://localhost:5000/api';
};

const API_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const { token } = JSON.parse(userInfo);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.error('Error parsing user credentials from localStorage:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        localStorage.removeItem('userInfo');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
