import mongoose from "mongoose";

const programPerformanceRecordSchema = new mongoose.Schema(
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    programDay: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },
    source: {
      type: String,
      enum: ["Daily Task", "Daily Challenge"],
      required: true,
      index: true,
    },
    sourceKey: {
      type: String,
      required: true,
      trim: true,
    },
    sourceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    taskType: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
      index: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    categoryType: {
      type: String,
      default: "",
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      default: "General",
      index: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      default: "General",
      index: true,
    },
    subtopic: {
      type: String,
      required: true,
      trim: true,
      default: "General",
      index: true,
    },
    difficulty: {
      type: String,
      default: "",
      trim: true,
    },
    attempted: {
      type: Boolean,
      default: true,
    },
    correct: {
      type: Boolean,
      default: null,
    },
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    accuracy: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    timeSpentMs: {
      type: Number,
      default: null,
      min: 0,
    },
    attemptedAt: {
      type: Date,
      default: null,
    },
    sourceUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

programPerformanceRecordSchema.index(
  { programId: 1, sourceKey: 1 },
  { unique: true }
);
programPerformanceRecordSchema.index({ programId: 1, studentId: 1, programDay: 1 });
programPerformanceRecordSchema.index({ programId: 1, subject: 1, topic: 1, subtopic: 1 });

export default mongoose.model("ProgramPerformanceRecord", programPerformanceRecordSchema);
