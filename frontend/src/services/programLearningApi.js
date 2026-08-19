const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
  };
};

const request = async (path, options = {}) => {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'The program learning request failed.');
  }
  return payload;
};

export const programLearningAPI = {
  getReadinessOptions: () => request('/programs/readiness-options'),
  getExperience: (programId) => request('/programs/' + programId + '/experience'),
  getFinalReport: (programId) => request('/programs/' + programId + '/final-report'),
  getAssignment: (programId, assignmentId) => request(
    '/programs/' + programId + (assignmentId ? '/assignments/' + assignmentId : '/assignments/current')
  ),
  submitAssignmentAnswer: (programId, assignmentId, answer) => request(
    '/programs/' + programId + '/assignments/' + assignmentId + '/answers',
    { method: 'POST', body: JSON.stringify(answer) }
  ),
  submitReadinessAnswer: (programId, answer) => request(
    '/programs/' + programId + '/readiness/answers',
    { method: 'POST', body: JSON.stringify(answer) }
  ),
  getRevisionMaterials: (programId, limit = 8) => request(
    '/programs/' + programId + '/revision/materials?limit=' + encodeURIComponent(limit)
  ),
};

export default programLearningAPI;
