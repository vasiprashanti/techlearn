export const PROGRAM_PHASE_TYPES = Object.freeze([
  "learning",
  "revision",
  "company_preparation",
  "mock_interview",
  "final_assessment",
]);

export const PROGRAM_PHASE_LABELS = Object.freeze({
  learning: "Learning",
  revision: "Revision",
  company_preparation: "Company Preparation",
  mock_interview: "Mock Interview",
  final_assessment: "Final Assessment",
});

export const PROGRAM_PHASES_BY_TYPE = Object.freeze({
  Placement: Object.freeze([
    "learning",
    "revision",
    "company_preparation",
    "mock_interview",
    "final_assessment",
  ]),
  Skill: Object.freeze(["learning", "final_assessment"]),
});

const PHASE_ALIASES = Object.freeze({
  learning: "learning",
  revision: "revision",
  "company preparation": "company_preparation",
  company_preparation: "company_preparation",
  "mock interview": "mock_interview",
  mock_interview: "mock_interview",
  "final assessment": "final_assessment",
  final_assessment: "final_assessment",
});

export const normalizePhaseType = (value) => {
  const normalized = String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  return PHASE_ALIASES[normalized] || null;
};

export const parseDurationDays = (duration) => {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return Math.round(duration);
  }

  const match = String(duration || "").match(/(\d+(?:\.\d+)?)\s*-?\s*(day|days|week|weeks|month|months|year|years)/i);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount)) return null;

  const unit = match[2].toLowerCase();
  const multiplier = unit.startsWith("year")
    ? 365
    : unit.startsWith("month")
      ? 30
      : unit.startsWith("week")
        ? 7
        : 1;

  return Math.round(amount * multiplier);
};

export const getMinimumDurationDays = (programType) => (
  programType === "Placement" ? 5 : 2
);

export const buildDefaultProgramPhases = (programType, durationDays) => {
  const totalDays = Number(durationDays);
  const phaseTypes = PROGRAM_PHASES_BY_TYPE[programType];

  if (!phaseTypes || !Number.isInteger(totalDays) || totalDays < getMinimumDurationDays(programType)) {
    return [];
  }

  let lengths;
  if (programType === "Placement") {
    // Keep the requested 30-day shape (22/2/4/1/1) while still producing a
    // valid contiguous configuration for shorter placement programs.
    lengths = totalDays >= 9
      ? [totalDays - 8, 2, 4, 1, 1]
      : [1 + (totalDays - 5), 1, 1, 1, 1];
  } else {
    lengths = [totalDays - 1, 1];
  }

  let nextStartDay = 1;
  return phaseTypes.map((phase, index) => {
    const startDay = nextStartDay;
    const endDay = startDay + lengths[index] - 1;
    nextStartDay = endDay + 1;
    return { phase, startDay, endDay };
  });
};

export const validateAndNormalizeProgramPhases = ({ programType, durationDays, phases }) => {
  const totalDays = Number(durationDays);
  const expectedPhases = PROGRAM_PHASES_BY_TYPE[programType];

  if (!expectedPhases) {
    return { error: "Program type must be Placement or Skill." };
  }

  if (!Number.isInteger(totalDays) || totalDays < getMinimumDurationDays(programType)) {
    return {
      error: `${programType} programs must be at least ${getMinimumDurationDays(programType)} days long.`,
    };
  }

  const sourcePhases = Array.isArray(phases) && phases.length
    ? phases
    : buildDefaultProgramPhases(programType, totalDays);
  const normalized = sourcePhases.map((item) => ({
    phase: normalizePhaseType(item?.phase || item?.key || item?.label),
    startDay: Number(item?.startDay),
    endDay: Number(item?.endDay),
  }));

  if (normalized.some((item) => !item.phase || !Number.isInteger(item.startDay) || !Number.isInteger(item.endDay))) {
    return { error: "Each phase must have a valid phase, start day, and end day." };
  }

  if (normalized.length !== expectedPhases.length || normalized.some((item, index) => item.phase !== expectedPhases[index])) {
    return {
      error: `${programType} programs must use these phases: ${expectedPhases.map((phase) => PROGRAM_PHASE_LABELS[phase]).join(", ")}.`,
    };
  }

  let expectedStartDay = 1;
  for (const item of normalized) {
    if (item.startDay !== expectedStartDay || item.endDay < item.startDay) {
      return { error: "Program phases must be contiguous, ordered, and contain no gaps or overlaps." };
    }
    expectedStartDay = item.endDay + 1;
  }

  if (expectedStartDay - 1 !== totalDays) {
    return { error: `Program phases must cover exactly days 1 through ${totalDays}.` };
  }

  return { phases: normalized };
};
