const buildKey = (linkId) => `daily-challenge:${linkId}`;

export const getDailyChallengeSession = (linkId) => {
  try {
    const raw = sessionStorage.getItem(buildKey(linkId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setDailyChallengeSession = (linkId, patch) => {
  const current = getDailyChallengeSession(linkId) || {};
  const next = { ...current, ...patch };
  sessionStorage.setItem(buildKey(linkId), JSON.stringify(next));
  return next;
};

export const clearDailyChallengeSession = (linkId) => {
  sessionStorage.removeItem(buildKey(linkId));
};
