import Batch from "../models/Batch.js";
import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Topic from "../models/Topic.js";
import { getTrackAssignmentDate } from "../utils/trackAssignmentSchedule.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const combineDateAndTime = (dateValue, timeValue = "00:00") => {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return new Date();

  const [hours = "0", minutes = "0"] = String(timeValue || "00:00").split(":");
  date.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return date;
};

const getCurrentBatchDay = (batch) => {
  const assignmentDate =
    getTrackAssignmentDate(batch, "Daily Task") ||
    getTrackAssignmentDate(batch, "Daily Challenge") ||
    batch.startDate ||
    new Date();
  const releaseStart = combineDateAndTime(assignmentDate, batch.releaseTime || "00:00");
  const elapsedDays = Math.floor((Date.now() - releaseStart.getTime()) / DAY_MS);
  return Math.max(1, elapsedDays + 1);
};

const findPlacementSprintCourse = async () => {
  const placementRegex = /placement\s*sprint/i;
  const placementCourse = await Course.findOne({ title: placementRegex }).sort({ updatedAt: -1 }).lean();
  if (placementCourse) return placementCourse;

  return Course.findOne({ title: /placement/i }).sort({ updatedAt: -1 }).lean();
};

const buildTopicPayload = (topic, index, currentDay, courseId) => {
  const day = index + 1;
  const isLocked = day > currentDay;
  return {
    day,
    week: Math.ceil(day / 7),
    topicId: topic._id,
    title: topic.title,
    slug: topic.slug,
    notesId: topic.notesId?._id || topic.notesId || null,
    isCurrent: day === currentDay,
    isLocked,
    href: isLocked ? null : `/learn/courses/${courseId}/topics?day=${day}`,
  };
};

export const getPlacementLearningDashboard = async (req, res) => {
  try {
    const email = String(req.user?.email || "").trim().toLowerCase();
    const student = await Student.findOne({
      $or: [
        { userId: req.user?._id },
        ...(email ? [{ email }] : []),
      ],
    }).lean();

    if (!student?.batchId) {
      return res.status(200).json({
        success: true,
        hasPlacementLearning: false,
        message: "No active placement batch found.",
      });
    }

    const batch = await Batch.findById(student.batchId).lean();
    if (!batch || batch.status !== "Active") {
      return res.status(200).json({
        success: true,
        hasPlacementLearning: false,
        message: "No active placement batch found.",
      });
    }

    const course = await findPlacementSprintCourse();
    if (!course) {
      return res.status(200).json({
        success: true,
        hasPlacementLearning: false,
        message: "Placement Sprint course is not available yet.",
      });
    }

    const topics = await Topic.find({ _id: { $in: course.topicIds || [] } })
      .populate("notesId")
      .sort({ index: 1, createdAt: 1 })
      .lean();

    const currentDay = getCurrentBatchDay(batch);
    const totalDays = topics.length;
    const currentTopicIndex = Math.min(Math.max(currentDay - 1, 0), Math.max(totalDays - 1, 0));
    const currentTopic = totalDays > 0 ? topics[currentTopicIndex] : null;

    const notes = topics.map((topic, index) =>
      buildTopicPayload(topic, index, currentDay, course._id)
    );

    const weeks = notes.reduce((acc, topic) => {
      const existing = acc.find((week) => week.week === topic.week);
      if (existing) {
        existing.days.push(topic);
      } else {
        acc.push({ week: topic.week, label: `Week ${topic.week}`, days: [topic] });
      }
      return acc;
    }, []);

    return res.status(200).json({
      success: true,
      hasPlacementLearning: true,
      batch: {
        id: batch._id,
        name: batch.name,
        currentDay,
        releaseTime: batch.releaseTime || "00:00",
      },
      course: {
        id: course._id,
        title: course.title,
        description: course.description || "",
      },
      todayTopic: currentTopic
        ? buildTopicPayload(currentTopic, currentTopicIndex, currentDay, course._id)
        : null,
      totalDays,
      weeks,
    });
  } catch (error) {
    console.error("getPlacementLearningDashboard error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load placement learning dashboard.",
      error: error.message,
    });
  }
};
