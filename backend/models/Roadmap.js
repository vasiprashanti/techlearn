import mongoose from "mongoose";

const roadmapSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    markdownBody: {
      type: String,
      required: true,
    },
    assignedBatchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
      },
    ],
    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

roadmapSchema.index({ assignedBatchIds: 1, status: 1, updatedAt: -1 });

export default mongoose.model("Roadmap", roadmapSchema);
