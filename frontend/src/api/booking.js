const api = import.meta.env.VITE_API_URL;
export const bookProject = (projectId, userEmail) =>
  fetch(`${api}/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, userEmail })
  }).then(res => res.json());
