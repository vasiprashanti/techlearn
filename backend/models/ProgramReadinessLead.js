import mongoose from "mongoose";

const programReadinessLeadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProgramAssignment",
      default: null,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    learningGoal: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Started", "Completed", "Converted", "Declined"],
      default: "Started",
      index: true,
    },
    score: {
      type: Number,
      default: null,
      min: 0,
    },
    accuracy: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    convertedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

programReadinessLeadSchema.index({ userId: 1, programId: 1 }, { unique: true });

export default mongoose.model("ProgramReadinessLead", programReadinessLeadSchema);
