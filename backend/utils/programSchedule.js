import ProgramEnrollment from "../models/ProgramEnrollment.js";
import Program from "../models/Program.js";
import Batch from "../models/Batch.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { combineDateAndTime, getTrackAssignmentDate } from "./trackAssignmentSchedule.js";
import { expireBatchIfNeeded } from "./batchLifecycle.js";
import { isProgramAccessibleToLearner } from "./programVisibility.js";
import { resolveSafeLegacyIndividualStartDate } from "./programEnrollmentDate.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const getId = (value) => value?._id || value || null;

const getValidDate = (...values) => {
  for (const value of values) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
};

const getEnrollmentTimestamp = (enrollment) => {
  const date = new Date(enrollment?.assignedAt || enrollment?.createdAt || 0).getTime();
  return Number.isFinite(date) ? date : 0;
};

/**
 * A learner has one active Program; historical completed enrollments must
 * never win merely because their legacy User/Student program pointer is stale.
 * An explicit programId still takes precedence when resolving a specific
 * Program's resource page.
 */
export const chooseProgramScheduleEnrollment = ({
  enrollments = [],
  preferredProgramId = null,
  requestedProgramId = null,
} = {}) => {
  const eligible = (enrollments || []).filter((enrollment) =>
    ["Active", "Completed"].includes(enrollment?.status)
  );
  const activeEnrollments = eligible
    .filter((enrollment) => enrollment.status === "Active")
    .sort((a, b) => getEnrollmentTimestamp(b) - getEnrollmentTimestamp(a));
  const canonicalActiveEnrollment = activeEnrollments[0] || null;
  const requestedId = getId(requestedProgramId);
  const candidates = (requestedId
    ? eligible.filter((enrollment) => String(getId(enrollment.programId)) === String(requestedId))
    : eligible)
    .filter((enrollment) => enrollment.status !== "Active"
      || String(getId(enrollment)) === String(getId(canonicalActiveEnrollment)));
  if (!candidates.length) return null;

  const preferredId = getId(preferredProgramId);
  const preferred = preferredId
    ? candidates.find((enrollment) => String(getId(enrollment.programId)) === String(preferredId))
    : null;
  if (requestedId) return preferred || candidates.sort((a, b) => getEnrollmentTimestamp(b) - getEnrollmentTimestamp(a))[0];

  const active = candidates.filter((enrollment) => enrollment.status === "Active");
  if (active.length) {
    return active[0];
  }

  return preferred || candidates.sort((a, b) => getEnrollmentTimestamp(b) - getEnrollmentTimestamp(a))[0];
};

const resolveLegacyBatchId = async ({ legacyBatchId, programId }) => {
  if (!legacyBatchId) return null;

  const batch = await Batch.findById(legacyBatchId).select("_id programId").lean();
  if (!batch) return null;

  const batchProgramId = getId(batch.programId);
  if (batchProgramId && (!programId || String(batchProgramId) !== String(programId))) {
    return null;
  }

  return legacyBatchId;
};

/**
 * Resolve the schedule for the learner's active program.
 *
 * ProgramEnrollment is the source of truth. In particular, an explicit
 * `batchId: null` means the learner is intentionally on an individual
 * schedule and must not fall back to Student.batchId. The legacy fallback is
 * only used when there is no enrollment record, or when an old enrollment
 * predates the batchId field entirely.
 */
export const resolveProgramSchedule = async ({ user, student, programId: requestedProgramId = null }) => {
  const requestedId = getId(requestedProgramId);
  const preferredProgramId = getId(student?.programId) || getId(user?.programId) || null;
  const identifiers = [
    user?._id ? { userId: user._id } : null,
    student?._id ? { studentId: student._id } : null,
  ].filter(Boolean);

  const enrollments = identifiers.length
    ? await ProgramEnrollment.find({
        status: { $in: ["Active", "Completed"] },
        $or: identifiers,
      })
        .sort({ assignedAt: -1, createdAt: -1 })
        .lean()
    : [];
  const enrollment = chooseProgramScheduleEnrollment({
    enrollments,
    preferredProgramId,
    requestedProgramId: requestedId,
  });
  const programId = getId(enrollment?.programId) || null;

  const legacyBatchPointer = getId(student?.batchId) || getId(user?.batchId) || null;
  if (enrollment) {
    // Old records have no batchId property. Treat those as legacy records and
    // retain their existing student-level batch schedule until they are
    // touched by the new enrollment flow.
    const hasEnrollmentBatch = Object.prototype.hasOwnProperty.call(enrollment, "batchId");
    const batchId = hasEnrollmentBatch
      ? getId(enrollment.batchId)
      : await resolveLegacyBatchId({
          legacyBatchId: legacyBatchPointer,
          programId: getId(enrollment.programId) || programId,
        });
    let resolvedEnrollment = enrollment;
    const isAlreadyCompleted = enrollment.status === "Completed";
    // A completed enrollment keeps read access to its program resources. Do
    // not let the batch lifecycle helper revoke that completed history while
    // resolving a course or learning page.
    const lifecycle = batchId && !isAlreadyCompleted
      ? await expireBatchIfNeeded(batchId)
      : { expired: false };
    if (lifecycle.expired && enrollment._id) {
      resolvedEnrollment = await ProgramEnrollment.findById(enrollment._id).lean() || enrollment;
    }
    const isCompleted = resolvedEnrollment.status === "Completed";
    const [userRecord, studentRecord] = await Promise.all([
      user?._id ? User.findById(user._id).select("_id startDate createdAt").lean() : null,
      student?._id ? Student.findById(student._id).select("_id createdAt").lean() : null,
    ]);
    const reconciled = await resolveSafeLegacyIndividualStartDate({
      enrollment: resolvedEnrollment,
      user: userRecord || user,
      student: studentRecord || student,
    });
    const individualStartDate = getValidDate(reconciled.date, resolvedEnrollment.assignedAt);

    return {
      programId: getId(enrollment.programId) || programId,
      enrollment: resolvedEnrollment,
      batchId,
      scheduleType: batchId ? "batch" : "individual",
      individualStartDate,
      individualStartDateReconciled: reconciled.reconciled,
      individualStartDateReconciliationReason: reconciled.reason,
      batchExpired: !isCompleted && Boolean(lifecycle.expired),
      isCompleted,
    };
  }

  const legacyBatchId = await resolveLegacyBatchId({ legacyBatchId: legacyBatchPointer, programId });
  const lifecycle = legacyBatchId
    ? await expireBatchIfNeeded(legacyBatchId)
    : { expired: false };

  return {
    programId: null,
    enrollment: null,
    batchId: legacyBatchId,
    scheduleType: legacyBatchId ? "batch" : "individual",
    individualStartDate: null,
    batchExpired: Boolean(lifecycle.expired),
    isCompleted: false,
  };
};

export const isCompletedProgramSchedule = (schedule) => Boolean(
  schedule?.isCompleted || schedule?.enrollment?.status === "Completed"
);

/**
 * Shared day-wise lock rule for program-owned resources. Completed programs
 * are intentionally read-only history and therefore have no future-day lock.
 */
export const isProgramResourceLocked = ({ resourceDay, currentDay, schedule } = {}) => {
  if (isCompletedProgramSchedule(schedule)) return false;
  const day = Number(resourceDay);
  const unlockedThrough = Number(currentDay);
  if (!Number.isFinite(day) || !Number.isFinite(unlockedThrough)) return false;
  return day > unlockedThrough;
};

/**
 * Guard legacy task/challenge endpoints with the same program entitlement
 * rules as the newer learning APIs. A stale pointer is never enough to open a
 * paid program; the learner needs an active Member enrollment for that exact
 * program. Free legacy pointers remain readable for migration compatibility.
 */
export const assertProgramScheduleAccess = async ({ user, student, programId }) => {
  const resolvedProgramId = getId(programId);
  if (!resolvedProgramId || user?.role === "admin") return null;

  const program = await Program.findById(resolvedProgramId)
    .select("pricingType status visibility")
    .lean();
  const identifiers = [
    user?._id ? { userId: user._id } : null,
    student?._id ? { studentId: student._id } : null,
  ].filter(Boolean);
  const enrollment = identifiers.length
    ? await ProgramEnrollment.findOne({
        programId: resolvedProgramId,
        status: { $in: ["Active", "Completed"] },
        $or: identifiers,
      }).select("_id batchId accessTier status accessExpiresAt").lean()
    : null;

  if (!enrollment || !isProgramAccessibleToLearner({ program, enrollment })) {
    const error = new Error("This program is not available.");
    error.statusCode = 403;
    throw error;
  }

  if (enrollment.status === "Active" && enrollment.accessExpiresAt && new Date(enrollment.accessExpiresAt) < new Date()) {
    const error = new Error("This Program access has expired. Contact an admin for help.");
    error.statusCode = 403;
    error.code = "PROGRAM_ACCESS_EXPIRED";
    throw error;
  }

  if (program.pricingType !== "Paid") return null;

  if (!enrollment || enrollment.accessTier !== "Member") {
    const error = new Error("Paid program access requires a verified enrollment.");
    error.statusCode = 403;
    throw error;
  }

  return enrollment;
};

/** Return the date from which the current program schedule should advance. */
export const getProgramScheduleStartDate = ({ batch, individualStartDate }) =>
  getTrackAssignmentDate(batch, "Program", individualStartDate);

/**
 * Calculate a generic program day for resources without a track-template
 * release override. Day 1 is the enrollment/batch start day.
 */
export const calculateProgramDayNumber = ({ batch, individualStartDate, now = new Date() }) => {
  const startDate = getProgramScheduleStartDate({ batch, individualStartDate });
  const releaseStart = combineDateAndTime(startDate, batch?.releaseTime || "00:00");
  const elapsedDays = Math.floor((new Date(now).getTime() - releaseStart.getTime()) / DAY_MS);
  return Math.max(1, elapsedDays + 1);
};
