import mongoose from "mongoose";
import Notes from "../models/Notes.js";
import UserProgress from "../models/UserProgress.js";
import Topic from "../models/Topic.js";
import Course from "../models/Course.js";
import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import Program from "../models/Program.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import Batch from "../models/Batch.js";
import Submission from "../models/Submission.js";
import { invalidateDashboardCache } from "./dashboardController.js";
import {
  calculateProgramDayNumber,
  isCompletedProgramSchedule,
  isProgramResourceLocked,
  resolveProgramSchedule,
} from "../utils/programSchedule.js";
import { expireBatchIfNeeded } from "../utils/batchLifecycle.js";
import { buildCapturedCoursePurchaseQuery } from "../utils/coursePurchase.js";
import { getTopicDayNumber } from "../utils/courseTopicSchedule.js";

const canAccessPaidCourse = async ({ course, user }) => {
  if (user?.role === "admin") return true;
  if (!user?._id) return false;

  const capturedPurchase = await Payment.exists(
    buildCapturedCoursePurchaseQuery({ userId: user._id, courseId: course._id })
  );
  if (capturedPurchase) return true;

  const email = String(user.email || "").trim().toLowerCase();
  const student = await Student.findOne({
    $or: [
      { userId: user._id },
      ...(email ? [{ email }] : []),
    ],
  }).lean();
  const schedule = await resolveProgramSchedule({ user, student });
  if (schedule.batchExpired && !isCompletedProgramSchedule(schedule)) return false;

  const identifiers = [
    { userId: user._id },
    ...(student?._id ? [{ studentId: student._id }] : []),
  ];
  const linkedPrograms = await Program.find({
    $or: [
      { courseIds: course._id },
      ...(course.programIds?.length ? [{ _id: { $in: course.programIds } }] : []),
    ],
  }).select("_id courseIds status pricingType visibility").lean();
  const enrollment = schedule.enrollment || await ProgramEnrollment.findOne({
    status: { $in: ["Active", "Completed"] },
    $or: identifiers,
    programId: { $in: linkedPrograms.map((program) => program._id) },
  }).sort({ assignedAt: -1, createdAt: -1 }).lean();
  const enrolledProgram = linkedPrograms.find((program) =>
    String(program._id) === String(enrollment?.programId)
  );
  if (enrolledProgram && (enrollment.status === "Completed" || enrolledProgram.status === "Active")
    && (enrolledProgram.pricingType !== "Paid" || enrollment.accessTier === "Member")) {
    return true;
  }

  const batchId = schedule.batchId || student?.batchId || user.batchId;
  if (!batchId) return false;
  const rawBatch = await Batch.findById(batchId).lean();
  if (!rawBatch) return false;
  const { batch } = await expireBatchIfNeeded(rawBatch);
  const isCompleted = isCompletedProgramSchedule(schedule);
  if (batch.status !== "Active" && !isCompleted) return false;
  if (batch.programId && schedule.programId && String(batch.programId) !== String(schedule.programId)) return false;

  const courseIsInBatch = (course.assignedBatchIds || []).some((id) => String(id) === String(batch._id))
    || String(batch.attachedCourse || "") === String(course._id)
    || (batch.supportingCourses || []).some((id) => String(id) === String(course._id));
  const courseIsInBatchProgram = linkedPrograms.some((program) =>
    String(program._id) === String(batch.programId) && (program.courseIds || []).some((id) => String(id) === String(course._id))
  );
  return courseIsInBatch || courseIsInBatchProgram;
};

const isTopicLockedForLearner = async ({ course, topic, user }) => {
  if (!user?._id || user.role === "admin") return false;
  const email = String(user.email || "").trim().toLowerCase();
  const student = await Student.findOne({
    $or: [
      { userId: user._id },
      ...(email ? [{ email }] : []),
    ],
  }).lean();
  const schedule = await resolveProgramSchedule({ user, student });
  if (!schedule.programId && !schedule.batchId) return false;
  if (schedule.batchExpired && !isCompletedProgramSchedule(schedule)) return true;

  const [batch, program] = await Promise.all([
    schedule.batchId ? Batch.findById(schedule.batchId).lean() : null,
    schedule.programId ? Program.findById(schedule.programId).select("_id courseIds status").lean() : null,
  ]);
  const courseId = String(course._id);
  const isAttached = schedule.programId
    ? (program?.courseIds || []).some((id) => String(id) === courseId)
    : String(batch?.attachedCourse || "") === courseId
      || (batch?.supportingCourses || []).some((id) => String(id) === courseId)
      || (course.assignedBatchIds || []).some((id) => String(id) === String(batch?._id));
  if (!isAttached) return false;

  const isCompleted = isCompletedProgramSchedule(schedule);
  const ownerIsActive = batch ? batch.status === "Active" : program?.status === "Active";
  if (!isCompleted && !ownerIsActive) return true;

  const currentDay = calculateProgramDayNumber({
    batch,
    individualStartDate: schedule.individualStartDate,
  });
  return isProgramResourceLocked({
    resourceDay: getTopicDayNumber(topic, Number(topic.index) || 0),
    currentDay,
    schedule,
  });
};

export const submitCheckpointMcq = async (req, res) => {
  try {
    const user = req.user || null; // guest if null
    const userId = user ? user._id : null;
    const { notesId, checkpointMcqId } = req.params;
    const { selectedOption } = req.body;

    if (!mongoose.Types.ObjectId.isValid(notesId)) {
      return res.status(400).json({ message: "Invalid notesId" });
    }

    const notes = await Notes.findById(notesId);
    if (!notes) return res.status(404).json({ message: "Notes not found" });

    const mcq = notes.checkpointMcqs.find(
      (m) => m.checkpointMcqId === checkpointMcqId
    );
    if (!mcq)
      return res.status(404).json({ message: "Checkpoint MCQ not found" });

    // Find topic and course for XP tracking
    const topic = await Topic.findOne({ notesId: notes._id });
    const courseId = topic ? topic.courseId : null;
    if (courseId) {
      const course = await Course.findById(courseId).select("_id accessType programIds assignedBatchIds").lean();
      if (!course) return res.status(404).json({ message: "Course not found" });
      if (course?.accessType === "Paid" && !await canAccessPaidCourse({ course, user })) {
        return res.status(403).json({ message: "Purchase this course or enroll in its Program before opening this content." });
      }
      if (course && await isTopicLockedForLearner({ course, topic, user })) {
        return res.status(403).json({ message: "This topic is not unlocked yet. It will be available on its scheduled program day." });
      }
    }

    // Validate selected option
    if (selectedOption === undefined || selectedOption === null) {
      return res
        .status(400)
        .json({ message: "selectedOption is required in request body" });
    }

    const selectedOptionNumber = Number.parseInt(selectedOption);
    const safeSelectedOption = Number.isNaN(selectedOptionNumber)
      ? -1
      : selectedOptionNumber;
    const isCorrect = mcq.correctAnswer === safeSelectedOption;
    const xpAwarded = isCorrect ? 10 : 0;

    // Guests: Just show right/wrong answer, no progress saved
    if (!user) {
      return res.status(200).json({
        isCorrect,
        correctAnswer: mcq.correctAnswer,
        xpAwarded: 0, // No XP for guests
        explanation: mcq.explanation || null,
        checkpointMcqId,
        notesId,
        saved: false,
        userType: "guest",
        message: "Sign up to save progress and earn XP!",
      });
    }

    // Ensure userProgress exists
    let userProgress = await UserProgress.findOne({ userId });
    if (!userProgress) {
      userProgress = new UserProgress({ userId });
    }

    const notesIdStr = notesId.toString();
    const answered = userProgress.answeredCheckpointMcqs.get(notesIdStr) || [];
    const isFirstAttempt = !answered.includes(checkpointMcqId);
    const awardedXp = isFirstAttempt ? xpAwarded : 0;
    const isClub = user.isClub;

    // For logged-in non-club users: limit to 5 MCQs per course
    if (!isClub) {
      // Count total MCQs answered for this course across all topics
      let totalAnsweredForCourse = 0;

      // Get all topics for this course
      const allTopicsForCourse = await Topic.find({ courseId });
      const allNotesIdsForCourse = allTopicsForCourse
        .map((topic) => topic.notesId?.toString())
        .filter(Boolean);

      // Count answered MCQs across all topics in this course
      for (const notesIdForCourse of allNotesIdsForCourse) {
        const answeredForNotes =
          userProgress.answeredCheckpointMcqs.get(notesIdForCourse) || [];
        totalAnsweredForCourse += answeredForNotes.length;
      }

      // Check if user has reached the 5 MCQ limit for this course
      if (totalAnsweredForCourse >= 5 && isFirstAttempt) {
        return res.status(200).json({
          isCorrect,
          correctAnswer: mcq.correctAnswer,
          xpAwarded: 0,
          explanation: mcq.explanation || null,
          checkpointMcqId,
          notesId,
          saved: false,
          userType: "logged-in",
          limitReached: true,
          message:
            "You've reached the limit of 5 MCQs per course. Upgrade to Club membership for unlimited access!",
          upgradePrompt:
            "🚀 Join Club for unlimited MCQs, exercises, and full progress tracking!",
        });
      }

      // Save answer if not already saved and within limit
      if (isFirstAttempt) {
        answered.push(checkpointMcqId);
        userProgress.answeredCheckpointMcqs.set(notesIdStr, answered);
      }

      // Award XP for logged-in users
      if (courseId) {
        const courseIdStr = courseId.toString();
        const currentXP = userProgress.courseXP.get(courseIdStr) || 0;
        userProgress.courseXP.set(courseIdStr, currentXP + awardedXp);
      }

      await userProgress.save();
      invalidateDashboardCache(userId);

      // Create a canonical Submission record for analytics if Notes is bridged to Question bank
      try {
        if (notes.questionBankId && mongoose.Types.ObjectId.isValid(notes.questionBankId)) {
          const existing = await Submission.findOne({
            studentId: userId,
            questionId: notes.questionBankId,
            snapshotConstraints: `checkpoint:${checkpointMcqId}`,
          });

          if (!existing) {
            const sub = new Submission({
              studentId: userId,
              questionId: notes.questionBankId,
              categoryId: topic ? topic.categoryId : null,
              categoryType: "Notes",
              totalScore: awardedXp,
              status: isCorrect ? "Passed" : "Failed",
              submittedAt: new Date(),
              snapshotConstraints: `checkpoint:${checkpointMcqId}`,
              submissionType: "track_question",
            });
            await sub.save();
          }
        }
      } catch (e) {
        // Non-fatal: do not block user response on analytics write failures
        console.error("checkpoint MCQ submission sync failed:", e.message);
      }

      // Get updated courseXP for frontend display
      const courseXPObject = {};
      if (userProgress.courseXP) {
        for (const [courseId, xp] of userProgress.courseXP) {
          courseXPObject[courseId] = xp;
        }
      }

      return res.status(200).json({
        isCorrect,
        correctAnswer: mcq.correctAnswer,
        xpAwarded: awardedXp,
        explanation: mcq.explanation || null,
        checkpointMcqId,
        notesId,
        saved: true,
        userType: "logged-in",
        courseXP: courseXPObject,
        mcqsUsed: totalAnsweredForCourse + (isFirstAttempt ? 1 : 0),
        mcqsRemaining: Math.max(0, 5 - (totalAnsweredForCourse + (isFirstAttempt ? 1 : 0))),
        message:
          totalAnsweredForCourse + (isFirstAttempt ? 1 : 0) >= 4
            ? "Almost at your limit! Upgrade to Club for unlimited access."
            : "Progress saved!",
      });
    }

    // Club members: Unlimited access with full features
    if (isFirstAttempt) {
      answered.push(checkpointMcqId);
      userProgress.answeredCheckpointMcqs.set(notesIdStr, answered);
    }

    // Award XP for club members
    if (courseId) {
      const courseIdStr = courseId.toString();
      const currentXP = userProgress.courseXP.get(courseIdStr) || 0;
      userProgress.courseXP.set(courseIdStr, currentXP + awardedXp);
    }

    await userProgress.save();
    invalidateDashboardCache(userId);

    // Get updated courseXP for frontend display
    const courseXPObject = {};
    if (userProgress.courseXP) {
      for (const [courseId, xp] of userProgress.courseXP) {
        courseXPObject[courseId] = xp;
      }
    }

    return res.status(200).json({
      isCorrect,
      correctAnswer: mcq.correctAnswer,
      xpAwarded: awardedXp,
      explanation: mcq.explanation || null,
      checkpointMcqId,
      notesId,
      saved: true,
      userType: "club",
      courseXP: courseXPObject,
      message: "Progress saved! Thanks for being a Club member! 🌟",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

export const getMcqByCourseId = async (req, res) => {
  try {
    const { courseId, topicId } = req.params;

    // Validate both IDs and ensure a topic cannot be paired with an unrelated
    // course ID to bypass the course's access rules.
    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ message: "Invalid courseId or topicId" });
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: "Topic not found" });
    }
    if (String(topic.courseId) !== String(courseId)) {
      return res.status(404).json({ message: "Topic not found for this course" });
    }

    const course = await Course.findById(courseId).select("_id accessType programIds assignedBatchIds").lean();
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (course?.accessType === "Paid" && !await canAccessPaidCourse({ course, user: req.user })) {
      return res.status(403).json({ message: "Purchase this course or enroll in its Program before opening this content." });
    }
    if (course && await isTopicLockedForLearner({ course, topic, user: req.user })) {
      return res.status(403).json({ message: "This topic is not unlocked yet. It will be available on its scheduled program day." });
    }

    const notes = await Notes.findById(topic.notesId);
    if (!notes) {
      return res.status(404).json({ message: "Notes not found" });
    }

    // If logged-in, fetch user's answered MCQs for this notesId
    const user = req.user || null;
    let answeredForUser = [];
    if (user) {
      const userProgress = await UserProgress.findOne({ userId: user._id });
      if (userProgress) {
        answeredForUser =
          userProgress.answeredCheckpointMcqs.get(notes._id.toString()) || [];
      }
    }

    // Build response: hide correctAnswer on GET; include attempted flag and locked flag for UI
    const mcqsWithoutAnswer = notes.checkpointMcqs.map((mcq) => ({
      question: mcq.question,
      options: mcq.options,
      explanation: mcq.explanation,
      checkpointMcqId: mcq.checkpointMcqId,
      attempted: answeredForUser.includes(mcq.checkpointMcqId),
      locked: false, // frontend will decide lock based on user role & position; can be set here if needed
    }));

    return res.status(200).json({
      parsedContent: notes.parsedContent,
      checkpointMcqs: mcqsWithoutAnswer,
      notesQuestionBankId: notes.questionBankId || null,
    });
  } catch (err) {
    console.error("getMcqByCourseId error:", err);
    return res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
};
