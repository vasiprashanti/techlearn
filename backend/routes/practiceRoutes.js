import express from "express";
import { protect, requirePlacementProgram } from "../middleware/authMiddleware.js";
import {
  getPracticeStats,
  listPracticeQuestions,
  recordPracticeSubmission,
} from "../controllers/practiceController.js";

const router = express.Router();

router.get("/questions", listPracticeQuestions);
router.get("/stats", protect, requirePlacementProgram, getPracticeStats);
router.post("/submissions", protect, requirePlacementProgram, recordPracticeSubmission);

export default router;
