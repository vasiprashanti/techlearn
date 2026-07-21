import express from "express";
import multer from "multer";
import {
  getAdminMetrics,
  getCourseTopicsForDashboard,
  editTopicDetails,
  editCourseExercises,
  uploadTopicImage,
} from "../controllers/adminController.js";
import { isAdmin, protect } from "../middleware/authMiddleware.js";
import upload from "../config/multerConfig.js";
import {
  addMultipleTopics,
  createCourseShell,
  deleteCourse,
  updateCourseShell,
  deleteTopic,
} from "../controllers/courseController.js";
import {
  cleanupTempFiles,
  uploadExerciseFile,
  uploadFiles,
} from "../controllers/fileUploadController.js";

const adminRouter = express.Router();
const courseBannerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!String(file.mimetype || "").startsWith("image/")) {
      return cb(new Error("Banner must be an image file"));
    }
    cb(null, true);
  },
});

// Admin metrics route (protected)
adminRouter.get("/dashboard/stats", protect, isAdmin, getAdminMetrics);

// Course topics for dashboard
adminRouter.get("/:courseId", protect, isAdmin, getCourseTopicsForDashboard);

// Edit topic details (with file upload)
adminRouter.put("/topic/:topicId", protect, isAdmin, upload.any(), editTopicDetails);
adminRouter.delete("/topic/:topicId", protect, isAdmin, deleteTopic);

adminRouter.post("/course-initiate", protect, isAdmin, courseBannerUpload.single("bannerFile"), createCourseShell);
adminRouter.put("/:courseId", protect, isAdmin, courseBannerUpload.single("bannerFile"), updateCourseShell);

adminRouter.post("/:courseId/topics", protect, isAdmin, addMultipleTopics);

adminRouter.delete("/:courseId", protect, isAdmin, deleteCourse);

// Admin route to upload files
adminRouter.post("/files", protect, isAdmin, upload.any(), uploadFiles);

// Admin route to edit exercises for a course
adminRouter.put(
  "/:courseId/exercise",
  protect,
  isAdmin,
  upload.single("exerciseFile"),
  editCourseExercises,
);

//Admin route to upload Exercise file for a course for the first time
adminRouter.post(
  "/:courseId/exercise",
  protect,
  isAdmin,
  upload.single("exerciseFile"),
  uploadExerciseFile,
);

//Admin route to delete all the files after upload
adminRouter.delete(
  "/notes/exercises/cleanup",
  protect,
  isAdmin,
  cleanupTempFiles,
);

// Admin route to upload image inside markdown notes
adminRouter.post(
  "/upload-image",
  protect,
  isAdmin,
  upload.single("image"),
  uploadTopicImage,
);

export default adminRouter;
