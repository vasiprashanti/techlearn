// Keep these IDs in sync with frontend question banks:
// - frontend/src/data/adminQuestionBankData.js (interviewQuestionsCatalog)
// - frontend/src/data/coreCsMcqs.js (core CS MCQs)

export const PRACTICE_QUESTION_IDS_BY_TRACK = {
  DSA: ["iq-1", "iq-2", "iq-3", "iq-4", "iq-5", "iq-6", "iq-21", "iq-22"],
  SQL: ["iq-7", "iq-8", "iq-9", "iq-10", "iq-11", "iq-23"],
  "Core CS": ["cc-1", "cc-2", "cc-3", "cc-4", "cc-5", "cc-6", "cc-7", "cc-8"],
  Aptitude: ["iq-25", "iq-26", "iq-27", "iq-28", "iq-29"],
};

export const PRACTICE_TRACKS = Object.keys(PRACTICE_QUESTION_IDS_BY_TRACK);

export const PRACTICE_TOTALS = Object.fromEntries(
  Object.entries(PRACTICE_QUESTION_IDS_BY_TRACK).map(([track, ids]) => [track, ids.length])
);

export const normalizePracticeTrack = (value = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("dsa")) return "DSA";
  if (normalized.includes("sql")) return "SQL";
  if (normalized.includes("apt")) return "Aptitude";
  if (normalized.includes("core")) return "Core CS";
  return null;
};

export const isPracticeQuestionId = (track, questionId) => {
  const list = PRACTICE_QUESTION_IDS_BY_TRACK[track] || [];
  return list.includes(questionId);
};
