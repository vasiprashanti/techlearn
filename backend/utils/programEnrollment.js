import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import { matchProgramsForUser } from "./programMatching.js";

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSelection = (selection) => String(selection || "").trim();

export const resolveProgramForSelection = async (programSelection) => {
  const selection = normalizeSelection(programSelection);

  if (!selection || selection === "Both") return null;

  return Program.findOne({
    programType: new RegExp(`^${escapeRegex(selection)}$`, "i"),
    status: "Active",
    visibility: "Public",
  })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Synchronize user program enrollments based on onboarding data or program selection.
 * Creates ProgramEnrollment entries and updates User/Student primary programId.
 */
export const syncProgramEnrollment = async ({
  user,
  student,
  batchId,
  programSelection,
  onboardingData = {},
}) => {
  if (!user || !student) return null;

  // Build complete onboarding answers from user object or passed payload
  const fullOnboardingData = {
    learningGoal: onboardingData.learningGoal || user.learningGoal || "",
    placementCategory: onboardingData.placementCategory || user.placementCategory || "",
    targetCompanies: onboardingData.targetCompanies || user.targetCompanies || [],
    skills: onboardingData.skills || user.skills || [],
    targetRole: onboardingData.targetRole || user.targetRole || "",
    learningPath: onboardingData.learningPath || user.learningPath || "Free",
  };

  // Run server-side Program matching resolver
  let matchedPrograms = await matchProgramsForUser(fullOnboardingData);

  // If no program matched via metadata resolver, fallback to legacy programSelection matching
  if (!matchedPrograms || matchedPrograms.length === 0) {
    const legacyProgram = await resolveProgramForSelection(programSelection || user.programSelection);
    if (legacyProgram) {
      matchedPrograms = [legacyProgram];
    }
  }

  if (!matchedPrograms || matchedPrograms.length === 0) {
    return [];
  }

  // If user is on Free tier, pause any previous enrollments for Paid / Member-only programs
  const isFreeTier = String(fullOnboardingData.learningPath || "").toLowerCase() === "free";
  if (isFreeTier) {
    const paidProgramIds = await Program.find({
      $or: [{ pricingType: "Paid" }, { accessTier: "Member" }],
    }).distinct("_id");

    if (paidProgramIds.length > 0) {
      await ProgramEnrollment.updateMany(
        { userId: user._id, programId: { $in: paidProgramIds }, status: "Active" },
        { $set: { status: "Paused" } }
      );
    }
  }

  const enrolledPrograms = [];

  for (const prog of matchedPrograms) {
    const programId = prog._id;
    const accessTier = (prog.pricingType === "Paid" || prog.accessTier === "Member") ? "Member" : "Free";

    // Upsert enrollment record safely (unique constraint on userId + programId)
    await ProgramEnrollment.findOneAndUpdate(
      { userId: user._id, programId },
      {
        $set: { status: "Active", accessTier },
        $setOnInsert: {
          userId: user._id,
          studentId: student._id,
          assignedAt: new Date(),
          source: "onboarding",
        },
      },
      { upsert: true, new: true }
    );

    // Safely add student to Program's studentIds array with $addToSet
    await Program.updateOne(
      { _id: programId },
      {
        $addToSet: {
          studentIds: student._id,
          ...(batchId ? { batchIds: batchId } : {}),
        },
      }
    );

    enrolledPrograms.push(prog);
  }

  // Set primary active programId to the top matched program
  if (enrolledPrograms.length > 0) {
    const primaryProgramId = enrolledPrograms[0]._id;
    user.programId = primaryProgramId;
    student.programId = primaryProgramId;

    await Promise.all([user.save(), student.save()]);
  } else {
    // If no active matched programs remain, clear primary programId if it pointed to a non-matching program
    user.programId = null;
    student.programId = null;
    await Promise.all([user.save(), student.save()]);
  }

  return enrolledPrograms;
};
