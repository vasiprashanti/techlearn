import express from "express";
import {
  getAssignedPrograms,
  selectActiveProgram,
  getProgramDetailForStudent,
} from "../controllers/programController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected student-facing endpoints
router.get("/assigned", protect, getAssignedPrograms);
router.post("/select-active", protect, selectActiveProgram);
router.get("/:programId", protect, getProgramDetailForStudent);

export default router;
