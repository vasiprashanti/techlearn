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
      type: Map,
      of: Number,
      default: {},
    },
    totalExerciseXP: {
      type: Map,
      of: Number,
      default: {},
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
