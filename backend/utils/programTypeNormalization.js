const LEGACY_PLACEMENT_TYPES = new Set([
  "placement",
  "placement sprint",
  "placement program",
]);

const LEGACY_SKILL_TYPES = new Set([
  "skill",
  "skill program",
  "full stack project program",
  "project program",
]);

const PROGRAM_TYPE_ALIASES = Object.freeze({
  Placement: ["Placement", "Placement Sprint", "Placement Program", "placement", "placement sprint", "placement program"],
  Skill: ["Skill", "Skill Program", "Full Stack Project Program", "Project Program", "skill", "skill program", "full stack project program", "project program"],
});

/**
 * Normalize known pre-Program values without rewriting unknown production
 * data. Unknown values intentionally return null so diagnostics can report
 * them instead of silently assigning the record to the wrong product.
 */
export const normalizeProgramType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "placement" || normalized.includes("placement") || LEGACY_PLACEMENT_TYPES.has(normalized)) {
    return "Placement";
  }
  if (normalized === "skill" || normalized.includes("skill") || LEGACY_SKILL_TYPES.has(normalized)) {
    return "Skill";
  }
  return null;
};

export const isLegacyProgramType = (value) => {
  const normalized = String(value || "").trim();
  const canonical = normalizeProgramType(normalized);
  return Boolean(canonical && canonical !== normalized);
};

export const getProgramTypeQueryValues = (value) => {
  const canonical = normalizeProgramType(value);
  return canonical ? PROGRAM_TYPE_ALIASES[canonical] : [];
};

export const getProgramTypeDiagnostics = (value) => {
  const canonical = normalizeProgramType(value);
  return {
    raw: value || null,
    canonical,
    isKnown: Boolean(canonical),
    isLegacy: isLegacyProgramType(value),
  };
};
