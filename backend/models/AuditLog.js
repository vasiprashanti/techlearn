import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    verb: {
      type: String,
      trim: true,
      required: true,
    },
    entityType: {
      type: String,
      trim: true,
      required: true,
    },
    entityId: {
      type: String,
      default: "",
    },
    action: {
      type: String,
      trim: true,
      required: true,
    },
    detail: {
      type: String,
      trim: true,
      default: "",
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    actorName: {
      type: String,
      trim: true,
      default: "System",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ entityType: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
