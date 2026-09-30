export const PROGRAM_AVAILABILITIES = Object.freeze(["Structured", "Trainer-Led", "Both"]);
export const PROGRAM_BILLING_OPTIONS = Object.freeze(["Monthly", "Annual"]);

const cleanPositiveFee = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const fee = Number(value);
  return Number.isFinite(fee) && fee > 0 ? fee : null;
};

export const buildProgramPricing = ({
  programType,
  pricingType,
  availability,
  billingOptions,
  monthlyStructuredFee,
  monthlyTrainerLedFee,
  annualStructuredFee,
  annualTrainerLedFee,
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
      billingOptions: [],
      structuredFee: null,
      trainerLedFee: null,
      monthlyStructuredFee: null,
      monthlyTrainerLedFee: null,
      annualStructuredFee: null,
      annualTrainerLedFee: null,
      programFee: 0,
      pricingPlans: [],
    };
  }
  if (pricingType !== "Paid") return { error: "Pricing must be Free or Paid." };

  const normalizedBillingInputs = Array.isArray(billingOptions)
    ? billingOptions.map((option) => String(option || "").trim().toLocaleLowerCase())
    : null;
  const selectedBillingOptions = normalizedBillingInputs
    ? PROGRAM_BILLING_OPTIONS.filter((option) => normalizedBillingInputs.includes(option.toLocaleLowerCase()))
    : ["Annual"];
  if (normalizedBillingInputs && normalizedBillingInputs.some((option) => !PROGRAM_BILLING_OPTIONS.some((allowed) => allowed.toLocaleLowerCase() === option))) {
    return { error: "Billing options must be Monthly or Annual." };
  }
  if (selectedBillingOptions.length === 0) {
    return { error: "Select at least one billing option: Monthly or Annual." };
  }

  const needsStructured = availability === "Structured" || availability === "Both";
  const needsTrainerLed = availability === "Trainer-Led" || availability === "Both";
  const keyPrefix = programType === "Skill" ? "skill" : "placement";
  const pricingPlans = [];
  const normalizedFees = {
    monthlyStructuredFee: null,
    monthlyTrainerLedFee: null,
    annualStructuredFee: null,
    annualTrainerLedFee: null,
  };

  for (const billingPeriod of selectedBillingOptions) {
    const feeFields = billingPeriod === "Monthly"
      ? {
          Structured: ["monthlyStructuredFee", monthlyStructuredFee],
          "Trainer-Led": ["monthlyTrainerLedFee", monthlyTrainerLedFee],
        }
      : {
          Structured: ["annualStructuredFee", annualStructuredFee],
          "Trainer-Led": ["annualTrainerLedFee", annualTrainerLedFee],
        };

    for (const modality of ["Structured", "Trainer-Led"]) {
      if (modality === "Structured" && !needsStructured) continue;
      if (modality === "Trainer-Led" && !needsTrainerLed) continue;

      const [fieldName, submittedValue] = feeFields[modality];
      // Older admin clients stored a single Structured/Trainer-Led price. Read
      // those values as annual prices until the record is edited in the new form.
      const legacyValue = billingPeriod === "Annual"
        ? modality === "Structured" ? structuredFee : trainerLedFee
        : undefined;
      const rawValue = submittedValue === undefined ? legacyValue : submittedValue;
      const normalizedFee = cleanPositiveFee(rawValue);
      const label = `${billingPeriod} ${modality} Fee`;
      if (normalizedFee === null) {
        return { error: `${label} must be a number greater than zero.` };
      }

      normalizedFees[fieldName] = normalizedFee;
      const legacyPlanKey = modality === "Structured" ? "basic" : "pro";
      const periodKey = billingPeriod.toLowerCase();
      pricingPlans.push({
        key: billingPeriod === "Annual"
          ? `${keyPrefix}-${legacyPlanKey}`
          : `${keyPrefix}-${periodKey}-${modality.toLowerCase()}`,
        title: `${modality} Program — ${billingPeriod}`,
        price: normalizedFee,
        billingPeriod,
        availability: modality,
        benefits: [],
        active: true,
      });
    }
  }

  const annualOrMonthlyStructuredFee = normalizedFees.annualStructuredFee ?? normalizedFees.monthlyStructuredFee;
  const annualOrMonthlyTrainerLedFee = normalizedFees.annualTrainerLedFee ?? normalizedFees.monthlyTrainerLedFee;
  const lowestFee = Math.min(...pricingPlans.map((plan) => plan.price));

  return {
    availability,
    pricingType,
    billingOptions: selectedBillingOptions,
    ...normalizedFees,
    // Keep the old single-modality fields populated for existing consumers.
    structuredFee: annualOrMonthlyStructuredFee ?? null,
    trainerLedFee: annualOrMonthlyTrainerLedFee ?? null,
    programFee: lowestFee,
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
