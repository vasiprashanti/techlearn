import mongoose from "mongoose";
import Program from "../../models/Program.js";
import ProgramEnrollment from "../../models/ProgramEnrollment.js";
import Student from "../../models/Student.js";
import { syncProgramPerformance } from "../../services/programPerformanceService.js";

const getProgramContext = async (programId) => {
  if (!mongoose.Types.ObjectId.isValid(programId)) {
    return { error: "Invalid program ID format", status: 400 };
  }

  const program = await Program.findById(programId).lean();
  if (!program) return { error: "Program not found", status: 404 };

  const enrollments = await ProgramEnrollment.find({ programId })
    .sort({ assignedAt: -1, createdAt: -1 })
    .populate("batchId", "_id name startDate expiryDate releaseTime assignedTrackTemplateAt assignedDailyTaskTrackAt assignedDailyChallengeTrackAt")
    .lean();

  const studentIds = [
    ...(program.studentIds || []),
    ...enrollments.map((enrollment) => enrollment.studentId),
  ]
    .map((studentId) => studentId?._id || studentId)
    .filter((studentId) => mongoose.Types.ObjectId.isValid(studentId));
  const uniqueStudentIds = [...new Set(studentIds.map((studentId) => String(studentId)))];
  const students = uniqueStudentIds.length
    ? await Student.find({ _id: { $in: uniqueStudentIds } })
      .select("_id userId name email rollNo status createdAt")
      .lean()
    : [];

  return { program, enrollments, students };
};

const includeRecords = (value) => ["1", "true", "yes"].includes(String(value || "").toLowerCase());

export const getProgramPerformance = async (req, res) => {
  try {
    const context = await getProgramContext(req.params.programId);
    if (context.error) return res.status(context.status).json({ success: false, message: context.error });

    const performance = await syncProgramPerformance({
      ...context,
      includeRecords: includeRecords(req.query.includeRecords),
    });

    return res.json({ success: true, performance });
  } catch (error) {
    console.error("Error generating program performance report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate program performance report",
    });
  }
};

export const syncProgramPerformanceReport = async (req, res) => {
  try {
    const context = await getProgramContext(req.params.programId);
    if (context.error) return res.status(context.status).json({ success: false, message: context.error });

    const performance = await syncProgramPerformance({
      ...context,
      includeRecords: includeRecords(req.query.includeRecords),
    });

    return res.json({
      success: true,
      message: "Program performance data synchronized successfully",
      performance,
    });
  } catch (error) {
    console.error("Error synchronizing program performance report:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to synchronize program performance report",
    });
  }
};
