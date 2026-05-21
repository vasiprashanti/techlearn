import Submission from "../models/Submission.js";
import Question from "../models/Questions.js";
import PracticeSubmission from "../models/PracticeSubmission.js";
import Category from "../models/Category.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import { testCodeWithJudge0, LANGUAGE_IDS } from "../utils/judgeUtil.js";
import { normalizeCategoryType } from "../utils/questionBank.js";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

// ===== EXECUTION CONSTRAINTS =====
const EXECUTION_CONSTRAINTS = {
  maxTimePerTestCase: 1000,      // milliseconds
  maxTotalExecutionTime: 10000,  // 10 seconds max for all test cases
  graceTime: 50,                 // milliseconds buffer
};

const MEMORY_CONSTRAINTS = {
  maxMemoryPerTest: 256,         // MB default
  totalMemoryAllowed: 512,       // For entire submission
  hardLimit: 1024,               // Absolute max
};

// Supported languages whitelist
const ALLOWED_LANGUAGES = {
  cpp: { id: 54, name: "C++ (GCC 9.2.0)" },
  python: { id: 71, name: "Python (3.8.1)" },
  java: { id: 62, name: "Java (OpenJDK 13.0.1)" },
  javascript: { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  c: { id: 50, name: "C (GCC 9.2.0)" },
  csharp: { id: 51, name: "C# (Mono 6.6.0.161)" },
  go: { id: 60, name: "Go (1.13.5)" },
  rust: { id: 73, name: "Rust (1.40.0)" },
};

const CODE_SIZE_LIMITS = {
  maxCodeLength: 50000,          // 50KB max per submission
  maxStarterCodeLength: 10000,   // 10KB per language starter
  maxReferenceSolutionLength: 20000,  // 20KB per language
};

const PROTECTION_STRATEGIES = {
  maxInputSize: 1024 * 1024,     // 1MB max per test case input
  maxOutputSize: 10 * 1024,      // 10KB max expected output
  processTimeout: 2000,          // Kill process if running after 2 seconds
};

const RATE_LIMITS = {
  runsPerQuestion: {
    interval: 24 * 60 * 60 * 1000,  // 24 hours
    max: 10,                        // 10 runs maximum per day per question
  },
  submitsPerQuestion: {
    interval: 24 * 60 * 60 * 1000,
    max: 5,                         // 5 final submissions per day
  },
  globalRuns: {
    interval: 60 * 1000,            // 1 minute window
    max: 20,                        // Max 20 runs across all questions per minute
  },
};

const MCQ_LABELS = ["A", "B", "C", "D"];

const normalizeMcqAnswer = (value) => {
  if (typeof value === "number" || /^\d+$/.test(String(value || ""))) {
    const label = MCQ_LABELS[Number(value)];
    return label || "";
  }
  return String(value || "").trim().toUpperCase();
};

const normalizeMcqSource = (value = "") => {
  if (value === "track_template" || value === "daily_challenge") return value;
  return "practice";
};

// ===== RATE LIMITERS =====
const runRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.runsPerQuestion.interval,
  max: RATE_LIMITS.runsPerQuestion.max,
  keyGenerator: (req) => `${req.user._id}:${req.params.submissionId}:run`,
  message: { success: false, message: "Too many run attempts. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const submitRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.submitsPerQuestion.interval,
  max: RATE_LIMITS.submitsPerQuestion.max,
  keyGenerator: (req) => `${req.user._id}:${req.params.submissionId}:submit`,
  message: { success: false, message: "Too many submission attempts. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const globalRunRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.globalRuns.interval,
  max: RATE_LIMITS.globalRuns.max,
  keyGenerator: (req) => `${req.user._id}:global:run`,
  message: { success: false, message: "Rate limit exceeded. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== HELPER FUNCTIONS =====

/**
 * Calculate scoring based on test case results
 */
const calculateScores = (passedTestCases, totalTestCases, executionTime, timeLimit) => {
  // Accuracy: percentage of test cases passed
  const accuracyScore = (passedTestCases / totalTestCases) * 100;

  // Efficiency: based on execution time vs time limit
  // Penalize if closer to timeout
  const efficiencyScore = Math.max(0, 100 - (executionTime / timeLimit) * 100);

  // Discipline: simplified code quality (can be extended)
  const disciplineScore = 85; // Placeholder for future implementation

  // Total score: weighted average
  const totalScore =
    accuracyScore * 0.5 + efficiencyScore * 0.3 + disciplineScore * 0.2;

  return {
    accuracyScore: Math.round(accuracyScore),
    efficiencyScore: Math.round(efficiencyScore),
    disciplineScore: Math.round(disciplineScore),
    totalScore: Math.round(totalScore),
  };
};

/**
 * Run code against test cases using Judge0
 */
const executeCode = async (code, language, testCase, timeLimit, memoryLimit) => {
  if (!ALLOWED_LANGUAGES[language]) {
    throw new Error(`Language ${language} is not supported`);
  }

  // Validate code size
  if (code.length > CODE_SIZE_LIMITS.maxCodeLength) {
    return {
      error: "Code too large (max 50KB)",
      status: "Error",
      passed: false,
    };
  }

  // Validate input size
  if (testCase.input.length > PROTECTION_STRATEGIES.maxInputSize) {
    return {
      error: "Input too large",
      status: "Error",
      passed: false,
    };
  }

    try {
      // Judge0 util expects positional args: (sourceCode, languageId, input, expectedOutput)
      const judgeRes = await testCodeWithJudge0(
        code,
        ALLOWED_LANGUAGES[language].id,
        testCase.input,
        testCase.output
      );

      return {
        passed: judgeRes.passed || false,
        executionTime: judgeRes.executionTime || 0,
        memoryUsed: judgeRes.memoryUsed || 0,
        status: judgeRes.statusDescription || judgeRes.statusId || "Error",
        output: judgeRes.actualOutput || judgeRes.output || "",
        error: judgeRes.error || judgeRes.compileOutput || null,
      };
    } catch (error) {
      return {
        error: error.message,
        status: "Error",
        passed: false,
      };
    }
};

// ===== SUBMISSION ENDPOINTS =====

/**
 * @desc    Start a coding submission attempt
 * @route   POST /api/question-bank/submissions/questions/:questionId/start
 * @access  Private
 */
export const startSubmission = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { language, batchId } = req.body;
    const studentId = req.user._id;

    // Validate question exists
    const question = await Question.findById(questionId)
      .select("+content.hiddenTestCases +content.correctOption +content.referenceSolution");
    if (!question) {
      return res.status(404).json({ success: false, message: "Question not found" });
    }

    // Only allow Coding questions
    if (normalizeCategoryType(question.categoryType) !== "Coding") {
      return res.status(400).json({
        success: false,
        message: "Only Coding-type questions can be submitted",
      });
    }

    // Validate language
    if (!language || !ALLOWED_LANGUAGES[language]) {
      return res.status(400).json({
        success: false,
        message: `Invalid language. Supported: ${Object.keys(ALLOWED_LANGUAGES).join(", ")}`,
      });
    }

    // Validate batch if provided
    if (batchId) {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ success: false, message: "Batch not found" });
      }
    }

    // Create submission record
    const submission = new Submission({
      studentId,
      questionId,
      categoryId: question.categoryId,
      categoryType: question.categoryType,
      batchId: batchId || null,
      trackId: null,
      language,
      languageId: ALLOWED_LANGUAGES[language].id,
      status: "Pending",
      startTime: new Date(),
      submissionType: "coding",
      // Capture question version and snapshots
      questionVersionId: question.version,
      contentVersionId: question.content?.contentVersion || 1,
      snapshotConstraints: question.content?.constraints || "",
      snapshotVisibleTestCases: question.content?.visibleTestCases || [],
      snapshotHiddenTestCases: question.content?.hiddenTestCases || [],
      snapshotTimeLimit: question.content?.timeLimit || 1000,
      snapshotMemoryLimit: question.content?.memoryLimit || 256,
    });

    await submission.save();

    res.status(201).json({
      success: true,
      data: {
        submissionId: submission._id,
        questionId: submission.questionId,
        categoryId: submission.categoryId,
        categoryType: submission.categoryType,
        questionTitle: question.title,
        questionVersionId: submission.questionVersionId,
        timeLimit: submission.snapshotTimeLimit,
        memoryLimit: submission.snapshotMemoryLimit,
        constraints: submission.snapshotConstraints,
        visibleTestCases: submission.snapshotVisibleTestCases,
        language: submission.language,
        starterCode: (() => {
          const sc = question.content && question.content.starterCode;
          let fallback = "// Start coding here";
          if (!sc) return fallback;
          // If legacy Map stored as plain object or Map
          try {
            if (typeof sc.get === 'function') {
              return sc.get(language) || fallback;
            }
            if (sc[language]) {
              // Structured: { code, version }
              if (typeof sc[language] === 'object' && sc[language].code) return sc[language].code;
              if (typeof sc[language] === 'string') return sc[language];
            }
          } catch (e) {
            return fallback;
          }
          return fallback;
        })(),
        startTime: submission.startTime,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Run code against visible test cases only
 * @route   POST /api/question-bank/submissions/:submissionId/run
 * @access  Private
 */
export const runCode = [
  globalRunRateLimiter,
  runRateLimiter,
  async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { code, language } = req.body;
      const studentId = req.user._id;

      // Validate submission exists and belongs to student
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ success: false, message: "Submission not found" });
      }

      if (submission.studentId.toString() !== studentId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }

      // Check if submission already finalized
      if (submission.submittedAt) {
        return res.status(400).json({
          success: false,
          message: "Submission has already been finalized",
        });
      }

      // Validate code
      if (!code || code.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Code cannot be empty" });
      }

      if (code.length > CODE_SIZE_LIMITS.maxCodeLength) {
        return res.status(400).json({
          success: false,
          message: `Code too large (max ${CODE_SIZE_LIMITS.maxCodeLength} bytes)`,
        });
      }

      // Validate language matches submission
      if (language !== submission.language) {
        return res.status(400).json({
          success: false,
          message: "Language mismatch with submission",
        });
      }

      // Run against visible test cases only
      const visibleTestCases = submission.snapshotVisibleTestCases || [];
      const runResults = [];
      let passedCount = 0;

      for (let i = 0; i < visibleTestCases.length; i++) {
        const testCase = visibleTestCases[i];
        const result = await executeCode(
          code,
          language,
          testCase,
          submission.snapshotTimeLimit,
          submission.snapshotMemoryLimit
        );

        runResults.push({
          testCaseIndex: i,
          passed: result.passed,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          status: result.status,
        });

        if (result.passed) {
          passedCount++;
        }
      }

      // Update submission with run count only (light update)
      submission.runCount = (submission.runCount || 0) + 1;
      await submission.save();

      res.json({
        success: true,
        data: {
          submissionId: submission._id,
          runCount: submission.runCount,
          testCaseResults: runResults,
          feedback: `${passedCount}/${visibleTestCases.length} test cases passed`,
          passingCount: passedCount,
          totalVisibleTestCases: visibleTestCases.length,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * @desc    Submit final solution (tests against all test cases)
 * @route   POST /api/question-bank/submissions/:submissionId/submit
 * @access  Private
 */
export const submitSolution = [
  submitRateLimiter,
  async (req, res) => {
    try {
      const { submissionId } = req.params;
      const { code, language } = req.body;
      const studentId = req.user._id;

      // Validate submission exists and belongs to student
      const submission = await Submission.findById(submissionId);
      if (!submission) {
        return res.status(404).json({ success: false, message: "Submission not found" });
      }

      if (submission.studentId.toString() !== studentId.toString()) {
        return res.status(403).json({ success: false, message: "Unauthorized" });
      }

      // Check if already submitted
      if (submission.submittedAt) {
        return res.status(400).json({
          success: false,
          message: "Submission has already been submitted",
        });
      }

      // Validate code
      if (!code || code.trim().length === 0) {
        return res.status(400).json({ success: false, message: "Code cannot be empty" });
      }

      if (code.length > CODE_SIZE_LIMITS.maxCodeLength) {
        return res.status(400).json({
          success: false,
          message: `Code too large (max ${CODE_SIZE_LIMITS.maxCodeLength} bytes)`,
        });
      }

      if (language !== submission.language) {
        return res.status(400).json({
          success: false,
          message: "Language mismatch with submission",
        });
      }

      // Run against ALL test cases (visible + hidden)
      const visibleTestCases = submission.snapshotVisibleTestCases || [];
      const hiddenTestCases = submission.snapshotHiddenTestCases || [];
      const allTestCases = [
        ...visibleTestCases.map((tc, idx) => ({
          ...(typeof tc.toObject === "function" ? tc.toObject() : tc),
          visible: true,
          index: idx,
        })),
        ...hiddenTestCases.map((tc, idx) => ({
          ...(typeof tc.toObject === "function" ? tc.toObject() : tc),
          visible: false,
          index: visibleTestCases.length + idx,
        })),
      ];

      const testCaseDetails = [];
      let passedCount = 0;
      let totalExecutionTime = 0;

      for (const testCase of allTestCases) {
        const result = await executeCode(
          code,
          language,
          testCase,
          submission.snapshotTimeLimit,
          submission.snapshotMemoryLimit
        );

        testCaseDetails.push({
          index: testCase.index,
          visible: testCase.visible,
          passed: result.passed,
          executionTime: result.executionTime,
          memoryUsed: result.memoryUsed,
          expectedOutput: testCase.output,
          actualOutput: result.passed ? undefined : result.output,
        });

        if (result.passed) {
          passedCount++;
        }
        totalExecutionTime += result.executionTime || 0;
      }

      // Determine final status
      let status = "Pending";
      if (passedCount === allTestCases.length) {
        status = "Passed";
      } else if (passedCount > 0) {
        status = "PartialPass";
      } else {
        status = "Failed";
      }

      // Calculate scores
      const scores = calculateScores(
        passedCount,
        allTestCases.length,
        totalExecutionTime,
        submission.snapshotTimeLimit * allTestCases.length
      );

      // Update submission with final results
      submission.submittedCode = code;
      submission.status = status;
      submission.endTime = new Date();
      submission.timeSpent = submission.endTime - submission.startTime;
      submission.submittedAt = submission.endTime;
      submission.finalSubmissionResults = {
        passedTestCases: passedCount,
        totalTestCases: allTestCases.length,
        testCaseDetails,
        compileOutput: null,
        runtimeError: null,
        evaluatedAt: submission.endTime,
      };
      submission.accuracyScore = scores.accuracyScore;
      submission.efficiencyScore = scores.efficiencyScore;
      submission.disciplineScore = scores.disciplineScore;
      submission.totalScore = scores.totalScore;

      await submission.save();

      res.json({
        success: true,
        data: {
          submissionId: submission._id,
          status: submission.status,
          totalScore: submission.totalScore,
          accuracyScore: submission.accuracyScore,
          efficiencyScore: submission.efficiencyScore,
          disciplineScore: submission.disciplineScore,
          timeSpent: submission.timeSpent,
          runCount: submission.runCount,
          finalSubmissionResults: {
            passedTestCases: passedCount,
            totalTestCases: allTestCases.length,
            testCaseDetails: testCaseDetails.map((tc) => ({
              index: tc.index,
              visible: tc.visible,
              passed: tc.passed,
              executionTime: tc.executionTime,
            })),
          },
          submittedAt: submission.submittedAt,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
];

/**
 * @desc    Submit a centralized MCQ answer and track practice-compatible stats
 * @route   POST /api/question-bank/submissions/questions/:questionId/mcq
 * @access  Private
 */
export const submitMcqAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const studentId = req.user._id;
    const selectedAnswer = normalizeMcqAnswer(req.body.selectedAnswer ?? req.body.selectedOption);
    const source = normalizeMcqSource(req.body.source);

    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ success: false, message: "Invalid questionId." });
    }

    if (!MCQ_LABELS.includes(selectedAnswer)) {
      return res.status(400).json({ success: false, message: "selectedAnswer must be A, B, C, or D." });
    }

    const question = await Question.findById(questionId).select("+content.correctOption").lean();
    if (!question || question.isActive === false || question.status === "Archived") {
      return res.status(404).json({ success: false, message: "Question not found." });
    }

    if (normalizeCategoryType(question.categoryType) !== "MCQ") {
      return res.status(400).json({ success: false, message: "Only MCQ-type questions can use this endpoint." });
    }

    const correctAnswer = normalizeMcqAnswer(question.content?.correctOption);
    if (!MCQ_LABELS.includes(correctAnswer)) {
      return res.status(500).json({ success: false, message: "MCQ answer key is not configured." });
    }

    const duplicate = await Submission.findOne({
      studentId,
      questionId: question._id,
      categoryType: "MCQ",
      submittedAt: { $gte: new Date(Date.now() - 3000) },
    })
      .sort({ submittedAt: -1 })
      .lean();

    if (duplicate) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        data: {
          submissionId: duplicate._id,
          questionId: String(question._id),
          categoryId: question.categoryId || null,
          categoryType: "MCQ",
          selectedAnswer,
          correctAnswer,
          isCorrect: duplicate.status === "Passed",
          score: duplicate.totalScore || 0,
          accuracy: duplicate.accuracyScore || 0,
          explanation: question.content?.explanation || "",
          submittedAt: duplicate.submittedAt,
        },
      });
    }

    const isCorrect = selectedAnswer === correctAnswer;
    const now = new Date();

    const submission = await Submission.create({
      studentId,
      questionId: question._id,
      categoryId: question.categoryId || null,
      categoryType: "MCQ",
      batchId: req.body.batchId || null,
      trackId: null,
      status: isCorrect ? "Passed" : "Failed",
      startTime: now,
      endTime: now,
      timeSpent: 0,
      submittedAt: now,
      accuracyScore: isCorrect ? 100 : 0,
      efficiencyScore: null,
      disciplineScore: null,
      totalScore: isCorrect ? 1 : 0,
      submissionType: "track_question",
    });

    await PracticeSubmission.create({
      userId: studentId,
      questionId: String(question._id),
      questionBankId: question._id,
      categoryId: question.categoryId || null,
      categoryType: "MCQ",
      track: (() => {
        const normalized = String(req.body.track || question.categoryTitle || question.trackType || "").toLowerCase();
        if (normalized.includes("dsa")) return "DSA";
        if (normalized.includes("sql")) return "SQL";
        if (normalized.includes("aptitude")) return "Aptitude";
        return "Core CS";
      })(),
      source,
      selectedAnswer,
      isCorrect,
      score: isCorrect ? 1 : 0,
      accuracy: isCorrect ? 100 : 0,
      submittedAt: now,
    });

    await Question.findByIdAndUpdate(question._id, { $inc: { solvedCount: isCorrect ? 1 : 0 } });

    return res.status(201).json({
      success: true,
      data: {
        submissionId: submission._id,
        questionId: String(question._id),
        categoryId: question.categoryId || null,
        categoryType: "MCQ",
        selectedAnswer,
        correctAnswer,
        isCorrect,
        score: submission.totalScore || 0,
        accuracy: submission.accuracyScore || 0,
        explanation: question.content?.explanation || "",
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      const questionId = req.params.questionId;
      const studentId = req.user._id;
      const question = await Question.findById(questionId).select("+content.correctOption").lean();
      const existing = await Submission.findOne({
        studentId,
        questionId,
        categoryType: "MCQ",
      }).sort({ submittedAt: -1 });

      if (existing && question) {
        const selectedAnswer = normalizeMcqAnswer(req.body.selectedAnswer ?? req.body.selectedOption);
        const correctAnswer = normalizeMcqAnswer(question.content?.correctOption);
        return res.status(200).json({
          success: true,
          duplicate: true,
          data: {
            submissionId: existing._id,
            questionId: String(question._id),
            categoryId: question.categoryId || null,
            categoryType: "MCQ",
            selectedAnswer,
            correctAnswer,
            isCorrect: existing.status === "Passed",
            score: existing.totalScore || 0,
            accuracy: existing.accuracyScore || 0,
            explanation: question.content?.explanation || "",
            submittedAt: existing.submittedAt,
          },
        });
      }
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get submission details
 * @route   GET /api/question-bank/submissions/:submissionId
 * @access  Private
 */
export const getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const studentId = req.user._id;

    const submission = await Submission.findById(submissionId)
      .populate("questionId", "title description")
      .populate("categoryId", "title categoryType");

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (submission.studentId.toString() !== studentId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    res.json({
      success: true,
      data: {
        submissionId: submission._id,
        questionId: submission.questionId,
        categoryId: submission.categoryId,
        status: submission.status,
        totalScore: submission.totalScore,
        accuracyScore: submission.accuracyScore,
        efficiencyScore: submission.efficiencyScore,
        disciplineScore: submission.disciplineScore,
        timeSpent: submission.timeSpent,
        runCount: submission.runCount,
        startTime: submission.startTime,
        submittedAt: submission.submittedAt,
        finalResults: submission.finalSubmissionResults,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { runRateLimiter, submitRateLimiter, globalRunRateLimiter };
