// src/services/api/progressService.js
import api from './api';

export const updateCourseProgress = async (progressData) => {
  const response = await api.post('/update-course', progressData);
  return response.data;
};

export const updateExerciseProgress = async (progressData) => {
  const response = await api.post('/update-exercise', progressData);
  return response.data;
};

export const fetchProgress = async () => {
  const response = await api.get('/progress');
  return response.data;
};