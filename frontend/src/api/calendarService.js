// src/services/api/calendarService.js
import api from './api';

export const fetchCalendarActivity = async () => {
  const response = await api.get('/calendar');
  return response.data;
};

export const updateCalendarActivity = async (date, status) => {
  const response = await api.post('/update-calender', { date, status });
  return response.data;
};