import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getActiveProject,
  getProjectOverview,
  getDayNotes,
  toggleTask,
  requireProjectProgram,
} from "../controllers/studentProjectController.js";

const router = express.Router();

router.use(protect, requireProjectProgram);
router.get("/active", getActiveProject);
router.get("/overview", getProjectOverview);
router.get("/day-notes/:dayNumber", getDayNotes);
router.post("/tasks/:taskId/toggle", toggleTask);

export default router;
