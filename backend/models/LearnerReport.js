import mongoose from "mongoose";

const learnerReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },
    kind: {
      type: String,
      enum: ["program", "practice", "assessment"],
      required: true,
      index: true,
    },
    reportKey: {
      type: String,
      required: true,
      trim: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramAssignment",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "Completed",
      trim: true,
    },
    score: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    sourceUpdatedAt: {
      type: Date,
      default: null,
    },
    snapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

learnerReportSchema.index({ userId: 1, kind: 1, reportKey: 1 }, { unique: true });
learnerReportSchema.index({ userId: 1, kind: 1, generatedAt: -1 });

export default mongoose.model("LearnerReport", learnerReportSchema);
