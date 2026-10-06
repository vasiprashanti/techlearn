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
  monthlyAccessDurationDays = 30,
  annualAccessDurationDays = 365,
  pricingPlans: submittedPlans,
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

  if (submittedPlans !== undefined) {
    if (!Array.isArray(submittedPlans) || !submittedPlans.length) return { error: "Add at least one paid pricing plan." };
    const keys = new Set();
    const plans = [];
    for (const [index, input] of submittedPlans.entries()) {
      const title = String(input.title || '').trim();
      const price = cleanPositiveFee(input.price);
      const accessDurationUnit = input.accessDurationUnit || 'Days';
      const accessDuration = Number(input.accessDuration ?? input.accessDurationDays);
      const multiplier = { Days: 1, Months: 30, Years: 365 }[accessDurationUnit];
      const modality = input.availability || (availability === 'Both' ? 'Structured' : availability);
      const key = String(input.key || `plan-${index + 1}`).trim();
      if (!title || !price || !multiplier || !Number.isInteger(accessDuration) || accessDuration < 1
        || !['Structured', 'Trainer-Led'].includes(modality)
        || (availability !== 'Both' && availability !== modality) || !key || keys.has(key.toLowerCase())) {
        return { error: "Each plan needs a unique key, name, positive price and whole-number access duration, and an available learning mode." };
      }
      keys.add(key.toLowerCase());
      plans.push({ key, title, price, accessDuration, accessDurationUnit,
        accessDurationDays: accessDuration * multiplier, availability: modality,
        billingPeriod: accessDurationUnit === 'Months' ? 'Monthly' : accessDurationUnit === 'Years' ? 'Annual' : (input.billingPeriod || null),
        benefits: Array.isArray(input.benefits) ? input.benefits : [], active: input.active !== false });
    }
    if (!plans.some(plan => plan.active)) return { error: "At least one pricing plan must be active." };
    return { availability, pricingType, pricingPlans: plans,
      billingOptions: [...new Set(plans.map(plan => plan.billingPeriod).filter(Boolean))],
      programFee: Math.min(...plans.filter(plan => plan.active).map(plan => plan.price)) };
  }

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

  const accessDurations = {
    Monthly: Number(monthlyAccessDurationDays),
    Annual: Number(annualAccessDurationDays),
  };
  for (const billingPeriod of selectedBillingOptions) {
    if (!Number.isInteger(accessDurations[billingPeriod]) || accessDurations[billingPeriod] < 1) {
      return { error: `${billingPeriod} access duration must be a positive whole number of days.` };
    }
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
        accessDurationDays: accessDurations[billingPeriod],
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

// Order snapshots are server-written. Retain the purchased terms even if an
// admin edits the current catalog while Razorpay is capturing the payment.
export const resolvePaidProgramPlan = ({ program, snapshot, amount }) => {
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return null;
  const candidates = snapshot?.key ? [snapshot] : (program?.pricingPlans || []).filter(plan => plan.active !== false);
  const matches = candidates.filter(plan => Math.round(Number(plan.price) * 100) === Math.round(Number(amount) * 100)
    && Number.isInteger(Number(plan.accessDurationDays)) && Number(plan.accessDurationDays) > 0);
  return matches.length === 1 ? matches[0] : null;
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

export const getProgramAccessExpiryDate = (startDate, accessDurationDays, plan = {}) => {
  const start = startDate instanceof Date ? new Date(startDate) : new Date(startDate);
  const days = Number(accessDurationDays);
  if (!startDate || Number.isNaN(start.getTime()) || !Number.isInteger(days) || days < 1) return null;
  const amount = Number(plan.accessDuration);
  if (Number.isInteger(amount) && amount > 0 && ['Months', 'Years'].includes(plan.accessDurationUnit)) {
    const originalDay = start.getUTCDate();
    start.setUTCDate(1);
    start.setUTCMonth(start.getUTCMonth() + amount * (plan.accessDurationUnit === 'Years' ? 12 : 1));
    const lastDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(originalDay, lastDay));
    return start;
  }
  return new Date(start.getTime() + (days * 24 * 60 * 60 * 1000));
};

export const resolveProgramAccessDurationDays = (enrollment = {}) => {
  const explicitDuration = Number(
    enrollment.accessDurationDays || enrollment.pricingPlanSnapshot?.accessDurationDays
  );
  if (Number.isInteger(explicitDuration) && explicitDuration > 0) return explicitDuration;

  const start = enrollment.individualStartDate ? new Date(enrollment.individualStartDate) : null;
  const expiry = enrollment.accessExpiresAt ? new Date(enrollment.accessExpiresAt) : null;
  if (start && expiry && !Number.isNaN(start.getTime()) && !Number.isNaN(expiry.getTime()) && expiry >= start) {
    return Math.floor((Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth(), expiry.getUTCDate())
      - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / (24 * 60 * 60 * 1000));
  }

  if (enrollment.billingPeriod === "Monthly") return 30;
  if (enrollment.billingPeriod === "Annual") return 365;
  return null;
};
