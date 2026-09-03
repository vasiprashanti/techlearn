import Student from "../models/Student.js";
import Batch, { BATCH_STATUS } from "../models/Batch.js";
import TrackTemplate from "../models/TrackTemplate.js";
import Question from "../models/Questions.js";
import DailyTaskAttempt from "../models/DailyTaskAttempt.js";
import UserProgress from "../models/UserProgress.js";
import Program from "../models/Program.js";
import { calculateTaskXP, TASK_XP } from "../services/xpService.js";
import { invalidateDashboardCache } from "./dashboardController.js";
import { updateStudentStreak } from "../utils/streakUtil.js";
import { calculateCurrentDayNumber } from "../utils/trackAssignmentSchedule.js";
import { assertProgramScheduleAccess, resolveProgramSchedule } from "../utils/programSchedule.js";

const getISTDateParts = (date) => {
  const d = new Date(date);
  const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    date: istDate.getUTCDate(),
  };
};

const endOfDay = (date = new Date()) => {
  const { year, month, date: day } = getISTDateParts(date);
  const utcTime = Date.UTC(year, month, day, 23, 59, 59, 999);
  return new Date(utcTime - 5.5 * 60 * 60 * 1000);
};

const resolveTrackTemplateForStudent = async (student, batch, programId) => {
  let program = null;
  if (programId) {
    program = await Program.findById(programId).lean();
  }
  if (!program && student.programSelection) {
    program = await Program.findOne({ programType: student.programSelection, status: "Active" }).sort({ createdAt: -1 }).lean();
  }

  // A concrete Program owns its Daily Task track. Do not let a legacy batch
  // track silently replace or supplement the selected Program's content.
  if (program?.trackTemplateIds?.length) {
    const trackTemplate = await TrackTemplate.findOne({
      _id: { $in: program.trackTemplateIds },
      trackType: "Daily Task",
      status: "Active",
    });
    if (trackTemplate) return trackTemplate;
  }
  if (programId) return null;

  if (batch?.assignedDailyTaskTrack) {
    const trackTemplate = await TrackTemplate.findById(batch.assignedDailyTaskTrack);
    if (trackTemplate && trackTemplate.trackType === "Daily Task") return trackTemplate;
  }
  if (batch?.assignedTrackTemplateIds?.length) {
    const trackTemplate = await TrackTemplate.findOne({
      _id: { $in: batch.assignedTrackTemplateIds },
      trackType: "Daily Task",
      status: "Active",
    });
    if (trackTemplate) return trackTemplate;
  }

  return TrackTemplate.findOne({ trackType: "Daily Task", status: "Active" }).sort({ createdAt: -1 });
};

export const getTodayDailyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.user.email.toLowerCase().trim();

    // 1. Resolve student and optional batch
    const student = await Student.findOne({
      $or: [
        { userId },
        ...(email ? [{ email }] : []),
      ],
    });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const schedule = await resolveProgramSchedule({ user: req.user, student });
    await assertProgramScheduleAccess({ user: req.user, student, programId: schedule.programId });
    if (schedule.batchExpired) {
      return res.status(403).json({ success: false, message: "This batch has ended and program access has been revoked." });
    }
    const batch = schedule.batchId ? await Batch.findById(schedule.batchId) : null;
    if (schedule.batchId && !batch) {
      return res.status(403).json({ success: false, message: "The assigned batch could not be found." });
    }
    if (batch && batch.status !== BATCH_STATUS.ACTIVE) {
      return res.status(403).json({ success: false, message: "This batch is currently not active." });
    }

    // 2. Resolve Daily Task template track
    const trackTemplate = await resolveTrackTemplateForStudent(student, batch, schedule.programId);
    if (!trackTemplate || trackTemplate.trackType !== "Daily Task") {
      return res.status(200).json({
        success: true,
        data: {
          dayNumber: 0,
          tasks: [],
          isFullyCompleted: false,
          progressPercent: 0,
        },
      });
    }

    // 3. Resolve active day number
    const individualStartDate = batch ? null : schedule.individualStartDate;
    const dayNumber = calculateCurrentDayNumber(batch, trackTemplate, "Daily Task", individualStartDate);
    const now = new Date();

    if (batch?.expiryDate && now > endOfDay(batch.expiryDate)) {
      return res.status(200).json({
        success: true,
        data: {
          dayNumber: 0,
          tasks: [],
          isFullyCompleted: false,
          progressPercent: 0,
        },
      });
    }

    const dayAssignment = (trackTemplate.dayAssignments || []).find((d) => Number(d.dayNumber) === Number(dayNumber));

    if (!dayAssignment || (!dayAssignment.tasks && !dayAssignment.questionId)) {
      return res.status(200).json({
        success: true,
        data: {
          dayNumber,
          tasks: [],
          isFullyCompleted: false,
          progressPercent: 0,
        },
      });
    }

    // Populate day assignment tasks
    const tasksAssigned = (dayAssignment.tasks || []).filter((task) =>
      (task.status || "Published") === "Published" &&
      // Program-owned assignments are reusable content. A legacy batchId on
      // an imported task must not hide it from learners on the Program's
      // selected batch or individual schedule.
      (schedule.programId || !task.batchId || (batch && String(task.batchId) === String(batch._id)))
    );
    const populatedTasks = [];

    // 4. Resolve daily attempt state or initialize
    let attempt = await DailyTaskAttempt.findOne({
      userId,
      programId: schedule.programId || null,
      batchId: batch?._id || null,
      trackId: trackTemplate._id,
      dayNumber,
    });

    if (!attempt) {
      const defaultProgress = tasksAssigned.map((t) => ({
        questionId: t.questionId,
        taskType: t.taskType,
        xpValue: Number(t.xpValue || 0),
        status: "Not Started",
        hintsUsed: 0,
        completedAt: null,
      }));

      attempt = new DailyTaskAttempt({
        userId,
        programId: schedule.programId || null,
        batchId: batch?._id || null,
        trackId: trackTemplate._id,
        dayNumber,
        tasksProgress: defaultProgress,
        isFullyCompleted: false,
      });
      await attempt.save();
    } else {
      // Check if attempt is from a previous calendar day in IST
      const attemptDateIST = getISTDateParts(attempt.createdAt);
      const nowIST = getISTDateParts(new Date());
      const isDifferentDay =
        attemptDateIST.year !== nowIST.year ||
        attemptDateIST.month !== nowIST.month ||
        attemptDateIST.date !== nowIST.date;

      if (isDifferentDay) {
        // Delete the stale attempt
        await DailyTaskAttempt.deleteOne({ _id: attempt._id });

        // Reset the attempt's progress and recreate fresh
        const defaultProgress = tasksAssigned.map((t) => ({
          questionId: t.questionId,
          taskType: t.taskType,
          xpValue: Number(t.xpValue || 0),
          status: "Not Started",
          hintsUsed: 0,
          completedAt: null,
        }));

        attempt = new DailyTaskAttempt({
          userId,
          programId: schedule.programId || null,
          batchId: batch?._id || null,
          trackId: trackTemplate._id,
          dayNumber,
          tasksProgress: defaultProgress,
          isFullyCompleted: false,
        });
        await attempt.save();
      } else {
        // Synchronize with updated template if assignments changed
        const assignedTaskKeys = tasksAssigned.map((t) => `${t.questionId}-${t.taskType}`);
        const attemptTaskKeys = attempt.tasksProgress.map((t) => `${t.questionId}-${t.taskType}`);
        const setsMatch =
          assignedTaskKeys.length === attemptTaskKeys.length &&
          assignedTaskKeys.every((key) => attemptTaskKeys.includes(key));

        if (!setsMatch) {
          const newProgress = tasksAssigned.map((assigned) => {
            const existing = attempt.tasksProgress.find(
              (p) => String(p.questionId) === String(assigned.questionId) && p.taskType === assigned.taskType
            );
            if (existing) {
              existing.xpValue = Number(assigned.xpValue || 0);
            }
            return (
              existing || {
                questionId: assigned.questionId,
                taskType: assigned.taskType,
                xpValue: Number(assigned.xpValue || 0),
                status: "Not Started",
                hintsUsed: 0,
                completedAt: null,
              }
            );
          });

          attempt.tasksProgress = newProgress;
          const total = newProgress.length;
          const completed = newProgress.filter((p) => p.status === "Completed").length;
          attempt.isFullyCompleted = total > 0 && completed === total;
          await attempt.save();
        }
      }
    }

    // Populate actual details of the tasks from Question Bank in a single optimized query
    const questionIds = attempt.tasksProgress.map((t) => t.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } })
      .select("title categoryType")
      .lean();
    
    const questionsMap = (questions || []).reduce((acc, q) => {
      acc[q._id.toString()] = q;
      return acc;
    }, {});

    for (const t of attempt.tasksProgress) {
      const q = questionsMap[t.questionId?.toString()];
      populatedTasks.push({
        questionId: t.questionId,
        taskType: t.taskType,
        title: q?.title || `${t.taskType} Task`,
        xpValue: Number(t.xpValue || 0),
        xpEarned: t.xpEarned || 0,
        status: t.status,
        completedAt: t.completedAt,
        selectedOption: t.selectedOption || "",
        isCorrect: t.isCorrect,
        attempted: t.attempted || false,
        code: t.code || "",
        language: t.language || "",
        accuracy: t.accuracy,
      });
    }

    const completedCount = attempt.tasksProgress.filter((t) => t.status === "Completed").length;
    const totalCount = attempt.tasksProgress.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        dayNumber,
        tasks: populatedTasks,
        isFullyCompleted: attempt.isFullyCompleted,
        progressPercent,
        programId: schedule.programId || null,
        scheduleType: schedule.scheduleType,
      },
    });
  } catch (error) {
    console.error("Error in getTodayDailyTasks:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch today's Daily Tasks." });
  }
};

export const submitDailyTask = async (req, res) => {
  try {
    const userId = req.user._id;
    const { questionId, taskType, hintsUsed = 0 } = req.body;
    const email = req.user.email.toLowerCase().trim();

    if (!questionId || !taskType) {
      return res.status(400).json({ success: false, message: "questionId and taskType are required." });
    }

    const student = await Student.findOne({
      $or: [
        { userId },
        ...(email ? [{ email }] : []),
      ],
    });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const schedule = await resolveProgramSchedule({ user: req.user, student });
    await assertProgramScheduleAccess({ user: req.user, student, programId: schedule.programId });
    if (schedule.batchExpired) {
      return res.status(403).json({ success: false, message: "This batch has ended and program access has been revoked." });
    }
    const batch = schedule.batchId ? await Batch.findById(schedule.batchId) : null;
    if (schedule.batchId && !batch) {
      return res.status(403).json({ success: false, message: "The assigned batch could not be found." });
    }
    if (batch && batch.status !== BATCH_STATUS.ACTIVE) {
      return res.status(403).json({ success: false, message: "This batch is currently not active." });
    }

    const trackTemplate = await resolveTrackTemplateForStudent(student, batch, schedule.programId);
    if (!trackTemplate) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const individualStartDate = batch ? null : schedule.individualStartDate;
    const dayNumber = calculateCurrentDayNumber(batch, trackTemplate, "Daily Task", individualStartDate);

    let attempt = await DailyTaskAttempt.findOne({
      userId,
      programId: schedule.programId || null,
      batchId: batch?._id || null,
      trackId: trackTemplate._id,
      dayNumber,
    });

    if (attempt) {
      const attemptDateIST = getISTDateParts(attempt.createdAt);
      const nowIST = getISTDateParts(new Date());
      const isDifferentDay =
        attemptDateIST.year !== nowIST.year ||
        attemptDateIST.month !== nowIST.month ||
        attemptDateIST.date !== nowIST.date;

      if (isDifferentDay) {
        // Delete the stale attempt
        await DailyTaskAttempt.deleteOne({ _id: attempt._id });

        // Resolve tasks assigned for default progress reset
        const dayAssignment = (trackTemplate.dayAssignments || []).find((assignment) => Number(assignment.dayNumber) === Number(dayNumber));
        const tasksAssigned = dayAssignment ? (dayAssignment.tasks || []).filter((task) =>
          (task.status || "Published") === "Published" &&
          (!task.batchId || (batch && String(task.batchId) === String(batch._id)))
        ) : [];

        const defaultProgress = tasksAssigned.map((t) => ({
          questionId: t.questionId,
          taskType: t.taskType,
          xpValue: Number(t.xpValue || 0),
          status: "Not Started",
          hintsUsed: 0,
          completedAt: null,
        }));

        attempt = new DailyTaskAttempt({
          userId,
          programId: schedule.programId || null,
          batchId: batch?._id || null,
          trackId: trackTemplate._id,
          dayNumber,
          tasksProgress: defaultProgress,
          isFullyCompleted: false,
        });
        await attempt.save();
      }
    }

    if (!attempt) {
      return res.status(400).json({ success: false, message: "Attempt state not initialized for this day." });
    }

    const taskIndex = attempt.tasksProgress.findIndex(
      (t) => String(t.questionId) === String(questionId) && t.taskType === taskType
    );

    if (taskIndex === -1) {
      return res.status(404).json({ success: false, message: "Sub-task not found in today's task assignments." });
    }

    const task = attempt.tasksProgress[taskIndex];
    if (task.status === "Completed") {
      return res.status(200).json({ success: true, message: "Task is already completed.", isFullyCompleted: attempt.isFullyCompleted });
    }

    // Mark task as completed
    task.status = "Completed";
    task.hintsUsed = Number(hintsUsed || 0);
    task.completedAt = new Date();

    // Check complete completion
    const totalTasksCount = attempt.tasksProgress.length;
    const completedTasksCount = attempt.tasksProgress.filter((t) => t.status === "Completed").length;
    const justCompletedDay = (completedTasksCount === totalTasksCount) && !attempt.isFullyCompleted;

    if (completedTasksCount === totalTasksCount) {
      attempt.isFullyCompleted = true;
    }

    await attempt.save();

    // Record the completed question immediately so the Revision, Company
    // Preparation, and Final Assessment engines can consume fresh data.
    // The source key matches the reconciliation service and is idempotent.
    if (schedule.programId && task.questionId) {
      try {
        const taskQuestion = await Question.findById(task.questionId)
          .select("_id categoryId categoryType categoryTitle categorySlug trackType tags difficulty title subject topic subtopic content")
          .lean();
        const taskAccuracy = typeof task.accuracy === "number"
          ? task.accuracy
          : (typeof task.isCorrect === "boolean" ? (task.isCorrect ? 100 : 0) : null);
        const taskSourceKey = "daily-task:" + String(attempt._id) + ":" + String(task.questionId) + ":" + String(task.taskType || "Unknown");
        const { recordProgramPerformanceAttempt } = await import("../services/programPerformanceService.js");
        await recordProgramPerformanceAttempt({
          programId: schedule.programId,
          studentId: student._id,
          userId,
          programDay: dayNumber,
          source: "Daily Task",
          sourceKey: taskSourceKey,
          sourceRecordId: attempt._id,
          taskType: task.taskType,
          questionId: task.questionId,
          question: taskQuestion,
          attempted: true,
          correct: task.isCorrect,
          score: taskAccuracy,
          accuracy: taskAccuracy,
          timeSpentMs: task.timeSpentMs || task.timeSpent,
          attemptedAt: task.completedAt,
        });
      } catch (performanceError) {
        console.error("Daily Task performance capture failed:", performanceError);
      }
    }

    const dayAssignment = (trackTemplate.dayAssignments || []).find((assignment) => Number(assignment.dayNumber) === Number(dayNumber));
    const configuredTask = (dayAssignment?.tasks || []).find(
      (assigned) => String(assigned.questionId) === String(questionId) && assigned.taskType === taskType
    );

    // Calculate XP
    const difficulty = configuredTask?.questionId?.difficulty || "Easy";
    const accuracy = typeof task.accuracy === "number" ? task.accuracy : 100;
    const isValidAttempt = task.isCorrect === true || accuracy > 0;
    let xpEarned = 0;
    if (isValidAttempt) {
      const usesDifficultyBasedMcqXp = ["MCQ", "Aptitude", "Core CS"].includes(taskType);
      xpEarned = !usesDifficultyBasedMcqXp && Number(configuredTask?.xpValue || 0) > 0
        ? Number(configuredTask.xpValue)
        : calculateTaskXP({ taskType, difficulty, accuracy });
    }

    // Calculate bonuses if all completed today
    let bonusXp = 0;
    if (justCompletedDay) {
      const hasAnyValidTask = attempt.tasksProgress.some(t => t.attempted && (t.isCorrect === true || (typeof t.accuracy === 'number' && t.accuracy > 0)));
      if (hasAnyValidTask) {
        bonusXp += TASK_XP.ALL_COMPLETED_BONUS; // +25 XP
      }
    }

    const totalXpAdded = xpEarned + bonusXp;

    // Update UserProgress atomically using $inc to prevent race-condition double-XP
    const courseIdKey = String(trackTemplate._id);
    await UserProgress.findOneAndUpdate(
      { userId },
      { $inc: { [`exerciseXP.${courseIdKey}`]: totalXpAdded } },
      { upsert: true }
    );
    invalidateDashboardCache(userId);
    await updateStudentStreak(email);

    return res.status(200).json({
      success: true,
      message: "Task completed and XP awarded successfully.",
      data: {
        taskType,
        xpEarned,
        bonusXp,
        totalXpAdded,
        isFullyCompleted: attempt.isFullyCompleted,
      },
    });
  } catch (error) {
    console.error("Error in submitDailyTask:", error);
    return res.status(500).json({ success: false, message: "Failed to submit Daily Task." });
  }
};
