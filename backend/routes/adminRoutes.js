import express from "express";
import {
  getAdminMetrics,
  getCourseTopicsForDashboard,
  editTopicDetails,
} from "../controllers/adminController.js";
import { isAdmin, protect } from "../middleware/authMiddleware.js";
import upload from "../config/multerConfig.js";
import {
  addMultipleTopics,
  createCourseShell,
  deleteCourse,
} from "../controllers/courseController.js";
import {
  cleanupTempFiles,
  uploadExerciseFile,
  uploadFiles,
} from "../controllers/fileUploadController.js";

const adminRouter = express.Router();

// Admin metrics route (protected)
adminRouter.get("/metrics", protect, isAdmin, getAdminMetrics);

// Course topics for dashboard
adminRouter.get("/:courseId", protect, isAdmin, getCourseTopicsForDashboard);

// Edit topic details (with file upload)
adminRouter.put("/topic/:topicId", protect, upload.any(), editTopicDetails);

adminRouter.post("/course-initiate", protect, createCourseShell);

adminRouter.post("/:courseId/topics", protect, isAdmin, addMultipleTopics);

adminRouter.delete("/:courseId", protect, isAdmin, deleteCourse);

// Admin route to upload files
adminRouter.post("/files", protect, upload.any(), uploadFiles);

// Admin route to upload exercise file for a specific course
adminRouter.post(
  "/:courseId/exercise",
  protect,
  isAdmin,
  upload.single("exerciseFile"),
  uploadExerciseFile
);

//Admin route to delete all the files after upload
adminRouter.delete(
  "/notes/exercises/cleanup",
  protect,
  isAdmin,
  cleanupTempFiles
);

export default adminRouter;
