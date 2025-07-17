const api = import.meta.env.VITE_API_URL;
export const getMajorProjects = () =>
  fetch(`${api}/major-projects/build/major-projects`).then(res => res.json());
