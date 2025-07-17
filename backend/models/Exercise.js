import mongoose from "mongoose";

const { Schema } = mongoose;

const exerciseSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  topicTitle: {
    type: String,
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
}, { timestamps: true });

const Exercise = mongoose.model("Exercise", exerciseSchema);
export default Exercise;
