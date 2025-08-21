import mongoose from "mongoose";

const studentMcqSubmissionSchema = new mongoose.Schema(
  {
    collegeMcqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollegeMcq",
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    answers: [
      {
        questionIndex: {
          type: Number,
          required: true,
        },
        selectedOption: {
          type: Number,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const StudentMcqSubmission = mongoose.model(
  "StudentMcqSubmission",
  studentMcqSubmissionSchema
);
export default StudentMcqSubmission;
