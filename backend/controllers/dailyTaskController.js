import Student from "../models/Student.js";
import Batch, { BATCH_STATUS } from "../models/Batch.js";
import TrackTemplate from "../models/TrackTemplate.js";
import Question from "../models/Questions.js";
import DailyTaskAttempt from "../models/DailyTaskAttempt.js";
import UserProgress from "../models/UserProgress.js";
import { calculateTaskXP, TASK_XP } from "../services/xpService.js";

const getISTDateParts = (date) => {
  const d = new Date(date);
  const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    date: istDate.getUTCDate(),
  };
};

const startOfDay = (date = new Date()) => {
  const { year, month, date: day } = getISTDateParts(date);
  const utcTime = Date.UTC(year, month, day, 0, 0, 0, 0);
  return new Date(utcTime - 5.5 * 60 * 60 * 1000);
};

const endOfDay = (date = new Date()) => {
  const { year, month, date: day } = getISTDateParts(date);
  const utcTime = Date.UTC(year, month, day, 23, 59, 59, 999);
  return new Date(utcTime - 5.5 * 60 * 60 * 1000);
};

const combineDateAndTime = (date, timeString = "00:00") => {
  const { year, month, date: day } = getISTDateParts(date);
  const [hours, minutes] = String(timeString || "00:00")
    .split(":")
    .map((val) => Number(val || 0));
  const utcTime = Date.UTC(year, month, day, hours, minutes, 0, 0);
  return new Date(utcTime - 5.5 * 60 * 60 * 1000);
};

export const getTodayDailyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const email = req.user.email.toLowerCase().trim();

    // 1. Resolve student and batch
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const batch = await Batch.findById(student.batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: "No batch assigned to student." });
    }

    if (batch.status !== BATCH_STATUS.ACTIVE) {
      return res.status(403).json({ success: false, message: "This batch is currently not active." });
    }

    // 2. Resolve Daily Task template track
    if (!batch.assignedDailyTaskTrack) {
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

    const trackTemplate = await TrackTemplate.findById(batch.assignedDailyTaskTrack);
    if (!trackTemplate || trackTemplate.trackType !== "Daily Task") {
      return res.status(404).json({ success: false, message: "Assigned Daily Task track template not found." });
    }

    // 3. Resolve active day number
    const releaseStart = combineDateAndTime(trackTemplate.startDate || batch.startDate, batch.releaseTime || "00:00");
    const batchEnd = endOfDay(batch.expiryDate);
    const now = new Date();

    if (now < releaseStart || now > batchEnd) {
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

    const dayNumber = Math.floor((now.getTime() - releaseStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const dayAssignment = trackTemplate.dayAssignments.find((d) => d.dayNumber === dayNumber);

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
      (!task.batchId || String(task.batchId) === String(batch._id))
    );
    const populatedTasks = [];

    // 4. Resolve daily attempt state or initialize
    let attempt = await DailyTaskAttempt.findOne({
      userId,
      batchId: batch._id,
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
        batchId: batch._id,
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
          batchId: batch._id,
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

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student record not found." });
    }

    const batch = await Batch.findById(student.batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    if (!batch.assignedDailyTaskTrack) {
      return res.status(400).json({ success: false, message: "No Daily Task track assigned to this batch." });
    }

    const trackTemplate = await TrackTemplate.findById(batch.assignedDailyTaskTrack);
    if (!trackTemplate) {
      return res.status(404).json({ success: false, message: "Track template not found." });
    }

    const releaseStart = combineDateAndTime(trackTemplate.startDate || batch.startDate, batch.releaseTime || "00:00");
    const dayNumber = Math.floor((new Date().getTime() - releaseStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;

    let attempt = await DailyTaskAttempt.findOne({
      userId,
      batchId: batch._id,
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
          (!task.batchId || String(task.batchId) === String(batch._id))
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
          batchId: batch._id,
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

    const dayAssignment = (trackTemplate.dayAssignments || []).find((assignment) => Number(assignment.dayNumber) === Number(dayNumber));
    const configuredTask = (dayAssignment?.tasks || []).find(
      (assigned) => String(assigned.questionId) === String(questionId) && assigned.taskType === taskType
    );

    // Calculate XP
    let xpEarned = Number(configuredTask?.xpValue || 0) > 0
      ? Number(configuredTask.xpValue)
      : calculateTaskXP({ taskType, hintsUsed });

    // Calculate bonuses if all completed today
    let bonusXp = 0;
    if (justCompletedDay) {
      bonusXp += TASK_XP.ALL_COMPLETED_BONUS; // +25 XP
      
      // Checking if any task was skipped
      const skippedAny = attempt.tasksProgress.some((t) => t.status === "Not Started");
      if (!skippedAny) {
        bonusXp += TASK_XP.NO_SKIP_BONUS; // +10 XP
      }
    }

    const totalXpAdded = xpEarned + bonusXp;

    // Update UserProgress collection
    let progress = await UserProgress.findOne({ userId });
    if (!progress) {
      progress = new UserProgress({
        userId,
        courseXP: new Map(),
        exerciseXP: new Map(),
        completedExercises: [],
      });
    }

    // Add to exerciseXP under the batch track ID key
    const courseIdKey = String(trackTemplate._id);
    const currentXP = progress.exerciseXP.get(courseIdKey) || 0;
    progress.exerciseXP.set(courseIdKey, currentXP + totalXpAdded);
    await progress.save();

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
