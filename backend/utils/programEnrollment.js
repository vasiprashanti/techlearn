import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import ProgramReadinessLead from "../models/ProgramReadinessLead.js";
import { matchProgramsForUser } from "./programMatching.js";

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeSelection = (selection) => String(selection || "").trim();

const getId = (value) => value?._id || value || null;

const getAccessTier = (program, fallback) =>
  fallback || (program?.pricingType === "Paid" ? "Member" : "Free");

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
 * Create or update one program enrollment.
 *
 * `batchId` is intentionally explicit: null means individual schedule,
 * while an ObjectId means the batch controls the schedule. Keeping both
 * values on the enrollment prevents a student's legacy/global batch field
 * from changing an unrelated program's roadmap.
 */
export const upsertProgramEnrollment = async ({
  user,
  student,
  program,
  programId,
  batchId = null,
  accessTier,
  source = "admin",
}) => {
  const userId = getId(user);
  const studentId = getId(student);
  const resolvedProgramId = getId(program) || getId(programId);

  if (!userId || !studentId || !resolvedProgramId) return null;

  const now = new Date();
  const existing = await ProgramEnrollment.findOne({
    userId,
    programId: resolvedProgramId,
  }).lean();

  const update = {
    $set: {
      userId,
      studentId,
      programId: resolvedProgramId,
      status: "Active",
      accessTier: getAccessTier(program, accessTier),
      batchId: batchId || null,
      individualStartDate: existing?.individualStartDate || existing?.assignedAt || now,
    },
    $setOnInsert: {
      assignedAt: now,
      source,
    },
  };

  const enrollment = await ProgramEnrollment.findOneAndUpdate(
    { userId, programId: resolvedProgramId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Program.updateOne(
    { _id: resolvedProgramId },
    {
      $addToSet: {
        studentIds: studentId,
        ...(batchId ? { batchIds: batchId } : {}),
      },
    }
  );

  // A completed Day 0 assessment becomes a converted lead only when the
  // learner is actually enrolled. Leads remain outside Program -> Students
  // until this enrollment write succeeds.
  await ProgramReadinessLead.updateOne(
    {
      userId,
      programId: resolvedProgramId,
      status: { $in: ["Started", "Completed"] },
    },
    {
      $set: {
        status: "Converted",
        convertedAt: now,
      },
    }
  );

  return enrollment;
};

/**
 * Move every active program enrollment for a student onto (or off) a batch.
 * This is used when an admin changes the student's cohort membership. The
 * enrollment's individualStartDate is preserved so removing the batch can
 * safely return the learner to their original individual Day 1.
 */
export const setBatchScheduleForStudent = async ({ student, user, batchId = null }) => {
  const identifiers = [
    getId(user) ? { userId: getId(user) } : null,
    getId(student) ? { studentId: getId(student) } : null,
  ].filter(Boolean);

  if (identifiers.length === 0) return { modifiedCount: 0 };

  return ProgramEnrollment.updateMany(
    { status: "Active", $or: identifiers },
    { $set: { batchId: batchId || null } }
  );
};

export const pauseProgramEnrollment = async ({ student, user, programId }) => {
  const identifiers = [
    getId(user) ? { userId: getId(user) } : null,
    getId(student) ? { studentId: getId(student) } : null,
  ].filter(Boolean);

  if (!identifiers.length || !programId) return { modifiedCount: 0 };

  return ProgramEnrollment.updateMany(
    { programId, $or: identifiers, status: "Active" },
    { $set: { status: "Paused" } }
  );
};

/** Re-point the legacy primary program pointers after an enrollment change. */
export const syncPrimaryProgramPointers = async ({ user, student }) => {
  const userId = getId(user);
  const studentId = getId(student);
  const identifiers = [
    userId ? { userId } : null,
    studentId ? { studentId } : null,
  ].filter(Boolean);

  if (!identifiers.length) return null;

  const activeEnrollment = await ProgramEnrollment.findOne({
    status: "Active",
    $or: identifiers,
  })
    .sort({ assignedAt: -1, createdAt: -1 })
    .lean();

  const primaryProgramId = activeEnrollment?.programId || null;
  if (userId) await User.updateOne({ _id: userId }, { $set: { programId: primaryProgramId } });
  if (studentId) await Student.updateOne({ _id: studentId }, { $set: { programId: primaryProgramId } });

  return activeEnrollment;
};

/**
 * Synchronize user program enrollments based on onboarding data or program selection.
 * Creates ProgramEnrollment entries and updates User/Student primary programId.
 */
export const syncProgramEnrollment = async ({
  user,
  student,
  batchId,
  programId,
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

  // An explicitly assigned Program from the admin flow is authoritative.
  // Only fall back to onboarding matching when no concrete program was set.
  let matchedPrograms = [];
  if (programId) {
    const explicitlyAssignedProgram = await Program.findOne({
      _id: programId,
      status: "Active",
      visibility: "Public",
    }).lean();
    if (explicitlyAssignedProgram) matchedPrograms = [explicitlyAssignedProgram];
  }

  // Run server-side Program matching resolver
  if (matchedPrograms.length === 0) {
    matchedPrograms = await matchProgramsForUser(fullOnboardingData);
  }

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
      pricingType: "Paid",
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
    const accessTier = getAccessTier(prog);
    let enrollmentBatchId = batchId;
    if (typeof batchId === "undefined") {
      const existingEnrollment = await ProgramEnrollment.findOne({
        userId: user._id,
        programId,
        status: "Active",
      }).lean();
      const hasEnrollmentBatch = existingEnrollment
        && Object.prototype.hasOwnProperty.call(existingEnrollment, "batchId");
      enrollmentBatchId = hasEnrollmentBatch
        ? existingEnrollment.batchId
        : (student.batchId || user.batchId || null);
    }

    // A null batch is a valid individual enrollment. Keep the batch choice on
    // this enrollment rather than deriving it from Student.batchId later.
    await upsertProgramEnrollment({
      user,
      student,
      program: prog,
      batchId: enrollmentBatchId || null,
      accessTier,
      source: "onboarding",
    });

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
