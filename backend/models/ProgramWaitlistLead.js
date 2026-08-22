import mongoose from "mongoose";

const programWaitlistLeadSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
    },
    targetCompany: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["Waitlisted", "Contacted", "Enrolled", "Cancelled"],
      default: "Waitlisted",
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

programWaitlistLeadSchema.index({ programId: 1, email: 1 }, { unique: true });

export default mongoose.model("ProgramWaitlistLead", programWaitlistLeadSchema);
