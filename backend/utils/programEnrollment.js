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
  batchId,
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

  // Callers that do not specify a schedule (for example, payment
  // confirmation) must preserve an existing batch schedule. A legacy batch
  // pointer is only a fallback when it belongs to this same program; an
  // unrelated batch must never attach itself to a new program purchase.
  let resolvedBatchId = batchId;
  if (typeof batchId === "undefined") {
    const hasEnrollmentBatch = existing
      && Object.prototype.hasOwnProperty.call(existing, "batchId");
    if (hasEnrollmentBatch) {
      resolvedBatchId = existing.batchId;
    } else {
      const legacyProgramId = getId(student?.programId) || getId(user?.programId);
      const isSameLegacyProgram = legacyProgramId
        && String(legacyProgramId) === String(resolvedProgramId);
      resolvedBatchId = isSameLegacyProgram
        ? (getId(student?.batchId) || getId(user?.batchId) || null)
        : null;
    }
  }

  const update = {
    $set: {
      userId,
      studentId,
      programId: resolvedProgramId,
      status: "Active",
      accessTier: getAccessTier(program, accessTier),
      batchId: resolvedBatchId || null,
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
        ...(resolvedBatchId ? { batchIds: resolvedBatchId } : {}),
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
export const setBatchScheduleForStudent = async ({
  student,
  user,
  batchId = null,
  programId = null,
  sourceBatchId = null,
}) => {
  const identifiers = [
    getId(user) ? { userId: getId(user) } : null,
    getId(student) ? { studentId: getId(student) } : null,
  ].filter(Boolean);

  // A student's legacy batch pointer is shared across all of their programs.
  // Never use this helper without a per-program or existing-batch scope, or a
  // cohort change could silently rewrite unrelated individual schedules.
  if (identifiers.length === 0 || (!programId && !sourceBatchId)) {
    return { modifiedCount: 0 };
  }

  const query = { status: "Active", $or: identifiers };
  if (programId) query.programId = programId;
  if (sourceBatchId) query.batchId = sourceBatchId;

  return ProgramEnrollment.updateMany(
    query,
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
  source = "onboarding",
}) => {
  if (!user || !student) return null;

  const requestedLearningPath = String(
    onboardingData.learningPath || user.learningPath || ""
  ).trim();

  // Build complete onboarding answers from user object or passed payload
  const fullOnboardingData = {
    learningGoal: onboardingData.learningGoal || user.learningGoal || "",
    placementCategory: onboardingData.placementCategory || user.placementCategory || "",
    targetCompanies: onboardingData.targetCompanies || user.targetCompanies || [],
    skills: onboardingData.skills || user.skills || [],
    targetRole: onboardingData.targetRole || user.targetRole || "",
    learningPath: requestedLearningPath || "Free",
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
  // Do not infer a Free choice for legacy accounts that never stored a
  // learning path. In particular, login synchronization must not pause a
  // previously paid enrollment just because this field is absent.
  const isFreeTier = requestedLearningPath.toLowerCase() === "free";
  if (source === "onboarding" && isFreeTier) {
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
    const matchedProgramId = prog._id;
    const accessTier = getAccessTier(prog);
    const existingEnrollment = await ProgramEnrollment.findOne({
      userId: user._id,
      programId: matchedProgramId,
    }).lean();

    // Login/onboarding synchronization must never resurrect a paused or
    // completed enrollment. Re-entry is an explicit admin assignment or a
    // verified payment event, not a side effect of reading the profile.
    if (source === "onboarding" && existingEnrollment && existingEnrollment.status !== "Active") {
      continue;
    }

    // Completing onboarding must not grant paid access. Paid enrollment is
    // created by the verified payment flow or an explicit admin assignment.
    // A previously verified enrollment may remain active for a Member path;
    // a Free path pauses paid access instead of reactivating it.
    const isPaidOnboardingMatch = source === "onboarding"
      && prog.pricingType === "Paid"
      && (!existingEnrollment || isFreeTier);
    if (isPaidOnboardingMatch) continue;

    let enrollmentBatchId = batchId;
    if (typeof batchId === "undefined") {
      const activeEnrollment = existingEnrollment?.status === "Active" ? existingEnrollment : null;
      const hasEnrollmentBatch = activeEnrollment
        && Object.prototype.hasOwnProperty.call(activeEnrollment, "batchId");

      if (hasEnrollmentBatch) {
        // Preserve the schedule already chosen for this exact program.
        enrollmentBatchId = activeEnrollment.batchId;
      } else {
        // Legacy student/user batch fields are only safe when their primary
        // program is the same program being synchronized. A new program must
        // start individually even if the learner belongs to another cohort.
        const legacyProgramId = getId(student.programId) || getId(user.programId);
        const isSameLegacyProgram = legacyProgramId
          && String(legacyProgramId) === String(matchedProgramId);
        enrollmentBatchId = isSameLegacyProgram
          ? (getId(student.batchId) || getId(user.batchId) || null)
          : null;
      }
    }

    // A null batch is a valid individual enrollment. Keep the batch choice on
    // this enrollment rather than deriving it from Student.batchId later.
    await upsertProgramEnrollment({
      user,
      student,
      program: prog,
      batchId: enrollmentBatchId || null,
      accessTier,
      source,
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
    // Preserve an imported/admin program pointer when onboarding could not
    // create a new enrollment (for example, a paid program awaiting payment).
    // The pointer is not an access grant; protected routes still require a
    // verified ProgramEnrollment record.
    if (!programId) {
      user.programId = null;
      student.programId = null;
      await Promise.all([user.save(), student.save()]);
    }
  }

  return enrolledPrograms;
};
