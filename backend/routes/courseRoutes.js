import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  // submitQuiz,
} from "../controllers/courseController.js";
import { protect } from "../middleware/authMiddleware.js";

const courseRouter = Router();

// Public routes
courseRouter.get("/", getAllCourses);
courseRouter.get("/:courseId", getCourseById);

// Protected routes
// courseRouter.post("/:courseId/quiz/submit", protect, submitQuiz);

export default courseRouter;
