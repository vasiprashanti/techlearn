import mongoose from "mongoose";

const executionQueueItemSchema = new mongoose.Schema(
  {
    queueId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
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
    userTier: {
      type: String,
      enum: ["guest", "registered", "free_enrolled", "paid_enrolled"],
      required: true,
    },
    activityType: {
      type: String,
      enum: ["assessment", "daily_task", "compiler", "practice", "challenge"],
      required: true,
    },
    priorityTier: {
      type: String,
      enum: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"],
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "processing", "completed", "failed", "rejected", "expired"],
      default: "waiting",
      index: true,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    enqueuedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for priority selection: waiting status, priority tier (P1 before P8), and FIFO (enqueuedAt asc)
executionQueueItemSchema.index({ status: 1, priorityTier: 1, enqueuedAt: 1 });

export default mongoose.models.ExecutionQueueItem ||
  mongoose.model("ExecutionQueueItem", executionQueueItemSchema);
