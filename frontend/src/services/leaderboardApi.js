const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const getToken = () => localStorage.getItem("token") || localStorage.getItem("authToken");

export const getLeaderboard = async (limit = 20) => {
  const response = await fetch(`${API_BASE}/leaderboard?limit=${limit}`, {
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.message || "Failed to load leaderboard.");
  }

  return payload?.data || { entries: [], currentUser: null, totalParticipants: 0 };
};

export default {
  getLeaderboard,
};
