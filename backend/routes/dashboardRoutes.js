import express from "express";
import { getDashboardData } from "../controllers/dashboardController.js";
import { isAdmin, protect } from "../middleware/authMiddleware.js";
import {
  uploadFiles,
  uploadExerciseFile,
  cleanupTempFiles,
} from "../controllers/fileUploadController.js";
import upload from "../config/multerConfig.js";

const dashboardRouter = express.Router();

// Admin route to upload files
dashboardRouter.post("/files", protect, isAdmin, upload.any(), uploadFiles);

// Admin route to upload exercise file for a specific course
dashboardRouter.post(
  "/:courseId/exercise",
  protect,
  isAdmin,
  upload.single("exerciseFile"),
  uploadExerciseFile
);

//Admin route to delete all the files after upload
dashboardRouter.delete(
  "/notes/exercises/cleanup",
  protect,
  isAdmin,
  cleanupTempFiles
);

dashboardRouter.get("/", protect, getDashboardData);

export default dashboardRouter;
