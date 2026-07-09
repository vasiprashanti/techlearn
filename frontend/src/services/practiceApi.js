const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const handleResponse = async (response) => {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || `Request failed with status ${response.status}`);
  }
  return payload.data ?? payload;
};

export const practiceAPI = {
  getQuestions: async (track) => {
    const suffix = track ? `?track=${encodeURIComponent(track)}` : '';
    const response = await fetch(`${API_BASE}/practice/questions${suffix}`);
    return handleResponse(response);
  },

  getQuestionById: async (questionId) => {
    const response = await fetch(`${API_BASE}/question-bank/questions/${questionId}`, {
      headers: buildHeaders(),
    });
    return handleResponse(response);
  },

  getStats: async () => {
    const response = await fetch(`${API_BASE}/practice/stats`, {
      headers: buildHeaders(),
    });
    return handleResponse(response);
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE}/practice/categories`, {
      headers: buildHeaders(),
    });
    return handleResponse(response);
  },

  recordSubmission: async ({ questionId, track, isCorrect, code, language, selectedAnswer, finalize }) => {
    const response = await fetch(`${API_BASE}/practice/submissions`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ questionId, track, isCorrect, code, language, selectedAnswer, finalize }),
    });
    return handleResponse(response);
  },
};

export default practiceAPI;
