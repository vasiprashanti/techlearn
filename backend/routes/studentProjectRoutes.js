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

router.use(protect);
router.get("/active", getActiveProject);
router.get("/overview", requireProjectProgram, getProjectOverview);
router.get("/day-notes/:dayNumber", requireProjectProgram, getDayNotes);
router.post("/tasks/:taskId/toggle", requireProjectProgram, toggleTask);

export default router;
