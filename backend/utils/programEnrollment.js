import mongoose from "mongoose";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Course from "../models/Course.js";
import TrackTemplate from "../models/TrackTemplate.js";
import ProgramReadinessLead from "../models/ProgramReadinessLead.js";
import { parseDurationDays } from "./programPhases.js";
import { resolveProgramPrimaryCourseId } from "./programPrimaryCourse.js";
import { getProgramTypeQueryValues, normalizeProgramType } from "./programTypeNormalization.js";
import { getProgramAccessExpiryDate, resolveProgramAccessDurationDays } from "./programPricing.js";

const normalizeSelection = (selection) => String(selection || "").trim();

const getId = (value) => value?._id || value || null;

const getAccessTier = (program, fallback) =>
  fallback || (program?.pricingType === "Paid" ? "Member" : "Free");
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

const getReferenceIds = (values = []) => values
  .map(getId)
  .filter(Boolean)
  .filter((id, index, ids) => ids.findIndex((candidate) => String(candidate) === String(id)) === index);

const getProgramResourceIds = (program, key) => getReferenceIds(
  Array.isArray(program?.[key]) ? program[key] : []
);

export const getProgramExpiryDate = (startDate, program) => {
  const start = new Date(startDate);
  const durationDays = Number(program?.durationDays) || parseDurationDays(program?.duration);
  if (Number.isNaN(start.getTime()) || !Number.isInteger(durationDays) || durationDays < 1) return null;
  // Batch expiry remains its inclusive final learning day for compatibility.
  // Enrollment.programExpiresAt is stored separately as Start + Duration.
  return new Date(start.getTime() + ((durationDays - 1) * DAY_IN_MILLISECONDS));
};

const getProgramTrackFields = (templates) => {
  const ids = templates.map((template) => template._id);
  const taskTemplate = templates.find((template) => template.trackType === "Daily Task") || null;
  const challengeTemplate = templates.find((template) => template.trackType === "Daily Challenge") || null;
  return {
    assignedTrackTemplateIds: ids,
    assignedTrackTemplate: templates[0]?._id || null,
    assignedDailyTaskTrack: taskTemplate?._id || null,
    assignedDailyChallengeTrack: challengeTemplate?._id || null,
    assignedTrack: templates.map((template) => template.name).filter(Boolean).join(", "),
  };
};

const getProgramCourseProjection = (program) => {
  const courseIds = getProgramResourceIds(program, "courseIds");
  const primaryCourseId = getId(resolveProgramPrimaryCourseId(program));
  const orderedCourseIds = primaryCourseId
    ? [primaryCourseId, ...courseIds.filter((id) => String(id) !== String(primaryCourseId))]
    : courseIds;
  return {
    primaryCourseId,
    courseIds: orderedCourseIds,
    supportingCourseIds: orderedCourseIds.slice(1),
  };
};

const getUserForStudent = async (student) => {
  const conditions = [
    student?.userId ? { _id: getId(student.userId) } : null,
    student?.email ? { email: String(student.email).trim().toLowerCase() } : null,
  ].filter(Boolean);

  return conditions.length ? User.findOne({ $or: conditions }).lean() : null;
};

const getEnrollmentIdentifiers = ({ userId, studentId }) => [
  userId ? { userId } : null,
  studentId ? { studentId } : null,
].filter(Boolean);

const pauseOtherActiveProgramEnrollments = async ({ userId, studentId, programId, session = null }) => {
  const identifiers = getEnrollmentIdentifiers({ userId, studentId });
  if (!identifiers.length || !programId) return [];

  const otherEnrollments = await ProgramEnrollment.find({
    status: "Active",
    programId: { $ne: programId },
    $or: identifiers,
  })
    .select("_id programId")
    .session(session)
    .lean();

  if (!otherEnrollments.length) return [];

  await ProgramEnrollment.updateMany(
    { _id: { $in: otherEnrollments.map((enrollment) => enrollment._id) } },
    { $set: { status: "Paused" } },
    { session }
  );

  const previousProgramIds = [
    ...new Set(
      otherEnrollments
        .map((enrollment) => getId(enrollment.programId))
        .filter(Boolean)
        .map((id) => String(id))
    ),
  ];
  if (studentId && previousProgramIds.length) {
    await Program.updateMany(
      { _id: { $in: previousProgramIds } },
      { $pull: { studentIds: studentId } },
      { session }
    );
  }

  return previousProgramIds;
};

/**
 * Make one concrete Program the canonical schedule/content source for a
 * batch. A batch has one optional program; every learner already in that
 * batch is moved onto that program's batch schedule while preserving their
 * individualStartDate for a later return to an individual schedule.
 */
export const assignProgramToBatch = async ({ batchId, program, previousProgramId = null, source = "admin" }) => {
  const resolvedBatchId = getId(batchId);
  const resolvedProgramId = getId(program);

  if (!resolvedBatchId || !resolvedProgramId || !program?.programType) {
    throw new Error("A valid batch and concrete Program are required.");
  }
  const normalizedProgramType = normalizeProgramType(program.programType);
  if (!normalizedProgramType) throw new Error("Program has an unknown program type.");

  const batch = await Batch.findById(resolvedBatchId).lean();
  if (!batch) throw new Error("Batch not found.");

  // Program-owned resources are canonical. Keep the legacy Batch references
  // synchronized as a compatibility projection for older admin screens and
  // APIs, so selecting a Program is enough to make every mapped resource
  // available without a second manual assignment step.
  const programCourseProjection = getProgramCourseProjection(program);
  const programCourseIds = programCourseProjection.courseIds;
  const programTrackTemplateIds = getProgramResourceIds(program, "trackTemplateIds");
  const programTrackTemplates = programTrackTemplateIds.length
    ? await TrackTemplate.find({
        _id: { $in: programTrackTemplateIds },
        status: "Active",
      }).select("_id name trackType").lean()
    : [];

  const students = await Student.find({ batchId: resolvedBatchId }).lean();
  const studentIds = students.map((student) => student._id).filter(Boolean);
  const existingBatchProgramIds = await ProgramEnrollment.find({
    batchId: resolvedBatchId,
    status: "Active",
  }).distinct("programId");
  const oldProgramIds = [
    getId(previousProgramId),
    getId(batch.programId),
    ...existingBatchProgramIds.map(getId),
  ]
    .filter(Boolean)
    .filter((id, index, ids) => ids.findIndex((candidate) => String(candidate) === String(id)) === index)
    .filter((id) => String(id) !== String(resolvedProgramId));

  for (const student of students) {
    const user = await getUserForStudent(student);
    const identifiers = [
      { studentId: student._id },
      user?._id ? { userId: user._id } : null,
    ].filter(Boolean);

    // If this batch used to provide another Program, move that old
    // enrollment back to its own individual schedule instead of letting the
    // new batch assignment silently rewrite an unrelated Program.
    if (identifiers.length) {
      await ProgramEnrollment.updateMany(
        {
          batchId: resolvedBatchId,
          status: "Active",
          programId: { $ne: resolvedProgramId },
          $or: identifiers,
        },
        { $set: { batchId: null } }
      );
    }

    await Student.updateOne(
      { _id: student._id },
      { $set: { programId: resolvedProgramId, programSelection: normalizedProgramType } }
    );

    if (user?._id) {
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            batchId: resolvedBatchId,
            programId: resolvedProgramId,
            programSelection: normalizedProgramType,
            ...(batch.startDate ? { startDate: batch.startDate } : {}),
          },
        }
      );

      await upsertProgramEnrollment({
        user,
        student,
        program,
        batchId: resolvedBatchId,
        source,
      });
    }
  }

  await Program.updateOne(
    { _id: resolvedProgramId },
    {
      $addToSet: {
        batchIds: resolvedBatchId,
        ...(studentIds.length ? { studentIds: { $each: studentIds } } : {}),
      },
      ...(String(getId(program.primaryCourseId) || "") === String(programCourseProjection.primaryCourseId || "")
        ? {}
        : { $set: { primaryCourseId: programCourseProjection.primaryCourseId } }),
    }
  );

  if (oldProgramIds.length) {
    await Program.updateMany(
      { _id: { $in: oldProgramIds } },
      { $pull: { batchIds: resolvedBatchId } }
    );
  }

  await Batch.updateOne(
    { _id: resolvedBatchId },
    {
      $set: {
        programId: resolvedProgramId,
        programType: normalizedProgramType,
        programSelection: normalizedProgramType,
        expiryDate: getProgramExpiryDate(batch.startDate, program) || batch.expiryDate,
        attachedCourse: programCourseProjection.primaryCourseId || null,
        supportingCourses: programCourseProjection.supportingCourseIds,
        ...getProgramTrackFields(programTrackTemplates),
      },
    }
  );

  const previousCourseIds = getReferenceIds([
    batch.attachedCourse,
    ...(Array.isArray(batch.supportingCourses) ? batch.supportingCourses : []),
  ]);
  if (previousCourseIds.length) {
    await Course.updateMany(
      { _id: { $in: previousCourseIds }, assignedBatchIds: resolvedBatchId },
      { $pull: { assignedBatchIds: resolvedBatchId } }
    );
  }
  if (programCourseIds.length) {
    await Course.updateMany(
      { _id: { $in: programCourseIds } },
      { $addToSet: { assignedBatchIds: resolvedBatchId } }
    );
  }

  return {
    batchId: resolvedBatchId,
    programId: resolvedProgramId,
    studentCount: students.length,
    reassignedStudentCount: students.length,
  };
};

/**
 * Rebuild legacy Batch course/track projections from the current Program.
 * Program remains canonical; these fields exist only for older batch APIs and
 * screens. This is intentionally idempotent and safe to run after every
 * attachment, detachment, or ordering change.
 */
export const syncProgramCompatibilityProjections = async ({ programId }) => {
  const resolvedProgramId = getId(programId);
  if (!resolvedProgramId) return { programId: null, batchCount: 0 };

  const program = await Program.findById(resolvedProgramId).lean();
  if (!program) return { programId: resolvedProgramId, batchCount: 0 };

  const linkedBatchIds = await Batch.find({
    $or: [
      { programId: resolvedProgramId },
      { _id: { $in: program.batchIds || [] } },
    ],
  }).distinct("_id");

  for (const batchId of linkedBatchIds) {
    await assignProgramToBatch({
      batchId,
      program,
      source: "admin",
    });
  }

  return { programId: resolvedProgramId, batchCount: linkedBatchIds.length };
};

/**
 * Remove a Program from a batch without removing the learners from the
 * batch. Their enrollment for that Program becomes individual, so the
 * learner keeps access and returns to the original individual Day 1 anchor.
 */
export const removeProgramFromBatch = async ({ batchId, programId }) => {
  const resolvedBatchId = getId(batchId);
  const resolvedProgramId = getId(programId);
  if (!resolvedBatchId || !resolvedProgramId) return { modifiedCount: 0 };

  const batch = await Batch.findById(resolvedBatchId).lean();
  if (!batch) return { modifiedCount: 0 };

  const result = await ProgramEnrollment.updateMany(
    { batchId: resolvedBatchId, programId: resolvedProgramId, status: "Active" },
    { $set: { batchId: null } }
  );

  if (String(getId(batch.programId) || "") === String(resolvedProgramId)) {
    await Batch.updateOne(
      { _id: resolvedBatchId, programId: resolvedProgramId },
      { $set: { programId: null, programType: null } }
    );
  }

  await Program.updateOne(
    { _id: resolvedProgramId },
    { $pull: { batchIds: resolvedBatchId } }
  );

  return result;
};

export const resolveProgramForSelection = async (programSelection) => {
  const selection = normalizeSelection(programSelection);
  const queryValues = getProgramTypeQueryValues(selection);

  if (!selection || selection === "Both" || !queryValues.length) return null;

  return Program.findOne({
    programType: { $in: queryValues },
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
 * from changing the learner's current Program roadmap.
 */
export const upsertProgramEnrollment = async ({
  user,
  student,
  program,
  programId,
  batchId,
  accessTier,
  individualStartDate,
  expiryDate,
  pricingPlan,
  status = "Active",
  source = "admin",
  session = null,
}) => {
  const userId = getId(user);
  const studentId = getId(student);
  const resolvedProgramId = getId(program) || getId(programId);

  if (!userId || !studentId || !resolvedProgramId) return null;
  if (!["Active", "Completed", "Paused"].includes(status)) {
    throw new Error("Enrollment status must be Active, Completed, or Paused.");
  }

  // Serialize enrollment changes through the learner row. MongoDB retries a
  // concurrent transaction, which then sees the committed active enrollment.
  if (!session) {
    return mongoose.connection.transaction(async (transactionSession) => {
      await User.updateOne({ _id: userId }, { $inc: { programEnrollmentRevision: 1 } }, { session: transactionSession });
      return upsertProgramEnrollment({ user, student, program, programId, batchId, accessTier,
        individualStartDate, expiryDate, pricingPlan, status, source, session: transactionSession });
    });
  }
  if (status === "Active" && ["user_enrollment", "payment"].includes(source)) {
    const otherActive = await ProgramEnrollment.findOne({ userId, status: "Active", programId: { $ne: resolvedProgramId } })
      .session(session).lean();
    if (otherActive) {
      const error = new Error("You already have an active Program. Ask an admin to complete or switch it before enrolling in another.");
      error.statusCode = 409;
      error.code = "ACTIVE_PROGRAM_EXISTS";
      throw error;
    }
  }

  const now = new Date();
  const explicitIndividualStartDate = individualStartDate
    ? new Date(individualStartDate)
    : null;
  if (explicitIndividualStartDate && Number.isNaN(explicitIndividualStartDate.getTime())) {
    throw new Error("individualStartDate must be a valid date.");
  }
  const existing = await ProgramEnrollment.findOne({
    userId,
    programId: resolvedProgramId,
  }).session(session).lean();

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

  const individualStartDateSource = explicitIndividualStartDate
    ? (source === "admin" || source === "admin_bulk"
      ? "explicit_admin"
      : source === "payment" ? "explicit_payment" : "explicit")
    : null;
  const defaultPaidPlan = !existing && program?.pricingType === "Paid"
    ? (program.pricingPlans || []).find((plan) => plan?.active !== false)
      || (Number(program.programFee) > 0
        ? {
            key: "legacy-single",
            title: "Program Access",
            price: Number(program.programFee),
            billingPeriod: "Annual",
            accessDurationDays: 365,
            availability: program.availability || "Structured",
          }
        : null)
    : null;
  const selectedSnapshot = pricingPlan || existing?.pricingPlanSnapshot || defaultPaidPlan;
  const rawPlanSnapshot = typeof selectedSnapshot?.toObject === 'function' ? selectedSnapshot.toObject() : selectedSnapshot;
  const accessDurationDays = resolveProgramAccessDurationDays({
    accessDurationDays: rawPlanSnapshot?.accessDurationDays || existing?.accessDurationDays,
    pricingPlanSnapshot: rawPlanSnapshot || existing?.pricingPlanSnapshot,
    billingPeriod: rawPlanSnapshot?.billingPeriod || existing?.billingPeriod,
    individualStartDate: existing?.individualStartDate,
    accessExpiresAt: existing?.accessExpiresAt,
  });
  const resolvedPlanSnapshot = rawPlanSnapshot
    ? {
        ...rawPlanSnapshot,
        accessDurationDays: accessDurationDays
          || (rawPlanSnapshot.billingPeriod === "Monthly" ? 30 : 365),
      }
    : null;
  const enrollmentBatch = resolvedBatchId ? await Batch.findById(resolvedBatchId).session(session).lean() : null;
  const enrollmentStartDate = enrollmentBatch?.startDate || explicitIndividualStartDate
    || existing?.individualStartDate
    || existing?.assignedAt
    || now;
  const accessExpiresAt = getProgramAccessExpiryDate(enrollmentStartDate, accessDurationDays, resolvedPlanSnapshot || {});
  const programDurationDays = existing?.programDurationDays || program.durationDays || parseDurationDays(program.duration);
  const programExpiresAt = getProgramAccessExpiryDate(enrollmentStartDate, programDurationDays);

  const resolvedStartDate = explicitIndividualStartDate
    || existing?.individualStartDate
    || existing?.assignedAt
    || now;
  const explicitExpiryDate = expiryDate ? new Date(expiryDate) : null;
  const calculatedExpiryDate = accessExpiresAt || (explicitExpiryDate && !Number.isNaN(explicitExpiryDate.getTime())
    ? explicitExpiryDate
    : getProgramExpiryDate(resolvedStartDate, program));

  const update = {
    $set: {
      userId,
      studentId,
      programId: resolvedProgramId,
      status,
      completedAt: status === "Completed" ? (existing?.completedAt || now) : null,
      accessTier: getAccessTier(program, accessTier),
      batchId: resolvedBatchId || null,
      programDurationDays,
      programExpiresAt,
      ...(calculatedExpiryDate ? { expiryDate: calculatedExpiryDate } : {}),
      individualStartDate: explicitIndividualStartDate || existing?.individualStartDate || enrollmentStartDate,
      ...(resolvedPlanSnapshot ? {
        pricingPlanSnapshot: resolvedPlanSnapshot,
        billingPeriod: resolvedPlanSnapshot.billingPeriod || null,
        accessDurationDays,
      } : accessDurationDays ? { accessDurationDays } : {}),
      ...(accessDurationDays ? { accessExpiresAt } : {}),
      ...(individualStartDateSource ? { individualStartDateSource } : {}),
    },
    $setOnInsert: {
      assignedAt: now,
      source,
      // MongoDB rejects an upsert when the same path exists in both
      // $set and $setOnInsert. An explicit admin/payment date is already
      // present in $set, so only add the inferred source on first insert.
      ...(individualStartDateSource ? {} : { individualStartDateSource: "enrollment" }),
    },
  };

  const enrollment = await ProgramEnrollment.findOneAndUpdate(
    { userId, programId: resolvedProgramId },
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true, session }
  );

  // A learner may have only one active Program. Keep older enrollments for
  // history, but pause them and remove their learner-facing Program links as
  // soon as the new enrollment has been written successfully.
  if (status === "Active") {
    await pauseOtherActiveProgramEnrollments({
      userId,
      studentId,
      programId: resolvedProgramId,
      session,
    });
  }

  await Program.updateOne(
    { _id: resolvedProgramId },
    {
      $addToSet: {
        studentIds: studentId,
        ...(resolvedBatchId ? { batchIds: resolvedBatchId } : {}),
      },
    },
    { session }
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
    },
    { session }
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
  const identifiers = getEnrollmentIdentifiers({ userId, studentId });

  if (!identifiers.length) return null;

  const activeEnrollment = await ProgramEnrollment.findOne({
    status: "Active",
    $or: identifiers,
  })
    .sort({ assignedAt: -1, createdAt: -1 })
    .lean();

  const primaryProgramId = activeEnrollment?.programId || null;
  const batchPatch = { batchId: getId(activeEnrollment?.batchId) };
  if (userId) await User.updateOne({ _id: userId }, { $set: { programId: primaryProgramId, ...batchPatch } });
  if (studentId) await Student.updateOne({ _id: studentId }, { $set: { programId: primaryProgramId, ...batchPatch } });

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
  // Recommendations and onboarding profile sync are not enrollment actions.
  // Only an explicit user enroll, admin assignment, or verified payment may
  // create a ProgramEnrollment.
  if (source === "onboarding") return [];

  const requestedLearningPath = String(onboardingData.learningPath || user.learningPath || "").trim();
  if (!programId) return [];

  // Recommendations are discovery only. This synchronizer may materialize
  // only a concrete Program ID supplied by an explicit assignment/enrollment.
  const explicitlyAssignedProgram = await Program.findById(programId).lean();
  const matchedPrograms = explicitlyAssignedProgram && explicitlyAssignedProgram.status === "Active"
    ? [explicitlyAssignedProgram]
    : [];

  if (!matchedPrograms || matchedPrograms.length === 0) {
    return [];
  }

  const isFreeTier = requestedLearningPath.toLowerCase() === "free";

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
