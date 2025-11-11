import axios from 'axios';

function isAbsoluteUrl(url) {
  return /^https?:\/\//i.test(url);
}

function joinUrl(base, path) {
  if (!base) return path;
  if (base.endsWith('/') && path.startsWith('/')) return base + path.slice(1);
  if (!base.endsWith('/') && !path.startsWith('/')) return base + '/' + path;
  return base + path;
}

// Create axios instance with sane defaults to avoid infinite hangs in UI
const api = axios.create({
  // 6s to fail fast when backend is unreachable/misconfigured
  timeout: 6000,
  // Do not send XSRF cookies; we use Bearer tokens
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const base = import.meta?.env?.VITE_API_BASE || '/api';
  const origUrl = config.url || '';

  // Attach Authorization token if present and not already set
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && !config.headers?.Authorization) {
    config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  }

  // Respect absolute URLs
  if (isAbsoluteUrl(origUrl)) return config;

  // Always route through API base (works for '/path' and 'path')
  config.url = joinUrl(base, origUrl);
  return config;
});

// Normalize common network errors so UI can show a clear message
api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Timeout / Network error
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timed out. Please check backend service.';
    } else if (error.message && /Network Error/i.test(error.message)) {
      error.message = 'Network error. Is the backend running on 8000?';
    }
    return Promise.reject(error);
  }
);

export default api;
