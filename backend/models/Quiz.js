import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
        },
        options: [
          {
            type: String,
            required: true,
          },
        ],
        correctAnswer: {
          type: Number,
          required: true,
        },
        explanation: {
          type: String,
          required: false,
        },
      },
    ],
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);
export default Quiz;
