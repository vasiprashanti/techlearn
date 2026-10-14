import mongoose from "mongoose";

const adminReadStateSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ["student", "lead", "waitlist"],
      default: "student",
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      default: "",
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound unique index so one admin reading one entity creates exactly one state record
adminReadStateSchema.index({ adminId: 1, entityId: 1 }, { unique: true });

const AdminReadState = mongoose.model("AdminReadState", adminReadStateSchema);

export default AdminReadState;
