import mongoose from "mongoose";

const practiceSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionId: {
      type: String,
      required: true,
      trim: true,
    },
    // Canonical Question Bank reference. Keep nullable during migration rollout.
    questionBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
      index: true,
      sparse: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
      sparse: true,
    },
    categoryType: {
      type: String,
      enum: ["Coding", "MCQ", "Notes", null],
      default: null,
      index: true,
      sparse: true,
    },
    track: {
      type: String,
      enum: ["DSA", "Core CS", "SQL", "Aptitude", "Company Based"],
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["practice", "track_template", "daily_challenge"],
      default: "practice",
      index: true,
    },
    selectedAnswer: {
      type: String,
      enum: ["A", "B", "C", "D", ""],
      default: "",
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    accuracy: {
      type: Number,
      default: 0,
    },
    testCaseResults: {
      type: [
        {
          index: Number,
          visible: { type: Boolean, default: true },
          passed: Boolean,
          expectedOutput: String,
          actualOutput: String,
          status: String,
          executionTime: Number,
        },
      ],
      default: [],
    },
    passedTestCases: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

practiceSubmissionSchema.index({ userId: 1, questionId: 1, submittedAt: -1 });
practiceSubmissionSchema.index({ userId: 1, track: 1, submittedAt: -1 });
practiceSubmissionSchema.index({ userId: 1, questionBankId: 1, source: 1, submittedAt: -1 }, { sparse: true });

export default mongoose.model("PracticeSubmission", practiceSubmissionSchema);
