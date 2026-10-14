// Session helpers: the JWT lives for 7 days, so a stored token can be expired
// even though the browser still holds it. These keep UI state and storage in step.

export const SESSION_EXPIRED_EVENT = 'tl:session-expired';

const SESSION_KEYS = ['token', 'authToken', 'userData', 'isAdmin', 'techlearn-dashboard-cache-v1'];

export const getTokenExpiry = (token) => {
  try {
    const part = String(token || '').split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const exp = JSON.parse(json)?.exp;
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
};

export const isTokenExpired = (token, skewMs = 15000) => {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry - skewMs <= Date.now();
};

export const clearStoredSession = () => {
  try {
    SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // storage unavailable
  }
};

// Ends the stored session and tells the app (AuthContext, UserContext) to reset.
export const expireSession = () => {
  let hadSession = false;
  try {
    hadSession = Boolean(localStorage.getItem('token') || localStorage.getItem('userData'));
  } catch {
    // ignore
  }
  clearStoredSession();
  if (hadSession) window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
};
