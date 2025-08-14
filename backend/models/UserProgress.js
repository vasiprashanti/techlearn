import mongoose from "mongoose";
const userProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    courseXP: {
      type: Map,
      of: Number,
      default: {},
    },
    exerciseXP: {
      type: Map,
      of: Number,
      default: {},
    },

    totalCourseXP: {
      type: Number,
      default: 0,
    },
    totalExerciseXP: {
      type: Number,
      default: 0,
    },

    completedExercises: [
      {
        exerciseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Exercise",
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    completedQuizzes: [
      {
        quizId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quiz",
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    answeredQuestions: {
      type: Map,
      of: [mongoose.Schema.Types.ObjectId],
      default: {},
    },

    // Track answered checkpoint MCQs per notesId
    answeredCheckpointMcqs: {
      type: Map,
      of: [String], // Array of checkpointMcqId
      default: {},
    },

    startedProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("UserProgress", userProgressSchema);
