import mongoose from "mongoose";

const adminNotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ["all", "college", "batch", "custom"],
      default: "all",
    },
    targetValue: {
      type: String,
      default: "",
    },
    isGlobal: {
      type: Boolean,
      default: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["Sent", "Draft"],
      default: "Sent",
    },
  },
  { timestamps: true }
);

adminNotificationSchema.index({ createdAt: -1 });

export default mongoose.model("AdminNotification", adminNotificationSchema);
