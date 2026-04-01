import mongoose from "mongoose";

const testCaseSchema = new mongoose.Schema(
  {
    input: { type: String, default: "" },
    output: { type: String, default: "" },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Easy",
    },

    trackType: {
      type: String,
      default: "Core",
      trim: true,
    },

    categorySlug: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    categoryTitle: {
      type: String,
      trim: true,
      default: "",
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    inputFormat: {
      type: String,
      default: "",
    },

    outputFormat: {
      type: String,
      default: "",
    },

    visibleTestCases: [testCaseSchema],

    hiddenTestCases: [testCaseSchema],

    timeLimit: Number,

    memoryLimit: Number,

    status: {
      type: String,
      enum: ["Active", "Draft", "Archived"],
      default: "Active",
    },

    solvedCount: {
      type: Number,
      default: 0,
    },

    referenceLanguage: {
      type: String,
      default: "C++",
    },

    solutionCode: {
      type: String,
      default: "",
    },

    editorial: {
      type: String,
      default: "",
    },

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

questionSchema.index({ categorySlug: 1, status: 1 });
questionSchema.index({ trackType: 1 });

export default mongoose.model("Question", questionSchema);
