import mongoose from "mongoose";
import UserProgress from "../models/UserProgress.js";
import Exercise from "../models/Exercise.js";
import Course from "../models/Course.js";
import Notes from "../models/Notes.js";
import Topic from "../models/Topic.js";
import { invalidateDashboardCache } from "./dashboardController.js";

// Record MCQ attempt (checkpoint MCQ)
export const recordCheckpointMcqAttempt = async ({
  userId,
  notesId,
  checkpointMcqId,
  courseId,
  xp,
}) => {
  let userProgress = await UserProgress.findOne({ userId });
  if (!userProgress) {
    userProgress = new UserProgress({
      userId,
      courseXP: new Map(),
      exerciseXP: new Map(),
      completedExercises: [],
      answeredCheckpointMcqs: new Map(),
    });
  }

  // Track answered MCQs per notesId
  const notesIdStr = notesId.toString();
  const answeredMcqs =
    userProgress.answeredCheckpointMcqs.get(notesIdStr) || [];
  const isFirstAttempt = !answeredMcqs.includes(checkpointMcqId);
  if (isFirstAttempt) {
    answeredMcqs.push(checkpointMcqId);
    userProgress.answeredCheckpointMcqs.set(notesIdStr, answeredMcqs);
  }

  // Award each checkpoint MCQ only once.
  if (isFirstAttempt) {
    const courseIdStr = courseId.toString();
    const currentCourseXP = userProgress.courseXP.get(courseIdStr) || 0;
    userProgress.courseXP.set(courseIdStr, currentCourseXP + Number(xp || 0));
  }

  // Do not update totalCourseXP here; it's calculated in getUserProgress only.

  await userProgress.save();
  invalidateDashboardCache(userId);
  return { success: true, totalAnswered: answeredMcqs.length, xpAwarded: isFirstAttempt ? Number(xp || 0) : 0 };
};

export const recordExerciseAttempt = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId, exerciseId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(exerciseId)) {
      return res.status(400).json({ message: "Invalid course or exercise ID." });
    }

    const exercise = await Exercise.findOne({ _id: exerciseId, courseId }).select("_id").lean();
    if (!exercise) {
      return res.status(404).json({ message: "Exercise not found for this course." });
    }

    let userProgress = await UserProgress.findOne({ userId });
    if (!userProgress) {
      userProgress = new UserProgress({
        userId,
        courseXP: new Map(),
        exerciseXP: new Map(),
        completedExercises: [],
        answeredCheckpointMcqs: new Map(),
      });
    }
    const alreadyCompleted = userProgress.completedExercises.some(
      (item) => item.exerciseId && item.exerciseId.toString() === exerciseId
    );
    const xpAwarded = alreadyCompleted ? 0 : 10;

    if (!alreadyCompleted) {
      const courseIdStr = courseId.toString();
      const currentXP = userProgress.exerciseXP.get(courseIdStr) || 0;
      userProgress.exerciseXP.set(courseIdStr, currentXP + xpAwarded);
      userProgress.completedExercises.push({
        exerciseId: new mongoose.Types.ObjectId(exerciseId),
        completedAt: new Date(),
      });
    }

    await userProgress.save();
    invalidateDashboardCache(userId);

    // Calculate total possible exercise XP for this course only
    const exerciseCount = await Exercise.countDocuments({ courseId });
    const totalPossibleExerciseXP = exerciseCount * 10;

    return res
      .status(200)
      .json({ success: true, alreadyCompleted, xpAwarded, totalExerciseXP: totalPossibleExerciseXP });
  } catch (error) {
    console.error("Error in recordExerciseAttempt:", error);
    return res
      .status(500)
      .json({ message: "Failed to record exercise attempt" });
  }
};

export const getUserProgress = async (req, res) => {
  const userId = req.user._id;
  try {
    const userProgress = await UserProgress.findOne({ userId });
    if (!userProgress) {
      // Calculate global totals even for new users
      const totalExercisesGlobally = await Exercise.countDocuments();
      const totalPossibleExerciseXP = totalExercisesGlobally * 10;
      return res.status(200).json({
        courseXP: {},
        exerciseXP: {},
        projectXP: {},
        totalCourseXP: 0, // Placeholder, update if you want to sum all MCQs
        totalExerciseXP: totalPossibleExerciseXP,
        answeredCheckpointMcqs: {},
        completedExercises: [],
      });
    }

    // Prepare course-wise XP summary
    const courseXPObj = {};
    const exerciseXPObj = {};
    const projectXPObj = {};
    const totalCourseXPObj = {};
    const totalExerciseXPObj = {};

    // For each course in courseXP, build summary
    for (const [courseId, xp] of userProgress.courseXP.entries()) {
      courseXPObj[courseId] = xp;
    }
    for (const [courseId, xp] of userProgress.exerciseXP.entries()) {
      exerciseXPObj[courseId] = xp;
    }
    for (const [projectId, xp] of (userProgress.projectXP || new Map()).entries()) {
      projectXPObj[projectId] = xp;
    }

    // For each course, calculate total possible XP (MCQ + Exercise)
    // This requires fetching topics and exercises for each course
    const allCourseIds = Array.from(
      new Set([
        ...userProgress.courseXP.keys(),
        ...userProgress.exerciseXP.keys(),
      ])
    );

    for (const courseId of allCourseIds) {
      // MCQ XP: sum all checkpointMcqs for topics in this course
      const course = await Course.findById(courseId);
      let totalMcqXP = 0;
      let totalExerciseXP = 0;
      if (course) {
        const topics = await Topic.find({ _id: { $in: course.topicIds } });
        for (const topic of topics) {
          if (topic.notesId) {
            const notes = await Notes.findById(topic.notesId);
            if (notes && notes.checkpointMcqs) {
              totalMcqXP += notes.checkpointMcqs.length * 10;
            }
          }
        }
        // Exercise XP: count exercises for this course
        const exerciseCount = await Exercise.countDocuments({ courseId });
        totalExerciseXP = exerciseCount * 10;
      }
      totalCourseXPObj[courseId] = totalMcqXP;
      totalExerciseXPObj[courseId] = totalExerciseXP;
    }

    // Prepare answered MCQs summary
    const answeredMcqsObj = {};
    for (const [
      notesId,
      mcqArr,
    ] of userProgress.answeredCheckpointMcqs.entries()) {
      answeredMcqsObj[notesId] = mcqArr;
    }

    // Response: course-wise XP and total possible XP
    return res.status(200).json({
      courseXP: courseXPObj, // XP earned per course (MCQ)
      exerciseXP: exerciseXPObj, // XP earned per course (Exercise)
      projectXP: projectXPObj,
      totalCourseXP: totalCourseXPObj, // Total possible MCQ XP per course
      totalExerciseXP: totalExerciseXPObj, // Total possible Exercise XP per course
      answeredCheckpointMcqs: answeredMcqsObj,
      completedExercises: userProgress.completedExercises,
    });
  } catch (error) {
    console.error("Get User Progress Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
