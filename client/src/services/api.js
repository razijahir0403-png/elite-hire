import axios from 'axios';

/** Production Render API — baseURL includes /api; paths must NOT repeat it */
export const PRODUCTION_API_BASE_URL =
  'https://elite-hire-backend-78w6.onrender.com/api';

const normalizeBaseUrl = (url) => {
  if (!url) return url;
  return url.replace(/\/+$/, '');
};

/**
 * Strip leading /api from request paths when baseURL already ends with /api.
 * Prevents https://host/api/api/auth/login (404).
 */
export const normalizeRequestPath = (url) => {
  if (!url || typeof url !== 'string') return url;
  return url.replace(/^\/api(?=\/|$)/, '') || '/';
};

const resolveApiBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }
  if (import.meta.env.PROD) {
    return PRODUCTION_API_BASE_URL;
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
    if (config.url) {
      config.url = normalizeRequestPath(config.url);
    }

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
      localStorage.removeItem('userInfo');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
