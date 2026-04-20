import User from "../models/User.js";
import UserProgress from "../models/UserProgress.js";
import Exercise from "../models/Exercise.js";
import Notes from "../models/Notes.js";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import mongoose from "mongoose";

const DASHBOARD_CACHE_TTL_MS = 30 * 1000;
const dashboardCache = new Map();

const toPlainMap = (value) => {
  if (!value) return {};
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  return Object.fromEntries(Object.entries(value));
};

const getCachedDashboard = (userId) => {
  const cached = dashboardCache.get(String(userId));
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    dashboardCache.delete(String(userId));
    return null;
  }
  return cached.payload;
};

const setCachedDashboard = (userId, payload) => {
  dashboardCache.set(String(userId), {
    expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
    payload,
  });
};

export const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const cached = getCachedDashboard(userId);
    if (cached) {
      return res.status(200).json(cached);
    }

    const [user, progress, totalExercises, notesMcqCounts] = await Promise.all([
      User.findById(userId).select("avatar").lean(),
      UserProgress.findOne({ userId })
        .select("courseXP exerciseXP completedExercises answeredCheckpointMcqs createdAt")
        .populate({
          path: "completedExercises.exerciseId",
          select: "title courseId",
          populate: {
            path: "courseId",
            select: "title",
          },
        })
        .lean(),
      Exercise.countDocuments(),
      Notes.aggregate([
        {
          $project: {
            checkpointCount: {
              $size: {
                $ifNull: ["$checkpointMcqs", []],
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            totalMcqs: { $sum: "$checkpointCount" },
          },
        },
      ]),
    ]);

    if (!progress) {
      const emptyPayload = {
        courseXP: {},
        exerciseXP: {},
        totalCourseXP: {},
        totalExerciseXP: {},
        completedExercises: [],
        calendarActivity: {},
        answeredQuestions: {},
        totalCourseProgress: { progressPercent: 0 },
        exerciseProgress: {
          totalExercises: 0,
          completedExercises: 0,
          progressPercent: 0,
        },
        avatar: user?.avatar || "",
        mcqProgress: {
          totalMcqs: 0,
          answeredMcqs: 0,
          progressPercent: 0,
        },
      };
      setCachedDashboard(userId, emptyPayload);
      return res.status(200).json(emptyPayload);
    }

    const totalMcqs = notesMcqCounts[0]?.totalMcqs || 0;
    const completedExercisesCount = progress.completedExercises?.length || 0;

    let answeredMcqs = 0;
    const answeredCheckpointMcqs = progress.answeredCheckpointMcqs || {};
    const answeredEntries =
      answeredCheckpointMcqs instanceof Map
        ? answeredCheckpointMcqs.entries()
        : Object.entries(answeredCheckpointMcqs);
    for (const [, mcqIds] of answeredEntries) {
      answeredMcqs += Array.isArray(mcqIds) ? mcqIds.length : 0;
    }

    const exercisePercent =
      totalExercises > 0
        ? Math.round((completedExercisesCount / totalExercises) * 1000) / 10
        : 0;
    const mcqPercent =
      totalMcqs > 0 ? Math.round((answeredMcqs / totalMcqs) * 1000) / 10 : 0;
    const courseProgressPercent =
      Math.round(((exercisePercent + mcqPercent) / 2) * 10) / 10;

    const calendarActivity = {};
    if (progress.createdAt) {
      const dateKey = new Date(progress.createdAt).toISOString().split("T")[0];
      calendarActivity[dateKey] = "active";
    }

    const courseXPObject = toPlainMap(progress.courseXP);
    const exerciseXPObject = toPlainMap(progress.exerciseXP);

    const allCourseIds = [...new Set([
      ...Object.keys(courseXPObject),
      ...Object.keys(exerciseXPObject),
    ])];
    const courseObjectIds = allCourseIds
      .filter((courseId) => mongoose.Types.ObjectId.isValid(courseId))
      .map((courseId) => new mongoose.Types.ObjectId(courseId));

    const [courses, exercisesByCourse, topicsByCourse, notesById] = await Promise.all([
      Course.find({ _id: { $in: courseObjectIds } }).select("_id topicIds").lean(),
      Exercise.aggregate([
        { $match: { courseId: { $in: courseObjectIds } } },
        { $group: { _id: "$courseId", totalExercises: { $sum: 1 } } },
      ]),
      Topic.find({
        courseId: { $in: courseObjectIds },
      })
        .select("courseId notesId")
        .lean(),
      Notes.find()
        .select("_id checkpointMcqs")
        .lean(),
    ]);

    const noteMcqCountById = Object.fromEntries(
      notesById.map((note) => [String(note._id), note.checkpointMcqs?.length || 0])
    );
    const exerciseCountByCourse = Object.fromEntries(
      exercisesByCourse.map((entry) => [String(entry._id), entry.totalExercises || 0])
    );

    const topicsGroupedByCourse = {};
    for (const topic of topicsByCourse) {
      const courseKey = String(topic.courseId);
      if (!topicsGroupedByCourse[courseKey]) topicsGroupedByCourse[courseKey] = [];
      topicsGroupedByCourse[courseKey].push(topic);
    }

    const totalCourseXPObject = {};
    const totalExerciseXPObject = {};
    for (const course of courses) {
      const courseKey = String(course._id);
      const courseTopics = topicsGroupedByCourse[courseKey] || [];
      totalCourseXPObject[courseKey] = courseTopics.reduce(
        (sum, topic) => sum + (topic.notesId ? (noteMcqCountById[String(topic.notesId)] || 0) * 10 : 0),
        0,
      );
      totalExerciseXPObject[courseKey] = (exerciseCountByCourse[courseKey] || 0) * 10;
    }

    const payload = {
      courseXP: courseXPObject,
      exerciseXP: exerciseXPObject,
      totalCourseXP: totalCourseXPObject,
      totalExerciseXP: totalExerciseXPObject,
      completedExercises: progress.completedExercises || [],
      calendarActivity,
      answeredCheckpointMcqs,
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
      avatar: user?.avatar || "",
    };

    setCachedDashboard(userId, payload);
    res.status(200).json(payload);
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    res.status(500).json({ message: "Server error fetching dashboard data" });
  }
};
