import mongoose from "mongoose";

const studentCodingSubmissionSchema = new mongoose.Schema(
  {
    codingRoundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodingRound",
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    problemScores: {
      type: Map,
      of: Number,
      default: {},
    },
    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },
    isRoundEnded: {
      type: Boolean,
      default: false,
    },
    roundEndedAt: {
      type: Date,
    },
    lastSubmissionAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const StudentCodingSubmission = mongoose.model(
  "StudentCodingSubmission",
  studentCodingSubmissionSchema
);

export default StudentCodingSubmission;
