import mongoose from "mongoose";

// Test case result subdocument for final submission evaluation
const testCaseResultSchema = new mongoose.Schema(
  {
    index: Number,
    visible: { type: Boolean, default: true },
    passed: Boolean,
    executionTime: Number,    // milliseconds
    memoryUsed: Number,       // MB
    expectedOutput: String,
    actualOutput: String,     // Only populated for failed tests
  },
  { _id: false }
);

// Final submission evaluation results subdocument
const finalSubmissionResultsSchema = new mongoose.Schema(
  {
    passedTestCases: Number,
    totalTestCases: Number,
    testCaseDetails: [testCaseResultSchema],
    compileOutput: String,
    runtimeError: String,
    evaluatedAt: Date,
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    // Existing fields (unchanged for backward compatibility)
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },

    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      default: null,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    codingRoundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodingRound",
      default: null,
    },

    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyChallengeAttempt",
      default: null,
    },

    workingDay: Number,

    runCount: {
      type: Number,
      default: 0,
    },

    accuracyScore: Number,
    efficiencyScore: Number,
    disciplineScore: Number,

    totalScore: Number,
    xpEarned: {
      type: Number,
      default: 0,
    },

    executionTime: Number,
    memoryUsed: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Passed", "Failed", "PartialPass", "Timeout", "CompileError", "RuntimeError", "Error", "Pending"],
      default: "Pending",
    },

    challengeType: {
      type: String,
      enum: ["track_question", "daily_challenge"],
      default: "track_question",
    },

    submittedAt: Date,

    // ===== NEW FIELDS FOR QUESTION BANK INTEGRATION =====

    // Question Bank references
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
      sparse: true,
    },

    categoryType: {
      type: String,
      enum: ["Coding", "MCQ", "Notes"],
      default: null,
      sparse: true,
    },

    // Submission lifecycle (Coding-specific)
    startTime: {
      type: Date,
      default: null,
      sparse: true,
    },

    endTime: {
      type: Date,
      default: null,
      sparse: true,
    },

    timeSpent: {
      type: Number,          // milliseconds from start to final submit
      default: null,
      sparse: true,
    },

    // Submission code details (Coding-specific)
    submittedCode: {
      type: String,          // Final submitted code
      default: null,
      sparse: true,
    },

    language: {
      type: String,          // e.g., "cpp", "python", "java"
      default: null,
      sparse: true,
    },

    languageId: {
      type: Number,          // Judge0 language ID
      default: null,
      sparse: true,
    },

    // Question versioning (for post-edit fairness)
    questionVersionId: {
      type: Number,          // Question.version at submission time
      default: null,
      sparse: true,
    },

    contentVersionId: {
      type: Number,          // Question.content.contentVersion at submission time
      default: null,
      sparse: true,
    },

    // Snapshot fields (immutable point-in-time copy)
    snapshotConstraints: {
      type: String,
      default: null,
      sparse: true,
    },

    snapshotVisibleTestCases: {
      type: [
        {
          input: String,
          output: String,
          explanation: String,
        },
      ],
      default: [],
      sparse: true,
    },

    snapshotHiddenTestCases: {
      type: [
        {
          input: String,
          output: String,
        },
      ],
      default: [],
      sparse: true,
    },

    snapshotTimeLimit: {
      type: Number,          // milliseconds
      default: null,
      sparse: true,
    },

    snapshotMemoryLimit: {
      type: Number,          // MB
      default: null,
      sparse: true,
    },

    // Final submission evaluation (only populated on successful submit)
    finalSubmissionResults: {
      type: finalSubmissionResultsSchema,
      default: null,
      sparse: true,
    },

    // Submission type (for future MCQ/Notes support)
    submissionType: {
      type: String,
      enum: ["coding", "track_question", "daily_challenge"],
      default: "track_question",
    },
  },
  { timestamps: true }
);

// Compound indexes for common filter combinations (existing)
submissionSchema.index({ studentId: 1, workingDay: 1 });
submissionSchema.index({ batchId: 1, workingDay: 1 });
submissionSchema.index({ batchId: 1, trackId: 1 });
submissionSchema.index(
  { attemptId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      attemptId: { $type: "objectId" },
    },
  }
);

// Standalone indexes for sort and single-field filters (existing)
submissionSchema.index({ workingDay: 1 });
submissionSchema.index({ submittedAt: -1 });

// NEW indexes for Question Bank queries
submissionSchema.index({ categoryId: 1, status: 1 }, { sparse: true });
submissionSchema.index({ studentId: 1, categoryId: 1 }, { sparse: true });
submissionSchema.index({ batchId: 1, categoryId: 1 }, { sparse: true });
// questionVersionId already has sparse: true in field definition
submissionSchema.index({ submissionType: 1, submittedAt: -1 }, { sparse: true });
// Ensure MCQ retries and concurrent duplicates collapse to a single canonical submission per student/question.
submissionSchema.index(
  { studentId: 1, questionId: 1, categoryType: 1 },
  {
    unique: true,
    partialFilterExpression: {
      categoryType: "MCQ",
      studentId: { $type: "objectId" },
      questionId: { $type: "objectId" },
    },
  }
);

export default mongoose.model("Submission", submissionSchema);
