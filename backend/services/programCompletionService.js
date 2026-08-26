import mongoose from "mongoose";
import Blueprint from "../models/Blueprint.js";
import Batch from "../models/Batch.js";
import Program from "../models/Program.js";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import { getTrackAssignmentDate } from "../utils/trackAssignmentSchedule.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;

const getId = (value) => value?._id || value?.id || value || null;

const getDateSerial = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) / DAY_MS;
};

const parseDurationDays = (program) => {
  const canonical = Number(program?.durationDays);
  if (Number.isInteger(canonical) && canonical > 0) return canonical;

  const match = String(program?.duration || "").match(/(\d+)\s*(day|days|week|weeks|month|months)/i);
  if (!match) return 30;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return amount * (unit.startsWith("week") ? 7 : unit.startsWith("month") ? 30 : 1);
};

const assignmentAccuracy = (assignment) => {
  const scored = (assignment?.questions || [])
    .filter((item) => item.attempted && Number.isFinite(Number(item.accuracy)))
    .map((item) => Number(item.accuracy));
  if (!scored.length) return null;
  return Math.round(scored.reduce((sum, value) => sum + value, 0) / scored.length);
};

const buildEnrollmentQuery = ({ programId, userId, studentId }) => ({
  programId,
  status: { $in: ["Active", "Paused"] },
  $or: [
    userId ? { userId } : null,
    studentId ? { studentId } : null,
  ].filter(Boolean),
});

/**
 * Persist completion only when the learner has reached the configured end of
 * the program, or has completed the final assessment. A current/incomplete
 * accuracy value is never copied into completionAccuracy.
 */
export const syncProgramEnrollmentCompletion = async ({
  programId,
  userId,
  studentId,
  now = new Date(),
}) => {
  if (!programId || !mongoose.Types.ObjectId.isValid(String(programId)) || (!userId && !studentId)) return null;

  const [program, enrollment] = await Promise.all([
    Program.findById(programId).select("_id duration durationDays").lean(),
    ProgramEnrollment.findOne(buildEnrollmentQuery({ programId, userId, studentId }))
      .sort({ assignedAt: -1, createdAt: -1 })
      .lean(),
  ]);
  if (!program || !enrollment) return null;
  if (enrollment.status === "Completed") return enrollment;

  const batch = enrollment.batchId
    ? await Batch.findById(enrollment.batchId).select("_id startDate assignedTrackTemplateAt").lean()
    : null;
  const startDate = getTrackAssignmentDate(
    batch,
    "Program",
    enrollment.individualStartDate || enrollment.assignedAt
  );
  const startSerial = getDateSerial(startDate);
  const todaySerial = getDateSerial(now);
  const programDay = startSerial === null || todaySerial === null
    ? 0
    : Math.max(0, Math.floor(todaySerial - startSerial) + 1);
  const durationDays = parseDurationDays(program);

  const [finalBlueprint, finalAssignment] = await Promise.all([
    Blueprint.exists({
      programId,
      blueprintType: "final_assessment",
      status: "Active",
    }),
    ProgramAssignment.findOne({
      programId,
      userId: enrollment.userId,
      phase: "final_assessment",
      status: "Completed",
    })
      .sort({ completedAt: -1, updatedAt: -1 })
      .lean(),
  ]);

  // Programs created before dynamic final Blueprints still complete at the
  // end of their configured duration. Programs with a final Blueprint require
  // that assessment to be completed, unless the learner has passed the final
  // scheduled day and the cohort lifecycle has already closed.
  const finalAssessmentCompleted = Boolean(finalAssignment);
  const reachedEnd = programDay >= durationDays;
  const cohortClosedAfterEnd = enrollment.status === "Paused" && programDay > durationDays;
  const completed = finalAssessmentCompleted || (reachedEnd && !finalBlueprint) || cohortClosedAfterEnd;
  if (!completed) return enrollment;

  const completionAccuracy = finalAssessmentCompleted ? assignmentAccuracy(finalAssignment) : null;
  const completedAt = finalAssignment?.completedAt || now;
  return ProgramEnrollment.findOneAndUpdate(
    { _id: enrollment._id, status: { $in: ["Active", "Paused"] } },
    {
      $set: {
        status: "Completed",
        completedAt,
        ...(completionAccuracy === null ? {} : { completionAccuracy }),
      },
    },
    { new: true }
  ).lean();
};

export const syncProgramEnrollmentsForProgram = async ({ programId, now = new Date() }) => {
  if (!programId || !mongoose.Types.ObjectId.isValid(String(programId))) return [];
  const enrollments = await ProgramEnrollment.find({
    programId,
    status: { $in: ["Active", "Paused"] },
  })
    .select("_id userId studentId")
    .lean();

  const results = [];
  for (const enrollment of enrollments) {
    results.push(await syncProgramEnrollmentCompletion({
      programId,
      userId: getId(enrollment.userId),
      studentId: getId(enrollment.studentId),
      now,
    }));
  }
  return results;
};
