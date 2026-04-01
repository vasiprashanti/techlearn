import AdminNotification from "../../models/AdminNotification.js";
import AuditLog from "../../models/AuditLog.js";
import Batch from "../../models/Batch.js";
import College from "../../models/College.js";
import Student from "../../models/Student.js";
import Submission from "../../models/Submission.js";
import Question from "../../models/Questions.js";
import { writeAuditLog } from "../../utils/auditLogger.js";
import {
  REPORT_TYPES,
  assertObjectId,
  buildCsv,
  formatDateLabel,
  getCategoryTitle,
  normalizeSubmissionStatus,
} from "./adminCommon.js";

export const listNotificationsAdmin = async (req, res) => {
  try {
    const notifications = await AdminNotification.find().sort({ createdAt: -1 }).lean();
    return res.status(200).json({
      success: true,
      data: notifications.map((notification) => ({
        id: notification._id,
        title: notification.title,
        body: notification.body,
        target:
          notification.targetType === "all"
            ? "All Students"
            : notification.targetValue || "Custom Audience",
        isGlobal: notification.isGlobal,
        date: notification.createdAt,
        status: notification.status,
      })),
    });
  } catch (error) {
    console.error("listNotificationsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch notifications." });
  }
};

export const createNotificationAdmin = async (req, res) => {
  try {
    const { title, body, target } = req.body;
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ success: false, message: "title and body are required." });
    }

    const notification = await AdminNotification.create({
      title: title.trim(),
      body: body.trim(),
      targetType:
        target === "All Students"
          ? "all"
          : target?.toLowerCase().includes("college")
            ? "college"
            : target?.toLowerCase().includes("batch")
              ? "batch"
              : "custom",
      targetValue: target || "All Students",
      isGlobal: target === "All Students",
      sentBy: req.user?._id || null,
      status: "Sent",
    });

    await writeAuditLog({
      verb: "Sent",
      entityType: "Notification",
      entityId: notification._id,
      action: "Sent notification",
      detail: notification.title,
      actor: req.user,
    });

    return res.status(201).json({ success: true, data: notification });
  } catch (error) {
    console.error("createNotificationAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to create notification.", error: error.message });
  }
};

export const deleteNotificationAdmin = async (req, res) => {
  try {
    const { notificationId } = req.params;
    if (!assertObjectId(notificationId, "notificationId", res)) return;

    const notification = await AdminNotification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    return res.status(200).json({ success: true, message: "Notification deleted successfully." });
  } catch (error) {
    console.error("deleteNotificationAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete notification." });
  }
};

export const listAuditLogsAdmin = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const query = search
      ? {
          $or: [
            { action: { $regex: search, $options: "i" } },
            { detail: { $regex: search, $options: "i" } },
            { entityType: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(100).lean();
    const totalActions = await AuditLog.countDocuments();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const today = await AuditLog.countDocuments({ timestamp: { $gte: todayStart } });
    const deletions = await AuditLog.countDocuments({ verb: "Deleted" });

    return res.status(200).json({
      success: true,
      data: {
        summary: { totalActions, today, deletions },
        logs: logs.map((log) => ({
          id: log._id,
          action: log.action,
          detail: log.detail,
          actor: log.actorName,
          type: log.entityType,
          ts: log.timestamp,
          verb: log.verb,
        })),
      },
    });
  } catch (error) {
    console.error("listAuditLogsAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch audit logs." });
  }
};

export const getReportsPage = async (req, res) => {
  try {
    const recentExports = await AuditLog.find({ entityType: "Report" })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        reportTypes: REPORT_TYPES,
        recentExports: recentExports.map((log) => ({
          id: log._id,
          title: log.detail || log.action,
          format: log.metadata?.format || "CSV",
          date: log.timestamp,
        })),
      },
    });
  } catch (error) {
    console.error("getReportsPage error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reports page data." });
  }
};

const getReportRows = async (type) => {
  switch (type) {
    case "batch-leaderboard": {
      const batches = await Batch.find().populate("collegeId", "name").lean();
      const batchIds = batches.map((batch) => batch._id);
      const [studentsAgg, scoreAgg] = await Promise.all([
        Student.aggregate([
          { $match: { batchId: { $in: batchIds } } },
          { $group: { _id: "$batchId", students: { $sum: 1 } } },
        ]),
        Submission.aggregate([
          { $match: { batchId: { $in: batchIds } } },
          { $group: { _id: "$batchId", score: { $avg: "$totalScore" } } },
        ]),
      ]);
      const studentMap = Object.fromEntries(studentsAgg.map((entry) => [String(entry._id), entry.students]));
      const scoreMap = Object.fromEntries(scoreAgg.map((entry) => [String(entry._id), entry.score]));
      return batches.map((batch) => ({
        batch: batch.name,
        college: batch.collegeId?.name || "",
        students: studentMap[String(batch._id)] || 0,
        averageScore: Number((scoreMap[String(batch._id)] || 0).toFixed(0)),
        status: batch.status,
      }));
    }
    case "student-performance": {
      const students = await Student.find().populate("collegeId", "name").populate("batchId", "name").lean();
      const studentIds = students.map((student) => student._id);
      const scores = await Submission.aggregate([
        { $match: { studentId: { $in: studentIds } } },
        { $group: { _id: "$studentId", score: { $avg: "$totalScore" }, submissions: { $sum: 1 } } },
      ]);
      const scoreMap = Object.fromEntries(scores.map((entry) => [String(entry._id), entry]));
      return students.map((student) => ({
        student: student.name,
        email: student.email,
        college: student.collegeId?.name || "",
        batch: student.batchId?.name || "",
        averageScore: Number((scoreMap[String(student._id)]?.score || 0).toFixed(0)),
        submissions: scoreMap[String(student._id)]?.submissions || 0,
        streak: student.streak || 0,
        status: student.status,
      }));
    }
    case "submission-records": {
      const submissions = await Submission.find()
        .populate("studentId", "name")
        .populate("batchId", "name")
        .populate("questionId", "title")
        .lean();
      return submissions.map((submission) => ({
        student: submission.studentId?.name || "",
        batch: submission.batchId?.name || "",
        question: submission.questionId?.title || "",
        status: normalizeSubmissionStatus(submission.status),
        executionTime: submission.executionTime || 0,
        score: submission.totalScore || 0,
        submittedAt: submission.submittedAt || submission.createdAt,
      }));
    }
    case "college-performance": {
      const colleges = await College.find().lean();
      const rows = [];
      for (const college of colleges) {
        const students = await Student.find({ collegeId: college._id }).lean();
        const studentIds = students.map((student) => student._id);
        const scores = await Submission.aggregate([
          { $match: { studentId: { $in: studentIds } } },
          { $group: { _id: null, avgScore: { $avg: "$totalScore" }, submissions: { $sum: 1 } } },
        ]);
        rows.push({
          college: college.name,
          city: college.city || "",
          totalStudents: students.length,
          activeStudents: students.filter((student) => student.status === "Active").length,
          averageScore: Number((scores[0]?.avgScore || 0).toFixed(0)),
          submissions: scores[0]?.submissions || 0,
        });
      }
      return rows;
    }
    case "batch-summary": {
      const batches = await Batch.find().populate("collegeId", "name").lean();
      return batches.map((batch) => ({
        batch: batch.name,
        college: batch.collegeId?.name || "",
        startDate: formatDateLabel(batch.startDate),
        expiryDate: formatDateLabel(batch.expiryDate),
        status: batch.status,
      }));
    }
    case "question-usage": {
      const questionUsage = await Submission.aggregate([
        { $group: { _id: "$questionId", usageCount: { $sum: 1 } } },
        {
          $lookup: {
            from: "questions",
            localField: "_id",
            foreignField: "_id",
            as: "question",
          },
        },
        { $unwind: { path: "$question", preserveNullAndEmptyArrays: true } },
      ]);
      return questionUsage.map((entry) => ({
        question: entry.question?.title || "",
        difficulty: entry.question?.difficulty || "",
        category: getCategoryTitle(entry.question || {}),
        usageCount: entry.usageCount,
      }));
    }
    default:
      return [];
  }
};

export const exportReport = async (req, res) => {
  try {
    const { type } = req.params;
    const format = String(req.query.format || "CSV").toUpperCase();
    const report = REPORT_TYPES.find((item) => item.key === type);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report type not found." });
    }

    const rows = await getReportRows(type);
    const csv = buildCsv(rows);

    await writeAuditLog({
      verb: "Exported",
      entityType: "Report",
      action: "Exported report",
      detail: report.title,
      actor: req.user,
      metadata: { format },
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    return res.status(200).send(csv);
  } catch (error) {
    console.error("exportReport error:", error);
    return res.status(500).json({ success: false, message: "Failed to export report." });
  }
};
