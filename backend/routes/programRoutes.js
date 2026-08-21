import express from "express";
import {
  getProgramCatalog,
  getProgramRecommendations,
  enrollInFreeProgram,
  joinProgramWaitlist,
  getAssignedPrograms,
  getPublicPrograms,
  getReadinessOptions,
  joinProgramWaitlist,
  selectActiveProgram,
  startFreeAssessment,
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
import { protect, protectOptional } from "../middleware/authMiddleware.js";
import { guestAssessmentRateLimiter } from "../middleware/guestRateLimitMiddleware.js";

const router = express.Router();

// Public / Guest-accessible endpoints
router.get("/public", getPublicPrograms);
router.get("/readiness-options", getReadinessOptions);
router.post("/:programId/waitlist", guestAssessmentRateLimiter, protectOptional, joinProgramWaitlist);

// Protected student-facing endpoints
router.get("/catalog", getProgramCatalog);
router.get("/recommendations", protect, getProgramRecommendations);
router.get("/assigned", protect, getAssignedPrograms);
router.post("/free-assessment/start", protect, startFreeAssessment);
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
