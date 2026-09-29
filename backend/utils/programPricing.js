export const PROGRAM_AVAILABILITIES = Object.freeze(["Structured", "Trainer-Led", "Both"]);

const cleanPositiveFee = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const fee = Number(value);
  return Number.isFinite(fee) && fee > 0 ? fee : null;
};

export const buildProgramPricing = ({
  programType,
  pricingType,
  availability,
  structuredFee,
  trainerLedFee,
}) => {
  if (!PROGRAM_AVAILABILITIES.includes(availability)) {
    return { error: "Choose Structured, Trainer-Led, or Both for program availability." };
  }

  if (pricingType === "Free") {
    return {
      availability,
      pricingType,
      structuredFee: null,
      trainerLedFee: null,
      programFee: 0,
      pricingPlans: [],
    };
  }
  if (pricingType !== "Paid") return { error: "Pricing must be Free or Paid." };

  const needsStructured = availability === "Structured" || availability === "Both";
  const needsTrainerLed = availability === "Trainer-Led" || availability === "Both";
  const normalizedStructuredFee = needsStructured ? cleanPositiveFee(structuredFee) : null;
  const normalizedTrainerLedFee = needsTrainerLed ? cleanPositiveFee(trainerLedFee) : null;

  if (needsStructured && normalizedStructuredFee === null) {
    return { error: "Structured Fee must be a number greater than zero." };
  }
  if (needsTrainerLed && normalizedTrainerLedFee === null) {
    return { error: "Trainer-Led Fee must be a number greater than zero." };
  }

  const keyPrefix = programType === "Skill" ? "skill" : "placement";
  const pricingPlans = [];
  if (needsStructured) {
    pricingPlans.push({
      key: `${keyPrefix}-basic`,
      title: "Structured Program",
      price: normalizedStructuredFee,
      benefits: [],
      active: true,
    });
  }
  if (needsTrainerLed) {
    pricingPlans.push({
      key: `${keyPrefix}-pro`,
      title: "Trainer-Led Program",
      price: normalizedTrainerLedFee,
      benefits: [],
      active: true,
    });
  }

  return {
    availability,
    pricingType,
    structuredFee: normalizedStructuredFee,
    trainerLedFee: normalizedTrainerLedFee,
    programFee: normalizedStructuredFee ?? normalizedTrainerLedFee,
    pricingPlans,
  };
};

export const normalizeProgramSelections = (values) => {
  if (!Array.isArray(values)) return [];
  const seen = new Set();
  return values
    .map((value) => String(value || "").trim())
    .filter((value) => {
      const key = value.toLocaleLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

export const resolveConfiguredProgramPricingPlan = (program, planId) => {
  const plans = Array.isArray(program?.pricingPlans)
    ? program.pricingPlans.filter((plan) => plan?.active !== false)
    : [];
  const requestedKey = String(planId || '').trim().toLocaleLowerCase();
  return requestedKey
    ? plans.find((plan) => String(plan?.key || '').trim().toLocaleLowerCase() === requestedKey) || null
    : plans[0] || null;
};
