import mongoose from "mongoose";

const codingRoundSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    college: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    problems: [
      {
        // Optional reference to question bank question
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: false },
        
        problemTitle: { type: String, required: true },
        description: { type: String, required: true },
        difficulty: {
          type: String,
          enum: ["Easy", "Medium", "Hard"],
          default: "Medium",
        },
        inputDescription: { type: String, required: true },
        outputDescription: { type: String, required: true },
        starterCode: { type: String }, // From question bank
        referenceSolution: { type: String }, // From question bank
        constraints: { type: String }, // From question bank
        visibleTestCases: [
          {
            input: { type: String, required: true },
            expectedOutput: { type: String, required: true },
          },
        ],
        hiddenTestCases: [
          {
            input: { type: String, required: true },
            expectedOutput: { type: String, required: true },
          },
        ],
        fileUrl: { type: String }, // For optional file upload
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    endTime: {
      type: Date,
      required: false,
    },
    linkId: {
      type: String,
      unique: true,
      required: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

codingRoundSchema.index({ college: 1 });
codingRoundSchema.index({ date: 1, duration: 1 });

const CodingRound = mongoose.model("CodingRound", codingRoundSchema);
export default CodingRound;
