const parsePositivePrice = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).replace(/[₹,\s]/g, "").trim();
  if (!normalized || normalized.toLowerCase() === "free") return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
};

export const isFreeProgramItem = (program) => {
  const pricingType = String(program?.pricingType || "").trim().toLowerCase();
  if (pricingType === "free") return true;
  if (pricingType === "paid") return false;

  // Older catalog records may not have pricingType. Only then infer it from
  // their legacy display price instead of treating Paid's default zero fee as Free.
  const legacyPrice = program?.price ?? program?.programFee;
  const normalizedLegacyPrice = String(legacyPrice ?? "").replace(/[₹,\s]/g, "").trim().toLowerCase();
  return normalizedLegacyPrice === "free"
    || (normalizedLegacyPrice !== "" && Number(normalizedLegacyPrice) === 0);
};

export const getProgramPriceLabel = (program) => {
  if (isFreeProgramItem(program)) return "FREE";

  const configuredPlanPrices = Array.isArray(program?.pricingPlans)
    ? program.pricingPlans
      .filter((plan) => plan?.active !== false)
      .map((plan) => ({
        billingPeriod: plan?.billingPeriod,
        price: parsePositivePrice(plan?.price),
      }))
      .filter((plan) => plan.price !== null)
    : [];
  const isMonthly = (bp) => String(bp || '').toLowerCase() === 'monthly';
  const isAnnual = (bp) => String(bp || '').toLowerCase() === 'annual';

  const monthlyPrice = configuredPlanPrices.find(p => isMonthly(p.billingPeriod))?.price
    ?? parsePositivePrice(program?.monthlyStructuredFee)
    ?? parsePositivePrice(program?.monthlyTrainerLedFee);

  const annualPrice = configuredPlanPrices.find(p => isAnnual(p.billingPeriod))?.price
    ?? parsePositivePrice(program?.annualStructuredFee)
    ?? parsePositivePrice(program?.annualTrainerLedFee);

  if (monthlyPrice !== null && annualPrice !== null) {
    return `From ₹${monthlyPrice.toLocaleString('en-IN')}`;
  }

  if (monthlyPrice !== null) {
    return `From ₹${monthlyPrice.toLocaleString('en-IN')}`;
  }

  if (annualPrice !== null) {
    return `From ₹${annualPrice.toLocaleString('en-IN')}`;
  }

  const fallbackPrice = [
    program?.structuredFee,
    program?.trainerLedFee,
    program?.programFee,
    program?.price,
  ]
    .map(parsePositivePrice)
    .find((price) => price !== null);

  const prices = configuredPlanPrices.length > 0
    ? configuredPlanPrices.map((plan) => plan.price)
    : fallbackPrice === undefined ? [] : [fallbackPrice];

  if (prices.length === 0) return "Price unavailable";

  const lowestPrice = Math.min(...prices);
  const priceLabel = `₹${lowestPrice.toLocaleString("en-IN")}`;
  return prices.length > 1
    ? `From ${priceLabel}`
    : priceLabel;
};
