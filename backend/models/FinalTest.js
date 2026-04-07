import mongoose from "mongoose";

const finalTestQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const finalTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    passingPercentage: {
      type: Number,
      default: 70,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    timeLimitEnabled: {
      type: Boolean,
      default: false,
    },
    questions: {
      type: [finalTestQuestionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

finalTestSchema.index({ courseName: 1 });

export default mongoose.model("FinalTest", finalTestSchema);
