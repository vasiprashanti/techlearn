import mongoose from "mongoose";

const globalExecutionReservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    dateKey: {
      type: String, // YYYY-MM-DD IST
      required: true,
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
    activityType: {
      type: String,
      required: true,
    },
    priorityTier: {
      type: String,
      enum: ["P1", "P2", "P3", "P4", "P5", "P6", "P7", "P8"],
      required: true,
    },
    executionsReserved: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      enum: ["reserved", "in_flight", "completed", "failed", "released", "queued", "expired"],
      default: "reserved",
      index: true,
    },
    idempotencyKey: {
      type: String,
      index: true,
      sparse: true,
    },
    errorDetails: {
      type: String,
      default: "",
    },
    reservedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const globalExecutionDayStatsSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String, // YYYY-MM-DD IST
      required: true,
      unique: true,
      index: true,
    },
    maxBudget: {
      type: Number,
      default: 1900,
    },
    reservedCount: {
      type: Number,
      default: 0,
    },
    inFlightCount: {
      type: Number,
      default: 0,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
    failedCount: {
      type: Number,
      default: 0,
    },
    releasedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const GlobalExecutionReservation =
  mongoose.models.GlobalExecutionReservation ||
  mongoose.model("GlobalExecutionReservation", globalExecutionReservationSchema);

export const GlobalExecutionDayStats =
  mongoose.models.GlobalExecutionDayStats ||
  mongoose.model("GlobalExecutionDayStats", globalExecutionDayStatsSchema);
