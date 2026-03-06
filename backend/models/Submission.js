import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
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
      ref: "Track",
      required: true,
    },

    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    workingDay: Number,

    runCount: {
      type: Number,
      default: 0,
    },

    accuracyScore: Number,
    efficiencyScore: Number,
    disciplineScore: Number,

    totalScore: Number,

    executionTime: Number,

    status: {
      type: String,
      enum: ["Passed", "Failed", "Timeout", "Error"],
    },

    submittedAt: Date,
  },
  { timestamps: true }
);

submissionSchema.index({ studentId: 1, workingDay: 1 });

export default mongoose.model("Submission", submissionSchema);