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
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res
        .status(404)
        .json({ success: false, message: "Coding round not found" });
    }

    if (!isRoundActive(codingRound)) {
      return res
        .status(403)
        .json({ success: false, message: "Coding round not active" });
    }

    // Check if student has already submitted actual code (one submission per coding round per student)
    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: email,
    });
    if (
      existingSubmission &&
      existingSubmission.solutions &&
      existingSubmission.solutions.length > 0
    ) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted this coding round",
      });
    }
    // Generate OTP
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
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP required" });
    }

    const codingRound = await CodingRound.findOne({ linkId });
    if (!codingRound) {
      return res
        .status(404)
        .json({ success: false, message: "Coding round not found" });
    }

    if (!isRoundActive(codingRound)) {
      return res
        .status(403)
        .json({ success: false, message: "Coding round not active" });
    }

    const valid = verifyOTP(`${linkId}:${email}`, otp);
    if (!valid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired OTP" });
    }

    res.json({ success: true, codingRound });
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

    // Check if round is active
    if (!isRoundActive(codingRound)) {
      return res.status(400).json({
        success: false,
        message: "Coding round is not active",
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
      return res.status(400).json({
        success: false,
        message:
          "You have already ended this round. No more submissions allowed.",
      });
    }

    // Test against hidden test cases
    let hiddenTestsPassed = 0;
    const totalHiddenTests = problem.hiddenTestCases.length;

    for (let i = 0; i < problem.hiddenTestCases.length; i++) {
      const testCase = problem.hiddenTestCases[i];

      try {
        const testResult = await testCodeWithJudge0(
          submittedCode,
          languageId,
          testCase.input,
          testCase.expectedOutput
        );

        const passed = testResult.success && testResult.outputMatches;
        if (passed) hiddenTestsPassed++;
      } catch (error) {
        // Test failed, don't increment passed count
      }
    }

    // Calculate score for this problem (0 if any test case fails, 100 if all pass)
    const problemScore = hiddenTestsPassed === totalHiddenTests ? 100 : 0;
    const isCorrect = hiddenTestsPassed === totalHiddenTests;

    if (!submission) {
      // Create new submission
      const problemScores = new Map();
      problemScores.set(problemIndex.toString(), problemScore);

      submission = new StudentCodingSubmission({
        codingRoundId: codingRound._id,
        studentEmail: studentEmail.toLowerCase(),
        problemScores,
        totalScore: problemScore,
        lastSubmissionAt: new Date(),
      });
    } else {
      // Update existing submission
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
        feedback: isCorrect
          ? "Perfect! All test cases passed."
          : "Some test cases failed. Try again!",
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

    // Check if round is active
    if (!isRoundActive(codingRound)) {
      return res.status(400).json({
        success: false,
        message: "Coding round is not active",
      });
    }

    // Process solutions - validate each solution against visible test cases only
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

      // Test against visible test cases only
      const visibleTestResults = [];
      let visibleTestsPassed = 0;
      const totalVisibleTests = problem.visibleTestCases.length;

      for (const testCase of problem.visibleTestCases) {
        try {
          const result = await testCodeWithJudge0(
            submittedCode,
            languageId,
            testCase.input,
            testCase.expectedOutput
          );

          visibleTestResults.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: result.actualOutput,
            passed: result.passed,
            error: result.error,
            executionTime: result.executionTime,
          });

          if (result.passed) {
            visibleTestsPassed++;
          }
        } catch (error) {
          console.error(`Error testing visible test case:`, error);
          visibleTestResults.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: "",
            passed: false,
            error: "Execution error",
            executionTime: null,
          });
        }
      }

      runResults.push({
        problemIndex,
        language,
        visibleTestsPassed,
        totalVisibleTests,
        visibleTestResults,
        feedback:
          visibleTestsPassed === totalVisibleTests
            ? "All visible test cases passed! 🎉"
            : `Passed ${visibleTestsPassed}/${totalVisibleTests} visible test cases.`,
      });
    }

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

    // Calculate max possible score
    const maxPossibleScore = codingRound.problems.length * 100;

    res.status(200).json({
      success: true,
      message: "Coding round ended successfully",
      data: {
        finalScore: submission.totalScore,
        maxPossibleScore: maxPossibleScore,
        problemsAttempted: submission.problemScores.size,
        totalProblems: codingRound.problems.length,
        roundEndedAt: submission.roundEndedAt,
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
