import crypto from "crypto";
import DeviceRegistration from "../models/DeviceRegistration.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import Program from "../models/Program.js";
import { DailyExecutionUsage, ExecutionUsageAudit } from "../models/DailyExecutionUsage.js";
import {
  GlobalExecutionReservation,
  GlobalExecutionDayStats,
} from "../models/GlobalExecutionBudget.js";
import ExecutionQueueItem from "../models/ExecutionQueueItem.js";
import { executeCodeWithJudge0 } from "../utils/judgeUtil.js";

// 1. Configurable Allowances by Tier
export const ALLOWANCE_CONFIG = {
  guest: { min: 10, max: 20 },
  registered: { min: 20, max: 35 },
  free_enrolled: { min: 30, max: 45 },
  paid_enrolled: { min: 40, max: 60 },
};

export const GLOBAL_BUDGET_LIMIT = Number(process.env.JUDGE0_DAILY_BUDGET_LIMIT || 1900);
export const MAX_QUEUE_LIMIT = 98;
export const QUEUE_WAIT_TIMEOUT_MS = 60 * 1000; // 60 seconds

// IST Date Helper
export const getISTDateKey = (date = new Date()) => {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + offsetMs);
  return istDate.toISOString().slice(0, 10);
};

export const getISTDayWindow = (date = new Date()) => {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const istMidnight = new Date(date.getTime() + offsetMs);
  istMidnight.setUTCHours(0, 0, 0, 0);
  const start = new Date(istMidnight.getTime() - offsetMs);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, dateKey: getISTDateKey(date) };
};

/**
 * Resolve client device ID from header or generate persistent one.
 */
export const resolveDeviceIdentity = async (req) => {
  let deviceId = req.headers["x-device-id"] || req.cookies?.techlearn_device_id;
  const userAgent = req.headers["user-agent"] || "";
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "";

  if (!deviceId || typeof deviceId !== "string" || deviceId.length < 10) {
    // Generate secure persistent device id
    deviceId = `dev_${crypto.randomBytes(16).toString("hex")}`;
  }

  try {
    let reg = await DeviceRegistration.findOne({ deviceId });
    if (!reg) {
      reg = new DeviceRegistration({
        deviceId,
        userAgent,
        ipHistory: ip ? [ip] : [],
        lastSeenAt: new Date(),
      });
      await reg.save();
    } else {
      let modified = false;
      if (ip && !reg.ipHistory.includes(ip)) {
        reg.ipHistory.push(ip);
        modified = true;
      }
      reg.lastSeenAt = new Date();
      if (req.user?._id && !reg.associatedUserIds.some((id) => String(id) === String(req.user._id))) {
        reg.associatedUserIds.push(req.user._id);
        modified = true;
      }
      if (modified) await reg.save();
    }
  } catch (err) {
    console.error("Device registration sync error:", err);
  }

  return deviceId;
};

/**
 * Determine user tier based on authentication & program enrollments.
 */
export const resolveUserTier = async (user) => {
  if (!user || !user._id) return "guest";

  const enrollments = await ProgramEnrollment.find({
    userId: user._id,
    status: "Active",
  }).lean();

  if (!enrollments.length) return "registered";

  const programIds = enrollments.map((e) => e.programId).filter(Boolean);
  const programs = await Program.find({ _id: { $in: programIds } }).select("pricingType").lean();
  const programMap = new Map(programs.map((p) => [String(p._id), p]));

  const hasPaid = enrollments.some((e) => {
    const prog = programMap.get(String(e.programId));
    return e.accessTier === "Member" || prog?.pricingType === "Paid";
  });

  return hasPaid ? "paid_enrolled" : "free_enrolled";
};

/**
 * Determine Priority Tier (P1 - P8) strictly as per specification:
 * P1: Paid-enrolled - Coding assessments
 * P2: Paid-enrolled - Daily Tasks
 * P3: Paid-enrolled - Other coding activities
 * P4: Free-enrolled - Coding assessments
 * P5: Free-enrolled - Daily Tasks
 * P6: Free-enrolled - Other coding activities
 * P7: Registered, not enrolled - Online compiler
 * P8: Guest / logged out - Online compiler
 */
export const resolvePriorityTier = (userTier, activityType) => {
  const isAssessment = activityType === "assessment";
  const isDailyTask = activityType === "daily_task";

  if (userTier === "paid_enrolled") {
    if (isAssessment) return "P1";
    if (isDailyTask) return "P2";
    return "P3";
  }

  if (userTier === "free_enrolled") {
    if (isAssessment) return "P4";
    if (isDailyTask) return "P5";
    return "P6";
  }

  if (userTier === "registered") {
    return "P7";
  }

  return "P8";
};

/**
 * Initialize or fetch daily usage record.
 */
export const getOrCreateDailyUsage = async (ownerType, ownerId, userTier, dateKey) => {
  const config = ALLOWANCE_CONFIG[userTier] || ALLOWANCE_CONFIG.guest;

  let record = await DailyExecutionUsage.findOne({ ownerType, ownerId, dateKey });
  if (!record) {
    try {
      record = await DailyExecutionUsage.create({
        ownerType,
        ownerId,
        dateKey,
        configuredMin: config.min,
        configuredMax: config.max,
        effectiveAllowance: config.min, // starts at minimum
        usedCount: 0,
        userTier,
      });
    } catch (e) {
      if (e.code === 11000) {
        record = await DailyExecutionUsage.findOne({ ownerType, ownerId, dateKey });
      } else {
        throw e;
      }
    }
  }
  return record;
};

/**
 * Adaptive Capacity Allocator:
 * Increases effective allowance towards maximum only if global budget allows.
 */
export const tryScaleAllowanceTowardsMax = async (usageRecord) => {
  if (usageRecord.effectiveAllowance >= usageRecord.configuredMax) {
    return usageRecord.effectiveAllowance;
  }

  const { dateKey } = getISTDayWindow();
  const dayStats = await GlobalExecutionDayStats.findOne({ dateKey }).lean();
  const consumedOrReserved = (dayStats?.completedCount || 0) + (dayStats?.inFlightCount || 0) + (dayStats?.reservedCount || 0);
  const remainingGlobal = Math.max(0, GLOBAL_BUDGET_LIMIT - consumedOrReserved);

  // If there is healthy global capacity (> 200 runs buffer), increment effective allowance by 1 towards max
  if (remainingGlobal > 200 && usageRecord.usedCount >= usageRecord.effectiveAllowance - 2) {
    const oldVal = usageRecord.effectiveAllowance;
    const newVal = Math.min(usageRecord.configuredMax, oldVal + 2);

    if (newVal > oldVal) {
      usageRecord.effectiveAllowance = newVal;
      await usageRecord.save();

      try {
        await ExecutionUsageAudit.create({
          ownerType: usageRecord.ownerType,
          ownerId: usageRecord.ownerId,
          dateKey,
          oldEffectiveAllowance: oldVal,
          newEffectiveAllowance: newVal,
          reason: "Adaptive capacity redistribution based on active usage and global capacity surplus",
        });
      } catch (auditErr) {
        console.error("Audit log error:", auditErr);
      }
    }
  }

  return usageRecord.effectiveAllowance;
};

/**
 * Atomically checks allowance and increments usedCount.
 */
export const checkAndConsumePersonalAllowance = async ({ user, deviceId, userTier, count = 1 }) => {
  const { dateKey, end: resetAt } = getISTDayWindow();

  // 1. Check & Enforce Device Usage
  const devUsage = await getOrCreateDailyUsage("device", deviceId, "guest", dateKey);
  await tryScaleAllowanceTowardsMax(devUsage);

  // 2. If authenticated, check & enforce Account Usage
  let userUsage = null;
  if (user?._id) {
    userUsage = await getOrCreateDailyUsage("user", String(user._id), userTier, dateKey);
    await tryScaleAllowanceTowardsMax(userUsage);
  }

  const primaryUsage = userUsage || devUsage;

  if (primaryUsage.usedCount + count > primaryUsage.effectiveAllowance) {
    return {
      allowed: false,
      reason: "personal_exhausted",
      effectiveAllowance: primaryUsage.effectiveAllowance,
      usedCount: primaryUsage.usedCount,
      remainingCount: Math.max(0, primaryUsage.effectiveAllowance - primaryUsage.usedCount),
      resetAt: resetAt.toISOString(),
      configuredMax: primaryUsage.configuredMax,
    };
  }

  // Device level guard: Ensure device hasn't exceeded its own allowance
  if (devUsage.usedCount + count > devUsage.effectiveAllowance) {
    return {
      allowed: false,
      reason: "device_exhausted",
      effectiveAllowance: devUsage.effectiveAllowance,
      usedCount: devUsage.usedCount,
      remainingCount: Math.max(0, devUsage.effectiveAllowance - devUsage.usedCount),
      resetAt: resetAt.toISOString(),
      configuredMax: devUsage.configuredMax,
    };
  }

  // Atomic increments
  await DailyExecutionUsage.updateOne(
    { _id: devUsage._id },
    { $inc: { usedCount: count }, $set: { lastActivityAt: new Date() } }
  );

  if (userUsage) {
    await DailyExecutionUsage.updateOne(
      { _id: userUsage._id },
      { $inc: { usedCount: count }, $set: { lastActivityAt: new Date() } }
    );
  }

  const newUsed = primaryUsage.usedCount + count;
  const remaining = Math.max(0, primaryUsage.effectiveAllowance - newUsed);

  return {
    allowed: true,
    effectiveAllowance: primaryUsage.effectiveAllowance,
    usedCount: newUsed,
    remainingCount: remaining,
    resetAt: resetAt.toISOString(),
    configuredMax: primaryUsage.configuredMax,
    configuredMin: primaryUsage.configuredMin,
  };
};

/**
 * Global Judge0 Budget Controller:
 * Reserves execution capacity against the 1900 ceiling.
 */
export const reserveGlobalExecution = async ({
  ownerType,
  ownerId,
  activityType,
  priorityTier,
  count = 1,
  idempotencyKey,
}) => {
  const { dateKey } = getISTDayWindow();

  // If idempotencyKey provided and reservation exists, return existing
  if (idempotencyKey) {
    const existing = await GlobalExecutionReservation.findOne({ idempotencyKey, dateKey });
    if (existing && ["reserved", "in_flight", "completed"].includes(existing.status)) {
      return { success: true, reservation: existing, dateKey };
    }
  }

  // Ensure DayStats record exists first
  await GlobalExecutionDayStats.updateOne(
    { dateKey },
    {
      $setOnInsert: {
        dateKey,
        maxBudget: GLOBAL_BUDGET_LIMIT,
        reservedCount: 0,
        inFlightCount: 0,
        completedCount: 0,
        failedCount: 0,
        releasedCount: 0,
      },
    },
    { upsert: true }
  );

  // Atomically check and reserve against GlobalExecutionDayStats
  const updatedDayStats = await GlobalExecutionDayStats.findOneAndUpdate(
    {
      dateKey,
      $expr: {
        $lte: [
          { $add: ["$completedCount", "$inFlightCount", "$reservedCount", count] },
          "$maxBudget",
        ],
      },
    },
    {
      $inc: { reservedCount: count },
    },
    { new: true }
  );

  if (!updatedDayStats) {
    // Ceiling of 1900 reached for today
    return { success: false, reason: "global_budget_exhausted" };
  }

  const reservationId = `res_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  const reservation = await GlobalExecutionReservation.create({
    reservationId,
    dateKey,
    ownerType,
    ownerId,
    activityType,
    priorityTier,
    executionsReserved: count,
    status: "reserved",
    idempotencyKey,
  });

  return { success: true, reservation, dateKey };
};

/**
 * Reconcile / update reservation status.
 */
export const updateReservationStatus = async (reservationId, status, errorDetails = "") => {
  const reservation = await GlobalExecutionReservation.findOne({ reservationId });
  if (!reservation) return;

  const prevStatus = reservation.status;
  if (prevStatus === status) return;

  const count = reservation.executionsReserved || 1;
  const inc = {};

  if (prevStatus === "reserved") inc.reservedCount = -count;
  if (prevStatus === "in_flight") inc.inFlightCount = -count;

  if (status === "in_flight") inc.inFlightCount = (inc.inFlightCount || 0) + count;
  if (status === "completed") inc.completedCount = (inc.completedCount || 0) + count;
  if (status === "failed") inc.failedCount = (inc.failedCount || 0) + count;
  if (status === "released") inc.releasedCount = (inc.releasedCount || 0) + count;

  reservation.status = status;
  if (errorDetails) reservation.errorDetails = String(errorDetails);
  if (["completed", "failed", "released"].includes(status)) {
    reservation.resolvedAt = new Date();
  }
  await reservation.save();

  if (Object.keys(inc).length > 0) {
    await GlobalExecutionDayStats.updateOne({ dateKey: reservation.dateKey }, { $inc: inc });
  }
};

/**
 * Priority Execution Queue:
 * Enqueues request if global capacity is busy and queue < 98.
 */
export const enqueueExecutionRequest = async ({
  ownerType,
  ownerId,
  userTier,
  activityType,
  priorityTier,
  payload,
}) => {
  // Expire any stale requests before counting
  await ExecutionQueueItem.updateMany(
    { status: "waiting", expiresAt: { $lt: new Date() } },
    { $set: { status: "expired" } }
  );

  const pendingCount = await ExecutionQueueItem.countDocuments({ status: "waiting" });
  if (pendingCount >= MAX_QUEUE_LIMIT) {
    return { enqueued: false, reason: "queue_full", pendingCount };
  }

  const queueId = `q_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
  const expiresAt = new Date(Date.now() + QUEUE_WAIT_TIMEOUT_MS);

  const item = await ExecutionQueueItem.create({
    queueId,
    ownerType,
    ownerId,
    userTier,
    activityType,
    priorityTier,
    payload,
    status: "waiting",
    expiresAt,
  });

  return {
    enqueued: true,
    queueId,
    priorityTier,
    queuePosition: pendingCount + 1,
    estimatedWaitSeconds: Math.min(45, (pendingCount + 1) * 2),
  };
};

/**
 * Process next queued item strictly following P1-P8 priority and FIFO within tiers.
 */
export const processNextQueuedExecution = async () => {
  // Find highest priority waiting item: P1 -> P8, then earliest enqueuedAt
  const item = await ExecutionQueueItem.findOneAndUpdate(
    { status: "waiting", expiresAt: { $gt: new Date() } },
    { $set: { status: "processing", startedAt: new Date() } },
    { sort: { priorityTier: 1, enqueuedAt: 1 }, new: true }
  );

  if (!item) return null;

  try {
    const reservation = await reserveGlobalExecution({
      ownerType: item.ownerType,
      ownerId: item.ownerId,
      activityType: item.activityType,
      priorityTier: item.priorityTier,
      count: 1,
    });

    if (!reservation.success) {
      // Still no capacity, return to queue
      item.status = "waiting";
      item.startedAt = null;
      await item.save();
      return null;
    }

    await updateReservationStatus(reservation.reservation.reservationId, "in_flight");

    const execResult = await executeCodeWithJudge0(item.payload);
    await updateReservationStatus(reservation.reservation.reservationId, "completed");

    item.status = "completed";
    item.result = execResult;
    item.completedAt = new Date();
    await item.save();

    return item;
  } catch (err) {
    item.status = "failed";
    item.error = err.message || "Execution error";
    item.completedAt = new Date();
    await item.save();
    return item;
  }
};
