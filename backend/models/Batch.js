import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
      index: true,
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
      type: String, // "09:00"
      required: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Active", "Expired", "Archived"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

batchSchema.index({ collegeId: 1 });

export default mongoose.model("Batch", batchSchema);