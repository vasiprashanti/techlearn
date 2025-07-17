const api = import.meta.env.VITE_API_URL;
export const getMiniProjects = () =>
  fetch(`${api}/mini-projects`).then(res => res.json());
