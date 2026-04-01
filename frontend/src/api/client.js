import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
const normalizedBaseUrl = rawApiUrl
  ? rawApiUrl.replace(/\/$/, '')
  : 'http://localhost:5000';

const apiHostUrl = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl.slice(0, -4)
  : normalizedBaseUrl;

const API = axios.create({
  baseURL: apiHostUrl,
});

// Auto-inject JWT token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;