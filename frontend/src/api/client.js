import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const normalizedBaseUrl = rawBaseUrl.replace(/\/api\/?$/, '');

const API = axios.create({
  baseURL: normalizedBaseUrl,
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
