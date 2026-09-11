// Programs used for QA or seed verification must never leak into the public
// learner catalog. Real programs are still controlled by status and
// visibility on the Program document; this helper only removes known
// placeholder naming patterns from public discovery responses.
const NON_PUBLIC_PROGRAM_NAME = /^(?:(?:test|demo|sample|placeholder)(?:[\s_-]+|$)|phase[\s_-]*(?:2|two)\b)/i;

export const isUserVisibleProgram = (program) => {
  const name = String(program?.name || "").trim();
  if (!name || NON_PUBLIC_PROGRAM_NAME.test(name)) return false;

  // Program must have at least one valid course attached
  const courseCount = Array.isArray(program?.courseIds) ? program.courseIds.length : 0;
  if (courseCount === 0) return false;

  // Program must have duration specified
  if (!program?.duration && !program?.durationDays) return false;

  // If pricingType is Paid, program must have fee or active pricing plan configured
  if (program?.pricingType === "Paid") {
    const hasProgramFee = typeof program.programFee === "number" && program.programFee > 0;
    const hasPricingPlan = Array.isArray(program.pricingPlans) && program.pricingPlans.some((p) => typeof p.price === "number" && p.price > 0);
    if (!hasProgramFee && !hasPricingPlan) return false;
  }

  return true;
};

/**
 * Public programs may be used by any eligible learner. Private programs are
 * intentionally not discoverable; they are available to an admin or to a
 * learner with an explicit enrollment, whether that enrollment is individual
 * or batch-based.
 */
export const isProgramAccessibleToLearner = ({ program, enrollment, isAdmin = false } = {}) => {
  if (isAdmin) return true;
  if (!program || program.status !== "Active") return false;
  return program.visibility === "Public" || Boolean(enrollment);
};

export default isUserVisibleProgram;
