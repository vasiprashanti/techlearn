import mongoose from "mongoose";
import College from "../../models/College.js";
import Batch, { BATCH_STATUS } from "../../models/Batch.js";
import Student from "../../models/Student.js";
import Submission from "../../models/Submission.js";
import Track from "../../models/Track.js";
import { writeAuditLog } from "../../utils/auditLogger.js";
import { assertObjectId, formatDateLabel } from "./adminCommon.js";

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
        city: college.city || "",
        status: college.status || "Active",
        totalStudents: students.length,
        activeStudents,
        activeBatches: batches.filter((batch) => batch.status === BATCH_STATUS.ACTIVE).length,
        avgScore: Number((submissions[0]?.avgScore || 0).toFixed(0)),
        submissionRate:
          students.length > 0 ? Number(((activeStudents / students.length) * 100).toFixed(0)) : 0,
        batches: batches.map((batch) => ({
          id: batch._id,
          name: batch.name,
          students: batchStudentMap[String(batch._id)] || 0,
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

    const college = await College.findByIdAndDelete(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found." });
    }

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

export const listBatches = async (req, res) => {
  try {
    const batches = await Batch.find()
      .sort({ createdAt: -1 })
      .populate("collegeId", "name")
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

    const data = batches.map((batch) => ({
      id: batch._id,
      name: batch.name,
      college: batch.collegeId?.name || "Unknown College",
      status: batch.status,
      start: formatDateLabel(batch.startDate),
      end: formatDateLabel(batch.expiryDate),
      students: studentMap[String(batch._id)] || 0,
      avgScore: Number((scoreMap[String(batch._id)] || 0).toFixed(0)),
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("listBatches error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch batches." });
  }
};

export const createBatchAdmin = async (req, res) => {
  try {
    const { collegeId, name, startDate, expiryDate, releaseTime, status } = req.body;
    if (!collegeId || !name || !startDate || !expiryDate) {
      return res.status(400).json({ success: false, message: "collegeId, name, startDate, and expiryDate are required." });
    }
    if (!assertObjectId(collegeId, "collegeId", res)) return;

    const batch = await Batch.create({
      collegeId,
      name: name.trim(),
      startDate,
      expiryDate,
      releaseTime: releaseTime || "00:00",
      status: status || BATCH_STATUS.DRAFT,
    });

    await Track.insertMany([
      { batchId: batch._id, trackType: "Core", durationDays: 0, orderedQuestionIds: [] },
      { batchId: batch._id, trackType: "DSA", durationDays: 0, orderedQuestionIds: [] },
      { batchId: batch._id, trackType: "SQL", durationDays: 0, orderedQuestionIds: [] },
    ]);

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
    return res.status(500).json({ success: false, message: "Failed to create batch.", error: error.message });
  }
};

export const getBatchDetail = async (req, res) => {
  try {
    const { batchId } = req.params;
    if (!assertObjectId(batchId, "batchId", res)) return;

    const batch = await Batch.findById(batchId).populate("collegeId", "name").lean();
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    const [tracks, students, submissions] = await Promise.all([
      Track.find({ batchId }).populate("orderedQuestionIds", "title").lean(),
      Student.find({ batchId }).lean(),
      Submission.find({ batchId }).lean(),
    ]);

    const avgScore =
      submissions.length > 0
        ? Number(
            (
              submissions.reduce((sum, submission) => sum + (submission.totalScore || 0), 0) /
              submissions.length
            ).toFixed(0)
          )
        : 0;

    const avgStreak =
      students.length > 0
        ? Number((students.reduce((sum, student) => sum + (student.streak || 0), 0) / students.length).toFixed(0))
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        id: batch._id,
        name: batch.name,
        college: batch.collegeId?.name || "Unknown College",
        status: batch.status,
        start: formatDateLabel(batch.startDate),
        students: students.length,
        avgScore,
        avgStreakDays: avgStreak,
        tracks: tracks.map((track) => ({
          id: track._id,
          name: `${track.trackType} Track`,
          questionsAssigned: track.orderedQuestionIds?.length || 0,
          days: (track.orderedQuestionIds || []).map((question) => question.title),
        })),
        studentsTable: students.map((student) => {
          const studentSubs = submissions.filter(
            (submission) => String(submission.studentId) === String(student._id)
          );
          const score =
            studentSubs.length > 0
              ? Number(
                  (
                    studentSubs.reduce((sum, submission) => sum + (submission.totalScore || 0), 0) /
                    studentSubs.length
                  ).toFixed(0)
                )
              : 0;
          return {
            id: student._id,
            name: student.name,
            email: student.email,
            score,
            streak: `${student.streak || 0} / ${Math.max(1, Math.ceil((Date.now() - new Date(batch.startDate).getTime()) / (24 * 60 * 60 * 1000)))}`,
          };
        }),
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

    const update = {
      name: req.body.name?.trim(),
      startDate: req.body.startDate,
      expiryDate: req.body.expiryDate,
      releaseTime: req.body.releaseTime || "00:00",
      status: req.body.status,
    };

    if (req.body.collegeId) {
      if (!assertObjectId(req.body.collegeId, "collegeId", res)) return;
      update.collegeId = req.body.collegeId;
    }

    const batch = await Batch.findByIdAndUpdate(batchId, { $set: update }, { new: true, runValidators: true });
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found." });
    }

    await writeAuditLog({
      verb: "Updated",
      entityType: "Batch",
      entityId: batch._id,
      action: "Updated batch",
      detail: batch.name,
      actor: req.user,
    });

    return res.status(200).json({ success: true, data: batch });
  } catch (error) {
    console.error("updateBatchAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to update batch.", error: error.message });
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

    await Track.deleteMany({ batchId });

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
      college: student.collegeId?.name || "Unknown College",
      batch: student.batchId?.name || "Unknown Batch",
      track: student.primaryTrack || "General Track",
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

export const createStudentAdmin = async (req, res) => {
  try {
    const { name, email, rollNo, collegeId, batchId, primaryTrack, status } = req.body;
    if (!name || !email || !collegeId || !batchId) {
      return res.status(400).json({ success: false, message: "name, email, collegeId and batchId are required." });
    }
    if (!assertObjectId(collegeId, "collegeId", res) || !assertObjectId(batchId, "batchId", res)) return;

    const student = await Student.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      rollNo: rollNo?.trim() || "",
      collegeId,
      batchId,
      primaryTrack: primaryTrack?.trim() || "General Track",
      status: status || "Active",
    });

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

    const update = {
      name: req.body.name?.trim(),
      email: req.body.email?.trim()?.toLowerCase(),
      rollNo: req.body.rollNo?.trim(),
      primaryTrack: req.body.primaryTrack?.trim() || req.body.track?.trim() || "General Track",
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

    const student = await Student.findByIdAndUpdate(studentId, { $set: update }, { new: true, runValidators: true });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
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

export const deleteStudentAdmin = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!assertObjectId(studentId, "studentId", res)) return;

    const student = await Student.findByIdAndDelete(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }

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
