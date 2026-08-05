// src/api/authService.js
import API from './client';

// Auth services
export const login = (credentials) => API.post('/api/auth/login', credentials);
export const register = (userData) => API.post('/api/users/register', userData);
export const googleLogin = (token, extraData = {}) => API.post('/api/auth/google', { token, ...extraData });
export const checkGoogleUser = (token) => API.post('/api/auth/google-check', { token });

// User services
export const getCurrentUser = () => API.get('/api/auth/me');
