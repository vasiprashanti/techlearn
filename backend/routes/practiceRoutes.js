import express from "express";
import { protect, requireProgramLearning } from "../middleware/authMiddleware.js";
import {
  getPracticeStats,
  listPracticeQuestions,
  recordPracticeSubmission,
  listPracticeCategoriesForStudent,
} from "../controllers/practiceController.js";

const router = express.Router();

router.get("/categories", protect, listPracticeCategoriesForStudent);
router.get("/questions", protect, listPracticeQuestions);
router.get("/stats", protect, requireProgramLearning, getPracticeStats);
router.post("/submissions", protect, requireProgramLearning, recordPracticeSubmission);

export default router;
