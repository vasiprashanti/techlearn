import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },

    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
      required: true,
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

    executionTime: Number,

    status: {
      type: String,
      enum: ["Passed", "Failed", "Timeout", "Error", "Pending"],
    },

    challengeType: {
      type: String,
      enum: ["track_question", "daily_challenge"],
      default: "track_question",
    },

    submittedAt: Date,
  },
  { timestamps: true }
);

// Compound indexes for common filter combinations
submissionSchema.index({ studentId: 1, workingDay: 1 });
submissionSchema.index({ batchId: 1, workingDay: 1 });
submissionSchema.index({ batchId: 1, trackId: 1 });
submissionSchema.index({ attemptId: 1 }, { unique: true, sparse: true });

// Standalone indexes for sort and single-field filters
// Note: { batchId: 1 } is intentionally omitted — the compound index above
// serves as a prefix cover for batchId-only queries.
submissionSchema.index({ workingDay: 1 });
submissionSchema.index({ submittedAt: -1 });

export default mongoose.model("Submission", submissionSchema);
