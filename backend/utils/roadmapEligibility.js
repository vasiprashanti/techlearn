export const ROADMAP_TARGET_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "AI / Machine Learning Engineer",
  "Data Scientist",
  "Generative AI Engineer",
];

export const ROADMAP_BRANCHES = [
  "CSE",
  "IT",
  "ECE",
  "EEE",
  "Mechanical",
  "Civil",
  "Other",
];

const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

export const normalizeRoadmapTargetRole = (value) => normalize(value);

export const normalizeRoadmapBranch = (value) => normalize(value).replace(/[./_-]/g, " ");

export const normalizeRoadmapBranches = (value) => [
  ...new Set(
    (Array.isArray(value) ? value : [])
      .map((branch) => String(branch || "").trim())
      .filter(Boolean)
  ),
];

const knownBranchMatchers = [
  { value: "CSE", tokens: ["cse", "computer science", "computer engineering", "cs"] },
  { value: "IT", tokens: ["it", "information technology", "information tech"] },
  { value: "ECE", tokens: ["ece", "electronics and communication", "electronics communication"] },
  { value: "EEE", tokens: ["eee", "electrical and electronics", "electrical electronics"] },
  { value: "Mechanical", tokens: ["mechanical", "me"] },
  { value: "Civil", tokens: ["civil", "ce"] },
];

const getBranchLabel = (value) => {
  const normalized = normalizeRoadmapBranch(value);
  if (!normalized) return "";

  const match = knownBranchMatchers.find(({ tokens }) =>
    tokens.some((token) => {
      const normalizedToken = normalizeRoadmapBranch(token);
      if (normalized === normalizedToken || normalizedToken.includes(" ") && normalized.includes(normalizedToken)) return true;
      // Short aliases such as "IT" and "ME" must be whole words. A loose
      // substring match would classify words like "Architecture" as IT.
      if (normalizedToken.length <= 2) {
        return new RegExp(`(^|\\s)${normalizedToken}(\\s|$)`, "i").test(normalized);
      }
      return normalized.includes(normalizedToken);
    })
  );
  return match?.value || "Other";
};

export const getUserBranch = ({ user, student } = {}) =>
  student?.branch || user?.branch || user?.degreeBranch || "";

export const isRoadmapBranchEligible = ({ roadmap, user, student } = {}) => {
  const assignedBranches = normalizeRoadmapBranches(roadmap?.branches);
  if (!assignedBranches.length) return true;

  const learnerBranch = getBranchLabel(getUserBranch({ user, student }));
  if (!learnerBranch) return false;

  const normalizedAssigned = assignedBranches.map(normalizeRoadmapBranch);
  return normalizedAssigned.some((branch) => {
    if (branch === "all" || branch === "any") return true;
    if (branch === "other") return learnerBranch === "Other";
    return branch === normalizeRoadmapBranch(learnerBranch) || getBranchLabel(branch) === learnerBranch;
  });
};

export const isRoadmapTargetRoleMatch = (roadmapRole, userRole) =>
  Boolean(userRole) && normalizeRoadmapTargetRole(roadmapRole) === normalizeRoadmapTargetRole(userRole);

export const formatRoadmapDuration = ({ duration, durationUnit } = {}) => {
  const numericDuration = Number(duration);
  if (!Number.isFinite(numericDuration)) return "";
  const unit = String(durationUnit || "").toLowerCase();
  const label = unit.replace(/s$/, "");
  return `${numericDuration} ${label}${numericDuration === 1 ? "" : "s"}`;
};
