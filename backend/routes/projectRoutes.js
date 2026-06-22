import express from "express";
import { isAdmin, protect } from "../middleware/authMiddleware.js";
import upload from "../config/multerConfig.js";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  archiveProject,
  deleteProject,
  getProjectsSummary,
  createProjectDay,
  getProjectDays,
  updateProjectDay,
  deleteProjectDay,
  createProjectTask,
  getProjectTasksByDay,
  updateProjectTask,
  deleteProjectTask,
  searchStudents,
  assignStudents,
  getAssignedStudents,
  removeStudent,
  getProjectDayDetails,
  getProjectProgress,
  getProjectAnalytics,
  getProjectAssignmentHealth,
  duplicateProjectDay,
} from "../controllers/projectController.js";

const router = express.Router();

// Search Students Route (Must be declared before parameterized routes like /:id)
router.get("/students/search", protect, isAdmin, searchStudents);

// Project routes
router.post("/", protect, isAdmin, upload.single("overviewFile"), createProject);
router.get("/", protect, isAdmin, getProjects);
router.get("/summary", protect, isAdmin, getProjectsSummary);
router.get("/:id", protect, isAdmin, getProject);
router.put("/:id", protect, isAdmin, upload.single("overviewFile"), updateProject);
router.put("/:id/archive", protect, isAdmin, archiveProject);
router.delete("/:id", protect, isAdmin, deleteProject);

// Student assignment routes
router.post("/:projectId/assign", protect, isAdmin, assignStudents);
router.get("/:projectId/students", protect, isAdmin, getAssignedStudents);
router.put("/:projectId/students/:studentId/remove", protect, isAdmin, removeStudent);
router.get("/:projectId/progress", protect, isAdmin, getProjectProgress);
router.get("/:projectId/analytics", protect, isAdmin, getProjectAnalytics);
router.get("/:projectId/assignment-health", protect, isAdmin, getProjectAssignmentHealth);

// Project Days routes
router.post("/days", protect, isAdmin, createProjectDay);
router.get("/:projectId/days", protect, isAdmin, getProjectDays);
router.get("/days/:dayId/details", protect, isAdmin, getProjectDayDetails);
router.put("/days/:id", protect, isAdmin, updateProjectDay);
router.delete("/days/:id", protect, isAdmin, deleteProjectDay);
router.post("/days/:id/duplicate", protect, isAdmin, duplicateProjectDay);

// Project Tasks routes
router.post("/tasks", protect, isAdmin, createProjectTask);
router.get("/days/:dayId/tasks", protect, isAdmin, getProjectTasksByDay);
router.put("/tasks/:id", protect, isAdmin, updateProjectTask);
router.delete("/tasks/:id", protect, isAdmin, deleteProjectTask);

export default router;
