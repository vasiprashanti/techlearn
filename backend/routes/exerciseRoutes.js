import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  submitExercise,
  submitExerciseCode,
  getCourseExercises,
} from "../controllers/exerciseController.js";
import { uploadExerciseFile } from "../controllers/fileUploadController.js";

const router = express.Router();

// User routes
router.post("/:courseId/:exerciseId/submit", protect, submitExercise);
router.post("/:courseId/:exerciseId/submit-code", protect, submitExerciseCode);
router.get("/:courseId", protect, getCourseExercises);

export default router;
