import mongoose from "mongoose";

const { Schema } = mongoose;

const exerciseSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    question: {
      type: String, // question text
      required: true,
    },
    realLifeApplication: {
      type: String, // real-life context
    },
    exerciseAnswers: {
      type: String, // Full code in string/markdown format
    },
    expectedOutput: {
      type: String,
      default: "",
    },
    input: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Exercise = mongoose.model("Exercise", exerciseSchema);
export default Exercise;
