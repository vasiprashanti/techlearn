import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPracticeStats,
  recordPracticeSubmission,
} from "../controllers/practiceController.js";

const router = express.Router();

router.get("/stats", protect, getPracticeStats);
router.post("/submit", protect, recordPracticeSubmission);

export default router;
