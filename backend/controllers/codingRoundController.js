import CodingRound from "../models/CodingRound.js";
import StudentCodingSubmission from "../models/StudentCodingSubmission.js";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import {
  generateOTP,
  storeOTP,
  verifyOTP,
  sendOTPEmail,
  isRoundActive,
  getRoundTimeStatus,
  validateSubmission,
} from "../utils/mcqCodingUtils.js";
import { testCodeWithJudge0, LANGUAGE_IDS } from "../utils/judgeUtil.js";

// Simple rate limiter for coding operations (10 seconds)
export const codingRateLimit = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 1, // 1 request per window per IP
  message: {
    success: false,
    message: "Please wait 10 seconds before trying again",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // No custom keyGenerator - uses default IP-based limiting
});

// Helper function to convert IST to UTC
const convertISTToUTC = (istDateString) => {
  // Create date by explicitly treating the input as IST
  // Add IST timezone offset (+05:30) to the string
  const istWithTimezone = istDateString + "+05:30";
  const utcDate = new Date(istWithTimezone);

  return utcDate;
};

const startOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const buildDailyChallengeOutcome = async ({ codingRound, submission, totalProblems, correctSolutions }) => {
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

  const startedAt = submission.submittedAt || submission.createdAt || new Date();
  const endedAt = submission.roundEndedAt || new Date();
  const timeTakenSeconds = Math.max(0, Math.round((endedAt.getTime() - new Date(startedAt).getTime()) / 1000));
  const xpGained = Math.max(0, Math.round(submission.totalScore || 0));

  return {
    challengeMetrics: {
      xpGained,
      streak,
      timeTakenSeconds,
      timeTakenMinutes: Number((timeTakenSeconds / 60).toFixed(1)),
      score: submission.totalScore || 0,
      correctSolutions,
      totalProblems,
    },
  };
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

    if (!email) {
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

    // Simple check - if round was created but student already ended, prevent OTP
    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: email.toLowerCase(),
    });

    // If student has ended the round, prevent further OTP access
    if (existingSubmission?.isRoundEnded) {
      return res.status(403).json({
        success: false,
        message:
          "You have already ended this coding round and cannot access it again",
        alreadyEnded: true,
        finalScore: existingSubmission.totalScore,
        endedAt: existingSubmission.roundEndedAt,
      });
    }

    // If any submission record exists, prevent further OTP access
    if (existingSubmission) {
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

    // Generate OTP only if no submission record exists
    const otp = generateOTP();
    storeOTP(`${linkId}:${email}`, otp);
    await sendOTPEmail(email, otp, "Coding Round");

    res.json({ success: true, message: "OTP sent to email" });
  } catch (error) {
    console.error("Error sending OTP for Coding Round:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// Verify OTP and get coding round access
export const verifyOTPAndGetCodingRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    // Double-check for existing submission record
    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: email.toLowerCase(),
    });

    if (existingSubmission?.isRoundEnded) {
      return res.status(403).json({
        success: false,
        message:
          "You have already ended this coding round and cannot access it again",
        alreadyEnded: true,
        finalScore: existingSubmission.totalScore,
        endedAt: existingSubmission.roundEndedAt,
      });
    }

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message: "You have already accessed this coding round",
        alreadyAttempted: true,
      });
    }
    const valid = verifyOTP(`${linkId}:${email}`, otp);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Create a submission record immediately upon successful OTP verification
    // This prevents the student from getting OTP again
    const newSubmission = new StudentCodingSubmission({
      codingRoundId: codingRound._id,
      studentEmail: email.toLowerCase(),
      problemScores: new Map(),
      totalScore: 0,
      isRoundEnded: false,
      submittedAt: new Date(),
      lastSubmissionAt: new Date(),
    });

    await newSubmission.save();

    res.json({
      success: true,
      codingRound,
      message: "Access granted. You can now attempt the coding round.",
      note: "This is your only attempt. Make sure to complete it before the time limit.",
    });
  } catch (error) {
    console.error("Error verifying OTP for Coding Round:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};

// Submit coding round answers (hidden test cases) - validates and updates score only
export const submitCodingRoundAnswers = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { studentEmail, solutions } = req.body;

    // Validate input
    if (!studentEmail || !solutions || !Array.isArray(solutions)) {
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

    // Validate solution structure
    if (problemIndex === undefined || !language || !submittedCode) {
      return res.status(400).json({
        success: false,
        message: "Problem index, language, and submitted code are required",
      });
    }

    // Find coding round
    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    // Find the problem
    const problem = codingRound.problems[problemIndex];
    if (!problem) {
      return res.status(400).json({
        success: false,
        message: `Problem at index ${problemIndex} not found`,
      });
    }

    // Get language ID for Judge0
    const languageId = LANGUAGE_IDS[language?.toLowerCase()];
    if (!languageId) {
      return res.status(400).json({
        success: false,
        message: `Unsupported language: ${language}`,
      });
    }

    // Find or create submission record
    let submission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: studentEmail.toLowerCase(),
    });

    // Check if round has been ended by the student
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

    // Enforce Max 1 Submission Limitation per problem
    if (submission?.problemSubmitted && submission.problemSubmitted.get(problemIndex.toString())) {
      return res.status(403).json({
        success: false,
        message: "You have already submitted a solution for this problem. Max 1 submission allowed.",
        alreadySubmitted: true
      });
    }

    // Test against all test cases (visible + hidden)
    let testsPassed = 0;
    let testsFailed = 0;
    const allTestCases = [...problem.visibleTestCases, ...problem.hiddenTestCases];
    const totalTests = allTestCases.length;

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
      } catch (error) {
        testsFailed++;
      }
    }

    // Calculate proportional score for this problem
    const problemScore = Math.round((testsPassed / totalTests) * 100);
    const isCorrect = testsPassed === totalTests;

if (!submission) {
      // Create new submission
      const problemScores = new Map();
      problemScores.set(problemIndex.toString(), problemScore);

      const problemSubmitted = new Map();
      problemSubmitted.set(problemIndex.toString(), true);

      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentEmail: studentEmail.toLowerCase(),
        problemScores,
        problemSubmitted,
        totalScore: problemScore,
        lastSubmissionAt: new Date(),
      });
    } else {
      // Update existing submission
      if (!submission.problemSubmitted) submission.problemSubmitted = new Map();
      submission.problemSubmitted.set(problemIndex.toString(), true);
      submission.problemScores.set(problemIndex.toString(), problemScore);

      // Recalculate total score
      let totalScore = 0;
      for (const score of submission.problemScores.values()) {
        totalScore += score;
      }
      submission.totalScore = totalScore;
      submission.lastSubmissionAt = new Date();
    }

    await submission.save();

    res.status(200).json({
      success: true,
      message: "Solution submitted and evaluated successfully",
      data: {
        submissionId: submission._id,
        problemIndex,
        problemScore,
        isCorrect,
        currentTotalScore: submission.totalScore,
        failedTestCases: testsFailed, 
        totalTestCases: totalTests, 
        feedback: isCorrect
          ? "Perfect! All test cases passed."
          : `Partial Correctness! Score: ${problemScore}. Failed: ${testsFailed}/${totalTests} test cases.`,
        submittedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error submitting coding round answers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit solution",
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
    await StudentCodingSubmission.deleteMany({
      codingRoundId: codingRound._id,
    });

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
    const { studentEmail, solutions } = req.body;

    // Basic validation
    if (!studentEmail || !solutions || !Array.isArray(solutions)) {
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

    // Find coding round
    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    // Check if student has ended the round
    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: studentEmail.toLowerCase(),
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
        studentEmail: studentEmail.toLowerCase(),
        totalScore: 0,
      });
    }

    // Process solutions - validate each solution lightly
    const runResults = [];

    for (const solution of solutions) {
      const { problemIndex, language, submittedCode } = solution;

      // Validate solution structure
      if (problemIndex === undefined || !language || !submittedCode) {
        return res.status(400).json({
          success: false,
          message:
            "Each solution must have problemIndex, language, and submittedCode",
        });
      }

      // Find the problem
      const problem = codingRound.problems[problemIndex];
      if (!problem) {
        return res.status(400).json({
          success: false,
          message: `Problem at index ${problemIndex} not found`,
        });
      }

      // Get language ID for Judge0
      const languageId = LANGUAGE_IDS[language?.toLowerCase()];
      if (!languageId) {
        return res.status(400).json({
          success: false,
          message: `Unsupported language: ${language}`,
        });
      }

      // Enforce 5 runs limit
      const runsCount = submission.problemRuns ? (submission.problemRuns.get(problemIndex.toString()) || 0) : 0;
      if (runsCount >= 5) {
        runResults.push({
          problemIndex,
          language,
          success: false,
          compileSuccess: false,
          feedback: "Max runs exhausted (5/5) for this problem. Please submit."
        });
        continue;
      }

      // Increment runs
      if (!submission.problemRuns) submission.problemRuns = new Map();
      submission.problemRuns.set(problemIndex.toString(), runsCount + 1);

      // Lightweight run using the first visible test case input
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
          runsLeft: 4 - runsCount, // 5 max minus what they just used
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

    await submission.save();

    res.status(200).json({
      success: true,
      message: "Code execution completed",
      data: {
        results: runResults,
        totalProblems: solutions.length,
        executedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error running coding round answers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// End coding round - prevents further submissions and shows final score
export const endCodingRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { studentEmail } = req.body;

    // Validate input
    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: "Student email is required",
      });
    }

    // Find coding round
    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res.status(404).json({
        success: false,
        message: "Coding round not found",
      });
    }

    // Find submission record
    let submission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: studentEmail.toLowerCase(),
    });

    if (!submission) {
      // Create empty submission if student hasn't submitted anything
      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentEmail: studentEmail.toLowerCase(),
        problemScores: new Map(),
        totalScore: 0,
        isRoundEnded: true,
        roundEndedAt: new Date(),
        lastSubmissionAt: new Date(),
      });
    } else {
      // Mark existing submission as ended
      submission.isRoundEnded = true;
      submission.roundEndedAt = new Date();
    }

    await submission.save();

    // Prepare problem results
    const problemResults = codingRound.problems.map((problem, index) => {
      const score = submission.problemScores.get(index.toString()) || 0;
      return {
        problemIndex: index,
        problemTitle: problem.problemTitle,
        difficulty: problem.difficulty,
        attempted: score > 0,
        score: score,
        maxScore: 100,
        isCorrect: score === 100,
      };
    });

    const totalProblemsAttempted = problemResults.filter(
      (p) => p.attempted
    ).length;
    const correctSolutions = problemResults.filter((p) => p.isCorrect).length;
    const challengeOutcome = await buildDailyChallengeOutcome({
      codingRound,
      submission,
      totalProblems: codingRound.problems.length,
      correctSolutions,
    });

    res.status(200).json({
      success: true,
      message: "Coding round ended successfully",
      data: {
        submissionId: submission._id,
        roundEndedAt: submission.roundEndedAt,
        problemResults,
        totalScore: submission.totalScore,
        maxPossibleScore: codingRound.problems.length * 100,
        totalProblems: codingRound.problems.length,
        attempted: totalProblemsAttempted,
        correctSolutions: correctSolutions,
        ...challengeOutcome,
      },
    });
  } catch (error) {
    console.error("Error ending coding round:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end coding round",
    });
  }
};

// Auto-submit coding round when frontend timer expires
export const autoSubmitRound = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { studentEmail } = req.body;

    if (!studentEmail) {
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

    // Find submission record
    let submission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: studentEmail.toLowerCase(),
    });

    if (!submission) {
      // Create empty submission if student hasn't submitted anything
      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentEmail: studentEmail.toLowerCase(),
        problemScores: new Map(),
        totalScore: 0,
        isRoundEnded: true,
        autoEnded: true,
        roundEndedAt: new Date(),
        lastSubmissionAt: new Date(),
      });
    } else if (!submission.isRoundEnded) {
      // Auto-end existing submission
      submission.isRoundEnded = true;
      submission.autoEnded = true;
      submission.roundEndedAt = new Date();
    } else {
      // Already ended, return current status
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

    await submission.save();

    // Prepare problem results
    const problemResults = codingRound.problems.map((problem, index) => {
      const score = submission.problemScores.get(index.toString()) || 0;
      return {
        problemIndex: index,
        problemTitle: problem.problemTitle,
        attempted: score > 0,
        score: score,
        isCorrect: score === 100,
      };
    });

    const correctSolutions = problemResults.filter((p) => p.isCorrect).length;
    const challengeOutcome = await buildDailyChallengeOutcome({
      codingRound,
      submission,
      totalProblems: codingRound.problems.length,
      correctSolutions,
    });

    res.status(200).json({
      success: true,
      message: "Coding round auto-submitted and ended due to time expiry",
      data: {
        submissionId: submission._id,
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
    console.error("Error auto-submitting coding round:", error);
    res.status(500).json({
      success: false,
      message: "Failed to auto-submit coding round",
    });
  }
};
