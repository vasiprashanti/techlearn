import mongoose from "mongoose";

const issuedCertificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    issuedOn: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Active", "Revoked"],
      default: "Active",
    },
  },
  { timestamps: true }
);

issuedCertificateSchema.index({ status: 1, issuedOn: -1 });

export default mongoose.model("IssuedCertificate", issuedCertificateSchema);
