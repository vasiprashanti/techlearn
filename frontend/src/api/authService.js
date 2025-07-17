// src/api/authService.js
import API from './client';

// Auth services
export const login = (credentials) => API.post('/api/auth/login', credentials);
export const register = (userData) => API.post('/api/auth/register', userData);
export const googleLogin = (token) => API.post('/api/auth/google', { token });

// User services
export const getCurrentUser = () => API.get('/api/auth/me');