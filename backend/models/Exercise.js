import mongoose from "mongoose";

const { Schema } = mongoose;

const exerciseSchema = new Schema(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String, // Title of the exercise
      required: false,
      default: "",
    },
    question: {
      type: String, // question text
      required: true,
    },
    expectedOutput: {
      type: String, // Expected code solution for user reference
      default: "",
    },
    expectedProgramOutput: {
      type: String, // Expected program output for validation
      default: "",
    },
    input: {
      type: String, // Input for testing the code
      default: "",
    },
  },
  { timestamps: true }
);

const Exercise = mongoose.model("Exercise", exerciseSchema);
export default Exercise;
