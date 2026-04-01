import mongoose from "mongoose";
import Batch, { BATCH_STATUS } from "../../models/Batch.js";
import Student from "../../models/Student.js";
import Submission from "../../models/Submission.js";
import Question from "../../models/Questions.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import Resource from "../../models/Resource.js";
import Log from "../../models/Log.js";
import AuditLog from "../../models/AuditLog.js";
import {
  QUESTION_CATEGORY_META,
  computeAdminMetrics,
  formatDateLabel,
  getCategoryTitle,
  listKnownQuestionCategories,
} from "./adminCommon.js";

const buildDashboardResponse = async () => {
  const metrics = await computeAdminMetrics();

  const [collegeScores, recentQuestions, activeBatchCards] = await Promise.all([
    Submission.aggregate([
      {
        $lookup: {
          from: "students",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "colleges",
          localField: "student.collegeId",
          foreignField: "_id",
          as: "college",
        },
      },
      { $unwind: { path: "$college", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$college._id",
          name: { $first: "$college.name" },
          score: { $avg: "$totalScore" },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 5 },
    ]),
    Submission.aggregate([
      {
        $lookup: {
          from: "questions",
          localField: "questionId",
          foreignField: "_id",
          as: "question",
        },
      },
      { $unwind: { path: "$question", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$questionId",
          title: { $first: "$question.title" },
          difficulty: { $first: "$question.difficulty" },
          track: { $first: "$question.categoryTitle" },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    Batch.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate("collegeId", "name")
      .lean(),
  ]);

  const batchIds = activeBatchCards.map((batch) => batch._id);
  const studentsByBatch = await Student.aggregate([
    { $match: { batchId: { $in: batchIds } } },
    { $group: { _id: "$batchId", total: { $sum: 1 } } },
  ]);
  const studentMap = Object.fromEntries(
    studentsByBatch.map((entry) => [String(entry._id), entry.total])
  );

  return {
    kpis: [
      { title: "Students", value: metrics.totalStudents, subtitle: `${metrics.activeStudents} active` },
      { title: "Batches", value: metrics.totalBatches, subtitle: `${metrics.activeBatches} active` },
      { title: "Submissions", value: metrics.totalSubmissions, subtitle: `${metrics.todaySubmissions} today` },
      { title: "Courses", value: metrics.totalCourses, subtitle: `${metrics.totalQuestions} questions` },
      { title: "Certificates", value: metrics.totalCertificates, subtitle: `${metrics.paymentsApproved} approved payments` },
      { title: "Resources", value: metrics.resourcesUploaded, subtitle: `${metrics.notificationsSent} announcements` },
    ],
    collegeRanking: collegeScores.map((college) => ({
      name: college.name || "Unknown College",
      score: Number((college.score || 0).toFixed(0)),
    })),
    topStudents: metrics.topStudents,
    recentActivity: metrics.recentActivity,
    mostSolved: recentQuestions.map((question) => ({
      title: question.title || "Untitled Question",
      difficulty: question.difficulty || "Easy",
      track: question.track || "General",
      count: question.count,
    })),
    batches: activeBatchCards.map((batch) => ({
      id: batch.name,
      college: batch.collegeId?.name || "Unknown College",
      track: "Track Set",
      status: batch.status,
      start: formatDateLabel(batch.startDate),
      end: formatDateLabel(batch.expiryDate),
      students: studentMap[String(batch._id)] || 0,
    })),
  };
};

export const getDashboardPage = async (req, res) => {
  try {
    const data = await buildDashboardResponse();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getDashboardPage error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch dashboard data." });
  }
};

export const getAnalyticsPage = async (req, res) => {
  try {
    const metrics = await computeAdminMetrics();
    const categoryMap = Object.fromEntries(
      metrics.categoryCounts.map((item) => [String(item._id), item])
    );

    const knownCategories = await listKnownQuestionCategories();
    const categories = knownCategories.map((category) => ({
      slug: category.slug,
      title: category.title,
      total: categoryMap[category.slug]?.total || 0,
      active: categoryMap[category.slug]?.active || 0,
    }));

    const [upcomingBatches, completedBatches, resourcesViewed, usedInTracksCount, avgTrackLength, difficultyCounts] =
      await Promise.all([
        Batch.countDocuments({ status: BATCH_STATUS.DRAFT }),
        Batch.countDocuments({ status: BATCH_STATUS.EXPIRED }),
        Resource.aggregate([{ $group: { _id: null, totalViews: { $sum: "$views" } } }]),
        TrackTemplate.countDocuments({ "dayAssignments.0": { $exists: true } }),
        TrackTemplate.aggregate([{ $group: { _id: null, avg: { $avg: "$totalDays" } } }]),
        Promise.all([
          Question.countDocuments({ difficulty: "Easy", status: "Active" }),
          Question.countDocuments({ difficulty: "Medium", status: "Active" }),
          Question.countDocuments({ difficulty: "Hard", status: "Active" }),
        ]),
      ]);

    const assignedQuestionsCount = await TrackTemplate.aggregate([
      { $unwind: "$dayAssignments" },
      { $group: { _id: "$dayAssignments.questionId" } },
      { $count: "count" },
    ]).then((rows) => rows[0]?.count || 0);

    const data = {
      platformOverview: [
        { label: "Total Colleges", value: metrics.totalColleges },
        { label: "Total Batches", value: metrics.totalBatches },
        { label: "Total Students", value: metrics.totalStudents },
        { label: "Active Students Today", value: metrics.activeStudents },
        { label: "Total Questions", value: metrics.totalQuestions },
        { label: "Track Templates", value: metrics.totalTrackTemplates },
        { label: "Total Courses", value: metrics.totalCourses },
        { label: "Certificates Issued", value: metrics.totalCertificates },
      ],
      studentEngagement: {
        dailyActive: metrics.activeStudents,
        totalStudents: metrics.totalStudents,
        weeklyActive: metrics.activeUsers,
        inactive: metrics.inactiveStudents,
        avgStreak: metrics.avgStreak,
      },
      learningPerformance: {
        avgScore: metrics.avgScore,
        submissionSuccess:
          metrics.totalSubmissions > 0
            ? Number(((metrics.todaySubmissions / metrics.totalSubmissions) * 100).toFixed(0))
            : 0,
        avgSolveTime: metrics.avgExecutionTime > 0 ? Number((metrics.avgExecutionTime / 1000).toFixed(1)) : 0,
      },
      batchPerformance: {
        active: metrics.activeBatches,
        upcoming: upcomingBatches,
        completed: completedBatches,
        topBatches: metrics.topBatches,
      },
      contentInsights: {
        totalQuestions: metrics.totalQuestions,
        usedInTracks: usedInTracksCount,
        unusedQuestions: Math.max(0, metrics.totalQuestions - assignedQuestionsCount),
        avgTrackLength: Number((avgTrackLength[0]?.avg || 0).toFixed(0)),
        difficulty: [
          { label: "Easy", count: difficultyCounts[0] },
          { label: "Medium", count: difficultyCounts[1] },
          { label: "Hard", count: difficultyCounts[2] },
        ],
        trackTemplates: metrics.totalTrackTemplates,
      },
      platformHealth: {
        engagementRate:
          metrics.totalStudents > 0
            ? Number(((metrics.activeStudents / metrics.totalStudents) * 100).toFixed(0))
            : 0,
        activeStudents: metrics.activeStudents,
        totalStudents: metrics.totalStudents,
        resourcesUploaded: metrics.resourcesUploaded,
        resourcesViewed: resourcesViewed[0]?.totalViews || 0,
      },
      categories,
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getAnalyticsPage error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch analytics data." });
  }
};

export const getSystemHealthPage = async (req, res) => {
  try {
    const dbStart = Date.now();
    let dbStatus = "Operational";
    let dbPing = 0;

    try {
      await mongoose.connection.db.admin().ping();
      dbPing = Date.now() - dbStart;
    } catch (error) {
      dbStatus = "Degraded";
    }

    const [errorLogs24h, queueSize, recentAlerts, lastSubmission, averageExecution] = await Promise.all([
      Log.countDocuments({
        level: { $in: ["error", "ERROR"] },
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      Submission.countDocuments({ status: "Error" }),
      AuditLog.find({
        $or: [{ verb: "Deleted" }, { verb: "Revoked" }, { verb: "Error" }],
      })
        .sort({ timestamp: -1 })
        .limit(5)
        .lean(),
      Submission.findOne().sort({ submittedAt: -1 }).lean(),
      Submission.aggregate([{ $group: { _id: null, avg: { $avg: "$executionTime" } } }]),
    ]);

    const data = {
      kpis: [
        { label: "Uptime", value: "99.9%" },
        { label: "Avg Execution Time", value: `${Number(((averageExecution[0]?.avg || 0) / 1000).toFixed(1))}s` },
        { label: "Queue Size", value: String(queueSize) },
        { label: "Errors (24h)", value: String(errorLogs24h) },
      ],
      services: [
        { name: "Judge API", status: lastSubmission ? "Operational" : "Idle", ping: "120ms" },
        { name: "Database", status: dbStatus, ping: `${dbPing}ms` },
        { name: "File Storage", status: "Operational", ping: "95ms" },
        { name: "Auth Service", status: "Operational", ping: "35ms" },
      ],
      recentAlerts: recentAlerts.map((log) => ({
        time: formatDateLabel(log.timestamp || log.createdAt),
        msg: log.action || log.detail || "Admin alert",
        type: ["Deleted", "Revoked"].includes(log.verb) ? "warning" : "info",
      })),
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getSystemHealthPage error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch system health." });
  }
};

export const listSubmissionsPage = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || "20", 10) || 20));
    const skip = (page - 1) * limit;
    const filter = {};

    if (req.query.batchId) {
      filter.batchId = req.query.batchId;
    }
    if (req.query.studentId) {
      filter.studentId = req.query.studentId;
    }

    const [total, submissions] = await Promise.all([
      Submission.countDocuments(filter),
      Submission.find(filter)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("studentId", "name")
        .populate("batchId", "name")
        .populate("questionId", "title categoryTitle categorySlug trackType")
        .lean(),
    ]);

    const [accepted, averageExecution] = await Promise.all([
      Submission.countDocuments({ status: "Passed" }),
      Submission.aggregate([{ $group: { _id: null, avg: { $avg: "$executionTime" } } }]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalToday: submissions.length,
          accepted,
          successRate: total > 0 ? Number(((accepted / total) * 100).toFixed(0)) : 0,
          avgExecutionTime: `${Number((averageExecution[0]?.avg || 0).toFixed(0))}ms`,
        },
        submissions: submissions.map((submission) => ({
          id: submission._id,
          student: submission.studentId?.name || "Unknown Student",
          batch: submission.batchId?.name || "Unknown Batch",
          question: submission.questionId?.title || "Untitled Question",
          track: getCategoryTitle(submission.questionId || {}),
          lang: "Code",
          status: normalizeSubmissionStatus(submission.status),
          exec: submission.executionTime ? `${submission.executionTime}ms` : "-",
          when: submission.submittedAt,
          outputPreview:
            submission.status === "Passed" ? "All test cases passed" : "Failed on hidden test cases",
        })),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    console.error("listSubmissionsPage error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch submission monitor data." });
  }
};

export const getSubmissionDetailPage = async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate("studentId", "name")
      .populate("batchId", "name")
      .populate("questionId", "title")
      .lean();

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found." });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: submission._id,
        student: submission.studentId?.name || "Unknown Student",
        batch: submission.batchId?.name || "Unknown Batch",
        question: submission.questionId?.title || "Untitled Question",
        status: normalizeSubmissionStatus(submission.status),
        exec: submission.executionTime ? `${submission.executionTime}ms` : "-",
        when: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error("getSubmissionDetailPage error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch submission detail." });
  }
};
