import mongoose from "mongoose";

const dailyChallengeAttemptSchema = new mongoose.Schema(
  {
    codingRoundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CodingRound",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
      index: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      required: true,
      index: true,
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
    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["otp_verified", "started", "submitted", "ended", "auto_submitted", "expired"],
      default: "otp_verified",
      index: true,
    },
    accessSource: {
      type: String,
      enum: ["student", "guest"],
      default: "student",
    },
    otpVerifiedAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    timerDurationMinutes: {
      type: Number,
      required: true,
      default: 30,
    },
    codingSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudentCodingSubmission",
      default: null,
    },
    finalSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Submission",
      default: null,
    },
    finalLanguage: {
      type: String,
      default: "",
      trim: true,
    },
    finalCode: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

dailyChallengeAttemptSchema.index({ codingRoundId: 1, studentEmail: 1 }, { unique: true });
dailyChallengeAttemptSchema.index({ batchId: 1, trackId: 1, questionId: 1 });

export default mongoose.model("DailyChallengeAttempt", dailyChallengeAttemptSchema);
