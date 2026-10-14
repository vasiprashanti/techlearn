import mongoose from "mongoose";

const executionUsageAuditSchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ["user", "device"],
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      index: true,
    },
    oldEffectiveAllowance: {
      type: Number,
      required: true,
    },
    newEffectiveAllowance: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const dailyExecutionUsageSchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ["user", "device"],
      required: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    dateKey: {
      type: String, // YYYY-MM-DD in Asia/Kolkata (IST)
      required: true,
      index: true,
    },
    configuredMin: {
      type: Number,
      required: true,
      default: 10,
    },
    configuredMax: {
      type: Number,
      required: true,
      default: 20,
    },
    effectiveAllowance: {
      type: Number,
      required: true,
      default: 10,
    },
    usedCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    userTier: {
      type: String,
      enum: ["guest", "registered", "free_enrolled", "paid_enrolled"],
      default: "guest",
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

dailyExecutionUsageSchema.index({ ownerType: 1, ownerId: 1, dateKey: 1 }, { unique: true });

export const ExecutionUsageAudit =
  mongoose.models.ExecutionUsageAudit ||
  mongoose.model("ExecutionUsageAudit", executionUsageAuditSchema);

export const DailyExecutionUsage =
  mongoose.models.DailyExecutionUsage ||
  mongoose.model("DailyExecutionUsage", dailyExecutionUsageSchema);
