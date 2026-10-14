// src/services/api/api.js
import axios from 'axios';
import { expireSession } from '../utils/session';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token rejected: end the session in-app (AuthContext sends protected pages to login)
      expireSession();
    }
    return Promise.reject(error);
  }
);

export default api;