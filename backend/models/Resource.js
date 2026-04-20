import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Courses", "Important Topics", "Resume Templates"],
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["PDF", "Sheet", "Video", "Link"],
      required: true,
    },
    url: {
      type: String,
      default: "",
    },
    views: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

resourceSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model("Resource", resourceSchema);
