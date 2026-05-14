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
    startDate: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
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

    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

// 🔐 Hash the password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔍 Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
