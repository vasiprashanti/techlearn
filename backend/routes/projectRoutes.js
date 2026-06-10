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
  deleteProjectTask
} from "../controllers/projectController.js";

const router = express.Router();

// Project routes
router.post("/", protect, isAdmin, upload.single("overviewFile"), createProject);
router.get("/", protect, isAdmin, getProjects);
router.get("/summary", protect, isAdmin, getProjectsSummary);
router.get("/:id", protect, isAdmin, getProject);
router.put("/:id", protect, isAdmin, upload.single("overviewFile"), updateProject);
router.put("/:id/archive", protect, isAdmin, archiveProject);
router.delete("/:id", protect, isAdmin, deleteProject);

// Project Days routes
router.post("/days", protect, isAdmin, createProjectDay);
router.get("/:projectId/days", protect, isAdmin, getProjectDays);
router.put("/days/:id", protect, isAdmin, updateProjectDay);
router.delete("/days/:id", protect, isAdmin, deleteProjectDay);

// Project Tasks routes
router.post("/tasks", protect, isAdmin, createProjectTask);
router.get("/days/:dayId/tasks", protect, isAdmin, getProjectTasksByDay);
router.put("/tasks/:id", protect, isAdmin, updateProjectTask);
router.delete("/tasks/:id", protect, isAdmin, deleteProjectTask);

export default router;
