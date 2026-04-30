const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");

const request = async (path, { method = "GET", body } = {}) => {
  const token = getToken();
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || payload.error || "Daily Challenge request failed.");
  }

  return payload;
};

export const dailyChallengeAPI = {
  getActive: () => request("/daily-challenge/active"),
  getByLink: (linkId) => request(`/daily-challenge/${linkId}`),
  sendOtp: (linkId, email) =>
    request(`/daily-challenge/${linkId}/send-otp`, {
      method: "POST",
      body: { email },
    }),
  verifyOtp: (linkId, email, otp) =>
    request(`/daily-challenge/${linkId}/verify-otp`, {
      method: "POST",
      body: { email, otp },
    }),
  start: (linkId, email) =>
    request(`/daily-challenge/${linkId}/start`, {
      method: "POST",
      body: { email },
    }),
  run: (linkId, payload) =>
    request(`/daily-challenge/${linkId}/run`, {
      method: "POST",
      body: payload,
    }),
  submit: (linkId, payload) =>
    request(`/daily-challenge/${linkId}/submit`, {
      method: "POST",
      body: payload,
    }),
  end: (linkId, payload) =>
    request(`/daily-challenge/${linkId}/end`, {
      method: "POST",
      body: payload,
    }),
  autoSubmit: (linkId, payload) =>
    request(`/daily-challenge/${linkId}/auto-submit`, {
      method: "POST",
      body: payload,
    }),
};

export default dailyChallengeAPI;
