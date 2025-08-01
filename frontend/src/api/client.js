import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.REACT_APP_API_URL || 'http://localhost:5000',
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