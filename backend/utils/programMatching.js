import Program from "../models/Program.js";

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeString = (str = "") => String(str).trim().toLowerCase();

const normalizeArray = (arr = []) =>
  (Array.isArray(arr) ? arr : [])
    .map((item) => normalizeString(item))
    .filter(Boolean);

/**
 * Server-side Program Matching Resolver
 * Evaluates active & public Program records against student's onboarding preferences.
 * 
 * @param {Object} onboardingData 
 * @param {string} onboardingData.learningGoal - "Get Placed" | "Learn New Skills" | "Exploring TechLearn"
 * @param {string} onboardingData.placementCategory - e.g. "On-Campus", "Off-Campus", or "Both".
 * @param {Array<string>} onboardingData.targetCompanies - e.g. ["Google", "Amazon"]
 * @param {Array<string>} onboardingData.skills - e.g. ["Java", "Python"]
 * @param {string} onboardingData.targetRole - e.g. "Software Engineer"
 * @param {string} onboardingData.learningPath - "Free" | "Member"
 * @returns {Promise<Array<Object>>} List of matched Program documents sorted by score
 */
export const matchProgramsForUser = async (onboardingData = {}) => {
  const {
    learningGoal = "",
    placementCategory = "",
    targetCompanies = [],
    skills = [],
    targetRole = "",
    learningPath = "Free",
  } = onboardingData;

  // 1. Fetch all Active & Public programs
  const activePrograms = await Program.find({
    status: "Active",
    visibility: "Public",
  })
    .populate("courseIds", "_id title level courseType numTopics")
    .populate("roadmapIds", "_id title status")
    .populate("projectIds", "_id title category duration_days status")
    .lean();

  if (!activePrograms || activePrograms.length === 0) {
    return [];
  }

  const isFreeTier = normalizeString(learningPath) === "free";
  const userGoal = normalizeString(learningGoal);
  const userCategory = normalizeString(placementCategory);
  const userCompanies = normalizeArray(targetCompanies);
  const userSkills = normalizeArray(skills);
  const userRole = normalizeString(targetRole);

  const scoredCandidates = [];

  for (const program of activePrograms) {
    // Access Tier Rule: Free tier users must not receive Paid / Member-only programs
    if (isFreeTier) {
      if (program.pricingType === "Paid") {
        continue; // Exclude paid programs for Free tier users
      }
    }

    let score = 0;
    const progType = normalizeString(program.programType);
    const progName = normalizeString(program.name);
    const progDesc = normalizeString(program.description);
    const progGoals = normalizeArray(program.learningGoals);
    const progCategories = normalizeArray(program.placementCategories);
    const progCompanies = normalizeArray(program.targetCompanies);
    const progSkills = normalizeArray(program.skillTags);
    const progRoles = normalizeArray(program.targetRoles);

    if (userGoal === "get placed") {
      // Must be a placement-oriented program
      const isPlacementType =
        progGoals.includes("get placed") ||
        progType.includes("placement") ||
        progName.includes("placement") ||
        progDesc.includes("placement");

      if (isPlacementType) {
        score += 10;
      }

      // Placement Category Match
      if (userCategory && progCategories.includes(userCategory)) {
        score += 15;
      }

      // Target Companies Match (Exact matches get high weight)
      if (userCompanies.length > 0) {
        const matchingCompanies = userCompanies.filter((c) =>
          progCompanies.includes(c) || progName.includes(c) || progDesc.includes(c)
        );
        score += matchingCompanies.length * 10;
      }

      // Target Role Match
      if (userRole && (progRoles.includes(userRole) || progName.includes(userRole))) {
        score += 8;
      }
    } else if (userGoal === "learn new skills") {
      const isSkillType =
        progGoals.includes("learn new skills") ||
        progType.includes("project") ||
        progType.includes("skill") ||
        progName.includes("full stack") ||
        progName.includes("skill") ||
        progDesc.includes("skill");

      if (userSkills.length > 0) {
        const matchingSkills = userSkills.filter(
          (s) =>
            progSkills.includes(s) ||
            progName.includes(s) ||
            progDesc.includes(s) ||
            (program.courseIds && program.courseIds.some((c) => normalizeString(c.title).includes(s)))
        );
        if (matchingSkills.length > 0) {
          score += (isSkillType ? 10 : 5) + matchingSkills.length * 10;
        }
      } else if (isSkillType) {
        score += 10;
      }
    } else if (userGoal === "exploring techlearn" || userGoal === "exploring") {
      // General or Exploration Program (Only intentionally configured general programs)
      const isGeneralType =
        progGoals.includes("exploring techlearn") ||
        progGoals.includes("exploring") ||
        progType.includes("general") ||
        progType.includes("explor") ||
        progName.includes("general") ||
        progName.includes("foundation") ||
        progName.includes("starter");

      if (isGeneralType) {
        score += 20;
      }
    } else {
      // Fallback matching logic for legacy goals / empty goal
      if (progName.includes("placement sprint") || progType.includes("placement")) {
        score += 5;
      }
    }

    // Default minimum baseline score for active & public programs
    if (score === 0) {
      score = 1;
    }

    scoredCandidates.push({ program, score });
  }

  // Sort descending by score
  scoredCandidates.sort((a, b) => b.score - a.score);

  return scoredCandidates.map((c) => c.program);
};
