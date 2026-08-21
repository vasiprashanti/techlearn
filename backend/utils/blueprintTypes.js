export const BLUEPRINT_TYPES = Object.freeze([
  "day_0_readiness",
  "revision",
  "company_preparation",
  "final_assessment",
]);

export const BLUEPRINT_TYPE_LABELS = Object.freeze({
  day_0_readiness: "Free Assessment",
  free_assessment: "Free Assessment",
  revision: "Revision",
  company_preparation: "Company Preparation",
  final_assessment: "Final Assessment",
});

const PROGRAM_TYPE_MAP = Object.freeze({
  Placement: Object.freeze([
    "day_0_readiness",
    "revision",
    "company_preparation",
    "final_assessment",
  ]),
  Skill: Object.freeze([
    "day_0_readiness",
    "final_assessment",
  ]),
});

export const BLUEPRINT_TYPES_BY_PROGRAM_TYPE = new Proxy(PROGRAM_TYPE_MAP, {
  get(target, prop) {
    if (typeof prop === "string") {
      if (target[prop]) return target[prop];
      const lower = prop.toLowerCase();
      if (lower.includes("placement")) return target.Placement;
      if (lower.includes("skill")) return target.Skill;
      return target.Placement;
    }
    return target[prop];
  },
});

const BLUEPRINT_TYPE_ALIASES = Object.freeze({
  day_0_readiness: "day_0_readiness",
  "day 0 readiness": "day_0_readiness",
  "day 0 placement readiness": "day_0_readiness",
  free_assessment: "day_0_readiness",
  "free assessment": "day_0_readiness",
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
