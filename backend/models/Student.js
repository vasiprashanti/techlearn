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

    programId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
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
    degree: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
    },
    graduationYear: {
      type: Number,
      default: null,
    },

    primaryTrack: {
      type: String,
      trim: true,
      default: "",
    },
    programSelection: {
      type: String,
      enum: ["Skill", "Placement", "skill", "placement", "Placement Sprint", "Full Stack Project Program", "Both"],
      default: "Placement",
    },

    learningGoal: {
      type: String,
      default: "",
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    targetRole: {
      type: String,
      default: "",
    },
    otherTargetRole: {
      type: String,
      default: "",
    },
    placementCategory: {
      type: String,
      default: "",
    },
    targetCompanies: [
      {
        type: String,
        trim: true,
      },
    ],
    placementTimeline: {
      type: String,
      default: "",
    },
    learningPath: {
      type: String,
      default: "",
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    onboardingCompletedAt: {
      type: Date,
      default: null,
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

    accuracy: {
      type: Number,
      default: 0,
    },

    overallAccuracy: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

studentSchema.index({ collegeId: 1, status: 1, name: 1 });
studentSchema.index({ name: 1 });
studentSchema.index({ rollNo: 1 }, { sparse: true });

export default mongoose.model("Student", studentSchema);
