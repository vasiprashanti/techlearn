import mongoose from "mongoose";

const studentCodingQuestionSubmissionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: "Track", required: false, index: true },

    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true, index: true },

    startTime: { type: Date, required: true },
    endTime: { type: Date },

    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }, // 0-100

    attemptStatus: {
      type: String,
      enum: ["started", "submitted", "passed", "failed"],
      default: "submitted",
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Prevent duplicate active submission records for same student+question+batch
studentCodingQuestionSubmissionSchema.index(
  { studentId: 1, questionId: 1, batchId: 1 },
  { unique: false }
);

export default mongoose.model(
  "StudentCodingQuestionSubmission",
  studentCodingQuestionSubmissionSchema
);

