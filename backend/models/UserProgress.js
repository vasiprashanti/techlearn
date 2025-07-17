import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // XP per course for quizzes
    courseXP: {
      type: Map,
      of: Number,
      default: {},
    },

    // XP per course for exercises
    exerciseXP: {
      type: Map,
      of: Number,
      default: {},
    },

    // Total XP from quizzes
    totalCourseXP: {
      type: Number,
      default: 0,
    },

    // Total XP from exercises
    totalExerciseXP: {
      type: Number,
      default: 0,
    },

    // Completed exercises
    completedExercises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
      },
    ],
    completedQuizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],

    // Track answered questions per quiz
    answeredQuestions: {
      type: Map,
      of: [mongoose.Schema.Types.ObjectId],
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserProgress", userProgressSchema);
