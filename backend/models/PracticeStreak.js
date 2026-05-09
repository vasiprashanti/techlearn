import mongoose from "mongoose";

const practiceStreakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastSolvedAt: {
      type: Date,
      default: null,
    },
    lastSolvedDate: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("PracticeStreak", practiceStreakSchema);
