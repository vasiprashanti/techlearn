import mongoose from "mongoose";

const pricingExitFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // Anonymous visitors can submit the contextual onboarding exit survey
      // before they have created an account. Keep the feedback record even
      // when it cannot yet be linked to a User or Student.
      default: null,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
    },
    selectedPlan: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    customReason: {
      type: String,
      trim: true,
      default: "",
    },
    source: {
      type: String,
      enum: ["pricing", "contextual_onboarding"],
      default: "pricing",
      index: true,
    },
    targetRole: {
      type: String,
      trim: true,
      default: "",
    },
    opportunity: {
      type: String,
      trim: true,
      default: "",
    },
    targetCompanies: {
      type: [String],
      default: [],
    },
    skill: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const PricingExitFeedback = mongoose.model(
  "PricingExitFeedback",
  pricingExitFeedbackSchema
);

export default PricingExitFeedback;
