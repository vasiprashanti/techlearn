import mongoose from "mongoose";

const practiceSubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    questionId: {
      type: String,
      required: true,
      trim: true,
    },
    track: {
      type: String,
      enum: ["DSA", "Core CS", "SQL", "Aptitude"],
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
      default: false,
    },
    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

practiceSubmissionSchema.index({ userId: 1, questionId: 1 }, { unique: true });
practiceSubmissionSchema.index({ userId: 1, track: 1 });
practiceSubmissionSchema.index({ track: 1, attemptedAt: -1 });

export default mongoose.model("PracticeSubmission", practiceSubmissionSchema);
