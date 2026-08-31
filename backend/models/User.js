import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required() {
        return this.authProvider === "local";
      },
      default: "",
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "firebase"],
      default: "local",
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
    startDate: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Server-managed permissions used by admin APIs. The browser never gets
    // to choose these values; they are read from the authenticated User row.
    permissions: {
      type: [String],
      default: [],
    },
    isClub: {
      type: Boolean,
      default: false,
    },
    transactionId: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: "",
    },
    photoUrl: {
      type: String,
      default: "",
    },

    mobileNumber: {
      type: String,
      default: "",
    },
    collegeName: {
      type: String,
      default: "",
    },
    degreeBranch: {
      type: String,
      default: "",
    },
    graduationYear: {
      type: Number,
      default: null,
    },
    targetRole: {
      type: String,
      default: "",
      trim: true,
    },

    otherTargetRole: {
      type: String,
      default: "",
      trim: true,
    },

    targetCompanies: {
      type: [String],
      default: [],
    },

    skills: {
      type: [String],
      default: [],
    },
    programSelection: {
      type: String,
      enum: ["Placement Sprint", "Full Stack Project Program", "Both"],
      default: "Placement Sprint",
    },
    placementReadiness: {
      type: String,
      enum: ["Just Starting", "Preparing Inconsistently", "Actively Preparing", "Already Attending Interviews", ""],
      default: "",
    },
    dailyCommitment: {
      type: String,
      enum: ["Yes", "No", ""],
      default: "",
    },
    declarationAccepted: {
      type: Boolean,
      default: false,
    },

    degree: {
      type: String,
      default: "",
    },
    branch: {
      type: String,
      default: "",
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
    personalizedDetail: {
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

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// 🔐 Hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$") || this.password.startsWith("$2y$")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔍 Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
