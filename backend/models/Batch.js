import mongoose from "mongoose";

export const BATCH_STATUS = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  EXPIRED: "Expired",
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
  },
  { timestamps: true }
);

export default mongoose.model("Batch", batchSchema);
