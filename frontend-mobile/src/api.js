import axios from 'axios';

// Change baseUrl to your backend. For device use LAN IP: e.g. http://192.168.1.50:8000
export const baseUrl = 'http://localhost:8000';

export const api = axios.create({
  baseURL: baseUrl,
  timeout: 10000,
});

export const setAuthToken = (token) => {
  if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete api.defaults.headers.common['Authorization'];
};
