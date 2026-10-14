import mongoose from "mongoose";

const deviceRegistrationSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipHistory: [{ type: String }],
    userAgent: { type: String, default: "" },
    fingerprint: { type: String, default: "" },
    associatedUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }],
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false },
    suspiciousFlags: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.DeviceRegistration || mongoose.model("DeviceRegistration", deviceRegistrationSchema);
