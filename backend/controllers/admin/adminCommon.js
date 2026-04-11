import mongoose from "mongoose";
import User from "../../models/User.js";
import Course from "../../models/Course.js";
import College from "../../models/College.js";
import Batch, { BATCH_STATUS } from "../../models/Batch.js";
import Student from "../../models/Student.js";
import Submission from "../../models/Submission.js";
import Payment from "../../models/Payment.js";
import Question from "../../models/Questions.js";
import QuestionCategory from "../../models/QuestionCategory.js";
import TrackTemplate from "../../models/TrackTemplate.js";
import Resource from "../../models/Resource.js";
import AdminNotification from "../../models/AdminNotification.js";
import IssuedCertificate from "../../models/IssuedCertificate.js";

export const QUESTION_CATEGORY_META = {
  "data-structures-algorithms": {
    title: "Data Structures & Algorithms",
    subtitle: "Core DSA concepts",
    icon: "code",
  },
  "web-development": {
    title: "Web Development",
    subtitle: "Full-stack web development",
    icon: "globe",
  },
  "python-programming": {
    title: "Python Programming",
    subtitle: "Python fundamentals to advanced",
    icon: "terminal",
  },
  "database-management": {
    title: "Database Management",
    subtitle: "SQL and NoSQL databases",
    icon: "database",
  },
  "machine-learning": {
    title: "Machine Learning",
    subtitle: "ML fundamentals and applications",
    icon: "brain",
  },
};

export const CATEGORY_SLUG_BY_TITLE = Object.fromEntries(
  Object.entries(QUESTION_CATEGORY_META).map(([slug, value]) => [value.title, slug])
);

const QUESTION_CATEGORY_FALLBACKS = {
  DSA: "data-structures-algorithms",
  SQL: "database-management",
  Core: "web-development",
};

export const REPORT_TYPES = [
  {
    key: "batch-leaderboard",
    title: "Batch Leaderboard",
    desc: "Rankings and scores for each batch",
    formats: ["CSV", "Excel"],
  },
  {
    key: "student-performance",
    title: "Student Performance",
    desc: "Individual student progress and scores",
    formats: ["CSV", "Excel"],
  },
  {
    key: "submission-records",
    title: "Submission Records",
    desc: "All submissions with status and timings",
    formats: ["CSV"],
  },
  {
    key: "college-performance",
    title: "College Performance",
    desc: "Aggregate performance by college",
    formats: ["CSV", "Excel"],
  },
  {
    key: "batch-summary",
    title: "Batch Summary",
    desc: "Batch details, tracks, and student counts",
    formats: ["CSV", "Excel"],
  },
  {
    key: "question-usage",
    title: "Question Usage",
    desc: "Question bank usage across tracks and batches",
    formats: ["CSV"],
  },
];

export const normalizeSubmissionStatus = (status) => {
  switch (status) {
    case "Passed":
      return "Accepted";
    case "Failed":
      return "Wrong Answer";
    case "Timeout":
      return "TLE";
    default:
      return "Error";
  }
};

export const getCategorySlug = (question) => {
  if (question.categorySlug) return question.categorySlug;
  if (question.categoryTitle && CATEGORY_SLUG_BY_TITLE[question.categoryTitle]) {
    return CATEGORY_SLUG_BY_TITLE[question.categoryTitle];
  }
  return QUESTION_CATEGORY_FALLBACKS[question.trackType] || "web-development";
};

export const getCategoryTitle = (question) => {
  const slug = getCategorySlug(question);
  return question.categoryTitle || QUESTION_CATEGORY_META[slug]?.title || question.trackType || "General";
};

export const getTrackTemplateIconKey = (category) => {
  if (category === "Database Management") return "database";
  if (category === "Data Structures & Algorithms") return "code";
  return "cpu";
};

export const slugifyCategory = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

export const listKnownQuestionCategories = async () => {
  const storedCategories = await QuestionCategory.find({ status: "Active" }).sort({ createdAt: 1 }).lean();
  return storedCategories.map((category) => ({
    id: category._id,
    slug: category.slug,
    title: category.title,
    subtitle: category.subtitle || "",
    icon: category.icon || "chart",
  }));
};

export const formatDateLabel = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const escapeCsv = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const buildCsv = (rows) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsv(row[header])).join(","));
  }
  return lines.join("\n");
};

export const parsePagination = (req) => {
  const page = Math.max(1, Number.parseInt(req.query.page || "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || "20", 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

export const assertObjectId = (value, fieldName, res) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    res.status(400).json({ success: false, message: `Invalid ${fieldName}` });
    return false;
  }
  return true;
};

export const getActorName = (user) =>
  [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email || "Admin User";

export const computeAdminMetrics = async () => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    clubMembers,
    totalCourses,
    totalColleges,
    totalBatches,
    totalStudents,
    totalSubmissions,
    activeBatches,
    activeStudents,
    paymentsApproved,
    resourcesUploaded,
    notificationsSent,
    totalQuestions,
    totalTrackTemplates,
    totalCertificates,
    submissionAgg,
    studentAgg,
    topStudentsAgg,
    topBatchesAgg,
    recentSubmissionsAgg,
    categoryCounts,
    storedQuestionCategories,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ updatedAt: { $gte: sevenDaysAgo } }),
    User.countDocuments({ isClub: true }),
    Course.countDocuments(),
    College.countDocuments(),
    Batch.countDocuments(),
    Student.countDocuments(),
    Submission.countDocuments(),
    Batch.countDocuments({ status: BATCH_STATUS.ACTIVE }),
    Student.countDocuments({ status: "Active" }),
    Payment.countDocuments({ status: "approved" }),
    Resource.countDocuments(),
    AdminNotification.countDocuments(),
    Question.countDocuments({ status: { $ne: "Archived" } }),
    TrackTemplate.countDocuments({ status: { $ne: "Archived" } }),
    IssuedCertificate.countDocuments({ status: "Active" }),
    Submission.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$totalScore" },
          avgExecutionTime: { $avg: "$executionTime" },
          todaySubmissions: {
            $sum: {
              $cond: [{ $gte: ["$submittedAt", todayStart] }, 1, 0],
            },
          },
        },
      },
    ]),
    Student.aggregate([
      {
        $group: {
          _id: null,
          avgStreak: { $avg: "$streak" },
          inactiveStudents: {
            $sum: {
              $cond: [{ $eq: ["$status", "Inactive"] }, 1, 0],
            },
          },
        },
      },
    ]),
    Submission.aggregate([
      { $sort: { submittedAt: -1 } },
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
          _id: "$studentId",
          name: { $first: "$student.name" },
          college: { $first: "$college.name" },
          score: { $avg: "$totalScore" },
        },
      },
      { $sort: { score: -1 } },
      { $limit: 5 },
    ]),
    Submission.aggregate([
      {
        $group: {
          _id: "$batchId",
          avg: { $avg: "$totalScore" },
        },
      },
      { $sort: { avg: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "batches",
          localField: "_id",
          foreignField: "_id",
          as: "batch",
        },
      },
      { $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "students",
          localField: "_id",
          foreignField: "batchId",
          as: "students",
        },
      },
      {
        $lookup: {
          from: "colleges",
          localField: "batch.collegeId",
          foreignField: "_id",
          as: "college",
        },
      },
      { $unwind: { path: "$college", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          id: "$batch.name",
          college: { $ifNull: ["$college.name", "Unknown College"] },
          students: { $size: "$students" },
          avg: { $round: ["$avg", 0] },
          status: "$batch.status",
        },
      },
    ]),
    Submission.aggregate([
      { $sort: { submittedAt: -1 } },
      { $limit: 6 },
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
          from: "batches",
          localField: "batchId",
          foreignField: "_id",
          as: "batch",
        },
      },
      { $unwind: { path: "$batch", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ["$student.name", "Unknown Student"] },
          batch: { $ifNull: ["$batch.name", "Unknown Batch"] },
          streak: { $ifNull: ["$student.streak", 0] },
          date: "$submittedAt",
        },
      },
    ]),
    Question.aggregate([
      {
        $group: {
          _id: {
            $ifNull: ["$categorySlug", "$trackType"],
          },
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ["$status", "Active"] }, 1, 0],
            },
          },
        },
      },
    ]),
    QuestionCategory.countDocuments({ status: "Active" }),
  ]);

  const metrics = submissionAgg[0] || {};
  const studentMetrics = studentAgg[0] || {};

  return {
    totalUsers,
    activeUsers,
    clubMembers,
    totalCourses,
    totalColleges,
    totalBatches,
    activeBatches,
    totalStudents,
    activeStudents,
    inactiveStudents: studentMetrics.inactiveStudents || 0,
    totalSubmissions,
    totalQuestions,
    totalTrackTemplates,
    totalQuestionCategories: storedQuestionCategories || 0,
    totalCertificates,
    paymentsApproved,
    resourcesUploaded,
    notificationsSent,
    todaySubmissions: metrics.todaySubmissions || 0,
    avgScore: Number((metrics.avgScore || 0).toFixed(1)),
    avgExecutionTime: Number((metrics.avgExecutionTime || 0).toFixed(0)),
    avgStreak: Number((studentMetrics.avgStreak || 0).toFixed(1)),
    atRiskStudents: await Student.countDocuments({
      status: "Active",
      $or: [{ lastActiveAt: { $lt: threeDaysAgo } }, { lastActiveAt: null }],
    }),
    topStudents: topStudentsAgg.map((student, index) => ({
      rank: index + 1,
      name: student.name || "Unknown Student",
      college: student.college || "Unknown College",
      track: "Track",
      score: `${Number(student.score || 0).toFixed(0)}%`,
    })),
    topBatches: topBatchesAgg.map((batch, index) => ({
      rank: index + 1,
      ...batch,
    })),
    recentActivity: recentSubmissionsAgg.map((entry) => ({
      name: entry.name,
      batch: entry.batch,
      streak: entry.streak || 0,
      date: formatDateLabel(entry.date),
    })),
    categoryCounts,
  };
};
