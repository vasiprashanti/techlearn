const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getHeaders = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const request = async (path) => {
  const response = await fetch(`${API_BASE}${path}`, { headers: getHeaders() });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || "Unable to load jobs.");
  return payload;
};

export const jobsAPI = {
  list: (search = "") => request(`/jobs${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  forYou: () => request("/jobs/for-you"),
};

export default jobsAPI;
