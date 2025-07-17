// src/services/api/userService.js
import api from './api';

export const fetchUser = async () => {
  const response = await api.get('/user');
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put('/user/profile', profileData);
  return response.data;
};