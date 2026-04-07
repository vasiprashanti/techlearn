import mongoose from "mongoose";

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
      required: true,
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
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      required: true,
      trim: true,
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

trackTemplateSchema.index({ category: 1, status: 1 });

export default mongoose.model("TrackTemplate", trackTemplateSchema);
