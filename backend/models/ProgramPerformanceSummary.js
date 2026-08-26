import mongoose from "mongoose";

const programPerformanceSummarySchema = new mongoose.Schema(
  {
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    programDay: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
    },
    subtopic: {
      type: String,
      required: true,
      trim: true,
    },
    summaryKey: {
      type: String,
      required: true,
      trim: true,
    },
    questionsAttempted: {
      type: Number,
      default: 0,
      min: 0,
    },
    scoredQuestions: {
      type: Number,
      default: 0,
      min: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
      min: 0,
    },
    accuracy: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    classification: {
      type: String,
      enum: ["Weak", "Average", "Strong", "Unclassified"],
      default: "Unclassified",
      index: true,
    },
    sources: {
      type: [String],
      default: [],
    },
    firstAttemptedAt: {
      type: Date,
      default: null,
    },
    lastAttemptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

programPerformanceSummarySchema.index(
  { programId: 1, summaryKey: 1 },
  { unique: true }
);
programPerformanceSummarySchema.index({ programId: 1, studentId: 1, programDay: 1 });
programPerformanceSummarySchema.index({ programId: 1, classification: 1 });

export default mongoose.model("ProgramPerformanceSummary", programPerformanceSummarySchema);
