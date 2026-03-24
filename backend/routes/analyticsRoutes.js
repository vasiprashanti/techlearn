import express from "express";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import {
  getScoreTrend,
  getCompletionRate,
  getTrackComparison,
  getSubmissionVolume,
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

export default analyticsRouter;
