import axios from 'axios';

const sanitizeAdminUrl = (rawApiUrl?: string, adminUrl?: string): string => {
  if (adminUrl && adminUrl.trim().length > 0) {
    return adminUrl.trim().replace(/[\.\/\s]+$/, '');
  }
  const fallback = 'https://ai-resume-interview-coach-1-rovp.onrender.com/api';
  const target = (rawApiUrl && rawApiUrl.trim().length > 0) ? rawApiUrl.trim() : fallback;
  let clean = target.replace(/[\.\/\s]+$/, '');
  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }
  return clean.endsWith('/admin') ? clean : `${clean}/admin`;
};

const API_URL = sanitizeAdminUrl(import.meta.env.VITE_API_URL, import.meta.env.VITE_ADMIN_API_URL);

export const adminApi = axios.create({
  baseURL: API_URL,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach admin token
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
