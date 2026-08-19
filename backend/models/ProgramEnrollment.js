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
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    // A program enrollment may be individual (null) or cohort based.
    // This is deliberately stored on the enrollment instead of relying on
    // Student.batchId, because one learner can take multiple programs with
    // different schedules.
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "Paused"],
      default: "Active",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completionAccuracy: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
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
    // The learner's own Day 1 anchor. It remains stable if a learner is
    // later moved onto a batch schedule and is used again if the batch is
    // removed.
    individualStartDate: {
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
programEnrollmentSchema.index({ studentId: 1, programId: 1 });

const ProgramEnrollment = mongoose.model("ProgramEnrollment", programEnrollmentSchema);

export default ProgramEnrollment;
