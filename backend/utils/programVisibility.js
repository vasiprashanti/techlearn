// Programs used for QA or seed verification must never leak into the public
// learner catalog. Real programs are still controlled by status and
// visibility on the Program document; this helper only removes known
// placeholder naming patterns from public discovery responses.
const NON_PUBLIC_PROGRAM_NAME = /^(?:(?:test|demo|sample|placeholder)(?:[\s_-]+|$)|phase[\s_-]*(?:2|two)\b)/i;

export const isUserVisibleProgram = (program) => {
  const name = String(program?.name || "").trim();
  return Boolean(name) && !NON_PUBLIC_PROGRAM_NAME.test(name);
};

export default isUserVisibleProgram;
