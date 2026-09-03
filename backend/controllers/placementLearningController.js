import Batch from "../models/Batch.js";
import Course from "../models/Course.js";
import Student from "../models/Student.js";
import Topic from "../models/Topic.js";
import Program from "../models/Program.js";
import { calculateProgramDayNumber } from "../utils/programSchedule.js";
import { resolveProgramSchedule } from "../utils/programSchedule.js";

const buildTopicPayload = (topic, index, currentDay, courseId) => {
  const day = index + 1;
  const isLocked = day > currentDay;
  const hasNotes = Boolean(topic.notesId);
  return {
    day,
    week: Math.ceil(day / 7),
    topicId: topic._id,
    title: topic.title,
    slug: topic.slug,
    notesId: topic.notesId?._id || topic.notesId || null,
    hasNotes,
    isCurrent: day === currentDay,
    isLocked,
    href: isLocked || !hasNotes ? null : `/learn/courses/${courseId}/topics?day=${day}`,
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

    if (!student) {
      return res.status(200).json({
        success: true,
        hasPlacementLearning: false,
        message: "No student record found.",
      });
    }

    const schedule = await resolveProgramSchedule({ user: req.user, student });
    if (schedule.batchExpired) {
      return res.status(403).json({
        success: false,
        message: "This batch has ended and program access has been revoked.",
      });
    }
    const batch = schedule.batchId ? await Batch.findById(schedule.batchId).lean() : null;
    if (schedule.batchId && !batch) {
      return res.status(403).json({
        success: false,
        message: "The assigned batch could not be found.",
      });
    }

    let program = schedule.programId ? await Program.findById(schedule.programId).lean() : null;

    if (!program && student.programSelection) {
      program = await Program.findOne({ programType: student.programSelection, status: "Active" }).sort({ createdAt: -1 }).lean();
    }

    // A concrete Program owns the learner's course sequence. Batch-level
    // course fields remain a compatibility fallback for legacy batches only.
    let targetCourseId = program?.courseIds?.[0]
      || (!schedule.programId ? batch?.attachedCourse : null)
      || null;

    if (!targetCourseId && !program) {
      const fallbackCourse = await Course.findOne({ status: "Active" }).sort({ createdAt: -1 }).lean();
      if (fallbackCourse) {
        targetCourseId = fallbackCourse._id;
      }
    }

    if (!targetCourseId) {
      return res.status(200).json({
        success: true,
        hasPlacementLearning: false,
        message: "No course is assigned yet.",
      });
    }

    const course = await Course.findById(targetCourseId).lean();
    if (!course) {
      return res.status(200).json({
        success: true,
        hasPlacementLearning: false,
        message: "The assigned course is not available yet.",
      });
    }

    const topics = await Topic.find({ _id: { $in: course.topicIds || [] } })
      .populate("notesId")
      .sort({ index: 1, createdAt: 1 })
      .lean();

    const currentDay = calculateProgramDayNumber({
      batch,
      individualStartDate: schedule.individualStartDate,
    });
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

    // Batch supporting courses are cohort-specific. Individual learners use
    // the remaining courses attached to their program.
    const supportingCourseIds = program?.courseIds
      ? program.courseIds.filter((id) => String(id) !== String(targetCourseId))
      : (batch?.supportingCourses || []);
    const supportingCourses = supportingCourseIds.length > 0
      ? await Course.find({ _id: { $in: supportingCourseIds } }).select("title topicIds").lean()
      : [];

    return res.status(200).json({
      success: true,
      hasPlacementLearning: true,
      scheduleType: schedule.scheduleType,
      program: program
        ? { id: program._id, name: program.name, programType: program.programType }
        : null,
      batch: batch
        ? {
        id: batch._id,
        name: batch.name,
        currentDay,
        releaseTime: batch.releaseTime || "00:00",
          }
        : null,
      course: {
        id: course._id,
        title: course.title,
        description: course.description || "",
      },
      supportingCourses: supportingCourses.map(c => ({
        id: c._id,
        title: c.title,
        topicIds: c.topicIds || [],
      })),
      todayTopic: currentTopic?.notesId
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
