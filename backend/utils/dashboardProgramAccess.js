import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import { BATCH_STATUS } from "../models/Batch.js";
import { expireBatchIfNeeded } from "./batchLifecycle.js";

const getId = (value) => value?._id || value?.id || value || null;
const getIdString = (value) => {
  const id = getId(value);
  return id ? String(id) : "";
};

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key);

/**
 * Keep the explicit enrollment-level batch choice authoritative. Older
 * enrollment records may not have a batchId field, so those records retain
 * the legacy student/user batch fallback until they are rewritten.
 */
export const getEffectiveEnrollmentBatchId = ({
  enrollment,
  userBatchId = null,
  studentBatchId = null,
} = {}) => (
  hasOwn(enrollment, "batchId")
    ? getId(enrollment.batchId)
    : getId(studentBatchId) || getId(userBatchId)
);

/** Resolve the newest active enrollment, while retaining completed history. */
export const orderAccessibleProgramEnrollments = ({
  enrollments = [],
  accessibleProgramIds = [],
  preferredProgramId = null,
} = {}) => {
  const accessible = new Set(accessibleProgramIds.map((id) => String(id)));
  const preferred = getIdString(preferredProgramId);
  const activeEnrollments = enrollments
    .filter((enrollment) => enrollment.status === "Active")
    .sort((left, right) => new Date(right.assignedAt || right.createdAt || 0) - new Date(left.assignedAt || left.createdAt || 0));
  const canonicalActiveEnrollmentId = getIdString(activeEnrollments[0]);

  return enrollments
    .filter((enrollment) => accessible.has(getIdString(enrollment.programId)))
    .filter((enrollment) => enrollment.status !== "Active"
      || getIdString(enrollment) === canonicalActiveEnrollmentId)
    .sort((left, right) => {
      const leftStatusRank = left.status === "Active" ? 0 : 1;
      const rightStatusRank = right.status === "Active" ? 0 : 1;
      if (leftStatusRank !== rightStatusRank) return leftStatusRank - rightStatusRank;
      const leftPreferred = left.status !== "Active" && preferred && getIdString(left.programId) === preferred;
      const rightPreferred = right.status !== "Active" && preferred && getIdString(right.programId) === preferred;
      if (leftPreferred !== rightPreferred) return leftPreferred ? -1 : 1;

      const leftDate = new Date(left.assignedAt || left.createdAt || 0).getTime();
      const rightDate = new Date(right.assignedAt || right.createdAt || 0).getTime();
      return rightDate - leftDate;
    });
};

/**
 * Resolve the program that may be shown as the learner's dashboard entry
 * point. ProgramEnrollment is the source of truth; stale User/Student
 * pointers never determine which Program is active.
 */
export const resolveDashboardProgramAccess = async ({
  userId,
  studentId = null,
  preferredProgramId = null,
  userBatchId = null,
  studentBatchId = null,
} = {}) => {
  const identifiers = [
    userId ? { userId } : null,
    studentId ? { studentId } : null,
  ].filter(Boolean);

  if (!identifiers.length) return null;

  const enrollments = await ProgramEnrollment.find({
    status: { $in: ["Active", "Completed"] },
    $or: identifiers,
  })
    .sort({ assignedAt: -1, createdAt: -1 })
    .lean();

  if (!enrollments.length) return null;

  const programIds = [
    ...new Set(enrollments.map((enrollment) => getIdString(enrollment.programId)).filter(Boolean)),
  ];
  const programs = await Program.find({
    _id: { $in: programIds },
    status: "Active",
  })
    .select("_id name programType duration durationDays status visibility pricingType")
    .lean();
  const programById = new Map(programs.map((program) => [String(program._id), program]));

  const orderedEnrollments = orderAccessibleProgramEnrollments({
    enrollments,
    accessibleProgramIds: programs.map((program) => program._id),
    preferredProgramId,
  });

  for (const enrollment of orderedEnrollments) {
    const programId = getIdString(enrollment.programId);
    const program = programById.get(programId);
    if (!program) continue;
    if (enrollment.status === "Active" && enrollment.accessExpiresAt && new Date(enrollment.accessExpiresAt) < new Date()) continue;

    // Paid access is a server-side entitlement. A stale or malformed
    // enrollment with a Free tier must not put a paid program on Dashboard.
    if (program.pricingType === "Paid" && enrollment.accessTier !== "Member") continue;

    const batchId = getEffectiveEnrollmentBatchId({
      enrollment,
      userBatchId,
      studentBatchId,
    });

    // Private programs are never a general dashboard/catalog entry. An
    // explicit enrollment is still a valid access grant for an individual
    // learner, even when it has no batch schedule.
    if (program.visibility !== "Public" && !enrollment) {
      continue;
    }

    if (batchId) {
      const lifecycle = await expireBatchIfNeeded(batchId);
      const batch = lifecycle.batch;
      if (lifecycle.expired || !batch || batch.status !== BATCH_STATUS.ACTIVE) {
        continue;
      }
    }

    return {
      available: true,
      programId,
      programName: program.name,
      programType: program.programType,
      enrollmentStatus: enrollment.status,
      scheduleType: batchId ? "batch" : "individual",
      batchId: batchId ? String(batchId) : null,
      assignedAt: enrollment.assignedAt || enrollment.createdAt || null,
      individualStartDate: enrollment.individualStartDate || enrollment.assignedAt || null,
    };
  }

  return null;
};
