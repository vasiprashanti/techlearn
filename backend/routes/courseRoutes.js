import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  // submitQuiz,
} from "../controllers/courseController.js";
import { protect, optionalProtect } from "../middleware/authMiddleware.js";

const courseRouter = Router();

// Public routes
courseRouter.get("/", optionalProtect, getAllCourses);
courseRouter.get("/:courseId", optionalProtect, getCourseById);

// Protected routes
// courseRouter.post("/:courseId/quiz/submit", protect, submitQuiz);

export default courseRouter;
