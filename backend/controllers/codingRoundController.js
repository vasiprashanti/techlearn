import CodingRound from "../models/CodingRound.js";
import StudentCodingSubmission from "../models/StudentCodingSubmission.js";
import crypto from "crypto";
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
    const { title, college, date, duration, problems } = req.body;

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
    });

    await codingRound.save();

    res.status(201).json({
      success: true,
      message: "Coding round created successfully",
      data: {
        id: codingRound._id,
        title: codingRound.title,
        college: codingRound.college,
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
        "title college date duration totalAttempts isActive linkId createdAt"
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

// Submit coding round answers
export const submitCodingRoundAnswers = async (req, res) => {
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

    // Check for existing submission - only allow one submission
    const existingSubmission = await StudentCodingSubmission.findOne({
      codingRoundId: codingRound._id,
      studentEmail: studentEmail.toLowerCase(),
    });

    if (existingSubmission) {
      return res.status(400).json({
        success: false,
        message:
          "You have already submitted for this coding round. Only one submission is allowed.",
      });
    }

    // Process solutions - validate each solution against hidden test cases only
    const processedSolutions = [];
    let totalScore = 0;

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

      // Test against hidden test cases only
      let hiddenTestsPassed = 0;
      const totalHiddenTests = problem.hiddenTestCases.length;
      const hiddenTestResults = [];

      for (let i = 0; i < problem.hiddenTestCases.length; i++) {
        const testCase = problem.hiddenTestCases[i];

        try {
          const testResult = await testCodeWithJudge0(
            submittedCode,
            languageId,
            testCase.input,
            testCase.output
          );

          const passed = testResult.success && testResult.outputMatches;
          if (passed) hiddenTestsPassed++;

          // Store results but don't expose actual test case details
          hiddenTestResults.push({
            testCaseIndex: i,
            passed,
            error: testResult.error || null,
            // Don't expose input/output for hidden test cases
          });
        } catch (error) {
          hiddenTestResults.push({
            testCaseIndex: i,
            passed: false,
            error: `Test execution failed: ${error.message}`,
          });
        }
      }

      // Calculate score for this problem (based only on hidden test cases)
      const problemScore =
        totalHiddenTests > 0
          ? Math.round((hiddenTestsPassed / totalHiddenTests) * 100)
          : 0;
      const isCorrect = hiddenTestsPassed === totalHiddenTests;

      totalScore += problemScore;

      // Store processed solution
      processedSolutions.push({
        problemIndex,
        submittedCode,
        language,
        testCasesPassed: hiddenTestsPassed,
        totalTestCases: totalHiddenTests,
        hiddenTestsPassed,
        totalHiddenTests,
        isCorrect,
        problemScore,
        hiddenTestSummary: {
          passed: hiddenTestsPassed,
          total: totalHiddenTests,
          failedTests: totalHiddenTests - hiddenTestsPassed,
        },
      });
    }

    // Save submission
    const submission = new StudentCodingSubmission({
      codingRoundId: codingRound._id,
      studentEmail: studentEmail.toLowerCase(),
      solutions: processedSolutions.map((sol) => ({
        problemIndex: sol.problemIndex,
        submittedCode: sol.submittedCode,
        language: sol.language,
        testCasesPassed: sol.testCasesPassed,
        totalTestCases: sol.totalTestCases,
        isCorrect: sol.isCorrect,
      })),
      totalScore,
    });

    await submission.save();

    // Update attempts count
    codingRound.totalAttempts = (codingRound.totalAttempts || 0) + 1;
    await codingRound.save();

    res.status(200).json({
      success: true,
      message: "Solutions submitted and evaluated successfully",
      data: {
        submissionId: submission._id,
        totalScore,
        maxPossibleScore: codingRound.problems.length * 100,
        solutions: processedSolutions.map((sol) => ({
          problemIndex: sol.problemIndex,
          language: sol.language,
          testCasesPassed: sol.testCasesPassed,
          totalTestCases: sol.totalTestCases,
          hiddenTestsPassed: sol.hiddenTestsPassed,
          totalHiddenTests: sol.totalHiddenTests,
          isCorrect: sol.isCorrect,
          problemScore: sol.problemScore,
          hiddenTestSummary: sol.hiddenTestSummary,
          feedback: sol.isCorrect
            ? "Perfect! All test cases passed."
            : `Passed ${sol.testCasesPassed}/${sol.totalTestCases} test cases.`,
        })),
        submittedAt: submission.submittedAt,
        scoringSummary: {
          totalProblems: codingRound.problems.length,
          averageScore: Math.round(totalScore / codingRound.problems.length),
          partialCreditAwarded: processedSolutions.some(
            (sol) => sol.problemScore > 0 && sol.problemScore < 100
          ),
        },
      },
    });
  } catch (error) {
    console.error("Error submitting coding round answers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit solutions",
    });
  }
};

// Update a coding round by codingRoundId
export const updateCodingRound = async (req, res) => {
  try {
    const { codingRoundId } = req.params;
    const { title, college, date, duration, problems, isActive } = req.body;

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
export const getCodingRoundScores = async (req, res) => {};

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
