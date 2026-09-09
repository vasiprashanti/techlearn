import Batch, { BATCH_STATUS } from "../models/Batch.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import StudentTrackAssignment from "../models/StudentTrackAssignment.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { syncProgramEnrollmentCompletion } from "../services/programCompletionService.js";
import { syncPrimaryProgramPointers } from "./programEnrollment.js";

const INDIA_TIME_ZONE = "Asia/Kolkata";

const getDateKey = (value) => {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value]));

  if (!values.year || !values.month || !values.day) return null;
  return `${values.year}-${values.month}-${values.day}`;
};

export const isBatchExpired = (batch, now = new Date()) => {
  const expiryDate = getDateKey(batch?.expiryDate);
  const today = getDateKey(now);
  return Boolean(expiryDate && today && expiryDate < today);
};

/**
 * End an expired batch and close the cohort schedule. Enrollments that have
 * reached the end of their assigned Program are persisted as Completed so
 * their learners retain read access to the full program history. A batch that
 * closes before its Program is complete remains paused and access is revoked.
 */
export const expireBatchIfNeeded = async (batchOrId) => {
  const batch = batchOrId?._id
    ? batchOrId
    : await Batch.findById(batchOrId).select("_id status expiryDate name").lean();

  if (!batch || batch.status !== BATCH_STATUS.ACTIVE || !isBatchExpired(batch)) {
    return { expired: false, batch };
  }

  const batchId = batch._id;
  const activeEnrollments = await ProgramEnrollment.find({
    batchId,
    status: "Active",
  })
    .select("userId studentId programId")
    .lean();

  const now = new Date();
  await Promise.all([
    Batch.updateOne(
      { _id: batchId, status: BATCH_STATUS.ACTIVE },
      { $set: { status: BATCH_STATUS.COMPLETED } }
    ),
    ProgramEnrollment.updateMany(
      { batchId, status: "Active" },
      { $set: { status: "Paused" } }
    ),
    StudentTrackAssignment.updateMany(
      { batchId, status: "Active" },
      { $set: { status: "Draft", deactivatedAt: now } }
    ),
    // These legacy pointers are still read by older endpoints. Clearing them
    // prevents an expired cohort from leaking access through a fallback path.
    Student.updateMany({ batchId }, { $set: { batchId: null, programId: null } }),
    User.updateMany({ batchId }, { $set: { batchId: null, programId: null } }),
  ]);

  await Promise.all(activeEnrollments.map(async (enrollment) => {
    await syncProgramEnrollmentCompletion({
      programId: enrollment.programId,
      userId: enrollment.userId,
      studentId: enrollment.studentId,
      now,
    });

    await syncPrimaryProgramPointers({
      user: enrollment.userId ? { _id: enrollment.userId } : null,
      student: enrollment.studentId ? { _id: enrollment.studentId } : null,
    });
  }));

  return {
    expired: true,
    batch: { ...batch, status: BATCH_STATUS.COMPLETED },
  };
};

export const expireAllActiveBatches = async () => {
  const activeBatches = await Batch.find({
    status: BATCH_STATUS.ACTIVE,
    expiryDate: { $exists: true, $ne: null },
  })
    .select("_id status expiryDate name")
    .lean();

  const results = [];
  for (const batch of activeBatches) {
    results.push(await expireBatchIfNeeded(batch));
  }
  return results;
};
