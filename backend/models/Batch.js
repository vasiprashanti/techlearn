import mongoose from "mongoose";

export const BATCH_STATUS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const batchSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true, // All foreign keys must be indexed
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    assignedTrack: {
      type: String,
      trim: true,
      default: "",
    },
    assignedTrackTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackTemplate",
      default: null,
    },
    assignedTrackTemplateAt: {
      type: Date,
      default: null,
    },
    assignedDailyChallengeTrack: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackTemplate",
      default: null,
    },
    assignedDailyChallengeTrackAt: {
      type: Date,
      default: null,
    },
    assignedDailyTaskTrack: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackTemplate",
      default: null,
    },
    assignedDailyTaskTrackAt: {
      type: Date,
      default: null,
    },
    assignedTrackTemplateIds: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TrackTemplate",
        },
      ],
      default: [],
    },
    attachedCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    supportingCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      }
    ],
    batchSize: {
      type: Number,
      min: 1,
      default: null,
    },
    releaseTime: {
      type: String, // e.g., "00:00", stored typically as string for daily time
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BATCH_STATUS),
      default: BATCH_STATUS.DRAFT,
      required: true,
    },
    programSelection: {
      type: String,
      enum: ["Placement Sprint", "Full Stack Project Program", "Both"],
      default: "Placement Sprint",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Batch", batchSchema);
