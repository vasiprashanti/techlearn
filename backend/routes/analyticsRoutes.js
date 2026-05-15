import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
    getScoreTrend,
    getCompletionRate,
    getTrackComparison,
    getSubmissionVolume,
    getLeaderboard,
    getDayWiseScore,
    getWeeklyMatrix,
    exportBatchReportCSV,
    getCodingQuestionStats,
    getCodingQuestionLeaderboard,
    getCodingBatchAnalytics,
    getCodingAccuracyAnalysis,
} from "../controllers/analyticsController.js";

const analyticsRouter = express.Router();

// All analytics routes are college-scoped and admin-only.
// Callers must supply ?collegeId=<ObjectId> as a query param.

// GET /api/admin/analytics/score-trend
analyticsRouter.get("/score-trend", protect, isAdmin, getScoreTrend);

// GET /api/admin/analytics/completion-rate
analyticsRouter.get("/completion-rate", protect, isAdmin, getCompletionRate);

// GET /api/admin/analytics/track-comparison
analyticsRouter.get("/track-comparison", protect, isAdmin, getTrackComparison);

// GET /api/admin/analytics/submission-volume
analyticsRouter.get("/submission-volume", protect, isAdmin, getSubmissionVolume);

// GET /api/admin/analytics/leaderboard/:batchId
analyticsRouter.get("/leaderboard/:batchId", protect, isAdmin, getLeaderboard);

// GET /api/admin/analytics/score/:batchId/:studentId
analyticsRouter.get("/score/:batchId/:studentId", protect, isAdmin, getDayWiseScore);

// GET /api/admin/analytics/matrix/:batchId/:studentId
analyticsRouter.get("/matrix/:batchId/:studentId", protect, isAdmin, getWeeklyMatrix);

// GET /api/admin/analytics/export/:batchId
analyticsRouter.get("/export/:batchId", protect, isAdmin, exportBatchReportCSV);

// Coding Question Analytics Routes
// GET /api/admin/analytics/coding-questions/stats?batchId=<id>&categoryId=<id>&questionId=<id>
analyticsRouter.get(
    "/coding-questions/stats",
    protect,
    isAdmin,
    getCodingQuestionStats
);

// GET /api/admin/analytics/coding-questions/leaderboard/:questionId?batchId=<id>
analyticsRouter.get(
    "/coding-questions/leaderboard/:questionId",
    protect,
    isAdmin,
    getCodingQuestionLeaderboard
);

// GET /api/admin/analytics/coding-batch?batchId=<id> or ?collegeId=<id>
analyticsRouter.get(
    "/coding-batch",
    protect,
    isAdmin,
    getCodingBatchAnalytics
);

// GET /api/admin/analytics/coding-accuracy?batchId=<id>&questionId=<id>
analyticsRouter.get(
    "/coding-accuracy",
    protect,
    isAdmin,
    getCodingAccuracyAnalysis
);

export default analyticsRouter;
