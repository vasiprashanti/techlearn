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
    questionType: {
      type: String,
      enum: ["Coding", "MCQ", "Notes"],
      default: "Coding",
      trim: true,
      index: true,
    },
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
      default: "",
      trim: true,
    },

    categorySlug: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },

    /** Canonical link to QuestionCategory — stable reference for tracks, practice, analytics */
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionCategory",
      default: null,
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

    mcqOptions: {
      type: [String],
      default: [],
    },

    mcqCorrectIndex: {
      type: Number,
      default: null,
    },

    mcqExplanation: {
      type: String,
      default: "",
    },

    notesMarkdown: {
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
questionSchema.index({ categoryId: 1, status: 1 });
questionSchema.index({ trackType: 1 });

export default mongoose.model("Question", questionSchema);
