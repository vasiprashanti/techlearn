import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  listLearnerReports,
  getLearnerReportByKey,
  getStoredAssessmentReports,
} from "../controllers/learnerReportController.js";

const router = express.Router();

router.get("/", protect, listLearnerReports);
router.get("/assessments", protect, getStoredAssessmentReports);
router.get("/:kind/:reportKey", protect, getLearnerReportByKey);

export default router;
