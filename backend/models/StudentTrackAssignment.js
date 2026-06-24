import mongoose from "mongoose";

const studentTrackAssignmentSchema = new mongoose.Schema(
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
      index: true,
    },
    trackTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackTemplate",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Draft"],
      default: "Active",
      index: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    activatedAt: {
      type: Date,
      default: Date.now,
    },
    deactivatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

studentTrackAssignmentSchema.index(
  { studentId: 1 },
  { unique: true, partialFilterExpression: { status: "Active" } }
);
studentTrackAssignmentSchema.index(
  { studentId: 1, trackTemplateId: 1 },
  { unique: true }
);

export default mongoose.model("StudentTrackAssignment", studentTrackAssignmentSchema);
