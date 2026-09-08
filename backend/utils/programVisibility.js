// Programs used for QA or seed verification must never leak into the public
// learner catalog. Real programs are still controlled by status and
// visibility on the Program document; this helper only removes known
// placeholder naming patterns from public discovery responses.
const NON_PUBLIC_PROGRAM_NAME = /^(?:(?:test|demo|sample|placeholder)(?:[\s_-]+|$)|phase[\s_-]*(?:2|two)\b)/i;

export const isUserVisibleProgram = (program) => {
  const name = String(program?.name || "").trim();
  return Boolean(name) && !NON_PUBLIC_PROGRAM_NAME.test(name);
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
