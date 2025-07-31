import { Router } from "express";
import {
  createCourseShell,
  addMultipleTopics,
  deleteCourse,
  getAllCourses,
  getCourseById,
  getQuizByCourseId,
  submitQuiz,
} from "../controllers/courseController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const courseRouter = Router();

// Admin routes
courseRouter.post("/course-initiate", protect, createCourseShell);
courseRouter.post("/:courseId/topics", protect, isAdmin, addMultipleTopics);
courseRouter.delete("/:courseId", protect, isAdmin, deleteCourse);

// Public routes
courseRouter.get("/", getAllCourses);
courseRouter.get("/:courseId", getCourseById);
courseRouter.get("/:courseId/topics/:topicId/quiz", getQuizByCourseId);

// Protected routes
courseRouter.post("/:courseId/quiz/submit", protect, submitQuiz);

export default courseRouter;
