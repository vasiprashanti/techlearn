export const BLUEPRINT_TYPES = Object.freeze([
  "day_0_readiness",
  "revision",
  "company_preparation",
  "final_assessment",
]);

export const BLUEPRINT_TYPE_LABELS = Object.freeze({
  day_0_readiness: "Day 0 Placement Readiness",
  revision: "Revision",
  company_preparation: "Company Preparation",
  final_assessment: "Final Assessment",
});

export const BLUEPRINT_TYPES_BY_PROGRAM_TYPE = Object.freeze({
  Placement: Object.freeze([
    "day_0_readiness",
    "revision",
    "company_preparation",
    "final_assessment",
  ]),
  Skill: Object.freeze(["final_assessment"]),
});

const BLUEPRINT_TYPE_ALIASES = Object.freeze({
  day_0_readiness: "day_0_readiness",
  "day 0 readiness": "day_0_readiness",
  "day 0 placement readiness": "day_0_readiness",
  revision: "revision",
  "company preparation": "company_preparation",
  company_preparation: "company_preparation",
  "final assessment": "final_assessment",
  final_assessment: "final_assessment",
});

export const normalizeBlueprintType = (value) => {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return BLUEPRINT_TYPE_ALIASES[normalized] || null;
};
