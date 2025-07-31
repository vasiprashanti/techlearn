import express from "express";
import mongoose from "mongoose";
import upload from "../config/multerConfig.js";
import { protect } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/authMiddleware.js";
import {
  submitExercise,
  submitExerciseCode,
  getCourseExercises,
} from "../controllers/exerciseController.js";
import { uploadExerciseFile } from "../controllers/fileUploadController.js";
//case sensitive import issue fixed

const router = express.Router();

router.post("/:courseId/:exerciseId/submit", protect, submitExercise);

router.post("/:courseId/:exerciseId/submit-code", protect, submitExerciseCode);

router.get("/:courseId", protect, getCourseExercises);

export default router;
