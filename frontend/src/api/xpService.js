// src/services/api/xpService.js
import api from './api';

export const fetchXP = async () => {
  const response = await api.get('/xp');
  return response.data;
};

export const addXP = async (amount) => {
  const response = await api.post('/api/add', { amount });
  return response.data;
};