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
  try {
    const current = getDailyChallengeSession(linkId) || {};
    const next = { ...current, ...patch };
    sessionStorage.setItem(buildKey(linkId), JSON.stringify(next));
    return next;
  } catch (err) {
    console.error("sessionStorage write blocked:", err);
    return patch;
  }
};

export const clearDailyChallengeSession = (linkId) => {
  try {
    sessionStorage.removeItem(buildKey(linkId));
  } catch (err) {
    console.error("sessionStorage clear blocked:", err);
  }
};
