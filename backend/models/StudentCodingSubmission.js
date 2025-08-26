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
    solutions: [
      {
        problemIndex: {
          type: Number,
          required: true,
        },
        submittedCode: {
          type: String,
          required: true,
        },
        language: {
          type: String,
          required: true,
        },
        testCasesPassed: {
          type: Number,
          default: 0,
        },
        totalTestCases: {
          type: Number,
          default: 0,
        },
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
    ],
    totalScore: {
      type: Number,
      required: true,
      default: 0,
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
