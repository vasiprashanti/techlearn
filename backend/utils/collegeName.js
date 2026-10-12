// Helpers for matching free-text college names against the existing list so the
// same institution is not saved twice with different spelling, case or spacing.

const WORD_MAP = {
  engg: "engineering",
  eng: "engineering",
  univ: "university",
  uni: "university",
  inst: "institute",
  institution: "institute",
  coll: "college",
  tech: "technology",
  sci: "science",
  mgmt: "management",
};

const STOP_WORDS = new Set(["the", "of", "and", "for", "in", "at"]);

export const normalizeCollegeName = (value) => {
  const tokens = String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => WORD_MAP[token] || token)
    .filter((token) => !STOP_WORDS.has(token));
  return tokens.join(" ");
};

const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const curr = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
};

/** 0..1 similarity between two college names after normalization. */
export const collegeSimilarity = (a, b) => {
  const na = normalizeCollegeName(a);
  const nb = normalizeCollegeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  // Ignoring spaces also catches "Sri Ram" vs "SriRam".
  const compactA = na.replace(/\s+/g, "");
  const compactB = nb.replace(/\s+/g, "");
  if (compactA === compactB) return 1;
  const distance = levenshtein(compactA, compactB);
  return 1 - distance / Math.max(compactA.length, compactB.length);
};

export const tidyCollegeName = (value) => {
  const cleaned = String(value || "").trim().replace(/\s+/g, " ");
  const isAllLower = cleaned === cleaned.toLowerCase();
  if (!isAllLower) return cleaned;
  return cleaned.toLowerCase().replace(/(^|[\s(-])([a-z])/g, (_, lead, ch) => lead + ch.toUpperCase());
};

export const FUZZY_MATCH_THRESHOLD = 0.86;
