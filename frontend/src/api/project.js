const api = import.meta.env.VITE_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const getProjectById = (id) =>
  fetch(`${api}/project/${id}`).then(res => res.json());

export const getStudentActiveProject = () =>
  fetch(`${api}/student/project/active`, { headers: getAuthHeaders() }).then(res => res.json());

export const getStudentProjectOverview = () =>
  fetch(`${api}/student/project/overview`, { headers: getAuthHeaders() }).then(res => res.json());

export const getStudentProjectDayNotes = (dayNumber) =>
  fetch(`${api}/student/project/day-notes/${dayNumber}`, { headers: getAuthHeaders() }).then(res => res.json());

export const toggleStudentProjectTask = (taskId) =>
  fetch(`${api}/student/project/tasks/${taskId}/toggle`, {
    method: 'POST',
    headers: getAuthHeaders()
  }).then(res => res.json());
