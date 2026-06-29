import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
      required: true,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    rollNo: {
      type: String,
    },

    primaryTrack: {
      type: String,
      trim: true,
      default: "",
    },
    programSelection: {
      type: String,
      enum: ["Placement Sprint", "Full Stack Project Program", "Both"],
      default: "Placement Sprint",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "Suspended"],
      default: "Active",
    },

    streak: {
      type: Number,
      default: 0,
    },

    longestStreak: {
      type: Number,
      default: 0,
    },

    testsTaken: {
      type: Number,
      default: 0,
    },

    isGuest: {
      type: Boolean,
      default: false,
    },

    lastActiveAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

studentSchema.index({ collegeId: 1, status: 1, name: 1 });
studentSchema.index({ name: 1 });
studentSchema.index({ rollNo: 1 }, { sparse: true });

export default mongoose.model("Student", studentSchema);
