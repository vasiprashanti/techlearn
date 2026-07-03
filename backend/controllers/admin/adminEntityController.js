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
        college: batch.collegeId?.name || "Unknown College",
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
    const { collegeId, name, startDate, expiryDate, releaseTime, status, assignedTrack, assignedTrackTemplateId, assignedTrackTemplateIds, batchSize, programSelection } = req.body;
    const parsedBatchSize =
      batchSize === undefined || batchSize === null || String(batchSize).trim() === ""
        ? null
        : Number(batchSize);
    if (!collegeId || !name || !startDate || !expiryDate) {
      return res.status(400).json({ success: false, message: "collegeId, name, startDate, and expiryDate are required." });
    }
    if (!assertObjectId(collegeId, "collegeId", res)) return;
    const requestedTemplateIds = Array.isArray(assignedTrackTemplateIds)
      ? assignedTrackTemplateIds
      : (assignedTrackTemplateId ? [assignedTrackTemplateId] : []);
    const trackTemplates = await getTrackTemplatesForAssignment(requestedTemplateIds);
    if (!trackTemplates) {
      return res.status(400).json({ success: false, message: "Select active track templates only." });
    }
    const trackTemplate = trackTemplates.find((template) => template.trackType === "Daily Challenge") || trackTemplates[0] || null;

    const session = await mongoose.startSession();
    let batch;
    try {
      await session.withTransaction(async () => {
        const [createdBatch] = await Batch.create(
          [
            {
              collegeId,
              name: name.trim(),
              startDate,
              expiryDate,
              assignedTrack: trackTemplates.map((template) => template.name).join(", ") || assignedTrack?.trim() || "",
              ...getBatchTemplateAssignmentFieldsFromTemplates(trackTemplates),
              batchSize: Number.isFinite(parsedBatchSize) && parsedBatchSize > 0 ? parsedBatchSize : null,
              releaseTime: releaseTime || "00:00",
              status: status || BATCH_STATUS.DRAFT,
              programSelection: programSelection || "Placement Sprint",
            },
          ],
          { session, ordered: true }
        );

        batch = createdBatch;
        await ensureDefaultBatchTracks(batch._id, session);
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
      .populate("assignedTrackTemplate", "name category trackType status")
      .populate("assignedDailyTaskTrack", "name category trackType status")
      .populate("assignedDailyChallengeTrack", "name category trackType status")
      .populate("attachedCourse", "title description numTopics topicIds")
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
        .populate("dayAssignments.questionId", "title categoryType categorySlug trackType difficulty")
        .populate("dayAssignments.tasks.questionId", "title categoryType categorySlug trackType difficulty")
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
        ? DailyChallengeAttempt.find({ studentEmail: { $in: studentEmails }, batchId }).lean()
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

    const now = new Date();
    const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = utcOffset + (3600000 * 5.5);
    const istDate = new Date(istTime);
    const year = istDate.getUTCFullYear();
    const month = istDate.getUTCMonth();
    const day = istDate.getUTCDate();

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
        return matchesStudent && (matchesBatchDirectly || matchesBatchQuestion);
      });
      const studentMcqSubsAllTime = mcqSubmissions.filter(
        (sub) => String(sub.studentEmail || "").trim().toLowerCase() === studentEmail
      );
      const studentPracticeSubsAllTime = practiceSubmissions.filter((sub) => {
        const matchesStudent = studentUserId && String(sub.userId) === String(studentUserId);
        const matchesBatchQuestion = sub.questionBankId && batchQuestionIds.has(String(sub.questionBankId));
        return matchesStudent && matchesBatchQuestion;
      });
      const canonicalChallengeAttemptIds = new Set(
        studentSubsAllTime.map((submission) => String(submission.attemptId || "")).filter(Boolean)
      );
      const studentCodingChallengeSubsAllTime = codingChallengeSubmissions.filter((sub) => {
        const matchesStudent = String(sub.studentEmail || "").trim().toLowerCase() === studentEmail;
        const alreadyLinked = sub.attemptId && canonicalChallengeAttemptIds.has(String(sub.attemptId));
        return matchesStudent && !alreadyLinked;
      });

      const allCombinedSubs = [
        ...studentSubsAllTime.filter(s => s.challengeType !== "daily_challenge").map(s => ({ ...s, type: "Submission", date: new Date(s.submittedAt || s.createdAt) })),
        ...studentMcqSubsAllTime.map(s => ({ ...s, type: "StudentMcqSubmission", date: new Date(s.submittedAt) })),
        ...studentPracticeSubsAllTime.map(s => ({ ...s, type: "PracticeSubmission", date: new Date(s.submittedAt) })),
        ...studentCodingChallengeSubsAllTime.map(s => ({ ...s, type: "StudentCodingSubmission", date: new Date(s.lastSubmissionAt || s.submittedAt || s.createdAt) }))
      ].sort((a, b) => b.date - a.date);

      const getCodingSubmissionTestStats = (submission) => {
        const details = Object.values(submission.problemTestCaseResults || {})
          .flatMap((results) => Array.isArray(results) ? results : []);
        return {
          passed: details.filter((result) => result.passed).length,
          total: details.length,
        };
      };

      const latestAttempt = allCombinedSubs[0];
      const lastAttemptAt = latestAttempt ? latestAttempt.date.toISOString() : null;

      const todayCombinedSubs = allCombinedSubs.filter(sub => sub.date >= todayStart && sub.date <= todayEnd);

      const todayAttempt = dailyTaskAttempts.find(
        (att) => studentUserId && String(att.userId) === String(studentUserId) && (
          att.dayNumber === dayNumber || (
            new Date(att.createdAt || att.updatedAt) >= todayStart && 
            new Date(att.createdAt || att.updatedAt) <= todayEnd
          )
        )
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
                                 (todayCombinedSubs.length > 0);

      if (hasRealAttemptToday) {
        status = (todayAttempt && todayAttempt.isFullyCompleted) ? "Completed" : "In Progress";

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
          const mcqTasks = todayAttempt.tasksProgress.filter(t => t.taskType === "MCQ" || t.taskType === "Aptitude" || t.taskType === "Core CS");
          const correctMcq = mcqTasks.filter(t => t.status === "Completed" && t.isCorrect).length;
          const totalMcq = mcqTasks.length;
          
          const sqlTasks = todayAttempt.tasksProgress.filter(t => t.taskType === "SQL");
          const correctSql = sqlTasks.filter(t => t.status === "Completed" && t.isCorrect).length;
          const totalSql = sqlTasks.length;

          const codingTasks = todayAttempt.tasksProgress.filter(t => t.taskType === "Coding" || t.taskType === "Debugging");
          const correctCoding = codingTasks.filter(t => t.status === "Completed" && t.isCorrect).length;
          const totalCoding = codingTasks.length;

          totalCorrect = correctMcq + correctSql + correctCoding;
          totalAssigned = totalMcq + totalSql + totalCoding;
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

        todayScore = totalAssigned > 0 ? `${totalCorrect}/${totalAssigned}` : "—";

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
      let todayChallengeScoresDetail = { mcq: "—", coding: "—", sql: "—" };
      let todayChallengeXp = 0;
      let todayTaskXp = 0;

      const studentChallengeAttemptToday = dailyChallengeAttempts.find(
        (att) => String(att.studentEmail || "").trim().toLowerCase() === studentEmail &&
                 String(att.batchId || "") === String(batchId)
      );
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

      const studentChallengeSubToday = challengeSubmissions.find(
        (cs) => String(cs.studentEmail || "").trim().toLowerCase() === studentEmail &&
                ((String(cs.trackId || "") === String(dailyChallengeTemplate?._id || "") && cs.workingDay === dayNumber) ||
                 (studentChallengeAttemptToday && String(cs.codingRoundId) === String(studentChallengeAttemptToday.codingRoundId)))
      );

      if (studentChallengeAttemptToday) {
        let maxChallengeXpToday = 0;
        let activeDailyChallengeTemplate = dailyChallengeTemplate;
        if (activeDailyChallengeTemplate) {
          const dayAssignment = activeDailyChallengeTemplate.dayAssignments?.find((d) => d.dayNumber === dayNumber);
          if (dayAssignment) {
            const tasks = dayAssignment.tasks || [];
            const tasksList = tasks.length > 0 ? tasks : (dayAssignment.questionId ? [dayAssignment] : []);
            
            const CHALLENGE_XP = { Easy: 25, Medium: 50, Hard: 90 };
            tasksList.forEach(t => {
              const q = t.questionId;
              if (q) {
                const difficulty = q.difficulty || "Easy";
                maxChallengeXpToday += (CHALLENGE_XP[difficulty] || 25);
              }
            });

            if (studentChallengeSubToday) {
              let mcqCount = 0;
              let mcqCorrect = 0;
              let sqlCount = 0;
              let sqlCorrect = 0;
              let codingCount = 0;
              let codingTotalAccuracy = 0;

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
                const isSql = qType === "sql";

                let earnedXP = 0;
                if (isMcq) {
                  earnedXP = score >= 100 ? baseXP : 0;
                } else {
                  earnedXP = Math.round((score / 100) * baseXP);
                }

                if (isSubmitted) {
                  todayChallengeXp += earnedXP;
                }

                if (isMcq) {
                  mcqCount++;
                  if (score >= 100 && isSubmitted) mcqCorrect++;
                } else if (isSql) {
                  sqlCount++;
                  if (score >= 100 && isSubmitted) sqlCorrect++;
                } else {
                  codingCount++;
                  codingTotalAccuracy += score;
                }
              });

              if (mcqCount > 0) {
                todayChallengeScoresDetail.mcq = `${mcqCorrect}/${mcqCount}`;
              }
              if (sqlCount > 0) {
                todayChallengeScoresDetail.sql = `${sqlCorrect}/${sqlCount}`;
              }
              if (codingCount > 0) {
                todayChallengeScoresDetail.coding = `${Math.round(codingTotalAccuracy / codingCount)}/100`;
              }
            }
          }
        }

        if (maxChallengeXpToday === 0) {
          maxChallengeXpToday = 70;
        }

        if (dailyChallengeHasMultiple) {
          todayChallengeScore = "View Scores";
        } else {
          // Group scores by category type
          const mcqSubs = allChallengeSubs.filter((sub) => questionIdToTypeMap.get(String(sub.questionId)) === "mcq");
          const sqlSubs = allChallengeSubs.filter((sub) => questionIdToTypeMap.get(String(sub.questionId)) === "sql");
          const codingSubs = allChallengeSubs.filter(
            (sub) =>
              sub.type === "StudentCodingSubmission" ||
              questionIdToTypeMap.get(String(sub.questionId)) === "coding" ||
              !questionIdToTypeMap.has(String(sub.questionId))
          );

          // Calculate challenge template questions for today
          const challengeTemplateTodayQuestions = [];
          if (dailyChallengeTemplate) {
            const dayAssignment = dailyChallengeTemplate.dayAssignments?.find((d) => d.dayNumber === dayNumber);
            if (dayAssignment) {
              if (dayAssignment.tasks && dayAssignment.tasks.length > 0) {
                dayAssignment.tasks.forEach((t) => {
                  if (t.questionId) challengeTemplateTodayQuestions.push(t.questionId);
                });
              } else if (dayAssignment.questionId) {
                challengeTemplateTodayQuestions.push(dayAssignment.questionId);
              }
            }
          }

          let totalMcqToday = 0;
          let totalSqlToday = 0;
          let totalCodingToday = 0;
          challengeTemplateTodayQuestions.forEach((q) => {
            const type = questionIdToTypeMap.get(String(q._id || q));
            if (type === "mcq") totalMcqToday++;
            else if (type === "sql") totalSqlToday++;
            else totalCodingToday++;
          });

          if (mcqSubs.length > 0) {
            const totalCorrect = mcqSubs.filter((s) => s.status === "Passed" || s.isCorrect === true || s.totalScore > 0).length;
            todayChallengeScoresDetail.mcq = `${totalCorrect}/${totalMcqToday}`;
          } else if (totalMcqToday > 0) {
            todayChallengeScoresDetail.mcq = `—/${totalMcqToday}`;
          }

          if (sqlSubs.length > 0) {
            const totalCorrect = sqlSubs.filter((s) => s.status === "Passed" || s.isCorrect === true || s.totalScore > 0).length;
            todayChallengeScoresDetail.sql = `${totalCorrect}/${totalSqlToday}`;
          } else if (totalSqlToday > 0) {
            todayChallengeScoresDetail.sql = `—/${totalSqlToday}`;
          }

          if (codingSubs.length > 0) {
            const totalAccuracy = codingSubs.reduce((sum, s) => sum + (s.accuracyScore ?? s.totalScore ?? 0), 0);
            const avgAccuracy = Math.round(totalAccuracy / codingSubs.length);
            todayChallengeScoresDetail.coding = `${avgAccuracy}/100`;
          } else if (totalCodingToday > 0) {
            todayChallengeScoresDetail.coding = `—/100`;
          }

          const primarySub = allChallengeSubs[0];
          if (primarySub) {
            todayChallengeXp = primarySub.xpEarned || primarySub.totalScore || 0;
          }

          if (studentChallengeSubToday) {
            todayChallengeScore = `${todayChallengeXp}/${maxChallengeXpToday}`;
          } else {
            todayChallengeScore = `0/${maxChallengeXpToday}`;
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
            const templateTask = activeDailyTaskTemplate?.dayAssignments
              ?.find(da => da.dayNumber === day)
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

      for (let day = 1; day <= 30; day++) {
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
          (att) => studentUserId && String(att.userId) === String(studentUserId) && att.dayNumber === day
        );
        if (dayAttempt) {
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
          return assignedTaskIdsForDay.has(subId);
        });

        if (dayTaskSubs.length === 0 && !dayAttempt) {
          const releaseStart = localCombineDateAndTime(batch.startDate, batch.releaseTime || "00:00");
          const dayStart = new Date(releaseStart.getTime() + (day - 1) * 24 * 60 * 60 * 1000);
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
          dayTaskSubs = allCombinedSubs.filter(sub => sub.date >= dayStart && sub.date <= dayEnd && sub.challengeType !== "daily_challenge" && !sub.codingRoundId);
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
                  assignedChallengeIdsForDay.has(String(att.questionId?._id || att.questionId))
        );

        const studentChallengeSub = challengeSubmissions.find(
          (cs) => String(cs.studentEmail || "").trim().toLowerCase() === studentEmail &&
                  ((cs.attemptId && String(cs.attemptId) === String(dayChallengeAttempt?._id)) ||
                   (dayChallengeAttempt && String(cs.codingRoundId) === String(dayChallengeAttempt.codingRoundId)))
        );

        let correctChallenges = 0;
        let totalChallenges = 0;
        let dayChallengeHasMultiple = false;
        let dayChallengesDetail = { mcq: "—", sql: "—", coding: "—" };

        if (activeDailyChallengeTemplate) {
          const dayAssignment = activeDailyChallengeTemplate.dayAssignments?.find((d) => d.dayNumber === day);
          if (dayAssignment) {
            const dayTypes = new Set();
            const tasks = dayAssignment.tasks || [];
            if (tasks.length > 0) {
              tasks.forEach(t => {
                const type = String(t.taskType || t.questionId?.trackType || t.questionId?.categoryType || "").toLowerCase();
                if (type === "mcq" || type === "aptitude") dayTypes.add("mcq");
                else if (type === "sql") dayTypes.add("sql");
                else dayTypes.add("coding");
              });
            } else if (dayAssignment.questionId) {
              const type = String(dayAssignment.questionId.trackType || dayAssignment.questionId.categoryType || "").toLowerCase();
              if (type === "mcq" || type === "aptitude") dayTypes.add("mcq");
              else if (type === "sql") dayTypes.add("sql");
              else dayTypes.add("coding");
            }
            if (dayTypes.size > 1) {
              dayChallengeHasMultiple = true;
            }

            // Calculate max challenges possible XP using CHALLENGE_XP difficulties
            const CHALLENGE_XP = { Easy: 25, Medium: 50, Hard: 90 };
            const tasksList = tasks.length > 0 ? tasks : (dayAssignment.questionId ? [dayAssignment] : []);
            
            tasksList.forEach(t => {
              const q = t.questionId;
              if (q) {
                const difficulty = q.difficulty || "Easy";
                totalChallenges += (CHALLENGE_XP[difficulty] || 25);
              }
            });

            // Calculate actual earned XP from StudentCodingSubmission
            if (studentChallengeSub) {
              let mcqCount = 0;
              let mcqCorrect = 0;
              let sqlCount = 0;
              let sqlCorrect = 0;
              let codingCount = 0;
              let codingTotalAccuracy = 0;

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
                const isSql = qType === "sql";

                let earnedXP = 0;
                if (isMcq) {
                  earnedXP = score >= 100 ? baseXP : 0;
                } else {
                  earnedXP = Math.round((score / 100) * baseXP);
                }

                if (isSubmitted) {
                  correctChallenges += earnedXP;
                }

                if (isMcq) {
                  mcqCount++;
                  if (score >= 100 && isSubmitted) mcqCorrect++;
                } else if (isSql) {
                  sqlCount++;
                  if (score >= 100 && isSubmitted) sqlCorrect++;
                } else {
                  codingCount++;
                  codingTotalAccuracy += score;
                }
              });

              if (mcqCount > 0) {
                dayChallengesDetail.mcq = `${mcqCorrect}/${mcqCount}`;
              }
              if (sqlCount > 0) {
                dayChallengesDetail.sql = `${sqlCorrect}/${sqlCount}`;
              }
              if (codingCount > 0) {
                dayChallengesDetail.coding = `${Math.round(codingTotalAccuracy / codingCount)}/100`;
              }
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
            dayWiseHistoryChallenges[day] = `${correctChallenges}/${totalChallenges}`;
          }
        } else {
          dayWiseHistoryChallenges[day] = "NA";
        }
        dayWiseHistoryChallengesDetail[day] = dayChallengesDetail;
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
        college: batch.collegeId?.name || "Unknown College",
        assignedTrack: batch.assignedTrackTemplate?.name || batch.assignedTrack || "",
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
        attachedCourse: batch.attachedCourse
          ? {
              id: batch.attachedCourse._id,
              title: batch.attachedCourse.title || "Untitled Course",
              description: batch.attachedCourse.description || "",
              numTopics: batch.attachedCourse.numTopics || batch.attachedCourse.topicIds?.length || 0,
            }
          : null,
        dayNumber: dayNumber || 1,
        tracks: resolvedTracks,
        maxTrackDays: maxTrackDays || 30,
        studentsTable: computedStudentsTable,
        attachedCourse: batch.attachedCourse
          ? {
              id: batch.attachedCourse._id,
              title: batch.attachedCourse.title,
              description: batch.attachedCourse.description,
              numTopics: batch.attachedCourse.numTopics || batch.attachedCourse.topicIds?.length || 0,
            }
          : null,
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

    if (Object.prototype.hasOwnProperty.call(req.body, "attachedCourse")) {
      const attachedCourseValue = req.body.attachedCourse;
      if (!attachedCourseValue) {
        update.attachedCourse = null;
      } else {
        if (!assertObjectId(attachedCourseValue, "attachedCourse", res)) return;
        const courseExists = await Course.exists({ _id: attachedCourseValue });
        if (!courseExists) {
          return res.status(404).json({ success: false, message: "Attached course not found." });
        }
        update.attachedCourse = attachedCourseValue;
      }
    }

    if (req.body.collegeId) {
      if (!assertObjectId(req.body.collegeId, "collegeId", res)) return;
      update.collegeId = req.body.collegeId;
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
