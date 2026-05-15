import Submission from "../models/Submission.js";
import Student from "../models/Student.js";
import Batch from "../models/Batch.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";

// ===== ADMIN ANALYTICS ENDPOINTS =====

/**
 * @desc    Get all submissions for a batch
 * @route   GET /api/question-bank/admin/submissions/batch/:batchId
 * @access  Private/Admin
 */
export const getBatchSubmissions = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { categoryId, status, page = 1, limit = 20 } = req.query;

    // Validate batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    // Build filter
    const filter = {
      batchId: new mongoose.Types.ObjectId(batchId),
      submissionType: "coding",
    };

    if (categoryId) {
      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const submissions = await Submission.find(filter)
      .populate("studentId", "name email")
      .populate("questionId", "title")
      .populate("categoryId", "title")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Submission.countDocuments(filter);

    res.json({
      success: true,
      data: {
        submissions: submissions.map((sub) => ({
          submissionId: sub._id,
          studentId: sub.studentId._id,
          studentName: sub.studentId.name,
          studentEmail: sub.studentId.email,
          questionId: sub.questionId._id,
          questionTitle: sub.questionId.title,
          categoryId: sub.categoryId?._id,
          categoryTitle: sub.categoryId?.title,
          status: sub.status,
          totalScore: sub.totalScore,
          accuracyScore: sub.accuracyScore,
          submittedAt: sub.submittedAt,
          timeSpent: sub.timeSpent,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all submissions by a student
 * @route   GET /api/question-bank/admin/submissions/student/:studentId
 * @access  Private/Admin
 */
export const getStudentSubmissions = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { batchId, categoryId, status, page = 1, limit = 20 } = req.query;

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Build filter
    const filter = {
      studentId: new mongoose.Types.ObjectId(studentId),
      submissionType: "coding",
    };

    if (batchId) {
      filter.batchId = new mongoose.Types.ObjectId(batchId);
    }

    if (categoryId) {
      filter.categoryId = new mongoose.Types.ObjectId(categoryId);
    }

    if (status) {
      filter.status = status;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const submissions = await Submission.find(filter)
      .populate("questionId", "title")
      .populate("categoryId", "title")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Submission.countDocuments(filter);

    res.json({
      success: true,
      data: {
        studentId: student._id,
        studentName: student.name,
        submissions: submissions.map((sub) => ({
          submissionId: sub._id,
          questionId: sub.questionId._id,
          questionTitle: sub.questionId.title,
          categoryId: sub.categoryId?._id,
          categoryTitle: sub.categoryId?.title,
          status: sub.status,
          totalScore: sub.totalScore,
          accuracyScore: sub.accuracyScore,
          submittedAt: sub.submittedAt,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all submissions for a category
 * @route   GET /api/question-bank/admin/submissions/category/:categoryId
 * @access  Private/Admin
 */
export const getCategorySubmissions = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { batchId, page = 1, limit = 20 } = req.query;

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Build filter
    const filter = {
      categoryId: new mongoose.Types.ObjectId(categoryId),
      submissionType: "coding",
    };

    if (batchId) {
      filter.batchId = new mongoose.Types.ObjectId(batchId);
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const submissions = await Submission.find(filter)
      .populate("studentId", "name")
      .populate("questionId", "title")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Submission.countDocuments(filter);

    res.json({
      success: true,
      data: {
        categoryId: category._id,
        categoryTitle: category.title,
        categoryType: category.categoryType,
        submissions: submissions.map((sub) => ({
          submissionId: sub._id,
          studentId: sub.studentId._id,
          studentName: sub.studentId.name,
          questionId: sub.questionId._id,
          questionTitle: sub.questionId.title,
          status: sub.status,
          totalScore: sub.totalScore,
          submittedAt: sub.submittedAt,
        })),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get batch submission analytics
 * @route   GET /api/question-bank/admin/submissions/batch/:batchId/stats
 * @access  Private/Admin
 */
export const getBatchStats = async (req, res) => {
  try {
    const { batchId } = req.params;

    // Validate batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ success: false, message: "Batch not found" });
    }

    const filter = {
      batchId: new mongoose.Types.ObjectId(batchId),
      submissionType: "coding",
      submittedAt: { $ne: null },
    };

    // Total submissions
    const totalSubmissions = await Submission.countDocuments(filter);

    // Unique students
    const uniqueStudents = await Submission.distinct("studentId", filter);

    // Average score
    const avgScoreAgg = await Submission.aggregate([
      { $match: filter },
      { $group: { _id: null, avgScore: { $avg: "$totalScore" } } },
    ]);
    const averageScore = avgScoreAgg[0]?.avgScore || 0;

    // Status breakdown
    const statusBreakdown = await Submission.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Top performers
    const topPerformers = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$studentId",
          submissions: { $sum: 1 },
          avgScore: { $avg: "$totalScore" },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 5 },
      { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      {
        $project: {
          studentId: "$_id",
          studentName: "$student.name",
          submissions: 1,
          avgScore: { $round: ["$avgScore", 2] },
        },
      },
    ]);

    // Category-wise stats
    const categoryStats = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$categoryId",
          submissions: { $sum: 1 },
          avgScore: { $avg: "$totalScore" },
          passed: {
            $sum: { $cond: [{ $eq: ["$status", "Passed"] }, 1, 0] },
          },
        },
      },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: "$_id",
          categoryTitle: "$category.title",
          categoryType: "$category.categoryType",
          submissions: 1,
          avgScore: { $round: ["$avgScore", 2] },
          passPercentage: {
            $round: [{ $multiply: [{ $divide: ["$passed", "$submissions"] }, 100] }, 2],
          },
        },
      },
    ]);

    // Timing analytics
    const timingAgg = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgTimeSpent: { $avg: "$timeSpent" },
          avgRunsPerQuestion: { $avg: "$runCount" },
        },
      },
    ]);

    const timingAnalytics = {
      averageTimeSpent: timingAgg[0]?.avgTimeSpent || 0,
      averageRunsPerQuestion: timingAgg[0]?.avgRunsPerQuestion || 0,
      submissionsPerDay: Math.round(totalSubmissions / 30), // Rough estimate
    };

    res.json({
      success: true,
      data: {
        batchId: batch._id,
        batchName: batch.batchName,
        totalSubmissions,
        uniqueStudents: uniqueStudents.length,
        averageScore: Math.round(averageScore * 100) / 100,
        statusBreakdown: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topPerformers,
        categoryStats,
        timingAnalytics,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get student progress dashboard
 * @route   GET /api/question-bank/admin/submissions/student/:studentId/progress
 * @access  Private/Admin
 */
export const getStudentProgress = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const filter = {
      studentId: new mongoose.Types.ObjectId(studentId),
      submissionType: "coding",
      submittedAt: { $ne: null },
    };

    // Total attempts
    const totalAttempts = await Submission.countDocuments(filter);

    // Status breakdown
    const stats = await Submission.aggregate([
      { $match: filter },
      {
        $facet: {
          statuses: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          scores: [
            {
              $group: {
                _id: null,
                totalScore: { $sum: "$totalScore" },
                avgScore: { $avg: "$totalScore" },
              },
            },
          ],
        },
      },
    ]);

    const statusBreakdown = stats[0].statuses.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const scoreData = stats[0].scores[0] || { totalScore: 0, avgScore: 0 };

    // Category-wise progress
    const categoryProgress = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$categoryId",
          attempted: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Passed"] }, 1, 0] },
          },
          avgScore: { $avg: "$totalScore" },
        },
      },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: "$_id",
          categoryTitle: "$category.title",
          attempted: 1,
          completed: 1,
          avgScore: { $round: ["$avgScore", 2] },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        studentId: student._id,
        studentName: student.name,
        studentEmail: student.email,
        totalAttempts,
        passed: statusBreakdown.Passed || 0,
        failed: statusBreakdown.Failed || 0,
        partialPass: statusBreakdown.PartialPass || 0,
        totalScore: Math.round(scoreData.totalScore),
        averageScore: Math.round(scoreData.avgScore * 100) / 100,
        categoryProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get platform-wide submission analytics
 * @route   GET /api/question-bank/admin/submissions/stats/analytics
 * @access  Private/Admin
 */
export const getPlatformAnalytics = async (req, res) => {
  try {
    const { batchId, startDate, endDate } = req.query;

    // Build filter
    const filter = {
      submissionType: "coding",
      submittedAt: { $ne: null },
    };

    if (batchId) {
      filter.batchId = new mongoose.Types.ObjectId(batchId);
    }

    if (startDate || endDate) {
      filter.submittedAt = {};
      if (startDate) {
        filter.submittedAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.submittedAt.$lte = new Date(endDate);
      }
    }

    // Total submissions
    const totalSubmissions = await Submission.countDocuments(filter);

    // Unique students
    const uniqueStudents = await Submission.distinct("studentId", filter);

    // Status breakdown
    const statusBreakdown = await Submission.aggregate([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Category breakdown
    const categoryBreakdown = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$categoryId",
          count: { $sum: 1 },
          avgScore: { $avg: "$totalScore" },
        },
      },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          categoryId: "$_id",
          categoryTitle: "$category.title",
          count: 1,
          avgScore: { $round: ["$avgScore", 2] },
        },
      },
    ]);

    // Top students
    const topStudents = await Submission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$studentId",
          submissions: { $sum: 1 },
          avgScore: { $avg: "$totalScore" },
        },
      },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      { $lookup: { from: "students", localField: "_id", foreignField: "_id", as: "student" } },
      { $unwind: "$student" },
      {
        $project: {
          studentId: "$_id",
          studentName: "$student.name",
          submissions: 1,
          avgScore: { $round: ["$avgScore", 2] },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalSubmissions,
        uniqueStudents: uniqueStudents.length,
        submissionsByStatus: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        submissionsByCategory: categoryBreakdown,
        topStudents,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
