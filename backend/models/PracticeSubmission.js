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
      index: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

practiceSubmissionSchema.index({ userId: 1, questionId: 1, submittedAt: -1 });
practiceSubmissionSchema.index({ userId: 1, track: 1, submittedAt: -1 });

export default mongoose.model("PracticeSubmission", practiceSubmissionSchema);
