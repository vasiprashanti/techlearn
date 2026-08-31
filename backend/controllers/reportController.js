import mongoose from "mongoose";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramPerformanceRecord from "../models/ProgramPerformanceRecord.js";
import ProgramPerformanceSummary from "../models/ProgramPerformanceSummary.js";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import Student from "../models/Student.js";
import { assignmentSummary } from "../services/programAssignmentService.js";
import { serializeAssignment } from "../services/programQuestionEngineService.js";

/**
 * GET /api/reports/assessments
 * Retrieves the list of all completed/attempted assessments for the authenticated user.
 */
export const getUserAssessments = async (req, res) => {
  try {
    const userId = req.user._id;

    const assignments = await ProgramAssignment.find({
      userId,
      status: { $in: ["Completed", "In Progress", "Generated"] },
    })
      .populate("programId", "_id name programType duration durationDays")
      .populate("blueprintId", "_id name blueprintType")
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const formatted = assignments.map((assignment) => {
      const summary = assignmentSummary(assignment);
      const isCompleted = assignment.status === "Completed";
      
      let assessmentType = "Program Assessment";
      if (assignment.phase === "day_0_readiness" || assignment.isLeadAssessment) {
        assessmentType = "Free Assessment";
      } else if (assignment.phase === "final_assessment") {
        assessmentType = "Day 30 Assessment";
      } else if (assignment.programDay === 1) {
        assessmentType = "Day 1 Assessment";
      }

      return {
        _id: assignment._id,
        assignmentId: assignment._id,
        programId: assignment.programId?._id || assignment.programId,
        programName: assignment.programId?.name || "Placement Program",
        programType: assignment.programId?.programType || "Placement",
        phase: assignment.phase,
        programDay: assignment.programDay,
        assessmentType,
        status: assignment.status,
        isCompleted,
        score: isCompleted ? (assignment.accuracy ?? summary.accuracy ?? 0) : null,
        accuracy: summary.accuracy,
        totalQuestions: summary.total,
        answeredQuestions: summary.answered,
        correctAnswers: summary.correct,
        targetRole: assignment.targetRole || "",
        targetCompanies: assignment.targetCompanies || [],
        attemptedAt: assignment.createdAt,
        completedAt: assignment.completedAt || (isCompleted ? assignment.updatedAt : null),
      };
    });

    return res.json({
      success: true,
      assessments: formatted,
    });
  } catch (error) {
    console.error("Error fetching user assessment reports:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assessment reports." });
  }
};

/**
 * GET /api/reports/assessments/:assignmentId
 * Retrieves detailed report for a specific assessment attempt.
 */
export const getAssessmentDetailReport = async (req, res) => {
  try {
    const userId = req.user._id;
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: "Invalid assignment ID." });
    }

    const assignment = await ProgramAssignment.findOne({
      _id: assignmentId,
      userId,
    })
      .populate("programId", "_id name programType duration durationDays")
      .populate("blueprintId", "_id name blueprintType configurations");

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assessment report not found." });
    }

    const summary = assignmentSummary(assignment);
    const isCompleted = assignment.status === "Completed";
    const serialized = await serializeAssignment(assignment, { revealAnswers: isCompleted });

    // Category-wise performance aggregation
    const categoryMap = new Map();
    (assignment.questions || []).forEach((q) => {
      const category = q.category || q.subject || "General";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          categoryType: q.categoryType || "mcq",
          total: 0,
          attempted: 0,
          correct: 0,
          score: 0,
        });
      }
      const record = categoryMap.get(category);
      record.total += 1;
      if (q.attempted) {
        record.attempted += 1;
        if (q.correct === true) {
          record.correct += 1;
        }
      }
    });

    const categoryBreakdown = Array.from(categoryMap.values()).map((cat) => ({
      ...cat,
      accuracy: cat.attempted > 0 ? Math.round((cat.correct / cat.attempted) * 100) : 0,
      score: cat.total > 0 ? Math.round((cat.correct / cat.total) * 100) : 0,
    }));

    // ProgramEnrollment is the source of truth for access. Student-level
    // pointers are legacy compatibility fields and can refer to another
    // program (or be empty for an individual enrollment).
    const isEnrolled = Boolean(await ProgramEnrollment.exists({
      userId,
      programId: assignment.programId?._id || assignment.programId,
      status: { $in: ["Active", "Completed"] },
    }));

    return res.json({
      success: true,
      report: {
        _id: assignment._id,
        assignmentId: assignment._id,
        program: assignment.programId,
        phase: assignment.phase,
        programDay: assignment.programDay,
        status: assignment.status,
        isCompleted,
        isEnrolled,
        targetRole: assignment.targetRole,
        targetCompanies: assignment.targetCompanies,
        overallScore: isCompleted ? (assignment.accuracy ?? summary.accuracy ?? 0) : null,
        accuracy: summary.accuracy,
        totalQuestions: summary.total,
        answeredQuestions: summary.answered,
        correctAnswers: summary.correct,
        categoryBreakdown,
        completedAt: assignment.completedAt || assignment.updatedAt,
        questions: serialized.questions,
      },
    });
  } catch (error) {
    console.error("Error fetching assessment detail report:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch assessment detail report." });
  }
};

/**
 * GET /api/reports/summary
 * Retrieves aggregated report summary for practice, program progress, and assessments.
 */
export const getOverallReportSummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const student = await Student.findOne({ userId }).lean();

    const [assessments, summaries] = await Promise.all([
      ProgramAssignment.find({ userId }).sort({ updatedAt: -1 }).lean(),
      student?._id
        ? ProgramPerformanceSummary.find({ studentId: student._id }).lean()
        : [],
    ]);

    const completedAssessments = assessments.filter((a) => a.status === "Completed");
    const totalScore = completedAssessments.reduce(
      (sum, a) => sum + (Number(a.accuracy) || 0),
      0
    );
    const avgAssessmentScore =
      completedAssessments.length > 0
        ? Math.round(totalScore / completedAssessments.length)
        : 0;

    return res.json({
      success: true,
      summary: {
        totalAssessments: assessments.length,
        completedAssessments: completedAssessments.length,
        avgAssessmentScore,
        topicPerformance: summaries.map((s) => ({
          subject: s.subject,
          topic: s.topic,
          accuracy: s.accuracy,
          classification: s.classification,
          questionsAttempted: s.questionsAttempted,
          correctAnswers: s.correctAnswers,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching overall report summary:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch report summary." });
  }
};
