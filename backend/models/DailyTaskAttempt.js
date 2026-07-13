import mongoose from "mongoose";

const taskProgressSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    taskType: {
      type: String,
      enum: ["Coding", "SQL", "MCQ", "Aptitude", "Core CS", "Debugging"],
      required: true,
    },
    xpValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    xpEarned: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Not Started", "In Progress", "Completed"],
      default: "Not Started",
    },
    hintsUsed: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    selectedOption: {
      type: String,
      default: "",
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    attempted: {
      type: Boolean,
      default: false,
    },
    code: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "",
    },
    accuracy: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const dailyTaskAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
    },
    trackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackTemplate",
      required: true,
    },
    dayNumber: {
      type: Number,
      required: true,
    },
    tasksProgress: {
      type: [taskProgressSchema],
      default: [],
    },
    isFullyCompleted: {
      type: Boolean,
      default: false,
    },
    earnedBonus: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

dailyTaskAttemptSchema.index({ userId: 1, batchId: 1, trackId: 1, dayNumber: 1 }, { unique: true });

export default mongoose.model("DailyTaskAttempt", dailyTaskAttemptSchema);
