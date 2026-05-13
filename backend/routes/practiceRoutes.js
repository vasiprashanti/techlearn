import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPracticeStats,
  listPracticeQuestions,
  recordPracticeSubmission,
} from "../controllers/practiceController.js";

const router = express.Router();

router.get("/questions", listPracticeQuestions);
router.get("/stats", protect, getPracticeStats);
router.post("/submissions", protect, recordPracticeSubmission);

export default router;
