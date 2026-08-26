import ProgramEnrollment from "../models/ProgramEnrollment.js";
import Program from "../models/Program.js";
import { combineDateAndTime, getTrackAssignmentDate } from "./trackAssignmentSchedule.js";
import { expireBatchIfNeeded } from "./batchLifecycle.js";

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
  const programId = getId(requestedProgramId) || getId(student?.programId) || getId(user?.programId) || null;
  const identifiers = [
    user?._id ? { userId: user._id } : null,
    student?._id ? { studentId: student._id } : null,
  ].filter(Boolean);

  let enrollment = null;
  if (identifiers.length > 0) {
    const query = { status: "Active", $or: identifiers };
    if (programId) query.programId = programId;
    enrollment = await ProgramEnrollment.findOne(query)
      .sort({ assignedAt: -1, createdAt: -1 })
      .lean();
  }

  const legacyBatchId = getId(student?.batchId) || getId(user?.batchId) || null;
  if (enrollment) {
    // Old records have no batchId property. Treat those as legacy records and
    // retain their existing student-level batch schedule until they are
    // touched by the new enrollment flow.
    const hasEnrollmentBatch = Object.prototype.hasOwnProperty.call(enrollment, "batchId");
    const batchId = hasEnrollmentBatch ? getId(enrollment.batchId) : legacyBatchId;
    const lifecycle = batchId ? await expireBatchIfNeeded(batchId) : { expired: false };
    const individualStartDate = getValidDate(
      enrollment.individualStartDate,
      enrollment.assignedAt,
      student?.createdAt,
      user?.createdAt
    );

    return {
      programId: getId(enrollment.programId) || programId,
      enrollment,
      batchId,
      scheduleType: batchId ? "batch" : "individual",
      individualStartDate,
      batchExpired: Boolean(lifecycle.expired),
    };
  }

  const lifecycle = legacyBatchId
    ? await expireBatchIfNeeded(legacyBatchId)
    : { expired: false };

  return {
    programId,
    enrollment: null,
    batchId: legacyBatchId,
    scheduleType: legacyBatchId ? "batch" : "individual",
    individualStartDate: getValidDate(student?.createdAt, user?.createdAt),
    batchExpired: Boolean(lifecycle.expired),
  };
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
  if (!program || program.status !== "Active" || program.visibility !== "Public") {
    const error = new Error("This program is not available.");
    error.statusCode = 403;
    throw error;
  }

  if (program.pricingType !== "Paid") return null;

  const identifiers = [
    user?._id ? { userId: user._id } : null,
    student?._id ? { studentId: student._id } : null,
  ].filter(Boolean);
  const enrollment = identifiers.length
    ? await ProgramEnrollment.findOne({
        programId: resolvedProgramId,
        status: "Active",
        accessTier: "Member",
        $or: identifiers,
      }).select("_id accessTier").lean()
    : null;

  if (!enrollment) {
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
