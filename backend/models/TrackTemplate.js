import mongoose from "mongoose";

const taskAssignmentSchema = new mongoose.Schema(
  {
    taskType: {
      type: String,
      enum: ["Coding", "SQL", "MCQ", "Aptitude", "Core CS", "Debugging"],
      required: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    xpValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Published",
    },
  },
  { _id: false }
);

const trackTemplateDaySchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: false,
    },
    tasks: {
      type: [taskAssignmentSchema],
      default: [],
    },
  },
  { _id: false }
);

const versionHistorySchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    changedBy: {
      type: String,
      default: "System",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const trackTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    trackType: {
      type: String,
      enum: ["Daily Challenge", "Daily Task"],
      default: "Daily Challenge",
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
    },
    iconKey: {
      type: String,
      default: "code",
    },
    dayAssignments: {
      type: [trackTemplateDaySchema],
      default: [],
    },
    versionHistory: {
      type: [versionHistorySchema],
      default: [{ version: 1, label: "v1 - Initial template", changedBy: "System" }],
    },
  },
  { timestamps: true }
);

trackTemplateSchema.set("optimisticConcurrency", true);

trackTemplateSchema.index({ category: 1, status: 1 });

export default mongoose.model("TrackTemplate", trackTemplateSchema);
