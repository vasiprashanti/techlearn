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
        problemTitle: { type: String, required: true },
        description: { type: String, required: true },
        difficulty: {
          type: String,
          enum: ["Easy", "Medium", "Hard"],
          default: "Medium",
        },
        inputDescription: { type: String },
        expectedOutput: [
          {
            input: { type: String },
            output: { type: String },
          },
        ],
        hiddenTestCases: [
          {
            input: { type: String },
            output: { type: String },
          },
        ],
        fileUrl: { type: String }, // For optional file upload
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
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
