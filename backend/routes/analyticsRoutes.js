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
    exportBatchReportCSV
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

export default analyticsRouter;
