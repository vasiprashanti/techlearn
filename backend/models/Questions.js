import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    title: String,

    description: String,

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
    },

    trackType: {
      type: String,
      enum: ["Core", "DSA", "SQL"],
    },

    visibleTestCases: Array,

    hiddenTestCases: Array,

    timeLimit: Number,

    memoryLimit: Number,

    version: {
      type: Number,
      default: 1,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);