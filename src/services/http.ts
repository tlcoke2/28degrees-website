import axios from 'axios';

// Prefer VITE_API_BASE_URL (e.g. https://api.28degreeswest.com)
const BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || 'http://localhost:5000';

// Our API root (adjust if your backend mounts at a different base)
const baseURL = `${BASE}/api/v1`;

export const api = axios.create({
  baseURL,
  withCredentials: true, // allow cookies if you use them
  headers: { 'Content-Type': 'application/json' },
});

// Attach admin/user tokens if present
api.interceptors.request.use((config) => {
  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const userToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const token = adminToken || userToken;
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      const url = err?.response?.config?.url || '';
      const isAdmin = String(url).includes('/admin/');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('token');
        window.location.href = isAdmin ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
