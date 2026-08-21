import mongoose from "mongoose";

const programWaitlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
      enum: ["Waiting", "Contacted", "Enrolled", "Cancelled"],
      default: "Waiting",
      index: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

programWaitlistSchema.index({ userId: 1, programId: 1 }, { unique: true });

export default mongoose.model("ProgramWaitlist", programWaitlistSchema);
