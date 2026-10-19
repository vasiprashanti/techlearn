import { LANGUAGE_IDS, executeCodeWithJudge0 } from "../utils/judgeUtil.js";
import {
  resolveDeviceIdentity,
  resolveUserTier,
  resolvePriorityTier,
  checkAndConsumePersonalAllowance,
  reserveGlobalExecution,
  updateReservationStatus,
  enqueueExecutionRequest,
  getOrCreateDailyUsage,
  getISTDayWindow,
} from "../services/executionController.js";
import ExecutionQueueItem from "../models/ExecutionQueueItem.js";

const COMPILER_LANGUAGE_ALIASES = {
  sql: 82,
  sqlite: 82,
  postgresql: 83,
  postgres: 83,
};

const resolveCompilerLanguageId = (language) => {
  const normalizedLanguage = String(language || "").trim().toLowerCase();
  return LANGUAGE_IDS[normalizedLanguage] || COMPILER_LANGUAGE_ALIASES[normalizedLanguage];
};

export const getCompilerAllowanceStatus = async (req, res) => {
  try {
    const deviceId = await resolveDeviceIdentity(req);
    const userTier = await resolveUserTier(req.user);
    const { dateKey, end: resetAt } = getISTDayWindow();

    let primaryUsage;
    if (req.user?._id) {
      primaryUsage = await getOrCreateDailyUsage("user", String(req.user._id), userTier, dateKey);
    } else {
      primaryUsage = await getOrCreateDailyUsage("device", deviceId, "guest", dateKey);
    }

    const remaining = Math.max(0, primaryUsage.effectiveAllowance - primaryUsage.usedCount);

    return res.json({
      success: true,
      userTier,
      effectiveAllowance: primaryUsage.effectiveAllowance,
      usedCount: primaryUsage.usedCount,
      remainingCount: remaining,
      configuredMin: primaryUsage.configuredMin,
      configuredMax: primaryUsage.configuredMax,
      resetAt: resetAt.toISOString(),
      deviceId,
    });
  } catch (err) {
    console.error("Failed to get compiler allowance status:", err);
    return res.status(500).json({ success: false, message: "Could not fetch allowance status" });
  }
};

export const checkQueueStatus = async (req, res) => {
  try {
    const { queueId } = req.params;
    const item = await ExecutionQueueItem.findOne({ queueId }).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: "Queue item not found" });
    }

    if (item.status === "completed") {
      return res.json({
        success: true,
        status: "completed",
        result: item.result,
      });
    }

    if (item.status === "failed") {
      return res.status(500).json({
        success: false,
        status: "failed",
        error: item.error || "Execution failed in queue",
      });
    }

    if (item.status === "rejected" || item.status === "expired") {
      return res.status(408).json({
        success: false,
        status: item.status,
        message: item.status === "expired" ? "Execution request timed out in queue" : "Execution request rejected",
      });
    }

    // Still waiting or processing
    const ahead = await ExecutionQueueItem.countDocuments({
      status: "waiting",
      priorityTier: item.priorityTier,
      enqueuedAt: { $lt: item.enqueuedAt },
    });

    return res.json({
      success: true,
      status: item.status,
      queuePosition: ahead + 1,
      estimatedWaitSeconds: Math.min(60, (ahead + 1) * 2),
    });
  } catch (err) {
    console.error("Queue check error:", err);
    return res.status(500).json({ success: false, message: "Could not check queue status" });
  }
};

export const compileCode = async (req, res) => {
  const { language, source_code, stdin, idempotencyKey, isSessionContinuation } = req.body;

  const language_id = resolveCompilerLanguageId(language);
  if (!language_id)
    return res.status(400).json({ error: "Invalid language selected" });

  try {
    // 1. Resolve Identity, Tier, and Priority
    const deviceId = await resolveDeviceIdentity(req);
    const userTier = await resolveUserTier(req.user);
    const activityType = req.body.activityType || "compiler";
    const priorityTier = resolvePriorityTier(userTier, activityType);
    const ownerType = req.user?._id ? "user" : "device";
    const ownerId = req.user?._id ? String(req.user._id) : deviceId;

    // 2. Personal & Device Allowance Check (Atomic)
    // Only consume allowance on the initial run, NOT for interactive session continuations
    let allowanceResult;
    if (isSessionContinuation) {
      const { dateKey, end: resetAt } = getISTDayWindow();
      const devUsage = await getOrCreateDailyUsage("device", deviceId, "guest", dateKey);
      let userUsage = null;
      if (req.user?._id) {
        userUsage = await getOrCreateDailyUsage("user", String(req.user._id), userTier, dateKey);
      }
      const activeRecord = userUsage || devUsage;
      allowanceResult = {
        allowed: true,
        effectiveAllowance: activeRecord.effectiveAllowance,
        usedCount: activeRecord.usedCount,
        remainingCount: Math.max(0, activeRecord.effectiveAllowance - activeRecord.usedCount),
        resetAt,
      };
    } else {
      allowanceResult = await checkAndConsumePersonalAllowance({
        user: req.user,
        deviceId,
        userTier,
        count: 1,
      });
    }

    if (!allowanceResult.allowed) {
      return res.status(429).json({
        error:
          allowanceResult.reason === "device_exhausted"
            ? "Your daily allowance has been reached for this device. You can continue when your limit resets."
            : "You've used all your coding submissions for today. Your daily allowance has been reached. You can continue when your limit resets.",
        reason: allowanceResult.reason,
        effectiveAllowance: allowanceResult.effectiveAllowance,
        usedCount: allowanceResult.usedCount,
        remainingCount: 0,
        resetAt: allowanceResult.resetAt,
      });
    }

    const usageMeta = {
      effectiveAllowance: allowanceResult.effectiveAllowance,
      usedCount: allowanceResult.usedCount,
      remainingCount: allowanceResult.remainingCount,
      resetAt: allowanceResult.resetAt,
      fiveRunsAlert: allowanceResult.remainingCount === 5,
    };

    // 3. Global Judge0 Budget Reservation (1900 ceiling)
    const budgetRes = await reserveGlobalExecution({
      ownerType,
      ownerId,
      activityType,
      priorityTier,
      count: 1,
      idempotencyKey,
    });

    if (!budgetRes.success) {
      // Global 1900 ceiling reached for direct execution -> Queue eligible requests
      const queueRes = await enqueueExecutionRequest({
        ownerType,
        ownerId,
        userTier,
        activityType,
        priorityTier,
        payload: {
          sourceCode: source_code,
          languageId: language_id,
          stdin,
        },
      });

      if (!queueRes.enqueued) {
        return res.status(503).json({
          error: "High demand right now. Our coding environment is at maximum capacity (queue full). Please try again shortly.",
          reason: "queue_full",
          usage: usageMeta,
        });
      }

      return res.status(202).json({
        queued: true,
        message: "High demand right now. Our coding environment is handling a high volume of submissions. Your request is waiting in the queue, and we'll process it as capacity becomes available.",
        queueId: queueRes.queueId,
        queuePosition: queueRes.queuePosition,
        estimatedWaitSeconds: queueRes.estimatedWaitSeconds,
        priorityTier: queueRes.priorityTier,
        usage: usageMeta,
      });
    }

    // Capacity reserved -> Execute with Judge0
    const reservationId = budgetRes.reservation.reservationId;
    await updateReservationStatus(reservationId, "in_flight");

    try {
      const result = await executeCodeWithJudge0({
        sourceCode: source_code,
        languageId: language_id,
        stdin,
      });

      await updateReservationStatus(reservationId, "completed");

      const { stdout, stderr, compile_output, status, time, memory } = result;
      return res.json({
        stdout,
        stderr,
        compile_output,
        status,
        time,
        memory,
        usage: usageMeta,
      });
    } catch (execErr) {
      await updateReservationStatus(reservationId, "failed", execErr.message);
      throw execErr;
    }
  } catch (err) {
    console.error(
      "Compilation error:",
      err.response?.data || err.message || err
    );
    const statusCode = err.response?.status;
    const upstreamMessage = err.response?.data?.message || err.response?.data?.error || err.message;
    return res.status(statusCode === 429 ? 429 : 500).json({
      error: statusCode === 429
        ? "Compiler service is rate limited right now. Please wait a minute and try again."
        : "Compilation failed",
      details: upstreamMessage,
    });
  }
};

