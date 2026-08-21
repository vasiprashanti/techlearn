import express from "express";
import {
  getProgramCatalog,
  getProgramRecommendations,
  enrollInFreeProgram,
  joinProgramWaitlist,
  getAssignedPrograms,
  getReadinessOptions,
  selectActiveProgram,
  getProgramDetailForStudent,
} from "../controllers/programController.js";
import {
  getAssignmentQuestion,
  getProgramAssignment,
  getProgramExperience,
  getFinalProgramReport,
  getRevisionMaterials,
  submitAssignmentAnswer,
  submitReadinessAnswer,
} from "../controllers/programLearningController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected student-facing endpoints
router.get("/catalog", getProgramCatalog);
router.get("/recommendations", protect, getProgramRecommendations);
router.get("/assigned", protect, getAssignedPrograms);
router.get("/readiness-options", protect, getReadinessOptions);
router.post("/select-active", protect, selectActiveProgram);
router.post("/:programId/free-enroll", protect, enrollInFreeProgram);
router.post("/:programId/waitlist", protect, joinProgramWaitlist);
router.get("/:programId/experience", protect, getProgramExperience);
router.get("/:programId/final-report", protect, getFinalProgramReport);
router.get("/:programId/readiness", protect, getProgramAssignment);
router.post("/:programId/readiness/answers", protect, submitReadinessAnswer);
router.get("/:programId/revision/materials", protect, getRevisionMaterials);
router.get("/:programId/assignments/current", protect, getProgramAssignment);
router.get("/:programId/assignments/:assignmentId", protect, getProgramAssignment);
router.get("/:programId/assignments/:assignmentId/questions/:questionId", protect, getAssignmentQuestion);
router.post("/:programId/assignments/:assignmentId/answers", protect, submitAssignmentAnswer);
router.get("/:programId", protect, getProgramDetailForStudent);

export default router;
