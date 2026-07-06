import mongoose from "mongoose";
import CodingRound from "../models/CodingRound.js";
import DailyChallengeAttempt from "../models/DailyChallengeAttempt.js";
import Student from "../models/Student.js";
import StudentCodingSubmission from "../models/StudentCodingSubmission.js";
import Submission from "../models/Submission.js";
import Question from "../models/Questions.js";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
} from "../utils/mcqCodingUtils.js";
import { testCodeWithJudge0, LANGUAGE_IDS } from "../utils/judgeUtil.js";
import {
  DAILY_CHALLENGE_RULES,
  ensureDailyChallengeAttempt,
  getAttemptTimeRemainingSeconds,
  getDailyChallengeAttempt,
  isAttemptExpired,
  resolveDailyChallengeContext,
  resolveDailyChallengeParticipant,
  startOfDay,
  upsertDailyChallengeRound,
} from "../utils/dailyChallengeUtils.js";
import { invalidateDashboardCache } from "./dashboardController.js";
import UserProgress from "../models/UserProgress.js";
import { calculateChallengeXP } from "../services/xpService.js";

const buildChallengeRateLimitKey = (req, includeAttempt = false) => {
  const email =
    req.body?.studentEmail ||
    req.body?.email ||
    req.query?.email ||
    req.user?.email ||
    req.user?._id?.toString() ||
    req.ip;

  const normalizedEmail = String(email || req.ip)
    .trim()
    .toLowerCase();
  const linkId = String(req.params?.linkId || "daily-challenge").trim().toLowerCase();
  const attemptId = includeAttempt ? String(req.body?.attemptId || "no-attempt").trim().toLowerCase() : "";

  return [normalizedEmail, linkId, attemptId].filter(Boolean).join(":");
};

const buildRateLimiter = (windowMs, max, message, keyGenerator) =>
  rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
  });

export const dailyChallengeOtpRateLimit = buildRateLimiter(
  60 * 1000,
  3,
  "Too many OTP requests. Please wait a minute before trying again.",
  (req) => buildChallengeRateLimitKey(req)
);

export const dailyChallengeAccessRateLimit = buildRateLimiter(
  10 * 1000,
  5,
  "Please wait a few seconds before retrying this Daily Challenge action.",
  (req) => buildChallengeRateLimitKey(req)
);

export const codingRateLimit = rateLimit({
  windowMs: 10 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Please wait a few seconds before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => buildChallengeRateLimitKey(req, true),
});

// Helper function to convert IST to UTC
const convertISTToUTC = (istDateString) => {
  // Create date by explicitly treating the input as IST
  // Add IST timezone offset (+05:30) to the string
  const istWithTimezone = istDateString + "+05:30";
  const utcDate = new Date(istWithTimezone);

  return utcDate;
};

const buildDailyChallengeOutcome = async ({ codingRound, submission, attempt, totalProblems, correctSolutions }) => {
  if (codingRound.challengeType !== "daily_challenge") {
    return {};
  }

  const completedRounds = await StudentCodingSubmission.find({
    studentEmail: submission.studentEmail,
    isRoundEnded: true,
  })
    .populate({
      path: "codingRoundId",
      select: "challengeType date",
      match: { challengeType: "daily_challenge" },
    })
    .lean();

  const distinctDates = [...new Set(
    completedRounds
      .filter((item) => item.codingRoundId?.date)
      .map((item) => startOfDay(item.codingRoundId.date).toISOString())
  )].sort();

  let streak = 0;
  if (distinctDates.length > 0) {
    streak = 1;
    for (let index = distinctDates.length - 1; index > 0; index -= 1) {
      const current = new Date(distinctDates[index]);
      const previous = new Date(distinctDates[index - 1]);
      const diffDays = Math.round((current.getTime() - previous.getTime()) / (24 * 60 * 60 * 1000));
      if (diffDays === 1) {
        streak += 1;
      } else {
        break;
      }
    }
  }

  const startedAt = attempt?.startedAt || submission.submittedAt || submission.createdAt || new Date();
  const endedAt = attempt?.endedAt || submission.roundEndedAt || new Date();
  const timeTakenSeconds = Math.max(0, Math.round((endedAt.getTime() - new Date(startedAt).getTime()) / 1000));
  let calculatedXpGained = 0;
  let totalMarks = 0;
  let maxMarksPossible = 0;
  if (codingRound && codingRound.problems) {
    for (let i = 0; i < codingRound.problems.length; i++) {
      const problem = codingRound.problems[i];
      const score = submission.problemScores ? (submission.problemScores.get(i.toString()) || 0) : 0;
      const baseXP = calculateChallengeXP({
        difficulty: problem.difficulty || "Easy",
        hintsUsed: 0,
        withinWindow: false,
        firstAttempt: true,
      });
      calculatedXpGained += Math.round((score / 100) * baseXP);

      const qType = String(problem.categoryType || "").toLowerCase();
      const difficulty = problem.difficulty || "Easy";
      let maxMarks = 10;
      if (qType === "mcq" || qType === "aptitude") {
        maxMarks = 1;
      } else {
        if (difficulty === "Easy") maxMarks = 10;
        else if (difficulty === "Medium") maxMarks = 20;
        else if (difficulty === "Hard") maxMarks = 30;
      }
      maxMarksPossible += maxMarks;
      totalMarks += maxMarks * (score / 100);
    }
  }

  const xpGained = calculatedXpGained;
  const problemScores = Array.from(submission.problemScores?.values?.() || []).map((score) => Number(score || 0));
  const actualCorrect = codingRound.problems.filter((problem, index) => {
    const score = submission.problemScores ? (submission.problemScores.get(index.toString()) || 0) : 0;
    return score >= 100;
  }).length;
  const allSubmittedProblemsPassed = actualCorrect === codingRound.problems.length;

  return {
    challengeMetrics: {
      xpGained,
      streak,
      timeTakenSeconds,
      timeTakenMinutes: Number((timeTakenSeconds / 60).toFixed(1)),
      accuracy: maxMarksPossible > 0 ? Math.round((totalMarks / maxMarksPossible) * 100) : 0,
      score: `${Number(totalMarks.toFixed(1))}/${maxMarksPossible}`,
      evaluationStatus: submission.autoEnded
        ? "Timeout"
        : submission.isRoundEnded
          ? allSubmittedProblemsPassed
            ? "Passed"
            : actualCorrect > 0
              ? "PartialPass"
              : "Failed"
          : "Pending",
      correctSolutions: actualCorrect,
      totalProblems,
    },
  };
};

const refreshCurrentDailyChallengeRound = async ({ codingRound, user, email }) => {
  if (codingRound?.challengeType !== "daily_challenge") return codingRound;

  const context = await resolveDailyChallengeContext({
    user,
    email,
    trackType: codingRound.trackType,
  });

  return upsertDailyChallengeRound(context);
};

const buildAttemptPayload = (attempt) => ({
  id: attempt._id,
  status: attempt.status,
  startedAt: attempt.startedAt,
  expiresAt: attempt.expiresAt,
  secondsRemaining: getAttemptTimeRemainingSeconds(attempt),
});

const upsertChallengeSubmissionRecord = async ({ codingRound, student, attempt, submission }) => {
  if (codingRound.challengeType !== "daily_challenge" || !student?._id) {
    return null;
  }

  let totalMarks = 0;
  let totalXP = 0;
  
  if (codingRound && codingRound.problems) {
    codingRound.problems.forEach((problem, index) => {
      const accuracy = submission.problemScores ? (submission.problemScores.get(index.toString()) || 0) : 0;
      const qType = String(problem.categoryType || "").toLowerCase();
      const difficulty = problem.difficulty || "Easy";
      
      let maxMarks = 10;
      if (qType === "mcq" || qType === "aptitude") {
        maxMarks = 1;
      } else {
        if (difficulty === "Easy") maxMarks = 10;
        else if (difficulty === "Medium") maxMarks = 20;
        else if (difficulty === "Hard") maxMarks = 30;
      }
      
      const marks = maxMarks * (accuracy / 100);
      totalMarks += marks;
      
      const baseXP = calculateChallengeXP({ difficulty, accuracy: 100 });
      const xp = baseXP * (accuracy / 100);
      totalXP += xp;
    });
  }

  const finalTotalScore = Number(totalMarks.toFixed(2));
  const finalXpEarned = Math.max(0, Math.round(totalXP));

  const problemScores = Array.from(submission.problemScores?.values?.() || []).map((score) => Number(score || 0));
  const allSubmittedProblemsPassed = problemScores.length > 0 && problemScores.every((score) => score >= 100);
  const allTestCaseDetails = Array.from(submission.problemTestCaseResults?.entries?.() || [])
    .flatMap(([problemIndex, results = []]) =>
      (results || []).map((result) => ({
        ...result,
        problemIndex: Number(problemIndex),
      }))
    );
  const passedTestCases = allTestCaseDetails.filter((result) => result.passed).length;
  const totalTestCases = allTestCaseDetails.length;
  const hasSubmittedProblems = problemScores.length > 0;
  const nextStatus =
    submission.autoEnded
      ? "Timeout"
      : allSubmittedProblemsPassed
        ? "Passed"
        : finalTotalScore > 0
          ? "PartialPass"
          : hasSubmittedProblems
            ? "Failed"
            : "Pending";

  return Submission.findOneAndUpdate(
    { attemptId: attempt._id },
    {
      $set: {
        studentId: student._id,
        batchId: attempt.batchId,
        trackId: attempt.trackId,
        questionId: attempt.questionId,
        codingRoundId: codingRound._id,
        attemptId: attempt._id,
        challengeType: "daily_challenge",
        workingDay: codingRound.dayNumber,
        runCount: Array.from(submission.problemRuns?.values?.() || []).reduce((sum, value) => sum + Number(value || 0), 0),
        accuracyScore: finalTotalScore,
        totalScore: finalTotalScore,
        xpEarned: finalXpEarned,
        status: nextStatus,
        submittedAt: submission.roundEndedAt || submission.lastSubmissionAt || new Date(),
        executionTime: 0,
        submittedCode: attempt.finalCode || null,
        language: attempt.finalLanguage || null,
        submissionType: "daily_challenge",
        finalSubmissionResults: totalTestCases > 0 ? {
          passedTestCases,
          totalTestCases,
          testCaseDetails: allTestCaseDetails,
          compileOutput: null,
          runtimeError: null,
          evaluatedAt: submission.roundEndedAt || submission.lastSubmissionAt || new Date(),
        } : null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const updateStudentChallengeStats = async ({ student, submission }) => {
  if (!student?._id) return;

  const currentTestsTaken = Number(student.testsTaken || 0);
  await Student.findByIdAndUpdate(student._id, {
    $set: {
      streak: Number(student.streak || 0),
      longestStreak: Math.max(Number(student.longestStreak || 0), Number(student.streak || 0)),
      lastActiveAt: submission.roundEndedAt || submission.lastSubmissionAt || new Date(),
      testsTaken: currentTestsTaken + 1,
    },
  });
  invalidateDashboardCache(student.userId);
};

const finalizeDailyChallengeAttempt = async ({
  codingRound,
  student,
  attempt,
  submission,
  finalStatus,
  autoEnded = false,
  latestSolution = null,
}) => {
  if (!attempt) return { attempt: null, linkedSubmission: null };

  attempt.status = finalStatus;
  attempt.submittedAt = attempt.submittedAt || submission.lastSubmissionAt || new Date();
  attempt.endedAt = attempt.endedAt || new Date();
  attempt.lastActiveAt = new Date();
  if (latestSolution?.language) {
    attempt.finalLanguage = latestSolution.language;
  }
  if (latestSolution?.submittedCode) {
    attempt.finalCode = latestSolution.submittedCode;
  }

  submission.studentId = submission.studentId || student?._id || null;
  submission.batchId = submission.batchId || attempt.batchId;
  submission.trackId = submission.trackId || attempt.trackId;
  submission.questionId = submission.questionId || attempt.questionId;
  submission.attemptId = submission.attemptId || attempt._id;
  submission.isRoundEnded = true;
  submission.autoEnded = autoEnded;
  submission.roundEndedAt = submission.roundEndedAt || new Date();
  submission.lastSubmissionAt = submission.lastSubmissionAt || new Date();
  await submission.save();

  attempt.codingSubmissionId = submission._id;
  const linkedSubmission = await upsertChallengeSubmissionRecord({
    codingRound,
    student,
    attempt,
    submission,
  });
  attempt.finalSubmissionId = linkedSubmission?._id || attempt.finalSubmissionId;
  await attempt.save();

  // Award XP for each question/problem
  try {
    let totalChallengeXpAwarded = 0;
    if (codingRound && codingRound.problems) {
      for (let i = 0; i < codingRound.problems.length; i++) {
        const problem = codingRound.problems[i];
        const score = submission.problemScores ? (submission.problemScores.get(i.toString()) || 0) : 0;
        const baseXP = calculateChallengeXP({
          difficulty: problem.difficulty || "Easy",
          hintsUsed: 0,
          withinWindow: false,
          firstAttempt: true,
        });
        const earnedXP = Math.round((score / 100) * baseXP);
        totalChallengeXpAwarded += earnedXP;
      }
    }

    if (totalChallengeXpAwarded > 0 && student?.userId) {
      let progress = await UserProgress.findOne({ userId: student.userId });
      if (!progress) {
        progress = new UserProgress({
          userId: student.userId,
          courseXP: new Map(),
          exerciseXP: new Map(),
          completedExercises: [],
        });
      }
      const courseIdKey = String(codingRound.trackId || "daily_challenge");
      const currentXP = progress.exerciseXP.get(courseIdKey) || 0;
      progress.exerciseXP.set(courseIdKey, currentXP + totalChallengeXpAwarded);
      await progress.save();
      invalidateDashboardCache(student.userId);
    }
  } catch (xpError) {
    console.error("Error awarding Daily Challenge XP:", xpError);
  }

  await updateStudentChallengeStats({ student, submission });

  return { attempt, linkedSubmission };
};

// Create a new coding round
export const createCodingRound = async (req, res) => {
  try {
    const { title, college, date, duration, problems, endTime } = req.body;

    // Validate required fields
    if (
      !title ||
      !college ||
      !date ||
      !duration ||
      !problems ||
      problems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and problems array cannot be empty",
      });
    }

    // Validate problems format
    for (const problem of problems) {
      if (
        !problem.problemTitle ||
        !problem.description ||
        !problem.difficulty ||
        !problem.inputDescription ||
        !problem.outputDescription ||
        !problem.visibleTestCases ||
        !Array.isArray(problem.visibleTestCases) ||
        problem.visibleTestCases.length === 0 ||
        !problem.hiddenTestCases ||
        !Array.isArray(problem.hiddenTestCases) ||
        problem.hiddenTestCases.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each problem must have problemTitle, description, difficulty, inputDescription, outputDescription, visibleTestCases, and hiddenTestCases",
        });
      }

      // Validate visible test cases
      for (const testCase of problem.visibleTestCases) {
        if (
          typeof testCase.input !== "string" ||
          typeof testCase.expectedOutput !== "string"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each visible test case must have input and expectedOutput as strings",
          });
        }
      }

      // Validate hidden test cases
      for (const testCase of problem.hiddenTestCases) {
        if (
          typeof testCase.input !== "string" ||
          typeof testCase.expectedOutput !== "string"
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each hidden test case must have input and expectedOutput as strings",
          });
        }
      }
    }

    // Convert IST to UTC for storage
    const linkId = crypto.randomBytes(8).toString("hex");
    const codingDate = convertISTToUTC(date);

    const codingRound = new CodingRound({
      title,
      college,
      date: codingDate,
      duration,
      problems,
      linkId,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    await codingRound.save();

    res.status(201).json({
      success: true,
      message: "Coding round created successfully",
      data: {
        id: codingRound._id,
        title: codingRound.title,
        college: codingRound.college,
        date: codingRound.date,
        duration: codingRound.duration,
        endTime: codingRound.endTime,
        linkId: codingRound.linkId,
        accessLink: `${process.env.FRONTEND_URL}/coding/${codingRound.linkId}`,
      },
    });
  } catch (error) {
    console.error("Error creating coding round:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create coding round",
      error: error.message,
    });
  }
};

// Get all coding rounds
export const getAllCodingRounds = async (req, res) => {
  try {
    const codingRounds = await CodingRound.find()
      .select(
        "title college date duration endTime totalAttempts isActive linkId createdAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: codingRounds,
    });
  } catch (error) {
    console.error("Error fetching all coding rounds:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get a single coding round by linkId
export const getOneCodingRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res
        .status(404)
        .json({ success: false, message: "Coding round not found" });
    }
    res.status(200).json({ success: true, data: codingRound });
  } catch (error) {
    console.error("Error fetching coding round:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Send OTP for coding round access
export const sendCodingRoundOTP = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { email } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    

    let existingAttempt = null;
    if (codingRound.challengeType === "daily_challenge") {
      await resolveDailyChallengeParticipant({
        codingRound,
        user: req.user,
        email: normalizedEmail,
      });
      existingAttempt = await getDailyChallengeAttempt({
        codingRoundId: codingRound._id,
        studentEmail: normalizedEmail,
      });
    }

    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: normalizedEmail,
    });

    if (existingSubmission?.isRoundEnded || ["ended", "auto_submitted", "expired"].includes(existingAttempt?.status)) {
      return res.status(403).json({
        success: false,
        message:
          "You have already ended this coding round and cannot access it again",
        alreadyEnded: true,
        finalScore: existingSubmission?.totalScore || 0,
        endedAt: existingSubmission?.roundEndedAt || existingAttempt?.endedAt || null,
      });
    }

    if (existingSubmission && codingRound.challengeType !== "daily_challenge") {
      let message = "You have already attempted this coding round";

      if (existingSubmission.totalScore > 0) {
        message =
          "You have already submitted your solution for this coding round";
      } else {
        message =
          "You have already accessed this coding round and cannot restart";
      }

      return res.status(400).json({
        success: false,
        message,
        alreadyAttempted: true,
        finalScore: existingSubmission.totalScore || 0,
        roundEnded: existingSubmission.isRoundEnded || false,
      });
    }

    const otp = generateOTP();
    await storeOTP(`${linkId}:${normalizedEmail}`, otp);
    await sendOTPEmail(
      normalizedEmail,
      otp,
      codingRound.challengeType === "daily_challenge" ? "Daily Challenge" : "Coding Round"
    );

    res.json({
      success: true,
      message: "OTP sent to email",
      ...(process.env.NODE_ENV === "development" ? { debugOtp: otp } : {}),
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("Error sending OTP for Coding Round:", error);
    }
    res.status(statusCode).json({ success: false, message: error.message || "Failed to send OTP" });
  }
};

// Verify OTP and get coding round access
export const verifyOTPAndGetCodingRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { email, otp } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    let codingRound = await CodingRound.findOne({ linkId }).populate("questionId");
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    if (codingRound.challengeType === "daily_challenge") {
      codingRound = await refreshCurrentDailyChallengeRound({
        codingRound,
        user: req.user,
        email: normalizedEmail,
      });
    }

    let participant = null;
    let existingAttempt = null;
    if (codingRound.challengeType === "daily_challenge") {
      participant = await resolveDailyChallengeParticipant({
        codingRound,
        user: req.user,
        email: normalizedEmail,
      });
      existingAttempt = await getDailyChallengeAttempt({
        codingRoundId: codingRound._id,
        studentEmail: normalizedEmail,
      });
    }

    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: normalizedEmail,
    });

    if (existingSubmission?.isRoundEnded || ["ended", "auto_submitted", "expired"].includes(existingAttempt?.status)) {
      return res.status(403).json({
        success: false,
        message:
          "You have already ended this coding round and cannot access it again",
        alreadyEnded: true,
        finalScore: existingSubmission?.totalScore || 0,
        endedAt: existingSubmission?.roundEndedAt || existingAttempt?.endedAt || null,
      });
    }

    if (existingSubmission && codingRound.challengeType !== "daily_challenge") {
      return res.status(400).json({
        success: false,
        message: "You have already accessed this coding round",
        alreadyAttempted: true,
      });
    }
    const isLoggedInStudentForEmail =
      codingRound.challengeType === "daily_challenge" &&
      req.user?.email &&
      String(req.user.email).trim().toLowerCase() === normalizedEmail;
    const alreadyVerifiedAttempt =
      codingRound.challengeType === "daily_challenge" &&
      existingAttempt &&
      ["otp_verified", "started"].includes(existingAttempt.status);

    const valid = isLoggedInStudentForEmail ||
      alreadyVerifiedAttempt ||
      (await verifyOTP(`${linkId}:${normalizedEmail}`, otp));
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a fresh OTP and try again.",
      });
    }

    let submission = existingSubmission;
    if (!submission) {
      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentId: participant?.student?._id || null,
        batchId: codingRound.batchId || null,
        trackId: codingRound.trackId || null,
        questionId: codingRound.questionId || null,
        studentEmail: normalizedEmail,
        problemScores: new Map(),
        totalScore: 0,
        isRoundEnded: false,
        submittedAt: new Date(),
        lastSubmissionAt: new Date(),
      });
    }

    await submission.save();

    let responseAttempt = null;
    if (codingRound.challengeType === "daily_challenge") {
      responseAttempt = await ensureDailyChallengeAttempt({
        codingRound,
        student: participant.student,
        studentEmail: participant.studentEmail,
        accessSource: participant.accessSource,
        markOtpVerified: true,
      });
      submission.attemptId = responseAttempt._id;
      await submission.save();
    }

    res.json({
      success: true,
      codingRound,
      attempt: responseAttempt ? buildAttemptPayload(responseAttempt) : null,
      message: "Access granted. You can now attempt the coding round.",
      note: "This is your only attempt. Make sure to complete it before the time limit.",
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("Error verifying OTP for Coding Round:", error);
    }
    res.status(statusCode).json({ success: false, message: error.message || "Failed to verify OTP" });
  }
};

export const startDailyChallengeAttempt = async (req, res) => {
  try {
    const { linkId } = req.params;
    const normalizedEmail = String(req.body?.email || req.body?.studentEmail || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Student email is required to start the Daily Challenge.",
      });
    }

    let codingRound = await CodingRound.findOne({
      linkId,
      challengeType: "daily_challenge",
      isActive: true,
    }).populate("questionId");

    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Daily Challenge not found.",
      });
    }

    codingRound = await refreshCurrentDailyChallengeRound({
      codingRound,
      user: req.user,
      email: normalizedEmail,
    });

    const participant = await resolveDailyChallengeParticipant({
      codingRound,
      user: req.user,
      email: normalizedEmail,
    });

    

    let attempt = await getDailyChallengeAttempt({
      codingRoundId: codingRound._id,
      studentEmail: normalizedEmail,
    });

    if (attempt?.status && ["ended", "auto_submitted", "expired"].includes(attempt.status)) {
      return res.status(403).json({
        success: false,
        message: "This Daily Challenge attempt has already ended.",
      });
    }

    if (attempt && isAttemptExpired(attempt)) {
      attempt.status = "expired";
      attempt.endedAt = attempt.endedAt || new Date();
      attempt.lastActiveAt = new Date();
      await attempt.save();
      return res.status(403).json({
        success: false,
        message: "Time is up for this Daily Challenge attempt.",
        expired: true,
      });
    }

    attempt = await ensureDailyChallengeAttempt({
      codingRound,
      student: participant.student,
      studentEmail: participant.studentEmail,
      accessSource: participant.accessSource,
      markOtpVerified: true,
      startAttempt: true,
    });

    const submission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: normalizedEmail,
    }).lean();

    return res.status(200).json({
      success: true,
      message: attempt.startedAt ? "Daily Challenge session ready." : "Daily Challenge started.",
      data: {
        attempt: buildAttemptPayload(attempt),
        codingRound,
        instructions: DAILY_CHALLENGE_RULES,
        savedAnswers: submission ? {
          problemCodes: submission.problemCodes instanceof Map ? Object.fromEntries(submission.problemCodes) : (submission.problemCodes || {}),
          problemLanguages: submission.problemLanguages instanceof Map ? Object.fromEntries(submission.problemLanguages) : (submission.problemLanguages || {}),
          problemSubmitted: submission.problemSubmitted instanceof Map ? Object.fromEntries(submission.problemSubmitted) : (submission.problemSubmitted || {}),
        } : null,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("startDailyChallengeAttempt error:", error);
    }
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to start Daily Challenge attempt.",
    });
  }
};

// Submit coding round answers (hidden test cases) - validates and updates score only
export const submitCodingRoundAnswers = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { studentEmail, solutions, attemptId } = req.body;
    const normalizedEmail = String(studentEmail || "").trim().toLowerCase();

    if (!normalizedEmail || !solutions || !Array.isArray(solutions)) {
      return res.status(400).json({
        success: false,
        message: "Student email and solutions are required",
      });
    }

    if (solutions.length !== 1) {
      return res.status(400).json({
        success: false,
        message: "Please submit one problem at a time",
      });
    }

    const solution = solutions[0];
    const { problemIndex, language, submittedCode } = solution;

    if (problemIndex === undefined || !language || !submittedCode) {
      return res.status(400).json({
        success: false,
        message: "Problem index, language, and submitted code are required",
      });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    const problem = codingRound.problems[problemIndex];
    if (!problem) {
      return res.status(400).json({
        success: false,
        message: `Problem at index ${problemIndex} not found`,
      });
    }

    const languageId = LANGUAGE_IDS[language?.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`,
      });
    }

    let participant = null;
    let challengeAttempt = null;
    if (codingRound.challengeType === "daily_challenge") {
      participant = await resolveDailyChallengeParticipant({
        codingRound,
        user: req.user,
        email: normalizedEmail,
      });

      challengeAttempt = await getDailyChallengeAttempt({
        codingRoundId: codingRound._id,
        studentEmail: normalizedEmail,
      });

      if (!challengeAttempt || (attemptId && String(challengeAttempt._id) !== String(attemptId))) {
        return res.status(403).json({
          success: false,
          message: "A valid Daily Challenge attempt is required before submitting.",
        });
      }

      if (!challengeAttempt.startedAt) {
        return res.status(403).json({
          success: false,
          message: "Start the Daily Challenge before submitting solutions.",
        });
      }

      if (["ended", "auto_submitted", "expired"].includes(challengeAttempt.status)) {
        return res.status(403).json({
          success: false,
          message: "This Daily Challenge attempt has already ended.",
        });
      }

      if (isAttemptExpired(challengeAttempt)) {
        challengeAttempt.status = "expired";
        challengeAttempt.endedAt = challengeAttempt.endedAt || new Date();
        await challengeAttempt.save();
        return res.status(403).json({
          success: false,
          message: "Time is up for this Daily Challenge attempt.",
          expired: true,
        });
      }
    }

    let submission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: normalizedEmail,
    });

    if (submission?.isRoundEnded) {
      return res.status(403).json({
        success: false,
        message:
          "You have already ended this coding round and cannot submit solutions",
        alreadyEnded: true,
        finalScore: submission.totalScore,
        endedAt: submission.roundEndedAt,
      });
    }

    if (submission?.problemSubmitted && submission.problemSubmitted.get(problemIndex.toString())) {
      return res.status(403).json({
        success: false,
        message: "You have already submitted a solution for this problem. Max 1 submission allowed.",
        alreadySubmitted: true
      });
    }

    let testsPassed = 0;
    let testsFailed = 0;
    let totalTests = 0;
    const testCaseDetails = [];

    let targetQuestionId = problem.questionId;
    if (!targetQuestionId && codingRound.challengeType === "daily_challenge") {
      const TrackTemplate = mongoose.model("TrackTemplate");
      const template = await TrackTemplate.findById(codingRound.trackId).lean();
      if (template) {
        const totalTemplateDays = template.totalDays || template.dayAssignments?.length || 1;
        const lookupDay = ((codingRound.dayNumber - 1) % totalTemplateDays) + 1;
        const dayAssignment = template.dayAssignments?.find((d) => Number(d.dayNumber) === Number(lookupDay));
        if (dayAssignment) {
          const tasks = dayAssignment.tasks || [];
          if (tasks.length > 0) {
            targetQuestionId = tasks[problemIndex]?.questionId;
          } else if (dayAssignment.questionId && problemIndex === 0) {
            targetQuestionId = dayAssignment.questionId;
          }
        }
      }
    }

    const question = await Question.findById(targetQuestionId || codingRound.questionId).select("+content.correctOption").lean();
    const isMcq = String(question?.categoryType || "").toUpperCase() === "MCQ" || String(question?.categoryType || "").toUpperCase() === "APTITUDE";

    if (isMcq) {
      totalTests = 1;
      const MCQ_LABELS = ["A", "B", "C", "D"];
      const normalizeMcqAns = (val) => {
        if (typeof val === "number" || /^\d+$/.test(String(val || ""))) {
          return MCQ_LABELS[Number(val)] || "";
        }
        return String(val || "").trim().toUpperCase();
      };

      const studentAns = normalizeMcqAns(submittedCode);
      const correctAns = normalizeMcqAns(question?.content?.correctOption);
      if (studentAns && correctAns && studentAns === correctAns) {
        testsPassed = 1;
      } else {
        testsFailed = 1;
      }
    } else {
      const allTestCases = [
        ...(problem.visibleTestCases || []).map((testCase, index) => ({ ...testCase, visible: true, index })),
        ...(problem.hiddenTestCases || []).map((testCase, index) => ({
          ...testCase,
          visible: false,
          index: (problem.visibleTestCases || []).length + index,
        })),
      ];
      totalTests = allTestCases.length;

      for (let i = 0; i < totalTests; i++) {
        const testCase = allTestCases[i];

        try {
          const testResult = await testCodeWithJudge0(
            submittedCode,
            languageId,
            testCase.input,
            testCase.expectedOutput
          );

          const passed = testResult.success && testResult.outputMatches;
          if (passed) {
            testsPassed++;
          } else {
            testsFailed++;
          }
          testCaseDetails.push({
            index: testCase.index,
            visible: testCase.visible,
            passed,
            expectedOutput: testCase.expectedOutput || "",
            actualOutput: passed ? undefined : (testResult.actualOutput || testResult.output || ""),
            status: testResult.statusDescription || "",
            executionTime: Number(testResult.executionTime || 0),
          });
        } catch (error) {
          testsFailed++;
          testCaseDetails.push({
            index: testCase.index,
            visible: testCase.visible,
            passed: false,
            expectedOutput: testCase.expectedOutput || "",
            actualOutput: "",
            status: error?.message || "Execution Error",
            executionTime: 0,
          });
        }
      }
    }

    const accuracy = totalTests > 0 ? Math.round((testsPassed / totalTests) * 100) : 0;
    const problemScore = accuracy;
    const isCorrect = testsPassed === totalTests;

    if (!submission) {
      const problemScores = new Map();
      problemScores.set(problemIndex.toString(), problemScore);

      const problemSubmitted = new Map();
      problemSubmitted.set(problemIndex.toString(), true);
      const problemTestCaseResults = new Map();
      problemTestCaseResults.set(problemIndex.toString(), testCaseDetails);
      const problemCodes = new Map();
      problemCodes.set(problemIndex.toString(), submittedCode);
      const problemLanguages = new Map();
      problemLanguages.set(problemIndex.toString(), language);

      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentId: participant?.student?._id || null,
        batchId: challengeAttempt?.batchId || codingRound.batchId || null,
        trackId: challengeAttempt?.trackId || codingRound.trackId || null,
        questionId: codingRound.questionId || null,
        attemptId: challengeAttempt?._id || null,
        studentEmail: normalizedEmail,
        problemScores,
        problemSubmitted,
        problemTestCaseResults,
        problemCodes,
        problemLanguages,
        totalScore: problemScore,
        lastSubmissionAt: new Date(),
      });
    } else {
      if (!submission.problemSubmitted) submission.problemSubmitted = new Map();
      if (!submission.problemTestCaseResults) submission.problemTestCaseResults = new Map();
      if (!submission.problemCodes) submission.problemCodes = new Map();
      if (!submission.problemLanguages) submission.problemLanguages = new Map();

      submission.problemSubmitted.set(problemIndex.toString(), true);
      submission.problemScores.set(problemIndex.toString(), problemScore);
      submission.problemTestCaseResults.set(problemIndex.toString(), testCaseDetails);
      submission.problemCodes.set(problemIndex.toString(), submittedCode);
      submission.problemLanguages.set(problemIndex.toString(), language);

      submission.studentId = submission.studentId || participant?.student?._id || null;
      submission.batchId = submission.batchId || challengeAttempt?.batchId || codingRound.batchId || null;
      submission.trackId = submission.trackId || challengeAttempt?.trackId || codingRound.trackId || null;
      submission.questionId = submission.questionId || codingRound.questionId || null;
      submission.attemptId = submission.attemptId || challengeAttempt?._id || null;

      let totalScore = 0;
      for (const score of submission.problemScores.values()) {
        totalScore += score;
      }
      submission.totalScore = totalScore;
      submission.lastSubmissionAt = new Date();
    }

    await submission.save();

    if (challengeAttempt) {
      if (codingRound.challengeType !== "daily_challenge") {
        challengeAttempt.status = "submitted";
        challengeAttempt.submittedAt = new Date();
      }
      challengeAttempt.lastActiveAt = new Date();
      challengeAttempt.finalLanguage = language;
      challengeAttempt.finalCode = submittedCode;
      challengeAttempt.codingSubmissionId = submission._id;
      await challengeAttempt.save();

      const linkedSubmission = await upsertChallengeSubmissionRecord({
        codingRound,
        student: participant?.student,
        attempt: challengeAttempt,
        submission,
      });

      if (linkedSubmission?._id) {
        challengeAttempt.finalSubmissionId = linkedSubmission._id;
        await challengeAttempt.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Solution submitted and evaluated successfully",
      data: {
        submissionId: submission._id,
        problemIndex,
        problemScore,
        accuracy,
        isCorrect,
        currentTotalScore: submission.totalScore,
        testsPassed,
        failedTestCases: testsFailed,
        totalTestCases: totalTests,
        evaluationStatus: isCorrect ? "Passed" : (testsPassed > 0 ? "PartialPass" : "Failed"),
        testCaseResults: testCaseDetails,
        feedback: isCorrect
          ? "Perfect! All test cases passed."
          : `Partial Correctness! Score: ${problemScore}. Failed: ${testsFailed}/${totalTests} test cases.`,
        submittedAt: new Date(),
        attempt: challengeAttempt ? buildAttemptPayload(challengeAttempt) : null,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("Error submitting coding round answers:", error);
    }
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to submit solution",
    });
  }
};

// Update a coding round by codingRoundId
export const updateCodingRound = async (req, res) => {
  try {
    const { codingRoundId } = req.params;
    const { title, college, date, duration, problems, isActive, endTime } =
      req.body;

    // Validate coding round ID
    if (!codingRoundId || !codingRoundId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coding round ID",
      });
    }

    // Check if coding round exists
    const existingCodingRound = await CodingRound.findById(codingRoundId);
    if (!existingCodingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    // Validate problems format if provided
    if (problems && problems.length > 0) {
      for (const problem of problems) {
        if (
          !problem.problemTitle ||
          !problem.description ||
          !problem.difficulty ||
          !problem.inputDescription ||
          !problem.outputDescription ||
          !problem.visibleTestCases ||
          !Array.isArray(problem.visibleTestCases) ||
          problem.visibleTestCases.length === 0 ||
          !problem.hiddenTestCases ||
          !Array.isArray(problem.hiddenTestCases) ||
          problem.hiddenTestCases.length === 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Each problem must have problemTitle, description, difficulty, inputDescription, outputDescription, visibleTestCases, and hiddenTestCases",
          });
        }

        // Validate visible test cases
        for (const testCase of problem.visibleTestCases) {
          if (
            typeof testCase.input !== "string" ||
            typeof testCase.expectedOutput !== "string"
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Each visible test case must have input and expectedOutput as strings",
            });
          }
        }

        // Validate hidden test cases
        for (const testCase of problem.hiddenTestCases) {
          if (
            typeof testCase.input !== "string" ||
            typeof testCase.expectedOutput !== "string"
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Each hidden test case must have input and expectedOutput as strings",
            });
          }
        }
      }
    }

    // Prepare update data with IST to UTC conversion
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (college !== undefined) updateData.college = college;
    if (date !== undefined) updateData.date = convertISTToUTC(date);
    if (duration !== undefined) updateData.duration = duration;
    if (problems !== undefined) updateData.problems = problems;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (endTime !== undefined)
      updateData.endTime = endTime ? new Date(endTime) : null;

    // Update the coding round
    const updatedCodingRound = await CodingRound.findByIdAndUpdate(
      codingRoundId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Coding round updated successfully",
      data: {
        id: updatedCodingRound._id,
        title: updatedCodingRound.title,
        college: updatedCodingRound.college,
        date: updatedCodingRound.date,
        duration: updatedCodingRound.duration,
        endTime: updatedCodingRound.endTime,
        problems: updatedCodingRound.problems,
        isActive: updatedCodingRound.isActive,
        linkId: updatedCodingRound.linkId,
        totalAttempts: updatedCodingRound.totalAttempts,
        accessLink: `${process.env.FRONTEND_URL}/coding/${updatedCodingRound.linkId}`,
      },
    });
  } catch (error) {
    console.error("Error updating coding round:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update coding round",
      error: error.message,
    });
  }
};

// Delete a coding round by codingRoundId
export const deleteCodingRound = async (req, res) => {
  try {
    const { codingRoundId } = req.params;

    // Validate coding round ID
    if (!codingRoundId || !codingRoundId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coding round ID",
      });
    }

    const codingRound = await CodingRound.findByIdAndDelete(codingRoundId);
    if (!codingRound) {
      return res
        .status(404)
        .json({ success: false, message: "Coding round not found" });
    }

    // Also delete related submissions
    await Promise.all([
      StudentCodingSubmission.deleteMany({ codingRoundId: codingRound._id }),
      DailyChallengeAttempt.deleteMany({ codingRoundId: codingRound._id }),
      Submission.deleteMany({ codingRoundId: codingRound._id }),
    ]);

    res.status(200).json({
      success: true,
      message: "Coding round and related submissions deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting coding round:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin: Get student scores for a specific coding round
export const getCodingRoundScores = async (req, res) => {
  try {
    const { codingRoundId } = req.params;
    if (!codingRoundId || !codingRoundId.match(/^[0-9a-fA-F]{24}$/)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid codingRoundId" });
    }
    const submissions = await StudentCodingSubmission.find({ codingRoundId });
    const scores = submissions.map((submission) => ({
      studentEmail: submission.studentEmail,
      studentScore: submission.totalScore,
      submittedAt: submission.submittedAt,
    }));
    res.status(200).json({ success: true, codingRoundId, scores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Run coding round answers (validate against visible test cases only)
export const runCodingRoundAnswers = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { studentEmail, solutions, attemptId } = req.body;
    const normalizedEmail = String(studentEmail || "").trim().toLowerCase();

    if (!normalizedEmail || !solutions || !Array.isArray(solutions)) {
      return res.status(400).json({
        success: false,
        message: "Student email and solutions are required",
      });
    }

    if (solutions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one solution is required",
      });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    let participant = null;
    let challengeAttempt = null;
    if (codingRound.challengeType === "daily_challenge") {
      participant = await resolveDailyChallengeParticipant({
        codingRound,
        user: req.user,
        email: normalizedEmail,
      });

      challengeAttempt = await getDailyChallengeAttempt({
        codingRoundId: codingRound._id,
        studentEmail: normalizedEmail,
      });

      if (!challengeAttempt || (attemptId && String(challengeAttempt._id) !== String(attemptId))) {
        return res.status(403).json({
          success: false,
          message: "A valid Daily Challenge attempt is required before running code.",
        });
      }

      if (!challengeAttempt.startedAt) {
        return res.status(403).json({
          success: false,
          message: "Start the Daily Challenge before running code.",
        });
      }

      if (["ended", "auto_submitted", "expired"].includes(challengeAttempt.status)) {
        return res.status(403).json({
          success: false,
          message: "This Daily Challenge attempt has already ended.",
        });
      }

      if (isAttemptExpired(challengeAttempt)) {
        challengeAttempt.status = "expired";
        challengeAttempt.endedAt = challengeAttempt.endedAt || new Date();
        await challengeAttempt.save();
        return res.status(403).json({
          success: false,
          message: "Time is up for this Daily Challenge attempt.",
          expired: true,
        });
      }
    }

    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: normalizedEmail,
    });

    if (existingSubmission?.isRoundEnded) {
      return res.status(403).json({
        success: false,
        message: "You have already ended this coding round and cannot run code",
        alreadyEnded: true,
        finalScore: existingSubmission.totalScore,
        endedAt: existingSubmission.roundEndedAt,
      });
    }

    let submission = existingSubmission;
    if (!submission) {
      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentId: participant?.student?._id || null,
        batchId: codingRound.batchId || null,
        trackId: codingRound.trackId || null,
        questionId: codingRound.questionId || null,
        attemptId: challengeAttempt?._id || null,
        studentEmail: normalizedEmail,
        totalScore: 0,
      });
    }

    const runResults = [];

    for (const solution of solutions) {
      const { problemIndex, language, submittedCode } = solution;

      if (problemIndex === undefined || !language || !submittedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Each solution must have problemIndex, language, and submittedCode",
        });
      }

      const problem = codingRound.problems[problemIndex];
      if (!problem) {
        return res.status(400).json({
          success: false,
          message: `Problem at index ${problemIndex} not found`,
        });
      }

      const question = await Question.findById(problem.questionId || codingRound.questionId).lean();
      const isMcq = question?.categoryType === "MCQ";

      if (isMcq) {
        runResults.push({
          problemIndex,
          language,
          success: true,
          compileSuccess: true,
          feedback: "MCQ selection verified. You can now Submit."
        });
        continue;
      }

      const languageId = LANGUAGE_IDS[language?.toLowerCase()];
      if (!languageId) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: ${language}`,
        });
      }

      const runsCount = submission.problemRuns ? (submission.problemRuns.get(problemIndex.toString()) || 0) : 0;
      const maxRuns = codingRound.challengeType === "daily_challenge"
        ? DAILY_CHALLENGE_RULES.runLimitPerQuestion
        : 5;
      if (runsCount >= maxRuns) {
        runResults.push({
          problemIndex,
          language,
          success: false,
          compileSuccess: false,
          feedback: `Max runs exhausted (${maxRuns}/${maxRuns}) for this problem. Please submit.`
        });
        continue;
      }

      if (!submission.problemRuns) submission.problemRuns = new Map();
      submission.problemRuns.set(problemIndex.toString(), runsCount + 1);

      const simpleInput = problem.visibleTestCases?.length > 0 ? problem.visibleTestCases[0].input : "";
      
      try {
        const result = await testCodeWithJudge0(
          submittedCode,
          languageId,
          simpleInput,
          "" // No expected output check needed
        );

        const compileSuccess = result.statusId === 3;

        runResults.push({
          problemIndex,
          language,
          runsLeft: maxRuns - (runsCount + 1),
          compileSuccess,
          actualOutput: result.actualOutput,
          error: result.error,
          executionTime: result.executionTime,
          feedback: compileSuccess 
            ? "Code compiled successfully! You can now Submit." 
            : `Execution Error: ${result.statusDescription}`
        });
      } catch (error) {
        console.error(`Error during simple execution:`, error);
        runResults.push({
          problemIndex,
          language,
          compileSuccess: false,
          actualOutput: "",
          error: "Execution error",
          feedback: "Server error occurred during execution."
        });
      }
    }

    submission.studentId = submission.studentId || participant?.student?._id || null;
    submission.batchId = submission.batchId || codingRound.batchId || null;
    submission.trackId = submission.trackId || codingRound.trackId || null;
    submission.questionId = submission.questionId || codingRound.questionId || null;
    submission.attemptId = submission.attemptId || challengeAttempt?._id || null;
    submission.lastSubmissionAt = new Date();
    await submission.save();

    if (challengeAttempt) {
      challengeAttempt.lastActiveAt = new Date();
      challengeAttempt.codingSubmissionId = submission._id;
      await challengeAttempt.save();
    }

    res.status(200).json({
      success: true,
      message: "Code execution completed",
      data: {
        results: runResults,
        totalProblems: solutions.length,
        executedAt: new Date(),
        attempt: challengeAttempt ? buildAttemptPayload(challengeAttempt) : null,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("Error running coding round answers:", error);
    }
    res.status(statusCode).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// End coding round - prevents further submissions and shows final score
export const endCodingRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { studentEmail, attemptId } = req.body;
    const normalizedEmail = String(studentEmail || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Student email is required",
      });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    let participant = null;
    let challengeAttempt = null;
    if (codingRound.challengeType === "daily_challenge") {
      participant = await resolveDailyChallengeParticipant({
        codingRound,
        user: req.user,
        email: normalizedEmail,
      });

      challengeAttempt = await getDailyChallengeAttempt({
        codingRoundId: codingRound._id,
        studentEmail: normalizedEmail,
      });
      if (!challengeAttempt || (attemptId && String(challengeAttempt._id) !== String(attemptId))) {
        return res.status(403).json({
          success: false,
          message: "A valid Daily Challenge attempt is required before ending the challenge.",
        });
      }
    }

    let submission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: normalizedEmail,
    });

    if (!submission) {
      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentId: participant?.student?._id || null,
        batchId: codingRound.batchId || null,
        trackId: codingRound.trackId || null,
        questionId: codingRound.questionId || null,
        attemptId: challengeAttempt?._id || null,
        studentEmail: normalizedEmail,
        problemScores: new Map(),
        totalScore: 0,
        isRoundEnded: true,
        roundEndedAt: new Date(),
        lastSubmissionAt: new Date(),
      });
    } else {
      submission.isRoundEnded = true;
      submission.roundEndedAt = new Date();
    }

    let linkedSubmission = null;
    if (codingRound.challengeType === "daily_challenge" && challengeAttempt) {
      const finalized = await finalizeDailyChallengeAttempt({
        codingRound,
        student: participant.student,
        attempt: challengeAttempt,
        submission,
        finalStatus: "ended",
        autoEnded: false,
      });
      challengeAttempt = finalized.attempt;
      linkedSubmission = finalized.linkedSubmission;
    } else {
      await submission.save();
    }

    let maxPossibleScore = 0;
    let computedTotalScore = 0;

    const problemResults = codingRound.problems.map((problem, index) => {
      const accuracy = submission.problemScores.get(index.toString()) || 0;
      const qType = String(problem.categoryType || "").toLowerCase();
      const difficulty = problem.difficulty || "Easy";
      
      let maxMarks = 10;
      if (qType === "mcq" || qType === "aptitude") {
        maxMarks = 1;
      } else {
        if (difficulty === "Easy") maxMarks = 10;
        else if (difficulty === "Medium") maxMarks = 20;
        else if (difficulty === "Hard") maxMarks = 30;
      }
      maxPossibleScore += maxMarks;
      const marks = maxMarks * (accuracy / 100);
      computedTotalScore += marks;

      return {
        problemIndex: index,
        problemTitle: problem.problemTitle,
        difficulty: problem.difficulty,
        categoryType: problem.categoryType || "Coding",
        attempted: accuracy > 0,
        score: Number(marks.toFixed(1)),
        maxScore: maxMarks,
        isCorrect: accuracy === 100,
      };
    });

    const totalProblemsAttempted = problemResults.filter(
      (p) => p.attempted
    ).length;
    const correctSolutions = problemResults.filter((p) => p.isCorrect).length;
    const challengeOutcome = await buildDailyChallengeOutcome({
      codingRound,
      submission,
      attempt: challengeAttempt,
      totalProblems: codingRound.problems.length,
      correctSolutions,
    });

    const finalTotalScore = Number(computedTotalScore.toFixed(1));

    res.status(200).json({
      success: true,
      message: "Coding round ended successfully",
      data: {
        submissionId: submission._id,
        attemptId: challengeAttempt?._id || null,
        linkedSubmissionId: linkedSubmission?._id || null,
        roundEndedAt: submission.roundEndedAt,
        problemResults,
        accuracy: finalTotalScore,
        evaluationStatus: linkedSubmission?.status || (correctSolutions === codingRound.problems.length ? "Passed" : (finalTotalScore > 0 ? "PartialPass" : "Pending")),
        totalScore: finalTotalScore,
        maxPossibleScore,
        totalProblems: codingRound.problems.length,
        attempted: totalProblemsAttempted,
        correctSolutions: correctSolutions,
        ...challengeOutcome,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("Error ending coding round:", error);
    }
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to end coding round",
    });
  }
};

// Auto-submit coding round when frontend timer expires
export const autoSubmitRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { studentEmail, attemptId } = req.body;
    const normalizedEmail = String(studentEmail || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Student email is required",
      });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    let participant = null;
    let challengeAttempt = null;
    if (codingRound.challengeType === "daily_challenge") {
      participant = await resolveDailyChallengeParticipant({
        codingRound,
        user: req.user,
        email: normalizedEmail,
      });

      challengeAttempt = await getDailyChallengeAttempt({
        codingRoundId: codingRound._id,
        studentEmail: normalizedEmail,
      });
      if (!challengeAttempt || (attemptId && String(challengeAttempt._id) !== String(attemptId))) {
        return res.status(403).json({
          success: false,
          message: "A valid Daily Challenge attempt is required before auto-submit.",
        });
      }
    }

    let submission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: normalizedEmail,
    });

    if (!submission) {
      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentId: participant?.student?._id || null,
        batchId: codingRound.batchId || null,
        trackId: codingRound.trackId || null,
        questionId: codingRound.questionId || null,
        attemptId: challengeAttempt?._id || null,
        studentEmail: normalizedEmail,
        problemScores: new Map(),
        totalScore: 0,
        isRoundEnded: true,
        autoEnded: true,
        roundEndedAt: new Date(),
        lastSubmissionAt: new Date(),
      });
    } else if (!submission.isRoundEnded) {
      submission.isRoundEnded = true;
      submission.autoEnded = true;
      submission.roundEndedAt = new Date();
    } else {
      return res.status(200).json({
        success: true,
        message: "Coding round was already ended",
        data: {
          submissionId: submission._id,
          totalScore: submission.totalScore,
          endedAt: submission.roundEndedAt,
          autoEnded: submission.autoEnded,
        },
      });
    }

    let linkedSubmission = null;
    if (codingRound.challengeType === "daily_challenge" && challengeAttempt) {
      const finalized = await finalizeDailyChallengeAttempt({
        codingRound,
        student: participant.student,
        attempt: challengeAttempt,
        submission,
        finalStatus: "auto_submitted",
        autoEnded: true,
      });
      challengeAttempt = finalized.attempt;
      linkedSubmission = finalized.linkedSubmission;
    } else {
      await submission.save();
    }

    const problemResults = codingRound.problems.map((problem, index) => {
      const score = submission.problemScores.get(index.toString()) || 0;
      return {
        problemIndex: index,
        problemTitle: problem.problemTitle,
        difficulty: problem.difficulty,
        categoryType: problem.categoryType || "Coding",
        attempted: score > 0,
        score: score,
        isCorrect: score === 100,
      };
    });

    const correctSolutions = problemResults.filter((p) => p.isCorrect).length;
    const challengeOutcome = await buildDailyChallengeOutcome({
      codingRound,
      submission,
      attempt: challengeAttempt,
      totalProblems: codingRound.problems.length,
      correctSolutions,
    });

    res.status(200).json({
      success: true,
      message: "Coding round auto-submitted and ended due to time expiry",
      data: {
        submissionId: submission._id,
        attemptId: challengeAttempt?._id || null,
        linkedSubmissionId: linkedSubmission?._id || null,
        accuracy: submission.totalScore,
        evaluationStatus: linkedSubmission?.status || "Timeout",
        totalScore: submission.totalScore,
        endedAt: submission.roundEndedAt,
        autoEnded: true,
        problemResults,
        correctSolutions,
        totalProblems: codingRound.problems.length,
        ...challengeOutcome,
      },
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    if (statusCode === 500) {
      console.error("Error auto-submitting coding round:", error);
    }
    res.status(statusCode).json({
      success: false,
      message: error.message || "Failed to auto-submit coding round",
    });
  }
};
