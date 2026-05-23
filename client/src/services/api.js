import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://elite-hire-backend-78w6.onrender.com/api';

// Remove trailing slash
const normalizeBaseUrl = (url) => {
  return url.replace(/\/+$/, '');
};

// Remove duplicate /api from requests
const normalizeRequestPath = (url) => {
  if (!url) return url;

  return url.replace(/^\/api(?=\/|$)/, '') || '/';
};

const api = axios.create({
  baseURL: normalizeBaseUrl(API_BASE_URL),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    // Fix duplicated /api
    if (config.url) {
      config.url = normalizeRequestPath(config.url);
    }

    const userInfo = localStorage.getItem('userInfo');

    if (userInfo) {
      try {
        const parsedUser = JSON.parse(userInfo);

        if (parsedUser.token) {
          config.headers.Authorization = `Bearer ${parsedUser.token}`;
        }
      } catch (error) {
        console.error('Token Parse Error:', error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
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