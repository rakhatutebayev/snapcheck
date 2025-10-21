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

const api = axios.create();

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

export default api;
