import TrackTemplate from "../../models/TrackTemplate.js";
import mongoose from "mongoose";
import { calculateTaskXP, TASK_XP, CHALLENGE_XP } from "../../services/xpService.js";
import PracticeSubmission from "../../models/PracticeSubmission.js";
import DailyTaskAttempt from "../../models/DailyTaskAttempt.js";
import College from "../../models/College.js";
import Batch, { BATCH_STATUS } from "../../models/Batch.js";
import Course from "../../models/Course.js";
import Student from "../../models/Student.js";
import Submission from "../../models/Submission.js";
import StudentCodingSubmission from "../../models/StudentCodingSubmission.js";
import StudentMcqSubmission from "../../models/StudentMcqSubmission.js";
import Track from "../../models/Track.js";
import User from "../../models/User.js";
import UserProgress from "../../models/UserProgress.js";
import DailyChallengeAttempt from "../../models/DailyChallengeAttempt.js";
import StudentProject from "../../models/StudentProject.js";
import StudentTaskProgress from "../../models/StudentTaskProgress.js";
import StudentTrackAssignment from "../../models/StudentTrackAssignment.js";
import { writeAuditLog } from "../../utils/auditLogger.js";
import { assertObjectId, formatDateLabel } from "./adminCommon.js";

const deleteStudentProjectProgress = async (studentIds) => {
  if (!studentIds || studentIds.length === 0) return;
  try {
    const studentProjects = await StudentProject.find({ student_id: { $in: studentIds } }).select("_id").lean();
    const spIds = studentProjects.map(sp => sp._id);
    await Promise.all([
      StudentTaskProgress.deleteMany({ student_project_id: { $in: spIds } }),
      StudentProject.deleteMany({ student_id: { $in: studentIds } })
    ]);
  } catch (err) {
    console.error("deleteStudentProjectProgress error:", err);
  }
};

const DEFAULT_BATCH_TRACK_TYPES = ["Core", "DSA", "SQL"];

const getQuestionSection = (q, taskType) => {
  if (!q) return "technical";

  const type = String(taskType || q.trackType || q.categoryType || "").toLowerCase();
  const slug = String(q.categorySlug || "").toLowerCase();
  const title = String(q.title || "").toLowerCase();
  const tags = (q.tags || []).map(t => String(t || "").toLowerCase());

  if (slug.includes("java") || title.includes("java") || tags.includes("java")) {
    return "java";
  }
  if (slug.includes("dsa") || title.includes("dsa") || tags.includes("dsa") || slug.includes("data structure") || tags.includes("data structure") || title.includes("binary tree") || title.includes("array") || title.includes("linked list") || title.includes("stack") || title.includes("queue") || title.includes("graph")) {
    return "dsa";
  }
  if (type === "sql" || slug.includes("sql") || title.includes("sql") || tags.includes("sql") || tags.includes("database") || slug.includes("dbms")) {
    return "sql";
  }
  if (type === "aptitude" || slug.includes("aptitude") || title.includes("aptitude") || tags.includes("aptitude") || tags.includes("quant") || tags.includes("reasoning")) {
    return "aptitude";
  }
  if (slug.includes("technical") || title.includes("technical") || tags.includes("technical") || type === "mcq" || type === "core cs" || type === "debugging" || tags.includes("core cs")) {
    return "technical";
  }

  if (type === "sql") return "sql";
  if (type === "aptitude") return "aptitude";
  return "technical";
};

const toUtcDayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const calculateCurrentStreak = (submissions) => {
  const activityDays = new Set(
    submissions.map((submission) => toUtcDayKey(submission.submittedAt)).filter(Boolean)
  );
  if (!activityDays.size) return 0;

  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  const today = cursor.toISOString().slice(0, 10);
  const yesterday = new Date(cursor);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  if (!activityDays.has(today)) {
    if (!activityDays.has(yesterday.toISOString().slice(0, 10))) return 0;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (activityDays.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
};

const ensureDefaultBatchTracks = async (batchId, session) => {
  let existingTracksQuery = Track.find({ batchId }).select("trackType");
  if (session) {
    existingTracksQuery = existingTracksQuery.session(session);
  }
  const existingTracks = await existingTracksQuery.lean();

  const existingTrackTypes = new Set(existingTracks.map((track) => track.trackType));
  const missingTrackDocs = DEFAULT_BATCH_TRACK_TYPES
    .filter((trackType) => !existingTrackTypes.has(trackType))
    .map((trackType) => ({
      batchId,
      trackType,
      durationDays: 0,
      orderedQuestionIds: [],
    }));

  if (missingTrackDocs.length === 0) {
    return existingTracks;
  }

  if (session) {
    await Track.create(missingTrackDocs, { session, ordered: true });
  } else {
    await Track.create(missingTrackDocs);
  }
  return [...existingTracks, ...missingTrackDocs];
};

const getTrackTemplateForAssignment = async (templateId) => {
  if (!templateId || !mongoose.Types.ObjectId.isValid(templateId)) return null;
  return TrackTemplate.findOne({ _id: templateId, status: { $ne: "Archived" } }).lean();
};

const getBatchTemplateAssignmentFields = (trackTemplate, changed = true) => {
  if (!trackTemplate) {
    return {
      assignedTrackTemplate: null,
      assignedTrackTemplateAt: null,
      assignedDailyChallengeTrack: null,
      assignedDailyChallengeTrackAt: null,
      assignedDailyTaskTrack: null,
      assignedDailyTaskTrackAt: null,
    };
  }

  const assignedAt = changed ? new Date() : undefined;
  const fields = {
    assignedTrackTemplate: trackTemplate._id,
    ...(assignedAt ? { assignedTrackTemplateAt: assignedAt } : {}),
  };

  if (trackTemplate.trackType === "Daily Task") {
    fields.assignedDailyTaskTrack = trackTemplate._id;
    if (assignedAt) fields.assignedDailyTaskTrackAt = assignedAt;
  }
  if (trackTemplate.trackType === "Daily Challenge") {
    fields.assignedDailyChallengeTrack = trackTemplate._id;
    if (assignedAt) fields.assignedDailyChallengeTrackAt = assignedAt;
  }
  return fields;
};

const getBatchTemplateAssignmentFieldsFromTemplates = (trackTemplates = [], changed = true) => {
  const templates = trackTemplates.filter(Boolean);
  const templateIds = templates.map((t) => t._id);

  if (templates.length === 0) {
    return {
      ...getBatchTemplateAssignmentFields(null, changed),
      assignedTrackTemplateIds: [],
    };
  }

  const assignedAt = changed ? new Date() : undefined;
  const primaryTemplate = templates.find((template) => template.trackType === "Daily Challenge") || templates[0];
  const dailyTaskTemplate = templates.find((template) => template.trackType === "Daily Task");
  const dailyChallengeTemplate = templates.find((template) => template.trackType === "Daily Challenge");

  return {
    assignedTrackTemplate: primaryTemplate._id,
    ...(assignedAt ? { assignedTrackTemplateAt: assignedAt } : {}),
    assignedDailyTaskTrack: dailyTaskTemplate?._id || null,
    ...(assignedAt ? { assignedDailyTaskTrackAt: dailyTaskTemplate ? assignedAt : null } : {}),
    assignedDailyChallengeTrack: dailyChallengeTemplate?._id || null,
    ...(assignedAt ? { assignedDailyChallengeTrackAt: dailyChallengeTemplate ? assignedAt : null } : {}),
    assignedTrackTemplateIds: templateIds,
  };
};

const getTrackTemplatesForAssignment = async (templateIds = []) => {
  const uniqueTemplateIds = Array.from(new Set(templateIds.filter(Boolean).map(String)));
  if (uniqueTemplateIds.length === 0) return [];
  if (uniqueTemplateIds.some((templateId) => !mongoose.Types.ObjectId.isValid(templateId))) return null;

  const templates = await TrackTemplate.find({
    _id: { $in: uniqueTemplateIds },
    status: "Active",
  }).lean();

  if (templates.length !== uniqueTemplateIds.length) return null;
  const templateById = new Map(templates.map((template) => [String(template._id), template]));
  return uniqueTemplateIds.map((templateId) => templateById.get(templateId)).filter(Boolean);
};
const applyTrackTemplatesToBatchStudents = async ({ batchId, trackTemplates = [], previousTrackTemplateIds = [], session }) => {
  const students = await Student.find({ batchId }).select("_id").session(session).lean();
  const studentIds = students.map((student) => student._id);
  if (!studentIds.length) return 0;

  const now = new Date();
  const templateIds = trackTemplates.map((t) => t._id);

  // Deactivate any currently active assignments for these students that are NOT in the new templateIds list
  await StudentTrackAssignment.updateMany(
    { studentId: { $in: studentIds }, status: "Active", trackTemplateId: { $nin: templateIds } },
    { $set: { status: "Draft", deactivatedAt: now } },
    { session }
  );

  // For each template in the new list, make sure students have it active
  for (const template of trackTemplates) {
    const trackTemplateId = template._id;
    await StudentTrackAssignment.bulkWrite(
      studentIds.map((studentId) => ({
        updateOne: {
          filter: { studentId, trackTemplateId },
          update: {
            $set: { batchId, status: "Active", activatedAt: now, deactivatedAt: null },
            $setOnInsert: { assignedAt: now },
          },
          upsert: true,
        },
      })),
      { session, ordered: true }
    );
  }

  // Update students' primaryTrack to show the active track names joined by comma
  const trackNames = trackTemplates.map((t) => t.name).join(", ");
  await Student.updateMany({ _id: { $in: studentIds } }, { $set: { primaryTrack: trackNames } }, { session });

  return studentIds.length;
};

export const listColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({ createdAt: -1 }).lean();
    const collegeIds = colleges.map((college) => college._id);

    const [studentStats, batchStats, submissionStats] = await Promise.all([
      Student.aggregate([
        { $match: { collegeId: { $in: collegeIds } } },
        {
          $group: {
            _id: "$collegeId",
            totalStudents: { $sum: 1 },
            activeStudents: {
              $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
            },
          },
        },
      ]),
      Batch.aggregate([
        { $match: { collegeId: { $in: collegeIds } } },
        {
          $group: {
            _id: "$collegeId",
            totalBatches: { $sum: 1 },
            activeBatches: {
              $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
            },
          },
        },
      ]),
      Submission.aggregate([
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: "$student.collegeId",
            avgScore: { $avg: "$totalScore" },
          },
        },
      ]),
    ]);

    const studentMap = Object.fromEntries(studentStats.map((entry) => [String(entry._id), entry]));
    const batchMap = Object.fromEntries(batchStats.map((entry) => [String(entry._id), entry]));
    const submissionMap = Object.fromEntries(submissionStats.map((entry) => [String(entry._id), entry]));

    const data = colleges.map((college) => ({
      id: college._id,
      name: college.name,
      code: college.code || "",
      city: college.city || "",
      status: college.status || "Active",
      contactPerson: college.contactPerson || "",
      contactEmail: college.contactEmail || "",
      accuracy: Number((submissionMap[String(college._id)]?.avgScore || 0).toFixed(0)),
      avgScore: Number((submissionMap[String(college._id)]?.avgScore || 0).toFixed(0)),
      activeStudents: studentMap[String(college._id)]?.activeStudents || 0,
      totalStudents: studentMap[String(college._id)]?.totalStudents || 0,
      totalBatches: batchMap[String(college._id)]?.totalBatches || 0,
      activeBatches: batchMap[String(college._id)]?.activeBatches || 0,
      imageUrl: college.imageUrl || "",
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listColleges error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch colleges." });
  }
};

export const createCollege = async (req, res) => {
  try {
    const { name, code, city, status, contactPerson, contactEmail, imageUrl } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "College name is required." });
    }

    const college = await College.create({
      name: name.trim(),
      code: code?.trim()?.toUpperCase() || undefined,
      city: city?.trim() || "",
      status: status || "Active",
      contactPerson: contactPerson?.trim() || "",
      contactEmail: contactEmail?.trim()?.toLowerCase() || "",
      imageUrl: imageUrl || "",
    });

    await writeAuditLog({
      verb: "Created",
      entityType: "College",
      entityId: college._id,
      action: "Created college",
      detail: college.name,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: college });
  } catch (error) {
    console.error("createCollege error:", error);
    return res.status(500).json({ success: false, message: "Failed to create college.", error: error.message });
  }
};

export const getCollegeDetail = async (req, res) => {
  try {
    const { collegeId } = req.params;
    if (!assertObjectId(collegeId, "collegeId", res)) return;

    const college = await College.findById(collegeId).lean();
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found." });
    }

    const [students, batches, submissions] = await Promise.all([
      Student.find({ collegeId }).lean(),
      Batch.find({ collegeId }).sort({ startDate: -1 }).lean(),
      Submission.aggregate([
        {
          $lookup: {
            from: "students",
            localField: "studentId",
            foreignField: "_id",
            as: "student",
          },
        },
        { $unwind: { path: "$student", preserveNullAndEmptyArrays: false } },
        { $match: { "student.collegeId": new mongoose.Types.ObjectId(collegeId) } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: "$totalScore" },
          },
        },
      ]),
    ]);

    const batchIds = batches.map((batch) => batch._id);
    const [batchStudents, batchScores] = await Promise.all([
      Student.aggregate([
        { $match: { batchId: { $in: batchIds } } },
        { $group: { _id: "$batchId", students: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { batchId: { $in: batchIds } } },
        { $group: { _id: "$batchId", avgScore: { $avg: "$totalScore" } } },
      ]),
    ]);

    const batchStudentMap = Object.fromEntries(batchStudents.map((entry) => [String(entry._id), entry.students]));
    const batchScoreMap = Object.fromEntries(batchScores.map((entry) => [String(entry._id), entry.avgScore]));
    const activeStudents = students.filter((student) => student.status === "Active").length;

    return res.status(200).json({
      success: true,
      data: {
        id: college._id,
        name: college.name,
        code: college.code || "",
        city: college.city || "",
        status: college.status || "Active",
        totalStudents: students.length,
        activeStudents,
        activeBatches: batches.filter((batch) => batch.status === BATCH_STATUS.ACTIVE).length,
        accuracy: Number((submissions[0]?.avgScore || 0).toFixed(0)),
        avgScore: Number((submissions[0]?.avgScore || 0).toFixed(0)),
        submissionRate:
          students.length > 0 ? Number(((activeStudents / students.length) * 100).toFixed(0)) : 0,
        batches: batches.map((batch) => ({
          id: batch._id,
          name: batch.name,
          students: batchStudentMap[String(batch._id)] || 0,
          accuracy: Number((batchScoreMap[String(batch._id)] || 0).toFixed(0)),
          avgScore: Number((batchScoreMap[String(batch._id)] || 0).toFixed(0)),
          status: batch.status,
        })),
      },
    });
  } catch (error) {
    console.error("getCollegeDetail error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch college details." });
  }
};

export const updateCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    if (!assertObjectId(collegeId, "collegeId", res)) return;

    const updated = await College.findByIdAndUpdate(
      collegeId,
      {
        $set: {
          name: req.body.name?.trim(),
          code: req.body.code?.trim()?.toUpperCase() || undefined,
          city: req.body.city?.trim() || "",
          status: req.body.status || "Active",
          contactPerson: req.body.contactPerson?.trim() || "",
          contactEmail: req.body.contactEmail?.trim()?.toLowerCase() || "",
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "College not found." });
    }

    await writeAuditLog({
      verb: "Updated",
      entityType: "College",
      entityId: updated._id,
      action: "Updated college",
      detail: updated.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("updateCollege error:", error);
    return res.status(500).json({ success: false, message: "Failed to update college.", error: error.message });
  }
};

export const deleteCollege = async (req, res) => {
  try {
    const { collegeId } = req.params;
    if (!assertObjectId(collegeId, "collegeId", res)) return;

    const college = await College.findById(collegeId).lean();
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found." });
    }

    const batches = await Batch.find({ collegeId }).select("_id").lean();
    const batchIds = batches.map((batch) => batch._id);

    const studentsToDelete = await Student.find({
      $or: [{ collegeId }, ...(batchIds.length ? [{ batchId: { $in: batchIds } }] : [])],
    })
      .select("_id email")
      .lean();

    const studentIds = studentsToDelete.map((student) => student._id);
    const studentEmails = studentsToDelete
      .map((student) => String(student.email || "").trim().toLowerCase())
      .filter(Boolean);

    await Promise.all([
      Submission.deleteMany({
        $or: [
          ...(batchIds.length ? [{ batchId: { $in: batchIds } }] : []),
          ...(studentIds.length ? [{ studentId: { $in: studentIds } }] : []),
        ],
      }),
      studentEmails.length
        ? StudentCodingSubmission.deleteMany({ studentEmail: { $in: studentEmails } })
        : Promise.resolve(),
      studentEmails.length
        ? StudentMcqSubmission.deleteMany({ studentEmail: { $in: studentEmails } })
        : Promise.resolve(),
      studentIds.length ? Student.deleteMany({ _id: { $in: studentIds } }) : Promise.resolve(),
      studentIds.length ? StudentTrackAssignment.deleteMany({ studentId: { $in: studentIds } }) : Promise.resolve(),
      studentIds.length ? deleteStudentProjectProgress(studentIds) : Promise.resolve(),
      Batch.deleteMany({ collegeId }),
    ]);

    await College.findByIdAndDelete(collegeId);

    await writeAuditLog({
      verb: "Deleted",
      entityType: "College",
      entityId: college._id,
      action: "Deleted college",
      detail: college.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, message: "College deleted successfully." });
  } catch (error) {
    console.error("deleteCollege error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete college." });
  }
};

export const bulkDeleteCollegesAdmin = async (req, res) => {
  try {
    const { collegeIds } = req.body;
    if (!Array.isArray(collegeIds) || collegeIds.length === 0) {
      return res.status(400).json({ success: false, message: "collegeIds must be a non-empty array." });
    }

    for (const collegeId of collegeIds) {
      if (!assertObjectId(collegeId, "collegeId", res)) return;
    }

    const colleges = await College.find({ _id: { $in: collegeIds } }).lean();
    if (!colleges.length) {
      return res.status(404).json({ success: false, message: "No colleges found for the provided IDs." });
    }

    const existingCollegeIds = colleges.map((college) => college._id);
    const batches = await Batch.find({ collegeId: { $in: existingCollegeIds } }).select("_id").lean();
    const batchIds = batches.map((batch) => batch._id);

    const studentsToDelete = await Student.find({
      $or: [
        { collegeId: { $in: existingCollegeIds } },
        ...(batchIds.length ? [{ batchId: { $in: batchIds } }] : []),
      ],
    })
      .select("_id email")
      .lean();

    const studentIds = studentsToDelete.map((student) => student._id);
    const studentEmails = studentsToDelete
      .map((student) => String(student.email || "").trim().toLowerCase())
      .filter(Boolean);

    await Promise.all([
      Submission.deleteMany({
        $or: [
          ...(batchIds.length ? [{ batchId: { $in: batchIds } }] : []),
          ...(studentIds.length ? [{ studentId: { $in: studentIds } }] : []),
        ],
      }),
      studentEmails.length
        ? StudentCodingSubmission.deleteMany({ studentEmail: { $in: studentEmails } })
        : Promise.resolve(),
      studentEmails.length
        ? StudentMcqSubmission.deleteMany({ studentEmail: { $in: studentEmails } })
        : Promise.resolve(),
      studentIds.length ? Student.deleteMany({ _id: { $in: studentIds } }) : Promise.resolve(),
      studentIds.length ? StudentTrackAssignment.deleteMany({ studentId: { $in: studentIds } }) : Promise.resolve(),
      studentIds.length ? deleteStudentProjectProgress(studentIds) : Promise.resolve(),
      batchIds.length ? Batch.deleteMany({ _id: { $in: batchIds } }) : Promise.resolve(),
      College.deleteMany({ _id: { $in: existingCollegeIds } }),
    ]);

    for (const college of colleges) {
      await writeAuditLog({
        verb: "Deleted",
        entityType: "College",
        entityId: college._id,
        action: "Deleted college in bulk",
        detail: college.name,
        actor: req.user,
      });
    }

    return res.status(200).json({ success: true, message: `${colleges.length} colleges deleted successfully.` });
  } catch (error) {
    console.error("bulkDeleteCollegesAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to bulk delete colleges." });
  }
};

export const listBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .sort({ createdAt: -1 })
      .populate("collegeId", "name")
      .populate("collegeIds", "name")
      .populate("assignedTrackTemplate", "name category trackType status dayAssignments")
      .populate("assignedDailyTaskTrack", "name category trackType status dayAssignments")
      .populate("assignedDailyChallengeTrack", "name category trackType status dayAssignments")
      .populate("assignedTrackTemplateIds", "name category trackType status dayAssignments")
      .lean();

    const batchIds = batches.map((batch) => batch._id);
    const [studentsAgg, scoresAgg] = await Promise.all([
      Student.aggregate([
        { $match: { batchId: { $in: batchIds } } },
        { $group: { _id: "$batchId", students: { $sum: 1 } } },
      ]),
      Submission.aggregate([
        { $match: { batchId: { $in: batchIds } } },
        { $group: { _id: "$batchId", avgScore: { $avg: "$totalScore" } } },
      ]),
    ]);

    const studentMap = Object.fromEntries(studentsAgg.map((entry) => [String(entry._id), entry.students]));
    const scoreMap = Object.fromEntries(scoresAgg.map((entry) => [String(entry._id), entry.avgScore]));

    const localCombineDateAndTime = (date, timeString = "00:00") => {
      if (!date) return new Date();
      const d = new Date(date);
      const [hours, minutes] = String(timeString || "00:00").split(":");
      d.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      return d;
    };
    const now = new Date();

    const data = batches.map((batch) => {
      const trackTemplates = [
        ...(batch.assignedTrackTemplateIds || []),
        batch.assignedDailyTaskTrack,
        batch.assignedDailyChallengeTrack,
        batch.assignedTrackTemplate
      ].filter(Boolean).filter((template, index, self) =>
        self.findIndex(t => String(t._id || t) === String(template._id || template)) === index
      );

      let currentActiveTrack = "No Track";
      if (trackTemplates.length === 1) {
        currentActiveTrack = trackTemplates[0].name || "No Track";
      } else if (trackTemplates.length > 1) {
        currentActiveTrack = "Multiple Tracks";
      }

      return {
        id: batch._id,
        name: batch.name,
        college: batch.collegeIds && batch.collegeIds.filter(Boolean).length > 0
          ? batch.collegeIds.filter(Boolean).map((c) => c.name || "Unknown College").join(", ")
          : (batch.collegeId?.name || "Unknown College"),
        collegeIds: (batch.collegeIds || []).filter(Boolean).map((c) => String(c._id || c)),
        assignedTrack: currentActiveTrack,
        assignedTrackTemplateId: batch.assignedTrackTemplate?._id || null,
        assignedTrackTemplateIds: (batch.assignedTrackTemplateIds && batch.assignedTrackTemplateIds.length > 0)
          ? batch.assignedTrackTemplateIds.map((t) => String(t._id || t))
          : [
              batch.assignedDailyTaskTrack?._id,
              batch.assignedDailyChallengeTrack?._id,
              batch.assignedTrackTemplate?._id,
            ].filter(Boolean).map(String).filter((templateId, index, templateIds) => templateIds.indexOf(templateId) === index),
        assignedTrackTemplateName: batch.assignedTrackTemplate?.name || "",
        assignedTrackTemplateAt: batch.assignedTrackTemplateAt || null,
        assignedTrackTemplateCategory: batch.assignedTrackTemplate?.category || "",
        batchSize: typeof batch.batchSize === "number" ? batch.batchSize : null,
        status: batch.status,
        start: formatDateLabel(batch.startDate),
        end: formatDateLabel(batch.expiryDate),
        startDateValue: batch.startDate ? new Date(batch.startDate).toISOString().slice(0, 10) : "",
        expiryDateValue: batch.expiryDate ? new Date(batch.expiryDate).toISOString().slice(0, 10) : "",
        students: studentMap[String(batch._id)] || 0,
        accuracy: Number((scoreMap[String(batch._id)] || 0).toFixed(0)),
        avgScore: Number((scoreMap[String(batch._id)] || 0).toFixed(0)),
        createdAt: batch.createdAt,
        currentActiveTrack,
        attachedCourse: batch.attachedCourse || null,
        supportingCourses: batch.supportingCourses || [],
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listBatches error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch batches." });
  }
};

export const createBatchAdmin = async (req, res) => {
  try {
    const { collegeId, collegeIds, name, startDate, expiryDate, releaseTime, status, assignedTrack, assignedTrackTemplateId, assignedTrackTemplateIds, batchSize, programSelection, attachedCourse, supportingCourses, courses } = req.body;
    const parsedBatchSize =
      batchSize === undefined || batchSize === null || String(batchSize).trim() === ""
        ? null
        : Number(batchSize);
    
    const resolvedCollegeIds = Array.isArray(collegeIds) ? collegeIds : (collegeId ? [collegeId] : []);
    if (resolvedCollegeIds.length === 0 || !name || !startDate || !expiryDate) {
      return res.status(400).json({ success: false, message: "collegeIds, name, startDate, and expiryDate are required." });
    }
    for (const id of resolvedCollegeIds) {
      if (!assertObjectId(id, "collegeIds", res)) return;
    }

    let selectedCourseIds = [];
    if (Array.isArray(courses)) {
      selectedCourseIds = courses;
    } else {
      if (attachedCourse) selectedCourseIds.push(attachedCourse);
      if (Array.isArray(supportingCourses)) selectedCourseIds.push(...supportingCourses);
    }

    for (const id of selectedCourseIds) {
      if (!assertObjectId(id, "courses", res)) return;
    }

    const requestedTemplateIds = Array.isArray(assignedTrackTemplateIds)
      ? assignedTrackTemplateIds
      : (assignedTrackTemplateId ? [assignedTrackTemplateId] : []);
    const trackTemplates = await getTrackTemplatesForAssignment(requestedTemplateIds);
    if (!trackTemplates) {
      return res.status(400).json({ success: false, message: "Select active track templates only." });
    }
    const trackTemplate = trackTemplates.find((template) => template.trackType === "Daily Challenge") || trackTemplates[0] || null;

    const resolvedAttached = selectedCourseIds.length > 0 ? selectedCourseIds[0] : null;
    const resolvedSupporting = selectedCourseIds.length > 1 ? selectedCourseIds.slice(1) : [];

    const session = await mongoose.startSession();
    let batch;
    try {
      await session.withTransaction(async () => {
        const [createdBatch] = await Batch.create(
          [
            {
              collegeId: resolvedCollegeIds[0],
              collegeIds: resolvedCollegeIds,
              name: name.trim(),
              startDate,
              expiryDate,
              assignedTrack: trackTemplates.map((template) => template.name).join(", ") || assignedTrack?.trim() || "",
              ...getBatchTemplateAssignmentFieldsFromTemplates(trackTemplates),
              batchSize: Number.isFinite(parsedBatchSize) && parsedBatchSize > 0 ? parsedBatchSize : null,
              releaseTime: releaseTime || "00:00",
              status: status || BATCH_STATUS.DRAFT,
              programSelection: programSelection || "Placement Sprint",
              attachedCourse: resolvedAttached,
              supportingCourses: resolvedSupporting,
            },
          ],
          { session, ordered: true }
        );

        batch = createdBatch;
        await ensureDefaultBatchTracks(batch._id, session);

        // Sync course assignments
        if (selectedCourseIds.length > 0) {
          await Course.updateMany(
            { _id: { $in: selectedCourseIds } },
            { $addToSet: { assignedBatchIds: batch._id } },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }

    if (!batch) {
      return res.status(500).json({ success: false, message: "Failed to create batch." });
    }

    await writeAuditLog({
      verb: "Created",
      entityType: "Batch",
      entityId: batch._id,
      action: "Created batch",
      detail: batch.name,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: batch });
  } catch (error) {
    console.error("createBatchAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message ? `Failed to create batch: ${error.message}` : "Failed to create batch.",
      error: error.message,
    });
  }
};

export const getBatchDetail = async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!assertObjectId(batchId, "batchId", res)) return;

    const batch = await Batch.findById(batchId)
      .populate("collegeId", "name")
      .populate("collegeIds", "name")
      .populate("assignedTrackTemplate", "name category trackType status")
      .populate("assignedDailyTaskTrack", "name category trackType status")
      .populate("assignedDailyChallengeTrack", "name category trackType status")
      .populate("attachedCourse", "title description numTopics topicIds")
      .populate("supportingCourses", "title description numTopics topicIds")
      .lean();
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const students = await Student.find({ batchId }).lean();
    const studentIds = students.map((s) => s._id);

    const studentEmails = students
      .map((student) => String(student.email || "").trim().toLowerCase())
      .filter(Boolean);

    const users = studentEmails.length
      ? await User.find({ email: { $in: studentEmails } }).select("_id email").lean()
      : [];

    const userEmailToIdMap = new Map();
    const userIds = [];
    users.forEach(u => {
      const email = String(u.email || "").trim().toLowerCase();
      userEmailToIdMap.set(email, u._id);
      userIds.push(u._id);
    });

    const [tracks, submissions, trackTemplates, practiceSubmissions, dailyTaskAttempts, allProgress, dailyChallengeAttempts, codingChallengeSubmissions] = await Promise.all([
      Track.find({ batchId }).populate("orderedQuestionIds", "title").lean(),
      Submission.find(
        studentIds.length
          ? { $or: [{ batchId }, { studentId: { $in: studentIds } }] }
          : { batchId }
      ).lean(),
      TrackTemplate.find({
        $or: [
          { batchId },
          ...(batch.assignedTrackTemplateIds ? batch.assignedTrackTemplateIds.map((id) => ({ _id: id })) : []),
          ...(batch.assignedDailyTaskTrack ? [{ _id: batch.assignedDailyTaskTrack }] : []),
          ...(batch.assignedDailyChallengeTrack ? [{ _id: batch.assignedDailyChallengeTrack }] : []),
          ...(batch.assignedTrackTemplate?._id ? [{ _id: batch.assignedTrackTemplate._id }] : []),
        ],
      })
        .populate("dayAssignments.questionId", "title categoryType categorySlug trackType difficulty content.correctOption")
        .populate("dayAssignments.tasks.questionId", "title categoryType categorySlug trackType difficulty content.correctOption")
        .lean(),
      userIds.length
        ? PracticeSubmission.find({ userId: { $in: userIds } }).lean()
        : Promise.resolve([]),
      userIds.length
        ? DailyTaskAttempt.find({ userId: { $in: userIds }, batchId }).lean()
        : Promise.resolve([]),
      userIds.length
        ? UserProgress.find({ userId: { $in: userIds } }).select("userId courseXP exerciseXP projectXP").lean()
        : Promise.resolve([]),
      studentEmails.length
        ? DailyChallengeAttempt.find({ studentEmail: { $in: studentEmails }, batchId }).populate("codingRoundId").lean()
        : Promise.resolve([]),
            studentEmails.length
        ? StudentCodingSubmission.find({ studentEmail: { $in: studentEmails }, batchId }).lean()
        : Promise.resolve([]),
    ]);

          const challengeSubmissions = codingChallengeSubmissions;

    const mcqSubmissions = studentEmails.length
      ? await StudentMcqSubmission.find({ studentEmail: { $in: studentEmails } })
          .populate("collegeMcqId", "questions")
          .lean()
      : [];
    const latestMcqSubmissionByEmail = new Map();
    const mcqSubmissionsByEmail = new Map();
    mcqSubmissions.forEach((submission) => {
      const email = String(submission.studentEmail || "").trim().toLowerCase();
      const emailSubmissions = mcqSubmissionsByEmail.get(email) || [];
      emailSubmissions.push(submission);
      mcqSubmissionsByEmail.set(email, emailSubmissions);
      const current = latestMcqSubmissionByEmail.get(email);
      if (!current || new Date(submission.submittedAt) > new Date(current.submittedAt)) {
        latestMcqSubmissionByEmail.set(email, submission);
      }
    });
    
    const sumMapValues = (value) => {
      if (!value || typeof value !== "object") return 0;
      return Object.values(value).reduce(
        (total, entry) => total + (typeof entry === "number" ? entry : 0),
        0
      );
    };

    const userXpList = (allProgress || []).map((p) => {
      const courseXp = sumMapValues(p.courseXP);
      const exerciseXp = sumMapValues(p.exerciseXP);
      const projectXp = sumMapValues(p.projectXP);
      return {
        userId: String(p.userId),
        totalXp: courseXp + exerciseXp + projectXp
      };
    });
    userXpList.sort((a, b) => b.totalXp - a.totalXp);
    const userRankMap = new Map();
    userXpList.forEach((entry, idx) => {
      if (!userRankMap.has(entry.userId)) {
        userRankMap.set(entry.userId, idx + 1);
      }
    });

    const userXpMap = new Map(userXpList.map(item => [item.userId, item.totalXp]));

    const localCombineDateAndTime = (date, timeString = "00:00") => {
      if (!date) return new Date();
      const d = new Date(date);
      const [hours, minutes] = String(timeString || "00:00").split(":");
      d.setHours(parseInt(hours) || 0, parseInt(minutes) || 0, 0, 0);
      return d;
    };

    const batchReleaseStart = localCombineDateAndTime(batch.startDate, batch.releaseTime || "00:00");

    const getISTDateParts = (date) => {
      const d = new Date(date);
      const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      return {
        year: istDate.getUTCFullYear(),
        month: istDate.getUTCMonth(),
        date: istDate.getUTCDate(),
      };
    };

    const now = new Date();
    const { year, month, date: day } = getISTDateParts(now);

    const todayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - 5.5 * 60 * 60 * 1000);
    const todayEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - 5.5 * 60 * 60 * 1000);

    const dailyChallengeTemplate = (trackTemplates || []).find(
      (t) => String(t._id) === String(batch.assignedDailyChallengeTrack?._id || batch.assignedDailyChallengeTrack)
    );
    const dailyTaskTemplate = (trackTemplates || []).find(
      (t) => String(t._id) === String(batch.assignedDailyTaskTrack?._id || batch.assignedDailyTaskTrack)
    ) || (trackTemplates || []).find(
      (t) => String(t._id) === String(batch.assignedTrackTemplate?._id || batch.assignedTrackTemplate) && t.trackType === "Daily Task"
    );

    const activeTrackTemplate = trackTemplates.find(
      (t) => t.trackType === "Daily Task"
    );
    let totalMCQsInTemplateToday = 0;
    let totalSQLInTemplateToday = 0;
    let totalCodingInTemplateToday = 0;
    const allottedTypesToday = [];
    let dayNumber = 0;
    const targetTemplateForDay = activeTrackTemplate || dailyChallengeTemplate;
    if (targetTemplateForDay) {
      const releaseStart = localCombineDateAndTime(targetTemplateForDay.startDate || batch.startDate, batch.releaseTime || "00:00");
      dayNumber = Math.floor((now.getTime() - releaseStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const dayAssignment = targetTemplateForDay.dayAssignments?.find((d) => d.dayNumber === dayNumber);
      if (dayAssignment) {
        (dayAssignment.tasks || []).forEach((t) => {
          const type = t.taskType;
          if (type && !allottedTypesToday.includes(type)) {
            allottedTypesToday.push(type);
          }
        });
        if (dayAssignment.questionId && !allottedTypesToday.includes("Coding")) {
          allottedTypesToday.push("Coding");
        }
        totalMCQsInTemplateToday = (dayAssignment.tasks || []).filter(t => t.taskType === "MCQ" || t.taskType === "Aptitude" || t.taskType === "Core CS").length;
        totalSQLInTemplateToday = (dayAssignment.tasks || []).filter(t => t.taskType === "SQL").length;
        totalCodingInTemplateToday = (dayAssignment.tasks || []).filter(t => t.taskType === "Coding" || t.taskType === "Debugging").length;
        if (dayAssignment.questionId) {
          totalCodingInTemplateToday += 1;
        }
      }
    }

    const batchQuestionIds = new Set();
    (trackTemplates || []).forEach((template) => {
      (template.dayAssignments || []).forEach((day) => {
        if (day.questionId) {
          batchQuestionIds.add(String(day.questionId._id || day.questionId));
        }
        (day.tasks || []).forEach((task) => {
          if (task.questionId) {
            batchQuestionIds.add(String(task.questionId._id || task.questionId));
          }
        });
      });
    });
    (tracks || []).forEach((track) => {
      (track.orderedQuestionIds || []).forEach((q) => {
        const qId = q._id || q;
        if (qId) {
          batchQuestionIds.add(String(qId));
        }
      });
    });

    const dayToAssignedIds = new Map();
    let maxTrackDays = 0;
    (trackTemplates || []).forEach(template => {
      (template.dayAssignments || []).forEach(d => {
        const dayNum = d.dayNumber;
        if (dayNum > maxTrackDays) {
          maxTrackDays = dayNum;
        }
        let daySet = dayToAssignedIds.get(dayNum);
        if (!daySet) {
          daySet = new Set();
          dayToAssignedIds.set(dayNum, daySet);
        }
        if (d.questionId) {
          daySet.add(String(d.questionId._id || d.questionId));
        }
        if (d.tasks) {
          d.tasks.forEach(t => {
            if (t.questionId) {
              daySet.add(String(t.questionId._id || t.questionId));
            }
          });
        }
      });
    });

    const questionIdToTypeMap = new Map();
    (trackTemplates || []).forEach(template => {
      (template.dayAssignments || []).forEach(day => {
        if (day.questionId) {
          const q = day.questionId;
          const type = String(q.categoryType || q.trackType || "").toLowerCase();
          let normalizedType = "coding";
          if (type === "mcq" || type === "aptitude" || type === "core cs") {
            normalizedType = "mcq";
          } else if (type === "sql" || q.categorySlug === "sql") {
            normalizedType = "sql";
          }
          questionIdToTypeMap.set(String(q._id || q), normalizedType);
        }
        (day.tasks || []).forEach(t => {
          if (t.questionId) {
            const q = t.questionId;
            const type = String(t.taskType || q.categoryType || q.trackType || "").toLowerCase();
            let normalizedType = "coding";
            if (type === "mcq" || type === "aptitude" || type === "core cs") {
              normalizedType = "mcq";
            } else if (type === "sql" || q.categorySlug === "sql") {
              normalizedType = "sql";
            }
            questionIdToTypeMap.set(String(q._id || q), normalizedType);
          }
        });
      });
    });

    const getTrackQuestionTypes = (template) => {
      if (!template) return [];
      const types = new Set();
      (template.dayAssignments || []).forEach((day) => {
        if (template.trackType === "Daily Task") {
          (day.tasks || []).forEach((t) => {
            if (t.taskType) {
              const type = String(t.taskType).toLowerCase();
              if (type === "mcq" || type === "aptitude" || type === "core cs") {
                types.add("mcq");
              } else if (type === "sql") {
                types.add("sql");
              } else if (type === "coding" || type === "debugging") {
                types.add("coding");
              }
            }
          });
        } else {
          if (day.tasks && day.tasks.length > 0) {
            day.tasks.forEach((t) => {
              if (t.taskType) {
                const type = String(t.taskType).toLowerCase();
                if (type === "mcq" || type === "aptitude" || type === "core cs") {
                  types.add("mcq");
                } else if (type === "sql") {
                  types.add("sql");
                } else if (type === "coding" || type === "debugging") {
                  types.add("coding");
                }
              }
            });
          }
          if (day.questionId) {
            const q = day.questionId;
            const catType = String(q.categoryType || q.trackType || "").toLowerCase();
            if (catType === "mcq" || catType === "aptitude" || catType === "core cs") {
              types.add("mcq");
            } else if (catType === "sql" || q.categorySlug === "sql") {
              types.add("sql");
            } else {
              types.add("coding");
            }
          }
        }
      });
      return Array.from(types);
    };

    const dailyChallengeTypes = getTrackQuestionTypes(dailyChallengeTemplate);
    const dailyChallengeHasMultiple = dailyChallengeTypes.length > 1;

    const dailyTaskTypes = getTrackQuestionTypes(dailyTaskTemplate);
    const dailyTaskHasMultiple = dailyTaskTypes.length > 1;

    const computedStudentsTable = students.map((student) => {
      const studentEmail = String(student.email || "").trim().toLowerCase();
      const studentUserId = student.userId || userEmailToIdMap.get(studentEmail);

      const studentSubsAllTime = submissions.filter((submission) => {
        const matchesStudent = String(submission.studentId) === String(student._id);
        const matchesBatchDirectly = submission.batchId && String(submission.batchId) === String(batch._id);
        const matchesBatchQuestion = submission.questionId && batchQuestionIds.has(String(submission.questionId._id || submission.questionId));
        const isAfterStart = matchesBatchDirectly || new Date(submission.submittedAt || submission.createdAt) >= batchReleaseStart;
        return matchesStudent && (matchesBatchDirectly || matchesBatchQuestion) && isAfterStart;
      });
      const studentMcqSubsAllTime = mcqSubmissions.filter(
        (sub) => String(sub.studentEmail || "").trim().toLowerCase() === studentEmail &&
                 (String(sub.batchId || "") === String(batch._id) || new Date(sub.submittedAt) >= batchReleaseStart)
      );
      const studentPracticeSubsAllTime = practiceSubmissions.filter((sub) => {
        const matchesStudent = studentUserId && String(sub.userId) === String(studentUserId);
        const matchesBatchQuestion = sub.questionBankId && batchQuestionIds.has(String(sub.questionBankId));
        const isAfterStart = (sub.batchId && String(sub.batchId) === String(batch._id)) || new Date(sub.submittedAt) >= batchReleaseStart;
        return matchesStudent && matchesBatchQuestion && isAfterStart;
      });
      const canonicalChallengeAttemptIds = new Set(
        studentSubsAllTime.map((submission) => String(submission.attemptId || "")).filter(Boolean)
      );
      const studentCodingChallengeSubsAllTime = codingChallengeSubmissions.filter((sub) => {
        const matchesStudent = String(sub.studentEmail || "").trim().toLowerCase() === studentEmail;
        const alreadyLinked = sub.attemptId && canonicalChallengeAttemptIds.has(String(sub.attemptId));
        const isAfterStart = (sub.batchId && String(sub.batchId) === String(batch._id)) || new Date(sub.lastSubmissionAt || sub.submittedAt || sub.createdAt) >= batchReleaseStart;
        return matchesStudent && !alreadyLinked && isAfterStart;
      });

      const allCombinedSubs = [
        ...studentSubsAllTime.filter(s => s.challengeType !== "daily_challenge").map(s => ({ ...s, type: "Submission", date: new Date(s.submittedAt || s.createdAt || 0) })),
        ...studentMcqSubsAllTime.map(s => ({ ...s, type: "StudentMcqSubmission", date: new Date(s.submittedAt || 0) })),
        ...studentPracticeSubsAllTime.map(s => ({ ...s, type: "PracticeSubmission", date: new Date(s.submittedAt || 0) })),
        ...studentCodingChallengeSubsAllTime.map(s => ({ ...s, type: "StudentCodingSubmission", date: new Date(s.lastSubmissionAt || s.submittedAt || s.createdAt || 0) }))
      ].filter(s => s.date && !isNaN(s.date.getTime())).sort((a, b) => b.date - a.date);

      const dayWiseHistoryChallengesSubmissionIds = {};

      const getCodingSubmissionTestStats = (submission) => {
        const details = Object.values(submission.problemTestCaseResults || {})
          .flatMap((results) => Array.isArray(results) ? results : []);
        return {
          passed: details.filter((result) => result.passed).length,
          total: details.length,
        };
      };

      const latestAttempt = allCombinedSubs[0];
      const lastAttemptAt = latestAttempt && latestAttempt.date && !isNaN(latestAttempt.date.getTime()) ? latestAttempt.date.toISOString() : null;

      const todayCombinedSubs = allCombinedSubs.filter(sub => sub.date >= todayStart && sub.date <= todayEnd);

      const todayAttempt = dailyTaskAttempts.find(
        (att) => studentUserId && String(att.userId) === String(studentUserId) && (
          att.dayNumber === dayNumber || (
            new Date(att.createdAt || att.updatedAt) >= todayStart && 
            new Date(att.createdAt || att.updatedAt) <= todayEnd
          )
        ) && (String(att.batchId || "") === String(batch._id) || new Date(att.createdAt) >= batchReleaseStart)
      );

      const studentChallengeAttemptToday = dailyChallengeAttempts.find(
        (att) => String(att.studentEmail || "").trim().toLowerCase() === studentEmail &&
                 String(att.batchId || "") === String(batchId) &&
                 (att.codingRoundId?.dayNumber === dayNumber || (att.codingRoundId && String(att.codingRoundId.dayNumber) === String(dayNumber))) &&
                 (new Date(att.createdAt || att.startedAt || new Date()) >= todayStart && new Date(att.createdAt || att.startedAt || new Date()) <= todayEnd)
      );

      const studentChallengeSubToday = challengeSubmissions.find(
        (cs) => String(cs.studentEmail || "").trim().toLowerCase() === studentEmail &&
                ((String(cs.trackId || "") === String(dailyChallengeTemplate?._id || "") && cs.workingDay === dayNumber) ||
                 (studentChallengeAttemptToday && String(cs.codingRoundId) === String(studentChallengeAttemptToday.codingRoundId._id || studentChallengeAttemptToday.codingRoundId)))
      );

      let studentDayNumber = dayNumber;
      if (todayAttempt) {
        studentDayNumber = todayAttempt.dayNumber;
      } else if (todayCombinedSubs.length > 0) {
        for (const sub of todayCombinedSubs) {
          const qId = String(sub.questionId?._id || sub.questionId || sub.questionBankId);
          for (const [dayNum, qIds] of dayToAssignedIds.entries()) {
            if (qIds.has(qId)) {
              studentDayNumber = dayNum;
              break;
            }
          }
        }
      }

      let totalMcqs = 0;
      let totalSqls = 0;
      let totalCodings = 0;

      if (activeTrackTemplate) {
        const dayAssignment = activeTrackTemplate.dayAssignments?.find((d) => d.dayNumber === studentDayNumber);
        if (dayAssignment) {
          totalMcqs = (dayAssignment.tasks || []).filter(t => t.taskType === "MCQ" || t.taskType === "Aptitude" || t.taskType === "Core CS").length;
          totalSqls = (dayAssignment.tasks || []).filter(t => t.taskType === "SQL").length;
          totalCodings = (dayAssignment.tasks || []).filter(t => t.taskType === "Coding" || t.taskType === "Debugging").length;
          if (dayAssignment.questionId) {
            totalCodings += 1;
          }
        }
      }

      let todayScore = "—";
      let todayXp = 0;
      let status = "Not Started";
      let todayScoresDetail = { mcq: "—", coding: "—", sql: "—" };
      if (totalMcqs > 0) todayScoresDetail.mcq = `—/${totalMcqs}`;
      if (totalSqls > 0) todayScoresDetail.sql = `—/${totalSqls}`;
      if (totalCodings > 0) todayScoresDetail.coding = `—/100`;

      const isBatchClosed = batch.status === "Completed" || batch.status === "Expired" || batch.status === "Archived" || (batch.expiryDate && new Date(batch.expiryDate) < now);

      const hasRealAttemptToday = (todayAttempt && todayAttempt.tasksProgress.some(t => t.status !== "Not Started")) ||
                                 (todayCombinedSubs.length > 0) ||
                                 (!!studentChallengeAttemptToday);

      let isDailyTaskCompleted = true;
      if (activeTrackTemplate) {
        const dayAssignment = activeTrackTemplate.dayAssignments?.find((d) => d.dayNumber === studentDayNumber);
        if (dayAssignment && (dayAssignment.questionId || (dayAssignment.tasks && dayAssignment.tasks.length > 0))) {
          isDailyTaskCompleted = !!(todayAttempt && todayAttempt.isFullyCompleted);
        }
      }

      let isDailyChallengeCompleted = true;
      if (dailyChallengeTemplate) {
        const dayAssignment = dailyChallengeTemplate.dayAssignments?.find((d) => d.dayNumber === dayNumber);
        if (dayAssignment && (dayAssignment.questionId || (dayAssignment.tasks && dayAssignment.tasks.length > 0))) {
          isDailyChallengeCompleted = !!(studentChallengeAttemptToday && ["submitted", "ended", "auto_submitted"].includes(studentChallengeAttemptToday.status));
        }
      }

      if (hasRealAttemptToday) {
        status = (isDailyTaskCompleted && isDailyChallengeCompleted) ? "Completed" : "In Progress";

        if (todayAttempt) {
          const mcqTasks = todayAttempt.tasksProgress.filter(t => t.taskType === "MCQ" || t.taskType === "Aptitude" || t.taskType === "Core CS");
          const correctMcq = mcqTasks.filter(t => t.status === "Completed" && t.isCorrect).length;
          const totalMcq = totalMcqs || mcqTasks.length;
          if (totalMcq > 0) {
            const attemptedAnyMcq = mcqTasks.some(t => t.status === "Completed");
            todayScoresDetail.mcq = attemptedAnyMcq ? `${correctMcq}/${totalMcq}` : `—/${totalMcq}`;
          }

          const sqlTasks = todayAttempt.tasksProgress.filter(t => t.taskType === "SQL");
          const correctSql = sqlTasks.filter(t => t.status === "Completed" && t.isCorrect).length;
          const totalSql = totalSqls || sqlTasks.length;
          if (totalSql > 0) {
            const attemptedAnySql = sqlTasks.some(t => t.status === "Completed");
            todayScoresDetail.sql = attemptedAnySql ? `${correctSql}/${totalSql}` : `—/${totalSql}`;
          }

          const codingTasks = todayAttempt.tasksProgress.filter(t => t.taskType === "Coding" || t.taskType === "Debugging");
          const completedCoding = codingTasks.filter(t => t.status === "Completed");
          const totalCoding = totalCodings || codingTasks.length;
          if (totalCoding > 0) {
            if (completedCoding.length > 0) {
              const totalAccuracy = completedCoding.reduce((sum, t) => sum + (t.accuracy ?? (t.isCorrect ? 100 : 0)), 0);
              const avgAccuracy = Math.round(totalAccuracy / completedCoding.length);
              todayScoresDetail.coding = `${avgAccuracy}/100`;
            } else {
              todayScoresDetail.coding = `—/100`;
            }
          }

          let xpFromAttempt = 0;
          let completedCount = 0;
          todayAttempt.tasksProgress.forEach(t => {
            if (t.status === "Completed") {
              completedCount++;
              
              const isMcqLike = t.taskType === "MCQ" || t.taskType === "Aptitude" || t.taskType === "Core CS";
              if (isMcqLike && t.isCorrect !== true) {
                return;
              }

              let difficulty = "Easy";
              const templateTask = activeTrackTemplate?.dayAssignments
                ?.find(da => da.dayNumber === studentDayNumber)
                ?.tasks?.find(tsk => String(tsk.questionId?._id || tsk.questionId) === String(t.questionId));
              if (templateTask && templateTask.questionId?.difficulty) {
                difficulty = templateTask.questionId.difficulty;
              }

              const acc = typeof t.accuracy === "number" ? t.accuracy : (t.isCorrect ? 100 : 0);
              const baseXp = t.xpValue || calculateTaskXP({ taskType: t.taskType, difficulty, accuracy: acc });
              xpFromAttempt += baseXp;
            }
          });
          if (completedCount > 0 && completedCount === todayAttempt.tasksProgress.length) {
            xpFromAttempt += (TASK_XP.ALL_COMPLETED_BONUS || 25);
            xpFromAttempt += (TASK_XP.NO_SKIP_BONUS || 10);
          }
          todayXp = xpFromAttempt;
        } else {
          const todayMcqSubs = todayCombinedSubs.filter(s =>
            (s.type === "Submission" && s.categoryType === "MCQ") ||
            (s.type === "PracticeSubmission" && (s.categoryType === "MCQ" || s.track === "Core CS" || s.track === "Aptitude"))
          );
          const correctMcqCount = todayMcqSubs.filter(s => s.status === "Passed" || s.isCorrect === true).length;
          const totalMcqCount = totalMcqs || todayMcqSubs.length;
          if (totalMcqCount > 0) {
            todayScoresDetail.mcq = `${correctMcqCount}/${totalMcqCount}`;
          } else {
            const todayCollegeMcqSubs = todayCombinedSubs.filter(s => s.type === "StudentMcqSubmission");
            if (todayCollegeMcqSubs.length > 0) {
              const latestCollege = todayCollegeMcqSubs[0];
              const total = latestCollege.answers?.length || latestCollege.collegeMcqId?.questions?.length || 0;
              const correct = latestCollege.answers?.filter(a => a.isCorrect).length ?? latestCollege.score ?? 0;
              todayScoresDetail.mcq = total > 0 ? `${correct}/${total}` : "—";
            }
          }

          const todaySqlSubs = todayCombinedSubs.filter(s =>
            (s.type === "Submission" && (s.track === "SQL" || s.questionId?.trackType === "SQL" || s.questionId?.categorySlug === "sql")) ||
            (s.type === "PracticeSubmission" && s.track === "SQL")
          );
          const totalSqlCount = totalSqls || todaySqlSubs.length;
          if (totalSqlCount > 0) {
            if (todaySqlSubs.length > 0) {
              const latestSql = todaySqlSubs[0];
              if (latestSql.type === "PracticeSubmission") {
                todayScoresDetail.sql = latestSql.isCorrect ? `1/${totalSqlCount}` : `0/${totalSqlCount}`;
              } else {
                const passed = latestSql.finalSubmissionResults?.passedTestCases ?? (latestSql.status === "Passed" ? 1 : 0);
                todayScoresDetail.sql = `${passed}/${totalSqlCount}`;
              }
            } else {
              todayScoresDetail.sql = `—/${totalSqlCount}`;
            }
          }

          const todayCodingSubs = todayCombinedSubs.filter(s =>
            (s.type === "Submission" && (s.categoryType === "Coding" || s.questionId?.categoryType === "Coding" || s.track === "DSA" || s.questionId?.trackType === "DSA") && !(s.track === "SQL" || s.questionId?.trackType === "SQL" || s.questionId?.categorySlug === "sql")) ||
            (s.type === "PracticeSubmission" && s.track === "DSA")
          );

          const totalCodingCount = totalCodings || todayCodingSubs.length;
          if (totalCodingCount > 0) {
            if (todayCodingSubs.length > 0) {
              const latestCoding = todayCodingSubs[0];
              if (latestCoding.type === "PracticeSubmission") {
                todayScoresDetail.coding = `${latestCoding.accuracy ?? (latestCoding.isCorrect ? 100 : 0)}/100`;
              } else {
                todayScoresDetail.coding = `${latestCoding.accuracyScore ?? latestCoding.totalScore ?? 0}/100`;
              }
            } else {
              todayScoresDetail.coding = `—/100`;
            }
          }
        }

        let totalCorrect = 0;
        let totalAssigned = 0;

        if (todayAttempt) {
          let earnedTaskMarks = 0;
          let maxTaskMarks = 0;
          let earnedMcqMarks = 0;
          let maxMcqMarks = 0;
          let earnedSqlMarks = 0;
          let maxSqlMarks = 0;
          let earnedCodingMarks = 0;
          let maxCodingMarks = 0;
          let hasCompletedAny = false;

          todayAttempt.tasksProgress.forEach(t => {
            const qType = String(t.taskType || "").toLowerCase();
            const isMcq = qType === "mcq" || qType === "aptitude" || qType === "core cs";
            const isSql = qType === "sql";
            const isCoding = qType === "coding" || qType === "debugging";
            
            let difficulty = "Easy";
            const templateTask = activeTrackTemplate?.dayAssignments
              ?.find(da => da.dayNumber === studentDayNumber)
              ?.tasks?.find(tsk => String(tsk.questionId?._id || tsk.questionId) === String(t.questionId));
            if (templateTask && templateTask.questionId?.difficulty) {
              difficulty = templateTask.questionId.difficulty;
            }
            
            let maxMarks = 10;
            if (isMcq) {
              maxMarks = 1;
            } else {
              if (difficulty === "Easy") maxMarks = 10;
              else if (difficulty === "Medium") maxMarks = 20;
              else if (difficulty === "Hard") maxMarks = 30;
            }
            
            maxTaskMarks += maxMarks;
            if (isMcq) maxMcqMarks += maxMarks;
            else if (isSql) maxSqlMarks += maxMarks;
            else if (isCoding) maxCodingMarks += maxMarks;
            
            if (t.status === "Completed") {
              hasCompletedAny = true;
              const accuracyVal = typeof t.accuracy === "number" ? t.accuracy : (t.isCorrect ? 100 : 0);
              const marks = maxMarks * (accuracyVal / 100);
              earnedTaskMarks += marks;
              if (isMcq) earnedMcqMarks += marks;
              else if (isSql) earnedSqlMarks += marks;
              else if (isCoding) earnedCodingMarks += marks;
            }
          });

          if (hasCompletedAny) {
            totalCorrect = Number(earnedTaskMarks.toFixed(1));
            totalAssigned = maxTaskMarks;

            if (maxMcqMarks > 0) todayScoresDetail.mcq = `${Number(earnedMcqMarks.toFixed(1))}/${maxMcqMarks}`;
            if (maxSqlMarks > 0) todayScoresDetail.sql = `${Number(earnedSqlMarks.toFixed(1))}/${maxSqlMarks}`;
            if (maxCodingMarks > 0) todayScoresDetail.coding = `${Number(earnedCodingMarks.toFixed(1))}/${maxCodingMarks}`;
          } else {
            totalCorrect = 0;
            totalAssigned = 0;
            todayScoresDetail = { mcq: "—", coding: "—", sql: "—" };
          }
        }

        if (totalAssigned === 0 && todayCombinedSubs.length > 0) {
          const uniqueSubs = new Map();
          todayCombinedSubs.forEach(s => {
            const key = s.questionId?._id || s.questionId || s.collegeMcqId?._id || s.collegeMcqId || s._id;
            if (!uniqueSubs.has(String(key))) {
              uniqueSubs.set(String(key), s);
            }
          });

          uniqueSubs.forEach(s => {
            if (s.type === "StudentMcqSubmission") {
              const correct = s.answers?.filter(a => a.isCorrect).length ?? s.score ?? 0;
              const total = s.answers?.length || s.collegeMcqId?.questions?.length || 1;
              totalCorrect += correct;
              totalAssigned += total;
            } else if (s.type === "PracticeSubmission") {
              totalCorrect += s.isCorrect ? 1 : 0;
              totalAssigned += 1;
            } else if (s.type === "StudentCodingSubmission") {
              const stats = getCodingSubmissionTestStats(s);
              totalCorrect += stats.passed || (Number(s.totalScore || 0) > 0 ? 1 : 0);
              totalAssigned += stats.total || 1;
            } else {
              const passed = s.finalSubmissionResults?.passedTestCases ?? (s.status === "Passed" ? 1 : 0);
              const total = s.finalSubmissionResults?.totalTestCases ?? 1;
              totalCorrect += passed;
              totalAssigned += total;
            }
          });
          todayXp = todayCombinedSubs
            .filter(s => s.type === "Submission" || s.type === "StudentCodingSubmission")
            .reduce((sum, s) => sum + (s.xpEarned || s.totalScore || 0), 0);
        }

        if (dailyTaskHasMultiple) {
          todayScore = "View Scores";
          if (totalMCQsInTemplateToday > 0 && (!todayScoresDetail.mcq || todayScoresDetail.mcq === "—")) {
            todayScoresDetail.mcq = `—/${totalMCQsInTemplateToday}`;
          }
          if (totalSQLInTemplateToday > 0 && (!todayScoresDetail.sql || todayScoresDetail.sql === "—")) {
            todayScoresDetail.sql = `—/${totalSQLInTemplateToday}`;
          }
          if (totalCodingInTemplateToday > 0 && (!todayScoresDetail.coding || todayScoresDetail.coding === "—")) {
            todayScoresDetail.coding = `—/100`;
          }
        } else {
          todayScore = totalAssigned > 0 ? `${totalCorrect}/${totalAssigned}` : "—";
        }
      }

      const totalXp = userXpMap.get(String(studentUserId)) || 0;
      const leaderboardRank = userRankMap.get(String(studentUserId)) || null;

      // Calculate challenge score and challenge XP for today
      let todayChallengeScore = "—";
      let todayChallengeScoresDetail = { java: "—", dsa: "—", sql: "—", aptitude: "—", technical: "—" };
      let todayChallengeXp = 0;
      let todayTaskXp = 0;

      const allChallengeSubs = studentChallengeAttemptToday
        ? [
            ...submissions.filter(
              (sub) =>
                String(sub.attemptId || "") === String(studentChallengeAttemptToday._id) ||
                String(sub._id) === String(studentChallengeAttemptToday.finalSubmissionId)
            ),
            ...studentCodingChallengeSubsAllTime
              .filter((sub) => String(sub.attemptId || "") === String(studentChallengeAttemptToday._id))
              .map((sub) => ({ ...sub, type: "StudentCodingSubmission" })),
          ]
        : [];

      const todayChallengeSubmissionId = studentChallengeSubToday ? `coding-${studentChallengeSubToday._id}` : null;

      if (studentChallengeAttemptToday) {
        let maxChallengeXpToday = 0;
        let maxChallengeMarksToday = 0;
        let todayChallengeMarks = 0;
        let activeDailyChallengeTemplate = dailyChallengeTemplate;
        if (activeDailyChallengeTemplate) {
          const dayAssignment = activeDailyChallengeTemplate.dayAssignments?.find((d) => d.dayNumber === dayNumber);
          if (dayAssignment) {
            const tasks = dayAssignment.tasks || [];
            const tasksList = tasks.length > 0 ? tasks : (dayAssignment.questionId ? [dayAssignment] : []);
            
            const CHALLENGE_XP = { Easy: 25, Medium: 50, Hard: 90 };
            const sectionScores = {
              mcq: {
                java: { earned: 0, max: 0, hasQuestions: false },
                dsa: { earned: 0, max: 0, hasQuestions: false },
                sql: { earned: 0, max: 0, hasQuestions: false },
                aptitude: { earned: 0, max: 0, hasQuestions: false },
                technical: { earned: 0, max: 0, hasQuestions: false },
              },
              coding: {
                java: { earned: 0, max: 0, hasQuestions: false },
                dsa: { earned: 0, max: 0, hasQuestions: false },
                sql: { earned: 0, max: 0, hasQuestions: false },
                aptitude: { earned: 0, max: 0, hasQuestions: false },
                technical: { earned: 0, max: 0, hasQuestions: false },
              }
            };

            tasksList.forEach(t => {
              const q = t.questionId;
              if (q) {
                const difficulty = q.difficulty || "Easy";
                maxChallengeXpToday += (CHALLENGE_XP[difficulty] || 25);
                
                const qType = String(t.taskType || q.trackType || q.categoryType || "").toLowerCase();
                const isMcq = qType === "mcq" || qType === "aptitude";
                let maxMarks = 10;
                if (isMcq) {
                  maxMarks = 1;
                } else {
                  if (difficulty === "Easy") maxMarks = 10;
                  else if (difficulty === "Medium") maxMarks = 20;
                  else if (difficulty === "Hard") maxMarks = 30;
                }
                maxChallengeMarksToday += maxMarks;

                const section = getQuestionSection(q, t.taskType);
                const subType = isMcq ? "mcq" : "coding";
                sectionScores[subType][section].hasQuestions = true;
                sectionScores[subType][section].max += maxMarks;
              }
            });

            if (studentChallengeSubToday) {
              tasksList.forEach((t, idx) => {
                const q = t.questionId;
                if (!q) return;

                const difficulty = q.difficulty || "Easy";
                const baseXP = CHALLENGE_XP[difficulty] || 25;

                const getVal = (map, key) => {
                  if (!map) return undefined;
                  if (map instanceof Map) return map.get(key);
                  return map[key];
                };

                const score = Number(getVal(studentChallengeSubToday.problemScores, idx.toString()) || 0);
                const isSubmitted = getVal(studentChallengeSubToday.problemSubmitted, idx.toString()) || false;
                
                const qType = String(t.taskType || q.trackType || q.categoryType || "").toLowerCase();
                const isMcq = qType === "mcq" || qType === "aptitude";

                let earnedXP = 0;
                if (isMcq) {
                  earnedXP = score >= 100 ? baseXP : 0;
                } else {
                  earnedXP = Math.round((score / 100) * baseXP);
                }

                let maxMarks = 10;
                if (isMcq) {
                  maxMarks = 1;
                } else {
                  if (difficulty === "Easy") maxMarks = 10;
                  else if (difficulty === "Medium") maxMarks = 20;
                  else if (difficulty === "Hard") maxMarks = 30;
                }

                let earnedMarks = 0;
                if (isMcq) {
                  earnedMarks = (score >= 100 && isSubmitted) ? 1 : 0;
                } else {
                  earnedMarks = isSubmitted ? (maxMarks * (score / 100)) : 0;
                }

                if (isSubmitted) {
                  todayChallengeXp += earnedXP;
                  todayChallengeMarks += earnedMarks;
                }

                const section = getQuestionSection(q, t.taskType);
                const subType = isMcq ? "mcq" : "coding";
                sectionScores[subType][section].earned += earnedMarks;
              });

              todayChallengeScoresDetail = {
                mcq: {
                  java: sectionScores.mcq.java.hasQuestions ? `${Number(sectionScores.mcq.java.earned.toFixed(1))}/${sectionScores.mcq.java.max}` : "—",
                  dsa: sectionScores.mcq.dsa.hasQuestions ? `${Number(sectionScores.mcq.dsa.earned.toFixed(1))}/${sectionScores.mcq.dsa.max}` : "—",
                  sql: sectionScores.mcq.sql.hasQuestions ? `${Number(sectionScores.mcq.sql.earned.toFixed(1))}/${sectionScores.mcq.sql.max}` : "—",
                  aptitude: sectionScores.mcq.aptitude.hasQuestions ? `${Number(sectionScores.mcq.aptitude.earned.toFixed(1))}/${sectionScores.mcq.aptitude.max}` : "—",
                  technical: sectionScores.mcq.technical.hasQuestions ? `${Number(sectionScores.mcq.technical.earned.toFixed(1))}/${sectionScores.mcq.technical.max}` : "—",
                },
                coding: {
                  java: sectionScores.coding.java.hasQuestions ? `${Number(sectionScores.coding.java.earned.toFixed(1))}/${sectionScores.coding.java.max}` : "—",
                  dsa: sectionScores.coding.dsa.hasQuestions ? `${Number(sectionScores.coding.dsa.earned.toFixed(1))}/${sectionScores.coding.dsa.max}` : "—",
                  sql: sectionScores.coding.sql.hasQuestions ? `${Number(sectionScores.coding.sql.earned.toFixed(1))}/${sectionScores.coding.sql.max}` : "—",
                  aptitude: sectionScores.coding.aptitude.hasQuestions ? `${Number(sectionScores.coding.aptitude.earned.toFixed(1))}/${sectionScores.coding.aptitude.max}` : "—",
                  technical: sectionScores.coding.technical.hasQuestions ? `${Number(sectionScores.coding.technical.earned.toFixed(1))}/${sectionScores.coding.technical.max}` : "—",
                }
              };
            } else {
              todayChallengeScoresDetail = {
                mcq: {
                  java: sectionScores.mcq.java.hasQuestions ? `—/${sectionScores.mcq.java.max}` : "—",
                  dsa: sectionScores.mcq.dsa.hasQuestions ? `—/${sectionScores.mcq.dsa.max}` : "—",
                  sql: sectionScores.mcq.sql.hasQuestions ? `—/${sectionScores.mcq.sql.max}` : "—",
                  aptitude: sectionScores.mcq.aptitude.hasQuestions ? `—/${sectionScores.mcq.aptitude.max}` : "—",
                  technical: sectionScores.mcq.technical.hasQuestions ? `—/${sectionScores.mcq.technical.max}` : "—",
                },
                coding: {
                  java: sectionScores.coding.java.hasQuestions ? `—/${sectionScores.coding.java.max}` : "—",
                  dsa: sectionScores.coding.dsa.hasQuestions ? `—/${sectionScores.coding.dsa.max}` : "—",
                  sql: sectionScores.coding.sql.hasQuestions ? `—/${sectionScores.coding.sql.max}` : "—",
                  aptitude: sectionScores.coding.aptitude.hasQuestions ? `—/${sectionScores.coding.aptitude.max}` : "—",
                  technical: sectionScores.coding.technical.hasQuestions ? `—/${sectionScores.coding.technical.max}` : "—",
                }
              };
            }
          }
        }

        if (maxChallengeXpToday === 0) {
          maxChallengeXpToday = 70;
        }
        if (maxChallengeMarksToday === 0) {
          maxChallengeMarksToday = 30;
        }

        if (dailyChallengeHasMultiple) {
          todayChallengeScore = "View Scores";
        } else {
          const primarySub = allChallengeSubs[0];
          if (primarySub) {
            todayChallengeXp = primarySub.xpEarned || 0;
            todayChallengeMarks = primarySub.totalScore || 0;
          }

          if (studentChallengeSubToday) {
            todayChallengeScore = `${Number(todayChallengeMarks.toFixed(1))}/${maxChallengeMarksToday}`;
          } else {
            todayChallengeScore = `0/${maxChallengeMarksToday}`;
          }
        }
      }

      // Tasks progress XP
      if (todayAttempt) {
        let xpFromAttempt = 0;
        let completedCount = 0;
        todayAttempt.tasksProgress.forEach(t => {
          if (t.status === "Completed") {
            completedCount++;
            
            const isMcqLike = t.taskType === "MCQ" || t.taskType === "Aptitude" || t.taskType === "Core CS";
            if (isMcqLike && t.isCorrect !== true) {
              return;
            }

            let difficulty = "Easy";
            const templateTask = activeTrackTemplate?.dayAssignments
              ?.find(da => da.dayNumber === studentDayNumber)
              ?.tasks?.find(tsk => String(tsk.questionId?._id || tsk.questionId) === String(t.questionId));
            if (templateTask && templateTask.questionId?.difficulty) {
              difficulty = templateTask.questionId.difficulty;
            }

            const acc = typeof t.accuracy === "number" ? t.accuracy : (t.isCorrect ? 100 : 0);
            const baseXp = t.xpValue || calculateTaskXP({ taskType: t.taskType, difficulty, accuracy: acc });
            xpFromAttempt += baseXp;
          }
        });
        if (completedCount > 0 && completedCount === todayAttempt.tasksProgress.length) {
          xpFromAttempt += (TASK_XP.ALL_COMPLETED_BONUS || 25);
          xpFromAttempt += (TASK_XP.NO_SKIP_BONUS || 10);
        }
        todayTaskXp = xpFromAttempt;
      }

      // Check all-time daily challenge/tasks XP if todayXp wasn't set through attempts
      if (todayXp === 0) {
todayXp = todayChallengeXp + todayTaskXp;
      }

      const dayWiseHistoryTasks = {};
      const dayWiseHistoryTasksDetail = {};
      const dayWiseHistoryChallenges = {};
      const dayWiseHistoryChallengesDetail = {};
      const dayWiseStudentReport = {};

      const getMapValue = (map, key) => {
        if (!map) return undefined;
        if (map instanceof Map) return map.get(key);
        return map[key];
      };

      const toAnswerLabel = (value) => {
        if (value === undefined || value === null || value === "") return "Not answered";
        if (typeof value === "number" || /^\d+$/.test(String(value))) {
          return ["A", "B", "C", "D"][Number(value)] || String(value);
        }
        return String(value);
      };

      const createDayReport = (day) => ({
        dayNumber: day,
        dailyTasks: [],
        dailyChallenge: [],
        metrics: {
          coding: { score: 0, accuracy: 0, count: 0, xp: 0, earnedScore: 0, maxScore: 0 },
          mcq: { score: 0, accuracy: 0, count: 0, xp: 0, earnedScore: 0, maxScore: 0 },
          sql: { score: 0, accuracy: 0, count: 0, xp: 0, earnedScore: 0, maxScore: 0 },
          totalScore: 0,
          totalXp: 0,
        },
      });

      const addReportItem = (dayReport, collection, item) => {
        dayReport[collection].push(item);
        const metric = dayReport.metrics[item.type];
        if (!metric) return;
        metric.score += Number(item.score || 0);
        metric.accuracy += Number(item.accuracy || 0);
        metric.count += 1;
        metric.xp += Number(item.xp || 0);
        metric.earnedScore += Number(item.earnedScore || 0);
        metric.maxScore += Number(item.maxScore || 0);
        dayReport.metrics.totalScore += Number(item.score || 0);
        dayReport.metrics.totalXp += Number(item.xp || 0);
      };

      for (let day = 1; day <= 30; day++) {
        const dayReport = createDayReport(day);
        // --- 1. DAILY TASKS ---
        let correctTasks = 0;
        let totalTasks = 0;
        let correctMcq = 0;
        let correctSql = 0;
        let correctCoding = 0;

        const dailyTaskTemplates = (trackTemplates || []).filter(t => t.trackType === "Daily Task");
        const activeDailyTaskTemplate = (trackTemplates || []).find(
          t => String(t._id) === String(batch.assignedDailyTaskTrack?._id || batch.assignedDailyTaskTrack)
        ) || dailyTaskTemplates[0];

        let totalMCQsInTemplate = 0;
        let totalSQLInTemplate = 0;
        let totalCodingInTemplate = 0;

        if (activeDailyTaskTemplate) {
          const dayAssignment = activeDailyTaskTemplate.dayAssignments?.find((d) => d.dayNumber === day);
          if (dayAssignment) {
            const hasTasks = dayAssignment.tasks && dayAssignment.tasks.length > 0;
            if (hasTasks) {
              dayAssignment.tasks.forEach(t => {
                const type = String(t.taskType || t.questionId?.trackType || t.questionId?.categoryType || "").toLowerCase();
                if (type === "mcq" || type === "aptitude") totalMCQsInTemplate++;
                else if (type === "sql") totalSQLInTemplate++;
                else totalCodingInTemplate++;
              });
            } else if (dayAssignment.questionId) {
              const type = String(dayAssignment.questionId.trackType || dayAssignment.questionId.categoryType || "").toLowerCase();
              if (type === "sql") totalSQLInTemplate++;
              else if (type === "mcq") totalMCQsInTemplate++;
              else totalCodingInTemplate++;
            }
          }
        }

        let dayTasksDetail = { mcq: "—", sql: "—", coding: "—" };
        if (totalMCQsInTemplate > 0) dayTasksDetail.mcq = `—/${totalMCQsInTemplate}`;
        if (totalSQLInTemplate > 0) dayTasksDetail.sql = `—/${totalSQLInTemplate}`;
        if (totalCodingInTemplate > 0) dayTasksDetail.coding = `—/100`;

        const dayAttempt = dailyTaskAttempts.find(
          (att) => studentUserId && String(att.userId) === String(studentUserId) && att.dayNumber === day &&
                  (String(att.batchId || "") === String(batchId) || new Date(att.createdAt) >= batchReleaseStart)
        );
        if (dayAttempt) {
          const taskQuestionMap = new Map();
          dailyTaskTemplates.forEach((template) => {
            const assignment = template.dayAssignments?.find((entry) => entry.dayNumber === day);
            if (assignment?.questionId) taskQuestionMap.set(String(assignment.questionId._id || assignment.questionId), assignment.questionId);
            (assignment?.tasks || []).forEach((task) => {
              if (task.questionId) taskQuestionMap.set(String(task.questionId._id || task.questionId), task.questionId);
            });
          });

          (dayAttempt.tasksProgress || []).forEach((task) => {
            if (!task.attempted && task.status === "Not Started") return;
            const question = taskQuestionMap.get(String(task.questionId?._id || task.questionId)) || {};
            const rawType = String(task.taskType || question.categoryType || question.trackType || "Coding").toLowerCase();
            const type = rawType === "sql" ? "sql" : (rawType === "mcq" || rawType === "aptitude" || rawType === "core cs" ? "mcq" : "coding");
            const accuracy = Number(task.accuracy ?? (task.isCorrect === true ? 100 : 0));
            const configuredTask = activeDailyTaskTemplate?.dayAssignments
              ?.find((entry) => entry.dayNumber === day)
              ?.tasks?.find((entry) => String(entry.questionId?._id || entry.questionId) === String(task.questionId?._id || task.questionId));
            const maxScore = Number(configuredTask?.xpValue || 0) || calculateTaskXP({
              taskType: task.taskType,
              difficulty: question.difficulty || "Easy",
              accuracy: 100,
            });
            addReportItem(dayReport, "dailyTasks", {
              source: "Daily Task",
              type,
              questionId: String(task.questionId?._id || task.questionId),
              title: question.title || "Daily Task question",
              language: task.language || "",
              code: task.code || "",
              score: accuracy,
              accuracy,
              xp: Number(task.xpEarned || 0),
              earnedScore: Math.round((accuracy / 100) * maxScore),
              maxScore,
              executionTime: 0,
              memoryUsed: 0,
              testCases: [],
              selectedOption: type === "mcq" ? toAnswerLabel(task.selectedOption) : "",
              correctAnswer: type === "mcq" ? toAnswerLabel(question.content?.correctOption) : "",
              status: task.status || "Not Started",
            });
          });
          const mcqTasks = dayAttempt.tasksProgress.filter(t => t.taskType === "MCQ" || t.taskType === "Aptitude" || t.taskType === "Core CS");
          const completedMcqs = mcqTasks.filter(t => t.status === "Completed" && t.isCorrect);
          correctMcq += completedMcqs.length;
          const currentTotalMcq = totalMCQsInTemplate;
          totalTasks += currentTotalMcq;
          correctTasks += completedMcqs.length;
          if (currentTotalMcq > 0) {
            const attempted = mcqTasks.some(t => t.status === "Completed");
            dayTasksDetail.mcq = attempted ? `${completedMcqs.length}/${currentTotalMcq}` : `—/${currentTotalMcq}`;
          }

          const sqlTasks = dayAttempt.tasksProgress.filter(t => t.taskType === "SQL");
          const completedSqls = sqlTasks.filter(t => t.status === "Completed" && t.isCorrect);
          correctSql += completedSqls.length;
          const currentTotalSql = totalSQLInTemplate;
          totalTasks += currentTotalSql;
          correctTasks += completedSqls.length;
          if (currentTotalSql > 0) {
            const attempted = sqlTasks.some(t => t.status === "Completed");
            dayTasksDetail.sql = attempted ? `${completedSqls.length}/${currentTotalSql}` : `—/${currentTotalSql}`;
          }

          const codingTasks = dayAttempt.tasksProgress.filter(t => t.taskType === "Coding" || t.taskType === "Debugging");
          const completedCodings = codingTasks.filter(t => t.status === "Completed" && t.isCorrect);
          correctCoding += completedCodings.length;
          const currentTotalCoding = totalCodingInTemplate;
          totalTasks += currentTotalCoding;
          correctTasks += completedCodings.length;
          if (currentTotalCoding > 0) {
            const completedForAvg = codingTasks.filter(t => t.status === "Completed");
            if (completedForAvg.length > 0) {
              const totalAccuracy = completedForAvg.reduce((sum, t) => sum + (t.accuracy ?? (t.isCorrect ? 100 : 0)), 0);
              const avgAccuracy = Math.round(totalAccuracy / completedForAvg.length);
              dayTasksDetail.coding = `${avgAccuracy}/100`;
            } else {
              dayTasksDetail.coding = `—/100`;
            }
          }
        }

        // Submissions for daily tasks on this day
        const assignedTaskIdsForDay = new Set();
        dailyTaskTemplates.forEach(template => {
          const d = template.dayAssignments?.find(da => da.dayNumber === day);
          if (d) {
            if (d.questionId) assignedTaskIdsForDay.add(String(d.questionId._id || d.questionId));
            if (d.tasks) {
              d.tasks.forEach(t => {
                if (t.questionId) assignedTaskIdsForDay.add(String(t.questionId._id || t.questionId));
              });
            }
          }
        });

        let dayTaskSubs = allCombinedSubs.filter(sub => {
          const subId = String(sub.questionId?._id || sub.questionId || sub.collegeMcqId?._id || sub.collegeMcqId || sub.questionBankId || sub._id);
          const matchesWorkingDay = !sub.workingDay || Number(sub.workingDay) === day;
          return assignedTaskIdsForDay.has(subId) && matchesWorkingDay;
        });

        if (dayTaskSubs.length === 0 && !dayAttempt) {
          const releaseStart = localCombineDateAndTime(batch.startDate, batch.releaseTime || "00:00");
          const dayStart = new Date(releaseStart.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
          dayTaskSubs = allCombinedSubs.filter(sub => sub.date >= dayStart && sub.date <= dayEnd && sub.challengeType !== "daily_challenge" && !sub.codingRoundId);
        }

        // DailyTaskAttempt stores one row per assigned question, while Submission
        // stores the richer execution payload. Merge them so every coding answer
        // remains visible with its code and execution details.
        if (dayAttempt && dayTaskSubs.length > 0) {
          dayReport.dailyTasks.forEach((item) => {
            if (item.type !== "coding" && item.type !== "sql") return;
            const submission = dayTaskSubs.find((entry) =>
              String(entry.questionId?._id || entry.questionId || entry.questionBankId || "") === String(item.questionId || "")
            );
            if (!submission) return;
            item.language = submission.language || item.language;
            item.code = submission.submittedCode || submission.code || item.code;
            item.testCases = submission.finalSubmissionResults?.testCaseDetails || submission.testCaseResults || [];
            item.executionTime = Number(submission.executionTime || item.testCases.reduce((sum, result) => sum + Number(result.executionTime || 0), 0));
            item.memoryUsed = Number(submission.memoryUsed || item.testCases.reduce((max, result) => Math.max(max, Number(result.memoryUsed || 0)), 0));
            item.status = submission.status || item.status;
          });
        }

        // Older task attempts may not have a DailyTaskAttempt document. Keep those
        // submissions visible in the report instead of rendering an empty day.
        if (!dayAttempt && dayTaskSubs.length > 0) {
          const taskQuestionMap = new Map();
          dailyTaskTemplates.forEach((template) => {
            const assignment = template.dayAssignments?.find((entry) => entry.dayNumber === day);
            if (assignment?.questionId) taskQuestionMap.set(String(assignment.questionId._id || assignment.questionId), assignment.questionId);
            (assignment?.tasks || []).forEach((task) => {
              if (task.questionId) taskQuestionMap.set(String(task.questionId._id || task.questionId), task.questionId);
            });
          });

          dayTaskSubs.forEach((submission, index) => {
            if (submission.type === "StudentMcqSubmission") {
              const answers = submission.answers || [];
              addReportItem(dayReport, "dailyTasks", {
                source: "Daily Task",
                type: "mcq",
                title: `MCQ submission ${index + 1}`,
                score: answers.length ? Math.round((answers.filter((answer) => answer.isCorrect).length / answers.length) * 100) : Number(submission.score || 0),
                accuracy: answers.length ? Math.round((answers.filter((answer) => answer.isCorrect).length / answers.length) * 100) : Number(submission.score || 0),
                xp: Number(submission.xpEarned || 0),
                selectedOption: answers.map((answer) => toAnswerLabel(answer.selectedAnswer ?? answer.answer)).join(", "),
                correctAnswer: answers.map((answer) => toAnswerLabel(answer.correctAnswer)).join(", "),
                status: "Submitted",
              });
              return;
            }

            const questionId = String(submission.questionId?._id || submission.questionId || submission.questionBankId || "");
            const question = taskQuestionMap.get(questionId) || {};
            const rawType = String(question.categoryType || question.trackType || submission.categoryType || submission.track || "Coding").toLowerCase();
            const type = rawType === "sql" ? "sql" : (rawType === "mcq" || rawType === "aptitude" || rawType === "core cs" ? "mcq" : "coding");
            const score = Number(submission.accuracyScore ?? submission.accuracy ?? submission.totalScore ?? (submission.isCorrect ? 100 : 0));
            const maxScore = calculateTaskXP({
              taskType: type,
              difficulty: question.difficulty || "Easy",
              accuracy: 100,
            });
            addReportItem(dayReport, "dailyTasks", {
              source: "Daily Task",
              type,
              title: question.title || submission.questionTitle || "Daily Task question",
              language: submission.language || "",
              code: submission.submittedCode || submission.code || "",
              score,
              accuracy: score,
              xp: Number(submission.xpEarned || 0),
              earnedScore: Math.round((score / 100) * maxScore),
              maxScore,
              executionTime: Number(submission.executionTime || (submission.finalSubmissionResults?.testCaseDetails || []).reduce((sum, result) => sum + Number(result.executionTime || 0), 0)),
              memoryUsed: Number(submission.memoryUsed || (submission.finalSubmissionResults?.testCaseDetails || []).reduce((max, result) => Math.max(max, Number(result.memoryUsed || 0)), 0)),
              testCases: submission.finalSubmissionResults?.testCaseDetails || submission.testCaseResults || [],
              selectedOption: type === "mcq" ? toAnswerLabel(submission.selectedAnswer) : "",
              correctAnswer: type === "mcq" ? toAnswerLabel(question.content?.correctOption) : "",
              status: submission.status || "Submitted",
            });
          });
        }

        let subCorrectTasks = 0;
        let subTotalTasks = 0;

        // Fill via submissions if attempt progress wasn't present
        if (!dayAttempt && dayTaskSubs.length > 0) {
          const todayMcqSubs = dayTaskSubs.filter(s =>
            (s.type === "Submission" && s.categoryType === "MCQ") ||
            (s.type === "PracticeSubmission" && (s.categoryType === "MCQ" || s.track === "Core CS" || s.track === "Aptitude"))
          );
          const correctMcqCount = todayMcqSubs.filter(s => s.status === "Passed" || s.isCorrect === true).length;
          const currentTotalMcq = totalMCQsInTemplate;
          subTotalTasks += currentTotalMcq;
          subCorrectTasks += correctMcqCount;
          if (currentTotalMcq > 0) {
            dayTasksDetail.mcq = `${correctMcqCount}/${currentTotalMcq}`;
          } else {
            const todayCollegeMcqSubs = dayTaskSubs.filter(s => s.type === "StudentMcqSubmission");
            if (todayCollegeMcqSubs.length > 0) {
              const latestCollege = todayCollegeMcqSubs[0];
              const total = latestCollege.answers?.length || latestCollege.collegeMcqId?.questions?.length || 0;
              const correct = latestCollege.answers?.filter(a => a.isCorrect).length ?? latestCollege.score ?? 0;
              dayTasksDetail.mcq = total > 0 ? `${correct}/${total}` : "—";
            }
          }

          const todaySqlSubs = dayTaskSubs.filter(s =>
            (s.type === "Submission" && (s.track === "SQL" || s.questionId?.trackType === "SQL" || s.questionId?.categorySlug === "sql")) ||
            (s.type === "PracticeSubmission" && s.track === "SQL")
          );
          const currentTotalSql = totalSQLInTemplate;
          subTotalTasks += currentTotalSql;
          if (currentTotalSql > 0) {
            if (todaySqlSubs.length > 0) {
              const latestSql = todaySqlSubs[0];
              if (latestSql.type === "PracticeSubmission") {
                dayTasksDetail.sql = latestSql.isCorrect ? `1/${currentTotalSql}` : `0/${currentTotalSql}`;
                subCorrectTasks += latestSql.isCorrect ? 1 : 0;
              } else {
                const passed = latestSql.finalSubmissionResults?.passedTestCases ?? (latestSql.status === "Passed" ? 1 : 0);
                dayTasksDetail.sql = `${passed}/${currentTotalSql}`;
                subCorrectTasks += passed;
              }
            } else {
              dayTasksDetail.sql = `—/${currentTotalSql}`;
            }
          }

          const todayCodingSubs = dayTaskSubs.filter(s =>
            (s.type === "Submission" && (s.categoryType === "Coding" || s.questionId?.categoryType === "Coding" || s.track === "DSA" || s.questionId?.trackType === "DSA") && !(s.track === "SQL" || s.questionId?.trackType === "SQL" || s.questionId?.categorySlug === "sql")) ||
            (s.type === "PracticeSubmission" && s.track === "DSA")
          );
          const currentTotalCoding = totalCodingInTemplate;
          subTotalTasks += currentTotalCoding;
          if (currentTotalCoding > 0) {
            if (todayCodingSubs.length > 0) {
              const latestCoding = todayCodingSubs[0];
              if (latestCoding.type === "PracticeSubmission") {
                dayTasksDetail.coding = `${latestCoding.accuracy ?? (latestCoding.isCorrect ? 100 : 0)}/100`;
                subCorrectTasks += latestCoding.isCorrect ? 1 : 0;
              } else {
                dayTasksDetail.coding = `${latestCoding.accuracyScore ?? latestCoding.totalScore ?? 0}/100`;
                subCorrectTasks += latestCoding.status === "Passed" ? 1 : 0;
              }
            } else {
              dayTasksDetail.coding = `—/100`;
            }
          }
        }

        const finalCorrectTasks = correctTasks + subCorrectTasks;
        const finalTotalTasks = totalTasks + subTotalTasks;

        if (finalTotalTasks > 0) {
          // Count assigned categories in template for this day
          let dayMcqAssigned = 0;
          let daySqlAssigned = 0;
          let dayCodingAssigned = 0;
          dailyTaskTemplates.forEach(template => {
            const d = template.dayAssignments?.find(da => da.dayNumber === day);
            if (d && d.tasks) {
              dayMcqAssigned += d.tasks.filter(t => t.taskType === "MCQ" || t.taskType === "Aptitude" || t.taskType === "Core CS").length;
              daySqlAssigned += d.tasks.filter(t => t.taskType === "SQL").length;
              dayCodingAssigned += d.tasks.filter(t => t.taskType === "Coding" || t.taskType === "Debugging").length;
            }
            if (d && d.questionId) {
              dayCodingAssigned += 1;
            }
          });

          const assignedCategoriesCount = [
            dayMcqAssigned > 0,
            daySqlAssigned > 0,
            dayCodingAssigned > 0
          ].filter(Boolean).length;

          if (dailyTaskHasMultiple) {
            dayWiseHistoryTasks[day] = "View Scores";
          } else {
            dayWiseHistoryTasks[day] = `${finalCorrectTasks}/${finalTotalTasks}`;
          }
          dayWiseHistoryTasksDetail[day] = dayTasksDetail;
        } else {
          let isAssigned = false;
          dailyTaskTemplates.forEach(template => {
            const d = template.dayAssignments?.find(da => da.dayNumber === day);
            if (d && (d.questionId || (d.tasks && d.tasks.length > 0))) {
              isAssigned = true;
            }
          });
          dayWiseHistoryTasks[day] = isAssigned ? "NIL" : "NA";
        }

        // --- 2. DAILY CHALLENGES ---
        // Submissions for daily challenges on this day
        const dailyChallengeTemplates = (trackTemplates || []).filter(t => t.trackType === "Daily Challenge");
        const activeDailyChallengeTemplate = (trackTemplates || []).find(
          t => String(t._id) === String(batch.assignedDailyChallengeTrack?._id || batch.assignedDailyChallengeTrack)
        ) || dailyChallengeTemplates[0];

        const assignedChallengeIdsForDay = new Set();
        dailyChallengeTemplates.forEach(template => {
          const d = template.dayAssignments?.find(da => da.dayNumber === day);
          if (d) {
            if (d.questionId) assignedChallengeIdsForDay.add(String(d.questionId._id || d.questionId));
            if (d.tasks) {
              d.tasks.forEach(t => {
                if (t.questionId) assignedChallengeIdsForDay.add(String(t.questionId._id || t.questionId));
              });
            }
          }
        });

        // Find if student has a Daily Challenge Attempt for this day using questionId mapping, filtered by batchId
        const dayChallengeAttempt = dailyChallengeAttempts.find(
          (att) => String(att.studentEmail || "").trim().toLowerCase() === studentEmail &&
                  String(att.batchId || "") === String(batchId) &&
                  (assignedChallengeIdsForDay.has(String(att.questionId?._id || att.questionId)) ||
                   (att.codingRoundId && (att.codingRoundId.dayNumber === day || String(att.codingRoundId.dayNumber) === String(day))))
        );

        let studentChallengeSub = challengeSubmissions.find(
          (cs) => String(cs.studentEmail || "").trim().toLowerCase() === studentEmail &&
                  ((cs.attemptId && String(cs.attemptId) === String(dayChallengeAttempt?._id)) ||
                   (dayChallengeAttempt && String(cs.codingRoundId) === String(dayChallengeAttempt.codingRoundId)))
        );
        if (!studentChallengeSub) {
          studentChallengeSub = challengeSubmissions.find(
            (cs) => String(cs.studentEmail || "").trim().toLowerCase() === studentEmail &&
                    cs.workingDay === day
          );
        }

        let correctChallenges = 0;
        let totalChallenges = 0;
        let correctChallengeMarks = 0;
        let totalChallengeMarks = 0;
        let dayChallengeHasMultiple = false;
        let dayChallengesDetail = {
          mcq: { java: "—", dsa: "—", sql: "—", aptitude: "—", technical: "—" },
          coding: { java: "—", dsa: "—", sql: "—", aptitude: "—", technical: "—" }
        };

        if (activeDailyChallengeTemplate) {
          const dayAssignment = activeDailyChallengeTemplate.dayAssignments?.find((d) => d.dayNumber === day);
          if (dayAssignment) {
            const dayTypes = new Set();
            const tasks = dayAssignment.tasks || [];
            const tasksList = tasks.length > 0 ? tasks : (dayAssignment.questionId ? [dayAssignment] : []);
            
            tasksList.forEach(t => {
              const type = String(t.taskType || t.questionId?.trackType || t.questionId?.categoryType || "").toLowerCase();
              if (type === "mcq" || type === "aptitude") dayTypes.add("mcq");
              else if (type === "sql") dayTypes.add("sql");
              else dayTypes.add("coding");
            });
            if (dayTypes.size > 1) {
              dayChallengeHasMultiple = true;
            }

            // Calculate max challenges possible XP using CHALLENGE_XP difficulties
            const CHALLENGE_XP = { Easy: 25, Medium: 50, Hard: 90 };
            const sectionScores = {
              mcq: {
                java: { earned: 0, max: 0, hasQuestions: false },
                dsa: { earned: 0, max: 0, hasQuestions: false },
                sql: { earned: 0, max: 0, hasQuestions: false },
                aptitude: { earned: 0, max: 0, hasQuestions: false },
                technical: { earned: 0, max: 0, hasQuestions: false },
              },
              coding: {
                java: { earned: 0, max: 0, hasQuestions: false },
                dsa: { earned: 0, max: 0, hasQuestions: false },
                sql: { earned: 0, max: 0, hasQuestions: false },
                aptitude: { earned: 0, max: 0, hasQuestions: false },
                technical: { earned: 0, max: 0, hasQuestions: false },
              }
            };

            tasksList.forEach(t => {
              const q = t.questionId;
              if (q) {
                const difficulty = q.difficulty || "Easy";
                totalChallenges += (CHALLENGE_XP[difficulty] || 25);

                const qType = String(t.taskType || q.trackType || q.categoryType || "").toLowerCase();
                const isMcq = qType === "mcq" || qType === "aptitude";
                let maxMarks = 10;
                if (isMcq) {
                  maxMarks = 1;
                } else {
                  if (difficulty === "Easy") maxMarks = 10;
                  else if (difficulty === "Medium") maxMarks = 20;
                  else if (difficulty === "Hard") maxMarks = 30;
                }
                totalChallengeMarks += maxMarks;

                const section = getQuestionSection(q, t.taskType);
                const subType = isMcq ? "mcq" : "coding";
                sectionScores[subType][section].hasQuestions = true;
                sectionScores[subType][section].max += maxMarks;
              }
            });

            // Calculate actual earned XP from StudentCodingSubmission
            if (studentChallengeSub) {
              tasksList.forEach((t, idx) => {
                const q = t.questionId;
                if (!q) return;

                const difficulty = q.difficulty || "Easy";
                const baseXP = CHALLENGE_XP[difficulty] || 25;

                const getVal = (map, key) => {
                  if (!map) return undefined;
                  if (map instanceof Map) return map.get(key);
                  return map[key];
                };

                const score = Number(getVal(studentChallengeSub.problemScores, idx.toString()) || 0);
                const isSubmitted = getVal(studentChallengeSub.problemSubmitted, idx.toString()) || false;
                
                const qType = String(t.taskType || q.trackType || q.categoryType || "").toLowerCase();
                const isMcq = qType === "mcq" || qType === "aptitude";

                let earnedXP = 0;
                if (isMcq) {
                  earnedXP = score >= 100 ? baseXP : 0;
                } else {
                  earnedXP = Math.round((score / 100) * baseXP);
                }

                let maxMarks = 10;
                if (isMcq) {
                  maxMarks = 1;
                } else {
                  if (difficulty === "Easy") maxMarks = 10;
                  else if (difficulty === "Medium") maxMarks = 20;
                  else if (difficulty === "Hard") maxMarks = 30;
                }

                let earnedMarks = 0;
                if (isMcq) {
                  earnedMarks = (score >= 100 && isSubmitted) ? 1 : 0;
                } else {
                  earnedMarks = isSubmitted ? (maxMarks * (score / 100)) : 0;
                }

                if (isSubmitted) {
                  correctChallenges += earnedXP;
                  correctChallengeMarks += earnedMarks;
                }

                const section = getQuestionSection(q, t.taskType);
                const subType = isMcq ? "mcq" : "coding";
                sectionScores[subType][section].earned += earnedMarks;
              });

              dayChallengesDetail = {
                mcq: {
                  java: sectionScores.mcq.java.hasQuestions ? `${Number(sectionScores.mcq.java.earned.toFixed(1))}/${sectionScores.mcq.java.max}` : "—",
                  dsa: sectionScores.mcq.dsa.hasQuestions ? `${Number(sectionScores.mcq.dsa.earned.toFixed(1))}/${sectionScores.mcq.dsa.max}` : "—",
                  sql: sectionScores.mcq.sql.hasQuestions ? `${Number(sectionScores.mcq.sql.earned.toFixed(1))}/${sectionScores.mcq.sql.max}` : "—",
                  aptitude: sectionScores.mcq.aptitude.hasQuestions ? `${Number(sectionScores.mcq.aptitude.earned.toFixed(1))}/${sectionScores.mcq.aptitude.max}` : "—",
                  technical: sectionScores.mcq.technical.hasQuestions ? `${Number(sectionScores.mcq.technical.earned.toFixed(1))}/${sectionScores.mcq.technical.max}` : "—",
                },
                coding: {
                  java: sectionScores.coding.java.hasQuestions ? `${Number(sectionScores.coding.java.earned.toFixed(1))}/${sectionScores.coding.java.max}` : "—",
                  dsa: sectionScores.coding.dsa.hasQuestions ? `${Number(sectionScores.coding.dsa.earned.toFixed(1))}/${sectionScores.coding.dsa.max}` : "—",
                  sql: sectionScores.coding.sql.hasQuestions ? `${Number(sectionScores.coding.sql.earned.toFixed(1))}/${sectionScores.coding.sql.max}` : "—",
                  aptitude: sectionScores.coding.aptitude.hasQuestions ? `${Number(sectionScores.coding.aptitude.earned.toFixed(1))}/${sectionScores.coding.aptitude.max}` : "—",
                  technical: sectionScores.coding.technical.hasQuestions ? `${Number(sectionScores.coding.technical.earned.toFixed(1))}/${sectionScores.coding.technical.max}` : "—",
                }
              };
            } else {
              dayChallengesDetail = {
                mcq: {
                  java: sectionScores.mcq.java.hasQuestions ? `—/${sectionScores.mcq.java.max}` : "—",
                  dsa: sectionScores.mcq.dsa.hasQuestions ? `—/${sectionScores.mcq.dsa.max}` : "—",
                  sql: sectionScores.mcq.sql.hasQuestions ? `—/${sectionScores.mcq.sql.max}` : "—",
                  aptitude: sectionScores.mcq.aptitude.hasQuestions ? `—/${sectionScores.mcq.aptitude.max}` : "—",
                  technical: sectionScores.mcq.technical.hasQuestions ? `—/${sectionScores.mcq.technical.max}` : "—",
                },
                coding: {
                  java: sectionScores.coding.java.hasQuestions ? `—/${sectionScores.coding.java.max}` : "—",
                  dsa: sectionScores.coding.dsa.hasQuestions ? `—/${sectionScores.coding.dsa.max}` : "—",
                  sql: sectionScores.coding.sql.hasQuestions ? `—/${sectionScores.coding.sql.max}` : "—",
                  aptitude: sectionScores.coding.aptitude.hasQuestions ? `—/${sectionScores.coding.aptitude.max}` : "—",
                  technical: sectionScores.coding.technical.hasQuestions ? `—/${sectionScores.coding.technical.max}` : "—",
                }
              };
            }
          }
        }

        if (totalChallenges === 0) {
          totalChallenges = 70;
        }

        if (studentChallengeSub) {
          if (dayChallengeHasMultiple) {
            dayWiseHistoryChallenges[day] = "View Scores";
          } else {
            dayWiseHistoryChallenges[day] = `${Number(correctChallengeMarks.toFixed(1))}/${totalChallengeMarks}`;
          }
          dayWiseHistoryChallengesSubmissionIds[day] = `coding-${studentChallengeSub._id}`;
        } else {
          dayWiseHistoryChallenges[day] = "NA";
          dayWiseHistoryChallengesSubmissionIds[day] = null;
        }
        dayWiseHistoryChallengesDetail[day] = dayChallengesDetail;

        if (studentChallengeSub && activeDailyChallengeTemplate) {
          const assignment = activeDailyChallengeTemplate.dayAssignments?.find((entry) => entry.dayNumber === day);
          const challengeTasks = assignment?.tasks?.length ? assignment.tasks : (assignment?.questionId ? [assignment] : []);
          challengeTasks.forEach((task, index) => {
            const question = task.questionId || {};
            const rawType = String(task.taskType || question.categoryType || question.trackType || "Coding").toLowerCase();
            const type = rawType === "sql" ? "sql" : (rawType === "mcq" || rawType === "aptitude" || rawType === "core cs" ? "mcq" : "coding");
            const score = Number(getMapValue(studentChallengeSub.problemScores, String(index)) || 0);
            const testResults = getMapValue(studentChallengeSub.problemTestCaseResults, String(index)) || [];
            const accuracy = testResults.length
              ? Math.round((testResults.filter((result) => result.passed).length / testResults.length) * 100)
              : score;
            const difficultyXp = { Easy: 25, Medium: 50, Hard: 90 }[question.difficulty] || 25;
            const maxScore = type === "coding"
              ? ({ Easy: 10, Medium: 20, Hard: 30 }[question.difficulty] || 10)
              : (type === "sql" ? 10 : 1);
            addReportItem(dayReport, "dailyChallenge", {
              source: "Daily Challenge",
              type,
              title: question.title || `Challenge question ${index + 1}`,
              language: getMapValue(studentChallengeSub.problemLanguages, String(index)) || "",
              code: getMapValue(studentChallengeSub.problemCodes, String(index)) || "",
              score,
              accuracy,
              xp: Math.round((score / 100) * difficultyXp),
              earnedScore: Math.round((score / 100) * maxScore),
              maxScore,
              selectedOption: type === "mcq" ? toAnswerLabel(getMapValue(studentChallengeSub.problemCodes, String(index))) : "",
              correctAnswer: type === "mcq" ? toAnswerLabel(question.content?.correctOption) : "",
              status: getMapValue(studentChallengeSub.problemSubmitted, String(index)) ? "Submitted" : "Not submitted",
              testCases: testResults,
              executionTime: testResults.reduce((sum, result) => sum + Number(result.executionTime || 0), 0),
              memoryUsed: testResults.reduce((max, result) => Math.max(max, Number(result.memoryUsed || 0)), 0),
            });
          });
        }

        ["coding", "mcq", "sql"].forEach((type) => {
          const metric = dayReport.metrics[type];
          if (metric.count) {
            metric.score = Math.round(metric.score / metric.count);
            metric.accuracy = Math.round(metric.accuracy / metric.count);
          }
        });
        const totalAssessmentCount = ["coding", "mcq", "sql"].reduce(
          (count, type) => count + dayReport.metrics[type].count,
          0
        );
        if (totalAssessmentCount) {
          dayReport.metrics.totalScore = Math.round(dayReport.metrics.totalScore / totalAssessmentCount);
        }
        dayWiseStudentReport[day] = dayReport;
      }


      return {
        id: student._id,
        name: student.name,
        email: student.email,
        todayScore,
        todayScoresDetail,
        todayXp,
        totalXp,
        todayChallengeScore,
        todayChallengeScoresDetail,
        todayChallengeXp,
        todayTaskXp,
        leaderboardRank,
        dayWiseHistoryTasks,
        dayWiseHistoryTasksDetail,
        dayWiseHistoryChallenges,
        dayWiseHistoryChallengesDetail,
        dayWiseStudentReport,
        todayChallengeSubmissionId,
        dayWiseHistoryChallengesSubmissionIds,
        lastAttemptAt,
        status,
      };
    });

    const activeCount = computedStudentsTable.filter(s => s.status === "Completed" || s.status === "In Progress").length;
    const inactiveCount = students.length - activeCount;

    const resolvedTracks = (() => {
      const activeTemplateIds = new Set([
        ...(batch.assignedTrackTemplateIds || []),
        batch.assignedDailyTaskTrack?._id,
        batch.assignedDailyChallengeTrack?._id,
        batch.assignedTrackTemplate?._id,
      ].filter(Boolean).map(id => String(id)));

      const activeTemplates = (trackTemplates || []).filter((template) =>
        activeTemplateIds.has(String(template._id))
      );

      const templateTracks = activeTemplates.map((template) => {
        let days = [];
        let questionsAssigned = 0;
        const sortedDays = [...(template.dayAssignments || [])].sort((a, b) => a.dayNumber - b.dayNumber);
        
        sortedDays.forEach((day) => {
          const mcq = [];
          const coding = [];
          const sql = [];

          if (template.trackType === "Daily Task" || template.trackType === "Daily Challenge") {
            (day.tasks || []).forEach((t) => {
              const title = t.questionId?.title;
              if (!title) return;
              questionsAssigned += 1;
              
              const type = String(t.taskType || t.questionId?.trackType || t.questionId?.categoryType || "").toLowerCase();
              if (type === "mcq" || type === "aptitude") {
                mcq.push(title);
              } else if (type === "sql") {
                sql.push(title);
              } else {
                coding.push(title);
              }
            });
            if (day.questionId) {
              const title = day.questionId.title;
              if (title) {
                questionsAssigned += 1;
                const type = String(day.questionId.trackType || day.questionId.categoryType || "").toLowerCase();
                if (type === "sql") sql.push(title);
                else if (type === "mcq") mcq.push(title);
                else coding.push(title);
              }
            }
          }

          if (mcq.length > 0 || coding.length > 0 || sql.length > 0) {
            days.push({
              dayNumber: day.dayNumber,
              mcq,
              coding,
              sql
            });
          }
        });

        return {
          id: template._id,
          name: template.name || `${template.trackType} Track`,
          questionsAssigned,
          days,
        };
      }).filter((t) => t.questionsAssigned > 0);

      return templateTracks;
    })();

    const activeTrackTemplatesToday = (trackTemplates || []).filter((template) => {
      const releaseStart = localCombineDateAndTime(template.startDate || batch.startDate, batch.releaseTime || "00:00");
      if (now < releaseStart || (batch.expiryDate && now > new Date(batch.expiryDate))) {
        return false;
      }
      const dayNumber = Math.floor((now.getTime() - releaseStart.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      const dayAssignment = template.dayAssignments?.find((d) => d.dayNumber === dayNumber);
      if (!dayAssignment) return false;
      const hasTasks = dayAssignment.tasks && dayAssignment.tasks.length > 0;
      const hasDirectQuestion = !!dayAssignment.questionId;
      return hasTasks || hasDirectQuestion;
    });

    let currentActiveTrack = "None";
    if (activeTrackTemplatesToday.length > 0) {
      currentActiveTrack = activeTrackTemplatesToday.map(t => t.name || `${t.trackType} Track`).join(", ");
    } else {
      const fallbackTracks = [
        ...(batch.assignedTrackTemplateIds || []),
        batch.assignedDailyTaskTrack,
        batch.assignedDailyChallengeTrack,
        batch.assignedTrackTemplate
      ].filter(Boolean);
      
      const uniqueFallbacks = (trackTemplates || []).filter(t =>
        fallbackTracks.some(f => String(f._id || f) === String(t._id))
      );

      if (uniqueFallbacks.length > 0) {
        currentActiveTrack = uniqueFallbacks.map(t => t.name || `${t.trackType} Track`).join(", ");
      } else if (activeTrackTemplate) {
        currentActiveTrack = activeTrackTemplate.name || "None";
      } else if (batch.assignedTrackTemplate) {
        currentActiveTrack = batch.assignedTrackTemplate.name || "None";
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        id: batch._id,
        name: batch.name,
        collegeId: batch.collegeId?._id || null,
        collegeIds: (batch.collegeIds || []).filter(Boolean).map((c) => String(c._id || c)),
        college: batch.collegeIds && batch.collegeIds.filter(Boolean).length > 0
          ? batch.collegeIds.filter(Boolean).map((c) => c.name || "Unknown College").join(", ")
          : (batch.collegeId?.name || "Unknown College"),
        assignedTrack: batch.assignedTrackTemplate?.name || batch.assignedTrack || "",
        assignedTrackTemplateId: batch.assignedTrackTemplate?._id || null,
        assignedTrackTemplateIds: (batch.assignedTrackTemplateIds && batch.assignedTrackTemplateIds.length > 0)
          ? batch.assignedTrackTemplateIds.filter(Boolean).map((t) => String(t._id || t))
          : [
              batch.assignedDailyTaskTrack?._id,
              batch.assignedDailyChallengeTrack?._id,
              batch.assignedTrackTemplate?._id,
            ].filter(Boolean).map(String).filter((templateId, index, templateIds) => templateIds.indexOf(templateId) === index),
        assignedTrackTemplateName: batch.assignedTrackTemplate?.name || "",
        assignedTrackTemplateAt: batch.assignedTrackTemplateAt || null,
        batchSize: typeof batch.batchSize === "number" ? batch.batchSize : null,
        status: batch.status,
        start: formatDateLabel(batch.startDate),
        startDateValue: batch.startDate ? new Date(batch.startDate).toISOString().slice(0, 10) : "",
        expiryDateValue: batch.expiryDate ? new Date(batch.expiryDate).toISOString().slice(0, 10) : "",
        students: students.length,
        totalStudents: students.length,
        activeStudentsToday: activeCount,
        inactiveStudentsToday: inactiveCount,
        currentActiveTrack,
        attachedCourse: (batch.attachedCourse && batch.attachedCourse._id)
          ? {
              id: batch.attachedCourse._id,
              title: batch.attachedCourse.title || "Untitled Course",
              description: batch.attachedCourse.description || "",
              numTopics: batch.attachedCourse.numTopics || batch.attachedCourse.topicIds?.length || 0,
            }
          : null,
        supportingCourses: Array.isArray(batch.supportingCourses)
          ? batch.supportingCourses.filter(Boolean).map((c) => ({
              id: c._id || c,
              title: c.title || "Untitled Course",
              description: c.description || "",
              numTopics: c.numTopics || c.topicIds?.length || 0,
            }))
          : [],
        dayNumber: dayNumber || 1,
        tracks: resolvedTracks,
        maxTrackDays: maxTrackDays || 30,
        studentsTable: computedStudentsTable,
      },
    });
  } catch (error) {
    console.error("getBatchDetail error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch batch details." });
  }
};

export const updateBatchAdmin = async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!assertObjectId(batchId, "batchId", res)) return;

    const parsedBatchSize =
      req.body.batchSize === undefined || req.body.batchSize === null || String(req.body.batchSize).trim() === ""
        ? null
        : Number(req.body.batchSize);

    const existingBatch = await Batch.findById(batchId).lean();
    if (!existingBatch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const hasTemplateUpdate =
      Object.prototype.hasOwnProperty.call(req.body, "assignedTrackTemplateIds") ||
      Object.prototype.hasOwnProperty.call(req.body, "assignedTrackTemplateId");

    const requestedTemplateIds = hasTemplateUpdate
      ? (Array.isArray(req.body.assignedTrackTemplateIds)
          ? req.body.assignedTrackTemplateIds.map(String)
          : (req.body.assignedTrackTemplateId ? [String(req.body.assignedTrackTemplateId)] : []))
      : [
          ...(existingBatch.assignedTrackTemplateIds || []),
          existingBatch.assignedDailyTaskTrack,
          existingBatch.assignedDailyChallengeTrack,
          existingBatch.assignedTrackTemplate,
        ].filter(Boolean).map(String).filter((templateId, index, templateIds) => templateIds.indexOf(templateId) === index);
    const existingTemplateIds = [
      existingBatch.assignedDailyTaskTrack,
      existingBatch.assignedDailyChallengeTrack,
      existingBatch.assignedTrackTemplate,
    ].filter(Boolean).map(String).filter((templateId, index, templateIds) => templateIds.indexOf(templateId) === index);
    const requestedTemplateKey = [...requestedTemplateIds].sort().join('|');
    const existingTemplateKey = [...existingTemplateIds].sort().join('|');
    const previousTrackTemplateId = existingBatch.assignedTrackTemplate || null;
    const trackTemplateChanged = hasTemplateUpdate && requestedTemplateKey !== existingTemplateKey;
    const trackTemplates = await getTrackTemplatesForAssignment(requestedTemplateIds);
    if (!trackTemplates) {
      return res.status(400).json({ success: false, message: "Select active track templates only." });
    }
    const trackTemplate = trackTemplates.find((template) => template.trackType === "Daily Challenge") || trackTemplates[0] || null;

    const existingActiveAssignments = trackTemplateChanged
      ? await StudentTrackAssignment.countDocuments({ batchId, status: "Active" })
      : 0;
    const requiresConfirmation = trackTemplateChanged && (
      Boolean(previousTrackTemplateId) ||
      Boolean(existingBatch.assignedTrack) ||
      existingActiveAssignments > 0
    );
    if (requiresConfirmation && req.body.confirmTrackReplacement !== true) {
      return res.status(409).json({
        success: false,
        code: "TRACK_REPLACEMENT_CONFIRMATION_REQUIRED",
        message: "Confirm replacing the active track for every student in this batch.",
        data: { activeAssignments: existingActiveAssignments },
      });
    }

    const programChanged = req.body.programSelection && req.body.programSelection !== existingBatch.programSelection;
    if (programChanged && req.body.confirmProgramReplacement !== true) {
      const studentCount = await Student.countDocuments({ batchId });
      if (studentCount > 0) {
        return res.status(409).json({
          success: false,
          code: "PROGRAM_REPLACEMENT_CONFIRMATION_REQUIRED",
          message: `Confirm updating the program to "${req.body.programSelection}" for all ${studentCount} students in this batch.`,
          data: { studentCount },
        });
      }
    }

    const update = {
      name: req.body.name?.trim() || existingBatch.name,
      startDate: Object.prototype.hasOwnProperty.call(req.body, "startDate") ? req.body.startDate : existingBatch.startDate,
      expiryDate: Object.prototype.hasOwnProperty.call(req.body, "expiryDate") ? req.body.expiryDate : existingBatch.expiryDate,
      assignedTrack: trackTemplates.map((template) => template.name).join(", ") || req.body.assignedTrack?.trim() || existingBatch.assignedTrack || "",
      ...getBatchTemplateAssignmentFieldsFromTemplates(
        trackTemplates,
        trackTemplateChanged || (trackTemplates.length > 0 && !existingBatch.assignedTrackTemplateAt)
      ),
      batchSize: Number.isFinite(parsedBatchSize) && parsedBatchSize > 0
        ? parsedBatchSize
        : (typeof existingBatch.batchSize === "number" ? existingBatch.batchSize : null),
      releaseTime: req.body.releaseTime || existingBatch.releaseTime || "00:00",
      status: req.body.status || existingBatch.status,
      programSelection: req.body.programSelection || existingBatch.programSelection || "Placement Sprint",
    };

    let primaryCourseId = undefined;
    if (Object.prototype.hasOwnProperty.call(req.body, "primaryCourseId")) {
      primaryCourseId = req.body.primaryCourseId;
    } else if (Object.prototype.hasOwnProperty.call(req.body, "attachedCourse")) {
      primaryCourseId = req.body.attachedCourse;
    }

    if (primaryCourseId !== undefined) {
      if (!primaryCourseId) {
        update.attachedCourse = null;
      } else {
        if (!assertObjectId(primaryCourseId, "attachedCourse", res)) return;
        const courseExists = await Course.exists({ _id: primaryCourseId });
        if (!courseExists) {
          return res.status(404).json({ success: false, message: "Course not found." });
        }
        update.attachedCourse = primaryCourseId;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "courses")) {
      const selectedCourseIds = req.body.courses || [];
      for (const id of selectedCourseIds) {
        if (!assertObjectId(id, "courses", res)) return;
      }
      const activeAttached = Object.prototype.hasOwnProperty.call(update, "attachedCourse") ? update.attachedCourse : existingBatch.attachedCourse;
      const activeAttachedStr = activeAttached ? String(activeAttached) : null;

      if (activeAttachedStr && selectedCourseIds.includes(activeAttachedStr)) {
        update.attachedCourse = activeAttached;
      } else {
        update.attachedCourse = selectedCourseIds[0] || null;
      }
      update.supportingCourses = selectedCourseIds.filter(id => String(id) !== String(update.attachedCourse));
    } else if (Object.prototype.hasOwnProperty.call(req.body, "supportingCourses")) {
      const supporting = req.body.supportingCourses;
      if (Array.isArray(supporting)) {
        for (const id of supporting) {
          if (!assertObjectId(id, "supportingCourses", res)) return;
        }
        update.supportingCourses = supporting;
      }
    } else if (primaryCourseId !== undefined) {
      const activePrimary = primaryCourseId || null;
      if (activePrimary) {
        const allAssignedCourses = await Course.find({ assignedBatchIds: existingBatch._id }).select("_id").lean();
        update.supportingCourses = allAssignedCourses
          .map((c) => c._id)
          .filter((id) => String(id) !== String(activePrimary));
      } else {
        update.supportingCourses = [];
      }
    }

    if (req.body.collegeIds) {
      if (!Array.isArray(req.body.collegeIds) || req.body.collegeIds.length === 0) {
        return res.status(400).json({ success: false, message: "collegeIds must be a non-empty array." });
      }
      for (const id of req.body.collegeIds) {
        if (!assertObjectId(id, "collegeIds", res)) return;
      }
      update.collegeIds = req.body.collegeIds;
      update.collegeId = req.body.collegeIds[0];
    } else if (req.body.collegeId) {
      if (!assertObjectId(req.body.collegeId, "collegeId", res)) return;
      update.collegeId = req.body.collegeId;
      update.collegeIds = [req.body.collegeId];
    }

    const session = await mongoose.startSession();
    let batch;
    let reassignedStudents = 0;
    try {
      await session.withTransaction(async () => {
        batch = await Batch.findByIdAndUpdate(
          batchId,
          { $set: update },
          { new: true, runValidators: true, session }
        );

        // Sync Course.assignedBatchIds
        const activeAttached = Object.prototype.hasOwnProperty.call(update, "attachedCourse") ? update.attachedCourse : existingBatch.attachedCourse;
        const activeSupporting = Object.prototype.hasOwnProperty.call(update, "supportingCourses") ? update.supportingCourses : (existingBatch.supportingCourses || []);
        const selectedCourseIds = [activeAttached, ...activeSupporting].filter(Boolean).map(id => id.toString());

        await Course.updateMany(
          { _id: { $in: selectedCourseIds } },
          { $addToSet: { assignedBatchIds: batchId } },
          { session }
        );

        await Course.updateMany(
          { 
            _id: { $nin: selectedCourseIds },
            assignedBatchIds: batchId 
          },
          { $pull: { assignedBatchIds: batchId } },
          { session }
        );
        if (trackTemplateChanged && trackTemplates.length > 0) {
          reassignedStudents = await applyTrackTemplatesToBatchStudents({
            batchId,
            trackTemplates,
            previousTrackTemplateIds: existingTemplateIds,
            session,
          });
        } else if (trackTemplateChanged) {
          await StudentTrackAssignment.updateMany(
            { batchId, status: "Active" },
            { $set: { status: "Draft", deactivatedAt: new Date() } },
            { session }
          );
        }
        if (programChanged) {
          await Student.updateMany(
            { batchId },
            { $set: { programSelection: req.body.programSelection } },
            { session }
          );
          const studentEmails = await Student.find({ batchId }).distinct("email");
          if (studentEmails.length > 0) {
            await User.updateMany(
              { email: { $in: studentEmails } },
              { $set: { programSelection: req.body.programSelection } },
              { session }
            );
          }
        }
      });
    } finally {
      await session.endSession();
    }

    await ensureDefaultBatchTracks(batchId);

    await writeAuditLog({
      verb: "Updated",
      entityType: "Batch",
      entityId: batch._id,
      action: "Updated batch",
      detail: trackTemplateChanged && trackTemplate
        ? `${batch.name} - assigned ${trackTemplate.name} to ${reassignedStudents} students`
        : batch.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: batch, reassignedStudents });
  } catch (error) {
    console.error("updateBatchAdmin error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message ? `Failed to update batch: ${error.message}` : "Failed to update batch.",
      error: error.message,
    });
  }
};

export const deleteBatchAdmin = async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!assertObjectId(batchId, "batchId", res)) return;

    const batch = await Batch.findByIdAndDelete(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const studentsToDelete = await Student.find({ batchId })
      .select("_id email")
      .lean();
    const studentIds = studentsToDelete.map((student) => student._id);
    const studentEmails = studentsToDelete
      .map((student) => String(student.email || "").trim().toLowerCase())
      .filter(Boolean);

    await Promise.all([
      Submission.deleteMany({
        $or: [{ batchId }, ...(studentIds.length ? [{ studentId: { $in: studentIds } }] : [])],
      }),
      studentEmails.length
        ? StudentCodingSubmission.deleteMany({ studentEmail: { $in: studentEmails } })
        : Promise.resolve(),
      studentEmails.length
        ? StudentMcqSubmission.deleteMany({ studentEmail: { $in: studentEmails } })
        : Promise.resolve(),
      studentIds.length ? Student.deleteMany({ _id: { $in: studentIds } }) : Promise.resolve(),
      studentIds.length ? StudentTrackAssignment.deleteMany({ studentId: { $in: studentIds } }) : Promise.resolve(),
      studentIds.length ? deleteStudentProjectProgress(studentIds) : Promise.resolve(),
      Course.updateMany(
        { assignedBatchIds: batchId },
        { $pull: { assignedBatchIds: batchId } }
      ),
    ]);

    await writeAuditLog({
      verb: "Deleted",
      entityType: "Batch",
      entityId: batch._id,
      action: "Deleted batch",
      detail: batch.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, message: "Batch deleted successfully." });
  } catch (error) {
    console.error("deleteBatchAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete batch." });
  }
};

export const activateBatchAdmin = async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!assertObjectId(batchId, "batchId", res)) return;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    batch.status = BATCH_STATUS.ACTIVE;
    await batch.save();
    await ensureDefaultBatchTracks(batchId);
    await Track.updateMany({ batchId }, { $set: { isLockedAfterActivation: true } });

    await writeAuditLog({
      verb: "Activated",
      entityType: "Batch",
      entityId: batch._id,
      action: "Activated batch",
      detail: batch.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: batch });
  } catch (error) {
    console.error("activateBatchAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to activate batch." });
  }
};

export const listStudentsAdmin = async (req, res) => {
  try {
    const query = {};
    if (req.query.collegeId) {
      if (!assertObjectId(req.query.collegeId, "collegeId", res)) return;
      query.collegeId = req.query.collegeId;
    }
    if (req.query.batchId) {
      if (!assertObjectId(req.query.batchId, "batchId", res)) return;
      query.batchId = req.query.batchId;
    }
    if (req.query.status) query.status = req.query.status;

    const students = await Student.find(query)
      .sort({ createdAt: -1 })
      .populate("collegeId", "name")
      .populate("batchId", "name")
      .lean();

    const studentIds = students.map((student) => student._id);
    const submissionAgg = await Submission.aggregate([
      { $match: { studentId: { $in: studentIds } } },
      {
        $group: {
          _id: "$studentId",
          avgScore: { $avg: "$totalScore" },
          testsTaken: { $sum: 1 },
          lastActive: { $max: "$submittedAt" },
        },
      },
    ]);
    const submissionMap = Object.fromEntries(submissionAgg.map((entry) => [String(entry._id), entry]));

    const data = students.map((student) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      collegeId: student.collegeId?._id || student.collegeId,
      batchId: student.batchId?._id || student.batchId,
      college: student.collegeId?.name || "Unknown College",
      batch: student.batchId?.name || "Unknown Batch",
      track: student.primaryTrack || "General Track",
      programSelection: student.programSelection || "Placement Sprint",
      accuracy: Number((submissionMap[String(student._id)]?.avgScore || 0).toFixed(0)),
      score: Number((submissionMap[String(student._id)]?.avgScore || 0).toFixed(0)),
      streak: student.streak || 0,
      status: student.status,
      testsTaken: submissionMap[String(student._id)]?.testsTaken || student.testsTaken || 0,
      lastActive: submissionMap[String(student._id)]?.lastActive || student.lastActiveAt || null,
      joined: student.createdAt,
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listStudentsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch students." });
  }
};

export const searchExistingStudentsAdmin = async (req, res) => {
  try {
    const search = String(req.query.q || "").trim();
    if (search.length < 2) {
      return res.status(200).json({ success: true, data: { items: [], page: 1, limit: 20, total: 0, hasMore: false } });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(25, Math.max(5, Number.parseInt(req.query.limit, 10) || 20));
    const query = {};
    if (req.query.collegeId) {
      if (!assertObjectId(req.query.collegeId, "collegeId", res)) return;
      query.collegeId = req.query.collegeId;
    }
    if (req.query.excludeBatchId) {
      if (!assertObjectId(req.query.excludeBatchId, "excludeBatchId", res)) return;
      query.batchId = { $ne: new mongoose.Types.ObjectId(req.query.excludeBatchId) };
    }
    if (req.query.status && ["Active", "Inactive", "Suspended"].includes(req.query.status)) {
      query.status = req.query.status;
    }

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchPattern = new RegExp(escapedSearch, "i");
    query.$or = [{ name: searchPattern }, { email: searchPattern }, { rollNo: searchPattern }];
    const sort = req.query.sort === "name-desc" ? { name: -1, email: 1 } : { name: 1, email: 1 };

    const [students, total] = await Promise.all([
      Student.find(query)
        .select("name email rollNo collegeId batchId primaryTrack programSelection status")
        .populate("collegeId", "name")
        .populate("batchId", "name")
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Student.countDocuments(query),
    ]);

    const items = students.map((student) => ({
      id: student._id,
      name: student.name,
      email: student.email,
      rollNo: student.rollNo || "",
      collegeId: student.collegeId?._id || student.collegeId,
      college: student.collegeId?.name || "Unknown College",
      batchId: student.batchId?._id || student.batchId,
      batch: student.batchId?.name || "Unknown Batch",
      track: student.primaryTrack || "General Track",
      programSelection: student.programSelection || "Placement Sprint",
      status: student.status || "Active",
    }));

    return res.status(200).json({ success: true, data: { items, page, limit, total, hasMore: page * limit < total } });
  } catch (error) {
    console.error("searchExistingStudentsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to search existing students." });
  }
};

export const createStudentAdmin = async (req, res) => {
  try {
    const { name, email, rollNo, collegeId, batchId, primaryTrack, status, programSelection } = req.body;
    if (!name || !email || !collegeId || !batchId) {
      return res.status(400).json({ success: false, message: "name, email, collegeId and batchId are required." });
    }
    if (!assertObjectId(collegeId, "collegeId", res) || !assertObjectId(batchId, "batchId", res)) return;

    const normalizedEmail = email.trim().toLowerCase();
    const [batch, existingStudent, linkedUser] = await Promise.all([
      Batch.findById(batchId).lean(),
      Student.findOne({ email: normalizedEmail }).lean(),
      User.findOne({ email: normalizedEmail }).select("_id").lean(),
    ]);

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    if (String(batch.collegeId) !== String(collegeId)) {
      return res.status(400).json({ success: false, message: "Selected batch does not belong to the selected college." });
    }

    if (existingStudent) {
      return res.status(409).json({ success: false, message: "A student with this email already exists." });
    }

    const student = await Student.create({
      name: name.trim(),
      email: normalizedEmail,
      rollNo: rollNo?.trim() || "",
      collegeId,
      batchId,
      userId: linkedUser?._id || null,
      primaryTrack: primaryTrack?.trim() || "General Track",
      programSelection: programSelection || batch.programSelection || "Placement Sprint",
      status: status || "Active",
    });

    if (linkedUser?._id) {
      await User.findByIdAndUpdate(linkedUser._id, {
        $set: {
          batchId,
          startDate: batch.startDate,
          programSelection: programSelection || batch.programSelection || "Placement Sprint",
        },
      });
    }

    await writeAuditLog({
      verb: "Created",
      entityType: "Student",
      entityId: student._id,
      action: "Added student",
      detail: student.name,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: student });
  } catch (error) {
    console.error("createStudentAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to create student.", error: error.message });
  }
};

export const getStudentDetailAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!assertObjectId(studentId, "studentId", res)) return;

    const student = await Student.findById(studentId)
      .populate("collegeId", "name")
      .populate("batchId", "name")
      .lean();

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const submissions = await Submission.find({ studentId }).sort({ submittedAt: -1 }).lean();
    const score =
      submissions.length > 0
        ? Number(
            (
              submissions.reduce((sum, submission) => sum + (submission.totalScore || 0), 0) /
              submissions.length
            ).toFixed(0)
          )
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        id: student._id,
        name: student.name,
        email: student.email,
        college: student.collegeId?.name || "Unknown College",
        batch: student.batchId?.name || "Unknown Batch",
        track: student.primaryTrack || "General Track",
        programSelection: student.programSelection || "Placement Sprint",
        accuracy: score,
        score,
        streak: student.streak || 0,
        testsTaken: submissions.length,
        lastActive: submissions[0]?.submittedAt || student.lastActiveAt,
        status: student.status,
        joined: student.createdAt,
      },
    });
  } catch (error) {
    console.error("getStudentDetailAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch student details." });
  }
};

export const updateStudentAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!assertObjectId(studentId, "studentId", res)) return;
    const existingStudent = await Student.findById(studentId);
    if (!existingStudent) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const update = {
      name: req.body.name?.trim(),
      email: req.body.email?.trim()?.toLowerCase(),
      rollNo: req.body.rollNo?.trim(),
      primaryTrack: req.body.primaryTrack?.trim() || req.body.track?.trim() || "General Track",
      programSelection: req.body.programSelection || "Placement Sprint",
      status: req.body.status,
    };

    if (req.body.collegeId) {
      if (!assertObjectId(req.body.collegeId, "collegeId", res)) return;
      update.collegeId = req.body.collegeId;
    }
    if (req.body.batchId) {
      if (!assertObjectId(req.body.batchId, "batchId", res)) return;
      update.batchId = req.body.batchId;
    }

    const nextCollegeId = update.collegeId || existingStudent.collegeId;
    const nextBatchId = update.batchId || existingStudent.batchId;
    const nextEmail = update.email || existingStudent.email;

    const [batch, duplicateStudent, linkedUser] = await Promise.all([
      Batch.findById(nextBatchId).lean(),
      Student.findOne({ _id: { $ne: studentId }, email: nextEmail }).select("_id").lean(),
      User.findOne({ email: nextEmail }).select("_id").lean(),
    ]);

    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    if (String(batch.collegeId) !== String(nextCollegeId)) {
      return res.status(400).json({ success: false, message: "Selected batch does not belong to the selected college." });
    }

    if (duplicateStudent) {
      return res.status(409).json({ success: false, message: "A student with this email already exists." });
    }

    update.userId = linkedUser?._id || existingStudent.userId || null;

    const student = await Student.findByIdAndUpdate(studentId, { $set: update }, { new: true, runValidators: true });

    if (linkedUser?._id) {
      await User.findByIdAndUpdate(linkedUser._id, {
        $set: {
          batchId: nextBatchId,
          startDate: batch.startDate,
          programSelection: update.programSelection,
        },
      });
    }

    await writeAuditLog({
      verb: "Updated",
      entityType: "Student",
      entityId: student._id,
      action: "Updated student",
      detail: student.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: student });
  } catch (error) {
    console.error("updateStudentAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to update student.", error: error.message });
  }
};

export const removeStudentFromBatchAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { batchId } = req.body;
    if (!assertObjectId(studentId, "studentId", res)) return;
    if (!assertObjectId(batchId, "batchId", res)) return;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    if (!student.batchId || String(student.batchId) !== String(batchId)) {
      return res.status(400).json({ success: false, message: "Student is not assigned to this batch." });
    }

    student.batchId = null;
    await student.save();

    await Promise.all([
      student.userId
        ? User.findByIdAndUpdate(student.userId, { $unset: { batchId: "", startDate: "" } })
        : User.findOneAndUpdate({ email: student.email }, { $unset: { batchId: "", startDate: "" } }),
      StudentTrackAssignment.updateMany(
        { studentId: student._id, batchId, status: "Active" },
        { $set: { status: "Inactive", deactivatedAt: new Date() } }
      ),
    ]);

    await writeAuditLog({
      verb: "Updated",
      entityType: "Student",
      entityId: student._id,
      action: "Removed student from batch",
      detail: student.name,
      actor: req.user,
      metadata: { batchId },
    });

    return res.status(200).json({
      success: true,
      message: "Student removed from batch successfully.",
      data: student,
    });
  } catch (error) {
    console.error("removeStudentFromBatchAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove student from batch.", error: error.message });
  }
};

export const deleteStudentAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!assertObjectId(studentId, "studentId", res)) return;

    const student = await Student.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

    const studentEmail = String(student.email || "").trim().toLowerCase();

    await Promise.all([
      Submission.deleteMany({ studentId }),
      studentEmail ? StudentCodingSubmission.deleteMany({ studentEmail }) : Promise.resolve(),
      studentEmail ? StudentMcqSubmission.deleteMany({ studentEmail }) : Promise.resolve(),
      StudentTrackAssignment.deleteMany({ studentId }),
      deleteStudentProjectProgress([studentId]),
    ]);

    await Student.findByIdAndDelete(studentId);

    await writeAuditLog({
      verb: "Deleted",
      entityType: "Student",
      entityId: student._id,
      action: "Deleted student",
      detail: student.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, message: "Student deleted successfully." });
  } catch (error) {
    console.error("deleteStudentAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete student." });
  }
};

export const bulkDeleteBatchesAdmin = async (req, res) => {
  try {
    const { batchIds } = req.body;
    if (!Array.isArray(batchIds) || batchIds.length === 0) {
      return res.status(400).json({ success: false, message: "batchIds must be a non-empty array." });
    }

    for (const batchId of batchIds) {
      if (!assertObjectId(batchId, "batchId", res)) return;
    }

    const batches = await Batch.find({ _id: { $in: batchIds } }).lean();
    if (!batches.length) {
      return res.status(404).json({ success: false, message: "No batches found for the provided IDs." });
    }

    await Batch.deleteMany({ _id: { $in: batchIds } });

    const studentsToDelete = await Student.find({ batchId: { $in: batchIds } })
      .select("_id email")
      .lean();
    const studentIds = studentsToDelete.map((student) => student._id);
    const studentEmails = studentsToDelete
      .map((student) => String(student.email || "").trim().toLowerCase())
      .filter(Boolean);

    await Promise.all([
      Submission.deleteMany({
        $or: [
          { batchId: { $in: batchIds } },
          ...(studentIds.length ? [{ studentId: { $in: studentIds } }] : [])
        ],
      }),
      studentEmails.length
        ? StudentCodingSubmission.deleteMany({ studentEmail: { $in: studentEmails } })
        : Promise.resolve(),
      studentEmails.length
        ? StudentMcqSubmission.deleteMany({ studentEmail: { $in: studentEmails } })
        : Promise.resolve(),
      studentIds.length ? Student.deleteMany({ _id: { $in: studentIds } }) : Promise.resolve(),
      studentIds.length ? StudentTrackAssignment.deleteMany({ studentId: { $in: studentIds } }) : Promise.resolve(),
      studentIds.length ? deleteStudentProjectProgress(studentIds) : Promise.resolve(),
      Course.updateMany(
        { assignedBatchIds: { $in: batchIds } },
        { $pull: { assignedBatchIds: { $in: batchIds } } }
      ),
    ]);

    for (const batch of batches) {
      await writeAuditLog({
        verb: "Deleted",
        entityType: "Batch",
        entityId: batch._id,
        action: "Deleted batch in bulk",
        detail: batch.name,
        actor: req.user,
      });
    }

    return res.status(200).json({ success: true, message: `${batches.length} batches deleted successfully.` });
  } catch (error) {
    console.error("bulkDeleteBatchesAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to bulk delete batches." });
  }
};
