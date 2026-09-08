import mongoose from "mongoose";
import Program from "../models/Program.js";
import Batch from "../models/Batch.js";
import Course from "../models/Course.js";
import Topic from "../models/Topic.js";
import TrackTemplate from "../models/TrackTemplate.js";
import ProgramEnrollment from "../models/ProgramEnrollment.js";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { getTopicDayNumber } from "../utils/courseTopicSchedule.js";
import { isProgramPrimaryCourseMappingValid, resolveProgramPrimaryCourseId } from "../utils/programPrimaryCourse.js";
import { getProgramTypeDiagnostics } from "../utils/programTypeNormalization.js";

const getId = (value) => value?._id || value?.id || value || null;
const idString = (value) => {
  const id = getId(value);
  return id ? String(id) : "";
};
const unique = (values) => [...new Set(values.filter(Boolean).map(String))];

const addIssue = (issues, code, severity, message, details = {}) => {
  issues.push({ code, severity, message, ...details });
};

const expectedTrackProjection = (templates) => ({
  ids: unique(templates.map((template) => template._id)),
  dailyTask: templates.find((template) => template.trackType === "Daily Task")?._id || null,
  dailyChallenge: templates.find((template) => template.trackType === "Daily Challenge")?._id || null,
});

/**
 * Read-only integrity checks for one Program. The result is deliberately
 * diagnostic: it never repairs or rewrites production records.
 */
export const buildProgramDiagnostics = async ({ programId }) => {
  if (!mongoose.Types.ObjectId.isValid(String(programId || ""))) {
    const error = new Error("A valid programId is required.");
    error.statusCode = 400;
    throw error;
  }

  const program = await Program.findById(programId).lean();
  if (!program) {
    const error = new Error("Program not found.");
    error.statusCode = 404;
    throw error;
  }

  const issues = [];
  const typeDiagnostics = getProgramTypeDiagnostics(program.programType);
  if (!typeDiagnostics.isKnown) {
    addIssue(issues, "unknown_program_type", "error", "Program uses an unknown legacy programType.", {
      value: program.programType,
    });
  } else if (typeDiagnostics.isLegacy) {
    addIssue(issues, "legacy_program_type", "warning", "Program uses a legacy programType value; reads are normalized backward-compatibly.", {
      value: program.programType,
      normalizedValue: typeDiagnostics.canonical,
    });
  }

  const courseIds = unique((program.courseIds || []).map(idString));
  const trackTemplateIds = unique((program.trackTemplateIds || []).map(idString));
  const [courses, templates, batches, enrollments] = await Promise.all([
    Course.find({ _id: { $in: courseIds } }).select("_id title topicIds").lean(),
    TrackTemplate.find({ _id: { $in: trackTemplateIds } }).select("_id name trackType status totalDays dayAssignments").lean(),
    Batch.find({
      $or: [
        { programId },
        { _id: { $in: program.batchIds || [] } },
      ],
    }).select("_id name programId attachedCourse supportingCourses assignedTrackTemplateIds assignedTrackTemplate assignedDailyTaskTrack assignedDailyChallengeTrack").lean(),
    ProgramEnrollment.find({ programId }).select("_id userId studentId status batchId individualStartDate individualStartDateSource").lean(),
  ]);

  const foundCourseIds = new Set(courses.map((course) => String(course._id)));
  courseIds.filter((id) => !foundCourseIds.has(id)).forEach((id) => {
    addIssue(issues, "missing_course_mapping", "error", "Program references a Course that does not exist.", { courseId: id });
  });
  const foundTemplateIds = new Set(templates.map((template) => String(template._id)));
  trackTemplateIds.filter((id) => !foundTemplateIds.has(id)).forEach((id) => {
    addIssue(issues, "missing_track_template_mapping", "error", "Program references a TrackTemplate that does not exist.", { trackTemplateId: id });
  });
  if (!courseIds.length && !trackTemplateIds.length) {
    addIssue(issues, "incomplete_resource_mapping", "warning", "Program has no mapped courses or track templates.");
  }

  const primaryCourseId = resolveProgramPrimaryCourseId(program);
  if (program.primaryCourseId && !isProgramPrimaryCourseMappingValid(program)) {
    addIssue(issues, "wrong_primary_course_mapping", "error", "primaryCourseId is not one of the Program's courses.", {
      primaryCourseId: idString(program.primaryCourseId),
    });
  } else if (!program.primaryCourseId && primaryCourseId) {
    addIssue(issues, "legacy_primary_course_mapping", "warning", "Program has no explicit primary course; it currently falls back to the first course.", {
      fallbackCourseId: String(primaryCourseId),
    });
  }

  const topicIds = courses.flatMap((course) => course.topicIds || []).filter(Boolean);
  const topics = topicIds.length
    ? await Topic.find({ _id: { $in: topicIds } }).select("_id courseId title notesId index day dayNumber").lean()
    : [];
  const topicsByCourse = new Map();
  topics.forEach((topic) => {
    const key = String(topic.courseId);
    if (!topicsByCourse.has(key)) topicsByCourse.set(key, []);
    topicsByCourse.get(key).push(topic);
    if (!topic.notesId) {
      addIssue(issues, "missing_notes_id", "warning", "Topic has no notesId.", {
        courseId: key,
        topicId: String(topic._id),
        topicTitle: topic.title,
      });
    }
    if (!Number.isInteger(Number(topic.index)) || Number(topic.index) < 1) {
      addIssue(issues, "missing_day_index", "warning", "Topic has no valid persisted day/index.", {
        courseId: key,
        topicId: String(topic._id),
        topicTitle: topic.title,
      });
    }
  });

  const durationDays = Number(program.durationDays);
  const primaryTopics = topicsByCourse.get(String(primaryCourseId)) || [];
  if (Number.isInteger(durationDays) && durationDays > 0 && primaryCourseId) {
    const mappedDays = new Set(primaryTopics.map((topic, index) => getTopicDayNumber(topic, index)));
    const missingDays = [];
    for (let day = 1; day <= durationDays; day += 1) {
      if (!mappedDays.has(day)) missingDays.push(day);
    }
    if (missingDays.length) {
      addIssue(issues, "incomplete_day_coverage", "warning", "Primary course does not cover every Program day.", {
        courseId: String(primaryCourseId),
        missingDays,
      });
    }
  }

  const projection = expectedTrackProjection(templates);
  const expectedPrimaryCourse = String(primaryCourseId || "");
  for (const batch of batches) {
    const actualCourseIds = unique([batch.attachedCourse, ...(batch.supportingCourses || [])].map(idString));
    const expectedCourseIds = unique([primaryCourseId, ...courseIds.filter((id) => id !== expectedPrimaryCourse)]);
    if (actualCourseIds.join("|") !== expectedCourseIds.join("|")) {
      addIssue(issues, "stale_batch_projection", "error", "Batch course projection differs from the canonical Program.", {
        batchId: String(batch._id),
        expectedCourseIds,
        actualCourseIds,
      });
    }

    const actualTemplateIds = unique([
      ...(batch.assignedTrackTemplateIds || []),
      batch.assignedTrackTemplate,
      batch.assignedDailyTaskTrack,
      batch.assignedDailyChallengeTrack,
    ].map(idString));
    const missingTemplates = projection.ids.filter((id) => !actualTemplateIds.includes(id));
    const wrongTask = projection.dailyTask && String(batch.assignedDailyTaskTrack || "") !== String(projection.dailyTask);
    const wrongChallenge = projection.dailyChallenge && String(batch.assignedDailyChallengeTrack || "") !== String(projection.dailyChallenge);
    if (missingTemplates.length || wrongTask || wrongChallenge) {
      addIssue(issues, "stale_batch_projection", "error", "Batch track projection differs from the canonical Program.", {
        batchId: String(batch._id),
        missingTemplates,
        assignedDailyTaskTrack: idString(batch.assignedDailyTaskTrack),
        assignedDailyChallengeTrack: idString(batch.assignedDailyChallengeTrack),
      });
    }
  }

  const userIds = unique(enrollments.map((enrollment) => idString(enrollment.userId)));
  const studentIds = unique(enrollments.map((enrollment) => idString(enrollment.studentId)));
  const [users, students] = await Promise.all([
    userIds.length ? User.find({ _id: { $in: userIds } }).select("_id programId").lean() : [],
    studentIds.length ? Student.find({ _id: { $in: studentIds } }).select("_id userId programId").lean() : [],
  ]);
  const userById = new Map(users.map((user) => [String(user._id), user]));
  const studentById = new Map(students.map((student) => [String(student._id), student]));
  enrollments.forEach((enrollment) => {
    const key = idString(enrollment.userId);
    if (!key) return;
    if (!userById.has(key)) addIssue(issues, "inconsistent_program_pointers", "error", "ProgramEnrollment points to a missing User.", { enrollmentId: String(enrollment._id), userId: key });
    if (enrollment.studentId && !studentById.has(idString(enrollment.studentId))) {
      addIssue(issues, "inconsistent_program_pointers", "error", "ProgramEnrollment points to a missing Student.", { enrollmentId: String(enrollment._id), studentId: idString(enrollment.studentId) });
    }
  });
  for (const user of users) {
    if (user.programId && String(user.programId) !== String(programId)) {
      addIssue(issues, "inconsistent_program_pointers", "warning", "User.programId does not point at this Program enrollment; verify the primary pointer for a multi-program learner.", {
        userId: String(user._id),
        userProgramId: String(user.programId),
      });
    }
  }
  for (const student of students) {
    if (student.programId && String(student.programId) !== String(programId)) {
      addIssue(issues, "inconsistent_program_pointers", "warning", "Student.programId does not point at this Program enrollment; verify the primary pointer for a multi-program learner.", {
        studentId: String(student._id),
        studentProgramId: String(student.programId),
      });
    }
  }

  return {
    programId: String(programId),
    programType: typeDiagnostics,
    counts: {
      courses: courseIds.length,
      trackTemplates: trackTemplateIds.length,
      topics: topics.length,
      batches: batches.length,
      enrollments: enrollments.length,
      issues: issues.length,
    },
    issues,
  };
};
