import express from "express";
import { protect, requirePlacementProgram } from "../middleware/authMiddleware.js";
import {
  getPracticeStats,
  listPracticeQuestions,
  recordPracticeSubmission,
  listPracticeCategoriesForStudent,
} from "../controllers/practiceController.js";

const router = express.Router();

router.get("/categories", protect, listPracticeCategoriesForStudent);
router.get("/questions", protect, listPracticeQuestions);
router.get("/stats", protect, requirePlacementProgram, getPracticeStats);
router.post("/submissions", protect, requirePlacementProgram, recordPracticeSubmission);

export default router;
