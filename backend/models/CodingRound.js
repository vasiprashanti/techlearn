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
        inputDescription: { type: String, required: true },
        outputDescription: { type: String, required: true },
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
    challengeType: {
      type: String,
      enum: ["coding_round", "daily_challenge"],
      default: "coding_round",
      index: true,
    },
    trackTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackTemplate",
      default: null,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      default: null,
    },
    dayNumber: {
      type: Number,
      default: null,
    },
    trackType: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

codingRoundSchema.index({ college: 1 });
codingRoundSchema.index({ date: 1, duration: 1 });
codingRoundSchema.index({ challengeType: 1, trackTemplateId: 1, dayNumber: 1 });

const CodingRound = mongoose.model("CodingRound", codingRoundSchema);
export default CodingRound;
