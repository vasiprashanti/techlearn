// Marketing-card configuration only. This never creates checkout orders or
// changes Program plans, enrollment fees, or purchased access.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(method = 'GET', cards, signal) {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE}/site/homepage-pricing`, {
    method,
    signal,
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      ...(method !== 'GET' && token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(cards ? { body: JSON.stringify({ cards }) } : {}),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Homepage pricing is unavailable. Please try again.');
  if (!Array.isArray(body.cards)) throw new Error('Homepage pricing returned an invalid configuration.');
  return body.cards;
}

export const homepagePricingAPI = {
  get: signal => request('GET', undefined, signal),
  save: cards => request('PUT', cards),
};
