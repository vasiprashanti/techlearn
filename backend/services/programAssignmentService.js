import mongoose from "mongoose";
import ProgramAssignment from "../models/ProgramAssignment.js";
import ProgramReadinessLead from "../models/ProgramReadinessLead.js";
import Submission from "../models/Submission.js";
import Question from "../models/Questions.js";
import { LANGUAGE_IDS, testCodeWithJudge0 } from "../utils/judgeUtil.js";
import { recordProgramPerformanceAttempt } from "./programPerformanceService.js";
import { syncProgramEnrollmentCompletion } from "./programCompletionService.js";
import { getProgramAssignmentQuestion } from "./programQuestionEngineService.js";

const MCQ_LABELS = ["A", "B", "C", "D"];

const normalizeMcqAnswer = (value) => {
  if (typeof value === "number" || /^\d+$/.test(String(value || ""))) {
    return MCQ_LABELS[Number(value)] || "";
  }
  return String(value || "").trim().toUpperCase();
};

const normalizeSql = (value) => String(value || "")
  .replace(/--.*$/gm, "")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .toLowerCase()
  .replace(/\s+/g, " ")
  .trim()
  .replace(/^;+|;+$/g, "")
  .trim();

const getQuestionTestCases = (question) => [
  ...(question?.content?.visibleTestCases || question?.visibleTestCases || []),
  ...(question?.content?.hiddenTestCases || question?.hiddenTestCases || []),
]
  .map((testCase) => ({
    input: String(testCase?.input || ""),
    output: String(testCase?.output ?? testCase?.expectedOutput ?? ""),
  }))
  .filter((testCase) => testCase.input.trim() || testCase.output.trim());

const isSqlQuestion = (question, item) => {
  const values = [
    item?.categoryType,
    question?.categoryType,
    question?.trackType,
    question?.categoryTitle,
    question?.categorySlug,
  ].map((value) => String(value || "").toLowerCase());
  return values.some((value) => value === "sql" || value.includes("sql"));
};

const evaluateCoding = async (question, code, language) => {
  const languageKey = String(language || "").trim().toLowerCase();
  const languageId = LANGUAGE_IDS[languageKey];
  if (!languageId) {
    const error = new Error("A supported coding language is required.");
    error.statusCode = 400;
    throw error;
  }
  if (!String(code || "").trim()) {
    const error = new Error("Code is required.");
    error.statusCode = 400;
    throw error;
  }

  const testCases = getQuestionTestCases(question);
  if (!testCases.length) {
    return { correct: true, score: 100, accuracy: 100, timeSpentMs: null, details: [] };
  }

  const details = [];
  let passed = 0;
  let timeSpentMs = 0;
  for (const testCase of testCases) {
    const result = await testCodeWithJudge0(
      String(code),
      languageId,
      testCase.input,
      testCase.output
    );
    const didPass = Boolean(result?.passed);
    if (didPass) passed += 1;
    timeSpentMs += Number(result?.executionTime || 0);
    details.push({
      passed: didPass,
      status: result?.statusDescription || result?.status || "Unknown",
      executionTime: Number(result?.executionTime || 0),
    });
  }

  const accuracy = Math.round((passed / testCases.length) * 100);
  return {
    correct: accuracy === 100,
    score: accuracy,
    accuracy,
    timeSpentMs,
    details,
  };
};

const evaluateAnswer = async ({ question, answer = {}, item }) => {
  const categoryType = String(item.categoryType || question.categoryType || "").toLowerCase();

  if (categoryType === "mcq") {
    const selectedAnswer = normalizeMcqAnswer(answer.selectedAnswer ?? answer.selectedOption);
    if (!MCQ_LABELS.includes(selectedAnswer)) {
      const error = new Error("selectedAnswer must be A, B, C, or D.");
      error.statusCode = 400;
      throw error;
    }
    const correctAnswer = normalizeMcqAnswer(question.content?.correctOption);
    if (!MCQ_LABELS.includes(correctAnswer)) {
      const error = new Error("This MCQ does not have a configured answer key.");
      error.statusCode = 409;
      throw error;
    }
    const correct = selectedAnswer === correctAnswer;
    return {
      selectedAnswer,
      correctAnswer,
      correct,
      score: correct ? 100 : 0,
      accuracy: correct ? 100 : 0,
      timeSpentMs: Number(answer.timeSpentMs) || null,
    };
  }

  if (categoryType === "notes") {
    return {
      correct: null,
      score: null,
      accuracy: null,
      timeSpentMs: Number(answer.timeSpentMs) || null,
    };
  }

  if (categoryType === "sql" || isSqlQuestion(question, item)) {
    const submitted = normalizeSql(answer.code || answer.answer);
    if (!submitted) {
      const error = new Error("SQL answer is required.");
      error.statusCode = 400;
      throw error;
    }
    const reference =
      question.solutionCode ||
      question.content?.referenceSolution?.javascript?.code ||
      question.content?.starterCode?.javascript?.code ||
      "";
    const correct = Boolean(reference) && submitted === normalizeSql(reference);
    return {
      code: String(answer.code || answer.answer),
      correct,
      score: correct ? 100 : 0,
      accuracy: correct ? 100 : 0,
      timeSpentMs: Number(answer.timeSpentMs) || null,
    };
  }

  return evaluateCoding(question, answer.code, answer.language);
};

const assignmentSummary = (assignment) => {
  const items = assignment.questions || [];
  const answered = items.filter((item) => item.attempted);
  const scored = answered.filter((item) => Number.isFinite(Number(item.accuracy)));
  const correct = answered.filter((item) => item.correct === true).length;
  const accuracy = scored.length
    ? Math.round(scored.reduce((sum, item) => sum + Number(item.accuracy), 0) / scored.length)
    : null;

  return {
    total: items.length,
    answered: answered.length,
    correct,
    accuracy,
    completed: items.length > 0 && answered.length === items.length,
  };
};

const updateReadinessLead = async (assignment, summary) => {
  if (!assignment.isLeadAssessment) return null;

  return ProgramReadinessLead.findOneAndUpdate(
    {
      userId: assignment.userId,
      programId: assignment.programId,
    },
    {
      $set: {
        assignmentId: assignment._id,
        status: summary.completed ? "Completed" : "Started",
        score: summary.accuracy,
        accuracy: summary.accuracy,
        completedAt: summary.completed ? new Date() : null,
      },
      $setOnInsert: {
        userId: assignment.userId,
        programId: assignment.programId,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const ensureReadinessLead = async ({ context, assignment }) => {
  if (!assignment?.isLeadAssessment) return null;

  return ProgramReadinessLead.findOneAndUpdate(
    {
      userId: assignment.userId,
      programId: assignment.programId,
    },
    {
      $set: {
        assignmentId: assignment._id,
        targetRole: context.profile.targetRole,
        targetCompanies: context.profile.targetCompanies,
        learningGoal: context.profile.learningGoal,
      },
      $setOnInsert: {
        userId: assignment.userId,
        programId: assignment.program._id,
        status: "Started",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const submitProgramAssignmentAnswer = async ({
  assignment,
  user,
  answer = {},
}) => {
  if (!assignment || !user?._id) {
    const error = new Error("Assignment and authenticated user are required.");
    error.statusCode = 400;
    throw error;
  }
  if (String(assignment.userId) !== String(user._id)) {
    const error = new Error("You do not own this assignment.");
    error.statusCode = 403;
    throw error;
  }
  if (["Completed", "Expired"].includes(assignment.status) && assignment.status === "Expired") {
    const error = new Error("This assignment is no longer available.");
    error.statusCode = 403;
    throw error;
  }

  const questionId = answer.questionId;
  if (!mongoose.Types.ObjectId.isValid(String(questionId))) {
    const error = new Error("A valid questionId is required.");
    error.statusCode = 400;
    throw error;
  }
  const item = await getProgramAssignmentQuestion({ assignment, questionId });
  if (!item) {
    const error = new Error("That question is not part of this assignment.");
    error.statusCode = 404;
    throw error;
  }

  const question = await Question.findById(questionId)
    .select("+content.correctOption +content.hiddenTestCases +content.referenceSolution")
    .lean();
  if (!question) {
    const error = new Error("Assigned question no longer exists.");
    error.statusCode = 404;
    throw error;
  }

  const result = await evaluateAnswer({ question, answer, item });
  const now = new Date();

  item.attempted = true;
  item.correct = typeof result.correct === "boolean" ? result.correct : null;
  item.score = result.score;
  item.accuracy = result.accuracy;
  item.timeSpentMs = result.timeSpentMs;
  item.attemptedAt = now;
  item.completedAt = now;
  assignment.status = "In Progress";

  const summaryBeforeSave = assignmentSummary(assignment);
  if (summaryBeforeSave.completed) {
    assignment.status = "Completed";
    assignment.completedAt = assignment.completedAt || now;
  }

  let submission = null;
  if (assignment.studentId) {
    submission = await Submission.findOneAndUpdate(
      {
        studentId: assignment.studentId,
        programAssignmentId: assignment._id,
        questionId: item.questionId,
      },
      {
        $set: {
          programId: assignment.programId,
          programPhase: assignment.phase,
          programDay: assignment.programDay,
          categoryId: item.categoryId || null,
          categoryType: item.categoryType || question.categoryType || null,
          status: result.correct === true ? "Passed" : result.correct === false ? "Failed" : "Pending",
          accuracyScore: result.accuracy,
          totalScore: result.score,
          timeSpent: result.timeSpentMs,
          submittedAt: now,
          endTime: now,
          attemptId: null,
          submissionType: "track_question",
        },
        $setOnInsert: {
          studentId: assignment.studentId,
          questionId: item.questionId,
          startTime: now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    item.submissionId = submission._id;
  }

  await assignment.save();
  const summary = assignmentSummary(assignment);
  await updateReadinessLead(assignment, summary);

  if (assignment.phase === "final_assessment" && summary.completed) {
    await syncProgramEnrollmentCompletion({
      programId: assignment.programId,
      userId: assignment.userId,
      studentId: assignment.studentId,
      now,
    });
  }

  if (assignment.studentId && Number(assignment.programDay) > 0) {
    try {
      await recordProgramPerformanceAttempt({
        programId: assignment.programId,
        studentId: assignment.studentId,
        userId: assignment.userId,
        programDay: assignment.programDay,
        source: "Program Assignment",
        sourceKey: "program-assignment:" + String(assignment._id) + ":" + String(item.questionId),
        sourceRecordId: submission?._id || assignment._id,
        taskType: item.categoryType || question.categoryType || "Unknown",
        questionId: item.questionId,
        question,
        attempted: true,
        correct: result.correct,
        score: result.score,
        accuracy: result.accuracy,
        timeSpentMs: result.timeSpentMs,
        attemptedAt: now,
      });
    } catch (performanceError) {
      console.error("Program assignment performance capture failed:", performanceError);
    }
  }

  return {
    assignment,
    item,
    result,
    summary,
  };
};

export { assignmentSummary };
