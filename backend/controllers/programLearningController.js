import mongoose from "mongoose";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramPerformanceSummary from "../models/ProgramPerformanceSummary.js";
import {
  getCurrentProgramAssignment,
  getOwnedAssignment,
  getProgramLearningContext,
  serializeAssignment,
} from "../services/programQuestionEngineService.js";
import {
  assignmentSummary,
  ensureReadinessLead,
  submitProgramAssignmentAnswer,
} from "../services/programAssignmentService.js";

const includeDrafts = (req) => req.user?.role === "admin" && ["1", "true", "yes"].includes(String(req.query?.includeDrafts || "").toLowerCase());

const sendError = (res, error, fallback) => {
  const status = Number(error?.statusCode) || 500;
  if (status >= 500) console.error(fallback, error);
  return res.status(status).json({
    success: false,
    message: error?.message || fallback,
  });
};

const buildContextPayload = (context) => ({
  program: {
    _id: context.program._id,
    name: context.program.name,
    description: context.program.description,
    programType: context.program.programType,
    duration: context.program.duration,
    durationDays: context.program.durationDays,
    phases: context.program.phases || [],
  },
  enrolled: context.isEnrolled,
  scheduleType: context.schedule?.scheduleType || null,
  batchId: context.schedule?.batchId || null,
  individualStartDate: context.schedule?.individualStartDate || null,
  programDay: context.programDay,
  phase: context.phase,
  phaseLabel: context.phaseLabel,
  profile: context.profile,
});

const buildFinalReport = async (context) => {
  if (!context?.isEnrolled || !context?.student?._id) return null;

  const [assignments, summaries] = await Promise.all([
    ProgramAssignment.find({
      programId: context.program._id,
      userId: context.user?._id,
      phase: "final_assessment",
    })
      .sort({ programDay: -1, updatedAt: -1 })
      .limit(1),
    ProgramPerformanceSummary.find({
      programId: context.program._id,
      studentId: context.student._id,
    })
      .sort({ programDay: 1, subject: 1, topic: 1, subtopic: 1 })
      .lean(),
  ]);

  const assignment = assignments[0];
  if (!assignment) return null;
  const summary = assignmentSummary(assignment);

  return {
    status: assignment.status,
    programDay: assignment.programDay,
    completedAt: assignment.completedAt,
    score: summary.accuracy,
    totalQuestions: summary.total,
    answeredQuestions: summary.answered,
    correctAnswers: summary.correct,
    topicPerformance: summaries.map((item) => ({
      programDay: item.programDay,
      subject: item.subject,
      topic: item.topic,
      subtopic: item.subtopic,
      accuracy: item.accuracy,
      classification: item.classification,
      questionsAttempted: item.questionsAttempted,
      correctAnswers: item.correctAnswers,
    })),
  };
};

export const getProgramExperience = async (req, res) => {
  try {
    const context = await getProgramLearningContext({
      user: req.user,
      programId: req.params.programId,
      allowUnenrolled: true,
    });
    const assignment = await getCurrentProgramAssignment(context, {
      allowDraft: includeDrafts(req),
    });
    const materials = context.phase === "revision"
      ? await import("../services/programQuestionEngineService.js")
        .then(({ getRevisionMaterials }) => getRevisionMaterials({ context }))
      : [];
    const finalReport = ["final_assessment", "completed"].includes(context.phase)
      ? await buildFinalReport(context)
      : null;

    return res.json({
      success: true,
      experience: {
        ...buildContextPayload(context),
        assignment: await serializeAssignment(assignment),
        revisionMaterials: materials,
        finalReport,
      },
    });
  } catch (error) {
    return sendError(res, error, "Failed to load program learning experience.");
  }
};

export const getFinalProgramReport = async (req, res) => {
  try {
    const context = await getProgramLearningContext({
      user: req.user,
      programId: req.params.programId,
      allowUnenrolled: false,
    });
    const finalReport = await buildFinalReport(context);
    if (!finalReport) {
      const error = new Error("The final assessment has not been generated yet.");
      error.statusCode = 404;
      throw error;
    }
    return res.json({
      success: true,
      program: {
        id: context.program._id,
        name: context.program.name,
        programType: context.program.programType,
      },
      report: finalReport,
    });
  } catch (error) {
    return sendError(res, error, "Failed to load the final program report.");
  }
};

export const getProgramAssignment = async (req, res) => {
  try {
    const context = await getProgramLearningContext({
      user: req.user,
      programId: req.params.programId,
      allowUnenrolled: true,
    });
    let assignment = null;
    if (req.params.assignmentId) {
      assignment = await getOwnedAssignment({
        assignmentId: req.params.assignmentId,
        userId: req.user._id,
        programId: req.params.programId,
      });
      if (!assignment) {
        const error = new Error("Assignment not found.");
        error.statusCode = 404;
        throw error;
      }
    } else {
      assignment = await getCurrentProgramAssignment(context, {
        allowDraft: includeDrafts(req),
      });
    }

    return res.json({
      success: true,
      context: buildContextPayload(context),
      assignment: await serializeAssignment(assignment),
    });
  } catch (error) {
    return sendError(res, error, "Failed to load program assignment.");
  }
};

export const submitAssignmentAnswer = async (req, res) => {
  try {
    const assignment = await getOwnedAssignment({
      assignmentId: req.params.assignmentId,
      userId: req.user._id,
      programId: req.params.programId,
    });
    if (!assignment) {
      const error = new Error("Assignment not found.");
      error.statusCode = 404;
      throw error;
    }

    const result = await submitProgramAssignmentAnswer({
      assignment,
      user: req.user,
      answer: req.body || {},
    });

    return res.json({
      success: true,
      result: {
        questionId: result.item.questionId,
        correct: result.result.correct,
        score: result.result.score,
        accuracy: result.result.accuracy,
        correctAnswer: result.result.correctAnswer,
        summary: result.summary,
      },
      assignment: await serializeAssignment(result.assignment),
    });
  } catch (error) {
    return sendError(res, error, "Failed to submit program assignment answer.");
  }
};

export const submitReadinessAnswer = async (req, res) => {
  try {
    const context = await getProgramLearningContext({
      user: req.user,
      programId: req.params.programId,
      allowUnenrolled: true,
    });
    if (context.isEnrolled) {
      const error = new Error("This learner is already enrolled; readiness is only available before enrollment.");
      error.statusCode = 409;
      throw error;
    }
    const assignment = await getCurrentProgramAssignment(context, {
      allowDraft: includeDrafts(req),
    });
    if (!assignment) {
      const error = new Error("A readiness Blueprint is not configured for this program.");
      error.statusCode = 409;
      throw error;
    }
    await ensureReadinessLead({ context, assignment });
    const result = await submitProgramAssignmentAnswer({
      assignment,
      user: req.user,
      answer: req.body || {},
    });

    return res.json({
      success: true,
      readiness: {
        completed: result.summary.completed,
        score: result.summary.accuracy,
        accuracy: result.summary.accuracy,
        answered: result.summary.answered,
        total: result.summary.total,
        canEnroll: result.summary.completed,
      },
      result: {
        questionId: result.item.questionId,
        correct: result.result.correct,
        score: result.result.score,
        accuracy: result.result.accuracy,
        correctAnswer: result.result.correctAnswer,
      },
      assignment: await serializeAssignment(result.assignment),
    });
  } catch (error) {
    return sendError(res, error, "Failed to submit readiness answer.");
  }
};

export const getRevisionMaterials = async (req, res) => {
  try {
    const context = await getProgramLearningContext({
      user: req.user,
      programId: req.params.programId,
      allowUnenrolled: false,
    });
    const { getRevisionMaterials: getMaterials } = await import("../services/programQuestionEngineService.js");
    const materials = await getMaterials({
      context,
      limit: Math.min(20, Math.max(1, Number(req.query.limit || 8))),
    });
    return res.json({
      success: true,
      phase: context.phase,
      materials,
    });
  } catch (error) {
    return sendError(res, error, "Failed to load revision materials.");
  }
};

export const getAssignmentQuestion = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.assignmentId)) {
      const error = new Error("Invalid assignment ID.");
      error.statusCode = 400;
      throw error;
    }
    return getProgramAssignment(req, res);
  } catch (error) {
    return sendError(res, error, "Failed to load assignment question.");
  }
};
