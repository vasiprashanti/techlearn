import express from "express";
import {
    getLeaderboard,
    getDayWiseScore,
    getWeeklyMatrix,
    exportBatchReportCSV
} from "../controllers/analyticsController.js";

const router = express.Router();

// 1. Leaderboard: GET /api/analytics/leaderboard/:batchId?page=1&limit=20
router.get("/leaderboard/:batchId", getLeaderboard);

// 2. Day-wise Score: GET /api/analytics/score/:batchId/:studentId
router.get("/score/:batchId/:studentId", getDayWiseScore);

// 3. Weekly Matrix: GET /api/analytics/matrix/:batchId/:studentId?currentWorkingDay=X
router.get("/matrix/:batchId/:studentId", getWeeklyMatrix);

// 4. CSV Export: GET /api/analytics/export/:batchId
router.get("/export/:batchId", exportBatchReportCSV);

export default router;
