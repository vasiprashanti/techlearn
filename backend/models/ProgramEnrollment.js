import mongoose from "mongoose";

const programEnrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Paused"],
      default: "Active",
    },
    accessTier: {
      type: String,
      enum: ["Free", "Member"],
      default: "Free",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ["onboarding", "admin", "preference_update"],
      default: "onboarding",
    },
  },
  { timestamps: true }
);

// Prevent duplicate enrollment for the same user in the same program
programEnrollmentSchema.index({ userId: 1, programId: 1 }, { unique: true });

const ProgramEnrollment = mongoose.model("ProgramEnrollment", programEnrollmentSchema);

export default ProgramEnrollment;
