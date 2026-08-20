import express from "express";
import {
  getUserAssessments,
  getAssessmentDetailReport,
  getOverallReportSummary,
} from "../controllers/reportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/assessments", getUserAssessments);
router.get("/assessments/:assignmentId", getAssessmentDetailReport);
router.get("/summary", getOverallReportSummary);

export default router;
