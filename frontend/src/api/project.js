const api = import.meta.env.VITE_API_URL;
export const getProjectById = (id) =>
  fetch(`${api}/project/${id}`).then(res => res.json());
