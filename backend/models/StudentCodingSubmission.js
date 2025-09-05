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
    autoEnded: {
      type: Boolean,
      default: false, // Flag to indicate if round was auto-ended due to time expiry
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
