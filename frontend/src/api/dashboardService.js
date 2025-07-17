import API from './client';

export const fetchDashboardData = async () => {
  return API.get('/api/dashboard');
};