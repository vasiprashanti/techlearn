import User from "../models/User.js";
import UserProgress from "../models/UserProgress.js";
import Exercise from "../models/Exercise.js";
import Notes from "../models/Notes.js";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import mongoose from "mongoose";

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    //fetching the user
    const user = await User.findById(userId);

    const progress = await UserProgress.findOne({ userId }).populate({
      path: "completedExercises.exerciseId",
      select: "title courseId",
      populate: {
        path: "courseId",
        select: "title",
      },
    });

    if (!progress) {
      return res.status(200).json({
        courseXP: {},
        exerciseXP: {},
        totalCourseXP: {}, // Show empty object when no progress exists
        totalExerciseXP: {}, // Show empty object when no progress exists
        completedExercises: [],
        calendarActivity: {},
        answeredQuestions: {},
        courseProgress: { progressPercent: 0 },
        exerciseProgress: {
          totalExercises: 0, // Show 0 initially
          completedExercises: 0,
          progressPercent: 0,
        },
        avatar: user.avatar,
        mcqProgress: {
          totalMcqs: 0, // Show 0 initially
          answeredMcqs: 0,
          progressPercent: 0,
        },
      });
    }

    // CALCULATE progress from actual data (no schema changes needed)
    const totalExercises = await Exercise.countDocuments();

    // Get all notes to count total MCQs
    const allNotes = await Notes.find();
    let totalMcqs = 0;
    for (const note of allNotes) {
      totalMcqs += note.checkpointMcqs.length;
    }

    const completedExercisesCount = progress.completedExercises.length;

    // Calculate MCQ progress based on answered checkpoint MCQs
    let answeredMcqs = 0;

    // Count answered MCQs from progress.answeredCheckpointMcqs
    if (progress.answeredCheckpointMcqs) {
      for (const [notesId, mcqIds] of progress.answeredCheckpointMcqs) {
        answeredMcqs += mcqIds.length;
      }
    }

    const exercisePercent =
      totalExercises > 0
        ? Math.round((completedExercisesCount / totalExercises) * 1000) / 10
        : 0;
    const mcqPercent =
      totalMcqs > 0 ? Math.round((answeredMcqs / totalMcqs) * 1000) / 10 : 0;
    const courseProgressPercent =
      Math.round(((exercisePercent + mcqPercent) / 2) * 10) / 10;

    // Create calendar activity
    const calendarActivity = {};
    if (progress.createdAt) {
      const dateKey = progress.createdAt.toISOString().split("T")[0];
      calendarActivity[dateKey] = "active"; // Use string instead of boolean
    }

    // Convert Maps to plain objects for frontend
    const courseXPObject = {};
    const exerciseXPObject = {};
    const totalCourseXPObject = {};
    const totalExerciseXPObject = {};

    if (progress.courseXP) {
      for (const [courseId, xp] of progress.courseXP) {
        courseXPObject[courseId] = xp;
      }
    }
    if (progress.exerciseXP) {
      for (const [courseId, xp] of progress.exerciseXP) {
        exerciseXPObject[courseId] = xp;
      }
    }

    // Calculate total possible XP for each course the user has progress in
    const allCourseIds = Array.from(
      new Set([...progress.courseXP.keys(), ...progress.exerciseXP.keys()])
    );

    for (const courseId of allCourseIds) {
      // Calculate total MCQ XP for this course
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
        // Calculate total exercise XP for this course
        const exerciseCount = await Exercise.countDocuments({ courseId });
        totalExerciseXP = exerciseCount * 10;
      }

      totalCourseXPObject[courseId] = totalMcqXP;
      totalExerciseXPObject[courseId] = totalExerciseXP;
    }

    res.status(200).json({
      courseXP: courseXPObject,
      exerciseXP: exerciseXPObject,
      totalCourseXP: totalCourseXPObject,
      totalExerciseXP: totalExerciseXPObject,
      completedExercises: progress.completedExercises,
      calendarActivity,
      answeredCheckpointMcqs: progress.answeredCheckpointMcqs,
      totalCourseProgress: { progressPercent: courseProgressPercent },
      mcqProgress: {
        totalMcqs,
        answeredMcqs,
        progressPercent: mcqPercent,
      },
      exerciseProgress: {
        totalExercises,
        completedExercises: completedExercisesCount,
        progressPercent: exercisePercent,
      },
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
};
